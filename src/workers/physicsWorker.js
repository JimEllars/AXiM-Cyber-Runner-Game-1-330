let player = {
  x: 50,
  y: 250,
  vy: 0,
  jumpCount: 0,
  maxJumps: 2,
  isSliding: false,
  w: 30,
  h: 50
};

let obstacles = [];
let nodes = [];
let t = 0; // accumulated time for speed
const canvasWidth = 800;

self.onmessage = function(e) {
  const data = e.data;

  if (data.type === 'INIT') {
      player = {
          x: 50,
          y: 250,
          vy: 0,
          jumpCount: 0,
          maxJumps: 2,
          isSliding: false,
          w: 30,
          h: 50
      };
      obstacles = [];
      nodes = [];
      t = 0;
  }
  else if (data.type === 'JUMP') {
      if (player.jumpCount < player.maxJumps) {
          player.vy = -550; // jumpForce
          player.jumpCount++;
          player.isSliding = false;
          self.postMessage({ type: 'PLAY_SOUND', payload: 'JUMP' });
      }
  }
  else if (data.type === 'SLIDE_START') {
      player.isSliding = true;
      player.h = 25;
      player.y = 275;
  }
  else if (data.type === 'SLIDE_END') {
      player.isSliding = false;
      player.h = 50;
      player.y = 250;
  }
  else if (data.type === 'UPDATE') {
    const { hasMagnet, dt } = data.payload;
    t += dt;

    // Calculate speed based on function provided: v(t) = 300 + 18.5 * t^0.65
    const speed = 300 + 18.5 * Math.pow(t, 0.65);

    // Gravity simulation
    const gravity = 1500;

    player.vy += gravity * dt;
    player.y += player.vy * dt;

    if (player.y >= (player.isSliding ? 275 : 250)) {
        player.y = player.isSliding ? 275 : 250;
        player.vy = 0;
        player.jumpCount = 0;
    }

    const checkCollision = (rect1, rect2) => {
        return (
            rect1.x < rect2.x + rect2.w &&
            rect1.x + rect1.w > rect2.x &&
            rect1.y < rect2.y + rect2.h &&
            rect1.y + rect1.h > rect2.y
        );
    };

    let hitObstacle = false;
    let nextObstacles = [];

    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.x -= speed * dt;

        if (checkCollision(player, obs)) {
            hitObstacle = true;
        }

        if (obs.x + obs.w >= 0) {
            nextObstacles.push(obs);
        }
    }
    obstacles = nextObstacles;

    let collectedNodes = [];
    let nextNodes = [];

    for (let i = 0; i < nodes.length; i++) {
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

        if (checkCollision(player, node)) {
            collectedNodes.push(node.type);
        } else if (node.x + node.w >= 0) {
            nextNodes.push(node);
        }
    }
    nodes = nextNodes;

    // Spawning logic
    if (Math.random() > 0.985) {
        const isHigh = Math.random() > 0.5;
        obstacles.push({
            x: canvasWidth,
            y: isHigh ? 180 : 270,
            w: 25,
            h: 30,
            type: isHigh ? 'high' : 'low'
        });
    }

    if (Math.random() > 0.98) {
        const rand = Math.random();
        let type = 'cyan';
        if (rand > 0.95) type = 'shield';
        else if (rand > 0.90) type = 'magnet';
        else if (rand > 0.75) type = 'gold';

        nodes.push({
            x: canvasWidth,
            y: 120 + Math.random() * 150,
            w: 18,
            h: 18,
            type
        });
    }

    self.postMessage({
        type: 'UPDATE_RESULT',
        payload: {
            player: { ...player },
            obstacles: obstacles.map(o => ({...o})),
            nodes: nodes.map(n => ({...n})),
            hitObstacle,
            collectedNodes,
            speed,
            dt
        }
    });
  }
};
