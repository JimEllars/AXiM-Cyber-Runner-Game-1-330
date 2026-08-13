import React, { useEffect, useRef } from 'react';
import { useCyberRunnerStore } from '../store/useCyberRunnerStore';
import { audioEngine } from '../utils/SynthAudioEngine';

const RunnerCanvas = () => {

  const canvasRef = useRef(null);
  const [workerError, setWorkerError] = React.useState(null);
  if (workerError) throw workerError;

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
    const offscreenObstacle = document.createElement('canvas');
    offscreenObstacle.width = 65; // w:25 + padding
    offscreenObstacle.height = 70; // h:30 + padding
    const octx = offscreenObstacle.getContext('2d');
    octx.shadowColor = cachedStyles.themeSecondary;
    octx.shadowBlur = 10;
    octx.fillStyle = cachedStyles.themeSecondary;

    if (cachedStyles.themeId === 'torrent') {
        octx.beginPath();
        octx.roundRect(20, 20, 25, 30, 5);
        octx.fill();
    } else if (cachedStyles.themeId === 'cosmos') {
        octx.beginPath();
        octx.arc(32.5, 35, 12.5, 0, Math.PI * 2);
        octx.fill();
    } else {
        octx.fillRect(20, 20, 25, 30);
    }

    const offscreenGrid = document.createElement('canvas');
    offscreenGrid.width = 100;
    offscreenGrid.height = 1000;
    const gctx = offscreenGrid.getContext('2d');
    gctx.strokeStyle = cachedStyles.themeGrid;
    gctx.lineWidth = 2;
    gctx.beginPath();
    gctx.moveTo(50, 0);
    gctx.lineTo(0, 1000); // 50px offset over 1000px height. To perfectly match: 50px offset over 400px height... Actually let's just make it big enough
    gctx.stroke();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let animationFrameId;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (gameState === 'PLAYING') {
          useCyberRunnerStore.getState().setIsPaused(true);
        }
        if (audioEngine.ctx) {
          audioEngine.ctx.suspend();
        }
      } else {
        if (audioEngine.ctx) {
          audioEngine.ctx.resume();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
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
    worker.postMessage({ type: 'INIT', payload: { width: window.innerWidth, height: window.innerHeight } });

    worker.onerror = (errorEvent) => {
      worker.terminate();
      setWorkerError(new Error("Web Worker Exception: " + errorEvent.message));
    };

    worker.onmessageerror = (event) => {
      worker.terminate();
      setWorkerError(new Error("Web Worker Message Error"));
    };


    // Dynamic resizing
    const updateCanvasSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (worker) {
            worker.postMessage({ type: 'RESIZE', payload: { width: canvas.width, height: canvas.height } });
        }
    };

    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();

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
          worker.postMessage({ type: 'SLIDE_START' });
      }
    };

    const handleTouchMove = (e) => {
      if (gameState !== 'PLAYING') return;
      e.preventDefault();
    };

    const handleTouchEnd = (e) => {
      if (gameState !== 'PLAYING') return;
      e.preventDefault();
      // Only fire end if we lifted from the left side, or just always fire it to be safe
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
                console.log(JSON.stringify({ level: "info", type: "cyber_runner_telemetry", data: { message: "Low FPS detected. Enabling performance mode (disabling CRT and heavy shadows)." } }));
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

      // Scale for portrait
      ctx.save();
      let scale = 1;
      let yOffset = 0;
      if (canvas.height > canvas.width) {
          scale = canvas.width / 800; // fit to standard 800 width
          yOffset = (canvas.height / scale - 400) / 2; // Center vertically
          ctx.scale(scale, scale);
      } else {
          scale = Math.max(canvas.width / 800, canvas.height / 400);
          yOffset = (canvas.height / scale - 400) / 2;
          ctx.scale(scale, scale);
      }

      const effectiveWidth = canvas.width / scale;
      const effectiveHeight = canvas.height / scale;

      // Update camera translate for yOffset
      ctx.translate(0, yOffset);

      // Background
      ctx.fillStyle = cachedStyles.themeBackground;
      ctx.fillRect(0, -yOffset, effectiveWidth, effectiveHeight + yOffset * 2);

      // Parallax Background Layers
      backgroundLayers.forEach(layer => {
        layer.x -= renderState.speed * layer.speed * dt;
        if (layer.x <= -effectiveWidth) layer.x = 0;
        ctx.fillStyle = layer.color;
        
        if (cachedStyles.themeId === 'cosmos') {
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.arc(layer.x + 200, 50, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
        
        ctx.fillRect(layer.x, -yOffset, effectiveWidth, 300 + yOffset);
        ctx.fillRect(layer.x + effectiveWidth, -yOffset, effectiveWidth, 300 + yOffset);
      });

      // Grid Floor
      ctx.strokeStyle = cachedStyles.themeFloor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 300);
      ctx.lineTo(effectiveWidth, 300);
      ctx.stroke();

      for(let i=0; i<30; i++) {
        let xPos = (backgroundLayers[0].x * 2 + (i * 100)) % effectiveWidth;
        if (performanceMode) {
          ctx.strokeStyle = cachedStyles.themeGrid;
          ctx.beginPath();
          ctx.moveTo(xPos, 300);
          ctx.lineTo(xPos - 50, effectiveHeight + yOffset);
          ctx.stroke();
        } else {
          // offscreenGrid draws from (50, 0) to (0, 1000).
          // So if we draw it at xPos - 50, y=300, it starts at xPos, 300.
          ctx.drawImage(offscreenGrid, xPos - 50, 300, 100, Math.max(1, effectiveHeight + yOffset - 300));
        }
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
        
        if (performanceMode || obs.w !== 25 || obs.h !== 30) {
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
        } else {
            ctx.drawImage(offscreenObstacle, obs.x - 20, obs.y - 20); // 20px padding for shadow
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

      ctx.restore();
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

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener('keydown', handleInput);
      window.removeEventListener('keyup', handleInputUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('resize', updateCanvasSize);
      audioEngine.stopBassline();
    };
  }, [gameState, getSelectedSkin, getSelectedTheme]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full block bg-neon-bg"
    />
  );
};

export default RunnerCanvas;
