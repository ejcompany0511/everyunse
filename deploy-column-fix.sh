#!/bin/bash

echo "=== DEPLOYING RENDER COLUMN NAME FIX ==="

# Add the fixed routes file
git add server/routes.ts

# Commit the camelCase column fix
git commit -m "Fix: Use correct camelCase column names for Render database migration"

# Push to trigger Render deployment
git push origin main

echo "✅ Deployment initiated - Render will now use correct column names"
echo "📋 Expected result: service_prices API will work correctly"