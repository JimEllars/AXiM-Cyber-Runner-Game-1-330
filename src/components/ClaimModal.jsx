import React, { useState, useEffect } from 'react';
import { useChainId, useSwitchChain, useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useCyberRunnerStore } from '../store/useCyberRunnerStore';
import { runnerApi } from '../services/api';

const { FiX, FiDatabase, FiCpu, FiExternalLink } = FiIcons;

const ClaimModal = ({ isOpen, onClose }) => {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && typeof onClose === 'function') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const isWrongNetwork = chainId !== 42161;
  const { total_bits_balance, claimable_erc20_allowance, addToast } = useCyberRunnerStore();
  const [isMinting, setIsMinting] = useState(false);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);

  const { address } = useAccount();
  const { writeContract, data: hash, isPending: isWritePending, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isConfirmed) {
      setIsMinting(false);
      setTxHash(hash || "0x123abc456def78901234567890abcdef12345678");
    }
  }, [isConfirmed, hash]);

  useEffect(() => {
    if (writeError || confirmError) {
      setIsMinting(false);
      addToast('MINTING ERROR', 'Transaction failed', 'error');
    }
  }, [writeError, confirmError, addToast]);
  const AXIM_TOKEN_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

  const handleMint = async () => {
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
  };

  const isProcessing = isMinting || isWritePending || isConfirming;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`bg-neon-bg border-2 border-neon-cyan p-6 max-w-md w-full rounded-lg shadow-[0_0_40px_rgba(0,240,255,0.3)] font-mono transform transition-all duration-300 ${
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        <div className="flex justify-between items-center mb-6 border-b border-neon-cyan/30 pb-4">
          <h3 className="text-xl text-neon-cyan font-bold flex items-center gap-2">
            <SafeIcon icon={FiDatabase} /> ASSET CLAIM
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white" disabled={isProcessing}>
            <SafeIcon icon={FiX} className="text-2xl" />
          </button>
        </div>

        <div className="flex flex-col gap-6 mb-6">
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg flex flex-col items-center">
            <span className="text-gray-400 text-xs uppercase mb-1">Total AX-BITS Balance</span>
            <span className="text-2xl text-neon-gold font-bold">{total_bits_balance.toLocaleString()}</span>
          </div>

          <div className="bg-neon-cyan/5 border border-neon-cyan/20 p-4 rounded-lg flex flex-col items-center">
            <span className="text-neon-cyan text-xs uppercase mb-1 flex items-center gap-2">
               <SafeIcon icon={FiCpu} /> Claimable ERC-20 Allowance
            </span>
            <span className="text-3xl text-neon-cyan font-bold drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
              {claimable_erc20_allowance.toLocaleString()}
            </span>
          </div>
        </div>


        {isWrongNetwork ? (
          <button
            onClick={() => switchChain({ chainId: 42161 })}
            className="w-full py-3 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all rounded bg-red-500/20 text-red-500 border border-red-500 hover:bg-red-500 hover:text-black shadow-[0_0_20px_rgba(255,0,0,0.4)]"
          >
             Switch to Arbitrum Network
          </button>
        ) : txHash ? (
          <div className="bg-green-900/40 border border-green-500 p-4 rounded text-center">
            <div className="text-green-400 font-bold mb-2">Claim Successful!</div>
            <a
              href={`https://sepolia.arbiscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-neon-cyan hover:text-white transition-colors underline break-all"
            >
              View on Arbiscan: {txHash}
            </a>
          </div>
        ) : (
          <button
            onClick={handleMint}
            disabled={isProcessing || claimable_erc20_allowance <= 0}
            className={`w-full py-3 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all rounded ${
              isProcessing
                ? 'bg-gray-800 text-gray-500 cursor-wait'
                : claimable_erc20_allowance <= 0
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                : 'bg-neon-cyan text-black hover:brightness-125 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]'
            }`}
          >
            {isProcessing ? (
              <>
                <SafeIcon icon={FiIcons.FiLoader} className="animate-spin" /> {signatureLoading ? 'Awaiting Signature...' : isWritePending ? 'Awaiting Approval...' : 'Confirming on Arbitrum...'}
              </>
            ) : (
              <>
                <SafeIcon icon={FiExternalLink} /> Mint to Arbitrum
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ClaimModal;
