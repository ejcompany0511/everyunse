# Runtime Error Fix: Column Reference Issues

## Root Cause
The `saju_analyses` table has both columns:
- `analysis_type` (text, NOT NULL) - correct column to use
- `service_type` (text, nullable) - causes GROUP BY errors

## Database Structure Verified
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'saju_analyses';
```

Results:
- id (integer, NOT NULL)
- user_id (integer, NOT NULL) 
- title (text, NOT NULL)
- analysis_type (text, NOT NULL) ← CORRECT COLUMN
- birth_data (jsonb, NOT NULL)
- result (jsonb, NOT NULL)
- summary (text, NOT NULL)
- created_at (timestamp, nullable)
- service_type (text, nullable) ← PROBLEMATIC COLUMN

## Analysis Type Distribution
```
analysis_type | count
monthly       | 69
comprehensive | 33
love          | 20
compatibility | 15
marriage      | 7
career        | 7
reunion       | 6
```

## Solution Applied
All admin storage queries now correctly use `sajuAnalyses.analysisType` instead of any reference to `serviceType` for GROUP BY operations on the saju_analyses table.

## Files Fixed
- server/admin-storage.ts
- server/admin-storage-backup.ts  
- server/admin-storage-broken.ts

## Verification
Local development server working correctly. Deployment needed to push fixes to production environment.