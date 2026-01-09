/**
 * Mathematical utilities for Chroma Control
 * - Point-in-polygon detection
 * - Distance calculations
 * - Signal propagation helpers
 */

// =============================================================================
// GEOMETRY UTILITIES
// =============================================================================

/**
 * Point interface
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Check if a point is inside a polygon using ray-casting algorithm
 * @param point - Point to test
 * @param polygon - Array of points forming the polygon
 * @returns true if point is inside polygon
 */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const { x, y } = point;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculate Euclidean distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// =============================================================================
// SIGNAL PROPAGATION UTILITIES (Sprint 2)
// =============================================================================

/**
 * Calculate signal decay based on distance from center
 * @param distanceFromCenter - Distance from cell center
 * @param cellRadius - Radius of the cell (approximate)
 * @returns Signal strength (0-1)
 */
export function calculateSignalStrength(
  distanceFromCenter: number,
  cellRadius: number,
): number {
  // Radial gradient: 1.0 at center, 0.0 at edges
  const normalized = distanceFromCenter / cellRadius;
  return Math.max(0, 1 - normalized);
}
