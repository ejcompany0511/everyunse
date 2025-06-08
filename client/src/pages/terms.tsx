import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Terms() {
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
            <CardTitle className="text-2xl font-bold text-center">이용약관</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3>제1조 (목적)</h3>
            <p>이 약관은 이제이(이하 "회사")가 운영하는 EVERYUNSE(에브리운세) 서비스의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>

            <h3>제2조 (정의)</h3>
            <ul>
              <li>"서비스"란 회사가 제공하는 AI 기반 사주 분석 및 운세 서비스를 의미합니다.</li>
              <li>"이용자"란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 의미합니다.</li>
              <li>"냥"이란 서비스 내에서 사용되는 가상화폐를 의미합니다.</li>
            </ul>

            <h3>제3조 (약관의 효력 및 변경)</h3>
            <p>1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</p>
            <p>2. 회사는 합리적인 사유가 발생할 경우 이 약관을 변경할 수 있으며, 약관을 변경하는 경우 적용일자 및 변경사유를 명시하여 현행약관과 함께 서비스 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</p>

            <h3>제4조 (서비스의 제공)</h3>
            <p>1. 회사는 다음과 같은 서비스를 제공합니다:</p>
            <ul>
              <li>AI 기반 사주 분석 서비스</li>
              <li>궁합 분석 서비스</li>
              <li>일일 운세 서비스</li>
              <li>기타 회사가 정하는 서비스</li>
            </ul>

            <h3>제5조 (서비스 이용료)</h3>
            <p>1. 회사가 제공하는 서비스는 기본적으로 무료입니다. 다만, 일부 프리미엄 서비스는 유료로 제공될 수 있습니다.</p>
            <p>2. 유료 서비스의 이용료는 서비스별로 별도 책정되며, 해당 서비스 이용 시 명시됩니다.</p>

            <h3>제6조 (환불정책)</h3>
            <p>1. 유료 서비스 이용료의 환불은 별도의 환불정책에 따릅니다.</p>
            <p>2. 회사의 귀책사유로 인한 서비스 중단의 경우 이용료를 환불합니다.</p>

            <h3>제7조 (개인정보보호)</h3>
            <p>회사는 관련 법령이 정하는 바에 따라 이용자의 개인정보를 보호하기 위해 노력합니다. 개인정보의 보호 및 이용에 대해서는 관련법령 및 회사의 개인정보처리방침이 적용됩니다.</p>

            <h3>제8조 (회사의 의무)</h3>
            <p>1. 회사는 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며, 이 약관이 정하는 바에 따라 지속적이고, 안정적으로 서비스를 제공하기 위해서 노력합니다.</p>
            <p>2. 회사는 이용자가 안전하게 인터넷 서비스를 이용할 수 있도록 이용자의 개인정보보호를 위한 보안 시스템을 구축합니다.</p>

            <h3>제9조 (이용자의 의무)</h3>
            <p>1. 이용자는 다음 행위를 하여서는 안 됩니다:</p>
            <ul>
              <li>신청 또는 변경시 허위내용의 등록</li>
              <li>타인의 정보 도용</li>
              <li>회사가 게시한 정보의 변경</li>
              <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
              <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
              <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 회사에 공개 또는 게시하는 행위</li>
            </ul>

            <h3>제10조 (저작권의 귀속 및 이용제한)</h3>
            <p>1. 회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속합니다.</p>
            <p>2. 이용자는 회사를 이용함으로써 얻은 정보 중 회사에게 지적재산권이 귀속된 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안됩니다.</p>

            <h3>제11조 (분쟁해결)</h3>
            <p>1. 회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 피해보상처리기구를 설치·운영합니다.</p>
            <p>2. 회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 서울중앙지방법원을 관할 법원으로 합니다.</p>

            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                본 약관은 2025년 6월 7일부터 시행됩니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}