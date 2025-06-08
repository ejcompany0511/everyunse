import OpenAI from "openai";
import { calculateSaju } from "./saju-calculator";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

// 4번: 캐싱 시스템 - 같은 생년월일/시간의 기본 사주 계산 결과 캐싱
interface SajuCache {
  [key: string]: {
    sajuResult: any;
    timestamp: number;
  };
}

const sajuCache: SajuCache = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간 캐시

function getCachedSaju(birthData: any): any | null {
  const cacheKey = `${birthData.date}_${birthData.time}_${birthData.gender}_${birthData.calendarType}`;
  const cached = sajuCache[cacheKey];
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log("🚀 캐시에서 사주 정보 로드:", cacheKey);
    return cached.sajuResult;
  }
  
  return null;
}

function cacheSaju(birthData: any, sajuResult: any): void {
  const cacheKey = `${birthData.date}_${birthData.time}_${birthData.gender}_${birthData.calendarType}`;
  sajuCache[cacheKey] = {
    sajuResult,
    timestamp: Date.now()
  };
  console.log("💾 사주 정보 캐시 저장:", cacheKey);
}

interface BirthData {
  date: string;
  time: string;
  gender: string;
  calendarType: string; // 양력/음력
  isLeapMonth: boolean; // 윤달 여부
  birthCountry: string; // 출생 국가/지역
  timezone: string; // 시간대
}

interface SajuAnalysisResult {
  fourPillars: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  sajuCalculation: {
    year: { stem: string; branch: string; stemKor: string; branchKor: string; };
    month: { stem: string; branch: string; stemKor: string; branchKor: string; };
    day: { stem: string; branch: string; stemKor: string; branchKor: string; };
    hour: { stem: string; branch: string; stemKor: string; branchKor: string; };
    solarDate: string;
    lunarDate: string;
    isLeapMonth: boolean;
  };
  elements: {
    primary: string;
    secondary: string;
    weakness: string;
  };
  personality: {
    strengths: string[];
    weaknesses: string[];
    characteristics: string[];
  };
  fortune: {
    overall?: string;
    love?: string;
    career?: string;
    wealth?: string;
    health?: string;
    study?: string;
    family?: string;
  };
  recommendations: string[];
}

interface CareerAnalysisResult {
  suitableJobs: string[];
  strengths: string[];
  compatibleFields: string[];
  workStyle: string;
  leadership: string;
  teamwork: string;
  recommendations: string[];
}

// 실시간 한국 시간 가져오기 함수
async function getKoreanDateTime(): Promise<{ date: string; month: string; fullDateTime: string }> {
  try {
    // World Time API를 사용하여 정확한 한국 시간 가져오기
    const response = await fetch('http://worldtimeapi.org/api/timezone/Asia/Seoul', {
      signal: AbortSignal.timeout(2000) // 2초 타임아웃
    });
    
    if (response.ok) {
      const data = await response.json();
      const koreanTime = new Date(data.datetime);
      
      const date = koreanTime.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      });
      
      const month = koreanTime.toLocaleDateString('ko-KR', {
        month: 'long'
      });
      
      const fullDateTime = koreanTime.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: 'numeric',
        minute: 'numeric'
      });
      
      return { date, month, fullDateTime };
    }
  } catch (error) {
    console.log('외부 API 오류, 로컬 시간 사용:', error);
  }
  
  // Fallback: 로컬 시간 사용 (Asia/Seoul 타임존)
  const now = new Date();
  const options = { timeZone: 'Asia/Seoul' };
  
  const date = now.toLocaleDateString('ko-KR', { 
    ...options,
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const month = now.toLocaleDateString('ko-KR', { 
    ...options,
    month: 'long' 
  });
  
  const fullDateTime = now.toLocaleDateString('ko-KR', {
    ...options,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric'
  });
  
  return { date, month, fullDateTime };
}

async function getDetailedPromptByType(analysisType: string, sajuInfo: string, partnerSajuInfo?: string): Promise<string> {
  // 실시간 한국 시간 가져오기
  const { date: koreanDate, month: koreanMonth } = await getKoreanDateTime();

  const basePrompt = `당신은 사주명리학 전문가입니다. 반드시 모든 응답을 한국어로만 작성해주세요. 영어는 절대 사용하지 마세요.

***중요*** 현재 날짜는 ${koreanDate}이고, 현재 달은 ${koreanMonth}입니다. 분석할 때 정확한 현재 시점을 기준으로 작성해주세요.

***마크다운 금지*** ### 같은 마크다운 문법을 사용하지 마세요. 일반 텍스트로만 작성해주세요.`;
  
  switch (analysisType) {
    case 'monthly':
      return `${basePrompt} 아래 사주팔자 정보를 바탕으로 "이번 달 운세"를 최소 3000자 이상의 매우 상세하고 구체적인 분량으로 분석해주세요.

***중요 지침*** 
- 2500-3000자 분량으로 적절하게 작성하세요
- 각 문단은 150자 내외로 적절히 작성하세요
- 1, 2, 3, 4, 5, 6 같은 숫자 목록이나 번호 매기기를 절대 사용하지 마세요
- 자연스러운 문단 형태로만 작성하세요
- 마크다운이나 특수 기호도 사용하지 마세요
- 절대로 "fortune2", "fortune3", "fortune4" 같은 영어 키를 사용하지 마세요

당신의 사주를 통해 이번 달 운세를 분석해보겠습니다.

이번 달 전체적인 운세와 기운의 흐름을 살펴보면... (약 600자 분량의 전반적인 운세 분석)

재물운과 직업운의 변화를 분석해보면... (약 600자 분량의 재물운과 직업운 분석)

건강운과 인간관계의 흐름을 종합해보면... (약 600자 분량의 건강운과 인간관계 분석)

이번 달 주의사항과 좋은 기회를 정리하면... (약 500자 분량의 주의사항과 기회 정리)

위의 모든 내용을 하나의 긴 텍스트로 연결하여 "monthly" 필드에 넣어주세요.

[사주 정보]
${sajuInfo}

반드시 한국어로만 응답하고, 다음 JSON 형식으로 응답해주세요:
{
  "fourPillars": { "year": "연주", "month": "월주", "day": "일주", "hour": "시주" },
  "elements": { "primary": "화(火)", "secondary": "수(水)", "weakness": "목(木)" },
  "personality": { "strengths": ["적극적", "열정적", "추진력"], "weaknesses": ["성급함", "감정기복"], "characteristics": ["외향적", "사교적", "도전적"] },
  "fortune": { "monthly": "2500-3000자 분량의 자연스러운 문단 형태로 연결된 이번 달 종합 운세 분석" },
  "recommendations": ["한국어 조언1", "한국어 조언2", "한국어 조언3"]
}`;

    case 'love':
      return `${basePrompt} 아래 사주 정보를 바탕으로 "연애할 수 있을까?"에 대해 2500-3000자 분량으로 적절하고 구체적인 리포트를 작성해주세요.

***중요 지침*** 
- 2500-3000자 분량으로 적절하게 작성하세요
- 각 문단은 150자 내외로 적절히 작성하세요
- 1, 2, 3, 4, 5, 6 같은 숫자 목록이나 번호 매기기를 절대 사용하지 마세요
- 자연스러운 문단 형태로만 작성하세요
- 마크다운이나 특수 기호도 사용하지 마세요

당신의 사주를 통해 연애운을 분석해보겠습니다.

당신의 타고난 연애 성향과 이성운을 살펴보면... (약 600자 분량의 연애 성향과 특성 분석)

현재와 앞으로의 연애 가능성과 시기를 예측해보면... (약 600자 분량의 연애 시기와 가능성 분석)

이성에게 매력적으로 보이는 당신만의 장점을 살펴보면... (약 600자 분량의 매력 포인트와 인연 만남 분석)

연애를 성공시키기 위한 전략과 주의사항을 종합해보면... (약 500자 분량의 연애 성공 방법과 주의점 조언)

[사주 정보]
${sajuInfo}

다음 JSON 형식으로 응답해주세요:
{
  "fourPillars": { "year": "연주", "month": "월주", "day": "일주", "hour": "시주" },
  "elements": { "primary": "주요 오행", "secondary": "보조 오행", "weakness": "부족한 오행" },
  "personality": { "strengths": ["장점1", "장점2", "장점3"], "weaknesses": ["단점1", "단점2"], "characteristics": ["특성1", "특성2", "특성3"] },
  "fortune": { "love": "2500-3000자 분량의 자연스러운 문단 형태 연애운 분석" },
  "recommendations": ["조언1", "조언2", "조언3"]
}`;

    case 'reunion':
      return `${basePrompt} 아래 두 사람의 사주 정보를 바탕으로 "재회 가능성"을 2500-3000자 분량으로 적절하고 구체적으로 분석해주세요.

***중요 지침*** 
- 2500-3000자 분량으로 적절하게 작성하세요
- 각 문단은 150자 내외로 적절히 작성하세요
- 1, 2, 3, 4, 5, 6 같은 숫자 목록이나 번호 매기기를 절대 사용하지 마세요
- 자연스러운 문단 형태로만 작성하세요
- 마크다운이나 특수 기호도 사용하지 마세요

두 사람의 사주를 통해 재회 가능성을 분석해보겠습니다.

과거 관계를 사주적으로 분석해보면... (약 600자 분량의 이별 원인과 당시 운세 분석)

현재 두 사람의 궁합과 재회 가능성을 살펴보면... (약 600자 분량의 궁합과 재회 확률 분석)

재회 시기와 성공 전략을 종합해보면... (약 600자 분량의 재회 시기, 방법, 주의사항 분석)

관계 회복과 더 나은 미래를 위한 조언을 드리면... (약 500자 분량의 관계 개선 방안과 조언)

[나의 사주 정보]
${sajuInfo}
${partnerSajuInfo ? `[상대방 사주 정보]\n${partnerSajuInfo}` : ''}

다음 JSON 형식으로 응답해주세요:
{
  "fourPillars": { "year": "연주", "month": "월주", "day": "일주", "hour": "시주" },
  "elements": { "primary": "주요 오행", "secondary": "보조 오행", "weakness": "부족한 오행" },
  "personality": { "strengths": ["장점1", "장점2", "장점3"], "weaknesses": ["단점1", "단점2"], "characteristics": ["특성1", "특성2", "특성3"] },
  "fortune": { "reunion": "2500-3000자 분량의 자연스러운 문단 형태 재회 가능성 분석" },
  "recommendations": ["조언1", "조언2", "조언3"]
}`;

    case 'compatibility':
      return `${basePrompt} 아래 두 사람의 사주 정보를 바탕으로 "궁합 분석"을 4500-5000자 분량으로 상세하고 구체적으로 작성해주세요.

***중요 지침*** 
- 4500-5000자 분량으로 적절하게 작성하세요
- 각 문단은 200자 내외로 적절히 작성하세요
- 1, 2, 3, 4, 5, 6 같은 숫자 목록이나 번호 매기기를 절대 사용하지 마세요
- 자연스러운 문단 형태로만 작성하세요
- 마크다운이나 특수 기호도 사용하지 마세요

두 사람의 사주를 통해 궁합을 상세하게 분석해보겠습니다.

두 사람의 전체적인 궁합과 상성을 살펴보면... (약 1100자 분량의 궁합 종합 평가와 장단점 분석)

감정적 교감과 심리적 궁합을 분석해보면... (약 1100자 분량의 감정 표현 방식과 심리적 조화 분석)

현실적인 생활 궁합과 미래 전망을 살펴보면... (약 1100자 분량의 일상생활, 가치관, 결혼 적합도 분석)

관계 발전을 위한 조언과 주의사항을 종합해보면... (약 1000자 분량의 갈등 해결과 관계 개선 방안)

[나의 사주 정보]
${sajuInfo}
${partnerSajuInfo ? `[상대방 사주 정보]\n${partnerSajuInfo}` : ''}

다음 JSON 형식으로 응답해주세요:
{
  "fourPillars": { "year": "연주", "month": "월주", "day": "일주", "hour": "시주" },
  "elements": { "primary": "주요 오행", "secondary": "보조 오행", "weakness": "부족한 오행" },
  "personality": { "strengths": ["장점1", "장점2", "장점3"], "weaknesses": ["단점1", "단점2"], "characteristics": ["특성1", "특성2", "특성3"] },
  "fortune": { "compatibility": "4500-5000자 분량의 자연스러운 문단 형태 궁합 분석" },
  "recommendations": ["조언1", "조언2", "조언3"]
}`;

    case 'career':
      return `${basePrompt} 아래 사주팔자 정보를 바탕으로 "취업운과 앞으로의 진로"에 대해 반드시 80줄 분량으로 상세하고 구체적으로 리포트를 작성해주세요.

***절대 중요*** 
- 반드시 80줄 분량으로 작성해주세요 (줄바꿈 포함하여 정확히 80줄)
- 1, 2, 3, 4, 5, 6 같은 숫자 목록이나 번호 매기기를 절대 사용하지 마세요
- 자연스러운 문단 형태로만 작성해주세요
- 마크다운이나 특수 기호도 사용하지 마세요
- 각 문단 사이에는 빈 줄을 넣어주세요

당신의 사주를 통해 취업운과 진로를 깊이 있게 분석해보겠습니다.

현재 취업 상황과 사주적 관점에서의 해석을 살펴보면... (약 20줄 분량으로 취업운 분석과 현재 상황)

적합한 직업과 타고난 재능을 분석해보면... (약 20줄 분량으로 직업 적성과 강점)

취업 성공 시기와 전략을 종합해보면... (약 20줄 분량으로 취업 시기, 면접 전략, 성공 방법)

장기적인 진로 계획과 경력 발전 방향을 살펴보면... (약 20줄 분량으로 진로 계획과 조언)

[사주 정보]
${sajuInfo}

다음 JSON 형식으로 응답해주세요:
{
  "fourPillars": { "year": "연주", "month": "월주", "day": "일주", "hour": "시주" },
  "elements": { "primary": "주요 오행", "secondary": "보조 오행", "weakness": "부족한 오행" },
  "personality": { "strengths": ["장점1", "장점2", "장점3"], "weaknesses": ["단점1", "단점2"], "characteristics": ["특성1", "특성2", "특성3"] },
  "fortune": { "career": "반드시 80줄 분량의 자연스러운 문단 형태 취업운과 진로 분석" },
  "recommendations": ["조언1", "조언2", "조언3"]
}`;

    case 'marriage':
      return `${basePrompt} 아래 사주 정보를 바탕으로 "결혼운과 결혼 가능성"을 반드시 80줄 분량으로 상세하고 구체적으로 분석해주세요.

***절대 중요*** 
- 반드시 80줄 분량으로 작성해주세요 (줄바꿈 포함하여 정확히 80줄)
- 1, 2, 3, 4, 5, 6 같은 숫자 목록이나 번호 매기기를 절대 사용하지 마세요
- 자연스러운 문단 형태로만 작성해주세요
- 마크다운이나 특수 기호도 사용하지 마세요
- 각 문단 사이에는 빈 줄을 넣어주세요

당신의 사주를 통해 결혼운을 깊이 있게 분석해보겠습니다.

타고난 결혼운과 결혼에 대한 성향을 살펴보면... (약 20줄 분량으로 결혼운 전반과 성향 분석)

결혼 시기와 이상적인 배우자상을 분석해보면... (약 20줄 분량으로 결혼 시기와 배우자 조건 분석)

결혼운 향상 방법과 결혼 후 생활을 종합해보면... (약 20줄 분량으로 결혼운 개선과 결혼 생활 분석)

결혼을 위한 조언과 주의사항을 드리면... (약 20줄 분량으로 종합 조언과 주의점)

[사주 정보]
${sajuInfo}

다음 JSON 형식으로 응답해주세요:
{
  "fourPillars": { "year": "연주", "month": "월주", "day": "일주", "hour": "시주" },
  "elements": { "primary": "주요 오행", "secondary": "보조 오행", "weakness": "부족한 오행" },
  "personality": { "strengths": ["장점1", "장점2", "장점3"], "weaknesses": ["단점1", "단점2"], "characteristics": ["특성1", "특성2", "특성3"] },
  "fortune": { "marriage": "반드시 80줄 분량의 자연스러운 문단 형태 결혼운 분석" },
  "recommendations": ["조언1", "조언2", "조언3"]
}`;

    case 'comprehensive':
      return `${basePrompt} 아래 사주 정보를 바탕으로 "나의 평생 종합 운세"를 반드시 150줄 분량으로 매우 상세하고 구체적으로 작성해주세요.

***절대 중요*** 
- 반드시 150줄 분량으로 작성해주세요 (줄바꿈 포함하여 정확히 150줄)
- 1, 2, 3, 4, 5, 6 같은 숫자 목록이나 번호 매기기를 절대 사용하지 마세요
- 자연스러운 문단 형태로만 작성해주세요
- 마크다운이나 특수 기호도 사용하지 마세요
- 각 문단 사이에는 빈 줄을 넣어주세요

당신의 평생 종합 운세를 사주를 통해 깊이 있게 분석해보겠습니다.

당신의 타고난 기질과 성격, 그리고 재능을 종합적으로 살펴보면... (약 37줄 분량으로 기질, 성격, 재능 상세 분석)

재물운과 직업운의 전체적인 흐름을 분석해보면... (약 38줄 분량으로 재물운과 직업운 구체적 분석)

건강운과 연애운, 결혼운을 종합해보면... (약 37줄 분량으로 건강, 연애, 결혼운 분석)

대인관계와 말년운, 그리고 전체적인 인생의 흐름을 살펴보면... (약 38줄 분량으로 대인관계, 말년운, 인생 총정리)

[사주 정보]
${sajuInfo}

다음 JSON 형식으로 응답해주세요:
{
  "fourPillars": { "year": "연주", "month": "월주", "day": "일주", "hour": "시주" },
  "elements": { "primary": "주요 오행", "secondary": "보조 오행", "weakness": "부족한 오행" },
  "personality": { "strengths": ["장점1", "장점2", "장점3"], "weaknesses": ["단점1", "단점2"], "characteristics": ["특성1", "특성2", "특성3"] },
  "fortune": { "overall": "반드시 150줄 분량의 자연스러운 문단 형태 평생 종합 운세 분석" },
  "recommendations": ["한국어 조언1", "한국어 조언2", "한국어 조언3"]
}`;

    default:
      return `${basePrompt} 아래 사주팔자 정보를 바탕으로 상세한 분석을 해주세요.

[사주 정보]
${sajuInfo}

다음 JSON 형식으로 응답해주세요:
{
  "fourPillars": { "year": "연주", "month": "월주", "day": "일주", "hour": "시주" },
  "elements": { "primary": "주요 오행", "secondary": "보조 오행", "weakness": "부족한 오행" },
  "personality": { "strengths": ["장점1", "장점2", "장점3"], "weaknesses": ["단점1", "단점2"], "characteristics": ["특성1", "특성2", "특성3"] },
  "fortune": { "overall": "종합운세 분석" },
  "recommendations": ["조언1", "조언2", "조언3"]
}`;
  }
}

// 긴 내용을 여러 번 요청해서 합치는 함수
async function generateLongContent(analysisType: string, sajuInfo: string, partnerSajuInfo?: string): Promise<string> {
  const { date: koreanDate, month: koreanMonth } = await getKoreanDateTime();
  
  const basePrompt = `당신은 사주명리학 전문가입니다. 반드시 모든 응답을 한국어로만 작성해주세요.
현재 날짜는 ${koreanDate}이고, 현재 달은 ${koreanMonth}입니다.

[사주 정보]
${sajuInfo}${partnerSajuInfo || ''}`;

  const sections = getContentSections(analysisType);
  let fullContent = '';

  // 병렬 처리로 4배 속도 향상
  console.log(`=== 모든 섹션 병렬 생성 시작 (${sections.length}개) ===`);
  
  const sectionPromises = sections.map(async (section, i) => {
    const sectionPrompt = `${basePrompt}

${section}

800자 분량의 자연스러운 문단으로 작성해주세요.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: `사주명리학 전문가로서 한국어로 ${sectionPrompt}`
          }
        ],
        temperature: 0.7,
        max_tokens: analysisType === 'compatibility' ? 1400 : 1200, // 궁합분석 최적화
      });

      const cleanContent = response.choices[0].message.content?.trim() || '';
      console.log(`섹션 ${i + 1} 완료: ${cleanContent.length}자`);
      return { index: i, content: cleanContent || `섹션 ${i + 1}의 분석 내용입니다.` };
    } catch (error) {
      console.error(`섹션 ${i + 1} 생성 오류:`, error);
      return { index: i, content: `섹션 ${i + 1}의 분석을 생성하는 중 오류가 발생했습니다.` };
    }
  });

  // 모든 섹션을 병렬로 기다림
  const sectionResults = await Promise.all(sectionPromises);
  
  // 순서대로 정렬하여 조합
  sectionResults
    .sort((a, b) => a.index - b.index)
    .forEach((result) => {
      fullContent += (result.index > 0 ? '\n\n' : '') + result.content;
    });

  console.log(`전체 내용 생성 완료: ${fullContent.length}자`);
  return fullContent;
}

// 분석 타입별 섹션 정의
function getContentSections(analysisType: string): string[] {
  switch (analysisType) {
    case 'monthly':
      return [
        "이번 달 전체적인 운세와 기운의 흐름을 매우 상세히 분석해주세요.",
        "이번 달 재물운과 직업운의 변화를 구체적으로 분석해주세요.",
        "이번 달 건강운과 인간관계를 종합적으로 분석해주세요.",
        "이번 달 주의사항과 좋은 기회를 정리해주세요."
      ];
    case 'love':
      return [
        "타고난 연애 성향과 이성운을 매우 상세히 분석해주세요.",
        "현재와 앞으로의 연애 가능성과 시기를 구체적으로 예측해주세요.",
        "이성에게 매력적으로 보이는 장점과 인연 만남을 분석해주세요.",
        "연애 성공 전략과 주의사항을 종합해주세요."
      ];
    case 'comprehensive':
      return [
        "타고난 기질과 성격, 재능을 간결하고 핵심적으로 분석해주세요.",
        "재물운과 직업운을 핵심 내용만 분석해주세요.",
        "건강운과 연애운을 요약해서 분석해주세요."
      ];
    case 'career':
      return [
        "타고난 적성과 직업적 성향을 매우 상세히 분석해주세요.",
        "취업 시기와 직장 운세를 구체적으로 예측해주세요.",
        "적합한 직업 분야와 진로 방향을 분석해주세요."
      ];
    case 'marriage':
      return [
        "타고난 결혼운과 결혼 성향을 매우 상세히 분석해주세요.",
        "결혼 시기와 이상적인 배우자상을 구체적으로 분석해주세요.",
        "결혼운 향상 방법과 결혼 후 생활을 종합해주세요."
      ];
    case 'compatibility':
      return [
        "두 사람의 사주 궁합과 성격 궁합을 매우 상세히 분석해주세요.",
        "관계 발전 가능성과 결혼 궁합을 구체적으로 분석해주세요.",
        "궁합 개선 방법과 관계 유지 조언을 종합해주세요."
      ];
    case 'reunion':
      return [
        "헤어진 사람과의 재회 가능성을 매우 상세히 분석해주세요.",
        "관계 회복 시기와 방법을 구체적으로 분석해주세요.",
        "재회 성공 전략과 주의사항을 종합해주세요."
      ];
    default:
      return ["종합적인 사주 분석을 매우 상세히 해주세요."];
  }
}

// 분석 타입별 fortune 키 반환
function getFortuneKey(analysisType: string): string {
  switch (analysisType) {
    case 'monthly': return 'monthly';
    case 'love': return 'love';
    case 'career': return 'career';
    case 'marriage': return 'marriage';
    case 'compatibility': return 'compatibility';
    case 'reunion': return 'reunion';
    case 'comprehensive': return 'overall';
    default: return 'overall';
  }
}

export async function analyzeSaju(birthData: BirthData, analysisType: string, partnerSajuResult?: any): Promise<SajuAnalysisResult> {
  // 미리 계산된 분석이 있는지 확인 (궁합, 재회 제외)
  if (['monthly', 'love', 'career', 'marriage', 'comprehensive'].includes(analysisType)) {
    try {
      const { precomputedService } = await import('./precomputed-service');
      // 사용자 ID가 있는 경우 사용자별 미리 계산된 분석 조회
      const userId = (birthData as any).userId;
      const precomputed = await precomputedService.getPrecomputedAnalysis(analysisType, userId);
      if (precomputed) {
        console.log(`⚡ 미리 계산된 ${analysisType} 분석 반환 (1-2초)`);
        return precomputed.result as SajuAnalysisResult;
      }
    } catch (error) {
      console.log('미리 계산된 분석 조회 실패, 실시간 생성으로 진행');
    }
  }

  // 캐시에서 사주 계산 결과 확인
  let sajuCalculation = getCachedSaju(birthData);
  
  if (!sajuCalculation) {
    // 캐시에 없으면 새로 계산
    console.log("🔄 새로운 사주 계산 실행");
    sajuCalculation = await calculateSaju({
      birthDate: birthData.date,
      birthTime: birthData.time,
      calendarType: birthData.calendarType as 'solar' | 'lunar',
      isLeapMonth: birthData.isLeapMonth
    });
    
    // 계산된 결과를 캐시에 저장
    cacheSaju(birthData, sajuCalculation);
  }

  // 사주 정보를 텍스트로 포맷팅
  let sajuInfo = `
    사주팔자:
    연주: ${sajuCalculation.year.stem}${sajuCalculation.year.branch} (${sajuCalculation.year.stemKor}${sajuCalculation.year.branchKor})
    월주: ${sajuCalculation.month.stem}${sajuCalculation.month.branch} (${sajuCalculation.month.stemKor}${sajuCalculation.month.branchKor})
    일주: ${sajuCalculation.day.stem}${sajuCalculation.day.branch} (${sajuCalculation.day.stemKor}${sajuCalculation.day.branchKor})
    시주: ${sajuCalculation.hour.stem}${sajuCalculation.hour.branch} (${sajuCalculation.hour.stemKor}${sajuCalculation.hour.branchKor})
    
    양력: ${sajuCalculation.solarDate}
    음력: ${sajuCalculation.lunarDate} ${sajuCalculation.isLeapMonth ? '(윤달)' : '(평달)'}
  `;

  // 상대방 사주 정보 추가 (궁합/재회 분석인 경우)
  if (partnerSajuResult && (analysisType === 'compatibility' || analysisType === 'reunion')) {
    sajuInfo += `
    
    상대방 사주팔자:
    연주: ${partnerSajuResult.year.stem}${partnerSajuResult.year.branch} (${partnerSajuResult.year.stemKor}${partnerSajuResult.year.branchKor})
    월주: ${partnerSajuResult.month.stem}${partnerSajuResult.month.branch} (${partnerSajuResult.month.stemKor}${partnerSajuResult.month.branchKor})
    일주: ${partnerSajuResult.day.stem}${partnerSajuResult.day.branch} (${partnerSajuResult.day.stemKor}${partnerSajuResult.day.branchKor})
    시주: ${partnerSajuResult.hour.stem}${partnerSajuResult.hour.branch} (${partnerSajuResult.hour.stemKor}${partnerSajuResult.hour.branchKor})
    
    양력: ${partnerSajuResult.solarDate}
    음력: ${partnerSajuResult.lunarDate} ${partnerSajuResult.isLeapMonth ? '(윤달)' : '(평달)'}
    `;
  }

  // 분석 타입에 따른 운세 영역 정의
  const getFortuneFields = (type: string) => {
    switch (type) {
      case 'comprehensive':
        return {
          overall: "종합운세 해석 - 전체적인 운세의 흐름과 특징",
          love: "연애운 해석 - 이성관계와 사랑에 대한 운세",
          career: "직업운 해석 - 직업과 진로에 대한 운세", 
          wealth: "재물운 해석 - 재정과 돈에 대한 운세",
          health: "건강운 해석 - 건강과 신체에 대한 운세"
        };
      case 'monthly':
        return {
          overall: "이번 달 운세 전문 분석 - 월별 길흉화복, 주의사항, 좋은 날과 나쁜 날, 월간 운세 변화"
        };
      case 'love':
        return {
          love: "연애 가능성 전문 분석 - 이성관계, 만남의 시기, 이상형, 연애 패턴, 애정운, 솔로탈출 가능성"
        };
      case 'career':
        return {
          career: "취업 및 진로 전문 상담 - 적성, 직업 선택, 취업 시기, 면접운, 직장 운세, 진로 방향"
        };
      case 'marriage':
        return {
          marriage: "결혼운 전문 분석 - 결혼 가능성, 배우자운, 결혼 시기, 이상적인 배우자상, 결혼 후 운세"
        };
      case 'reunion':
        return {
          reunion: "재회 가능성 전문 분석 - 헤어진 사람과의 재회 운세, 복합 가능성, 관계 회복 시기"
        };
      case 'compatibility':
        return {
          overall: "궁합 분석 전문 해석 - 두 사람의 궁합도, 상성, 장단점, 조화도",
          compatibility: "상세 궁합 분석 - 성격 궁합, 인연, 결혼 궁합, 관계 발전 가능성"
        };
      case 'wealth':
        return {
          wealth: "재물운 전문 상세 분석 - 재물 축적 능력, 투자운, 부업운, 재정 관리법, 돈 버는 시기 등"
        };
      case 'health':
        return {
          health: "건강운 전문 상세 분석 - 체질, 주의할 질병, 건강 관리법, 운동법, 건강한 시기 등"
        };
      case 'study':
        return {
          study: "학업운 전문 상세 분석 - 학습 능력, 시험운, 진학운, 학업 성취 시기, 효과적인 공부법 등"
        };
      case 'family':
        return {
          family: "가족운 전문 상세 분석 - 부모와의 관계, 자녀운, 가족 화합, 집안 운세, 조상덕 등"
        };
      default:
        return {
          overall: "종합운세 해석"
        };
    }
  };

  const fortuneFields = getFortuneFields(analysisType);
  const fortuneFieldsJson = JSON.stringify(fortuneFields, null, 6);

  // Get Korean title for analysis type
  const getAnalysisTypeTitle = (type: string) => {
    const titleMap: Record<string, string> = {
      monthly: "이번 달 운세",
      love: "연애할 수 있을까?",
      reunion: "재회 가능할까요?",
      compatibility: "궁합 분석",
      career: "취업이 안되면 어쩌죠?",
      marriage: "결혼할 수 있을까요?",
      comprehensive: "나의 종합 운세"
    };
    return titleMap[type] || "종합 운세";
  };

  const analysisTypeTitle = getAnalysisTypeTitle(analysisType);

  // 상대방 사주 정보 포맷팅 (궁합/재회 분석인 경우)
  let partnerSajuInfo = '';
  if (partnerSajuResult && (analysisType === 'compatibility' || analysisType === 'reunion')) {
    partnerSajuInfo = `
    상대방 사주팔자:
    연주: ${partnerSajuResult.yearStem}${partnerSajuResult.yearBranch}
    월주: ${partnerSajuResult.monthStem}${partnerSajuResult.monthBranch}
    일주: ${partnerSajuResult.dayStem}${partnerSajuResult.dayBranch}
    시주: ${partnerSajuResult.hourStem}${partnerSajuResult.hourBranch}
    
    양력: ${partnerSajuResult.solarDate}
    음력: ${partnerSajuResult.lunarDate} ${partnerSajuResult.isLeapMonth ? '(윤달)' : '(평달)'}
    `;
  }

  try {
    console.log("=== 병렬 처리로 분석 시작 ===");
    console.log("분석 타입:", analysisType);
    
    // 1번: 병렬 처리 - 긴 내용과 기본 정보를 동시에 생성
    const basicPrompt = await getDetailedPromptByType(analysisType, sajuInfo, partnerSajuInfo);
    
    const [longContent, basicResponse] = await Promise.all([
      generateLongContent(analysisType, sajuInfo, partnerSajuInfo),
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "사주명리학 전문가로서 기본 정보만 간단히 생성해주세요."
          },
          {
            role: "user",
            content: basicPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000,
      })
    ]);
    
    console.log("생성된 내용 길이:", longContent.length);

    let basicResult = {};
    try {
      const rawBasicContent = basicResponse.choices[0].message.content || '{}';
      basicResult = JSON.parse(rawBasicContent);
    } catch (parseError) {
      console.error("기본 응답 JSON 파싱 오류:", parseError);
      // 기본값 제공
      basicResult = {
        elements: { primary: "화(火)", secondary: "수(水)", weakness: "목(木)" },
        personality: { 
          strengths: ["적극적", "열정적", "추진력"], 
          weaknesses: ["성급함", "감정기복"], 
          characteristics: ["외향적", "사교적", "도전적"] 
        },
        recommendations: ["균형잡힌 생활을 유지하세요", "신중한 판단을 하세요", "인간관계를 소중히 하세요"]
      };
    }
    
    // 결과 조합
    const fortuneKey = getFortuneKey(analysisType);
    
    console.log("========================");
    
    // 계산된 사주 정보를 결과에 포함하고 fourPillars를 실제 계산값으로 업데이트
    const finalResult: SajuAnalysisResult = {
      fourPillars: {
        year: `${sajuCalculation.year.stem}${sajuCalculation.year.branch} (${sajuCalculation.year.stemKor}${sajuCalculation.year.branchKor})`,
        month: `${sajuCalculation.month.stem}${sajuCalculation.month.branch} (${sajuCalculation.month.stemKor}${sajuCalculation.month.branchKor})`,
        day: `${sajuCalculation.day.stem}${sajuCalculation.day.branch} (${sajuCalculation.day.stemKor}${sajuCalculation.day.branchKor})`,
        hour: `${sajuCalculation.hour.stem}${sajuCalculation.hour.branch} (${sajuCalculation.hour.stemKor}${sajuCalculation.hour.branchKor})`
      },
      elements: (basicResult as any).elements || { primary: "화(火)", secondary: "수(水)", weakness: "목(木)" },
      personality: (basicResult as any).personality || { 
        strengths: ["적극적", "열정적", "추진력"], 
        weaknesses: ["성급함", "감정기복"], 
        characteristics: ["외향적", "사교적", "도전적"] 
      },
      fortune: {
        [fortuneKey]: longContent
      } as any,
      recommendations: (basicResult as any).recommendations || ["균형잡힌 생활을 유지하세요", "신중한 판단을 하세요", "인간관계를 소중히 하세요"],
      sajuCalculation
    };
    
    return finalResult;
  } catch (error) {
    throw new Error("사주 분석 중 오류가 발생했습니다: " + (error as Error).message);
  }
}

export async function analyzeCareer(birthData: BirthData, sajuResult: SajuAnalysisResult): Promise<CareerAnalysisResult> {
  // 실시간 한국 시간 가져오기
  const { date: koreanDate, month: koreanMonth } = await getKoreanDateTime();

  const prompt = `
    현재 날짜는 ${koreanDate}이고, 현재 달은 ${koreanMonth}입니다. 분석할 때 정확한 현재 시점을 기준으로 작성해주세요.
    
    사주 분석 결과를 바탕으로 진로 및 직업 적성을 분석해주세요.

    사주 정보:
    - 주요 오행: ${sajuResult.elements.primary}
    - 성격 강점: ${sajuResult.personality.strengths.join(', ')}
    - 성격 특성: ${sajuResult.personality.characteristics.join(', ')}
    - 직업운: ${sajuResult.fortune.career}

    다음 JSON 형식으로 응답해주세요:
    {
      "suitableJobs": ["적합한 직업1", "적합한 직업2", "적합한 직업3"],
      "strengths": ["업무 강점1", "업무 강점2", "업무 강점3"],
      "compatibleFields": ["적합한 분야1", "적합한 분야2", "적합한 분야3"],
      "workStyle": "업무 스타일 설명",
      "leadership": "리더십 특성",
      "teamwork": "팀워크 특성",
      "recommendations": ["진로 조언1", "진로 조언2", "진로 조언3"]
    }

    구체적이고 실용적인 직업 추천과 조언을 제공해주세요.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "당신은 진로 상담 전문가입니다. 사주명리학 기반으로 개인의 적성과 강점을 분석하여 구체적인 직업 추천을 제공합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as CareerAnalysisResult;
  } catch (error) {
    throw new Error("진로 분석 중 오류가 발생했습니다: " + (error as Error).message);
  }
}

export async function generateDailyFortune(birthData: BirthData, todayDate: string): Promise<string> {
  // 실시간 한국 시간 가져오기
  const { date: koreanDate, month: koreanMonth } = await getKoreanDateTime();

  const systemPrompt = `당신은 전문적인 사주 명리학자입니다. 
개인의 생년월일과 시간을 바탕으로 오늘의 운세를 제공하는 전문가입니다.
한국의 전통 사주명리학을 바탕으로 하되, 현대적이고 실용적인 조언을 포함해주세요.`;

  const prompt = `
현재 날짜는 ${koreanDate}이고, 현재 달은 ${koreanMonth}입니다. 분석할 때 정확한 현재 시점을 기준으로 작성해주세요.
오늘은 ${koreanDate}입니다.

다음 개인정보를 바탕으로 오늘의 운세를 200자 내외로 간결하고 따뜻하게 작성해주세요:

- 생년월일: ${birthData.date}
- 성별: ${birthData.gender}
- 태어난 시간: ${birthData.time}
- 달력: ${birthData.calendarType}

오늘 하루에 대한 조언과 격려를 포함하여 긍정적이고 실용적인 내용으로 작성해주세요.
구체적인 행동 제안이나 주의사항도 포함해주시면 좋습니다.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return response.choices[0].message.content || "오늘은 새로운 인연과 기회가 찾아올 수 있는 날입니다. 적극적인 자세로 하루를 시작해보세요!";
  } catch (error) {
    console.error("Daily fortune generation error:", error);
    return "오늘은 새로운 인연과 기회가 찾아올 수 있는 날입니다. 적극적인 자세로 하루를 시작해보세요!";
  }
}

export async function provideCoaching(sessionType: string, topic: string, content: string, userContext?: any): Promise<string> {
  // 실시간 한국 시간 가져오기
  const { date: koreanDate, month: koreanMonth } = await getKoreanDateTime();

  let systemPrompt = "";
  
  switch (sessionType) {
    case "love":
      systemPrompt = "당신은 연애 코칭 전문가입니다. 사주명리학적 관점을 포함하여 실용적이고 따뜻한 연애 조언을 제공합니다.";
      break;
    case "career":
      systemPrompt = "당신은 진로 상담 전문가입니다. 개인의 강점과 적성을 바탕으로 구체적인 진로 방향을 제시합니다.";
      break;
    default:
      systemPrompt = "당신은 인생 코칭 전문가입니다. 사주명리학적 통찰과 함께 실용적인 인생 조언을 제공합니다.";
  }

  const prompt = `
    현재 날짜는 ${koreanDate}이고, 현재 달은 ${koreanMonth}입니다. 분석할 때 정확한 현재 시점을 기준으로 작성해주세요.
    
    주제: ${topic}
    내용: ${content}
    
    위 상황에 대해 전문적이고 따뜻한 조언을 제공해주세요. 
    구체적이고 실행 가능한 방법을 포함하여 답변해주세요.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
    });

    return response.choices[0].message.content || "답변을 생성할 수 없습니다.";
  } catch (error) {
    throw new Error("코칭 세션 중 오류가 발생했습니다: " + (error as Error).message);
  }
}