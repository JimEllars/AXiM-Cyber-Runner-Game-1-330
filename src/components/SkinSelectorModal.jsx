import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useCyberRunnerStore } from '../store/useCyberRunnerStore';
import { SKINS } from '../data/skins';

const { FiCheck, FiX, FiLayers } = FiIcons;

const SkinSelectorModal = ({ isOpen, onClose }) => {
  const { selectedSkinId, setSkin } = useCyberRunnerStore();

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
            <SafeIcon icon={FiLayers} /> RUNNER CUSTOMIZATION
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <SafeIcon icon={FiX} className="text-2xl" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SKINS.map((skin) => (
            <button
              key={skin.id}
              onClick={() => setSkin(skin.id)}
              className={`p-4 border transition-all text-left flex flex-col gap-2 relative overflow-hidden group
                ${selectedSkinId === skin.id 
                  ? 'border-neon-cyan bg-neon-cyan/10 shadow-[0_0_15px_rgba(0,240,255,0.2)]' 
                  : 'border-white/10 bg-white/5 hover:border-white/30'}`}
            >
              {selectedSkinId === skin.id && (
                <div className="absolute top-2 right-2 text-neon-cyan">
                  <SafeIcon icon={FiCheck} />
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded shadow-lg" 
                  style={{ 
                    backgroundColor: skin.primaryColor,
                    boxShadow: `0 0 10px ${skin.primaryColor}`
                  }} 
                />
                <span className={`font-bold ${selectedSkinId === skin.id ? 'text-neon-cyan' : 'text-gray-300'}`}>
                  {skin.name}
                </span>
              </div>
              
              <p className="text-[10px] text-gray-500 uppercase leading-tight">
                {skin.description}
              </p>
              
              <div className="mt-2 flex gap-2">
                <span className="text-[9px] px-1.5 py-0.5 bg-black/40 text-gray-400 rounded">
                  EFFECT: {skin.effect.toUpperCase()}
                </span>
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <button 
            onClick={onClose}
            className="px-8 py-2 bg-neon-cyan text-black font-bold uppercase text-sm tracking-widest hover:brightness-125 transition-all"
          >
            Apply Config
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkinSelectorModal;
