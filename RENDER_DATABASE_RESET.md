# Render 데이터베이스 전환 가이드

## 현재 문제
- Render 운영 환경이 기존 snake_case 데이터베이스를 사용 중
- 새로운 camelCase 데이터베이스(everyunse-db-new)로 전환 필요

## 해결 방법

### 1. Render 대시보드 접속
1. https://dashboard.render.com 로그인
2. "everyunse" 서비스 클릭

### 2. 환경 변수 업데이트
1. "Environment" 탭 클릭
2. DATABASE_URL 찾기
3. 새 데이터베이스 URL로 변경:
   ```
   postgresql://everyunse_db_new_user:PASSWORD@dpg-ADDRESS-a.oregon-postgres.render.com/everyunse_db_new
   ```

### 3. 관련 환경 변수들도 업데이트
- PGDATABASE=everyunse_db_new
- PGUSER=everyunse_db_new_user
- PGHOST=dpg-ADDRESS-a.oregon-postgres.render.com

### 4. 서비스 재배포
1. "Manual Deploy" → "Deploy latest commit"
2. 배포 로그에서 스키마 체크 성공 확인

## 확인 방법
배포 완료 후:
- https://everyunse.onrender.com/api/service-prices (7개 서비스 반환)
- https://everyunse.onrender.com/api/debug/schema (스키마 정보 반환)

## 새 데이터베이스 특징
- 21개 테이블 모두 camelCase 컬럼명
- servicePrices, sajuAnalyses 등 정확한 테이블명
- displayOrder 컬럼 포함