export interface Env {
  RUNNER_STATE: KVNamespace;
  AXIM_INTERNAL_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  TURNSTILE_SECRET_KEY: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Axim-Signature, Authorization",
  "Cache-Control": "no-store, private"
};


// Simple in-memory rate limiter per isolate (1 minute window)
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (record.count >= 10) {
    return false;
  }

  record.count += 1;
  return true;
}

export default {

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    try {
      // Fetch top 10 weekly scores from Supabase
      const dbRes = await fetch(`${env.SUPABASE_URL}/rest/v1/cyber_runner_runs?status=eq.completed&order=score.desc&limit=10`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          "apikey": env.SUPABASE_SERVICE_KEY,
        }
      });

      if (!dbRes.ok) {
        throw new Error("Failed to fetch top scores");
      }

      const topRuns = await dbRes.json();

      // Fire webhook to AXiM Treasury API
      const treasuryRes = await fetch(`${env.AXIM_TREASURY_URL}/api/v1/webhooks/runner-weekly-rewards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.AXIM_TREASURY_SECRET}`,
        },
        body: JSON.stringify({
          period: event.cron,
          timestamp: event.scheduledTime,
          winners: topRuns
        })
      });

      if (!treasuryRes.ok) {
        throw new Error("Failed to authorize treasury drop");
      }

      // Log successful distribution
      ctx.waitUntil(
        fetch(`${env.SUPABASE_URL}/rest/v1/telemetry_logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            "apikey": env.SUPABASE_SERVICE_KEY,
          },
          body: JSON.stringify([{
            run_hash: "CRON_WEEKLY_REWARDS",
            latency_ms: 0,
            validation_status: "treasury_drop_success",
            created_at: new Date().toISOString()
          }])
        }).catch(err => console.error(JSON.stringify({ level: "error", type: "cyber_runner_telemetry", data: { message: "Cron telemetry error", error: err instanceof Error ? err.message : err } })))
      );

      console.log(JSON.stringify({ level: "info", type: "cyber_runner_telemetry", data: { message: "Weekly rewards processed successfully." } }));
    } catch (error) {
      console.error(JSON.stringify({ level: "error", type: "cyber_runner_telemetry", data: { message: "Cron Error: Weekly Rewards Drop failed", error: error instanceof Error ? error.message : error } }));

      // Log failure distribution
      ctx.waitUntil(
        fetch(`${env.SUPABASE_URL}/rest/v1/telemetry_logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            "apikey": env.SUPABASE_SERVICE_KEY,
          },
          body: JSON.stringify([{
            run_hash: "CRON_WEEKLY_REWARDS_ERROR",
            latency_ms: 0,
            validation_status: "treasury_drop_error",
            created_at: new Date().toISOString()
          }])
        }).catch(err => console.error(JSON.stringify({ level: "error", type: "cyber_runner_telemetry", data: { message: "Cron telemetry error", error: err instanceof Error ? err.message : err } })))
      );
    }
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    const ip = request.headers.get("cf-connecting-ip") || "unknown";


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

        if (!checkRateLimit(ip)) {
          // Rate limit exceeded: silently drop write, return 200 OK
          return new Response(JSON.stringify({ success: true, status: "score_verified_rate_limited" }), {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
          });
        }

      try {
        const payload = await request.json() as any;
        const { turnstileToken, playerAddress, score, distance, powerNodes, multiplier, elapsedTimeSec, runHash } = payload;

        // Turnstile Verification
        if (!turnstileToken) {
          return new Response(JSON.stringify({ error: "Missing Turnstile token" }), { status: 403, headers: CORS_HEADERS });
        }

        const turnstileVerify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            secret: env.TURNSTILE_SECRET_KEY,
            response: turnstileToken,
            remoteip: ip
          }).toString()
        });

        const turnstileOutcome = await turnstileVerify.json() as any;
        if (!turnstileOutcome.success) {
          console.error(JSON.stringify({ level: "error", type: "cyber_runner_telemetry", data: { message: "Turnstile verification failed", response: turnstileOutcome } }));
          return new Response(JSON.stringify({ error: "Turnstile verification failed" }), { status: 403, headers: CORS_HEADERS });
        }

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
            }).catch(err => console.error(JSON.stringify({ level: "error", type: "cyber_runner_telemetry", data: { message: "hitl_audit_logs error", error: err instanceof Error ? err.message : err } })))
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
            }).catch(err => console.error(JSON.stringify({ level: "error", type: "cyber_runner_telemetry", data: { message: "telemetry_logs error", error: err instanceof Error ? err.message : err } })))
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
          }).catch(err => console.error(JSON.stringify({ level: "error", type: "cyber_runner_telemetry", data: { message: "telemetry_logs error", error: err instanceof Error ? err.message : err } })))
        );

        return new Response(JSON.stringify({ success: true, status: "score_verified" }), {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
      }
    }


    // 3. Leaderboard Edge Cache
    if (request.method === "GET" && url.pathname === "/api/v1/runner/leaderboard") {
      const cacheUrl = new URL(request.url);
      const cacheKey = new Request(cacheUrl.toString(), request);
      const cache = caches.default;

      let response = await cache.match(cacheKey);

      if (!response) {
        // Fetch from Supabase
        const dbRes = await fetch(`${env.SUPABASE_URL}/rest/v1/cyber_runner_runs?status=eq.completed&order=score.desc&limit=100`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            "apikey": env.SUPABASE_SERVICE_KEY,
          }
        });

        if (!dbRes.ok) {
           return new Response(JSON.stringify({ error: "Failed to fetch leaderboard" }), { status: 500, headers: CORS_HEADERS });
        }

        const data = await dbRes.json();

        response = new Response(JSON.stringify(data), {
          status: 200,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=60" // Cache for 60 seconds
          }
        });

        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      } else {
        // Ensure CORS headers are on cached response
        response = new Response(response.body, response);
        for (const [key, value] of Object.entries(CORS_HEADERS)) {
           response.headers.set(key, value);
        }
      }

      return response;
    }


    // 4. Achievement Sync
    if (request.method === "POST" && url.pathname === "/api/v1/runner/sync-achievements") {
      if (!checkRateLimit(ip)) {
        return new Response(JSON.stringify({ success: true, status: "rate_limited" }), {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }

      try {
        const payload = await request.json() as any;
        const { playerAddress, unlockedIds } = payload;

        if (!playerAddress || !Array.isArray(unlockedIds) || unlockedIds.length === 0) {
          return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400, headers: CORS_HEADERS });
        }

        const rows = unlockedIds.map(id => ({
          player_address: playerAddress.toLowerCase(),
          challenge_id: id,
          unlocked_at: new Date().toISOString()
        }));

        ctx.waitUntil(
          fetch(`${env.SUPABASE_URL}/rest/v1/achievements_log`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
              "apikey": env.SUPABASE_SERVICE_KEY,
            },
            body: JSON.stringify(rows)
          }).catch(err => console.error(JSON.stringify({ level: "error", type: "cyber_runner_telemetry", data: { message: "sync-achievements error", error: err instanceof Error ? err.message : err } })))
        );

        return new Response(JSON.stringify({ success: true }), {
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
