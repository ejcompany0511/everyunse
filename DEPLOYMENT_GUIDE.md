# EVERYUNSE 프로덕션 배포 가이드

## 현재 상태
✅ GitHub 저장소 생성 완료: https://github.com/ejcompany0511/everyunse
✅ 핵심 백엔드 시스템 업로드 완료
✅ GitHub Actions 워크플로우 설정 완료
✅ Render 배포 설정 파일 생성 완료
✅ 주요 프론트엔드 컴포넌트 업로드 완료

## Render 배포 단계

### 1. Render 서비스 생성
1. https://render.com 로그인
2. "New Web Service" 선택
3. GitHub 저장소 연결: `ejcompany0511/everyunse`
4. 다음 설정 적용:
   - **Name**: everyunse
   - **Branch**: main
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: 20

### 2. 환경 변수 설정
다음 환경 변수들을 Render 대시보드에서 설정:

```
NODE_ENV=production
PORT=10000

# Database
DATABASE_URL=[PostgreSQL 연결 문자열]

# OpenAI
OPENAI_API_KEY=[OpenAI API 키]

# Korean Astronomical Observatory
KASI_API_KEY=[천문연 API 키]
KASI_LUNAR_API_KEY=[천문연 음력 API 키]

# PortOne Payment
VITE_PORTONE_STORE_ID=imp25772872
VITE_PORTONE_CHANNEL_KEY=[PortOne 채널 키]
PORTONE_API_KEY=[PortOne API 키]
PORTONE_API_SECRET=[PortOne API 시크릿]

# Session
SESSION_SECRET=[세션 시크릿 키]
```

### 3. PostgreSQL 데이터베이스 설정
1. Render에서 PostgreSQL 서비스 생성
2. 데이터베이스 URL을 `DATABASE_URL` 환경 변수에 설정
3. 자동으로 테이블이 생성됩니다

### 4. 배포 완료
환경 변수 설정 후 자동으로 배포가 시작됩니다.

## 배포된 서비스 기능

### 사주 분석 서비스
- 총운 분석 (무료)
- 월간 운세 (무료)
- 애정운 분석 (25냥)
- 직업운 분석 (무료)
- 궁합 분석 (25냥)
- 복합 운세 (30냥)
- 재회 가능성 (25냥)

### 결제 시스템
- 냥(포인트) 충전
- KG이니시스 실시간 결제
- 결제 내역 관리

### 관리자 시스템
- 사용자 관리
- 결제 내역 조회
- 시스템 통계
- 고객 지원

### 고객 지원
- 문의 접수
- 알림 시스템
- FAQ

## 도메인 설정 (선택사항)
1. Render 대시보드에서 "Custom Domains" 선택
2. 도메인 추가 및 DNS 설정
3. SSL 인증서 자동 생성

## 모니터링
- Render 대시보드에서 로그 확인
- 성능 메트릭 모니터링
- 자동 재시작 설정

배포 후 서비스는 Replit Preview와 동일하게 작동합니다.