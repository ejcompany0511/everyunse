#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('Triggering Render redeploy...');

try {
  // Make a small change to force redeploy
  console.log('Adding redeploy trigger...');
  
  const now = new Date().toISOString();
  const triggerComment = `// Redeploy trigger: ${now}`;
  
  // Add trigger comment to routes file
  execSync(`echo "${triggerComment}" >> server/routes.ts`);
  
  // Commit and push
  execSync('git add server/routes.ts');
  execSync(`git commit -m "Trigger redeploy: Schema created in production DB"`);
  execSync('git push origin main');
  
  console.log('Redeploy triggered successfully!');
  console.log('Render will now restart with the new database schema.');
  console.log('Expected completion: 3-5 minutes');
  
} catch (error) {
  console.error('Redeploy trigger failed:', error.message);
  console.log('Manual option: Go to Render dashboard and click "Manual Deploy"');
}