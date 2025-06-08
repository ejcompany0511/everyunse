import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Heart, Briefcase, Send, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BottomNavigation from "@/components/bottom-navigation";

interface CoachingSession {
  id: number;
  sessionType: string;
  topic: string;
  content: string;
  aiResponse: string;
  createdAt: string;
}

interface SessionFormData {
  sessionType: string;
  topic: string;
  content: string;
}

export default function Coaching() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CoachingSession | null>(null);
  const [formData, setFormData] = useState<SessionFormData>({
    sessionType: "",
    topic: "",
    content: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ["/api/coaching/sessions"],
  });

  const sessions = sessionsData?.sessions || [];

  const createSessionMutation = useMutation({
    mutationFn: async (data: SessionFormData) => {
      const response = await apiRequest("POST", "/api/coaching/session", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "코칭 완료",
        description: "AI 코칭 세션이 완료되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coaching/sessions"] });
      setSelectedSession(data.session);
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast({
        title: "코칭 실패",
        description: error.message || "코칭 세션 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const sessionTypes = [
    { value: "love", label: "연애 코칭", icon: Heart, color: "bg-pink-100 text-pink-600" },
    { value: "career", label: "진로 상담", icon: Briefcase, color: "bg-green-100 text-green-600" },
    { value: "general", label: "일반 상담", icon: MessageSquare, color: "bg-blue-100 text-blue-600" }
  ];

  const getSessionTypeInfo = (type: string) => {
    return sessionTypes.find(t => t.value === type) || sessionTypes[2];
  };

  const handleOpenModal = () => {
    setFormData({
      sessionType: "",
      topic: "",
      content: ""
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      sessionType: "",
      topic: "",
      content: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sessionType || !formData.topic || !formData.content) {
      toast({
        title: "입력 오류",
        description: "모든 필수 항목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    createSessionMutation.mutate(formData);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">코칭 기록을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show session detail view
  if (selectedSession) {
    const typeInfo = getSessionTypeInfo(selectedSession.sessionType);
    const Icon = typeInfo.icon;

    return (
      <div className="mobile-container">
        <header className="flex justify-between items-center p-4 bg-white border-b">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedSession(null)}
            className="text-indigo-600"
          >
            ← 뒤로
          </Button>
          <h1 className="text-lg font-semibold">코칭 상세</h1>
          <div></div>
        </header>

        <main className="px-4 pb-20">
          <Card className="mt-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Icon className="w-5 h-5 mr-2" />
                  {selectedSession.topic}
                </CardTitle>
                <Badge className={typeInfo.color}>
                  {typeInfo.label}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                {formatDate(selectedSession.createdAt)}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">상담 내용</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {selectedSession.content}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">AI 조언</h4>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {selectedSession.aiResponse}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="mobile-container">
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-white border-b">
        <div className="flex items-center">
          <MessageSquare className="w-6 h-6 text-indigo-600 mr-2" />
          <h1 className="text-xl font-bold text-gray-900">AI 코칭</h1>
        </div>
        <Button 
          onClick={handleOpenModal}
          className="gradient-bg text-white"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          새 세션
        </Button>
      </header>

      <main className="px-4 pb-20">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 my-4">
          {sessionTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card 
                key={type.value}
                className="action-card"
                onClick={() => {
                  setFormData(prev => ({ ...prev, sessionType: type.value }));
                  setIsModalOpen(true);
                }}
              >
                <CardContent className="p-3 text-center">
                  <div className={`icon-circle ${type.color} mx-auto mb-2`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium">{type.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats */}
        <Card className="mb-4 gradient-bg text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">총 코칭 세션</p>
                <p className="text-2xl font-bold">{sessions.length}회</p>
              </div>
              <MessageSquare className="w-8 h-8 text-white opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">아직 코칭 세션이 없습니다</h3>
              <p className="text-gray-500 mb-4">AI와 함께하는 첫 번째 상담을 시작해보세요!</p>
              <Button 
                onClick={handleOpenModal}
                className="gradient-bg text-white"
              >
                코칭 시작하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session: CoachingSession) => {
              const typeInfo = getSessionTypeInfo(session.sessionType);
              const Icon = typeInfo.icon;
              
              return (
                <Card 
                  key={session.id} 
                  className="soft-shadow hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedSession(session)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center flex-1">
                        <Icon className="w-5 h-5 mr-2 text-gray-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">{session.topic}</h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(session.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Badge className={typeInfo.color}>
                        {typeInfo.label}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {session.content}
                    </p>
                    
                    <div className="text-xs text-indigo-600">
                      상세 보기 →
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNavigation />

      {/* New Session Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="w-full max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>새 코칭 세션</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="sessionType">상담 유형 *</Label>
              <Select 
                value={formData.sessionType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, sessionType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="상담 유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {sessionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="topic">상담 주제 *</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="상담받고 싶은 주제를 입력하세요"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="content">상담 내용 *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="구체적인 상황이나 고민을 자세히 설명해주세요"
                rows={4}
                required
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={handleCloseModal}
                disabled={createSessionMutation.isPending}
              >
                취소
              </Button>
              <Button 
                type="submit" 
                className="flex-1 gradient-bg text-white hover:opacity-90"
                disabled={createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    분석중...
                  </div>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-1" />
                    코칭 시작
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
