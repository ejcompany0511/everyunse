import { db } from "./db";
import { 
  users, 
  sajuAnalyses, 
  careerRecommendations, 
  contacts, 
  coachingSessions, 
  coinTransactions, 
  servicePrices, 
  reviews,
  dailyFortunes,
  precomputedAnalyses,
  adminUsers,
  adminLogs,
  userSuspensions,
  userReports,
  inquiries,
  systemNotifications,
  userNotifications,
  salesStats,
  type User, 
  type InsertUser,
  type SajuAnalysis,
  type InsertSajuAnalysis,
  type CareerRecommendation,
  type InsertCareerRecommendation,
  type Contact,
  type InsertContact,
  type CoachingSession,
  type InsertCoachingSession,
  type CoinTransaction,
  type InsertCoinTransaction,
  type ServicePrice,
  type InsertServicePrice,
  type Review,
  type InsertReview,
  type DailyFortune,
  type InsertDailyFortune,
  type PrecomputedAnalysis,
  type InsertPrecomputedAnalysis,
  type AdminUser,
  type InsertAdminUser,
  type AdminLog,
  type InsertAdminLog,
  type UserSuspension,
  type InsertUserSuspension,
  type UserReport,
  type InsertUserReport,
  type Inquiry,
  type InsertInquiry,
  type SystemNotification,
  type InsertSystemNotification,
  type SalesStats,
  type InsertSalesStats,
  type UserNotification,
  type InsertUserNotification,
  type UserReport,
  type InsertUserReport,
  type Inquiry,
  type InsertInquiry
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeServicePrices();
  }

  private async initializeServicePrices() {
    try {
      // Check if service prices already exist
      const existingPrices = await db.select().from(servicePrices).limit(1);
      if (existingPrices.length > 0) {
        return; // Already initialized
      }

      // Initialize service prices - temporarily set to 0냥
      const defaultPrices = [
        {
          serviceType: "saju_analysis",
          coinCost: 0,
          description: "기본 사주 분석",
          isActive: true,
        },
        {
          serviceType: "career_analysis", 
          coinCost: 0,
          description: "직업 운세 분석",
          isActive: true,
        },
        {
          serviceType: "love_analysis",
          coinCost: 0,
          description: "연애 운세 분석", 
          isActive: true,
        },
        {
          serviceType: "compatibility",
          coinCost: 0,
          description: "궁합 분석",
          isActive: true,
        },
        {
          serviceType: "coaching",
          coinCost: 0,
          description: "AI 상담 세션",
          isActive: true,
        },
        {
          serviceType: "monthly_fortune",
          coinCost: 0,
          description: "이번 달 운세",
          isActive: true,
        },
        {
          serviceType: "love_potential",
          coinCost: 0,
          description: "연애할 수 있을까?",
          isActive: true,
        },
        {
          serviceType: "reunion_potential",
          coinCost: 0,
          description: "재회 가능할까요?",
          isActive: true,
        },
        {
          serviceType: "job_prospects",
          coinCost: 0,
          description: "취업이 안되면 어쩌죠?",
          isActive: true,
        },
        {
          serviceType: "marriage_potential",
          coinCost: 0,
          description: "결혼할 수 있을까요?",
          isActive: true,
        },
        {
          serviceType: "comprehensive_fortune",
          coinCost: 0,
          description: "나의 종합 운세",
          isActive: true,
        }
      ];

      await db.insert(servicePrices).values(defaultPrices);
    } catch (error) {
      console.log("Service prices already initialized or error:", error);
    }
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updatedUser || undefined;
  }

  // Saju Analyses
  async getSajuAnalysis(id: number): Promise<SajuAnalysis | undefined> {
    const [analysis] = await db.select().from(sajuAnalyses).where(eq(sajuAnalyses.id, id));
    return analysis || undefined;
  }

  async getSajuAnalysesByUser(userId: number): Promise<SajuAnalysis[]> {
    return await db.select().from(sajuAnalyses).where(eq(sajuAnalyses.userId, userId)).orderBy(desc(sajuAnalyses.createdAt));
  }

  async getAllAnalyses(): Promise<SajuAnalysis[]> {
    return await db.select().from(sajuAnalyses);
  }

  async createSajuAnalysis(analysis: InsertSajuAnalysis): Promise<SajuAnalysis> {
    const [newAnalysis] = await db.insert(sajuAnalyses).values(analysis).returning();
    return newAnalysis;
  }

  // Career Recommendations
  async getCareerRecommendation(id: number): Promise<CareerRecommendation | undefined> {
    const [recommendation] = await db.select().from(careerRecommendations).where(eq(careerRecommendations.id, id));
    return recommendation || undefined;
  }

  async getCareerRecommendationsByUser(userId: number): Promise<CareerRecommendation[]> {
    return await db.select().from(careerRecommendations).where(eq(careerRecommendations.userId, userId)).orderBy(desc(careerRecommendations.createdAt));
  }

  async createCareerRecommendation(recommendation: InsertCareerRecommendation): Promise<CareerRecommendation> {
    const [newRecommendation] = await db.insert(careerRecommendations).values(recommendation).returning();
    return newRecommendation;
  }

  // Contacts
  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact || undefined;
  }

  async getContactsByUser(userId: number): Promise<Contact[]> {
    return await db.select().from(contacts).where(eq(contacts.userId, userId)).orderBy(desc(contacts.createdAt));
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: number, updates: Partial<Contact>): Promise<Contact | undefined> {
    const [updatedContact] = await db.update(contacts).set(updates).where(eq(contacts.id, id)).returning();
    return updatedContact || undefined;
  }

  async deleteContact(id: number): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Coaching Sessions
  async getCoachingSession(id: number): Promise<CoachingSession | undefined> {
    const [session] = await db.select().from(coachingSessions).where(eq(coachingSessions.id, id));
    return session || undefined;
  }

  async getCoachingSessionsByUser(userId: number): Promise<CoachingSession[]> {
    return await db.select().from(coachingSessions).where(eq(coachingSessions.userId, userId)).orderBy(desc(coachingSessions.createdAt));
  }

  async createCoachingSession(session: InsertCoachingSession): Promise<CoachingSession> {
    const [newSession] = await db.insert(coachingSessions).values(session).returning();
    return newSession;
  }

  // Coin System
  async getUserCoinBalance(userId: number): Promise<number> {
    const [user] = await db.select({ coinBalance: users.coinBalance }).from(users).where(eq(users.id, userId));
    return user?.coinBalance || 0;
  }

  async getCoinTransactions(userId: number): Promise<CoinTransaction[]> {
    return await db.select().from(coinTransactions).where(eq(coinTransactions.userId, userId)).orderBy(desc(coinTransactions.createdAt));
  }

  async createCoinTransaction(transaction: InsertCoinTransaction): Promise<CoinTransaction> {
    const [newTransaction] = await db.insert(coinTransactions).values(transaction).returning();
    return newTransaction;
  }

  async updateUserCoinBalance(userId: number, newBalance: number): Promise<void> {
    await db.update(users).set({ coinBalance: newBalance }).where(eq(users.id, userId));
  }

  async spendCoins(userId: number, amount: number, serviceType: string, description: string, referenceId?: number): Promise<boolean> {
    const [user] = await db.select({ coinBalance: users.coinBalance }).from(users).where(eq(users.id, userId));
    if (!user || user.coinBalance < amount) {
      return false;
    }

    const newBalance = user.coinBalance - amount;
    await this.updateUserCoinBalance(userId, newBalance);
    
    await this.createCoinTransaction({
      userId,
      type: "spend",
      amount: -amount,
      balanceAfter: newBalance,
      description,
      serviceType,
      referenceId
    });

    return true;
  }

  async addCoins(userId: number, amount: number, description: string, paymentId?: string): Promise<void> {
    const [user] = await db.select({ coinBalance: users.coinBalance }).from(users).where(eq(users.id, userId));
    const newBalance = (user?.coinBalance || 0) + amount;
    
    await this.updateUserCoinBalance(userId, newBalance);
    
    await this.createCoinTransaction({
      userId,
      type: "charge",
      amount,
      balanceAfter: newBalance,
      description,
      paymentId
    });
  }

  // Service Prices
  async getServicePrices(): Promise<ServicePrice[]> {
    return await db.select().from(servicePrices).orderBy(servicePrices.displayOrder);
  }

  async getServicePrice(serviceType: string): Promise<ServicePrice | undefined> {
    const [price] = await db.select().from(servicePrices).where(eq(servicePrices.serviceType, serviceType));
    return price || undefined;
  }

  async createServicePrice(price: InsertServicePrice): Promise<ServicePrice> {
    const [newPrice] = await db.insert(servicePrices).values(price).returning();
    return newPrice;
  }

  async updateServicePrice(serviceType: string, updates: Partial<ServicePrice>): Promise<ServicePrice | undefined> {
    const [updatedPrice] = await db.update(servicePrices).set(updates).where(eq(servicePrices.serviceType, serviceType)).returning();
    return updatedPrice || undefined;
  }

  // Reviews
  async getReviews(serviceType?: string): Promise<Review[]> {
    let query = db.select().from(reviews)
      .where(eq(reviews.approvalStatus, 'approved')) // Only show approved reviews
      .orderBy(desc(reviews.createdAt));
    
    if (serviceType && serviceType !== 'all') {
      query = query.where(and(
        eq(reviews.serviceType, serviceType),
        eq(reviews.approvalStatus, 'approved')
      ));
    }
    
    return await query;
  }

  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review || undefined;
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  // Daily Fortune Cache
  async getDailyFortune(userId: number, fortuneDate: string): Promise<DailyFortune | undefined> {
    const [fortune] = await db.select().from(dailyFortunes)
      .where(and(eq(dailyFortunes.userId, userId), eq(dailyFortunes.fortuneDate, fortuneDate)));
    return fortune || undefined;
  }

  async createDailyFortune(fortune: InsertDailyFortune): Promise<DailyFortune> {
    const [newFortune] = await db.insert(dailyFortunes).values(fortune).returning();
    return newFortune;
  }

  async deleteTodaysFortune(userId: number): Promise<void> {
    const todayDate = await this.getKoreanToday();
    await db.delete(dailyFortunes)
      .where(
        and(
          eq(dailyFortunes.userId, userId),
          eq(dailyFortunes.fortuneDate, todayDate)
        )
      );
  }

  async getKoreanToday(): Promise<string> {
    // 한국시간 기준 오늘 날짜를 YYYY-MM-DD 형식으로 반환
    const now = new Date();
    const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    return koreanTime.toISOString().split('T')[0];
  }

  // 한국 시간 기준으로 새로운 날이 시작되었는지 확인
  async isNewKoreanDay(lastFortuneDate: string): Promise<boolean> {
    const todayKorean = await this.getKoreanToday();
    return lastFortuneDate !== todayKorean;
  }

  // 오늘의 운세가 이미 생성되었는지 확인 (한국 시간 기준)
  async hasTodaysFortune(userId: number): Promise<{ exists: boolean; fortune?: DailyFortune }> {
    const todayDate = await this.getKoreanToday();
    const fortune = await this.getDailyFortune(userId, todayDate);
    
    return {
      exists: !!fortune,
      fortune: fortune || undefined
    };
  }

  // Dashboard statistics methods
  async getTotalAnalysesCount(): Promise<number> {
    const result = await db.select().from(sajuAnalyses);
    // Start counter from 731 as requested
    return result.length + 731;
  }

  async getUserAnalysesCount(userId: number): Promise<number> {
    const result = await db.select().from(sajuAnalyses).where(eq(sajuAnalyses.userId, userId));
    console.log(`User ${userId} analysis count from DB:`, result.length);
    return result.length;
  }

  async getRecentSajuAnalysesByUser(userId: number, limit: number = 3): Promise<SajuAnalysis[]> {
    return await db.select().from(sajuAnalyses)
      .where(eq(sajuAnalyses.userId, userId))
      .orderBy(desc(sajuAnalyses.createdAt))
      .limit(limit);
  }

  // Customer support methods
  async createReport(report: InsertUserReport): Promise<UserReport> {
    const [newReport] = await db.insert(userReports).values(report).returning();
    return newReport;
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [newInquiry] = await db.insert(inquiries).values(inquiry).returning();
    return newInquiry;
  }

  // Admin system methods (these exist but adding for completeness)
  async getAllUserReports(): Promise<UserReport[]> {
    return await db.select().from(userReports).orderBy(desc(userReports.createdAt));
  }

  async updateUserReport(id: number, updates: Partial<UserReport>): Promise<UserReport | undefined> {
    const [updated] = await db.update(userReports)
      .set(updates)
      .where(eq(userReports.id, id))
      .returning();
    return updated;
  }

  async getAllInquiries(): Promise<Inquiry[]> {
    return await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
  }

  async updateInquiry(id: number, updates: Partial<Inquiry>): Promise<Inquiry | undefined> {
    const [updated] = await db.update(inquiries)
      .set(updates)
      .where(eq(inquiries.id, id))
      .returning();
    return updated;
  }

  // User notification methods
  async getUserNotifications(userId: number): Promise<UserNotification[]> {
    return await db.select().from(userNotifications)
      .where(eq(userNotifications.userId, userId))
      .orderBy(desc(userNotifications.createdAt));
  }

  async createUserNotification(notification: InsertUserNotification): Promise<UserNotification> {
    const [newNotification] = await db.insert(userNotifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(notificationId: number, userId: number): Promise<void> {
    await db.update(userNotifications)
      .set({ isRead: true })
      .where(and(eq(userNotifications.id, notificationId), eq(userNotifications.userId, userId)));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await db.select().from(userNotifications)
      .where(and(eq(userNotifications.userId, userId), eq(userNotifications.isRead, false)));
    return result.length;
  }

  // Precomputed analysis methods
  async createPrecomputedAnalysis(data: InsertPrecomputedAnalysis): Promise<PrecomputedAnalysis> {
    const [analysis] = await db.insert(precomputedAnalyses).values(data).returning();
    return analysis;
  }

  async getPrecomputedAnalysis(analysisType: string): Promise<PrecomputedAnalysis | undefined> {
    const now = new Date();
    const [analysis] = await db.select().from(precomputedAnalyses)
      .where(
        and(
          eq(precomputedAnalyses.analysisType, analysisType),
          eq(precomputedAnalyses.isActive, true),
          gte(precomputedAnalyses.validUntil, now)
        )
      )
      .limit(1);
    return analysis;
  }
}