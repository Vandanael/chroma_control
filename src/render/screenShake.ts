/**
 * Screen Shake - Micro-feedback à la destruction de nœuds
 * Effet de tremblement subtil pour renforcer l'impact
 */

// =============================================================================
// STATE
// =============================================================================

let shakeIntensity = 0;
let shakeDecay = 0.9; // Décroissance rapide
let shakeOffsetX = 0;
let shakeOffsetY = 0;

// =============================================================================
// API
// =============================================================================

/**
 * Déclenche un micro-shake
 * @param intensity - Intensité du shake (1-10, recommandé: 2-4)
 */
export function triggerScreenShake(intensity: number = 3): void {
  shakeIntensity = Math.min(intensity, 10);
}

/**
 * Met à jour le shake (appelé chaque frame)
 * @returns Offset (x, y) à appliquer au contexte Canvas
 */
export function updateScreenShake(): { x: number; y: number } {
  if (shakeIntensity <= 0.1) {
    shakeIntensity = 0;
    shakeOffsetX = 0;
    shakeOffsetY = 0;
    return { x: 0, y: 0 };
  }

  // Générer un offset aléatoire
  shakeOffsetX = (Math.random() - 0.5) * shakeIntensity;
  shakeOffsetY = (Math.random() - 0.5) * shakeIntensity;

  // Décroissance
  shakeIntensity *= shakeDecay;

  return { x: shakeOffsetX, y: shakeOffsetY };
}

/**
 * Obtient l'offset actuel (sans mise à jour)
 */
export function getScreenShakeOffset(): { x: number; y: number } {
  return { x: shakeOffsetX, y: shakeOffsetY };
}
