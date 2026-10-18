#!/bin/sh
# Smoke test a running FlowGuard deployment: ./docker/smoke-test.sh https://flowguard-xxxx.a.run.app
# Calls Gemini a few times (a couple of cents). Exits non-zero on the first failure.
set -u
BASE="${1:?usage: smoke-test.sh BASE_URL}"
fail=0

check() { # name, expected status, curl args...
    name="$1"; want="$2"; shift 2
    got=$(curl -s -o /tmp/fg_body -w '%{http_code}' --max-time 120 "$@")
    if [ "$got" = "$want" ]; then echo "PASS  $name ($got)"; else echo "FAIL  $name: expected $want, got $got"; head -c 300 /tmp/fg_body; echo; fail=1; fi
}

check "health /up"                    200 "$BASE/up"
check "React app at /"                200 "$BASE/"
check "React route fallback /queue"   200 "$BASE/some/deep/link"
check "other PHP files are blocked"   404 "$BASE/info.php"
curl -s "$BASE/.env" | grep -q APP_KEY && { echo "FAIL  .env is exposed"; fail=1; } || echo "PASS  .env is not exposed"
check "queue"                         200 "$BASE/api/queue"
check "orders list"                   200 "$BASE/api/orders?limit=5"
check "orders filter validation"      422 -H 'Accept: application/json' "$BASE/api/orders?tier=EXTREME"
check "unknown order"                 404 -H 'Accept: application/json' "$BASE/api/orders/99999999"

ID=$(curl -s "$BASE/api/queue" | sed -n 's/.*"order":{"id":\([0-9]*\).*/\1/p' | head -n1)
if [ -n "$ID" ]; then
    check "order detail #$ID"         200 "$BASE/api/orders/$ID"
fi

check "copilot validation (empty)"    422 -H 'Accept: application/json' -H 'Content-Type: application/json' -d '{}' "$BASE/api/ai/copilot"
check "copilot (Gemini Pro + tools)"  200 -H 'Content-Type: application/json' -d '{"message":"What is our RTS summary for the last 30 days?"}' "$BASE/api/ai/copilot"
grep -q '"tools_used":\["get_rts_summary"' /tmp/fg_body && echo "PASS  copilot used get_rts_summary" || { echo "WARN  copilot did not report get_rts_summary"; }

check "score-order (Gemini Flash)"    200 -H 'Content-Type: application/json' -d '{"order":{"id":987654321,"channel":"MESSENGER","amount":1299,"payment_type":"COD","items":[{"name":"Power Bank","quantity":1,"price":1299}],"address":"Blk 3 Lot 4, Brgy. Mabuhay, San Pedro, Laguna","customer":{"phone_hash":"sha256:test","total_orders":0,"delivered_count":0,"rts_count":0},"conversation":[{"sender":"BUYER","message":"pa-order po, sa sahod na lang bayad"}]},"history_signals":{"past_rts_count":0,"is_cod":true}}' "$BASE/api/ai/score-order"

exit $fail
