// Five Elements Calculator based on actual Saju chart display
// Calculates elements from both stems and branches as shown in the visual chart

interface SajuPillar {
  stem: string;
  branch: string;
}

interface ElementAnalysis {
  primary: string;
  secondary: string;
  weakness: string;
  elementCounts: Record<string, number>;
  totalElements: number;
}

// Element mapping for stems (천간)
const stemElements: Record<string, string> = {
  '甲': '목', '乙': '목', // 갑을 - 목
  '丙': '화', '丁': '화', // 병정 - 화  
  '戊': '토', '己': '토', // 무기 - 토
  '庚': '금', '辛': '금', // 경신 - 금
  '壬': '수', '癸': '수'  // 임계 - 수
};

// Element mapping for branches (지지)
const branchElements: Record<string, string> = {
  '子': '수', '丑': '토', '寅': '목', '卯': '목',
  '辰': '토', '巳': '화', '午': '화', '未': '토', 
  '申': '금', '酉': '금', '戌': '토', '亥': '수'
};

export function calculateFiveElements(sajuData: {
  year: SajuPillar;
  month: SajuPillar;
  day: SajuPillar;
  hour: SajuPillar;
}): ElementAnalysis {
  const elementCounts: Record<string, number> = {
    '목': 0,
    '화': 0,
    '토': 0,
    '금': 0,
    '수': 0
  };

  // Count elements from all 8 positions (4 stems + 4 branches)
  const pillars = [sajuData.year, sajuData.month, sajuData.day, sajuData.hour];
  
  pillars.forEach(pillar => {
    // Add stem element
    const stemElement = stemElements[pillar.stem];
    if (stemElement) {
      elementCounts[stemElement]++;
    }
    
    // Add branch element  
    const branchElement = branchElements[pillar.branch];
    if (branchElement) {
      elementCounts[branchElement]++;
    }
  });

  const totalElements = Object.values(elementCounts).reduce((sum, count) => sum + count, 0);

  // Sort elements by count to determine primary, secondary, and weakness
  const sortedElements = Object.entries(elementCounts)
    .sort(([,a], [,b]) => b - a)
    .filter(([,count]) => count > 0);

  const primary = sortedElements[0]?.[0] || '화';
  const secondary = sortedElements[1]?.[0] || '토';
  
  // Find weakness - element with 0 count or lowest count
  const weakness = Object.entries(elementCounts)
    .sort(([,a], [,b]) => a - b)[0]?.[0] || '수';

  return {
    primary,
    secondary, 
    weakness,
    elementCounts,
    totalElements
  };
}

// Function to get element analysis for display
export function getElementAnalysisForDisplay(sajuData: any): ElementAnalysis {
  if (!sajuData || !sajuData.year || !sajuData.month || !sajuData.day || !sajuData.hour) {
    // Return default analysis if data is incomplete
    return {
      primary: '화',
      secondary: '토', 
      weakness: '수',
      elementCounts: { '목': 0, '화': 1, '토': 1, '금': 0, '수': 0 },
      totalElements: 2
    };
  }

  return calculateFiveElements(sajuData);
}

// Debug function to log element calculation details
export function debugElementCalculation(sajuData: any): void {
  console.log('=== 오행 분석 디버깅 ===');
  console.log('사주 데이터:', JSON.stringify(sajuData, null, 2));
  
  if (!sajuData.year || !sajuData.month || !sajuData.day || !sajuData.hour) {
    console.log('❌ 사주 데이터 불완전');
    return;
  }

  const pillars = [
    { name: '년주', data: sajuData.year },
    { name: '월주', data: sajuData.month },
    { name: '일주', data: sajuData.day },
    { name: '시주', data: sajuData.hour }
  ];

  console.log('📊 각 기둥별 오행:');
  const elementCounts: Record<string, number> = {
    '목': 0, '화': 0, '토': 0, '금': 0, '수': 0
  };
  
  pillars.forEach(pillar => {
    const stemElement = stemElements[pillar.data.stem] || '?';
    const branchElement = branchElements[pillar.data.branch] || '?';
    console.log(`${pillar.name}: ${pillar.data.stem}(${stemElement}) + ${pillar.data.branch}(${branchElement})`);
    
    // Count elements
    if (stemElement !== '?') elementCounts[stemElement]++;
    if (branchElement !== '?') elementCounts[branchElement]++;
  });

  console.log('🔢 오행 개수:', elementCounts);
  const analysis = calculateFiveElements(sajuData);
  console.log('🎯 최종 오행 분석:', analysis);
}