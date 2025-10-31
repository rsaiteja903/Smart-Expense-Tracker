# Smart Expense Tracker - Standalone Version

This is a fully independent, production-ready expense tracking application with AI-powered insights.

## ✅ What's Included

### Core Technologies
- **Backend**: FastAPI (Python)
- **Frontend**: React 19 + Redux Toolkit
- **Database**: MongoDB
- **AI**: OpenAI GPT-4o-mini (official SDK)
- **OCR**: Tesseract (open-source)
- **Charts**: Chart.js
- **Authentication**: JWT with bcrypt

### Features
1. **User Authentication**
   - Secure registration and login
   - JWT token-based authentication
   - Password hashing with bcrypt

2. **Expense Management**
   - Add, edit, delete expenses
   - Categorize expenses (8 default categories)
   - Advanced filtering (search, category, date range, amount)
   - Sort by any column
   - Export to CSV

3. **AI Chat Interface**
   - Ask questions about your expenses
   - Get personalized insights
   - Context-aware AI responses
   - Suggested questions to get started

4. **Receipt OCR**
   - Upload receipt images
   - Automatic text extraction
   - Parse amount and merchant
   - Suggest categories

5. **Analytics Dashboard**
   - Visual charts (doughnut and line)
   - Category breakdown
   - Monthly trends
   - Summary statistics

6. **Dark/Light Mode**
   - Toggle between themes
   - Persistent in localStorage
   - Smooth transitions

7. **Profile Management**
   - Update name
   - Change password
   - Secure profile settings

## 📦 Dependencies

### Backend (Python)
- fastapi - Web framework
- motor - MongoDB async driver
- python-jose[cryptography] - JWT handling
- passlib[bcrypt] - Password hashing
- openai - Official OpenAI SDK
- pytesseract - OCR
- pillow - Image processing

### Frontend (JavaScript)
- react - UI framework
- redux toolkit - State management
- axios - HTTP client
- chart.js - Data visualization
- sonner - Toast notifications

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB
- Tesseract OCR
- OpenAI API Key

### Installation

```bash
# 1. Clone repository
git clone https://github.com/yourusername/smart-expense-tracker.git
cd smart-expense-tracker

# 2. Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Install Tesseract
# Ubuntu: sudo apt-get install tesseract-ocr
# macOS: brew install tesseract
# Windows: Download from GitHub

# Configure environment
cp .env.example .env
# Edit .env and add your OpenAI API key

# 3. Frontend setup
cd ../frontend
npm install  # or yarn install

# 4. Start MongoDB
# Ubuntu: sudo systemctl start mongodb
# macOS: brew services start mongodb-community

# 5. Run application
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Terminal 2 - Frontend
cd frontend
npm start
```

Visit http://localhost:3000

## ⚙️ Configuration

### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=expense_tracker_db
CORS_ORIGINS=*
OPENAI_API_KEY=sk-your-openai-key-here
JWT_SECRET=your-random-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 🌐 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions for:
- Railway (Backend)
- Vercel/Netlify (Frontend)
- MongoDB Atlas (Database)

## 📝 API Documentation

Once running, visit http://localhost:8001/docs for interactive API documentation.

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected API endpoints
- CORS configuration
- Environment variable management
- Input validation

## 🎨 UI Features

- Modern, clean design
- Responsive (mobile-friendly)
- Dark/light theme
- Smooth animations
- Toast notifications
- Loading states

## 📊 Technologies Used

| Technology | Purpose |
|------------|---------|
| FastAPI | REST API framework |
| React | Frontend UI |
| MongoDB | Database |
| OpenAI | AI insights |
| Tesseract | OCR processing |
| Chart.js | Data visualization |
| Redux | State management |
| JWT | Authentication |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 👤 Author

Your Name
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)

## 🙏 Acknowledgments

- OpenAI for GPT-4o-mini
- Tesseract OCR community
- FastAPI framework
- React team

## 📧 Support

For issues or questions:
- Open an issue on GitHub
- Email: your.email@example.com

---

⭐ Star this repo if you find it helpful!
