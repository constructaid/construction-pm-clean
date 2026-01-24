-- Performance Indexes Migration for ConstructAid
-- Run this migration to add indexes for improved query performance
-- Generated: 2026-01-05

-- ========================================
-- PROJECT INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_gc_id ON projects(general_contractor_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_is_archived ON projects(is_archived);
-- Composite: active projects by status (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_projects_active_status ON projects(deleted_at, status) WHERE deleted_at IS NULL;

-- ========================================
-- TASK INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
-- Composite: tasks by project and status (most common query)
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status) WHERE deleted_at IS NULL;

-- ========================================
-- RFI INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_rfis_project_id ON rfis(project_id);
CREATE INDEX IF NOT EXISTS idx_rfis_status ON rfis(status);
CREATE INDEX IF NOT EXISTS idx_rfis_submitted_by ON rfis(submitted_by);
CREATE INDEX IF NOT EXISTS idx_rfis_assigned_to ON rfis(assigned_to);
CREATE INDEX IF NOT EXISTS idx_rfis_due_date ON rfis(due_date);
CREATE INDEX IF NOT EXISTS idx_rfis_deleted_at ON rfis(deleted_at);
CREATE INDEX IF NOT EXISTS idx_rfis_created_at ON rfis(created_at);
-- Composite: RFIs by project and status
CREATE INDEX IF NOT EXISTS idx_rfis_project_status ON rfis(project_id, status) WHERE deleted_at IS NULL;

-- ========================================
-- CHANGE ORDER INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_change_orders_project_id ON change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON change_orders(status);
CREATE INDEX IF NOT EXISTS idx_change_orders_initiated_by ON change_orders(initiated_by);
CREATE INDEX IF NOT EXISTS idx_change_orders_approved_by ON change_orders(approved_by);
CREATE INDEX IF NOT EXISTS idx_change_orders_deleted_at ON change_orders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_change_orders_created_at ON change_orders(created_at);
-- Composite: change orders by project and status
CREATE INDEX IF NOT EXISTS idx_change_orders_project_status ON change_orders(project_id, status) WHERE deleted_at IS NULL;

-- ========================================
-- SUBMITTAL INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_submittals_project_id ON submittals(project_id);
CREATE INDEX IF NOT EXISTS idx_submittals_status ON submittals(status);
CREATE INDEX IF NOT EXISTS idx_submittals_submitted_by ON submittals(submitted_by);
CREATE INDEX IF NOT EXISTS idx_submittals_csi_division ON submittals(csi_division);
CREATE INDEX IF NOT EXISTS idx_submittals_due_date ON submittals(due_date);
CREATE INDEX IF NOT EXISTS idx_submittals_deleted_at ON submittals(deleted_at);
CREATE INDEX IF NOT EXISTS idx_submittals_created_at ON submittals(created_at);
-- Composite: submittals by project and status
CREATE INDEX IF NOT EXISTS idx_submittals_project_status ON submittals(project_id, status) WHERE deleted_at IS NULL;

-- ========================================
-- DAILY REPORT INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_daily_reports_project_id ON daily_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_report_date ON daily_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_submitted_by ON daily_reports(submitted_by);
CREATE INDEX IF NOT EXISTS idx_daily_reports_deleted_at ON daily_reports(deleted_at);
-- Composite: reports by project and date (for browsing history)
CREATE INDEX IF NOT EXISTS idx_daily_reports_project_date ON daily_reports(project_id, report_date);

-- ========================================
-- FILE ATTACHMENT INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_file_attachments_project_id ON file_attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_folder_type ON file_attachments(folder_type);
CREATE INDEX IF NOT EXISTS idx_file_attachments_uploaded_by ON file_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_attachments_created_at ON file_attachments(created_at);
-- Composite: files by project and folder type
CREATE INDEX IF NOT EXISTS idx_file_attachments_project_folder ON file_attachments(project_id, folder_type);
-- Composite: related entity lookup
CREATE INDEX IF NOT EXISTS idx_file_attachments_related_entity ON file_attachments(related_entity, related_entity_id);

-- ========================================
-- ACTIVITY LOG INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_activity_log_project_id ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_type ON activity_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
-- Composite: activity by project and entity
CREATE INDEX IF NOT EXISTS idx_activity_log_project_entity ON activity_log(project_id, entity_type);

-- ========================================
-- COMMENT INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
-- Composite: entity lookup (for loading comments on an item)
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);

-- ========================================
-- PROJECT INVITATION INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_project_invitations_project_id ON project_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_email ON project_invitations(email);
CREATE INDEX IF NOT EXISTS idx_project_invitations_status ON project_invitations(status);
CREATE INDEX IF NOT EXISTS idx_project_invitations_invited_by ON project_invitations(invited_by);
-- Token lookup (used for accepting invitations)
CREATE INDEX IF NOT EXISTS idx_project_invitations_token ON project_invitations(invitation_token);

-- ========================================
-- PROJECT TEAM MEMBER INDEXES (Critical for RBAC)
-- ========================================
CREATE INDEX IF NOT EXISTS idx_project_team_members_project_id ON project_team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_user_id ON project_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_team_role ON project_team_members(team_role);
CREATE INDEX IF NOT EXISTS idx_project_team_members_is_active ON project_team_members(is_active);
-- Critical composite: check if user is member of project (used in every RBAC check)
CREATE INDEX IF NOT EXISTS idx_project_team_members_project_user ON project_team_members(project_id, user_id);
-- Composite: active members of a project
CREATE INDEX IF NOT EXISTS idx_project_team_members_project_active ON project_team_members(project_id, is_active) WHERE is_active = true;

-- ========================================
-- SAFETY INDEXES
-- ========================================
-- Safety Meetings
CREATE INDEX IF NOT EXISTS idx_safety_meetings_project_id ON safety_meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_safety_meetings_meeting_date ON safety_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_safety_meetings_meeting_type ON safety_meetings(meeting_type);
CREATE INDEX IF NOT EXISTS idx_safety_meetings_conducted_by ON safety_meetings(conducted_by);

-- Safety Inspections
CREATE INDEX IF NOT EXISTS idx_safety_inspections_project_id ON safety_inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_safety_inspections_inspection_date ON safety_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_safety_inspections_inspection_type ON safety_inspections(inspection_type);
CREATE INDEX IF NOT EXISTS idx_safety_inspections_inspected_by ON safety_inspections(inspected_by);

-- Incident Reports
CREATE INDEX IF NOT EXISTS idx_incident_reports_project_id ON incident_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_incident_date ON incident_reports(incident_date);
CREATE INDEX IF NOT EXISTS idx_incident_reports_severity ON incident_reports(severity);
CREATE INDEX IF NOT EXISTS idx_incident_reports_incident_type ON incident_reports(incident_type);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_reported_by ON incident_reports(reported_by);

-- Job Hazard Analyses
CREATE INDEX IF NOT EXISTS idx_job_hazard_analyses_project_id ON job_hazard_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_job_hazard_analyses_status ON job_hazard_analyses(status);
CREATE INDEX IF NOT EXISTS idx_job_hazard_analyses_prepared_by ON job_hazard_analyses(prepared_by);

-- Work Permits
CREATE INDEX IF NOT EXISTS idx_work_permits_project_id ON work_permits(project_id);
CREATE INDEX IF NOT EXISTS idx_work_permits_permit_type ON work_permits(permit_type);
CREATE INDEX IF NOT EXISTS idx_work_permits_permit_date ON work_permits(permit_date);
CREATE INDEX IF NOT EXISTS idx_work_permits_is_active ON work_permits(is_active);

-- Crane Inspections
CREATE INDEX IF NOT EXISTS idx_crane_inspections_project_id ON crane_inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_crane_inspections_inspection_date ON crane_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_crane_inspections_inspected_by ON crane_inspections(inspected_by);

-- Safety Training
CREATE INDEX IF NOT EXISTS idx_safety_training_project_id ON safety_training(project_id);
CREATE INDEX IF NOT EXISTS idx_safety_training_training_date ON safety_training(training_date);
CREATE INDEX IF NOT EXISTS idx_safety_training_status ON safety_training(status);
CREATE INDEX IF NOT EXISTS idx_safety_training_conducted_by ON safety_training(conducted_by);

-- Worker Certifications
CREATE INDEX IF NOT EXISTS idx_worker_certifications_project_id ON worker_certifications(project_id);
CREATE INDEX IF NOT EXISTS idx_worker_certifications_badge_number ON worker_certifications(badge_number);
CREATE INDEX IF NOT EXISTS idx_worker_certifications_status ON worker_certifications(status);
CREATE INDEX IF NOT EXISTS idx_worker_certifications_company ON worker_certifications(company);
CREATE INDEX IF NOT EXISTS idx_worker_certifications_is_active ON worker_certifications(is_active);

-- ========================================
-- AUDIT LOG INDEXES (Critical for Compliance)
-- ========================================
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
-- Composite: find all changes to a specific record
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
-- Composite: find all changes by a user (for audit purposes)
CREATE INDEX IF NOT EXISTS idx_audit_log_user_timestamp ON audit_log(user_id, timestamp);

-- ========================================
-- BIDDING SYSTEM INDEXES
-- ========================================
-- Bid Packages
CREATE INDEX IF NOT EXISTS idx_bid_packages_project_id ON bid_packages(project_id);
CREATE INDEX IF NOT EXISTS idx_bid_packages_status ON bid_packages(status);
CREATE INDEX IF NOT EXISTS idx_bid_packages_bid_due_date ON bid_packages(bid_due_date);
CREATE INDEX IF NOT EXISTS idx_bid_packages_created_by ON bid_packages(created_by);

-- Cost Estimates
CREATE INDEX IF NOT EXISTS idx_cost_estimates_project_id ON cost_estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_estimates_bid_package_id ON cost_estimates(bid_package_id);
CREATE INDEX IF NOT EXISTS idx_cost_estimates_status ON cost_estimates(status);

-- Cost Estimate Line Items
CREATE INDEX IF NOT EXISTS idx_cost_estimate_line_items_cost_estimate_id ON cost_estimate_line_items(cost_estimate_id);
CREATE INDEX IF NOT EXISTS idx_cost_estimate_line_items_csi_division ON cost_estimate_line_items(csi_division);
CREATE INDEX IF NOT EXISTS idx_cost_estimate_line_items_sort_order ON cost_estimate_line_items(sort_order);

-- Bid Checklists
CREATE INDEX IF NOT EXISTS idx_bid_checklists_bid_package_id ON bid_checklists(bid_package_id);
CREATE INDEX IF NOT EXISTS idx_bid_checklists_item_category ON bid_checklists(item_category);
CREATE INDEX IF NOT EXISTS idx_bid_checklists_is_completed ON bid_checklists(is_completed);

-- Subcontractor Quotes
CREATE INDEX IF NOT EXISTS idx_subcontractor_quotes_bid_package_id ON subcontractor_quotes(bid_package_id);
CREATE INDEX IF NOT EXISTS idx_subcontractor_quotes_cost_estimate_id ON subcontractor_quotes(cost_estimate_id);
CREATE INDEX IF NOT EXISTS idx_subcontractor_quotes_csi_division ON subcontractor_quotes(csi_division);

-- M/WBE Participation
CREATE INDEX IF NOT EXISTS idx_mwbe_participation_bid_package_id ON mwbe_participation(bid_package_id);
CREATE INDEX IF NOT EXISTS idx_mwbe_participation_certification_type ON mwbe_participation(certification_type);

-- ========================================
-- FIELD SUPERINTENDENT INDEXES
-- ========================================
-- Field Inspections
CREATE INDEX IF NOT EXISTS idx_field_inspections_project_id ON field_inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_field_inspections_inspection_date ON field_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_field_inspections_inspection_type ON field_inspections(inspection_type);

-- Material Deliveries
CREATE INDEX IF NOT EXISTS idx_material_deliveries_project_id ON material_deliveries(project_id);
CREATE INDEX IF NOT EXISTS idx_material_deliveries_scheduled_date ON material_deliveries(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_material_deliveries_status ON material_deliveries(status);

-- DISD Compliance Checklists
CREATE INDEX IF NOT EXISTS idx_disd_compliance_checklists_project_id ON disd_compliance_checklists(project_id);
CREATE INDEX IF NOT EXISTS idx_disd_compliance_checklists_checklist_date ON disd_compliance_checklists(checklist_date);
CREATE INDEX IF NOT EXISTS idx_disd_compliance_checklists_overall_compliance ON disd_compliance_checklists(overall_compliance);

-- Subcontractor Coordination
CREATE INDEX IF NOT EXISTS idx_subcontractor_coordination_project_id ON subcontractor_coordination(project_id);
CREATE INDEX IF NOT EXISTS idx_subcontractor_coordination_log_date ON subcontractor_coordination(log_date);
CREATE INDEX IF NOT EXISTS idx_subcontractor_coordination_trade ON subcontractor_coordination(trade);
CREATE INDEX IF NOT EXISTS idx_subcontractor_coordination_status ON subcontractor_coordination(status);

-- Superintendent Notes
CREATE INDEX IF NOT EXISTS idx_superintendent_notes_project_id ON superintendent_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_superintendent_notes_note_date ON superintendent_notes(note_date);
CREATE INDEX IF NOT EXISTS idx_superintendent_notes_category ON superintendent_notes(category);
CREATE INDEX IF NOT EXISTS idx_superintendent_notes_priority ON superintendent_notes(priority);
CREATE INDEX IF NOT EXISTS idx_superintendent_notes_status ON superintendent_notes(status);
CREATE INDEX IF NOT EXISTS idx_superintendent_notes_is_action_item ON superintendent_notes(is_action_item);

-- ========================================
-- USER INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ========================================
-- DONE
-- ========================================
-- Total indexes created: ~120+
-- These indexes should significantly improve query performance for:
-- 1. Dashboard loading (project lists with status filters)
-- 2. RBAC checks (project team member lookups)
-- 3. Audit trail queries
-- 4. Document/file browsing
-- 5. Safety compliance tracking
-- 6. Bidding/estimating workflows
