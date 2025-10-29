# Smart Expense Tracker

A full-stack personal finance web application that tracks expenses and provides AI-powered financial insights using OpenAI GPT-4o-mini.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg)
![React](https://img.shields.io/badge/react-19.2.0-blue.svg)

## 🎯 Features

- **Expense Management**: Add, edit, delete, and categorize expenses
- **AI-Powered Insights**: Get personalized financial insights using OpenAI GPT-4o-mini
- **Receipt OCR**: Upload receipt images and automatically extract expense data using Tesseract
- **Visual Analytics**: Interactive charts showing spending patterns (Chart.js)
  - Category breakdown (Doughnut chart)
  - Monthly trend analysis (Line chart)
- **User Authentication**: Secure JWT-based authentication
- **Dark/Light Mode**: Toggle between themes with persistent storage
- **Profile Management**: Update profile and change password
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database with Motor async driver
- **JWT** - Secure authentication
- **OpenAI GPT-4o-mini** - AI insights generation
- **Tesseract OCR** - Receipt text extraction
- **Pillow** - Image processing

### Frontend
- **React 19** - UI framework
- **Redux Toolkit** - State management
- **Chart.js** - Data visualization
- **Inter Font** - Modern typography
- **CSS Variables** - Theme system

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB 5.0+
- Tesseract OCR
- OpenAI API Key

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/smart-expense-tracker.git
cd smart-expense-tracker
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Install Tesseract OCR
# Ubuntu: sudo apt-get install tesseract-ocr
# macOS: brew install tesseract
# Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki

# Configure environment
cp .env.example .env
# Edit .env and add your OpenAI API key
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
# or
yarn install
```

### 4. Start MongoDB

```bash
# Ubuntu: sudo systemctl start mongodb
# macOS: brew services start mongodb-community
```

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Open http://localhost:3000 in your browser.

## ⚙️ Configuration

### Backend (.env)

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=expense_tracker_db
CORS_ORIGINS=*
OPENAI_API_KEY=your-openai-api-key-here
JWT_SECRET=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Frontend (.env)

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 📚 API Documentation

Once the backend is running, visit http://localhost:8001/docs for interactive API documentation.

### Key Endpoints

**Authentication:**
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update` - Update profile

**Expenses:**
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/{id}` - Update expense
- `DELETE /api/expenses/{id}` - Delete expense

**Analytics:**
- `GET /api/analytics/summary` - Spending summary
- `GET /api/analytics/insights` - AI insights

**Other:**
- `GET /api/categories` - Get categories
- `POST /api/receipts/upload` - Process receipt

## 🎨 Features in Detail

### AI-Powered Insights

Uses OpenAI GPT-4o-mini to analyze spending patterns and provide:
- Spending trend analysis
- Category-wise recommendations
- Budget optimization suggestions
- Unusual spending pattern detection

### Receipt OCR

Upload receipt images to:
1. Extract text using Tesseract OCR
2. Parse amount, merchant name, and date
3. Suggest appropriate category
4. Auto-fill expense form

### Dark/Light Mode

Theme preference stored in localStorage, applies to:
- All dashboard pages
- Charts and visualizations
- Forms and modals
- Authentication pages

## 🗂️ Project Structure

```
smart-expense-tracker/
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── .env                   # Environment variables
│   └── requirements.txt       # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── App.css           # Global styles
│   │   ├── context/          # Theme context
│   │   ├── store/            # Redux store
│   │   ├── pages/            # Page components
│   │   └── components/       # Reusable components
│   ├── public/
│   └── package.json
│
└── README.md
```

## 🔒 Security

- Passwords hashed using bcrypt
- JWT token authentication
- Protected API endpoints
- CORS configuration
- Environment variable management
- Input validation and sanitization

## 📦 Deployment

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001
```

### Frontend

```bash
cd frontend
npm run build
# Serve the build folder with nginx or similar
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

Your Name
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Name](https://linkedin.com/in/yourprofile)
- Portfolio: [yourwebsite.com](https://yourwebsite.com)

## 🙏 Acknowledgments

- OpenAI for GPT-4o-mini API
- Tesseract OCR community
- FastAPI framework
- React and Redux teams
- Chart.js library

## 🐛 Known Issues

None at the moment. Please report issues in the [Issues](https://github.com/yourusername/smart-expense-tracker/issues) section.

## 🔮 Future Enhancements

- [ ] Export data to CSV/PDF
- [ ] Budget setting and alerts
- [ ] Multi-currency support
- [ ] Recurring expense tracking
- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] Advanced filters and search

## 📧 Support

For support, open an issue in the repository.

---

⭐ If you found this project helpful, please give it a star!
