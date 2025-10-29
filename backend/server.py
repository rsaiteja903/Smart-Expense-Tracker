from fastapi import FastAPI, APIRouter, HTTPException, Depends, File, UploadFile, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from PIL import Image
import pytesseract
import io
import re
from openai import AsyncOpenAI

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

JWT_SECRET = os.environ.get('JWT_SECRET')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES', 1440))

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    icon: str
    color: str

class ExpenseCreate(BaseModel):
    amount: float
    category: str
    description: str
    date: str
    receipt_url: Optional[str] = None

class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: float
    category: str
    description: str
    date: str
    receipt_url: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        name=user_data.name,
        email=user_data.email
    )
    
    user_dict = user.model_dump()
    user_dict['password'] = hash_password(user_data.password)
    
    await db.users.insert_one(user_dict)
    
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user.id, "name": user.name, "email": user.email}
    }

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(login_data.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user['id']})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user['id'], "name": user['name'], "email": user['email']}
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {"id": current_user['id'], "name": current_user['name'], "email": current_user['email']}

class UserUpdate(BaseModel):
    name: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

@api_router.put("/auth/update")
async def update_user(user_data: UserUpdate, current_user: dict = Depends(get_current_user)):
    update_fields = {}
    
    if user_data.name:
        update_fields['name'] = user_data.name
    
    if user_data.new_password:
        if not user_data.current_password:
            raise HTTPException(status_code=400, detail="Current password required to change password")
        
        if not verify_password(user_data.current_password, current_user['password']):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        if len(user_data.new_password) < 6:
            raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
        
        update_fields['password'] = hash_password(user_data.new_password)
    
    if update_fields:
        await db.users.update_one({"id": current_user['id']}, {"$set": update_fields})
    
    updated_user = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
    return {"id": updated_user['id'], "name": updated_user['name'], "email": updated_user['email']}

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    if not categories:
        default_categories = [
            {"id": str(uuid.uuid4()), "name": "Food", "icon": "restaurant", "color": "#FF6B6B"},
            {"id": str(uuid.uuid4()), "name": "Transport", "icon": "directions_car", "color": "#4ECDC4"},
            {"id": str(uuid.uuid4()), "name": "Shopping", "icon": "shopping_bag", "color": "#95E1D3"},
            {"id": str(uuid.uuid4()), "name": "Entertainment", "icon": "movie", "color": "#F38181"},
            {"id": str(uuid.uuid4()), "name": "Bills", "icon": "receipt", "color": "#AA96DA"},
            {"id": str(uuid.uuid4()), "name": "Healthcare", "icon": "local_hospital", "color": "#FCBAD3"},
            {"id": str(uuid.uuid4()), "name": "Education", "icon": "school", "color": "#A8D8EA"},
            {"id": str(uuid.uuid4()), "name": "Other", "icon": "more_horiz", "color": "#FFD93D"}
        ]
        await db.categories.insert_many(default_categories)
        categories = default_categories
    return categories

@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense_data: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    expense = Expense(
        user_id=current_user['id'],
        amount=expense_data.amount,
        category=expense_data.category,
        description=expense_data.description,
        date=expense_data.date,
        receipt_url=expense_data.receipt_url
    )
    
    expense_dict = expense.model_dump()
    await db.expenses.insert_one(expense_dict)
    
    return expense

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses(current_user: dict = Depends(get_current_user)):
    expenses = await db.expenses.find({"user_id": current_user['id']}, {"_id": 0}).sort("date", -1).to_list(1000)
    return expenses

@api_router.get("/expenses/{expense_id}", response_model=Expense)
async def get_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    expense = await db.expenses.find_one({"id": expense_id, "user_id": current_user['id']}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

@api_router.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(expense_id: str, expense_data: ExpenseUpdate, current_user: dict = Depends(get_current_user)):
    expense = await db.expenses.find_one({"id": expense_id, "user_id": current_user['id']}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    update_data = {k: v for k, v in expense_data.model_dump().items() if v is not None}
    
    if update_data:
        await db.expenses.update_one({"id": expense_id}, {"$set": update_data})
        expense.update(update_data)
    
    return expense

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.expenses.delete_one({"id": expense_id, "user_id": current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"}

@api_router.get("/analytics/summary")
async def get_analytics_summary(current_user: dict = Depends(get_current_user)):
    expenses = await db.expenses.find({"user_id": current_user['id']}, {"_id": 0}).to_list(1000)
    
    if not expenses:
        return {
            "total_expenses": 0,
            "expense_count": 0,
            "category_breakdown": {},
            "monthly_trend": []
        }
    
    total = sum(exp['amount'] for exp in expenses)
    
    category_breakdown = {}
    for exp in expenses:
        cat = exp['category']
        if cat in category_breakdown:
            category_breakdown[cat] += exp['amount']
        else:
            category_breakdown[cat] = exp['amount']
    
    monthly_trend = {}
    for exp in expenses:
        month_key = exp['date'][:7]
        if month_key in monthly_trend:
            monthly_trend[month_key] += exp['amount']
        else:
            monthly_trend[month_key] = exp['amount']
    
    monthly_trend_list = sorted([{"month": k, "amount": v} for k, v in monthly_trend.items()], key=lambda x: x['month'])
    
    return {
        "total_expenses": total,
        "expense_count": len(expenses),
        "category_breakdown": category_breakdown,
        "monthly_trend": monthly_trend_list
    }

@api_router.get("/analytics/insights")
async def get_ai_insights(current_user: dict = Depends(get_current_user)):
    expenses = await db.expenses.find({"user_id": current_user['id']}, {"_id": 0}).to_list(1000)
    
    if not expenses:
        return {"insights": ["Start tracking your expenses to get personalized insights."]}
    
    summary = {
        "total_expenses": sum(exp['amount'] for exp in expenses),
        "expense_count": len(expenses),
        "categories": {}
    }
    
    for exp in expenses:
        cat = exp['category']
        if cat in summary['categories']:
            summary['categories'][cat] += exp['amount']
        else:
            summary['categories'][cat] = exp['amount']
    
    try:
        openai_api_key = os.environ.get('OPENAI_API_KEY')
        if not openai_api_key:
            return {"insights": ["Please configure OpenAI API key to generate insights."]}
        
        client = AsyncOpenAI(api_key=openai_api_key)
        
        prompt = f"""Analyze this expense data and provide 3-4 actionable financial insights.

Total spent: ${summary['total_expenses']:.2f}
Number of transactions: {summary['expense_count']}
Category breakdown: {summary['categories']}

Provide ONLY 3-4 insights as plain bullet points, one per line. Start each with a dash (-). 
Be specific, helpful, and focus on spending patterns or recommendations.
Example format:
- Your food expenses account for 40% of total spending
- Consider reducing transportation costs by using public transit
- Great job keeping entertainment expenses under control"""
        
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a financial advisor analyzing expense data. Provide 3-4 concise, actionable insights."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )
        
        insights_text = response.choices[0].message.content.strip()
        
        insights = []
        for line in insights_text.split('\n'):
            line = line.strip()
            if not line:
                continue
            line = line.lstrip('- •*').strip()
            if line and len(line) > 10 and not line.startswith('[') and not line.startswith('{'):
                insights.append(line)
        
        if not insights:
            insights = ["Your spending data has been analyzed. Continue tracking to see more patterns."]
        
        return {"insights": insights[:4]}
    except Exception as e:
        logging.error(f"Error generating insights: {e}")
        return {"insights": ["Unable to generate insights at this time. Please check your API key configuration."]}

@api_router.post("/receipts/upload")
async def upload_receipt(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        text = pytesseract.image_to_string(image)
        
        amount = None
        amount_patterns = [
            r'\$?\s*(\d+\.\d{2})',
            r'total[:\s]*(\d+\.\d{2})',
            r'amount[:\s]*(\d+\.\d{2})'
        ]
        
        for pattern in amount_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount = float(match.group(1))
                break
        
        merchant = None
        lines = text.split('\n')
        for line in lines[:5]:
            if len(line.strip()) > 3 and not any(char.isdigit() for char in line):
                merchant = line.strip()
                break
        
        category = "Other"
        text_lower = text.lower()
        if any(word in text_lower for word in ['restaurant', 'cafe', 'food', 'starbucks', 'mcdonald']):
            category = "Food"
        elif any(word in text_lower for word in ['uber', 'taxi', 'gas', 'fuel', 'parking']):
            category = "Transport"
        elif any(word in text_lower for word in ['store', 'mall', 'shop', 'amazon']):
            category = "Shopping"
        
        return {
            "amount": amount,
            "merchant": merchant,
            "category": category,
            "raw_text": text
        }
    except Exception as e:
        logging.error(f"Error processing receipt: {e}")
        raise HTTPException(status_code=500, detail="Error processing receipt")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()