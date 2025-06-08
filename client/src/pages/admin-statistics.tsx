import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { 
  Users, TrendingUp, Activity, DollarSign, AlertCircle, 
  MessageSquare, Star, Calendar, Clock
} from "lucide-react";

export default function AdminStatistics() {
  const [dateRange, setDateRange] = useState("week");

  const { data: detailedStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/detailed-stats"],
    refetchInterval: 30000
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/admin/logs", { page: 1, limit: 20 }],
    refetchInterval: 60000
  });

  if (statsLoading || logsLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const userGrowthData = detailedStats?.users ? [
    { name: "총 사용자", value: detailedStats.users.total, color: "#8884d8" },
    { name: "활성 사용자", value: detailedStats.users.active, color: "#82ca9d" },
    { name: "이번 주 신규", value: detailedStats.users.newThisWeek, color: "#ffc658" },
    { name: "오늘 신규", value: detailedStats.users.newToday, color: "#ff7300" }
  ] : [];

  const revenueData = detailedStats?.revenue ? [
    { name: "총 수익", value: detailedStats.revenue.total },
    { name: "오늘 수익", value: detailedStats.revenue.today }
  ] : [];

  const analysisData = detailedStats?.analyses ? [
    { name: "총 분석", value: detailedStats.analyses.total },
    { name: "오늘 분석", value: detailedStats.analyses.today },
    { name: "이번 주 분석", value: detailedStats.analyses.thisWeek }
  ] : [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">통계 및 분석</h1>
          <p className="text-muted-foreground">시스템 성능과 사용자 활동 분석</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={dateRange === "day" ? "default" : "outline"}
            onClick={() => setDateRange("day")}
            size="sm"
          >
            일간
          </Button>
          <Button
            variant={dateRange === "week" ? "default" : "outline"}
            onClick={() => setDateRange("week")}
            size="sm"
          >
            주간
          </Button>
          <Button
            variant={dateRange === "month" ? "default" : "outline"}
            onClick={() => setDateRange("month")}
            size="sm"
          >
            월간
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="users">사용자</TabsTrigger>
          <TabsTrigger value="revenue">수익</TabsTrigger>
          <TabsTrigger value="services">서비스</TabsTrigger>
          <TabsTrigger value="logs">로그</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{detailedStats?.users?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  활성: {detailedStats?.users?.active || 0}명
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 수익</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{detailedStats?.revenue?.total || 0}냥</div>
                <p className="text-xs text-muted-foreground">
                  오늘: +{detailedStats?.revenue?.today || 0}냥
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 분석</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{detailedStats?.analyses?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  오늘: +{detailedStats?.analyses?.today || 0}건
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">대기 중인 작업</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(detailedStats?.pending?.inquiries || 0) + (detailedStats?.pending?.reports || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  문의: {detailedStats?.pending?.inquiries || 0}, 신고: {detailedStats?.pending?.reports || 0}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>사용자 현황</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>최근 거래</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {detailedStats?.recentTransactions?.slice(0, 5).map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium">{transaction.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.description}
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        {transaction.type === 'purchase' ? '+' : '-'}{transaction.amount}냥
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>사용자 분포</CardTitle>
                <CardDescription>사용자 상태별 분포</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userGrowthData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {userGrowthData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>사용자 성장</CardTitle>
                <CardDescription>시간별 사용자 증가 추이</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">오늘 신규 가입</span>
                    <Badge variant="secondary">{detailedStats?.users?.newToday || 0}명</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">이번 주 신규 가입</span>
                    <Badge variant="secondary">{detailedStats?.users?.newThisWeek || 0}명</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">활성 사용자</span>
                    <Badge variant="default">{detailedStats?.users?.active || 0}명</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">총 사용자</span>
                    <Badge variant="outline">{detailedStats?.users?.total || 0}명</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>수익 분석</CardTitle>
              <CardDescription>코인 거래 및 수익 현황</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>서비스 이용 현황</CardTitle>
              <CardDescription>인기 서비스 분석</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {detailedStats?.topServices?.map((service: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{service.serviceType}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(service.count / (detailedStats.topServices[0]?.count || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <Badge variant="secondary">{service.count}건</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>관리자 활동 로그</CardTitle>
              <CardDescription>최근 관리자 작업 기록</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs?.logs?.map((log: any) => (
                  <div key={log.id} className="flex items-start space-x-4 p-3 border rounded-lg">
                    <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{log.adminUsername || '시스템'}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.action}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {log.description}
                      </p>
                      {log.targetType && (
                        <div className="text-xs">
                          대상: {log.targetType} {log.targetId && `#${log.targetId}`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}