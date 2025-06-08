import { db } from "./db";
import {
  users,
  adminUsers,
  adminLogs,
  userReports,
  inquiries,
  systemNotifications,
  userNotifications,
  announcements,
  sajuAnalyses,
  coinTransactions,
  reviews,
  type AdminUser,
  type InsertAdminUser,
  type AdminLog,
  type InsertAdminLog,
  type UserReport,
  type Inquiry,
  type SystemNotification,
  type InsertSystemNotification,
  type UserNotification,
  type InsertUserNotification,
  type Announcement,
  type InsertAnnouncement,
} from "@shared/schema";
import { eq, desc, count, sum, gte, lt, and, or, ilike, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export class AdminStorage {
  // Admin user management
  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return admin;
  }

  async getAdminUser(id: number): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return admin;
  }

  async createAdminUser(adminData: InsertAdminUser): Promise<AdminUser> {
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    const [admin] = await db
      .insert(adminUsers)
      .values({
        ...adminData,
        password: hashedPassword,
      })
      .returning();
    return admin;
  }

  async updateAdminUser(id: number, updates: Partial<AdminUser>): Promise<AdminUser | undefined> {
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    const [admin] = await db
      .update(adminUsers)
      .set(updates)
      .where(eq(adminUsers.id, id))
      .returning();
    return admin;
  }

  // Dashboard statistics
  async getDashboardStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    try {
      // Get total users count
      const [{ totalUsers }] = await db
        .select({ totalUsers: count() })
        .from(users);

      // Get active users (users with activity in last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [{ activeUsers }] = await db
        .select({ activeUsers: count() })
        .from(users)
        .where(gte(users.createdAt, thirtyDaysAgo));

      // Get new users today
      const [{ newUsersToday }] = await db
        .select({ newUsersToday: count() })
        .from(users)
        .where(gte(users.createdAt, today));

      // Get total analyses
      const [{ totalAnalyses }] = await db
        .select({ totalAnalyses: count() })
        .from(sajuAnalyses);

      // Get today's analyses
      const [{ todayAnalyses }] = await db
        .select({ todayAnalyses: count() })
        .from(sajuAnalyses)
        .where(gte(sajuAnalyses.createdAt, today));

      // Get total revenue from coin transactions
      const [{ totalRevenue }] = await db
        .select({ totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN type = 'charge' THEN amount ELSE 0 END), 0)` })
        .from(coinTransactions);

      // Get today's coin transactions
      const [{ todayCoins }] = await db
        .select({ todayCoins: count() })
        .from(coinTransactions)
        .where(gte(coinTransactions.createdAt, today));

      // Get pending reports
      const [{ pendingReports }] = await db
        .select({ pendingReports: count() })
        .from(userReports)
        .where(eq(userReports.status, 'pending'));

      // Get pending inquiries
      const [{ pendingInquiries }] = await db
        .select({ pendingInquiries: count() })
        .from(inquiries)
        .where(eq(inquiries.status, 'pending'));

      // Get recent coin transactions with user info
      const recentCoinTransactions = await db
        .select({
          id: coinTransactions.id,
          userId: coinTransactions.userId,
          type: coinTransactions.type,
          amount: coinTransactions.amount,
          description: coinTransactions.description,
          createdAt: coinTransactions.createdAt,
          username: users.username,
        })
        .from(coinTransactions)
        .leftJoin(users, eq(coinTransactions.userId, users.id))
        .orderBy(desc(coinTransactions.createdAt))
        .limit(5);

      return {
        totalUsers,
        totalRevenue: totalRevenue?.toString() || "0",
        totalAnalyses,
        activeUsers,
        newUsersToday,
        todayAnalyses,
        todayCoins: todayCoins?.toString() || "0",
        pendingReports,
        pendingInquiries,
        recentCoinTransactions,
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return {
        totalUsers: 0,
        totalRevenue: "0",
        totalAnalyses: 0,
        activeUsers: 0,
        newUsersToday: 0,
        todayAnalyses: 0,
        todayCoins: "0",
        pendingReports: 0,
        pendingInquiries: 0,
        recentCoinTransactions: [],
      };
    }
  }

  // User management
  async getAllUsers(page = 1, limit = 50, search?: string) {
    let baseQuery = db.select().from(users);
    
    if (search) {
      baseQuery = baseQuery.where(
        or(
          ilike(users.username, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(users.name, `%${search}%`)
        )
      );
    }

    const usersData = await baseQuery
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(users.createdAt));

    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(users);

    return {
      users: usersData,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async deleteUser(userId: number): Promise<void> {
    // 관련 데이터를 순차적으로 삭제 (외래키 제약 고려)
    
    // 1. 사주 분석 기록 삭제
    await db.delete(sajuAnalyses).where(eq(sajuAnalyses.userId, userId));
    
    // 2. 코인 거래 내역 삭제
    await db.delete(coinTransactions).where(eq(coinTransactions.userId, userId));
    
    // 3. 리뷰 삭제
    await db.delete(reviews).where(eq(reviews.userId, userId));
    
    // 4. 알림 삭제
    await db.delete(userNotifications).where(eq(userNotifications.userId, userId));
    
    // 5. 마지막으로 사용자 삭제
    await db.delete(users).where(eq(users.id, userId));
  }

  async getAllUsersWithPhones() {
    const usersData = await db.select().from(users).orderBy(desc(users.createdAt));
    return usersData;
  }

  // Reviews management
  async getAllReviews(page = 1, limit = 50, status?: string) {
    let baseQuery = db.select().from(reviews);
    
    if (status && status !== 'all') {
      baseQuery = baseQuery.where(eq(reviews.approvalStatus, status));
    }

    const reviewsData = await baseQuery
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(reviews.createdAt));

    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(reviews);

    return {
      reviews: reviewsData,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async getReviews(serviceType = 'all') {
    let query = db.select().from(reviews);
    
    if (serviceType !== 'all') {
      query = query.where(eq(reviews.serviceType, serviceType));
    }
    
    return await query.orderBy(desc(reviews.createdAt));
  }

  // Add missing methods that are used in admin routes
  async getSalesStats(startDate?: Date, endDate?: Date) {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      let query = db.select({
        totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN type = 'charge' THEN amount ELSE 0 END), 0)`,
        totalTransactions: count(),
      }).from(coinTransactions);

      if (startDate && endDate) {
        query = query.where(and(
          gte(coinTransactions.createdAt, startDate),
          lt(coinTransactions.createdAt, endDate)
        ));
      }

      const [stats] = await query;
      return stats;
    } catch (error) {
      console.error('Sales stats error:', error);
      return { totalRevenue: 0, totalTransactions: 0 };
    }
  }

  async getAllTransactions(page = 1, limit = 50, type?: string) {
    try {
      let query = db.select({
        id: coinTransactions.id,
        userId: coinTransactions.userId,
        type: coinTransactions.type,
        amount: coinTransactions.amount,
        description: coinTransactions.description,
        createdAt: coinTransactions.createdAt,
        username: users.username,
      }).from(coinTransactions)
        .leftJoin(users, eq(coinTransactions.userId, users.id));

      if (type && type !== 'all') {
        query = query.where(eq(coinTransactions.type, type));
      }

      const transactions = await query
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(desc(coinTransactions.createdAt));

      const [{ totalCount }] = await db
        .select({ totalCount: count() })
        .from(coinTransactions);

      return {
        transactions,
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      console.error('Get transactions error:', error);
      return {
        transactions: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }

  async deleteReview(reviewId: number) {
    await db.delete(reviews).where(eq(reviews.id, reviewId));
    return true;
  }

  async updateReviewApproval(reviewId: number, approvalStatus: string) {
    const [review] = await db
      .update(reviews)
      .set({ approvalStatus })
      .where(eq(reviews.id, reviewId))
      .returning();
    return review;
  }

  // User reports management
  async getAllUserReports(page = 1, limit = 50, status?: string) {
    try {
      let baseQuery = db.select({
        id: userReports.id,
        reporterUserId: userReports.reporterUserId,
        reportedUserId: userReports.reportedUserId,
        reportType: userReports.type,
        reason: userReports.reason,
        status: userReports.status,
        createdAt: userReports.createdAt,
        reporterName: users.username,
        description: userReports.reason,
        title: userReports.reason,
        adminNotes: userReports.adminNotes,
      })
      .from(userReports)
      .leftJoin(users, eq(userReports.reporterUserId, users.id));
      
      if (status && status !== 'all') {
        baseQuery = baseQuery.where(eq(userReports.status, status));
      }

      const reportsData = await baseQuery
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(desc(userReports.createdAt));

      const [{ totalCount }] = await db
        .select({ totalCount: count() })
        .from(userReports);

      return {
        reports: reportsData,
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      console.error('Get reports error:', error);
      throw error;
    }
  }

  async updateUserReport(id: number, updates: any) {
    const [report] = await db
      .update(userReports)
      .set(updates)
      .where(eq(userReports.id, id))
      .returning();
    return report;
  }

  // Inquiries management
  async getAllInquiries(page = 1, limit = 50, status?: string) {
    let baseQuery = db.select({
      id: inquiries.id,
      userId: inquiries.userId,
      subject: inquiries.subject,
      content: inquiries.content,
      status: inquiries.status,
      response: inquiries.response,
      respondedAt: inquiries.respondedAt,
      createdAt: inquiries.createdAt,
      username: users.username,
      email: users.email,
    })
    .from(inquiries)
    .leftJoin(users, eq(inquiries.userId, users.id));
    
    if (status && status !== 'all') {
      baseQuery = baseQuery.where(eq(inquiries.status, status));
    }

    const inquiriesData = await baseQuery
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(inquiries.createdAt));

    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(inquiries);

    return {
      inquiries: inquiriesData,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async updateInquiry(id: number, updates: any) {
    try {
      console.log("=== UPDATE INQUIRY DEBUG ===");
      console.log("Inquiry ID:", id);
      console.log("Updates:", updates);
      
      // Process updates to ensure proper date handling
      const processedUpdates = { ...updates };
      
      // If respondedAt is passed as a Date object, keep it as is
      // If it's a string, convert it to Date
      // If status is being updated to answered/closed, set respondedAt to current time
      if (processedUpdates.respondedAt) {
        if (processedUpdates.respondedAt instanceof Date) {
          // Already a Date object, keep as is
        } else if (typeof processedUpdates.respondedAt === 'string') {
          processedUpdates.respondedAt = new Date(processedUpdates.respondedAt);
        }
      } else if (processedUpdates.status === 'answered' || processedUpdates.status === 'closed') {
        processedUpdates.respondedAt = new Date();
      }
      
      console.log("Processed updates:", processedUpdates);
      
      const [inquiry] = await db
        .update(inquiries)
        .set(processedUpdates)
        .where(eq(inquiries.id, id))
        .returning();
        
      console.log("Updated inquiry:", inquiry);
      return inquiry;
    } catch (error) {
      console.error("Update inquiry error:", error);
      throw error;
    }
  }

  // System notifications
  async getAllSystemNotifications(page = 1, limit = 50) {
    const notificationsData = await db
      .select()
      .from(systemNotifications)
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(systemNotifications.createdAt));

    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(systemNotifications);

    return {
      notifications: notificationsData,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async createSystemNotification(data: any) {
    const [notification] = await db
      .insert(systemNotifications)
      .values({
        title: data.title,
        content: data.content,
        notificationType: data.type,
        priority: data.priority,
        isActive: data.isActive ?? true,
        createdBy: data.createdBy,
      })
      .returning();
    return notification;
  }

  async createUserNotification(data: InsertUserNotification): Promise<UserNotification | null> {
    try {
      const [notification] = await db
        .insert(userNotifications)
        .values(data)
        .returning();
      return notification;
    } catch (error) {
      console.error('Create user notification error:', error);
      return null;
    }
  }

  // Announcements
  async getAllAnnouncements(page = 1, limit = 50) {
    const announcementsData = await db
      .select()
      .from(announcements)
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(announcements.createdAt));

    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(announcements);

    return {
      announcements: announcementsData,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async createAnnouncement(data: any) {
    const [announcement] = await db
      .insert(announcements)
      .values({
        title: data.title,
        content: data.content,
        type: data.type || 'notice',
        priority: data.priority || 'normal',
        targetAudience: data.targetAudience || 'all',
        adminId: data.adminId || data.createdBy,
        isActive: data.isActive ?? true,
      })
      .returning();
    return announcement;
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    try {
      await db.delete(announcements).where(eq(announcements.id, id));
      return true;
    } catch (error) {
      console.error('Delete announcement error:', error);
      return false;
    }
  }

  // Admin logs
  async getAllAdminLogs(page = 1, limit = 50) {
    const logsData = await db
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
        adminUsername: adminUsers.username,
      })
      .from(adminLogs)
      .leftJoin(adminUsers, eq(adminLogs.adminId, adminUsers.id))
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(adminLogs.createdAt));

    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(adminLogs);

    return {
      logs: logsData,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  // Detailed statistics
  async getDetailedStatistics() {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // User statistics
      const [{ total: totalUsers }] = await db.select({ total: count() }).from(users);
      const [{ active: activeUsers }] = await db
        .select({ active: count() })
        .from(users)
        .where(eq(users.status, 'normal'));
      
      const [{ newToday: newUsersToday }] = await db
        .select({ newToday: count() })
        .from(users)
        .where(gte(users.createdAt, today));
      
      const [{ newThisWeek: newUsersThisWeek }] = await db
        .select({ newThisWeek: count() })
        .from(users)
        .where(gte(users.createdAt, thisWeek));

      // Revenue statistics
      const [{ total: totalRevenue }] = await db
        .select({ 
          total: sql<number>`COALESCE(SUM(CASE WHEN type = 'charge' THEN amount ELSE 0 END), 0)` 
        })
        .from(coinTransactions);
      
      const [{ today: todayRevenue }] = await db
        .select({ 
          today: sql<number>`COALESCE(SUM(CASE WHEN type = 'charge' THEN amount ELSE 0 END), 0)` 
        })
        .from(coinTransactions)
        .where(gte(coinTransactions.createdAt, today));

      // Analysis statistics
      const [{ total: totalAnalyses }] = await db.select({ total: count() }).from(sajuAnalyses);
      const [{ today: todayAnalyses }] = await db
        .select({ today: count() })
        .from(sajuAnalyses)
        .where(gte(sajuAnalyses.createdAt, today));
      
      const [{ thisWeek: thisWeekAnalyses }] = await db
        .select({ thisWeek: count() })
        .from(sajuAnalyses)
        .where(gte(sajuAnalyses.createdAt, thisWeek));

      // Top services
      const topServices = await db
        .select({
          serviceType: sajuAnalyses.analysisType,
          count: count(),
        })
        .from(sajuAnalyses)
        .groupBy(sajuAnalyses.analysisType)
        .orderBy(desc(count()))
        .limit(5);

      // Recent transactions
      const recentTransactions = await db
        .select({
          id: coinTransactions.id,
          userId: coinTransactions.userId,
          type: coinTransactions.type,
          amount: coinTransactions.amount,
          description: coinTransactions.description,
          createdAt: coinTransactions.createdAt,
          username: users.username,
        })
        .from(coinTransactions)
        .leftJoin(users, eq(coinTransactions.userId, users.id))
        .orderBy(desc(coinTransactions.createdAt))
        .limit(10);

      // Pending items
      const [{ pendingReports }] = await db
        .select({ pendingReports: count() })
        .from(userReports)
        .where(eq(userReports.status, 'pending'));
      
      const [{ pendingInquiries }] = await db
        .select({ pendingInquiries: count() })
        .from(inquiries)
        .where(eq(inquiries.status, 'pending'));

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          newToday: newUsersToday,
          newThisWeek: newUsersThisWeek,
        },
        revenue: {
          total: totalRevenue || 0,
          today: todayRevenue || 0,
        },
        analyses: {
          total: totalAnalyses,
          today: todayAnalyses,
          thisWeek: thisWeekAnalyses,
        },
        topServices,
        recentTransactions,
        pending: {
          reports: pendingReports,
          inquiries: pendingInquiries,
        },
      };
    } catch (error) {
      console.error('Detailed statistics error:', error);
      return {
        users: { total: 0, active: 0, newToday: 0, newThisWeek: 0 },
        revenue: { total: 0, today: 0 },
        analyses: { total: 0, today: 0, thisWeek: 0 },
        topServices: [],
        recentTransactions: [],
        pending: { reports: 0, inquiries: 0 },
      };
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
        })
        .returning();
      return log;
    } catch (error) {
      console.error('Create admin log error:', error);
      return null;
    }
  }

  // Service price management
  async updateServicePriceById(serviceId: number, updates: { coinCost: number }) {
    try {
      const { servicePrices } = await import("@shared/schema");
      const { eq, sql } = await import("drizzle-orm");
      
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

  // User coin management
  async adjustUserCoins(userId: number, amount: number, reason: string) {
    try {
      const { coinTransactions } = await import("@shared/schema");
      const { eq, sql } = await import("drizzle-orm");
      
      const [user] = await db
        .update(users)
        .set({ 
          coinBalance: sql`${users.coinBalance} + ${amount}`,
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (user) {
        // Record coin transaction
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
}

export const adminStorage = new AdminStorage();