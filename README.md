# AXiM Cyber Runner

AXiM Cyber Runner is an infinite side-scrolling HTML5 canvas runner engine featuring smooth player physics, Web Worker offloading, procedural 8-bit synth audio, and Web3 asset ownership integration.

## Game Architecture

- **60fps HTML5 Canvas Engine**: The core rendering loop is implemented in `RunnerCanvas.jsx`. It handles dynamic orientation changes and maintains constant 60fps performance on both desktop and mobile.
- **Web Worker Physics**: To ensure the main UI thread remains unblocked, all game physics (obstacle generation, collision detection, and projectile trajectories) are offloaded to a background Web Worker (`src/workers/physicsWorker.js`).
- **Procedural Synth Audio**: Sound effects (jumps, chimes, drones) are synthesized dynamically using the Web Audio API (`src/utils/SynthAudioEngine.js`), eliminating the need for external audio assets.

## Tokenomics & Manufactured Scarcity (AX-BITS)

- Players earn **AX-BITS** during gameplay by collecting cyan and gold nodes.
- Unauthenticated (Guest) players can earn AX-BITS locally. Upon connecting via AXiM Passport SSO, these balances merge into the player's persistent cloud balance.
- **Limited-Edition Skins**: Cosmetic assets in the game (e.g., Cyber Ronin, Emerald Core) have manufactured scarcity with fixed `max_supply` caps. These skins support token gating and will soon be tradeable on the AXiM Marketplace.

## Edge & Anti-Cheat Validation

- The Cloudflare Edge Bridge (`edge-bridge/src/index.ts`) handles score ingestion, validating runs with Cloudflare Turnstile and server-side logic bound verification.
- Global leaderboards are cached using Cloudflare KV with a 60-second edge cache TTL to ensure sub-10ms response times globally.

## Development & Deployment

The frontend is built using Vite and deployed to Cloudflare Pages. The backend runs on Cloudflare Workers.

Run \`npm run build\` to build the frontend.
Run \`cd edge-bridge && npm run build\` to build the edge worker.

**Repository Managed by Greta**
