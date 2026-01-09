/**
 * Visual Effects - Pastel NASA-Punk Aesthetic
 * Paper texture, plotter-style drawing, analog grain
 */

import { COLORS, UnitType } from '../types';

// =============================================================================
// PLOTTER-STYLE DRAWING FUNCTIONS
// =============================================================================

/**
 * Draw a point with plotter animation (Scout indicator)
 * Small dot that appears instantly
 */
export function drawScoutPoint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,  // 0-1
  showLabel: boolean = true
): void {
  const size = 6;
  const alpha = Math.min(1, progress * 2);

  ctx.save();
  ctx.globalAlpha = alpha;

  // Small filled circle
  ctx.fillStyle = COLORS.scout;
  ctx.beginPath();
  ctx.arc(x, y, size * progress, 0, Math.PI * 2);
  ctx.fill();

  // Outer ring
  ctx.strokeStyle = COLORS.scout;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, size + 3, 0, Math.PI * 2 * progress);
  ctx.stroke();

  // Label
  if (showLabel && progress > 0.5) {
    ctx.fillStyle = COLORS.annotation;
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('[SCT]', x + size + 8, y);
  }

  ctx.restore();
}

/**
 * Draw a double-stroke circle with plotter animation (Defender indicator)
 * Circle drawn progressively like a plotter
 */
export function drawDefenderCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,  // 0-1
  showLabel: boolean = true
): void {
  const outerRadius = 18;
  const innerRadius = 12;
  const angleProgress = Math.PI * 2 * progress;

  ctx.save();

  // Outer circle - draws progressively
  ctx.strokeStyle = COLORS.defender;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, outerRadius, -Math.PI / 2, -Math.PI / 2 + angleProgress);
  ctx.stroke();

  // Inner circle - starts at 30% progress
  if (progress > 0.3) {
    const innerProgress = (progress - 0.3) / 0.7;
    ctx.strokeStyle = COLORS.defender;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, innerRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * innerProgress);
    ctx.stroke();
  }

  // Center dot appears at 50%
  if (progress > 0.5) {
    ctx.fillStyle = COLORS.defender;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Label
  if (showLabel && progress > 0.6) {
    ctx.fillStyle = COLORS.annotation;
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('[DEF]', x + outerRadius + 8, y);
  }

  ctx.restore();
}

/**
 * Draw a cross with plotter animation (Attacker indicator)
 * X shape drawn line by line
 */
export function drawAttackerCross(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,  // 0-1
  showLabel: boolean = true
): void {
  const size = 16;

  ctx.save();
  ctx.strokeStyle = COLORS.attacker;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';

  // First diagonal (0-50% progress)
  if (progress > 0) {
    const line1Progress = Math.min(1, progress * 2);
    ctx.beginPath();
    ctx.moveTo(x - size, y - size);
    ctx.lineTo(
      x - size + (size * 2) * line1Progress,
      y - size + (size * 2) * line1Progress
    );
    ctx.stroke();
  }

  // Second diagonal (50-100% progress)
  if (progress > 0.5) {
    const line2Progress = (progress - 0.5) * 2;
    ctx.beginPath();
    ctx.moveTo(x + size, y - size);
    ctx.lineTo(
      x + size - (size * 2) * line2Progress,
      y - size + (size * 2) * line2Progress
    );
    ctx.stroke();
  }

  // Outer ring appears at 70%
  if (progress > 0.7) {
    const ringProgress = (progress - 0.7) / 0.3;
    ctx.strokeStyle = COLORS.attacker;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, size + 6, 0, Math.PI * 2 * ringProgress);
    ctx.stroke();
  }

  // Label
  if (showLabel && progress > 0.8) {
    ctx.fillStyle = COLORS.annotation;
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('[ATK]', x + size + 12, y);
  }

  ctx.restore();
}

/**
 * Draw the appropriate unit indicator based on type
 */
export function drawUnitIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  unitType: UnitType,
  progress: number,
  showLabel: boolean = true
): void {
  switch (unitType) {
    case 'scout':
      drawScoutPoint(ctx, x, y, progress, showLabel);
      break;
    case 'defender':
      drawDefenderCircle(ctx, x, y, progress, showLabel);
      break;
    case 'attacker':
      drawAttackerCross(ctx, x, y, progress, showLabel);
      break;
  }
}

/**
 * Draw a progress arc around a point (shows hold duration)
 */
export function drawProgressArc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,  // 0-1
  radius: number = 30,
  color: string = COLORS.ink
): void {
  ctx.save();

  // Background arc (very faint)
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Progress arc
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw coordinate annotation
 */
export function drawCoordinates(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  gridX: number,
  gridY: number
): void {
  ctx.save();
  ctx.fillStyle = COLORS.annotation;
  ctx.font = '9px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`[X:${String(gridX).padStart(2, '0')} Y:${String(gridY).padStart(2, '0')}]`, x, y + 35);
  ctx.restore();
}

/**
 * Variante des coordonnées avec un label suffixe (ex: "- CAPTURED").
 */
export function drawCoordinatesWithLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  gridX: number,
  gridY: number,
  label: string
): void {
  ctx.save();
  ctx.fillStyle = COLORS.annotation;
  ctx.font = '9px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(
    `[X:${String(gridX).padStart(2, '0')} Y:${String(gridY).padStart(2, '0')} - ${label}]`,
    x,
    y + 35
  );
  ctx.restore();
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Easing function for smooth animations (ease-out cubic)
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Easing function for snappy animations (ease-out expo)
 */
export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Get the color for a unit type
 */
export function getUnitColor(unitType: UnitType): string {
  switch (unitType) {
    case 'scout': return COLORS.scout;
    case 'defender': return COLORS.defender;
    case 'attacker': return COLORS.attacker;
    default: return COLORS.neutral;
  }
}
