#!/usr/bin/env node

// This script sets up the database schema on Render's new PostgreSQL instance
// Run this on Render by setting DATABASE_URL to the new database connection string

import { Pool } from '@neondatabase/serverless';
import ws from "ws";

// Configure WebSocket for Neon compatibility
if (typeof WebSocket === 'undefined') {
  global.WebSocket = ws;
}

async function setupRenderDatabase() {
  try {
    console.log('=== RENDER DATABASE SETUP ===');
    
    // Use the new database URL that should be set in Render environment
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    console.log('Connecting to new Render database...');
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('Creating all required tables...');
    
    // Create sessions table (required for auth)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid varchar PRIMARY KEY,
        sess jsonb NOT NULL,
        expire timestamp NOT NULL
      );
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    `);
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id serial PRIMARY KEY,
        username varchar(255) UNIQUE,
        email varchar(255),
        password_hash varchar(255),
        phone_number varchar(20),
        gender varchar(10),
        birth_date varchar(20),
        birth_time varchar(10),
        calendar_type varchar(10),
        is_leap_month boolean DEFAULT false,
        coin_balance integer DEFAULT 0,
        marketing_consent boolean DEFAULT false,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      );
    `);
    
    // Create admin_users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "adminUsers" (
        id serial PRIMARY KEY,
        username varchar(255) UNIQUE NOT NULL,
        "passwordHash" varchar(255) NOT NULL,
        email varchar(255),
        role varchar(50) DEFAULT 'admin',
        "isActive" boolean DEFAULT true,
        "lastLogin" timestamp,
        "createdAt" timestamp DEFAULT NOW(),
        "updatedAt" timestamp DEFAULT NOW()
      );
    `);
    
    // Create saju_analyses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saju_analyses (
        id serial PRIMARY KEY,
        user_id integer REFERENCES users(id),
        analysis_type varchar(100) NOT NULL,
        birth_data jsonb NOT NULL,
        saju_result jsonb NOT NULL,
        ai_analysis text,
        created_at timestamp DEFAULT NOW()
      );
    `);
    
    // Create career_recommendations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS career_recommendations (
        id serial PRIMARY KEY,
        user_id integer REFERENCES users(id),
        birth_data jsonb NOT NULL,
        saju_result jsonb NOT NULL,
        career_analysis text,
        created_at timestamp DEFAULT NOW()
      );
    `);
    
    // Create coaching_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coaching_sessions (
        id serial PRIMARY KEY,
        user_id integer REFERENCES users(id),
        session_type varchar(100) NOT NULL,
        topic varchar(255) NOT NULL,
        content text NOT NULL,
        ai_response text,
        created_at timestamp DEFAULT NOW()
      );
    `);
    
    // Create coin_transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coin_transactions (
        id serial PRIMARY KEY,
        user_id integer REFERENCES users(id),
        amount integer NOT NULL,
        transaction_type varchar(50) NOT NULL,
        description text,
        payment_id varchar(255),
        reference_id integer,
        created_at timestamp DEFAULT NOW()
      );
    `);
    
    // Create service_prices table (CRITICAL for the application)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_prices (
        id serial PRIMARY KEY,
        service_type varchar(100) UNIQUE NOT NULL,
        coin_cost integer NOT NULL,
        description text,
        is_active boolean DEFAULT true,
        display_order integer DEFAULT 0,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      );
    `);
    
    // Create reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id serial PRIMARY KEY,
        user_id integer REFERENCES users(id),
        service_type varchar(100) NOT NULL,
        rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment text,
        is_approved boolean DEFAULT false,
        admin_response text,
        created_at timestamp DEFAULT NOW()
      );
    `);
    
    // Create daily_fortunes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_fortunes (
        id serial PRIMARY KEY,
        user_id integer REFERENCES users(id),
        fortune_date varchar(10) NOT NULL,
        fortune_content text NOT NULL,
        created_at timestamp DEFAULT NOW(),
        UNIQUE(user_id, fortune_date)
      );
    `);
    
    // Create user_reports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_reports (
        id serial PRIMARY KEY,
        user_id integer REFERENCES users(id),
        report_type varchar(100) NOT NULL,
        title varchar(255) NOT NULL,
        description text NOT NULL,
        status varchar(50) DEFAULT 'pending',
        admin_response text,
        priority varchar(20) DEFAULT 'medium',
        resolved_at timestamp,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      );
    `);
    
    // Create inquiries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id serial PRIMARY KEY,
        user_id integer REFERENCES users(id),
        inquiry_type varchar(100) NOT NULL,
        title varchar(255) NOT NULL,
        content text NOT NULL,
        status varchar(50) DEFAULT 'pending',
        admin_response text,
        resolved_at timestamp,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      );
    `);
    
    // Create user_notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id serial PRIMARY KEY,
        user_id integer REFERENCES users(id),
        title varchar(255) NOT NULL,
        message text NOT NULL,
        notification_type varchar(50) DEFAULT 'info',
        is_read boolean DEFAULT false,
        created_at timestamp DEFAULT NOW()
      );
    `);
    
    // Create system_notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_notifications (
        id serial PRIMARY KEY,
        title varchar(255) NOT NULL,
        message text NOT NULL,
        notification_type varchar(50) DEFAULT 'info',
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      );
    `);
    
    // Create announcements table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id serial PRIMARY KEY,
        title varchar(255) NOT NULL,
        content text NOT NULL,
        announcement_type varchar(50) DEFAULT 'general',
        is_active boolean DEFAULT true,
        priority integer DEFAULT 0,
        start_date timestamp,
        end_date timestamp,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      );
    `);
    
    // Create admin_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id serial PRIMARY KEY,
        admin_id integer REFERENCES admin_users(id),
        action varchar(255) NOT NULL,
        target_type varchar(100),
        target_id integer,
        details jsonb,
        ip_address varchar(45),
        created_at timestamp DEFAULT NOW()
      );
    `);
    
    // Create precomputed_analyses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS precomputed_analyses (
        id serial PRIMARY KEY,
        analysis_type varchar(100) NOT NULL,
        birth_data_hash varchar(255) NOT NULL,
        analysis_result jsonb NOT NULL,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW(),
        UNIQUE(analysis_type, birth_data_hash)
      );
    `);
    
    console.log('✅ All tables created successfully');
    
    // Insert critical service prices data
    console.log('Inserting essential service prices...');
    await pool.query(`
      INSERT INTO service_prices (service_type, coin_cost, description, display_order) VALUES
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
      ON CONFLICT (service_type) DO NOTHING;
    `);
    
    // Create default admin user
    console.log('Creating default admin user...');
    await pool.query(`
      INSERT INTO admin_users (username, password_hash, email, role) VALUES
      ('EJCompany0511', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ejcompany0511@gmail.com', 'super_admin')
      ON CONFLICT (username) DO NOTHING;
    `);
    
    console.log('✅ Service prices and admin user created');
    
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
    console.log('=== RENDER DATABASE SETUP COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupRenderDatabase();