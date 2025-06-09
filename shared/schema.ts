import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  marketingConsent: boolean("marketingConsent").default(false), // 마케팅 수신 동의
  birthDate: text("birthDate"),
  birthTime: text("birthTime"),
  birthTimeUnknown: boolean("birthTimeUnknown").default(false),
  gender: text("gender"),
  calendarType: text("calendarType").default("양력"), // 양력/음력
  isLeapMonth: boolean("isLeapMonth").default(false), // 윤달 여부
  birthCountry: text("birthCountry").default("대한민국"), // 출생 국가
  timezone: text("timezone").default("Asia/Seoul"), // 시간대
  analysisCount: integer("analysisCount").default(0),
  coinBalance: integer("coinBalance").default(0).notNull(),
  status: text("status").default("normal").notNull(), // normal, suspended
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const sajuAnalyses = pgTable("sajuAnalyses", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  analysisType: text("analysisType").notNull(), // comprehensive, career, love, wealth, health
  serviceType: text("serviceType"), // nullable field for consistency
  birthData: jsonb("birthData").notNull(), // { date, time, gender }
  result: jsonb("result").notNull(), // AI analysis result
  summary: text("summary").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const careerRecommendations = pgTable("careerRecommendations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  analysisId: integer("analysisId").notNull(),
  recommendations: jsonb("recommendations").notNull(), // Array of job recommendations
  strengths: jsonb("strengths").notNull(),
  compatibleFields: jsonb("compatibleFields").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  relationship: text("relationship"),
  birthDate: text("birthDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const coachingSessions = pgTable("coachingSessions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  sessionType: text("sessionType").notNull(), // love, career, general
  topic: text("topic").notNull(),
  content: text("content").notNull(),
  aiResponse: text("aiResponse").notNull(),
  status: text("status").default("completed"),
  createdAt: timestamp("createdAt").defaultNow(),
});

// 코인 거래 내역
export const coinTransactions = pgTable("coinTransactions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: text("type").notNull(), // charge, spend, refund
  amount: integer("amount").notNull(), // 양수: 충전/환불, 음수: 사용
  balanceAfter: integer("balanceAfter").notNull(), // 거래 후 잔액
  description: text("description").notNull(), // 거래 설명
  serviceType: text("serviceType"), // saju_analysis, career_analysis, coaching 등
  referenceId: integer("referenceId"), // 관련 서비스의 ID
  paymentId: text("paymentId"), // PG사 결제 ID (충전 시)
  createdAt: timestamp("createdAt").defaultNow(),
});

// 서비스별 코인 소모량 설정
export const servicePrices = pgTable("servicePrices", {
  id: serial("id").primaryKey(),
  serviceType: text("serviceType").notNull().unique(), // saju_analysis, career_analysis, coaching, compatibility
  coinCost: integer("coinCost").notNull(), // 필요 코인 수
  description: text("description").notNull(), // 서비스 설명
  displayOrder: integer("displayOrder").default(0).notNull(), // 정렬 순서
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// 이용 후기 테이블
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  username: text("username").notNull(), // 후기 작성자명
  serviceType: text("service_type").notNull(), // 이용한 서비스 타입
  rating: integer("rating").notNull(), // 1-5 별점
  title: text("title").notNull(), // 후기 제목
  content: text("content").notNull(), // 후기 내용
  isHelpful: boolean("is_helpful").default(false),
  helpfulCount: integer("helpful_count").default(0),
  approvalStatus: text("approval_status").default("pending").notNull(), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

// 오늘의 운세 캐시 테이블
export const dailyFortunes = pgTable("daily_fortunes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fortuneDate: text("fortune_date").notNull(), // YYYY-MM-DD 형식 (한국시간 기준)
  fortune: text("fortune").notNull(), // 운세 내용
  createdAt: timestamp("created_at").defaultNow(),
});

// 미리 계산된 분석 테이블
export const precomputedAnalyses = pgTable("precomputed_analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  analysisType: text("analysis_type").notNull(), // monthly, love, career, marriage, comprehensive
  birthData: jsonb("birth_data").notNull(),
  result: jsonb("result").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  generatedAt: timestamp("generated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});



// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  name: true,
  phone: true,
  marketingConsent: true,
  birthDate: true,
  birthTime: true,
  gender: true,
});

export const insertSajuAnalysisSchema = createInsertSchema(sajuAnalyses).pick({
  userId: true,
  title: true,
  analysisType: true,
  birthData: true,
  result: true,
  summary: true,
});

export const insertCareerRecommendationSchema = createInsertSchema(careerRecommendations).pick({
  userId: true,
  analysisId: true,
  recommendations: true,
  strengths: true,
  compatibleFields: true,
});

export const insertContactSchema = createInsertSchema(contacts).pick({
  userId: true,
  name: true,
  phone: true,
  email: true,
  relationship: true,
  birthDate: true,
  notes: true,
});

export const insertCoachingSessionSchema = createInsertSchema(coachingSessions).pick({
  userId: true,
  sessionType: true,
  topic: true,
  content: true,
  aiResponse: true,
});

export const insertCoinTransactionSchema = createInsertSchema(coinTransactions).pick({
  userId: true,
  type: true,
  amount: true,
  balanceAfter: true,
  description: true,
  serviceType: true,
  referenceId: true,
  paymentId: true,
});

export const insertServicePriceSchema = createInsertSchema(servicePrices).pick({
  serviceType: true,
  coinCost: true,
  description: true,
  isActive: true,
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  userId: true,
  username: true,
  serviceType: true,
  rating: true,
  title: true,
  content: true,
});

export const insertDailyFortuneSchema = createInsertSchema(dailyFortunes).pick({
  userId: true,
  fortuneDate: true,
  fortune: true,
});



// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SajuAnalysis = typeof sajuAnalyses.$inferSelect;
export type InsertSajuAnalysis = z.infer<typeof insertSajuAnalysisSchema>;
export type CareerRecommendation = typeof careerRecommendations.$inferSelect;
export type InsertCareerRecommendation = z.infer<typeof insertCareerRecommendationSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type CoachingSession = typeof coachingSessions.$inferSelect;
export type InsertCoachingSession = z.infer<typeof insertCoachingSessionSchema>;
export type CoinTransaction = typeof coinTransactions.$inferSelect;
export type InsertCoinTransaction = z.infer<typeof insertCoinTransactionSchema>;
export type ServicePrice = typeof servicePrices.$inferSelect;
export type InsertServicePrice = z.infer<typeof insertServicePriceSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type DailyFortune = typeof dailyFortunes.$inferSelect;
export type InsertDailyFortune = z.infer<typeof insertDailyFortuneSchema>;

// User notification types
export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertUserNotification = typeof userNotifications.$inferInsert;

// Announcement types
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

// Precomputed analysis types
export type PrecomputedAnalysis = typeof precomputedAnalyses.$inferSelect;
export type InsertPrecomputedAnalysis = typeof precomputedAnalyses.$inferInsert;

// Admin system tables
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("operator"), // super_admin, admin, operator, support
  permissions: jsonb("permissions").default({}),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => adminUsers.id),
  action: text("action").notNull(),
  targetType: text("target_type"), // user, product, review, etc
  targetId: integer("target_id"),
  description: text("description"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSuspensions = pgTable("user_suspensions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  adminId: integer("admin_id").references(() => adminUsers.id),
  reason: text("reason").notNull(),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userReports = pgTable("user_reports", {
  id: serial("id").primaryKey(),
  reporterUserId: integer("reporter_user_id").references(() => users.id),
  reportedUserId: integer("reported_user_id").references(() => users.id),
  type: text("type").notNull(), // fraud, inappropriate, spam, etc
  reason: text("reason").notNull(),
  status: text("status").default("pending"), // pending, reviewed, resolved, dismissed
  adminId: integer("admin_id").references(() => adminUsers.id),
  adminNotes: text("admin_notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  status: text("status").default("pending"), // pending, answered, closed
  priority: text("priority").default("normal"), // low, normal, high, urgent
  adminId: integer("admin_id").references(() => adminUsers.id),
  response: text("response"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemNotifications = pgTable("system_notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // announcement, maintenance, alert
  targetUserIds: jsonb("target_user_ids"), // null for all users, array for specific users
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  createdBy: integer("created_by").references(() => adminUsers.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userNotifications = pgTable("user_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // inquiry_response, system_announcement, etc
  isRead: boolean("is_read").default(false),
  relatedId: integer("related_id"), // inquiry id, report id, etc
  createdAt: timestamp("created_at").defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // notice, event, maintenance, update
  priority: text("priority").notNull(), // normal, urgent
  targetAudience: text("target_audience").notNull(), // all, premium, new
  adminId: integer("admin_id").references(() => adminUsers.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const salesStats = pgTable("sales_stats", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  totalRevenue: text("total_revenue").default("0"),
  totalTransactions: integer("total_transactions").default(0),
  newUsers: integer("new_users").default(0),
  activeUsers: integer("active_users").default(0),
  topProducts: jsonb("top_products").default({}),
  conversionRate: text("conversion_rate").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin Relations
export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  logs: many(adminLogs),
  handledReports: many(userReports),
  handledInquiries: many(inquiries),
  notifications: many(systemNotifications),
  suspensions: many(userSuspensions),
}));

export const adminLogsRelations = relations(adminLogs, ({ one }) => ({
  admin: one(adminUsers, {
    fields: [adminLogs.adminId],
    references: [adminUsers.id],
  }),
}));

export const userSuspensionsRelations = relations(userSuspensions, ({ one }) => ({
  user: one(users, {
    fields: [userSuspensions.userId],
    references: [users.id],
  }),
  admin: one(adminUsers, {
    fields: [userSuspensions.adminId],
    references: [adminUsers.id],
  }),
}));

export const userReportsRelations = relations(userReports, ({ one }) => ({
  reporter: one(users, {
    fields: [userReports.reporterUserId],
    references: [users.id],
  }),
  reported: one(users, {
    fields: [userReports.reportedUserId],
    references: [users.id],
  }),
  admin: one(adminUsers, {
    fields: [userReports.adminId],
    references: [adminUsers.id],
  }),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  user: one(users, {
    fields: [inquiries.userId],
    references: [users.id],
  }),
  admin: one(adminUsers, {
    fields: [inquiries.adminId],
    references: [adminUsers.id],
  }),
}));

export const systemNotificationsRelations = relations(systemNotifications, ({ one }) => ({
  createdByAdmin: one(adminUsers, {
    fields: [systemNotifications.createdBy],
    references: [adminUsers.id],
  }),
}));

// Admin schema validations
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const insertAdminLogSchema = createInsertSchema(adminLogs).omit({
  id: true,
  createdAt: true,
});

export const insertUserSuspensionSchema = createInsertSchema(userSuspensions).omit({
  id: true,
  createdAt: true,
});

export const insertUserReportSchema = createInsertSchema(userReports).omit({
  id: true,
  createdAt: true,
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
});

export const insertSystemNotificationSchema = createInsertSchema(systemNotifications).omit({
  id: true,
  createdAt: true,
});

export const insertSalesStatsSchema = createInsertSchema(salesStats).omit({
  id: true,
  createdAt: true,
});

// Admin Types
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;

export type UserSuspension = typeof userSuspensions.$inferSelect;
export type InsertUserSuspension = z.infer<typeof insertUserSuspensionSchema>;

export type UserReport = typeof userReports.$inferSelect;
export type InsertUserReport = z.infer<typeof insertUserReportSchema>;

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;

export type SystemNotification = typeof systemNotifications.$inferSelect;
export type InsertSystemNotification = z.infer<typeof insertSystemNotificationSchema>;

export type SalesStats = typeof salesStats.$inferSelect;
export type InsertSalesStats = z.infer<typeof insertSalesStatsSchema>;
