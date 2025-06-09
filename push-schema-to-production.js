#!/usr/bin/env node

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { execSync } from 'child_process';
import ws from "ws";

// Configure WebSocket for Neon compatibility
if (typeof WebSocket === 'undefined') {
  global.WebSocket = ws;
}

async function pushSchemaToProduction() {
  console.log('🔄 Pushing camelCase schema to production database...');
  
  try {
    // Generate migration
    console.log('📋 Generating migration files...');
    execSync('npx drizzle-kit generate', { stdio: 'inherit' });
    
    // Get production DATABASE_URL
    const productionUrl = 'postgresql://everyunse:PfBTExNAqqIMn6EF5ZA55QFXSV5a3jNN@dpg-d12tgqruibrs73fjvd30-a.oregon-postgres.render.com/everyunse_prod_3zvq';
    
    console.log('🗄️  Connecting to production database...');
    const pool = new Pool({ 
      connectionString: productionUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    const db = drizzle(pool);
    
    // Run migration
    console.log('🚀 Running migration to production...');
    await migrate(db, { migrationsFolder: './drizzle' });
    
    // Verify tables exist
    console.log('✅ Verifying tables...');
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('servicePrices', 'sajuAnalyses', 'users')
      ORDER BY table_name;
    `);
    
    console.log('Created tables:', result.rows.map(r => r.table_name));
    
    await pool.end();
    console.log('🎉 Schema push completed successfully!');
    
  } catch (error) {
    console.error('❌ Schema push failed:', error.message);
    throw error;
  }
}

pushSchemaToProduction();