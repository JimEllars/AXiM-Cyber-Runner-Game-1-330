export const THEMES = [
  {
    id: 'cyberpunk',
    name: 'NEON PROTOCOL',
    description: 'The original high-contrast digital frontier.',
    primaryColor: '#00f0ff',
    secondaryColor: '#ff007f',
    accentColor: '#ffb700',
    backgroundColor: '#0a0a12',
    floorColor: '#ff007f',
    gridColor: 'rgba(255, 0, 127, 0.2)',
    parallaxLayers: [
      { speed: 0.1, color: '#1a1a2e' },
      { speed: 0.3, color: '#16213e' }
    ],
    assets: {
      player: 'rect',
      obstacleLow: 'glitch',
      obstacleHigh: 'firewall',
      node: 'pulse-orb'
    }
  },
  {
    id: 'cosmos',
    name: 'XENO-FRONTIER',
    description: 'An alien planet with low-gravity aesthetics.',
    primaryColor: '#a855f7',
    secondaryColor: '#ec4899',
    accentColor: '#22d3ee',
    backgroundColor: '#020617',
    floorColor: '#4f46e5',
    gridColor: 'rgba(79, 70, 229, 0.2)',
    parallaxLayers: [
      { speed: 0.05, color: '#0f172a' },
      { speed: 0.15, color: '#1e1b4b' },
      { speed: 0.4, color: '#312e81' }
    ],
    assets: {
      player: 'alien',
      obstacleLow: 'space-junk',
      obstacleHigh: 'asteroid',
      node: 'star-dust'
    }
  },
  {
    id: 'torrent',
    name: 'STREAM-HOPPER',
    description: 'Nature-themed aquatic agility simulation.',
    primaryColor: '#0ea5e9',
    secondaryColor: '#10b981',
    accentColor: '#fbbf24',
    backgroundColor: '#064e3b',
    floorColor: '#0ea5e9',
    gridColor: 'rgba(14, 165, 233, 0.15)',
    parallaxLayers: [
      { speed: 0.1, color: '#065f46' },
      { speed: 0.25, color: '#047857' }
    ],
    assets: {
      player: 'fish',
      obstacleLow: 'river-rock',
      obstacleHigh: 'low-branch',
      node: 'bubble'
    }
  }
];