import { analyzeSaju } from './openai';
import { db } from './db';
import { precomputedAnalyses, users } from '@shared/schema';
import { eq, and, gte } from 'drizzle-orm';

// 미리 계산 가능한 분석 타입
const PRECOMPUTABLE_TYPES = [
  'monthly',
  'love', 
  'career',
  'marriage',
  'comprehensive'
];

class PrecomputedService {
  // 모든 기존 사용자들의 미리 계산된 분석 생성
  async generateForAllExistingUsers(): Promise<void> {
    console.log('🚀 모든 기존 사용자 미리 계산된 분석 생성 시작...');

    try {
      // 개인정보가 등록된 모든 사용자 조회
      const usersWithBirthData = await db
        .select()
        .from(users)
        .where(eq(users.hasPersonalInfo, true));

      console.log(`📊 개인정보 등록된 사용자 ${usersWithBirthData.length}명 발견`);

      // 각 사용자별로 미리 계산된 분석 생성 (백그라운드에서)
      for (const user of usersWithBirthData) {
        this.generateAnalysesForUserBackground(user.id, {
          date: user.birthDate,
          time: user.birthTime,
          gender: user.gender,
          calendarType: user.calendarType || 'solar',
          isLeapMonth: user.isLeapMonth || false,
          birthCountry: 'KR',
          timezone: 'Asia/Seoul'
        });
      }

      console.log('✅ 모든 사용자 미리 계산된 분석 생성 시작됨 (백그라운드 처리)');
    } catch (error) {
      console.error('❌ 기존 사용자 분석 생성 실패:', error);
    }
  }

  // 새 사용자 등록 시 미리 계산된 분석 생성
  async generateForNewUser(userId: string, birthData: any): Promise<void> {
    console.log(`🆕 새 사용자 ${userId} 미리 계산된 분석 생성 시작`);
    
    // 백그라운드에서 비동기 처리
    this.generateAnalysesForUserBackground(userId, birthData);
  }

  // 백그라운드에서 사용자 분석 생성 (비동기)
  private async generateAnalysesForUserBackground(userId: string, birthData: any): Promise<void> {
    setTimeout(async () => {
      try {
        console.log(`🔄 사용자 ${userId} 미리 계산된 분석 생성 중...`);
        
        const promises = PRECOMPUTABLE_TYPES.map(analysisType => 
          this.generateSingleAnalysis(analysisType, userId, birthData)
        );

        await Promise.all(promises);
        console.log(`✅ 사용자 ${userId} 모든 분석 생성 완료 (5개 타입)`);
      } catch (error) {
        console.error(`❌ 사용자 ${userId} 분석 생성 실패:`, error);
      }
    }, 1000); // 1초 후 시작 (서버 부하 분산)
  }

  // 단일 분석 생성 및 저장
  private async generateSingleAnalysis(analysisType: string, userId: string, birthData: any): Promise<void> {
    try {
      console.log(`📊 사용자 ${userId} ${analysisType} 분석 생성 중...`);
      
      const result = await analyzeSaju(birthData, analysisType);
      
      await db.insert(precomputedAnalyses).values({
        userId,
        analysisType,
        birthDataHash: this.hashBirthData(birthData),
        result: JSON.stringify(result),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 유효
      });

      console.log(`✅ 사용자 ${userId} ${analysisType} 분석 저장 완료`);
    } catch (error) {
      console.error(`❌ 사용자 ${userId} ${analysisType} 분석 생성 실패:`, error);
    }
  }

  // 미리 계산된 분석 조회 (사용자별)
  async getPrecomputedAnalysis(analysisType: string, userId?: string): Promise<any> {
    try {
      if (!userId) return null;
      
      const [analysis] = await db
        .select()
        .from(precomputedAnalyses)
        .where(and(
          eq(precomputedAnalyses.userId, userId),
          eq(precomputedAnalyses.analysisType, analysisType),
          gte(precomputedAnalyses.validUntil, new Date())
        ))
        .limit(1);

      if (analysis) {
        return {
          result: JSON.parse(analysis.result),
          createdAt: analysis.createdAt
        };
      }

      return null;
    } catch (error) {
      console.error('미리 계산된 분석 조회 실패:', error);
      return null;
    }
  }

  // 생년월일 데이터 해시 생성
  private hashBirthData(birthData: any): string {
    return `${birthData.date}_${birthData.time}_${birthData.gender}_${birthData.calendarType}`;
  }
}

export const precomputedService = new PrecomputedService();