import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, X, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: number;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  relatedId: number | null;
  createdAt: string;
}

interface NotificationModalProps {
  unreadCount: number;
}

export default function NotificationModal({ unreadCount }: NotificationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const { toast } = useToast();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isOpen,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("POST", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "알림이 읽음 처리되었습니다",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "오류가 발생했습니다",
        description: "알림 읽음 처리 중 문제가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            알림
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount}개의 새 알림</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[60vh] space-y-3">
          {selectedNotification ? (
            // 상세 알림 보기
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedNotification(null)}
                  className="text-sm"
                >
                  ← 목록으로
                </Button>
                {!selectedNotification.isRead && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsRead(selectedNotification.id)}
                    disabled={markAsReadMutation.isPending}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    읽음 처리
                  </Button>
                )}
              </div>
              
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedNotification.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(selectedNotification.createdAt)}
                      </p>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                        {selectedNotification.content}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-4 border-t">
                      <Badge variant={selectedNotification.isRead ? "secondary" : "default"}>
                        {selectedNotification.isRead ? "읽음" : "새 알림"}
                      </Badge>
                      <Badge variant="outline">
                        {selectedNotification.type === "inquiry_response" ? "문의 답변" :
                         selectedNotification.type === "system" ? "시스템 알림" :
                         selectedNotification.type === "announcement" ? "공지사항" : "알림"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">알림을 불러오는 중...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">알림이 없습니다.</p>
            </div>
          ) : (
            // 알림 목록
            notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !notification.isRead ? 'border-blue-200 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedNotification(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <Badge variant="destructive" className="text-xs">새 알림</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {notification.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {formatDate(notification.createdAt)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {notification.type === "inquiry_response" ? "문의 답변" :
                           notification.type === "system" ? "시스템 알림" :
                           notification.type === "announcement" ? "공지사항" : "알림"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}