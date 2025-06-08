# Manual Deployment Instructions

## Issue Identified
Render database uses camelCase column names (`"serviceType"`) instead of snake_case (`service_type`). The schema migration was failing because it referenced the wrong column name format.

## Fix Applied
Updated `server/routes.ts` to use correct camelCase column names in the migration SQL:
```sql
WHERE "serviceType" = 'monthly_fortune'
```

## Manual Deployment Required
Run these commands in your terminal:

```bash
# Remove git lock file
rm -f .git/index.lock
rm -f .git/refs/remotes/origin/main.lock

# Add the fixed file
git add server/routes.ts

# Commit the column name fix
git commit -m "Fix: Use correct camelCase column names for Render database migration"

# Push to trigger Render deployment
git push origin main
```

## Expected Result
- Render will detect missing `display_order` column
- Add the column successfully using correct `"serviceType"` references
- Update all 11 service records with proper display order
- `/api/service-prices` endpoint will work correctly
- Platform fully functional

## Verification
After deployment completes:
1. Test: `https://everyunse.onrender.com/api/service-prices`
2. Test: `https://everyunse.onrender.com/api/debug/schema`
3. All services should display correctly on the frontend