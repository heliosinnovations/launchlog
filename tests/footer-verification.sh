#!/bin/bash
set -e

# Footer Section Testing for Issue #7
# Test deployed footer at https://launchlog-lac.vercel.app

DEPLOYED_URL="https://launchlog-lac.vercel.app"
PASS_COUNT=0
FAIL_COUNT=0
TOTAL_TESTS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Footer Section Testing - Issue #7"
echo "Deployed URL: $DEPLOYED_URL"
echo "=========================================="
echo ""

# Fetch the HTML
echo "Fetching deployed HTML..."
HTML=$(curl -s "$DEPLOYED_URL")
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYED_URL")

# Test 1: Site Accessibility
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 1: Site accessible (HTTP 200)... "
if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC} - HTTP code: $HTTP_CODE"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 2: Footer element exists
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 2: Footer element exists... "
if echo "$HTML" | grep -q '<footer'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 3: LaunchLog logo/brand in footer
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 3: LaunchLog brand in footer... "
if echo "$HTML" | grep -A 50 '<footer' | grep -q 'LaunchLog'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 4: Rocket icon (logo) present
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 4: Rocket icon (logo) present... "
if echo "$HTML" | grep -A 50 '<footer' | grep -q -i 'rocket\|<svg'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 5: Copyright year 2026
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 5: Copyright year 2026... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q '2026'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 6: Features link
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 6: Features link present... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q 'Features'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 7: Docs link
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 7: Docs link present... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q 'Docs'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 8: Pricing link
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 8: Pricing link present... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q 'Pricing'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 9: Blog link
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 9: Blog link present... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q 'Blog'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 10: Privacy Policy link
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 10: Privacy Policy link present... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q -i 'privacy'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 11: Terms link
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 11: Terms of Service link present... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q -i 'terms'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 12: GitHub social link
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 12: GitHub social link present... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q -i 'github'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 13: Twitter social link
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 13: Twitter social link present... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q -i 'twitter'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 14: Discord social link
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 14: Discord social link present... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q -i 'discord'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 15: Responsive grid classes
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 15: Responsive grid classes present... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q 'md:grid-cols'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 16: Space Grotesk font for brand
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 16: Space Grotesk font for brand... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q 'font-space-grotesk'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 17: Gradient on logo icon
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 17: Gradient on logo icon... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q 'from-indigo-500.*via-purple-500.*to-fuchsia-500\|bg-gradient-to-br'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 18: Hover states (transition classes)
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 18: Hover transition classes present... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q 'hover:.*transition'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 19: ARIA label on logo link
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 19: ARIA label on logo link... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q 'aria-label.*LaunchLog'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 20: ARIA label on social links
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 20: ARIA labels on social links... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q 'aria-label.*Twitter\|aria-label.*GitHub\|aria-label.*Discord'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 21: ARIA hidden on decorative icons
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 21: ARIA hidden on decorative icons... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q 'aria-hidden="true"'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 22: Navigation semantic HTML
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 22: <nav> element in footer... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q '<nav'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 23: Footer navigation ARIA label
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 23: Footer navigation ARIA label... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q 'aria-label="Footer navigation"\|aria-label="Legal"'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 24: External links have rel="noopener noreferrer"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 24: External links security (noopener noreferrer)... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q 'rel="noopener noreferrer"'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 25: External links have target="_blank"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 25: External links open in new tab... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q 'target="_blank"'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 26: Social media links role="list"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 26: Social media links with role list... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q 'role="list"'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 27: Border top on footer
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 27: Border top styling on footer... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q 'border-t'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 28: Max width container
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 28: Max width container (1000px)... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q 'max-w-\[1000px\]'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 29: Centered container
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 29: Centered container (mx-auto)... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q 'mx-auto'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 30: Padding on container
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Test 30: Padding on footer container... "
if echo "$HTML" | grep -A 100 '<footer' | grep -q 'px-6\|py-12'; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASS_COUNT${NC}"
echo -e "Failed: ${RED}$FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  PASS_RATE=$(echo "scale=2; $PASS_COUNT * 100 / $TOTAL_TESTS" | bc)
  echo -e "${YELLOW}⚠️  Pass rate: $PASS_RATE%${NC}"
  exit 1
fi
