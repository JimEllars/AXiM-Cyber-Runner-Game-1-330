# AXiM Cyber-Runner - Sprint 11 Delivery

## Features Implemented:
1.  **Daily Streak UI Integration:** Added \`streakMultiplier\` to Zustand store. Hooked it into \`RunnerHUD.jsx\` to display glowing streak next to live score and correctly multiply base score on submit.
2.  **Challenge System Activation:** Wired in event handling to persist data to \`localStorage\`, tracking challenges correctly across sessions, auto-triggering toasts via the pre-existing \`AchievementToast.jsx\`.
3.  **Native Web Share API:** Updated \`shareHelpers.js\` to use \`navigator.share()\` (native Web Share API), gracefully falling back to \`navigator.clipboard.writeText()\` when absent. Refactored \`RunnerHUD.jsx\` and \`LeaderboardModal.jsx\` to consume this with a custom "Share Score" button prominently featured in the UI.

## Testing navigator.share() Fallback on Desktop
To verify that the \`navigator.share()\` fallback executes properly on desktop (which typically does not support Web Share API by default):

1. **Start the Development Server**: Ensure your local dev server is running (\`npm run dev\`).
2. **Access the Game**: Open your desktop browser (e.g., Chrome or Firefox) and navigate to the local address (usually \`http://localhost:5173\`).
3. **Play a Round**: Play a quick game and trigger a game-over state.
4. **Trigger Share**: Click the green "Share Score" icon on the Game Over HUD (or your personal row in the leaderboard).
5. **Observe Toast Notification**: Since \`navigator.share()\` will be undefined or will abort, the app should fall back to clipboard sharing. You should see a toast popup: **"INTEL COPIED: Score report saved to clipboard"**.
6. **Verify Clipboard**: Paste the contents (\`Ctrl+V\` / \`Cmd+V\`) into a text editor. You should see the fully formatted share text including your score, streak, and the app link.

Alternatively, to strictly mock and test the \`navigator.share\` error handling logic:
*   In Chrome DevTools, open the console and type:
    \`\`\`javascript
    navigator.share = () => Promise.reject(new Error("Simulated share failure"));
    \`\`\`
*   Click the "Share Score" button. The application will catch this failure and gracefully fallback to the clipboard implementation, verifying stability.

## Sprint 12 Delivery: Web3 Tx UX, Preferences, & Sync

### Testing Wagmi Transaction Loading States
1. Ensure your browser has a Web3 wallet (e.g., MetaMask, Rabby) installed and connected to the Arbitrum testnet (or mainnet).
2. Start the local dev server using `npm run dev`.
3. Force the `TokenGateModal` to appear by consuming your free daily run or manually setting `ticketStatus: { freeRunAvailable: false }` in the Zustand store.
4. Click "Pay 5.00 AXiM". The button text should immediately change to "Awaiting Wallet Approval..." and disable the UI.
5. In your wallet extension, observe the transaction prompt.
    - If you **Reject** the transaction: The UI should correctly catch the rejection, display a toast notification ("TRANSACTION CANCELLED"), and safely revert to the unranked mode selection without breaking the flow.
    - If you **Confirm** the transaction: The UI should advance to "Confirming on Arbitrum...". Once the transaction is mined and verified on-chain, it should finally display "Run Unlocked!" and automatically dismiss the modal.

## Sprint 13 Delivery: Iframe Telemetry & Cron Rewards

### Testing Cloudflare Cron Trigger Locally
To test the scheduled Weekly Rewards distribution locally using Wrangler:

1. **Start Wrangler in Test Scheduled Mode**:
   Ensure you have configured your `.dev.vars` (or standard environment variables) with `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `AXIM_TREASURY_URL`, and `AXIM_TREASURY_SECRET`.
   Run the Edge Bridge worker locally by navigating to `edge-bridge` and executing:
   ```bash
   npx wrangler dev --test-scheduled
   ```
   *(Note: Make sure to run this command where your wrangler configuration file is located, e.g., the project root or the `edge-bridge` folder if it has one.)*

2. **Trigger the Cron Job**:
   Once the worker is running, you can manually trigger the scheduled event by making a request to the special internal endpoint provided by Wrangler:
   ```bash
   curl "http://localhost:8787/__scheduled?cron=0+0+*+*+0"
   ```

3. **Verify the Output**:
   Check the terminal output of your running `wrangler dev` process. You should see:
   - `Weekly rewards processed successfully.` (If the Supabase and Treasury API endpoints are mock/valid)
   - Or, an appropriate error log if the endpoints are inaccessible, which confirms the error handling and fallback telemetry log is firing.

### Verifying Iframe Cross-Origin Messaging
To test the `postMessage` event broadcasting:
1. Wrap the app inside a local iframe test page or observe the console when running `npm run dev`.
2. Play a game and let it finish. Upon reaching the "GAMEOVER" state, a payload `{ type: 'AXIM_RUNNER_EVENT', payload: { event: 'GAME_OVER', ... } }` is broadcast to `window.parent`.

## Sprint 14 Delivery: Observability, SEO, & Memory Hardening

### Features Implemented:
1. **Strict JSON Observability Logging**: Formatted Edge Bridge telemetry output into strict JSON structure for centralized parsing tools (Datadog/Splunk).
2. **Open Graph SEO**: Enriched standard Open Graph `<meta>` attributes to `index.html` improving discoverability and Twitter card previews.
3. **Memory & Lifecycle Cleanup**: Bound the physics loop worker termination to React's unmount lifecycle. Utilized Page Visibility API to pause animations and AudioContext automatically when a user switches browser tabs, minimizing battery drain.
4. **Accessibility (a11y)**: Fortified the Runner HUD and Modals with explicit `aria-label`, `role="button"`, and intuitive keyboard `:focus-visible` styling elements.

### Testing Cloudflare Wrangler JSON Logs Locally
To verify the structured JSON `stdout` logs emitted by the Edge Bridge:

1. **Start Wrangler in local dev mode**:
   Navigate to the `edge-bridge` directory and run:
   ```bash
   npx wrangler dev
   ```
2. **Trigger an Event / Endpoint**:
   Use curl or Postman to submit an invalid request (or a successfully triggered cron event) designed to hit an error branch. For example, testing the hitl_audit_logs endpoint:
   ```bash
   curl -X POST http://localhost:8787/api/v1/runner/submit-run -H "Content-Type: application/json" -d '{"playerAddress": "0x123", "score": 99999999, "distance": 1, "powerNodes": 0, "multiplier": 1, "elapsedTimeSec": 10, "runHash": "test"}'
   ```
   *Note: Given the high score and low distance, this should trigger the score boundary validation check (which in our dev environment may fail if SUPABASE_URL isn't mocked/provided).*
3. **Observe JSON Log Format in Terminal**:
   Watch the running `wrangler dev` terminal. When an error is caught within a `ctx.waitUntil` execution (or cron success is logged), it will print a strict JSON object:
   ```json
   {"level": "error", "type": "cyber_runner_telemetry", "data": {"message": "hitl_audit_logs error", "error": "FetchError: ... "}}
   ```
   This confirms the observability requirement is fully active.

## Sprint 15 Delivery: Omni-Directional Mobile Support & Fullscreen Auto-Scaling

### Features Implemented:
1. **Fullscreen API Integration:** Removed strict landscape enforcement (overlay). Added automatic `requestFullscreen` triggers on game start and token gate interactions for an immersive native app feel.
2. **Dynamic Rescaling & Portrait Logic:** Re-wrote canvas sizing logic to bind to `window.innerWidth` and `innerHeight` dynamically using Resize events. Implemented camera scaling logic in the canvas drawing step to ensure correct aspect ratios and FOV, even when rotated.
3. **Responsive Physics:** Updated the `physicsWorker` to handle dynamic width messages (`INIT` and `RESIZE`). Dynamically increases object spawn distances (`1200px`) and slightly reduces the speed multiplier curve (`0.85x`) in portrait mode, guaranteeing fair play constraints when horizontally confined.
4. **Touch Control Split-Screen Revision:** Removed unreliable `swipe-down` controls. Implemented strict touch zone tracking (`e.preventDefault()`), assigning left 50% screen to slide (hold) and right 50% to jump (tap).

### Testing Portrait View and Split-Screen Controls in Chrome DevTools
1. **Start the local dev server**: `npm run dev`.
2. **Open Chrome DevTools** (F12 or Ctrl+Shift+I).
3. **Toggle Device Toolbar** (Ctrl+Shift+M or click the phone/tablet icon in DevTools).
4. **Select a mobile device** (e.g., iPhone 12 Pro) and ensure it is oriented in **Portrait Mode**.
5. Observe that the game canvas now fully renders and auto-scales instead of showing the "Landscape Required" overlay.
6. Click **Start Run**. (Note: Fullscreen API is usually blocked inside standard devtools framing unless explicitly testing on a real device or a new PWA tab, but the canvas dimensions will adapt).
7. **Test Touch Zones**:
   - Use the mouse (simulating touch) on the **Right Side** of the canvas and click: the runner should jump.
   - Click and Hold on the **Left Side** of the canvas: the runner should slide until released.
8. **Rotate Device**: Use the rotate button in DevTools to switch to Landscape. The canvas and physics worker will dynamically recalculate coordinates, speed, and spawn distances smoothly on the fly.
