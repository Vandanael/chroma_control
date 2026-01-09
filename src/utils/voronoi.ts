/**
 * Voronoi Diagram Generation
 * Uses d3-delaunay for robust Voronoi computation
 */

import { Delaunay } from 'd3-delaunay';
import { Point } from './math';

// =============================================================================
// TYPES
// =============================================================================

export interface VoronoiCell {
  id: string;
  center: Point;
  polygon: Point[];
  neighbors: string[]; // IDs of adjacent cells
}

export interface VoronoiDiagram {
  cells: VoronoiCell[];
  width: number;
  height: number;
}

// =============================================================================
// VORONOI GENERATION (Bloc 1.1)
// =============================================================================

/**
 * Generate Voronoi diagram from seed points using d3-delaunay
 * 
 * @param seeds - Array of seed points
 * @param width - Canvas width
 * @param height - Canvas height
 * @returns VoronoiDiagram with cells and adjacency
 */
export function generateVoronoi(
  seeds: Point[],
  width: number,
  height: number,
): VoronoiDiagram {
  if (seeds.length === 0) {
    return { cells: [], width, height };
  }

  // Convert seeds to array of [x, y] pairs for d3-delaunay
  const points: [number, number][] = seeds.map(p => [p.x, p.y]);
  
  // Generate Delaunay triangulation using Delaunay.from()
  const delaunay = Delaunay.from(points);
  
  // Generate Voronoi diagram with canvas bounds as clipping rect
  // [xmin, ymin, xmax, ymax]
  const voronoi = delaunay.voronoi([0, 0, width, height]);
  
  // Build cells
  const cells: VoronoiCell[] = [];
  
  for (let i = 0; i < seeds.length; i++) {
    const cellPolygon = voronoi.cellPolygon(i);
    
    if (!cellPolygon) continue;
    
    // Convert to Point[] format
    const polygon: Point[] = Array.from(cellPolygon).map(([x, y]) => ({ x, y }));
    
    // Find neighbors (cells that share an edge)
    const neighbors: string[] = [];
    for (let j = 0; j < seeds.length; j++) {
      if (i !== j && areNeighbors(delaunay, i, j)) {
        neighbors.push(`cell-${j}`);
      }
    }
    
    cells.push({
      id: `cell-${i}`,
      center: seeds[i],
      polygon,
      neighbors,
    });
  }
  
  return { cells, width, height };
}

/**
 * Check if two cells are neighbors in the Delaunay triangulation
 */
function areNeighbors(delaunay: Delaunay<Delaunay.Point>, i: number, j: number): boolean {
  // Two cells are neighbors if they share an edge in the Delaunay triangulation
  const triangles = delaunay.triangles;
  
  for (let t = 0; t < triangles.length; t += 3) {
    const a = triangles[t];
    const b = triangles[t + 1];
    const c = triangles[t + 2];
    
    if ((a === i && (b === j || c === j)) ||
        (b === i && (a === j || c === j)) ||
        (c === i && (a === j || b === j))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate random seed points with Poisson disk sampling
 * Ensures minimum distance between points for natural distribution
 * 
 * @param count - Number of seeds to generate
 * @param width - Canvas width
 * @param height - Canvas height
 * @param minDistance - Minimum distance between seeds
 * @returns Array of seed points
 */
export function generateSeeds(
  count: number,
  width: number,
  height: number,
  minDistance: number = 60,
): Point[] {
  const seeds: Point[] = [];
  const margin = 30; // Marge réduite pour meilleure couverture
  const maxAttempts = 50; // Plus d'essais
  
  const minX = margin;
  const maxX = width - margin;
  const minY = margin;
  const maxY = height - margin;
  
  // Simple rejection sampling (good enough for MVP)
  while (seeds.length < count) {
    let attempts = 0;
    let validPoint = false;
    
    while (!validPoint && attempts < maxAttempts) {
      const candidate: Point = {
        x: minX + Math.random() * (maxX - minX),
        y: minY + Math.random() * (maxY - minY),
      };
      
      // Check distance to all existing seeds
      validPoint = seeds.length === 0 || seeds.every(seed => {
        const dx = seed.x - candidate.x;
        const dy = seed.y - candidate.y;
        return Math.sqrt(dx * dx + dy * dy) >= minDistance;
      });
      
      if (validPoint) {
        seeds.push(candidate);
      }
      
      attempts++;
    }
    
    // If we can't find a valid point, reduce minDistance slightly
    if (!validPoint && seeds.length < count) {
      minDistance *= 0.9;
    }
  }
  
  return seeds;
}
