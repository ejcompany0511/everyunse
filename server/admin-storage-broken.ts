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
        email: "admin@ejcompany.com",
        role: "super_admin",
        permissions: {},
        isActive: true,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return admin || undefined;
  }

  async getAdminUser(id: number): Promise<AdminUser | undefined> {
    // 실제 관리자 계정 확인
    if (id === 1) {
      return {
        id: 1,
        username: "EJCompany0511",
        password: "Ej960511?",
        email: "admin@ejcompany.com",
        role: "super_admin",
        permissions: {},
        isActive: true,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return admin || undefined;
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
      .set(updates)
      .where(eq(adminUsers.id, id))
      .returning();
    return admin || undefined;
  }

  async getDashboardStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 기본 통계
      const [totalUsersResult] = await db.select({ count: count() }).from(users);
      const [activeUsersResult] = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));
      const [totalAnalysesResult] = await db.select({ count: count() }).from(sajuAnalyses);

      // 오늘 통계
      const [newUsersResult] = await db.select({ count: count() }).from(users).where(gte(users.createdAt, today));
      const [todayAnalysesResult] = await db.select({ count: count() }).from(sajuAnalyses).where(gte(sajuAnalyses.createdAt, today));

      // 코인 통계
      const [totalCoinsResult] = await db.select({ 
        total: sql<number>`COALESCE(SUM(CAST(${coinTransactions.amount} AS INTEGER)), 0)`
      }).from(coinTransactions).where(eq(coinTransactions.type, "purchase"));

      const [todayCoinsResult] = await db.select({ 
        total: sql<number>`COALESCE(SUM(CAST(${coinTransactions.amount} AS INTEGER)), 0)`
      }).from(coinTransactions).where(
        and(
          eq(coinTransactions.type, "purchase"),
          gte(coinTransactions.createdAt, today)
        )
      );

      // 대기 중인 항목들
      const [pendingReportsResult] = await db.select({ count: count() }).from(userReports).where(eq(userReports.status, "pending"));
      const [pendingInquiriesResult] = await db.select({ count: count() }).from(inquiries).where(eq(inquiries.status, "pending"));

      // 최근 코인 거래
      let recentCoinTransactions: any[] = [];
      try {
        recentCoinTransactions = await db
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
          .limit(5);
      } catch (e: any) {
        console.error("Recent transactions error:", e);
        recentCoinTransactions = [];
      }

      return {
        totalUsers: totalUsersResult.count,
        totalRevenue: totalCoinsResult.total || 0,
        totalAnalyses: totalAnalysesResult.count,
        activeUsers: activeUsersResult.count,
        newUsersToday: newUsersResult.count,
        todayAnalyses: todayAnalysesResult.count,
        todayCoins: todayCoinsResult.total || 0,
        pendingReports: pendingReportsResult.count,
        pendingInquiries: pendingInquiriesResult.count,
        recentCoinTransactions
      };
    } catch (error: any) {
      console.error("Dashboard stats error:", error);
      return {
        totalUsers: 0,
        totalRevenue: 0,
        totalAnalyses: 0,
        activeUsers: 0,
        newUsersToday: 0,
        todayAnalyses: 0,
        todayCoins: 0,
        pendingReports: 0,
        pendingInquiries: 0,
        recentCoinTransactions: []
      };
    }
  }

  async getAllUsers(page = 1, limit = 50, search?: string) {
    try {
      const offset = (page - 1) * limit;
      let query = db.select().from(users).orderBy(desc(users.createdAt));
      
      if (search) {
        query = query.where(
          or(
            ilike(users.username, `%${search}%`),
            ilike(users.email, `%${search}%`)
          )
        );
      }
      
      const userList = await query.limit(limit).offset(offset);
      const [totalResult] = await db.select({ count: count() }).from(users);
      
      return {
        users: userList,
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
      let query = db
        .select({
          id: reviews.id,
          userId: reviews.userId,
          username: users.username,
          serviceType: reviews.serviceType,
          rating: reviews.rating,
          content: reviews.content,
          approvalStatus: reviews.approvalStatus,
          createdAt: reviews.createdAt
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .orderBy(desc(reviews.createdAt));
      
      if (status) {
        query = query.where(eq(reviews.approvalStatus, status));
      }
      
      const reviewList = await query.limit(limit).offset(offset);
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
      
      if (serviceType !== 'all') {
        query = query.where(eq(reviews.serviceType, serviceType));
      }
      
      const reviewList = await query;
      return reviewList;
    } catch (error) {
      console.error("Get reviews error:", error);
      return [];
    }
  }

  async deleteReview(reviewId: number) {
    try {
      await db.delete(reviews).where(eq(reviews.id, reviewId));
      return true;
    } catch (error) {
      console.error("Delete review error:", error);
      return false;
    }
  }

  async updateReviewApproval(reviewId: number, approvalStatus: string) {
    try {
      await db
        .update(reviews)
        .set({ 
          approvalStatus,
        })
        .where(eq(reviews.id, reviewId));
      return true;
    } catch (error) {
      console.error("Update review approval error:", error);
      return false;
    }
  }

  async getAllUserReports(page = 1, limit = 50, status?: string) {
    try {
      const offset = (page - 1) * limit;
      let query = db
        .select({
          id: userReports.id,
          reporterUserId: userReports.reporterUserId,
          reportedUserId: userReports.reportedUserId,
          type: userReports.type,
          reason: userReports.reason,
          status: userReports.status,
          adminId: userReports.adminId,
          adminNotes: userReports.adminNotes,
          resolvedAt: userReports.resolvedAt,
          createdAt: userReports.createdAt
        })
        .from(userReports)
        .orderBy(desc(userReports.createdAt));
      
      if (status) {
        query = query.where(eq(userReports.status, status));
      }
      
      const reportList = await query.limit(limit).offset(offset);
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
        .set({
          status: updates.status,
          adminId: updates.adminId,
          adminNotes: updates.adminNotes,
          resolvedAt: updates.status === 'resolved' ? new Date() : null
        })
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
          adminId: inquiries.adminId,
          response: inquiries.response,
          respondedAt: inquiries.respondedAt,
          createdAt: inquiries.createdAt,
          username: users.username,
          email: users.email
        })
        .from(inquiries)
        .leftJoin(users, eq(inquiries.userId, users.id))
        .orderBy(desc(inquiries.createdAt));
      
      if (status) {
        query = query.where(eq(inquiries.status, status));
      }
      
      const inquiryList = await query.limit(limit).offset(offset);
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
      const updateData: any = {
        status: updates.status,
        adminId: updates.adminId,
        response: updates.response
      };

      if (updates.status === 'answered') {
        updateData.respondedAt = new Date();
      }

      const [inquiry] = await db
        .update(inquiries)
        .set(updateData)
        .where(eq(inquiries.id, id))
        .returning();
      
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
          title: data.title,
          content: data.content,
          type: data.type,
          targetUserIds: data.targetUserIds,
          isActive: data.isActive || true,
          expiresAt: data.expiresAt,
          createdBy: data.createdBy,
          createdAt: new Date()
        })
        .returning();
      return notification;
    } catch (error) {
      console.error("Create system notification error:", error);
      return null;
    }
  }

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
          title: data.title,
          content: data.content,
          type: "announcement",
          targetUserIds: data.targetUserIds,
          isActive: data.isActive || true,
          expiresAt: data.expiresAt,
          createdBy: data.adminId,
          createdAt: new Date()
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
          serviceType: sajuAnalyses.analysisType,
          count: count(),
        })
        .from(sajuAnalyses)
        .where(gte(sajuAnalyses.createdAt, weekAgo))
        .groupBy(sajuAnalyses.analysisType)
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
}

export const adminStorage = new AdminStorage();