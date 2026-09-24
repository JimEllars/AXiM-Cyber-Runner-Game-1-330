import React, { useState } from 'react';
import { useCyberRunnerStore } from '../store/useCyberRunnerStore';
import { audioEngine } from '../utils/SynthAudioEngine';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { generateShareData, copyToClipboard, nativeShare } from '../utils/shareHelpers';
import { requestFullscreen, exitFullscreen } from '../utils/fullscreen';
import ClaimModal from './ClaimModal';
import { FiActivity } from 'react-icons/fi';

const { FiShield, FiZap, FiPlay, FiRefreshCw, FiLoader, FiTwitter, FiSend, FiCopy, FiShare2, FiVolume2, FiVolumeX, FiDatabase, FiX } = FiIcons;

const RunnerHUD = () => {
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [showTelemetry, setShowTelemetry] = useState(false);
  const [telemetryStats, setTelemetryStats] = useState({ fps: 60, latency: 0, workerStatus: 'ACTIVE' });

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '`' || e.key === '~') {
        setShowTelemetry(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    let frameCount = 0;
    let lastTime = performance.now();
    let animId;

    const updateStats = () => {
       frameCount++;
       const now = performance.now();
       if (now - lastTime >= 1000) {
           const fps = Math.round((frameCount * 1000) / (now - lastTime));
           frameCount = 0;
           lastTime = now;
           setTelemetryStats(prev => ({
               ...prev,
               fps,
               workerStatus: window.__AXIM_WORKER_STATUS || 'ACTIVE'
           }));

           if (showTelemetry && navigator.onLine) {
               const pingStart = Date.now();
               fetch('/api/health').then(() => {
                   setTelemetryStats(prev => ({ ...prev, latency: Date.now() - pingStart }));
               }).catch(() => {});
           }
       }
       animId = requestAnimationFrame(updateStats);
    };
    animId = requestAnimationFrame(updateStats);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animId);
    };
  }, [showTelemetry]);
  const { 
    gameState, score, distance, multiplier, streakMultiplier, challengeProgress, hasShield,
    crtEnabled, toggleCrt, isMuted, toggleMute, startGame, startPracticeMode, ticketStatus, addToast,
    hasSeenTutorial, setHasSeenTutorial, isPracticeMode, playerAddress, session_bits, purchasePowerUp, total_bits_balance
  } = useCyberRunnerStore();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);

  React.useEffect(() => {
    const updateQueueCount = () => {
      const queue = JSON.parse(localStorage.getItem('axim_offline_queue') || '[]');
      setOfflineQueueCount(queue.length);
    };
    updateQueueCount();
    window.addEventListener('storage', updateQueueCount);
    const interval = setInterval(updateQueueCount, 2000);
    return () => {
      window.removeEventListener('storage', updateQueueCount);
      clearInterval(interval);
    };
  }, []);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  React.useEffect(() => {
    let timeout;
    if (gameState === 'PLAYING' && !hasSeenTutorial) {
      timeout = setTimeout(() => {
        setHasSeenTutorial(true);
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [gameState, hasSeenTutorial, setHasSeenTutorial]);

  const handleShare = async (platform) => {
    const data = generateShareData(score, challengeProgress.streak_days);
    if (platform === 'native') {
      const success = await nativeShare(data);
      if (success) {
        addToast('BROADCAST SUCCESS', 'Run data shared', 'info');
      }
    } else if (platform === 'copy') {
      const success = await copyToClipboard(data.text);
      if (success) {
        addToast('INTEL COPIED', 'Score report saved to clipboard', 'info');
      }
    } else {
      window.open(data[platform], '_blank');
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-4 safe-top safe-bottom safe-left safe-right flex flex-col justify-between z-20">
            {isPracticeMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-50 animate-pulse opacity-70 mt-[env(safe-area-inset-top)]">
          <div className="bg-neon-magenta/20 border border-neon-magenta text-neon-magenta px-4 py-1 rounded text-xs font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(255,0,127,0.3)] backdrop-blur-sm">
            PRACTICE MODE - UNRANKED
          </div>
        </div>
      )}

      {/* Global Exit Navigation & Telemetry Indicator */}
      <div className="absolute top-4 right-4 z-[100] mt-[env(safe-area-inset-top)] mr-[env(safe-area-inset-right)] flex items-center gap-4">
          <div className="group relative pointer-events-auto">
            <div
              className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'}`}
              title={isOnline ? "Telemetry: Edge Connected" : `Offline (${offlineQueueCount} Queued)`}
              aria-label="Edge Telemetry Status"
              role="status"
            />
            {/* Tooltip */}
            <div className="absolute right-0 mt-2 whitespace-nowrap bg-black/80 text-white text-[10px] font-mono px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 pointer-events-none">
              {isOnline ? "Edge Connected" : `Offline (${offlineQueueCount} Queued)`}
            </div>
            {/* Badge for queued runs when offline */}
            {!isOnline && offlineQueueCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full animate-bounce">
                {offlineQueueCount}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              exitFullscreen();
              window.location.href = 'https://axim.us.com/games';
            }}
            className="pointer-events-auto p-2 rounded-full bg-black/60 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-black hover:shadow-[0_0_15px_rgba(255,0,0,0.5)] transition-all focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
            title="Exit to AXiM Hub"
            aria-label="Exit to AXiM Hub"
          >
            <SafeIcon icon={FiX} size={20} />
          </button>
      </div>

      {/* Top HUD */}

      <div className="flex justify-between items-start font-mono uppercase">
        <div className="flex flex-col gap-2">
          <a
            href="https://axim.us.com/games"
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto block mb-2 pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)]"
          >
            <img
              src="https://wp.axim.us.com/wp-content/uploads/2026/08/AXiM-Development-1200x628-layout1284-infrastructure-axim-axim-axim-1l7q5v7.webp"
              alt="AXiM Logo"
              className="max-w-[120px] hover:opacity-80 transition-opacity"
              decoding="async"
            />
          </a>
          <div className="text-2xl text-glow-cyan text-neon-cyan font-bold tracking-tighter">
            SCORE: {Math.floor(score).toLocaleString()}
          </div>
          {streakMultiplier > 1 && (
            <div className="text-xl text-neon-gold font-black italic animate-pulse shadow-[0_0_10px_rgba(255,183,0,0.5)] bg-black/50 px-2 py-1 rounded border border-neon-gold/50">
              🔥 {streakMultiplier}x STREAK
            </div>
          )}
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
            onClick={() => setIsClaimModalOpen(true)}
            title="Asset Claim" aria-label="Asset Claim" role="button" className="pointer-events-auto flex items-center justify-center p-2 rounded-full border border-gray-700 bg-black/40 hover:bg-gray-800 text-neon-cyan transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          >
            <SafeIcon icon={FiDatabase} size={16} />
          </button>
          <button
            onClick={toggleMute}

            title={isMuted ? 'Unmute Audio' : 'Mute Audio'} aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'} role="button" className="pointer-events-auto flex items-center justify-center p-2 rounded-full border border-gray-700 bg-black/40 hover:bg-gray-800 text-gray-400 hover:text-neon-cyan transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          >
            <SafeIcon icon={isMuted ? FiVolumeX : FiVolume2} size={16} />
          </button>
          <button 
            onClick={toggleCrt} 
            className="pointer-events-auto text-[10px] border border-gray-700 px-2 py-1 rounded hover:bg-gray-800 text-gray-500 transition-colors uppercase tracking-widest focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
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
              onClick={() => { audioEngine.resumeAudioContext(); requestFullscreen(); if (gameState === 'IDLE' && !ticketStatus.freeRunAvailable) { window.dispatchEvent(new Event('OPEN_TOKEN_GATE')); } else { isPracticeMode ? startPracticeMode() : startGame(); } }}
              className="group relative px-10 py-5 bg-neon-bg border-2 border-neon-cyan text-neon-cyan text-2xl font-bold uppercase tracking-[0.3em] hover:bg-neon-cyan hover:text-black transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] overflow-hidden focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
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
            
            <div className="grid grid-cols-2 gap-4 mb-4 text-left border-y border-white/10 py-4">
              <div>
                <div className="text-[9px] text-gray-500 uppercase">Total Score</div>
                <div className="text-xl text-neon-cyan font-bold">{Math.floor(score).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[9px] text-gray-500 uppercase">Distance</div>
                <div className="text-xl text-white font-bold">{Math.floor(distance)}m</div>
              </div>
            </div>

            {/* SSO / Guest Banner */}
            {isPracticeMode && session_bits > 0 && (
              <div className="mb-4 bg-blue-900/40 border border-blue-500/50 p-4 rounded-lg text-left shadow-[0_0_15px_rgba(0,100,255,0.3)] transform transition-transform hover:scale-105">
                <div className="text-neon-cyan text-sm font-black mb-1 uppercase tracking-widest animate-pulse">Guest Mode Detected</div>
                <p className="text-gray-200 text-xs leading-snug mb-3">
                  You earned <span className="text-neon-gold font-bold">{session_bits} AX-BITS</span>! Connect AXiM Passport to save your balance and unlock limited skins.
                </p>
                <a
                  href={`https://passport.axim.us.com/login?redirect=${encodeURIComponent(window.location.href)}`}
                  className="inline-block w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-black text-center text-xs uppercase font-bold tracking-[0.2em] rounded-sm transition-all shadow-[0_0_10px_rgba(0,240,255,0.5)] border border-neon-cyan/50"
                >
                  Connect Passport
                </a>
              </div>
            )}

            <div className="mb-6">
              <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                <div className="h-[1px] flex-1 bg-white/10" />
                <span>Broadcast Results</span>
                <div className="h-[1px] flex-1 bg-white/10" />
              </div>
              <div className="flex justify-center gap-3">
                <button 
                  onClick={() => handleShare('twitter')}
                  className="p-2.5 bg-white/5 border border-white/10 rounded hover:border-neon-cyan hover:text-neon-cyan transition-all group focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                  title="Share on X" aria-label="Share on X" role="button"
                >
                  <SafeIcon icon={FiTwitter} />
                </button>
                <button 
                  onClick={() => handleShare('telegram')}
                  className="p-2.5 bg-white/5 border border-white/10 rounded hover:border-blue-400 hover:text-blue-400 transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                  title="Share on Telegram" aria-label="Share on Telegram" role="button"
                >
                  <SafeIcon icon={FiSend} />
                </button>
                <button 
                  onClick={() => handleShare('copy')}
                  className="p-2.5 bg-white/5 border border-white/10 rounded hover:border-neon-gold hover:text-neon-gold transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                  title="Copy Report" aria-label="Copy Report" role="button"
                >
                  <SafeIcon icon={FiCopy} />
                </button>
                <button
                  onClick={() => handleShare('native')}
                  className="p-2.5 bg-white/5 border border-white/10 rounded hover:border-green-400 hover:text-green-400 transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                  title="Share Score" aria-label="Share Score" role="button"
                >
                  <SafeIcon icon={FiShare2} />
                </button>
              </div>
            </div>

            <button 
              onClick={() => { requestFullscreen(); if (gameState === 'IDLE' && !ticketStatus.freeRunAvailable) { window.dispatchEvent(new Event('OPEN_TOKEN_GATE')); } else { isPracticeMode ? startPracticeMode() : startGame(); } }}
              className="w-full px-8 py-3 bg-neon-magenta text-white font-bold uppercase text-sm tracking-widest hover:brightness-125 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,0,127,0.4)] focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            >
              <SafeIcon icon={FiRefreshCw} /> Reboot System
            </button>
          </div>
        )}
      </div>


      {/* Telemetry Diagnostics Panel */}
      <div
        onClick={() => setShowTelemetry(!showTelemetry)}
        className={`absolute bottom-4 right-4 z-50 transition-all duration-300 font-mono text-[10px] uppercase cursor-pointer ${showTelemetry ? 'opacity-100' : 'opacity-30 hover:opacity-100'} bg-black/60 border ${showTelemetry ? 'border-neon-cyan' : 'border-white/20'} rounded p-2 backdrop-blur-sm`}
      >
         <div className="flex items-center gap-2 mb-1">
             <SafeIcon icon={FiActivity} className="text-neon-cyan" />
             <span className="text-neon-cyan font-bold tracking-widest">SYS.DIAG</span>
         </div>
         {showTelemetry && (
             <div className="flex flex-col gap-1 text-gray-300 mt-2">
                 <div className="flex justify-between gap-4">
                     <span>FPS:</span>
                     <span className={telemetryStats.fps < 30 ? 'text-red-500' : 'text-green-400'}>{telemetryStats.fps}</span>
                 </div>
                 <div className="flex justify-between gap-4">
                     <span>NET:</span>
                     <span className={navigator.onLine ? 'text-green-400' : 'text-red-500'}>{navigator.onLine ? 'ONLINE' : 'CACHED'}</span>
                 </div>
                 <div className="flex justify-between gap-4">
                     <span>EDGE PING:</span>
                     <span className={telemetryStats.latency > 150 ? 'text-yellow-500' : 'text-green-400'}>{telemetryStats.latency}ms</span>
                 </div>
                 <div className="flex justify-between gap-4">
                     <span>WORKER:</span>
                     <span className={telemetryStats.workerStatus === 'ACTIVE' ? 'text-green-400' : 'text-red-500'}>{telemetryStats.workerStatus}</span>
                 </div>
             </div>
         )}
      </div>

      {/* Power-Up HUD */}
      {gameState === 'PLAYING' && (
        <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col gap-4 pointer-events-auto z-[100]">
          <button
            onClick={() => purchasePowerUp('shield', 50)}
            disabled={total_bits_balance < 50 || hasShield}
            className={`p-3 rounded-full border-2 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
              hasShield ? 'bg-blue-500 border-blue-400 text-white animate-pulse shadow-[0_0_20px_rgba(0,100,255,0.8)]' : total_bits_balance >= 50 && !hasShield
                ? 'bg-blue-900/60 border-blue-400 text-blue-400 hover:bg-blue-500 hover:text-black hover:shadow-[0_0_20px_rgba(0,100,255,0.8)]'
                : 'bg-gray-900/60 border-gray-600 text-gray-500 cursor-not-allowed'
            }`}
            title="Deploy Shield (50 Bits)"
            aria-label="Deploy Shield"
          >
            <SafeIcon icon={FiShield} size={24} />
            <div className="text-[10px] font-bold mt-1 tracking-tighter">50 BITS</div>
          </button>

          <button
            onClick={() => purchasePowerUp('multiplier', 100)}
            disabled={total_bits_balance < 100}
            className={`p-3 rounded-full border-2 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
              multiplier > 1 ? 'bg-neon-gold border-neon-gold text-black animate-pulse shadow-[0_0_20px_rgba(255,183,0,0.8)]' : total_bits_balance >= 100
                ? 'bg-neon-gold/20 border-neon-gold text-neon-gold hover:bg-neon-gold hover:text-black hover:shadow-[0_0_20px_rgba(255,183,0,0.8)]'
                : 'bg-gray-900/60 border-gray-600 text-gray-500 cursor-not-allowed'
            }`}
            title="2x Multiplier (100 Bits)"
            aria-label="2x Multiplier"
          >
            <SafeIcon icon={FiZap} size={24} />
            <div className="text-[10px] font-bold mt-1 tracking-tighter">100 BITS</div>
          </button>
        </div>
      )}

      {/* Bottom Controls Help */}
      {/* Tutorial Overlay */}
      {gameState === 'PLAYING' && !hasSeenTutorial && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-between px-10">
          <div className="bg-black/60 border border-neon-cyan/50 backdrop-blur-sm p-4 rounded-lg flex flex-col items-center gap-2 animate-pulse shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            <span className="text-neon-cyan font-bold uppercase tracking-widest text-sm text-center">Tap & Hold<br/>to Slide</span>
            <div className="animate-bounce mt-2 text-neon-cyan">
              <SafeIcon icon={FiIcons.FiArrowDown} className="text-3xl" />
            </div>
          </div>
          <div className="bg-black/60 border border-neon-magenta/50 backdrop-blur-sm p-4 rounded-lg flex flex-col items-center gap-2 animate-pulse shadow-[0_0_15px_rgba(255,0,127,0.3)]">
            <span className="text-neon-magenta font-bold uppercase tracking-widest text-sm text-center">Tap to Jump<br/>Double Tap</span>
            <div className="animate-bounce mt-2 text-neon-magenta">
              <SafeIcon icon={FiIcons.FiArrowUp} className="text-3xl" />
            </div>
          </div>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <div className="hidden sm:flex justify-center gap-8 text-[10px] text-gray-500 font-mono tracking-widest bg-black/20 py-2 rounded-full border border-white/5 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
          <span>[SPACE/UP] JUMP</span>
          <span>[DOWN] SLIDE</span>
          <span>[DOUBLE JUMP] AIR JUMP</span>
        </div>
      )}
      <ClaimModal isOpen={isClaimModalOpen} onClose={() => setIsClaimModalOpen(false)} />
    </div>
  );
};

export default RunnerHUD;