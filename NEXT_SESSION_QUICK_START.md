# 🚀 NEXT SESSION QUICK START GUIDE

> **Session Date**: 2025-08-26 (Expected)
> **Current State**: Local main 3 commits ahead, ActionPlanAlerts design alignment ready
> **Last Updated**: 2025-08-25

## ⚡ START HERE (5 minutes)

### 1. Run Session Start Script
```bash
bash scripts/session-start.sh
```

### 2. Sync Git Repository (REQUIRED FIRST)
```bash
# Push merged work to remote
git push origin main

# Clean up remote feature branch
git push origin --delete feat/action-plan-alerts

# Create new branch for design work
git checkout -b feat/design-alignment

# Verify clean state
git status
```

## 🎯 MAIN TASK: ActionPlanAlerts Design Alignment

### Goal
Unify ActionPlanAlerts design with RecentProjects patterns for consistent dashboard UX.

### Files to Modify
- `src/components/dashboard/ActionPlanAlerts.tsx` - Main component header + layout
- `src/components/dashboard/ActionPlanAlertCard.tsx` - Individual cards styling

### Reference Pattern
- **Study**: `src/components/dashboard/RecentProjectsSection.tsx` (lines 310-360)
- **Copy**: Header with grid/list toggles, refresh button, view all button

### Key Changes Needed
1. **Header Redesign**: Add grid/list view toggles (Grid3X3, List icons)
2. **Remove Colors**: Replace colored backgrounds with white cards + hover shadows
3. **Badge System**: Use Badge components for overdue/due-soon/high-priority
4. **Grid/List Views**: Support both layout modes like RecentProjects
5. **Button Consistency**: Match exact button styles and spacing

### Testing
```bash
npm run dev  # Test at localhost:3000
```

## 📋 Success Criteria

- ✅ Header matches RecentProjects layout (toggles + actions)
- ✅ Cards use white background with subtle hover shadows
- ✅ Status shown via Badge components, not colored backgrounds
- ✅ Both grid and list views working
- ✅ Visual consistency across dashboard components
- ✅ All translations working (EN/IT)

## 📚 Reference Documentation

- **Design Proposal**: docs/session-tracker.md (lines 28-32)
- **Progress Status**: docs/progress-tracker.md (updated)
- **Full Context**: docs/changelog.md v0.4.1

---

**Ready to code!** 🎨 All planning and analysis completed.