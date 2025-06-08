import { 
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
  type InsertSalesStats
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Saju Analyses
  getSajuAnalysis(id: number): Promise<SajuAnalysis | undefined>;
  getSajuAnalysesByUser(userId: number): Promise<SajuAnalysis[]>;
  getAllAnalyses(): Promise<SajuAnalysis[]>;
  createSajuAnalysis(analysis: InsertSajuAnalysis): Promise<SajuAnalysis>;
  
  // Career Recommendations
  getCareerRecommendation(id: number): Promise<CareerRecommendation | undefined>;
  getCareerRecommendationsByUser(userId: number): Promise<CareerRecommendation[]>;
  createCareerRecommendation(recommendation: InsertCareerRecommendation): Promise<CareerRecommendation>;
  
  // Contacts
  getContact(id: number): Promise<Contact | undefined>;
  getContactsByUser(userId: number): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, updates: Partial<Contact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  
  // Coaching Sessions
  getCoachingSession(id: number): Promise<CoachingSession | undefined>;
  getCoachingSessionsByUser(userId: number): Promise<CoachingSession[]>;
  createCoachingSession(session: InsertCoachingSession): Promise<CoachingSession>;
  
  // Coin System
  getUserCoinBalance(userId: number): Promise<number>;
  getCoinTransactions(userId: number): Promise<CoinTransaction[]>;
  createCoinTransaction(transaction: InsertCoinTransaction): Promise<CoinTransaction>;
  updateUserCoinBalance(userId: number, newBalance: number): Promise<void>;
  spendCoins(userId: number, amount: number, serviceType: string, description: string, referenceId?: number): Promise<boolean>;
  addCoins(userId: number, amount: number, description: string, paymentId?: string): Promise<void>;
  
  // Service Prices
  getServicePrices(): Promise<ServicePrice[]>;
  getServicePrice(serviceType: string): Promise<ServicePrice | undefined>;
  createServicePrice(price: InsertServicePrice): Promise<ServicePrice>;
  updateServicePrice(serviceType: string, updates: Partial<ServicePrice>): Promise<ServicePrice | undefined>;
  
  // Reviews
  getReviews(serviceType?: string): Promise<Review[]>;
  getReview(id: number): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  updateReviewApproval(id: number, approvalStatus: string): Promise<Review | undefined>;
  deleteReview(id: number): Promise<boolean>;
  
  // Daily Fortune Cache
  getDailyFortune(userId: number, fortuneDate: string): Promise<DailyFortune | undefined>;
  createDailyFortune(fortune: InsertDailyFortune): Promise<DailyFortune>;
  deleteTodaysFortune(userId: number): Promise<void>;
  getKoreanToday(): string;
  
  // Dashboard Statistics
  getTotalAnalysesCount(): Promise<number>;
  getUserAnalysesCount(userId: number): Promise<number>;
  getRecentSajuAnalysesByUser(userId: number, limit?: number): Promise<SajuAnalysis[]>;

  // Admin system methods
  getAdminUser(id: number): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  createAdminUser(admin: InsertAdminUser): Promise<AdminUser>;
  updateAdminUser(id: number, updates: Partial<AdminUser>): Promise<AdminUser | undefined>;
  getAllAdminUsers(): Promise<AdminUser[]>;
  
  createAdminLog(log: InsertAdminLog): Promise<AdminLog>;
  getAdminLogsByAdmin(adminId: number): Promise<AdminLog[]>;
  getAllAdminLogs(limit?: number): Promise<AdminLog[]>;
  
  suspendUser(suspension: InsertUserSuspension): Promise<UserSuspension>;
  getUserSuspensions(userId: number): Promise<UserSuspension[]>;
  getAllSuspensions(): Promise<UserSuspension[]>;
  
  createUserReport(report: InsertUserReport): Promise<UserReport>;
  createReport(report: InsertUserReport): Promise<UserReport>;
  getAllUserReports(): Promise<UserReport[]>;
  updateUserReport(id: number, updates: Partial<UserReport>): Promise<UserReport | undefined>;
  
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  getAllInquiries(): Promise<Inquiry[]>;
  updateInquiry(id: number, updates: Partial<Inquiry>): Promise<Inquiry | undefined>;
  
  createSystemNotification(notification: InsertSystemNotification): Promise<SystemNotification>;
  getAllSystemNotifications(): Promise<SystemNotification[]>;
  updateSystemNotification(id: number, updates: Partial<SystemNotification>): Promise<SystemNotification | undefined>;
  
  createSalesStats(stats: InsertSalesStats): Promise<SalesStats>;
  getSalesStats(startDate: string, endDate: string): Promise<SalesStats[]>;
  
  getDashboardStats(): Promise<{
    totalUsers: number;
    totalRevenue: number;
    totalAnalyses: number;
    activeUsers: number;
    newUsersToday: number;
    pendingReports: number;
    pendingInquiries: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private sajuAnalyses: Map<number, SajuAnalysis> = new Map();
  private careerRecommendations: Map<number, CareerRecommendation> = new Map();
  private contacts: Map<number, Contact> = new Map();
  private coachingSessions: Map<number, CoachingSession> = new Map();
  private coinTransactions: Map<number, CoinTransaction> = new Map();
  private servicePrices: Map<string, ServicePrice> = new Map();
  private reviews: Map<number, Review> = new Map();

  private currentUserId = 1;
  private currentAnalysisId = 1;
  private currentRecommendationId = 1;
  private currentContactId = 1;
  private currentSessionId = 1;
  private currentTransactionId = 1;
  private currentServicePriceId = 1;
  private currentReviewId = 1;

  constructor() {
    // Create demo user
    const demoUser: User = {
      id: 1,
      username: "demo",
      email: "demo@sajumin.com",
      password: "demo123",
      name: "Demo User",
      birthDate: null,
      birthTime: null,
      gender: null,
      analysisCount: 0,
      coinBalance: 100,
      createdAt: new Date(),
    };
    this.users.set(1, demoUser);
    this.currentUserId = 2;
    
    // 서비스 가격 초기화
    this.initializeServicePrices();
    
    // 데모 후기 데이터 초기화
    this.initializeReviews();
  }

  private initializeServicePrices() {
    const servicePrices: ServicePrice[] = [
      {
        id: 1,
        serviceType: "saju_analysis",
        coinCost: 10,
        description: "기본 사주 분석",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        serviceType: "career_analysis",
        coinCost: 15,
        description: "직업 운세 분석",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        serviceType: "love_analysis",
        coinCost: 12,
        description: "연애 운세 분석",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        serviceType: "compatibility",
        coinCost: 20,
        description: "궁합 분석",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        serviceType: "coaching",
        coinCost: 25,
        description: "AI 상담 세션",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    servicePrices.forEach(price => {
      this.servicePrices.set(price.serviceType, price);
    });
    this.currentServicePriceId = 6;
  }

  private initializeReviews() {
    const demoReviews: Review[] = [
      {
        id: 1,
        userId: 1,
        username: "김영희",
        serviceType: "saju_analysis",
        rating: 5,
        title: "정말 정확한 사주 분석",
        content: "AI가 제공한 사주 분석이 놀랍도록 정확했습니다. 특히 성격 분석 부분이 제 모습과 정말 잘 맞아떨어져서 깜짝 놀랐어요. 앞으로도 중요한 결정을 내릴 때 참고하겠습니다.",
        isHelpful: true,
        helpfulCount: 12,
        approvalStatus: "approved",
        createdAt: new Date('2024-11-15'),
      },
      {
        id: 2,
        userId: 1,
        username: "박민수",
        serviceType: "career_analysis",
        rating: 4,
        title: "진로 방향에 도움이 됐어요",
        content: "현재 직업 고민이 많았는데, 사주를 통한 진로 분석이 새로운 관점을 제공해줬습니다. 추천해주신 직업 분야를 한번 알아보려고 합니다.",
        isHelpful: true,
        helpfulCount: 8,
        approvalStatus: "pending",
        createdAt: new Date('2024-11-20'),
      },
      {
        id: 3,
        userId: 1,
        username: "이수정",
        serviceType: "love_analysis",
        rating: 5,
        title: "연애운 분석 만족합니다",
        content: "연애에서 늘 실패만 했는데, 제 사주의 연애 패턴을 알게 되니까 이해가 되네요. 조언해주신 내용 참고해서 좀 더 신중하게 접근해보겠습니다.",
        isHelpful: false,
        helpfulCount: 15,
        approvalStatus: "approved",
        createdAt: new Date('2024-11-25'),
      },
      {
        id: 4,
        userId: 1,
        username: "최준호",
        serviceType: "wealth_analysis",
        rating: 4,
        title: "재운 분석 흥미로웠어요",
        content: "투자를 시작하기 전에 재운을 봐달라고 했는데, 생각보다 자세한 분석을 해주셔서 놀랐습니다. 특히 주의해야 할 시기를 알려주신 게 도움됐어요.",
        isHelpful: true,
        helpfulCount: 6,
        approvalStatus: "pending",
        createdAt: new Date('2024-12-01'),
      },
      {
        id: 5,
        userId: 1,
        username: "정미영",
        serviceType: "compatibility",
        rating: 5,
        title: "궁합 분석 정말 좋아요",
        content: "남자친구와의 궁합을 봤는데, 서로의 장단점과 조화로운 관계를 만드는 방법을 구체적으로 알려주셔서 좋았습니다. 실제로 적용해보니 관계가 더 좋아졌어요!",
        isHelpful: true,
        helpfulCount: 20,
        approvalStatus: "approved",
        createdAt: new Date('2024-12-05'),
      },
      {
        id: 6,
        userId: 1,
        username: "김태현",
        serviceType: "health_analysis",
        rating: 3,
        title: "건강운 참고용으로는 좋네요",
        content: "건강에 대한 전반적인 운세를 봤는데, 참고할 만한 내용들이 있었습니다. 물론 의학적 진단은 아니지만 생활 습관 개선에 도움이 될 것 같아요.",
        isHelpful: false,
        helpfulCount: 4,
        approvalStatus: "rejected",
        createdAt: new Date('2024-12-08'),
      },
      {
        id: 7,
        userId: 1,
        username: "한소영",
        serviceType: "saju_analysis",
        rating: 5,
        title: "AI 분석 수준이 높아요",
        content: "다른 곳에서도 사주를 본 적이 있는데, 여기 AI 분석이 오히려 더 구체적이고 실용적인 조언을 해주는 것 같아요. 특히 올해 운세 부분이 정말 맞더라고요.",
        isHelpful: true,
        helpfulCount: 18,
        approvalStatus: "approved",
        createdAt: new Date('2024-12-10'),
      },
      {
        id: 8,
        userId: 1,
        username: "윤상우",
        serviceType: "career_analysis",
        rating: 4,
        title: "직업 추천이 의외였어요",
        content: "제가 생각해보지 못했던 직업을 추천해주시더라고요. 찾아보니까 제 성향과 잘 맞을 것 같은 분야였습니다. 새로운 가능성을 발견한 기분이에요.",
        isHelpful: true,
        helpfulCount: 9,
        approvalStatus: "pending",
        createdAt: new Date('2024-12-12'),
      },
      {
        id: 9,
        userId: 2,
        username: "강지연",
        serviceType: "monthly_fortune",
        rating: 5,
        title: "이번 달 운세 정말 맞았어요",
        content: "12월 운세를 봤는데 정말 정확했습니다. 특히 연말에 좋은 일이 생긴다고 했는데 정말로 승진 소식을 들었어요! 앞으로도 매달 이용할 예정입니다.",
        isHelpful: true,
        helpfulCount: 3,
        approvalStatus: "approved",
        createdAt: new Date('2024-12-15'),
      },
      {
        id: 10,
        userId: 3,
        username: "송민재",
        serviceType: "love_potential",
        rating: 4,
        title: "연애 가능성에 대해 솔직한 조언",
        content: "올해 연애할 수 있을지 궁금해서 봤는데, 솔직하고 현실적인 조언을 해주셔서 좋았습니다. 제가 개선해야 할 부분도 구체적으로 알려주셨어요.",
        isHelpful: true,
        helpfulCount: 7,
        approvalStatus: "approved",
        createdAt: new Date('2024-12-16'),
      },
      {
        id: 11,
        userId: 2,
        username: "이서현",
        serviceType: "재회_가능성",
        rating: 3,
        title: "재회 가능성 분석이 도움됐어요",
        content: "전 연인과의 재회 가능성을 물어봤는데, 객관적인 시각에서 분석해주셔서 감정적으로만 생각하던 제게 도움이 됐습니다. 좀 더 이성적으로 판단할 수 있게 됐어요.",
        isHelpful: false,
        helpfulCount: 2,
        approvalStatus: "rejected",
        createdAt: new Date('2024-12-17'),
      },
      {
        id: 12,
        userId: 3,
        username: "박준영",
        serviceType: "compatibility",
        rating: 5,
        title: "궁합 분석 매우 만족합니다",
        content: "여자친구와 궁합을 봤는데 정말 자세하고 정확한 분석이었습니다. 서로의 성격 차이를 이해하게 되었고, 더 좋은 관계를 만들어가는 방법을 배웠어요.",
        isHelpful: true,
        helpfulCount: 11,
        approvalStatus: "approved",
        createdAt: new Date('2024-12-18'),
      },
      {
        id: 13,
        userId: 1,
        username: "최은진",
        serviceType: "job_concern",
        rating: 4,
        title: "취업 고민 해결에 도움됐어요",
        content: "취업이 안 되어서 고민이 많았는데, 제 사주를 통해 어떤 분야가 잘 맞는지, 언제쯤 기회가 올지 알려주셔서 마음이 좀 편해졌습니다.",
        isHelpful: true,
        helpfulCount: 5,
        approvalStatus: "pending",
        createdAt: new Date('2024-12-19'),
      },
      {
        id: 14,
        userId: 2,
        username: "김도현",
        serviceType: "marriage_potential",
        rating: 5,
        title: "결혼 시기 분석이 정확했어요",
        content: "결혼할 수 있을지, 언제쯤 할 수 있을지 궁금해서 봤는데 정말 구체적인 조언을 받았습니다. 특히 상대방의 특징까지 알려주셔서 놀랐어요.",
        isHelpful: true,
        helpfulCount: 8,
        approvalStatus: "approved",
        createdAt: new Date('2024-12-20'),
      },
      {
        id: 15,
        userId: 3,
        username: "정수빈",
        serviceType: "comprehensive_fortune",
        rating: 5,
        title: "종합 운세 정말 상세해요",
        content: "전반적인 운세를 종합적으로 봤는데 정말 만족스럽습니다. 연애, 직업, 건강, 재물운까지 모든 영역을 다 분석해주셔서 올 한 해 계획 세우는데 큰 도움이 됐어요.",
        isHelpful: true,
        helpfulCount: 14,
        approvalStatus: "approved",
        createdAt: new Date('2024-12-21'),
      }
    ];

    demoReviews.forEach(review => {
      this.reviews.set(review.id, review);
    });
    this.currentReviewId = 16;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.currentUserId++,
      ...insertUser,
      birthDate: insertUser.birthDate || null,
      birthTime: insertUser.birthTime || null,
      gender: insertUser.gender || null,
      analysisCount: 0,
      coinBalance: 50, // 신규 가입 시 50코인 지급
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getSajuAnalysis(id: number): Promise<SajuAnalysis | undefined> {
    return this.sajuAnalyses.get(id);
  }

  async getSajuAnalysesByUser(userId: number): Promise<SajuAnalysis[]> {
    return Array.from(this.sajuAnalyses.values()).filter(analysis => analysis.userId === userId);
  }

  async getAllAnalyses(): Promise<SajuAnalysis[]> {
    return Array.from(this.sajuAnalyses.values());
  }

  async createSajuAnalysis(insertAnalysis: InsertSajuAnalysis): Promise<SajuAnalysis> {
    const analysis: SajuAnalysis = {
      id: this.currentAnalysisId++,
      ...insertAnalysis,
      createdAt: new Date(),
    };
    this.sajuAnalyses.set(analysis.id, analysis);
    return analysis;
  }

  async getCareerRecommendation(id: number): Promise<CareerRecommendation | undefined> {
    return this.careerRecommendations.get(id);
  }

  async getCareerRecommendationsByUser(userId: number): Promise<CareerRecommendation[]> {
    return Array.from(this.careerRecommendations.values()).filter(rec => rec.userId === userId);
  }

  async createCareerRecommendation(insertRecommendation: InsertCareerRecommendation): Promise<CareerRecommendation> {
    const recommendation: CareerRecommendation = {
      id: this.currentRecommendationId++,
      ...insertRecommendation,
      createdAt: new Date(),
    };
    this.careerRecommendations.set(recommendation.id, recommendation);
    return recommendation;
  }

  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async getContactsByUser(userId: number): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(contact => contact.userId === userId);
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const contact: Contact = {
      id: this.currentContactId++,
      ...insertContact,
      createdAt: new Date(),
    };
    this.contacts.set(contact.id, contact);
    return contact;
  }

  async updateContact(id: number, updates: Partial<Contact>): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    if (!contact) return undefined;
    
    const updatedContact = { ...contact, ...updates };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteContact(id: number): Promise<boolean> {
    return this.contacts.delete(id);
  }

  async getCoachingSession(id: number): Promise<CoachingSession | undefined> {
    return this.coachingSessions.get(id);
  }

  async getCoachingSessionsByUser(userId: number): Promise<CoachingSession[]> {
    return Array.from(this.coachingSessions.values()).filter(session => session.userId === userId);
  }

  async createCoachingSession(insertSession: InsertCoachingSession): Promise<CoachingSession> {
    const session: CoachingSession = {
      id: this.currentSessionId++,
      ...insertSession,
      status: "completed",
      createdAt: new Date(),
    };
    this.coachingSessions.set(session.id, session);
    return session;
  }

  // 코인 시스템 메서드들
  async getUserCoinBalance(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    return user?.coinBalance || 0;
  }

  async getCoinTransactions(userId: number): Promise<CoinTransaction[]> {
    return Array.from(this.coinTransactions.values()).filter(tx => tx.userId === userId);
  }

  async createCoinTransaction(insertTransaction: InsertCoinTransaction): Promise<CoinTransaction> {
    const transaction: CoinTransaction = {
      id: this.currentTransactionId++,
      ...insertTransaction,
      serviceType: insertTransaction.serviceType || null,
      referenceId: insertTransaction.referenceId || null,
      paymentId: insertTransaction.paymentId || null,
      createdAt: new Date(),
    };
    this.coinTransactions.set(transaction.id, transaction);
    return transaction;
  }

  async updateUserCoinBalance(userId: number, newBalance: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.coinBalance = newBalance;
      this.users.set(userId, user);
    }
  }

  async spendCoins(userId: number, amount: number, serviceType: string, description: string, referenceId?: number): Promise<boolean> {
    const currentBalance = await this.getUserCoinBalance(userId);
    
    if (currentBalance < amount) {
      return false; // 잔액 부족
    }

    const newBalance = currentBalance - amount;
    await this.updateUserCoinBalance(userId, newBalance);

    // 거래 내역 기록
    await this.createCoinTransaction({
      userId,
      type: "spend",
      amount: -amount,
      balanceAfter: newBalance,
      description,
      serviceType,
      referenceId,
    });

    return true;
  }

  async addCoins(userId: number, amount: number, description: string, paymentId?: string): Promise<void> {
    const currentBalance = await this.getUserCoinBalance(userId);
    const newBalance = currentBalance + amount;
    
    await this.updateUserCoinBalance(userId, newBalance);

    // 거래 내역 기록
    await this.createCoinTransaction({
      userId,
      type: "charge",
      amount,
      balanceAfter: newBalance,
      description,
      paymentId,
    });
  }

  // 서비스 가격 관련 메서드들
  async getServicePrices(): Promise<ServicePrice[]> {
    return Array.from(this.servicePrices.values()).filter(price => price.isActive);
  }

  async getServicePrice(serviceType: string): Promise<ServicePrice | undefined> {
    return this.servicePrices.get(serviceType);
  }

  async createServicePrice(insertPrice: InsertServicePrice): Promise<ServicePrice> {
    const price: ServicePrice = {
      id: this.currentServicePriceId++,
      ...insertPrice,
      isActive: insertPrice.isActive !== undefined ? insertPrice.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.servicePrices.set(price.serviceType, price);
    return price;
  }

  async updateServicePrice(serviceType: string, updates: Partial<ServicePrice>): Promise<ServicePrice | undefined> {
    const price = this.servicePrices.get(serviceType);
    if (price) {
      const updatedPrice = { ...price, ...updates, updatedAt: new Date() };
      this.servicePrices.set(serviceType, updatedPrice);
      return updatedPrice;
    }
    return undefined;
  }

  // Reviews
  async getReviews(serviceType?: string): Promise<Review[]> {
    const allReviews = Array.from(this.reviews.values())
      .filter(review => review.approvalStatus === 'approved'); // Only show approved reviews
    
    if (serviceType) {
      return allReviews.filter(review => review.serviceType === serviceType);
    }
    return allReviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const review: Review = {
      id: this.currentReviewId++,
      ...insertReview,
      isHelpful: false,
      helpfulCount: 0,
      approvalStatus: "pending",
      createdAt: new Date(),
    };
    this.reviews.set(review.id, review);
    return review;
  }

  async updateReviewApproval(id: number, approvalStatus: string): Promise<Review | undefined> {
    const review = this.reviews.get(id);
    if (review) {
      const updatedReview = { ...review, approvalStatus };
      this.reviews.set(id, updatedReview);
      return updatedReview;
    }
    return undefined;
  }

  async deleteReview(id: number): Promise<boolean> {
    return this.reviews.delete(id);
  }

  // Daily Fortune methods
  private dailyFortunes: Map<string, DailyFortune> = new Map();
  private currentFortuneId = 1;

  async getDailyFortune(userId: number, fortuneDate: string): Promise<DailyFortune | undefined> {
    const key = `${userId}-${fortuneDate}`;
    return this.dailyFortunes.get(key);
  }

  async createDailyFortune(fortune: InsertDailyFortune): Promise<DailyFortune> {
    const newFortune: DailyFortune = {
      id: this.currentFortuneId++,
      ...fortune,
      createdAt: new Date(),
    };
    const key = `${fortune.userId}-${fortune.fortuneDate}`;
    this.dailyFortunes.set(key, newFortune);
    return newFortune;
  }

  async deleteTodaysFortune(userId: number): Promise<void> {
    const todayDate = this.getKoreanToday();
    const key = `${userId}-${todayDate}`;
    this.dailyFortunes.delete(key);
  }

  getKoreanToday(): string {
    const now = new Date();
    const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    return koreanTime.toISOString().split('T')[0];
  }

  // Dashboard Statistics methods
  async getTotalAnalysesCount(): Promise<number> {
    return this.sajuAnalyses.size;
  }

  async getUserAnalysesCount(userId: number): Promise<number> {
    return Array.from(this.sajuAnalyses.values()).filter(analysis => analysis.userId === userId).length;
  }

  async getRecentSajuAnalysesByUser(userId: number, limit: number = 3): Promise<SajuAnalysis[]> {
    return Array.from(this.sajuAnalyses.values())
      .filter(analysis => analysis.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Helper methods for migration
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllServicePrices(): Promise<ServicePrice[]> {
    return Array.from(this.servicePrices.values());
  }

  async getAllReviews(): Promise<Review[]> {
    return Array.from(this.reviews.values());
  }

  async getAllTransactions(): Promise<CoinTransaction[]> {
    return Array.from(this.coinTransactions.values());
  }

  async getAllAdminUsers(): Promise<AdminUser[]> {
    // Return empty array since no admin users in MemStorage
    return [];
  }

  async getAllDailyFortunes(): Promise<DailyFortune[]> {
    return Array.from(this.dailyFortunes.values());
  }
}

import { DatabaseStorage } from "./db-storage";

export const storage = new DatabaseStorage();