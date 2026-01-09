/**
 * Low Power Feedback (Bloc 4.4)
 * Affiche un message [LOW POWER] clignotant quand l'énergie est insuffisante
 */

import { COLORS } from '../types';

// =============================================================================
// STATE
// =============================================================================

interface LowPowerState {
  active: boolean;
  startTime: number;
  message: string;
}

const lowPowerState: LowPowerState = {
  active: false,
  startTime: 0,
  message: '[LOW POWER]',
};

const FEEDBACK_DURATION_MS = 2000; // 2 secondes

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Déclenche le feedback LOW POWER
 */
export function showLowPowerFeedback(): void {
  lowPowerState.active = true;
  lowPowerState.startTime = performance.now();
}

/**
 * Rend le feedback LOW POWER si actif
 */
export function renderLowPowerFeedback(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  if (!lowPowerState.active) return;

  const elapsed = performance.now() - lowPowerState.startTime;

  // Désactiver après la durée
  if (elapsed > FEEDBACK_DURATION_MS) {
    lowPowerState.active = false;
    return;
  }

  // Effet de clignotement (4 Hz)
  const blinkPhase = Math.sin(elapsed * 0.008) * 0.5 + 0.5; // 0-1

  if (blinkPhase < 0.5) return; // Visible seulement la moitié du temps

  // Position au centre de l'écran
  const x = width / 2;
  const y = height / 2 - 50;

  ctx.save();

  // Ombre pour visibilité
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 10;

  // Texte principal
  ctx.fillStyle = COLORS.enemy; // Rouge/Terre cuite
  ctx.font = 'bold 24px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(lowPowerState.message, x, y);

  // Sous-texte
  ctx.font = '14px "IBM Plex Mono", monospace';
  ctx.fillStyle = COLORS.annotation;
  ctx.shadowBlur = 5;
  ctx.fillText('Not enough energy', x, y + 30);

  ctx.restore();
}
