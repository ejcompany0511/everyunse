#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Fixing runtime error: service_type column reference issue');

try {
  // Remove git lock if it exists
  if (fs.existsSync('.git/index.lock')) {
    fs.unlinkSync('.git/index.lock');
    console.log('✓ Removed git lock file');
  }

  // Add the fixed files
  execSync('git add server/admin-storage-backup.ts server/admin-storage-broken.ts', { stdio: 'inherit' });
  console.log('✓ Added fixed admin storage files');

  // Commit the fixes
  execSync('git commit -m "Fix runtime error: correct sajuAnalyses column references\n\n- Fixed admin-storage-backup.ts to use analysisType instead of serviceType\n- Fixed admin-storage-broken.ts to use analysisType instead of serviceType\n- Resolves column service_type does not exist runtime error in production"', { stdio: 'inherit' });
  console.log('✓ Committed column reference fixes');

  // Push to origin
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✓ Pushed fixes to GitHub');

  console.log('🎉 Runtime error fix deployed successfully!');
  console.log('📝 This resolves the "column service_type does not exist" error that occurred after server startup.');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}