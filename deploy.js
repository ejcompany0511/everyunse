import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 GitHub 자동배포 시스템 시작...');

// GitHub 리포지토리 설정
const GITHUB_REPO = 'https://github.com/ejcompany0511/everyunse.git';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN 환경변수가 필요합니다.');
  process.exit(1);
}

// 인증된 URL 생성
const authenticatedUrl = GITHUB_REPO.replace('https://', `https://${GITHUB_TOKEN}@`);

try {
  // .gitignore 파일 생성/업데이트
  const gitignoreContent = `
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/
.next/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Replit specific
.replit
replit.nix
.config/
.upm/

# Database
*.db
*.sqlite
*.sqlite3

# Temporary files
tmp/
temp/
`.trim();

  fs.writeFileSync('.gitignore', gitignoreContent);
  console.log('✅ .gitignore 파일 생성 완료');

  // package.json에 build 스크립트 확인/추가
  const packageJsonPath = 'package.json';
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    // 프로덕션 빌드 스크립트 추가
    packageJson.scripts.build = packageJson.scripts.build || 'vite build';
    packageJson.scripts.start = packageJson.scripts.start || 'NODE_ENV=production tsx server/index.ts';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ package.json 스크립트 업데이트 완료');
  }

  // 현재 Git 상태 확인
  try {
    execSync('git status', { stdio: 'ignore' });
    console.log('📁 기존 Git 저장소 감지됨');
  } catch (error) {
    console.log('📁 새 Git 저장소 초기화...');
    execSync('git init');
  }

  // Git 설정
  try {
    execSync('git config user.name "EVERYUNSE Deploy Bot"');
    execSync('git config user.email "ejcompany0511@gmail.com"');
    console.log('✅ Git 사용자 설정 완료');
  } catch (error) {
    console.log('⚠️ Git 사용자 설정 건너뜀 (이미 설정됨)');
  }

  // 원격 저장소 설정
  try {
    execSync(`git remote remove origin`, { stdio: 'ignore' });
  } catch (error) {
    // 원격 저장소가 없는 경우 무시
  }
  
  execSync(`git remote add origin ${authenticatedUrl}`);
  console.log('✅ GitHub 원격 저장소 연결 완료');

  // 모든 파일 스테이징
  execSync('git add .');
  console.log('✅ 파일 스테이징 완료');

  // 커밋
  const commitMessage = `Deploy: EVERYUNSE 자동배포 시스템 구축 (${new Date().toISOString()})`;
  execSync(`git commit -m "${commitMessage}"`);
  console.log('✅ 커밋 완료');

  // GitHub에 푸시 (force push로 기존 이력 정리)
  console.log('🚀 GitHub에 푸시 중...');
  execSync('git push -u origin main --force');
  console.log('✅ GitHub 푸시 완료!');

  console.log('\n🎉 GitHub 자동배포 시스템 설정 완료!');
  console.log('📍 리포지토리: https://github.com/ejcompany0511/everyunse');
  console.log('🔄 이제 main 브랜치에 푸시할 때마다 자동배포됩니다.');

} catch (error) {
  console.error('❌ 배포 스크립트 실행 중 오류:', error.message);
  process.exit(1);
}