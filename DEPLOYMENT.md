# Deployment Guide - Smart Expense Tracker

This guide covers deploying the Smart Expense Tracker to production.

## Important: Architecture Considerations

The Smart Expense Tracker consists of:
- **Frontend**: React app (can be deployed to Vercel)
- **Backend**: FastAPI Python app (needs a Python server)
- **Database**: MongoDB (needs a database service)

### Deployment Options

#### Option 1: Split Deployment (Recommended)
- **Frontend**: Vercel
- **Backend**: Railway/Render/Heroku
- **Database**: MongoDB Atlas

#### Option 2: Full-Stack Deployment
- **All services**: Railway/Render/Heroku
- Easier to manage but less specialized

## Option 1: Deploy to Vercel (Frontend) + Railway (Backend)

### Step 1: Set Up MongoDB Atlas (Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Go to **Database Access** → Create a database user
4. Go to **Network Access** → Add IP (allow from anywhere: 0.0.0.0/0)
5. Click **Connect** → **Connect your application**
6. Copy the connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/expense_tracker?retryWrites=true&w=majority
   ```

### Step 2: Deploy Backend to Railway

1. **Create Railway Account**
   - Go to [Railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Select your repository

3. **Configure Backend Service**
   ```bash
   # Railway will auto-detect Python and run:
   # uvicorn server:app --host 0.0.0.0 --port $PORT
   ```

4. **Add Environment Variables**
   Go to your service → Variables → Add:
   ```
   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   DB_NAME=expense_tracker_db
   CORS_ORIGINS=https://your-frontend-domain.vercel.app
   OPENAI_API_KEY=sk-your-openai-key
   JWT_SECRET=your-random-secret-key
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```

5. **Set Root Directory** (if needed)
   - Go to Settings → Root Directory → `/backend`

6. **Get Backend URL**
   - Railway will provide a URL like: `https://your-app.up.railway.app`

### Step 3: Deploy Frontend to Vercel

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/yourusername/smart-expense-tracker.git
   git branch -M main
   git push -u origin main
   ```

2. **Create Vercel Account**
   - Go to [Vercel.com](https://vercel.com)
   - Sign up with GitHub

3. **Import Project**
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect React

4. **Configure Build Settings**
   - Framework Preset: **Create React App**
   - Root Directory: **frontend**
   - Build Command: `yarn build` or `npm run build`
   - Output Directory: `build`

5. **Add Environment Variables**
   ```
   REACT_APP_BACKEND_URL=https://your-backend.up.railway.app
   ```

6. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

7. **Get Frontend URL**
   - Vercel will provide a URL like: `https://your-app.vercel.app`

8. **Update Backend CORS**
   - Go back to Railway
   - Update `CORS_ORIGINS` environment variable with your Vercel URL

### Step 4: Install Tesseract on Railway

Create a file `Aptfile` in the backend directory:
```
tesseract-ocr
```

Railway will automatically install it during deployment.

### Step 5: Verify Deployment

1. Visit your Vercel frontend URL
2. Register a new account
3. Add expenses
4. Test all features
5. Check AI insights (ensure OpenAI key is set)

## Option 2: Deploy Everything to Railway

### Step 1: Prepare for Deployment

1. **Create Railway Account**
   - Sign up at [Railway.app](https://railway.app)

2. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/yourusername/smart-expense-tracker.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy Backend

1. Create new project on Railway
2. Add service → Deploy from GitHub
3. Select your repo
4. Set root directory to `/backend`
5. Add environment variables (see above)
6. Railway will auto-deploy

### Step 3: Deploy Frontend

1. In the same Railway project, add another service
2. Deploy from GitHub (same repo)
3. Set root directory to `/frontend`
4. Add environment variable:
   ```
   REACT_APP_BACKEND_URL=https://your-backend.up.railway.app
   ```
5. Railway will build and deploy React app

### Step 4: Add MongoDB

1. In Railway project, click "New"
2. Select "Database" → "MongoDB"
3. Railway will provision MongoDB and provide connection string
4. Copy the connection URL to backend environment variables

## Option 3: Deploy to Render

### Backend Deployment

1. **Create Render Account**
   - Go to [Render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - New → Web Service
   - Connect your GitHub repository
   - Configure:
     - Name: `expense-tracker-backend`
     - Root Directory: `backend`
     - Environment: `Python 3`
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

3. **Add Environment Variables**
   (Same as Railway setup above)

4. **Add Tesseract**
   Create `render.yaml` in root:
   ```yaml
   services:
     - type: web
       name: expense-tracker-backend
       env: python
       buildCommand: |
         apt-get update
         apt-get install -y tesseract-ocr
         pip install -r backend/requirements.txt
       startCommand: cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT
   ```

### Frontend Deployment to Render

1. **Create Static Site**
   - New → Static Site
   - Connect repository
   - Configure:
     - Root Directory: `frontend`
     - Build Command: `yarn install && yarn build`
     - Publish Directory: `build`

2. **Add Environment Variable**
   ```
   REACT_APP_BACKEND_URL=https://your-backend.onrender.com
   ```

## Vercel Serverless Functions (Advanced)

If you want to deploy everything on Vercel, you need to convert the backend to serverless functions. This is complex and not recommended for this architecture.

## Custom Domain Setup

### For Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### For Railway:
1. Go to your service → Settings → Domains
2. Add custom domain
3. Add CNAME record to your DNS

## Environment Variables Summary

### Backend (.env)
```env
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=expense_tracker_db
CORS_ORIGINS=https://your-frontend.vercel.app,https://your-frontend.com
OPENAI_API_KEY=sk-proj-your-actual-key
JWT_SECRET=your-super-secret-random-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://your-backend.up.railway.app
```

## Post-Deployment Checklist

- [ ] MongoDB Atlas cluster is running
- [ ] Backend is deployed and accessible
- [ ] Frontend is deployed and accessible
- [ ] Environment variables are set correctly
- [ ] CORS is configured properly
- [ ] OpenAI API key is valid and has credits
- [ ] Tesseract OCR is installed on backend
- [ ] Test user registration
- [ ] Test expense creation
- [ ] Test AI insights generation
- [ ] Test receipt OCR upload
- [ ] Test dark/light theme toggle
- [ ] Check browser console for errors
- [ ] Verify API calls in Network tab

## Troubleshooting

### CORS Errors
- Ensure backend `CORS_ORIGINS` includes your frontend URL
- Don't use wildcards (*) in production

### MongoDB Connection Failed
- Check connection string format
- Verify username and password are URL-encoded
- Ensure IP whitelist includes 0.0.0.0/0

### Frontend Can't Connect to Backend
- Verify `REACT_APP_BACKEND_URL` is correct
- Check if backend is running (visit the URL)
- Ensure backend API routes start with `/api`

### OpenAI API Errors
- Verify API key is correct
- Check you have credits in your OpenAI account
- Look at backend logs for specific error messages

### Build Failures
- Check build logs for missing dependencies
- Ensure all files are committed to git
- Verify package.json and requirements.txt are complete

## Monitoring

### Railway
- View logs: Service → Logs
- Monitor metrics: Service → Metrics
- Set up alerts: Service → Settings → Notifications

### Vercel
- View logs: Project → Logs
- Analytics: Project → Analytics
- Performance insights available

## Cost Estimates (Free Tiers)

- **MongoDB Atlas**: Free tier (512MB storage)
- **Railway**: $5 credit/month (enough for small apps)
- **Vercel**: Free (100GB bandwidth, unlimited sites)
- **Render**: Free tier available
- **OpenAI API**: Pay as you go (~$0.001 per request for GPT-4o-mini)

## Recommended Setup for Resume/Portfolio

**Best option**: Vercel (Frontend) + Railway (Backend) + MongoDB Atlas (Database)

**Why?**
- Free or very cheap
- Professional hosting
- Easy CI/CD
- Good performance
- Easy to maintain

## Production Optimizations

1. **Add Error Tracking**: Sentry
2. **Add Analytics**: Google Analytics or Plausible
3. **Enable HTTPS**: Both Vercel and Railway provide it by default
4. **Add Rate Limiting**: In backend for API protection
5. **Set up Monitoring**: UptimeRobot or Freshping
6. **Configure Backups**: MongoDB Atlas automated backups

---

Need help? Open an issue on GitHub!
