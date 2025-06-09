#!/usr/bin/env node

import { Pool } from '@neondatabase/serverless';
import ws from "ws";

// Configure WebSocket for Neon compatibility
if (typeof WebSocket === 'undefined') {
  global.WebSocket = ws;
}

async function forceSchemaCreation() {
  console.log('Creating camelCase schema in production database...');
  
  try {
    const productionUrl = 'postgresql://everyunse:PfBTExNAqqIMn6EF5ZA55QFXSV5a3jNN@dpg-d12tgqruibrs73fjvd30-a.oregon-postgres.render.com/everyunse_prod_3zvq';
    
    const pool = new Pool({ 
      connectionString: productionUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    // Create tables directly with camelCase names
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "servicePrices" (
        id SERIAL PRIMARY KEY,
        "serviceType" VARCHAR NOT NULL UNIQUE,
        "coinCost" INTEGER NOT NULL DEFAULT 0,
        "displayOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR UNIQUE,
        email VARCHAR UNIQUE,
        "phoneNumber" VARCHAR,
        "hashedPassword" VARCHAR,
        "coinBalance" INTEGER DEFAULT 100,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "sajuAnalyses" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        "analysisType" VARCHAR NOT NULL,
        "birthData" JSONB NOT NULL,
        content JSONB NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Insert default service prices
    await pool.query(`
      INSERT INTO "servicePrices" ("serviceType", "coinCost", "displayOrder") VALUES
      ('saju_analysis', 0, 1),
      ('monthly_fortune', 0, 2),
      ('love_potential', 25, 3),
      ('reunion_potential', 25, 4),
      ('compatibility', 25, 5),
      ('job_prospects', 0, 6),
      ('marriage_potential', 0, 7),
      ('comprehensive_fortune', 30, 8)
      ON CONFLICT ("serviceType") DO NOTHING;
    `);
    
    console.log('Schema created successfully!');
    
    // Verify tables
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('servicePrices', 'sajuAnalyses', 'users')
      ORDER BY table_name;
    `);
    
    console.log('Verified tables:', result.rows.map(r => r.table_name));
    
    await pool.end();
    
  } catch (error) {
    console.error('Schema creation failed:', error.message);
    throw error;
  }
}

forceSchemaCreation();