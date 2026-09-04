# Sprint 18 Deliverable: AXiM Brand Integration & Disconnect Polish

## Updates Made

1. **Brand Integration (`src/components/RunnerHUD.jsx`)**
   - Injected the AXiM primary logo into the top-left section of the HUD.
   - Constrained it using responsive max-widths (`max-w-[120px] md:max-w-[150px]`) and applied a hover opacity effect (`hover:opacity-80`).
   - Linked to `https://axim.us.com/games` with safety properties (`target="_blank"`, `rel="noopener noreferrer"`) to prevent active game session disruption.
   - Utilized `decoding="async"` on the image element for zero-downtime performance.

2. **Wallet Disconnect State (`src/components/TokenGateModal.jsx` & `src/store/useCyberRunnerStore.js`)**
   - Imported the `useAccount` hook from `wagmi` in `TokenGateModal.jsx`.
   - Setup a `useEffect` hook to observe `isDisconnected`. If a user disconnects their wallet (e.g., directly via MetaMask), it explicitly triggers the local state flush using `syncWalletAddress(null)`.
   - Enhanced `syncWalletAddress` in the store to also wipe `ticketStatus` back to its baseline `{ freeRunAvailable: true }`, ensuring the player is completely unauthenticated and returned to "Practice Mode".

## Testing Steps

**Verifying the External Link Behavior:**
1. Boot the application locally (`npm run dev`) and open the game in your browser.
2. Observe the AXiM logo in the top left corner of the HUD (visible immediately without blocking the Canvas).
3. Click the AXiM logo. It should open `https://axim.us.com/games` in a *new tab* (target="_blank"), leaving the game instance unaffected and safe in the original tab.

**Verifying the Wallet Disconnect Flush:**
1. Connect your Web3 wallet provider (e.g., via a Connect button if present, or mocking it in the environment).
2. Start the game or trigger the `TokenGateModal` to appear (by exhausting the daily run).
3. Open your wallet provider extension (e.g., MetaMask) and manually disconnect the active account.
4. The Wagmi `useAccount` hook will detect this event (`isDisconnected === true`) and flush the Zustand store (`syncWalletAddress(null)`).
5. Confirm that the application has reverted to a clean slate (score 0, unauthenticated state, and daily ticket refreshed to `freeRunAvailable: true`).

## Testing Step 1: AXiM Logo & External Link
1. Inspect RunnerHUD component.
2. Verify the logo image is fetched from the correct wp.axim.us.com URL.
3. Verify it is wrapped in an anchor tag linking to https://axim.us.com/games with target=_blank and rel=noopener noreferrer.
4. Verify mobile safe-area classes pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] are applied to ensure it does not overlap with device notches.

## Testing Step 2: Canvas Resize Debouncing
1. Inspect RunnerCanvas component.
2. Verify the resize event handler logic uses a debounce utility/timeout (e.g., 150ms) to throttle updates when the window is resized rapidly.
3. Test by simulating a device rotation or rapidly resizing the browser window, ensuring the canvas updates correctly after the debounced delay without freezing the UI thread.

## Testing Step 3: SIWE Session Expiry Check
1. Inspect TokenGateModal.jsx and api.js.
2. Verify runnerApi.checkSession() has been added to api.js.
3. Verify handleBuyTicket in TokenGateModal.jsx calls runnerApi.checkSession() before proceeding with the transaction.
4. If checkSession fails, ensure a toast notification SESSION EXPIRED: Re-sign to verify session is displayed and the token transfer does not proceed.

## Testing the Worker Reset State
To verify the worker's reset state:
1. Start the game by clicking "Play Practice Mode".
2. Die to an obstacle to trigger the game over state.
3. In the game over screen, note your current score and distance.
4. Restart the game by clicking "Run Again".
5. Observe that the obstacles and nodes begin spawning correctly and the game's speed/distance counters do not instantly resume from the values prior to the crash, confirming that the internal physics distance and accumulators have been properly cleared by the RESET message.
### Wagmi Balance Fetch Verification Steps

To verify the integration of the user's AXiM token balance via Wagmi, follow these steps:
1.  **Launch Local Environment:** Ensure the local dev server is running (\`npm run dev\`).
2.  **Connect Wallet:** Click "Connect Wallet" (or interact with the SIWE flow) using a Web3 wallet (e.g., MetaMask, Rabby). Ensure you are connected to the Arbitrum mainnet.
3.  **Exhaust Daily Run:** If your daily ticket is still available, play one round to consume it so that the Token Gate becomes active.
4.  **Trigger the Modal:** Click on the "Start Run" button again. Because you don't have a free run, the \`TokenGateModal\` will pop up.
5.  **Observe Balance:** Look inside the modal above the action buttons. You will see a line indicating your current AXiM balance (\`Balance: XXX AXiM\`).
6.  **Verify Button States:**
    *   If your balance is `< 5`, the button text will display **"Insufficient Balance"**, the button will be disabled, and a discrete link will appear below pointing to \`https://axim.us.com/swap\`.
    *   If your balance is `>= 5`, the button text will be **"Pay 5.00 AXiM"** and will be clickable.
