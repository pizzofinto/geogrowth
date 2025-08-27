'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

// Definiamo i tipi basati sui dati effettivi restituiti da Supabase
// Interface for raw Supabase data - keeping for future use
// interface SupabaseActionPlan {
//   id: number;
//   action_plan_description: string;
//   due_date: string;
//   action_plan_status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
//   priority_level: number;
//   created_at: string;
//   updated_at: string;
//   parent_component_id: number;
//   responsible_user_id: string | null;
//   action_type_id: number;
//   // I join restituiscono array anche se dovrebbero essere singoli
//   component: Array<{
//     id: number;
//     component_name: string;
//     project_id: number;
//     project: Array<{
//       id: number;
//       project_name: string;
//     }>;
//   }>;
//   action_type: Array<{
//     action_type_name: string;
//   }>;
//   responsible_user: Array<{
//     first_name: string;
//     last_name: string;
//   }>;
// }

// Tipo normalizzato per l'uso nell'applicazione
interface ActionPlan {
  id: number;
  action_plan_description: string;
  due_date: string;
  action_plan_status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
  priority_level: number;
  created_at: string;
  updated_at: string;
  parent_component_id: number;
  responsible_user_id: string | null;
  action_type_id: number;
  component: {
    id: number;
    component_name: string;
    project_id: number;
    project: {
      id: number;
      project_name: string;
    };
  } | null;
  action_type: {
    action_type_name: string;
  } | null;
  responsible_user: {
    first_name: string;
    last_name: string;
  } | null;
}

interface ActionPlanAlertsData {
  overdue: ActionPlan[];
  dueSoon: ActionPlan[];
  highPriority: ActionPlan[];
  totalCount: number;
  overdueCount: number;
  dueSoonCount: number;
  highPriorityCount: number;
}

interface UseActionPlanAlertsOptions {
  /** Giorni nel futuro per "Due Soon" (default: 7) */
  dueSoonDays?: number;
  /** Giorni nel passato per "Overdue" (default: 90) */
  overdueMaxDays?: number;
  /** Priorità massima per "High Priority" (default: 3) */
  highPriorityThreshold?: number;
  /** Include High Priority solo se scadono entro X giorni (default: 30) */
  highPriorityMaxDays?: number;
}

interface UseActionPlanAlertsReturn {
  data: ActionPlanAlertsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Configurazione attuale dei filtri */
  config: Required<UseActionPlanAlertsOptions>;
}

export function useActionPlanAlerts(
  options: UseActionPlanAlertsOptions = {}
): UseActionPlanAlertsReturn {
  const [data, setData] = useState<ActionPlanAlertsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, roles } = useAuth();

  // Configurazione default con override - useMemo per evitare infinite loop
  const config: Required<UseActionPlanAlertsOptions> = useMemo(() => ({
    dueSoonDays: options.dueSoonDays ?? 7,
    overdueMaxDays: options.overdueMaxDays ?? 90,
    highPriorityThreshold: options.highPriorityThreshold ?? 3,
    highPriorityMaxDays: options.highPriorityMaxDays ?? 30,
  }), [options.dueSoonDays, options.overdueMaxDays, options.highPriorityThreshold, options.highPriorityMaxDays]);


  // Stabilizza la dipendenza dei ruoli
  const rolesString = useMemo(() => JSON.stringify(roles?.sort() || []), [roles]);
  const hasRoles = useMemo(() => roles && roles.length > 0, [roles]);

  // Create stable references for config values to prevent unnecessary re-runs
  const configRef = useRef(config);
  configRef.current = config;

  const fetchActionPlanAlerts = useCallback(async (force = false) => {
    // Non procedere se l'utente non è autenticato o se i ruoli non sono ancora caricati
    if (!user?.id || !hasRoles) {
      setData(null);
      setIsLoading(false);
      return;
    }

    // Light coordination: only prevent rapid successive calls, allow initial loads
    if (!force) {
      const fetchKey = 'actionPlanAlerts_fetching';
      const currentlyFetching = typeof window !== 'undefined' 
        ? localStorage.getItem(fetchKey) 
        : null;
      
      // Very short window (500ms) - just to prevent rapid fire calls
      if (currentlyFetching && Date.now() - parseInt(currentlyFetching) < 500) {
        console.log('🚫 Rate limiting: Another tab fetched very recently, skipping...');
        return;
      }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(fetchKey, Date.now().toString());
      }
    }

    try {
      setIsLoading(true);
      setError(null);

      const currentConfig = configRef.current;
      console.log('🔍 Fetching action plan alerts for user:', user.id, 'with roles:', hasRoles ? 'loaded' : 'none');
      console.log('⚙️ Config:', currentConfig);

      // Calcola le date per i filtri con configurazione flessibile
      const today = new Date();
      
      const dueSoonDate = new Date();
      dueSoonDate.setDate(today.getDate() + currentConfig.dueSoonDays);
      
      const overdueMinDate = new Date();
      overdueMinDate.setDate(today.getDate() - currentConfig.overdueMaxDays);
      
      const highPriorityMaxDate = new Date();
      highPriorityMaxDate.setDate(today.getDate() + currentConfig.highPriorityMaxDays);

      const todayStr = today.toISOString().split('T')[0];
      const dueSoonStr = dueSoonDate.toISOString().split('T')[0];
      const overdueMinStr = overdueMinDate.toISOString().split('T')[0];
      const highPriorityMaxStr = highPriorityMaxDate.toISOString().split('T')[0];

      console.log('📅 Date filters:', {
        today: todayStr,
        dueSoon: `${todayStr} to ${dueSoonStr} (+${currentConfig.dueSoonDays} days)`,
        overdue: `${overdueMinStr} to ${todayStr} (-${currentConfig.overdueMaxDays} days max)`,
        highPriority: `priority ≤ ${currentConfig.highPriorityThreshold}, due within ${currentConfig.highPriorityMaxDays} days`,
      });

      // STEP 1: Prima ottieni i progetti a cui l'utente ha accesso
      let userProjectIds: number[] = [];

      if (roles.includes('Super User')) {
        // Super User vede tutti i progetti
        const { data: allProjects, error: projectsError } = await supabase
          .from('projects')
          .select('id')
          .eq('project_status', 'Active');
        
        if (projectsError) throw projectsError;
        userProjectIds = allProjects?.map(p => p.id) || [];
      } else {
        // Altri ruoli vedono solo i progetti assegnati
        const { data: assignedProjects, error: assignedError } = await supabase
          .from('user_project_assignments')
          .select('project_id')
          .eq('user_id', user.id);
        
        if (assignedError) throw assignedError;
        userProjectIds = assignedProjects?.map(p => p.project_id) || [];
      }

      console.log('📋 User has access to projects:', userProjectIds);

      if (userProjectIds.length === 0) {
        // L'utente non ha accesso a nessun progetto
        const emptyData: ActionPlanAlertsData = {
          overdue: [],
          dueSoon: [],
          highPriority: [],
          totalCount: 0,
          overdueCount: 0,
          dueSoonCount: 0,
          highPriorityCount: 0,
        };
        setData(emptyData);
        return;
      }

      // STEP 2: Cerca tutti gli action plans per i progetti accessibili
      const { data: actionPlansData, error: fetchError } = await supabase
        .from('action_plans')
        .select(`
          id,
          action_plan_description,
          due_date,
          action_plan_status,
          priority_level,
          created_at,
          updated_at,
          parent_component_id,
          responsible_user_id,
          action_type_id,
          parent_components(
            id,
            project_id,
            projects(
              id,
              project_name
            ),
            drawings(
              item_code,
              component_description
            )
          ),
          action_types(
            action_type_name
          )
        `)
        .in('action_plan_status', ['Open', 'In Progress'])
        .in('parent_components.project_id', userProjectIds)
        .order('due_date', { ascending: true });

      if (fetchError) {
        console.error('Supabase query error:', fetchError);
        console.error('Query details:', {
          table: 'action_plans',
          userProjectIds,
          filters: ['Open', 'In Progress']
        });
        throw fetchError;
      }

      console.log('📦 Raw data from Supabase:', actionPlansData?.slice(0, 2)); // Log primi 2 per debug

      // STEP 3: Normalizza i dati (già filtrati per progetti accessibili a database)
      const normalizedPlans: ActionPlan[] = actionPlansData?.map(plan => {
        // Process plan data
        
        // Try different ways to access the nested data
        const parentComponent = Array.isArray(plan.parent_components) 
          ? plan.parent_components[0] 
          : plan.parent_components;
        
        const project = parentComponent?.projects 
          ? (Array.isArray(parentComponent.projects) ? parentComponent.projects[0] : parentComponent.projects)
          : null;
          
        const drawing = parentComponent?.drawings 
          ? (Array.isArray(parentComponent.drawings) ? parentComponent.drawings[0] : parentComponent.drawings)
          : null;
          
        const actionType = Array.isArray(plan.action_types) 
          ? plan.action_types[0] 
          : plan.action_types;

        return {
          ...plan,
          component: parentComponent ? {
            id: parentComponent.id,
            component_name: drawing?.component_description || drawing?.item_code || 'Unknown Component',
            project_id: parentComponent.project_id,
            project: project || { id: 0, project_name: 'Unknown' }
          } : null,
          action_type: actionType || null,
          responsible_user: null, // Non carichiamo più i dati utente
        };
      }) || [];

      console.log('🎯 Action plans for user projects:', normalizedPlans.length);

      // STEP 4: Categorizza gli action plans con filtri temporali configurabili
      const overdue = normalizedPlans.filter(plan => 
        plan.due_date < todayStr && 
        plan.due_date >= overdueMinStr && // Non più vecchi di X giorni
        plan.action_plan_status !== 'Completed'
      );

      const dueSoon = normalizedPlans.filter(plan => 
        plan.due_date >= todayStr && 
        plan.due_date <= dueSoonStr && // Entro X giorni
        plan.action_plan_status !== 'Completed'
      );

      const highPriority = normalizedPlans.filter(plan => 
        plan.priority_level <= currentConfig.highPriorityThreshold && 
        plan.due_date <= highPriorityMaxStr && // Solo se scadono entro X giorni
        plan.action_plan_status !== 'Completed'
      );

      const alertsData: ActionPlanAlertsData = {
        overdue,
        dueSoon,
        highPriority,
        totalCount: normalizedPlans.length,
        overdueCount: overdue.length,
        dueSoonCount: dueSoon.length,
        highPriorityCount: highPriority.length,
      };

      console.log('✅ Action plan alerts loaded:', {
        total: alertsData.totalCount,
        overdue: alertsData.overdueCount,
        dueSoon: alertsData.dueSoonCount,
        highPriority: alertsData.highPriorityCount,
        userProjects: userProjectIds.length,
      });

      setData(alertsData);
    } catch (err) {
      console.error('Error fetching action plan alerts:', err);
      console.error('Full error object:', JSON.stringify(err, null, 2));
      setError(err instanceof Error ? err.message : 'Errore nel caricamento degli alerts');
    } finally {
      setIsLoading(false);
      // Clear the fetch lock
      if (!force && typeof window !== 'undefined') {
        localStorage.removeItem('actionPlanAlerts_fetching');
      }
    }
  }, [user?.id, rolesString, hasRoles]); // ✅ FIXED: Only stable dependencies, config accessed via ref

  // Fetch iniziale - solo se autenticato e ruoli caricati  
  useEffect(() => {
    // Add safety checks and only fetch once per user/role change
    if (user?.id && hasRoles) {
      console.log('🔍 ActionPlanAlerts: Initial fetch for user', user.id);
      fetchActionPlanAlerts();
    }
  }, [user?.id, hasRoles, fetchActionPlanAlerts]); // ✅ FIXED: Include fetchActionPlanAlerts but it's now stable

  // Auto-refresh every 5 minutes - with multi-tab coordination
  useEffect(() => {
    if (!user?.id || !hasRoles) return;
    
    // Use a unique identifier to prevent multiple tabs from refreshing simultaneously
    const tabId = Math.random().toString(36).substring(7);
    const storageKey = 'actionPlanAlerts_lastRefresh';
    
    const interval = setInterval(() => {
      // ✅ FIXED: Safe localStorage access with SSR check
      const lastRefresh = typeof window !== 'undefined' 
        ? localStorage.getItem(storageKey) 
        : null;
      const now = Date.now();
      const thirtySecondsAgo = now - 30000;
      
      if (!lastRefresh || parseInt(lastRefresh) < thirtySecondsAgo) {
        // Set our refresh timestamp to coordinate with other tabs
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, now.toString());
        }
        
        // Call the latest version of fetchActionPlanAlerts
        const latestFetch = async () => {
          if (user?.id && hasRoles) {
            console.log(`🔄 Tab ${tabId}: Refreshing action plan alerts`);
            await fetchActionPlanAlerts();
          }
        };
        latestFetch();
      } else {
        console.log(`⏭️ Tab ${tabId}: Skipping refresh, another tab refreshed recently`);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => {
      clearInterval(interval);
      console.log(`🧹 Tab ${tabId}: Cleaned up action plan alerts interval`);
    };
  }, [user?.id, hasRoles, fetchActionPlanAlerts]); // ✅ FIXED: Stable dependencies only

  const refetch = useCallback(async () => {
    // Force refetch when explicitly requested by user
    await fetchActionPlanAlerts(true);
  }, [fetchActionPlanAlerts]);

  return {
    data,
    isLoading,
    error,
    refetch,
    config, // Espone la configurazione attuale
  };
}