#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;

async function fixProductionSchema() {
  console.log('Fixing production database schema...');
  
  const client = new Client({
    connectionString: 'postgresql://everyunse:PfBTExNAqqIMn6EF5ZA55QFXSV5a3jNN@dpg-d12tgqruibrs73fjvd30-a.oregon-postgres.render.com/everyunse_prod_3zvq',
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('Connected to production database');
    
    // Check existing tables
    const existingTables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('Existing tables:', existingTables.rows.map(r => r.table_name));
    
    // Create servicePrices table with camelCase columns
    await client.query(`
      CREATE TABLE IF NOT EXISTS "servicePrices" (
        id SERIAL PRIMARY KEY,
        "serviceType" VARCHAR NOT NULL UNIQUE,
        "coinCost" INTEGER NOT NULL DEFAULT 0,
        "displayOrder" INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Add description column if it doesn't exist
    await client.query(`
      ALTER TABLE "servicePrices" 
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);
    
    // Insert service data
    await client.query(`
      INSERT INTO "servicePrices" ("serviceType", "coinCost", "displayOrder") VALUES
      ('saju_analysis', 0, 1),
      ('monthly_fortune', 0, 2), 
      ('love_potential', 25, 3),
      ('reunion_potential', 25, 4),
      ('compatibility', 25, 5),
      ('job_prospects', 0, 6),
      ('marriage_potential', 0, 7),
      ('comprehensive_fortune', 30, 8)
      ON CONFLICT ("serviceType") DO UPDATE SET
      "coinCost" = EXCLUDED."coinCost",
      "displayOrder" = EXCLUDED."displayOrder";
    `);
    
    // Verify data
    const services = await client.query('SELECT * FROM "servicePrices" ORDER BY "displayOrder"');
    console.log('Service prices created:', services.rows.length, 'records');
    
    console.log('Production schema fixed successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

fixProductionSchema();