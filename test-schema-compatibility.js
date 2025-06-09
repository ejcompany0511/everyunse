#!/usr/bin/env node

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
// Schema will be tested via direct queries
import ws from "ws";

// Configure WebSocket for Neon compatibility
if (typeof WebSocket === 'undefined') {
  global.WebSocket = ws;
}

async function testSchemaCompatibility() {
  try {
    console.log('=== TESTING SCHEMA COMPATIBILITY ===');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    console.log('Connecting to new database...');
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    const db = drizzle(pool);
    
    // Test 1: Query servicePrices table directly
    console.log('Testing servicePrices query...');
    const pricesResult = await pool.query('SELECT * FROM "servicePrices" LIMIT 3');
    console.log('✅ servicePrices query successful:', pricesResult.rows.length, 'records');
    
    // Test 2: Check column access
    console.log('Testing column access...');
    if (pricesResult.rows.length > 0) {
      const firstPrice = pricesResult.rows[0];
      console.log('Service type:', firstPrice.serviceType);
      console.log('Coin cost:', firstPrice.coinCost);
      console.log('Display order:', firstPrice.displayOrder);
      console.log('✅ Column access successful');
    }
    
    // Test 3: Query users table
    console.log('Testing users table...');
    const userResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('✅ Users table accessible, count:', userResult.rows[0].count);
    
    // Test 4: Query sajuAnalyses table
    console.log('Testing sajuAnalyses table...');
    const analysisResult = await pool.query('SELECT COUNT(*) as count FROM "sajuAnalyses"');
    console.log('✅ SajuAnalyses table accessible, count:', analysisResult.rows[0].count);
    
    // Test 5: Check database tables
    console.log('Checking database tables...');
    const tableCheck = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('Database tables:');
    tableCheck.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    await pool.end();
    console.log('=== SCHEMA COMPATIBILITY TEST COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Schema compatibility test failed:', error);
    process.exit(1);
  }
}

testSchemaCompatibility();