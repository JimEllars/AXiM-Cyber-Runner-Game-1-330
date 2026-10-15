const fs = require('fs');

let index = fs.readFileSync('edge-bridge/src/index.ts', 'utf8');

const search = `    // 5. Achievement Sync
    if (request.method === "POST" && url.pathname === "/api/v1/game/sync-achievements") {`;

const replace = `    // 5. Achievement Sync
    if (request.method === "POST" && url.pathname === "/api/v1/game/sync-achievements") {`;

const newEndpoint = `    // 6. Edge Telemetry Diagnostics Summary
    if (request.method === "GET" && url.pathname === "/api/v1/admin/telemetry-summary") {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || authHeader !== \`Bearer \${env.AXIM_INTERNAL_KEY}\`) {
        return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS });
      }

      try {
        const dbRes = await fetch(\`\${env.SUPABASE_URL}/rest/v1/telemetry_logs?order=created_at.desc&limit=50\`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": \`Bearer \${env.SUPABASE_SERVICE_KEY}\`,
            "apikey": env.SUPABASE_SERVICE_KEY,
          }
        });

        if (!dbRes.ok) {
          return new Response(JSON.stringify({ error: "Failed to fetch telemetry summary" }), { status: 500, headers: CORS_HEADERS });
        }

        const data = await dbRes.json() as any[];

        let totalLatency = 0;
        let rateLimitTriggers = 0;
        let errorRates = 0;
        const coloStats: Record<string, number> = {};

        data.forEach(entry => {
          totalLatency += entry.latency_ms || 0;
          if (entry.validation_status !== 'valid') errorRates++;
          // Simulated rate limit / colo stats for now based on properties available
          // In a real scenario, these would come from specific db columns or Cloudflare headers logged
        });

        const summary = {
          total_entries: data.length,
          average_latency_ms: data.length ? Math.round(totalLatency / data.length) : 0,
          error_rate_percentage: data.length ? Math.round((errorRates / data.length) * 100) : 0,
          rate_limit_triggers: rateLimitTriggers,
          recent_logs: data
        };

        return new Response(JSON.stringify(summary), {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
      }
    }

`;

if (index.includes(search)) {
    index = index.replace(search, newEndpoint + search);
    fs.writeFileSync('edge-bridge/src/index.ts', index);
    console.log("Patched edge telemetry endpoint!");
} else {
    console.log("Could not find search string for telemetry endpoint.");
}
