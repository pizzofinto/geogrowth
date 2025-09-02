# 📘 CODE CONVENTIONS - GeoGrowth Platform

> Questo documento definisce gli standard di codice e le convenzioni per il progetto GeoGrowth.
> **TUTTI gli sviluppatori DEVONO seguire queste linee guida.**

## 🎯 Principi Fondamentali

1. **Consistency over Preference** - La coerenza è più importante delle preferenze personali
2. **Readability First** - Il codice deve essere facilmente leggibile e comprensibile
3. **Type Safety Always** - TypeScript strict mode, nessun `any`
4. **Mobile First** - Ogni componente parte da mobile e scala verso desktop
5. **i18n Required** - OGNI stringa utente DEVE essere tradotta

---

## 📁 Struttura File e Cartelle

### Naming Conventions

```
src/
  app/
    [locale]/
      (app)/                    # Route group per layout con sidebar
        dashboard/
          page.tsx              # PascalCase per componenti Page
          loading.tsx           # loading states
          error.tsx            # error boundaries
  
  components/
    ui/                        # shadcn/ui components (non modificare)
    dashboard/
      KPICards.tsx            # PascalCase per componenti
      KPICards.test.tsx       # Test files con .test.tsx
    
  hooks/
    useComponents.ts          # camelCase con prefisso 'use'
    
  lib/
    supabaseClient.ts        # camelCase per utilities
    
  types/
    database.types.ts        # Generated Supabase types
    component.types.ts       # Custom type definitions
    
  utils/
    formatters.ts           # Utility functions
    validators.ts           # Validation functions
```

### Import Order

```typescript
// 1. React/Next imports
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { format } from 'date-fns';
import { z } from 'zod';

// 3. UI Components (shadcn)
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 4. Custom Components
import { KPICard } from '@/components/dashboard/KPICard';

// 5. Hooks
import { useComponents } from '@/hooks/useComponents';

// 6. Utils/Lib
import { supabase } from '@/lib/supabaseClient';
import { formatDate } from '@/utils/formatters';

// 7. Types
import type { Component, Project } from '@/types/database.types';

// 8. Styles (se necessari)
import styles from './Component.module.css';
```

---

## 🧩 Component Guidelines

### Component Template

```typescript
'use client'; // Solo se necessario

import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Types definition
interface ComponentNameProps {
  title: string;
  projectId: number;
  className?: string;
  onAction?: () => void;
}

/**
 * ComponentName - Breve descrizione del componente
 * @param props - Component properties
 * @returns JSX Element
 */
export function ComponentName({ 
  title, 
  projectId, 
  className,
  onAction 
}: ComponentNameProps) {
  // Translations SEMPRE per primo
  const t = useTranslations('namespace');
  const locale = useLocale();
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  
  // Custom hooks
  const { data, error } = useCustomHook();
  
  // Event handlers
  const handleClick = useCallback(() => {
    // Logic here
  }, [dependencies]);
  
  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // Early returns per loading/error states
  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }
  
  if (error) {
    return (
      <Card className={className}>
        <CardContent>
          <p className="text-destructive">{t('error.generic')}</p>
        </CardContent>
      </Card>
    );
  }
  
  // Main render
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
    </Card>
  );
}

// Default export solo per pages
// Named export per componenti
```

### Server Component Template

```typescript
import { getTranslations } from 'next-intl/server';
import { Card } from '@/components/ui/card';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function PageName({ params, searchParams }: PageProps) {
  const { locale, id } = await params;
  const t = await getTranslations('namespace');
  
  // Fetch data
  const data = await fetchData(id);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>
      {/* Content */}
    </div>
  );
}
```

---

## 🌍 Internationalization (i18n)

### REGOLE ASSOLUTE

```typescript
// ❌ MAI fare questo
<Button>Click here</Button>
<p>Welcome to the dashboard</p>

// ✅ SEMPRE fare questo
<Button>{t('button.click')}</Button>
<p>{t('dashboard.welcome')}</p>
```

### Struttura Traduzioni

```json
// src/i18n/messages/en.json
{
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome to your dashboard",
    "stats": {
      "total": "Total Components",
      "compliant": "Compliant",
      "nonCompliant": "Non-Compliant"
    },
    "actions": {
      "refresh": "Refresh",
      "export": "Export Data",
      "filter": "Filter Results"
    }
  }
}
```

### Traduzioni con Parametri

```typescript
// Definizione
{
  "welcome": "Welcome, {name}!",
  "items": "You have {count, number} {count, plural, one {item} other {items}}"
}

// Uso
t('welcome', { name: userName })
t('items', { count: 5 })
```

---

## 🎨 Styling Guidelines

### Tailwind CSS Rules

```typescript
// ✅ CORRECT - Usare classi Tailwind
<div className="flex items-center justify-between p-4 bg-background border rounded-lg">

// ❌ WRONG - Non usare style inline
<div style={{ display: 'flex', padding: '16px' }}>

// ✅ CORRECT - Classi condizionali con cn()
import { cn } from '@/lib/utils';

<div className={cn(
  "p-4 rounded-lg",
  isActive && "bg-primary text-primary-foreground",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>

// ✅ CORRECT - Responsive design
<div className="p-2 sm:p-4 md:p-6 lg:p-8">
  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl">
```

### Component Styling Priority

1. Usare componenti shadcn/ui esistenti
2. Estendere con Tailwind classes
3. Creare varianti con cva() se necessario
4. CSS modules solo come ultima risorsa

---

## 🪝 Custom Hooks

### ⚠️ INFINITE LOOP PREVENTION RULES

**CRITICAL**: These rules MUST be followed to prevent infinite re-renders:

#### 1. Dependency Array Rules

```typescript
// ❌ BAD - causes infinite loops
useEffect(() => {}, [roles, config, user])

// ✅ GOOD - use stable references
const rolesString = useMemo(() => JSON.stringify(roles?.sort() || []), [roles])
const hasRoles = useMemo(() => roles && roles.length > 0, [roles])
useEffect(() => {}, [rolesString, hasRoles, user?.id])
```

#### 2. Memoize Complex Conditions

```typescript
// ❌ BAD
if (user && roles && roles.length > 0)

// ✅ GOOD
const isAuthenticated = useMemo(() => user && roles && roles.length > 0, [user, roles])
```

#### 3. useCallback Dependencies

```typescript
const fetchData = useCallback(async () => {
  if (!user?.id || !hasRoles) return
  // ... fetch logic
}, [user?.id, hasRoles, config]) // Include everything used inside
```

#### 4. Prevent Concurrent Async Operations

```typescript
const [isProcessing, setIsProcessing] = useState(false)

const processData = useCallback(async () => {
  if (isProcessing) return // Prevent concurrent calls
  setIsProcessing(true)
  try {
    // ... async work
  } finally {
    setIsProcessing(false)
  }
}, [isProcessing])
```

#### 5. Multi-Tab Safety (Critical for CRUD Operations)

**RULE**: All CRUD operations (Create, Update, Delete) MUST prevent conflicts across browser tabs.

```typescript
// ✅ CORRECT - Multi-tab safe operation
const createProject = useCallback(async () => {
  // 1. Component-level protection
  if (isProcessingRef.current) {
    console.log('🚫 Already processing, skipping...');
    return;
  }

  // 2. Cross-tab coordination using localStorage
  const processKey = 'project_creation_processing';
  let currentlyProcessing = null;
  
  try {
    currentlyProcessing = typeof window !== 'undefined' 
      ? localStorage.getItem(processKey) 
      : null;
  } catch (error) {
    console.warn('Error accessing localStorage:', error);
  }

  // 3. Check if another tab is processing (within timeout window)
  const PROCESS_TIMEOUT = 10000; // 10 seconds
  if (currentlyProcessing && Date.now() - parseInt(currentlyProcessing) < PROCESS_TIMEOUT) {
    console.log('🚫 Another tab is processing, skipping...');
    return;
  }

  // 4. Set processing flags
  isProcessingRef.current = true;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(processKey, Date.now().toString());
    } catch (error) {
      console.warn('Error setting localStorage:', error);
    }
  }

  try {
    setIsSubmitting(true);
    // ... CRUD operation logic
  } catch (err) {
    console.error('Operation failed:', err);
  } finally {
    // 5. Always cleanup flags
    setIsSubmitting(false);
    isProcessingRef.current = false;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(processKey);
      } catch (error) {
        console.warn('Error removing localStorage item:', error);
      }
    }
  }
}, [formData, user?.id]);
```

**Multi-Tab Safety Checklist:**
- [ ] Use `useRef` for component-level processing flag
- [ ] Use localStorage with timestamp for cross-tab coordination
- [ ] Set reasonable timeout window (5-15 seconds based on operation)
- [ ] Always cleanup localStorage in finally block
- [ ] Handle localStorage errors gracefully (private browsing)
- [ ] Use descriptive process keys (e.g., `project_creation_processing`)

**When to Apply:**
- ✅ Project/Component creation/deletion
- ✅ Bulk operations (import, export, batch updates)
- ✅ Critical data modifications
- ❌ Read operations (GET requests)
- ❌ UI state changes (theme, language)

**Key Pattern**: "Check component state → Check cross-tab state → Set both flags → Execute → Cleanup both flags"

#### 6. Stabilize Context Values

```typescript
const value = useMemo(() => ({
  user,
  roles,
  isLoading
}), [user, roles, isLoading]) // Prevent context re-creation
```

#### 🔍 Quick Checklist for Every Hook/Component

- [ ] All objects/arrays in dependencies are memoized
- [ ] useCallback includes all dependencies
- [ ] Complex conditions are memoized
- [ ] Async operations have race condition protection
- [ ] **Multi-tab safety implemented for CRUD operations**
- [ ] Context values are memoized
- [ ] Effects have proper cleanup
- [ ] No direct object/array comparisons in dependencies

**Key mantra**: "Stable references, complete dependencies, prevent races, coordinate across tabs"

### Hook Template

```typescript
// hooks/useComponentData.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Component } from '@/types/database.types';

interface UseComponentDataOptions {
  projectId: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseComponentDataReturn {
  data: Component[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateComponent: (id: number, data: Partial<Component>) => Promise<void>;
}

export function useComponentData({
  projectId,
  autoRefresh = false,
  refreshInterval = 30000
}: UseComponentDataOptions): UseComponentDataReturn {
  const [data, setData] = useState<Component[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('parent_components')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) throw error;
      setData(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);
  
  const updateComponent = useCallback(async (
    id: number, 
    updates: Partial<Component>
  ) => {
    // Update logic
  }, []);
  
  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh, refreshInterval]);
  
  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    updateComponent
  };
}
```

---

## 📝 TypeScript Guidelines

### Type Safety Rules

```typescript
// ❌ NEVER use 'any'
const data: any = fetchData();

// ✅ Use proper types or unknown
const data: Component[] = fetchData();
const unknownData: unknown = externalAPI();

// ❌ Avoid type assertions without checks
const user = data as User;

// ✅ Use type guards
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'email' in data
  );
}

// ✅ Use const assertions for literals
const STATUS = {
  OTOP: 'OTOP',
  OT: 'OT',
  KO: 'KO'
} as const;

type Status = typeof STATUS[keyof typeof STATUS];
```

### Interface vs Type

```typescript
// Use interfaces for objects that can be extended
interface User {
  id: string;
  email: string;
}

interface AdminUser extends User {
  permissions: string[];
}

// Use types for unions, intersections, and utilities
type Status = 'active' | 'inactive' | 'pending';
type ID = string | number;
type PartialUser = Partial<User>;
```

---

## 🗄️ Database Queries

### Supabase Query Patterns

```typescript
// ✅ CORRECT - Con error handling
async function getComponents(projectId: number) {
  try {
    const { data, error } = await supabase
      .from('parent_components')
      .select(`
        *,
        drawings!inner(
          drawing_number,
          drawing_description
        ),
        molds(
          mold_code,
          mold_type
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching components:', error);
    throw new Error('Failed to fetch components');
  }
}

// ✅ CORRECT - Con tipizzazione
import type { Database } from '@/types/database.types';

type Component = Database['public']['Tables']['parent_components']['Row'];
type ComponentInsert = Database['public']['Tables']['parent_components']['Insert'];
type ComponentUpdate = Database['public']['Tables']['parent_components']['Update'];
```

---

## ✅ Git Commit Conventions

### Conventional Commits Format

```bash
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat:` Nuova feature
- `fix:` Bug fix
- `docs:` Documentazione
- `style:` Formattazione (no logic changes)
- `refactor:` Refactoring code
- `perf:` Performance improvements
- `test:` Aggiunta test
- `chore:` Maintenance tasks
- `ci:` CI/CD changes
- `build:` Build system changes

### Examples

```bash
# Feature
feat(dashboard): add KPI cards with real-time data

# Bug fix
fix(auth): resolve session persistence issue on refresh

# Refactor
refactor(components): extract common logic to custom hook

# With scope
feat(i18n): add Italian translations for dashboard

# Breaking change
feat(api)!: change response format for components endpoint

BREAKING CHANGE: The API now returns nested objects instead of flat structure
```

---

## 🧪 Testing Standards

### Test File Structure

```typescript
// ComponentName.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  // Setup comune
  const defaultProps = {
    title: 'Test Title',
    projectId: 1
  };
  
  beforeEach(() => {
    // Reset mocks
  });
  
  describe('Rendering', () => {
    it('should render with required props', () => {
      render(<ComponentName {...defaultProps} />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });
    
    it('should show loading state', () => {
      // Test loading
    });
  });
  
  describe('Interactions', () => {
    it('should handle click events', async () => {
      const handleClick = jest.fn();
      render(<ComponentName {...defaultProps} onClick={handleClick} />);
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(handleClick).toHaveBeenCalledTimes(1);
      });
    });
  });
  
  describe('Error Handling', () => {
    it('should display error message on failure', () => {
      // Test error states
    });
  });
});
```

---

## 📱 Responsive Design Rules

### Breakpoint Usage

```typescript
// Mobile First Approach
<div className="
  w-full           // Mobile: 0-639px
  sm:w-3/4         // Small: 640px+
  md:w-2/3         // Medium: 768px+
  lg:w-1/2         // Large: 1024px+
  xl:w-1/3         // Extra Large: 1280px+
  2xl:w-1/4        // 2X Large: 1536px+
">

// Conditional Display
<div className="block sm:hidden">Mobile only</div>
<div className="hidden sm:block">Desktop only</div>

// Grid Responsive
<div className="
  grid 
  grid-cols-1 
  sm:grid-cols-2 
  md:grid-cols-3 
  lg:grid-cols-4
  gap-4
">
```

---

## 🚫 Common Mistakes to Avoid

### Top 10 Errori da Evitare

1. **Hardcoded strings** invece di traduzioni
2. **Any types** in TypeScript
3. **Console.log** in production
4. **Inline styles** invece di Tailwind
5. **Direct DOM manipulation** invece di React state
6. **Sync operations** in async functions
7. **Missing error boundaries**
8. **No loading states**
9. **Ignoring mobile design**
10. **Committing sensitive data**

---

## 📚 Resources

### Documentation Links
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [next-intl Docs](https://next-intl-docs.vercel.app)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Internal Docs
- [Database Schema](./docs/database-schema.sql)
- [API Documentation](./docs/api-docs.md)
- [Component Library](./docs/components.md)
- [Deployment Guide](./docs/deployment.md)

---

## ⚡ Performance Guidelines

> **Added**: 2025-08-31 after comprehensive performance optimization session
> **Context**: Critical patterns discovered during login speed and bundle size optimization

### 🚀 Database Query Optimization

#### Parallel Queries (CRITICAL for Auth Performance)

```typescript
// ❌ Sequential queries - 400ms total
const profile = await supabase
  .from('users')
  .select('preferred_language')
  .eq('id', user.id)
  .single();

const roles = await supabase
  .from('user_role_assignments') 
  .select('user_roles(role_name)')
  .eq('user_id', user.id);

// ✅ Parallel queries - 200ms total
const [profileResult, rolesResult] = await Promise.all([
  supabase
    .from('users')
    .select('preferred_language')
    .eq('id', user.id)
    .single(),
  supabase
    .from('user_role_assignments')
    .select('user_roles(role_name)')
    .eq('user_id', user.id)
]);

const { data: profile } = profileResult;
const { data: roles } = rolesResult;
```

**Rule**: Always use `Promise.all()` for independent database queries.

---

### 📦 Bundle Size Optimization

#### Dynamic Imports for Heavy Components

```typescript
// ❌ Heavy components loaded upfront - 231kB bundle
import { ProjectTimeline } from '@/components/dashboard/ProjectTimeline';
import { ActionPlanAlerts } from '@/components/dashboard/ActionPlanAlerts';

// ✅ Dynamic imports with loading states - 167kB bundle
const ProjectTimeline = dynamic(
  () => import('@/components/dashboard/ProjectTimeline').then(mod => ({ 
    default: mod.ProjectTimeline 
  })),
  { 
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false
  }
);

const ActionPlanAlerts = dynamic(
  () => import('@/components/dashboard/ActionPlanAlerts').then(mod => ({ 
    default: mod.ActionPlanAlerts 
  })),
  { 
    loading: () => <Skeleton className="h-48 w-full" />,
    ssr: false
  }
);
```

**Rule**: Use dynamic imports for components > 50kB or heavy data processing.

---

### 🔄 React Hook Dependencies (Infinite Loop Prevention)

#### Complete Dependencies with Stable References

```typescript
// ❌ Missing dependencies cause infinite loops
const fetchData = useCallback(async () => {
  const response = await supabase.from('table').select('*');
  processData(response.data);
}, []); // ❌ Missing processData dependency

useEffect(() => {
  fetchData();
}, [user?.id]); // ❌ Missing fetchData dependency

// ✅ Stable references with complete dependencies
const processData = useCallback((data) => {
  // Processing logic
}, []); // Stable - no external dependencies

const fetchData = useCallback(async () => {
  const response = await supabase.from('table').select('*');
  processData(response.data);
}, [processData]); // ✅ Include stable processData

useEffect(() => {
  if (user?.id) {
    fetchData();
  }
}, [user?.id, fetchData]); // ✅ Include all dependencies
```

#### Stable Role References

```typescript
// ❌ Direct roles usage causes dependency issues
const fetchActionPlans = useCallback(async () => {
  if (roles.includes('Super User')) {
    // Query logic
  }
}, [user?.id]); // ❌ Missing roles dependency

// ✅ Stable roles reference
const rolesString = useMemo(() => 
  JSON.stringify(roles?.sort() || []), [roles]
);

const fetchActionPlans = useCallback(async () => {
  const parsedRoles = JSON.parse(rolesString);
  if (parsedRoles.includes('Super User')) {
    // Query logic
  }
}, [user?.id, rolesString]); // ✅ Stable dependency
```

**Rule**: Always include ALL dependencies, use stable references to prevent infinite loops.

---

### 🎯 Performance Checklist

Before committing components, verify:

- [ ] **Database Queries**: Independent queries use `Promise.all()`
- [ ] **Bundle Size**: Heavy components (>50kB) use dynamic imports
- [ ] **Hook Dependencies**: All useEffect/useCallback include complete deps
- [ ] **Multi-Tab Safety**: CRUD operations implement cross-tab coordination
- [ ] **Loading States**: Dynamic components have skeleton placeholders
- [ ] **Type Safety**: No `any` types, proper type guards used
- [ ] **Build Success**: `npm run build` passes without errors

### 📊 Performance Metrics to Monitor

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Login Time | < 300ms | > 500ms |
| Bundle Size (initial) | < 150kB | > 200kB |
| React Re-renders | Minimal | Infinite loops |
| Build Time | < 30s | > 60s |

### 🛠️ Performance Tools

```bash
# Measure bundle sizes
npm run build

# Check for dependency issues
npm run lint

# Monitor dev performance
# Use Chrome DevTools → Network/Performance tabs
```

---

*Questo documento è vincolante per tutti gli sviluppatori del progetto GeoGrowth.*
*Ultimo aggiornamento: 2025-08-31 (Performance Guidelines Added)*
*Versione: 1.1.0*