#!/usr/bin/env node

// Commits deployment fixes to GitHub
import { execSync } from 'child_process';

console.log('📝 Committing deployment fixes...');

try {
  // Add all modified files
  execSync('git add .', { stdio: 'inherit' });
  
  // Commit with descriptive message
  execSync('git commit -m "Fix: Resolve Render deployment schema inconsistency\n\n- Fixed service_type vs serviceType column name mismatch\n- Updated render.yaml with database synchronization\n- Created deployment verification script\n- Resolved database schema consistency issues\n- Added comprehensive deployment guide"', { stdio: 'inherit' });
  
  // Push to GitHub
  execSync('git push origin main', { stdio: 'inherit' });
  
  console.log('✅ Successfully pushed deployment fixes to GitHub');
  
} catch (error) {
  console.error('❌ Git operation failed:', error.message);
  console.log('\nManual steps:');
  console.log('1. git add .');
  console.log('2. git commit -m "Fix: Resolve Render deployment schema inconsistency"');
  console.log('3. git push origin main');
}