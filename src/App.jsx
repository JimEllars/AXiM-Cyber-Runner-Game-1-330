import React, { useState, useEffect } from 'react';
import RunnerCanvas from './components/RunnerCanvas';
import RunnerHUD from './components/RunnerHUD';
import TokenGateModal from './components/TokenGateModal';
import LeaderboardModal from './components/LeaderboardModal';
import SkinSelectorModal from './components/SkinSelectorModal';
import ChallengesModal from './components/ChallengesModal';
import ThemeSelectorModal from './components/ThemeSelectorModal';
import AchievementToast from './components/AchievementToast';
import { useCyberRunnerStore } from './store/useCyberRunnerStore';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from './common/SafeIcon';

const { FiCpu, FiZap, FiActivity, FiLayers, FiTarget, FiMonitor } = FiIcons;

function App() {
  const { crtEnabled, initializeSession, ticketStatus } = useCyberRunnerStore();
  const [showGate, setShowGate] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSkins, setShowSkins] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [showThemes, setShowThemes] = useState(false);

  useEffect(() => {
    initializeSession();
  }, []);

  return (
    <div className={`min-h-screen bg-neon-bg text-white flex flex-col relative overflow-hidden select-none ${crtEnabled ? 'crt-scanlines' : ''}`}>
      
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#ff007f_0%,transparent_50%)] translate-y-[-50%]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,#00f0ff_0%,transparent_40%)]" />
      </div>

      <header className="border-b border-neon-magenta/20 bg-black/60 backdrop-blur-md p-4 flex justify-between items-center z-30 font-mono shadow-lg">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-neon-cyan/10 border border-neon-cyan flex items-center justify-center rounded shadow-[0_0_10px_rgba(0,240,255,0.2)]">
              <SafeIcon icon={FiCpu} className="text-neon-cyan text-xl" />
            </div>
            <div>
              <h1 className="text-neon-cyan font-black text-lg tracking-[0.1em] italic">
                AXiM CYBER-RUNNER
              </h1>
              <div className="flex items-center gap-2 text-[9px] text-gray-500 uppercase tracking-widest">
                <SafeIcon icon={FiActivity} className="text-neon-magenta" /> System Status: Optimal
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowThemes(true)}
            className="flex items-center gap-2 text-xs text-gray-300 hover:text-neon-cyan transition-all border border-gray-800 px-3 py-1.5 rounded hover:border-neon-cyan/50"
          >
            <SafeIcon icon={FiMonitor} /> Overlay
          </button>

          <button 
            onClick={() => setShowChallenges(true)}
            className="flex items-center gap-2 text-xs text-gray-300 hover:text-neon-magenta transition-all border border-gray-800 px-3 py-1.5 rounded hover:border-neon-magenta/50"
          >
            <SafeIcon icon={FiTarget} /> Ops
          </button>

          <button 
            onClick={() => setShowSkins(true)}
            className="flex items-center gap-2 text-xs text-gray-300 hover:text-neon-gold transition-all border border-gray-800 px-3 py-1.5 rounded hover:border-neon-gold/50"
          >
            <SafeIcon icon={FiLayers} /> Skins
          </button>

          <button 
            onClick={() => setShowLeaderboard(true)}
            className="flex items-center gap-2 text-xs text-gray-300 hover:text-neon-cyan transition-all border border-gray-800 px-3 py-1.5 rounded hover:border-neon-cyan/50"
          >
            Leaderboard
          </button>
          
          <button 
            onClick={() => setShowGate(true)}
            className="group relative flex items-center gap-2 text-xs border border-neon-magenta text-neon-magenta px-4 py-1.5 rounded overflow-hidden transition-all hover:text-white"
          >
            <div className="absolute inset-0 bg-neon-magenta translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-200" />
            <span className="relative flex items-center gap-2">
              <SafeIcon icon={FiZap} /> {ticketStatus.freeRunAvailable ? 'Free Run' : 'Ticket'}
            </span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="relative w-full max-w-5xl aspect-[2/1] group">
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-neon-cyan z-20" />
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-neon-cyan z-20" />
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-neon-magenta z-20" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-neon-magenta z-20" />
          
          <RunnerCanvas />
          <RunnerHUD />
        </div>
      </main>

      <footer className="p-2 border-t border-white/5 bg-black/40 text-[9px] text-gray-600 font-mono flex justify-between items-center z-30 uppercase tracking-[0.2em]">
        <div>© 2026 AXIM PROTOCOL | ARCADE ENGINE v1.5.0</div>
        <div className="flex gap-4">
          <span>Arbitrum Mainnet</span>
          <span className="text-neon-cyan">Latency: 14ms</span>
        </div>
      </footer>

      <AchievementToast />
      <ThemeSelectorModal isOpen={showThemes} onClose={() => setShowThemes(false)} />
      <TokenGateModal isOpen={showGate} onClose={() => setShowGate(false)} />
      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <SkinSelectorModal isOpen={showSkins} onClose={() => setShowSkins(false)} />
      <ChallengesModal isOpen={showChallenges} onClose={() => setShowChallenges(false)} />
    </div>
  );
}

export default App;