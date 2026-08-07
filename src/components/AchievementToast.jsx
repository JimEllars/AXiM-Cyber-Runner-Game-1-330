import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useCyberRunnerStore } from '../store/useCyberRunnerStore';

const { FiCheckCircle, FiInfo } = FiIcons;

const AchievementToast = () => {
  const { toasts, removeToast } = useCyberRunnerStore();

  return (
    <div className="fixed top-24 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="bg-black/90 border-l-4 border-neon-cyan p-4 shadow-[0_0_20px_rgba(0,240,255,0.2)] min-w-[280px] font-mono"
          >
            <div className="flex items-center gap-3">
              <div className="bg-neon-cyan/20 p-2 rounded">
                <SafeIcon icon={toast.type === 'achievement' ? FiCheckCircle : FiInfo} className="text-neon-cyan text-xl" />
              </div>
              <div>
                <div className="text-[10px] text-neon-cyan font-bold uppercase tracking-widest">
                  {toast.title}
                </div>
                <div className="text-xs text-white mt-0.5">
                  {toast.message}
                </div>
              </div>
            </div>
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3, ease: "linear" }}
              className="absolute bottom-0 left-0 h-0.5 bg-neon-cyan/50"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AchievementToast;