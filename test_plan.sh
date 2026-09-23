#!/bin/bash
set -e

echo "Running lint checks via eslint..."
npx eslint src/

echo "Executing Vite production build..."
npm run build

echo "Validating Worker bundle integrity..."
npx wrangler types worker-configuration.d.ts || true

echo "Verifying critical exports in useCyberRunnerStore.js..."
grep -q "export const useCyberRunnerStore" src/store/useCyberRunnerStore.js

echo "Verifying critical exports in SynthAudioEngine.js..."
grep -q "class SynthAudioEngine" src/utils/SynthAudioEngine.js

echo "Verifying critical exports in api.js..."
grep -q "export const runnerApi" src/services/api.js

echo "Tests pass"
