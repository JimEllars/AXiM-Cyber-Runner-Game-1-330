import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useCyberRunnerStore } from '../store/useCyberRunnerStore';
import { WEEKLY_CHALLENGES } from '../data/challenges';

const { FiTarget, FiX, FiCheckCircle, FiClock } = FiIcons;

const ChallengesModal = ({ isOpen, onClose }) => {
  const { challengeProgress } = useCyberRunnerStore();

  const getProgress = (challenge) => {
    switch (challenge.type) {
      case 'cumulative_distance': return challengeProgress.cumulative_distance;
      case 'cumulative_nodes': return challengeProgress.cumulative_nodes;
      case 'single_run_score': return challengeProgress.best_score;
      case 'streak': return challengeProgress.streak_days;
      default: return 0;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md">
      <div className="bg-neon-bg border-2 border-neon-magenta p-6 max-w-2xl w-full rounded-lg shadow-[0_0_40px_rgba(255,0,127,0.3)] font-mono">
        <div className="flex justify-between items-center mb-8 border-b border-neon-magenta/30 pb-4">
          <h3 className="text-xl text-neon-magenta font-bold flex items-center gap-2">
            <SafeIcon icon={FiTarget} /> WEEKLY OPERATIONS
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-[10px] text-gray-500 flex items-center gap-1">
              <SafeIcon icon={FiClock} /> RESET IN: 4D 12H
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <SafeIcon icon={FiX} className="text-2xl" />
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {WEEKLY_CHALLENGES.map((challenge) => {
            const current = getProgress(challenge);
            const percent = Math.min(100, (current / challenge.goal) * 100);
            const isComplete = percent >= 100;

            return (
              <div key={challenge.id} className={`p-4 border rounded relative overflow-hidden transition-all ${isComplete ? 'border-neon-cyan bg-neon-cyan/5' : 'border-white/10 bg-white/5'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className={`font-bold ${isComplete ? 'text-neon-cyan' : 'text-white'}`}>
                      {challenge.title}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase leading-tight">
                      {challenge.description}
                    </p>
                  </div>
                  {isComplete ? (
                    <SafeIcon icon={FiCheckCircle} className="text-neon-cyan text-xl animate-pulse" />
                  ) : (
                    <span className="text-[10px] text-neon-gold font-bold">REWARD: {challenge.reward}</span>
                  )}
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-[9px] mb-1 uppercase tracking-widest">
                    <span className="text-gray-500">Progress</span>
                    <span className={isComplete ? 'text-neon-cyan' : 'text-white'}>
                      {Math.floor(current).toLocaleString()} / {challenge.goal.toLocaleString()} {challenge.unit}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${isComplete ? 'bg-neon-cyan' : 'bg-neon-magenta'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 text-center text-[10px] text-gray-600 uppercase tracking-[0.3em]">
          Complete all challenges to unlock the Weekly Apex Badge
        </div>
      </div>
    </div>
  );
};

export default ChallengesModal;