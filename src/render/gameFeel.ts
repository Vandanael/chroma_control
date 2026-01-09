/**
 * Game Feel - Effets visuels et sensitifs
 * Pop animation, screen shake, feedbacks élégants
 */

import { triggerScreenShake } from './screenShake';

// =============================================================================
// NODE POP ANIMATION
// =============================================================================

/**
 * Easing function pour animation pop (rebond avec overshoot)
 */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * Easing function pour animation pop plus prononcée
 */
export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

/**
 * SPRINT 1 : Calcule le scale pour l'animation pop enrichie
 * Animation : 0 → 1.3 → 1.0 avec easeOutBack sur 600ms
 * @param creationTime - Timestamp de création
 * @param now - Timestamp actuel
 * @param duration - Durée de l'animation (ms) - SPRINT 1 : 600ms par défaut
 */
export function calculatePopScale(
  creationTime: number,
  now: number,
  duration: number = 600 // SPRINT 1 : 600ms au lieu de 400ms
): number {
  const age = now - creationTime;
  if (age >= duration) {
    return 1.0;
  }

  const progress = age / duration;
  // SPRINT 1 : Overshoot à 1.3 puis retour à 1.0
  const scale = easeOutBack(progress);
  // Appliquer l'overshoot : 0 → 1.3 → 1.0
  if (scale > 1.0) {
    // Phase d'overshoot : on garde le scale tel quel (jusqu'à 1.3)
    return scale * 1.3; // easeOutBack peut aller jusqu'à ~1.1, on multiplie pour atteindre 1.3
  }
  // Phase de retour : interpolation entre 1.3 et 1.0
  const overshootProgress = Math.min(1, age / (duration * 0.3)); // 30% du temps pour l'overshoot
  return 1.3 - (overshootProgress * 0.3); // De 1.3 à 1.0
}

// =============================================================================
// FEEDBACKS
// =============================================================================

/**
 * Déclenche un feedback de destruction de nœud
 */
export function triggerNodeDestructionFeedback(): void {
  // Micro-shake subtil
  triggerScreenShake(2.5);
}

/**
 * Déclenche un feedback de création de nœud
 */
export function triggerNodeCreationFeedback(): void {
  // Pas de shake pour la création (seulement le pop)
}
