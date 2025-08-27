# 📝 CHANGELOG - GeoGrowth Platform

Tutte le modifiche importanti del progetto sono documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/),
e questo progetto aderisce al [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - Sprint Corrente

### 🎯 Target Release: v1.0.0-beta.1
### 📅 Sprint End: [Data Fine Sprint]

---

## [0.5.0] - 2025-08-27 (Current Session)

### 🚀 Features
- **Multi-Tab Coordination System**
  - Implementato sistema di coordinamento tra schede browser multiple
  - Prevenzione chiamate API concorrenti con localStorage-based locking
  - Rate limiting 500ms per useActionPlanAlerts hook
  - Supporto SSR-safe con `typeof window !== 'undefined'` checks
  - Gestione indipendente per caricamenti iniziali vs auto-refresh

### 🎨 UI/UX Improvements  
- **ActionPlanAlerts Button Alignment**
  - Allineati pulsanti con pattern di RecentProjects cards
  - Pulsanti action spostati in header area (grid view) con variant outline
  - Pulsanti icon-only in list view con variant ghost
  - Testo responsivo con `hidden md:inline` per mobile optimization
- **KPI Cards Styling Consistency**
  - Rimossi effetti animazione (scale, fade-in) 
  - Allineati con shadow-only hover effects (`hover:shadow-md transition-shadow`)
  - Consistenza visiva uniforme tra tutti i componenti dashboard

### 🐛 Critical Fixes
- **Infinite Loop Resolution**
  - Risolti infinite loop durante login multi-tab
  - Fix conflitti AuthContext processing tra schede multiple
  - Stabilizzati localStorage access patterns in useCallback hooks
- **Test Page Loading Issues**
  - Risolto problema caricamento test page quando dashboard è aperto
  - Coordinamento più leggero che permette caricamenti iniziali indipendenti
- **Cross-Tab Authentication**
  - Mantenuta funzionalità logout attraverso multiple browser tabs
  - Prevenuti race conditions in auth state management

### 🔧 Technical Improvements
- **Hook Stability**
  - localStorage access spostato in variabili locali per prevenire instabilità
  - Aggiunta gestione cleanup appropriata per coordination locks
  - Pattern SSR-safe implementato consistentemente
- **Error Handling**  
  - Migliorate strategie di retry per initial loads
  - Logging dettagliato per debug multi-tab scenarios
  - Gestione graceful per timeout e conflitti

---

## [0.4.1] - 2025-08-25

### 🐛 Fixed
- **session-start.sh Script Issues**
  - Risolti errori di path che causavano "No such file or directory" 
  - Aggiunta risoluzione automatica del directory di progetto
  - Script ora funzionante da qualsiasi posizione
- **Breadcrumbs Navigation**
  - Corretti link navigazione breadcrumbs che non includevano locale prefix
  - Aggiunto supporto per `/${locale}/path` in tutti i collegamenti
  - Fix completo per preservazione lingua durante navigazione

### 📚 Documentation
- **UI Bug Analysis Report**
  - Analisi completa di 3 bug segnalati (mobile menu, language persistence, breadcrumbs)
  - Verificato che solo 1 bug reale esisteva ed è stato risolto
  - Mobile menu e language persistence già funzionanti correttamente
- **Design Alignment Proposal**
  - Analisi approfondita ActionPlanAlerts vs RecentProjects design patterns
  - Identificate inconsistenze significative nell'esperienza utente
  - Proposta dettagliata per allineamento design componenti
  - Documentato piano implementazione per dashboard unified experience

### 🎯 Updated Priorities
- **ActionPlanAlerts Design Alignment** promossa a priorità #1
  - Rimozione sfondi colorati → white cards pulite con subtle shadows
  - Implementazione grid/list view modes per consistenza
  - Standardizzazione header layout con view toggles e actions  
  - Utilizzo Badge components per status/priority invece di color coding

### 🔧 Git Repository Management
- **Branch Management Completed**
  - Merged feat/action-plan-alerts → main (fast-forward, no conflicts)
  - Deleted local feature branch after successful merge
  - Local main 3 commits ahead of origin/main (ready for push)
  - Clean repository state achieved for next development cycle

### ✨ Added
- Dashboard con KPI cards dinamiche
- **Action Plan Alerts System** (✅ COMPLETED)
  - ActionPlanAlerts component con tabbed interface
  - ActionPlanAlertCard con urgency visualization 
  - useActionPlanAlerts hook con filtering configurabile
  - Support per overdue, due soon, high priority alerts
  - Dev-tools test page per development
- Sistema di autenticazione completo con Supabase Auth
- Supporto multilingua (IT/EN) con next-intl
- Sidebar navigation responsiva
- Breadcrumbs dinamici con traduzioni
- Language switcher persistente
- Recent projects section
- Database schema completo (20+ tabelle)
- Row Level Security policies
- Stored procedures per calcoli automatici
- UI Components: Tabs, ScrollArea (Radix UI based)

### 🔄 Changed
- Migrazione da Pages Router a App Router (Next.js 14)
- Refactor completo sistema i18n (da custom a next-intl)

### 🐛 Fixed
- **CRITICAL FIXES (✅ RESOLVED):**
  - Infinite loops during login in AuthContext 
  - Infinite loops in useLanguage hook causing navigation issues
  - Infinite loops in useRecentProjects hook
  - Build errors: 13 unused variables/imports resolved
  - TypeScript any types replaced with proper interfaces  
  - React hook dependency warnings fixed
- Risolto problema persistenza lingua dopo refresh (già funzionante)
- Menu mobile responsive working correctly (nessun overlap trovato)
- Fix traduzioni breadcrumbs (locale prefixes aggiunti)

### 🚧 Work in Progress
- [ ] **ActionPlanAlerts Design Alignment** (Next Priority)
- [ ] Completamento KPI cards con dati reali
- [ ] Maturity index chart component
- [ ] Project CRUD operations

---

## [0.3.0] - 2024-01-XX (Pre-Sprint)

### ✨ Added
- Setup iniziale Next.js 14 con TypeScript
- Integrazione Supabase (database + auth)
- Configurazione shadcn/ui components
- Setup Tailwind CSS con tema custom
- Struttura base progetto con App Router

### 📚 Documentation
- Creato piano sviluppo MVP
- Definite convenzioni codice
- Documentato schema database
- Aggiunte specifiche tecniche

---

## [0.2.0] - 2024-01-XX (Design Phase)

### 📐 Design
- Completati mockup UI/UX principali
- Definiti user flows end-to-end
- Creati wireframes responsive
- Stabilita design system

### 📊 Planning
- Analisi requisiti funzionali
- Definizione ruoli utente (4 ruoli)
- Mappatura permessi e RLS
- Pianificazione milestone

---

## [0.1.0] - 2024-01-XX (Initial Planning)

### 🎉 Project Kickoff
- Definizione obiettivi progetto
- Selezione tech stack
- Setup repository GitHub
- Configurazione ambiente sviluppo

### 📝 Documentation
- Creato documento proposta iniziale
- Definite specifiche tecniche v1
- Stabiliti requisiti MVP

---

## Version History Legend

### Emoji Guide
- ✨ `Added` - Nuove funzionalità
- 🔄 `Changed` - Modifiche a funzionalità esistenti  
- 🗑️ `Deprecated` - Funzionalità deprecate
- 🐛 `Fixed` - Bug fix
- 🔥 `Removed` - Funzionalità rimosse
- 🔒 `Security` - Fix di sicurezza
- 📚 `Documentation` - Aggiornamenti documentazione
- 🎨 `Style` - Modifiche UI/UX
- ⚡ `Performance` - Miglioramenti performance
- ♻️ `Refactor` - Refactoring codice
- 🧪 `Tests` - Aggiunti/modificati test
- 🚧 `WIP` - Work in progress

---

## Upcoming Releases Roadmap

### v1.0.0-beta.1 (Target: Week 2)
- Dashboard completa funzionante
- Project management base
- Component list view

### v1.0.0-beta.2 (Target: Week 4)
- Component CRUD completo
- Evaluation forms
- Action plans base

### v1.0.0-rc.1 (Target: Week 6)
- Reporting & analytics
- Admin panel
- Performance optimizations

### v1.0.0 (Target: Week 7)
- Production ready
- Full test coverage
- Complete documentation

---

## Migration Notes

### Da v0.2.x a v0.3.x
- **Breaking Change**: Migrazione da Pages Router ad App Router
- Aggiornare tutti i path di import
- Rimuovere `_app.tsx` e `_document.tsx`
- Aggiornare middleware per i18n

### Da v0.3.x a v1.0.0
- Nessun breaking change previsto
- Aggiornamento schema database potrebbe richiedere migrazione dati

---

## Hotfix History

### Hotfix Registry
*Nessun hotfix applicato finora*

Format: `[version]-hotfix-[number]: [description] ([date])`

---

## Contributors

### Core Team
- **Lead Developer**: [Nome]
- **UI/UX Designer**: [Nome]
- **Database Architect**: [Nome]
- **QA Engineer**: [Nome]

### Special Thanks
- Team Supabase per il supporto
- Community Next.js per feedback
- Beta testers per segnalazioni

---

## Links

- [GitHub Repository](https://github.com/org/geogrowth)
- [Issue Tracker](https://github.com/org/geogrowth/issues)
- [Project Board](https://github.com/org/geogrowth/projects/1)
- [Documentation](./docs/README.md)

---

*Per segnalare problemi o suggerire miglioramenti, aprire una issue su GitHub.*

**Maintained by**: GeoGrowth Team  
**License**: [License Type]  
**Last Updated**: 2025-08-25