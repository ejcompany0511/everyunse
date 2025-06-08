// Korean Standard Time utilities - 전체 서비스 표준 시간 시스템

// 현재 한국 시간 반환
export function getKoreanDate(): Date {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}

// 한국 시간 기준 오늘 00:00:00
export function getKoreanTodayStart(): Date {
  const koreanNow = getKoreanDate();
  return new Date(koreanNow.getFullYear(), koreanNow.getMonth(), koreanNow.getDate(), 0, 0, 0, 0);
}

// 한국 시간 기준 오늘 23:59:59
export function getKoreanTodayEnd(): Date {
  const koreanNow = getKoreanDate();
  return new Date(koreanNow.getFullYear(), koreanNow.getMonth(), koreanNow.getDate(), 23, 59, 59, 999);
}

// 한국 시간 기준 내일 00:00:00
export function getKoreanTomorrowStart(): Date {
  const koreanNow = getKoreanDate();
  const tomorrow = new Date(koreanNow);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0, 0);
}

// 날짜를 한국 시간 문자열로 포맷 (YYYY-MM-DD)
export function formatKoreanDate(date: Date): string {
  return getKoreanDate().toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\./g, '-').replace(/ /g, '').slice(0, -1);
}

// 날짜시간을 한국 시간 문자열로 포맷
export function formatKoreanDateTime(date: Date): string {
  return new Date(date).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// UTC Date를 한국 시간 Date로 변환
export function convertToKoreanTime(utcDate: Date): Date {
  return new Date(utcDate.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}

// 현재 한국 시간 문자열 반환 (실시간)
export function getCurrentKoreanTimeString(): string {
  return getKoreanDate().toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}