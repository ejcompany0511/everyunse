const { execSync } = require('child_process');

console.log('=== FORCING DATABASE MIGRATION ON RENDER ===');

try {
  // Force push schema changes to production database
  console.log('Pushing schema changes...');
  execSync('npm run db:push', { stdio: 'inherit' });
  
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}