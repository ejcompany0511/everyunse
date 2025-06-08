import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Bell, Palette, HelpCircle, UserX, X } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [dataCollection, setDataCollection] = useState(true);

  // 로그아웃 뮤테이션
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      onClose();
      toast({
        title: "로그아웃 완료",
        description: "성공적으로 로그아웃되었습니다.",
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "로그아웃 실패",
        description: "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 계정 삭제 뮤테이션
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/auth/account");
    },
    onSuccess: () => {
      queryClient.clear();
      onClose();
      toast({
        title: "계정 삭제 완료",
        description: "계정이 성공적으로 삭제되었습니다.",
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "계정 삭제 실패",
        description: "계정 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleNotificationToggle = (checked: boolean) => {
    setNotifications(checked);
    toast({
      title: "알림 설정 변경",
      description: checked ? "알림이 활성화되었습니다." : "알림이 비활성화되었습니다.",
    });
  };

  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked);
    toast({
      title: "화면 모드 변경",
      description: checked ? "다크 모드가 활성화되었습니다." : "라이트 모드가 활성화되었습니다.",
    });
  };

  const handleDataCollectionToggle = (checked: boolean) => {
    setDataCollection(checked);
    toast({
      title: "데이터 수집 설정 변경",
      description: checked ? "데이터 수집이 허용되었습니다." : "데이터 수집이 차단되었습니다.",
    });
  };

  const handleLogout = () => {
    if (confirm("정말 로그아웃하시겠습니까?")) {
      logoutMutation.mutate();
    }
  };

  const handleDeleteAccount = () => {
    if (confirm("정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      deleteAccountMutation.mutate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">설정</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 알림 설정 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium">알림 설정</h3>
            </div>
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="text-sm font-medium">
                  푸시 알림
                </Label>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
              <p className="text-xs text-gray-600">
                사주 분석 완료, 새로운 기능 소식 등을 받아보세요
              </p>
            </div>
          </div>

          {/* 화면 설정 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Palette className="w-5 h-5 text-purple-600" />
              <h3 className="font-medium">화면 설정</h3>
            </div>
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="darkMode" className="text-sm font-medium">
                  다크 모드
                </Label>
                <Switch
                  id="darkMode"
                  checked={darkMode}
                  onCheckedChange={handleDarkModeToggle}
                />
              </div>
              <p className="text-xs text-gray-600">
                어두운 테마로 눈의 피로를 줄여보세요
              </p>
            </div>
          </div>

          {/* 개인정보 설정 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <UserX className="w-5 h-5 text-green-600" />
              <h3 className="font-medium">개인정보 설정</h3>
            </div>
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="dataCollection" className="text-sm font-medium">
                  데이터 수집 허용
                </Label>
                <Switch
                  id="dataCollection"
                  checked={dataCollection}
                  onCheckedChange={handleDataCollectionToggle}
                />
              </div>
              <p className="text-xs text-gray-600">
                서비스 개선을 위한 익명 데이터 수집에 동의합니다
              </p>
            </div>
          </div>

          {/* 도움말 및 지원 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-orange-600" />
              <h3 className="font-medium">도움말 및 지원</h3>
            </div>
            <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
              <Button variant="ghost" className="w-full justify-start text-sm h-8">
                자주 묻는 질문
              </Button>
              <Button variant="ghost" className="w-full justify-start text-sm h-8">
                고객센터 문의
              </Button>
              <Button variant="ghost" className="w-full justify-start text-sm h-8">
                서비스 이용약관
              </Button>
              <Button variant="ghost" className="w-full justify-start text-sm h-8">
                개인정보 처리방침
              </Button>
            </div>
          </div>

          {/* 계정 관리 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <UserX className="w-5 h-5 text-red-600" />
              <h3 className="font-medium">계정 관리</h3>
            </div>
            <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
              <Button
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                variant="ghost"
                className="w-full justify-start text-sm h-8 text-gray-700"
              >
                {logoutMutation.isPending ? "로그아웃 중..." : "로그아웃"}
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={deleteAccountMutation.isPending}
                variant="ghost"
                className="w-full justify-start text-sm h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {deleteAccountMutation.isPending ? "계정 삭제 중..." : "계정 삭제"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}