import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, User } from "lucide-react";

interface PersonalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    id: number;
    username: string;
    email?: string;
    birthDate?: string;
    birthTime?: string;
    gender?: string;
    calendarType?: string;
    isLeapMonth?: boolean;
    birthCountry?: string;
    timezone?: string;
    birthTimeUnknown?: boolean;
  };
}

interface PersonalInfoFormData {
  name: string;
  birthDate: string;
  birthTime: string;
  gender: string;
  calendarType: string;
  isLeapMonth: boolean;
  birthCountry: string;
  timezone: string;
  birthTimeUnknown: boolean;
}

export default function PersonalInfoModal({ isOpen, onClose, user }: PersonalInfoModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<PersonalInfoFormData>({
    name: "",
    birthDate: "",
    birthTime: "",
    gender: "",
    calendarType: "solar",
    isLeapMonth: false,
    birthCountry: "KR",
    timezone: "Asia/Seoul",
    birthTimeUnknown: false,
  });

  // 사용자 정보로 폼 초기화
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.username || "",
        birthDate: user.birthDate || "",
        birthTime: user.birthTime || "",
        gender: user.gender || "",
        calendarType: user.calendarType || "solar",
        isLeapMonth: user.isLeapMonth || false,
        birthCountry: user.birthCountry || "KR",
        timezone: user.timezone || "Asia/Seoul",
        birthTimeUnknown: user.birthTimeUnknown || false,
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: PersonalInfoFormData) => {
      return await apiRequest("PUT", "/api/auth/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "개인 정보 저장 완료",
        description: "개인 정보가 성공적으로 저장되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "저장 실패",
        description: error.message || "개인 정보 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    // 필수 필드 검증
    if (!formData.name.trim()) {
      toast({
        title: "이름을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    if (!formData.birthDate.trim()) {
      toast({
        title: "생년월일을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    if (!formData.gender) {
      toast({
        title: "성별을 선택해주세요",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate(formData);
  };

  const formatBirthDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 8);
    if (cleaned.length >= 4) {
      const year = cleaned.slice(0, 4);
      const month = cleaned.slice(4, 6);
      const day = cleaned.slice(6, 8);
      
      let formatted = year;
      if (month) formatted += `-${month}`;
      if (day) formatted += `-${day}`;
      
      return formatted;
    }
    return cleaned;
  };

  const formatBirthTime = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      const hour = cleaned.slice(0, 2);
      const minute = cleaned.slice(2, 4);
      
      let formatted = hour;
      if (minute) formatted += `:${minute}`;
      
      return formatted;
    }
    return cleaned;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">사주 정보 설정</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 사주 정보 헤더 */}
          <div className="flex items-center space-x-2 text-blue-600">
            <User className="w-5 h-5" />
            <span className="font-medium">사주 정보</span>
          </div>

          {/* 이름과 성별 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">이름</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="이정훈"
                className="mt-1 border-2 border-blue-200 focus:border-blue-400"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">성별</Label>
              <Select 
                value={formData.gender} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
              >
                <SelectTrigger className="mt-1 border-2 border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="성별 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="남자">남자</SelectItem>
                  <SelectItem value="여자">여자</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 생년월일과 태어난 시간 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birthDate" className="text-sm font-medium">생년월일</Label>
              <Input
                id="birthDate"
                value={formData.birthDate}
                onChange={(e) => {
                  const formatted = formatBirthDate(e.target.value);
                  setFormData(prev => ({ ...prev, birthDate: formatted }));
                }}
                placeholder="1996-04-09"
                className="mt-1 border-2 border-blue-200 focus:border-blue-400"
              />
            </div>
            <div>
              <Label htmlFor="birthTime" className="text-sm font-medium">태어난 시간</Label>
              <Input
                id="birthTime"
                value={formData.birthTimeUnknown ? "" : formData.birthTime}
                onChange={(e) => {
                  const formatted = formatBirthTime(e.target.value);
                  setFormData(prev => ({ ...prev, birthTime: formatted }));
                }}
                placeholder="22:58"
                disabled={formData.birthTimeUnknown}
                className="mt-1 border-2 border-blue-200 focus:border-blue-400"
              />
            </div>
          </div>

          {/* 태어난 시간 모름 체크박스 */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="birthTimeUnknown"
              checked={formData.birthTimeUnknown}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                birthTimeUnknown: e.target.checked,
                birthTime: e.target.checked ? "" : prev.birthTime
              }))}
              className="rounded border-gray-300"
            />
            <Label htmlFor="birthTimeUnknown" className="text-sm text-gray-600">
              태어난 시간 모름
            </Label>
          </div>

          {/* 달력 종류와 출생 국가 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">달력 종류</Label>
              <Select 
                value={formData.calendarType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, calendarType: value }))}
              >
                <SelectTrigger className="mt-1 border-2 border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="달력 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="양력">양력</SelectItem>
                  <SelectItem value="음력">음력</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">출생 국가</Label>
              <Input
                value={formData.birthCountry}
                onChange={(e) => setFormData(prev => ({ ...prev, birthCountry: e.target.value }))}
                placeholder="대한민국"
                className="mt-1 border-2 border-blue-200 focus:border-blue-400"
              />
            </div>
          </div>

          {/* 윤달 체크박스 (음력인 경우만 표시) */}
          {formData.calendarType === "음력" && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isLeapMonth"
                checked={formData.isLeapMonth}
                onChange={(e) => setFormData(prev => ({ ...prev, isLeapMonth: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isLeapMonth" className="text-sm text-gray-600">
                윤달입니다
              </Label>
            </div>
          )}

          {/* 저장 버튼 */}
          <Button
            onClick={handleSave}
            disabled={updateProfileMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
          >
            {updateProfileMutation.isPending ? "저장 중..." : "사주 정보 저장"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}