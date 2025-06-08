import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Settings, LogOut, Edit, Calendar, Mail, Phone, Coins, CreditCard, ArrowRight, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { logout } from "@/lib/auth";
import BottomNavigation from "@/components/bottom-navigation";
import { PortOneCheckout } from "@/components/portone-checkout";
import { useLocation } from "wouter";

interface ProfileFormData {
  name: string;
  email: string;
  birthDate: string;
  birthTime: string;
  gender: string;
}

interface CoinTransaction {
  id: number;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  serviceType: string | null;
  createdAt: string;
}

export default function Profile() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCoinChargeOpen, setIsCoinChargeOpen] = useState(false);
  const [isCoinHistoryOpen, setIsCoinHistoryOpen] = useState(false);
  const [showPortOneCheckout, setShowPortOneCheckout] = useState(false);
  const [selectedCoinPackage, setSelectedCoinPackage] = useState<{
    coins: number;
    price: number;
  } | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    email: "",
    birthDate: "",
    birthTime: "",
    gender: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: userInfo, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // 코인 잔액 조회
  const { data: balanceData } = useQuery({
    queryKey: ["/api/coins/balance"],
  });

  // 거래 내역 조회
  const { data: transactionsData } = useQuery({
    queryKey: ["/api/coins/transactions"],
    enabled: isCoinHistoryOpen,
  });

  const user = userInfo?.user;
  const dashboardStats = stats || { userAnalysisCount: 0 };
  const coinBalance = balanceData?.balance || 0;

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<ProfileFormData>) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "프로필 수정",
        description: "프로필이 성공적으로 수정되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsEditModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "수정 실패",
        description: error.message || "프로필 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 코인 충전
  const chargeMutation = useMutation({
    mutationFn: async (data: { amount: number; price?: number }) => {
      return await apiRequest("POST", "/api/coins/charge", data);
    },
    onSuccess: (response) => {
      toast({
        title: "충전 완료",
        description: response.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coins/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coins/transactions"] });
      setIsCoinChargeOpen(false);
      setChargeAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "충전 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenEditModal = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        birthDate: user.birthDate || "",
        birthTime: user.birthTime || "",
        gender: user.gender || ""
      });
    }
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setFormData({
      name: "",
      email: "",
      birthDate: "",
      birthTime: "",
      gender: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "입력 오류",
        description: "이름과 이메일을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate(formData);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "로그아웃",
        description: "성공적으로 로그아웃되었습니다.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "로그아웃 실패",
        description: "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">프로필을 불러오는 중...</p>
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
          <User className="w-6 h-6 text-indigo-600 mr-2" />
          <h1 className="text-xl font-bold text-gray-900">MY</h1>
        </div>
        <Button 
          onClick={handleOpenEditModal}
          variant="ghost"
          size="sm"
          className="text-indigo-600"
        >
          <Edit className="w-4 h-4 mr-1" />
          편집
        </Button>
      </header>

      <main className="px-4 pb-20">
        {/* Profile Card */}
        <Card className="mt-4 gradient-bg text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{user?.name || "사용자"}</h2>
                <p className="text-purple-100 text-sm">@{user?.username}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-purple-200 text-xs mb-1">총 분석 횟수</p>
                <p className="text-lg font-bold">{dashboardStats.userAnalysisCount}회</p>
              </div>
              <div>
                <p className="text-purple-200 text-xs mb-1">가입일</p>
                <p className="text-lg font-bold">
                  {user?.createdAt ? new Date(user.createdAt).getFullYear() : "2024"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">개인 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">이메일</p>
                <p className="font-medium">{user?.email || "설정되지 않음"}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">생년월일</p>
                <p className="font-medium">
                  {user?.birthDate ? new Date(user.birthDate).toLocaleDateString('ko-KR') : "설정되지 않음"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Settings className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">성별</p>
                <p className="font-medium">
                  {user?.gender === "male" ? "남성" : 
                   user?.gender === "female" ? "여성" : "설정되지 않음"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coin Management Section */}
        <div className="mt-6 space-y-3">
          {/* Coin Balance Card */}
          <Card className="action-card bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Coins className="w-5 h-5 text-yellow-600 mr-3" />
                  <div>
                    <span className="font-medium text-gray-900">코인 잔액</span>
                    <p className="text-sm text-gray-600">{coinBalance.toLocaleString()}코인 보유</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-yellow-600">{coinBalance.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">코인</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coin Charge Card */}
          <Card 
            className="action-card cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsCoinChargeOpen(true)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="font-medium">코인 충전</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          {/* Transaction History Card */}
          <Card 
            className="action-card cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsCoinHistoryOpen(true)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <History className="w-5 h-5 text-gray-600 mr-3" />
                  <span className="font-medium">거래 내역</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="action-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="w-5 h-5 text-gray-600 mr-3" />
                  <span className="font-medium">설정</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="action-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-600 mr-3" />
                  <span className="font-medium">고객 지원</span>
                </div>
                <Button variant="ghost" size="sm">
                  →
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="action-card cursor-pointer hover:bg-red-50"
            onClick={handleLogout}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <LogOut className="w-5 h-5 text-red-600 mr-3" />
                  <span className="font-medium text-red-600">로그아웃</span>
                </div>
                <Button variant="ghost" size="sm">
                  →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNavigation />

      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={handleCloseEditModal}>
        <DialogContent className="w-full max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>프로필 수정</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">이메일 *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="birthDate">생년월일</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="birthTime">출생시간</Label>
              <Input
                id="birthTime"
                type="time"
                value={formData.birthTime}
                onChange={(e) => setFormData(prev => ({ ...prev, birthTime: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="gender">성별</Label>
              <Select 
                value={formData.gender} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">남성</SelectItem>
                  <SelectItem value="female">여성</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={handleCloseEditModal}
                disabled={updateProfileMutation.isPending}
              >
                취소
              </Button>
              <Button 
                type="submit" 
                className="flex-1 gradient-bg text-white hover:opacity-90"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? "저장중..." : "저장"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Coin Charge Modal */}
      <Dialog open={isCoinChargeOpen} onOpenChange={setIsCoinChargeOpen}>
        <DialogContent className="w-[95%] max-w-lg mx-auto max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg font-bold">
              코인을 충전해주세요.
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              1회 사주 분석은 50코인입니다<br />
              (상대방이 거절시 자동환급)
            </p>
          </DialogHeader>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2">
            {/* Coin Package Options */}
            <Card 
              className="cursor-pointer hover:bg-gray-50 transition-colors border-2 hover:border-blue-300"
              onClick={() => {
                setSelectedCoinPackage({ coins: 25, price: 5000 });
                setIsCoinChargeOpen(false);
                setShowPortOneCheckout(true);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Coins className="w-5 h-5 text-red-600 mr-3" />
                    <span className="font-bold text-lg">25코인</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">5,000원</p>
                    <p className="text-sm text-red-500 line-through">6,000</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:bg-gray-50 transition-colors border-2 hover:border-blue-300"
              onClick={() => {
                setSelectedCoinPackage({ coins: 50, price: 10000 });
                setIsCoinChargeOpen(false);
                setShowPortOneCheckout(true);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Coins className="w-5 h-5 text-red-600 mr-3" />
                    <span className="font-bold text-lg">50코인</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">10,000원</p>
                    <p className="text-sm text-red-500 line-through">12,000</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:bg-gray-50 transition-colors border-2 hover:border-blue-300"
              onClick={() => {
                setSelectedCoinPackage({ coins: 100, price: 20000 });
                setIsCoinChargeOpen(false);
                setShowPortOneCheckout(true);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Coins className="w-5 h-5 text-red-600 mr-3" />
                    <span className="font-bold text-lg">100코인</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">20,000원</p>
                    <p className="text-sm text-red-500 line-through">24,000</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:bg-gray-50 transition-colors border-2 hover:border-blue-300"
              onClick={() => {
                setSelectedCoinPackage({ coins: 200, price: 39000 });
                setIsCoinChargeOpen(false);
                setShowPortOneCheckout(true);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Coins className="w-5 h-5 text-red-600 mr-3" />
                    <span className="font-bold text-lg">200코인</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">39,000원</p>
                    <p className="text-sm text-red-500 line-through">48,000</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:bg-gray-50 transition-colors border-2 hover:border-blue-300"
              onClick={() => {
                setSelectedCoinPackage({ coins: 300, price: 57000 });
                setIsCoinChargeOpen(false);
                setShowPortOneCheckout(true);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Coins className="w-5 h-5 text-red-600 mr-3" />
                    <span className="font-bold text-lg">300코인</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">57,000원</p>
                    <p className="text-sm text-red-500 line-through">72,000</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:bg-gray-50 transition-colors border-2 hover:border-blue-300"
              onClick={() => {
                setSelectedCoinPackage({ coins: 500, price: 89000 });
                setIsCoinChargeOpen(false);
                setShowPortOneCheckout(true);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Coins className="w-5 h-5 text-red-600 mr-3" />
                    <span className="font-bold text-lg">500코인</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">89,000원</p>
                    <p className="text-sm text-red-500 line-through">120,000</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsCoinChargeOpen(false)}
              className="w-full"
            >
              취소
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction History Modal */}
      <Dialog open={isCoinHistoryOpen} onOpenChange={setIsCoinHistoryOpen}>
        <DialogContent className="w-[95%] max-w-lg mx-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <History className="w-5 h-5 mr-2" />
              거래 내역
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {transactionsData?.transactions?.length > 0 ? (
              transactionsData.transactions.map((tx: CoinTransaction) => (
                <Card key={tx.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{tx.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(tx.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {tx.serviceType && (
                          <p className="text-xs text-blue-600 mt-1">{tx.serviceType}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${
                          tx.type === 'spend' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {tx.type === 'spend' ? '-' : '+'}{tx.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          잔액: {tx.balanceAfter.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>거래 내역이 없습니다.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PortOne Payments Checkout */}
      {selectedCoinPackage && (
        <PortOneCheckout
          isOpen={showPortOneCheckout}
          onClose={() => {
            setShowPortOneCheckout(false);
            setSelectedCoinPackage(null);
          }}
          amount={selectedCoinPackage.price}
          coinAmount={selectedCoinPackage.coins}
          onSuccess={() => {
            setShowPortOneCheckout(false);
            setSelectedCoinPackage(null);
            queryClient.invalidateQueries({ queryKey: ["/api/coins/balance"] });
          }}
        />
      )}

      <BottomNavigation />
    </div>
  );
}
