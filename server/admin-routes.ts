import type { Express } from "express";
import { adminStorage } from "./admin-storage";
import bcrypt from "bcrypt";
import {
  insertAdminUserSchema,
  insertAdminLogSchema,
  insertUserSuspensionSchema,
  insertUserReportSchema,
  insertInquirySchema,
  insertSystemNotificationSchema,
} from "@shared/schema";

// Admin middleware to check authentication and permissions
const requireAdminAuth = (requiredRole: string = "operator") => {
  return (req: any, res: any, next: any) => {
    console.log("=== ADMIN AUTH CHECK ===");
    console.log("Session exists:", !!req.session);
    console.log("Session ID:", req.session?.id);
    console.log("Admin ID in session:", req.session?.adminId);
    
    const adminId = req.session?.adminId;
    if (!adminId) {
      console.log("Admin authentication failed - no adminId in session");
      return res.status(401).json({ message: "Admin authentication required" });
    }
    
    // In a real implementation, verify admin role
    req.adminId = adminId;
    console.log("Admin authentication successful, proceeding...");
    next();
  };
};

// Helper to log admin actions
const logAdminAction = async (adminId: number, action: string, targetType: string, targetId?: number, description?: string, req?: any) => {
  try {
    await adminStorage.createAdminLog({
      adminId,
      action,
      targetType,
      targetId,
      description,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent'),
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
};

export function registerAdminRoutes(app: Express) {
  // Admin Authentication
  app.post("/api/admin/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log("=== ADMIN LOGIN ATTEMPT ===");
      console.log("Username:", username);
      
      const admin = await adminStorage.getAdminUserByUsername(username);
      
      if (!admin || !admin.isActive) {
        console.log("Login failed - admin not found or inactive");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const passwordValid = await bcrypt.compare(password, admin.password);
      if (!passwordValid) {
        console.log("Login failed - invalid password");
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      req.session = req.session || {};
      (req.session as any).adminId = admin.id;
      
      console.log("Admin logged in successfully, session ID:", req.session.id);
      console.log("Admin ID stored in session:", admin.id);
      
      const { password: _, ...adminWithoutPassword } = admin;
      res.json({ admin: adminWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/admin/auth/logout", (req, res) => {
    if (req.session) {
      req.session.destroy(() => {
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Already logged out" });
    }
  });

  app.get("/api/admin/auth/me", requireAdminAuth(), async (req: any, res) => {
    try {
      const admin = await adminStorage.getAdminUser(req.adminId);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }
      
      const { password: _, ...adminWithoutPassword } = admin;
      res.json({ admin: adminWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin info" });
    }
  });

  // Dashboard Stats
  app.get("/api/admin/dashboard/stats", requireAdminAuth(), async (req: any, res) => {
    try {
      console.log("=== ADMIN DASHBOARD STATS REQUEST ===");
      console.log("Session ID:", req.session?.id);
      console.log("Admin ID:", req.adminId);
      
      const stats = await adminStorage.getDashboardStats();
      console.log("Dashboard stats fetched:", JSON.stringify(stats, null, 2));
      
      await logAdminAction(req.adminId, "view_dashboard", "dashboard", undefined, "Viewed dashboard stats", req);
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // User Management Routes
  app.get("/api/admin/users", requireAdminAuth(), async (req: any, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;
      
      const result = await adminStorage.getAllUsers(page, limit, search);
      await logAdminAction(req.adminId, "view_users", "users", undefined, "Viewed user list", req);
      res.json(result);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: 'Failed to get users' });
    }
  });

  app.put("/api/admin/users/:id", requireAdminAuth(), async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      const user = await adminStorage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      await logAdminAction(req.adminId, "update_user", "users", userId, `Updated user: ${JSON.stringify(updates)}`, req);
      res.json(user);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  app.delete("/api/admin/users/:id", requireAdminAuth(), async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      const success = await adminStorage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      await logAdminAction(req.adminId, "delete_user", "users", userId, "Deleted user", req);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // 코인 조정 API
  app.post("/api/admin/users/adjust-coins", requireAdminAuth(), async (req: any, res) => {
    try {
      const { userId, amount, reason } = req.body;
      
      if (!userId || !amount || !reason) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      const user = await adminStorage.adjustUserCoins(userId, amount, reason);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      await logAdminAction(req.adminId, "adjust_coins", "users", userId, `Adjusted ${amount} coins: ${reason}`, req);
      res.json(user);
    } catch (error) {
      console.error('Adjust coins error:', error);
      res.status(500).json({ message: 'Failed to adjust coins' });
    }
  });

  // Phone Number Management API
  app.get("/api/admin/users/phones", requireAdminAuth(), async (req: any, res) => {
    try {
      const users = await adminStorage.getAllUsersWithPhones();
      await logAdminAction(req.adminId, "view_phone_numbers", "users", undefined, "Viewed phone number management", req);
      res.json({ users });
    } catch (error) {
      console.error('Get phone numbers error:', error);
      res.status(500).json({ message: 'Failed to get phone numbers' });
    }
  });

  // 사용자 상태 변경 API
  app.post("/api/admin/users/update-status", requireAdminAuth(), async (req: any, res) => {
    try {
      const { userId, status } = req.body;
      
      if (!userId || !status) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      const user = await adminStorage.updateUserStatus(userId, status);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      await logAdminAction(req.adminId, "update_status", "users", userId, `Changed status to ${status}`, req);
      res.json(user);
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({ message: 'Failed to update status' });
    }
  });

  app.post("/api/admin/users/:id/add-coins", requireAdminAuth(), async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }
      
      const user = await adminStorage.addCoinsToUser(userId, amount, req.adminId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      await logAdminAction(req.adminId, "add_coins", "users", userId, `Added ${amount} coins`, req);
      res.json(user);
    } catch (error) {
      console.error('Add coins error:', error);
      res.status(500).json({ message: 'Failed to add coins' });
    }
  });

  // User deletion (complete removal)
  app.post("/api/admin/users/:id/delete", requireAdminAuth(), async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      await adminStorage.deleteUser(userId);
      await logAdminAction(req.adminId, "delete_user", "users", userId, "User permanently deleted", req);
      
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Product Management Routes
  app.get("/api/admin/products", requireAdminAuth(), async (req: any, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const result = await adminStorage.getAllProducts(page, limit);
      await logAdminAction(req.adminId, "view_products", "products", undefined, "Viewed product list", req);
      res.json(result);
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ message: 'Failed to get products' });
    }
  });

  app.put("/api/admin/products/:id", requireAdminAuth(), async (req: any, res) => {
    try {
      const productId = parseInt(req.params.id);
      const updates = req.body;
      
      const product = await adminStorage.updateProduct(productId, updates);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      await logAdminAction(req.adminId, "update_product", "products", productId, `Updated product: ${JSON.stringify(updates)}`, req);
      res.json(product);
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ message: 'Failed to update product' });
    }
  });

  // Review Management Routes
  app.get("/api/admin/reviews", requireAdminAuth(), async (req: any, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as string;
      
      const result = await adminStorage.getAllReviews(page, limit, status);
      await logAdminAction(req.adminId, "view_reviews", "reviews", undefined, "Viewed review list", req);
      res.json(result);
    } catch (error) {
      console.error('Get reviews error:', error);
      res.status(500).json({ message: 'Failed to get reviews' });
    }
  });

  // Report Management Routes
  app.get("/api/admin/reports", requireAdminAuth(), async (req: any, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as string;
      
      const result = await adminStorage.getAllUserReports(page, limit, status);
      await logAdminAction(req.adminId, "view_reports", "reports", undefined, "Viewed report list", req);
      res.json(result);
    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({ message: 'Failed to get reports' });
    }
  });

  app.put("/api/admin/reports/:id", requireAdminAuth(), async (req: any, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const updates = req.body;
      
      const report = await adminStorage.updateUserReport(reportId, updates);
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      await logAdminAction(req.adminId, "update_report", "reports", reportId, `Updated report: ${JSON.stringify(updates)}`, req);
      res.json(report);
    } catch (error) {
      console.error('Update report error:', error);
      res.status(500).json({ message: 'Failed to update report' });
    }
  });

  // Inquiry Management Routes
  app.get("/api/admin/inquiries", requireAdminAuth(), async (req: any, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as string;
      
      const result = await adminStorage.getAllInquiries(page, limit, status);
      await logAdminAction(req.adminId, "view_inquiries", "inquiries", undefined, "Viewed inquiry list", req);
      res.json(result);
    } catch (error) {
      console.error('Get inquiries error:', error);
      res.status(500).json({ message: 'Failed to get inquiries' });
    }
  });

  app.put("/api/admin/inquiries/:id", requireAdminAuth(), async (req: any, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      const updates = req.body;
      
      const inquiry = await adminStorage.updateInquiry(inquiryId, updates);
      if (!inquiry) {
        return res.status(404).json({ message: 'Inquiry not found' });
      }
      
      // Create user notification when inquiry is answered
      if (updates.response && inquiry.userId) {
        await adminStorage.createUserNotification({
          userId: inquiry.userId,
          title: `문의 답변: ${inquiry.subject}`,
          content: updates.response,
          type: "inquiry_response",
          relatedId: inquiryId
        });
      }
      
      await logAdminAction(req.adminId, "update_inquiry", "inquiries", inquiryId, `Updated inquiry: ${JSON.stringify(updates)}`, req);
      res.json(inquiry);
    } catch (error) {
      console.error('Update inquiry error:', error);
      res.status(500).json({ message: 'Failed to update inquiry' });
    }
  });

  // Announcement Management Routes
  app.get("/api/admin/announcements", requireAdminAuth(), async (req: any, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const result = await adminStorage.getAllAnnouncements(page, limit);
      res.json(result);
    } catch (error) {
      console.error('Get announcements error:', error);
      res.status(500).json({ message: 'Failed to get announcements' });
    }
  });

  app.post("/api/admin/announcements", requireAdminAuth(), async (req: any, res) => {
    try {
      const announcementData = req.body;
      
      // Create announcement record first
      const announcement = await adminStorage.createAnnouncement({
        title: announcementData.title,
        content: announcementData.content,
        type: announcementData.type || "general",
        targetAudience: announcementData.targetAudience || "all",
        adminId: req.adminId
      });

      if (!announcement) {
        return res.status(500).json({ message: 'Failed to create announcement record' });
      }
      
      // Send notifications to all users based on target audience  
      const usersResult = await adminStorage.getAllUsers();
      const targetUsers = usersResult.users.filter((user: any) => {
        if (announcementData.targetAudience === "all") return true;
        if (announcementData.targetAudience === "premium") return user.isPremium;
        if (announcementData.targetAudience === "new") {
          const daysSinceJoin = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceJoin <= 7; // New users within 7 days
        }
        return false;
      });

      // Create notifications for target users
      for (const user of targetUsers) {
        await adminStorage.createUserNotification({
          userId: user.id,
          title: `공지사항: ${announcementData.title}`,
          content: announcementData.content,
          type: "announcement",
          relatedId: announcement.id
        });
      }

      await logAdminAction(req.adminId, "create_announcement", "announcements", announcement.id, 
        `Created announcement for ${targetUsers.length} users`, req);
      
      res.json({ 
        announcement,
        notificationsSent: targetUsers.length 
      });
    } catch (error) {
      console.error('Create announcement error:', error);
      res.status(500).json({ message: 'Failed to create announcement' });
    }
  });

  app.delete("/api/admin/announcements/:id", requireAdminAuth(), async (req: any, res) => {
    try {
      const announcementId = parseInt(req.params.id);
      
      const deleted = await adminStorage.deleteAnnouncement(announcementId);
      if (!deleted) {
        return res.status(404).json({ message: 'Announcement not found' });
      }
      
      await logAdminAction(req.adminId, "delete_announcement", "announcements", announcementId, "Deleted announcement", req);
      res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
      console.error('Delete announcement error:', error);
      res.status(500).json({ message: 'Failed to delete announcement' });
    }
  });

  // Report Management Routes
  app.get("/api/admin/reports", requireAdminAuth(), async (req: any, res) => {
    try {
      const { status, priority, page = 1, limit = 50 } = req.query;
      const reports = await adminStorage.getAllReports(Number(page), Number(limit), status, priority);
      res.json(reports);
    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({ message: 'Failed to get reports' });
    }
  });

  app.put("/api/admin/reports/:id", requireAdminAuth(), async (req: any, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const updates = req.body;
      
      const report = await adminStorage.updateReport(reportId, updates);
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      res.json(report);
    } catch (error) {
      console.error('Update report error:', error);
      res.status(500).json({ message: 'Failed to update report' });
    }
  });

  // Inquiry Management Routes
  app.get("/api/admin/inquiries", requireAdminAuth(), async (req: any, res) => {
    try {
      const { status, category, page = 1, limit = 50 } = req.query;
      const inquiries = await adminStorage.getAllInquiries(Number(page), Number(limit), status, category);
      res.json(inquiries);
    } catch (error) {
      console.error('Get inquiries error:', error);
      res.status(500).json({ message: 'Failed to get inquiries' });
    }
  });

  app.put("/api/admin/inquiries/:id", requireAdminAuth(), async (req: any, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      const updates = req.body;
      
      const inquiry = await adminStorage.updateInquiry(inquiryId, updates);
      if (!inquiry) {
        return res.status(404).json({ message: 'Inquiry not found' });
      }
      
      res.json(inquiry);
    } catch (error) {
      console.error('Update inquiry error:', error);
      res.status(500).json({ message: 'Failed to update inquiry' });
    }
  });

  // Announcement Management Routes
  app.get("/api/admin/announcements", requireAdminAuth(), async (req: any, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const announcements = await adminStorage.getAllAnnouncements(Number(page), Number(limit));
      res.json(announcements);
    } catch (error) {
      console.error('Get announcements error:', error);
      res.status(500).json({ message: 'Failed to get announcements' });
    }
  });

  app.post("/api/admin/announcements", requireAdminAuth(), async (req: any, res) => {
    try {
      const announcement = await adminStorage.createAnnouncement(req.body);
      res.json(announcement);
    } catch (error) {
      console.error('Create announcement error:', error);
      res.status(500).json({ message: 'Failed to create announcement' });
    }
  });

  app.put("/api/admin/announcements/:id", requireAdminAuth(), async (req: any, res) => {
    try {
      const announcementId = parseInt(req.params.id);
      const updates = req.body;
      
      const announcement = await adminStorage.updateAnnouncement(announcementId, updates);
      if (!announcement) {
        return res.status(404).json({ message: 'Announcement not found' });
      }
      
      res.json(announcement);
    } catch (error) {
      console.error('Update announcement error:', error);
      res.status(500).json({ message: 'Failed to update announcement' });
    }
  });

  app.delete("/api/admin/announcements/:id", requireAdminAuth(), async (req: any, res) => {
    try {
      const announcementId = parseInt(req.params.id);
      const success = await adminStorage.deleteAnnouncement(announcementId);
      
      if (!success) {
        return res.status(404).json({ message: 'Announcement not found' });
      }
      
      res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
      console.error('Delete announcement error:', error);
      res.status(500).json({ message: 'Failed to delete announcement' });
    }
  });

  // User Report Submission (Public)
  app.post("/api/reports", async (req, res) => {
    try {
      const report = await adminStorage.createReport(req.body);
      res.json(report);
    } catch (error) {
      console.error('Create report error:', error);
      res.status(500).json({ message: 'Failed to create report' });
    }
  });

  // User Inquiry Submission (Public)
  app.post("/api/inquiries", async (req, res) => {
    try {
      const inquiry = await adminStorage.createInquiry(req.body);
      res.json(inquiry);
    } catch (error) {
      console.error('Create inquiry error:', error);
      res.status(500).json({ message: 'Failed to create inquiry' });
    }
  });

  // Public Announcements
  app.get("/api/announcements", async (req, res) => {
    try {
      const announcements = await adminStorage.getActiveAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error('Get public announcements error:', error);
      res.status(500).json({ message: 'Failed to get announcements' });
    }
  });

  // Statistics Routes
  app.get("/api/admin/stats/sales", requireAdminAuth(), async (req: any, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const stats = await adminStorage.getSalesStats(startDate, endDate);
      res.json(stats);
    } catch (error) {
      console.error('Get sales stats error:', error);
      res.status(500).json({ message: 'Failed to get sales stats' });
    }
  });

  app.get("/api/admin/transactions", requireAdminAuth(), async (req: any, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const type = req.query.type as string;
      
      const result = await adminStorage.getAllTransactions(page, limit, type);
      await logAdminAction(req.adminId, "view_transactions", "transactions", undefined, "Viewed transaction list", req);
      res.json(result);
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ message: 'Failed to get transactions' });
    }
  });

  // Admin Logs Routes
  app.get("/api/admin/logs", requireAdminAuth(), async (req: any, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const result = await adminStorage.getAllAdminLogs(page, limit);
      res.json(result);
    } catch (error) {
      console.error('Get logs error:', error);
      res.status(500).json({ message: 'Failed to get logs' });
    }
  });

  // Detailed Statistics Route
  app.get("/api/admin/detailed-stats", requireAdminAuth(), async (req: any, res) => {
    try {
      const stats = await adminStorage.getDetailedStatistics();
      await logAdminAction(req.adminId, "view_detailed_statistics", "statistics", undefined, "Viewed detailed statistics", req);
      res.json(stats);
    } catch (error) {
      console.error('Get detailed stats error:', error);
      res.status(500).json({ message: 'Failed to get detailed statistics' });
    }
  });

  // User Management
  app.get("/api/admin/users", requireAdminAuth(), async (req: any, res) => {
    try {
      const { page = 1, limit = 20, search, status } = req.query;
      // TODO: Implement pagination and filtering
      const users = await adminStorage.getAllUsers(parseInt(page), parseInt(limit), search);
      
      await logAdminAction(req.adminId, "view_users", "user", undefined, `Viewed user list (page ${page})`, req);
      
      res.json({
        users: users.users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: users.total,
          pages: Math.ceil(users.total / parseInt(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/:id", requireAdminAuth(), async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user's analyses, transactions, suspensions
      const analyses = await storage.getSajuAnalysesByUser(userId);
      const transactions = await storage.getCoinTransactions(userId);
      const suspensions = await storage.getUserSuspensions(userId);
      
      await logAdminAction(req.adminId, "view_user_detail", "user", userId, `Viewed user ${user.username}`, req);
      
      res.json({
        user,
        analyses,
        transactions,
        suspensions,
        stats: {
          totalAnalyses: analyses.length,
          totalSpent: transactions.filter(t => t.type === 'spend').reduce((sum, t) => sum + Math.abs(t.amount), 0),
          joinDate: user.createdAt,
          lastActivity: analyses[0]?.createdAt || user.createdAt
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user details" });
    }
  });

  app.post("/api/admin/users/:id/suspend", requireAdminAuth("admin"), async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { reason, endDate } = req.body;
      
      const suspensionData = insertUserSuspensionSchema.parse({
        userId,
        adminId: req.adminId,
        reason,
        endDate: endDate ? new Date(endDate) : undefined,
      });
      
      const suspension = await storage.suspendUser(suspensionData);
      
      await logAdminAction(req.adminId, "suspend_user", "user", userId, `Suspended user: ${reason}`, req);
      
      res.json({ suspension, message: "User suspended successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to suspend user" });
    }
  });

  app.post("/api/admin/users/:id/coins", requireAdminAuth("admin"), async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount, type, description } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (type === 'add') {
        await storage.addCoins(userId, amount, "admin_credit", description, req.adminId);
      } else if (type === 'subtract') {
        await storage.spendCoins(userId, amount, "admin_debit", description, req.adminId);
      }
      
      await logAdminAction(req.adminId, "modify_user_coins", "user", userId, `${type} ${amount} coins: ${description}`, req);
      
      res.json({ message: "Coins updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update coins" });
    }
  });

  // Product/Service Management
  app.get("/api/admin/services", requireAdminAuth(), async (req: any, res) => {
    try {
      const services = await storage.getServicePrices();
      await logAdminAction(req.adminId, "view_services", "service", undefined, "Viewed service list", req);
      res.json({ services });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.put("/api/admin/services/:id", requireAdminAuth("admin"), async (req: any, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const updates = req.body;
      
      const service = await storage.updateServicePrice(serviceId, updates);
      
      await logAdminAction(req.adminId, "update_service", "service", serviceId, `Updated service pricing`, req);
      
      res.json({ service, message: "Service updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  // Service Price Update Route for Admin Panel
  app.put("/api/admin/service-prices/:id", requireAdminAuth(), async (req: any, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const { coinCost } = req.body;
      
      if (isNaN(serviceId) || coinCost === undefined || coinCost < 0) {
        return res.status(400).json({ message: "Invalid service ID or coin cost" });
      }
      
      const updatedService = await adminStorage.updateServicePriceById(serviceId, { coinCost });
      
      if (!updatedService) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      await logAdminAction(req.adminId, "update_service_price", "service", serviceId, `Updated service price to ${coinCost} coins`, req);
      
      res.json({ 
        service: updatedService, 
        message: "Service price updated successfully" 
      });
    } catch (error) {
      console.error('Update service price error:', error);
      res.status(500).json({ message: "Failed to update service price" });
    }
  });

  // Review Management
  app.get("/api/admin/reviews", requireAdminAuth(), async (req: any, res) => {
    try {
      const { serviceType = 'all' } = req.query;
      const reviews = await adminStorage.getReviews(serviceType);
      
      await logAdminAction(req.adminId, "view_reviews", "review", undefined, `Viewed review list`, req);
      
      res.json({ reviews });
    } catch (error) {
      console.error('Get reviews error:', error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.delete("/api/admin/reviews/:id", requireAdminAuth(), async (req: any, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      
      if (isNaN(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }
      
      const deleted = await adminStorage.deleteReview(reviewId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      await logAdminAction(req.adminId, "delete_review", "review", reviewId, `Deleted review`, req);
      
      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      console.error('Delete review error:', error);
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  // Update Review Approval Status
  app.patch("/api/admin/reviews/:id/approval", requireAdminAuth(), async (req: any, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const { approvalStatus } = req.body;
      
      if (isNaN(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }
      
      if (!["pending", "approved", "rejected"].includes(approvalStatus)) {
        return res.status(400).json({ message: "Invalid approval status" });
      }
      
      const updatedReview = await adminStorage.updateReviewApproval(reviewId, approvalStatus);
      
      if (!updatedReview) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      await logAdminAction(req.adminId, "update_review_approval", "review", reviewId, `${approvalStatus === 'approved' ? 'Approved' : approvalStatus === 'rejected' ? 'Rejected' : 'Set pending'} review`, req);
      
      res.json({ review: updatedReview });
    } catch (error) {
      console.error('Update review approval error:', error);
      res.status(500).json({ message: "Failed to update review approval status" });
    }
  });

  // Reports Management
  app.get("/api/admin/reports", requireAdminAuth(), async (req: any, res) => {
    try {
      const reports = await storage.getAllUserReports();
      await logAdminAction(req.adminId, "view_reports", "report", undefined, "Viewed user reports", req);
      res.json({ reports });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.put("/api/admin/reports/:id", requireAdminAuth(), async (req: any, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const { status, adminNotes } = req.body;
      
      const report = await storage.updateUserReport(reportId, {
        status,
        adminNotes,
        adminId: req.adminId,
        resolvedAt: status === 'resolved' ? new Date() : undefined,
      });
      
      await logAdminAction(req.adminId, "resolve_report", "report", reportId, `Report ${status}: ${adminNotes}`, req);
      
      res.json({ report, message: "Report updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update report" });
    }
  });

  // Inquiries Management
  app.get("/api/admin/inquiries", requireAdminAuth(), async (req: any, res) => {
    try {
      const inquiries = await storage.getAllInquiries();
      await logAdminAction(req.adminId, "view_inquiries", "inquiry", undefined, "Viewed inquiries", req);
      res.json({ inquiries });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.put("/api/admin/inquiries/:id", requireAdminAuth(), async (req: any, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      const { response, status } = req.body;
      
      const inquiry = await storage.updateInquiry(inquiryId, {
        response,
        status,
        adminId: req.adminId,
        respondedAt: new Date(),
      });
      
      await logAdminAction(req.adminId, "respond_inquiry", "inquiry", inquiryId, "Responded to inquiry", req);
      
      res.json({ inquiry, message: "Inquiry responded successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to respond to inquiry" });
    }
  });

  // System Notifications
  app.get("/api/admin/notifications", requireAdminAuth(), async (req: any, res) => {
    try {
      const notifications = await storage.getAllSystemNotifications();
      await logAdminAction(req.adminId, "view_notifications", "notification", undefined, "Viewed system notifications", req);
      res.json({ notifications });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/admin/notifications", requireAdminAuth("admin"), async (req: any, res) => {
    try {
      const notificationData = insertSystemNotificationSchema.parse({
        ...req.body,
        createdBy: req.adminId,
      });
      
      const notification = await storage.createSystemNotification(notificationData);
      
      await logAdminAction(req.adminId, "create_notification", "notification", notification.id, `Created notification: ${notification.title}`, req);
      
      res.json({ notification, message: "Notification created successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  // Admin Logs
  app.get("/api/admin/logs", requireAdminAuth("admin"), async (req: any, res) => {
    try {
      const { limit = 100 } = req.query;
      const logs = await storage.getAllAdminLogs(parseInt(limit));
      res.json({ logs });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin logs" });
    }
  });

  // Sales Analytics
  app.get("/api/admin/analytics/sales", requireAdminAuth(), async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      const salesStats = await storage.getSalesStats(startDate, endDate);
      
      await logAdminAction(req.adminId, "view_sales_analytics", "analytics", undefined, `Viewed sales analytics ${startDate} to ${endDate}`, req);
      
      res.json({ salesStats });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales analytics" });
    }
  });

  // Export Data
  app.get("/api/admin/export/:type", requireAdminAuth("admin"), async (req: any, res) => {
    try {
      const { type } = req.params;
      const { startDate, endDate } = req.query;
      
      let data;
      switch (type) {
        case 'users':
          data = await storage.getAllUsers ? await storage.getAllUsers() : [];
          break;
        case 'analyses':
          data = await storage.getAllAnalyses();
          break;
        case 'transactions':
          data = await storage.getAllTransactions ? await storage.getAllTransactions() : [];
          break;
        default:
          return res.status(400).json({ message: "Invalid export type" });
      }
      
      await logAdminAction(req.adminId, "export_data", "export", undefined, `Exported ${type} data`, req);
      
      res.json({ data, type, exportedAt: new Date() });
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });
}