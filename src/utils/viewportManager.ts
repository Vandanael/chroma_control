/**
 * Viewport Manager - Gestion du redimensionnement et de l'orientation
 * Sauvegarde l'état lors des changements de taille/orientation
 */

import { getAllNodes } from '../game/nodeManager';

// =============================================================================
// STATE
// =============================================================================

let lastWidth = 0;
let lastHeight = 0;
let isPortrait = false;
let resizeTimeout: number | null = null;

// =============================================================================
// ORIENTATION DETECTION
// =============================================================================

/**
 * Détecte l'orientation actuelle
 */
export function getOrientation(): 'portrait' | 'landscape' {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

/**
 * Vérifie si l'orientation a changé
 */
export function hasOrientationChanged(): boolean {
  const current = getOrientation();
  const changed = current === 'portrait' ? !isPortrait : isPortrait;
  isPortrait = current === 'portrait';
  return changed;
}

// =============================================================================
// RESIZE HANDLING
// =============================================================================

/**
 * Gère le redimensionnement avec debounce et sauvegarde d'état
 */
export function handleResize(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  onResize: (width: number, height: number) => void
): void {
  // Debounce pour éviter trop de recalculs
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }

  resizeTimeout = window.setTimeout(() => {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Vérifier si vraiment changé (éviter recalculs inutiles)
    if (width === lastWidth && height === lastHeight) {
      return;
    }

    lastWidth = width;
    lastHeight = height;

    // Sauvegarder l'état du jeu avant resize
    const nodes = getAllNodes();
    
    console.log(`[ViewportManager] Resize: ${width}x${height} (${getOrientation()})`);
    console.log(`[ViewportManager] Preserving ${nodes.length} nodes`);

    // Mettre à jour le canvas
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Notifier le callback
    onResize(width, height);

    // L'état des nœuds est préservé (pas de reset)
    console.log(`[ViewportManager] Resize complete, nodes preserved`);
  }, 150); // Debounce 150ms
}

/**
 * Initialise le gestionnaire de redimensionnement
 */
export function initViewportManager(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  onResize: (width: number, height: number) => void
): void {
  lastWidth = window.innerWidth;
  lastHeight = window.innerHeight;
  isPortrait = getOrientation() === 'portrait';

  // Resize handler
  window.addEventListener('resize', () => {
    handleResize(canvas, ctx, onResize);
  });

  // Orientation change handler (mobile)
  window.addEventListener('orientationchange', () => {
    // Attendre que l'orientation soit appliquée
    setTimeout(() => {
      handleResize(canvas, ctx, onResize);
    }, 100);
  });

  console.log('[ViewportManager] Initialized');
}
