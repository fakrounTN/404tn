#!/usr/bin/env bash
# scripts/validate-vps-candidate.sh
# 404TN - Gate 4 VPS Candidate Container Runtime Validation Script

set -euo pipefail

CANDIDATE_TAG="404tn-frontend:seo-gate4-candidate"
CONTAINER_NAME="404tn_gate4_test"
TEST_PORT="18080"
BASE_URL="http://127.0.0.1:${TEST_PORT}"

echo "============================================================"
echo "404TN - GATE 4 VPS PRE-DEPLOYMENT RUNTIME VALIDATION"
echo "============================================================"

# Ensure we are in repo root
cd "$(dirname "$0")/.."
echo "[1/6] Repository directory: $(pwd)"
git status --short
git log -1 --oneline

# Build isolated candidate image
echo ""
echo "[2/6] Building candidate image: ${CANDIDATE_TAG}..."
sudo docker build -t "${CANDIDATE_TAG}" .

# Ensure no leftover test container
echo ""
echo "[3/6] Starting temporary test container on 127.0.0.1:${TEST_PORT}..."
sudo docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true
sudo docker run --rm -d \
  --name "${CONTAINER_NAME}" \
  -p 127.0.0.1:${TEST_PORT}:8080 \
  "${CANDIDATE_TAG}"

# Wait for container readiness
echo "Waiting for container readiness..."
sleep 2

# Verify healthz
HEALTH=$(curl -sS "${BASE_URL}/healthz" || echo "FAILED")
if [ "${HEALTH}" != "OK" ]; then
  echo "FATAL: Candidate container failed healthcheck at ${BASE_URL}/healthz (got: ${HEALTH})"
  sudo docker stop "${CONTAINER_NAME}" 2>/dev/null || true
  exit 1
fi
echo "Candidate container is healthy (healthz: OK)"

echo ""
echo "============================================================"
echo "[4/6] RUNNING COMPLETE ROUTING VALIDATION MATRIX"
echo "============================================================"

FAILED_COUNT=0
PASSED_COUNT=0

check_status_no_redirect() {
  local path="$1"
  local expected_status="$2"
  local url="${BASE_URL}${path}"
  
  local headers
  headers=$(curl -sS -o /dev/null -D - "${url}")
  local status
  status=$(echo "${headers}" | grep -i "^HTTP/" | tail -1 | awk '{print $2}')
  local location
  location=$(echo "${headers}" | grep -i "^location:" | tr -d '\r' || true)

  if [ "${status}" = "${expected_status}" ] && [ -z "${location}" ]; then
    echo "  [PASS] ${path} -> HTTP ${status} (No redirect)"
    PASSED_COUNT=$((PASSED_COUNT + 1))
  else
    echo "  [FAIL] ${path} -> HTTP ${status} (Expected: ${expected_status}, Location: ${location})"
    FAILED_COUNT=$((FAILED_COUNT + 1))
  fi
}

check_redirect() {
  local path="$1"
  local expected_status="$2"
  local expected_location="$3"
  local url="${BASE_URL}${path}"

  local headers
  headers=$(curl -sS -o /dev/null -D - "${url}")
  local status
  status=$(echo "${headers}" | grep -i "^HTTP/" | tail -1 | awk '{print $2}')
  local location
  location=$(echo "${headers}" | grep -i "^location:" | awk '{print $2}' | tr -d '\r' || true)

  if [ "${status}" = "${expected_status}" ] && [ "${location}" = "${expected_location}" ]; then
    echo "  [PASS] ${path} -> HTTP ${status} -> Location: ${location}"
    PASSED_COUNT=$((PASSED_COUNT + 1))
  else
    echo "  [FAIL] ${path} -> HTTP ${status} (Expected ${expected_status}), Location: ${location} (Expected: ${expected_location})"
    FAILED_COUNT=$((FAILED_COUNT + 1))
  fi
}

echo ""
echo "--- 1. CANONICAL ROUTES (Expected: HTTP 200, NO redirect) ---"
CANONICAL_ROUTES=(
  "/"
  "/summer-2026"
  "/the-files"
  "/gabes"
  "/timeline"
  "/state-response"
  "/evidence"
  "/methodology"
  "/geospatial-monitor"
  "/presidency"
  "/statement"
  "/issues/water"
  "/issues/electricity"
  "/issues/pollution"
  "/issues/work"
  "/issues/migration"
  "/issues/public-services"
  "/issues/rights"
)

for route in "${CANONICAL_ROUTES[@]}"; do
  check_status_no_redirect "${route}" "200"
done

echo ""
echo "--- 2. ALIAS ROUTES (Expected: HTTP 200, noindex) ---"
check_status_no_redirect "/geospatial" "200"
check_status_no_redirect "/issues/rights-institutions" "200"

echo ""
echo "--- 3. TRAILING SLASH NORMALIZATION (Expected: HTTP 301 -> https://404tn.com/...) ---"
check_redirect "/gabes/" "301" "https://404tn.com/gabes"
check_redirect "/issues/water/" "301" "https://404tn.com/issues/water"
check_redirect "/issues/pollution/" "301" "https://404tn.com/issues/pollution"
check_redirect "/presidency/" "301" "https://404tn.com/presidency"
check_redirect "/gabes/?source=test" "301" "https://404tn.com/gabes?source=test"

echo ""
echo "--- 4. INVALID URLS (Expected: HTTP 404, True 404 page) ---"
INVALID_ROUTES=(
  "/does-not-exist"
  "/issues/fake"
  "/gabes/fake"
  "/random/test/path"
)

for route in "${INVALID_ROUTES[@]}"; do
  headers=$(curl -sS -o /dev/null -D - "${BASE_URL}${route}")
  status=$(echo "${headers}" | grep -i "^HTTP/" | tail -1 | awk '{print $2}')
  robots_header=$(echo "${headers}" | grep -i "x-robots-tag:" | tr -d '\r' || true)
  body=$(curl -sS "${BASE_URL}${route}")

  if [ "${status}" = "404" ] && [[ "${robots_header}" =~ "noindex" ]] && [[ "${body}" =~ "PAGE NOT FOUND" || "${body}" =~ "404" ]]; then
    echo "  [PASS] ${route} -> HTTP 404, X-Robots-Tag: noindex, Custom 404 HTML body"
    PASSED_COUNT=$((PASSED_COUNT + 1))
  else
    echo "  [FAIL] ${route} -> Status: ${status}, Header: ${robots_header}"
    FAILED_COUNT=$((FAILED_COUNT + 1))
  fi
done

echo ""
echo "--- 5. STATIC ASSET ROUTING ---"
REAL_JS=$(find dist/assets -name "*.js" 2>/dev/null | head -1 | sed 's|dist||')
REAL_CSS=$(find dist/assets -name "*.css" 2>/dev/null | head -1 | sed 's|dist||')

if [ -n "${REAL_JS}" ]; then
  check_status_no_redirect "${REAL_JS}" "200"
fi
if [ -n "${REAL_CSS}" ]; then
  check_status_no_redirect "${REAL_CSS}" "200"
fi

MISSING_ASSET_STATUS=$(curl -sS -o /dev/null -D - "${BASE_URL}/assets/definitely-missing.js" | grep -i "^HTTP/" | tail -1 | awk '{print $2}')
if [ "${MISSING_ASSET_STATUS}" = "404" ]; then
  echo "  [PASS] /assets/definitely-missing.js -> HTTP 404 (No SPA fallback)"
  PASSED_COUNT=$((PASSED_COUNT + 1))
else
  echo "  [FAIL] /assets/definitely-missing.js -> HTTP ${MISSING_ASSET_STATUS} (Expected 404)"
  FAILED_COUNT=$((FAILED_COUNT + 1))
fi

echo ""
echo "--- 6. API SAFETY BOUNDARY ---"
API_STATUS=$(curl -sS -o /dev/null -D - "${BASE_URL}/api/issues/water" | grep -i "^HTTP/" | tail -1 | awk '{print $2}')
if [ "${API_STATUS}" = "404" ]; then
  echo "  [PASS] /api/issues/water -> HTTP 404"
  PASSED_COUNT=$((PASSED_COUNT + 1))
else
  echo "  [FAIL] /api/issues/water -> HTTP ${API_STATUS} (Expected 404)"
  FAILED_COUNT=$((FAILED_COUNT + 1))
fi

echo ""
echo "--- 7. HTML HEAD CONTENT & SEO ASSERTIONS ---"
verify_html_meta() {
  local route="$1"
  local expected_canonical="$2"
  local expected_h1_contains="$3"

  local html
  html=$(curl -sS "${BASE_URL}${route}")
  
  local has_canonical=0
  if echo "${html}" | grep -q "<link rel=\"canonical\" href=\"${expected_canonical}\""; then
    has_canonical=1
  fi

  local has_h1=0
  if echo "${html}" | grep -q "${expected_h1_contains}"; then
    has_h1=1
  fi

  if [ ${has_canonical} -eq 1 ] && [ ${has_h1} -eq 1 ]; then
    echo "  [PASS] ${route} -> Canonical: ${expected_canonical}, H1 validated"
    PASSED_COUNT=$((PASSED_COUNT + 1))
  else
    echo "  [FAIL] ${route} -> Canonical match: ${has_canonical}, H1 match: ${has_h1}"
    FAILED_COUNT=$((FAILED_COUNT + 1))
  fi
}

verify_html_meta "/gabes" "https://404tn.com/gabes" "Gabès Chemical Pollution"
verify_html_meta "/issues/pollution" "https://404tn.com/issues/pollution" "Pollution &amp; Environment"
verify_html_meta "/issues/water" "https://404tn.com/issues/water" "Water Crisis &amp; Resource Scarcity"
verify_html_meta "/presidency" "https://404tn.com/presidency" "Presidency &amp; Executive Authority"

echo ""
echo "============================================================"
echo "[5/6] TEARDOWN TEMPORARY CONTAINER"
echo "============================================================"
sudo docker stop "${CONTAINER_NAME}"
echo "Temporary container ${CONTAINER_NAME} stopped and removed."

echo ""
echo "============================================================"
echo "[6/6] VALIDATION SUMMARY"
echo "============================================================"
echo "Passed checks: ${PASSED_COUNT}"
echo "Failed checks: ${FAILED_COUNT}"

if [ ${FAILED_COUNT} -eq 0 ]; then
  echo "STATUS: ALL GATE 4 RUNTIME ASSERTIONS PASSED"
  exit 0
else
  echo "STATUS: GATE 4 VALIDATION FAILED WITH ${FAILED_COUNT} ERRORS"
  exit 1
fi
