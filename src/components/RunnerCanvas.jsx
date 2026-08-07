import React, { useEffect, useRef } from 'react';
import { useCyberRunnerStore } from '../store/useCyberRunnerStore';
import { audioEngine } from '../utils/SynthAudioEngine';

const RunnerCanvas = () => {
  const canvasRef = useRef(null);
  const { 
    gameState, hitObstacle, collectNode, updateDistance, isPaused,
    score, multiplier, getSelectedSkin, getSelectedTheme, hasMagnet, crtEnabled, toggleCrt
  } = useCyberRunnerStore();

  useEffect(() => {
    const skin = getSelectedSkin();
    const theme = getSelectedTheme();

    const cachedStyles = {
      themeBackground: theme.backgroundColor,
      themeFloor: theme.floorColor,
      themeGrid: theme.gridColor,
      themeSecondary: theme.secondaryColor,
      themePrimary: theme.primaryColor,
      themeAccent: theme.accentColor,
      skinPrimary: skin.primaryColor,
      skinShadow: skin.shadowColor,
      skinEffect: skin.effect,
      skinGlow: skin.glowIntensity,
      themeId: theme.id
    };

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let lastTime = Date.now();
    
    // Render State
    let renderState = {
        player: {
            x: 50,
            y: 250,
            w: 30,
            h: 50,
            isSliding: false,
            trail: []
        },
        obstacles: [],
        nodes: [],
        speed: 300
    };

    let backgroundLayers = theme.parallaxLayers.map(l => ({ ...l, x: 0 }));
    let distance = 0;
    let currentScore = score;
    let workerBusy = false;
    let accumulatedDt = 0;

    const worker = new Worker(new URL('../workers/physicsWorker.js', import.meta.url), { type: 'module' });
    worker.postMessage({ type: 'INIT' });

    worker.onmessage = (e) => {
        if (e.data.type === 'UPDATE_RESULT') {
            const result = e.data.payload;

            // update render state
            renderState.player = { ...renderState.player, ...result.player };
            renderState.obstacles = result.obstacles;
            renderState.nodes = result.nodes;
            renderState.speed = result.speed;

            if (result.hitObstacle) {
                audioEngine.playCrash();
                hitObstacle();
            }

            for (let t of result.collectedNodes) {
                audioEngine.playCollect();
                collectNode(t);
            }

            distance += (result.speed * result.dt) / 10;
            currentScore += result.dt * 15 * multiplier;

            if (Math.floor(distance) % 5 === 0) {
                updateDistance(Math.floor(distance), Math.floor(currentScore));
            }
            workerBusy = false;
        } else if (e.data.type === 'PLAY_SOUND') {
            if (e.data.payload === 'JUMP') {
                audioEngine.playJump();
            }
        }
    };

    const handleInput = (e) => {
      if (gameState !== 'PLAYING') return;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
          worker.postMessage({ type: 'JUMP' });
      }
      if (e.code === 'ArrowDown') {
          worker.postMessage({ type: 'SLIDE_START' });
      }
    };

    const handleInputUp = (e) => {
      if (e.code === 'ArrowDown') {
          worker.postMessage({ type: 'SLIDE_END' });
      }
    };

    window.addEventListener('keydown', handleInput);
    window.addEventListener('keyup', handleInputUp);

    let startTouchY = null;

    const handleTouchStart = (e) => {
      if (gameState !== 'PLAYING') return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const touchX = touch.clientX - rect.left;

      if (touchX > rect.width / 2) {
          worker.postMessage({ type: 'JUMP' });
      } else {
        startTouchY = touch.clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (gameState !== 'PLAYING') return;
      e.preventDefault();
      if (startTouchY !== null) {
        const currentY = e.touches[0].clientY;
        const diffY = currentY - startTouchY;
        if (diffY > 30) {
          worker.postMessage({ type: 'SLIDE_START' });
          startTouchY = null;
        }
      }
    };

    const handleTouchEnd = (e) => {
      if (gameState !== 'PLAYING') return;
      e.preventDefault();
      startTouchY = null;
      worker.postMessage({ type: 'SLIDE_END' });
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    let fpsFrames = 0;
    let fpsLastTime = performance.now();
    let lowFpsTime = 0;
    let performanceMode = false;

    const render = () => {
      if (gameState !== 'PLAYING') return;
      const now = Date.now();

      fpsFrames++;
      const currentPerfTime = performance.now();
      if (currentPerfTime > fpsLastTime + 1000) {
        const fps = Math.round((fpsFrames * 1000) / (currentPerfTime - fpsLastTime));
        fpsFrames = 0;
        fpsLastTime = currentPerfTime;

        if (fps < 35 && !performanceMode) {
            lowFpsTime += 1000;
            if (lowFpsTime >= 3000) {
                performanceMode = true;
                if (crtEnabled && toggleCrt) toggleCrt();
                console.log("TELEMETRY: Low FPS detected. Enabling performance mode (disabling CRT and heavy shadows).");
            }
        } else if (fps >= 35) {
            lowFpsTime = 0;
        }
      }

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      accumulatedDt += dt;

      if (!workerBusy && accumulatedDt > 0) {
          workerBusy = true;
          worker.postMessage({
              type: 'UPDATE',
              payload: {
                  hasMagnet,
                  dt: accumulatedDt
              }
          });
          accumulatedDt = 0;
      }

      // Background
      ctx.fillStyle = cachedStyles.themeBackground;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Parallax Background Layers
      backgroundLayers.forEach(layer => {
        layer.x -= renderState.speed * layer.speed * dt;
        if (layer.x <= -canvas.width) layer.x = 0;
        ctx.fillStyle = layer.color;
        
        if (cachedStyles.themeId === 'cosmos') {
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.arc(layer.x + 200, 50, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
        
        ctx.fillRect(layer.x, 0, canvas.width, 300);
        ctx.fillRect(layer.x + canvas.width, 0, canvas.width, 300);
      });

      // Grid Floor
      ctx.strokeStyle = cachedStyles.themeFloor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 300);
      ctx.lineTo(canvas.width, 300);
      ctx.stroke();

      for(let i=0; i<15; i++) {
        let xPos = (backgroundLayers[0].x * 2 + (i * 100)) % canvas.width;
        ctx.strokeStyle = cachedStyles.themeGrid;
        ctx.beginPath();
        ctx.moveTo(xPos, 300);
        ctx.lineTo(xPos - 50, 400);
        ctx.stroke();
      }

      const p = renderState.player;

      // Skin Effects
      if (cachedStyles.skinEffect === 'trail') {
        p.trail.push({ x: p.x, y: p.y, h: p.h });
        if (p.trail.length > 12) p.trail.shift();
        p.trail.forEach((pos, idx) => {
          ctx.globalAlpha = idx / 12;
          ctx.fillStyle = cachedStyles.skinPrimary;
          ctx.fillRect(pos.x - (12 - idx) * 3, pos.y, p.w, pos.h);
        });
        ctx.globalAlpha = 1.0;
      }

      if (cachedStyles.skinEffect === 'ghost') {
        ctx.globalAlpha = 0.4 + Math.abs(Math.sin(now / 150)) * 0.3;
      }

      // Render Player
      ctx.shadowBlur = performanceMode ? 0 : (cachedStyles.skinEffect === 'pulse' ? cachedStyles.skinGlow + Math.sin(now / 200) * 12 : cachedStyles.skinGlow);
      ctx.shadowColor = cachedStyles.skinShadow;
      ctx.fillStyle = cachedStyles.skinPrimary;
      
      if (cachedStyles.themeId === 'torrent') {
        ctx.beginPath();
        ctx.ellipse(p.x + 15, p.y + p.h/2, 15, p.h/2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (cachedStyles.themeId === 'cosmos') {
        ctx.fillRect(p.x + 5, p.y, 20, p.h);
        ctx.beginPath();
        ctx.arc(p.x + 15, p.y + 10, 10, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x, p.y, p.w, p.h);
      }
      
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;

      // Obstacles
      for (let i = renderState.obstacles.length - 1; i >= 0; i--) {
        let obs = renderState.obstacles[i];
        
        ctx.shadowColor = cachedStyles.themeSecondary;
        ctx.shadowBlur = performanceMode ? 0 : 10;
        ctx.fillStyle = cachedStyles.themeSecondary;
        
        if (cachedStyles.themeId === 'torrent') {
          ctx.beginPath();
          ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 5);
          ctx.fill();
        } else if (cachedStyles.themeId === 'cosmos') {
          ctx.beginPath();
          ctx.arc(obs.x + obs.w/2, obs.y + obs.h/2, obs.w/2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        }
      }

      // Nodes
      for (let i = renderState.nodes.length - 1; i >= 0; i--) {
        let node = renderState.nodes[i];
        
        let nodeColor = cachedStyles.themePrimary;
        if (node.type === 'gold') nodeColor = cachedStyles.themeAccent;
        if (node.type === 'shield') nodeColor = '#3b82f6';
        if (node.type === 'magnet') nodeColor = '#a855f7';

        ctx.shadowBlur = performanceMode ? 0 : 15;
        ctx.shadowColor = nodeColor;
        ctx.fillStyle = nodeColor;
        
        if (cachedStyles.themeId === 'torrent') {
          ctx.strokeStyle = nodeColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(node.x + node.w / 2, node.y + node.h / 2, node.w / 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 0.3;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        } else {
          ctx.beginPath();
          ctx.arc(node.x + node.w / 2, node.y + node.h / 2, node.w / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    if (gameState === 'PLAYING') {
      audioEngine.startBassline();
      render();
    } else {
      audioEngine.stopBassline();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      worker.terminate();
      window.removeEventListener('keydown', handleInput);
      window.removeEventListener('keyup', handleInputUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
      audioEngine.stopBassline();
    };
  }, [gameState, getSelectedSkin, getSelectedTheme]);

  return (
    <canvas 
      ref={canvasRef} 
      width={800} 
      height={400} 
      className="w-full h-full max-w-4xl max-h-[500px] border-2 border-neon-magenta rounded-lg shadow-[0_0_20px_rgba(255,0,127,0.3)] bg-neon-bg" 
    />
  );
};

export default RunnerCanvas;
