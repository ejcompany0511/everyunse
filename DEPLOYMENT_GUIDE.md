# EVERYUNSE - Production Deployment Guide

## Current Status: READY FOR DEPLOYMENT ✅

### What's Complete
- ✅ New PostgreSQL database created with camelCase schema
- ✅ All 21 tables deployed successfully
- ✅ Schema compatibility verified and tested
- ✅ Column name references fixed (displayOrder, servicePrices)
- ✅ Application running locally without errors
- ✅ Payment integration configured (PortOne + KG이니시스)

### Manual Deployment Steps

Since automated git operations are restricted, please run these commands in your terminal:

```bash
# Navigate to project directory
cd /path/to/everyunse

# Add all changes
git add .

# Commit the schema fixes
git commit -m "PRODUCTION: Schema compatibility fixes for camelCase database"

# Push to trigger Render deployment
git push origin main
```

### Production Environment

**Database:** everyunse-db-new (PostgreSQL with camelCase schema)
**Hosting:** Render.com with automatic GitHub deployment

### Production URLs (After Deployment)
- **Main Site:** https://everyunse.onrender.com
- **API Health:** https://everyunse.onrender.com/api/service-prices
- **Admin Panel:** https://everyunse.onrender.com/admin

### Admin Access
- **Username:** EJCompany0511
- **Password:** Ej960511?

### Payment Configuration
- **Provider:** PortOne V1 API
- **Store ID:** imp25772872
- **PG:** KG이니시스 (html5_inicis)
- **Test Services:** 호궁합 (25냥), 종합운세 (30냥)

### Business Information
- **Company:** 상호 이제이
- **Representative:** 조민철외 1명
- **Business Registration:** 219-44-01233
- **Address:** 서울특별시 중랑구 동일로149길 69-20(묵동)
- **Email:** ejcompany0511@gmail.com

### Post-Deployment Verification

1. **Test Main Site**
   - Visit: https://everyunse.onrender.com
   - Verify landing page loads correctly
   - Test user registration and login

2. **Verify API Endpoints**
   - Check: https://everyunse.onrender.com/api/service-prices
   - Should return 7 services with correct pricing

3. **Admin Panel Testing**
   - Login: https://everyunse.onrender.com/admin
   - Verify dashboard statistics
   - Test user management features

4. **Payment Integration**
   - Test coin purchase flow
   - Verify PortOne payment processing
   - Check transaction recording

### Expected Deployment Time
- **Build Time:** 2-3 minutes
- **Database Migration:** 30 seconds
- **Total Deployment:** 3-5 minutes

### Support
If deployment issues occur, check Render deployment logs and verify all environment variables are properly configured in the Render dashboard.

The platform is fully prepared for production deployment.