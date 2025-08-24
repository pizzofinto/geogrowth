# 🤖 CLAUDE CODE SESSION GUIDE

> **Quick Start Guide for Claude Code sessions with context preservation**

## 🚀 START OF NEW SESSION CHECKLIST

### 1. Quick Context Check (30 seconds)
```bash
# Get current state
git status
git log --oneline -5
cat docs/session-tracker.md | head -50
```

### 2. Review Key Files
- 📋 `docs/session-tracker.md` - Last session summary
- 📊 `docs/progress-tracker.md` - Overall sprint progress  
- 🔄 `docs/changelog.md` - Recent changes
- 📝 `docs/code-conventions.md` - Development standards

### 3. Essential Info to Share with Claude
```
Current branch: [branch-name]
Last session focus: [brief description]  
Priority tasks: [from session-tracker.md]
Known issues: [any blockers or warnings]
```

---

## 🎯 TEMPLATE FOR STARTING SESSIONS

**Copy and paste this to Claude Code:**

```
Hi! I'm continuing work on the GeoGrowth project. Here's the context:

Branch: [check git branch]  
Last Session: [check docs/session-tracker.md for date and focus]
Current Priority: [check "Next Session Priorities" in session-tracker.md]

Please check docs/session-tracker.md for the latest context and let me know what we should work on next.
```

---

## 📋 END OF SESSION CHECKLIST

### Before Ending Session
- [ ] Update `docs/session-tracker.md` with:
  - [x] What was completed
  - [x] Current state/issues  
  - [x] Next session priorities
  - [x] Files modified
- [ ] Update `docs/progress-tracker.md` if milestones changed
- [ ] Commit changes with descriptive message
- [ ] Leave TODO comments in code if work is incomplete

### Session Handoff Template
```bash
# Commit your work
git add .
git commit -m "feat: [description] - session end checkpoint"

# Optional: Push to backup branch
git push origin [current-branch]
```

---

## 🔧 QUICK REFERENCE

### Key Commands
```bash
npm run dev          # Start development
npm run build        # Build project  
npm run lint         # Check code quality
git status           # Check current state
```

### Important Directories
```
docs/               # All documentation
src/components/     # React components
src/app/            # Next.js app router pages
src/hooks/          # Custom React hooks
src/i18n/messages/  # Translations (EN/IT)
```

### Emergency Recovery
If Claude seems lost:
1. Share current `git status`
2. Share last 5 commits: `git log --oneline -5`  
3. Share `docs/session-tracker.md` content
4. Mention current task from progress tracker

---

## 💡 BEST PRACTICES

### For Effective Sessions
✅ Always start by checking session-tracker.md
✅ Update documentation as you work
✅ Test changes before ending session
✅ Leave clear notes for next time
✅ Follow established code conventions

### Avoid These Issues
❌ Starting work without context check
❌ Forgetting to update session tracker
❌ Not testing integrations
❌ Leaving session with broken build
❌ Not documenting what was learned

---

*Keep this file in your project root for easy access to Claude Code sessions.*