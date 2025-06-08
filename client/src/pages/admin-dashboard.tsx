import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  MessageSquare, 
  Star, 
  Shield,
  Settings,
  BarChart3,
  Download,
  Search,
  Filter,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Phone,
  Trash2,
  Clock,
  Calendar,
  Activity,
  LogOut,
  Home,
  Plus,
  Edit,
  Bell,
  FileText
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

interface DashboardStats {
  totalUsers: number;
  totalRevenue: number;
  totalAnalyses: number;
  activeUsers: number;
  newUsersToday: number;
  pendingReports: number;
  pendingInquiries: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [reportResponse, setReportResponse] = useState("");
  const [inquiryResponse, setInquiryResponse] = useState("");
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    type: "notice",
    priority: "normal",
    targetAudience: "all"
  });

  // 관리자 인증 확인
  const { data: adminUser, isLoading: authLoading } = useQuery({
    queryKey: ["/api/admin/auth/me"],
    retry: false,
    enabled: true,
  });

  // 신고 목록 조회
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/admin/reports"],
    enabled: isLoggedIn && selectedTab === "reports",
  });

  // 문의 목록 조회
  const { data: inquiriesData, isLoading: inquiriesLoading } = useQuery({
    queryKey: ["/api/admin/inquiries"],
    enabled: isLoggedIn && selectedTab === "inquiries",
  });

  // 공지사항 목록 조회
  const { data: announcementsData, isLoading: announcementsLoading } = useQuery({
    queryKey: ["/api/admin/announcements"],
    enabled: isLoggedIn && selectedTab === "announcements",
  });

  useEffect(() => {
    if (adminUser) {
      setIsLoggedIn(true);
    }
  }, [adminUser]);

  // 실시간 한국 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 관리자 로그인
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return apiRequest("POST", "/api/admin/auth/login", credentials);
    },
    onSuccess: () => {
      toast({ title: "로그인 성공", description: "관리자 대시보드에 접속했습니다." });
      setIsLoggedIn(true);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/auth/me"] });
    },
    onError: () => {
      toast({ title: "로그인 실패", description: "아이디 또는 비밀번호를 확인해주세요.", variant: "destructive" });
    },
  });

  // 로그아웃
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/auth/logout", {});
    },
    onSuccess: () => {
      toast({ title: "로그아웃", description: "성공적으로 로그아웃되었습니다." });
      setIsLoggedIn(false);
      queryClient.clear();
    },
  });

  // 신고 상태 업데이트
  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, status, response }: { reportId: number; status: string; response: string }) => {
      return apiRequest("PUT", `/api/admin/reports/${reportId}`, {
        status,
        adminResponse: response,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast({ title: "성공", description: "신고 처리가 완료되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      setReportResponse("");
    },
  });

  // 문의 답변
  const updateInquiryMutation = useMutation({
    mutationFn: async ({ inquiryId, status, response }: { inquiryId: number; status: string; response: string }) => {
      return apiRequest("PUT", `/api/admin/inquiries/${inquiryId}`, {
        status,
        response: response,
        respondedAt: new Date(),
      });
    },
    onSuccess: () => {
      toast({ title: "성공", description: "문의 답변이 완료되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inquiries"] });
      setInquiryResponse("");
    },
  });

  // 공지사항 생성
  const createAnnouncementMutation = useMutation({
    mutationFn: async (announcement: any) => {
      return apiRequest("POST", "/api/admin/announcements", {
        ...announcement,
        authorId: adminUser?.id,
        authorName: adminUser?.username,
      });
    },
    onSuccess: () => {
      toast({ title: "성공", description: "공지사항이 등록되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      setAnnouncementForm({
        title: "",
        content: "",
        type: "notice",
        priority: "normal",
        targetAudience: "all"
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };

  // 로딩 상태
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // 로그인이 필요한 경우
  if (!isLoggedIn && !adminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              관리자 로그인
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              사주 서비스 관리자 대시보드
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">관리자 아이디</Label>
                <Input
                  id="username"
                  type="text"
                  required
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="관리자 아이디를 입력하세요"
                />
              </div>
              <div>
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="비밀번호를 입력하세요"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "로그인 중..." : "로그인"}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => window.location.href = "/"}
              className="text-sm text-gray-600"
            >
              <Home className="w-4 h-4 mr-2" />
              메인 페이지로 돌아가기
            </Button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>관리자 계정:</strong><br />
              아이디: EJCompany0511<br />
              비밀번호: Ej960511?
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboardContent onLogout={() => logoutMutation.mutate()} />;
}

// 실제 대시보드 컨텐츠 컴포넌트
function AdminDashboardContent({ onLogout }: { onLogout: () => void }) {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [currentTime, setCurrentTime] = useState(new Date());

  // 실시간 한국 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 대시보드 통계
  const { data: stats, isLoading: statsLoading, error } = useQuery({
    queryKey: ["/api/admin/dashboard/stats"],
    refetchInterval: 30000,
  });

  console.log("=== ADMIN DASHBOARD CLIENT ===");
  console.log("Stats loading:", statsLoading);
  console.log("Stats data:", stats);
  console.log("Stats error:", error);

  const dashboardStats = stats;

  if (statsLoading || !dashboardStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 대시보드</h1>
            <p className="text-gray-600">사주 서비스 운영 현황 및 관리</p>
          </div>
          <div className="flex gap-4 items-center">
            {/* 실시간 한국 시간 표시 */}
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">한국 시간</div>
                  <div className="text-gray-600">
                    {currentTime.toLocaleString('ko-KR', {
                      timeZone: 'Asia/Seoul',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    })}
                  </div>
                </div>
              </div>
            </Card>

            <Button
              variant="outline"
              onClick={() => window.location.href = "/"}
            >
              <Home className="w-4 h-4 mr-2" />
              메인 페이지
            </Button>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-10 lg:w-auto lg:grid-cols-10">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              대시보드
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              회원관리
            </TabsTrigger>
            <TabsTrigger value="phones" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              전화번호
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              상품관리
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              공지알림
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              후기관리
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              신고관리
            </TabsTrigger>
            <TabsTrigger value="inquiries" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              문의관리
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              통계
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              로그
            </TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">전체 회원수</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    오늘 신규 가입: {dashboardStats.newUsersToday}명
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 매출</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₩{dashboardStats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    이번 달 누적 매출
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 분석 수</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.totalAnalyses.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    활성 사용자: {dashboardStats.activeUsers}명
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">처리 대기</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {dashboardStats.pendingReports + dashboardStats.pendingInquiries}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    신고 {dashboardStats.pendingReports}건 · 문의 {dashboardStats.pendingInquiries}건
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>최근 활동</CardTitle>
                  <CardDescription>실시간 사용자 활동 현황</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">신규 회원 가입</span>
                      <span className="text-sm font-medium">{dashboardStats.newUsersToday}명</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">오늘 사주 분석</span>
                      <span className="text-sm font-medium">{dashboardStats.todayAnalyses || 0}건</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">코인 충전</span>
                      <span className="text-sm font-medium">{dashboardStats.todayCoins || 0}건</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>빠른 작업</CardTitle>
                  <CardDescription>자주 사용하는 관리 기능</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setSelectedTab('users')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    회원 관리
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setSelectedTab('reports')}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    신고 처리하기
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setSelectedTab('inquiries')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    문의 답변하기
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.location.href = '/admin/statistics'}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    상세 통계 및 로그
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 회원관리 탭 */}
          <TabsContent value="users" className="space-y-6">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="phones" className="space-y-6">
            <PhoneNumberManagement />
          </TabsContent>

          {/* 기타 탭들 */}
          <TabsContent value="services" className="space-y-6">
            <ServicePriceManagement />
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <ReviewsManagement />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportsManagement />
          </TabsContent>

          <TabsContent value="inquiries" className="space-y-6">
            <InquiriesManagement />
          </TabsContent>

          <TabsContent value="announcements" className="space-y-6">
            <AnnouncementsManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsContent />
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <LogsContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// 회원 관리 컴포넌트
function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 사용자 목록 조회
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ["/api/admin/users", page, searchTerm],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/users?page=${page}&limit=20&search=${searchTerm}`);
      return await response.json();
    },
  });

  // 데이터 추출
  const users = usersData?.users || [];
  const totalPages = Math.ceil((usersData?.total || 0) / 20);

  // 디버깅용 로그
  console.log("=== USERS MANAGEMENT DEBUG ===");
  console.log("Loading:", isLoading);
  console.log("Error:", error);
  console.log("UsersData:", usersData);
  console.log("Users array:", users);
  console.log("Users length:", users.length);

  // 사용자 코인 조정 뮤테이션
  const adjustCoinsMutation = useMutation({
    mutationFn: ({ userId, amount, reason }: { userId: number; amount: number; reason: string }) =>
      apiRequest("POST", "/api/admin/users/adjust-coins", { userId, amount, reason }),
    onSuccess: () => {
      toast({
        title: "성공",
        description: "사용자 코인이 조정되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "오류",
        description: error.message || "코인 조정에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 사용자 상태 변경 뮤테이션
  const updateUserStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: string }) =>
      apiRequest("POST", "/api/admin/users/update-status", { userId, status }),
    onSuccess: () => {
      toast({
        title: "성공",
        description: "사용자 상태가 변경되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "오류",
        description: error.message || "상태 변경에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 사용자 영구 삭제 뮤테이션
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest("POST", `/api/admin/users/${userId}/delete`),
    onSuccess: () => {
      toast({
        title: "성공",
        description: "사용자가 완전히 삭제되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "오류",
        description: error.message || "사용자 삭제에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleAdjustCoins = (userId: number, amount: number, reason: string) => {
    adjustCoinsMutation.mutate({ userId, amount, reason });
  };

  const handleUpdateStatus = (userId: number, status: string) => {
    updateUserStatusMutation.mutate({ userId, status });
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('정말로 이 사용자를 완전히 삭제하시겠습니까? 삭제된 사용자의 모든 데이터가 영구적으로 제거되며, 동일한 아이디로 새로 가입할 수 있습니다.')) {
      deleteUserMutation.mutate(userId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>회원 관리</CardTitle>
        <CardDescription>전체 회원 목록 및 관리 기능</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 검색 */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="사용자명 또는 이메일로 검색..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setPage(1)}
            variant="outline"
          >
            검색
          </Button>
        </div>

        {/* 사용자 목록 */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-2 text-gray-500">로딩 중...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>사용자명</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>코인</TableHead>
                  <TableHead>분석 횟수</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.coinBalance}냥</TableCell>
                    <TableCell>{user.analysisCount}회</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'normal' ? 'default' : 'destructive'}>
                        {user.status === 'normal' ? '정상' : '정지'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 flex-wrap gap-1">
                        {/* 코인 조정 */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              코인 조정
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{user.username} 코인 조정</DialogTitle>
                            </DialogHeader>
                            <CoinAdjustmentForm 
                              user={user}
                              onAdjust={handleAdjustCoins}
                            />
                          </DialogContent>
                        </Dialog>
                        
                        {/* 상태 변경 */}
                        <Button
                          variant={user.status === 'normal' ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleUpdateStatus(
                            user.id, 
                            user.status === 'normal' ? 'suspended' : 'normal'
                          )}
                        >
                          {user.status === 'normal' ? (
                            <>
                              <Ban className="w-3 h-3 mr-1" />
                              정지
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              복구
                            </>
                          )}
                        </Button>

                        {/* 사용자 삭제 */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          삭제
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* 페이지네이션 */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                총 {usersData?.total || 0}명의 사용자
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  이전
                </Button>
                <span className="text-sm">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  다음
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 코인 조정 폼 컴포넌트
function CoinAdjustmentForm({ 
  user, 
  onAdjust 
}: { 
  user: any; 
  onAdjust: (userId: number, amount: number, reason: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [type, setType] = useState<"add" | "subtract">("add");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const adjustmentAmount = type === "add" ? parseInt(amount) : -parseInt(amount);
    onAdjust(user.id, adjustmentAmount, reason);
    setAmount("");
    setReason("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>현재 코인 잔액</Label>
        <div className="text-lg font-medium">{user.coinBalance}냥</div>
      </div>

      <div className="space-y-2">
        <Label>조정 유형</Label>
        <Select value={type} onValueChange={(value: "add" | "subtract") => setType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="add">코인 추가</SelectItem>
            <SelectItem value="subtract">코인 차감</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>조정 금액</Label>
        <Input
          type="number"
          placeholder="조정할 코인 수량"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>조정 사유</Label>
        <Input
          placeholder="조정 사유를 입력하세요"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>조정 후 예상 잔액</Label>
        <div className="text-lg font-medium text-blue-600">
          {user.coinBalance + (type === "add" ? parseInt(amount || "0") : -parseInt(amount || "0"))}냥
        </div>
      </div>

      <Button type="submit" className="w-full">
        {type === "add" ? "코인 추가" : "코인 차감"}
      </Button>
    </form>
  );
}

// 서비스 가격 관리 컴포넌트
function ServicePriceManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingService, setEditingService] = useState<any>(null);
  
  // 서비스 가격 조회
  const { data: servicePricesData, isLoading } = useQuery({
    queryKey: ["/api/service-prices"],
  });
  
  const servicePrices = servicePricesData?.servicePrices || [];

  // 가격 업데이트 뮤테이션
  const updatePriceMutation = useMutation({
    mutationFn: ({ serviceId, coinCost }: { serviceId: number; coinCost: number }) =>
      apiRequest("PUT", `/api/admin/service-prices/${serviceId}`, { coinCost }),
    onSuccess: () => {
      toast({
        title: "성공",
        description: "서비스 가격이 업데이트되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-prices"] });
      setEditingService(null);
    },
    onError: (error: any) => {
      toast({
        title: "오류",
        description: error.message || "가격 업데이트에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleUpdatePrice = (serviceId: number, newPrice: number) => {
    updatePriceMutation.mutate({ serviceId, coinCost: newPrice });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>상품/서비스 관리</CardTitle>
          <CardDescription>사주 분석 서비스 가격 및 설정 관리</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>상품/서비스 관리</CardTitle>
        <CardDescription>사주 분석 서비스 가격 및 설정 관리</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {servicePrices.map((service: any) => (
            <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium">{service.description}</h3>
                <p className="text-sm text-gray-500">서비스 타입: {service.serviceType}</p>
                <div className="mt-2">
                  {service.coinCost === 0 ? (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                      무료
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                      {service.coinCost}냥
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {editingService?.id === service.id ? (
                  <ServicePriceEditForm
                    service={service}
                    onSave={handleUpdatePrice}
                    onCancel={() => setEditingService(null)}
                    isLoading={updatePriceMutation.isPending}
                  />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingService(service)}
                  >
                    가격 수정
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 가격 수정 폼 컴포넌트
function ServicePriceEditForm({ 
  service, 
  onSave, 
  onCancel, 
  isLoading 
}: { 
  service: any; 
  onSave: (serviceId: number, newPrice: number) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [newPrice, setNewPrice] = useState(service.coinCost.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseInt(newPrice);
    if (isNaN(price) || price < 0) {
      return;
    }
    onSave(service.id, price);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        type="number"
        min="0"
        value={newPrice}
        onChange={(e) => setNewPrice(e.target.value)}
        className="w-20"
        disabled={isLoading}
      />
      <span className="text-sm text-gray-500">냥</span>
      <Button type="submit" size="sm" disabled={isLoading}>
        {isLoading ? "저장중..." : "저장"}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isLoading}>
        취소
      </Button>
    </form>
  );
}

// 후기 관리 컴포넌트
function ReviewsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");

  // 후기 목록 조회
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["/api/admin/reviews", serviceTypeFilter],
    queryFn: () => 
      apiRequest("GET", `/api/admin/reviews?serviceType=${serviceTypeFilter}`)
        .then(res => res.json())
        .then(data => data.reviews || [])
  });

  // 후기 삭제 뮤테이션
  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: number) => 
      apiRequest("DELETE", `/api/admin/reviews/${reviewId}`),
    onSuccess: () => {
      toast({
        title: "후기 삭제 완료",
        description: "후기가 성공적으로 삭제되었습니다.",
      });
      // 모든 리뷰 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      queryClient.refetchQueries({ queryKey: ["/api/admin/reviews", serviceTypeFilter] });
    },
    onError: (error: any) => {
      toast({
        title: "삭제 실패",
        description: error.message || "후기 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 후기 승인 뮤테이션
  const approveReviewMutation = useMutation({
    mutationFn: (reviewId: number) => 
      apiRequest("PATCH", `/api/admin/reviews/${reviewId}/approval`, { approvalStatus: "approved" }),
    onSuccess: () => {
      toast({
        title: "후기 승인 완료",
        description: "후기가 성공적으로 승인되었습니다.",
      });
      // 모든 리뷰 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      queryClient.refetchQueries({ queryKey: ["/api/admin/reviews", serviceTypeFilter] });
    },
    onError: (error: any) => {
      toast({
        title: "승인 실패",
        description: error.message || "후기 승인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 후기 거절 뮤테이션
  const rejectReviewMutation = useMutation({
    mutationFn: (reviewId: number) => 
      apiRequest("PATCH", `/api/admin/reviews/${reviewId}/approval`, { approvalStatus: "rejected" }),
    onSuccess: () => {
      toast({
        title: "후기 거절 완료",
        description: "후기가 성공적으로 거절되었습니다.",
      });
      // 모든 리뷰 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      queryClient.refetchQueries({ queryKey: ["/api/admin/reviews", serviceTypeFilter] });
    },
    onError: (error: any) => {
      toast({
        title: "거절 실패",
        description: error.message || "후기 거절 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteReview = (reviewId: number) => {
    if (confirm("이 후기를 삭제하시겠습니까?")) {
      deleteReviewMutation.mutate(reviewId);
    }
  };

  const handleApproveReview = (reviewId: number) => {
    approveReviewMutation.mutate(reviewId);
  };

  const handleRejectReview = (reviewId: number) => {
    if (confirm("이 후기를 거절하시겠습니까?")) {
      rejectReviewMutation.mutate(reviewId);
    }
  };

  const getServiceTypeName = (serviceType: string) => {
    const serviceNames: Record<string, string> = {
      monthly_fortune: "이번 달 운세",
      love_potential: "연애할 수 있을까?",
      reunion_possibility: "재회 가능할까요?",
      compatibility: "궁합 분석",
      job_concern: "취업이 안되면 어쩌죠?",
      marriage_potential: "결혼할 수 있을까요?",
      comprehensive_fortune: "나의 종합 운세"
    };
    return serviceNames[serviceType] || serviceType;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>후기 관리</CardTitle>
        <CardDescription>
          사용자 후기를 조회하고 관리할 수 있습니다
        </CardDescription>
        
        {/* 필터 */}
        <div className="flex gap-4 items-center">
          <Label htmlFor="service-filter">서비스 필터:</Label>
          <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 서비스</SelectItem>
              <SelectItem value="monthly_fortune">이번 달 운세</SelectItem>
              <SelectItem value="love_potential">연애할 수 있을까?</SelectItem>
              <SelectItem value="reunion_possibility">재회 가능할까요?</SelectItem>
              <SelectItem value="compatibility">궁합 분석</SelectItem>
              <SelectItem value="job_concern">취업이 안되면 어쩌죠?</SelectItem>
              <SelectItem value="marriage_potential">결혼할 수 있을까요?</SelectItem>
              <SelectItem value="comprehensive_fortune">나의 종합 운세</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {reviewsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {reviews && reviews.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>사용자</TableHead>
                    <TableHead>서비스</TableHead>
                    <TableHead>평점</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead>내용</TableHead>
                    <TableHead>승인 상태</TableHead>
                    <TableHead>작성일</TableHead>
                    <TableHead>도움됨</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review: any) => (
                    <TableRow key={review.id}>
                      <TableCell>{review.username || '익명'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getServiceTypeName(review.serviceType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{review.rating}/5</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-32 truncate">
                          {review.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-48 truncate">
                          {review.content}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          review.approvalStatus === 'approved' ? 'default' :
                          review.approvalStatus === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {review.approvalStatus === 'approved' ? '승인됨' :
                           review.approvalStatus === 'rejected' ? '거절됨' : '승인 대기'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {review.helpfulCount || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {review.approvalStatus === 'pending' ? (
                            // 승인 대기 중: 승인/거절 버튼만 표시
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApproveReview(review.id)}
                                disabled={approveReviewMutation.isPending}
                              >
                                승인
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejectReview(review.id)}
                                disabled={rejectReviewMutation.isPending}
                              >
                                거절
                              </Button>
                            </>
                          ) : (
                            // 승인 완료: 삭제 버튼만 표시
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteReview(review.id)}
                              disabled={deleteReviewMutation.isPending}
                            >
                              삭제
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                등록된 후기가 없습니다.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Report Management Component
function ReportsManagement() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportResponse, setReportResponse] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/admin/reports", statusFilter, priorityFilter],
    enabled: true,
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, status, response }: { reportId: number; status: string; response: string }) => {
      return apiRequest("PUT", `/api/admin/reports/${reportId}`, {
        status,
        adminResponse: response,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast({ title: "성공", description: "신고 처리가 완료되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      setSelectedReport(null);
      setReportResponse("");
    },
  });

  const reports = reportsData?.reports || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>신고 관리</CardTitle>
        <CardDescription>사용자 신고 접수 및 처리</CardDescription>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">대기중</SelectItem>
              <SelectItem value="investigating">조사중</SelectItem>
              <SelectItem value="resolved">처리완료</SelectItem>
              <SelectItem value="dismissed">기각</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="우선순위" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="urgent">긴급</SelectItem>
              <SelectItem value="high">높음</SelectItem>
              <SelectItem value="medium">보통</SelectItem>
              <SelectItem value="low">낮음</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {reportsLoading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report: any) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <h3 className="font-semibold">{report.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={report.status === 'pending' ? 'destructive' : 'default'}>
                        {report.status === 'pending' ? '대기중' : 
                         report.status === 'reviewed' ? '검토중' : 
                         report.status === 'resolved' ? '해결됨' : 
                         report.status === 'dismissed' ? '기각됨' : report.status}
                      </Badge>
                      <Badge variant="outline">{getKoreanReportType(report.reportType)}</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-medium">신고자:</span> {report.reporterName || '익명'}
                    </div>
                    <div>
                      <span className="font-medium">유형:</span> {getKoreanReportType(report.reportType)}
                    </div>
                    <div>
                      <span className="font-medium">대상:</span> {report.reportedUserId ? `사용자 #${report.reportedUserId}` : '미확인'}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{report.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          처리하기
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>신고 처리</DialogTitle>
                        </DialogHeader>
                        
                        {selectedReport && (
                          <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <h4 className="font-semibold mb-2">{selectedReport.title}</h4>
                              <p className="text-gray-700 mb-2">{selectedReport.description}</p>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><strong>신고자:</strong> {selectedReport.reporterName}</div>
                                <div><strong>유형:</strong> {selectedReport.reportType}</div>
                                <div><strong>대상:</strong> {selectedReport.targetType} #{selectedReport.targetId}</div>
                                <div><strong>우선순위:</strong> {selectedReport.priority}</div>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-2">관리자 응답</label>
                              <Textarea
                                value={reportResponse}
                                onChange={(e) => setReportResponse(e.target.value)}
                                placeholder="처리 결과와 사유를 입력하세요..."
                                rows={4}
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                onClick={() => updateReportMutation.mutate({
                                  reportId: selectedReport.id,
                                  status: 'investigating',
                                  response: reportResponse
                                })}
                                variant="outline"
                              >
                                조사중으로 변경
                              </Button>
                              <Button
                                onClick={() => updateReportMutation.mutate({
                                  reportId: selectedReport.id,
                                  status: 'resolved',
                                  response: reportResponse
                                })}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                처리완료
                              </Button>
                              <Button
                                onClick={() => updateReportMutation.mutate({
                                  reportId: selectedReport.id,
                                  status: 'dismissed',
                                  response: reportResponse
                                })}
                                variant="destructive"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                기각
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">신고가 없습니다</h3>
            <p className="text-gray-500">현재 처리할 신고가 없습니다.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Inquiry Management Component
function InquiriesManagement() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [inquiryResponse, setInquiryResponse] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inquiriesData, isLoading: inquiriesLoading } = useQuery({
    queryKey: ["/api/admin/inquiries", statusFilter, categoryFilter],
    enabled: true,
  });

  const updateInquiryMutation = useMutation({
    mutationFn: async ({ inquiryId, status, response }: { inquiryId: number; status: string; response: string }) => {
      return apiRequest("PUT", `/api/admin/inquiries/${inquiryId}`, {
        status,
        response: response,
        respondedAt: new Date(),
      });
    },
    onSuccess: () => {
      toast({ title: "성공", description: "문의 답변이 완료되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inquiries"] });
      setSelectedInquiry(null);
      setInquiryResponse("");
    },
  });

  const inquiries = inquiriesData?.inquiries || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>문의 관리</CardTitle>
        <CardDescription>1:1 문의 및 답변 관리</CardDescription>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">답변 대기</SelectItem>
              <SelectItem value="answered">답변 완료</SelectItem>
              <SelectItem value="closed">완료</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="service">서비스</SelectItem>
              <SelectItem value="payment">결제</SelectItem>
              <SelectItem value="technical">기술</SelectItem>
              <SelectItem value="other">기타</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {inquiriesLoading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : inquiries.length > 0 ? (
          <div className="space-y-4">
            {inquiries.map((inquiry: any) => (
              <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold">{inquiry.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={inquiry.status === 'pending' ? 'destructive' : 'default'}>
                        {inquiry.status === 'pending' ? '답변 대기' : 
                         inquiry.status === 'answered' ? '답변 완료' : '완료'}
                      </Badge>
                      <Badge variant="outline">{inquiry.category}</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-medium">문의자:</span> {inquiry.username || '데이터 없음'}
                    </div>
                    <div>
                      <span className="font-medium">이메일:</span> {inquiry.email || '데이터 없음'}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{inquiry.content}</p>
                  
                  {inquiry.adminResponse && (
                    <div className="p-3 bg-blue-50 rounded-lg mb-4">
                      <p className="text-sm font-medium text-blue-800 mb-1">관리자 답변:</p>
                      <p className="text-blue-700">{inquiry.adminResponse}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInquiry(inquiry)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          답변하기
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>문의 답변</DialogTitle>
                        </DialogHeader>
                        
                        {selectedInquiry && (
                          <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <h4 className="font-semibold mb-2">{selectedInquiry.subject}</h4>
                              <p className="text-gray-700 mb-2">{selectedInquiry.content}</p>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><strong>문의자:</strong> {selectedInquiry.userName}</div>
                                <div><strong>이메일:</strong> {selectedInquiry.userEmail}</div>
                                <div><strong>카테고리:</strong> {selectedInquiry.category || '일반'}</div>
                                <div><strong>우선순위:</strong> {selectedInquiry.priority}</div>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-2">답변 내용</label>
                              <Textarea
                                value={inquiryResponse}
                                onChange={(e) => setInquiryResponse(e.target.value)}
                                placeholder="문의에 대한 답변을 입력하세요..."
                                rows={6}
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  if (!inquiryResponse.trim()) {
                                    toast({ title: "오류", description: "답변 내용을 입력해주세요.", variant: "destructive" });
                                    return;
                                  }
                                  updateInquiryMutation.mutate({
                                    inquiryId: selectedInquiry.id,
                                    status: 'answered',
                                    response: inquiryResponse
                                  });
                                }}
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={updateInquiryMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                답변 완료
                              </Button>
                              <Button
                                onClick={() => {
                                  updateInquiryMutation.mutate({
                                    inquiryId: selectedInquiry.id,
                                    status: 'closed',
                                    response: inquiryResponse || '문의가 종료되었습니다.'
                                  });
                                }}
                                variant="outline"
                                disabled={updateInquiryMutation.isPending}
                              >
                                문의 종료
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">문의가 없습니다</h3>
            <p className="text-gray-500">현재 답변할 문의가 없습니다.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Announcements Management Component
function AnnouncementsManagement() {
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    type: "notice",
    priority: "normal",
    targetAudience: "all"
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: announcementsData, isLoading: announcementsLoading } = useQuery({
    queryKey: ["/api/admin/announcements"],
    enabled: true,
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (announcement: any) => {
      return apiRequest("POST", "/api/admin/announcements", {
        ...announcement,
        authorId: 1,
        authorName: "관리자",
      });
    },
    onSuccess: () => {
      toast({ title: "성공", description: "공지사항이 등록되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      setAnnouncementForm({
        title: "",
        content: "",
        type: "notice",
        priority: "normal",
        targetAudience: "all"
      });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (announcementId: number) => {
      return apiRequest("DELETE", `/api/admin/announcements/${announcementId}`);
    },
    onSuccess: () => {
      toast({ title: "성공", description: "공지사항이 삭제되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
    },
  });

  const announcements = announcementsData?.announcements || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>공지사항 작성</CardTitle>
          <CardDescription>새로운 공지사항을 작성하여 사용자에게 알립니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
              placeholder="공지사항 제목을 입력하세요"
            />
          </div>
          
          <div>
            <Label htmlFor="content">내용</Label>
            <Textarea
              id="content"
              value={announcementForm.content}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
              placeholder="공지사항 내용을 입력하세요"
              rows={6}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="type">유형</Label>
              <Select value={announcementForm.type} onValueChange={(value) => setAnnouncementForm({ ...announcementForm, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notice">공지</SelectItem>
                  <SelectItem value="update">업데이트</SelectItem>
                  <SelectItem value="maintenance">점검</SelectItem>
                  <SelectItem value="event">이벤트</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="priority">우선순위</Label>
              <Select value={announcementForm.priority} onValueChange={(value) => setAnnouncementForm({ ...announcementForm, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">낮음</SelectItem>
                  <SelectItem value="normal">보통</SelectItem>
                  <SelectItem value="high">높음</SelectItem>
                  <SelectItem value="urgent">긴급</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="audience">대상</Label>
              <Select value={announcementForm.targetAudience} onValueChange={(value) => setAnnouncementForm({ ...announcementForm, targetAudience: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 사용자</SelectItem>
                  <SelectItem value="premium">프리미엄 사용자</SelectItem>
                  <SelectItem value="new">신규 사용자</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button
            onClick={() => createAnnouncementMutation.mutate(announcementForm)}
            disabled={!announcementForm.title || !announcementForm.content || createAnnouncementMutation.isPending}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            공지사항 등록
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>공지사항 목록</CardTitle>
          <CardDescription>등록된 공지사항을 관리합니다</CardDescription>
        </CardHeader>
        <CardContent>
          {announcementsLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement: any) => (
                <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold">{announcement.title}</h3>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={announcement.priority === 'urgent' ? 'destructive' : 'default'}>
                          {announcement.priority}
                        </Badge>
                        <Badge variant="outline">{announcement.type}</Badge>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{announcement.content}</p>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>대상: {announcement.targetAudience}</span>
                      <span>{new Date(announcement.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">공지사항이 없습니다</h3>
              <p className="text-gray-500">새로운 공지사항을 작성해보세요.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Analytics Content Component
function AnalyticsContent() {
  const { data: detailedStats, isLoading: detailedStatsLoading } = useQuery({
    queryKey: ["/api/admin/detailed-stats"],
    enabled: true,
  });

  if (detailedStatsLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>사용자 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>전체 사용자</span>
                <span className="font-semibold">{detailedStats?.users?.total || 0}명</span>
              </div>
              <div className="flex justify-between">
                <span>활성 사용자</span>
                <span className="font-semibold">{detailedStats?.users?.active || 0}명</span>
              </div>
              <div className="flex justify-between">
                <span>신규 사용자</span>
                <span className="font-semibold">{detailedStats?.users?.newToday || 0}명</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>매출 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>총 매출</span>
                <span className="font-semibold">₩{detailedStats?.revenue?.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>이번 달 매출</span>
                <span className="font-semibold">₩{detailedStats?.revenue?.thisMonth || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>오늘 매출</span>
                <span className="font-semibold">₩{detailedStats?.revenue?.today || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>서비스 이용</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>총 분석 수</span>
                <span className="font-semibold">{detailedStats?.analyses?.total || 0}건</span>
              </div>
              <div className="flex justify-between">
                <span>이번 달 분석</span>
                <span className="font-semibold">{detailedStats?.analyses?.thisMonth || 0}건</span>
              </div>
              <div className="flex justify-between">
                <span>오늘 분석</span>
                <span className="font-semibold">{detailedStats?.analyses?.today || 0}건</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>인기 서비스</CardTitle>
          <CardDescription>서비스별 이용 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {detailedStats?.topServices?.map((service: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{getKoreanServiceName(service.serviceType)}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(service.count / (detailedStats?.topServices?.[0]?.count || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{service.count || 0}건</span>
                </div>
              </div>
            )) || []}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to convert English action names to Korean
function getKoreanActionName(action: string): string {
  const actionMap: { [key: string]: string } = {
    'view_dashboard': '대시보드 조회',
    'view_detailed_statistics': '상세 통계 조회',
    'view_users': '사용자 관리 조회',
    'view_services': '서비스 관리 조회',
    'view_reviews': '후기 관리 조회',
    'view_reports': '신고 관리 조회',
    'view_inquiries': '문의 관리 조회',
    'view_announcements': '공지사항 관리 조회',
    'update_user_coins': '사용자 냥 조정',
    'update_service_price': '서비스 가격 변경',
    'delete_review': '후기 삭제',
    'resolve_report': '신고 처리',
    'respond_inquiry': '문의 답변',
    'create_announcement': '공지사항 등록',
    'delete_announcement': '공지사항 삭제',
    'admin_login': '관리자 로그인',
    'admin_logout': '관리자 로그아웃'
  };
  return actionMap[action] || action;
}

// Helper function to convert English service names to Korean
function getKoreanServiceName(serviceType: string): string {
  const serviceMap: { [key: string]: string } = {
    'monthly': '이번 달 운세',
    'comprehensive': '나의 종합 운세',
    'compatibility': '궁합 분석',
    'love': '연애 운세',
    'reunion': '재회 가능성',
    'love_potential': '연애 가능성',
    'comprehensive_fortune': '종합 운세',
    'career': '직업 운세',
    'finance': '재물 운세',
    'health': '건강 운세'
  };
  return serviceMap[serviceType] || serviceType;
}

// Helper function to convert English report types to Korean
function getKoreanReportType(reportType: string): string {
  const reportTypeMap: { [key: string]: string } = {
    'inappropriate_content': '부적절한 콘텐츠',
    'spam': '스팸',
    'harassment': '괴롭힘',
    'fake_information': '허위 정보',
    'copyright_violation': '저작권 위반',
    'privacy_violation': '개인정보 침해',
    'hate_speech': '혐오 발언',
    'violence': '폭력적 내용',
    'sexual_content': '성적 콘텐츠',
    'fraud': '사기',
    'other': '기타'
  };
  return reportTypeMap[reportType] || reportType;
}

// Logs Content Component
function LogsContent() {
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/admin/logs"],
    enabled: true,
  });

  if (logsLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  const logs = logsData?.logs || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>관리자 활동 로그</CardTitle>
        <CardDescription>최근 관리자 활동 기록</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.length > 0 ? (
            logs.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="font-medium">{getKoreanActionName(log.action)}</p>
                    <p className="text-sm text-gray-600">{log.details}</p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{new Date(log.createdAt).toLocaleDateString('ko-KR')}</p>
                  <p>{new Date(log.createdAt).toLocaleTimeString('ko-KR')}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">로그가 없습니다</h3>
              <p className="text-gray-500">관리자 활동이 기록되면 여기에 표시됩니다.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Phone Number Management Component
function PhoneNumberManagement() {
  const { toast } = useToast();

  // 사용자 목록 조회 (전화번호 포함)
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["/api/admin/users/phones"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users/phones");
      return await response.json();
    },
  });

  const allUsers = usersData?.users || [];
  const marketingConsentUsers = allUsers.filter((user: any) => user.marketingConsent);
  const usersWithPhones = allUsers.filter((user: any) => user.phone);
  const maleUsers = allUsers.filter((user: any) => user.phone && user.gender === '남자');
  const femaleUsers = allUsers.filter((user: any) => user.phone && user.gender === '여자');
  const marketingConsentMaleUsers = allUsers.filter((user: any) => user.marketingConsent && user.phone && user.gender === '남자');
  const marketingConsentFemaleUsers = allUsers.filter((user: any) => user.marketingConsent && user.phone && user.gender === '여자');

  // 텍스트 파일 다운로드 함수 (전화번호만)
  const downloadPhoneNumbers = (users: any[], filename: string) => {
    console.log('다운로드 함수 실행 - 사용자 수:', users.length);
    const phoneNumbers = users
      .filter(user => user.phone)
      .map(user => {
        console.log('전화번호 추출:', user.phone);
        return user.phone;
      })
      .join('\n');
    
    console.log('최종 전화번호 목록:', phoneNumbers);
    
    const blob = new Blob([phoneNumbers], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "다운로드 완료",
      description: `${filename} 파일이 다운로드되었습니다.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              전화번호 등록: {usersWithPhones.length}명
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">남성 사용자</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maleUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              마케팅 동의: {marketingConsentMaleUsers.length}명
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">여성 사용자</CardTitle>
            <Users className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{femaleUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              마케팅 동의: {marketingConsentFemaleUsers.length}명
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">마케팅 동의</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingConsentUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              SMS 마케팅 수신 동의자
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">동의율</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersWithPhones.length > 0 ? Math.round((marketingConsentUsers.length / usersWithPhones.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              전화번호 등록자 대비
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 다운로드 버튼 */}
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => downloadPhoneNumbers(marketingConsentUsers, 'marketing_consent_phones.txt')}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            disabled={marketingConsentUsers.length === 0}
          >
            <Download className="w-4 h-4" />
            마케팅 동의자 ({marketingConsentUsers.length}명)
          </Button>

          <Button
            onClick={() => downloadPhoneNumbers(usersWithPhones, 'all_user_phones.txt')}
            variant="outline"
            className="flex items-center gap-2"
            disabled={usersWithPhones.length === 0}
          >
            <Download className="w-4 h-4" />
            전체 사용자 ({usersWithPhones.length}명)
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => downloadPhoneNumbers(maleUsers, 'male_users_phones.txt')}
            disabled={maleUsers.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            남성 사용자 ({maleUsers.length}명)
          </Button>
          
          <Button
            onClick={() => downloadPhoneNumbers(femaleUsers, 'female_users_phones.txt')}
            disabled={femaleUsers.length === 0}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700"
          >
            <Download className="w-4 h-4" />
            여성 사용자 ({femaleUsers.length}명)
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => downloadPhoneNumbers(marketingConsentMaleUsers, 'marketing_consent_male_users.txt')}
            disabled={marketingConsentMaleUsers.length === 0}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
            variant="outline"
          >
            <Download className="w-4 h-4" />
            마케팅 동의 남성 ({marketingConsentMaleUsers.length}명)
          </Button>
          
          <Button
            onClick={() => downloadPhoneNumbers(marketingConsentFemaleUsers, 'marketing_consent_female_users.txt')}
            disabled={marketingConsentFemaleUsers.length === 0}
            className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600"
            variant="outline"
          >
            <Download className="w-4 h-4" />
            마케팅 동의 여성 ({marketingConsentFemaleUsers.length}명)
          </Button>
        </div>
      </div>

      {/* 마케팅 동의자 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>마케팅 수신 동의자 목록</CardTitle>
          <CardDescription>SMS 마케팅 메시지 수신에 동의한 사용자들</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="mt-2 text-gray-500">로딩 중...</p>
            </div>
          ) : marketingConsentUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>사용자명</TableHead>
                  <TableHead>전화번호</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>가입일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketingConsentUsers.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">마케팅 동의자가 없습니다</h3>
              <p className="text-gray-500">마케팅 수신에 동의한 사용자가 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 전체 사용자 전화번호 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>전체 사용자 전화번호</CardTitle>
          <CardDescription>전화번호를 등록한 모든 사용자</CardDescription>
        </CardHeader>
        <CardContent>
          {usersWithPhones.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>사용자명</TableHead>
                  <TableHead>전화번호</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>마케팅 동의</TableHead>
                  <TableHead>가입일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersWithPhones.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.marketingConsent ? 'default' : 'secondary'}>
                        {user.marketingConsent ? '동의' : '비동의'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">전화번호가 등록된 사용자가 없습니다</h3>
              <p className="text-gray-500">전화번호를 등록한 사용자가 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}