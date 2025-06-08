import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, ArrowLeft, X } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { PortOneCheckout } from "@/components/portone-checkout";

export default function CoinsPage() {
  const [, navigate] = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [showPortOneCheckout, setShowPortOneCheckout] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{coins: number, price: number} | null>(null);
  const { toast } = useToast();

  const { data: coinData } = useQuery({
    queryKey: ["/api/coins/balance"],
  });

  const coinPackages = [
    { coins: 25, price: 5000, originalPrice: 6000, isSelected: false },
    { coins: 50, price: 10000, originalPrice: 12000, isSelected: false },
    { coins: 100, price: 20000, originalPrice: 24000, isSelected: true },
    { coins: 200, price: 39000, originalPrice: 48000, isSelected: false },
    { coins: 300, price: 57000, originalPrice: 72000, isSelected: false },
    { coins: 500, price: 89000, originalPrice: 120000, isSelected: false },
  ];

  const handlePayment = (coins: number, price: number) => {
    setSelectedPackage({ coins, price });
    setShowPortOneCheckout(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    navigate("/my");
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">냥을 충전해주세요.</h2>
            <p className="text-sm text-gray-600 mt-1">
              1회 사주 분석은 50냥입니다<br />
              (상대방이 거절시 자동환급)
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 냥 패키지 목록 */}
        <div className="p-6 space-y-3">
          {coinPackages.map((pkg) => (
            <div
              key={pkg.coins}
              className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                pkg.isSelected
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handlePayment(pkg.coins, pkg.price)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <span className="text-xl font-bold">{pkg.coins}냥</span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">{pkg.price.toLocaleString()}원</div>
                  <div className="text-sm text-red-500 line-through">
                    {pkg.originalPrice.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 취소 버튼 */}
        <div className="p-6 pt-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full py-3 text-gray-600"
          >
            취소
          </Button>
        </div>
      </div>

      {/* PortOne Checkout */}
      {selectedPackage && (
        <PortOneCheckout
          isOpen={showPortOneCheckout}
          onClose={() => {
            setShowPortOneCheckout(false);
            setSelectedPackage(null);
          }}
          amount={selectedPackage.price}
          coinAmount={selectedPackage.coins}
          onSuccess={() => {
            setShowPortOneCheckout(false);
            setSelectedPackage(null);
            toast({
              title: "충전 완료",
              description: `${selectedPackage.coins}냥이 충전되었습니다.`,
            });
            navigate("/my");
          }}
        />
      )}
    </div>
  );
}