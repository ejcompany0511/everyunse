import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, MessageCircle, AlertTriangle, Send } from "lucide-react";

interface CustomerSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    id: number;
    username: string;
    email?: string;
    name?: string;
  };
}

export default function CustomerSupportModal({ isOpen, onClose, user }: CustomerSupportModalProps) {
  const [inquiryForm, setInquiryForm] = useState({
    title: "",
    content: "",
    category: "service",
    priority: "normal"
  });

  const [reportForm, setReportForm] = useState({
    title: "",
    description: "",
    reportType: "inappropriate_content",
    targetType: "user",
    targetId: "",
    priority: "normal"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 문의 제출
  const submitInquiryMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/customer-support/inquiries", {
        ...inquiryForm,
        userId: user?.id,
        userName: user?.name || user?.username,
        userEmail: user?.email,
        status: "pending"
      });
    },
    onSuccess: () => {
      toast({
        title: "문의 접수 완료",
        description: "문의가 성공적으로 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.",
      });
      setInquiryForm({
        title: "",
        content: "",
        category: "service",
        priority: "normal"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-support"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "문의 접수 실패",
        description: "문의 접수 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  // 신고 제출
  const submitReportMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/customer-support/reports", {
        ...reportForm,
        reporterId: user?.id,
        reporterName: user?.name || user?.username,
        status: "pending"
      });
    },
    onSuccess: () => {
      toast({
        title: "신고 접수 완료",
        description: "신고가 성공적으로 접수되었습니다. 검토 후 조치하겠습니다.",
      });
      setReportForm({
        title: "",
        description: "",
        reportType: "inappropriate_content",
        targetType: "user",
        targetId: "",
        priority: "normal"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-support"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "신고 접수 실패",
        description: "신고 접수 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.title.trim() || !inquiryForm.content.trim()) {
      toast({
        title: "입력 오류",
        description: "제목과 내용을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    submitInquiryMutation.mutate();
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.title.trim() || !reportForm.description.trim()) {
      toast({
        title: "입력 오류",
        description: "제목과 설명을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    submitReportMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            고객 지원
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Tabs defaultValue="inquiry" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inquiry" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              문의하기
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              신고하기
            </TabsTrigger>
          </TabsList>

          {/* 문의하기 탭 */}
          <TabsContent value="inquiry" className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">문의 안내</h3>
              <p className="text-sm text-blue-700">
                서비스 이용 중 궁금한 점이나 문제가 있으시면 언제든지 문의해주세요.
                영업일 기준 24시간 내에 답변드리겠습니다.
              </p>
            </div>

            <form onSubmit={handleInquirySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inquiry-category">카테고리</Label>
                  <Select 
                    value={inquiryForm.category} 
                    onValueChange={(value) => setInquiryForm({ ...inquiryForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">서비스 이용</SelectItem>
                      <SelectItem value="payment">결제/환불</SelectItem>
                      <SelectItem value="technical">기술적 문제</SelectItem>
                      <SelectItem value="account">계정 관리</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="inquiry-priority">우선순위</Label>
                  <Select 
                    value={inquiryForm.priority} 
                    onValueChange={(value) => setInquiryForm({ ...inquiryForm, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="우선순위 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">낮음</SelectItem>
                      <SelectItem value="normal">보통</SelectItem>
                      <SelectItem value="high">높음</SelectItem>
                      <SelectItem value="urgent">긴급</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="inquiry-title">제목</Label>
                <Input
                  id="inquiry-title"
                  value={inquiryForm.title}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, title: e.target.value })}
                  placeholder="문의 제목을 입력해주세요"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="inquiry-content">내용</Label>
                <Textarea
                  id="inquiry-content"
                  value={inquiryForm.content}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, content: e.target.value })}
                  placeholder="문의 내용을 자세히 설명해주세요"
                  rows={6}
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {inquiryForm.content.length}/1000자
                </p>
              </div>

              <Button
                type="submit"
                disabled={submitInquiryMutation.isPending || !inquiryForm.title.trim() || !inquiryForm.content.trim()}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitInquiryMutation.isPending ? "문의 접수 중..." : "문의 접수하기"}
              </Button>
            </form>
          </TabsContent>

          {/* 신고하기 탭 */}
          <TabsContent value="report" className="space-y-6">
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-semibold text-orange-800 mb-2">신고 안내</h3>
              <p className="text-sm text-orange-700">
                부적절한 콘텐츠나 사용자를 발견하시면 신고해주세요.
                허위 신고 시 제재를 받을 수 있습니다.
              </p>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="report-type">신고 유형</Label>
                  <Select 
                    value={reportForm.reportType} 
                    onValueChange={(value) => setReportForm({ ...reportForm, reportType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="신고 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inappropriate_content">부적절한 콘텐츠</SelectItem>
                      <SelectItem value="spam">스팸/광고</SelectItem>
                      <SelectItem value="harassment">괴롭힘/욕설</SelectItem>
                      <SelectItem value="fraud">사기/허위정보</SelectItem>
                      <SelectItem value="privacy_violation">개인정보 침해</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="report-target">신고 대상</Label>
                  <Select 
                    value={reportForm.targetType} 
                    onValueChange={(value) => setReportForm({ ...reportForm, targetType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="신고 대상 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">사용자</SelectItem>
                      <SelectItem value="review">후기</SelectItem>
                      <SelectItem value="content">콘텐츠</SelectItem>
                      <SelectItem value="service">서비스</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="report-target-id">대상 ID (선택사항)</Label>
                <Input
                  id="report-target-id"
                  value={reportForm.targetId}
                  onChange={(e) => setReportForm({ ...reportForm, targetId: e.target.value })}
                  placeholder="신고 대상의 ID나 링크를 입력하세요"
                />
              </div>

              <div>
                <Label htmlFor="report-title">신고 제목</Label>
                <Input
                  id="report-title"
                  value={reportForm.title}
                  onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                  placeholder="신고 제목을 간단히 입력해주세요"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="report-description">신고 내용</Label>
                <Textarea
                  id="report-description"
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  placeholder="신고 내용을 구체적으로 설명해주세요"
                  rows={6}
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {reportForm.description.length}/1000자
                </p>
              </div>

              <Button
                type="submit"
                disabled={submitReportMutation.isPending || !reportForm.title.trim() || !reportForm.description.trim()}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                {submitReportMutation.isPending ? "신고 접수 중..." : "신고 접수하기"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}