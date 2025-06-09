#!/usr/bin/env node

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from "ws";
// Schema will be created via raw SQL

// Configure WebSocket for Neon
if (typeof WebSocket === 'undefined') {
  global.WebSocket = ws;
}

async function createSchema() {
  try {
    console.log('=== CREATING DATABASE SCHEMA ===');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    console.log('Connecting to database...');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });
    
    console.log('Creating tables...');
    
    // Create all tables using raw SQL
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid varchar PRIMARY KEY,
        sess jsonb NOT NULL,
        expire timestamp NOT NULL
      );
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    `);
    
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
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id serial PRIMARY KEY,
        username varchar(255) UNIQUE NOT NULL,
        password_hash varchar(255) NOT NULL,
        email varchar(255),
        role varchar(50) DEFAULT 'admin',
        is_active boolean DEFAULT true,
        last_login timestamp,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      );
    `);
    
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
    
    // Insert default service prices
    console.log('Inserting default service prices...');
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
    
    console.log('✅ Default service prices inserted');
    console.log('=== SCHEMA CREATION COMPLETE ===');
    
    await pool.end();
    
  } catch (error) {
    console.error('Schema creation failed:', error);
    process.exit(1);
  }
}

createSchema();