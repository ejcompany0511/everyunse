import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Settings, CreditCard, History, LogOut, LogIn, UserPlus, Star, TrendingUp, Heart, Calendar, Users, RefreshCw, Crown, Sun, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/bottom-navigation";
import LoginModal from "@/components/login-modal";
import RegisterModal from "@/components/register-modal";
import CoinBalance from "@/components/coin-balance";
import SettingsModal from "@/components/settings-modal";
import PersonalInfoModal from "@/components/personal-info-modal";
import CustomerSupportModal from "@/components/customer-support-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function My() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPersonalInfoModalOpen, setIsPersonalInfoModalOpen] = useState(false);
  const [isCustomerSupportModalOpen, setIsCustomerSupportModalOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // Clear cache on mount to force fresh data
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats/v2"] });
  }, []);

  const { data: userInfo, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: coinData } = useQuery({
    queryKey: ["/api/coins/balance"],
    enabled: !!userInfo?.user,
    retry: false,
  });

  const { data: userAnalysesData } = useQuery({
    queryKey: ["/api/saju/analyses"], // 사용자 분석 목록
    enabled: !!userInfo?.user,
    retry: false,
  });

  const { data: platformStats } = useQuery({
    queryKey: ["/api/dashboard/stats/v2", Date.now()], // 전체 플랫폼 통계용
    enabled: !!userInfo?.user,
    retry: false,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const user = userInfo?.user;

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      
      // React Query 캐시 완전 초기화
      await queryClient.invalidateQueries();
      queryClient.clear();
      
      toast({
        title: "로그아웃 완료",
        description: "안전하게 로그아웃되었습니다.",
      });
      
      // 브라우저 히스토리를 홈으로 이동 후 새로고침
      navigate("/");
      setTimeout(() => {
        window.location.href = "/";
      }, 300);
    } catch (error) {
      console.error("Logout error:", error);
      
      // 오류가 발생해도 클라이언트 측에서 강제 로그아웃
      queryClient.clear();
      navigate("/");
      
      toast({
        title: "로그아웃 완료",
        description: "로그아웃되었습니다.",
      });
      
      setTimeout(() => {
        window.location.href = "/";
      }, 300);
    }
  };

  // 로그인하지 않은 사용자를 위한 화면
  if (!user && !userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900">마이페이지</h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6 space-y-6">
          {/* 로그인 유도 카드 */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                로그인이 필요합니다
              </h2>
              <p className="text-gray-600 mb-6">
                사주 분석과 개인화된 서비스를 이용하려면<br />
                로그인해주세요
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  로그인
                </Button>
                <Button 
                  onClick={() => setIsRegisterModalOpen(true)}
                  variant="outline"
                  className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  회원가입
                </Button>
              </div>
            </CardContent>
          </Card>



          {/* 추가 서비스 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900">
                ✨ 추가 서비스
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg">
                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sun className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">오늘의 운세</span>
              </div>

            </CardContent>
          </Card>
        </main>

        <BottomNavigation />

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => {
            setIsLoginModalOpen(false);
          }}
          onSwitchToRegister={() => {
            setIsLoginModalOpen(false);
            setIsRegisterModalOpen(true);
          }}
        />

        <RegisterModal 
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={() => {
            setIsRegisterModalOpen(false);
          }}
          onSwitchToLogin={() => {
            setIsRegisterModalOpen(false);
            setIsLoginModalOpen(true);
          }}
        />
      </div>
    );
  }

  // 로그인한 사용자를 위한 마이페이지
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 프로필 그라데이션 카드 */}
        <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{user?.name || user?.username || '사용자'}</h2>
                <p className="text-white/80">@{user?.username || ''}</p>
              </div>
            </div>
            <div className="flex justify-between">
              <div>
                <p className="text-white/80 text-sm">총 분석 횟수</p>
                <p className="text-2xl font-bold text-white">{userAnalysesData?.analyses?.length || 0}회</p>
              </div>
              <div>
                <p className="text-white/80 text-sm">가입일</p>
                <p className="text-2xl font-bold text-white">{user?.createdAt ? new Date(user.createdAt).getFullYear() : '2024'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 사주정보 카드 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">사주 정보</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPersonalInfoModalOpen(true)}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              정보 등록하기
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">이메일</p>
                <p className="font-medium">{user?.email || '설정되지 않음'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">생년월일</p>
                <p className="font-medium">{user?.birthDate || '설정되지 않음'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">성별</p>
                <p className="font-medium">{user?.gender || '설정되지 않음'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">태어난 시간</p>
                <p className="font-medium">
                  {user?.birthTimeUnknown ? '모름' : (user?.birthTime || '설정되지 않음')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 냥 잔액 카드 */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">냥 잔액</p>
                  <p className="text-sm text-gray-600">{coinData?.balance || 0}냥 보유</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-yellow-600">{coinData?.balance || 0}</p>
                <p className="text-sm text-gray-600">냥</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 메뉴 버튼들 */}
        <div className="space-y-3">
          <Card>
            <CardContent className="p-0">
              <button 
                onClick={() => navigate("/coins")}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">냥 충전</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <button 
                onClick={() => navigate("/history")}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <History className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">거래 내역</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <button 
                onClick={() => setIsSettingsModalOpen(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">설정</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <button 
                onClick={() => setIsCustomerSupportModalOpen(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">고객 지원</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <LogOut className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-600">로그아웃</span>
                </div>
                <span className="text-red-400">→</span>
              </button>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNavigation />

      {/* Modals */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />
      
      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <PersonalInfoModal
        isOpen={isPersonalInfoModalOpen}
        onClose={() => setIsPersonalInfoModalOpen(false)}
        user={user}
      />

      <CustomerSupportModal
        isOpen={isCustomerSupportModalOpen}
        onClose={() => setIsCustomerSupportModalOpen(false)}
        user={user}
      />
    </div>
  );
}