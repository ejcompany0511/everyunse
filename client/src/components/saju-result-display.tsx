import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SajuPillar {
  stem: string;
  branch: string;
  stemKor: string;
  branchKor: string;
  tenStar: string;
  groundTenStar?: string;
  hiddenStems: string[];
  hiddenTenStars?: string[];
  twelveStage: string;
  twelveSinSal?: string[];
}

interface SajuCalculation {
  year: SajuPillar;
  month: SajuPillar;
  day: SajuPillar;
  hour: SajuPillar;
  solarDate: string;
  lunarDate: string;
  isLeapMonth: boolean;
}

interface SajuResultDisplayProps {
  sajuCalculation: SajuCalculation;
  partnerSajuCalculation?: any;
  analysisType: string;
  currentView?: "user" | "partner";
  birthInfo?: {
    birthDate: string;
    birthTime: string;
    gender: string;
    calendarType: string;
  };
}

// 한자를 한글로 변환
const convertToKorean = (hanja: string, type: 'stem' | 'branch') => {
  if (type === 'stem') {
    const stemMap: Record<string, string> = {
      '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
      '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계'
    };
    return stemMap[hanja] || hanja;
  } else {
    const branchMap: Record<string, string> = {
      '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사',
      '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해'
    };
    return branchMap[hanja] || hanja;
  }
};

// 천간의 오행과 색상 정보
const getStemInfo = (stem: string) => {
  const stemMap: Record<string, { element: string; color: string }> = {
    '甲': { element: '목', color: 'text-green-600' },
    '乙': { element: '목', color: 'text-green-600' },
    '丙': { element: '화', color: 'text-red-600' },
    '丁': { element: '화', color: 'text-red-600' },
    '戊': { element: '토', color: 'text-yellow-600' },
    '己': { element: '토', color: 'text-yellow-600' },
    '庚': { element: '금', color: 'text-gray-600' },
    '辛': { element: '금', color: 'text-gray-600' },
    '壬': { element: '수', color: 'text-blue-600' },
    '癸': { element: '수', color: 'text-blue-600' }
  };
  return stemMap[stem] || { element: '', color: 'text-gray-600' };
};

// 지지의 오행과 색상 정보
const getBranchInfo = (branch: string) => {
  const koreanBranch = convertToKorean(branch, 'branch');
  const branchMap: Record<string, { element: string; color: string; season: string }> = {
    '자': { element: '수', color: 'text-blue-600', season: '겨울' },
    '축': { element: '토', color: 'text-yellow-600', season: '겨울' },
    '인': { element: '목', color: 'text-green-600', season: '봄' },
    '묘': { element: '목', color: 'text-green-600', season: '봄' },
    '진': { element: '토', color: 'text-yellow-600', season: '봄' },
    '사': { element: '화', color: 'text-red-600', season: '여름' },
    '오': { element: '화', color: 'text-red-600', season: '여름' },
    '미': { element: '토', color: 'text-yellow-600', season: '여름' },
    '신': { element: '금', color: 'text-gray-600', season: '가을' },
    '유': { element: '금', color: 'text-gray-600', season: '가을' },
    '술': { element: '토', color: 'text-yellow-600', season: '가을' },
    '해': { element: '수', color: 'text-blue-600', season: '겨울' }
  };
  return branchMap[koreanBranch] || { element: '', color: 'text-gray-600', season: '' };
};

export default function SajuResultDisplay({ sajuCalculation, partnerSajuCalculation, analysisType, currentView = "user", birthInfo }: SajuResultDisplayProps) {
  // Use currentView prop to determine which Saju chart to display
  const currentSaju = currentView === "partner" && partnerSajuCalculation ? partnerSajuCalculation : sajuCalculation;

  // 데이터 유효성 검사
  if (!currentSaju) {
    return (
      <div className="p-6 text-center text-gray-500">
        사주 데이터를 불러오는 중입니다...
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      return `${year}년 ${parseInt(month, 10)}월 ${parseInt(day, 10)}일`;
    } else {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${year}년 ${parseInt(month, 10)}월 ${parseInt(day, 10)}일`;
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hour, minute] = timeStr.split(':');
    return `${hour}시 ${minute}분`;
  };

  return (
    <div className="space-y-4">
      {/* 출생 정보 표시 */}
      {birthInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-sm">출생 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-red-500">양력</span>
              <span>{formatDate(currentSaju.solarDate)} {formatTime(birthInfo.birthTime)} {birthInfo.gender === 'male' ? '남자' : '여자'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-500">음력</span>
              <span>{formatDate(currentSaju.lunarDate)} {formatTime(birthInfo.birthTime)} {currentSaju.isLeapMonth ? '윤달' : '평달'}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 사주팔자 표 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-lg">
            {analysisType === "compatibility" && currentView === "partner" ? "상대방 사주팔자" : "사주팔자"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 border border-gray-300 rounded-lg overflow-hidden text-sm max-w-lg mx-auto">
            {/* 헤더 행 */}
            <div className="bg-gray-100 border-b border-r border-gray-300 p-2 text-center font-medium"></div>
            <div className="bg-gray-100 border-b border-r border-gray-300 p-2 text-center font-medium">시</div>
            <div className="bg-gray-100 border-b border-r border-gray-300 p-2 text-center font-medium">일</div>
            <div className="bg-gray-100 border-b border-r border-gray-300 p-2 text-center font-medium">월</div>
            <div className="bg-gray-100 border-b border-gray-300 p-2 text-center font-medium">년</div>

            {/* 천간 행 */}
            <div className="bg-gray-50 border-b border-r border-gray-300 p-2 text-center font-medium">천간</div>
            <div className="border-b border-r border-gray-300 p-2 text-center">
              <div className={`text-lg font-bold ${getStemInfo(currentSaju.hour?.stem || '').color}`}>
                {convertToKorean(currentSaju.hour?.stem || '', 'stem')}
              </div>
              <div className="text-xs text-gray-500">
                {getStemInfo(currentSaju.hour?.stem || '').element}
              </div>
            </div>
            <div className="border-b border-r border-gray-300 p-2 text-center">
              <div className={`text-lg font-bold ${getStemInfo(currentSaju.day?.stem || '').color}`}>
                {convertToKorean(currentSaju.day?.stem || '', 'stem')}
              </div>
              <div className="text-xs text-gray-500">
                {getStemInfo(currentSaju.day?.stem || '').element}
              </div>
            </div>
            <div className="border-b border-r border-gray-300 p-2 text-center">
              <div className={`text-lg font-bold ${getStemInfo(currentSaju.month?.stem || '').color}`}>
                {convertToKorean(currentSaju.month?.stem || '', 'stem')}
              </div>
              <div className="text-xs text-gray-500">
                {getStemInfo(currentSaju.month?.stem || '').element}
              </div>
            </div>
            <div className="border-b border-gray-300 p-2 text-center">
              <div className={`text-lg font-bold ${getStemInfo(currentSaju.year?.stem || '').color}`}>
                {convertToKorean(currentSaju.year?.stem || '', 'stem')}
              </div>
              <div className="text-xs text-gray-500">
                {getStemInfo(currentSaju.year?.stem || '').element}
              </div>
            </div>

            {/* 십성 행 */}
            <div className="bg-gray-50 border-b border-r border-gray-300 p-2 text-center font-medium">십성</div>
            <div className="border-b border-r border-gray-300 p-2 text-center text-xs">{currentSaju.hour?.tenStar || '-'}</div>
            <div className="border-b border-r border-gray-300 p-2 text-center text-xs">{currentSaju.day?.tenStar || '-'}</div>
            <div className="border-b border-r border-gray-300 p-2 text-center text-xs">{currentSaju.month?.tenStar || '-'}</div>
            <div className="border-b border-gray-300 p-2 text-center text-xs">{currentSaju.year?.tenStar || '-'}</div>

            {/* 지지 행 */}
            <div className="bg-gray-50 border-b border-r border-gray-300 p-2 text-center font-medium">지지</div>
            <div className="border-b border-r border-gray-300 p-2 text-center">
              <div className={`text-lg font-bold ${getBranchInfo(currentSaju.hour?.branch || '').color}`}>
                {convertToKorean(currentSaju.hour?.branch || '', 'branch')}
              </div>
              <div className="text-xs text-gray-500">
                {getBranchInfo(currentSaju.hour?.branch || '').element}
              </div>
            </div>
            <div className="border-b border-r border-gray-300 p-2 text-center">
              <div className={`text-lg font-bold ${getBranchInfo(currentSaju.day?.branch || '').color}`}>
                {convertToKorean(currentSaju.day?.branch || '', 'branch')}
              </div>
              <div className="text-xs text-gray-500">
                {getBranchInfo(currentSaju.day?.branch || '').element}
              </div>
            </div>
            <div className="border-b border-r border-gray-300 p-2 text-center">
              <div className={`text-lg font-bold ${getBranchInfo(currentSaju.month?.branch || '').color}`}>
                {convertToKorean(currentSaju.month?.branch || '', 'branch')}
              </div>
              <div className="text-xs text-gray-500">
                {getBranchInfo(currentSaju.month?.branch || '').element}
              </div>
            </div>
            <div className="border-b border-gray-300 p-2 text-center">
              <div className={`text-lg font-bold ${getBranchInfo(currentSaju.year?.branch || '').color}`}>
                {convertToKorean(currentSaju.year?.branch || '', 'branch')}
              </div>
              <div className="text-xs text-gray-500">
                {getBranchInfo(currentSaju.year?.branch || '').element}
              </div>
            </div>

            {/* 십성(지지) 행 */}
            <div className="bg-gray-50 border-b border-r border-gray-300 p-2 text-center font-medium">십성</div>
            <div className="border-b border-r border-gray-300 p-2 text-center text-xs">{currentSaju.hour?.groundTenStar || '-'}</div>
            <div className="border-b border-r border-gray-300 p-2 text-center text-xs">{currentSaju.day?.groundTenStar || '-'}</div>
            <div className="border-b border-r border-gray-300 p-2 text-center text-xs">{currentSaju.month?.groundTenStar || '-'}</div>
            <div className="border-b border-gray-300 p-2 text-center text-xs">{currentSaju.year?.groundTenStar || '-'}</div>

            {/* 지장간 행 */}
            <div className="bg-gray-50 border-b border-r border-gray-300 p-2 text-center font-medium">지장간</div>
            <div className="border-b border-r border-gray-300 p-2 text-center text-xs">{currentSaju.hour?.hiddenStems?.join(',') || '-'}</div>
            <div className="border-b border-r border-gray-300 p-2 text-center text-xs">{currentSaju.day?.hiddenStems?.join(',') || '-'}</div>
            <div className="border-b border-r border-gray-300 p-2 text-center text-xs">{currentSaju.month?.hiddenStems?.join(',') || '-'}</div>
            <div className="border-b border-gray-300 p-2 text-center text-xs">{currentSaju.year?.hiddenStems?.join(',') || '-'}</div>

            {/* 12운성 행 */}
            <div className="bg-gray-50 border-b border-r border-gray-300 p-2 text-center font-medium">12운성</div>
            <div className="border-b border-r border-gray-300 p-2 text-center text-xs">{currentSaju.hour?.twelveStage || '-'}</div>
            <div className="border-b border-r border-gray-300 p-2 text-center text-xs">{currentSaju.day?.twelveStage || '-'}</div>
            <div className="border-b border-r border-gray-300 p-2 text-center text-xs">{currentSaju.month?.twelveStage || '-'}</div>
            <div className="border-b border-gray-300 p-2 text-center text-xs">{currentSaju.year?.twelveStage || '-'}</div>

            {/* 12신살 행 */}
            <div className="bg-gray-50 border-r border-gray-300 p-2 text-center font-medium">12신살</div>
            <div className="border-r border-gray-300 p-2 text-center text-xs">{currentSaju.hour?.twelveSinSal?.join(',') || '-'}</div>
            <div className="border-r border-gray-300 p-2 text-center text-xs">{currentSaju.day?.twelveSinSal?.join(',') || '-'}</div>
            <div className="border-r border-gray-300 p-2 text-center text-xs">{currentSaju.month?.twelveSinSal?.join(',') || '-'}</div>
            <div className="p-2 text-center text-xs">{currentSaju.year?.twelveSinSal?.join(',') || '-'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
