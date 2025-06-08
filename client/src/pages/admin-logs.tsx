import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Eye, Shield, Users, Activity } from "lucide-react";

interface AdminLog {
  id: number;
  adminId: number;
  action: string;
  resourceType: string;
  resourceId?: number;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  adminUsername: string;
}

interface Transaction {
  id: number;
  userId: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  username: string;
}

export default function AdminLogs() {
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionType, setTransactionType] = useState("all");
  const [logPage, setLogPage] = useState(1);

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/admin/transactions', currentPage, transactionType],
    queryFn: async () => {
      const response = await fetch(`/api/admin/transactions?page=${currentPage}&limit=20&type=${transactionType}`);
      return response.json();
    }
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['/api/admin/logs', logPage],
    queryFn: async () => {
      const response = await fetch(`/api/admin/logs?page=${logPage}&limit=20`);
      return response.json();
    }
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
      case 'logout':
        return <Shield className="h-4 w-4" />;
      case 'view_users':
      case 'update_user':
        return <Users className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login':
        return 'bg-green-100 text-green-800';
      case 'logout':
        return 'bg-gray-100 text-gray-800';
      case 'delete':
      case 'ban_user':
        return 'bg-red-100 text-red-800';
      case 'update':
      case 'update_user':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'charge':
        return 'bg-green-100 text-green-800';
      case 'spend':
        return 'bg-red-100 text-red-800';
      case 'refund':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            뒤로가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">관리자 로그</h1>
            <p className="text-gray-600">모든 관리자 활동 기록</p>
          </div>
        </div>

        <Tabs defaultValue="logs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="logs">관리자 활동 로그</TabsTrigger>
            <TabsTrigger value="transactions">거래 내역</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  관리자 활동 로그
                </CardTitle>
                <CardDescription>
                  모든 관리자의 시스템 접근 및 활동 기록을 확인할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs?.logs?.map((log: AdminLog) => (
                      <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-gray-100">
                              {getActionIcon(log.action)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getActionColor(log.action)}>
                                  {log.action}
                                </Badge>
                                <span className="text-sm font-medium text-gray-900">
                                  {log.adminUsername}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {log.details}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>리소스: {log.resourceType}</span>
                                {log.resourceId && <span>ID: {log.resourceId}</span>}
                                {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-900">
                              {new Date(log.createdAt).toLocaleDateString('ko-KR')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(log.createdAt).toLocaleTimeString('ko-KR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {logs?.logs?.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        아직 로그 기록이 없습니다.
                      </div>
                    )}

                    {/* Pagination */}
                    {logs?.totalPages > 1 && (
                      <div className="flex justify-center gap-2 mt-6">
                        <Button
                          variant="outline"
                          onClick={() => setLogPage(prev => Math.max(1, prev - 1))}
                          disabled={logPage === 1}
                        >
                          이전
                        </Button>
                        <span className="px-3 py-2 text-sm">
                          {logPage} / {logs.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => setLogPage(prev => Math.min(logs.totalPages, prev + 1))}
                          disabled={logPage === logs.totalPages}
                        >
                          다음
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  거래 내역
                </CardTitle>
                <CardDescription>
                  모든 사용자의 냥 거래 내역을 확인할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Select value={transactionType} onValueChange={setTransactionType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="거래 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 거래</SelectItem>
                      <SelectItem value="charge">충전</SelectItem>
                      <SelectItem value="spend">사용</SelectItem>
                      <SelectItem value="refund">환불</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {transactionsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions?.transactions?.map((transaction: Transaction) => (
                      <div key={transaction.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className={getTransactionTypeColor(transaction.type)}>
                              {transaction.type === 'charge' ? '충전' : 
                               transaction.type === 'spend' ? '사용' : 
                               transaction.type === 'refund' ? '환불' : transaction.type}
                            </Badge>
                            <div>
                              <div className="font-medium text-gray-900">
                                {transaction.username || `사용자 ${transaction.userId}`}
                              </div>
                              <div className="text-sm text-gray-600">
                                {transaction.description}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount} 냥
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(transaction.createdAt).toLocaleString('ko-KR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {transactions?.transactions?.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        거래 내역이 없습니다.
                      </div>
                    )}

                    {/* Pagination */}
                    {transactions?.totalPages > 1 && (
                      <div className="flex justify-center gap-2 mt-6">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          이전
                        </Button>
                        <span className="px-3 py-2 text-sm">
                          {currentPage} / {transactions.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => Math.min(transactions.totalPages, prev + 1))}
                          disabled={currentPage === transactions.totalPages}
                        >
                          다음
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}