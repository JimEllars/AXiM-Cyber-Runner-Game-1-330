const GAME_PATH = "/games/Cyber-Runner";

const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.walletconnect.com https://*.walletconnect.org; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:; frame-src 'self' https://*.walletconnect.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
};

function withSecurityHeaders(response, assetPath) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }

  if (
    assetPath === "/" ||
    assetPath === "/index.html" ||
    assetPath === "/sw.js" ||
    assetPath === "/registerSW.js" ||
    assetPath.endsWith(".webmanifest")
  ) {
    headers.set("Cache-Control", "no-cache");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);


    const startTime = Date.now();
    let response;

    if (url.pathname === GAME_PATH) {
      response = Response.redirect(`${url.origin}${GAME_PATH}/${url.search}`, 308);
    } else if (!url.pathname.startsWith(`${GAME_PATH}/`)) {
      response = new Response("Not Found", { status: 404 });
    } else {
      const assetPath = url.pathname.slice(GAME_PATH.length) || "/";

      if (assetPath === "/api/health" && request.method === "GET") {
        response = new Response(JSON.stringify({
          status: "ok",
          uptime: process?.uptime ? process.uptime() : 0,
          region: request.cf && request.cf.colo ? request.cf.colo : "unknown",
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } else if (assetPath === "/api/telemetry" && request.method === "POST") {
        try {
          const payload = await request.json();
          const telemetryData = {
            timestamp: new Date().toISOString(),
            colo: request.cf?.colo || 'unknown',
            country: request.cf?.country || 'unknown',
            userAgentHash: request.headers.get('user-agent') || 'unknown',
            payload
          };
          console.log(JSON.stringify({ type: 'client_telemetry', data: telemetryData }));
          // Here you would process the batched payload using env.waitUntil
          // env.waitUntil(processTelemetry(telemetryData));
        } catch (e) {
          // ignore JSON parse error for telemetry
        }
        response = new Response(null, {
          status: 202,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          }
        });
      } else if (assetPath === "/api/telemetry" && request.method === "OPTIONS") {
        response = new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          }
        });
      } else if (assetPath.startsWith("/api/")) {
        response = Response.json(
          {
            error:
              "The Cyber Runner score service has not been configured for this deployment.",
          },
          { status: 503, headers: { "Cache-Control": "no-store" } },
        );
      } else {
        const assetUrl = new URL(request.url);
        assetUrl.pathname = assetPath;
        const assetRequest = new Request(assetUrl, request);
        const assetResponse = await env.ASSETS.fetch(assetRequest);
        response = withSecurityHeaders(assetResponse, assetPath);
      }
    }

    const latency = Date.now() - startTime;
    const finalHeaders = new Headers(response.headers);
    finalHeaders.set("Server-Timing", `total;dur=${latency}`);
    finalHeaders.set("X-Edge-Origin", "cloudflare-worker");
    finalHeaders.set("X-AXiM-Colo", request.cf?.colo || 'unknown');

    // Also structured edge telemetry for all incoming requests: capture timestamp, country/colo code, user-agent hash, latency, and status code.
    const requestTelemetry = {
        timestamp: new Date().toISOString(),
        colo: request.cf?.colo || 'unknown',
        country: request.cf?.country || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        latency_ms: latency,
        status: response.status,
        url: request.url
    };
    console.log(JSON.stringify({ type: 'edge_request_telemetry', data: requestTelemetry }));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: finalHeaders,
    });
  },
};
