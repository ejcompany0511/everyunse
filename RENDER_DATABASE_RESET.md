# Render Database Reset Instructions

## Problem Identified
Render PostgreSQL created tables with camelCase column names while our code expects snake_case, causing schema mismatches.

## Root Cause
Drizzle ORM converted column names to camelCase during deployment to Render, while local development uses snake_case.

## Complete Solution Steps

### 1. Delete Current Render Database
In Render Dashboard:
- Go to your PostgreSQL database service
- Click "Delete" to remove current database
- Confirm deletion

### 2. Create New PostgreSQL Database
- Create new PostgreSQL database in Render
- Copy the new DATABASE_URL
- Update environment variables in Render web service

### 3. Redeploy Application
The existing GitHub code will automatically:
- Create tables with correct snake_case column names
- Initialize service prices properly
- Set up all schemas correctly

### 4. Verification
After deployment, test these endpoints:
- `https://everyunse.onrender.com/api/service-prices`
- `https://everyunse.onrender.com/api/debug/schema`
- Platform functionality should be fully restored

## Expected Result
- Clean PostgreSQL database with snake_case columns
- All APIs working correctly
- No schema mismatches between local and production