#!/bin/bash
# Write/update user's mind map data in Supabase
# Usage: ./scripts/sb-write.sh <json-file>
# The JSON file should contain: { "projects": [...], "positions": {...} }
# Requires .env with SUPABASE_URL, SUPABASE_SERVICE_KEY, USER_ID

set -e
source "$(dirname "$0")/../.env"

if [ -z "$1" ]; then
  echo "Usage: $0 <json-file>"
  echo "JSON file should contain: { \"projects\": [...], \"positions\": {...} }"
  exit 1
fi

# Build the upsert payload with user_id and timestamp
PAYLOAD=$(python3 -c "
import json, sys
from datetime import datetime, timezone
data = json.load(open(sys.argv[1]))
data['user_id'] = '${USER_ID}'
data['updated_at'] = datetime.now(timezone.utc).isoformat()
print(json.dumps(data))
" "$1")

curl -s "${SUPABASE_URL}/rest/v1/mindmaps" \
  -X POST \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d "${PAYLOAD}"

echo ""
echo "Data updated for user ${USER_ID}"
