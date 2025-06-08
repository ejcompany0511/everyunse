import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SajuResultDisplay from "@/components/saju-result-display";
import BottomNavigation from "@/components/bottom-navigation";

interface AnalysisDetailProps {
  analysisId: string;
}

export default function AnalysisDetail({ analysisId }: AnalysisDetailProps) {
  const [, navigate] = useLocation();

  const { data: analysisData, isLoading } = useQuery({
    queryKey: ["/api/saju/analysis", analysisId],
  });

  const analysis = analysisData?.analysis;
  
  // Debug logging
  if (analysis) {
    console.log("=== 분석 상세 페이지 디버깅 ===");
    console.log("Raw analysis data:", analysis);
    console.log("Analysis result type:", typeof analysis.result);
    console.log("Analysis result:", analysis.result);
  }
  
  // Parse the result JSON if it exists
  let parsedResult = null;
  if (analysis?.result) {
    try {
      parsedResult = typeof analysis.result === 'string' ? JSON.parse(analysis.result) : analysis.result;
      console.log("Parsed result:", parsedResult);
      console.log("Fortune content:", parsedResult?.fortune);
    } catch (e) {
      console.error('Error parsing analysis result:', e);
      console.log("Using raw result as fallback");
      parsedResult = analysis.result;
    }
  }

  if (isLoading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">분석 결과를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-500">분석 결과를 찾을 수 없습니다.</p>
            <Button onClick={() => navigate("/analysis")} className="mt-4">
              분석 목록으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getAnalysisTypeInfo = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      comprehensive: { label: "종합운세", color: "bg-purple-100 text-purple-600" },
      career: { label: "진로상담", color: "bg-green-100 text-green-600" },
      love: { label: "연애운", color: "bg-pink-100 text-pink-600" },
      wealth: { label: "재물운", color: "bg-yellow-100 text-yellow-600" },
      health: { label: "건강운", color: "bg-blue-100 text-blue-600" }
    };
    return types[type] || { label: "기타", color: "bg-gray-100 text-gray-600" };
  };

  const typeInfo = getAnalysisTypeInfo(analysis.analysisType);
  const result = parsedResult || analysis.result;

  return (
    <div className="mobile-container">
      {/* Header */}
      <header className="flex items-center p-4 bg-white border-b">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate("/analysis")}
          className="mr-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-semibold">분석 상세</h1>
      </header>

      <main className="px-4 pb-20">
        {/* 분석 정보 */}
        <Card className="mt-4">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{analysis.title}</CardTitle>
              <Badge className={typeInfo.color}>
                {typeInfo.label}
              </Badge>
            </div>
            <div className="flex items-center text-sm text-gray-500 space-x-4">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(analysis.createdAt).toLocaleDateString('ko-KR')}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {new Date(analysis.createdAt).toLocaleTimeString('ko-KR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">출생일시</span>
                <span>{analysis.birthData?.date} {analysis.birthData?.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">성별</span>
                <span>{analysis.birthData?.gender === 'male' ? '남성' : '여성'}</span>
              </div>
              {analysis.birthData?.birthCountry && (
                <div className="flex justify-between">
                  <span className="text-gray-600">출생지역</span>
                  <span className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {analysis.birthData.birthCountry === 'KR' ? '한국' : 
                     analysis.birthData.birthCountry === 'US' ? '미국' :
                     analysis.birthData.birthCountry === 'JP' ? '일본' :
                     analysis.birthData.birthCountry === 'CN' ? '중국' : '기타'}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 정확한 사주 계산 결과 */}
        {result?.sajuCalculation && (
          <div className="mt-4">
            <SajuResultDisplay 
              sajuCalculation={result.sajuCalculation}
              analysisType={analysis.analysisType}
            />
          </div>
        )}

        {/* AI 분석 결과 */}
        {result && (
          <div className="mt-6 space-y-4">
            {/* 주요 운세 내용 */}
            {result.fortune && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {analysis.analysisType === 'monthly' ? '이번 달 운세' :
                     analysis.analysisType === 'yearly' ? '올해 운세' :
                     analysis.analysisType === 'comprehensive' ? '종합 운세' :
                     analysis.analysisType === 'career' ? '진로운세' :
                     analysis.analysisType === 'love' ? '연애운' :
                     analysis.analysisType === 'wealth' ? '재물운' :
                     analysis.analysisType === 'health' ? '건강운' :
                     analysis.analysisType === 'compatibility' ? '궁합 분석' :
                     analysis.analysisType === 'love_potential' ? '연애 가능성' :
                     analysis.analysisType === 'reunion_potential' ? '재회 가능성' :
                     '분석 결과'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {(() => {
                      // 분석 타입에 따라 적절한 fortune 필드 선택
                      const fortuneContent = 
                        result.fortune[analysis.analysisType] ||
                        result.fortune.monthly ||
                        result.fortune.yearly ||
                        result.fortune.comprehensive ||
                        result.fortune.career ||
                        result.fortune.love ||
                        result.fortune.wealth ||
                        result.fortune.health ||
                        result.fortune.compatibility ||
                        result.fortune.love_potential ||
                        result.fortune.reunion_potential ||
                        result.fortune.overall ||
                        Object.values(result.fortune)[0] || // 첫 번째 값 사용
                        '분석 결과가 없습니다.';
                      
                      console.log("Fortune content to display:", fortuneContent);
                      return fortuneContent;
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 성격 특성 */}
            {result.personality && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">성격 특성</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.personality.strengths && (
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">강점</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.personality.strengths.map((strength: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-green-600 border-green-300">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {result.personality.characteristics && (
                    <div>
                      <h4 className="font-medium text-blue-700 mb-2">특성</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.personality.characteristics.map((char: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-blue-600 border-blue-300">
                            {char}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 세부 운세 */}
            {result.fortune && (
              <div className="grid grid-cols-1 gap-4">
                {analysis.analysisType !== 'love' && result.fortune.love && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center">
                        ❤️ 연애운
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{result.fortune.love}</p>
                    </CardContent>
                  </Card>
                )}

                {analysis.analysisType !== 'career' && result.fortune.career && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center">
                        💼 직업운
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{result.fortune.career}</p>
                    </CardContent>
                  </Card>
                )}

                {analysis.analysisType !== 'wealth' && result.fortune.wealth && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center">
                        💰 재물운
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{result.fortune.wealth}</p>
                    </CardContent>
                  </Card>
                )}

                {analysis.analysisType !== 'health' && result.fortune.health && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center">
                        🏥 건강운
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{result.fortune.health}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* 조언 및 권장사항 */}
            {result.recommendations && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">조언 및 권장사항</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-indigo-600 mr-2">•</span>
                        <span className="text-gray-700 text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}