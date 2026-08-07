import React, { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useCyberRunnerStore } from '../store/useCyberRunnerStore';

const { FiUnlock, FiX } = FiIcons;

const AXIM_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'; // Replace with actual
const ABI = [
  {
    name: 'payFee',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: []
  }
];

const TokenGateModal = ({ isOpen, onClose }) => {
  const { addToast } = useCyberRunnerStore();
  const [txStatus, setTxStatus] = useState('');

  const { data: hash, error: writeError, writeContract, isPending: isWritePending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isWritePending) {
      setTxStatus('Awaiting Wallet Approval...');
    } else if (isConfirming) {
      setTxStatus('Confirming on Arbitrum...');
    } else if (isConfirmed) {
      setTxStatus('Run Unlocked!');
      addToast('TICKET PURCHASED', 'Your premium run is ready.', 'success');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setTxStatus('');
    }
  }, [isWritePending, isConfirming, isConfirmed, onClose, addToast]);

  useEffect(() => {
    if (writeError) {
      console.error(writeError);
      addToast('TRANSACTION CANCELLED', 'User rejected or error occurred', 'error');
      setTxStatus('');
      onClose();
    }
    if (confirmError) {
      console.error(confirmError);
      addToast('TRANSACTION FAILED', 'Failed to confirm on Arbitrum', 'error');
      setTxStatus('');
      onClose();
    }
  }, [writeError, confirmError, addToast, onClose]);

  const handleBuyTicket = () => {
    try {
      writeContract({
        address: AXIM_CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'payFee',
        value: parseEther('5'),
      });
    } catch (e) {
      console.error(e);
      addToast('ERROR', 'Failed to initiate transaction', 'error');
    }
  };

  const isProcessing = isWritePending || isConfirming || isConfirmed;

  return (
    <div
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`bg-neon-bg border-2 border-neon-magenta p-6 max-w-md w-full rounded-lg shadow-[0_0_30px_rgba(255,0,127,0.4)] font-mono transform transition-all duration-300 ${
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl text-neon-magenta font-bold">DAILY RUN EXHAUSTED</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white" disabled={isProcessing}>
            <SafeIcon icon={FiX} className="text-2xl" />
          </button>
        </div>
        
        <p className="text-gray-300 mb-6 text-sm leading-relaxed">
          You have consumed your free daily run. Insert 5 AXiM tokens to unlock a premium tournament run and submit to the global leaderboard.
        </p>

        <div className="flex flex-col gap-4">
          <button 
            onClick={handleBuyTicket}
            disabled={isProcessing}
            className="w-full py-3 bg-neon-magenta/20 border border-neon-magenta text-neon-magenta hover:bg-neon-magenta hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? txStatus || 'Processing TX...' : <><SafeIcon icon={FiUnlock} /> Pay 5.00 AXiM</>}
          </button>
          
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="w-full py-3 border border-gray-600 text-gray-400 hover:bg-gray-800 transition-all text-sm disabled:opacity-50"
          >
            Play Practice Mode (Unranked)
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenGateModal;
