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

    if (url.pathname === GAME_PATH) {
      return Response.redirect(`${url.origin}${GAME_PATH}/${url.search}`, 308);
    }

    if (!url.pathname.startsWith(`${GAME_PATH}/`)) {
      return new Response("Not Found", { status: 404 });
    }

    const assetPath = url.pathname.slice(GAME_PATH.length) || "/";

    if (assetPath.startsWith("/api/")) {
      return Response.json(
        {
          error:
            "The Cyber Runner score service has not been configured for this deployment.",
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    const assetUrl = new URL(request.url);
    assetUrl.pathname = assetPath;

    const assetRequest = new Request(assetUrl, request);
    const response = await env.ASSETS.fetch(assetRequest);
    return withSecurityHeaders(response, assetPath);
  },
};
