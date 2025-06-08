# EVERYUNSE (에브리운세)

AI 기반 한국 전통 사주 분석 플랫폼

## 기술 스택

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: OpenAI GPT-4
- **Payment**: PortOne V1 + KG이니시스
- **Deployment**: Render

## 주요 기능

- 7가지 사주 분석 서비스 (총운, 애정운, 직업운, 궁합분석 등)
- AI 기반 개인화된 운세 분석
- 냥(포인트) 기반 결제 시스템
- 실시간 결제 처리 (KG이니시스)
- 관리자 대시보드
- 고객 지원 시스템

## 환경 변수

프로덕션 배포를 위해 다음 환경 변수가 필요합니다:

```env
# Database
DATABASE_URL=postgresql://...

# OpenAI
OPENAI_API_KEY=sk-...

# Korean Astronomical Observatory API
KASI_API_KEY=...
KASI_LUNAR_API_KEY=...

# PortOne Payment
VITE_PORTONE_STORE_ID=imp25772872
VITE_PORTONE_CHANNEL_KEY=...
PORTONE_API_KEY=...
PORTONE_API_SECRET=...

# Session
SESSION_SECRET=...

# Server
NODE_ENV=production
PORT=10000
```

## Render 배포 설정

1. **GitHub 연결**: https://github.com/ejcompany0511/everyunse
2. **빌드 명령어**: `npm ci && npm run build`
3. **시작 명령어**: `npm start`
4. **환경 변수**: 위의 모든 환경 변수 설정
5. **데이터베이스**: PostgreSQL 인스턴스 연결

## 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 데이터베이스 마이그레이션
npm run db:push
```

## 프로젝트 구조

```
├── client/          # React 프론트엔드
├── server/          # Express 백엔드
├── shared/          # 공유 타입 및 스키마
├── .github/         # GitHub Actions 워크플로우
└── render.yaml      # Render 배포 설정
```

## 사업자 정보

- **상호**: 이제이
- **대표자**: 조민철외 1명
- **사업자등록번호**: 219-44-01233
- **주소**: 서울특별시 중랑구 동일로149길 69-20(묵동)
- **이메일**: ejcompany0511@gmail.com