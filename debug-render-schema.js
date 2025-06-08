const { execSync } = require('child_process');

console.log('=== DEBUGGING RENDER DATABASE SCHEMA ===');

// Add database debugging endpoint to check table structure
const debugCode = `
// Add to server/routes.ts for temporary debugging
app.get('/api/debug/schema', async (req, res) => {
  try {
    console.log('=== CHECKING service_prices TABLE STRUCTURE ===');
    
    // Check if table exists
    const tableCheck = await db.execute(sql\`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'service_prices'
      );
    \`);
    console.log('Table exists:', tableCheck.rows[0].exists);
    
    // Check column structure
    const columns = await db.execute(sql\`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'service_prices'
      ORDER BY ordinal_position;
    \`);
    console.log('Columns:', columns.rows);
    
    // Try a simple select to see what fails
    try {
      const testSelect = await db.select().from(servicePrices).limit(1);
      console.log('Sample data:', testSelect);
      res.json({ success: true, columns: columns.rows, sampleData: testSelect });
    } catch (selectError) {
      console.error('Select error:', selectError.message);
      res.json({ success: false, error: selectError.message, columns: columns.rows });
    }
  } catch (error) {
    console.error('Debug error:', error.message);
    res.status(500).json({ error: error.message });
  }
});
`;

console.log('Debug endpoint code:');
console.log(debugCode);
console.log('\n=== ADD THIS TO server/routes.ts TEMPORARILY ===');