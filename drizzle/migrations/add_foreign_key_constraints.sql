-- Foreign Key Constraints Migration for ConstructAid
-- Run this migration to add referential integrity constraints
-- Generated: 2026-01-05
--
-- IMPORTANT: Run this AFTER the database has data
-- Use ON DELETE SET NULL for optional relationships
-- Use ON DELETE CASCADE for dependent relationships
-- Use ON DELETE RESTRICT for critical relationships

-- ========================================
-- PROJECTS TABLE
-- ========================================
-- Owner relationship (optional - SET NULL if user deleted)
ALTER TABLE projects
ADD CONSTRAINT fk_projects_owner
FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- General Contractor relationship (optional)
ALTER TABLE projects
ADD CONSTRAINT fk_projects_gc
FOREIGN KEY (general_contractor_id) REFERENCES users(id) ON DELETE SET NULL;

-- Created by relationship (keep for audit, SET NULL if user deleted)
ALTER TABLE projects
ADD CONSTRAINT fk_projects_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Deleted by relationship (for audit)
ALTER TABLE projects
ADD CONSTRAINT fk_projects_deleted_by
FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- TASKS TABLE
-- ========================================
-- Project relationship (CASCADE - delete tasks when project deleted)
ALTER TABLE tasks
ADD CONSTRAINT fk_tasks_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Assigned by relationship
ALTER TABLE tasks
ADD CONSTRAINT fk_tasks_assigned_by
FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;

-- Created by relationship
ALTER TABLE tasks
ADD CONSTRAINT fk_tasks_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Deleted by relationship
ALTER TABLE tasks
ADD CONSTRAINT fk_tasks_deleted_by
FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- RFIS TABLE
-- ========================================
ALTER TABLE rfis
ADD CONSTRAINT fk_rfis_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE rfis
ADD CONSTRAINT fk_rfis_submitted_by
FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE rfis
ADD CONSTRAINT fk_rfis_assigned_to
FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE rfis
ADD CONSTRAINT fk_rfis_responded_by
FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE rfis
ADD CONSTRAINT fk_rfis_deleted_by
FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- CHANGE ORDERS TABLE
-- ========================================
ALTER TABLE change_orders
ADD CONSTRAINT fk_change_orders_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE change_orders
ADD CONSTRAINT fk_change_orders_initiated_by
FOREIGN KEY (initiated_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE change_orders
ADD CONSTRAINT fk_change_orders_approved_by
FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE change_orders
ADD CONSTRAINT fk_change_orders_deleted_by
FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- SUBMITTALS TABLE
-- ========================================
ALTER TABLE submittals
ADD CONSTRAINT fk_submittals_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE submittals
ADD CONSTRAINT fk_submittals_submitted_by
FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE submittals
ADD CONSTRAINT fk_submittals_reviewed_by_gc
FOREIGN KEY (reviewed_by_gc) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE submittals
ADD CONSTRAINT fk_submittals_reviewed_by_architect
FOREIGN KEY (reviewed_by_architect) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE submittals
ADD CONSTRAINT fk_submittals_approved_by
FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE submittals
ADD CONSTRAINT fk_submittals_deleted_by
FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- DAILY REPORTS TABLE
-- ========================================
ALTER TABLE daily_reports
ADD CONSTRAINT fk_daily_reports_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE daily_reports
ADD CONSTRAINT fk_daily_reports_submitted_by
FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE daily_reports
ADD CONSTRAINT fk_daily_reports_deleted_by
FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- FILE ATTACHMENTS TABLE
-- ========================================
ALTER TABLE file_attachments
ADD CONSTRAINT fk_file_attachments_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE file_attachments
ADD CONSTRAINT fk_file_attachments_uploaded_by
FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE file_attachments
ADD CONSTRAINT fk_file_attachments_replaces
FOREIGN KEY (replaces_file_id) REFERENCES file_attachments(id) ON DELETE SET NULL;

-- ========================================
-- ACTIVITY LOG TABLE
-- ========================================
ALTER TABLE activity_log
ADD CONSTRAINT fk_activity_log_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE activity_log
ADD CONSTRAINT fk_activity_log_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- COMMENTS TABLE
-- ========================================
ALTER TABLE comments
ADD CONSTRAINT fk_comments_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE comments
ADD CONSTRAINT fk_comments_author
FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE comments
ADD CONSTRAINT fk_comments_parent
FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE;

-- ========================================
-- PROJECT INVITATIONS TABLE
-- ========================================
ALTER TABLE project_invitations
ADD CONSTRAINT fk_project_invitations_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE project_invitations
ADD CONSTRAINT fk_project_invitations_invited_by
FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE project_invitations
ADD CONSTRAINT fk_project_invitations_accepted_by
FOREIGN KEY (accepted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE project_invitations
ADD CONSTRAINT fk_project_invitations_approved_by
FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- PROJECT TEAM MEMBERS TABLE
-- ========================================
ALTER TABLE project_team_members
ADD CONSTRAINT fk_project_team_members_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE project_team_members
ADD CONSTRAINT fk_project_team_members_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE project_team_members
ADD CONSTRAINT fk_project_team_members_invitation
FOREIGN KEY (invitation_id) REFERENCES project_invitations(id) ON DELETE SET NULL;

ALTER TABLE project_team_members
ADD CONSTRAINT fk_project_team_members_invited_by
FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- SAFETY ACTION PLANS TABLE
-- ========================================
ALTER TABLE safety_action_plans
ADD CONSTRAINT fk_safety_action_plans_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE safety_action_plans
ADD CONSTRAINT fk_safety_action_plans_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE safety_action_plans
ADD CONSTRAINT fk_safety_action_plans_approved_by
FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- SAFETY MEETINGS TABLE
-- ========================================
ALTER TABLE safety_meetings
ADD CONSTRAINT fk_safety_meetings_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE safety_meetings
ADD CONSTRAINT fk_safety_meetings_conducted_by
FOREIGN KEY (conducted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE safety_meetings
ADD CONSTRAINT fk_safety_meetings_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- SAFETY INSPECTIONS TABLE
-- ========================================
ALTER TABLE safety_inspections
ADD CONSTRAINT fk_safety_inspections_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE safety_inspections
ADD CONSTRAINT fk_safety_inspections_inspected_by
FOREIGN KEY (inspected_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE safety_inspections
ADD CONSTRAINT fk_safety_inspections_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- INCIDENT REPORTS TABLE
-- ========================================
ALTER TABLE incident_reports
ADD CONSTRAINT fk_incident_reports_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE incident_reports
ADD CONSTRAINT fk_incident_reports_reported_by
FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE incident_reports
ADD CONSTRAINT fk_incident_reports_investigated_by
FOREIGN KEY (investigated_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- JOB HAZARD ANALYSES TABLE
-- ========================================
ALTER TABLE job_hazard_analyses
ADD CONSTRAINT fk_job_hazard_analyses_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE job_hazard_analyses
ADD CONSTRAINT fk_job_hazard_analyses_prepared_by
FOREIGN KEY (prepared_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE job_hazard_analyses
ADD CONSTRAINT fk_job_hazard_analyses_reviewed_by
FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE job_hazard_analyses
ADD CONSTRAINT fk_job_hazard_analyses_approved_by
FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE job_hazard_analyses
ADD CONSTRAINT fk_job_hazard_analyses_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- WORK PERMITS TABLE
-- ========================================
ALTER TABLE work_permits
ADD CONSTRAINT fk_work_permits_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE work_permits
ADD CONSTRAINT fk_work_permits_requested_by
FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE work_permits
ADD CONSTRAINT fk_work_permits_authorized_by
FOREIGN KEY (authorized_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE work_permits
ADD CONSTRAINT fk_work_permits_completed_by
FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE work_permits
ADD CONSTRAINT fk_work_permits_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- CRANE INSPECTIONS TABLE
-- ========================================
ALTER TABLE crane_inspections
ADD CONSTRAINT fk_crane_inspections_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE crane_inspections
ADD CONSTRAINT fk_crane_inspections_inspected_by
FOREIGN KEY (inspected_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE crane_inspections
ADD CONSTRAINT fk_crane_inspections_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- SAFETY TRAINING TABLE
-- ========================================
ALTER TABLE safety_training
ADD CONSTRAINT fk_safety_training_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE safety_training
ADD CONSTRAINT fk_safety_training_conducted_by
FOREIGN KEY (conducted_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- WORKER CERTIFICATIONS TABLE
-- ========================================
ALTER TABLE worker_certifications
ADD CONSTRAINT fk_worker_certifications_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE worker_certifications
ADD CONSTRAINT fk_worker_certifications_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- FIELD INSPECTIONS TABLE
-- ========================================
ALTER TABLE field_inspections
ADD CONSTRAINT fk_field_inspections_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE field_inspections
ADD CONSTRAINT fk_field_inspections_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- MATERIAL DELIVERIES TABLE
-- ========================================
ALTER TABLE material_deliveries
ADD CONSTRAINT fk_material_deliveries_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE material_deliveries
ADD CONSTRAINT fk_material_deliveries_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- DISD COMPLIANCE CHECKLISTS TABLE
-- ========================================
ALTER TABLE disd_compliance_checklists
ADD CONSTRAINT fk_disd_compliance_checklists_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE disd_compliance_checklists
ADD CONSTRAINT fk_disd_compliance_checklists_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- SUBCONTRACTOR COORDINATION TABLE
-- ========================================
ALTER TABLE subcontractor_coordination
ADD CONSTRAINT fk_subcontractor_coordination_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE subcontractor_coordination
ADD CONSTRAINT fk_subcontractor_coordination_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- SUPERINTENDENT NOTES TABLE
-- ========================================
ALTER TABLE superintendent_notes
ADD CONSTRAINT fk_superintendent_notes_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE superintendent_notes
ADD CONSTRAINT fk_superintendent_notes_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- BID PACKAGES TABLE (already has some FKs in schema)
-- ========================================
-- Note: bidPackages already has .references() in schema for project_id and created_by

-- ========================================
-- COST ESTIMATES TABLE
-- ========================================
-- Note: costEstimates already has .references() in schema

-- ========================================
-- COST ESTIMATE LINE ITEMS TABLE
-- ========================================
-- Note: costEstimateLineItems already has .references() in schema

-- ========================================
-- BID CHECKLISTS TABLE
-- ========================================
-- Note: bidChecklists already has .references() in schema

-- ========================================
-- SUBCONTRACTOR QUOTES TABLE
-- ========================================
-- Note: subcontractorQuotes already has .references() in schema

-- ========================================
-- MWBE PARTICIPATION TABLE
-- ========================================
-- Note: mwbeParticipation already has .references() in schema

-- ========================================
-- AUDIT LOG TABLE (already has FK in schema)
-- ========================================
-- Note: auditLog already has .references() for user_id in schema

-- ========================================
-- DONE
-- ========================================
-- Total foreign key constraints added: ~80+
--
-- These constraints ensure:
-- 1. Data integrity - no orphaned records
-- 2. Cascading deletes for project-dependent data
-- 3. Safe handling of user deletions (SET NULL)
-- 4. Self-referential integrity (comments, file versions)
--
-- Run with: psql $DATABASE_URL -f add_foreign_key_constraints.sql
--
-- Note: Some constraints may fail if there's existing orphaned data
-- Clean up orphaned records before running this migration
