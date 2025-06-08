import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Bell, Moon, Sun, Shield, HelpCircle, LogOut, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 설정 상태
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [dataPrivacy, setDataPrivacy] = useState(true);

  // 로그아웃 뮤테이션
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
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
    // 실제 다크모드 적용 로직은 추후 구현
    toast({
      title: "테마 설정 변경", 
      description: checked ? "다크 모드가 활성화되었습니다." : "라이트 모드가 활성화되었습니다.",
    });
  };

  const handleDataPrivacyToggle = (checked: boolean) => {
    setDataPrivacy(checked);
    toast({
      title: "데이터 개인정보 설정 변경",
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
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate("/my")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">설정</h1>
          <div className="w-10" /> {/* 균형을 위한 빈 공간 */}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 알림 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <span>알림 설정</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications" className="text-sm font-medium">
                  푸시 알림
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  사주 분석 완료 및 중요 업데이트 알림
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={handleNotificationToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* 화면 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sun className="w-5 h-5 text-yellow-600" />
              <span>화면 설정</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="darkmode" className="text-sm font-medium">
                  다크 모드
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  어두운 테마로 변경
                </p>
              </div>
              <Switch
                id="darkmode"
                checked={darkMode}
                onCheckedChange={handleDarkModeToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* 개인정보 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span>개인정보 설정</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dataprivacy" className="text-sm font-medium">
                  데이터 수집 허용
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  서비스 개선을 위한 익명 데이터 수집
                </p>
              </div>
              <Switch
                id="dataprivacy"
                checked={dataPrivacy}
                onCheckedChange={handleDataPrivacyToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* 도움말 및 지원 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-purple-600" />
              <span>도움말 및 지원</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="ghost" className="w-full justify-start p-3 h-auto">
              <div className="text-left">
                <p className="font-medium">자주 묻는 질문</p>
                <p className="text-xs text-gray-500 mt-1">FAQ 및 사용법 안내</p>
              </div>
            </Button>
            <Button variant="ghost" className="w-full justify-start p-3 h-auto">
              <div className="text-left">
                <p className="font-medium">고객 지원</p>
                <p className="text-xs text-gray-500 mt-1">문의사항 및 기술 지원</p>
              </div>
            </Button>
            <Button variant="ghost" className="w-full justify-start p-3 h-auto">
              <div className="text-left">
                <p className="font-medium">서비스 이용약관</p>
                <p className="text-xs text-gray-500 mt-1">약관 및 개인정보 처리방침</p>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* 계정 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">계정 관리</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start text-gray-700 hover:bg-gray-50"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {logoutMutation.isPending ? "로그아웃 중..." : "로그아웃"}
            </Button>
            
            <Separator />
            
            <Button 
              variant="destructive" 
              className="w-full justify-start"
              onClick={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteAccountMutation.isPending ? "계정 삭제 중..." : "계정 삭제"}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              계정 삭제 시 모든 데이터가 영구적으로 삭제됩니다.
            </p>
          </CardContent>
        </Card>

        {/* 앱 정보 */}
        <Card>
          <CardContent className="p-4 text-center text-sm text-gray-500">
            <p>사주 운세 앱 v1.0.0</p>
            <p className="mt-1">© 2024 All rights reserved</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}