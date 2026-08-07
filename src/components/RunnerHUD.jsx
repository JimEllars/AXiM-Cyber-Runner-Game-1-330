import React from 'react';
import { useCyberRunnerStore } from '../store/useCyberRunnerStore';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { generateShareData, copyToClipboard } from '../utils/shareHelpers';

const { FiShield, FiZap, FiPlay, FiRefreshCw, FiLoader, FiTwitter, FiSend, FiCopy, FiShare2 } = FiIcons;

const RunnerHUD = () => {
  const { 
    gameState, score, distance, multiplier, hasShield, 
    crtEnabled, toggleCrt, startGame, ticketStatus, addToast 
  } = useCyberRunnerStore();

  const handleShare = (platform) => {
    const data = generateShareData(score, distance);
    if (platform === 'copy') {
      copyToClipboard(data.text).then(success => {
        if (success) addToast('INTEL COPIED', 'Score report saved to clipboard', 'info');
      });
    } else {
      window.open(data[platform], '_blank');
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-4 flex flex-col justify-between z-20">
      {/* Top HUD */}
      <div className="flex justify-between items-start font-mono uppercase">
        <div className="flex flex-col gap-2">
          <div className="text-2xl text-glow-cyan text-neon-cyan font-bold tracking-tighter">
            SCORE: {Math.floor(score).toLocaleString()}
          </div>
          <div className="text-xs text-neon-magenta bg-neon-magenta/10 self-start px-2 py-0.5 rounded border border-neon-magenta/20">
            RANGE: {Math.floor(distance)}M
          </div>
        </div>

        <div className="flex gap-4 items-center">
          {hasShield && (
            <div className="flex items-center gap-2 text-blue-400 text-glow-cyan animate-pulse bg-blue-900/20 px-2 py-1 rounded border border-blue-400/30">
              <SafeIcon icon={FiShield} /> SHIELD_ARMED
            </div>
          )}
          <div className="flex items-center gap-2 text-neon-gold border border-neon-gold/50 bg-neon-gold/5 px-3 py-1 rounded shadow-[0_0_10px_rgba(255,183,0,0.2)]">
            <SafeIcon icon={FiZap} /> {multiplier.toFixed(2)}x MULT
          </div>
          <button 
            onClick={toggleCrt} 
            className="pointer-events-auto text-[10px] border border-gray-700 px-2 py-1 rounded hover:bg-gray-800 text-gray-500 transition-colors uppercase tracking-widest"
          >
            FILT: {crtEnabled ? 'CRT' : 'RAW'}
          </button>
        </div>
      </div>

      {/* Center Overlays */}
      <div className="flex-1 flex items-center justify-center pointer-events-auto">
        {gameState === 'IDLE' && (
          <div className="flex flex-col items-center gap-6">
            <button 
              onClick={startGame}
              className="group relative px-10 py-5 bg-neon-bg border-2 border-neon-cyan text-neon-cyan text-2xl font-bold uppercase tracking-[0.3em] hover:bg-neon-cyan hover:text-black transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center gap-3"><SafeIcon icon={FiPlay} /> Start Run</span>
            </button>
            <div className="text-xs text-gray-500 font-mono flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${ticketStatus.freeRunAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              {ticketStatus.freeRunAvailable ? 'DAILY RUN AVAILABLE' : 'TOKEN TICKET REQUIRED'}
            </div>
          </div>
        )}

        {gameState === 'SUBMITTING' && (
          <div className="flex flex-col items-center gap-4 bg-black/60 p-10 rounded-lg border border-neon-cyan/30 backdrop-blur-lg">
            <SafeIcon icon={FiLoader} className="text-4xl text-neon-cyan animate-spin" />
            <div className="text-neon-cyan font-bold tracking-widest animate-pulse">VERIFYING RUN DATA...</div>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="text-center bg-black/95 p-8 rounded-lg border-2 border-neon-magenta backdrop-blur-xl shadow-[0_0_50px_rgba(255,0,127,0.2)] max-w-sm w-full">
            <div className="mb-2 text-neon-magenta text-[10px] tracking-[0.5em] font-bold">CRITICAL ERROR</div>
            <h2 className="text-4xl text-neon-magenta text-glow-magenta mb-6 font-black italic tracking-tighter">TERMINATED</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6 text-left border-y border-white/10 py-4">
              <div>
                <div className="text-[9px] text-gray-500 uppercase">Total Score</div>
                <div className="text-xl text-neon-cyan font-bold">{Math.floor(score).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[9px] text-gray-500 uppercase">Distance</div>
                <div className="text-xl text-white font-bold">{Math.floor(distance)}m</div>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                <div className="h-[1px] flex-1 bg-white/10" />
                <span>Broadcast Results</span>
                <div className="h-[1px] flex-1 bg-white/10" />
              </div>
              <div className="flex justify-center gap-3">
                <button 
                  onClick={() => handleShare('twitter')}
                  className="p-2.5 bg-white/5 border border-white/10 rounded hover:border-neon-cyan hover:text-neon-cyan transition-all group"
                  title="Share on X"
                >
                  <SafeIcon icon={FiTwitter} />
                </button>
                <button 
                  onClick={() => handleShare('telegram')}
                  className="p-2.5 bg-white/5 border border-white/10 rounded hover:border-blue-400 hover:text-blue-400 transition-all"
                  title="Share on Telegram"
                >
                  <SafeIcon icon={FiSend} />
                </button>
                <button 
                  onClick={() => handleShare('copy')}
                  className="p-2.5 bg-white/5 border border-white/10 rounded hover:border-neon-gold hover:text-neon-gold transition-all"
                  title="Copy Report"
                >
                  <SafeIcon icon={FiCopy} />
                </button>
              </div>
            </div>

            <button 
              onClick={startGame}
              className="w-full px-8 py-3 bg-neon-magenta text-white font-bold uppercase text-sm tracking-widest hover:brightness-125 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,0,127,0.4)]"
            >
              <SafeIcon icon={FiRefreshCw} /> Reboot System
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls Help */}
      {gameState === 'PLAYING' && (
        <div className="flex justify-center gap-8 text-[10px] text-gray-500 font-mono tracking-widest bg-black/20 py-2 rounded-full border border-white/5 backdrop-blur-sm">
          <span>[SPACE/UP] JUMP</span>
          <span>[DOWN] SLIDE</span>
          <span>[DOUBLE JUMP] AIR JUMP</span>
        </div>
      )}
    </div>
  );
};

export default RunnerHUD;