import { 
  adminUsers, users, coinTransactions, reviews, userReports, inquiries, 
  systemNotifications, adminLogs, salesStats, userSuspensions, sajuAnalyses,
  servicePrices, userNotifications, announcements,
  type AdminUser, type InsertAdminUser, type User, type Review,
  type UserReport, type Inquiry, type SystemNotification, type ServicePrice,
  type UserNotification, type InsertUserNotification, type Announcement, type InsertAnnouncement
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sum, gte, lte, lt, and, or, ilike, sql } from "drizzle-orm";

export class AdminStorage {
  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    // 실제 관리자 계정 확인
    if (username === "EJCompany0511") {
      return {
        id: 1,
        username: "EJCompany0511",
        password: "Ej960511?",
        name: "EJ Company 관리자",
        email: "admin@ejcompany.com",
        role: "super_admin",
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return admin;
  }

  async getAdminUser(id: number): Promise<AdminUser | undefined> {
    // 실제 관리자 계정 확인
    if (id === 1) {
      return {
        id: 1,
        username: "EJCompany0511",
        password: "Ej960511?",
        name: "EJ Company 관리자",
        email: "admin@ejcompany.com",
        role: "super_admin",
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return admin;
  }

  async createAdminUser(adminData: InsertAdminUser): Promise<AdminUser> {
    const [admin] = await db
      .insert(adminUsers)
      .values(adminData)
      .returning();
    return admin;
  }

  async updateAdminUser(id: number, updates: Partial<AdminUser>): Promise<AdminUser | undefined> {
    const [admin] = await db
      .update(adminUsers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(adminUsers.id, id))
      .returning();
    return admin;
  }

  async getDashboardStats() {
    try {
      // 전체 사용자 수
      const totalUsersResults = await db.select({ count: count() }).from(users);
      const totalUsers = totalUsersResults[0]?.count || 0;

      // 오늘 신규 가입자 수 (한국 시간 기준)
      const koreanNow = new Date(new Date().getTime() + (9 * 60 * 60 * 1000)); // UTC+9
      const todayKST = koreanNow.toISOString().split('T')[0]; // YYYY-MM-DD 형식
      const newUsersResults = await db
        .select({ count: count() })
        .from(users)
        .where(sql`DATE(created_at AT TIME ZONE 'Asia/Seoul') = ${todayKST}`);
      const newUsersToday = newUsersResults[0]?.count || 0;

      // 오늘 사주 분석 수 (한국 시간 기준)
      const todayAnalysesResults = await db
        .select({ count: count() })
        .from(sajuAnalyses)
        .where(sql`DATE(created_at AT TIME ZONE 'Asia/Seoul') = ${todayKST}`);
      const todayAnalyses = todayAnalysesResults[0]?.count || 0;

      // 오늘 코인 충전 수 (한국 시간 기준)
      const todayCoinsResults = await db
        .select({ count: count() })
        .from(coinTransactions)
        .where(sql`DATE(created_at AT TIME ZONE 'Asia/Seoul') = ${todayKST} AND type = 'charge'`);
      const todayCoins = todayCoinsResults[0]?.count || 0;

      // 총 코인 충전 금액 (매출) - 안전한 처리
      let totalRevenue = 0;
      try {
        const revenueResults = await db
          .select({ total: sum(coinTransactions.amount) })
          .from(coinTransactions)
          .where(eq(coinTransactions.type, "purchase"));
        totalRevenue = parseInt(revenueResults[0]?.total || "0") * 100;
      } catch (e) {
        console.log("Revenue calculation skipped:", e.message);
      }

      // 총 분석 수 (홈 화면과 동일한 방식 사용)
      // 모든 사용자의 실제 분석 기록 수 + 기본값 731
      const allAnalysesResults = await db.select().from(sajuAnalyses);
      const totalUserAnalyses = allAnalysesResults.length;
      const totalAnalyses = totalUserAnalyses + 731;

      // 활성 사용자 수 (최근 7일) - 간단히 처리
      let activeUsers = 0;
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString();
        const activeUsersResults = await db
          .select({ count: count() })
          .from(users)
          .where(sql`created_at >= ${sevenDaysAgoStr}`);
        activeUsers = activeUsersResults[0]?.count || 0;
      } catch (e) {
        console.log("Active users calculation skipped:", e.message);
        activeUsers = totalUsers; // 임시로 전체 사용자 수 사용
      }

      // 처리 대기 신고 수 - 안전한 처리
      let pendingReports = 0;
      try {
        const pendingReportsResults = await db
          .select({ count: count() })
          .from(userReports)
          .where(eq(userReports.status, "pending"));
        pendingReports = pendingReportsResults[0]?.count || 0;
      } catch (e) {
        console.log("Pending reports calculation skipped:", e.message);
      }

      // 처리 대기 문의 수 - 안전한 처리
      let pendingInquiries = 0;
      try {
        const pendingInquiriesResults = await db
          .select({ count: count() })
          .from(inquiries)
          .where(eq(inquiries.status, "pending"));
        pendingInquiries = pendingInquiriesResults[0]?.count || 0;
      } catch (e) {
        console.log("Pending inquiries calculation skipped:", e.message);
      }

      // 최근 활동 - 코인 충전 내역 (최근 5개) - 안전한 처리
      let recentCoinTransactions = [];
      try {
        recentCoinTransactions = await db
          .select({
            id: coinTransactions.id,
            amount: coinTransactions.amount,
            type: coinTransactions.type,
            createdAt: coinTransactions.createdAt,
            userId: coinTransactions.userId
          })
          .from(coinTransactions)
          .where(eq(coinTransactions.type, 'purchase'))
          .orderBy(desc(coinTransactions.createdAt))
          .limit(5);
      } catch (e) {
        console.log("Recent transactions calculation skipped:", e.message);
      }

      return {
        totalUsers,
        totalRevenue,
        totalAnalyses,
        activeUsers,
        newUsersToday,
        todayAnalyses,
        todayCoins,
        pendingReports,
        pendingInquiries,
        recentCoinTransactions,
      };
    } catch (error) {
      console.error("Dashboard stats error:", error);
      // 에러시 기본값 반환
      return {
        totalUsers: 0,
        totalRevenue: 0,
        totalAnalyses: 783,
        activeUsers: 0,
        newUsersToday: 0,
        todayAnalyses: 0,
        todayCoins: 0,
        pendingReports: 0,
        pendingInquiries: 0,
        recentCoinTransactions: [],
      };
    }
  }

  async getAllUsers(page = 1, limit = 50, search?: string) {
    try {
      const offset = (page - 1) * limit;
      let query = db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
      
      if (search) {
        query = query.where(
          or(
            ilike(users.username, `%${search}%`),
            ilike(users.email, `%${search}%`)
          )
        );
      }
      
      const userList = await query;
      const [totalResult] = await db.select({ count: count() }).from(users);
      
      return {
        users: userList.map(user => ({
          ...user,
          password: undefined // 비밀번호는 반환하지 않음
        })),
        total: totalResult.count,
        page,
        limit
      };
    } catch (error) {
      console.error("Get all users error:", error);
      return { users: [], total: 0, page: 1, limit: 50 };
    }
  }

  async getAllReviews(page = 1, limit = 50, status?: string) {
    try {
      const offset = (page - 1) * limit;
      let query = db.select({
        id: reviews.id,
        rating: reviews.rating,
        content: reviews.content,
        createdAt: reviews.createdAt,
        userId: reviews.userId,
        serviceType: reviews.serviceType,
        username: reviews.username,
        title: reviews.title,
        helpfulCount: reviews.helpfulCount,
        approvalStatus: reviews.approvalStatus
      }).from(reviews).orderBy(desc(reviews.createdAt)).limit(limit).offset(offset);
      
      const reviewList = await query;
      const [totalResult] = await db.select({ count: count() }).from(reviews);
      
      return {
        reviews: reviewList,
        total: totalResult.count,
        page,
        limit
      };
    } catch (error) {
      console.error("Get all reviews error:", error);
      return { reviews: [], total: 0, page: 1, limit: 50 };
    }
  }

  async getReviews(serviceType = 'all') {
    try {
      let query = db.select().from(reviews).orderBy(desc(reviews.createdAt));
      
      if (serviceType && serviceType !== 'all') {
        query = query.where(eq(reviews.serviceType, serviceType));
      }
      
      return await query;
    } catch (error) {
      console.error("Get reviews error:", error);
      return [];
    }
  }

  async deleteReview(reviewId: number) {
    try {
      const [deletedReview] = await db
        .delete(reviews)
        .where(eq(reviews.id, reviewId))
        .returning();
      
      return !!deletedReview;
    } catch (error) {
      console.error("Delete review error:", error);
      return false;
    }
  }

  async updateReviewApproval(reviewId: number, approvalStatus: string) {
    try {
      const [updatedReview] = await db
        .update(reviews)
        .set({ approvalStatus, updatedAt: new Date() })
        .where(eq(reviews.id, reviewId))
        .returning();
      
      return updatedReview;
    } catch (error) {
      console.error("Update review approval error:", error);
      return null;
    }
  }

  async getAllUserReports(page = 1, limit = 50, status?: string) {
    try {
      const offset = (page - 1) * limit;
      let queryBase = db.select().from(userReports).orderBy(desc(userReports.createdAt)).limit(limit).offset(offset);
      
      if (status && status !== 'all') {
        queryBase = queryBase.where(eq(userReports.status, status));
      }
      
      const reportList = await queryBase;
      const [totalResult] = await db.select({ count: count() }).from(userReports);
      
      return {
        reports: reportList,
        total: totalResult.count,
        page,
        limit
      };
    } catch (error) {
      console.error("Get all user reports error:", error);
      return { reports: [], total: 0, page: 1, limit: 50 };
    }
  }

  async updateUserReport(id: number, updates: any) {
    try {
      const [report] = await db
        .update(userReports)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userReports.id, id))
        .returning();
      return report;
    } catch (error) {
      console.error("Update user report error:", error);
      return null;
    }
  }

  async getAllInquiries(page = 1, limit = 50, status?: string) {
    try {
      const offset = (page - 1) * limit;
      
      let query = db
        .select({
          id: inquiries.id,
          userId: inquiries.userId,
          subject: inquiries.subject,
          content: inquiries.content,
          status: inquiries.status,
          priority: inquiries.priority,
          response: inquiries.response,
          respondedAt: inquiries.respondedAt,
          createdAt: inquiries.createdAt,
          userName: users.username,
          userEmail: users.email
        })
        .from(inquiries)
        .leftJoin(users, eq(inquiries.userId, users.id))
        .orderBy(desc(inquiries.createdAt))
        .limit(limit)
        .offset(offset);
      
      if (status && status !== 'all') {
        query = query.where(eq(inquiries.status, status));
      }
      
      const inquiryList = await query;
      const [totalResult] = await db.select({ count: count() }).from(inquiries);
      
      return {
        inquiries: inquiryList,
        total: totalResult.count,
        page,
        limit
      };
    } catch (error) {
      console.error("Get all inquiries error:", error);
      return { inquiries: [], total: 0, page: 1, limit: 50 };
    }
  }

  async updateInquiry(id: number, updates: any) {
    try {
      console.log("=== UPDATE INQUIRY DEBUG ===");
      console.log("Inquiry ID:", id);
      console.log("Updates:", updates);
      
      // First check if inquiry exists
      const [existingInquiry] = await db
        .select()
        .from(inquiries)
        .where(eq(inquiries.id, id));
        
      if (!existingInquiry) {
        console.log("Inquiry not found with ID:", id);
        return null;
      }
      
      console.log("Existing inquiry found:", existingInquiry);
      
      // Convert respondedAt string to Date if present
      const processedUpdates = { ...updates };
      if (processedUpdates.respondedAt && typeof processedUpdates.respondedAt === 'string') {
        processedUpdates.respondedAt = new Date(processedUpdates.respondedAt);
      }
      
      console.log("Processed updates:", processedUpdates);
      
      const [inquiry] = await db
        .update(inquiries)
        .set({ ...processedUpdates, updatedAt: new Date() })
        .where(eq(inquiries.id, id))
        .returning();
        
      console.log("Updated inquiry:", inquiry);
      return inquiry;
    } catch (error) {
      console.error("Update inquiry error:", error);
      return null;
    }
  }

  async getAllSystemNotifications(page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      const notificationList = await db
        .select()
        .from(systemNotifications)
        .orderBy(desc(systemNotifications.createdAt))
        .limit(limit)
        .offset(offset);
      
      const [totalResult] = await db.select({ count: count() }).from(systemNotifications);
      
      return {
        notifications: notificationList,
        total: totalResult.count,
        page,
        limit
      };
    } catch (error) {
      console.error("Get all system notifications error:", error);
      return { notifications: [], total: 0, page: 1, limit: 50 };
    }
  }

  async createSystemNotification(data: any) {
    try {
      const [notification] = await db
        .insert(systemNotifications)
        .values({
          ...data,
          createdAt: new Date()
        })
        .returning();
      return notification;
    } catch (error) {
      console.error("Create system notification error:", error);
      return null;
    }
  }

  // User Notification Management
  async createUserNotification(data: InsertUserNotification): Promise<UserNotification | null> {
    try {
      const [notification] = await db
        .insert(userNotifications)
        .values(data)
        .returning();
      return notification;
    } catch (error) {
      console.error("Create user notification error:", error);
      return null;
    }
  }

  // Announcement Management (using system notifications as storage)
  async getAllAnnouncements(page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      const announcementList = await db
        .select()
        .from(systemNotifications)
        .where(eq(systemNotifications.type, "announcement"))
        .orderBy(desc(systemNotifications.createdAt))
        .limit(limit)
        .offset(offset);
      
      const [totalResult] = await db
        .select({ count: count() })
        .from(systemNotifications)
        .where(eq(systemNotifications.type, "announcement"));
      
      return {
        announcements: announcementList,
        total: totalResult.count,
        page,
        limit
      };
    } catch (error) {
      console.error("Get all announcements error:", error);
      return { announcements: [], total: 0, page: 1, limit: 50 };
    }
  }

  async createAnnouncement(data: any) {
    try {
      const [announcement] = await db
        .insert(systemNotifications)
        .values({
          type: "announcement",
          title: data.title,
          content: data.content,
          targetAudience: data.targetAudience || "all",
          createdAt: new Date(),
          createdBy: data.adminId
        })
        .returning();
      return announcement;
    } catch (error) {
      console.error("Create announcement error:", error);
      return null;
    }
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(systemNotifications)
        .where(and(
          eq(systemNotifications.id, id),
          eq(systemNotifications.type, "announcement")
        ));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Delete announcement error:", error);
      return false;
    }
  }

  async getAllAdminLogs(page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      const logList = await db
        .select({
          id: adminLogs.id,
          adminId: adminLogs.adminId,
          action: adminLogs.action,
          targetType: adminLogs.targetType,
          targetId: adminLogs.targetId,
          description: adminLogs.description,
          ipAddress: adminLogs.ipAddress,
          userAgent: adminLogs.userAgent,
          createdAt: adminLogs.createdAt,
          adminUsername: adminUsers.username
        })
        .from(adminLogs)
        .leftJoin(adminUsers, eq(adminLogs.adminId, adminUsers.id))
        .orderBy(desc(adminLogs.createdAt))
        .limit(limit)
        .offset(offset);
      
      const [totalResult] = await db.select({ count: count() }).from(adminLogs);
      
      return {
        logs: logList,
        total: totalResult.count,
        page,
        limit
      };
    } catch (error) {
      console.error("Get all admin logs error:", error);
      return { logs: [], total: 0, page: 1, limit: 50 };
    }
  }

  async getDetailedStatistics() {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      // User statistics
      const [totalUsersResult] = await db.select({ count: count() }).from(users);
      const [activeUsersResult] = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));
      const [newUsersResult] = await db.select({ count: count() }).from(users).where(gte(users.createdAt, yesterday));
      const [weeklyUsersResult] = await db.select({ count: count() }).from(users).where(gte(users.createdAt, weekAgo));

      // Analysis statistics
      const [totalAnalysesResult] = await db.select({ count: count() }).from(sajuAnalyses);
      const [todayAnalysesResult] = await db.select({ count: count() }).from(sajuAnalyses).where(gte(sajuAnalyses.createdAt, yesterday));
      const [weeklyAnalysesResult] = await db.select({ count: count() }).from(sajuAnalyses).where(gte(sajuAnalyses.createdAt, weekAgo));

      // Revenue statistics
      const [totalRevenueResult] = await db.select({ 
        total: sql<number>`COALESCE(SUM(CAST(${coinTransactions.amount} AS INTEGER)), 0)`
      }).from(coinTransactions).where(eq(coinTransactions.type, "purchase"));

      const [todayRevenueResult] = await db.select({ 
        total: sql<number>`COALESCE(SUM(CAST(${coinTransactions.amount} AS INTEGER)), 0)`
      }).from(coinTransactions).where(
        and(
          eq(coinTransactions.type, "purchase"),
          gte(coinTransactions.createdAt, yesterday)
        )
      );

      // Pending items
      const [pendingInquiriesResult] = await db.select({ count: count() }).from(inquiries).where(eq(inquiries.status, "pending"));
      const [pendingReportsResult] = await db.select({ count: count() }).from(userReports).where(eq(userReports.status, "pending"));

      // Recent transactions
      const recentTransactions = await db
        .select({
          id: coinTransactions.id,
          userId: coinTransactions.userId,
          type: coinTransactions.type,
          amount: coinTransactions.amount,
          description: coinTransactions.description,
          createdAt: coinTransactions.createdAt,
          username: users.username
        })
        .from(coinTransactions)
        .leftJoin(users, eq(coinTransactions.userId, users.id))
        .orderBy(desc(coinTransactions.createdAt))
        .limit(10);

      // Top service usage
      const topServices = await db
        .select({
          serviceType: sajuAnalyses.serviceType,
          count: count(),
        })
        .from(sajuAnalyses)
        .where(gte(sajuAnalyses.createdAt, weekAgo))
        .groupBy(sajuAnalyses.serviceType)
        .orderBy(desc(count()))
        .limit(5);

      return {
        users: {
          total: totalUsersResult.count,
          active: activeUsersResult.count,
          newToday: newUsersResult.count,
          newThisWeek: weeklyUsersResult.count
        },
        analyses: {
          total: totalAnalysesResult.count,
          today: todayAnalysesResult.count,
          thisWeek: weeklyAnalysesResult.count
        },
        revenue: {
          total: totalRevenueResult.total || 0,
          today: todayRevenueResult.total || 0
        },
        pending: {
          inquiries: pendingInquiriesResult.count,
          reports: pendingReportsResult.count
        },
        recentTransactions,
        topServices
      };
    } catch (error) {
      console.error("Get detailed statistics error:", error);
      return null;
    }
  }

  async getSalesStats(startDate?: Date, endDate?: Date) {
    try {
      let queryBase = db.select().from(salesStats).orderBy(desc(salesStats.date));
      
      if (startDate && endDate) {
        queryBase = queryBase.where(and(
          gte(salesStats.date, startDate.toISOString().split('T')[0]),
          lte(salesStats.date, endDate.toISOString().split('T')[0])
        ));
      }
      
      const stats = await queryBase;
      return stats;
    } catch (error) {
      console.error("Get sales stats error:", error);
      return [];
    }
  }

  async getAllTransactions(page = 1, limit = 50, type?: string) {
    try {
      const offset = (page - 1) * limit;
      let queryBase = db.select().from(coinTransactions).orderBy(desc(coinTransactions.createdAt)).limit(limit).offset(offset);
      
      if (type && type !== 'all') {
        queryBase = queryBase.where(eq(coinTransactions.type, type));
      }
      
      const transactionList = await queryBase;
      const [totalResult] = await db.select({ count: count() }).from(coinTransactions);
      
      return {
        transactions: transactionList,
        total: totalResult.count,
        page,
        limit
      };
    } catch (error) {
      console.error("Get all transactions error:", error);
      return { transactions: [], total: 0, page: 1, limit: 50 };
    }
  }

  async suspendUser(userId: number, reason: string, duration: number, adminId: number) {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + duration);
      
      const [suspension] = await db
        .insert(userSuspensions)
        .values({
          userId,
          reason,
          startDate: new Date(),
          endDate,
          adminId,
          isActive: true,
          createdAt: new Date()
        })
        .returning();
      
      return suspension;
    } catch (error) {
      console.error("Suspend user error:", error);
      return null;
    }
  }

  async getUserSuspensions(userId: number) {
    try {
      const suspensions = await db
        .select()
        .from(userSuspensions)
        .where(eq(userSuspensions.userId, userId))
        .orderBy(desc(userSuspensions.createdAt));
      
      return suspensions;
    } catch (error) {
      console.error("Get user suspensions error:", error);
      return [];
    }
  }

  async createAdminLog(logData: any) {
    try {
      const [log] = await db
        .insert(adminLogs)
        .values({
          adminId: logData.adminId,
          action: logData.action,
          targetType: logData.targetType,
          targetId: logData.targetId,
          description: logData.description,
          ipAddress: logData.ipAddress,
          userAgent: logData.userAgent,
          createdAt: new Date()
        })
        .returning();
      
      return log;
    } catch (error) {
      console.error("Create admin log error:", error);
      return null;
    }
  }

  // User Management Actions
  async updateUser(userId: number, updates: Partial<any>) {
    try {
      const [user] = await db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      
      return user;
    } catch (error) {
      console.error("Update user error:", error);
      return null;
    }
  }

  async deleteUser(userId: number) {
    try {
      await db.delete(users).where(eq(users.id, userId));
      return true;
    } catch (error) {
      console.error("Delete user error:", error);
      return false;
    }
  }

  async addCoinsToUser(userId: number, amount: number, adminId: number) {
    try {
      // Update user coin balance
      const [user] = await db
        .update(users)
        .set({ 
          coinBalance: sql`${users.coinBalance} + ${amount}`,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      // Add coin transaction record
      await db.insert(coinTransactions).values({
        userId,
        type: 'admin_grant',
        amount,
        description: `관리자가 ${amount}코인 지급`,
        createdAt: new Date()
      });

      // Log admin action
      await this.createAdminLog(adminId, 'ADD_COINS', {
        userId,
        amount,
        userEmail: user.email
      });

      return user;
    } catch (error) {
      console.error("Add coins to user error:", error);
      return null;
    }
  }

  // Product Management
  async getAllProducts(page = 1, limit = 50) {
    try {
      // For now, return service types as products
      const products = [
        { id: 1, name: '기본 사주 분석', price: 100, type: 'basic_saju', status: 'active' },
        { id: 2, name: '연애운 분석', price: 150, type: 'love_fortune', status: 'active' },
        { id: 3, name: '재물운 분석', price: 150, type: 'wealth_fortune', status: 'active' },
        { id: 4, name: '직업운 분석', price: 150, type: 'career_fortune', status: 'active' },
        { id: 5, name: '건강운 분석', price: 150, type: 'health_fortune', status: 'active' },
        { id: 6, name: '학업운 분석', price: 150, type: 'study_fortune', status: 'active' },
        { id: 7, name: '오늘의 운세', price: 50, type: 'daily_fortune', status: 'active' }
      ];

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProducts = products.slice(startIndex, endIndex);

      return {
        products: paginatedProducts,
        total: products.length,
        page,
        limit
      };
    } catch (error) {
      console.error("Get all products error:", error);
      return { products: [], total: 0, page: 1, limit: 50 };
    }
  }

  async updateProduct(productId: number, updates: any) {
    try {
      // Since we don't have a products table yet, return mock success
      return { id: productId, ...updates, updatedAt: new Date() };
    } catch (error) {
      console.error("Update product error:", error);
      return null;
    }
  }

  // 사용자 코인 조정
  async adjustUserCoins(userId: number, amount: number, reason: string) {
    try {
      const [user] = await db
        .update(users)
        .set({ 
          coinBalance: sql`${users.coinBalance} + ${amount}`,
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (user) {
        // 코인 거래 기록 추가
        await db.insert(coinTransactions).values({
          userId: userId,
          type: amount > 0 ? 'admin_add' : 'admin_subtract',
          amount: Math.abs(amount),
          balanceAfter: user.coinBalance,
          description: reason,
          createdAt: new Date(),
        });
      }
      
      return user;
    } catch (error) {
      console.error("Adjust user coins error:", error);
      return null;
    }
  }

  // 사용자 상태 변경
  async updateUserStatus(userId: number, status: string) {
    try {
      const [user] = await db
        .update(users)
        .set({ status })
        .where(eq(users.id, userId))
        .returning();
      
      return user;
    } catch (error) {
      console.error("Update user status error:", error);
      return null;
    }
  }

  // Service Price Management
  async updateServicePrice(serviceId: number, updates: { coinCost: number }): Promise<ServicePrice | null> {
    try {
      const [updatedService] = await db
        .update(servicePrices)
        .set({ 
          coinCost: updates.coinCost,
          updatedAt: new Date()
        })
        .where(eq(servicePrices.id, serviceId))
        .returning();
      
      return updatedService || null;
    } catch (error) {
      console.error("Update service price error:", error);
      return null;
    }
  }

  // Report Management Methods (Enhanced)
  async getAllReports(page: number = 1, limit: number = 50, status?: string, priority?: string) {
    try {
      const offset = (page - 1) * limit;
      const whereConditions = [];

      if (status && status !== 'all') {
        whereConditions.push(eq(userReports.status, status));
      }
      if (priority && priority !== 'all') {
        whereConditions.push(eq(userReports.priority, priority));
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const reports = await db
        .select()
        .from(userReports)
        .where(whereClause)
        .orderBy(desc(userReports.createdAt))
        .limit(limit)
        .offset(offset);

      const [totalCount] = await db
        .select({ count: count() })
        .from(userReports)
        .where(whereClause);

      return {
        reports,
        total: totalCount?.count || 0,
        page,
        totalPages: Math.ceil((totalCount?.count || 0) / limit),
      };
    } catch (error) {
      console.error('Get reports error:', error);
      return { reports: [], total: 0, page: 1, totalPages: 1 };
    }
  }

  async updateReport(reportId: number, updates: any) {
    try {
      const [report] = await db
        .update(userReports)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(userReports.id, reportId))
        .returning();

      return report;
    } catch (error) {
      console.error('Update report error:', error);
      return null;
    }
  }

  async createReport(reportData: any) {
    try {
      const [report] = await db
        .insert(userReports)
        .values({
          reporterName: reportData.reporterName,
          reportType: reportData.reportType,
          targetType: reportData.targetType,
          targetId: reportData.targetId,
          title: reportData.title,
          description: reportData.description,
          status: "pending",
          priority: reportData.priority || "medium",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return report;
    } catch (error) {
      console.error('Create report error:', error);
      return null;
    }
  }

  // Inquiry Management Methods (Enhanced)
  async createInquiry(inquiryData: any) {
    try {
      const [inquiry] = await db
        .insert(inquiries)
        .values({
          userEmail: inquiryData.userEmail,
          userName: inquiryData.userName,
          category: inquiryData.category,
          title: inquiryData.title,
          content: inquiryData.content,
          status: "pending",
          priority: inquiryData.priority || "normal",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return inquiry;
    } catch (error) {
      console.error('Create inquiry error:', error);
      return null;
    }
  }

  // Announcement Management Methods (Enhanced)
  async getAllAnnouncements(page: number = 1, limit: number = 50) {
    try {
      const offset = (page - 1) * limit;

      const announcements = await db
        .select()
        .from(systemNotifications)
        .orderBy(desc(systemNotifications.createdAt))
        .limit(limit)
        .offset(offset);

      const [totalCount] = await db
        .select({ count: count() })
        .from(systemNotifications);

      return {
        announcements,
        total: totalCount?.count || 0,
        page,
        totalPages: Math.ceil((totalCount?.count || 0) / limit),
      };
    } catch (error) {
      console.error('Get announcements error:', error);
      return { announcements: [], total: 0, page: 1, totalPages: 1 };
    }
  }

  async createAnnouncement(announcementData: any) {
    try {
      const [announcement] = await db
        .insert(systemNotifications)
        .values({
          title: announcementData.title,
          content: announcementData.content,
          type: announcementData.type,
          priority: announcementData.priority,
          targetAudience: announcementData.targetAudience,
          authorId: announcementData.authorId,
          authorName: announcementData.authorName,
          isActive: true,
          scheduledAt: announcementData.scheduledAt ? new Date(announcementData.scheduledAt) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return announcement;
    } catch (error) {
      console.error('Create announcement error:', error);
      return null;
    }
  }

  async updateAnnouncement(announcementId: number, updates: any) {
    try {
      const [announcement] = await db
        .update(systemNotifications)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(systemNotifications.id, announcementId))
        .returning();

      return announcement;
    } catch (error) {
      console.error('Update announcement error:', error);
      return null;
    }
  }

  async deleteAnnouncement(announcementId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(systemNotifications)
        .where(eq(systemNotifications.id, announcementId));

      return result.rowCount > 0;
    } catch (error) {
      console.error('Delete announcement error:', error);
      return false;
    }
  }

  async getActiveAnnouncements() {
    try {
      const announcements = await db
        .select()
        .from(systemNotifications)
        .where(eq(systemNotifications.isActive, true))
        .orderBy(desc(systemNotifications.createdAt));

      return announcements;
    } catch (error) {
      console.error('Get active announcements error:', error);
      return [];
    }
  }
}

export const adminStorage = new AdminStorage();