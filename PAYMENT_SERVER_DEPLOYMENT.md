# Payment Server Deployment Guide

## Architecture Overview

The EVERYUNSE platform now uses a separated architecture to solve database schema consistency issues:

- **Replit**: Main application (user interface, AI analysis, admin panel)
- **Render**: Dedicated payment server (PortOne + KG이니시스 integration)

## Deployment Steps

### 1. Deploy Payment Server to Render

1. Create new Web Service on Render
2. Connect to your GitHub repository
3. Set build path to `payment-server`
4. Configure build and start commands:
   - Build Command: `npm install`
   - Start Command: `npm start`

### 2. Required Environment Variables on Render

```
NODE_ENV=production
PORT=3000
VITE_PORTONE_STORE_ID=imp25772872
VITE_PORTONE_CHANNEL_KEY=your_channel_key_here
PORTONE_API_SECRET=your_api_secret_here
INTERNAL_API_KEY=your_internal_api_key_here
REPLIT_APP_URL=https://everyunse.replit.app
REPLIT_API_URL=https://everyunse.replit.app
```

### 3. Required Environment Variables on Replit

```
RENDER_PAYMENT_URL=https://your-payment-server.onrender.com
INTERNAL_API_KEY=your_internal_api_key_here
```

### 4. Payment Flow Architecture

1. **Frontend** → Creates payment request via Replit API
2. **Replit Server** → Forwards request to Render payment server
3. **Render Server** → Generates PortOne payment data
4. **Frontend** → Launches PortOne payment with Render data
5. **PortOne** → Sends webhook to Render server
6. **Render Server** → Notifies Replit of successful payment
7. **Replit Server** → Adds coins to user account

### 5. Benefits of This Architecture

- **Replit**: No database schema issues, focuses on core business logic
- **Render**: Dedicated payment processing, stable database environment
- **Separation**: Each service optimized for its specific purpose
- **Reliability**: Payment processing isolated from main application

### 6. API Endpoints

#### Render Payment Server
- `GET /` - Health check
- `POST /api/create-payment` - Create payment request
- `POST /api/verify-payment` - Verify payment status
- `POST /api/payment/webhook` - PortOne webhook receiver

#### Replit Main Server
- `POST /api/payment/create` - Create payment (proxies to Render)
- `POST /api/payment/verify` - Verify payment (proxies to Render)
- `POST /api/payment/webhook` - Receive payment success notification

### 7. Security Considerations

- Use INTERNAL_API_KEY for server-to-server communication
- Validate all webhook requests
- Use HTTPS for all communications
- Store sensitive API keys as environment variables

### 8. Monitoring and Debugging

- Check Render logs for payment processing issues
- Check Replit logs for coin crediting issues
- Verify webhook delivery in PortOne dashboard
- Monitor payment success rates in both systems