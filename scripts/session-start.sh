#!/bin/bash

# 🤖 Claude Code Session Starter
# Run this script at the start of each Claude Code session

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Go to project root (one level up from scripts/)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

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
grep -A 15 "## 📋 CURRENT SESSION STATUS" docs/session-tracker.md | head -20
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