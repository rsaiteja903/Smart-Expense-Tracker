#!/bin/bash

# Quick Deployment Script for Smart Expense Tracker
# This script helps you deploy to Vercel + Railway

echo "🚀 Smart Expense Tracker Deployment Helper"
echo "=========================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Git repository not found. Initializing..."
    git init
    git config user.name "Your Name"
    git config user.email "your.email@example.com"
    echo "✅ Git initialized"
fi

echo ""
echo "📋 Pre-Deployment Checklist:"
echo ""
echo "1. MongoDB Atlas Setup"
echo "   - Have you created a MongoDB Atlas account? (y/n)"
read mongodb_ready

if [ "$mongodb_ready" != "y" ]; then
    echo "   → Create account at: https://www.mongodb.com/cloud/atlas"
    echo "   → Create a free cluster"
    echo "   → Get your connection string"
    exit 1
fi

echo ""
echo "2. OpenAI API Key"
echo "   - Do you have an OpenAI API key? (y/n)"
read openai_ready

if [ "$openai_ready" != "y" ]; then
    echo "   → Get API key at: https://platform.openai.com/api-keys"
    exit 1
fi

echo ""
echo "3. GitHub Repository"
echo "   - Is your code pushed to GitHub? (y/n)"
read github_ready

if [ "$github_ready" != "y" ]; then
    echo "   → Create a new repository on GitHub"
    echo "   → Run these commands:"
    echo "     git remote add origin https://github.com/yourusername/smart-expense-tracker.git"
    echo "     git branch -M main"
    echo "     git add ."
    echo "     git commit -m 'Initial commit'"
    echo "     git push -u origin main"
    exit 1
fi

echo ""
echo "✅ All prerequisites ready!"
echo ""
echo "📝 Deployment Steps:"
echo ""
echo "STEP 1: Deploy Backend to Railway"
echo "--------------------------------"
echo "1. Go to https://railway.app"
echo "2. Sign in with GitHub"
echo "3. Click 'New Project' → 'Deploy from GitHub repo'"
echo "4. Select your repository"
echo "5. Set Root Directory: backend"
echo "6. Add these environment variables:"
echo ""
echo "   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority"
echo "   DB_NAME=expense_tracker_db"
echo "   CORS_ORIGINS=*"
echo "   OPENAI_API_KEY=sk-your-key-here"
echo "   JWT_SECRET=$(openssl rand -base64 32)"
echo "   JWT_ALGORITHM=HS256"
echo "   ACCESS_TOKEN_EXPIRE_MINUTES=1440"
echo ""
echo "7. Railway will deploy and give you a URL like:"
echo "   https://your-app.up.railway.app"
echo ""
read -p "Press enter after deploying backend..."

echo ""
echo "What is your Railway backend URL?"
read backend_url

echo ""
echo "STEP 2: Deploy Frontend to Vercel"
echo "--------------------------------"
echo "1. Go to https://vercel.com"
echo "2. Sign in with GitHub"
echo "3. Click 'Add New' → 'Project'"
echo "4. Import your GitHub repository"
echo "5. Configure:"
echo "   - Framework: Create React App"
echo "   - Root Directory: frontend"
echo "   - Build Command: yarn build"
echo "   - Output Directory: build"
echo ""
echo "6. Add environment variable:"
echo "   REACT_APP_BACKEND_URL=$backend_url"
echo ""
echo "7. Click 'Deploy'"
echo ""
read -p "Press enter after deploying frontend..."

echo ""
echo "What is your Vercel frontend URL?"
read frontend_url

echo ""
echo "STEP 3: Update Backend CORS"
echo "--------------------------------"
echo "1. Go back to Railway"
echo "2. Open your backend service"
echo "3. Go to Variables"
echo "4. Update CORS_ORIGINS to: $frontend_url"
echo "5. Service will auto-redeploy"
echo ""
read -p "Press enter after updating CORS..."

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "🎉 Your app is now live at:"
echo "   Frontend: $frontend_url"
echo "   Backend:  $backend_url"
echo ""
echo "📋 Next Steps:"
echo "1. Visit $frontend_url"
echo "2. Register a new account"
echo "3. Test all features"
echo "4. Add expenses and generate insights"
echo ""
echo "📊 Monitor your apps:"
echo "   Railway: https://railway.app/dashboard"
echo "   Vercel:  https://vercel.com/dashboard"
echo ""
echo "Need help? Check DEPLOYMENT.md for detailed instructions"
