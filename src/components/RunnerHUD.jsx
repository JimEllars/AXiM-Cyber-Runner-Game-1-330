import React from 'react';
import { useCyberRunnerStore } from '../store/useCyberRunnerStore';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { generateShareData, copyToClipboard, nativeShare } from '../utils/shareHelpers';
import { requestFullscreen } from '../utils/fullscreen';

const { FiShield, FiZap, FiPlay, FiRefreshCw, FiLoader, FiTwitter, FiSend, FiCopy, FiShare2, FiVolume2, FiVolumeX } = FiIcons;

const RunnerHUD = () => {
  const { 
    gameState, score, distance, multiplier, streakMultiplier, challengeProgress, hasShield,
    crtEnabled, toggleCrt, isMuted, toggleMute, startGame, startPracticeMode, ticketStatus, addToast,
    hasSeenTutorial, setHasSeenTutorial, isPracticeMode
  } = useCyberRunnerStore();

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
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-4 flex flex-col justify-between z-20">
            {isPracticeMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-50 animate-pulse opacity-70 mt-[env(safe-area-inset-top)]">
          <div className="bg-neon-magenta/20 border border-neon-magenta text-neon-magenta px-4 py-1 rounded text-xs font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(255,0,127,0.3)] backdrop-blur-sm">
            PRACTICE MODE - UNRANKED
          </div>
        </div>
      )}
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
              onClick={() => { requestFullscreen(); if (gameState === 'IDLE' && !ticketStatus.freeRunAvailable) { window.dispatchEvent(new Event('OPEN_TOKEN_GATE')); } else { isPracticeMode ? startPracticeMode() : startGame(); } }}
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