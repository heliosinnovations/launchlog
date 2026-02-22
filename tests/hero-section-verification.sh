#!/bin/bash
# Hero Section Testing Script for Issue #44
# Based on static HTML analysis pattern from past lessons

set -e

DEPLOYED_URL="https://launchlog-lac.vercel.app"
PASS_COUNT=0
FAIL_COUNT=0
TOTAL_TESTS=0

# Color output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================================="
echo "Hero Section Testing - Issue #44"
echo "URL: $DEPLOYED_URL"
echo "=================================================="
echo ""

# Fetch the deployed HTML
echo "Fetching deployed HTML..."
HTML=$(curl -s "$DEPLOYED_URL")
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYED_URL")

# Helper function to run tests
run_test() {
    local test_name="$1"
    local test_command="$2"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASS${NC} - $test_name"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}❌ FAIL${NC} - $test_name"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

echo "=== FUNCTIONAL TESTS ==="
echo ""

# Site Accessibility
run_test "Site accessible (HTTP 200)" "[ $HTTP_CODE -eq 200 ]"
run_test "HTML content fetched" "[ -n \"$HTML\" ]"

# Hero Section Structure
run_test "Hero section exists" "echo \"\$HTML\" | grep -q '<section.*relative.*overflow-hidden'"
run_test "Hero heading exists" "echo \"\$HTML\" | grep -q 'Your code'"
run_test "Hero gradient text exists" "echo \"\$HTML\" | grep -q 'Your impact'"

# Badge Content
run_test "Beta badge present" "echo \"\$HTML\" | grep -q 'Now in public beta'"
run_test "Beta badge role attribute" "echo \"\$HTML\" | grep -q 'role=\"status\"'"
run_test "Platform status ARIA label" "echo \"\$HTML\" | grep -q 'aria-label=\"Platform status\"'"
run_test "Pulse animation on status indicator" "echo \"\$HTML\" | grep -q 'animate-pulse'"

# Subheadline
run_test "Subheadline text present" "echo \"\$HTML\" | grep -q 'Auto-sync your GitHub projects'"
run_test "Mentions HackerNews" "echo \"\$HTML\" | grep -q 'HackerNews'"
run_test "Mentions Reddit" "echo \"\$HTML\" | grep -q 'Reddit'"
run_test "Mentions Product Hunt" "echo \"\$HTML\" | grep -q 'Product Hunt'"

# CTA Button
run_test "Sign in link exists" "echo \"\$HTML\" | grep -q 'href=\"/signin\"'"
run_test "Sign in button text" "echo \"\$HTML\" | grep -q 'Sign in with GitHub'"
run_test "GitHub icon present" "echo \"\$HTML\" | grep -i -q 'github'"
run_test "CTA button ARIA label" "echo \"\$HTML\" | grep -q 'aria-label=\"Sign in with GitHub to connect your account\"'"

# Trust Indicator
run_test "Free forever text" "echo \"\$HTML\" | grep -q 'Free forever'"
run_test "No credit card text" "echo \"\$HTML\" | grep -q 'No credit card needed'"
run_test "CheckCircle icon present" "echo \"\$HTML\" | grep -q 'CheckCircle'"

# Showcase Badges
run_test "HackerNews badge" "echo \"\$HTML\" | grep -q '312'"
run_test "Product Hunt badge" "echo \"\$HTML\" | grep -q '#2'"
run_test "Twitter badge" "echo \"\$HTML\" | grep -q '847'"
run_test "Reddit badge" "echo \"\$HTML\" | grep -q '2.4K'"
run_test "Badge caption text" "echo \"\$HTML\" | grep -q 'Example badges that appear on your projects'"

echo ""
echo "=== VISUAL FIDELITY TESTS ==="
echo ""

# Typography
run_test "Space Grotesk font variable" "echo \"\$HTML\" | grep -q 'font-\[family-name:var(--font-space-grotesk)\]'"
run_test "Hero heading large size (md:text-\\[52px\\])" "echo \"\$HTML\" | grep -q 'md:text-\[52px\]'"
run_test "Hero heading tracking" "echo \"\$HTML\" | grep -q 'tracking-\[-0.03em\]'"
run_test "Subheadline size (md:text-xl)" "echo \"\$HTML\" | grep -q 'md:text-xl'"

# Gradients
run_test "Hero gradient colors (indigo-purple-fuchsia)" "echo \"\$HTML\" | grep -q 'from-indigo-500 via-purple-500 to-fuchsia-500'"
run_test "Gradient text clipping" "echo \"\$HTML\" | grep -q 'bg-clip-text'"
run_test "CTA button gradient" "echo \"\$HTML\" | grep -q 'bg-gradient-to-r from-indigo-500'"
run_test "Background gradient effect (indigo)" "echo \"\$HTML\" | grep -q 'bg-indigo-500/20'"
run_test "Background gradient effect (purple)" "echo \"\$HTML\" | grep -q 'bg-purple-500/15'"

# Spacing & Layout
run_test "Container max width" "echo \"\$HTML\" | grep -q 'max-w-\[1100px\]'"
run_test "Container horizontal padding" "echo \"\$HTML\" | grep -q 'px-6'"
run_test "Hero vertical padding (pt-16)" "echo \"\$HTML\" | grep -q 'pt-16'"
run_test "Hero bottom padding (pb-20)" "echo \"\$HTML\" | grep -q 'pb-20'"
run_test "Text centering" "echo \"\$HTML\" | grep -q 'text-center'"
run_test "Subheadline max width" "echo \"\$HTML\" | grep -q 'max-w-\[600px\]'"

# Interactive States & Transitions
run_test "CTA hover transform" "echo \"\$HTML\" | grep -q 'hover:-translate-y-0.5'"
run_test "CTA transition duration" "echo \"\$HTML\" | grep -q 'transition-all duration-300'"
run_test "CTA shadow effect" "echo \"\$HTML\" | grep -q 'shadow-\[0_8px_32px_rgba(99,102,241,0.35)\]'"
run_test "CTA hover shadow enhancement" "echo \"\$HTML\" | grep -q 'hover:shadow-\[0_12px_40px_rgba(99,102,241,0.45)\]'"
run_test "Badge hover transform" "echo \"\$HTML\" | grep -q 'hover:-translate-y-1'"
run_test "Badge transition duration" "echo \"\$HTML\" | grep -q 'transition-all duration-300'"

echo ""
echo "=== RESPONSIVE DESIGN TESTS ==="
echo ""

# Responsive Classes
run_test "Responsive heading size (lg:text-\\[72px\\])" "echo \"\$HTML\" | grep -q 'lg:text-\[72px\]'"
run_test "Responsive padding top (md:pt-24)" "echo \"\$HTML\" | grep -q 'md:pt-24'"
run_test "Responsive padding bottom (md:pb-28)" "echo \"\$HTML\" | grep -q 'md:pb-28'"
run_test "Responsive button layout (sm:flex-row)" "echo \"\$HTML\" | grep -q 'sm:flex-row'"
run_test "Mobile button layout (flex-col)" "echo \"\$HTML\" | grep -q 'flex-col sm:flex-row'"
run_test "Responsive badge layout" "echo \"\$HTML\" | grep -q 'sm:gap-4'"

echo ""
echo "=== ACCESSIBILITY TESTS ==="
echo ""

# Semantic HTML
run_test "Semantic section tag" "echo \"\$HTML\" | grep -q '<section'"
run_test "Semantic h1 heading" "echo \"\$HTML\" | grep -q '<h1'"
run_test "Semantic paragraph tags" "echo \"\$HTML\" | grep -q '<p'"

# ARIA Labels
run_test "CTA group role" "echo \"\$HTML\" | grep -q 'role=\"group\"'"
run_test "CTA group ARIA label" "echo \"\$HTML\" | grep -q 'aria-label=\"Call to action buttons\"'"
run_test "Badge list role" "echo \"\$HTML\" | grep -q 'role=\"list\"'"
run_test "Badge list ARIA label" "echo \"\$HTML\" | grep -q 'aria-label=\"Example platform mention badges\"'"
run_test "Badge listitem roles" "echo \"\$HTML\" | grep -q 'role=\"listitem\"'"

# Decorative Elements
run_test "Decorative gradient aria-hidden" "echo \"\$HTML\" | grep -q 'aria-hidden=\"true\"'"
run_test "Icon aria-hidden attributes" "echo \"\$HTML\" | grep -A 10 'Github' | grep -q 'aria-hidden=\"true\"'"

# Focus Management
run_test "CTA focus outline" "echo \"\$HTML\" | grep -q 'focus:outline-none'"
run_test "CTA focus ring" "echo \"\$HTML\" | grep -q 'focus:ring-2'"
run_test "CTA focus ring color" "echo \"\$HTML\" | grep -q 'focus:ring-indigo-500'"
run_test "CTA focus ring offset" "echo \"\$HTML\" | grep -q 'focus:ring-offset-2'"

echo ""
echo "=== PERFORMANCE & SECURITY TESTS ==="
echo ""

# CSS Variables (Performance)
run_test "CSS color variables used" "echo \"\$HTML\" | grep -q 'var(--color-text-secondary)'"
run_test "CSS border variables used" "echo \"\$HTML\" | grep -q 'var(--color-border)'"
run_test "CSS surface variables used" "echo \"\$HTML\" | grep -q 'var(--color-surface)'"
run_test "CSS background variables used" "echo \"\$HTML\" | grep -q 'var(--color-bg)'"

# No Console Errors (checked separately)
run_test "No obvious JavaScript errors in HTML" "! echo \"\$HTML\" | grep -i 'error.*console'"

echo ""
echo "=================================================="
echo "TEST SUMMARY"
echo "=================================================="
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "\n${GREEN}✅ ALL TESTS PASSED - Hero section certified${NC}"
    exit 0
else
    PASS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASS_COUNT/$TOTAL_TESTS)*100}")
    echo -e "\n${YELLOW}⚠️  Pass rate: ${PASS_RATE}%${NC}"
    exit 1
fi
