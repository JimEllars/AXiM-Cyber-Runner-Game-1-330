class SynthAudioEngine {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.basslineOsc = null;
    this.isPlaying = false;
  }

  playTone(freq, type = 'square', duration = 0.1, vol = 0.1) {
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
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
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    // Simple 120BPM pulse simulation
    this.bassInterval = setInterval(() => {
      if (!this.isPlaying) return;
      this.playTone(55, 'sawtooth', 0.2, 0.05); // A1 note
    }, 500); // 120 BPM = 2 beats per second
  }

  stopBassline() {
    this.isPlaying = false;
    if (this.bassInterval) clearInterval(this.bassInterval);
  }
}

export const audioEngine = new SynthAudioEngine();