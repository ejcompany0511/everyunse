# EVERYUNSE Payment Server

Dedicated payment processing server for EVERYUNSE platform using PortOne V1 + KG이니시스 integration.

## Quick Deploy to Render

### 1. Repository Setup
```bash
# Clean up the repository for payment server only
git rm -rf client/ server/ shared/ attached_assets/
git rm package.json package-lock.json vite.config.ts tailwind.config.ts
git rm tsconfig.json components.json postcss.config.js drizzle.config.ts
git rm *.js *.sh *.cjs (cleanup scripts)
git add payment-server/
git commit -m "Payment server deployment ready"
git push origin main
```

### 2. Render Deployment
1. Go to [Render.com](https://render.com) → New Web Service
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `payment-server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3. Environment Variables (Render)
```
VITE_PORTONE_STORE_ID=imp25772872
VITE_PORTONE_CHANNEL_KEY=your_channel_key
PORTONE_API_SECRET=your_api_secret
INTERNAL_API_KEY=generate_random_key
REPLIT_APP_URL=https://everyunse.replit.app
REPLIT_API_URL=https://everyunse.replit.app
```

### 4. Replit Configuration
Add to Replit environment:
```
RENDER_PAYMENT_URL=https://your-payment-server.onrender.com
INTERNAL_API_KEY=same_as_render
```

## Architecture

- **Replit**: Main application (UI, AI analysis, admin panel)
- **Render**: Payment processing only (solves database schema issues)
- **Payment Flow**: Frontend → Replit API → Render Server → PortOne → Webhook → Coin Credit

## API Endpoints

- `GET /` - Health check
- `POST /api/create-payment` - Create payment request
- `POST /api/verify-payment` - Verify payment status
- `POST /api/payment/webhook` - PortOne webhook handler

## Testing

```bash
# Test payment server
curl https://your-payment-server.onrender.com/

# Expected response
{"status":"OK","service":"EVERYUNSE Payment Server","timestamp":"..."}
```

## Support

For issues, check:
1. Render deployment logs
2. PortOne dashboard for webhook delivery
3. Replit logs for coin crediting

Business: 상호 이제이, 사업자등록번호 219-44-01233