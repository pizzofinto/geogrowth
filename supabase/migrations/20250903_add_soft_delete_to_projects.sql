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

-- Update get_projects_with_details function to exclude deleted projects
CREATE OR REPLACE FUNCTION get_projects_with_details()
RETURNS TABLE (
    id bigint,
    project_name text,
    project_code text,
    project_status text,
    project_start_date date,
    project_end_date date,
    project_manager_user_id uuid,
    total_components integer,
    overdue_action_plans_count integer,
    otop_percentage numeric,
    ot_percentage numeric,
    ko_percentage numeric,
    next_milestone_name text,
    next_milestone_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.project_name,
        p.project_code,
        p.project_status,
        p.project_start_date,
        p.project_end_date,
        p.project_manager_user_id,
        COALESCE(stats.total_components, 0)::integer as total_components,
        COALESCE(stats.overdue_action_plans_count, 0)::integer as overdue_action_plans_count,
        COALESCE(stats.otop_percentage, 0)::numeric as otop_percentage,
        COALESCE(stats.ot_percentage, 0)::numeric as ot_percentage,
        COALESCE(stats.ko_percentage, 0)::numeric as ko_percentage,
        next_milestone.milestone_name as next_milestone_name,
        next_milestone.milestone_target_date as next_milestone_date
    FROM projects p
    LEFT JOIN (
        -- Project statistics subquery
        SELECT 
            pc.project_id,
            COUNT(pc.id) as total_components,
            COUNT(CASE WHEN ap.due_date < CURRENT_DATE AND ap.status != 'Completed' THEN 1 END) as overdue_action_plans_count,
            ROUND(AVG(CASE WHEN ce.evaluation_result = 'OTOP' THEN 100.0 ELSE 0.0 END), 1) as otop_percentage,
            ROUND(AVG(CASE WHEN ce.evaluation_result = 'OT' THEN 100.0 ELSE 0.0 END), 1) as ot_percentage,
            ROUND(AVG(CASE WHEN ce.evaluation_result = 'KO' THEN 100.0 ELSE 0.0 END), 1) as ko_percentage
        FROM parent_components pc
        LEFT JOIN cavity_evaluations ce ON pc.id = ce.parent_component_id
        LEFT JOIN action_plans ap ON pc.id = ap.parent_component_id
        GROUP BY pc.project_id
    ) stats ON p.id = stats.project_id
    LEFT JOIN (
        -- Next milestone subquery
        SELECT 
            pmi.project_id,
            md.milestone_name,
            pmi.milestone_target_date,
            ROW_NUMBER() OVER (PARTITION BY pmi.project_id ORDER BY pmi.milestone_target_date ASC) as rn
        FROM project_milestone_instances pmi
        JOIN milestone_definitions md ON pmi.milestone_definition_id = md.id
        WHERE pmi.milestone_target_date >= CURRENT_DATE
        AND pmi.milestone_status NOT IN ('Completed', 'Cancelled')
    ) next_milestone ON p.id = next_milestone.project_id AND next_milestone.rn = 1
    WHERE p.deleted_at IS NULL  -- ← KEY FILTER: Exclude soft deleted projects
    ORDER BY p.project_name;
END;
$$;

-- Update get_recent_projects_for_user function to exclude deleted projects  
CREATE OR REPLACE FUNCTION get_recent_projects_for_user(
    user_id_param uuid, 
    limit_param integer DEFAULT 4
) 
RETURNS TABLE(
    project_id bigint, 
    project_name text, 
    project_status text, 
    last_accessed timestamp with time zone, 
    total_components integer, 
    overdue_action_plans_count integer, 
    otop_percentage numeric, 
    ot_percentage numeric, 
    ko_percentage numeric, 
    next_milestone_name text, 
    next_milestone_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pwd.id as project_id,
    pwd.project_name,
    pwd.project_status,
    upa.last_accessed,
    pwd.total_components,
    pwd.overdue_action_plans_count,
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