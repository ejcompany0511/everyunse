import fs from 'fs';
import path from 'path';

// GitHub 저장소 정리 스크립트 - 결제 서버만 남기기

const filesToKeep = [
  'payment-server/',
  '.gitignore',
  'README.md',
  'PAYMENT_SERVER_DEPLOYMENT.md'
];

const filesToDelete = [
  'client/',
  'server/',
  'shared/',
  'attached_assets/',
  'package.json',
  'package-lock.json',
  'vite.config.ts',
  'tailwind.config.ts',
  'tsconfig.json',
  'components.json',
  'postcss.config.js',
  'drizzle.config.ts',
  'render.yaml',
  '.replit',
  'batch-upload.js',
  'commit-changes.js',
  'complete-deploy.js',
  'debug-render-schema.js',
  'deploy-column-fix.sh',
  'deploy-runtime-fix.cjs',
  'deploy.js',
  'final-deploy.js',
  'fix-column-references.md',
  'fix-deployment.js',
  'fix-render-schema.js',
  'fix-runtime-error.cjs',
  'fix-runtime-error.js',
  'force-migration.js',
  'generated-icon.png',
  'github-deploy.js',
  'quick-deploy.js',
  'slow-upload.js',
  'upload-critical.js',
  'upload-one.js',
  'verify-column-fix.js',
  'verify-deployment.js',
  'test-payment-flow.js',
  'cookies.txt'
];

console.log('🧹 GitHub 저장소 정리 가이드');
console.log('\n삭제할 파일/폴더:');
filesToDelete.forEach(file => {
  console.log(`  - ${file}`);
});

console.log('\n유지할 파일/폴더:');
filesToKeep.forEach(file => {
  console.log(`  - ${file}`);
});

console.log('\n📋 정리 명령어:');
console.log('git rm -rf client/ server/ shared/ attached_assets/');
console.log('git rm package.json package-lock.json vite.config.ts tailwind.config.ts');
console.log('git rm tsconfig.json components.json postcss.config.js drizzle.config.ts');
console.log('git rm *.js *.sh *.cjs *.md (except PAYMENT_SERVER_DEPLOYMENT.md)');
console.log('git add payment-server/');
console.log('git commit -m "Clean up repository - payment server only"');
console.log('git push origin main');

console.log('\n✅ 정리 후 저장소 구조:');
console.log(`
everyunse/
├── payment-server/
│   ├── package.json
│   ├── index.js
│   ├── render.yaml
│   ├── .env.example
│   └── test-integration.js
├── .gitignore
├── README.md
└── PAYMENT_SERVER_DEPLOYMENT.md
`);