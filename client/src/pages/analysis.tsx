import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronRight, Calendar, TrendingUp, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BottomNavigation from "@/components/bottom-navigation";
import SajuAnalysisModal from "@/components/saju-analysis-modal";

export default function Analysis() {
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { data: analysesData, isLoading } = useQuery({
    queryKey: ["/api/saju/analyses"],
  });

  const analyses = analysesData?.analyses || [];

  const getAnalysisTypeInfo = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      comprehensive: { label: "종합운세", color: "bg-purple-100 text-purple-600" },
      comprehensive_fortune: { label: "종합운세", color: "bg-purple-100 text-purple-600" },
      career: { label: "진로상담", color: "bg-green-100 text-green-600" },
      love: { label: "연애운", color: "bg-pink-100 text-pink-600" },
      love_potential: { label: "연애운", color: "bg-pink-100 text-pink-600" },
      wealth: { label: "재물운", color: "bg-yellow-100 text-yellow-600" },
      health: { label: "건강운", color: "bg-blue-100 text-blue-600" },
      compatibility: { label: "궁합분석", color: "bg-red-100 text-red-600" },
      reunion_potential: { label: "재결합운", color: "bg-orange-100 text-orange-600" },
      reunion: { label: "재회운", color: "bg-orange-100 text-orange-600" },
      marriage: { label: "결혼운", color: "bg-rose-100 text-rose-600" },
      yearly: { label: "연간운세", color: "bg-indigo-100 text-indigo-600" },
      monthly: { label: "이번 달 운세", color: "bg-teal-100 text-teal-600" },
      daily: { label: "일일운세", color: "bg-cyan-100 text-cyan-600" }
    };
    return types[type] || { label: "기타", color: "bg-gray-100 text-gray-600" };
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">분석 내역을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-white border-b">
        <div className="flex items-center">
          <History className="w-6 h-6 text-indigo-600 mr-2" />
          <h1 className="text-xl font-bold text-gray-900">분석 기록</h1>
        </div>
      </header>

      <main className="px-4 pb-20">
        {/* Stats Card */}
        <Card className="my-4 gradient-bg text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">총 분석 횟수</p>
                <p className="text-2xl font-bold">{analyses.length}회</p>
              </div>
              <TrendingUp className="w-8 h-8 text-white opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* Analysis List */}
        {analyses.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">아직 분석 기록이 없습니다</h3>
              <p className="text-gray-500 mb-4">첫 번째 사주 분석을 시작해보세요!</p>
              <Button 
                onClick={() => setIsAnalysisModalOpen(true)}
                className="gradient-bg text-white"
              >
                분석 시작하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {analyses.map((analysis: any) => {
              const typeInfo = getAnalysisTypeInfo(analysis.analysisType);
              
              return (
                <Card key={analysis.id} className="soft-shadow hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{analysis.title}</h3>
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(analysis.createdAt)}
                        </div>
                      </div>
                      <Badge className={typeInfo.color}>
                        {typeInfo.label}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {analysis.summary}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-400">
                        생년월일: {analysis.birthData?.date || '정보 없음'}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-indigo-600 hover:text-indigo-800"
                        onClick={() => setLocation(`/analysis/${analysis.id}/detail`)}
                      >
                        자세히 보기
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNavigation />
      
      <SajuAnalysisModal 
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
      />
    </div>
  );
}
