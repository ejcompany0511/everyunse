import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Star, User, Calendar, ThumbsUp, Plus, MessageCircle, Sparkles, Heart } from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";
import { apiRequest } from "@/lib/queryClient";
import type { Review } from "@shared/schema";

export default function Reviews() {
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    serviceType: "",
    rating: 5,
    title: "",
    content: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ["/api/reviews"],
    queryFn: async () => {
      const response = await fetch("/api/reviews");
      if (!response.ok) throw new Error("Failed to fetch reviews");
      return response.json();
    }
  });

  const reviews = reviewsData?.reviews || [];
  
  // 평균 별점 계산
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum: number, review: Review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      return await apiRequest("POST", "/api/reviews", reviewData);
    },
    onSuccess: () => {
      toast({
        title: "후기 작성 완료",
        description: "후기가 성공적으로 등록되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      setIsWriteModalOpen(false);
      setNewReview({ serviceType: "", rating: 5, title: "", content: "" });
    },
    onError: (error: any) => {
      toast({
        title: "후기 작성 실패", 
        description: error.message || "후기 작성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.serviceType || !newReview.title || !newReview.content) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    createReviewMutation.mutate(newReview);
  };

  const serviceTypes = [
    { value: "all", label: "전체" },
    { value: "monthly_fortune", label: "이번 달 운세" },
    { value: "love_potential", label: "연애할 수 있을까?" },
    { value: "reunion_possibility", label: "재회 가능할까요?" },
    { value: "compatibility", label: "궁합 분석" },
    { value: "job_concern", label: "취업이 안되면 어쩌죠?" },
    { value: "marriage_potential", label: "결혼할 수 있을까요?" },
    { value: "comprehensive_fortune", label: "나의 종합 운세" }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    // Parse the date string and ensure it's treated as local time
    const date = new Date(dateString.replace('Z', '').replace('T', ' '));
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: 'Asia/Seoul'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="max-w-md mx-auto p-4">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-lg p-4 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="w-16 h-6 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-b from-blue-50 to-white px-4 py-2 sticky top-0 z-10 border-b border-blue-100/50">
          <div className="flex justify-between items-center mb-2">
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">
                이용 후기
              </h1>
            </div>
            <Dialog open={isWriteModalOpen} onOpenChange={setIsWriteModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 text-sm font-medium shadow-sm">
                  <Plus className="w-4 h-4 mr-1" />
                  작성
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-lg">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-gray-900">
                    후기 작성하기
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <Label htmlFor="serviceType" className="text-sm font-medium text-gray-700">서비스 종류</Label>
                    <Select 
                      value={newReview.serviceType} 
                      onValueChange={(value) => setNewReview(prev => ({ ...prev, serviceType: value }))}
                    >
                      <SelectTrigger className="mt-2 rounded-lg border border-gray-300">
                        <SelectValue placeholder="서비스를 선택해주세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.slice(1).map((service) => (
                          <SelectItem key={service.value} value={service.value}>
                            {service.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="rating" className="text-sm font-medium text-gray-700">만족도</Label>
                    <div className="flex gap-1 mt-2 justify-center p-3 bg-gray-50 rounded-lg">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                          className="p-1 rounded hover:bg-white transition-colors"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= newReview.rating 
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium text-gray-700">제목</Label>
                    <Input
                      id="title"
                      value={newReview.title}
                      onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="후기 제목을 입력해주세요"
                      className="mt-2 rounded-lg border border-gray-300"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="content" className="text-sm font-medium text-gray-700">내용</Label>
                    <Textarea
                      id="content"
                      value={newReview.content}
                      onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="후기 내용을 자세히 작성해주세요"
                      rows={4}
                      className="mt-2 rounded-lg border border-gray-300 resize-none"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsWriteModalOpen(false)}
                      className="flex-1 rounded-lg"
                    >
                      취소
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createReviewMutation.isPending}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                      {createReviewMutation.isPending ? "작성 중..." : "등록하기"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Rating Section in Header */}
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/60">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-xl font-bold bg-gradient-to-br from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {averageRating}
                </div>
                <div className="flex justify-center">
                  {renderStars(Math.round(parseFloat(averageRating)))}
                </div>
                <div className="text-xs text-gray-600">평균 별점</div>
              </div>
              <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
              <div className="text-center">
                <div className="text-xl font-bold bg-gradient-to-br from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {reviews.length}
                </div>
                <div className="text-xs text-gray-700">총 후기</div>
                <div className="text-xs text-gray-500">실제 이용자</div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="px-4 pb-4 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 animate-pulse border border-white/20">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl"></div>
                    <div className="flex-1">
                      <div className="w-24 h-4 bg-gray-200 rounded-lg mb-2"></div>
                      <div className="w-20 h-3 bg-gray-200 rounded-lg"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-3/4 h-4 bg-gray-200 rounded-lg"></div>
                    <div className="w-full h-3 bg-gray-200 rounded-lg"></div>
                    <div className="w-2/3 h-3 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">아직 후기가 없습니다</h3>
              <p className="text-sm text-gray-500">
                첫 번째 후기를 작성해서 다른 사용자들에게 도움을 주세요!
              </p>
            </div>
          ) : (
            reviews.map((review: Review) => (
              <div key={review.id} className="bg-white border border-gray-100 rounded-lg p-5 hover:shadow-md transition-shadow duration-200">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {review.username}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium">
                          {serviceTypes.find(s => s.value === review.serviceType)?.label || review.serviceType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="text-sm font-semibold text-gray-900">
                      {review.rating}.0
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {review.title}
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {review.content}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(review.createdAt)}</span>
                  </div>
                  <button className="flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="font-medium">도움돼요 9</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}