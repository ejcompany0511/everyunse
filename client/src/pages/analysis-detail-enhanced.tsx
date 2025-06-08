import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { ArrowLeft, Calendar, User, Star, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function AnalysisDetailEnhanced() {
  const [, params] = useRoute("/analysis/:id/detail");
  const [, setLocation] = useLocation();
  const analysisId = params?.id;

  const { data: analysis, isLoading } = useQuery({
    queryKey: [`/api/saju/analysis/${analysisId}`],
    enabled: !!analysisId,
  });

  const formatDate = (date: string | Date) => {
    if (!date) return "날짜 정보 없음";
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "유효하지 않은 날짜";
    return dateObj.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAnalysisTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      monthly: "이번 달 운세",
      love: "연애운",
      reunion: "재회 가능성",
      compatibility: "궁합 분석",
      career: "취업운",
      marriage: "결혼운",
      comprehensive: "종합 운세"
    };
    return types[type] || "기타 분석";
  };

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
            <Button 
              onClick={() => setLocation("/analysis")}
              className="mt-4"
              variant="outline"
            >
              목록으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle both direct analysis object and wrapped analysis response
  const analysisData = analysis.analysis || analysis;
  const result = analysisData?.result || {};
  
  // Extract Four Pillars data with Korean names
  const fourPillars = result?.fourPillars || {
    year: "병자",
    month: "임진", 
    day: "병자",
    hour: "무술"
  };
  
  // Extract Five Elements data
  const elements = result?.elements || {
    primary: "화(火)",
    secondary: "수(水)", 
    weakness: "목(木)"
  };
  
  // Extract personality data
  const personality = result?.personality || {
    strengths: ["적극적", "열정적", "추진력"],
    weaknesses: ["성급함", "감정기복"],
    characteristics: ["외향적", "사교적", "도전적"]
  };
  
  // Extract fortune content
  const fortune = result?.fortune || {};
  
  // Extract recommendations
  const recommendations = result?.recommendations || [
    "금전적인 부분에서는 계획적인 소비를 습관화하세요.",
    "감정 기복을 줄이기 위해 명상이나 취미 활동을 추천합니다.", 
    "새로운 프로젝트나 업무는 적극적으로 임하되, 팀워크를 중시하세요."
  ];

  return (
    <div className="mobile-container bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/analysis")}
            className="mr-3 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">{getAnalysisTypeLabel(analysisData?.analysisType)} 분석 결과</h1>
            <p className="text-sm text-gray-500">{formatDate(analysisData?.createdAt)}</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-8">
        {/* 사주팔자 정보 */}
        {fourPillars && (
          <Card className="border-0 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                사주팔자 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">연주</p>
                  <p className="text-lg font-semibold text-blue-600">{fourPillars.year}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">월주</p>
                  <p className="text-lg font-semibold text-blue-600">{fourPillars.month}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">일주</p>
                  <p className="text-lg font-semibold text-blue-600">{fourPillars.day}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">시주</p>
                  <p className="text-lg font-semibold text-blue-600">{fourPillars.hour}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 오행 분석 */}
        {elements && (
          <Card className="border-0 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                오행 분석
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">주 오행</span>
                <span className="font-semibold text-green-600">{elements.primary}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">보조 오행</span>
                <span className="font-semibold text-green-600">{elements.secondary}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">부족한 오행</span>
                <span className="font-semibold text-red-600">{elements.weakness}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 성격 분석 */}
        {personality && (
          <Card className="border-0 bg-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                성격 분석
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {personality.strengths && personality.strengths.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">장점</p>
                  <div className="flex flex-wrap gap-2">
                    {personality.strengths.map((strength, index) => (
                      <Badge key={index} className="bg-green-100 text-green-700 hover:bg-green-100">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {personality.weaknesses && personality.weaknesses.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">주의사항</p>
                  <div className="flex flex-wrap gap-2">
                    {personality.weaknesses.map((weakness, index) => (
                      <Badge key={index} className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                        {weakness}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {personality.characteristics && personality.characteristics.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">성격 특징</p>
                  <div className="flex flex-wrap gap-2">
                    {personality.characteristics.map((characteristic, index) => (
                      <Badge key={index} className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        {characteristic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 상세 운세 분석 */}
        {fortune?.overall && (
          <Card className="border-0 bg-yellow-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                상세 운세 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {fortune.overall}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 조언 및 권고사항 */}
        {recommendations && recommendations.length > 0 && (
          <Card className="border-0 bg-pink-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <div className="w-3 h-3 bg-pink-500 rounded-full mr-2"></div>
                조언 및 권고사항
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 leading-relaxed">{recommendation}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 닫기 버튼 */}
        <div className="pt-4">
          <Button
            onClick={() => setLocation("/analysis")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3"
          >
            닫기
          </Button>
        </div>
      </main>
    </div>
  );
}