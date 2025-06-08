import { execSync } from 'child_process';

try {
  console.log('Adding files...');
  execSync('git add server/db.ts server/migrate-data.ts server/storage.ts', { stdio: 'inherit' });
  
  console.log('Committing changes...');
  execSync('git commit -m "Fix PostgreSQL connection and add data migration"', { stdio: 'inherit' });
  
  console.log('Pushing to GitHub...');
  execSync('git push origin main', { stdio: 'inherit' });
  
  console.log('Successfully pushed PostgreSQL fixes to GitHub!');
} catch (error) {
  console.error('Git operation failed:', error.message);
  process.exit(1);
}