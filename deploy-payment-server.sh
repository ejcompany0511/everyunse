#!/bin/bash

# EVERYUNSE 결제 서버 배포 스크립트
echo "🚀 EVERYUNSE 결제 서버 배포 준비"

# 1. GitHub 저장소 정리
echo "📋 단계 1: GitHub 저장소 정리"
echo "다음 명령어를 순서대로 실행하세요:"
echo ""

echo "# 불필요한 폴더 삭제"
echo "git rm -rf client/ server/ shared/ attached_assets/"
echo ""

echo "# 메인 프로젝트 파일들 삭제"
echo "git rm package.json package-lock.json vite.config.ts tailwind.config.ts tsconfig.json"
echo "git rm components.json postcss.config.js drizzle.config.ts .replit"
echo ""

echo "# 스크립트 파일들 삭제"
echo "git rm batch-upload.js commit-changes.js complete-deploy.js debug-render-schema.js"
echo "git rm deploy-column-fix.sh deploy-runtime-fix.cjs deploy.js final-deploy.js"
echo "git rm fix-deployment.js fix-render-schema.js fix-runtime-error.cjs fix-runtime-error.js"
echo "git rm force-migration.js github-deploy.js quick-deploy.js slow-upload.js"
echo "git rm upload-critical.js upload-one.js verify-column-fix.js verify-deployment.js"
echo "git rm test-payment-flow.js cleanup-for-payment-server.js deploy-payment-server.sh"
echo "git rm cookies.txt generated-icon.png"
echo ""

echo "# 기존 문서 삭제 (새 문서로 교체)"
echo "git rm README.md DEPLOYMENT_GUIDE.md MANUAL_DEPLOY_INSTRUCTIONS.md RENDER_DATABASE_RESET.md"
echo "git rm RENDER_DEPLOYMENT_FIX.md fix-column-references.md"
echo ""

echo "# 결제 서버 파일들 추가"
echo "git add payment-server/ PAYMENT_SERVER_DEPLOYMENT.md"
echo ""

echo "# 변경사항 커밋"
echo "git commit -m \"Clean repository for payment server deployment\""
echo ""

echo "# GitHub에 푸시"
echo "git push origin main"
echo ""

echo "📋 단계 2: Render 배포 설정"
echo "1. Render.com에 로그인"
echo "2. 'New Web Service' 클릭"
echo "3. GitHub 저장소 연결"
echo "4. 설정:"
echo "   - Root Directory: payment-server"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo ""

echo "📋 단계 3: 환경 변수 설정 (Render)"
echo "VITE_PORTONE_STORE_ID=imp25772872"
echo "VITE_PORTONE_CHANNEL_KEY=[당신의 채널키]"
echo "PORTONE_API_SECRET=[당신의 API 시크릿]"
echo "INTERNAL_API_KEY=[내부 통신용 키 생성]"
echo "REPLIT_APP_URL=https://everyunse.replit.app"
echo "REPLIT_API_URL=https://everyunse.replit.app"
echo ""

echo "📋 단계 4: Replit 환경 변수 추가"
echo "RENDER_PAYMENT_URL=https://your-payment-server.onrender.com"
echo "INTERNAL_API_KEY=[Render와 동일한 키]"
echo ""

echo "✅ 준비 완료!"
echo "위 명령어들을 순서대로 실행하시면 결제 서버가 배포됩니다."