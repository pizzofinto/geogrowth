# 📋 Piano di Sviluppo MVP - GeoGrowth Platform

## 🎯 Obiettivo MVP
Creare una versione funzionante minima che permetta:
- Autenticazione e gestione utenti base
- Creazione e gestione progetti
- Tracciamento componenti e valutazioni
- Dashboard con KPI essenziali
- Sistema multilingua completo (IT/EN)

## 📊 Stato Attuale del Progetto

### ✅ Completato
- **Infrastruttura Base**
  - Next.js 14 con App Router configurato
  - Supabase integrato (Auth + Database)
  - Sistema multilingua next-intl configurato
  - Componenti UI shadcn/ui installati
  
- **Database**
  - Schema completo con 20+ tabelle
  - Row Level Security (RLS) policies
  - Stored procedures per calcoli automatici
  - Views per dashboard e reporting

- **Autenticazione**
  - Login/Logout funzionante
  - Gestione sessioni con Supabase Auth
  - Protezione routes con middleware
  - Recupero password implementato

- **Layout & Navigation**
  - Sidebar responsiva con menu collassabile
  - Breadcrumbs dinamici
  - Language switcher funzionante
  - Layout responsive mobile-first

- **Dashboard Base**
  - Struttura componenti modulare
  - Sezione progetti recenti
  - Cards per KPI (da completare)

## 🚧 In Sviluppo (Priorità Alta)

### Fase 1: Core Features (2-3 settimane)

#### 1.1 Completamento Dashboard (3-4 giorni)
```typescript
// Files da creare/completare:
- src/components/dashboard/KPICards.tsx
- src/components/dashboard/MaturityChart.tsx
- src/components/dashboard/ActionPlanAlerts.tsx
- src/hooks/useDashboardStats.ts
```

**Tasks:**
- [ ] Implementare hook per statistiche globali
- [ ] Creare componenti KPI cards con dati reali
- [ ] Aggiungere grafico maturity index (Recharts)
- [ ] Implementare alerts per action plans scaduti
- [ ] Aggiungere refresh automatico dati (polling/websocket)

**Commit suggerito:** Dopo completamento di ogni componente dashboard

#### 1.2 Gestione Progetti (5-6 giorni)
```typescript
// Files da creare:
- src/app/[locale]/(app)/projects/page.tsx
- src/app/[locale]/(app)/projects/new/page.tsx
- src/app/[locale]/(app)/projects/[id]/page.tsx
- src/components/projects/ProjectList.tsx
- src/components/projects/ProjectForm.tsx
- src/components/projects/ProjectCard.tsx
```

**Tasks:**
- [ ] Lista progetti con filtri e ricerca
- [ ] Form creazione nuovo progetto
- [ ] Pagina dettaglio progetto
- [ ] Gestione team assignment
- [ ] Milestone management base

**Commit suggerito:** Dopo lista progetti, dopo form creazione, dopo dettaglio

#### 1.3 Gestione Componenti (7-8 giorni)
```typescript
// Files da creare:
- src/app/[locale]/(app)/projects/[id]/components/page.tsx
- src/app/[locale]/(app)/components/[id]/page.tsx
- src/components/components/ComponentList.tsx
- src/components/components/ComponentDetail.tsx
- src/components/components/StatusBadge.tsx
- src/components/evaluations/EvaluationForm.tsx
```

**Tasks:**
- [ ] Lista componenti con DataTable
- [ ] Filtri avanzati (stato, classificazione, stampo)
- [ ] Dettaglio componente con storico
- [ ] Form inserimento valutazioni
- [ ] Calcolo automatico stato padre
- [ ] Upload report esterni

**Commit suggerito:** Dopo ogni feature principale

### Fase 2: Features Essenziali (2-3 settimane)

#### 2.1 Action Plans (4-5 giorni)
```typescript
// Files da creare:
- src/app/[locale]/(app)/action-plans/page.tsx
- src/components/action-plans/ActionPlanForm.tsx
- src/components/action-plans/ActionPlanTimeline.tsx
- src/hooks/useActionPlans.ts
```

**Tasks:**
- [ ] Lista action plans con stati
- [ ] Form creazione/modifica
- [ ] Timeline visualizzazione
- [ ] Notifiche scadenze
- [ ] Workflow approvazione

#### 2.2 Reporting & Analytics (3-4 giorni)
```typescript
// Files da creare:
- src/app/[locale]/(app)/reports/page.tsx
- src/components/reports/OTOPTrendChart.tsx
- src/components/reports/ComponentMatrixView.tsx
- src/components/reports/ExportButton.tsx
```

**Tasks:**
- [ ] Dashboard analytics progetto
- [ ] Grafici trend OTOP/OT/KO
- [ ] Export dati (CSV/Excel)
- [ ] Report PDF base

#### 2.3 Admin Panel (3-4 giorni)
```typescript
// Files da creare:
- src/app/[locale]/(app)/admin/page.tsx
- src/app/[locale]/(app)/admin/users/page.tsx
- src/app/[locale]/(app)/admin/settings/page.tsx
- src/components/admin/UserManagement.tsx
```

**Tasks:**
- [ ] Gestione utenti e ruoli
- [ ] Configurazione classificazioni
- [ ] Gestione milestone definitions
- [ ] System settings

### Fase 3: Ottimizzazioni e Polish (1-2 settimane)

#### 3.1 Performance & UX
- [ ] Implementare lazy loading componenti
- [ ] Aggiungere skeleton loaders
- [ ] Ottimizzare query database
- [ ] Implementare cache strategica
- [ ] Error boundaries e fallback UI

#### 3.2 Mobile Experience
- [ ] Ottimizzare tutte le viste per mobile
- [ ] Gesture support per azioni comuni
- [ ] Offline capability base (PWA)
- [ ] Push notifications setup

#### 3.3 Testing & Documentation
- [ ] Unit tests componenti critici
- [ ] Integration tests flussi principali
- [ ] Documentazione API interna
- [ ] User guide base

## 🛠 Linee Guida Sviluppo

### Struttura File Componente
```typescript
// Esempio: ComponentList.tsx
'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';

interface ComponentListProps {
  projectId: number;
}

export function ComponentList({ projectId }: ComponentListProps) {
  const t = useTranslations('components');
  const locale = useLocale();
  
  // Hook per dati
  const { data, isLoading, error } = useComponents(projectId);
  
  // Render
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Contenuto */}
      </CardContent>
    </Card>
  );
}
```

### Gestione Traduzioni
Sempre aggiornare entrambi i file:
```json
// src/i18n/messages/en.json
{
  "components": {
    "title": "Components",
    "status": {
      "otop": "Off Tool Off Process",
      "ot": "Off Tool",
      "ko": "Non-compliant"
    }
  }
}

// src/i18n/messages/it.json
{
  "components": {
    "title": "Componenti",
    "status": {
      "otop": "Fuori Stampo Fuori Processo",
      "ot": "Fuori Stampo",
      "ko": "Non conforme"
    }
  }
}
```

### Hooks Personalizzati
```typescript
// src/hooks/useComponents.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useComponents(projectId: number) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComponents();
  }, [projectId]);

  const fetchComponents = async () => {
    try {
      const { data, error } = await supabase
        .from('parent_components')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) throw error;
      setData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, refetch: fetchComponents };
}
```

## 📅 Timeline Suggerito

### Sprint 1 (Settimana 1-2)
- Completamento Dashboard
- Gestione Progetti base
- Setup CI/CD

**Milestone:** Prima demo funzionante con progetti e dashboard

### Sprint 2 (Settimana 3-4)
- Gestione Componenti completa
- Inserimento Valutazioni
- Action Plans base

**Milestone:** MVP core completo - tracciamento end-to-end

### Sprint 3 (Settimana 5-6)
- Reporting e Analytics
- Admin Panel
- Ottimizzazioni performance

**Milestone:** MVP production-ready

### Sprint 4 (Settimana 7)
- Testing completo
- Bug fixing
- Documentazione
- Deploy staging

**Milestone:** Release Candidate

## 🚀 Deployment Strategy

### Ambienti
1. **Development** - Locale con Supabase locale
2. **Staging** - Vercel Preview + Supabase staging
3. **Production** - Vercel Production + Supabase production

### Checklist Pre-Deploy
- [ ] Tutti i test passano
- [ ] Build production senza errori
- [ ] Performance audit (Lighthouse > 90)
- [ ] Security headers configurati
- [ ] Backup database configurato
- [ ] Monitoring attivo (Sentry/Vercel Analytics)
- [ ] Rate limiting APIs
- [ ] SSL certificati validi

## 📝 Prossimi Passi Immediati

1. **Oggi/Domani:**
   - Completare KPI cards dashboard
   - Iniziare lista progetti
   - Commit: "feat: complete dashboard KPI cards"

2. **Questa Settimana:**
   - Finire gestione progetti CRUD
   - Implementare project detail page
   - Setup GitHub Actions per CI

3. **Prossima Settimana:**
   - Component list con DataTable
   - Evaluation form
   - Status calculation logic

## 🎯 Definition of Done

Per considerare una feature completa:
- [ ] Codice implementato e testato
- [ ] Traduzioni IT/EN complete
- [ ] Responsive mobile/desktop
- [ ] Gestione errori appropriata
- [ ] Loading states implementati
- [ ] Documentazione aggiornata
- [ ] Code review passata
- [ ] Merged in main branch

## 💡 Note Tecniche Importanti

1. **Sempre usare shadcn/ui** per nuovi componenti UI
2. **Mai hardcodare stringhe** - sempre usare traduzioni
3. **Commit frequenti** con messaggi descrittivi (conventional commits)
4. **Mobile-first** approach per tutti i nuovi componenti
5. **TypeScript strict** - no any types
6. **Supabase RLS** - verificare sempre policies per nuove tabelle

---

*Documento aggiornato al: [Data attuale]*
*Versione: 1.0.0*
*Autore: Team GeoGrowth*