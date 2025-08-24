#!/bin/bash

# 🤖 Claude Code Session Starter
# Run this script at the start of each Claude Code session

echo "🚀 CLAUDE CODE SESSION CONTEXT"
echo "=============================="
echo ""

echo "📍 CURRENT STATE:"
echo "Branch: $(git branch --show-current)"
echo "Last commit: $(git log --oneline -1)"
echo "Modified files: $(git status --porcelain | wc -l) files"
echo ""

echo "📋 LAST SESSION SUMMARY:"
echo "------------------------"
head -30 docs/session-tracker.md | grep -A 10 "## 📋 CURRENT SESSION STATUS"
echo ""

echo "🎯 NEXT PRIORITIES:"
echo "------------------"
grep -A 10 "## 🎯 NEXT SESSION PRIORITIES" docs/session-tracker.md | head -15
echo ""

echo "🐛 KNOWN ISSUES:"
echo "---------------"
grep -A 5 "### Critical Information" docs/session-tracker.md | head -10
echo ""

echo "💻 QUICK START COMMANDS:"
echo "npm run dev     # Start development server"
echo "npm run build   # Build project"
echo "npm run lint    # Check code quality"
echo ""

echo "📚 SHARE THIS WITH CLAUDE:"
echo "=========================="
echo "Branch: $(git branch --show-current)"
echo "Focus: Check docs/session-tracker.md for priorities"
echo "Status: $(git log --oneline -1)"
echo ""
echo "Ready to continue development! 🎯"