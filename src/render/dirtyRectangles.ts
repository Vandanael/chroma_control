/**
 * Dirty Rectangles - Partial Redraw System
 * Ne redessine que les zones qui ont changé
 */

// =============================================================================
// TYPES
// =============================================================================

export interface DirtyRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

// =============================================================================
// STATE
// =============================================================================

const dirtyRegions: DirtyRegion[] = [];
const FULL_REDRAW_THRESHOLD = 5; // Si plus de 5 régions, redessiner tout

// =============================================================================
// API
// =============================================================================

/**
 * Marque une région comme "sale" (nécessite redessin)
 */
export function markDirty(x: number, y: number, width: number, height: number): void {
  // Fusionner avec régions existantes si chevauchement
  for (const region of dirtyRegions) {
    if (
      x < region.x + region.width &&
      x + width > region.x &&
      y < region.y + region.height &&
      y + height > region.y
    ) {
      // Fusionner
      const minX = Math.min(x, region.x);
      const minY = Math.min(y, region.y);
      const maxX = Math.max(x + width, region.x + region.width);
      const maxY = Math.max(y + height, region.y + region.height);
      
      region.x = minX;
      region.y = minY;
      region.width = maxX - minX;
      region.height = maxY - minY;
      return;
    }
  }

  // Ajouter nouvelle région
  dirtyRegions.push({ x, y, width, height });
}

/**
 * Marque tout l'écran comme sale (full redraw)
 */
export function markAllDirty(width: number, height: number): void {
  dirtyRegions.length = 0;
  dirtyRegions.push({ x: 0, y: 0, width, height });
}

/**
 * Récupère les régions sales et les nettoie
 */
export function getAndClearDirtyRegions(): DirtyRegion[] {
  const regions = [...dirtyRegions];
  dirtyRegions.length = 0;
  return regions;
}

/**
 * Détermine si un full redraw est nécessaire
 */
export function needsFullRedraw(): boolean {
  return dirtyRegions.length >= FULL_REDRAW_THRESHOLD;
}
