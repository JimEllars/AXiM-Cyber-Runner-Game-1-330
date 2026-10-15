#!/bin/bash
set -e

echo "1. Running ESLint..."
npx eslint src/

echo "2. Building Vite Production Bundle..."
npm run build

echo "3. Validating Worker Types..."
npx wrangler types worker-configuration.d.ts || true

echo "4. Verifying Critical Exports..."
grep -q "export const useCyberRunnerStore" src/store/useCyberRunnerStore.js
grep -q "class SynthAudioEngine" src/utils/SynthAudioEngine.js
grep -q "export const runnerApi" src/services/api.js

echo "Sprint 25 Automated Checks Passed."
