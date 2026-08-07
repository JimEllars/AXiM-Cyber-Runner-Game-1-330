import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useCyberRunnerStore } from '../store/useCyberRunnerStore';
import { THEMES } from '../data/themes';

const { FiMonitor, FiX, FiCheck, FiWind, FiGlobe } = FiIcons;

const ThemeSelectorModal = ({ isOpen, onClose }) => {
  const { selectedThemeId, setTheme } = useCyberRunnerStore();

  return (
    <div
      className={`fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`bg-neon-bg border-2 border-neon-cyan p-6 max-w-2xl w-full rounded-lg shadow-[0_0_40px_rgba(0,240,255,0.3)] font-mono transform transition-all duration-300 ${
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        <div className="flex justify-between items-center mb-8 border-b border-neon-cyan/30 pb-4">
          <h3 className="text-xl text-neon-cyan font-bold flex items-center gap-2">
            <SafeIcon icon={FiMonitor} /> OVERLAY ENGINE
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <SafeIcon icon={FiX} className="text-2xl" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className={`p-4 border transition-all text-left flex flex-col gap-3 relative overflow-hidden group h-full ${
                selectedThemeId === theme.id 
                  ? 'border-neon-cyan bg-neon-cyan/10' 
                  : 'border-white/10 bg-white/5 hover:border-white/30'
              }`}
            >
              <div 
                className="w-full h-24 rounded flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: theme.backgroundColor }}
              >
                {/* Theme Preview */}
                <div 
                  className="absolute bottom-2 w-full h-1" 
                  style={{ backgroundColor: theme.floorColor }} 
                />
                <div 
                  className="w-6 h-6 rounded" 
                  style={{ backgroundColor: theme.primaryColor, boxShadow: `0 0 10px ${theme.primaryColor}` }} 
                />
                
                {selectedThemeId === theme.id && (
                  <div className="absolute top-2 right-2 text-neon-cyan">
                    <SafeIcon icon={FiCheck} />
                  </div>
                )}
              </div>

              <div>
                <span className={`font-bold text-sm ${selectedThemeId === theme.id ? 'text-neon-cyan' : 'text-gray-300'}`}>
                  {theme.name}
                </span>
                <p className="text-[9px] text-gray-500 uppercase leading-tight mt-1">
                  {theme.description}
                </p>
              </div>

              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.secondaryColor }} />
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accentColor }} />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">
            Changes apply to environment and special effects only. Mechanics remain identical.
          </p>
          <button 
            onClick={onClose}
            className="px-12 py-2 bg-neon-cyan text-black font-bold uppercase text-sm tracking-widest hover:brightness-125 transition-all"
          >
            Confirm Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelectorModal;
