import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getCurrentKoreanTimeString } from "./utils/timezone";
import {
  insertUserSchema,
  insertSajuAnalysisSchema,
  insertCareerRecommendationSchema,
  insertContactSchema,
  insertCoachingSessionSchema,
  insertReviewSchema,
} from "@shared/schema";
import { calculateSaju } from "./saju-calculator";
import { generateDailyFortune } from "./openai";
import { registerAdminRoutes } from "./admin-routes";

// Authentication middleware
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: "Account is suspended" });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Authentication failed" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auto-fix schema inconsistencies on startup
  const ensureSchemaConsistency = async () => {
    try {
      console.log('=== CHECKING AND FIXING SCHEMA CONSISTENCY ===');
      
      const { sql } = await import('drizzle-orm');
      const { db } = await import('./db');
      
      // Check if display_order column exists in service_prices table
      const displayOrderCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'service_prices' 
          AND column_name = 'display_order'
        );
      `);
      
      if (!displayOrderCheck.rows[0].exists) {
        console.log('Adding missing display_order column...');
        await db.execute(sql`
          ALTER TABLE service_prices 
          ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
        `);
        
        // Update existing records with proper display order
        // Note: Render DB uses camelCase column names
        await db.execute(sql`
          UPDATE service_prices SET display_order = 1 WHERE "serviceType" = 'monthly_fortune';
          UPDATE service_prices SET display_order = 2 WHERE "serviceType" = 'love_potential';
          UPDATE service_prices SET display_order = 3 WHERE "serviceType" = 'reunion_potential';
          UPDATE service_prices SET display_order = 4 WHERE "serviceType" = 'compatibility';
          UPDATE service_prices SET display_order = 5 WHERE "serviceType" = 'job_prospects';
          UPDATE service_prices SET display_order = 6 WHERE "serviceType" = 'marriage_potential';
          UPDATE service_prices SET display_order = 7 WHERE "serviceType" = 'comprehensive_fortune';
        `);
        
        console.log('✅ Schema fixed: display_order column added and populated');
      } else {
        console.log('✅ Schema OK: display_order column exists');
      }
    } catch (error) {
      console.error('Schema consistency check failed:', error.message);
    }
  };
  
  // Run schema check on startup
  await ensureSchemaConsistency();
  
  // Debug endpoint for troubleshooting
  app.get("/api/debug/schema", async (req, res) => {
    try {
      const { sql } = await import('drizzle-orm');
      const { db } = await import('./db');
      const { servicePrices } = await import('@shared/schema');
      
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'service_prices'
        ORDER BY ordinal_position;
      `);
      
      const testSelect = await db.select().from(servicePrices).limit(3);
      res.json({ success: true, columns: columns.rows, sampleData: testSelect });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (user.status === 'suspended') {
        return res.status(403).json({ message: "차단된 계정입니다" });
      }
      req.session = req.session || {};
      (req.session as any).userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const user = await storage.createUser(userData);
      
      // 신규 회원 혜택: 100냥 지급
      await storage.addCoins(
        user.id,
        100,
        "신규 회원 가입 축하 혜택",
        `welcome-bonus-${user.id}-${Date.now()}`
      );

      // 환영 공지 생성
      await storage.createUserNotification({
        userId: user.id,
        title: "EVERYUNSE에 오신 것을 환영합니다! 🎉",
        content: `${user.name}님, 회원가입을 축하드립니다!\n신규 회원 혜택으로 100냥을 드렸어요.\n지금 바로 사주 분석을 시작해보세요!`,
        type: "system"
      });
      
      const { password: _, ...userWithoutPassword } = user;
      req.session = req.session || {};
      (req.session as any).userId = user.id;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.status === 'suspended') {
        return res.status(403).json({ message: "Account is suspended" });
      }
      const { password: _, ...userWithoutPassword } = user;
      const hasPersonalInfo = !!(user.birthDate && user.gender);
      res.json({ user: { ...userWithoutPassword, hasPersonalInfo } });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out" });
      });
    } else {
      res.json({ message: "Logged out" });
    }
  });

  // 개인 정보 업데이트
  app.put("/api/auth/profile", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const {
        name,
        birthDate,
        birthTime,
        gender,
        calendarType,
        isLeapMonth,
        birthCountry,
        timezone,
      } = req.body;

      const updatedUser = await storage.updateUser(userId, {
        name,
        birthDate,
        birthTime,
        gender,
        calendarType,
        isLeapMonth,
        birthCountry,
        timezone,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // 개인 정보가 수정되었으므로 오늘의 운세 캐시 삭제
      await storage.deleteTodaysFortune(userId);

      // 개인정보가 새로 등록된 경우 미리 계산된 분석 생성 시작
      if (birthDate && birthTime && gender) {
        const { precomputedService } = await import('./precomputed-service');
        precomputedService.generateForNewUser(userId.toString(), {
          date: birthDate,
          time: birthTime,
          gender,
          calendarType: calendarType || 'solar',
          isLeapMonth: isLeapMonth || false,
          birthCountry: birthCountry || 'KR',
          timezone: timezone || 'Asia/Seoul'
        });
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Username availability check
  app.post("/api/auth/check-username", async (req, res) => {
    try {
      const { username } = req.body;
      console.log(`=== USERNAME CHECK === Checking: ${username}`);
      
      if (!username || username.length < 3) {
        return res.json({ 
          available: false, 
          message: "아이디는 3자 이상이어야 합니다" 
        });
      }

      // Check if username contains only English letters and numbers
      if (!/^[a-zA-Z0-9]+$/.test(username)) {
        return res.json({ 
          available: false, 
          message: "아이디는 영어와 숫자만 사용할 수 있습니다" 
        });
      }

      const existingUser = await storage.getUserByUsername(username);
      console.log(`=== USERNAME CHECK === Found user: ${existingUser ? existingUser.username : 'null'}`);
      const available = !existingUser;
      
      console.log(`=== USERNAME CHECK === Available: ${available}`);
      
      res.json({ 
        available,
        message: available ? "사용 가능한 아이디입니다" : "이미 사용 중인 아이디입니다"
      });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ 
        available: false, 
        message: "아이디 확인 중 오류가 발생했습니다" 
      });
    }
  });

  // 데모 로그인 (테스트용)
  app.post("/api/auth/demo-login", async (req, res) => {
    try {
      const user = await storage.getUser(1);
      if (!user) {
        return res
          .status(404)
          .json({ message: "데모 사용자를 찾을 수 없습니다" });
      }
      req.session = req.session || {};
      (req.session as any).userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "데모 로그인 실패" });
    }
  });

  // Middleware to require authentication
  const requireAuth = (req: any, res: any, next: any) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    (req.session as any).userId = userId;
    next();
  };

  // Saju analysis routes
  app.post("/api/saju/analyze", requireAuth, async (req, res) => {
    try {
      const {
        birthDate,
        birthTime,
        gender,
        analysisType,
        title,
        calendarType,
        isLeapMonth,
        birthCountry,
        timezone,
        partnerBirthDate,
        partnerBirthTime,
        partnerGender,
        partnerCalendarType,
        partnerIsLeapMonth,
        concern,
      } = req.body;
      const userId = (req.session as any).userId;

      // 전체 요청 데이터 로깅
      console.log("=== 전체 요청 데이터 ===");
      console.log("req.body:", JSON.stringify(req.body, null, 2));

      // 분석 타입을 서비스 타입으로 매핑
      const serviceTypeMapping: { [key: string]: string } = {
        "monthly": "monthly_fortune",
        "love": "love_potential", 
        "reunion": "reunion_potential",
        "career": "job_prospects",
        "marriage": "marriage_potential",
        "comprehensive": "comprehensive_fortune",
        "compatibility": "compatibility",
        "overall": "comprehensive_fortune"
      };
      
      const serviceType = serviceTypeMapping[analysisType] || analysisType;
      console.log(`분석 타입 매핑: ${analysisType} → ${serviceType}`);
      
      // 코인 차감 확인 - 분석 타입에 따른 서비스 가격 조회
      const servicePrice = await storage.getServicePrice(serviceType);
      if (!servicePrice) {
        console.error(`서비스 가격 정보 없음: ${analysisType} (매핑된 타입: ${serviceType})`);
        return res
          .status(500)
          .json({ message: "서비스 가격 정보를 찾을 수 없습니다." });
      }
      const currentBalance = await storage.getUserCoinBalance(userId);
      if (currentBalance < servicePrice.coinCost) {
        return res.status(402).json({
          message: `코인이 부족합니다. 필요: ${servicePrice.coinCost}개, 보유: ${currentBalance}개`,
          requiredCoins: servicePrice.coinCost,
          currentBalance: currentBalance,
        });
      }

      const birthData = {
        date: birthDate,
        time: birthTime,
        gender,
        calendarType: calendarType || "solar",
        isLeapMonth: isLeapMonth || false,
        birthCountry: birthCountry || "KR",
        timezone: timezone || "Asia/Seoul",
      };

      // Calculate detailed Saju using advanced calculator
      console.log("🔥 routes.ts에서 calculateSaju 호출 시작");
      const sajuResult = await calculateSaju({
        birthDate: birthDate,
        birthTime: birthTime,
        calendarType: calendarType === "solar" ? "solar" : "lunar",
        isLeapMonth: isLeapMonth || false,
      });

      console.log("상세 사주 계산 결과:", JSON.stringify(sajuResult, null, 2));
      
      // Calculate accurate Five Elements analysis
      const { calculateFiveElements, debugElementCalculation } = await import('./five-elements-calculator');
      debugElementCalculation(sajuResult);
      const elementAnalysis = calculateFiveElements(sajuResult);
      console.log("12신살 데이터 확인:", {
        year: sajuResult.year?.twelveSinSal,
        month: sajuResult.month?.twelveSinSal,
        day: sajuResult.day?.twelveSinSal,
        hour: sajuResult.hour?.twelveSinSal,
      });

      // 상대방 사주 계산 (궁합/재회 분석인 경우)
      let partnerSajuResult = null;
      console.log("=== 상대방 정보 디버깅 ===");
      console.log("분석 타입:", analysisType);
      console.log("상대방 생년월일:", partnerBirthDate);
      console.log("상대방 출생시간:", partnerBirthTime);
      console.log("상대방 성별:", partnerGender);
      console.log("상대방 달력:", partnerCalendarType);
      console.log("상대방 윤달:", partnerIsLeapMonth);
      
      if (
        (analysisType === "compatibility" || analysisType === "reunion") &&
        partnerBirthDate &&
        partnerBirthTime
      ) {
        console.log("상대방 사주 계산 시작...");
        try {
          partnerSajuResult = await calculateSaju({
            birthDate: partnerBirthDate,
            birthTime: partnerBirthTime,
            calendarType: partnerCalendarType === "solar" ? "solar" : "lunar",
            isLeapMonth: partnerIsLeapMonth || false,
          });
          console.log(
            "상대방 상세 사주 계산 결과:",
            JSON.stringify(partnerSajuResult, null, 2),
          );
        } catch (error) {
          console.error("상대방 사주 계산 오류:", error);
        }
      } else {
        console.log("상대방 사주 계산 조건 불충족");
      }

      // 즉시 분석 시스템 사용 (1-2초 응답)
      const { getInstantAnalysis } = await import('./instant-analysis');
      let aiResult = await getInstantAnalysis(analysisType, birthData);
      
      if (aiResult) {
        console.log(`⚡ 즉시 분석 사용: ${analysisType} (1-2초)`);
      } else {
        console.log(`⏳ 실시간 분석 실행: ${analysisType} (20-30초)`);
        // OpenAI를 사용한 실제 사주 분석 (상세 사주 데이터 포함)
        const { analyzeSaju } = await import("./openai");
        aiResult = await analyzeSaju(
          birthData,
          analysisType,
          partnerSajuResult,
        );
      }

      // 분석 결과에 상세 사주 데이터 및 정확한 오행 분석 추가
      aiResult.sajuCalculation = sajuResult;
      if (partnerSajuResult) {
        aiResult.partnerSajuCalculation = partnerSajuResult;
      }
      
      // 정확한 오행 분석으로 업데이트
      if (aiResult.elements && elementAnalysis) {
        aiResult.elements = {
          primary: elementAnalysis.primary,
          secondary: elementAnalysis.secondary,
          weakness: elementAnalysis.weakness
        };
        console.log('🎯 정확한 오행 분석 적용:', aiResult.elements);
      }

      // Create analysis record with proper title based on analysis type
      const getAnalysisTitle = (type: string) => {
        const titleMap: Record<string, string> = {
          monthly: "이번 달 운세",
          love: "연애할 수 있을까?",
          reunion: "재회 가능할까요?",
          compatibility: "궁합 분석",
          career: "취업이 안되면 어쩌죠?",
          marriage: "결혼할 수 있을까요?",
          comprehensive: "나의 종합 운세",
        };
        return titleMap[type] || `${type} 분석`;
      };

      const analysisData = insertSajuAnalysisSchema.parse({
        userId: (req.session as any).userId,
        title: title || getAnalysisTitle(analysisType),
        analysisType,
        birthData,
        result: aiResult,
        summary: (() => {
          // 운세 내용에서 첫 번째 문장 또는 150자 미리보기 추출
          const content = aiResult.fortune?.overall || 
                         aiResult.fortune?.compatibility ||
                         aiResult.fortune?.love ||
                         aiResult.fortune?.career ||
                         aiResult.fortune?.wealth ||
                         aiResult.fortune?.health ||
                         aiResult.fortune?.monthly ||
                         aiResult.fortune?.yearly ||
                         aiResult.fortune?.daily ||
                         aiResult.fortune?.marriage ||
                         aiResult.fortune?.reunion ||
                         aiResult.recommendations?.[0] ||
                         (typeof aiResult === 'string' ? aiResult : JSON.stringify(aiResult)).substring(0, 150);
          
          // 첫 번째 문장 또는 150자로 제한
          if (typeof content === 'string') {
            const firstSentence = content.split(/[.!?。]/)[0];
            return firstSentence.length > 150 ? 
              content.substring(0, 150) + '...' : 
              firstSentence + (firstSentence === content ? '' : '...');
          }
          
          return content ? String(content).substring(0, 150) + '...' : "운세 분석을 확인해보세요";
        })(),
      });

      const analysis = await storage.createSajuAnalysis(analysisData);

      // 코인 차감 실행
      const coinsSpent = await storage.spendCoins(
        userId,
        servicePrice.coinCost,
        "saju_analysis",
        `${getAnalysisTitle(analysisType)}`,
        analysis.id,
      );

      if (!coinsSpent) {
        return res.status(402).json({ message: "코인 차감에 실패했습니다." });
      }

      // If it's a career analysis, also create basic career recommendations
      if (analysisType === "career") {
        await storage.createCareerRecommendation({
          userId: userId,
          analysisId: analysis.id,
          recommendations: ["교육자", "상담사", "기획자", "창업가"],
          strengths: ["소통능력", "창의성", "리더십"],
          compatibleFields: ["교육", "상담", "기획", "경영"],
        });
      }

      const newBalance = await storage.getUserCoinBalance(userId);
      res.json({
        analysis,
        result: aiResult,
        sajuCalculation: sajuResult,
        partnerSajuCalculation: partnerSajuResult,
        coinsUsed: servicePrice?.coinCost || 0,
        remainingBalance: newBalance,
      });
    } catch (error) {
      console.error("Saju analysis error:", error);
      res
        .status(500)
        .json({ message: "Analysis failed: " + (error as Error).message });
    }
  });

  app.get("/api/saju/analyses", requireAuth, async (req, res) => {
    try {
      const analyses = await storage.getSajuAnalysesByUser(
        (req.session as any).userId,
      );
      res.json({ analyses });
    } catch (error) {
      res.status(500).json({ message: "Failed to get analyses" });
    }
  });

  app.get("/api/saju/analysis/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getSajuAnalysis(id);
      if (!analysis || analysis.userId !== (req.session as any).userId) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      res.json({ analysis });
    } catch (error) {
      res.status(500).json({ message: "Failed to get analysis" });
    }
  });

  // Career routes
  app.get("/api/career/recommendations", requireAuth, async (req, res) => {
    try {
      const recommendations = await storage.getCareerRecommendationsByUser(
        (req.session as any).userId,
      );
      res.json({ recommendations });
    } catch (error) {
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  // Contact routes
  app.get("/api/contacts", requireAuth, async (req, res) => {
    try {
      const contacts = await storage.getContactsByUser(
        (req.session as any).userId,
      );
      res.json({ contacts });
    } catch (error) {
      res.status(500).json({ message: "Failed to get contacts" });
    }
  });

  app.post("/api/contacts", requireAuth, async (req, res) => {
    try {
      const contactData = insertContactSchema.parse({
        ...req.body,
        userId: (req.session as any).userId,
      });
      const contact = await storage.createContact(contactData);
      res.json({ contact });
    } catch (error) {
      res.status(400).json({ message: "Failed to create contact" });
    }
  });

  app.put("/api/contacts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const contact = await storage.updateContact(id, updates);
      if (!contact || contact.userId !== (req.session as any).userId) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json({ contact });
    } catch (error) {
      res.status(400).json({ message: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.getContact(id);
      if (!contact || contact.userId !== (req.session as any).userId) {
        return res.status(404).json({ message: "Contact not found" });
      }
      const deleted = await storage.deleteContact(id);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Coaching routes
  app.post("/api/coaching/session", requireAuth, async (req, res) => {
    try {
      const { sessionType, topic, content } = req.body;
      const aiResponse = await provideCoaching(sessionType, topic, content);
      const sessionData = insertCoachingSessionSchema.parse({
        userId: (req.session as any).userId,
        sessionType,
        topic,
        content,
        aiResponse,
      });
      const session = await storage.createCoachingSession(sessionData);
      res.json({ session, response: aiResponse });
    } catch (error) {
      console.error("Coaching session error:", error);
      res
        .status(500)
        .json({
          message: "Coaching session failed: " + (error as Error).message,
        });
    }
  });

  app.get("/api/coaching/sessions", requireAuth, async (req, res) => {
    try {
      const sessions = await storage.getCoachingSessionsByUser(
        (req.session as any).userId,
      );
      res.json({ sessions });
    } catch (error) {
      res.status(500).json({ message: "Failed to get sessions" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser((req.session as any).userId);
      const analyses = await storage.getSajuAnalysesByUser(
        (req.session as any).userId,
      );
      const totalAnalyses = 142847; // Mock global count
      res.json({
        totalAnalyses,
        userAnalysisCount: user?.analysisCount || 0,
        recentAnalyses: analyses.slice(0, 3),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // 코인 시스템 API
  app.get("/api/coins/balance", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const balance = await storage.getUserCoinBalance(userId);
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ message: "Failed to get coin balance" });
    }
  });

  app.get("/api/coins/transactions", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const transactions = await storage.getCoinTransactions(userId);
      res.json({ transactions });
    } catch (error) {
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });

  app.get("/api/services/prices", async (req, res) => {
    try {
      const prices = await storage.getServicePrices();
      res.json({ prices });
    } catch (error) {
      res.status(500).json({ message: "Failed to get service prices" });
    }
  });

  // PortOne 채널 정보 확인 (디버깅용)
  app.get("/api/payment/channel-info", async (req, res) => {
    try {
      console.log("=== PortOne 채널 정보 확인 ===");
      console.log("Store ID:", "imp25772872");
      console.log("Channel Key:", process.env.VITE_PORTONE_CHANNEL_KEY);
      console.log("Has API Secret:", !!process.env.PORTONE_API_SECRET);
      
      res.json({
        storeId: "imp25772872",
        channelKey: process.env.VITE_PORTONE_CHANNEL_KEY || "NOT_SET",
        hasApiSecret: !!process.env.PORTONE_API_SECRET,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("채널 정보 조회 오류:", error);
      res.status(500).json({ message: "채널 정보 조회 실패" });
    }
  });

  // PortOne KG이니시스 결제 검증 API
  app.post("/api/payment/verify", async (req, res) => {
    try {
      const { paymentId, amount, coinAmount } = req.body;
      
      // 테스트 환경에서는 임시 사용자 ID 사용, 운영에서는 실제 세션 사용
      let userId = (req.session as any)?.userId;
      if (!userId) {
        // 테스트용 임시 사용자 (실제 운영에서는 제거 필요)
        userId = 1; // 기본 테스트 사용자 ID
        console.log("=== 테스트 환경: 임시 사용자 ID 사용 ===", userId);
      }
      
      if (!paymentId || !amount || !coinAmount) {
        return res.status(400).json({ 
          success: false, 
          message: "필수 파라미터가 누락되었습니다." 
        });
      }

      // PortOne API를 통한 결제 검증
      const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET || "suFnKOudX36VWVvlxhQXEoxqYnKny6gag3RTMHCzFWiyEuGZRdXuGyRv3oJBesHlBNnLj6sptDQxSDU2";
      
      try {
        // PortOne REST API를 사용한 결제 검증
        const response = await fetch(`https://api.portone.io/payments/${paymentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `PortOne ${PORTONE_API_SECRET}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Payment verification failed: ${response.status}`);
        }

        const paymentData = await response.json();
        
        // 결제 상태 및 금액 검증
        const isVerified = paymentData.status === 'PAID' && 
                          paymentData.amount.total === amount &&
                          paymentData.storeId === 'imp25772872';
        
        if (isVerified) {
          // 코인 충전
          await storage.addCoins(userId, coinAmount, "payment", `${coinAmount}냥 충전 (결제ID: ${paymentId})`);
          
          res.json({ 
            success: true, 
            message: "결제가 완료되었습니다.",
            coinAmount,
            paymentId 
          });
        } else {
          res.status(400).json({ 
            success: false, 
            message: "결제 검증에 실패했습니다." 
          });
        }
      } catch (verificationError) {
        console.error("Payment verification API error:", verificationError);
        // API 오류 시 임시로 성공 처리 (개발 단계)
        console.log(`=== 냥 충전 시작 === userId: ${userId}, coinAmount: ${coinAmount}`);
        
        try {
          await storage.addCoins(userId, coinAmount, "payment", `${coinAmount}냥 충전 (임시승인: ${paymentId})`);
          console.log(`=== 냥 충전 성공 === ${coinAmount}냥이 사용자 ${userId}에게 충전됨`);
        } catch (coinError) {
          console.error("=== 냥 충전 실패 ===", coinError);
          throw coinError;
        }
        
        res.json({ 
          success: true, 
          message: "결제가 완료되었습니다.",
          coinAmount,
          userId,
          note: "개발 단계 임시 승인"
        });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ 
        success: false, 
        message: "결제 처리 중 오류가 발생했습니다." 
      });
    }
  });

  // PortOne 웹훅 처리
  app.post("/api/payment/webhook", async (req, res) => {
    try {
      // PortOne 웹훅 데이터 처리
      const { paymentId, status, customData } = req.body;
      
      if (status === "PAID") {
        // 결제 완료 처리 로직
        console.log("Payment completed:", paymentId);
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // 기존 토스페이먼츠 API (레거시 지원)
  app.post("/api/payments/confirm", requireAuth, async (req, res) => {
    try {
      const { paymentKey, orderId, amount } = req.body;
      if (!paymentKey || !orderId || !amount) {
        return res
          .status(400)
          .json({ message: "필수 파라미터가 누락되었습니다." });
      }
      const secretKey = "test_sk_EP59LybZ8B6jyY5AEQG486GYo7pR";
      const encryptedSecretKey =
        "Basic " + Buffer.from(secretKey + ":").toString("base64");
      const response = await fetch(
        "https://api.tosspayments.com/v1/payments/confirm",
        {
          method: "POST",
          body: JSON.stringify({ orderId, amount, paymentKey }),
          headers: {
            Authorization: encryptedSecretKey,
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      console.log("토스페이먼츠 결제 승인 응답:", data);

      if (response.ok) {
        const userId = (req.session as any).userId;
        const coinAmount = Math.floor(parseInt(amount) / 200);
        await storage.addCoins(
          userId,
          coinAmount,
          `토스페이먼츠 결제 충전 (${coinAmount}코인, ${parseInt(amount).toLocaleString()}원)`,
          paymentKey,
        );
        res.json({
          data: data,
          success: true,
          coinAmount,
          message: `${coinAmount}코인이 충전되었습니다.`,
        });
      } else {
        res
          .status(400)
          .json({ message: "결제 승인에 실패했습니다.", error: data });
      }
    } catch (error) {
      console.error("결제 승인 오류:", error);
      res.status(500).json({ message: "결제 승인 중 오류가 발생했습니다." });
    }
  });

  // Reviews API
  app.get("/api/reviews", async (req, res) => {
    try {
      const { serviceType } = req.query;
      const reviews = await storage.getReviews(serviceType as string);
      res.json({ reviews });
    } catch (error) {
      res.status(500).json({ message: "Failed to get reviews" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const demoUser = await storage.getUser(1);
      if (!demoUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId: demoUser.id,
        username: demoUser.name,
      });
      const review = await storage.createReview(reviewData);
      res.json({ review });
    } catch (error) {
      console.error("Create review error:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Customer support routes
  app.post("/api/customer-support/inquiries", requireAuth, async (req, res) => {
    try {
      const { title, content, category, priority } = req.body;
      const sessionUserId = (req.session as any).userId;
      
      const inquiry = await storage.createInquiry({
        userId: sessionUserId,
        subject: title,
        content,
        priority: priority || "normal",
        status: "pending"
      });

      res.json(inquiry);
    } catch (error) {
      console.error("Error creating inquiry:", error);
      res.status(500).json({ message: "문의 생성 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/customer-support/reports", requireAuth, async (req, res) => {
    try {
      const { title, description, reportType, targetType, targetId, reporterId, reporterName, priority } = req.body;
      const sessionUserId = (req.session as any).userId;
      
      const report = await storage.createReport({
        reporterUserId: sessionUserId,
        reportedUserId: targetId ? parseInt(targetId) : null,
        type: reportType,
        reason: `${title}\n\n${description}`,
        status: "pending"
      });

      res.json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ message: "신고 생성 중 오류가 발생했습니다." });
    }
  });

  // User notifications API
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req.session as any).userId;
      const notifications = await storage.getUserNotifications(sessionUserId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "알림을 가져오는 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const sessionUserId = (req.session as any).userId;
      
      await storage.markNotificationAsRead(notificationId, sessionUserId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "알림 읽음 처리 중 오류가 발생했습니다." });
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req.session as any).userId;
      const count = await storage.getUnreadNotificationCount(sessionUserId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "읽지 않은 알림 수를 가져오는 중 오류가 발생했습니다." });
    }
  });

  // 전체 플랫폼 분석 수 API (모든 사용자 분석 수 + 731)
  app.get("/api/platform/total-analyses", async (req, res) => {
    try {
      // Disable all caching
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      // 모든 사용자의 분석 수를 합산
      const allAnalyses = await storage.getAllAnalyses();
      const totalUserAnalyses = allAnalyses.length;
      
      // 731을 더해서 전체 플랫폼 분석 수 계산
      const totalPlatformAnalyses = totalUserAnalyses + 731;
      
      console.log(`=== PLATFORM TOTAL ANALYSES ===`);
      console.log(`User analyses: ${totalUserAnalyses}`);
      console.log(`Base count: 731`);
      console.log(`Total: ${totalPlatformAnalyses}`);
      
      res.json({ 
        totalAnalyses: totalPlatformAnalyses,
        userAnalyses: totalUserAnalyses,
        baseCount: 731
      });
    } catch (error) {
      console.error("Platform stats error:", error);
      res.status(500).json({ message: "Failed to get platform stats" });
    }
  });

  // Dashboard stats API - FORCE NO CACHE with version parameter
  app.get("/api/dashboard/stats/v2", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      
      console.log(`=== DASHBOARD STATS REQUEST === User: ${userId}`);
      
      // Disable all caching at Express level
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('ETag', ''); // Disable ETag
      res.set('Last-Modified', ''); // Disable Last-Modified
      
      // Get total analyses count across all users with debugging
      const totalAnalyses = await storage.getTotalAnalysesCount();
      console.log(`=== Raw total from storage: ${totalAnalyses} ===`);
      
      // Get user's actual analysis count from database with debugging  
      const userAnalysisCount = await storage.getUserAnalysesCount(userId);
      console.log(`=== Raw user count from storage: ${userAnalysisCount} ===`);
      
      // Get recent analyses for user (limit 3)
      const recentAnalyses = await storage.getRecentSajuAnalysesByUser(userId, 3);
      console.log(`=== Recent analyses count: ${recentAnalyses.length} ===`);
      
      const response = {
        totalAnalyses,
        userAnalysisCount,
        recentAnalyses,
        timestamp: Date.now() // Add timestamp to ensure unique responses
      };
      
      console.log(`=== SENDING DASHBOARD RESPONSE ===`, JSON.stringify(response, null, 2));
      
      res.json(response);
    } catch (error) {
      console.error("=== Dashboard stats error ===", error);
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  // 기존 사용자들의 미리 계산된 분석 일괄 생성 API
  app.post("/api/admin/generate-precomputed-analyses", async (req, res) => {
    try {
      const { precomputedService } = await import('./precomputed-service');
      
      console.log("🚀 미리 계산된 분석 일괄 생성 시작");
      
      // 백그라운드에서 비동기 실행
      precomputedService.generateForAllExistingUsers().then(() => {
        console.log("✅ 미리 계산된 분석 일괄 생성 완료");
      }).catch((error) => {
        console.error("❌ 미리 계산된 분석 생성 실패:", error);
      });
      
      res.json({ 
        message: "미리 계산된 분석 생성을 시작했습니다. 백그라운드에서 처리됩니다.",
        status: "started"
      });
    } catch (error) {
      console.error("미리 계산된 분석 생성 실패:", error);
      res.status(500).json({ message: "미리 계산된 분석 생성에 실패했습니다" });
    }
  });

  // Service Prices API
  app.get("/api/service-prices", async (req, res) => {
    try {
      const servicePrices = await storage.getServicePrices();
      // Sort by display_order to match home screen sequence
      servicePrices.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));
      res.json({ servicePrices });
    } catch (error) {
      console.error("Service prices error:", error);
      res.status(500).json({ message: "Failed to get service prices" });
    }
  });

  // 오늘의 운세 API (한국 시간 기준 00시 00분 초기화)
  app.get("/api/daily-fortune", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }

      // 한국 시간 기준으로 오늘의 운세가 이미 생성되었는지 확인
      const { exists, fortune: cachedFortune } = await storage.hasTodaysFortune(userId);

      if (exists && cachedFortune) {
        // 한국 시간 기준 오늘의 운세가 이미 생성되어 있으면 바로 반환
        return res.json({
          fortune: cachedFortune.fortune,
          cached: true,
          date: cachedFortune.fortuneDate,
          generatedAt: cachedFortune.createdAt,
          message: "한국 시간 기준으로 생성된 오늘의 운세입니다."
        });
      }

      // 캐시된 운세가 없으면 새로 생성
      if (!user.birthDate || !user.birthTime || !user.gender) {
        return res.status(400).json({
          message:
            "개인정보가 부족합니다. 마이페이지에서 생년월일, 출생시간, 성별을 입력해주세요.",
        });
      }

      // 한국 시간 기준 오늘 날짜 가져오기
      const koreanToday = await storage.getKoreanToday();

      const birthData = {
        date: user.birthDate,
        time: user.birthTime,
        gender: user.gender,
        calendarType: user.calendarType || "양력",
        isLeapMonth: user.isLeapMonth || false,
        birthCountry: user.birthCountry || "대한민국",
        timezone: user.timezone || "Asia/Seoul",
      };

      // OpenAI API로 오늘의 운세 생성
      const newFortune = await generateDailyFortune(birthData, koreanToday);

      // 캐시에 저장
      await storage.createDailyFortune({
        userId,
        fortuneDate: koreanToday,
        fortune: newFortune,
      });

      res.json({
        fortune: newFortune,
        cached: false,
        date: koreanToday,
        message: "새로운 오늘의 운세가 생성되었습니다."
      });
    } catch (error) {
      console.error("Daily fortune error:", error);
      res
        .status(500)
        .json({ message: "오늘의 운세를 가져오는 중 오류가 발생했습니다." });
    }
  });

  // Korean Time API endpoint
  app.get("/api/time/korean", (req, res) => {
    res.json({
      currentTime: getCurrentKoreanTimeString(),
      timezone: 'Asia/Seoul',
      offset: '+09:00'
    });
  });

  // Register admin routes
  registerAdminRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
