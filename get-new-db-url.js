#!/usr/bin/env node

// Script to help find the correct new database URL

console.log('새 데이터베이스 URL 확인 방법:');
console.log('================================');
console.log('');
console.log('1. Render 대시보드에서 "Databases" 섹션으로 이동');
console.log('2. "everyunse-db-new" 데이터베이스 클릭');
console.log('3. "Connect" 탭 선택');
console.log('4. "External Database URL" 복사');
console.log('');
console.log('새 URL 형태 예시:');
console.log('postgresql://everyunse_db_new_user:PASSWORD@dpg-XXXX-a.oregon-postgres.render.com/everyunse_db_new');
console.log('');
console.log('현재 기존 URL:');
console.log('postgresql://everyunse:PfBTExNAqqIMn6EF5ZA55QFXSV5a3jNN@dpg-d12tgqruibrs73fjvd30-a.oregon-postgres.render.com/everyunse_prod_3zvq');
console.log('');
console.log('⚠️  반드시 새 데이터베이스 URL로 교체해야 camelCase 스키마가 작동합니다!');