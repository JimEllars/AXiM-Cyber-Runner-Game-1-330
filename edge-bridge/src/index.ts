export interface Env {
  RUNNER_STATE: KVNamespace;
  AXIM_INTERNAL_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Axim-Signature, Authorization",
  "Cache-Control": "no-store, private"
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // 1. Ticket Status Check & Free Daily Allocation
    if (request.method === "GET" && url.pathname === "/api/v1/runner/ticket-status") {
      const address = url.searchParams.get("address")?.toLowerCase();
      if (!address) {
        return new Response(JSON.stringify({ error: "Missing wallet address" }), { status: 400, headers: CORS_HEADERS });
      }

      const today = new Date().toISOString().split("T")[0];
      const kvKey = `daily_run:${address}:${today}`;
      const usedRun = await env.RUNNER_STATE.get(kvKey);

      return new Response(JSON.stringify({
        address,
        date: today,
        freeRunAvailable: !usedRun,
        tokenRunFee: "5.00 AXiM"
      }), { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
    }

    // 2. Score Ingestion & Anti-Cheat Validation
    if (request.method === "POST" && url.pathname === "/api/v1/runner/submit-run") {
      const startTime = Date.now();
      try {
        const payload = await request.json() as any;
        const { playerAddress, score, distance, powerNodes, multiplier, elapsedTimeSec, runHash } = payload;

        // Anti-Cheat Physics Boundary Check
        const maxPossibleScore = Math.floor((distance * 10 + (powerNodes * 50)) * multiplier);
        let validationStatus = "valid";
        let isFlagged = false;
        if (score > maxPossibleScore * 1.05) { // 5% variance buffer for latency
          validationStatus = "invalid_score_bounds";
          isFlagged = true;
          // Route flagged runs to hitl_audit_logs silently
          ctx.waitUntil(
            fetch(`${env.SUPABASE_URL}/rest/v1/hitl_audit_logs`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
                "apikey": env.SUPABASE_SERVICE_KEY,
              },
              body: JSON.stringify([{
                player_address: playerAddress.toLowerCase(),
                reason: "SCORE_BOUNDS_EXCEEDED",
                run_hash: runHash,
                flagged_at: new Date().toISOString(),
                payload: payload
              }])
            }).catch(err => console.error("hitl_audit_logs error:", err))
          );

          const latency = Date.now() - startTime;
          ctx.waitUntil(
            fetch(`${env.SUPABASE_URL}/rest/v1/telemetry_logs`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
                "apikey": env.SUPABASE_SERVICE_KEY,
              },
              body: JSON.stringify([{
                run_hash: runHash,
                latency_ms: latency,
                validation_status: validationStatus,
                created_at: new Date().toISOString()
              }])
            }).catch(err => console.error("telemetry_logs error:", err))
          );

          return new Response(JSON.stringify({ success: true, status: "score_flagged_internally" }), {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
          });
        }

        // Post to Supabase AXiM Core API
        const dbRes = await fetch(`${env.SUPABASE_URL}/rest/v1/cyber_runner_runs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            "apikey": env.SUPABASE_SERVICE_KEY,
            "Prefer": "return=representation"
          },
          body: JSON.stringify([{
            player_address: playerAddress.toLowerCase(),
            score,
            distance_meters: distance,
            power_nodes_collected: powerNodes,
            multiplier_applied: multiplier,
            run_hash: runHash,
            status: "completed",
            completed_at: new Date().toISOString()
          }])
        });

        if (!dbRes.ok) throw new Error("Core API DB Ingestion Failed");

        // Mark Daily Free Run Consumed
        const today = new Date().toISOString().split("T")[0];
        await env.RUNNER_STATE.put(`daily_run:${playerAddress.toLowerCase()}:${today}`, "1", { expirationTtl: 86400 });

        const latency = Date.now() - startTime;
        ctx.waitUntil(
          fetch(`${env.SUPABASE_URL}/rest/v1/telemetry_logs`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
              "apikey": env.SUPABASE_SERVICE_KEY,
            },
            body: JSON.stringify([{
              run_hash: runHash,
              latency_ms: latency,
              validation_status: validationStatus,
              created_at: new Date().toISOString()
            }])
          }).catch(err => console.error("telemetry_logs error:", err))
        );

        return new Response(JSON.stringify({ success: true, status: "score_verified" }), {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
