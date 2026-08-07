import React, { useEffect, useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { supabase } from '../supabase/supabase';

const { FiAward, FiX, FiRefreshCw } = FiIcons;

const LeaderboardModal = ({ isOpen, onClose }) => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cyber_runner_runs')
        .select('*')
        .eq('status', 'completed')
        .order('score', { ascending: false })
        .limit(10);

      if (error) throw error;
      setLeaders(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Mock data if Supabase not connected
      setLeaders([
        { id: 1, player_address: '0x1234...abcd', score: 14850, multiplier_applied: 1.5 },
        { id: 2, player_address: '0x9988...ef01', score: 12400, multiplier_applied: 1.3 },
        { id: 3, player_address: '0x5544...2233', score: 9800, multiplier_applied: 1.1 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchLeaders();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md">
      <div className="bg-neon-bg border-2 border-neon-cyan p-6 max-w-lg w-full rounded-lg shadow-[0_0_40px_rgba(0,240,255,0.3)] font-mono">
        <div className="flex justify-between items-center mb-6 border-b border-neon-cyan/30 pb-4">
          <h3 className="text-xl text-neon-cyan font-bold flex items-center gap-2">
            <SafeIcon icon={FiAward} /> CYBER-LEADERBOARD
          </h3>
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchLeaders} 
              className={`text-gray-400 hover:text-neon-cyan transition-colors ${loading ? 'animate-spin' : ''}`}
            >
              <SafeIcon icon={FiRefreshCw} />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <SafeIcon icon={FiX} className="text-2xl" />
            </button>
          </div>
        </div>
        
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {leaders.length > 0 ? leaders.map((entry, idx) => (
            <div key={entry.id || idx} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10 hover:border-neon-cyan/50 transition-all group">
              <div className="flex items-center gap-4">
                <span className={`font-bold text-lg ${idx === 0 ? 'text-neon-gold' : 'text-gray-500'}`}>
                  {idx + 1}
                </span>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  {entry.player_address}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-neon-cyan font-bold text-lg">
                  {Math.floor(entry.score).toLocaleString()}
                </span>
                <span className="text-[10px] text-neon-magenta uppercase tracking-tighter">
                  {entry.multiplier_applied}x Streak
                </span>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 text-gray-500 italic">No data cycles found...</div>
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">
            Weekly rewards distributed every Sunday 00:00 UTC
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;