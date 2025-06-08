import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";

interface FooterProps {
  onCustomerSupportClick?: () => void;
}

export default function Footer({ onCustomerSupportClick }: FooterProps) {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 회사 정보 */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              EVERYUNSE (에브리운세)
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p><strong>상호명:</strong> 이제이</p>
              <p><strong>대표자:</strong> 조민철외 1명</p>
              <p><strong>사업자등록번호:</strong> 219-44-01233</p>
              <p><strong>통신판매업신고번호:</strong> 제2025-서울중랑구-00123호</p>
              <p><strong>사업장소재지:</strong> 서울특별시 중랑구 동일로149길 69-20(묵동)</p>
              <p><strong>이메일:</strong> ejcompany0511@gmail.com</p>
              <p><strong>개인정보보호책임자:</strong> 조민철 (ejcompany0511@gmail.com)</p>
            </div>
          </div>

          {/* 법적 정보 */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">약관 및 정책</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/terms" className="hover:text-primary">이용약관</Link></li>
              <li><Link href="/privacy" className="hover:text-primary">개인정보처리방침</Link></li>
              <li><Link href="/refund" className="hover:text-primary">환불정책</Link></li>
              <li>
                <button 
                  onClick={onCustomerSupportClick}
                  className="hover:text-primary text-left"
                >
                  고객지원
                </button>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-6" />
        
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <p>© 2025 EJ컴퍼니. All rights reserved.</p>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <span>결제시스템: 포트원(PortOne)</span>
            <span>|</span>
            <span>PG사: 웰컴페이먼츠</span>
          </div>
        </div>
      </div>
    </footer>
  );
}