#!/bin/bash
# Read user's mind map data from Supabase
# Usage: ./scripts/sb-read.sh
# Requires .env with SUPABASE_URL, SUPABASE_SERVICE_KEY, USER_ID

set -e
source "$(dirname "$0")/../.env"

curl -s "${SUPABASE_URL}/rest/v1/mindmaps?user_id=eq.${USER_ID}&select=projects,positions" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" | python3 -m json.tool
