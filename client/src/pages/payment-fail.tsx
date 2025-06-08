import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentFail() {
  const [, navigate] = useLocation();

  // URL에서 에러 정보 추출
  const urlParams = new URLSearchParams(window.location.search);
  const errorCode = urlParams.get("code");
  const errorMessage = urlParams.get("message");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <img
              src="https://static.toss.im/lotties/error-spot-apng.png"
              width="120"
              height="120"
              className="mx-auto"
              alt="결제 실패"
            />
            <h2 className="text-2xl font-bold text-gray-800">결제를 실패했어요</h2>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">에러코드</span>
                <span className="font-medium text-red-600">{errorCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">메시지</span>
                <span className="font-medium text-red-600 text-right break-words">
                  {errorMessage}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Button 
                className="w-full gradient-bg text-white"
                onClick={() => navigate("/profile")}
              >
                다시 시도하기
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/")}
              >
                홈으로 가기
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}