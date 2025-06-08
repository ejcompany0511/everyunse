

import { XMLParser } from "fast-xml-parser";
const SOLAR_TERM_TO_MONTH_BRANCH: Record<string, string> = {
  입춘: "寅", 우수: "寅",
  경칩: "卯", 춘분: "卯",
  청명: "辰", 곡우: "辰",
  입하: "巳", 소만: "巳",
  망종: "午", 하지: "午",
  소서: "未", 대서: "未",
  입추: "申", 처서: "申",
  백로: "酉", 추분: "酉",
  한로: "戌", 상강: "戌",
  입동: "亥", 소설: "亥",
  대설: "子", 동지: "子",
  소한: "丑", 대한: "丑",
};
const TERM_BOUNDARIES = [
  { name: "입춘", month: 2, day: 4, branch: "寅" },
  { name: "경칩", month: 3, day: 6, branch: "卯" },
  { name: "청명", month: 4, day: 5, branch: "辰" },
  { name: "입하", month: 5, day: 5, branch: "巳" },
  { name: "망종", month: 6, day: 6, branch: "午" },
  { name: "소서", month: 7, day: 7, branch: "未" },
  { name: "입추", month: 8, day: 7, branch: "申" },
  { name: "백로", month: 9, day: 8, branch: "酉" },
  { name: "한로", month: 10, day: 8, branch: "戌" },
  { name: "입동", month: 11, day: 7, branch: "亥" },
  { name: "대설", month: 12, day: 7, branch: "子" },
  { name: "소한", month: 1, day: 6, branch: "丑" },
];
export function getMonthBranchByDate(date: Date): string {
  const y = date.getFullYear();

  // 기준일 배열을 만들고, 날짜를 비교해서 가장 마지막에 해당하는 절기를 선택
  const boundaries = TERM_BOUNDARIES.map(({ name, month, day, branch }, index) => {
    const startDate = new Date(y, month - 1, day); // 해당 절기 시작일
    const endDate = index + 1 < TERM_BOUNDARIES.length
      ? new Date(y, TERM_BOUNDARIES[index + 1].month - 1, TERM_BOUNDARIES[index + 1].day - 1) // 다음 절기 전날
      : new Date(y + 1, 0, 6); // 마지막 절기의 경우, 다음 해 1월 6일을 종료일로 설정 (예: 소한 종료)

    return { name, startDate, endDate, branch };
  });

  // 날짜가 절기 범위에 포함되는지 확인
  for (let i = 0; i < boundaries.length; i++) {
    if (date >= boundaries[i].startDate && date < boundaries[i].endDate) {
      return boundaries[i].branch;
    }
  }

  // 날짜가 어느 절기에도 포함되지 않으면 기본값 반환
  return "未"; // 예시로 "未" 반환 (범위 밖의 날짜 처리)
}
// 🌙 연간 + 절기 조합 → 월간
// 연간(천간) + 월지 → 월간(천간)
const YEAR_STEM_BRANCH_TO_MONTH_STEM: Record<string, string> = {
  '甲:寅': '丙', '甲:卯': '丁', '甲:辰': '戊', '甲:巳': '己', '甲:午': '庚',
  '甲:未': '辛', '甲:申': '壬', '甲:酉': '癸', '甲:戌': '甲', '甲:亥': '乙',
  '甲:子': '丙', '甲:丑': '丁',

  '乙:寅': '戊', '乙:卯': '己', '乙:辰': '庚', '乙:巳': '辛', '乙:午': '壬',
  '乙:未': '癸', '乙:申': '甲', '乙:酉': '乙', '乙:戌': '丙', '乙:亥': '丁',
  '乙:子': '戊', '乙:丑': '己',

  '丙:寅': '庚', '丙:卯': '辛', '丙:辰': '壬', '丙:巳': '癸', '丙:午': '甲',
  '丙:未': '乙', '丙:申': '丙', '丙:酉': '丁', '丙:戌': '戊', '丙:亥': '己',
  '丙:子': '庚', '丙:丑': '辛',

  '丁:寅': '壬', '丁:卯': '癸', '丁:辰': '甲', '丁:巳': '乙', '丁:午': '丙',
  '丁:未': '丁', '丁:申': '戊', '丁:酉': '己', '丁:戌': '庚', '丁:亥': '辛',
  '丁:子': '壬', '丁:丑': '癸',

  '戊:寅': '甲', '戊:卯': '乙', '戊:辰': '丙', '戊:巳': '丁', '戊:午': '戊',
  '戊:未': '己', '戊:申': '庚', '戊:酉': '辛', '戊:戌': '壬', '戊:亥': '癸',
  '戊:子': '甲', '戊:丑': '乙',

  '己:寅': '丙', '己:卯': '丁', '己:辰': '戊', '己:巳': '己', '己:午': '庚',
  '己:未': '辛', '己:申': '壬', '己:酉': '癸', '己:戌': '甲', '己:亥': '乙',
  '己:子': '丙', '己:丑': '丁',

  '庚:寅': '戊', '庚:卯': '己', '庚:辰': '庚', '庚:巳': '辛', '庚:午': '壬',
  '庚:未': '癸', '庚:申': '甲', '庚:酉': '乙', '庚:戌': '丙', '庚:亥': '丁',
  '庚:子': '戊', '庚:丑': '己',

  '辛:寅': '庚', '辛:卯': '辛', '辛:辰': '壬', '辛:巳': '癸', '辛:午': '甲',
  '辛:未': '乙', '辛:申': '丙', '辛:酉': '丁', '辛:戌': '戊', '辛:亥': '己',
  '辛:子': '庚', '辛:丑': '辛',

  '壬:寅': '壬', '壬:卯': '癸', '壬:辰': '甲', '壬:巳': '乙', '壬:午': '丙',
  '壬:未': '丁', '壬:申': '戊', '壬:酉': '己', '壬:戌': '庚', '壬:亥': '辛',
  '壬:子': '壬', '壬:丑': '癸',

  '癸:寅': '甲', '癸:卯': '乙', '癸:辰': '丙', '癸:巳': '丁', '癸:午': '戊',
  '癸:未': '己', '癸:申': '庚', '癸:酉': '辛', '癸:戌': '壬', '癸:亥': '癸',
  '癸:子': '甲', '癸:丑': '乙',
};

function getMonthGanzhiBySolarTerms(
  solarDate: Date,
  solarTerms: { name: string; date: Date }[],
): string {
  let selectedTerm = solarTerms[0];

  for (let i = 0; i < solarTerms.length; i++) {
    if (solarDate >= solarTerms[i].date) {
      selectedTerm = solarTerms[i];
    } else {
      break;
    }
  }

  return SOLAR_TERM_TO_MONTH_GANZHI[selectedTerm.name] || "정축"; // 기본값
}
const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
];

/**
 * 그레고리력(양력) y-m-d → Julian Day Number(JDN) 계산
 */

function toJDN(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const Y = y + 4800 - a;
  const M = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * M + 2) / 5) +
    365 * Y +
    Math.floor(Y / 4) -
    Math.floor(Y / 100) +
    Math.floor(Y / 400) -
    32045
  );
}

/**
 * 24절기 API: 해당 연도(y)·월(m) 중 "입춘" 날짜(절기)만 뽑아서 YYYYMMDD 형태로 반환
 */

async function getSolarTermDate(year: number, month: number): Promise<string> {
  const serviceKey = process.env.KASI_SOLAR_TERM_KEY || "";
  const url = `https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/get24DivisionsInfo?serviceKey=${serviceKey}&solYear=${year}&solMonth=${String(month).padStart(2, "0")}`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(2000) // 2초 타임아웃
  });
  const text = await res.text();
  const parser = new XMLParser();
  const data = parser.parse(text);

  const itemNode = data.response?.body?.items?.item;
  let locdate = "";

  if (Array.isArray(itemNode) && itemNode.length > 0) {
    // 배열로 넘어오면 "입춘"이라는 termName을 가진 객체를 우선 찾고,
    // 없으면 -----> (배열 첫 번째 요소의 locdate를 디폴트로 잡음)
    const found = itemNode.find(
      (it: any) => it.termName && it.termName.includes("입춘"),
    );
    if (found && found.locdate) {
      locdate = found.locdate; // ex: "20250204"
    } else {
      locdate = itemNode[0]?.locdate || "";
    }
  } else if (typeof itemNode === "object" && itemNode !== null) {
    locdate = (itemNode as any).locdate;
  }

  return locdate; // "YYYYMMDD"
}
import { XMLParser } from "fast-xml-parser";

export async function getSolarTermsAll(
  year: number
): Promise<{ name: string; date: Date }[]> {
  const serviceKey = process.env.KASI_SOLAR_TERM_KEY || "";
  const parser = new XMLParser();
  const allTerms: { name: string; date: Date }[] = [];

  for (let month = 1; month <= 12; month++) {
    const url = `https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/get24DivisionsInfo?serviceKey=${serviceKey}&solYear=${year}&solMonth=${String(month).padStart(2, "0")}`;

    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(2000) // 2초 타임아웃
      });
      const text = await res.text();
      const data = parser.parse(text);

      const itemNode = data?.response?.body?.items?.item;

      if (!itemNode) {
        console.warn(`❗ [${year}년 ${month}월] 절기 항목 없음.`);
        continue;
      }

      const items = Array.isArray(itemNode) ? itemNode : [itemNode];

      for (const item of items) {
        const name = item.termName;
        const locdate = item.locdate;

        if (!name || !locdate) {
          console.warn(`⚠️ 누락된 termName 또는 locdate:`, item);
          continue;
        }

        const date = new Date(
          Number(locdate.slice(0, 4)),
          Number(locdate.slice(4, 6)) - 1,
          Number(locdate.slice(6, 8))
        );

        allTerms.push({ name, date });
      }
    } catch (err) {
      console.error(`🚨 ${year}년 ${month}월 절기 API 오류`, err);
    }
  }

  allTerms.sort((a, b) => a.date.getTime() - b.date.getTime());
  return allTerms;
}

/**
 * 양력 → 음력 변환 (KASI API)
 * @param solar "YYYY-MM-DD" 포맷 문자열
 * @returns Promise<string | { lunarDate: string; isLeapMonth: boolean }>
 *   - 성공 시 { lunarDate: "YYYY-MM-DD", isLeapMonth: boolean } 객체 반환
 *   - 실패 시 원본 solar 문자열("YYYY-MM-DD") 반환
 */

async function convertSolarToLunar(
  solar: string,
): Promise<string | { lunarDate: string; isLeapMonth: boolean }> {
  try {
    const serviceKey = process.env.KASI_API_KEY || "";
    const solarDate = solar.replace(/-/g, ""); // "20250615"
    const year = solarDate.substring(0, 4);
    const month = solarDate.substring(4, 6);
    const day = solarDate.substring(6, 8);

    const encodedServiceKey = encodeURIComponent(serviceKey);
    const url = `https://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService/getLunCalInfo?serviceKey=${encodedServiceKey}&solYear=${year}&solMonth=${month}&solDay=${day}`;
    console.log("양력→음력 변환 API 호출:", url);

    const res = await fetch(url, {
      signal: AbortSignal.timeout(2000) // 2초 타임아웃
    });
    const xmlText = await res.text();
    console.log("양력→음력 변환 API 응답:", xmlText);

    const parser = new XMLParser();
    const data = parser.parse(xmlText);
    const item = data.response?.body?.items?.item;

    // item이 배열일 수도 있고, 단일 객체일 수도 있으니 분기
    let lunYear: string | undefined;
    let lunMonth: string | undefined;
    let lunDay: string | undefined;
    let lunLeapmonth: string | undefined;

    if (Array.isArray(item)) {
      lunYear = item[0]?.lunYear;
      lunMonth = item[0]?.lunMonth;
      lunDay = item[0]?.lunDay;
      lunLeapmonth = item[0]?.lunLeapmonth;
    } else if (typeof item === "object" && item !== null) {
      lunYear = item.lunYear;
      lunMonth = item.lunMonth;
      lunDay = item.lunDay;
      lunLeapmonth = item.lunLeapmonth;
    }

    if (!lunYear || !lunMonth || !lunDay) {
      console.log("양력→음력 변환 실패: 빈값 반환, 로컬 변환 사용");
      // 로컬 근사 변환 사용 (정확하지 않지만 기본 동작 유지)
      return convertSolarToLunarApproximate(solar);
    }

    const lunarMonthNum = Number(lunMonth);
    const lunarDayNum = Number(lunDay);
    const lunarDate = `${lunYear}-${String(lunarMonthNum).padStart(2, "0")}-${String(lunarDayNum).padStart(2, "0")}`;
    // lunLeapmonth: "1"(윤달), "0"(평달) 또는 "윤" 등 API 문서에 따라 다름. 반드시 확인 필요.
    const isLeapMonth = lunLeapmonth === "1" || lunLeapmonth === "윤";

    console.log("양력→음력 변환 결과:", { lunarDate, isLeapMonth });
    return { lunarDate, isLeapMonth };
  } catch (error) {
    console.error("양력→음력 변환 오류:", error);
    return convertSolarToLunarApproximate(solar);
  }
}

// 로컬 근사 음력 변환 (API 실패 시 사용)
function convertSolarToLunarApproximate(solar: string): { lunarDate: string; isLeapMonth: boolean } {
  // 간단한 근사 계산 - 실제로는 정확하지 않지만 기본 동작 유지
  const date = new Date(solar);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 대략적인 음력 날짜 계산 (약 29일 차이)
  const lunarMonth = month;
  const lunarDay = Math.max(1, day - 18);
  
  return {
    lunarDate: `${year}-${String(lunarMonth).padStart(2, "0")}-${String(lunarDay).padStart(2, "0")}`,
    isLeapMonth: false
  };
}
// 십간(천간)
const STEMS_KOR_TO_HAN: Record<string, string> = {
  "갑": "甲", "을": "乙", "병": "丙", "정": "丁", "무": "戊",
  "기": "己", "경": "庚", "신": "辛", "임": "壬", "계": "癸"
};

// 십이지(지지)
const BRANCHES_KOR_TO_HAN: Record<string, string> = {
  "자": "子", "축": "丑", "인": "寅", "묘": "卯", "진": "辰", "사": "巳",
  "오": "午", "미": "未", "신": "申", "유": "酉", "술": "戌", "해": "亥"
};

export async function getLunIljinFromSolarDate(solarDate: string): Promise<string | null> {
  try {
    const serviceKey = process.env.KASI_API_KEY || "";
    const [year, month, day] = solarDate.split("-");
     const url = `https://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService/getLunCalInfo?serviceKey=${serviceKey}&solYear=${year}&solMonth=${month}&solDay=${day}`;


    const res = await fetch(url, {
      signal: AbortSignal.timeout(2000) // 2초 타임아웃
    });
    const text = await res.text();

    const parser = new XMLParser();
    const data = parser.parse(text);
    const item = data?.response?.body?.items?.item;

    let lunIljinRaw: string | undefined;

    if (Array.isArray(item)) {
      lunIljinRaw = item[0]?.lunIljin;
    } else if (typeof item === "object" && item !== null) {
      lunIljinRaw = item.lunIljin;
    }

    if (!lunIljinRaw) {
      console.warn("⚠️ lunIljin 항목 없음 또는 빈값:", item);
      return null;
    }

    // 예: "기유(己酉)" → 한글 두 글자만 추출
    const match = lunIljinRaw.match(/^([가-힣]{2})/);
    const lunIljin = match ? match[1] : null;

    console.log("✅ Extracted lunIljin:", lunIljin); // 여기서 실제 추출된 값 로그로 확인

    return lunIljin;
  } catch (err) {
    console.error("🚨 일주 조회 오류:", err);
    return null;
  }
}

// 일주 한글 → 한자로 변환
function convertKoreanIljinToHanja(lunIljin: string): { dayStem: string; dayBranch: string; pillar: string } | null {
  if (!lunIljin || typeof lunIljin !== "string" || lunIljin.length < 2) return null;

  const [korStem, korBranch] = [...lunIljin]; // 배열로 잘라서 문자 추출 (길이 안정)
  const dayStem = STEMS_KOR_TO_HAN[korStem];
  const dayBranch = BRANCHES_KOR_TO_HAN[korBranch];

  if (!dayStem || !dayBranch) return null;

  return {
    dayStem,
    dayBranch,
    pillar: `${dayStem}${dayBranch}`,
  };
}


/**
 * 음력 → 양력 변환 (KASI API)
 * @param lunar "YYYY-MM-DD" 포맷의 음력 날짜
 * @param isLeap 윤달 여부 (true면 윤달)
 * @returns Promise<string | { solarDate: string; kasiGanzi: { yearPillar: string; monthPillar: string; dayPillar: string;} }>
 *   - 성공 시 간지 정보(yearPillar, monthPillar, dayPillar)까지 포함된 객체 반환
 *   - 실패 시 입력된 lunar 문자열("YYYY-MM-DD") 반환
 */

export async function calculateSaju(input: {
  birthDate: string; // ex: "2025-06-15" or "20250615"
  birthTime: string; // ex: "14:30" or "1430"
  calendarType: "solar" | "lunar";
  isLeapMonth: boolean;
}) {
  const { calendarType, isLeapMonth } = input;
  let birthDate = input.birthDate;
  let birthTime = input.birthTime;

  let lunarDate = "";
  let solarDate = birthDate;
  let opsiGanzi: null | {
    yearPillar: string;
    monthPillar: string;
    dayPillar: string;
  } = null;

  // 📌 1) 음양력 변환
  if (calendarType === "lunar") {
    const result = await convertLunarToSolar(birthDate, isLeapMonth);
    if (typeof result === "object") {
      solarDate = result.solarDate;
      opsiGanzi = result.kasiGanzi;
      lunarDate = birthDate;
    } else {
      solarDate = result;
      lunarDate = birthDate;
    }
    birthDate = solarDate;
  } else {
    const lunarRes = await convertSolarToLunar(birthDate);
    lunarDate = typeof lunarRes === "object" ? lunarRes.lunarDate : lunarRes;
    solarDate = birthDate;
  }

  // 📌 2) 날짜·시간 파싱
  const [y, m, d] = birthDate.includes("-")
    ? birthDate.split("-").map(Number)
    : [
        Number(birthDate.slice(0, 4)),
        Number(birthDate.slice(4, 6)),
        Number(birthDate.slice(6, 8)),
      ];

  const hh = birthTime.includes(":")
    ? Number(birthTime.split(":")[0])
    : Number(birthTime.slice(0, 2));

  // 📌 3) 월주(절기 기준)
  let monthStem = "", monthBranch = "";
  let yearStemIndex = 0;
  let yearStem = "";

  try {
    const birthDateObj = new Date(y, m - 1, d);  // ← 날짜 객체 생성

    // 🌿 월지 계산: 사전 정의된 TERM_BOUNDARIES 기준
    monthBranch = getMonthBranchByDate(birthDateObj);
    console.log("월지 (Month Branch) for the date", birthDateObj, "is:", monthBranch);

    // 🌿 월간 계산: 연간 + 월지 조합으로 결정
    yearStemIndex = ((y - 4) % 10 + 10) % 10;
    yearStem = STEMS[yearStemIndex];
    const key = `${yearStem}:${monthBranch}`;

    console.log("Year Stem:", yearStem);
    console.log("Key for Month Stem calculation:", key);

    if (YEAR_STEM_BRANCH_TO_MONTH_STEM.hasOwnProperty(key)) {
      monthStem = YEAR_STEM_BRANCH_TO_MONTH_STEM[key];
    } else {
      console.warn("📛 월간 매핑 실패:", key);
      monthStem = "丙"; // fallback value
    }

  } catch (err) {
    console.error("Error occurred while calculating month branch and stem:", err);
  }

  // 📌 4) 연주
  yearStemIndex = ((y - 4) % 10 + 10) % 10;
  const yearBranchIndex = (((y - 4) % 12) + 12) % 12;
  yearStem = STEMS[yearStemIndex];
  const yearBranch = BRANCHES[yearBranchIndex];

  // 📌 5) 일주 계산 (1900-01-01 = 庚子 기준)
  // 📌 5) 일주 계산 (KASI API 기반 LunIljin만 사용)
  const lunIljin = await getLunIljinFromSolarDate(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);

  if (!lunIljin) {
    throw new Error("❌ LunIljin(일주) 값을 API에서 가져오지 못했습니다.");
  }

  const hanja = convertKoreanIljinToHanja(lunIljin);
  if (!hanja) {
    throw new Error(`❌ 한글 일주 변환 실패: "${lunIljin}"`);
  }

  const { dayStem, dayBranch, pillar: dayPillar } = hanja;
  
  // 📌 6) 시주 계산
  const hourBranchIndex = Math.floor((hh + 1) / 2) % 12;
  const hourBranch = BRANCHES[hourBranchIndex];
  const dayStemIndex = STEMS.indexOf(dayStem);
  const hourStem = STEMS[((dayStemIndex % 5) * 2 + hourBranchIndex + 10) % 10];

  // 📌 7) 만약 KASI API로 얻은 간지가 있으면 우선 사용
  if (opsiGanzi) {
    return {
      yearStem: opsiGanzi.yearPillar.charAt(0),
      yearBranch: opsiGanzi.yearPillar.charAt(1),
      monthStem,
      monthBranch ,
      dayStem: opsiGanzi.dayPillar.charAt(0),
      dayBranch: opsiGanzi.dayPillar.charAt(1),
      hourStem,
      hourBranch,
      solarDate,
      lunarDate,
      isLeapMonth,
    };
  }

  return {
    yearStem,
    yearBranch,
    monthStem,
    monthBranch,
    dayStem,
    dayBranch,
    hourStem,
    hourBranch,
    solarDate,
    lunarDate,
    isLeapMonth,
  };
}

