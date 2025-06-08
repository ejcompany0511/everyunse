import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">개인정보처리방침</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3>제1조 (개인정보의 처리목적)</h3>
            <p>이제이('everyunse.com' 이하 '회사')는 다음의 목적을 위하여 개인정보를 처리하고 있으며, 다음의 목적 이외의 용도로는 이용하지 않습니다.</p>
            <ul>
              <li>고객 가입의사 확인, 고객에 대한 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 물품 또는 서비스 공급에 따른 금액 결제</li>
              <li>고충처리 목적으로 개인정보를 처리합니다.</li>
            </ul>

            <h3>제2조 (개인정보의 처리 및 보유기간)</h3>
            <p>① 회사는 정보주체로부터 개인정보를 수집할 때 동의받은 개인정보 보유·이용기간 또는 법령에 따른 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
            <p>② 구체적인 개인정보 처리 및 보유 기간은 다음과 같습니다.</p>
            <ul>
              <li>홈페이지 회원가입 및 관리: 사업자/단체 홈페이지 탈퇴시까지</li>
              <li>민원사무 처리: 3년</li>
            </ul>

            <h3>제3조 (처리하는 개인정보의 항목)</h3>
            <p>① 회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
            <ul>
              <li><strong>필수항목:</strong> 이메일, 이름</li>
              <li><strong>선택항목:</strong> 생년월일, 성별, 출생시간, 출생지역, 전화번호</li>
            </ul>
            <p>② 인터넷 서비스 이용과정에서 아래 개인정보 항목이 자동으로 생성되어 수집될 수 있습니다.</p>
            <ul>
              <li>IP주소, 쿠키, MAC주소, 서비스 이용기록, 방문기록, 불량 이용기록 등</li>
            </ul>

            <h3>제4조 (개인정보의 제3자 제공)</h3>
            <p>① 회사는 정보주체의 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</p>

            <h3>제5조 (개인정보처리 위탁)</h3>
            <p>① 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
            <ul>
              <li>결제처리: PortOne(포트원), 웰컴페이먼츠</li>
              <li>클라우드 서비스: Replit</li>
            </ul>

            <h3>제5조 (정보주체의 권리·의무 및 그 행사방법)</h3>
            <p>① 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
            <ul>
              <li>개인정보 처리정지 요구</li>
              <li>개인정보 열람요구</li>
              <li>개인정보 정정·삭제요구</li>
              <li>개인정보 처리정지 요구</li>
            </ul>

            <h3>제6조 (처리하는 개인정보의 항목 작성)</h3>
            <p>① 회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
            <ul>
              <li>필수항목: 이메일, 이름</li>
              <li>선택항목: 생년월일, 성별, 출생시간, 출생지역, 전화번호</li>
            </ul>

            <h3>제7조 (개인정보의 파기)</h3>
            <p>① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
            <p>② 정보주체로부터 동의받은 개인정보 보유기간이 경과하거나 처리목적이 달성되었음에도 불구하고 다른 법령에 따라 개인정보를 계속 보존하여야 하는 경우에는, 해당 개인정보를 별도의 데이터베이스(DB)로 옮기거나 보관장소를 달리하여 보존합니다.</p>

            <h3>제8조 (개인정보의 안전성 확보 조치)</h3>
            <p>회사는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다.</p>
            <ul>
              <li>개인정보 취급 직원의 최소화 및 교육</li>
              <li>개인정보의 암호화</li>
              <li>해킹 등에 대비한 기술적 대책</li>
              <li>개인정보에 대한 접근 제한</li>
            </ul>

            <h3>제9조 (개인정보 보호책임자)</h3>
            <p>① 회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
            <ul>
              <li>개인정보 보호책임자: 조민철</li>
              <li>연락처: ejcompany0511@gmail.com</li>
            </ul>

            <h3>제10조 (개인정보 처리방침 변경)</h3>
            <p>① 이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>

            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                본 개인정보처리방침은 2025년 6월 7일부터 시행됩니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}