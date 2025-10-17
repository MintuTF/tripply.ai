# 🚀 Tripply - Production Deployment Guide

Complete guide for deploying Tripply to production.

## 📋 Prerequisites

- Node.js 20+ installed
- OpenAI API key (Required)
- Google Places API key (Required for image cards)
- Vercel/Railway/other hosting account (Optional)

---

## 🔧 Environment Setup

### 1. Create Production Environment File

Copy `.env.production.example` to `.env.production`:

```bash
cp .env.production.example .env.production
```

### 2. Configure Required Variables

Edit `.env.production` and add:

```bash
# REQUIRED
OPENAI_API_KEY=sk-proj-your-production-key
GOOGLE_PLACES_API_KEY=AIzaSy-your-production-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### 3. Optional Enhancements

```bash
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

---

## 🏗️ Build & Test Locally

### 1. Install Dependencies

```bash
npm install
```

### 2. Build for Production

```bash
npm run build
```

This will:
- Compile TypeScript
- Optimize images
- Bundle JavaScript
- Generate static pages
- Create production build in `.next/`

### 3. Test Production Build

```bash
npm run start
```

Visit `http://localhost:3000` and test:
- ✅ Chat functionality
- ✅ Image cards appear (test: "Find restaurants in Paris")
- ✅ Add to Trip works
- ✅ Modal opens when clicking cards
- ✅ No console errors

---

## ☁️ Deployment Options

### Option 1: Vercel (Recommended - Easiest)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Add Environment Variables in Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Select your project → Settings → Environment Variables
   - Add all variables from `.env.production`

5. **Deploy**
   ```bash
   git push
   ```
   (Vercel auto-deploys on git push)

**✅ Done!** Your app is live at `https://your-project.vercel.app`

---

### Option 2: Railway

1. **Create Railway Account**: https://railway.app

2. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

3. **Login**
   ```bash
   railway login
   ```

4. **Initialize Project**
   ```bash
   railway init
   ```

5. **Add Environment Variables**
   ```bash
   railway variables set OPENAI_API_KEY=sk-proj-...
   railway variables set GOOGLE_PLACES_API_KEY=AIzaSy...
   railway variables set NEXT_PUBLIC_APP_URL=https://your-app.railway.app
   ```

6. **Deploy**
   ```bash
   railway up
   ```

---

### Option 3: Docker (Self-Hosted)

1. **Create Dockerfile** (already included)

2. **Build Docker Image**
   ```bash
   docker build -t tripply-ai .
   ```

3. **Run Container**
   ```bash
   docker run -p 3000:3000 \
     -e OPENAI_API_KEY=sk-proj-... \
     -e GOOGLE_PLACES_API_KEY=AIzaSy... \
     -e NEXT_PUBLIC_APP_URL=https://your-domain.com \
     tripply-ai
   ```

---

### Option 4: VPS (DigitalOcean, AWS, etc.)

1. **SSH into server**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Node.js 20+**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/tripply-ai.git
   cd tripply-ai
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Create .env.production**
   ```bash
   nano .env.production
   # Add your production variables
   ```

6. **Build**
   ```bash
   npm run build
   ```

7. **Run with PM2** (Process Manager)
   ```bash
   npm install -g pm2
   pm2 start npm --name "tripply" -- start
   pm2 save
   pm2 startup
   ```

8. **Setup Nginx Reverse Proxy**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

9. **Enable SSL with Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## 🔒 Security Checklist

Before going live, verify:

- [ ] All API keys are in environment variables (NOT hardcoded)
- [ ] `.env.local` is in `.gitignore` (never commit secrets)
- [ ] HTTPS is enabled (SSL certificate)
- [ ] Rate limiting is configured (default: 60 requests/min)
- [ ] CORS is properly configured
- [ ] Security headers are set (check next.config.ts)
- [ ] Error messages don't leak sensitive data
- [ ] Database (if using Supabase) has Row Level Security (RLS) enabled

---

## 📊 Monitoring & Analytics

### Add Google Analytics (Optional)

1. Create GA4 property: https://analytics.google.com
2. Get Measurement ID (`G-XXXXXXXXXX`)
3. Add to `.env.production`:
   ```bash
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

### Add Error Tracking with Sentry (Optional)

1. Create Sentry project: https://sentry.io
2. Get DSN
3. Add to `.env.production`:
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
   ```

---

## 🐛 Troubleshooting

### Issue: Cards not showing images

**Solution**: Check Google Places API key is set and Places API is enabled in Google Cloud Console

### Issue: "Rate limit exceeded"

**Solution**: Increase `RATE_LIMIT_RPM` in environment variables or implement Redis-based rate limiting

### Issue: Slow API responses

**Solution**:
- Enable caching for API routes
- Implement request queuing
- Consider adding CDN (Vercel/Cloudflare)

### Issue: Build fails

**Solution**:
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

---

## 📈 Performance Optimization

1. **Enable Caching**
   - API responses: Add `Cache-Control` headers
   - Static assets: Automatically cached by Next.js

2. **Optimize Images**
   - All images automatically optimized with WebP/AVIF
   - Lazy loading enabled by default

3. **Add CDN**
   - Vercel: Automatic global CDN
   - Others: Add Cloudflare

4. **Database Optimization** (if using Supabase)
   - Add indexes to frequently queried fields
   - Enable connection pooling

---

## 🔄 Continuous Deployment

### GitHub Actions (CI/CD)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - run: npm run test # Add tests
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📞 Support

- Documentation: https://docs.tripply.app
- Issues: https://github.com/your-username/tripply-ai/issues
- Email: support@tripply.app

---

**✅ Deployment Complete!**

Your travel app is now live! 🎉
