import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useCyberRunnerStore } from '../store/useCyberRunnerStore';

const { FiUnlock, FiX } = FiIcons;

const TokenGateModal = ({ isOpen, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [txStatus, setTxStatus] = useState(''); // New state for tx status
  const { addToast } = useCyberRunnerStore();

  const handleBuyTicket = () => {
    setIsProcessing(true);
    setTxStatus('Initiating Transaction...');

    // Simulate transaction delay and timeout check
    let timeElapsed = 0;
    const interval = setInterval(() => {
      timeElapsed += 1;
      if (timeElapsed > 15) {
        setTxStatus('Network Congested - Waiting for block confirmation...');
      }
    }, 1000);

    // Mocking the Wagmi interaction for the demo
    setTimeout(() => {
      clearInterval(interval);
      setIsProcessing(false);
      setTxStatus('');
      // Simulate an error like a MetaMask rejection (4001)
      const isError = Math.random() > 0.5;

      if (isError) {
        // Handle User Rejection (4001)
        addToast('TRANSACTION CANCELLED', 'User rejected the transaction in wallet', 'info');
        onClose(); // Revert to unranked mode gracefully without freezing
      } else {
        onClose();
        alert("Ticket Purchased Successfully!");
      }
    }, Math.random() * 20000 + 1000); // Random duration between 1s and 21s
  };

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
