import { calculateSaju as getSajuCore } from "./saju-api";

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
const STEMS_KOR = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const BRANCHES_KOR = [
  "자",
  "축",
  "인",
  "묘",
  "진",
  "사",
  "오",
  "미",
  "신",
  "유",
  "술",
  "해",
];

// 한글 branch → 한자 변환 맵
const KOR_TO_HANJA_BRANCH: Record<string, string> = {
  자: "子",
  축: "丑",
  인: "寅",
  묘: "卯",
  진: "辰",
  사: "巳",
  오: "午",
  미: "未",
  신: "申",
  유: "酉",
  술: "戌",
  해: "亥",
};
function toHanjaBranch(branch: string): string {
  return KOR_TO_HANJA_BRANCH[branch] || branch;
}

const GROUND_TEN_STAR_TABLE: Record<string, Record<string, string>> = {
  甲: {
    寅: "비견",
    卯: "겁재",
    巳: "식신",
    午: "상관",
    辰: "편재",
    戌: "편재",
    丑: "정재",
    未: "정재",
    申: "편관",
    酉: "정관",
    亥: "편인",
    子: "정인",
  },
  乙: {
    卯: "비견",
    寅: "겁재",
    午: "식신",
    巳: "상관",
    丑: "편재",
    未: "편재",
    辰: "정재",
    戌: "정재",
    酉: "정관",
    申: "편관",
    子: "편인",
    亥: "정인",
  },
  丙: {
    巳: "비견",
    午: "겁재",
    辰: "식신",
    未: "상관",
    戌: "식신",
    丑: "상관",
    申: "편재",
    酉: "정재",
    亥: "편관",
    子: "정관",
    寅: "편인",
    卯: "정인",
  },
  丁: {
    午: "비견",
    巳: "겁재",
    未: "식신",
    申: "정재",
    丑: "식신",
    辰: "상관",
    戌: "상관",
    酉: "편재",
    亥: "편관",
    子: "편관",
    寅: "정인",
    卯: "편인",
  },
  戊: {
    巳: "편인",
    午: "정",
    申: "식신",
    丑: "겁재",
    辰: "비견",
    戌: "비견",
    未: "겁재",
    酉: "상관",
    亥: "편재",
    子: "정재",
    寅: "편관",
    卯: "정관",
  },
  己: {
    午: "편인",
    巳: "정인",
    未: "비견",
    申: "상관",
    丑: "비견",
    子: "편재",
    辰: "겁재",
    戌: "겁재",
    酉: "식신",
    亥: "정재",
    寅: "정관",
    卯: "편관",
  },
  庚: {
    申: "비견",
    酉: "겁재",
    亥: "식신",
    子: "상관",
    寅: "편재",
    卯: "정재",
    巳: "편관",
    午: "정관",
    辰: "편인",
    戌: "편인",
    丑: "정인",
    未: "정인",
  },
  辛: {
    酉: "비견",
    申: "겁재",
    子: "식신",
    亥: "상관",
    卯: "편재",
    寅: "정재",
    午: "편관",
    巳: "정관",
    丑: "편인",
    未: "편인",
    辰: "정인",
    戌: "정인",
  },
  壬: {
    亥: "비견",
    子: "겁재",
    寅: "식신",
    卯: "상관",
    巳: "편재",
    午: "정재",
    辰: "편관",
    戌: "편관",
    丑: "정관",
    未: "정관",
    申: "편인",
    酉: "정인",
  },
  癸: {
    子: "비견",
    亥: "겁재",
    卯: "식신",
    寅: "상관",
    午: "편재",
    巳: "정재",
    丑: "편관",
    未: "편관",
    辰: "정관",
    戌: "정관",
    酉: "편인",
    申: "정인",
  },
};

// 대표 십성 (지지 기준)
function getGroundTenStar(dayStem: string, branch: string): string {
  return GROUND_TEN_STAR_TABLE[dayStem]?.[branch] || "미상";
}

// 지장간 전체 십성 (지장간 하나씩 계산)
function calcTenStarsFromHidden(dayStem: string, branch: string): string[] {
  const hiddenStems = calcHidden(branch);
  return hiddenStems.map((stem) => calcTenStarFull(dayStem, stem));
}

// 12운성

const ELEMENTS = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
const YINYANG = ["양", "음", "양", "음", "양", "음", "양", "음", "양", "음"];

function getElement(stem: string): string {
  const idx = STEMS.indexOf(stem);
  return ELEMENTS[idx];
}
function getYinYang(stem: string): "양" | "음" {
  const idx = STEMS.indexOf(stem);
  return YINYANG[idx] as "양" | "음";
}

function calcTenStarFull(dayStem: string, tgtStem: string): string {
  const eDay = getElement(dayStem);
  const eTgt = getElement(tgtStem);
  const yDay = getYinYang(dayStem);
  const yTgt = getYinYang(tgtStem);
  const sameYinYang = yDay === yTgt;
  const generates: Record<string, string> = {
    목: "화",
    화: "토",
    토: "금",
    금: "수",
    수: "목",
  };
  const controls: Record<string, string> = {
    목: "토",
    화: "금",
    토: "수",
    금: "목",
    수: "화",
  };
  if (eDay === eTgt) return sameYinYang ? "비견" : "겁재";
  if (generates[eDay] === eTgt) return sameYinYang ? "식신" : "상관";
  if (controls[eDay] === eTgt) return sameYinYang ? "편재" : "정재";
  if (controls[eTgt] === eDay) return sameYinYang ? "편관" : "정관";
  if (generates[eTgt] === eDay) return sameYinYang ? "편인" : "정인";
  return "미상";
}

const TWELVE_STAGE_MATRIX_KOR: Record<string, Record<string, string>> = {
  갑: {
    해: "장생",
    자: "목욕",
    축: "관대",
    인: "건록",
    묘: "제왕",
    진: "쇠",
    사: "병",
    오: "사",
    미: "묘",
    신: "절",
    유: "태",
    술: "양",
  },
  을: {
    오: "장생",
    사: "목욕",
    진: "관대",
    묘: "건록",
    인: "제왕",
    축: "쇠",
    자: "병",
    해: "사",
    술: "묘",
    유: "절",
    신: "태",
    미: "양",
  },
  병: {
    인: "장생",
    묘: "목욕",
    진: "관대",
    사: "건록",
    오: "제왕",
    미: "쇠",
    신: "병",
    유: "사",
    술: "묘",
    해: "절",
    자: "태",
    축: "양",
  },
  정: {
    유: "장생",
    신: "목욕",
    미: "관대",
    오: "건록",
    사: "제왕",
    진: "쇠",
    묘: "병",
    인: "사",
    축: "묘",
    자: "절",
    해: "태",
    술: "양",
  },
  무: {
    인: "장생",
    묘: "목욕",
    진: "관대",
    사: "건록",
    오: "제왕",
    미: "쇠",
    신: "병",
    유: "사",
    술: "묘",
    해: "절",
    자: "태",
    축: "양",
  },
  기: {
    유: "장생",
    신: "목욕",
    미: "관대",
    오: "건록",
    사: "제왕",
    진: "쇠",
    묘: "병",
    인: "사",
    축: "묘",
    자: "절",
    해: "태",
    술: "양",
  },
  경: {
    사: "장생",
    오: "목욕",
    미: "관대",
    신: "건록",
    유: "제왕",
    술: "쇠",
    해: "병",
    자: "사",
    축: "묘",
    인: "절",
    묘: "태",
    진: "양",
  },
  신: {
    자: "장생",
    해: "목욕",
    술: "관대",
    유: "건록",
    신: "제왕",
    미: "쇠",
    오: "병",
    사: "사",
    묘: "묘",
    인: "절",
    축: "태",
    진: "양",
  },
  임: {
    신: "장생",
    유: "목욕",
    술: "관대",
    해: "건록",
    자: "제왕",
    축: "쇠",
    인: "병",
    묘: "사",
    진: "묘",
    사: "절",
    오: "태",
    미: "양",
  },
  계: {
    묘: "장생",
    인: "목욕",
    축: "관대",
    자: "건록",
    해: "제왕",
    술: "쇠",
    유: "병",
    신: "사",
    미: "묘",
    진: "절",
    사: "태",
    오: "양",
  },
};

const KOR_TO_HANJA_STEM: Record<string, string> = {
  갑: "甲",
  을: "乙",
  병: "丙",
  정: "丁",
  무: "戊",
  기: "己",
  경: "庚",
  신: "辛",
  임: "壬",
  계: "癸",
};



const TWELVE_STAGE_MATRIX: Record<string, Record<string, string>> = {};
for (const [korStem, branchMap] of Object.entries(TWELVE_STAGE_MATRIX_KOR)) {
  const hanjaStem = KOR_TO_HANJA_STEM[korStem];
  TWELVE_STAGE_MATRIX[hanjaStem] = {};
  for (const [korBranch, stage] of Object.entries(branchMap)) {
    const hanjaBranch = KOR_TO_HANJA_BRANCH[korBranch];
    TWELVE_STAGE_MATRIX[hanjaStem][hanjaBranch] = stage;
  }
}

function calcTwelveStage(dayStem: string, branch: string): string {
  return TWELVE_STAGE_MATRIX[dayStem]?.[branch] || "미상";
}

function calcHidden(branch: string): string[] {
  const H: Record<string, string[]> = {
    子: ["癸"],
    丑: ["己", "癸", "辛"],
    寅: ["甲", "丙", "戊"],
    卯: ["乙"],
    辰: ["戊", "乙", "癸"],
    巳: ["丙", "戊", "庚"],
    午: ["丁", "己"],
    未: ["己", "丁", "乙"],
    申: ["庚", "壬", "戊"],
    酉: ["辛"],
    戌: ["戊", "辛", "丁"],
    亥: ["壬", "甲"],
  };
  return H[branch] || [];
}

const SIN_SAL_TABLE = {
  지살: { 인오술: "寅", 사유축: "巳", 신자진: "申", 해묘미: "亥" },
  년살: { 인오술: "卯", 사유축: "午", 신자진: "酉", 해묘미: "子" },
  월살: { 인오술: "辰", 사유축: "未", 신자진: "戌", 해묘미: "丑" },
  망신살: { 인오술: "巳", 사유축: "申", 신자진: "亥", 해묘미: "寅" },
  장성살: { 인오술: "午", 사유축: "酉", 신자진: "子", 해묘미: "卯" },
  반안살: { 인오술: "未", 사유축: "戌", 신자진: "丑", 해묘미: "辰" },
  역마살: { 인오술: "申", 사유축: "亥", 신자진: "寅", 해묘미: "巳" },
  육해살: { 인오술: "酉", 사유축: "子", 신자진: "卯", 해묘미: "午" },
  화개살: { 인오술: "戌", 사유축: "丑", 신자진: "辰", 해묘미: "未" },
  겁살: { 인오술: "亥", 사유축: "寅", 신자진: "巳", 해묘미: "申" },
  재살: { 인오술: "子", 사유축: "卯", 신자진: "午", 해묘미: "酉" },
  천살: { 인오술: "丑", 사유축: "辰", 신자진: "未", 해묘미: "戌" },
};

const branchGroups: Record<string, keyof (typeof SIN_SAL_TABLE)["지살"]> = {
  寅: "인오술",
  午: "인오술",
  戌: "인오술",
  巳: "사유축",
  酉: "사유축",
  丑: "사유축",
  申: "신자진",
  子: "신자진",
  辰: "신자진",
  亥: "해묘미",
  卯: "해묘미",
  未: "해묘미",
};

function calcTwelveSinSal(
  yearBranch: string,
  monthBranch: string,
  dayBranch: string,
  hourBranch: string,
): {
  year: string[];
  month: string[];
  day: string[];
  hour: string[];
} {
  const group = branchGroups[yearBranch];
  if (!group) return { year: [], month: [], day: [], hour: [] };

  const result = { year: [], month: [], day: [], hour: [] };

  for (const [sinSal, targets] of Object.entries(SIN_SAL_TABLE) as [
    keyof typeof SIN_SAL_TABLE,
    Record<keyof typeof branchGroups, string>,
  ][]) {
    const targetBranch = targets[group];
    if (monthBranch === targetBranch) result.month.push(sinSal);
    if (dayBranch === targetBranch) result.day.push(sinSal);
    if (hourBranch === targetBranch) result.hour.push(sinSal);
    if (yearBranch === targetBranch) result.year.push(sinSal);
  }

  return result;
}

export async function calculateSaju(input: {
  birthDate: string;
  birthTime: string;
  calendarType: "solar" | "lunar";
  isLeapMonth: boolean;
  solarDate?: string;
  lunarDate?: string;
}) {
  let core;
  try {
    core = await getSajuCore({
      birthDate: input.birthDate,
      birthTime: input.birthTime,
      calendarType: input.calendarType,
      isLeapMonth: input.isLeapMonth,
    });
  } catch (error) {
    throw error;
  }

  const dayStemIndex = STEMS.indexOf(core.dayStem);
  if (dayStemIndex === -1) throw new Error("dayStemIndex가 유효하지 않습니다.");

  // branch 한글 → 한자 변환
  const yearBranchHanja = toHanjaBranch(core.yearBranch);
  const monthBranchHanja = toHanjaBranch(core.monthBranch);
  const dayBranchHanja = toHanjaBranch(core.dayBranch);
  const hourBranchHanja = toHanjaBranch(core.hourBranch);

  const twelveSinSalResult = calcTwelveSinSal(
    yearBranchHanja,
    monthBranchHanja,
    dayBranchHanja,
    hourBranchHanja,
  );

  const makePillar = (
    stem: string,
    branch: string,
    pillarType: "year" | "month" | "day" | "hour",
  ) => {
    const stemIdx = STEMS.indexOf(stem);
    const branchIdx = BRANCHES.indexOf(toHanjaBranch(branch));
    const hiddenStems = calcHidden(toHanjaBranch(branch));

    return {
      stem,
      branch,
      stemKor: STEMS_KOR[stemIdx],
      branchKor: BRANCHES_KOR[branchIdx],
      tenStar:
        stem === core.dayStem ? "일광" : calcTenStarFull(core.dayStem, stem),
      groundTenStar: getGroundTenStar(core.dayStem, toHanjaBranch(branch)),
      hiddenStems,
      hiddenTenStars: calcTenStarsFromHidden(
        core.dayStem,
        toHanjaBranch(branch),
      ),
      twelveStage: calcTwelveStage(core.dayStem, toHanjaBranch(branch)),

      twelveSinSal: twelveSinSalResult[pillarType],
    };
  };

  const year = makePillar(core.yearStem, core.yearBranch, "year");
  const month = makePillar(core.monthStem, core.monthBranch, "month");
  const day = makePillar(core.dayStem, core.dayBranch, "day");
  const hour = makePillar(core.hourStem, core.hourBranch, "hour");

  const result = {
    year,
    month,
    day,
    hour,
    solarDate: input.solarDate || input.birthDate,
    lunarDate: input.lunarDate || input.birthDate,
    isLeapMonth: input.isLeapMonth,
  };

  // 콘솔 출력
  console.log("🔍 사주 분석 결과");
  ["year", "month", "day", "hour"].forEach((pillarType) => {
    const p = result[pillarType as "year" | "month" | "day" | "hour"];
    console.log(
      `\n📌 ${pillarType.toUpperCase()}柱: ${p.stemKor}${p.branchKor} (${p.stem}${p.branch})`,
    );
    console.log(`- 십성: ${p.tenStar}`);
    console.log(`- 지지 십성(지장간 기준): ${p.groundTenStar}`);
    console.log(`- 지장간: ${p.hiddenStems.join(", ")}`);
    console.log(`- 지장간 십성: ${p.hiddenTenStars.join(", ")}`);
    console.log(`- 12운성: ${p.twelveStage}`);
    console.log(
      `- 12신살: ${p.twelveSinSal.length ? p.twelveSinSal.join(", ") : "없음"}`,
    );
  }); // ← ✅ 여기에 세미콜론과 닫는 괄호가 꼭 필요함

  return result; // ← ✅ 반드시 forEach 바깥에 위치해야 함
}
