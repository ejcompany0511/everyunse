import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Settings, TrendingUp, History, Heart, Briefcase, Lightbulb, Users, Star, LogIn, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/bottom-navigation";
import SajuAnalysisModal from "@/components/saju-analysis-modal";
import LoginModal from "@/components/login-modal";
import RegisterModal from "@/components/register-modal";
import CoinBalance from "@/components/coin-balance";
import NotificationModal from "@/components/notification-modal";
import CustomerSupportModal from "@/components/customer-support-modal";
import Footer from "@/components/footer";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isCustomerSupportModalOpen, setIsCustomerSupportModalOpen] = useState(false);
  const [analysisType, setAnalysisType] = useState("");
  const [analysisTitle, setAnalysisTitle] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Clear cache on mount to force fresh data
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats/v2"] });
  }, []);

  const { data: platformStats } = useQuery({
    queryKey: ["/api/platform/total-analyses"], // 전체 플랫폼 분석 수 (모든 유저 + 731)
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: userInfo } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const { data: userAnalysesData } = useQuery({
    queryKey: ["/api/saju/analyses"], // 사용자 분석 목록
    enabled: !!userInfo?.user,
  });

  const { data: dailyFortune } = useQuery({
    queryKey: ["/api/daily-fortune"],
    enabled: !!userInfo?.user,
  });

  const { data: unreadNotificationCount } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!userInfo?.user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: servicePricesData } = useQuery({
    queryKey: ["/api/service-prices"],
  });

  const user = userInfo?.user;
  const userAnalyses = userAnalysesData?.analyses || [];
  const servicePrices = servicePricesData?.servicePrices || [];
  const dashboardStats = {
    totalAnalyses: platformStats?.totalAnalyses || 0, // 모든 유저 분석 + 731
    userAnalysisCount: userAnalyses.length, // /api/saju/analyses에서 가져온 배열 길이
    recentAnalyses: userAnalyses.slice(0, 3) // 최근 3개
  };

  // 분석 타입을 서비스 타입으로 매핑하는 함수
  const getServiceType = (analysisType: string): string => {
    const mapping = {
      "monthly": "monthly_fortune",
      "love": "love_potential", 
      "reunion": "reunion_potential",
      "compatibility": "compatibility",
      "career": "job_prospects",
      "marriage": "marriage_potential",
      "comprehensive": "comprehensive_fortune"
    };
    return mapping[analysisType as keyof typeof mapping] || "saju_analysis";
  };

  // 서비스 가격을 가져오는 함수
  const getServicePrice = (analysisType: string): number => {
    const serviceType = getServiceType(analysisType);
    const priceInfo = servicePrices.find(price => price.serviceType === serviceType);
    return priceInfo?.coinCost || 0;
  };

  // 가격 표시 라벨을 생성하는 함수
  const getPriceLabel = (analysisType: string): string => {
    const price = getServicePrice(analysisType);
    return price === 0 ? "무료" : `${price}냥`;
  };

  const openAnalysisModal = (type: string, title: string) => {
    if (!user) {
      setIsLoginModalOpen(true);
    } else if (!user.hasPersonalInfo) {
      // 사주 정보가 등록되지 않은 경우 알림과 함께 MY 탭으로 이동
      const { dismiss } = toast({
        title: "사주 정보를 등록해주세요",
        description: "분석 서비스를 이용하려면 먼저 사주 정보를 등록해야 합니다.",
        action: (
          <button
            onClick={() => {
              dismiss();
              navigate("/my");
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            확인
          </button>
        ),
      });
    } else {
      setAnalysisType(type);
      setAnalysisTitle(title);
      setIsAnalysisModalOpen(true);
    }
  };

  const quickActions = [
    {
      title: "이번 달 운세",
      description: "이달의 전체적인 운세를 확인하세요",
      icon: TrendingUp,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      type: "monthly"
    },
    {
      title: "연애할 수 있을까?",
      description: "연애운과 만남의 가능성을 알아보세요",
      icon: Heart,
      bgColor: "bg-pink-100",
      iconColor: "text-pink-600",
      type: "love"
    },
    {
      title: "재회 가능할까요?",
      description: "헤어진 사람과의 재회 가능성을 확인하세요",
      icon: History,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
      type: "reunion"
    },
    {
      title: "궁합 분석",
      description: "두 사람의 궁합을 자세히 분석해보세요",
      icon: Users,
      bgColor: "bg-indigo-100",
      iconColor: "text-indigo-600",
      type: "compatibility"
    },
    {
      title: "취업이 안되면 어쩌죠?",
      description: "취업과 진로에 대한 조언을 받아보세요",
      icon: Briefcase,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      type: "career"
    },
    {
      title: "결혼할 수 있을까요?",
      description: "결혼 운세와 배우자운을 확인하세요",
      icon: Heart,
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
      type: "marriage"
    },
    {
      title: "나의 종합 운세",
      description: "전체적인 사주 분석 결과를 확인하세요",
      icon: Star,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      type: "comprehensive"
    }
  ];

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}일 전`;
    }
  };

  return (
    <div className="mobile-container">
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-white">
        <h1 className="text-2xl font-bold text-indigo-600">EVERYUNSE</h1>
        <div className="flex items-center space-x-3">
          {user && (
            <NotificationModal unreadCount={unreadNotificationCount?.count || 0} />
          )}
          <Button variant="ghost" size="icon" className="rounded-full bg-gray-100 hover:bg-gray-200">
            <Settings className="w-5 h-5 text-gray-600" />
          </Button>
        </div>
      </header>

      <main className="px-4 pb-20">
        {/* Welcome Card */}
        <Card className="gradient-bg text-white mb-6 card-shadow border-0">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  안녕하세요, {user?.name || "사용자"}님! 👋
                </h2>
                <p className="text-purple-100 text-sm">나의 미래가 궁금하다면?</p>
                <p className="text-purple-100 text-sm mb-2">나의 운세를 살펴볼까요?</p>
                {!user && (
                  <Button 
                    className="mt-6 bg-white text-indigo-600 hover:bg-gray-50 font-semibold px-8 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200 border-0 text-base"
                    onClick={() => setIsLoginModalOpen(true)}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    ✨ 로그인하고 시작하기
                  </Button>
                )}
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-purple-200 text-xs mb-1">지금까지 봐준 사주 수</p>
                <p className="text-2xl font-bold">{dashboardStats.totalAnalyses.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-purple-200 text-xs mb-1">나의 분석 횟수</p>
                <p className="text-2xl font-bold">{dashboardStats.userAnalysisCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-2 mb-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card 
                key={index}
                className="action-card cursor-pointer"
                onClick={() => openAnalysisModal(action.type, action.title)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`icon-circle ${action.bgColor} w-10 h-10 flex items-center justify-center rounded-full`}>
                      <Icon className={`${action.iconColor} w-5 h-5`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{action.title}</h3>
                          <p className="text-xs text-gray-500">{action.description}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getServicePrice(action.type) === 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {getPriceLabel(action.type)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>



        {/* Today's Insight */}
        <section className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">오늘의 인사이트</h3>
          <Card className="bg-gradient-to-r from-orange-400 to-pink-400 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center mb-2">
                <Lightbulb className="w-5 h-5 mr-2" />
                <span className="font-medium">오늘의 운세</span>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-line">
                {dailyFortune?.fortune ? 
                  dailyFortune.fortune.split('. ').map((sentence, index, array) => (
                    <span key={index}>
                      {sentence.trim()}{index < array.length - 1 ? '.' : ''}
                      {index < array.length - 1 && <br />}
                    </span>
                  )) : 
                  "개인정보를 등록하시면 더 정확한 오늘의 운세를 제공해드릴 수 있습니다.\nMY 탭에서 정보를 등록해보세요!"
                }
              </div>
            </CardContent>
          </Card>
        </section>


      </main>

      <BottomNavigation />
      
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          // 로그인 성공 후 모달 닫기만 하고 홈 화면 유지
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
          // 회원가입 성공 후 모달 닫기만 하고 홈 화면 유지
          setIsRegisterModalOpen(false);
        }}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
      
      <SajuAnalysisModal 
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        analysisType={analysisType}
      />

      <CustomerSupportModal
        isOpen={isCustomerSupportModalOpen}
        onClose={() => setIsCustomerSupportModalOpen(false)}
        user={userInfo?.user}
      />
      
      <Footer onCustomerSupportClick={() => setIsCustomerSupportModalOpen(true)} />
    </div>
  );
}
