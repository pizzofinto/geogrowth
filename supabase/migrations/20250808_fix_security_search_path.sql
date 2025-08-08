-- ============================================================================
-- Migration: Fix Security Search Path Issues
-- Date: 2025-01-08
-- Description: Add explicit search_path to SECURITY DEFINER functions
-- Security Advisory: Resolve "role mutable search_path" warnings
-- ============================================================================

-- ============================================================================
-- FIX 1: get_recent_projects_for_user
-- ============================================================================

DROP FUNCTION IF EXISTS "public"."get_recent_projects_for_user"("user_id_param" "uuid", "limit_param" integer);

CREATE OR REPLACE FUNCTION "public"."get_recent_projects_for_user"(
    "user_id_param" "uuid", 
    "limit_param" integer DEFAULT 4
) 
RETURNS TABLE(
    "project_id" bigint, 
    "project_name" "text", 
    "project_status" "text", 
    "last_accessed" timestamp with time zone, 
    "total_components" integer, 
    "overdue_action_plans_count" integer, 
    "otop_percentage" numeric, 
    "ot_percentage" numeric, 
    "ko_percentage" numeric, 
    "next_milestone_name" "text", 
    "next_milestone_date" "date"
)
LANGUAGE "plpgsql" 
SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
BEGIN
  -- Validate input parameters
  IF user_id_param IS NULL THEN
    RAISE EXCEPTION 'user_id_param cannot be NULL';
  END IF;
  
  IF limit_param IS NULL OR limit_param <= 0 OR limit_param > 100 THEN
    RAISE EXCEPTION 'limit_param must be between 1 and 100, received: %', limit_param;
  END IF;

  RETURN QUERY
  SELECT 
    pwd.id as project_id,
    pwd.project_name,
    pwd.project_status::TEXT,
    COALESCE(upa.last_accessed, upa.assigned_at) as last_accessed,
    pwd.total_components::INTEGER,
    pwd.overdue_action_plans_count::INTEGER,
    pwd.otop_percentage,
    pwd.ot_percentage,
    pwd.ko_percentage,
    pwd.next_milestone_name,
    pwd.next_milestone_date
  FROM get_projects_with_details() pwd
  INNER JOIN user_project_assignments upa ON pwd.id = upa.project_id
  WHERE upa.user_id = user_id_param
  AND pwd.project_status = 'Active'
  ORDER BY COALESCE(upa.last_accessed, upa.assigned_at) DESC NULLS LAST
  LIMIT limit_param;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in get_recent_projects_for_user: %', SQLERRM;
    RAISE;
END;
$$;

ALTER FUNCTION "public"."get_recent_projects_for_user"("user_id_param" "uuid", "limit_param" integer) 
OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."get_recent_projects_for_user"("user_id_param" "uuid", "limit_param" integer) 
TO "anon";

GRANT ALL ON FUNCTION "public"."get_recent_projects_for_user"("user_id_param" "uuid", "limit_param" integer) 
TO "authenticated";

GRANT ALL ON FUNCTION "public"."get_recent_projects_for_user"("user_id_param" "uuid", "limit_param" integer) 
TO "service_role";

-- ============================================================================
-- FIX 2: update_project_last_accessed
-- ============================================================================

DROP FUNCTION IF EXISTS "public"."update_project_last_accessed"("project_id_param" bigint, "user_id_param" "uuid");

CREATE OR REPLACE FUNCTION "public"."update_project_last_accessed"(
    "project_id_param" bigint, 
    "user_id_param" "uuid" DEFAULT "auth"."uid"()
) 
RETURNS "void"
LANGUAGE "plpgsql" 
SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
DECLARE
    v_rows_updated INT;
BEGIN
    -- Validate input parameters
    IF project_id_param IS NULL THEN
        RAISE EXCEPTION 'project_id_param cannot be NULL';
    END IF;
    
    IF user_id_param IS NULL THEN
        user_id_param := auth.uid();
        IF user_id_param IS NULL THEN
            RAISE EXCEPTION 'No authenticated user found';
        END IF;
    END IF;

    -- Update the last_accessed timestamp
    UPDATE user_project_assignments
    SET last_accessed = NOW()
    WHERE project_id = project_id_param 
      AND user_id = user_id_param;
    
    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    
    IF v_rows_updated = 0 THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM user_project_assignments 
            WHERE project_id = project_id_param 
              AND user_id = user_id_param
        ) THEN
            RAISE WARNING 'User % is not assigned to project %', user_id_param, project_id_param;
        END IF;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in update_project_last_accessed: % (project_id: %, user_id: %)', 
            SQLERRM, project_id_param, user_id_param;
        RAISE;
END;
$$;

ALTER FUNCTION "public"."update_project_last_accessed"("project_id_param" bigint, "user_id_param" "uuid") 
OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."update_project_last_accessed"("project_id_param" bigint, "user_id_param" "uuid") 
TO "anon";

GRANT ALL ON FUNCTION "public"."update_project_last_accessed"("project_id_param" bigint, "user_id_param" "uuid") 
TO "authenticated";

GRANT ALL ON FUNCTION "public"."update_project_last_accessed"("project_id_param" bigint, "user_id_param" "uuid") 
TO "service_role";

-- ============================================================================
-- Migration completed successfully
-- ============================================================================