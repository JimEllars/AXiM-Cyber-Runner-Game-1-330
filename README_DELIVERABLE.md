# Deliverables for AXiM Cyber Runner - Phase 15

### Implementation Details:

1. **Global Exit Navigation**:
   - Added a clear "X" icon to the top right of the HUD.
   - It gracefully calls `exitFullscreen` and navigates to `https://axim.us.com/games`.
   - Has a high z-index and is accessible.

2. **BroadcastChannel Loop Prevention**:
   - Updated the `syncChannel.onmessage` handler in `src/store/useCyberRunnerStore.js`.
   - Before setting state, it now correctly compares the incoming `total_bits_balance` and `selectedSkinId` (which was already there in the basic implementation) to strictly ensure they are different, preventing the infinite loop. The payload comparison is correctly managed.

3. **Web3 Network Guard**:
   - Integrated `useChainId` and `useSwitchChain` hooks from `wagmi` into `ClaimModal.jsx`.
   - Checks if `chainId === 42161` (Arbitrum One).
   - If not, the button prompts "Switch to Arbitrum Network" and calls `switchChain` when clicked.

### Testing Steps to Verify Web3 Network Guard:

To simulate a wrong-network state and verify the Claim Modal guard, follow these steps:

1. Ensure your browser has a Web3 wallet extension installed (e.g., MetaMask, Rabby).
2. Start the local development server: `npm run dev`.
3. Open the application in your browser and connect your wallet if prompted (or ensure it's connected).
4. In your wallet extension, manually switch the active network to anything other than Arbitrum One (e.g., Ethereum Mainnet, Polygon, or a Testnet).
5. Open the Claim Modal in the AXiM Cyber Runner HUD by clicking the Database icon on the top right.
6. Verify the button at the bottom of the modal now says "Switch to Arbitrum Network" instead of "Mint to Arbitrum".
7. Click the "Switch to Arbitrum Network" button. Your wallet should prompt you to switch the network back to Arbitrum One (Chain ID 42161).
8. Once you approve the network switch in your wallet, verify the button state changes back to "Mint to Arbitrum" and is enabled for minting if you have a claimable balance.

### Testing the In-Run Power-Up Economy
1. Start the game by clicking "Start Run".
2. While running (during `PLAYING` state), check the new "Deploy Shield" and "2x Multiplier" buttons on the left side of the screen.
3. If you have fewer than 50 bits, both buttons will be disabled.
4. Collect gold/cyan nodes during the run until your `total_bits_balance` reaches 50 bits (or start with an existing balance).
5. The "Deploy Shield" button should become active. Click it to deploy a shield (costs 50 bits), and observe the balance deduct. The button will then be disabled since the shield is active.
6. Accumulate up to 100 bits. The "2x Multiplier" button will become active. Click it to double your multiplier.
7. Verify that your state accurately reflects the new status, and the visual feedback responds accordingly.

### Testing KV Pagination Locally

To verify the new Leaderboard Pagination and KV caching locally:

1. Navigate to the \`edge-bridge\` directory:
   \`\`\`bash
   cd edge-bridge
   \`\`\`

2. Start the local Wrangler dev server (ensure you have Wrangler installed and authenticated):
   \`\`\`bash
   npx wrangler dev
   \`\`\`

3. In another terminal, make a request to the edge function to fetch the first page of the leaderboard:
   \`\`\`bash
   curl "http://127.0.0.1:8787/api/v1/game/leaderboard?page=1&limit=25"
   \`\`\`

4. You can interact with the local KV store to verify that the cache key \`leaderboard:global:page:1\` was created:
   \`\`\`bash
   npx wrangler kv:key get "leaderboard:global:page:1" --binding=LEADERBOARD_KV --local
   \`\`\`
   This should return the cached JSON string for page 1 of the leaderboard.

5. Test fetching a different page and check the KV cache again:
   \`\`\`bash
   curl "http://127.0.0.1:8787/api/v1/game/leaderboard?page=2&limit=25"
   npx wrangler kv:key get "leaderboard:global:page:2" --binding=LEADERBOARD_KV --local
   \`\`\`

### Testing Telemetry Error Routing

To intentionally trigger an error and verify the telemetry routing:
1. Open the application locally using \`npm run dev\`.
2. In the Chrome/Firefox Developer Tools console, execute the following to manually throw an error inside a React component context (this forces an unhandled exception that the ErrorBoundary will catch):
   \`\`\`javascript
   // Assuming you are in the browser console:
   const triggerCrash = () => {
       const el = document.getElementById('root');
       if(el) {
           // Break the react render tree artificially
           throw new Error("Intended telemetry test crash");
       }
   };
   triggerCrash();
   \`\`\`
   *(Alternatively, modify a child component like \`HUD.jsx\` to conditionally throw \`new Error('Test Crash')\` upon a specific key press or button click).*
3. Observe the UI transition to the "System Glitch - Rebooting..." ErrorBoundary fallback screen.
4. Open the Network tab in your browser's Developer Tools.
5. Check for a \`POST\` request to \`/api/v1/telemetry\`.
6. Inspect the payload of this request; it should contain \`{ "type": "react_crash", "payload": { "error": "Error: Intended telemetry test crash", ... } }\`.
7. The request should gracefully complete (or fail silently without crashing the browser/tab if the backend is down) due to the \`try/catch\` wrapper in the \`logTelemetryEvent\` function.
# Verification & Testing

## Offline Score Queueing Mechanism
1. Open the game in Chrome.
2. Open Chrome DevTools (F12) and go to the **Network** tab.
3. Change the network throttling from "No throttling" to **"Offline"**.
4. Play a run or dispatch a game over event. You will see that the network request fails but the game proceeds to the Game Over screen without blocking.
5. In the DevTools **Application** tab, under Local Storage, check for `axim_pending_scores`. You should see an array containing the serialized payload of the run.
6. Change the network back to **"No throttling"** (Online).
7. Notice the console logs indicating the sync occurred. The `axim_pending_scores` array in Local Storage should now be empty.

## Web3 Claim Modal UX
1. Obtain an ERC-20 allowance.
2. Open the Claim Modal.
3. Click "Mint to Arbitrum". The button will enter a processing state (spinning).
4. Since this is using a mock, it will resolve to success. The button will be replaced with a green success box containing a clickable mock Arbiscan transaction hash.

## Mobile Audio Context Guard
- The game audio context is explicitly resumed on interaction (e.g. clicking Start Run or Play Practice Mode), ensuring mobile browsers do not mute the game due to autoplay policies.

## Verification Steps
1. Executed `test_plan.sh` which confirmed `eslint`, Vite production build, `wrangler types`, and critical exports all pass.
2. Verified Safe Mobile Haptics Helper replaced direct calls to `navigator.vibrate` with `triggerHaptic`.
3. Verified edge bridge properly handles 429 logic with `Retry-After: 10` headers.
4. Verified `SYS.DIAG` HUD accessibility includes `FiX` close icon, `Escape` key support, and `offlineQueueCount` indicator.
