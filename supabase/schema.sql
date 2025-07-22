

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."action_plan_status_enum" AS ENUM (
    'Open',
    'In Progress',
    'Completed',
    'Verified',
    'Cancelled'
);


ALTER TYPE "public"."action_plan_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."milestone_status_enum" AS ENUM (
    'Planned',
    'In Progress',
    'Completed',
    'Delayed',
    'Skipped',
    'Cancelled'
);


ALTER TYPE "public"."milestone_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."mold_type_enum" AS ENUM (
    'Prototype',
    'Low Volume',
    'Definitive'
);


ALTER TYPE "public"."mold_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."notification_type_enum" AS ENUM (
    'ACTION_PLAN_DUE',
    'STATUS_CHANGE_KO',
    'NEW_ASSIGNMENT',
    'MILESTONE_DELAY'
);


ALTER TYPE "public"."notification_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."parent_status_enum" AS ENUM (
    'NEW',
    'INCOMPLETE_DATA',
    'KO',
    'NOT_OFF_TOOL',
    'OTOP',
    'P_OTOP',
    'OT'
);


ALTER TYPE "public"."parent_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."project_status_enum" AS ENUM (
    'Active',
    'Archived',
    'Closed'
);


ALTER TYPE "public"."project_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."target_status_type_enum" AS ENUM (
    'OT',
    'OTOP'
);


ALTER TYPE "public"."target_status_type_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_old_audit_logs"() RETURNS TABLE("records_archived" bigint, "oldest_archived" timestamp with time zone, "newest_archived" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_archived_count BIGINT := 0;
    v_oldest_date TIMESTAMPTZ;
    v_newest_date TIMESTAMPTZ;
    v_cutoff_date TIMESTAMPTZ;
BEGIN
    -- Calcola la data di cutoff
    v_cutoff_date := NOW() - INTERVAL '3 months';
    
    -- Assicura che la tabella di archivio esista
    CREATE TABLE IF NOT EXISTS public.audit_log_archive (
        id BIGINT PRIMARY KEY,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        action_type TEXT NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE')),
        old_values JSONB,
        new_values JSONB,
        changed_by_user_id UUID,
        changed_at TIMESTAMPTZ NOT NULL,
        archived_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    
    -- Crea indici se non esistono
    CREATE INDEX IF NOT EXISTS idx_audit_archive_table_record 
        ON public.audit_log_archive(table_name, record_id);
    CREATE INDEX IF NOT EXISTS idx_audit_archive_changed_at 
        ON public.audit_log_archive(changed_at);
    CREATE INDEX IF NOT EXISTS idx_audit_archive_archived_at 
        ON public.audit_log_archive(archived_at);

    -- Verifica se ci sono record da archiviare
    SELECT COUNT(*), MIN(changed_at), MAX(changed_at)
    INTO v_archived_count, v_oldest_date, v_newest_date
    FROM public.audit_log
    WHERE changed_at < v_cutoff_date;
    
    IF v_archived_count = 0 THEN
        RAISE LOG 'No audit log records to archive (cutoff date: %)', v_cutoff_date;
        RETURN QUERY SELECT 0::BIGINT, NULL::TIMESTAMPTZ, NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Inserisci nell'archivio usando INSERT ... ON CONFLICT per evitare duplicati
    INSERT INTO public.audit_log_archive (
        id, table_name, record_id, action_type, 
        old_values, new_values, changed_by_user_id, changed_at
    )
    SELECT 
        id, table_name, record_id, action_type,
        old_values, new_values, changed_by_user_id, changed_at
    FROM public.audit_log
    WHERE changed_at < v_cutoff_date
    ON CONFLICT (id) DO NOTHING;

    -- Elimina i record archiviati
    DELETE FROM public.audit_log
    WHERE changed_at < v_cutoff_date;

    -- Verifica il conteggio finale
    GET DIAGNOSTICS v_archived_count = ROW_COUNT;

    RAISE LOG 'Audit log archiving completed. Records archived: %, Date range: % to %', 
        v_archived_count, v_oldest_date, v_newest_date;
    
    RETURN QUERY SELECT v_archived_count, v_oldest_date, v_newest_date;
END;
$$;


ALTER FUNCTION "public"."archive_old_audit_logs"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."archive_old_audit_logs"() IS 'Moves audit log records older than 3 months to the archive table and returns statistics. Uses SECURITY DEFINER for proper permissions.';



CREATE OR REPLACE FUNCTION "public"."check_cavity_number_against_mold"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    mold_total_cavities INT;
BEGIN
    SELECT m.total_cavities
    INTO mold_total_cavities
    FROM public.parent_components pc
    JOIN public.molds m ON pc.mold_id = m.id
    WHERE pc.id = NEW.parent_component_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Parent component with id % not found.', NEW.parent_component_id;
        RETURN NULL;
    END IF;

    IF NEW.cavity_number > mold_total_cavities OR NEW.cavity_number <= 0 THEN
        RAISE EXCEPTION 'Invalid cavity_number: (%) is out of range for the associated mold, which has % cavities.', NEW.cavity_number, mold_total_cavities;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_cavity_number_against_mold"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_spc_conformity"("p_cavity_evaluation_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result BOOLEAN;
    v_min_cp NUMERIC := 1.33;
    v_min_cpk NUMERIC := 1.33;
BEGIN
    -- Verifica che l'evaluation_id esista
    IF NOT EXISTS (SELECT 1 FROM public.cavity_evaluations WHERE id = p_cavity_evaluation_id) THEN
        RAISE WARNING 'Cavity evaluation % does not exist', p_cavity_evaluation_id;
        RETURN false;
    END IF;

    -- Verifica conformità SPC
    SELECT COALESCE(
        BOOL_AND(
            COALESCE(sv.cp_value, v_min_cp) >= v_min_cp AND 
            COALESCE(sv.cpk_value, v_min_cpk) >= v_min_cpk
        ), 
        true -- Se non ci sono valori SPC, considera conforme
    )
    INTO v_result
    FROM public.spc_values sv 
    WHERE sv.cavity_evaluation_id = p_cavity_evaluation_id
      AND sv.cp_value IS NOT NULL 
      AND sv.cpk_value IS NOT NULL;
    
    RETURN COALESCE(v_result, true);
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error checking SPC conformity for evaluation %: %', p_cavity_evaluation_id, SQLERRM;
        RETURN false;
END;
$$;


ALTER FUNCTION "public"."check_spc_conformity"("p_cavity_evaluation_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_spc_conformity"("p_cavity_evaluation_id" bigint) IS 'Checks if SPC values for a cavity evaluation meet conformity requirements (Cp >= 1.33, Cpk >= 1.33).';



CREATE OR REPLACE FUNCTION "public"."cleanup_old_notifications"() RETURNS TABLE("deleted_read_count" bigint, "deleted_unread_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_deleted_read BIGINT := 0;
    v_deleted_unread BIGINT := 0;
    v_read_cutoff TIMESTAMPTZ;
    v_unread_cutoff TIMESTAMPTZ;
BEGIN
    -- Calcola le date di cutoff
    v_read_cutoff := NOW() - INTERVAL '15 days';
    v_unread_cutoff := NOW() - INTERVAL '5 days';

    -- Elimina notifiche lette vecchie
    WITH deleted_read AS (
        DELETE FROM public.notifications
        WHERE is_read = true 
          AND read_at IS NOT NULL 
          AND read_at < v_read_cutoff
        RETURNING 1
    )
    SELECT count(*) INTO v_deleted_read FROM deleted_read;

    -- Elimina notifiche non lette vecchie
    WITH deleted_unread AS (
        DELETE FROM public.notifications
        WHERE is_read = false 
          AND created_at < v_unread_cutoff
        RETURNING 1
    )
    SELECT count(*) INTO v_deleted_unread FROM deleted_unread;

    RAISE LOG 'Old notifications cleanup completed. Deleted Read: %, Deleted Unread: %', 
        v_deleted_read, v_deleted_unread;
    
    RETURN QUERY SELECT v_deleted_read, v_deleted_unread;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_notifications"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_old_notifications"() IS 'Deletes read notifications older than 15 days and unread notifications older than 5 days.';



CREATE OR REPLACE FUNCTION "public"."cleanup_orphaned_data"() RETURNS TABLE("cleanup_type" "text", "records_deleted" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_deleted_evaluations BIGINT := 0;
    v_deleted_spc BIGINT := 0;
BEGIN
    -- Elimina valutazioni orfane
    WITH deleted AS (
        DELETE FROM public.cavity_evaluations ce
        WHERE NOT EXISTS (
            SELECT 1 FROM public.parent_components pc 
            WHERE pc.id = ce.parent_component_id
        )
        RETURNING 1
    )
    SELECT count(*) INTO v_deleted_evaluations FROM deleted;
    
    -- Elimina valori SPC orfani
    WITH deleted AS (
        DELETE FROM public.spc_values sv
        WHERE NOT EXISTS (
            SELECT 1 FROM public.cavity_evaluations ce 
            WHERE ce.id = sv.cavity_evaluation_id
        )
        RETURNING 1
    )
    SELECT count(*) INTO v_deleted_spc FROM deleted;
    
    RETURN QUERY SELECT 'Orphaned Evaluations'::TEXT, v_deleted_evaluations;
    RETURN QUERY SELECT 'Orphaned SPC Values'::TEXT, v_deleted_spc;
    
    RAISE LOG 'Cleanup completed: % evaluations, % SPC values deleted', 
        v_deleted_evaluations, v_deleted_spc;
END;
$$;


ALTER FUNCTION "public"."cleanup_orphaned_data"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_orphaned_data"() IS 'Removes orphaned cavity evaluations and SPC values.';



CREATE OR REPLACE FUNCTION "public"."get_global_dashboard_stats"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    result json;
BEGIN
    WITH 
    active_projects AS (
        SELECT COUNT(*) as count FROM projects WHERE project_status = 'Active'
    ),
    risk_projects AS (
        SELECT COUNT(DISTINCT p.id) as count
        FROM projects p
        WHERE p.project_status = 'Active'
          AND EXISTS (
            SELECT 1 FROM parent_components pc
            JOIN action_plans ap ON pc.id = ap.parent_component_id
            WHERE pc.project_id = p.id
              AND ap.due_date < CURRENT_DATE
              AND ap.action_plan_status NOT IN ('Completed', 'Verified', 'Cancelled')
          )
    ),
    upcoming_deadlines AS (
        SELECT COUNT(*) as count
        FROM project_milestone_instances
        WHERE milestone_status NOT IN ('Completed', 'Cancelled')
          AND milestone_target_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    ),
    next_milestones AS (
        SELECT COALESCE(json_agg(t ORDER BY t.milestone_target_date ASC), '[]'::json) as milestones
        FROM (
            SELECT p.project_name, md.milestone_name, pmi.milestone_target_date
            FROM project_milestone_instances pmi
            JOIN projects p ON pmi.project_id = p.id
            JOIN milestone_definitions md ON pmi.milestone_definition_id = md.id
            WHERE pmi.milestone_status NOT IN ('Completed', 'Cancelled')
              AND pmi.milestone_target_date >= CURRENT_DATE
              AND p.project_status = 'Active'
            ORDER BY pmi.milestone_target_date ASC
            LIMIT 5
        ) t
    )
    SELECT json_build_object(
        'active_projects', ap.count,
        'projects_at_risk', rp.count,
        'upcoming_deadlines', ud.count,
        'next_milestones', nm.milestones
    ) INTO result
    FROM active_projects ap
    CROSS JOIN risk_projects rp
    CROSS JOIN upcoming_deadlines ud
    CROSS JOIN next_milestones nm;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_global_dashboard_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_projects_with_details"() RETURNS TABLE("id" bigint, "project_name" "text", "project_code" "text", "project_status" "public"."project_status_enum", "otop_percentage" numeric, "ot_percentage" numeric, "ko_percentage" numeric, "total_components" bigint, "overdue_action_plans_count" bigint, "next_milestone_name" "text", "next_milestone_date" "date")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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
        GROUP BY p.id
    ),
    -- CTE per i piani d'azione scaduti
    overdue_plans AS (
        SELECT
            pc.project_id,
            COUNT(ap.id) as overdue_count
        FROM action_plans ap
        JOIN parent_components pc ON ap.parent_component_id = pc.id
        WHERE
            ap.due_date < CURRENT_DATE
            AND ap.action_plan_status NOT IN ('Completed', 'Verified', 'Cancelled')
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
        WHERE pmi.milestone_status <> 'Completed' AND pmi.milestone_target_date >= CURRENT_DATE
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
    LEFT JOIN next_milestones nm ON p.id = nm.project_id AND nm.rn = 1;
END;
$$;


ALTER FUNCTION "public"."get_projects_with_details"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recent_projects_for_user"("user_id_param" "uuid", "limit_param" integer DEFAULT 4) RETURNS TABLE("project_id" bigint, "project_name" "text", "project_status" "text", "last_accessed" timestamp with time zone, "total_components" integer, "overdue_action_plans_count" integer, "otop_percentage" numeric, "ot_percentage" numeric, "ko_percentage" numeric, "next_milestone_name" "text", "next_milestone_date" "date")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
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
  AND pwd.project_status = 'Active'  -- Solo progetti attivi
  ORDER BY COALESCE(upa.last_accessed, upa.assigned_at) DESC NULLS LAST
  LIMIT limit_param;
END;
$$;


ALTER FUNCTION "public"."get_recent_projects_for_user"("user_id_param" "uuid", "limit_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_upcoming_project_timelines"("project_limit" integer DEFAULT 3) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Validazione input
    IF project_limit <= 0 OR project_limit > 100 THEN
        RAISE EXCEPTION 'project_limit deve essere tra 1 e 100, ricevuto: %', project_limit;
    END IF;

    RETURN (
        SELECT 
            COALESCE(json_agg(project_data), '[]'::json) as result
        FROM (
            SELECT 
                json_build_object(
                    'project_id', p.id,
                    'project_name', p.project_name,
                    'project_start_date', COALESCE(p.project_start_date, p.created_at::date),
                    'project_end_date', COALESCE(
                        p.project_end_date,
                        milestone_data.max_milestone_date + INTERVAL '30 days',
                        CURRENT_DATE + INTERVAL '6 months'
                    ),
                    'milestones', COALESCE(milestone_data.milestones_json, '[]'::json)
                ) as project_data
            FROM (
                -- Seleziona i progetti top con priorità ottimizzata
                SELECT 
                    pmi.project_id,
                    -- Priorità: progetti "In Progress" prima, poi per data milestone più vicina
                    MIN(CASE 
                        WHEN pmi.milestone_status = 'In Progress' THEN 1 
                        ELSE 2 
                    END) as status_priority,
                    MIN(CASE 
                        WHEN pmi.milestone_target_date >= CURRENT_DATE 
                        THEN pmi.milestone_target_date 
                        ELSE '9999-12-31'::date 
                    END) as next_milestone_date
                FROM project_milestone_instances pmi
                WHERE pmi.milestone_status NOT IN ('Completed', 'Cancelled')
                GROUP BY pmi.project_id
                ORDER BY status_priority, next_milestone_date
                LIMIT project_limit
            ) top_projects
            JOIN projects p ON p.id = top_projects.project_id
            LEFT JOIN (
                -- Pre-aggrega i dati dei milestone per evitare subquery correlate
                SELECT 
                    pmi.project_id,
                    MAX(pmi.milestone_target_date) as max_milestone_date,
                    json_agg(
                        json_build_object(
                            'milestone_name', md.milestone_name,
                            'milestone_target_date', pmi.milestone_target_date,
                            'milestone_status', pmi.milestone_status
                        ) ORDER BY pmi.milestone_target_date ASC
                    ) as milestones_json
                FROM project_milestone_instances pmi
                JOIN milestone_definitions md ON pmi.milestone_definition_id = md.id
                WHERE pmi.project_id IN (
                    SELECT pmi2.project_id
                    FROM project_milestone_instances pmi2
                    WHERE pmi2.milestone_status NOT IN ('Completed', 'Cancelled')
                    GROUP BY pmi2.project_id
                    ORDER BY 
                        MIN(CASE WHEN pmi2.milestone_status = 'In Progress' THEN 1 ELSE 2 END),
                        MIN(CASE WHEN pmi2.milestone_target_date >= CURRENT_DATE THEN pmi2.milestone_target_date ELSE '9999-12-31'::date END)
                    LIMIT project_limit
                )
                GROUP BY pmi.project_id
            ) milestone_data ON milestone_data.project_id = p.id
            ORDER BY top_projects.status_priority, top_projects.next_milestone_date
        ) final_projects
    );
END;
$$;


ALTER FUNCTION "public"."get_upcoming_project_timelines"("project_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("role_to_check" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_id_value UUID;
  has_the_role BOOLEAN;
BEGIN
    -- 1. Get the current user's ID. Return false if not authenticated.
    user_id_value := auth.uid();
    IF user_id_value IS NULL THEN
        RETURN false;
    END IF;
    
    -- 2. Check for NULL or empty role input.
    IF role_to_check IS NULL OR BTRIM(role_to_check) = '' THEN
        RETURN false;
    END IF;

    -- 3. Perform the check.
    SELECT EXISTS (
        SELECT 1
        FROM public.user_role_assignments ura
        JOIN public.user_roles ur ON ura.role_id = ur.id
        WHERE ura.user_id = user_id_value AND ur.role_name = role_to_check
    ) INTO has_the_role;

    RETURN has_the_role;

EXCEPTION
    -- In case of any unexpected error during the query, log it and return false.
    WHEN OTHERS THEN
        RAISE WARNING 'Error in has_role function: %', SQLERRM;
        RETURN false;
END;
$$;


ALTER FUNCTION "public"."has_role"("role_to_check" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_assigned_to_project"("project_id_to_check" bigint) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    user_id_value UUID;
    is_assigned BOOLEAN;
BEGIN
    -- 1. Get the current user's ID. Return false if not authenticated.
    user_id_value := auth.uid();
    IF user_id_value IS NULL THEN
        RETURN false;
    END IF;

    -- 2. Check for NULL project ID.
    IF project_id_to_check IS NULL THEN
        RETURN false;
    END IF;

    -- 3. Check for high-privilege roles first. This is an optimization.
    IF public.has_role('Super User') OR public.has_role('Supplier Quality') OR public.has_role('Engineering') THEN
        RETURN true;
    END IF;

    -- 4. For other roles (like External User), check the assignment table.
    SELECT EXISTS (
        SELECT 1
        FROM public.user_project_assignments upa
        WHERE upa.project_id = project_id_to_check AND upa.user_id = user_id_value
    ) INTO is_assigned;

    RETURN is_assigned;

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in is_assigned_to_project function: %', SQLERRM;
        RETURN false;
END;
$$;


ALTER FUNCTION "public"."is_assigned_to_project"("project_id_to_check" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    audit_record_id TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        audit_record_id := NEW.id::text;
        INSERT INTO public.audit_log (table_name, record_id, action_type, new_values, changed_by_user_id)
        VALUES (TG_TABLE_NAME, audit_record_id, 'INSERT', to_jsonb(NEW), auth.uid());
    ELSIF TG_OP = 'UPDATE' THEN
        audit_record_id := NEW.id::text;
        INSERT INTO public.audit_log (table_name, record_id, action_type, old_values, new_values, changed_by_user_id)
        VALUES (TG_TABLE_NAME, audit_record_id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    ELSIF TG_OP = 'DELETE' THEN
        audit_record_id := OLD.id::text;
        INSERT INTO public.audit_log (table_name, record_id, action_type, old_values, changed_by_user_id)
        VALUES (TG_TABLE_NAME, audit_record_id, 'DELETE', to_jsonb(OLD), auth.uid());
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."log_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_all_parent_statuses"("p_project_id" bigint DEFAULT NULL::bigint) RETURNS TABLE("parent_id" bigint, "old_status" "public"."parent_status_enum", "new_status" "public"."parent_status_enum", "calculation_time" interval)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    rec RECORD;
    v_old_status public.parent_status_enum;
    v_new_status public.parent_status_enum;
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
    v_total_processed INT := 0;
BEGIN
    v_start_time := NOW();
    
    FOR rec IN 
        SELECT pc.id 
        FROM public.parent_components pc
        JOIN public.projects p ON pc.project_id = p.id
        WHERE p.project_status = 'Active'
          AND (p_project_id IS NULL OR p.id = p_project_id)
        ORDER BY pc.id
    LOOP
        SELECT calculated_parent_status 
        INTO v_old_status 
        FROM public.parent_components 
        WHERE id = rec.id;
        
        -- Forza il ricalcolo usando l'ultima valutazione disponibile
        UPDATE public.cavity_evaluations 
        SET last_modified = NOW()
        WHERE id = (
            SELECT id 
            FROM public.cavity_evaluations 
            WHERE parent_component_id = rec.id 
            ORDER BY evaluation_date DESC, id DESC 
            LIMIT 1
        );
        
        SELECT calculated_parent_status 
        INTO v_new_status 
        FROM public.parent_components 
        WHERE id = rec.id;

        v_total_processed := v_total_processed + 1;
        v_end_time := NOW();

        IF v_old_status IS DISTINCT FROM v_new_status THEN
           RETURN QUERY SELECT 
               rec.id, 
               v_old_status, 
               v_new_status,
               v_end_time - v_start_time;
        END IF;
    END LOOP;
    
    v_end_time := NOW();
    RAISE LOG 'Recalculation completed. Processed % parent components in %', 
        v_total_processed, v_end_time - v_start_time;
END;
$$;


ALTER FUNCTION "public"."recalculate_all_parent_statuses"("p_project_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."recalculate_all_parent_statuses"("p_project_id" bigint) IS 'Forces recalculation of parent component statuses. Optional project_id parameter to limit scope.';



CREATE OR REPLACE FUNCTION "public"."update_notification_read_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NEW.is_read = true AND OLD.is_read = false THEN
        NEW.read_at = NOW();
    ELSIF NEW.is_read = false AND OLD.is_read = true THEN
        NEW.read_at = NULL;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_notification_read_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_parent_component_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_parent_id BIGINT;
    v_drawing_id BIGINT;
    v_mold_type public.mold_type_enum;
    v_is_toolmaker_location BOOLEAN;
    v_total_cavities INT;
    v_total_std_dims INT;
    v_total_spc_dims INT;
    v_evaluated_cavities_count INT := 0;
    v_dim_ok_cavities_count INT := 0;
    v_process_ok_cavities_count INT := 0;
    v_ko_cavities_count INT := 0;
    v_new_status public.parent_status_enum;
    v_old_status public.parent_status_enum;
BEGIN
    -- Determina l'ID del componente padre
    IF TG_OP = 'DELETE' THEN
        v_parent_id := OLD.parent_component_id;
    ELSE
        v_parent_id := NEW.parent_component_id;
    END IF;

    -- Verifica che il componente padre esista
    IF NOT EXISTS (SELECT 1 FROM public.parent_components WHERE id = v_parent_id) THEN
        RAISE WARNING 'Parent component % does not exist', v_parent_id;
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Ottieni informazioni del componente padre
    SELECT
        pc.drawing_id, pc.calculated_parent_status, m.mold_type, 
        ml.is_toolmaker_location, m.total_cavities, 
        COALESCE(d.total_standard_dimensions, 0), 
        COALESCE(d.total_spc_dimensions, 0)
    INTO
        v_drawing_id, v_old_status, v_mold_type, 
        v_is_toolmaker_location, v_total_cavities, v_total_std_dims, v_total_spc_dims
    FROM public.parent_components pc
    JOIN public.molds m ON pc.mold_id = m.id
    JOIN public.mold_locations ml ON m.mold_location_id = ml.id
    LEFT JOIN public.drawings d ON pc.drawing_id = d.id
    WHERE pc.id = v_parent_id;

    IF NOT FOUND THEN
        RAISE WARNING 'Parent component % not found during status calculation', v_parent_id;
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Calcola statistiche delle valutazioni
    WITH latest_evaluations AS (
        SELECT DISTINCT ON (cavity_number) 
            ce.id, ce.cavity_number, 
            COALESCE(ce.standard_dimensions_ok_count, 0) as standard_dimensions_ok_count,
            COALESCE(ce.spc_dimensions_ok_count, 0) as spc_dimensions_ok_count, 
            COALESCE(ce.is_evaluated_in_report, false) as is_evaluated_in_report
        FROM public.cavity_evaluations ce
        WHERE ce.parent_component_id = v_parent_id
          AND ce.cavity_number BETWEEN 1 AND v_total_cavities
        ORDER BY ce.cavity_number, ce.evaluation_date DESC, ce.id DESC
    ),
    cavity_status AS (
        SELECT
            cavity_number,
            (le.standard_dimensions_ok_count >= v_total_std_dims AND 
             le.spc_dimensions_ok_count >= v_total_spc_dims AND
             le.is_evaluated_in_report = true) as is_dimensionally_ok,
            public.check_spc_conformity(le.id) as is_process_ok
        FROM latest_evaluations le
    )
    SELECT
        COUNT(*)::INT,
        SUM(CASE WHEN cs.is_dimensionally_ok THEN 1 ELSE 0 END)::INT,
        SUM(CASE WHEN cs.is_process_ok THEN 1 ELSE 0 END)::INT,
        SUM(CASE 
            WHEN NOT cs.is_dimensionally_ok THEN 1
            WHEN NOT cs.is_process_ok AND v_mold_type IN ('Definitive', 'Low Volume') 
                 AND v_is_toolmaker_location = false THEN 1
            ELSE 0 
        END)::INT
    INTO
        v_evaluated_cavities_count, v_dim_ok_cavities_count,
        v_process_ok_cavities_count, v_ko_cavities_count
    FROM cavity_status cs;

    -- Assicura valori non null
    v_evaluated_cavities_count := COALESCE(v_evaluated_cavities_count, 0);
    v_dim_ok_cavities_count := COALESCE(v_dim_ok_cavities_count, 0);
    v_process_ok_cavities_count := COALESCE(v_process_ok_cavities_count, 0);
    v_ko_cavities_count := COALESCE(v_ko_cavities_count, 0);

    -- Logica di determinazione dello stato
    CASE
        WHEN v_evaluated_cavities_count = 0 THEN 
            v_new_status := 'NEW';
        WHEN v_evaluated_cavities_count < v_total_cavities THEN 
            v_new_status := 'INCOMPLETE_DATA';
        WHEN v_ko_cavities_count > 0 THEN 
            v_new_status := 'KO';
        WHEN v_mold_type = 'Prototype' THEN 
            v_new_status := 'NOT_OFF_TOOL';
        WHEN v_mold_type IN ('Definitive', 'Low Volume') THEN
            IF v_is_toolmaker_location = true THEN
                IF v_dim_ok_cavities_count = v_total_cavities THEN 
                    v_new_status := 'OT';
                ELSE 
                    v_new_status := 'INCOMPLETE_DATA'; 
                END IF;
            ELSE
                IF v_dim_ok_cavities_count = v_total_cavities AND v_process_ok_cavities_count = v_total_cavities THEN 
                    v_new_status := 'OTOP';
                ELSIF v_dim_ok_cavities_count = v_total_cavities THEN 
                    v_new_status := 'P_OTOP';
                ELSE 
                    v_new_status := 'INCOMPLETE_DATA'; 
                END IF;
            END IF;
        ELSE 
            v_new_status := 'INCOMPLETE_DATA';
    END CASE;

    -- Aggiorna lo stato solo se è cambiato
    IF v_old_status IS DISTINCT FROM v_new_status THEN
        UPDATE public.parent_components
        SET 
            calculated_parent_status = v_new_status,
            last_status_calculation_date = NOW()
        WHERE id = v_parent_id;
        
        RAISE LOG 'Parent component % status updated from % to %', 
            v_parent_id, COALESCE(v_old_status::text, 'NULL'), v_new_status;
    END IF;

    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error updating parent component % status: %', v_parent_id, SQLERRM;
        RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_parent_component_status"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_parent_component_status"() IS 'Calculates and updates parent component status based on cavity evaluations and SPC conformity.';



CREATE OR REPLACE FUNCTION "public"."update_parent_status_from_spc"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_evaluation_id BIGINT;
    v_parent_id BIGINT;
BEGIN
    v_evaluation_id := CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.cavity_evaluation_id 
        ELSE NEW.cavity_evaluation_id 
    END;
    
    -- Verifica che la valutazione esista e ottieni il parent_id
    SELECT parent_component_id INTO v_parent_id
    FROM public.cavity_evaluations 
    WHERE id = v_evaluation_id;
    
    IF NOT FOUND THEN
        RAISE WARNING 'Cavity evaluation % not found for SPC trigger', v_evaluation_id;
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Forza il ricalcolo toccando la valutazione
    UPDATE public.cavity_evaluations
    SET last_modified = COALESCE(last_modified, NOW())
    WHERE id = v_evaluation_id;
    
    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in SPC trigger for evaluation %: %', v_evaluation_id, SQLERRM;
        RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_parent_status_from_spc"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_parent_status_from_spc"() IS 'Triggers parent status recalculation when SPC values change.';



CREATE OR REPLACE FUNCTION "public"."update_project_last_accessed"("project_id_param" bigint, "user_id_param" "uuid" DEFAULT "auth"."uid"()) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE user_project_assignments
  SET last_accessed = NOW()
  WHERE project_id = project_id_param 
  AND user_id = user_id_param;
END;
$$;


ALTER FUNCTION "public"."update_project_last_accessed"("project_id_param" bigint, "user_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_data_integrity"() RETURNS TABLE("check_name" "text", "status" "text", "details" "text", "affected_count" bigint)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_count BIGINT;
BEGIN
    -- Validazione numeri cavità
    SELECT COUNT(*) INTO v_count
    FROM public.cavity_evaluations ce
    JOIN public.parent_components pc ON ce.parent_component_id = pc.id
    JOIN public.molds m ON pc.mold_id = m.id
    WHERE ce.cavity_number > m.total_cavities OR ce.cavity_number <= 0;
    
    RETURN QUERY
    SELECT 
        'Cavity Numbers Validation'::TEXT,
        CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        CASE WHEN v_count = 0 THEN 'All cavity numbers are valid' 
             ELSE v_count::TEXT || ' invalid cavity numbers found' END::TEXT,
        v_count;
    
    -- Validazione coerenza date
    SELECT COUNT(*) INTO v_count
    FROM public.parent_components
    WHERE (planned_ot_date IS NOT NULL AND planned_otop_date IS NOT NULL AND planned_otop_date < planned_ot_date)
       OR (actual_ot_date IS NOT NULL AND actual_otop_date IS NOT NULL AND actual_otop_date < actual_otop_date);
       
    RETURN QUERY
    SELECT 
        'Date Consistency Validation'::TEXT,
        CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        CASE WHEN v_count = 0 THEN 'All dates are consistent' 
             ELSE v_count::TEXT || ' inconsistent dates found' END::TEXT,
        v_count;
    
    -- Validazione referenze orfane
    SELECT COUNT(*) INTO v_count
    FROM public.cavity_evaluations ce
    LEFT JOIN public.parent_components pc ON ce.parent_component_id = pc.id
    WHERE pc.id IS NULL;
    
    RETURN QUERY
    SELECT 
        'Orphaned Evaluations Validation'::TEXT,
        CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        CASE WHEN v_count = 0 THEN 'No orphaned evaluations found' 
             ELSE v_count::TEXT || ' orphaned evaluations found' END::TEXT,
        v_count;
    
    -- Validazione valori SPC orfani
    SELECT COUNT(*) INTO v_count
    FROM public.spc_values sv
    LEFT JOIN public.cavity_evaluations ce ON sv.cavity_evaluation_id = ce.id
    WHERE ce.id IS NULL;
    
    RETURN QUERY
    SELECT 
        'Orphaned SPC Values Validation'::TEXT,
        CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        CASE WHEN v_count = 0 THEN 'No orphaned SPC values found' 
             ELSE v_count::TEXT || ' orphaned SPC values found' END::TEXT,
        v_count;
       
END;
$$;


ALTER FUNCTION "public"."validate_data_integrity"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_data_integrity"() IS 'Comprehensive data integrity validation with detailed reporting.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."action_plans" (
    "id" bigint NOT NULL,
    "parent_component_id" bigint NOT NULL,
    "action_type_id" bigint NOT NULL,
    "action_plan_description" "text" NOT NULL,
    "responsible_user_id" "uuid",
    "due_date" "date" NOT NULL,
    "action_plan_status" "public"."action_plan_status_enum" DEFAULT 'Open'::"public"."action_plan_status_enum" NOT NULL,
    "priority_level" integer DEFAULT 5,
    "notes" "text",
    "created_by_user_id" "uuid" NOT NULL,
    "completed_date" "date",
    "verified_date" "date",
    "verified_by_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "action_plans_priority_level_check" CHECK ((("priority_level" >= 1) AND ("priority_level" <= 10))),
    CONSTRAINT "check_action_plan_dates_logic" CHECK ((("due_date" >= ("created_at")::"date") AND (("completed_date" IS NULL) OR (("completed_date" >= ("created_at")::"date") AND ("completed_date" <= CURRENT_DATE))) AND (("verified_date" IS NULL) OR (("completed_date" IS NOT NULL) AND ("verified_date" >= "completed_date") AND ("verified_date" <= CURRENT_DATE)))))
);


ALTER TABLE "public"."action_plans" OWNER TO "postgres";


COMMENT ON TABLE "public"."action_plans" IS 'Stores action plans to address issues for parent components.';



CREATE SEQUENCE IF NOT EXISTS "public"."action_plans_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."action_plans_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."action_plans_id_seq" OWNED BY "public"."action_plans"."id";



CREATE TABLE IF NOT EXISTS "public"."action_types" (
    "id" bigint NOT NULL,
    "action_type_name" "text" NOT NULL,
    "action_type_description" "text",
    "triggers_tryout_counter" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."action_types" OWNER TO "postgres";


COMMENT ON TABLE "public"."action_types" IS 'Defines the standard types of actions for Action Plans.';



CREATE SEQUENCE IF NOT EXISTS "public"."action_types_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."action_types_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."action_types_id_seq" OWNED BY "public"."action_types"."id";



CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" bigint NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "text" NOT NULL,
    "action_type" "text" NOT NULL,
    "old_values" "jsonb",
    "new_values" "jsonb",
    "changed_by_user_id" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "audit_log_action_type_check" CHECK (("action_type" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text"])))
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."audit_log" IS 'Audit trail for tracking changes to critical data.';



CREATE TABLE IF NOT EXISTS "public"."audit_log_archive" (
    "id" bigint NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "text" NOT NULL,
    "action_type" "text" NOT NULL,
    "old_values" "jsonb",
    "new_values" "jsonb",
    "changed_by_user_id" "uuid",
    "changed_at" timestamp with time zone NOT NULL,
    "archived_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_log_archive" OWNER TO "postgres";


COMMENT ON TABLE "public"."audit_log_archive" IS 'Archive table for old audit log records.';



CREATE SEQUENCE IF NOT EXISTS "public"."audit_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."audit_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."audit_log_id_seq" OWNED BY "public"."audit_log"."id";



CREATE TABLE IF NOT EXISTS "public"."cavity_evaluations" (
    "id" bigint NOT NULL,
    "parent_component_id" bigint NOT NULL,
    "cavity_number" integer NOT NULL,
    "evaluation_date" "date" NOT NULL,
    "external_report_id" "text",
    "report_attachment_path" "text",
    "standard_dimensions_ok_count" integer NOT NULL,
    "spc_dimensions_ok_count" integer NOT NULL,
    "cavity_notes" "text",
    "is_evaluated_in_report" boolean DEFAULT true NOT NULL,
    "created_by_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "cavity_evaluations_spc_dimensions_ok_count_check" CHECK (("spc_dimensions_ok_count" >= 0)),
    CONSTRAINT "cavity_evaluations_standard_dimensions_ok_count_check" CHECK (("standard_dimensions_ok_count" >= 0)),
    CONSTRAINT "check_cavity_evaluation_date" CHECK (("evaluation_date" <= CURRENT_DATE))
);


ALTER TABLE "public"."cavity_evaluations" OWNER TO "postgres";


COMMENT ON TABLE "public"."cavity_evaluations" IS 'Records dimensional results for a specific cavity at a point in time.';



CREATE SEQUENCE IF NOT EXISTS "public"."cavity_evaluations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."cavity_evaluations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."cavity_evaluations_id_seq" OWNED BY "public"."cavity_evaluations"."id";



CREATE TABLE IF NOT EXISTS "public"."component_classifications" (
    "id" bigint NOT NULL,
    "classification_code" "text" NOT NULL,
    "classification_description" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."component_classifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."component_classifications" IS 'Defines the different component classifications (e.g., F1, F2).';



CREATE SEQUENCE IF NOT EXISTS "public"."component_classifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."component_classifications_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."component_classifications_id_seq" OWNED BY "public"."component_classifications"."id";



CREATE TABLE IF NOT EXISTS "public"."drawings" (
    "id" bigint NOT NULL,
    "item_code" "text" NOT NULL,
    "drawing_version" "text" NOT NULL,
    "component_description" "text" NOT NULL,
    "component_classification_id" bigint NOT NULL,
    "total_standard_dimensions" integer NOT NULL,
    "total_spc_dimensions" integer NOT NULL,
    "food_contact" boolean DEFAULT false NOT NULL,
    "removable" boolean DEFAULT false NOT NULL,
    "drawing_attachment_path" "text",
    "revision_notes" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "drawings_total_spc_dimensions_check" CHECK (("total_spc_dimensions" >= 0)),
    CONSTRAINT "drawings_total_standard_dimensions_check" CHECK (("total_standard_dimensions" >= 0))
);


ALTER TABLE "public"."drawings" OWNER TO "postgres";


COMMENT ON TABLE "public"."drawings" IS 'Master data for component drawings and their versions.';



CREATE SEQUENCE IF NOT EXISTS "public"."drawings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."drawings_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."drawings_id_seq" OWNED BY "public"."drawings"."id";



CREATE TABLE IF NOT EXISTS "public"."milestone_definitions" (
    "id" bigint NOT NULL,
    "milestone_name" "text" NOT NULL,
    "milestone_description" "text",
    "milestone_order" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."milestone_definitions" OWNER TO "postgres";


COMMENT ON TABLE "public"."milestone_definitions" IS 'Defines standard milestone types (e.g., EB1, PP).';



CREATE SEQUENCE IF NOT EXISTS "public"."milestone_definitions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."milestone_definitions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."milestone_definitions_id_seq" OWNED BY "public"."milestone_definitions"."id";



CREATE TABLE IF NOT EXISTS "public"."mold_locations" (
    "id" bigint NOT NULL,
    "location_name" "text" NOT NULL,
    "location_description" "text",
    "location_address" "text",
    "is_toolmaker_location" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."mold_locations" OWNER TO "postgres";


COMMENT ON TABLE "public"."mold_locations" IS 'Defines possible locations for molds. is_toolmaker_location flag determines OT/OTOP logic.';



CREATE SEQUENCE IF NOT EXISTS "public"."mold_locations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."mold_locations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."mold_locations_id_seq" OWNED BY "public"."mold_locations"."id";



CREATE TABLE IF NOT EXISTS "public"."molds" (
    "id" bigint NOT NULL,
    "mold_code" "text" NOT NULL,
    "mold_description" "text",
    "total_cavities" integer NOT NULL,
    "mold_type" "public"."mold_type_enum" NOT NULL,
    "mold_location_id" bigint NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "purchase_date" "date",
    "maintenance_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "molds_total_cavities_check" CHECK (("total_cavities" > 0))
);


ALTER TABLE "public"."molds" OWNER TO "postgres";


COMMENT ON TABLE "public"."molds" IS 'Master data for molds used in production.';



CREATE SEQUENCE IF NOT EXISTS "public"."molds_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."molds_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."molds_id_seq" OWNED BY "public"."molds"."id";



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "notification_type" "public"."notification_type_enum" NOT NULL,
    "action_plan_id" bigint,
    "parent_component_id" bigint,
    "project_id" bigint,
    "is_read" boolean DEFAULT false NOT NULL,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "check_one_primary_link" CHECK (((("action_plan_id" IS NOT NULL) AND ("parent_component_id" IS NULL) AND ("project_id" IS NULL)) OR (("action_plan_id" IS NULL) AND ("parent_component_id" IS NOT NULL) AND ("project_id" IS NULL)) OR (("action_plan_id" IS NULL) AND ("parent_component_id" IS NULL) AND ("project_id" IS NOT NULL)) OR (("action_plan_id" IS NULL) AND ("parent_component_id" IS NULL) AND ("project_id" IS NULL))))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'Stores in-app notifications for users, with type-safe foreign keys.';



CREATE SEQUENCE IF NOT EXISTS "public"."notifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."notifications_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."notifications_id_seq" OWNED BY "public"."notifications"."id";



CREATE TABLE IF NOT EXISTS "public"."otop_target_rules" (
    "id" bigint NOT NULL,
    "component_classification_id" bigint NOT NULL,
    "target_milestone_definition_id" bigint NOT NULL,
    "target_status_type" "public"."target_status_type_enum" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."otop_target_rules" OWNER TO "postgres";


COMMENT ON TABLE "public"."otop_target_rules" IS 'Defines target rules for OT/OTOP achievement based on classification.';



CREATE SEQUENCE IF NOT EXISTS "public"."otop_target_rules_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."otop_target_rules_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."otop_target_rules_id_seq" OWNED BY "public"."otop_target_rules"."id";



CREATE TABLE IF NOT EXISTS "public"."parent_components" (
    "id" bigint NOT NULL,
    "project_id" bigint NOT NULL,
    "drawing_id" bigint NOT NULL,
    "mold_id" bigint NOT NULL,
    "calculated_parent_status" "public"."parent_status_enum" DEFAULT 'NEW'::"public"."parent_status_enum" NOT NULL,
    "last_status_calculation_date" timestamp with time zone,
    "planned_ot_date" "date",
    "actual_ot_date" "date",
    "planned_otop_date" "date",
    "actual_otop_date" "date",
    "tryout_counter" integer DEFAULT 0 NOT NULL,
    "action_plan_required" boolean DEFAULT false NOT NULL,
    "priority_level" integer DEFAULT 5,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "check_actual_dates_order" CHECK ((("actual_ot_date" IS NULL) OR ("actual_otop_date" IS NULL) OR ("actual_otop_date" >= "actual_ot_date"))),
    CONSTRAINT "check_planned_dates_order" CHECK ((("planned_ot_date" IS NULL) OR ("planned_otop_date" IS NULL) OR ("planned_otop_date" >= "planned_ot_date"))),
    CONSTRAINT "parent_components_priority_level_check" CHECK ((("priority_level" >= 1) AND ("priority_level" <= 10))),
    CONSTRAINT "parent_components_tryout_counter_check" CHECK (("tryout_counter" >= 0))
);


ALTER TABLE "public"."parent_components" OWNER TO "postgres";


COMMENT ON TABLE "public"."parent_components" IS 'Core entity linking Project, Drawing, and Mold. Tracks overall status.';



CREATE SEQUENCE IF NOT EXISTS "public"."parent_components_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."parent_components_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."parent_components_id_seq" OWNED BY "public"."parent_components"."id";



CREATE TABLE IF NOT EXISTS "public"."project_milestone_instances" (
    "id" bigint NOT NULL,
    "project_id" bigint NOT NULL,
    "milestone_definition_id" bigint NOT NULL,
    "milestone_target_date" "date" NOT NULL,
    "milestone_actual_date" "date",
    "milestone_status" "public"."milestone_status_enum" DEFAULT 'Planned'::"public"."milestone_status_enum" NOT NULL,
    "notes" "text",
    "updated_by_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "check_milestone_actual_date" CHECK ((("milestone_actual_date" IS NULL) OR ("milestone_actual_date" <= CURRENT_DATE)))
);


ALTER TABLE "public"."project_milestone_instances" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_milestone_instances" IS 'Instance of a milestone with a specific date within a project.';



CREATE SEQUENCE IF NOT EXISTS "public"."project_milestone_instances_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."project_milestone_instances_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."project_milestone_instances_id_seq" OWNED BY "public"."project_milestone_instances"."id";



CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" bigint NOT NULL,
    "project_name" "text" NOT NULL,
    "project_code" "text",
    "project_description" "text",
    "project_start_date" "date",
    "project_end_date" "date",
    "project_manager_user_id" "uuid",
    "project_status" "public"."project_status_enum" DEFAULT 'Active'::"public"."project_status_enum" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "check_project_dates" CHECK ((("project_end_date" IS NULL) OR ("project_start_date" IS NULL) OR ("project_end_date" >= "project_start_date")))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON TABLE "public"."projects" IS 'Stores project master data.';



CREATE SEQUENCE IF NOT EXISTS "public"."projects_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."projects_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."projects_id_seq" OWNED BY "public"."projects"."id";



CREATE TABLE IF NOT EXISTS "public"."spc_values" (
    "id" bigint NOT NULL,
    "cavity_evaluation_id" bigint NOT NULL,
    "spc_dimension_identifier" "text" NOT NULL,
    "cp_value" numeric(10,3),
    "cpk_value" numeric(10,3),
    "target_value" numeric(10,3),
    "measured_value" numeric(10,3),
    "tolerance_upper" numeric(10,3),
    "tolerance_lower" numeric(10,3),
    CONSTRAINT "check_tolerance_order" CHECK ((("tolerance_upper" IS NULL) OR ("tolerance_lower" IS NULL) OR ("tolerance_upper" >= "tolerance_lower"))),
    CONSTRAINT "spc_values_cp_value_check" CHECK ((("cp_value" IS NULL) OR ("cp_value" >= (0)::numeric)))
);


ALTER TABLE "public"."spc_values" OWNER TO "postgres";


COMMENT ON TABLE "public"."spc_values" IS 'Stores Cp, Cpk values and tolerances for each SPC dimension of a cavity evaluation.';



CREATE SEQUENCE IF NOT EXISTS "public"."spc_values_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."spc_values_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."spc_values_id_seq" OWNED BY "public"."spc_values"."id";



CREATE TABLE IF NOT EXISTS "public"."user_project_assignments" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" bigint NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "assigned_by_user_id" "uuid",
    "last_accessed" timestamp with time zone
);


ALTER TABLE "public"."user_project_assignments" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_project_assignments" IS 'Links external users to the projects they can access.';



CREATE SEQUENCE IF NOT EXISTS "public"."user_project_assignments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_project_assignments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_project_assignments_id_seq" OWNED BY "public"."user_project_assignments"."id";



CREATE TABLE IF NOT EXISTS "public"."user_role_assignments" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role_id" bigint NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "assigned_by_user_id" "uuid"
);


ALTER TABLE "public"."user_role_assignments" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_role_assignments" IS 'Links users to their assigned roles. A user can have multiple roles.';



CREATE SEQUENCE IF NOT EXISTS "public"."user_role_assignments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_role_assignments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_role_assignments_id_seq" OWNED BY "public"."user_role_assignments"."id";



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" bigint NOT NULL,
    "role_name" "text" NOT NULL,
    "role_description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_roles" IS 'Defines the available roles within the system (e.g., External User, Super User).';



CREATE SEQUENCE IF NOT EXISTS "public"."user_roles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_roles_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_roles_id_seq" OWNED BY "public"."user_roles"."id";



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "last_login_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'Stores user profile information, extending Supabase auth.users.';



CREATE OR REPLACE VIEW "public"."v_action_plans_detailed" WITH ("security_invoker"='true') AS
 SELECT "ap"."id",
    "ap"."action_plan_description",
    "ap"."action_plan_status",
    "ap"."due_date",
    "ap"."priority_level",
    "ap"."created_at",
    "ap"."completed_date",
    "u_responsible"."full_name" AS "responsible_user_name",
    "u_creator"."full_name" AS "created_by_user_name",
    "at"."action_type_name",
    "p"."project_name",
    "d"."item_code",
    "d"."component_description",
    "pc"."calculated_parent_status"
   FROM (((((("public"."action_plans" "ap"
     JOIN "public"."parent_components" "pc" ON (("ap"."parent_component_id" = "pc"."id")))
     JOIN "public"."projects" "p" ON (("pc"."project_id" = "p"."id")))
     JOIN "public"."drawings" "d" ON (("pc"."drawing_id" = "d"."id")))
     JOIN "public"."action_types" "at" ON (("ap"."action_type_id" = "at"."id")))
     JOIN "public"."users" "u_creator" ON (("ap"."created_by_user_id" = "u_creator"."id")))
     LEFT JOIN "public"."users" "u_responsible" ON (("ap"."responsible_user_id" = "u_responsible"."id")));


ALTER VIEW "public"."v_action_plans_detailed" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_parent_components_dashboard" WITH ("security_invoker"='true') AS
 WITH "active_plans_count" AS (
         SELECT "action_plans"."parent_component_id",
            "count"(*) AS "count"
           FROM "public"."action_plans"
          WHERE ("action_plans"."action_plan_status" = ANY (ARRAY['Open'::"public"."action_plan_status_enum", 'In Progress'::"public"."action_plan_status_enum"]))
          GROUP BY "action_plans"."parent_component_id"
        )
 SELECT "pc"."id",
    "pc"."calculated_parent_status",
    "p"."project_name",
    "p"."project_code",
    "d"."item_code",
    "d"."drawing_version",
    "d"."component_description",
    "cc"."classification_code",
    "m"."mold_code",
    "ml"."location_name",
    "m"."is_active" AS "is_mold_active",
    "d"."food_contact",
    "d"."removable",
    "pc"."planned_ot_date",
    "pc"."actual_ot_date",
    "pc"."planned_otop_date",
    "pc"."actual_otop_date",
    "pc"."tryout_counter",
    "pc"."action_plan_required",
    "pc"."priority_level",
    COALESCE("apc"."count", (0)::bigint) AS "active_action_plans_count"
   FROM (((((("public"."parent_components" "pc"
     JOIN "public"."projects" "p" ON (("pc"."project_id" = "p"."id")))
     JOIN "public"."drawings" "d" ON (("pc"."drawing_id" = "d"."id")))
     JOIN "public"."component_classifications" "cc" ON (("d"."component_classification_id" = "cc"."id")))
     JOIN "public"."molds" "m" ON (("pc"."mold_id" = "m"."id")))
     JOIN "public"."mold_locations" "ml" ON (("m"."mold_location_id" = "ml"."id")))
     LEFT JOIN "active_plans_count" "apc" ON (("pc"."id" = "apc"."parent_component_id")))
  WHERE ("p"."project_status" = 'Active'::"public"."project_status_enum");


ALTER VIEW "public"."v_parent_components_dashboard" OWNER TO "postgres";


ALTER TABLE ONLY "public"."action_plans" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."action_plans_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."action_types" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."action_types_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."audit_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."audit_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."cavity_evaluations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."cavity_evaluations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."component_classifications" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."component_classifications_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."drawings" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."drawings_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."milestone_definitions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."milestone_definitions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."mold_locations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."mold_locations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."molds" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."molds_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."notifications" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."notifications_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."otop_target_rules" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."otop_target_rules_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."parent_components" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."parent_components_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."project_milestone_instances" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."project_milestone_instances_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."projects" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."projects_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."spc_values" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."spc_values_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_project_assignments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_project_assignments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_role_assignments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_role_assignments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_roles" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_roles_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."action_plans"
    ADD CONSTRAINT "action_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."action_types"
    ADD CONSTRAINT "action_types_action_type_name_key" UNIQUE ("action_type_name");



ALTER TABLE ONLY "public"."action_types"
    ADD CONSTRAINT "action_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log_archive"
    ADD CONSTRAINT "audit_log_archive_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cavity_evaluations"
    ADD CONSTRAINT "cavity_evaluations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."component_classifications"
    ADD CONSTRAINT "component_classifications_classification_code_key" UNIQUE ("classification_code");



ALTER TABLE ONLY "public"."component_classifications"
    ADD CONSTRAINT "component_classifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drawings"
    ADD CONSTRAINT "drawings_item_code_drawing_version_key" UNIQUE ("item_code", "drawing_version");



ALTER TABLE ONLY "public"."drawings"
    ADD CONSTRAINT "drawings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."milestone_definitions"
    ADD CONSTRAINT "milestone_definitions_milestone_name_key" UNIQUE ("milestone_name");



ALTER TABLE ONLY "public"."milestone_definitions"
    ADD CONSTRAINT "milestone_definitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mold_locations"
    ADD CONSTRAINT "mold_locations_location_name_key" UNIQUE ("location_name");



ALTER TABLE ONLY "public"."mold_locations"
    ADD CONSTRAINT "mold_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."molds"
    ADD CONSTRAINT "molds_mold_code_key" UNIQUE ("mold_code");



ALTER TABLE ONLY "public"."molds"
    ADD CONSTRAINT "molds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."otop_target_rules"
    ADD CONSTRAINT "otop_target_rules_component_classification_id_target_status_key" UNIQUE ("component_classification_id", "target_status_type");



ALTER TABLE ONLY "public"."otop_target_rules"
    ADD CONSTRAINT "otop_target_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parent_components"
    ADD CONSTRAINT "parent_components_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parent_components"
    ADD CONSTRAINT "parent_components_project_id_drawing_id_mold_id_key" UNIQUE ("project_id", "drawing_id", "mold_id");



ALTER TABLE ONLY "public"."project_milestone_instances"
    ADD CONSTRAINT "project_milestone_instances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_milestone_instances"
    ADD CONSTRAINT "project_milestone_instances_project_id_milestone_definition_key" UNIQUE ("project_id", "milestone_definition_id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_project_code_key" UNIQUE ("project_code");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_project_name_key" UNIQUE ("project_name");



ALTER TABLE ONLY "public"."spc_values"
    ADD CONSTRAINT "spc_values_cavity_evaluation_id_spc_dimension_identifier_key" UNIQUE ("cavity_evaluation_id", "spc_dimension_identifier");



ALTER TABLE ONLY "public"."spc_values"
    ADD CONSTRAINT "spc_values_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_project_assignments"
    ADD CONSTRAINT "user_project_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_project_assignments"
    ADD CONSTRAINT "user_project_assignments_user_id_project_id_key" UNIQUE ("user_id", "project_id");



ALTER TABLE ONLY "public"."user_role_assignments"
    ADD CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_role_assignments"
    ADD CONSTRAINT "user_role_assignments_user_id_role_id_key" UNIQUE ("user_id", "role_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_name_key" UNIQUE ("role_name");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_action_plans_due_date" ON "public"."action_plans" USING "btree" ("due_date");



CREATE INDEX "idx_action_plans_parent_component_id" ON "public"."action_plans" USING "btree" ("parent_component_id");



CREATE INDEX "idx_action_plans_parent_status" ON "public"."action_plans" USING "btree" ("parent_component_id", "action_plan_status");



CREATE INDEX "idx_action_plans_responsible_status" ON "public"."action_plans" USING "btree" ("responsible_user_id", "action_plan_status");



CREATE INDEX "idx_action_plans_responsible_user_id" ON "public"."action_plans" USING "btree" ("responsible_user_id");



CREATE INDEX "idx_action_plans_status" ON "public"."action_plans" USING "btree" ("action_plan_status");



CREATE INDEX "idx_action_plans_status_due_date" ON "public"."action_plans" USING "btree" ("action_plan_status", "due_date");



CREATE INDEX "idx_audit_archive_archived_at" ON "public"."audit_log_archive" USING "btree" ("archived_at");



CREATE INDEX "idx_audit_archive_changed_at" ON "public"."audit_log_archive" USING "btree" ("changed_at");



CREATE INDEX "idx_audit_archive_table_record" ON "public"."audit_log_archive" USING "btree" ("table_name", "record_id");



CREATE INDEX "idx_audit_log_table_record" ON "public"."audit_log" USING "btree" ("table_name", "record_id");



CREATE INDEX "idx_cavity_evaluations_date" ON "public"."cavity_evaluations" USING "btree" ("evaluation_date");



CREATE INDEX "idx_cavity_evaluations_parent_component_id" ON "public"."cavity_evaluations" USING "btree" ("parent_component_id");



CREATE INDEX "idx_cavity_evaluations_parent_date" ON "public"."cavity_evaluations" USING "btree" ("parent_component_id", "evaluation_date" DESC);



CREATE INDEX "idx_drawings_classification_id" ON "public"."drawings" USING "btree" ("component_classification_id");



CREATE INDEX "idx_drawings_item_code_search" ON "public"."drawings" USING "gin" ("to_tsvector"('"english"'::"regconfig", (("item_code" || ' '::"text") || "component_description")));



CREATE INDEX "idx_milestone_instances_status_date" ON "public"."project_milestone_instances" USING "btree" ("milestone_status", "milestone_target_date");



CREATE INDEX "idx_milestone_instances_target_date" ON "public"."project_milestone_instances" USING "btree" ("milestone_target_date");



CREATE INDEX "idx_molds_location_id" ON "public"."molds" USING "btree" ("mold_location_id");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_user_read" ON "public"."notifications" USING "btree" ("user_id", "is_read");



CREATE INDEX "idx_parent_components_drawing_id" ON "public"."parent_components" USING "btree" ("drawing_id");



CREATE INDEX "idx_parent_components_mold_id" ON "public"."parent_components" USING "btree" ("mold_id");



CREATE INDEX "idx_parent_components_project_status" ON "public"."parent_components" USING "btree" ("project_id", "calculated_parent_status");



CREATE INDEX "idx_parent_components_status" ON "public"."parent_components" USING "btree" ("calculated_parent_status");



CREATE INDEX "idx_project_milestone_instances_project_id" ON "public"."project_milestone_instances" USING "btree" ("project_id");



CREATE INDEX "idx_projects_manager_id" ON "public"."projects" USING "btree" ("project_manager_user_id");



CREATE INDEX "idx_projects_name_search" ON "public"."projects" USING "gin" ("to_tsvector"('"english"'::"regconfig", (("project_name" || ' '::"text") || COALESCE("project_description", ''::"text"))));



CREATE INDEX "idx_projects_status" ON "public"."projects" USING "btree" ("project_status");



CREATE INDEX "idx_spc_values_cavity_evaluation_id" ON "public"."spc_values" USING "btree" ("cavity_evaluation_id");



CREATE INDEX "idx_user_project_assignments_last_accessed" ON "public"."user_project_assignments" USING "btree" ("user_id", "last_accessed" DESC NULLS LAST);



CREATE INDEX "idx_user_project_assignments_project_id" ON "public"."user_project_assignments" USING "btree" ("project_id");



CREATE INDEX "idx_user_project_assignments_user_id" ON "public"."user_project_assignments" USING "btree" ("user_id");



CREATE INDEX "idx_user_role_assignments_role_id" ON "public"."user_role_assignments" USING "btree" ("role_id");



CREATE INDEX "idx_user_role_assignments_user_id" ON "public"."user_role_assignments" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "action_plans_audit_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."action_plans" FOR EACH ROW EXECUTE FUNCTION "public"."log_changes"();



CREATE OR REPLACE TRIGGER "drawings_audit_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."drawings" FOR EACH ROW EXECUTE FUNCTION "public"."log_changes"();



CREATE OR REPLACE TRIGGER "molds_audit_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."molds" FOR EACH ROW EXECUTE FUNCTION "public"."log_changes"();



CREATE OR REPLACE TRIGGER "projects_audit_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."log_changes"();



CREATE OR REPLACE TRIGGER "trigger_update_parent_status" AFTER INSERT OR DELETE OR UPDATE ON "public"."cavity_evaluations" FOR EACH ROW EXECUTE FUNCTION "public"."update_parent_component_status"();



CREATE OR REPLACE TRIGGER "trigger_update_parent_status_spc" AFTER INSERT OR DELETE OR UPDATE ON "public"."spc_values" FOR EACH ROW EXECUTE FUNCTION "public"."update_parent_status_from_spc"();



CREATE OR REPLACE TRIGGER "update_action_plans_updated_at" BEFORE UPDATE ON "public"."action_plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_action_types_updated_at" BEFORE UPDATE ON "public"."action_types" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_component_classifications_updated_at" BEFORE UPDATE ON "public"."component_classifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_drawings_updated_at" BEFORE UPDATE ON "public"."drawings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_milestone_definitions_updated_at" BEFORE UPDATE ON "public"."milestone_definitions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_mold_locations_updated_at" BEFORE UPDATE ON "public"."mold_locations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_molds_updated_at" BEFORE UPDATE ON "public"."molds" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_notifications_read_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_notification_read_at"();



CREATE OR REPLACE TRIGGER "update_otop_target_rules_updated_at" BEFORE UPDATE ON "public"."otop_target_rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_parent_components_updated_at" BEFORE UPDATE ON "public"."parent_components" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_milestone_instances_updated_at" BEFORE UPDATE ON "public"."project_milestone_instances" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_roles_updated_at" BEFORE UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "validate_cavity_number_on_insert_update" BEFORE INSERT OR UPDATE ON "public"."cavity_evaluations" FOR EACH ROW EXECUTE FUNCTION "public"."check_cavity_number_against_mold"();



ALTER TABLE ONLY "public"."action_plans"
    ADD CONSTRAINT "action_plans_action_type_id_fkey" FOREIGN KEY ("action_type_id") REFERENCES "public"."action_types"("id");



ALTER TABLE ONLY "public"."action_plans"
    ADD CONSTRAINT "action_plans_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."action_plans"
    ADD CONSTRAINT "action_plans_parent_component_id_fkey" FOREIGN KEY ("parent_component_id") REFERENCES "public"."parent_components"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."action_plans"
    ADD CONSTRAINT "action_plans_responsible_user_id_fkey" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."action_plans"
    ADD CONSTRAINT "action_plans_verified_by_user_id_fkey" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."cavity_evaluations"
    ADD CONSTRAINT "cavity_evaluations_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."cavity_evaluations"
    ADD CONSTRAINT "cavity_evaluations_parent_component_id_fkey" FOREIGN KEY ("parent_component_id") REFERENCES "public"."parent_components"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."drawings"
    ADD CONSTRAINT "drawings_component_classification_id_fkey" FOREIGN KEY ("component_classification_id") REFERENCES "public"."component_classifications"("id");



ALTER TABLE ONLY "public"."molds"
    ADD CONSTRAINT "molds_mold_location_id_fkey" FOREIGN KEY ("mold_location_id") REFERENCES "public"."mold_locations"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_action_plan_id_fkey" FOREIGN KEY ("action_plan_id") REFERENCES "public"."action_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_parent_component_id_fkey" FOREIGN KEY ("parent_component_id") REFERENCES "public"."parent_components"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."otop_target_rules"
    ADD CONSTRAINT "otop_target_rules_component_classification_id_fkey" FOREIGN KEY ("component_classification_id") REFERENCES "public"."component_classifications"("id");



ALTER TABLE ONLY "public"."otop_target_rules"
    ADD CONSTRAINT "otop_target_rules_target_milestone_definition_id_fkey" FOREIGN KEY ("target_milestone_definition_id") REFERENCES "public"."milestone_definitions"("id");



ALTER TABLE ONLY "public"."parent_components"
    ADD CONSTRAINT "parent_components_drawing_id_fkey" FOREIGN KEY ("drawing_id") REFERENCES "public"."drawings"("id");



ALTER TABLE ONLY "public"."parent_components"
    ADD CONSTRAINT "parent_components_mold_id_fkey" FOREIGN KEY ("mold_id") REFERENCES "public"."molds"("id");



ALTER TABLE ONLY "public"."parent_components"
    ADD CONSTRAINT "parent_components_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_milestone_instances"
    ADD CONSTRAINT "project_milestone_instances_milestone_definition_id_fkey" FOREIGN KEY ("milestone_definition_id") REFERENCES "public"."milestone_definitions"("id");



ALTER TABLE ONLY "public"."project_milestone_instances"
    ADD CONSTRAINT "project_milestone_instances_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_milestone_instances"
    ADD CONSTRAINT "project_milestone_instances_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_project_manager_user_id_fkey" FOREIGN KEY ("project_manager_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."spc_values"
    ADD CONSTRAINT "spc_values_cavity_evaluation_id_fkey" FOREIGN KEY ("cavity_evaluation_id") REFERENCES "public"."cavity_evaluations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_project_assignments"
    ADD CONSTRAINT "user_project_assignments_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_project_assignments"
    ADD CONSTRAINT "user_project_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_project_assignments"
    ADD CONSTRAINT "user_project_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_role_assignments"
    ADD CONSTRAINT "user_role_assignments_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_role_assignments"
    ADD CONSTRAINT "user_role_assignments_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."user_roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_role_assignments"
    ADD CONSTRAINT "user_role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow Super Users to manage all user data" ON "public"."users" USING ("public"."has_role"('Super User'::"text")) WITH CHECK ("public"."has_role"('Super User'::"text"));



CREATE POLICY "Allow Super Users to manage roles definitions" ON "public"."user_roles" USING ("public"."has_role"('Super User'::"text")) WITH CHECK ("public"."has_role"('Super User'::"text"));



CREATE POLICY "Allow Super Users to read audit log" ON "public"."audit_log" FOR SELECT USING ("public"."has_role"('Super User'::"text"));



CREATE POLICY "Allow Super Users to read audit log archive" ON "public"."audit_log_archive" FOR SELECT USING ("public"."has_role"('Super User'::"text"));



CREATE POLICY "Allow all actions based on parent evaluation" ON "public"."spc_values" USING ((EXISTS ( SELECT 1
   FROM "public"."cavity_evaluations" "ce"
  WHERE ("ce"."id" = "spc_values"."cavity_evaluation_id"))));



CREATE POLICY "Allow authenticated read on action_types" ON "public"."action_types" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated read on component_classifications" ON "public"."component_classifications" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated read on drawings" ON "public"."drawings" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated read on mold_locations" ON "public"."mold_locations" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated read on molds" ON "public"."molds" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to read roles" ON "public"."user_roles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow creation of action_plans" ON "public"."action_plans" FOR INSERT WITH CHECK (("public"."has_role"('Supplier Quality'::"text") OR ("public"."has_role"('External User'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."parent_components" "pc"
  WHERE (("pc"."id" = "action_plans"."parent_component_id") AND "public"."is_assigned_to_project"("pc"."project_id")))))));



CREATE POLICY "Allow deletion for management roles" ON "public"."cavity_evaluations" FOR DELETE USING (("public"."has_role"('Supplier Quality'::"text") OR "public"."has_role"('Super User'::"text")));



CREATE POLICY "Allow deletion of action_plans" ON "public"."action_plans" FOR DELETE USING (("public"."has_role"('Supplier Quality'::"text") OR "public"."has_role"('Super User'::"text")));



CREATE POLICY "Allow external users to update planned dates" ON "public"."parent_components" FOR UPDATE USING (("public"."has_role"('External User'::"text") AND "public"."is_assigned_to_project"("project_id")));



CREATE POLICY "Allow full access for project setup roles" ON "public"."parent_components" USING (("public"."has_role"('Supplier Quality'::"text") OR "public"."has_role"('Super User'::"text")));



CREATE POLICY "Allow full management for project managers" ON "public"."projects" USING (("public"."has_role"('Supplier Quality'::"text") OR "public"."has_role"('Super User'::"text"))) WITH CHECK (("public"."has_role"('Supplier Quality'::"text") OR "public"."has_role"('Super User'::"text")));



CREATE POLICY "Allow insertion for operational roles" ON "public"."cavity_evaluations" FOR INSERT WITH CHECK (("public"."has_role"('Supplier Quality'::"text") OR ("public"."has_role"('External User'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."parent_components" "pc"
  WHERE (("pc"."id" = "cavity_evaluations"."parent_component_id") AND "public"."is_assigned_to_project"("pc"."project_id")))))));



CREATE POLICY "Allow management of action_types by Super User" ON "public"."action_types" USING ("public"."has_role"('Super User'::"text"));



CREATE POLICY "Allow management of component_classifications by Super User" ON "public"."component_classifications" USING ("public"."has_role"('Super User'::"text"));



CREATE POLICY "Allow management of drawings by SQ and Super User" ON "public"."drawings" USING (("public"."has_role"('Supplier Quality'::"text") OR "public"."has_role"('Super User'::"text")));



CREATE POLICY "Allow management of milestone_definitions by Super User" ON "public"."milestone_definitions" USING ("public"."has_role"('Super User'::"text"));



CREATE POLICY "Allow management of mold_locations by Super User" ON "public"."mold_locations" USING ("public"."has_role"('Super User'::"text"));



CREATE POLICY "Allow management of molds by SQ and Super User" ON "public"."molds" USING (("public"."has_role"('Supplier Quality'::"text") OR "public"."has_role"('Super User'::"text")));



CREATE POLICY "Allow management of otop_target_rules by Super User" ON "public"."otop_target_rules" USING ("public"."has_role"('Super User'::"text"));



CREATE POLICY "Allow management of project_milestone_instances" ON "public"."project_milestone_instances" USING (("public"."has_role"('Supplier Quality'::"text") OR "public"."has_role"('Super User'::"text")));



CREATE POLICY "Allow read access based on project" ON "public"."cavity_evaluations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."parent_components" "pc"
  WHERE (("pc"."id" = "cavity_evaluations"."parent_component_id") AND "public"."is_assigned_to_project"("pc"."project_id")))));



CREATE POLICY "Allow read access based on project assignment" ON "public"."parent_components" FOR SELECT USING ("public"."is_assigned_to_project"("project_id"));



CREATE POLICY "Allow read access on action_plans" ON "public"."action_plans" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."parent_components" "pc"
  WHERE (("pc"."id" = "action_plans"."parent_component_id") AND "public"."is_assigned_to_project"("pc"."project_id")))));



CREATE POLICY "Allow read access on milestone_definitions" ON "public"."milestone_definitions" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow read access on otop_target_rules" ON "public"."otop_target_rules" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow read access on project_milestone_instances" ON "public"."project_milestone_instances" FOR SELECT USING ("public"."is_assigned_to_project"("project_id"));



CREATE POLICY "Allow read access to assigned projects" ON "public"."projects" FOR SELECT USING ("public"."is_assigned_to_project"("id"));



CREATE POLICY "Allow updates for operational roles" ON "public"."cavity_evaluations" FOR UPDATE USING (("public"."has_role"('Supplier Quality'::"text") OR "public"."has_role"('Super User'::"text") OR ("public"."has_role"('External User'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."parent_components" "pc"
  WHERE (("pc"."id" = "cavity_evaluations"."parent_component_id") AND "public"."is_assigned_to_project"("pc"."project_id")))))));



CREATE POLICY "Allow updates on action_plans" ON "public"."action_plans" FOR UPDATE USING (("public"."has_role"('Supplier Quality'::"text") OR "public"."has_role"('Super User'::"text") OR ("public"."has_role"('External User'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."parent_components" "pc"
  WHERE (("pc"."id" = "action_plans"."parent_component_id") AND "public"."is_assigned_to_project"("pc"."project_id")))))));



CREATE POLICY "Allow users to manage their own profile" ON "public"."users" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "SQ and Super Users can manage project assignments" ON "public"."user_project_assignments" USING (("public"."has_role"('Supplier Quality'::"text") OR "public"."has_role"('Super User'::"text"))) WITH CHECK (("public"."has_role"('Supplier Quality'::"text") OR "public"."has_role"('Super User'::"text")));



CREATE POLICY "Super Users can manage role assignments" ON "public"."user_role_assignments" USING ("public"."has_role"('Super User'::"text")) WITH CHECK ("public"."has_role"('Super User'::"text"));



CREATE POLICY "Super Users can view all role assignments" ON "public"."user_role_assignments" FOR SELECT USING ("public"."has_role"('Super User'::"text"));



CREATE POLICY "Users can access their own notifications" ON "public"."notifications" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own project assignments" ON "public"."user_project_assignments" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own role assignments" ON "public"."user_role_assignments" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."action_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."action_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_log_archive" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cavity_evaluations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."component_classifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drawings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."milestone_definitions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mold_locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."molds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."otop_target_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parent_components" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_milestone_instances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."spc_values" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_project_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_role_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."archive_old_audit_logs"() TO "anon";
GRANT ALL ON FUNCTION "public"."archive_old_audit_logs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."archive_old_audit_logs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_cavity_number_against_mold"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_cavity_number_against_mold"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_cavity_number_against_mold"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_spc_conformity"("p_cavity_evaluation_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."check_spc_conformity"("p_cavity_evaluation_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_spc_conformity"("p_cavity_evaluation_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_orphaned_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_orphaned_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_orphaned_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_global_dashboard_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_global_dashboard_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_global_dashboard_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_projects_with_details"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_projects_with_details"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_projects_with_details"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recent_projects_for_user"("user_id_param" "uuid", "limit_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_recent_projects_for_user"("user_id_param" "uuid", "limit_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recent_projects_for_user"("user_id_param" "uuid", "limit_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_upcoming_project_timelines"("project_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_upcoming_project_timelines"("project_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_upcoming_project_timelines"("project_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("role_to_check" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("role_to_check" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("role_to_check" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_assigned_to_project"("project_id_to_check" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."is_assigned_to_project"("project_id_to_check" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_assigned_to_project"("project_id_to_check" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."log_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_all_parent_statuses"("p_project_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_all_parent_statuses"("p_project_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_all_parent_statuses"("p_project_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_notification_read_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_notification_read_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_notification_read_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_parent_component_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_parent_component_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_parent_component_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_parent_status_from_spc"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_parent_status_from_spc"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_parent_status_from_spc"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project_last_accessed"("project_id_param" bigint, "user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_project_last_accessed"("project_id_param" bigint, "user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_last_accessed"("project_id_param" bigint, "user_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_data_integrity"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_data_integrity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_data_integrity"() TO "service_role";
























GRANT ALL ON TABLE "public"."action_plans" TO "anon";
GRANT ALL ON TABLE "public"."action_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."action_plans" TO "service_role";



GRANT ALL ON SEQUENCE "public"."action_plans_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."action_plans_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."action_plans_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."action_types" TO "anon";
GRANT ALL ON TABLE "public"."action_types" TO "authenticated";
GRANT ALL ON TABLE "public"."action_types" TO "service_role";



GRANT ALL ON SEQUENCE "public"."action_types_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."action_types_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."action_types_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log_archive" TO "anon";
GRANT ALL ON TABLE "public"."audit_log_archive" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log_archive" TO "service_role";



GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cavity_evaluations" TO "anon";
GRANT ALL ON TABLE "public"."cavity_evaluations" TO "authenticated";
GRANT ALL ON TABLE "public"."cavity_evaluations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cavity_evaluations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cavity_evaluations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cavity_evaluations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."component_classifications" TO "anon";
GRANT ALL ON TABLE "public"."component_classifications" TO "authenticated";
GRANT ALL ON TABLE "public"."component_classifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."component_classifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."component_classifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."component_classifications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."drawings" TO "anon";
GRANT ALL ON TABLE "public"."drawings" TO "authenticated";
GRANT ALL ON TABLE "public"."drawings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."drawings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."drawings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."drawings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."milestone_definitions" TO "anon";
GRANT ALL ON TABLE "public"."milestone_definitions" TO "authenticated";
GRANT ALL ON TABLE "public"."milestone_definitions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."milestone_definitions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."milestone_definitions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."milestone_definitions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."mold_locations" TO "anon";
GRANT ALL ON TABLE "public"."mold_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."mold_locations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."mold_locations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."mold_locations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."mold_locations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."molds" TO "anon";
GRANT ALL ON TABLE "public"."molds" TO "authenticated";
GRANT ALL ON TABLE "public"."molds" TO "service_role";



GRANT ALL ON SEQUENCE "public"."molds_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."molds_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."molds_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."otop_target_rules" TO "anon";
GRANT ALL ON TABLE "public"."otop_target_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."otop_target_rules" TO "service_role";



GRANT ALL ON SEQUENCE "public"."otop_target_rules_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."otop_target_rules_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."otop_target_rules_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."parent_components" TO "anon";
GRANT ALL ON TABLE "public"."parent_components" TO "authenticated";
GRANT ALL ON TABLE "public"."parent_components" TO "service_role";



GRANT ALL ON SEQUENCE "public"."parent_components_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."parent_components_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."parent_components_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."project_milestone_instances" TO "anon";
GRANT ALL ON TABLE "public"."project_milestone_instances" TO "authenticated";
GRANT ALL ON TABLE "public"."project_milestone_instances" TO "service_role";



GRANT ALL ON SEQUENCE "public"."project_milestone_instances_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."project_milestone_instances_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."project_milestone_instances_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."spc_values" TO "anon";
GRANT ALL ON TABLE "public"."spc_values" TO "authenticated";
GRANT ALL ON TABLE "public"."spc_values" TO "service_role";



GRANT ALL ON SEQUENCE "public"."spc_values_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."spc_values_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."spc_values_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_project_assignments" TO "anon";
GRANT ALL ON TABLE "public"."user_project_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."user_project_assignments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_project_assignments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_project_assignments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_project_assignments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_role_assignments" TO "anon";
GRANT ALL ON TABLE "public"."user_role_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."user_role_assignments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_role_assignments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_role_assignments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_role_assignments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."v_action_plans_detailed" TO "anon";
GRANT ALL ON TABLE "public"."v_action_plans_detailed" TO "authenticated";
GRANT ALL ON TABLE "public"."v_action_plans_detailed" TO "service_role";



GRANT ALL ON TABLE "public"."v_parent_components_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."v_parent_components_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."v_parent_components_dashboard" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
