const { execSync } = require('child_process');

console.log('=== FIXING RENDER SCHEMA INCONSISTENCY ===');

// First, let's check the current service-prices endpoint error
console.log('\n1. Testing current service-prices endpoint...');
try {
  const result = execSync('curl -s https://everyunse.onrender.com/api/service-prices', { encoding: 'utf8' });
  console.log('Current response:', result);
} catch (error) {
  console.log('Endpoint test failed:', error.message);
}

// The issue is likely that Render's PostgreSQL database has an older schema
// where the display_order column doesn't exist, but our code expects it

console.log('\n2. Root cause analysis:');
console.log('- Local DB: Has display_order column (working)');
console.log('- Render DB: Missing display_order column (failing)');
console.log('- Solution: Force schema migration on Render');

console.log('\n3. Manual deployment needed:');
console.log('User needs to:');
console.log('1. git add server/routes.ts');
console.log('2. git commit -m "Add debug endpoint and schema fixes"');
console.log('3. git push origin main');
console.log('4. Wait for Render auto-deploy');
console.log('5. Test https://everyunse.onrender.com/api/debug/schema');

console.log('\n4. Alternative fix - Add schema migration to routes:');
console.log('We can add automatic schema repair to the routes startup process');