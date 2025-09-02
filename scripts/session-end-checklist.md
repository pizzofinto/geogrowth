# 📋 END OF SESSION CHECKLIST

## Before Ending Session
- [ ] Update `docs/session-tracker.md` with:
  - [ ] What was completed
  - [ ] Current state/issues  
  - [ ] Next session priorities
  - [ ] Files modified
- [ ] Update `docs/progress-tracker.md` if milestones changed
- [ ] Commit changes with descriptive message
- [ ] Leave TODO comments in code if work is incomplete

## Quick Commands
```bash
# Check current status
git status

# Review what was changed
git diff --name-only

# Update session tracker
code docs/session-tracker.md

# Update progress tracker (if needed)
code docs/progress-tracker.md

# Commit changes
git add .
git commit -m "feat: your descriptive message"
```

## Handoff Notes Template
```markdown
## Session Handoff - [Date]

### ✅ Completed
- [List what was finished]

### 🔄 In Progress  
- [List ongoing work]

### ⚠️ Known Issues
- [List any problems encountered]

### 🎯 Next Priorities
- [List what should be done next]

### 📁 Files Modified
- [List key files changed]
```