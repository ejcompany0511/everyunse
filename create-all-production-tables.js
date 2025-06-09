import { Pool } from 'pg';

async function createAllTables() {
  console.log('Creating all required tables in production...');
  
  const client = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to production database');

    // Create all required tables with camelCase columns
    const tableCreationQueries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR UNIQUE NOT NULL,
        email VARCHAR UNIQUE NOT NULL,
        password VARCHAR NOT NULL,
        name VARCHAR,
        "phoneNumber" VARCHAR,
        "birthDate" VARCHAR,
        "birthTime" VARCHAR,
        gender VARCHAR,
        "calendarType" VARCHAR DEFAULT 'solar',
        "isLeapMonth" BOOLEAN DEFAULT false,
        "birthCountry" VARCHAR DEFAULT 'KR',
        timezone VARCHAR DEFAULT 'Asia/Seoul',
        "marketingConsent" BOOLEAN DEFAULT false,
        "coinBalance" INTEGER DEFAULT 100,
        status VARCHAR DEFAULT 'active',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );`,

      // Service prices table  
      `CREATE TABLE IF NOT EXISTS "servicePrices" (
        id SERIAL PRIMARY KEY,
        "serviceType" VARCHAR NOT NULL UNIQUE,
        "coinCost" INTEGER NOT NULL DEFAULT 0,
        "displayOrder" INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );`,

      // Saju analyses table
      `CREATE TABLE IF NOT EXISTS "sajuAnalyses" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        "analysisType" VARCHAR NOT NULL,
        title VARCHAR NOT NULL,
        content TEXT NOT NULL,
        "birthDate" VARCHAR NOT NULL,
        "birthTime" VARCHAR NOT NULL,
        gender VARCHAR NOT NULL,
        "calendarType" VARCHAR DEFAULT 'solar',
        "isLeapMonth" BOOLEAN DEFAULT false,
        "fourPillars" JSONB,
        elements JSONB,
        personality JSONB,
        fortune JSONB,
        recommendations TEXT[],
        "partnerBirthDate" VARCHAR,
        "partnerBirthTime" VARCHAR,
        "partnerGender" VARCHAR,
        "partnerCalendarType" VARCHAR,
        "partnerIsLeapMonth" BOOLEAN,
        "partnerFourPillars" JSONB,
        "partnerElements" JSONB,
        "partnerPersonality" JSONB,
        "compatibilityScore" INTEGER,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );`,

      // Coin transactions table
      `CREATE TABLE IF NOT EXISTS "coinTransactions" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        amount INTEGER NOT NULL,
        type VARCHAR NOT NULL,
        description TEXT NOT NULL,
        "paymentId" VARCHAR,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );`,

      // Reviews table
      `CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        username VARCHAR NOT NULL,
        "serviceType" VARCHAR NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        "approvalStatus" VARCHAR DEFAULT 'pending',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );`,

      // Daily fortunes table
      `CREATE TABLE IF NOT EXISTS "dailyFortunes" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        "fortuneDate" VARCHAR NOT NULL,
        content TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        UNIQUE("userId", "fortuneDate")
      );`,

      // User reports table
      `CREATE TABLE IF NOT EXISTS "userReports" (
        id SERIAL PRIMARY KEY,
        "reporterUserId" INTEGER REFERENCES users(id),
        "reportedUserId" INTEGER,
        category VARCHAR NOT NULL,
        reason TEXT NOT NULL,
        description TEXT,
        status VARCHAR DEFAULT 'pending',
        priority VARCHAR DEFAULT 'normal',
        "adminResponse" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );`,

      // Inquiries table
      `CREATE TABLE IF NOT EXISTS inquiries (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        subject VARCHAR NOT NULL,
        content TEXT NOT NULL,
        priority VARCHAR DEFAULT 'normal',
        status VARCHAR DEFAULT 'pending',
        "adminResponse" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );`,

      // User notifications table
      `CREATE TABLE IF NOT EXISTS "userNotifications" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        title VARCHAR NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR DEFAULT 'system',
        "isRead" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );`,

      // Admin users table
      `CREATE TABLE IF NOT EXISTS "adminUsers" (
        id SERIAL PRIMARY KEY,
        username VARCHAR UNIQUE NOT NULL,
        password VARCHAR NOT NULL,
        email VARCHAR,
        role VARCHAR DEFAULT 'admin',
        "isActive" BOOLEAN DEFAULT true,
        "lastLoginAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );`,

      // Admin logs table
      `CREATE TABLE IF NOT EXISTS "adminLogs" (
        id SERIAL PRIMARY KEY,
        "adminId" INTEGER REFERENCES "adminUsers"(id),
        action VARCHAR NOT NULL,
        target VARCHAR,
        "targetId" INTEGER,
        details JSONB,
        "ipAddress" VARCHAR,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );`,

      // System notifications table
      `CREATE TABLE IF NOT EXISTS "systemNotifications" (
        id SERIAL PRIMARY KEY,
        title VARCHAR NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR DEFAULT 'info',
        "isActive" BOOLEAN DEFAULT true,
        "targetAudience" VARCHAR DEFAULT 'all',
        "expiresAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );`,

      // Announcements table
      `CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title VARCHAR NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR DEFAULT 'general',
        "isActive" BOOLEAN DEFAULT true,
        "isPinned" BOOLEAN DEFAULT false,
        "expiresAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );`,

      // Contacts table
      `CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        name VARCHAR NOT NULL,
        "phoneNumber" VARCHAR,
        email VARCHAR,
        relationship VARCHAR,
        "birthDate" VARCHAR,
        "birthTime" VARCHAR,
        gender VARCHAR,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );`,

      // Career recommendations table
      `CREATE TABLE IF NOT EXISTS "careerRecommendations" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        title VARCHAR NOT NULL,
        content TEXT NOT NULL,
        "birthDate" VARCHAR NOT NULL,
        "birthTime" VARCHAR NOT NULL,
        gender VARCHAR NOT NULL,
        "suitableJobs" TEXT[],
        strengths TEXT[],
        "compatibleFields" TEXT[],
        "workStyle" TEXT,
        leadership TEXT,
        teamwork TEXT,
        recommendations TEXT[],
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );`,

      // Coaching sessions table
      `CREATE TABLE IF NOT EXISTS "coachingSessions" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        "sessionType" VARCHAR NOT NULL,
        topic VARCHAR NOT NULL,
        content TEXT NOT NULL,
        response TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );`,

      // Precomputed analyses table
      `CREATE TABLE IF NOT EXISTS "precomputedAnalyses" (
        id SERIAL PRIMARY KEY,
        "analysisType" VARCHAR NOT NULL,
        "birthDataHash" VARCHAR NOT NULL,
        content JSONB NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        UNIQUE("analysisType", "birthDataHash")
      );`
    ];

    // Execute all table creation queries
    for (const query of tableCreationQueries) {
      await client.query(query);
    }

    console.log('✅ All tables created successfully');

    // First, alter the description column to allow NULL values if it doesn't
    await client.query(`
      ALTER TABLE "servicePrices" ALTER COLUMN description DROP NOT NULL;
    `);

    // Insert service prices data
    await client.query(`
      INSERT INTO "servicePrices" ("serviceType", "coinCost", "displayOrder", description) VALUES
      ('saju_analysis', 0, 1, '기본 사주 분석'),
      ('monthly_fortune', 0, 2, '월간 운세'),
      ('love_potential', 25, 3, '애정운 분석'),
      ('reunion_potential', 25, 4, '재회 가능성'),
      ('compatibility', 25, 5, '궁합 분석'),
      ('job_prospects', 0, 6, '취업운'),
      ('marriage_potential', 0, 7, '결혼운'),
      ('comprehensive_fortune', 30, 8, '종합 운세')
      ON CONFLICT ("serviceType") DO NOTHING;
    `);

    console.log('✅ Service prices initialized');

    // Create admin user if not exists
    const adminCheck = await client.query(`
      SELECT id FROM "adminUsers" WHERE username = 'EJCompany0511';
    `);

    if (adminCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO "adminUsers" (username, password, email, role) 
        VALUES ('EJCompany0511', 'Ej960511?', 'ejcompany0511@gmail.com', 'super_admin');
      `);
      console.log('✅ Admin user created');
    }

    console.log('Production database setup completed successfully!');

  } catch (error) {
    console.error('Error setting up production database:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Set environment variable for production database
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

createAllTables().catch(console.error);