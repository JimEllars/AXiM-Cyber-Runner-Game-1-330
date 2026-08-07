# AXiM Cyber-Runner - Sprint 5 Stabilization Deliverables

The updates for Sprint 5 have been implemented with a focus on stability, robust telemetry, and UI improvements without affecting the production gameplay experience.

## Key Updates

1. **Edge Telemetry & Anti-Cheat Validation (`edge-bridge/src/index.ts`)**
   - We updated the score boundary check to run silently. It logs suspicious score hashes (`hitl_audit_logs`) and processing telemetry logs asynchronously without returning a blocking response so gameplay doesn't hang.

2. **UI/UX Modernization**
   - Integrated clean Tailwind-powered `transition-all opacity-100/0 scale-100/95` visual behaviors for all Modals to ensure smooth popping behavior.
   - Updated modal visibility states to signal a global pause state for the canvas loop to freeze background mechanics while menus are actively opened.

3. **Resiliency & Fallbacks**
   - Integrated custom `fetchWithTimeout(ms = 3000)` into `api.js` for external connections.
   - State persists gracefully to local storage if API connections fail allowing a smooth fallback into a standard free unranked run structure.

4. **Performance Boosts**
   - The audio pipeline (`SynthAudioEngine.js`) avoids blocked autoplay warnings by strictly deferring `new AudioContext()` creation to the first click interaction.
   - We updated state mutations for Canvas distance processing logic so the React tree isn't hammered on every microsecond but correctly buffers to the required frequency interval updates.


## Bug Hunt & Testing Checklist

### Anti-Cheat & Telemetry Layer
- [ ] Connect the application to a local proxy or dev-tool to intercept and bloat the submitted `score` metric well past the calculated max for the run timeframe.
- [ ] Ensure the browser correctly receives a `200 OK` response with `status: "score_flagged_internally"`.
- [ ] Verify that the frontend game-over sequence behaves normally without throwing an error blocking the reboot button.
- [ ] Check the `hitl_audit_logs` and `telemetry_logs` tables in Supabase to confirm the `runHash` logic was saved efficiently by Cloudflare.

### User Interface Modals
- [ ] Start the game in `Practice Mode`. While playing, use the hotkeys or buttons to open up `Overlay`, `Ops`, `Skins` or the `Leaderboard` menus.
- [ ] Confirm the game loop pauses entirely while the menu is up (the score counter should freeze, the background should halt, the distance counter stops).
- [ ] Confirm that closing the menu instantly resumes game flow gracefully.
- [ ] Ensure that transitioning between active Modals correctly transitions using the smooth opacity scale modifiers.

### Offline Resilience
- [ ] Simulate a dead internet connection or block API traffic.
- [ ] Start a standard game. Validate that loading the `Token Gate` logic or connecting to fetch the daily tickets triggers a fallback rather than hanging the frontend indefinitely (the timeout should resolve under 3 seconds).

### Media Handling
- [ ] Clear browser cache/cookies entirely, then load the game.
- [ ] Check console warnings - Ensure there are no "AudioContext Autoplay" block warnings appearing from the initial rendering frame.

## Testing Instructions for QA

### 1. Cloudflare Rate Limiting
- Submit multiple scores rapidly to the `/api/v1/runner/submit-run` endpoint.
- After the 10th request within a minute, observe that the API returns a `200 OK` with `{ status: "score_verified_rate_limited" }` but drops the write to the database.

### 2. Mobile Touch Controls
- Open the application on a mobile device or use the browser's developer tools mobile emulation.
- Tap the **right half of the game canvas** to trigger a jump (and tap again for a double jump).
- Tap the **left half of the game canvas** and quickly swipe downwards to trigger the slide mechanic.
- Verify that touch events correctly prevent the browser from scrolling by dragging on the canvas.

### 3. Graceful Web3 Errors
- Proceed to play until the daily free run is exhausted, triggering the Token Gate Modal.
- Click "Pay 5.00 AXiM" to simulate buying a ticket.
- Because Wagmi is mocked, a 50% chance dictates whether the transaction fails (simulating a `4001` MetaMask rejection) or succeeds.
- When an error occurs, check that a Toast message reads "TRANSACTION CANCELLED", and the modal gracefully dismisses back to unranked mode without hanging/freezing the game.

### 4. Memory/Resource Cleanup
- Use the Performance/Memory tab in DevTools to ensure closing the game properly dereferences touch event listeners.
- Verify the background synth base loop halts appropriately when ending a game instead of running multiple detached intervals.
