/**
 * Bezier Curves - Rendu organique fluide
 * Courbes de Bézier optimisées pour synapses organiques
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const BEZIER_CURVE_OFFSET = 30; // Distance de contrôle pour la courbure
const BEZIER_SEGMENTS = 8; // Nombre de segments pour la courbe (trade-off qualité/performance)

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Calcule un point de contrôle pour une courbe de Bézier
 * Crée une courbure naturelle perpendiculaire à la ligne directe
 */
export function getControlPoint(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  offset: number
): { x: number; y: number } {
  // Vecteur de direction
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) {
    return { x: x1, y: y1 };
  }
  
  // Vecteur perpendiculaire normalisé
  const perpX = -dy / length;
  const perpY = dx / length;
  
  // Point de contrôle au milieu, décalé perpendiculairement
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  return {
    x: midX + perpX * offset,
    y: midY + perpY * offset,
  };
}

/**
 * Calcule un point sur une courbe de Bézier quadratique
 * @param t - Paramètre de la courbe (0 à 1)
 */
function bezierPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  
  return {
    x: mt2 * p0.x + 2 * mt * t * p1.x + t2 * p2.x,
    y: mt2 * p0.y + 2 * mt * t * p1.y + t2 * p2.y,
  };
}

// =============================================================================
// API
// =============================================================================

/**
 * Dessine une courbe de Bézier organique entre deux points
 * OPTIMISÉ : Utilise un nombre limité de segments pour performance
 */
export function drawBezierCurve(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curvature: number = 1.0
): void {
  // Calculer le point de contrôle
  const control = getControlPoint(x1, y1, x2, y2, BEZIER_CURVE_OFFSET * curvature);
  
  // Dessiner la courbe avec segments optimisés
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  
  // Utiliser quadraticCurveTo pour performance native (plus rapide que segments manuels)
  ctx.quadraticCurveTo(control.x, control.y, x2, y2);
  ctx.stroke();
}

/**
 * Dessine une courbe de Bézier avec segments manuels (pour contrôle fin)
 * Utilisé uniquement si besoin de gradient ou d'effets spéciaux
 */
export function drawBezierCurveSegmented(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curvature: number = 1.0
): void {
  const control = getControlPoint(x1, y1, x2, y2, BEZIER_CURVE_OFFSET * curvature);
  const p0 = { x: x1, y: y1 };
  const p1 = control;
  const p2 = { x: x2, y: y2 };
  
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  
  // Dessiner segments (pour contrôle fin si nécessaire)
  for (let i = 1; i <= BEZIER_SEGMENTS; i++) {
    const t = i / BEZIER_SEGMENTS;
    const point = bezierPoint(p0, p1, p2, t);
    ctx.lineTo(point.x, point.y);
  }
  
  ctx.stroke();
}

/**
 * Calcule la courbure dynamique basée sur la distance
 * Les connexions longues ont plus de courbure pour un effet organique
 */
export function calculateDynamicCurvature(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Courbure proportionnelle à la distance (max 1.5x pour très longues connexions)
  const baseCurvature = Math.min(distance / 200, 1.5);
  
  return baseCurvature;
}
