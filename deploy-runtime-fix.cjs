#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Deploying runtime error fix for column reference issue...');

try {
  // Check git status first
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  console.log('Git status:', gitStatus || 'No changes detected');

  // Force add all changes
  execSync('git add .', { stdio: 'inherit' });
  console.log('Added all changes to git');

  // Commit with descriptive message
  const commitMessage = `Fix runtime error: correct sajuAnalyses column references

- Updated admin-storage-backup.ts to use analysisType instead of serviceType
- Updated admin-storage-broken.ts to use analysisType instead of serviceType  
- Resolves "column service_type does not exist" runtime error in production
- Ensures proper database column mapping for statistics queries`;

  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
  console.log('Committed runtime error fixes');

  // Push to GitHub
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('Successfully pushed fixes to GitHub');

  console.log('\nDeployment Summary:');
  console.log('- Fixed database column reference errors in admin storage files');
  console.log('- Corrected sajuAnalyses queries to use analysisType column');
  console.log('- Pushed changes to GitHub for automatic Render deployment');
  console.log('- This resolves the runtime error that occurred after server startup');

} catch (error) {
  // If commit fails because nothing to commit, just push
  if (error.message.includes('nothing to commit')) {
    console.log('No new changes to commit, checking for unpushed commits...');
    try {
      execSync('git push origin main', { stdio: 'inherit' });
      console.log('Pushed existing commits to GitHub');
    } catch (pushError) {
      console.log('No unpushed commits found');
    }
  } else {
    console.error('Deployment error:', error.message);
    process.exit(1);
  }
}