const fs = require('fs');

// Patch api.js first
let apiJs = fs.readFileSync('src/services/api.js', 'utf8');
const searchApi = `  /**
   * Stubs fetching a claim signature for Web3 minting
   */
  async getClaimSignature(amount, walletAddress) {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      // Return a mock signature
      return "0xmocksignaturedeadbeef1234567890abcdef";
    } catch (error) {
      console.error('Claim Signature Error:', error);
      throw error;
    }
  }`;

const replaceApi = `  /**
   * Stubs fetching a claim signature for Web3 minting
   */
  async getClaimSignature(amount, walletAddress) {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      // Return a mock signature and ttl info
      return {
        signature: "0xmocksignaturedeadbeef1234567890abcdef",
        amount,
        nonce: Math.floor(Math.random() * 1000000),
        expiresAt: Date.now() + 30000
      };
    } catch (error) {
      console.error('Claim Signature Error:', error);
      throw error;
    }
  }`;

if (apiJs.includes(searchApi)) {
    fs.writeFileSync('src/services/api.js', apiJs.replace(searchApi, replaceApi));
    console.log("Patched api.js!");
} else {
    console.log("Could not find search string in api.js");
}


// Patch ClaimModal.jsx
let claimModalJsx = fs.readFileSync('src/components/ClaimModal.jsx', 'utf8');
const searchClaimState = `  const [signatureLoading, setSignatureLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);`;

const replaceClaimState = `  const [signatureLoading, setSignatureLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [signatureData, setSignatureData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);`;

const searchClaimEffect = `  useEffect(() => {
    if (isConfirmed) {
      setIsMinting(false);
      setTxHash(hash || "0x123abc456def78901234567890abcdef12345678");
    }
  }, [isConfirmed, hash]);`;

const replaceClaimEffect = `  useEffect(() => {
    if (isConfirmed) {
      setIsMinting(false);
      setTxHash(hash || "0x123abc456def78901234567890abcdef12345678");
      setSignatureData(null);
    }
  }, [isConfirmed, hash]);

  useEffect(() => {
    let intervalId;
    if (signatureData && !isConfirmed) {
      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((signatureData.expiresAt - now) / 1000));
        setTimeLeft(remaining);

        if (remaining === 0) {
          // Signature expired!
          setSignatureData(null);
          // Auto-request fresh signature if still minting and not confirmed
          if (isMinting) {
            handleMint();
          }
        }
      };
      updateTimer();
      intervalId = setInterval(updateTimer, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [signatureData, isConfirmed, isMinting]);`;

const searchMintFunc = `  const handleMint = async () => {
    if (!address) {
      addToast('ERROR', 'Wallet not connected', 'error');
      return;
    }

    try {
      setIsMinting(true);
      setSignatureLoading(true);

      // Step 1: Call stubbed api
      const signature = await runnerApi.getClaimSignature(claimable_erc20_allowance, address);
      setSignatureLoading(false);

      // Step 2: Stub Wagmi useWriteContract hook call
      // MOCK ABI for stubbing
      const mockAbi = [
        {
          name: 'claimTokens',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'amount', type: 'uint256' },
            { name: 'signature', type: 'bytes' }
          ],
          outputs: []
        }
      ];

      writeContract({
        address: AXIM_TOKEN_CONTRACT_ADDRESS,
        abi: mockAbi,
        functionName: 'claimTokens',
        args: [claimable_erc20_allowance, signature],
      });

    } catch (error) {
      setSignatureLoading(false);
      setIsMinting(false);
      console.error(error);
      addToast('SIGNATURE ERROR', 'Failed to get claim signature', 'error');
    }
  };`;

const replaceMintFunc = `  const handleMint = async () => {
    if (!address) {
      addToast('ERROR', 'Wallet not connected', 'error');
      return;
    }

    try {
      setIsMinting(true);
      setSignatureLoading(true);

      // Step 1: Call stubbed api
      const response = await runnerApi.getClaimSignature(claimable_erc20_allowance, address);
      setSignatureLoading(false);
      setSignatureData(response);
      setTimeLeft(Math.max(0, Math.ceil((response.expiresAt - Date.now()) / 1000)));

      // Step 2: Stub Wagmi useWriteContract hook call
      // MOCK ABI for stubbing
      const mockAbi = [
        {
          name: 'claimTokens',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'amount', type: 'uint256' },
            { name: 'signature', type: 'bytes' }
          ],
          outputs: []
        }
      ];

      writeContract({
        address: AXIM_TOKEN_CONTRACT_ADDRESS,
        abi: mockAbi,
        functionName: 'claimTokens',
        args: [claimable_erc20_allowance, response.signature],
      });

    } catch (error) {
      setSignatureLoading(false);
      setIsMinting(false);
      setSignatureData(null);
      console.error(error);
      addToast('SIGNATURE ERROR', 'Failed to get claim signature', 'error');
    }
  };`;


const searchBtn = `        {isWrongNetwork ? (
          <button
            onClick={() => switchChain({ chainId: 42161 })}
            className="w-full py-3 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all rounded bg-red-500/20 text-red-500 border border-red-500 hover:bg-red-500 hover:text-black shadow-[0_0_20px_rgba(255,0,0,0.4)]"
          >
             Switch to Arbitrum Network
          </button>
        ) : txHash ? (`;

const replaceBtn = `        {signatureData && !txHash && (
          <div className="mb-4 text-center">
            <span className="text-neon-gold text-xs uppercase tracking-wider">
              Signature Valid: 0:{timeLeft.toString().padStart(2, '0')}s
            </span>
          </div>
        )}

        {isWrongNetwork ? (
          <button
            onClick={() => switchChain({ chainId: 42161 })}
            className="w-full py-3 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all rounded bg-red-500/20 text-red-500 border border-red-500 hover:bg-red-500 hover:text-black shadow-[0_0_20px_rgba(255,0,0,0.4)]"
          >
             Switch to Arbitrum Network
          </button>
        ) : txHash ? (`;

let updatedClaimModal = claimModalJsx;
let claimPatched = true;
if (updatedClaimModal.includes(searchClaimState)) {
    updatedClaimModal = updatedClaimModal.replace(searchClaimState, replaceClaimState);
} else {
    console.log("Could not find state search string in ClaimModal.jsx");
    claimPatched = false;
}

if (updatedClaimModal.includes(searchClaimEffect)) {
    updatedClaimModal = updatedClaimModal.replace(searchClaimEffect, replaceClaimEffect);
} else {
    console.log("Could not find effect search string in ClaimModal.jsx");
    claimPatched = false;
}

if (updatedClaimModal.includes(searchMintFunc)) {
    updatedClaimModal = updatedClaimModal.replace(searchMintFunc, replaceMintFunc);
} else {
    console.log("Could not find mint search string in ClaimModal.jsx");
    claimPatched = false;
}

if (updatedClaimModal.includes(searchBtn)) {
    updatedClaimModal = updatedClaimModal.replace(searchBtn, replaceBtn);
} else {
    console.log("Could not find btn search string in ClaimModal.jsx");
    claimPatched = false;
}

if (claimPatched) {
    fs.writeFileSync('src/components/ClaimModal.jsx', updatedClaimModal);
    console.log("Patched ClaimModal.jsx!");
}
