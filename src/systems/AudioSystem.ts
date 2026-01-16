/**
 * AudioSystem.ts - Gestion audio avec Howler.js
 * Pool de sons avec ducking et gestion des volumes
 */

import { Howl, Howler } from 'howler';
import { AUDIO } from '@utils/Constants';

// =============================================================================
// TYPES
// =============================================================================

export type SoundName = 'spray' | 'bomb_impact' | 'bomb_splash' | 'completion' | 'overheat' | 
  'surface_sponge' | 'surface_glass' | 'surface_metal' | 'surface_sand';

export interface SoundConfig {
  src: string | string[];
  volume?: number;
  loop?: boolean;
  pool?: number; // Nombre d'instances en pool
}

// =============================================================================
// AUDIO SYSTEM CLASS
// =============================================================================

export class AudioSystem {
  private sounds: Map<SoundName, Howl> = new Map();
  private soundConfigs: Map<SoundName, SoundConfig> = new Map();
  private masterVolume = AUDIO.MASTER_VOLUME;
  private sfxVolume = AUDIO.SFX_VOLUME;
  private isMuted = false;
  
  // Pool de sons pour éviter les conflits
  private soundPools: Map<SoundName, number[]> = new Map();
  
  constructor() {
    // Initialiser Howler
    Howler.volume(this.masterVolume);
    
    // Configurer les sons (générés procéduralement pour l'instant)
    this.setupSounds();
  }
  
  /**
   * Configure tous les sons
   */
  private setupSounds(): void {
    // Spray : sifflement continu (loop)
    this.registerSound('spray', {
      src: this.generateSpraySound(),
      volume: 0.4,
      loop: true,
      pool: 1 // Un seul spray à la fois
    });
    
    // Bombe : impact + splash
    this.registerSound('bomb_impact', {
      src: this.generateBombImpactSound(),
      volume: 0.6,
      loop: false,
      pool: 3 // Plusieurs impacts possibles
    });
    
    this.registerSound('bomb_splash', {
      src: this.generateBombSplashSound(),
      volume: 0.5,
      loop: false,
      pool: 3
    });
    
    // Complétion zone : "ding"
    this.registerSound('completion', {
      src: this.generateCompletionSound(),
      volume: 0.7,
      loop: false,
      pool: 2
    });
    
    // Surchauffe : alerte
    this.registerSound('overheat', {
      src: this.generateOverheatSound(),
      volume: 0.8,
      loop: false,
      pool: 1
    });
    
    // Sons spécifiques par surface
    this.registerSound('surface_sponge', {
      src: this.generateSpongeSound(),
      volume: 0.3,
      loop: false,
      pool: 2
    });
    
    this.registerSound('surface_glass', {
      src: this.generateGlassSound(),
      volume: 0.4,
      loop: false,
      pool: 2
    });
    
    this.registerSound('surface_metal', {
      src: this.generateMetalSound(),
      volume: 0.5,
      loop: false,
      pool: 2
    });
    
    this.registerSound('surface_sand', {
      src: this.generateSandSound(),
      volume: 0.4,
      loop: false,
      pool: 2
    });
  }
  
  /**
   * Enregistre un son dans le système
   */
  private registerSound(name: SoundName, config: SoundConfig): void {
    this.soundConfigs.set(name, config);
    
    // Créer le Howl
    const howl = new Howl({
      src: config.src,
      volume: (config.volume || 1.0) * this.sfxVolume,
      loop: config.loop || false,
      preload: true
    });
    
    this.sounds.set(name, howl);
    
    // Initialiser le pool (pour usage futur)
    this.soundPools.set(name, []);
  }
  
  /**
   * Joue un son
   */
  play(name: SoundName, volume?: number): number | null {
    if (this.isMuted) return null;
    
    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`[AudioSystem] Sound "${name}" not found`);
      return null;
    }
    
    // Ajuster le volume si spécifié
    if (volume !== undefined) {
      sound.volume(volume * this.sfxVolume);
    }
    
    // Jouer le son
    const id = sound.play();
    
    return id;
  }
  
  /**
   * Arrête un son
   */
  stop(name: SoundName, id?: number): void {
    const sound = this.sounds.get(name);
    if (!sound) return;
    
    if (id !== undefined) {
      sound.stop(id);
    } else {
      sound.stop();
    }
  }
  
  /**
   * Met en pause un son
   */
  pause(name: SoundName, id?: number): void {
    const sound = this.sounds.get(name);
    if (!sound) return;
    
    if (id !== undefined) {
      sound.pause(id);
    } else {
      sound.pause();
    }
  }
  
  /**
   * Reprend un son
   */
  resume(name: SoundName, id?: number): void {
    const sound = this.sounds.get(name);
    if (!sound) return;
    
    if (id !== undefined) {
      sound.play(id);
    } else {
      sound.play();
    }
  }
  
  /**
   * Ducking : réduit le volume des autres sons quand un son prioritaire joue
   */
  duck(prioritySound: SoundName, duckAmount: number = 0.3): void {
    // Réduire le volume de tous les sons sauf le prioritaire
    this.sounds.forEach((sound, name) => {
      if (name !== prioritySound) {
        const currentVolume = sound.volume();
        sound.volume(currentVolume * duckAmount);
      }
    });
  }
  
  /**
   * Restaure le volume après ducking
   */
  unduck(): void {
    this.sounds.forEach((sound, name) => {
      const config = this.soundConfigs.get(name);
      if (config) {
        sound.volume((config.volume || 1.0) * this.sfxVolume);
      }
    });
  }
  
  /**
   * Définit le volume master
   */
  setMasterVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume)) as typeof AUDIO.MASTER_VOLUME;
    this.masterVolume = clampedVolume;
    Howler.volume(this.masterVolume);
  }
  
  /**
   * Définit le volume SFX
   */
  setSfxVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume)) as typeof AUDIO.SFX_VOLUME;
    this.sfxVolume = clampedVolume;
    
    // Mettre à jour tous les sons
    this.sounds.forEach((sound, name) => {
      const config = this.soundConfigs.get(name);
      if (config) {
        sound.volume((config.volume || 1.0) * this.sfxVolume);
      }
    });
  }
  
  /**
   * Mute/unmute
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    Howler.mute(muted);
  }
  
  /**
   * Génère un son de spray (sifflement continu)
   * Utilise Web Audio API pour générer un son procédural
   */
  private generateSpraySound(): string {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const duration = 0.5; // 500ms de son (sera loopé)
      const length = sampleRate * duration;
      const buffer = audioContext.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Générer un bruit blanc filtré (sifflement)
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      
      // Convertir en WAV
      return this.bufferToWav(buffer);
    } catch (e) {
      console.warn('[AudioSystem] Web Audio API not available, using silent sound');
      return 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAA=';
    }
  }
  
  /**
   * Génère un son d'impact de bombe
   */
  private generateBombImpactSound(): string {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const duration = 0.1;
      const length = sampleRate * duration;
      const buffer = audioContext.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Ton grave avec decay
      const frequency = 200;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const decay = Math.exp(-t * 10);
        data[i] = Math.sin(2 * Math.PI * frequency * t) * decay * 0.5;
      }
      
      return this.bufferToWav(buffer);
    } catch (e) {
      return 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAA=';
    }
  }
  
  /**
   * Génère un son de splash de bombe
   */
  private generateBombSplashSound(): string {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const duration = 0.2;
      const length = sampleRate * duration;
      const buffer = audioContext.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Ton moyen avec decay
      const frequency = 400;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const decay = Math.exp(-t * 5);
        data[i] = Math.sin(2 * Math.PI * frequency * t) * decay * 0.4;
      }
      
      return this.bufferToWav(buffer);
    } catch (e) {
      return 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAA=';
    }
  }
  
  /**
   * Génère un son de complétion (ding)
   */
  private generateCompletionSound(): string {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const duration = 0.3;
      const length = sampleRate * duration;
      const buffer = audioContext.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Ton aigu agréable avec decay
      const frequency = 800;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const decay = Math.exp(-t * 3);
        data[i] = Math.sin(2 * Math.PI * frequency * t) * decay * 0.6;
      }
      
      return this.bufferToWav(buffer);
    } catch (e) {
      return 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAA=';
    }
  }
  
  /**
   * Génère un son de surchauffe
   */
  private generateOverheatSound(): string {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const duration = 0.5;
      const length = sampleRate * duration;
      const buffer = audioContext.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Alerte grave
      const frequency = 150;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const decay = Math.exp(-t * 2);
        data[i] = Math.sin(2 * Math.PI * frequency * t) * decay * 0.7;
      }
      
      return this.bufferToWav(buffer);
    } catch (e) {
      return 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAA=';
    }
  }
  
  /**
   * Génère un son pour l'éponge (absorption humide)
   */
  private generateSpongeSound(): string {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const duration = 0.08;
      const length = sampleRate * duration;
      const buffer = audioContext.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Bruit humide et doux (basse fréquence)
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const decay = Math.exp(-t * 15);
        const noise = (Math.random() * 2 - 1) * 0.2;
        const tone = Math.sin(2 * Math.PI * 150 * t) * 0.1;
        data[i] = (noise + tone) * decay;
      }
      
      return this.bufferToWav(buffer);
    } catch (e) {
      return 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAA=';
    }
  }
  
  /**
   * Génère un son pour le verre (glissement aigu)
   */
  private generateGlassSound(): string {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const duration = 0.12;
      const length = sampleRate * duration;
      const buffer = audioContext.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Ton aigu glissant
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const decay = Math.exp(-t * 8);
        const freq = 1500 - t * 500; // Glissement descendant
        data[i] = Math.sin(2 * Math.PI * freq * t) * decay * 0.2;
      }
      
      return this.bufferToWav(buffer);
    } catch (e) {
      return 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAA=';
    }
  }
  
  /**
   * Génère un son pour le métal (résonance)
   */
  private generateMetalSound(): string {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const duration = 0.15;
      const length = sampleRate * duration;
      const buffer = audioContext.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Ton métallique avec harmoniques
      const freq = 600;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const decay = Math.exp(-t * 6);
        const tone1 = Math.sin(2 * Math.PI * freq * t);
        const tone2 = Math.sin(2 * Math.PI * freq * 2 * t) * 0.3;
        const tone3 = Math.sin(2 * Math.PI * freq * 3 * t) * 0.1;
        data[i] = (tone1 + tone2 + tone3) * decay * 0.2;
      }
      
      return this.bufferToWav(buffer);
    } catch (e) {
      return 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAA=';
    }
  }
  
  /**
   * Génère un son pour le sable (frottement granuleux)
   */
  private generateSandSound(): string {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const duration = 0.1;
      const length = sampleRate * duration;
      const buffer = audioContext.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Bruit granuleux (haute fréquence)
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const decay = Math.exp(-t * 12);
        const noise = (Math.random() * 2 - 1) * 0.3;
        data[i] = noise * decay;
      }
      
      return this.bufferToWav(buffer);
    } catch (e) {
      return 'data:audio/wav;base64,UklGRigAAABXQVZFZm14IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAA=';
    }
  }
  
  /**
   * Convertit un AudioBuffer en WAV Data URI
   */
  private bufferToWav(buffer: AudioBuffer): string {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    // Convertir en base64
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return `data:audio/wav;base64,${base64}`;
  }
  
  /**
   * Nettoie les ressources
   */
  destroy(): void {
    this.sounds.forEach(sound => {
      sound.unload();
    });
    this.sounds.clear();
    this.soundConfigs.clear();
    this.soundPools.clear();
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const audioSystem = new AudioSystem();
