import { useCyberRunnerStore } from '../store/useCyberRunnerStore';

class SynthAudioEngine {
  constructor() {
    this.ctx = null;
    this.basslineOsc = null;
    this.isPlaying = false;
    this.warmedUp = false;
    this.activeSounds = 0;
  }

  warmUp() {
    if (this.warmedUp) return;
    this.warmedUp = true;
    this.initCtx();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime); // Almost muted
    osc.start();
    osc.stop(this.ctx.currentTime + 0.01);
  }


  initCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  playTone(freq, type = 'square', duration = 0.1, vol = 0.1) {
    const { isMuted } = useCyberRunnerStore.getState();
    if (isMuted) return;
    if (this.activeSounds > 3) return; // Drop sound if too many are playing

    this.initCtx();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Ducking: lower gain based on active sounds
    const duckedVol = vol * (1 - (this.activeSounds * 0.25));

    this.activeSounds++;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(duckedVol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);

    setTimeout(() => {
      this.activeSounds = Math.max(0, this.activeSounds - 1);
    }, duration * 1000);
  }

  playJump() {
    this.playTone(400, 'square', 0.2, 0.1);
    setTimeout(() => this.playTone(600, 'square', 0.2, 0.1), 50);
  }

  playCollect() {
    this.playTone(800, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(1200, 'sine', 0.2, 0.1), 50);
  }

  playCrash() {
    this.playTone(100, 'sawtooth', 0.5, 0.2);
    setTimeout(() => this.playTone(50, 'sawtooth', 0.5, 0.2), 100);
  }

  startBassline() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.initCtx();
    
    // Simple 120BPM pulse simulation
    this.bassInterval = setInterval(() => {
      if (!this.isPlaying) return;
      this.playTone(55, 'sawtooth', 0.2, 0.05); // A1 note
    }, 500); // 120 BPM = 2 beats per second
  }

  stopBassline() {
    this.isPlaying = false;
    if (this.bassInterval) {
      clearInterval(this.bassInterval);
      this.bassInterval = null;
    }
  }
}


export const audioEngine = new SynthAudioEngine();

const unlockAudio = () => {
  audioEngine.warmUp();
  document.removeEventListener('click', unlockAudio);
  document.removeEventListener('keydown', unlockAudio);
  document.removeEventListener('touchstart', unlockAudio);
};

document.addEventListener('click', unlockAudio);
document.addEventListener('keydown', unlockAudio);
document.addEventListener('touchstart', unlockAudio);

// Add suspend/resume methods
SynthAudioEngine.prototype.suspend = function() {
  if (this.ctx && this.ctx.state === 'running') {
    this.ctx.suspend();
  }
};

SynthAudioEngine.prototype.resume = function() {
  if (this.ctx && this.ctx.state === 'suspended') {
    this.ctx.resume();
  }
};
