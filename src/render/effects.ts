/**
 * Visual Effects - Pastel NASA-Punk Aesthetic
 * Paper texture, plotter-style drawing, analog grain
 * Bloc 6.1 : Enhanced analog grain with line vibrations
 */

import { COLORS, UnitType } from '../types';

// =============================================================================
// ENHANCED ANALOG GRAIN (Bloc 6.1)
// =============================================================================

/**
 * Applique un effet de grain analogique amélioré
 * - Bruit subtil
 * - Vibrations sur lignes (simule imperfection mécanique)
 * - Opacité variable sur bords
 */
export function applyEnhancedGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number = 0.04
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Ajouter du bruit aléatoire
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * intensity * 255;
    data[i] += noise;     // R
    data[i + 1] += noise; // G
    data[i + 2] += noise; // B
    // Alpha reste inchangé
  }

  // Vignette subtile (opacité variable sur bords)
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let y = 0; y < height; y += 2) { // Échantillonnage réduit pour perf
    for (let x = 0; x < width; x += 2) {
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const vignette = 1 - (dist / maxDist) * 0.15; // 15% max d'assombrissement

      const index = (y * width + x) * 4;
      data[index] *= vignette;     // R
      data[index + 1] *= vignette; // G
      data[index + 2] *= vignette; // B
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Simule des vibrations sur une ligne (effet mécanique)
 * Retourne un décalage aléatoire de 1-2px
 */
export function getLineVibration(): number {
  return (Math.random() - 0.5) * 1.5; // ±0.75px
}

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

// =============================================================================
// VORONOI CELLS - ORGANIC SYSTEM (Bloc 1.1)
// =============================================================================

/**
 * Draw a Voronoi cell with plotter-style animation
 * @param ctx - Canvas context
 * @param polygon - Array of points forming the cell boundary
 * @param progress - Animation progress (0-1)
 * @param color - Stroke color
 * @param fillColor - Optional fill color (for signal strength gradient)
 */
export function drawVoronoiCell(
  ctx: CanvasRenderingContext2D,
  polygon: { x: number; y: number }[],
  progress: number,
  color: string = COLORS.ink,
  fillColor?: string
): void {
  if (polygon.length < 3) return;

  ctx.save();

  // Fill with signal strength gradient (if provided)
  if (fillColor && progress > 0.3) {
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(polygon[0].x, polygon[0].y);
    for (let i = 1; i < polygon.length; i++) {
      ctx.lineTo(polygon[i].x, polygon[i].y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Draw cell border with plotter animation
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Calculate total perimeter
  let totalLength = 0;
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }

  const targetLength = totalLength * progress;
  let drawnLength = 0;

  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);

  for (let i = 0; i < polygon.length && drawnLength < targetLength; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);

    if (drawnLength + segmentLength <= targetLength) {
      // Draw full segment
      ctx.lineTo(p2.x, p2.y);
      drawnLength += segmentLength;
    } else {
      // Draw partial segment
      const remaining = targetLength - drawnLength;
      const t = remaining / segmentLength;
      ctx.lineTo(p1.x + dx * t, p1.y + dy * t);
      drawnLength = targetLength;
    }
  }

  ctx.stroke();
  ctx.restore();
}

/**
 * Create radial gradient for signal strength visualization
 * @param ctx - Canvas context
 * @param center - Cell center point
 * @param radius - Approximate cell radius
 * @param owner - Cell owner
 * @param strength - Signal strength (0-100)
 * @returns CanvasGradient
 */
export function createSignalGradient(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  owner: 'player' | 'enemy',
  strength: number
): CanvasGradient {
  const gradient = ctx.createRadialGradient(
    center.x, center.y, 0,
    center.x, center.y, radius
  );

  const baseColor = owner === 'player' ? COLORS.player : COLORS.enemy;
  const alpha = (strength / 100) * 0.3; // Max 30% opacity

  gradient.addColorStop(0, baseColor.replace(')', `, ${alpha})`).replace('rgb', 'rgba'));
  gradient.addColorStop(1, baseColor.replace(')', ', 0)').replace('rgb', 'rgba'));

  return gradient;
}

/**
 * Draw technical hatching for reinforced cells (Deep Click)
 * @param ctx - Canvas context
 * @param polygon - Cell polygon
 * @param owner - Cell owner (determines hatch angle)
 * @param progress - Animation progress (0-1)
 */
export function drawCellReinforcement(
  ctx: CanvasRenderingContext2D,
  polygon: { x: number; y: number }[],
  owner: 'player' | 'enemy',
  progress: number
): void {
  if (polygon.length < 3) return;

  ctx.save();

  // Clip to cell polygon
  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i].x, polygon[i].y);
  }
  ctx.closePath();
  ctx.clip();

  // Hatch angle: 45° for player, -45° for enemy
  const angle = owner === 'player' ? Math.PI / 4 : -Math.PI / 4;
  const spacing = 6; // 6px spacing as per PRD

  // Bounding box
  const xs = polygon.map(p => p.x);
  const ys = polygon.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const width = maxX - minX;
  const height = maxY - minY;
  const diagonal = Math.sqrt(width * width + height * height);

  // Draw hatching
  ctx.strokeStyle = owner === 'player' ? COLORS.player : COLORS.enemy;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6 * progress;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const totalLines = Math.ceil(diagonal / spacing);
  const linesToDraw = Math.floor(totalLines * progress);

  for (let i = 0; i < linesToDraw; i++) {
    const offset = i * spacing - diagonal / 2;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const startX = centerX + offset * cos - diagonal * sin;
    const startY = centerY + offset * sin + diagonal * cos;
    const endX = centerX + offset * cos + diagonal * sin;
    const endY = centerY + offset * sin - diagonal * cos;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  ctx.restore();
}

// =============================================================================
// TRIANGLES - HACHURES (Sprint 5)
// =============================================================================

/**
 * Dessine des hachures diagonales dans un triangle.
 * @param ctx - Contexte canvas
 * @param x1, y1, x2, y2, x3, y3 - Coordonnées des 3 sommets du triangle
 * @param owner - Propriétaire (player = 45°, enemy = -45°)
 * @param progress - Progression de l’animation 0-1 (hachures qui apparaissent progressivement)
 * @param spacing - Espacement entre les lignes de hachures (px)
 */
export function drawTriangleHatching(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  owner: 'player' | 'enemy',
  progress: number,
  spacing: number = 8
): void {
  ctx.save();

  // Clip au triangle
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.clip();

  // Angle des hachures : 45° pour joueur, -45° pour ennemi
  const angle = owner === 'player' ? Math.PI / 4 : -Math.PI / 4;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Bounding box du triangle
  const minX = Math.min(x1, x2, x3);
  const maxX = Math.max(x1, x2, x3);
  const minY = Math.min(y1, y2, y3);
  const maxY = Math.max(y1, y2, y3);

  const width = maxX - minX;
  const height = maxY - minY;
  const diagonal = Math.sqrt(width * width + height * height);

  // Couleur des hachures selon le propriétaire
  ctx.strokeStyle = owner === 'player' ? COLORS.player : COLORS.enemy;
  ctx.lineWidth = 1.5;

  // Nombre de lignes de hachures à dessiner
  const totalLines = Math.ceil(diagonal / spacing);
  const linesToDraw = Math.floor(totalLines * progress);

  // Dessiner les hachures progressivement
  for (let i = 0; i < linesToDraw; i++) {
    const offset = i * spacing - diagonal / 2;

    // Point de départ et d'arrivée de la ligne de hachure
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const startX = centerX + offset * cos - diagonal * sin;
    const startY = centerY + offset * sin + diagonal * cos;
    const endX = centerX + offset * cos + diagonal * sin;
    const endY = centerY + offset * sin - diagonal * cos;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  ctx.restore();
}
