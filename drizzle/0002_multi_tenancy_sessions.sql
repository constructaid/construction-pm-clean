-- Migration: Multi-tenancy and Persistent Sessions
-- Generated: 2026-01-26
-- Description: Adds companyId to users and projects tables for multi-tenancy,
--              and creates sessions table for persistent session management

-- ========================================
-- MULTI-TENANCY SUPPORT
-- ========================================

-- Add companyId to users table (nullable for existing users)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);

-- Create index for company lookups on users
CREATE INDEX IF NOT EXISTS users_company_id_idx ON users(company_id);

-- Add companyId to projects table (nullable for existing projects)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);

-- Create index for company lookups on projects
CREATE INDEX IF NOT EXISTS projects_company_id_idx ON projects(company_id);

-- ========================================
-- PERSISTENT SESSIONS TABLE
-- ========================================

-- Create sessions table for persistent authentication sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_fingerprint VARCHAR(255),
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP,
  revoked_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for session lookups
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS sessions_is_revoked_idx ON sessions(is_revoked) WHERE is_revoked = FALSE;

-- ========================================
-- UPDATE EXISTING DATA (Optional)
-- ========================================

-- If you have existing projects without companyId, you may want to:
-- 1. Create a default company for migration
-- 2. Assign existing projects to that company
--
-- Example:
-- INSERT INTO companies (name, slug, created_at, updated_at)
-- VALUES ('Default Company', 'default', NOW(), NOW())
-- ON CONFLICT (slug) DO NOTHING;
--
-- UPDATE projects SET company_id = (SELECT id FROM companies WHERE slug = 'default')
-- WHERE company_id IS NULL;

-- ========================================
-- COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON COLUMN users.company_id IS 'Foreign key to companies table for multi-tenancy data isolation';
COMMENT ON COLUMN projects.company_id IS 'Foreign key to companies table for multi-tenancy data isolation';
COMMENT ON TABLE sessions IS 'Persistent session storage for authenticated users, survives server restarts';
