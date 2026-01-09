/**
 * Drop-Pod Wave System - SPRINT 1
 * Onde circulaire qui émane du Drop-Pod toutes les 3 secondes
 */

import { getDropPod } from '../game/nodeManager';
import { calculateSignalRange } from '../game/signalPhysics';
import { getPlayerColorValue } from '../game/playerColor';

// =============================================================================
// TYPES
// =============================================================================

interface Wave {
  startTime: number;
  startRadius: number;
  maxRadius: number;
  duration: number; // en ms
}

// =============================================================================
// STATE
// =============================================================================

const activeWaves: Wave[] = [];
let lastWaveTime = 0;
const WAVE_INTERVAL = 3000; // 3 secondes

// =============================================================================
// WAVE MANAGEMENT
// =============================================================================

/**
 * SPRINT 1 : Met à jour les ondes (crée une nouvelle onde toutes les 3 secondes)
 * @param now - Timestamp actuel
 */
export function updateDropPodWaves(now: number): void {
  const dropPod = getDropPod('player');
  if (!dropPod) return;

  // Vérifier si on doit créer une nouvelle onde
  if (now - lastWaveTime >= WAVE_INTERVAL) {
    const signalRange = calculateSignalRange('player');
    
    activeWaves.push({
      startTime: now,
      startRadius: 0,
      maxRadius: signalRange, // S'étend jusqu'à la limite du signal
      duration: 2000, // 2 secondes pour disparaître
    });
    
    lastWaveTime = now;
  }

  // Supprimer les ondes terminées
  for (let i = activeWaves.length - 1; i >= 0; i--) {
    const wave = activeWaves[i];
    if (now - wave.startTime >= wave.duration) {
      activeWaves.splice(i, 1);
    }
  }
}

/**
 * SPRINT 1 : Rend toutes les ondes actives
 * @param ctx - Contexte de rendu Canvas
 */
export function renderDropPodWaves(ctx: CanvasRenderingContext2D): void {
  const dropPod = getDropPod('player');
  if (!dropPod || activeWaves.length === 0) return;

  const now = performance.now();
  const color = getPlayerColorValue();

  ctx.save();

  for (const wave of activeWaves) {
    const elapsed = now - wave.startTime;
    const progress = elapsed / wave.duration; // 0.0 à 1.0

    if (progress >= 1.0) continue; // Onde terminée (sera supprimée au prochain update)

    // Rayon actuel (s'étend progressivement)
    const currentRadius = wave.maxRadius * progress;

    // Opacité : commence à 0.2, fade-out jusqu'à 0
    const opacity = 0.2 * (1 - progress);

    ctx.globalAlpha = opacity;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([]); // Ligne continue

    // Dessiner le cercle de l'onde
    ctx.beginPath();
    ctx.arc(dropPod.x, dropPod.y, currentRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Nettoie toutes les ondes (pour reset)
 */
export function clearDropPodWaves(): void {
  activeWaves.length = 0;
  lastWaveTime = 0;
}
