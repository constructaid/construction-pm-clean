-- Add soft delete columns to tables
-- Run this SQL migration manually to add deleted_at and deleted_by columns

-- Projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_by INTEGER;

-- Tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_by INTEGER;

-- RFIs
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS deleted_by INTEGER;

-- Change Orders
ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS deleted_by INTEGER;

-- Daily Reports
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS deleted_by INTEGER;

-- Submittals
ALTER TABLE submittals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE submittals ADD COLUMN IF NOT EXISTS deleted_by INTEGER;

-- Contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deleted_by INTEGER;
