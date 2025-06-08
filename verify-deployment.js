#!/usr/bin/env node

// Deployment verification script
// Tests database connectivity and schema integrity

const { Pool } = require('@neondatabase/serverless');

async function verifyDeployment() {
  console.log('🔍 Verifying deployment...');
  
  try {
    // Test database connection
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Test basic connectivity
    console.log('📡 Testing database connection...');
    const client = await pool.connect();
    
    // Verify critical tables exist
    const tables = ['users', 'saju_analyses', 'service_prices', 'coin_transactions'];
    
    for (const table of tables) {
      const result = await client.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`, [table]);
      if (!result.rows[0].exists) {
        throw new Error(`Table ${table} does not exist`);
      }
      console.log(`✅ Table ${table} verified`);
    }
    
    // Verify service_type columns
    const serviceTypeCheck = await client.query(`
      SELECT column_name, table_name 
      FROM information_schema.columns 
      WHERE column_name = 'service_type'
    `);
    
    console.log(`✅ Found ${serviceTypeCheck.rows.length} service_type columns`);
    
    // Test sample data integrity
    const analysisCount = await client.query('SELECT COUNT(*) FROM saju_analyses');
    console.log(`✅ Found ${analysisCount.rows[0].count} analyses in database`);
    
    const priceCount = await client.query('SELECT COUNT(*) FROM service_prices');
    console.log(`✅ Found ${priceCount.rows[0].count} service prices`);
    
    client.release();
    console.log('🎉 Deployment verification successful!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Deployment verification failed:', error.message);
    return false;
  }
}

// Run verification if called directly
if (require.main === module) {
  verifyDeployment().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { verifyDeployment };