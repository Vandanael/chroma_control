/**
 * Syringe Renderer - Bio-Digital "Free-Form" Edition
 * Animation "Seringue" : Point lumineux qui voyage en ligne droite
 */

import { COLORS } from '../game/constants';
import { getPlayerColorValue } from '../game/playerColor';

// =============================================================================
// TYPES
// =============================================================================

export interface SyringeAnimation {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  owner: 'player' | 'enemy';
  startTime: number;
  duration: number; // ms
  onComplete: () => void;
}

// =============================================================================
// STATE
// =============================================================================

const activeAnimations: Map<string, SyringeAnimation> = new Map();
let animationCounter = 0;

// =============================================================================
// ANIMATION MANAGEMENT
// =============================================================================

/**
 * Lance une animation "Seringue"
 * @param startX - Position X de départ
 * @param startY - Position Y de départ
 * @param endX - Position X d'arrivée
 * @param endY - Position Y d'arrivée
 * @param owner - Propriétaire (player/enemy)
 * @param onComplete - Callback appelé à l'impact
 */
export function initiateSyringeAnimation(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  owner: 'player' | 'enemy',
  onComplete: () => void
): string {
  const id = `syringe_${animationCounter++}`;
  const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
  const speed = 0.5; // pixels par ms
  const duration = distance / speed; // Durée proportionnelle à la distance

  const animation: SyringeAnimation = {
    id,
    startX,
    startY,
    endX,
    endY,
    owner,
    startTime: performance.now(),
    duration,
    onComplete,
  };

  activeAnimations.set(id, animation);
  console.log(`[SyringeRenderer] Animation ${id} started: ${distance.toFixed(0)}px in ${duration.toFixed(0)}ms`);

  return id;
}

/**
 * Met à jour toutes les animations actives
 */
export function updateSyringeAnimations(): void {
  const now = performance.now();
  const toRemove: string[] = [];

  for (const [id, animation] of activeAnimations) {
    const elapsed = now - animation.startTime;
    
    if (elapsed >= animation.duration) {
      // Animation terminée
      animation.onComplete();
      toRemove.push(id);
    }
  }

  // Nettoyer les animations terminées
  for (const id of toRemove) {
    activeAnimations.delete(id);
  }
}

/**
 * Rend toutes les animations "Seringue" actives
 */
export function renderSyringes(ctx: CanvasRenderingContext2D): void {
  const now = performance.now();

  for (const animation of activeAnimations.values()) {
    renderSyringe(ctx, animation, now);
  }
}

/**
 * Rend une animation "Seringue" individuelle
 */
function renderSyringe(ctx: CanvasRenderingContext2D, animation: SyringeAnimation, now: number): void {
  const elapsed = now - animation.startTime;
  const progress = Math.min(1, elapsed / animation.duration);

  // Position interpolée
  const x = animation.startX + (animation.endX - animation.startX) * progress;
  const y = animation.startY + (animation.endY - animation.startY) * progress;

  const color = animation.owner === 'player' ? getPlayerColorValue() : COLORS.ENEMY;

  // Dessiner le trail (traînée)
  drawTrail(ctx, animation, progress, color);

  // Dessiner le point lumineux principal
  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();

  // Cœur plus lumineux
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Dessine la traînée derrière le point lumineux
 */
function drawTrail(
  ctx: CanvasRenderingContext2D,
  animation: SyringeAnimation,
  progress: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Calculer le nombre de segments pour le trail
  const trailLength = progress * 0.3; // 30% de la distance totale
  const segments = 10;

  for (let i = 0; i < segments; i++) {
    const segmentProgress = progress - (trailLength * i / segments);
    if (segmentProgress < 0) break;

    const segmentX = animation.startX + (animation.endX - animation.startX) * segmentProgress;
    const segmentY = animation.startY + (animation.endY - animation.startY) * segmentProgress;

    // Opacité décroissante
    const alpha = (1 - i / segments) * 0.6;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 4 - i * 0.3;

    // Point sur le trail
    ctx.beginPath();
    ctx.arc(segmentX, segmentY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Nettoie toutes les animations
 */
export function clearAllSyringes(): void {
  activeAnimations.clear();
}
