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
      streakMultiplier: 1.0,
      hasShield: false,
      hasMagnet: false,
      crtEnabled: true,
      isMuted: false,
      selectedSkinId: 'default',
      selectedThemeId: 'cyberpunk',
      playerAddress: '0x' + Math.random().toString(16).slice(2, 10) + '...',
      runHash: null,
      startTime: null,
      newlyUnlockedChallenges: [],
      ticketStatus: { freeRunAvailable: true },
      hasSeenTutorial: false,
      toasts: [],
      
      challengeProgress: {
        cumulative_distance: 0,
        cumulative_nodes: 0,
        best_score: 0,
        streak_days: 1,
        last_play_date: null
      },

      broadcastEvent: (payload) => {
        try {
          if (window.parent && window.parent !== window) {
            const targetOrigin = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '*' : 'https://axim.us.com';
            window.parent.postMessage({ type: 'AXIM_RUNNER_EVENT', payload }, targetOrigin);
          }
        } catch (e) {
          console.error("Broadcast error", e);
        }
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
      syncWalletAddress: (newAddress) => {
        const { playerAddress } = get();
        if (newAddress !== playerAddress) {
          set({
            playerAddress: newAddress,
            challengeProgress: {
              cumulative_distance: 0,
              cumulative_nodes: 0,
              best_score: 0,
              streak_days: 1,
              last_play_date: null
            },
            hasSeenTutorial: false,
            gameState: 'IDLE',
            score: 0,
            distance: 0,
            powerNodes: 0,
            newlyUnlockedChallenges: [],
            isPaused: false,
            runHash: null,
            startTime: null,
            ticketStatus: { freeRunAvailable: true }
          });
        }
      },

      setIsPaused: (paused) => set({ isPaused: paused }),

      setHasSeenTutorial: (val) => set({ hasSeenTutorial: val }),

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
        const [status, streakMult] = await Promise.all([
          runnerApi.getTicketStatus(playerAddress),
          runnerApi.getStreakMultiplier(playerAddress)
        ]);
        set({ ticketStatus: status, streakMultiplier: streakMult });

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
          startTime: Date.now(),
          newlyUnlockedChallenges: []
        });
      },
      
            endGame: async () => {
        const { score, distance, powerNodes, multiplier, runHash, startTime, playerAddress, gameState, challengeProgress, newlyUnlockedChallenges } = get();
        if (gameState !== 'PLAYING') return;
        
        set({ gameState: 'SUBMITTING', score: score * get().streakMultiplier });
        const elapsedTimeSec = (Date.now() - startTime) / 1000;
        const today = new Date().toISOString().split('T')[0];
        const isNewDay = challengeProgress.last_play_date !== today;
        
        const newProgress = {
          ...challengeProgress,
          best_score: Math.max(challengeProgress.best_score, score * get().streakMultiplier),
          last_play_date: today,
          streak_days: isNewDay ? challengeProgress.streak_days + 1 : challengeProgress.streak_days
        };

        get().checkChallengeThresholds(challengeProgress, newProgress);

        set({ challengeProgress: newProgress });

                try {
          if (newlyUnlockedChallenges && newlyUnlockedChallenges.length > 0) {
            runnerApi.syncAchievements({ playerAddress, unlockedIds: newlyUnlockedChallenges }).catch(e => console.error("Sync error", e));
          }
          await runnerApi.submitRun({
            turnstileToken: window.__TURNSTILE_TOKEN__ || '',
            playerAddress,
            score: Math.floor(score * get().streakMultiplier),
            distance: Math.floor(distance),
            powerNodes,
            multiplier,
            elapsedTimeSec,
            runHash
          });
          set({ gameState: 'GAMEOVER' });
          get().broadcastEvent({
            event: 'GAME_OVER',
            score: Math.floor(score * get().streakMultiplier),
            distance: Math.floor(distance),
            powerNodes
          });
          get().initializeSession();
        } catch (error) {
          set({ gameState: 'GAMEOVER' });
        }
      },

            checkChallengeThresholds: (oldProgress, newProgress) => {
        const newlyUnlocked = [];
        WEEKLY_CHALLENGES.forEach(c => {
          const oldVal = get().getProgressValue(c.type, oldProgress);
          const newVal = get().getProgressValue(c.type, newProgress);
          if (oldVal < c.goal && newVal >= c.goal) {
            get().addToast('CHALLENGE COMPLETE', c.title, 'achievement');
            newlyUnlocked.push(c.id);
            get().broadcastEvent({
              event: 'ACHIEVEMENT_UNLOCKED',
              challengeId: c.id,
              title: c.title
            });
          }
        });
        if (newlyUnlocked.length > 0) {
          set(state => ({
            newlyUnlockedChallenges: [...(state.newlyUnlockedChallenges || []), ...newlyUnlocked]
          }));
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

        const newPowerNodes = state.powerNodes + 1;
        const newScore = state.score + (pts * state.multiplier);
        const newProgress = { ...state.challengeProgress, cumulative_nodes: state.challengeProgress.cumulative_nodes + 1 };
        get().checkChallengeThresholds(state.challengeProgress, newProgress);

        return {
          score: newScore,
          powerNodes: newPowerNodes,
          hasShield: newShield,
          hasMagnet: newMagnet,
          challengeProgress: newProgress
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

      updateDistance: (dist, currentScore) => set((state) => {
        const deltaDist = dist - state.distance;
        if (deltaDist <= 0) return { distance: dist, score: currentScore };

        const newProgress = { ...state.challengeProgress, cumulative_distance: state.challengeProgress.cumulative_distance + deltaDist };
        get().checkChallengeThresholds(state.challengeProgress, newProgress);

        return {
          distance: dist,
          score: currentScore,
          challengeProgress: newProgress
        };
      }),

      toggleCrt: () => set((state) => ({ crtEnabled: !state.crtEnabled })),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted }))
    }),
    {
      name: 'axim-runner-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        challengeProgress: state.challengeProgress,
        playerAddress: state.playerAddress,
        selectedSkinId: state.selectedSkinId,
        selectedThemeId: state.selectedThemeId,
        isMuted: state.isMuted,
        crtEnabled: state.crtEnabled,
        score: state.score,
        distance: state.distance,
        gameState: state.gameState,
        powerNodes: state.powerNodes,
        multiplier: state.multiplier,
        streakMultiplier: state.streakMultiplier,
        hasShield: state.hasShield,
        hasMagnet: state.hasMagnet,
        runHash: state.runHash,
        startTime: state.startTime,
        isPaused: state.isPaused,
        hasSeenTutorial: state.hasSeenTutorial
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