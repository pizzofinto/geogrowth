-- ============================================================================
-- ADD SOFT DELETE SUPPORT TO PROJECTS TABLE
-- ============================================================================
-- Migration: 20250903_add_soft_delete_to_projects.sql
-- Purpose: Add soft delete functionality to projects table
-- Author: Claude Code - Sprint 3 Project Deletion Implementation
-- Date: 2025-09-03

-- Add soft delete columns to projects table
ALTER TABLE projects 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN deleted_by_user_id UUID REFERENCES users(id) DEFAULT NULL;

-- Add index for performance on deleted_at queries
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX idx_projects_active ON projects(id) WHERE deleted_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN projects.deleted_at IS 'Timestamp when project was soft deleted. NULL means project is active.';
COMMENT ON COLUMN projects.deleted_by_user_id IS 'User ID who performed the soft delete operation.';

-- ============================================================================
-- UPDATE RLS POLICIES TO EXCLUDE SOFT DELETED PROJECTS
-- ============================================================================

-- Drop existing RLS policies on projects table (we'll recreate them)
DROP POLICY IF EXISTS "Enable read access for assigned users" ON projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable update for assigned users" ON projects;

-- Recreate RLS policies with soft delete filter
CREATE POLICY "Enable read access for assigned users" ON projects
    FOR SELECT USING (
        deleted_at IS NULL AND
        is_assigned_to_project(id)
    );

CREATE POLICY "Enable insert for authenticated users" ON projects
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Enable update for assigned users" ON projects
    FOR UPDATE USING (
        deleted_at IS NULL AND
        is_assigned_to_project(id)
    );

-- Add policy for soft delete operations (only project managers and super users)
CREATE POLICY "Enable soft delete for project managers" ON projects
    FOR UPDATE USING (
        deleted_at IS NULL AND (
            project_manager_user_id = auth.uid() OR
            has_role('Super User') OR
            has_role('Supplier Quality')
        )
    );

-- ============================================================================
-- UPDATE STORED PROCEDURES TO FILTER OUT SOFT DELETED PROJECTS
-- ============================================================================

-- Update get_projects_with_details function to exclude deleted projects (matching existing signature)
CREATE OR REPLACE FUNCTION public.get_projects_with_details()
RETURNS TABLE(id bigint, project_name text, project_code text, project_status project_status_enum, otop_percentage numeric, ot_percentage numeric, ko_percentage numeric, total_components bigint, overdue_action_plans_count bigint, next_milestone_name text, next_milestone_date date)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    WITH
    -- CTE ottimizzata per calcolare tutte le statistiche dei componenti in un unico passaggio
    component_stats AS (
        SELECT
            p.id AS project_id,
            COUNT(pc.id) AS total,
            COUNT(pc.id) FILTER (WHERE pc.calculated_parent_status = 'OTOP') AS otop,
            COUNT(pc.id) FILTER (WHERE pc.calculated_parent_status = 'OT') AS ot,
            COUNT(pc.id) FILTER (WHERE pc.calculated_parent_status = 'KO') AS ko
        FROM projects p
        LEFT JOIN parent_components pc ON p.id = pc.project_id
        WHERE p.deleted_at IS NULL  -- ← ADDED: Exclude soft deleted projects
          AND public.is_assigned_to_project(p.id)
        GROUP BY p.id
    ),
    -- CTE per i piani d'azione scaduti
    overdue_plans AS (
        SELECT
            pc.project_id,
            COUNT(ap.id) as overdue_count
        FROM action_plans ap
        JOIN parent_components pc ON ap.parent_component_id = pc.id
        JOIN projects p ON pc.project_id = p.id  -- ← ADDED: Join with projects
        WHERE
            ap.due_date < CURRENT_DATE
            AND ap.action_plan_status NOT IN ('Completed', 'Verified', 'Cancelled')
            AND p.deleted_at IS NULL  -- ← ADDED: Exclude soft deleted projects
            AND public.is_assigned_to_project(pc.project_id)
        GROUP BY pc.project_id
    ),
    -- CTE per la prossima milestone
    next_milestones AS (
        SELECT
            pmi.project_id,
            md.milestone_name,
            pmi.milestone_target_date,
            ROW_NUMBER() OVER(PARTITION BY pmi.project_id ORDER BY pmi.milestone_target_date ASC) as rn
        FROM project_milestone_instances pmi
        JOIN milestone_definitions md ON pmi.milestone_definition_id = md.id
        JOIN projects p ON pmi.project_id = p.id  -- ← ADDED: Join with projects
        WHERE pmi.milestone_status <> 'Completed'
            AND pmi.milestone_target_date >= CURRENT_DATE
            AND p.deleted_at IS NULL  -- ← ADDED: Exclude soft deleted projects
            AND public.is_assigned_to_project(pmi.project_id)
    )
    -- Select finale che unisce i dati pre-calcolati
    SELECT
        p.id,
        p.project_name,
        p.project_code,
        p.project_status,
        COALESCE((cs.otop * 100.0 / NULLIF(cs.total, 0)), 0)::NUMERIC(5, 2) AS otop_percentage,
        COALESCE((cs.ot * 100.0 / NULLIF(cs.total, 0)), 0)::NUMERIC(5, 2) AS ot_percentage,
        COALESCE((cs.ko * 100.0 / NULLIF(cs.total, 0)), 0)::NUMERIC(5, 2) AS ko_percentage,
        COALESCE(cs.total, 0) AS total_components,
        COALESCE(op.overdue_count, 0) AS overdue_action_plans_count,
        nm.milestone_name AS next_milestone_name,
        nm.milestone_target_date AS next_milestone_date
    FROM
        projects p
    LEFT JOIN component_stats cs ON p.id = cs.project_id
    LEFT JOIN overdue_plans op ON p.id = op.project_id
    LEFT JOIN next_milestones nm ON p.id = nm.project_id AND nm.rn = 1
    WHERE p.deleted_at IS NULL  -- ← KEY FILTER: Exclude soft deleted projects
      AND public.is_assigned_to_project(p.id);
END;
$$;

-- Update get_recent_projects_for_user function to exclude deleted projects (matching existing signature)
CREATE OR REPLACE FUNCTION public.get_recent_projects_for_user(user_id_param uuid, limit_param integer DEFAULT 4)
RETURNS TABLE(project_id bigint, project_name text, project_status text, last_accessed timestamp with time zone, total_components integer, overdue_action_plans_count integer, otop_percentage numeric, ot_percentage numeric, ko_percentage numeric, next_milestone_name text, next_milestone_date date)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pwd.id as project_id,
    pwd.project_name,
    pwd.project_status::text as project_status,  -- ← CAST enum to text to match return type
    upa.last_accessed,
    pwd.total_components::integer as total_components,  -- ← CAST bigint to integer to match return type  
    pwd.overdue_action_plans_count::integer as overdue_action_plans_count,  -- ← CAST bigint to integer to match return type
    pwd.otop_percentage,
    pwd.ot_percentage,
    pwd.ko_percentage,
    pwd.next_milestone_name,
    pwd.next_milestone_date
  FROM get_projects_with_details() pwd
  INNER JOIN user_project_assignments upa ON pwd.id = upa.project_id
  WHERE upa.user_id = user_id_param
  AND pwd.project_status = 'Active'
  -- get_projects_with_details() already filters out deleted projects
  ORDER BY COALESCE(upa.last_accessed, upa.assigned_at) DESC NULLS LAST
  LIMIT limit_param;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in get_recent_projects_for_user: %', SQLERRM;
    RAISE;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on updated functions
GRANT EXECUTE ON FUNCTION get_projects_with_details() TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_projects_for_user(uuid, integer) TO authenticated;