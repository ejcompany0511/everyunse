import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Refund() {
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
            <CardTitle className="text-2xl font-bold text-center">환불정책</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3>제1조 (환불정책의 목적)</h3>
            <p>본 환불정책은 EVERYUNSE(에브리운세) 서비스 이용 과정에서 발생할 수 있는 환불 관련 사항을 명확히 하여 이용자의 권익을 보호하고 원활한 서비스 제공을 목적으로 합니다.</p>

            <h3>제2조 (환불 대상 및 기준)</h3>
            <h4>1. 냥(가상화폐) 충전 환불</h4>
            <ul>
              <li><strong>충전 완료 전:</strong> 결제 승인 후 냥이 계정에 반영되기 전까지는 100% 환불 가능</li>
              <li><strong>충전 완료 후 미사용:</strong> 냥 사용 이력이 없는 경우 충전일로부터 7일 이내 100% 환불 가능</li>
              <li><strong>부분 사용:</strong> 사용하지 않은 냥에 대해서만 환불 가능 (최소 환불 단위: 10냥)</li>
            </ul>

            <h4>2. 서비스 이용료 환불</h4>
            <ul>
              <li><strong>기술적 오류:</strong> 시스템 오류로 인해 서비스를 제공받지 못한 경우 100% 환불</li>
              <li><strong>서비스 품질 문제:</strong> 명백한 서비스 품질 문제가 인정되는 경우 부분 또는 전액 환불</li>
              <li><strong>중복 결제:</strong> 동일한 서비스에 대한 중복 결제 시 중복 결제분 100% 환불</li>
            </ul>

            <h3>제3조 (환불 불가 사항)</h3>
            <p>다음의 경우에는 환불이 제한됩니다:</p>
            <ul>
              <li>서비스를 정상적으로 제공받은 후 단순 변심에 의한 환불 요청</li>
              <li>이용자의 귀책사유로 인한 서비스 이용 불가</li>
              <li>무료로 제공된 냥을 사용한 서비스</li>
              <li>환불 요청일로부터 30일이 경과한 건</li>
              <li>이용약관 위반으로 인한 서비스 이용 제한 시</li>
            </ul>

            <h3>제4조 (환불 신청 방법)</h3>
            <p>환불을 원하시는 경우 다음 방법으로 신청하실 수 있습니다:</p>
            <ul>
              <li><strong>이메일:</strong> support@everyunse.com</li>
              <li><strong>고객지원:</strong> 서비스 내 고객지원 메뉴 이용</li>
              <li><strong>필수 제공 정보:</strong>
                <ul>
                  <li>계정 정보 (이메일)</li>
                  <li>결제일시 및 결제금액</li>
                  <li>환불 사유</li>
                  <li>환불받을 계좌정보</li>
                </ul>
              </li>
            </ul>

            <h3>제5조 (환불 처리 절차)</h3>
            <ol>
              <li><strong>환불 신청 접수:</strong> 고객의 환불 신청을 접수합니다.</li>
              <li><strong>환불 사유 검토:</strong> 신청 내용과 이용 이력을 확인하여 환불 가능 여부를 검토합니다.</li>
              <li><strong>환불 승인/거부 통지:</strong> 검토 결과를 신청일로부터 3영업일 이내에 통지합니다.</li>
              <li><strong>환불 처리:</strong> 승인된 경우 통지일로부터 3~5영업일 이내에 환불을 처리합니다.</li>
            </ol>

            <h3>제6조 (환불 방법)</h3>
            <ul>
              <li><strong>신용카드 결제:</strong> 해당 카드사를 통한 결제 취소 (영업일 기준 3-5일 소요)</li>
              <li><strong>계좌이체 결제:</strong> 고객이 제공한 계좌로 직접 환불 (영업일 기준 1-3일 소요)</li>
              <li><strong>간편결제:</strong> 해당 간편결제 업체를 통한 환불 처리</li>
            </ul>

            <h3>제7조 (환불 수수료)</h3>
            <p>다음의 경우를 제외하고는 환불 수수료가 발생하지 않습니다:</p>
            <ul>
              <li>고객의 단순 변심에 의한 환불: 실제 발생한 결제수수료 차감</li>
              <li>부분 환불 시 최소 금액 미달: 환불 불가</li>
            </ul>

            <h3>제8조 (특별 환불 정책)</h3>
            <h4>1. 신규 가입자 혜택</h4>
            <p>신규 가입 시 제공되는 무료 냥은 환불 대상이 아닙니다.</p>

            <h4>2. 프로모션 할인</h4>
            <p>프로모션 할인을 받은 결제건의 경우 실제 결제 금액을 기준으로 환불 처리됩니다.</p>

            <h3>제9조 (분쟁 해결)</h3>
            <p>환불과 관련하여 분쟁이 발생한 경우:</p>
            <ul>
              <li>1차: 고객지원을 통한 협의</li>
              <li>2차: 소비자분쟁조정위원회 조정 신청</li>
              <li>3차: 관할 법원을 통한 해결</li>
            </ul>

            <h3>제10조 (환불정책 변경)</h3>
            <p>본 환불정책은 관련 법령의 변경이나 서비스 정책 변경 시 사전 공지 후 수정될 수 있습니다. 변경된 정책은 공지일로부터 7일 후 효력이 발생합니다.</p>

            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">환불 문의</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                환불과 관련하여 궁금한 사항이 있으시면 언제든지 고객지원팀으로 연락주세요.<br/>
                <strong>이메일:</strong> ejcompany0511@gmail.com<br/>
                <strong>운영시간:</strong> 평일 09:00 - 18:00 (주말 및 공휴일 제외)
              </p>
            </div>

            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                본 환불정책은 2025년 6월 7일부터 시행됩니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}