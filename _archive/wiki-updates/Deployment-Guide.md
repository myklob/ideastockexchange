# Deployment Guide

This guide covers deploying the Idea Stock Exchange to production environments.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Monitoring & Logging](#monitoring--logging)
- [Security Checklist](#security-checklist)
- [Scaling Strategies](#scaling-strategies)

---

## Prerequisites

Before deploying to production, ensure you have:

- ✅ **Production domain** (e.g., ideastockexchange.com)
- ✅ **SSL certificates** (Let's Encrypt or purchased)
- ✅ **PostgreSQL database** (managed service recommended)
- ✅ **Server/hosting** (VPS, Docker, or serverless)
- ✅ **CI/CD pipeline** (GitHub Actions, GitLab CI, etc.)
- ✅ **Monitoring tools** (Sentry, New Relic, etc.)

---

## Environment Configuration

### Production Environment Variables

Create a `.env.production` file:

```env
# Database
DATABASE_URL="postgresql://user:password@production-db.example.com:5432/ideastockexchange?schema=public"

# Next.js
NEXT_PUBLIC_APP_URL="https://ideastockexchange.com"
NODE_ENV=production

# Authentication
JWT_SECRET="<generate-strong-secret-here>"
JWT_EXPIRATION="7d"

# Server
PORT=3001
API_URL="https://api.ideastockexchange.com"

# Email (for notifications)
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASSWORD="<sendgrid-api-key>"
FROM_EMAIL="noreply@ideastockexchange.com"

# Redis (for caching)
REDIS_URL="redis://production-redis.example.com:6379"

# Logging
LOG_LEVEL="info"
SENTRY_DSN="https://xxx@sentry.io/xxx"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS="https://ideastockexchange.com,https://www.ideastockexchange.com"
```

### Generating Secrets

```bash
# Generate strong JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Database Setup

### Option 1: Managed PostgreSQL

**Recommended providers:**
- **Supabase** - Free tier, auto-backups, GUI
- **Neon** - Serverless PostgreSQL, generous free tier
- **AWS RDS** - Enterprise-grade, highly scalable
- **Google Cloud SQL** - Managed, integrated with GCP
- **Railway** - Simple deployment, good for small projects
- **DigitalOcean Managed Databases** - Affordable, reliable

**Example: Supabase Setup**

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection string from Settings → Database
4. Set `DATABASE_URL` in your environment

### Option 2: Self-Hosted PostgreSQL

```bash
# Install PostgreSQL 14+
sudo apt update
sudo apt install postgresql-14

# Create database
sudo -u postgres psql
CREATE DATABASE ideastockexchange;
CREATE USER iseuser WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE ideastockexchange TO iseuser;
\q

# Configure remote access (if needed)
sudo nano /etc/postgresql/14/main/postgresql.conf
# Set: listen_addresses = '*'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add: host all all 0.0.0.0/0 md5

sudo systemctl restart postgresql
```

### Run Migrations

```bash
# Apply all migrations
npm run prisma:migrate deploy

# Generate Prisma client
npm run prisma:generate
```

### Database Backups

**Automated backups (recommended):**

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump -h localhost -U iseuser ideastockexchange | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

**Add to crontab:**
```bash
0 2 * * * /path/to/backup-script.sh
```

---

## Backend Deployment

### Option 1: Docker (Recommended)

**Dockerfile:**

```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/server/index.js"]
```

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:16
    environment:
      - POSTGRES_DB=ideastockexchange
      - POSTGRES_USER=iseuser
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

**Deploy:**

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

### Option 2: VPS (DigitalOcean, Linode, etc.)

**1. Setup server:**

```bash
# SSH into server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2
```

**2. Deploy code:**

```bash
# Clone repository
git clone https://github.com/your-org/ideastockexchange.git
cd ideastockexchange

# Install dependencies
npm ci --only=production

# Build
npm run build

# Start with PM2
pm2 start dist/server/index.js --name "ise-backend"

# Setup auto-restart on reboot
pm2 startup
pm2 save
```

**3. Configure NGINX reverse proxy:**

```nginx
# /etc/nginx/sites-available/ise-backend
server {
    listen 80;
    server_name api.ideastockexchange.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable site:**

```bash
ln -s /etc/nginx/sites-available/ise-backend /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

**4. Setup SSL with Let's Encrypt:**

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d api.ideastockexchange.com
```

### Option 3: Cloud Platform (AWS, GCP, Azure)

**AWS Elastic Beanstalk:**

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init

# Create environment
eb create production-env

# Deploy
eb deploy
```

**Google Cloud Run:**

```bash
# Build container
gcloud builds submit --tag gcr.io/PROJECT_ID/ise-backend

# Deploy
gcloud run deploy ise-backend \
  --image gcr.io/PROJECT_ID/ise-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended for Next.js)

**Vercel is optimized for Next.js with zero configuration:**

1. **Connect repository:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel auto-detects Next.js

2. **Configure environment variables:**
   - Add `NEXT_PUBLIC_API_URL`
   - Add any other `NEXT_PUBLIC_*` variables

3. **Deploy:**
   - Push to main branch → auto-deploys
   - Preview deployments for PRs

**Advantages:**
- Global CDN
- Automatic HTTPS
- Instant deployments
- Serverless functions
- Edge network

### Option 2: Netlify

Similar to Vercel, great for static sites:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod
```

### Option 3: Self-Hosted with NGINX

**1. Build frontend:**

```bash
npm run build
npm run export  # Generates static files
```

**2. Copy to server:**

```bash
scp -r out/* user@server:/var/www/ideastockexchange
```

**3. Configure NGINX:**

```nginx
# /etc/nginx/sites-available/ise-frontend
server {
    listen 80;
    server_name ideastockexchange.com www.ideastockexchange.com;

    root /var/www/ideastockexchange;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /_next/static {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Proxy API requests
    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

**4. Setup SSL:**

```bash
certbot --nginx -d ideastockexchange.com -d www.ideastockexchange.com
```

### Option 4: AWS S3 + CloudFront

**1. Build static export:**

```bash
npm run build
npm run export
```

**2. Upload to S3:**

```bash
aws s3 sync out/ s3://ideastockexchange-frontend
```

**3. Configure CloudFront:**
- Create distribution pointing to S3 bucket
- Add custom domain
- Configure SSL certificate
- Set up invalidations

---

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /app/ideastockexchange
            git pull origin main
            npm ci --only=production
            npm run build
            pm2 restart ise-backend

  deploy-frontend:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Monitoring & Logging

### Error Tracking (Sentry)

**Install:**

```bash
npm install @sentry/node @sentry/react
```

**Backend setup:**

```typescript
// src/server/index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});

// Add error handler
app.use(Sentry.Handlers.errorHandler());
```

**Frontend setup:**

```typescript
// app/layout.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

### Application Monitoring

**Options:**
- **New Relic** - Full-stack observability
- **Datadog** - Infrastructure + APM
- **LogRocket** - Session replay for frontend
- **Prometheus + Grafana** - Self-hosted metrics

### Logging

**Winston for structured logging:**

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Health Checks

**Add health endpoint:**

```typescript
// src/server/routes/health.ts
app.get('/health', async (req, res) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

**Monitor with UptimeRobot or Pingdom.**

---

## Security Checklist

### Pre-Deployment

- [ ] **Environment variables** - All secrets in `.env`, not in code
- [ ] **JWT secret** - Strong, randomly generated
- [ ] **HTTPS only** - Force SSL redirect
- [ ] **CORS** - Restrict to production domain
- [ ] **Rate limiting** - Prevent abuse
- [ ] **Input validation** - Zod schemas on all inputs
- [ ] **SQL injection** - Prisma ORM (parameterized queries)
- [ ] **XSS prevention** - React auto-escaping, sanitize HTML
- [ ] **CSRF protection** - CSRF tokens for state-changing operations
- [ ] **Helmet.js** - Security headers
- [ ] **Dependencies** - Run `npm audit` and fix vulnerabilities
- [ ] **Database backups** - Automated daily backups
- [ ] **Error messages** - Don't expose stack traces in production

### Security Headers

**Add Helmet.js:**

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

app.use('/api/auth/login', authLimiter);
```

---

## Scaling Strategies

### Horizontal Scaling

**1. Load Balancer + Multiple Backend Instances**

```
                   Internet
                      │
                      ▼
              [Load Balancer]
                   │  │  │
        ┌──────────┼──┼──┴──────────┐
        ▼          ▼  ▼             ▼
   [Backend 1] [Backend 2] [Backend 3]
        │          │  │             │
        └──────────┴──┴─────────────┘
                      │
                      ▼
              [PostgreSQL]
```

**2. Database Read Replicas**

- Primary for writes
- Replicas for reads
- Reduces primary database load

**3. Redis Caching**

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache frequently accessed data
async function getDebate(id: string) {
  const cached = await redis.get(`debate:${id}`);

  if (cached) {
    return JSON.parse(cached);
  }

  const debate = await prisma.debate.findUnique({ where: { id } });

  await redis.setex(`debate:${id}`, 3600, JSON.stringify(debate)); // 1 hour TTL

  return debate;
}
```

### Performance Optimization

**1. Database Indexes**

Ensure critical indexes exist (see [Database Schema](Database-Schema#indexes--performance))

**2. Query Optimization**

- Use `select` to fetch only needed fields
- Implement pagination
- Use database views for complex queries

**3. CDN for Static Assets**

- Images, CSS, JS served from edge locations
- CloudFlare, CloudFront, or Fastly

**4. Compress Responses**

```typescript
import compression from 'compression';

app.use(compression());
```

---

## Rollback Strategy

### Quick Rollback

**If using PM2:**

```bash
# Rollback to previous version
pm2 restart ise-backend --update-env

# Or restore from backup
git reset --hard HEAD~1
npm ci
npm run build
pm2 restart ise-backend
```

**If using Docker:**

```bash
# Rollback to previous image
docker-compose down
docker-compose up -d --no-deps backend:previous-tag
```

### Database Rollbacks

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back <migration-name>
```

---

## Post-Deployment Checklist

- [ ] **Verify deployment** - Test critical user flows
- [ ] **Check logs** - No errors in Sentry/logs
- [ ] **Monitor performance** - Response times normal
- [ ] **Database health** - Connections stable
- [ ] **SSL certificate** - Valid and auto-renewing
- [ ] **Backups running** - Database backups working
- [ ] **DNS configured** - Domain resolves correctly
- [ ] **Analytics** - Tracking events properly
- [ ] **Email sending** - SMTP configured and working

---

## Troubleshooting

### Common Issues

**1. Database connection errors**
- Check `DATABASE_URL` is correct
- Verify database server is reachable
- Check firewall rules

**2. 502 Bad Gateway**
- Backend not running: `pm2 status`
- Check backend logs: `pm2 logs`
- Verify NGINX proxy configuration

**3. Static assets not loading**
- Check CDN configuration
- Verify CORS headers
- Check asset paths

**4. Slow performance**
- Enable database query logging
- Check for N+1 queries
- Add database indexes
- Implement caching

---

## Resources

- [Getting Started](Getting-Started) - Local development
- [Architecture Overview](Architecture-Overview) - System design
- [Database Schema](Database-Schema) - Data models
- [API Documentation](API-Documentation) - Endpoints

**External:**
- [Vercel Docs](https://vercel.com/docs)
- [PM2 Docs](https://pm2.keymetrics.io/docs)
- [NGINX Docs](https://nginx.org/en/docs/)
- [Docker Docs](https://docs.docker.com)
