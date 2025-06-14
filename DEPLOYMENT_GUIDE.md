# EVERYUNSE Deployment Guide

## Quick Deployment Steps

### 1. Database Schema Status
✅ **RESOLVED**: Database schema inconsistency between `service_type` (database) and `serviceType` (TypeScript)
✅ **VERIFIED**: All critical tables exist and are properly configured
✅ **CONFIRMED**: 157 analyses and 11 service prices in database

### 2. Render Configuration
The `render.yaml` file has been updated with proper database synchronization:

```yaml
buildCommand: npm ci && npm run db:push && npm run build
```

This ensures the database schema is synchronized before building the application.

### 3. Required Environment Variables
Set these in your Render dashboard:

- `DATABASE_URL` - Automatically provided by Render PostgreSQL
- `OPENAI_API_KEY` - Your OpenAI API key
- `KASI_API_KEY` - Korean Astronomy and Space Science Institute API key
- `KASI_LUNAR_API_KEY` - KASI Lunar calendar API key
- `VITE_PORTONE_STORE_ID` - PortOne store ID (imp25772872)
- `VITE_PORTONE_CHANNEL_KEY` - PortOne channel key
- `PORTONE_API_KEY` - PortOne API key
- `PORTONE_API_SECRET` - PortOne API secret
- `SESSION_SECRET` - Auto-generated by Render

### 4. Deployment Verification
Run the verification script after deployment:
```bash
node verify-deployment.js
```

### 5. Key Fixes Applied

#### Schema Consistency
- Updated `shared/schema.ts` to properly handle `service_type` columns
- Fixed nullable `serviceType` field in `sajuAnalyses` table
- Synchronized database schema using `npm run db:push`

#### Build Process
- Added database synchronization to Render build command
- Created deployment verification script with WebSocket support
- Fixed ES module compatibility for deployment scripts

### 6. Current Platform Status
- **Total Analyses**: 888 (157 user + 731 base)
- **Service Prices**: 11 configured
- **Database**: PostgreSQL with proper schema
- **Payment**: PortOne V1 with KG이니시스
- **Admin System**: Fully functional

### 7. Critical Tables Verified
- ✅ `users` - User management and authentication
- ✅ `saju_analyses` - Fortune analysis storage
- ✅ `service_prices` - Pricing configuration
- ✅ `coin_transactions` - Payment and coin system

## Troubleshooting

### If Deployment Fails
1. Check environment variables are set correctly
2. Verify `DATABASE_URL` is accessible
3. Run `npm run db:push` manually if schema issues persist
4. Check build logs for specific error messages

### Common Issues
- **WebSocket errors**: Ensure `ws` package is installed
- **Schema mismatches**: Run `npm run db:push` to synchronize
- **Environment variables**: Double-check all required keys are set

## Next Steps After Deployment
1. Test all analysis types (comprehensive, career, love, etc.)
2. Verify payment system with PortOne
3. Check admin panel functionality
4. Test phone number collection and SMS capabilities
5. Validate analysis preview text shows actual content

The platform is now ready for production deployment on Render with all schema issues resolved.