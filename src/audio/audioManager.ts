/**
 * Audio Manager - Système sonore minimaliste et discret
 * Utilise Web Audio API pour générer des sons synthétiques
 * Sons procéduraux (pas de fichiers externes) - Licence libre
 */

// =============================================================================
// STATE
// =============================================================================

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambientGain: GainNode | null = null;
let ambientOscillator: OscillatorNode | null = null;
let ambientGainNode: GainNode | null = null;
let isAudioEnabled = true;

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialise le contexte audio (asynchrone, ne bloque pas le rendu)
 */
export async function initAudio(): Promise<void> {
  try {
    // Créer le contexte audio (avec fallback pour anciens navigateurs)
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Créer le gain master (contrôle du volume global)
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.3; // Volume global à 30% (discret)
    masterGain.connect(audioContext.destination);

    // Créer le gain pour l'ambiance
    ambientGain = audioContext.createGain();
    ambientGain.gain.value = 0.1; // Volume ambiance très bas (10%)
    ambientGain.connect(masterGain);

    // Démarrer la nappe ambiante
    startAmbientPad();

    console.log('[AudioManager] Initialized (Web Audio API)');
  } catch (error) {
    console.warn('[AudioManager] Audio initialization failed:', error);
    isAudioEnabled = false;
  }
}

/**
 * Démarrer la nappe sonore ambiante
 */
function startAmbientPad(): void {
  if (!audioContext || !ambientGain) return;

  // Oscillateur basse fréquence pour la nappe
  ambientOscillator = audioContext.createOscillator();
  ambientOscillator.type = 'sine';
  ambientOscillator.frequency.value = 60; // Fréquence très basse (60Hz)

  // Gain pour l'ambiance
  ambientGainNode = audioContext.createGain();
  ambientGainNode.gain.value = 0.05; // Très discret

  // LFO pour légère variation
  const lfo = audioContext.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.1; // Variation très lente (0.1Hz)

  const lfoGain = audioContext.createGain();
  lfoGain.gain.value = 2; // Variation de ±2Hz

  lfo.connect(lfoGain);
  lfoGain.connect(ambientOscillator.frequency);
  ambientOscillator.connect(ambientGainNode);
  ambientGainNode.connect(ambientGain!);

  // Démarrer les oscillateurs
  lfo.start();
  ambientOscillator.start();

  console.log('[AudioManager] Ambient pad started');
}

/**
 * Met à jour l'ambiance selon la saturation
 */
export function updateAmbientSaturation(saturation: number): void {
  if (!ambientGainNode || !ambientOscillator) return;

  // Augmenter légèrement le volume et la fréquence avec la saturation
  const volumeBoost = saturation * 0.1; // Max +10% de volume
  const freqBoost = saturation * 5; // Max +5Hz de fréquence

  ambientGainNode.gain.value = 0.05 + volumeBoost;
  ambientOscillator.frequency.value = 60 + freqBoost;
}

// =============================================================================
// SOUND GENERATION (Synthétique - Minimaliste)
// =============================================================================

/**
 * SPRINT 1 : Génère un son de placement de nœud enrichi (150ms, volume 0.4, harmonique quinte)
 */
function playNodePlacementSound(color: 'CYAN' | 'GREEN' | 'AMBER'): void {
  if (!audioContext || !masterGain || !isAudioEnabled) return;

  // Fréquences selon la couleur
  const frequencies: Record<string, number> = {
    CYAN: 440,   // La (A4) - clair
    GREEN: 392,  // Sol (G4) - moyen
    AMBER: 330,  // Mi (E4) - chaud
  };

  const frequency = frequencies[color] || 440;
  const now = audioContext.currentTime;

  // SPRINT 1 : Son principal (fondamental)
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const envelope = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  // SPRINT 1 : Envelope ADSR enrichie (150ms au lieu de 50ms)
  envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime(0.4, now + 0.02); // Attack plus long
  envelope.gain.exponentialRampToValueAtTime(0.2, now + 0.08); // Decay
  envelope.gain.linearRampToValueAtTime(0.2, now + 0.12); // Sustain
  envelope.gain.linearRampToValueAtTime(0, now + 0.15); // Release

  oscillator.connect(envelope);
  envelope.connect(gainNode);
  gainNode.gain.value = 0.4; // SPRINT 1 : Volume augmenté (0.2 → 0.4)
  gainNode.connect(masterGain);

  oscillator.start(now);
  oscillator.stop(now + 0.15); // SPRINT 1 : Durée augmentée (50ms → 150ms)

  // SPRINT 1 : Harmonique quinte (3/2 de la fréquence fondamentale)
  const harmonicFreq = frequency * 1.5; // Quinte juste
  const harmonicOsc = audioContext.createOscillator();
  const harmonicGain = audioContext.createGain();
  const harmonicEnvelope = audioContext.createGain();

  harmonicOsc.type = 'sine';
  harmonicOsc.frequency.value = harmonicFreq;

  // Envelope similaire mais plus discrète pour l'harmonique
  harmonicEnvelope.gain.setValueAtTime(0, now);
  harmonicEnvelope.gain.linearRampToValueAtTime(0.15, now + 0.02);
  harmonicEnvelope.gain.exponentialRampToValueAtTime(0.08, now + 0.08);
  harmonicEnvelope.gain.linearRampToValueAtTime(0.08, now + 0.12);
  harmonicEnvelope.gain.linearRampToValueAtTime(0, now + 0.15);

  harmonicOsc.connect(harmonicEnvelope);
  harmonicEnvelope.connect(harmonicGain);
  harmonicGain.gain.value = 0.2; // Harmonique plus discrète
  harmonicGain.connect(masterGain);

  harmonicOsc.start(now);
  harmonicOsc.stop(now + 0.15);
}

// Fonction playTooFarSound supprimée (obsolète, remplacée par playTooFarInfoSound)

/**
 * SPRINT 1 : Bip d'information discret (haute fréquence, volume 0.1)
 * Remplace le son d'erreur punitif par un feedback informatif
 */
function playTooFarInfoSound(): void {
  if (!audioContext || !masterGain || !isAudioEnabled) return;

  // Haute fréquence (880Hz = La5) - discret et informatif
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const envelope = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = 880; // Haute fréquence

  // Envelope très courte et discrète
  const now = audioContext.currentTime;
  envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime(0.1, now + 0.005); // Attack très rapide
  envelope.gain.exponentialRampToValueAtTime(0.01, now + 0.03); // Decay rapide
  envelope.gain.linearRampToValueAtTime(0, now + 0.05); // Release

  oscillator.connect(envelope);
  envelope.connect(gainNode);
  gainNode.gain.value = 0.1; // Volume très discret (SPRINT 1)
  gainNode.connect(masterGain);

  oscillator.start(now);
  oscillator.stop(now + 0.05); // Son très court (50ms)
}

/**
 * Génère un son de capture de nœud IA
 */
function playNodeCaptureSound(): void {
  if (!audioContext || !masterGain || !isAudioEnabled) return;

  // Son de capture (arpège ascendant discret)
  const frequencies = [220, 262, 330]; // Do, Mi, Sol
  const now = audioContext.currentTime;

  frequencies.forEach((freq, index) => {
    const oscillator = audioContext!.createOscillator();
    const gainNode = audioContext!.createGain();
    const envelope = audioContext!.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = freq;

    const startTime = now + index * 0.03; // Délai entre chaque note
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08);
    envelope.gain.linearRampToValueAtTime(0, startTime + 0.08);

    oscillator.connect(envelope);
    envelope.connect(gainNode);
    gainNode.gain.value = 0.15;
    gainNode.connect(masterGain!);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.08);
  });
}

// =============================================================================
// BORDER TENSION AUDIO
// =============================================================================

let borderOscillator: OscillatorNode | null = null;
let borderGain: GainNode | null = null;
let borderNoiseBuffer: AudioBuffer | null = null;
let lastNoiseTime = 0;

/**
 * Met à jour l'audio de frontière selon la pression et le rapport de force
 */
export function updateBorderTensionAudio(
  borderLength: number,
  averagePressure: number,
  averageForceRatio: number
): void {
  if (!audioContext || !masterGain || !isAudioEnabled) return;
  
  // Créer le buffer de bruit blanc pour le crépitement
  if (!borderNoiseBuffer && audioContext) {
    const sampleRate = audioContext.sampleRate;
    const duration = 0.1; // 100ms de bruit
    const frameCount = sampleRate * duration;
    borderNoiseBuffer = audioContext.createBuffer(1, frameCount, sampleRate);
    const data = borderNoiseBuffer.getChannelData(0);
    
    for (let i = 0; i < frameCount; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3; // Bruit blanc
    }
  }
  
  // Volume proportionnel à la longueur de frontière active
  const baseVolume = Math.min(0.15, borderLength / 5000); // Max 0.15 à 5000px de frontière
  const pressureVolume = baseVolume * averagePressure;
  
  // Pitch selon le rapport de force
  // Force ratio > 0 = on gagne (pitch descend)
  // Force ratio < 0 = on perd (pitch monte)
  const baseFreq = 200; // 200Hz de base
  const pitchShift = averageForceRatio * 100; // ±100Hz selon le rapport
  const targetFreq = baseFreq - pitchShift; // Inversé : perdre = pitch haut
  
  // Créer ou mettre à jour l'oscillateur de crépitement
  if (!borderOscillator || !borderGain) {
    borderOscillator = audioContext.createOscillator();
    borderOscillator.type = 'square'; // Crépitement
    borderGain = audioContext.createGain();
    borderGain.gain.value = 0;
    borderOscillator.connect(borderGain);
    borderGain.connect(masterGain);
    borderOscillator.start();
  }
  
  // Mettre à jour la fréquence (pitch)
  if (borderOscillator) {
    borderOscillator.frequency.setTargetAtTime(
      targetFreq,
      audioContext.currentTime,
      0.1 // Transition douce
    );
  }
  
  // Mettre à jour le volume selon la pression
  if (borderGain) {
    borderGain.gain.setTargetAtTime(
      pressureVolume,
      audioContext.currentTime,
      0.2 // Transition douce
    );
  }
  
  // Ajouter du bruit blanc pour le crépitement (si frontière active)
  const now = audioContext.currentTime;
  if (averagePressure > 0.3 && borderNoiseBuffer && now - lastNoiseTime > 0.05) {
    lastNoiseTime = now;
    
    // Créer une source de bruit
    const noiseSource = audioContext.createBufferSource();
    const noiseGain = audioContext.createGain();
    
    noiseSource.buffer = borderNoiseBuffer;
    noiseSource.loop = false;
    
    noiseGain.gain.value = pressureVolume * 0.3; // 30% du volume principal
    noiseGain.connect(masterGain);
    
    noiseSource.connect(noiseGain);
    noiseSource.start(now);
    noiseSource.stop(now + 0.05);
  }
}

/**
 * Arrête l'audio de frontière
 */
export function stopBorderTensionAudio(): void {
  if (borderGain && audioContext) {
    borderGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.2);
  }
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Joue le son de placement de nœud
 */
export function playNodePlacement(color: 'CYAN' | 'GREEN' | 'AMBER'): void {
  playNodePlacementSound(color);
}

// Fonction playTooFar supprimée (obsolète, utiliser playTooFarInfo() à la place)

/**
 * SPRINT 1 : Bip d'information discret (remplace l'erreur punitive)
 */
export function playTooFarInfo(): void {
  playTooFarInfoSound();
}

/**
 * Joue le son de capture de nœud IA
 */
export function playNodeCapture(): void {
  playNodeCaptureSound();
}

/**
 * Joue le son du pulse de disruption (BLOC 3.6)
 */
export function playDisruptionPulse(): void {
  if (!audioContext || !masterGain || !isAudioEnabled) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(masterGain);
  
  // Son agressif (onde carrée)
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.3);
  
  // Enveloppe ADSR
  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  gainNode.gain.linearRampToValueAtTime(0, now + 0.35);
  
  oscillator.start(now);
  oscillator.stop(now + 0.35);
}

/**
 * Active/désactive l'audio
 */
export function setAudioEnabled(enabled: boolean): void {
  isAudioEnabled = enabled;
  if (masterGain) {
    masterGain.gain.value = enabled ? 0.3 : 0;
  }
}

/**
 * Obtient l'état de l'audio
 */
export function isAudioActive(): boolean {
  return isAudioEnabled && audioContext !== null;
}

/**
 * Joue le son de transition de phase (BLOC 6.3)
 */
export function playPhaseTransition(phase: 'early' | 'mid' | 'late'): void {
  if (!audioContext || !masterGain || !isAudioEnabled) return;
  
  // Sons différents selon la phase
  const frequencies: Record<string, number> = {
    early: 220,  // La (A3) - clair
    mid: 330,    // Mi (E4) - moyen
    late: 440,   // La (A4) - aigu
  };
  
  const frequency = frequencies[phase] || 330;
  
  // Son dramatique avec enveloppe longue
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const envelope = audioContext.createGain();
  
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  
  // Enveloppe ADSR dramatique
  const now = audioContext.currentTime;
  envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime(0.4, now + 0.1); // Attack
  envelope.gain.exponentialRampToValueAtTime(0.2, now + 0.5); // Decay
  envelope.gain.linearRampToValueAtTime(0.2, now + 1.0); // Sustain
  envelope.gain.linearRampToValueAtTime(0, now + 1.5); // Release
  
  oscillator.connect(envelope);
  envelope.connect(gainNode);
  gainNode.gain.value = 0.4; // Volume plus fort pour transition
  gainNode.connect(masterGain);
  
  oscillator.start(now);
  oscillator.stop(now + 1.5);
}
