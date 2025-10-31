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
        return {
            "insights": ["Start tracking your expenses to get personalized insights."],
            "spending_trends": [],
            "category_analysis": {},
            "budget_health": {"status": "unknown", "message": "No data available"},
            "predictions": {}
        }
    
    # Calculate comprehensive analytics
    from datetime import datetime, timedelta
    from collections import defaultdict
    
    total_expenses = sum(exp['amount'] for exp in expenses)
    expense_count = len(expenses)
    
    # Category analysis
    category_totals = defaultdict(float)
    for exp in expenses:
        category_totals[exp['category']] += exp['amount']
    
    # Monthly trends
    monthly_data = defaultdict(lambda: {"total": 0, "count": 0, "categories": defaultdict(float)})
    for exp in expenses:
        month_key = exp['date'][:7]
        monthly_data[month_key]["total"] += exp['amount']
        monthly_data[month_key]["count"] += 1
        monthly_data[month_key]["categories"][exp['category']] += exp['amount']
    
    # Sort months
    sorted_months = sorted(monthly_data.keys())
    
    # Calculate trends
    spending_trends = []
    for i, month in enumerate(sorted_months):
        data = monthly_data[month]
        trend_info = {
            "month": month,
            "total": data["total"],
            "count": data["count"],
            "average": data["total"] / data["count"] if data["count"] > 0 else 0
        }
        
        # Compare with previous month
        if i > 0:
            prev_month = sorted_months[i-1]
            prev_total = monthly_data[prev_month]["total"]
            if prev_total > 0:
                change = ((data["total"] - prev_total) / prev_total) * 100
                trend_info["change_percent"] = round(change, 1)
                trend_info["trend"] = "up" if change > 0 else "down" if change < 0 else "stable"
        
        spending_trends.append(trend_info)
    
    # Budget health assessment
    if len(sorted_months) >= 2:
        recent_month = monthly_data[sorted_months[-1]]["total"]
        avg_monthly = sum(m["total"] for m in monthly_data.values()) / len(monthly_data)
        
        if recent_month > avg_monthly * 1.2:
            budget_health = {
                "status": "warning",
                "message": f"Spending is {round((recent_month/avg_monthly - 1) * 100, 1)}% above average",
                "recommendation": "Consider reviewing your expenses"
            }
        elif recent_month < avg_monthly * 0.8:
            budget_health = {
                "status": "good",
                "message": f"Spending is {round((1 - recent_month/avg_monthly) * 100, 1)}% below average",
                "recommendation": "Great job managing expenses"
            }
        else:
            budget_health = {
                "status": "normal",
                "message": "Spending is consistent with your average",
                "recommendation": "Maintain current spending habits"
            }
    else:
        budget_health = {"status": "insufficient_data", "message": "Need more data for analysis"}
    
    # Predictions
    if len(sorted_months) >= 3:
        recent_3_months = [monthly_data[m]["total"] for m in sorted_months[-3:]]
        predicted_next_month = sum(recent_3_months) / len(recent_3_months)
        predictions = {
            "next_month_estimate": round(predicted_next_month, 2),
            "annual_projection": round(predicted_next_month * 12, 2)
        }
    else:
        predictions = {}
    
    # Prepare data for AI
    summary = {
        "total_expenses": total_expenses,
        "expense_count": expense_count,
        "categories": dict(category_totals),
        "monthly_trend": spending_trends[-3:] if len(spending_trends) >= 3 else spending_trends,
        "top_category": max(category_totals.items(), key=lambda x: x[1])[0] if category_totals else "None",
        "average_transaction": total_expenses / expense_count if expense_count > 0 else 0
    }
    
    try:
        openai_api_key = os.environ.get('OPENAI_API_KEY')
        if not openai_api_key:
            insights = [
                "Configure OpenAI API key to get AI-powered insights",
                f"You've spent ${total_expenses:.2f} across {expense_count} transactions",
                f"Your top spending category is {summary['top_category']}"
            ]
        else:
            client = AsyncOpenAI(api_key=openai_api_key)
            
            prompt = f"""Analyze this comprehensive expense data and provide 5-6 detailed, actionable insights:

Total spent: ${summary['total_expenses']:.2f}
Number of transactions: {summary['expense_count']}
Average per transaction: ${summary['average_transaction']:.2f}
Top spending category: {summary['top_category']}
Category breakdown: {summary['categories']}
Recent monthly trends: {summary['monthly_trend']}

Provide insights covering:
1. Overall spending patterns
2. Category-specific observations
3. Month-over-month trends
4. Actionable recommendations
5. Potential savings opportunities
6. Behavioral patterns

Format: One insight per line, starting with a dash (-)"""
            
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert financial advisor providing detailed, actionable insights based on spending data. Be specific and reference actual numbers."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            insights_text = response.choices[0].message.content.strip()
            
            insights = []
            for line in insights_text.split('\n'):
                line = line.strip()
                if not line:
                    continue
                line = line.lstrip('- •*0123456789.').strip()
                if line and len(line) > 10:
                    insights.append(line)
            
            if not insights:
                insights = ["Continue tracking expenses for personalized insights"]
    
    except Exception as e:
        logging.error(f"Error generating insights: {e}")
        insights = [
            f"Total spending: ${total_expenses:.2f} across {expense_count} transactions",
            f"Top category: {summary['top_category']} with ${category_totals[summary['top_category']]:.2f}",
            "Unable to generate AI insights. Please check your API key configuration."
        ]
    
    return {
        "insights": insights[:6],
        "spending_trends": spending_trends,
        "category_analysis": {
            "breakdown": dict(category_totals),
            "top_category": summary['top_category'],
            "category_count": len(category_totals)
        },
        "budget_health": budget_health,
        "predictions": predictions,
        "summary": {
            "total": total_expenses,
            "count": expense_count,
            "average": summary['average_transaction']
        }
    }

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