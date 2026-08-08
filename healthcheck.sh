#!/bin/bash
# iGotUp · Healthcheck do site publicado (QA)
BASE="https://igotup-growth-platform.netlify.app"
echo "=== Healthcheck: $BASE ==="
for p in "" "/referral/" "/dic/" "/mgh/" "/supabase/cadastro.html" "/styles.css" "/app.js"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 12 "$BASE$p")
  if [ "$code" = "200" ]; then echo "  ✅ $p → 200"; else echo "  ❌ $p → $code"; fi
done
echo ""
echo "=== Conexão Supabase ==="
KEY="sb_publishable_C26Cref0KHZ_8TLA3KodGw_WLxnUIY6"
for t in lojas eventos lancamentos; do
  resp=$(curl -s --max-time 10 -H "apikey: $KEY" "$URL/rest/v1/$t?select=id&limit=1")
  echo "  $t: $(echo $resp | head -c 40)"
done
