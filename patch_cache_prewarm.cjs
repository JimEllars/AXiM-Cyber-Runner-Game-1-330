const fs = require('fs');

let index = fs.readFileSync('edge-bridge/src/index.ts', 'utf8');

const search = `        // Invalidate KV cache asynchronously
        ctx.waitUntil(Promise.all([
          env.LEADERBOARD_KV.delete("global_top_100"),
          env.LEADERBOARD_KV.delete("leaderboard:global:page:1")
        ]));`;

const replace = `        // Invalidate KV cache asynchronously and pre-warm pages 1-3
        ctx.waitUntil((async () => {
          try {
            await Promise.all([
              env.LEADERBOARD_KV.delete("global_top_100"),
              env.LEADERBOARD_KV.delete("leaderboard:global:page:1")
            ]);

            const topDbRes = await fetch(\`\${env.SUPABASE_URL}/rest/v1/cyber_runner_runs?status=eq.completed&order=score.desc&limit=75\`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Authorization": \`Bearer \${env.SUPABASE_SERVICE_KEY}\`,
                "apikey": env.SUPABASE_SERVICE_KEY,
              }
            });

            if (topDbRes.ok) {
              const data = await topDbRes.json() as any[];
              const page1 = data.slice(0, 25);
              const page2 = data.slice(25, 50);
              const page3 = data.slice(50, 75);

              await Promise.all([
                env.LEADERBOARD_KV.put("leaderboard:global:page:1", JSON.stringify(page1), { expirationTtl: 60 }),
                env.LEADERBOARD_KV.put("leaderboard:global:page:2", JSON.stringify(page2), { expirationTtl: 60 }),
                env.LEADERBOARD_KV.put("leaderboard:global:page:3", JSON.stringify(page3), { expirationTtl: 60 })
              ]);
            }
          } catch (e) {
            console.error("Cache pre-warming failed", e);
          }
        })());`;

if (index.includes(search)) {
    fs.writeFileSync('edge-bridge/src/index.ts', index.replace(search, replace));
    console.log("Patch applied successfully!");
} else {
    console.log("Could not find search string.");
}
