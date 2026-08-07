import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { runnerApi } from '../services/api';
import { SKINS } from '../data/skins';
import { WEEKLY_CHALLENGES } from '../data/challenges';
import { THEMES } from '../data/themes';

export const useCyberRunnerStore = create(
  persist(
    (set, get) => ({
      gameState: 'IDLE',
      score: 0,
      distance: 0,
      isPaused: false,
      powerNodes: 0,
      multiplier: 1.0,
      hasShield: false,
      hasMagnet: false,
      crtEnabled: true,
      selectedSkinId: 'default',
      selectedThemeId: 'cyberpunk',
      playerAddress: '0x' + Math.random().toString(16).slice(2, 10) + '...',
      runHash: null,
      startTime: null,
      ticketStatus: { freeRunAvailable: true },
      toasts: [],
      
      challengeProgress: {
        cumulative_distance: 0,
        cumulative_nodes: 0,
        best_score: 0,
        streak_days: 1,
        last_play_date: null
      },

      addToast: (title, message, type = 'info') => {
        const id = Math.random().toString(36).substring(7);
        set((state) => ({ 
          toasts: [...state.toasts, { id, title, message, type }] 
        }));
        setTimeout(() => get().removeToast(id), 3000);
      },

      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      })),

      setIsPaused: (paused) => set({ isPaused: paused }),

      setSkin: (skinId) => set({ selectedSkinId: skinId }),
      setTheme: (themeId) => {
        set({ selectedThemeId: themeId });
        get().addToast('THEME APPLIED', `Interface shifted to ${themeId.toUpperCase()}`);
      },
      
      getSelectedSkin: () => {
        const { selectedSkinId } = get();
        return SKINS.find(s => s.id === selectedSkinId) || SKINS[0];
      },

      getSelectedTheme: () => {
        const { selectedThemeId } = get();
        return THEMES.find(t => t.id === selectedThemeId) || THEMES[0];
      },

      initializeSession: async () => {
        const { playerAddress } = get();
        const status = await runnerApi.getTicketStatus(playerAddress);
        set({ ticketStatus: status });
      },
      
      startGame: () => {
        set({ 
          gameState: 'PLAYING', 
          score: 0, 
          distance: 0, 
          powerNodes: 0, 
          hasShield: false,
          hasMagnet: false,
          runHash: crypto.randomUUID(),
          startTime: Date.now()
        });
      },
      
      endGame: async () => {
        const { score, distance, powerNodes, multiplier, runHash, startTime, playerAddress, gameState, challengeProgress } = get();
        if (gameState !== 'PLAYING') return;
        
        set({ gameState: 'SUBMITTING' });
        const elapsedTimeSec = (Date.now() - startTime) / 1000;
        const today = new Date().toISOString().split('T')[0];
        const isNewDay = challengeProgress.last_play_date !== today;
        
        const newProgress = {
          ...challengeProgress,
          cumulative_distance: challengeProgress.cumulative_distance + distance,
          cumulative_nodes: challengeProgress.cumulative_nodes + powerNodes,
          best_score: Math.max(challengeProgress.best_score, score),
          last_play_date: today,
          streak_days: isNewDay ? challengeProgress.streak_days + 1 : challengeProgress.streak_days
        };

        WEEKLY_CHALLENGES.forEach(c => {
          const oldVal = get().getProgressValue(c.type, challengeProgress);
          const newVal = get().getProgressValue(c.type, newProgress);
          if (oldVal < c.goal && newVal >= c.goal) {
            get().addToast('CHALLENGE COMPLETE', c.title, 'achievement');
          }
        });

        set({ challengeProgress: newProgress });

        try {
          await runnerApi.submitRun({
            playerAddress,
            score: Math.floor(score),
            distance: Math.floor(distance),
            powerNodes,
            multiplier,
            elapsedTimeSec,
            runHash
          });
          set({ gameState: 'GAMEOVER' });
          get().initializeSession();
        } catch (error) {
          set({ gameState: 'GAMEOVER' });
        }
      },

      getProgressValue: (type, progress) => {
        switch (type) {
          case 'cumulative_distance': return progress.cumulative_distance;
          case 'cumulative_nodes': return progress.cumulative_nodes;
          case 'single_run_score': return progress.best_score;
          case 'streak': return progress.streak_days;
          default: return 0;
        }
      },
      
      collectNode: (type) => set((state) => {
        let pts = 0;
        let newShield = state.hasShield;
        let newMagnet = state.hasMagnet;

        if (type === 'cyan') pts = 50;
        if (type === 'gold') pts = 200;
        if (type === 'shield') {
          newShield = true;
          get().addToast('SYSTEM UPDATE', 'Shield Module Online');
        }
        if (type === 'magnet') {
          newMagnet = true;
          get().addToast('SYSTEM UPDATE', 'Node Magnet Active');
          setTimeout(() => set({ hasMagnet: false }), 8000);
        }

        return {
          score: state.score + (pts * state.multiplier),
          powerNodes: state.powerNodes + 1,
          hasShield: newShield,
          hasMagnet: newMagnet
        };
      }),

      hitObstacle: () => {
        const { hasShield } = get();
        if (hasShield) {
          set({ hasShield: false });
          get().addToast('SYSTEM ALERT', 'Shield Depleted', 'info');
          return;
        }
        get().endGame();
      },

      updateDistance: (dist, currentScore) => set({ 
        distance: dist,
        score: currentScore
      }),

      toggleCrt: () => set((state) => ({ crtEnabled: !state.crtEnabled }))
    }),
    {
      name: 'axim-runner-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ 
        challengeProgress: state.challengeProgress,
        playerAddress: state.playerAddress,
        selectedSkinId: state.selectedSkinId,
        selectedThemeId: state.selectedThemeId,
        crtEnabled: state.crtEnabled,
        score: state.score,
        distance: state.distance,
        gameState: state.gameState,
        powerNodes: state.powerNodes,
        multiplier: state.multiplier,
        hasShield: state.hasShield,
        hasMagnet: state.hasMagnet,
        runHash: state.runHash,
        startTime: state.startTime,
        isPaused: state.isPaused
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.gameState === 'PLAYING' || state.gameState === 'PAUSED') {
            state.gameState = 'PAUSED';
            state.isPaused = true;
          }
        }
      }
    }
  )
);