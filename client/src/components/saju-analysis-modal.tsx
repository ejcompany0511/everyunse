import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import type { SajuAnalysis } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SajuResultDisplay from "@/components/saju-result-display";

interface SajuAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisType?: string;
}

interface FormData {
  birthDate: string;
  birthTime: string;
  gender: string;
  calendarType: string;
  isLeapMonth: boolean;
  birthCountry: string;
  timezone: string;
  analysisType: string;
  concern: string;
  partnerBirthDate: string;
  partnerBirthTime: string;
  partnerGender: string;
  partnerCalendarType: string;
  partnerIsLeapMonth: boolean;
}

export default function SajuAnalysisModal({ isOpen, onClose, analysisType = "overall" }: SajuAnalysisModalProps) {
  const [showResult, setShowResult] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [currentSajuView, setCurrentSajuView] = useState<"user" | "partner">("user"); // 사주 차트 전환 상태
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 사용자 정보 가져오기
  const { data: userInfo } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // 분석 타입이 변경될 때 결과 초기화
  useEffect(() => {
    setAnalysisResult(null);
    setShowResult(false);
    setCurrentSajuView("user");
  }, [analysisType]);

  const [formData, setFormData] = useState<FormData>({
    birthDate: "",
    birthTime: "",
    gender: "",
    calendarType: "solar",
    isLeapMonth: false,
    birthCountry: "KR",
    timezone: "Asia/Seoul",
    analysisType: analysisType,
    concern: "",
    partnerBirthDate: "",
    partnerBirthTime: "",
    partnerGender: "",
    partnerCalendarType: "solar",
    partnerIsLeapMonth: false,
  });

  // Update form data when analysisType prop changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, analysisType: analysisType }));
  }, [analysisType]);

  // Auto-fill form with user profile data when modal opens
  useEffect(() => {
    if (isOpen && userInfo?.user) {
      const user = userInfo.user;
      
      const mappedGender = user.gender === "남자" ? "male" : 
                          user.gender === "여자" ? "female" : 
                          user.gender === "남성" ? "male" : 
                          user.gender === "여성" ? "female" : "";
      
      setFormData(prev => ({
        ...prev,
        birthDate: user.birthDate || "",
        birthTime: user.birthTime || "",
        gender: mappedGender,
        calendarType: user.calendarType === "음력" ? "lunar" : "solar",
        isLeapMonth: user.isLeapMonth || false,
        birthCountry: user.birthCountry === "대한민국" ? "KR" : "KR",
        timezone: user.timezone || "Asia/Seoul",
      }));
    }
  }, [isOpen, userInfo]);

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const analyzeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // 상대방 날짜/시간 형식 변환
      let formattedPartnerBirthDate = data.partnerBirthDate;
      let formattedPartnerBirthTime = data.partnerBirthTime;

      // 상대방 생년월일 형식 변환 (YYYYMMDD → YYYY-MM-DD)
      if (data.partnerBirthDate && /^\d{8}$/.test(data.partnerBirthDate)) {
        const year = data.partnerBirthDate.substring(0, 4);
        const month = data.partnerBirthDate.substring(4, 6);
        const day = data.partnerBirthDate.substring(6, 8);
        formattedPartnerBirthDate = `${year}-${month}-${day}`;
      }

      // 상대방 출생시간 형식 변환 (HHMM → HH:MM)
      if (data.partnerBirthTime && /^\d{4}$/.test(data.partnerBirthTime)) {
        const hour = data.partnerBirthTime.substring(0, 2);
        const minute = data.partnerBirthTime.substring(2, 4);
        formattedPartnerBirthTime = `${hour}:${minute}`;
      }

      console.log("=== 전송 전 데이터 변환 ===");
      console.log("원본 상대방 생년월일:", data.partnerBirthDate, "→ 변환:", formattedPartnerBirthDate);
      console.log("원본 상대방 출생시간:", data.partnerBirthTime, "→ 변환:", formattedPartnerBirthTime);

      const response = await apiRequest("POST", "/api/saju/analyze", {
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        gender: data.gender,
        calendarType: data.calendarType,
        isLeapMonth: data.isLeapMonth,
        birthCountry: data.birthCountry,
        timezone: data.timezone,
        analysisType: data.analysisType,
        concern: data.concern,
        partnerBirthDate: formattedPartnerBirthDate,
        partnerBirthTime: formattedPartnerBirthTime,
        partnerGender: data.partnerGender,
        partnerCalendarType: data.partnerCalendarType,
        partnerIsLeapMonth: data.partnerIsLeapMonth,
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("=== 프론트엔드 응답 데이터 ===", data);
      
      // 서버에서 받은 결과를 파싱
      let parsedResult = data.result;
      if (typeof data.result === 'string') {
        try {
          parsedResult = JSON.parse(data.result);
        } catch (e) {
          console.error("결과 파싱 오류:", e);
        }
      }
      
      console.log("=== 파싱된 결과 ===", parsedResult);
      
      // 서버에서 받은 모든 데이터를 분석 결과에 포함
      const fullResult = {
        ...data.analysis,
        sajuCalculation: data.sajuCalculation,
        partnerSajuCalculation: data.partnerSajuCalculation,
        ...parsedResult  // 파싱된 GPT 결과를 직접 병합
      };
      
      console.log("=== 최종 결과 ===", fullResult);
      
      setAnalysisResult(fullResult);
      setShowResult(true);
      
      // Comprehensive cache invalidation to fix count synchronization
      queryClient.invalidateQueries({ queryKey: ["/api/saju/analyses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coins/balance"] });
      
      toast({
        title: "분석 완료",
        description: `${data.coinsUsed || 0}개의 냥을 사용하여 분석이 완료되었습니다.`,
      });
    },
    onError: (error: any) => {
      console.error("Analysis error:", error);
      toast({
        title: "분석 실패",
        description: error.message || "사주 분석 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 기본 정보 검증
    if (!formData.birthDate || !formData.gender) {
      toast({
        title: "입력 오류",
        description: "필수 정보를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 궁합/재회 분석의 경우 상대방 정보 검증
    if ((formData.analysisType === "compatibility" || formData.analysisType === "reunion")) {
      if (!formData.partnerBirthDate || !formData.partnerBirthTime || !formData.partnerGender) {
        toast({
          title: "상대방 정보 필요",
          description: "상대방의 생년월일, 출생시간, 성별을 모두 입력해주세요.",
          variant: "destructive",
        });
        return;
      }
      
      // 상대방 생년월일 형식 검증 (YYYY-MM-DD)
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(formData.partnerBirthDate)) {
        toast({
          title: "날짜 형식 오류",
          description: "상대방 생년월일을 YYYYMMDD 형식으로 입력해주세요 (예: 19981111)",
          variant: "destructive",
        });
        return;
      }

      // 상대방 출생시간 형식 검증 (HH:MM)
      const timePattern = /^\d{2}:\d{2}$/;
      if (!timePattern.test(formData.partnerBirthTime)) {
        toast({
          title: "시간 형식 오류", 
          description: "상대방 출생시간을 HHMM 형식으로 입력해주세요 (예: 1430)",
          variant: "destructive",
        });
        return;
      }
    }

    console.log("=== 폼 제출 데이터 ===", formData);
    analyzeMutation.mutate(formData);
  };

  const handleClose = () => {
    setShowResult(false);
    setAnalysisResult(null);
    setFormData({
      birthDate: "",
      birthTime: "",
      gender: "",
      calendarType: "solar",
      isLeapMonth: false,
      birthCountry: "KR",
      timezone: "Asia/Seoul",
      analysisType: "overall",
      concern: "",
      partnerBirthDate: "",
      partnerBirthTime: "",
      partnerGender: "",
      partnerCalendarType: "solar",
      partnerIsLeapMonth: false,
    });
    onClose();
  };

  const getAnalysisTitle = (type: string) => {
    const labels: Record<string, string> = {
      monthly: "이번 달 운세",
      career: "취업이 안되면 어쩌죠?",
      compatibility: "궁합 분석",
      reunion: "재회 가능할까요?",
      love: "연애할 수 있을까?",
      comprehensive: "나의 종합 운세",
      marriage: "결혼할 수 있을까요?",
      overall: "사주 분석",
      wealth: "재물운",
      health: "건강운"
    };
    return labels[type] || "사주 분석";
  }

  // 텍스트 포맷팅 함수 - 문단별 줄바꿈 처리
  const formatText = (text: string) => {
    if (!text) return text;
    
    // ### 헤더가 있는 경우 마크다운 처리
    if (text.includes('### ')) {
      const parts = text.split(/(### [^\n]+)/g);
      
      return parts.map((part, index) => {
        if (part.startsWith('### ')) {
          const headerText = part.replace('### ', '');
          return (
            <div key={index} className="mt-6 mb-4 first:mt-0">
              <h4 className="text-lg font-bold text-amber-800 border-b border-amber-200 pb-2">
                {headerText}
              </h4>
            </div>
          );
        } else if (part.trim()) {
          return (
            <div key={index} className="text-gray-700 leading-relaxed text-base mb-4">
              {formatTextContent(part)}
            </div>
          );
        }
        return null;
      }).filter(Boolean);
    } else {
      // 일반 텍스트의 경우
      return (
        <div className="text-gray-700 leading-relaxed text-base">
          {formatTextContent(text)}
        </div>
      );
    }
  };

  const formatTextContent = (text: string) => {
    if (!text.trim()) return null;
    
    // 먼저 문단으로 분리 (더블 줄바꿈 기준)
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    
    return paragraphs.map((paragraph, pIndex) => {
      // 각 문단을 문장으로 분리 (마침표, 느낌표, 물음표 기준)
      const sentences = paragraph
        .trim()
        .split(/([.!?]+\s*)/)
        .filter(s => s.trim())
        .reduce((acc, curr, index, array) => {
          // 마침표, 느낌표, 물음표를 이전 문장에 붙이기
          if (/^[.!?]+\s*$/.test(curr) && acc.length > 0) {
            acc[acc.length - 1] += curr;
          } else if (curr.trim()) {
            acc.push(curr);
          }
          return acc;
        }, [] as string[])
        .filter(s => s.trim().length > 1); // 너무 짧은 문장 제거
      
      return (
        <div key={pIndex} className="mb-4 last:mb-0">
          {sentences.map((sentence, sIndex) => (
            <div key={sIndex} className="mb-2 last:mb-0">
              {sentence.trim()}
            </div>
          ))}
        </div>
      );
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`w-full max-w-md mx-4 ${showResult ? 'max-w-4xl max-h-[90vh] overflow-y-auto' : 'max-h-[90vh] overflow-y-auto'}`}>
        <DialogHeader className="text-center">
          <DialogTitle className="bg-blue-50 rounded-lg p-3 text-blue-800 font-bold text-lg">
            {showResult ? getAnalysisTitle(formData.analysisType) : getAnalysisTitle(analysisType)}
          </DialogTitle>
        </DialogHeader>
        
        {showResult && analysisResult ? (
          <div className="space-y-6">
            {/* 상대방 사주 버튼 (궁합/재회 분석용) */}
            {(formData.analysisType === "reunion" || formData.analysisType === "compatibility") && analysisResult.partnerSajuCalculation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex justify-center space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentSajuView("user")}
                    className={`w-28 h-10 text-sm font-medium ${currentSajuView === "user" 
                      ? "bg-blue-500 text-white hover:bg-blue-600 border-blue-500" 
                      : "bg-white border-blue-200 text-blue-500 hover:bg-blue-50"
                    }`}
                  >
                    내 사주
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentSajuView("partner")}
                    className={`w-28 h-10 text-sm font-medium ${currentSajuView === "partner" 
                      ? "bg-blue-500 text-white hover:bg-blue-600 border-blue-500" 
                      : "bg-white border-blue-200 text-blue-500 hover:bg-blue-50"
                    }`}
                  >
                    상대방 사주
                  </Button>
                </div>
              </div>
            )}

            {/* 사주팔자 표 표시 */}
            {analysisResult.sajuCalculation && (
              <SajuResultDisplay 
                sajuCalculation={analysisResult.sajuCalculation}
                partnerSajuCalculation={analysisResult.partnerSajuCalculation}
                analysisType={formData.analysisType}
                currentView={currentSajuView}
              />
            )}

            {/* 분석 결과 내용 - 리포트 형식 */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{getAnalysisTitle(formData.analysisType)} 분석 결과</h3>
                <div className="w-20 h-1 bg-blue-500 mx-auto rounded-full"></div>
              </div>
              
              {/* 사주팔자 기본 정보 */}
              {analysisResult.fourPillars && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    사주팔자 정보
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">연주</div>
                      <div className="font-bold text-lg text-blue-700">{analysisResult.fourPillars.year}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">월주</div>
                      <div className="font-bold text-lg text-blue-700">{analysisResult.fourPillars.month}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">일주</div>
                      <div className="font-bold text-lg text-blue-700">{analysisResult.fourPillars.day}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">시주</div>
                      <div className="font-bold text-lg text-blue-700">{analysisResult.fourPillars.hour}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 오행 분석 */}
              {analysisResult.elements && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    오행 분석
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">주 오행</span>
                      <span className="font-bold text-green-700">{analysisResult.elements.primary}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">보조 오행</span>
                      <span className="font-bold text-green-700">{analysisResult.elements.secondary}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">부족한 오행</span>
                      <span className="font-bold text-red-600">{analysisResult.elements.weakness}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 성격 분석 */}
              {analysisResult.personality && (
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    성격 분석
                  </h4>
                  <div className="space-y-4">
                    {analysisResult.personality.strengths && (
                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-2">장점</div>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.personality.strengths.map((strength: string, index: number) => (
                            <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                              {strength}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysisResult.personality.weaknesses && (
                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-2">주의사항</div>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.personality.weaknesses.map((weakness: string, index: number) => (
                            <span key={index} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                              {weakness}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysisResult.personality.characteristics && (
                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-2">성격 특징</div>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.personality.characteristics.map((char: string, index: number) => (
                            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                              {char}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 상세 운세 분석 - 메인 컨텐츠 */}
              {analysisResult.fortune && analysisResult.fortune.overall && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-amber-800 mb-4 flex items-center">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                    상세 운세 분석
                  </h4>
                  <div className="prose max-w-none">
                    {formatText(analysisResult.fortune.overall)}
                  </div>
                </div>
              )}

              {/* 기타 운세 영역들 */}
              {analysisResult.fortune && Object.entries(analysisResult.fortune).filter(([key]) => key !== 'overall').length > 0 && (
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-teal-800 mb-4 flex items-center">
                    <div className="w-2 h-2 bg-teal-500 rounded-full mr-2"></div>
                    세부 운세
                  </h4>
                  <div className="space-y-4">
                    {Object.entries(analysisResult.fortune).filter(([key]) => key !== 'overall').map(([key, value]) => (
                      <div key={key} className="border-l-4 border-teal-300 pl-4">
                        <div className="font-medium text-teal-800 mb-1">
                          {key === 'love' ? '연애운' : 
                           key === 'career' ? '직장운' : 
                           key === 'wealth' ? '재물운' : 
                           key === 'health' ? '건강운' : 
                           key === 'study' ? '학업운' : 
                           key === 'family' ? '가족운' : 
                           key === 'compatibility' ? '궁합 분석' : 
                           key === 'marriage' ? '결혼운' :
                           key === 'reunion' ? '재회 가능할까요?' : 
                           key === 'monthly' ? '이번 달 운세' : key}
                        </div>
                        <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                          {formatText(value as string)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 조언 및 권고사항 */}
              {analysisResult.recommendations && (
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-rose-800 mb-4 flex items-center">
                    <div className="w-2 h-2 bg-rose-500 rounded-full mr-2"></div>
                    조언 및 권고사항
                  </h4>
                  <div className="space-y-3">
                    {analysisResult.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-rose-600 text-sm font-bold">{index + 1}</span>
                        </div>
                        <div className="text-gray-700 leading-relaxed">{rec}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center pt-4">
              <Button onClick={handleClose} className="w-full">
                닫기
              </Button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 내 정보 섹션 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <h3 className="text-lg font-semibold text-blue-800">내 정보</h3>
            </div>
            
            <div className="space-y-4">
              {/* 생년월일 */}
              <div>
                <Label htmlFor="birthDate">생년월일 *</Label>
                <Input
                  type="text"
                  id="birthDate"
                  value={formData.birthDate}
                  onChange={(e) => updateFormData({ birthDate: e.target.value })}
                  placeholder="19900515"
                  className="w-full mt-2 px-3 py-3 text-lg"
                />
              </div>

              {/* 출생시간 */}
              <div>
                <Label htmlFor="birthTime">출생시간 *</Label>
                <Input
                  type="text"
                  id="birthTime"
                  value={formData.birthTime}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    updateFormData({ birthTime: value });
                  }}
                  placeholder="1430"
                  maxLength={4}
                  className="w-full mt-2 px-3 py-3 text-lg"
                />
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    id="birthTimeUnknown"
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="birthTimeUnknown" className="text-sm text-gray-600">
                    출생시간 모름 (정오로 계산)
                  </Label>
                </div>
              </div>

              {/* 성별 */}
              <div>
                <Label>성별 *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    type="button"
                    variant={formData.gender === "male" ? "default" : "outline"}
                    onClick={() => updateFormData({ gender: "male" })}
                    className="h-12 text-lg"
                  >
                    남자
                  </Button>
                  <Button
                    type="button"
                    variant={formData.gender === "female" ? "default" : "outline"}
                    onClick={() => updateFormData({ gender: "female" })}
                    className="h-12 text-lg"
                  >
                    여자
                  </Button>
                </div>
              </div>

              {/* 달력 구분 */}
              <div>
                <Label>달력 구분 *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    type="button"
                    variant={formData.calendarType === "solar" ? "default" : "outline"}
                    onClick={() => updateFormData({ calendarType: "solar" })}
                    className="h-12 text-lg"
                  >
                    양력
                  </Button>
                  <Button
                    type="button"
                    variant={formData.calendarType === "lunar" ? "default" : "outline"}
                    onClick={() => updateFormData({ calendarType: "lunar" })}
                    className="h-12 text-lg"
                  >
                    음력
                  </Button>
                </div>
                {formData.calendarType === "lunar" && (
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      id="isLeapMonth"
                      checked={formData.isLeapMonth}
                      onChange={(e) => updateFormData({ isLeapMonth: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="isLeapMonth" className="text-sm text-gray-600">
                      윤달입니다
                    </Label>
                  </div>
                )}
              </div>

              {/* 출생 지역 */}
              <div>
                <Label htmlFor="birthCountry">출생 지역 *</Label>
                <Select 
                  value={formData.birthCountry} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      birthCountry: value,
                      timezone: value === "KR" ? "Asia/Seoul" :
                               value === "US" ? "America/New_York" :
                               value === "JP" ? "Asia/Tokyo" :
                               value === "CN" ? "Asia/Shanghai" : "Asia/Seoul"
                    }));
                  }}
                >
                  <SelectTrigger className="w-full mt-2 h-12 text-lg">
                    <SelectValue placeholder="선택해주세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KR">🇰🇷 한국 (서울)</SelectItem>
                    <SelectItem value="US">🇺🇸 미국 (동부)</SelectItem>
                    <SelectItem value="JP">🇯🇵 일본 (도쿄)</SelectItem>
                    <SelectItem value="CN">🇨🇳 중국 (베이징)</SelectItem>
                    <SelectItem value="OTHER">기타 지역</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>



          {/* 상대방 정보 (재회/궁합 분석용) */}
          {(analysisType === "reunion" || analysisType === "compatibility") && (
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-pink-500 rounded-full mr-2"></div>
                <h3 className="text-lg font-semibold text-pink-800">상대방 정보</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="partnerBirthDate">상대방 생년월일 *</Label>
                  <Input
                    type="text"
                    id="partnerBirthDate"
                    value={formData.partnerBirthDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, ''); // 숫자만 남기기
                      if (value.length >= 8) {
                        // YYYYMMDD 형식을 YYYY-MM-DD로 변환
                        const year = value.slice(0, 4);
                        const month = value.slice(4, 6);
                        const day = value.slice(6, 8);
                        value = `${year}-${month}-${day}`;
                      }
                      setFormData(prev => ({ ...prev, partnerBirthDate: value }));
                    }}
                    placeholder="19900515"
                    className="w-full mt-2 px-3 py-3 text-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="partnerBirthTime">상대방 출생시간 *</Label>
                  <Input
                    type="text"
                    id="partnerBirthTime"
                    value={formData.partnerBirthTime}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      if (value.length >= 4) {
                        // HHMM 형식을 HH:MM로 변환
                        const hour = value.slice(0, 2);
                        const minute = value.slice(2, 4);
                        value = `${hour}:${minute}`;
                      }
                      setFormData(prev => ({ ...prev, partnerBirthTime: value }));
                    }}
                    placeholder="1430"
                    className="w-full mt-2 px-3 py-3 text-lg"
                  />
                  <div className="flex items-center mt-2 space-x-2">
                    <input
                      type="checkbox"
                      id="partnerTimeUnknown"
                      checked={formData.partnerBirthTime === "1200"}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, partnerBirthTime: "1200" }));
                        } else {
                          setFormData(prev => ({ ...prev, partnerBirthTime: "" }));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="partnerTimeUnknown" className="text-sm text-gray-600">
                      출생시간 모름 (정오로 계산)
                    </Label>
                  </div>
                </div>

                <div>
                  <Label>상대방 성별</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      type="button"
                      variant={formData.partnerGender === "male" ? "default" : "outline"}
                      onClick={() => setFormData(prev => ({ ...prev, partnerGender: "male" }))}
                      className="h-12 text-lg"
                    >
                      남자
                    </Button>
                    <Button
                      type="button"
                      variant={formData.partnerGender === "female" ? "default" : "outline"}
                      onClick={() => setFormData(prev => ({ ...prev, partnerGender: "female" }))}
                      className="h-12 text-lg"
                    >
                      여자
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>상대방 달력 구분</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      type="button"
                      variant={formData.partnerCalendarType === "solar" ? "default" : "outline"}
                      onClick={() => setFormData(prev => ({ ...prev, partnerCalendarType: "solar" }))}
                      className="h-12 text-lg"
                    >
                      양력
                    </Button>
                    <Button
                      type="button"
                      variant={formData.partnerCalendarType === "lunar" ? "default" : "outline"}
                      onClick={() => setFormData(prev => ({ ...prev, partnerCalendarType: "lunar" }))}
                      className="h-12 text-lg"
                    >
                      음력
                    </Button>
                  </div>
                  {formData.partnerCalendarType === "lunar" && (
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        id="partnerIsLeapMonth"
                        checked={formData.partnerIsLeapMonth}
                        onChange={(e) => setFormData(prev => ({ ...prev, partnerIsLeapMonth: e.target.checked }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="partnerIsLeapMonth" className="text-sm text-gray-600">상대방도 윤달입니다</Label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 고민 입력 필드 */}
          <div>
            <Label htmlFor="concern">
              {(analysisType === "reunion" || analysisType === "compatibility") 
                ? "상대방과의 상황을 적어주세요" 
                : "고민을 작성해주세요"}
            </Label>
            <textarea
              id="concern"
              value={formData.concern}
              onChange={(e) => updateFormData({ concern: e.target.value })}
              placeholder={
                (analysisType === "reunion" || analysisType === "compatibility")
                  ? "현재 그 사람과의 관계나 상황을 자세히 작성해주세요"
                  : "운세 분석에 참고할 고민이나 궁금한 점을 작성해주세요"
              }
              className="mt-2 w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-lg"
              rows={3}
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 h-12 text-lg"
              onClick={onClose}
              disabled={analyzeMutation.isPending}
            >
              취소
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-12 text-lg gradient-bg text-white hover:opacity-90"
              disabled={analyzeMutation.isPending}
            >
              {analyzeMutation.isPending ? "분석 중..." : "분석하기"}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}