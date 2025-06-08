import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Star, TrendingUp } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PersonInfo {
  name: string;
  birthDate: string;
  birthTime: string;
  gender: string;
  calendarType: string;
  isLeapMonth: boolean;
}

interface CompatibilityResult {
  overallScore: number;
  loveCompatibility: number;
  marriageCompatibility: number;
  personalityMatch: number;
  elementHarmony: number;
  analysis: {
    strengths: string[];
    challenges: string[];
    recommendations: string[];
    elementAnalysis: string;
    personalityAnalysis: string;
  };
  person1Saju: any;
  person2Saju: any;
}

export default function CompatibilityMatcher() {
  const { toast } = useToast();
  const [person1, setPerson1] = useState<PersonInfo>({
    name: "",
    birthDate: "",
    birthTime: "",
    gender: "",
    calendarType: "solar",
    isLeapMonth: false
  });
  
  const [person2, setPerson2] = useState<PersonInfo>({
    name: "",
    birthDate: "",
    birthTime: "",
    gender: "",
    calendarType: "solar",
    isLeapMonth: false
  });

  const [result, setResult] = useState<CompatibilityResult | null>(null);

  const analyzeCompatibility = useMutation({
    mutationFn: async (data: { person1: PersonInfo; person2: PersonInfo }) => {
      const response = await apiRequest("/api/compatibility/analyze", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("궁합 분석에 실패했습니다");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data.compatibility);
      toast({
        title: "궁합 분석 완료!",
        description: "두 분의 사주 궁합을 분석했습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "분석 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (!person1.name || !person1.birthDate || !person1.birthTime || !person1.gender ||
        !person2.name || !person2.birthDate || !person2.birthTime || !person2.gender) {
      toast({
        title: "입력 확인",
        description: "두 분의 정보를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    analyzeCompatibility.mutate({ person1, person2 });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    return "needs-work";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Heart className="h-6 w-6 text-pink-500" />
            사주 궁합 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 첫 번째 사람 정보 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-blue-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                첫 번째 분
              </h3>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="person1-name">이름</Label>
                  <Input
                    id="person1-name"
                    value={person1.name}
                    onChange={(e) => setPerson1({...person1, name: e.target.value})}
                    placeholder="이름을 입력하세요"
                  />
                </div>
                
                <div>
                  <Label htmlFor="person1-date">생년월일</Label>
                  <Input
                    id="person1-date"
                    type="date"
                    value={person1.birthDate}
                    onChange={(e) => setPerson1({...person1, birthDate: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="person1-time">생시</Label>
                  <Input
                    id="person1-time"
                    type="time"
                    value={person1.birthTime}
                    onChange={(e) => setPerson1({...person1, birthTime: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="person1-gender">성별</Label>
                  <Select value={person1.gender} onValueChange={(value) => setPerson1({...person1, gender: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="성별 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">남자</SelectItem>
                      <SelectItem value="female">여자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="person1-calendar">음력/양력</Label>
                  <Select value={person1.calendarType} onValueChange={(value) => setPerson1({...person1, calendarType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solar">양력</SelectItem>
                      <SelectItem value="lunar">음력</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 두 번째 사람 정보 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-pink-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                두 번째 분
              </h3>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="person2-name">이름</Label>
                  <Input
                    id="person2-name"
                    value={person2.name}
                    onChange={(e) => setPerson2({...person2, name: e.target.value})}
                    placeholder="이름을 입력하세요"
                  />
                </div>
                
                <div>
                  <Label htmlFor="person2-date">생년월일</Label>
                  <Input
                    id="person2-date"
                    type="date"
                    value={person2.birthDate}
                    onChange={(e) => setPerson2({...person2, birthDate: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="person2-time">생시</Label>
                  <Input
                    id="person2-time"
                    type="time"
                    value={person2.birthTime}
                    onChange={(e) => setPerson2({...person2, birthTime: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="person2-gender">성별</Label>
                  <Select value={person2.gender} onValueChange={(value) => setPerson2({...person2, gender: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="성별 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">남자</SelectItem>
                      <SelectItem value="female">여자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="person2-calendar">음력/양력</Label>
                  <Select value={person2.calendarType} onValueChange={(value) => setPerson2({...person2, calendarType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solar">양력</SelectItem>
                      <SelectItem value="lunar">음력</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mt-6">
            <Button
              onClick={handleAnalyze}
              disabled={analyzeCompatibility.isPending}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-2"
            >
              {analyzeCompatibility.isPending ? "분석 중..." : "궁합 분석하기"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 궁합 분석 결과 */}
      {result && (
        <div className="space-y-6">
          {/* 전체 궁합 점수 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {person1.name}님과 {person2.name}님의 궁합
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-6xl font-bold text-gradient bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  {result.overallScore}점
                </div>
                <Badge variant={getScoreBadge(result.overallScore)} className="text-lg px-4 py-2">
                  {result.overallScore >= 80 ? "환상의 궁합!" : 
                   result.overallScore >= 60 ? "좋은 궁합" : "노력이 필요한 궁합"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 세부 점수 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Heart className="h-8 w-8 mx-auto mb-2 text-pink-500" />
                <div className="text-2xl font-bold text-pink-600">{result.loveCompatibility}점</div>
                <div className="text-sm text-gray-600">연애운</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold text-purple-600">{result.marriageCompatibility}점</div>
                <div className="text-sm text-gray-600">결혼운</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold text-blue-600">{result.personalityMatch}점</div>
                <div className="text-sm text-gray-600">성격궁합</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold text-green-600">{result.elementHarmony}점</div>
                <div className="text-sm text-gray-600">오행조화</div>
              </CardContent>
            </Card>
          </div>

          {/* 상세 분석 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">✨ 장점</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">⚠️ 주의점</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.analysis.challenges.map((challenge, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span className="text-sm">{challenge}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-purple-600">💡 개선 방안</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span className="text-sm">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📊 오행 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">{result.analysis.elementAnalysis}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🧠 성격 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">{result.analysis.personalityAnalysis}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}