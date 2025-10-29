# Quick Start: Deploy to Vercel (Frontend Only)

If you only want to deploy the frontend to Vercel for demo purposes, follow these steps:

## Prerequisites

- GitHub account
- Vercel account (sign up at vercel.com)
- Running backend somewhere (local, Railway, Render, etc.)

## Steps

### 1. Push to GitHub

```bash
# If not already done
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smart-expense-tracker.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New" → "Project"**
3. **Import** your GitHub repository
4. **Configure Project:**
   - Framework Preset: **Create React App**
   - Root Directory: **frontend**
   - Build Command: `yarn build` or `npm run build`
   - Output Directory: **build**
   - Install Command: `yarn install` or `npm install`

5. **Add Environment Variable:**
   - Key: `REACT_APP_BACKEND_URL`
   - Value: `https://your-backend-url.com` (your Railway/Render backend URL)

6. Click **"Deploy"**

### 3. Wait for Build

Vercel will:
- Install dependencies
- Build your React app
- Deploy it to a URL like `https://your-app.vercel.app`

### 4. Test Your App

1. Visit your Vercel URL
2. Try logging in (make sure backend is running!)
3. Test features

## Deploy Backend to Railway (Recommended)

Since Vercel is best for frontend, deploy your backend to Railway:

### 1. Railway Setup

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **"New Project"**
4. Choose **"Deploy from GitHub repo"**
5. Select your repository

### 2. Configure Backend

1. **Set Root Directory:**
   - Settings → Root Directory → `backend`

2. **Add Environment Variables:**
   ```
   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
   DB_NAME=expense_tracker_db
   CORS_ORIGINS=https://your-app.vercel.app
   OPENAI_API_KEY=sk-your-openai-key
   JWT_SECRET=your-random-secret
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```

3. Railway auto-detects Python and deploys

### 3. Get Backend URL

Railway gives you a URL like: `https://your-app.up.railway.app`

### 4. Update Vercel

1. Go to your Vercel project
2. Settings → Environment Variables
3. Edit `REACT_APP_BACKEND_URL` to your Railway URL
4. Redeploy from Deployments tab

## MongoDB Setup (Free)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account and cluster (512MB free)
3. **Database Access** → Create user
4. **Network Access** → Allow from anywhere (0.0.0.0/0)
5. Click **Connect** → Get connection string
6. Add to Railway environment variables

## Troubleshooting

### Build Fails on Vercel

**Error**: `Module not found`
- Check that all dependencies are in `package.json`
- Try: `cd frontend && yarn install` locally first

**Error**: `REACT_APP_BACKEND_URL is undefined`
- Add environment variable in Vercel settings
- Redeploy

### Can't Connect to Backend

**CORS Error:**
- Add your Vercel URL to backend `CORS_ORIGINS`
- Format: `https://your-app.vercel.app` (no trailing slash)

**Backend Not Running:**
- Check Railway logs
- Ensure environment variables are set
- Visit backend URL directly to test

### MongoDB Connection Failed

- Check connection string format
- Ensure password is URL-encoded
- Verify IP whitelist includes 0.0.0.0/0

## Custom Domain (Optional)

### On Vercel:
1. Project Settings → Domains
2. Add your domain
3. Add CNAME record in your DNS:
   ```
   Type: CNAME
   Name: www (or @)
   Value: cname.vercel-dns.com
   ```

## Cost

- **Vercel**: FREE (hobby plan)
- **Railway**: $5 credit/month FREE
- **MongoDB Atlas**: FREE (512MB)
- **OpenAI**: Pay per use (~$0.001 per request)

Total: Essentially FREE for small projects!

## Quick Commands

```bash
# Deploy to Vercel CLI (alternative)
npm i -g vercel
cd frontend
vercel

# Check backend logs on Railway
# Go to railway.app → Your project → Logs

# Update frontend
git add .
git commit -m "Update frontend"
git push
# Vercel auto-deploys!
```

## Production Checklist

- [ ] Backend deployed and running
- [ ] MongoDB Atlas cluster active
- [ ] Environment variables set
- [ ] CORS configured correctly
- [ ] OpenAI API key valid
- [ ] Frontend builds successfully
- [ ] Test user registration
- [ ] Test expense management
- [ ] Test AI insights
- [ ] Check browser console for errors

---

**That's it!** Your app is now live on Vercel + Railway.

Need help? Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.
