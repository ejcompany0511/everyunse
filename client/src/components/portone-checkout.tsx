import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PortOneCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  coinAmount: number;
  onSuccess: () => void;
}

declare global {
  interface Window {
    IMP: any;
  }
}

export function PortOneCheckout({ isOpen, onClose, amount, coinAmount, onSuccess }: PortOneCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadPortOneScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.IMP) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.iamport.kr/v1/iamport.js';
      script.onload = () => {
        if (window.IMP) {
          window.IMP.init(import.meta.env.VITE_PORTONE_STORE_ID);
          resolve();
        } else {
          reject(new Error('PortOne 스크립트 로드 실패'));
        }
      };
      script.onerror = () => reject(new Error('PortOne 스크립트 로드 실패'));
      document.head.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log("=== PortOne V1 결제 요청 시작 ===");
      console.log("StoreId:", import.meta.env.VITE_PORTONE_STORE_ID);
      console.log("PaymentId:", orderId);
      console.log("Amount:", amount);

      // 테스트를 위해 항상 실제 결제창 표시 (개발/운영 동일)
      console.log("=== 실제 PortOne 결제창 호출 ===");

      // PortOne V1 스크립트 로드
      await loadPortOneScript();
      
      // 결제창 크기 및 위치 최적화 시스템
      const setupPaymentPopupHandler = () => {
        let resizeAttempts = 0;
        const maxAttempts = 20;
        
        const findAndResizePaymentWindow = () => {
          resizeAttempts++;
          
          // KG이니시스 결제창 탐지 및 조정
          const paymentSelectors = [
            'iframe[src*="inicis"]',
            'iframe[src*="pg"]',
            'iframe[name*="payment"]',
            'iframe[title*="payment"]',
            'div[style*="position: absolute"][style*="z-index"]',
            'div[style*="position: fixed"][style*="z-index"]'
          ];
          
          let found = false;
          
          paymentSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((element: any) => {
              if (element && element.style && (element.offsetWidth > 300 || element.tagName === 'IFRAME')) {
                found = true;
                
                // 모바일/PC 반응형 크기 설정 (하단 버튼까지 완전히 보이도록)
                const isMobile = window.innerWidth <= 768;
                const width = isMobile ? '400px' : '480px';
                const height = isMobile ? '700px' : '750px';
                
                // 강제 스타일 덮어쓰기
                element.style.position = 'fixed';
                element.style.top = '50%';
                element.style.left = '50%';
                element.style.transform = 'translate(-50%, -50%)';
                element.style.width = width;
                element.style.height = height;
                element.style.maxWidth = '95vw';
                element.style.maxHeight = '90vh';
                element.style.zIndex = '999999';
                element.style.border = 'none';
                element.style.borderRadius = '12px';
                element.style.boxShadow = '0 10px 40px rgba(0,0,0,0.7)';
                element.style.overflow = 'auto';
                
                // 부모 컨테이너도 조정
                if (element.parentElement) {
                  element.parentElement.style.position = 'fixed';
                  element.parentElement.style.top = '0';
                  element.parentElement.style.left = '0';
                  element.parentElement.style.width = '100%';
                  element.parentElement.style.height = '100%';
                  element.parentElement.style.zIndex = '999998';
                  element.parentElement.style.background = 'rgba(0,0,0,0.5)';
                }
                
                console.log(`결제창 크기 조정 완료 (${resizeAttempts}회 시도):`, {
                  element: element.tagName,
                  src: element.src,
                  width: element.style.width,
                  height: element.style.height
                });
              }
            });
          });
          
          // 결제창을 찾지 못했고 최대 시도 횟수에 도달하지 않았으면 재시도
          if (!found && resizeAttempts < maxAttempts) {
            setTimeout(findAndResizePaymentWindow, 200);
          }
        };
        
        // MutationObserver로 DOM 변화 감지
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node: any) => {
              if (node.nodeType === 1 && (node.tagName === 'IFRAME' || node.tagName === 'DIV')) {
                setTimeout(findAndResizePaymentWindow, 100);
              }
            });
          });
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // 즉시 실행
        findAndResizePaymentWindow();
        
        // 5초 후 observer 정리
        setTimeout(() => observer.disconnect(), 8000);
      };
      
      // 결제창 크기 감지 시작
      setupPaymentPopupHandler();
      
      // PortOne V1 결제 요청 (크기 최적화)
      window.IMP.request_pay({
        pg: "html5_inicis",
        pay_method: "card",
        merchant_uid: orderId,
        name: `${coinAmount}냥 충전`,
        amount: amount,
        buyer_email: "test@everyunse.com",
        buyer_name: "테스트사용자",
        buyer_tel: "010-1234-5678",
        // 팝업 크기 설정 - 화면에 맞게 조정
        popup: true,
        width: 380,
        height: 520,
      }, async (response: any) => {
        try {
          if (response.success) {
            // 결제 성공 시 백엔드에 검증 요청
            const verification = await apiRequest("POST", "/api/payment/verify", {
              paymentId: orderId,
              amount: amount,
              coinAmount: coinAmount,
              impUid: response.imp_uid
            });
            
            if (verification.success) {
              toast({
                title: "결제 완료",
                description: `${coinAmount}냥이 충전되었습니다!`,
              });
              onSuccess();
              onClose();
            } else {
              toast({
                title: "결제 검증 실패",
                description: "결제는 완료되었으나 검증에 실패했습니다. 고객센터에 문의해주세요.",
                variant: "destructive",
              });
            }
          } else {
            throw new Error(response.error_msg || "결제가 취소되었습니다");
          }
        } catch (error: any) {
          console.error("결제 검증 오류:", error);
          toast({
            title: "결제 실패",
            description: error.message || "결제 검증 중 오류가 발생했습니다",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      });
      
    } catch (error: any) {
      console.error("결제 처리 오류:", error);
      toast({
        title: "결제 실패",
        description: error.message || "결제 중 오류가 발생했습니다",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95%] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center">
            {coinAmount}냥 충전
          </DialogTitle>
          <p className="text-center text-gray-600 mt-2">
            결제 금액: {amount.toLocaleString()}원
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">충전 내역</h3>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{coinAmount}냥</span>
              <span className="font-bold text-lg">{amount.toLocaleString()}원</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              💡 결제 완료 후 즉시 냥이 충전됩니다
            </p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              onClick={handlePayment}
              disabled={isLoading}
            >
              {isLoading ? "결제 처리 중..." : "카드로 결제하기"}
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={onClose}
              disabled={isLoading}
            >
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}