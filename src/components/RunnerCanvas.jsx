import React, { useEffect, useRef } from 'react';
import { useCyberRunnerStore } from '../store/useCyberRunnerStore';
import { audioEngine } from '../utils/SynthAudioEngine';

const RunnerCanvas = () => {
  const canvasRef = useRef(null);
  const { 
    gameState, hitObstacle, collectNode, updateDistance, isPaused,
    score, multiplier, getSelectedSkin, getSelectedTheme, hasMagnet 
  } = useCyberRunnerStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let startTime = Date.now();
    let lastTime = startTime;
    
    const skin = getSelectedSkin();
    const theme = getSelectedTheme();
    
    let player = {
      x: 50,
      y: 250,
      vy: 0,
      jumpCount: 0,
      maxJumps: 2,
      isSliding: false,
      w: 30,
      h: 50,
      trail: []
    };

    let obstacles = [];
    let nodes = [];
    
    // Initialize theme-specific parallax
    let backgroundLayers = theme.parallaxLayers.map(l => ({ ...l, x: 0 }));
    
    let distance = 0;
    let currentScore = score;
    const gravity = 1400;
    const jumpForce = -550;

    const handleInput = (e) => {
      if (gameState !== 'PLAYING') return;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (player.jumpCount < player.maxJumps) {
          player.vy = jumpForce;
          player.jumpCount++;
          player.isSliding = false;
          audioEngine.playJump();
        }
      }
      if (e.code === 'ArrowDown') {
        player.isSliding = true;
        player.h = 25;
        player.y = 275;
      }
    };

    const handleInputUp = (e) => {
      if (e.code === 'ArrowDown') {
        player.isSliding = false;
        player.h = 50;
        player.y = 250;
      }
    };

    window.addEventListener('keydown', handleInput);
    window.addEventListener('keyup', handleInputUp);

    const spawnObstacle = () => {
      if (Math.random() > 0.985) {
        const isHigh = Math.random() > 0.5;
        obstacles.push({
          x: canvas.width,
          y: isHigh ? 180 : 270,
          w: 25,
          h: 30,
          type: isHigh ? 'high' : 'low'
        });
      }
    };

    const spawnNode = () => {
      if (Math.random() > 0.98) {
        const rand = Math.random();
        let type = 'cyan';
        if (rand > 0.95) type = 'shield';
        else if (rand > 0.90) type = 'magnet';
        else if (rand > 0.75) type = 'gold';

        nodes.push({
          x: canvas.width,
          y: 120 + Math.random() * 150,
          w: 18,
          h: 18,
          type
        });
      }
    };

    const checkCollision = (rect1, rect2) => {
      return (
        rect1.x < rect2.x + rect2.w &&
        rect1.x + rect1.w > rect2.x &&
        rect1.y < rect2.y + rect2.h &&
        rect1.y + rect1.h > rect2.y
      );
    };

    const render = () => {
      if (gameState !== 'PLAYING') return;
      const now = Date.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const t = (now - startTime) / 1000;

      const speed = 350 + 20 * Math.pow(t, 0.6);

      player.vy += gravity * dt;
      player.y += player.vy * dt;

      if (player.y >= (player.isSliding ? 275 : 250)) {
        player.y = player.isSliding ? 275 : 250;
        player.vy = 0;
        player.jumpCount = 0;
      }

      spawnObstacle();
      spawnNode();

      // Background
      ctx.fillStyle = theme.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Parallax Background Layers
      backgroundLayers.forEach(layer => {
        layer.x -= speed * layer.speed * dt;
        if (layer.x <= -canvas.width) layer.x = 0;
        ctx.fillStyle = layer.color;
        
        // Render theme-specific background shapes
        if (theme.id === 'cosmos') {
          // Draw stars/craters
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
      ctx.strokeStyle = theme.floorColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 300);
      ctx.lineTo(canvas.width, 300);
      ctx.stroke();

      // Floor Perspective Grid
      for(let i=0; i<15; i++) {
        let xPos = (backgroundLayers[0].x * 2 + (i * 100)) % canvas.width;
        ctx.strokeStyle = theme.gridColor;
        ctx.beginPath();
        ctx.moveTo(xPos, 300);
        ctx.lineTo(xPos - 50, 400);
        ctx.stroke();
      }

      // Skin Effects
      if (skin.effect === 'trail') {
        player.trail.push({ x: player.x, y: player.y, h: player.h });
        if (player.trail.length > 12) player.trail.shift();
        player.trail.forEach((pos, idx) => {
          ctx.globalAlpha = idx / 12;
          ctx.fillStyle = skin.primaryColor;
          ctx.fillRect(pos.x - (12 - idx) * 3, pos.y, player.w, pos.h);
        });
        ctx.globalAlpha = 1.0;
      }

      if (skin.effect === 'ghost') {
        ctx.globalAlpha = 0.4 + Math.abs(Math.sin(now / 150)) * 0.3;
      }

      // Render Player based on Theme
      ctx.shadowBlur = skin.effect === 'pulse' ? skin.glowIntensity + Math.sin(now / 200) * 12 : skin.glowIntensity;
      ctx.shadowColor = skin.shadowColor;
      ctx.fillStyle = skin.primaryColor;
      
      if (theme.id === 'torrent') {
        // Draw Fish shape
        ctx.beginPath();
        ctx.ellipse(player.x + 15, player.y + player.h/2, 15, player.h/2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (theme.id === 'cosmos') {
        // Draw Alien shape
        ctx.fillRect(player.x + 5, player.y, 20, player.h);
        ctx.beginPath();
        ctx.arc(player.x + 15, player.y + 10, 10, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(player.x, player.y, player.w, player.h);
      }
      
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;

      // Obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= speed * dt;
        
        ctx.shadowColor = theme.secondaryColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = theme.secondaryColor;
        
        if (theme.id === 'torrent') {
          // River Rocks / Logs
          ctx.beginPath();
          ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 5);
          ctx.fill();
        } else if (theme.id === 'cosmos') {
          // Asteroids
          ctx.beginPath();
          ctx.arc(obs.x + obs.w/2, obs.y + obs.h/2, obs.w/2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        }

        if (checkCollision(player, obs)) {
          audioEngine.playCrash();
          hitObstacle();
        }
        if (obs.x + obs.w < 0) obstacles.splice(i, 1);
      }

      // Nodes
      for (let i = nodes.length - 1; i >= 0; i--) {
        let node = nodes[i];
        
        if (hasMagnet) {
          const dx = player.x - node.x;
          const dy = player.y - node.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 200) {
            node.x += (dx / dist) * 400 * dt;
            node.y += (dy / dist) * 400 * dt;
          }
        }

        node.x -= speed * dt;
        
        let nodeColor = theme.primaryColor;
        if (node.type === 'gold') nodeColor = theme.accentColor;
        if (node.type === 'shield') nodeColor = '#3b82f6';
        if (node.type === 'magnet') nodeColor = '#a855f7';

        ctx.shadowBlur = 15;
        ctx.shadowColor = nodeColor;
        ctx.fillStyle = nodeColor;
        
        if (theme.id === 'torrent') {
          // Bubbles
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

        if (checkCollision(player, node)) {
          audioEngine.playCollect();
          collectNode(node.type);
          nodes.splice(i, 1);
        } else if (node.x + node.w < 0) {
          nodes.splice(i, 1);
        }
      }

      distance += (speed * dt) / 10;
      currentScore += dt * 15 * multiplier;

      if (Math.floor(distance) % 5 === 0) {
        updateDistance(Math.floor(distance), Math.floor(currentScore));
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
      window.removeEventListener('keydown', handleInput);
      window.removeEventListener('keyup', handleInputUp);
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