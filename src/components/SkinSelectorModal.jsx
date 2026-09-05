import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useCyberRunnerStore } from '../store/useCyberRunnerStore';
import { SKINS } from '../data/skins';

const { FiCheck, FiX, FiLayers, FiLock } = FiIcons;

const SkinSelectorModal = ({ isOpen, onClose }) => {
  const { selectedSkinId, setSkin } = useCyberRunnerStore();

  return (
    <div
      className={`fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`bg-neon-bg border-2 border-neon-cyan p-6 max-w-4xl w-full rounded-lg shadow-[0_0_40px_rgba(0,240,255,0.3)] font-mono transform transition-all duration-300 overflow-y-auto max-h-[90vh] ${
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        <div className="flex justify-between items-center mb-8 border-b border-neon-cyan/30 pb-4 sticky top-0 bg-neon-bg z-10">
          <h3 className="text-xl text-neon-cyan font-bold flex items-center gap-2">
            <SafeIcon icon={FiLayers} /> ASSET VAULT
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <SafeIcon icon={FiX} className="text-2xl" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {SKINS.map((skin) => {
            const isSoldOut = skin.max_supply !== Infinity && skin.circulating_supply >= skin.max_supply;
            const remaining = skin.max_supply - skin.circulating_supply;
            const isLowSupply = remaining > 0 && remaining <= (skin.max_supply * 0.15);

            // Mock ownership for demo: default is owned, others are not
            const isOwned = skin.id === 'default';

            return (
              <div
                key={skin.id}
                className={`p-4 border transition-all text-left flex flex-col gap-2 relative overflow-hidden group
                  ${selectedSkinId === skin.id
                    ? 'border-neon-cyan bg-neon-cyan/10 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'border-white/10 bg-white/5'}`}
              >
                {selectedSkinId === skin.id && (
                  <div className="absolute top-2 right-2 text-neon-cyan z-10">
                    <SafeIcon icon={FiCheck} />
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded shadow-lg flex-shrink-0"
                      style={{
                        backgroundColor: skin.primaryColor,
                        boxShadow: `0 0 15px ${skin.primaryColor}`
                      }}
                    />
                    <div>
                      <span className={`font-bold text-lg block ${selectedSkinId === skin.id ? 'text-neon-cyan' : 'text-gray-200'}`}>
                        {skin.name}
                      </span>
                      <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${skin.rarity === 'Legendary' ? 'bg-purple-900/50 text-purple-400 border border-purple-500/50' : skin.rarity === 'Rare' ? 'bg-blue-900/50 text-blue-400 border border-blue-500/50' : 'bg-gray-800 text-gray-400 border border-gray-600'}`}>
                        {skin.rarity}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 uppercase leading-relaxed h-8">
                  {skin.description}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-black/40 p-2 rounded border border-white/5">
                    <div className="text-[8px] text-gray-500 uppercase mb-1">Perk</div>
                    <div className="text-[10px] text-neon-gold">{skin.perk}</div>
                  </div>
                  <div className="bg-black/40 p-2 rounded border border-white/5">
                    <div className="text-[8px] text-gray-500 uppercase mb-1">Supply</div>
                    {skin.max_supply === Infinity ? (
                      <div className="text-[10px] text-gray-300">Unlimited</div>
                    ) : (
                      <div className={`text-[10px] ${isSoldOut ? 'text-red-500' : isLowSupply ? 'text-orange-400' : 'text-gray-300'}`}>
                        {remaining} / {skin.max_supply} Left
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  {isOwned ? (
                    <div className="flex-1 flex items-center justify-between">
                      <div className="text-[9px] text-green-400 border border-green-500/30 bg-green-900/20 px-2 py-1 rounded flex flex-col">
                        <span>OWNED</span>
                        {skin.max_supply !== Infinity && <span className="opacity-70">Edition #42 of {skin.max_supply}</span>}
                      </div>
                      <button
                        onClick={() => setSkin(skin.id)}
                        className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded transition-all ${selectedSkinId === skin.id ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan' : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'}`}
                      >
                        {selectedSkinId === skin.id ? 'Equipped' : 'Equip'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-400 uppercase">Mint Price:</span>
                        <span className="text-neon-cyan font-bold">{skin.price_bits.toLocaleString()} AX-BITS</span>
                      </div>
                      {isSoldOut ? (
                        <a
                          href="https://axim.us.com/marketplace"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 text-[10px] uppercase font-bold tracking-wider rounded transition-all flex items-center justify-center gap-2 bg-blue-900/40 text-blue-400 hover:bg-blue-800/60 border border-blue-500 hover:border-blue-400 shadow-[0_0_10px_rgba(0,100,255,0.2)]"
                        >
                          <SafeIcon icon={FiIcons.FiExternalLink} /> Trade on AXiM Marketplace
                        </a>
                      ) : (
                        <button
                          className="w-full py-2 text-[10px] uppercase font-bold tracking-wider rounded transition-all flex items-center justify-center gap-2 bg-neon-magenta/20 text-neon-magenta hover:bg-neon-magenta/40 border border-neon-magenta"
                        >
                          <SafeIcon icon={FiLock} /> Mint Asset
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
        
        <div className="mt-8 text-center sticky bottom-0 bg-neon-bg py-4 border-t border-neon-cyan/30 z-10">
          <button 
            onClick={onClose}
            className="px-8 py-2 bg-neon-cyan text-black font-bold uppercase text-sm tracking-widest hover:brightness-125 transition-all"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkinSelectorModal;
