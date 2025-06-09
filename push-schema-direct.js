#!/usr/bin/env node

import { Pool } from '@neondatabase/serverless';
import ws from "ws";

// Configure WebSocket for Neon compatibility
if (typeof WebSocket === 'undefined') {
  global.WebSocket = ws;
}

async function pushSchemaToRender() {
  try {
    console.log('=== PUSHING CAMELCASE SCHEMA TO RENDER ===');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    console.log('Connecting to Render database...');
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    // Drop all existing tables first
    console.log('Dropping existing tables...');
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    
    console.log('Creating camelCase tables...');
    
    // Create sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid varchar PRIMARY KEY,
        sess jsonb NOT NULL,
        expire timestamp NOT NULL
      );
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    `);
    
    // Create users table with camelCase columns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id serial PRIMARY KEY,
        username text UNIQUE NOT NULL,
        email text UNIQUE NOT NULL,
        password text NOT NULL,
        name text NOT NULL,
        phone text,
        "marketingConsent" boolean DEFAULT false,
        "birthDate" text,
        "birthTime" text,
        "birthTimeUnknown" boolean DEFAULT false,
        gender text,
        "calendarType" text DEFAULT '양력',
        "isLeapMonth" boolean DEFAULT false,
        "birthCountry" text DEFAULT '대한민국',
        timezone text DEFAULT 'Asia/Seoul',
        "analysisCount" integer DEFAULT 0,
        "coinBalance" integer DEFAULT 0 NOT NULL,
        status text DEFAULT 'normal' NOT NULL,
        "isActive" boolean DEFAULT true NOT NULL,
        "createdAt" timestamp DEFAULT NOW()
      );
    `);
    
    // Create servicePrices table with camelCase columns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "servicePrices" (
        id serial PRIMARY KEY,
        "serviceType" text UNIQUE NOT NULL,
        "coinCost" integer NOT NULL,
        description text NOT NULL,
        "displayOrder" integer DEFAULT 0 NOT NULL,
        "isActive" boolean DEFAULT true NOT NULL,
        "createdAt" timestamp DEFAULT NOW(),
        "updatedAt" timestamp DEFAULT NOW()
      );
    `);
    
    // Create sajuAnalyses table with camelCase columns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "sajuAnalyses" (
        id serial PRIMARY KEY,
        "userId" integer NOT NULL,
        title text NOT NULL,
        "analysisType" text NOT NULL,
        "serviceType" text,
        "birthData" jsonb NOT NULL,
        result jsonb NOT NULL,
        summary text NOT NULL,
        "createdAt" timestamp DEFAULT NOW()
      );
    `);
    
    // Create careerRecommendations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "careerRecommendations" (
        id serial PRIMARY KEY,
        "userId" integer NOT NULL,
        "analysisId" integer NOT NULL,
        recommendations jsonb NOT NULL,
        strengths jsonb NOT NULL,
        "compatibleFields" jsonb NOT NULL,
        "createdAt" timestamp DEFAULT NOW()
      );
    `);
    
    // Create contacts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id serial PRIMARY KEY,
        "userId" integer NOT NULL,
        name text NOT NULL,
        phone text,
        email text,
        relationship text,
        "birthDate" text,
        notes text,
        "createdAt" timestamp DEFAULT NOW()
      );
    `);
    
    // Create coachingSessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "coachingSessions" (
        id serial PRIMARY KEY,
        "userId" integer NOT NULL,
        "sessionType" text NOT NULL,
        topic text NOT NULL,
        content text NOT NULL,
        "aiResponse" text NOT NULL,
        status text DEFAULT 'completed',
        "createdAt" timestamp DEFAULT NOW()
      );
    `);
    
    // Create coinTransactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "coinTransactions" (
        id serial PRIMARY KEY,
        "userId" integer NOT NULL,
        type text NOT NULL,
        amount integer NOT NULL,
        "balanceAfter" integer NOT NULL,
        description text NOT NULL,
        "serviceType" text,
        "referenceId" integer,
        "paymentId" text,
        "createdAt" timestamp DEFAULT NOW()
      );
    `);
    
    // Create reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id serial PRIMARY KEY,
        "userId" integer NOT NULL,
        username text NOT NULL,
        "serviceType" text NOT NULL,
        rating integer NOT NULL,
        title text NOT NULL,
        content text NOT NULL,
        "isHelpful" boolean DEFAULT false,
        "helpfulCount" integer DEFAULT 0,
        "approvalStatus" text DEFAULT 'pending' NOT NULL,
        "createdAt" timestamp DEFAULT NOW()
      );
    `);
    
    // Create dailyFortunes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "dailyFortunes" (
        id serial PRIMARY KEY,
        "userId" integer NOT NULL,
        "fortuneDate" text NOT NULL,
        fortune text NOT NULL,
        "createdAt" timestamp DEFAULT NOW(),
        UNIQUE("userId", "fortuneDate")
      );
    `);
    
    // Create precomputedAnalyses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "precomputedAnalyses" (
        id serial PRIMARY KEY,
        "userId" integer NOT NULL,
        "analysisType" text NOT NULL,
        "birthData" jsonb NOT NULL,
        result jsonb NOT NULL,
        "validUntil" timestamp NOT NULL,
        "generatedAt" timestamp DEFAULT NOW(),
        "isActive" boolean DEFAULT true
      );
    `);
    
    // Create adminUsers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "adminUsers" (
        id serial PRIMARY KEY,
        username text UNIQUE NOT NULL,
        email text UNIQUE NOT NULL,
        password text NOT NULL,
        role text NOT NULL DEFAULT 'operator',
        permissions jsonb DEFAULT '{}',
        "isActive" boolean DEFAULT true,
        "lastLogin" timestamp,
        "createdAt" timestamp DEFAULT NOW(),
        "updatedAt" timestamp DEFAULT NOW()
      );
    `);
    
    // Create adminLogs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "adminLogs" (
        id serial PRIMARY KEY,
        "adminId" integer,
        action text NOT NULL,
        "targetType" text,
        "targetId" integer,
        description text,
        "ipAddress" text,
        "userAgent" text,
        "createdAt" timestamp DEFAULT NOW()
      );
    `);
    
    // Create userSuspensions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "userSuspensions" (
        id serial PRIMARY KEY,
        "userId" integer,
        "adminId" integer,
        reason text NOT NULL,
        "startDate" timestamp DEFAULT NOW(),
        "endDate" timestamp,
        "isActive" boolean DEFAULT true,
        "createdAt" timestamp DEFAULT NOW()
      );
    `);
    
    // Create userReports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "userReports" (
        id serial PRIMARY KEY,
        "reporterUserId" integer,
        "reportedUserId" integer,
        type text NOT NULL,
        reason text NOT NULL,
        status text DEFAULT 'pending',
        "adminId" integer,
        "adminNotes" text,
        "resolvedAt" timestamp,
        "createdAt" timestamp DEFAULT NOW()
      );
    `);
    
    // Create inquiries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id serial PRIMARY KEY,
        "userId" integer,
        subject text NOT NULL,
        content text NOT NULL,
        status text DEFAULT 'pending',
        priority text DEFAULT 'normal',
        "adminId" integer,
        response text,
        "respondedAt" timestamp,
        "createdAt" timestamp DEFAULT NOW()
      );
    `);
    
    // Create systemNotifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "systemNotifications" (
        id serial PRIMARY KEY,
        title text NOT NULL,
        content text NOT NULL,
        type text NOT NULL,
        "targetUserIds" jsonb,
        "isActive" boolean DEFAULT true,
        "startDate" timestamp DEFAULT NOW(),
        "endDate" timestamp,
        "createdBy" integer,
        "createdAt" timestamp DEFAULT NOW()
      );
    `);
    
    // Create userNotifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "userNotifications" (
        id serial PRIMARY KEY,
        "userId" integer NOT NULL,
        title text NOT NULL,
        content text NOT NULL,
        type text NOT NULL,
        "isRead" boolean DEFAULT false,
        "relatedId" integer,
        "createdAt" timestamp DEFAULT NOW()
      );
    `);
    
    // Create announcements table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id serial PRIMARY KEY,
        title text NOT NULL,
        content text NOT NULL,
        type text NOT NULL,
        priority text NOT NULL,
        "targetAudience" text NOT NULL,
        "adminId" integer NOT NULL,
        "isActive" boolean DEFAULT true,
        "createdAt" timestamp DEFAULT NOW()
      );
    `);
    
    // Create salesStats table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "salesStats" (
        id serial PRIMARY KEY,
        date date NOT NULL,
        "totalRevenue" text DEFAULT '0',
        "totalTransactions" integer DEFAULT 0,
        "newUsers" integer DEFAULT 0,
        "activeUsers" integer DEFAULT 0,
        "topProducts" jsonb DEFAULT '{}',
        "conversionRate" text DEFAULT '0',
        "createdAt" timestamp DEFAULT NOW()
      );
    `);
    
    console.log('✅ All camelCase tables created successfully');
    
    // Insert essential service prices data
    console.log('Inserting service prices...');
    await pool.query(`
      INSERT INTO "servicePrices" ("serviceType", "coinCost", description, "displayOrder") VALUES
      ('saju_analysis', 0, '기본 사주 분석', 1),
      ('personality_analysis', 0, '성격 분석', 2),
      ('career_analysis', 0, '직업 운세', 3),
      ('love_analysis', 0, '애정 운세', 4),
      ('fortune_analysis', 0, '재물 운세', 5),
      ('health_analysis', 0, '건강 운세', 6),
      ('comprehensive_fortune', 30, '종합 운세', 7),
      ('compatibility', 25, '궁합 분석', 8),
      ('love_potential', 25, '연애 가능성', 9),
      ('reunion_potential', 25, '재회 가능성', 10)
      ON CONFLICT ("serviceType") DO NOTHING;
    `);
    
    console.log('✅ Service prices inserted');
    
    // Verify tables exist
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('✅ Database tables verified:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    await pool.end();
    console.log('=== CAMELCASE SCHEMA PUSH COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Schema push failed:', error);
    process.exit(1);
  }
}

pushSchemaToRender();