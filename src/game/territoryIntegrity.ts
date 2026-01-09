/**
 * Territory Integrity System - Bio-Digital Edition
 * Flood Fill depuis HQ pour déterminer connectivité
 * Cellules isolées dépérissent (-15/s), connectées se renforcent (+5/s)
 */

import { getCells, getCrossNeighbors, type GridCell } from './gridManager';

// =============================================================================
// TERRITORY INTEGRITY
// =============================================================================

/**
 * Met à jour l'intégrité du territoire via Flood Fill depuis les HQ
 * Cellules connectées : +5 signalStrength/sec (max 100)
 * Cellules isolées : -15 signalStrength/sec
 * Si signalStrength <= 0 : retour à neutral
 */
export function updateTerritoryIntegrity(deltaSeconds: number): void {
  if (deltaSeconds <= 0 || deltaSeconds > 0.1) return; // Cap pour éviter bugs

  const allCells = getCells();

  // Phase 1 : Reset isConnected pour tous
  for (const cell of allCells) {
    cell.isConnected = false;
  }

  // Phase 2 : Flood Fill depuis TOUS les HQ (joueur ET IA)
  const hqCells = allCells.filter(c => c.isHQ);
  
  for (const hq of hqCells) {
    if (hq.owner === 'neutral') continue; // HQ ne peut pas être neutral normalement
    
    // BFS depuis ce HQ
    const queue: GridCell[] = [hq];
    const visited = new Set<string>();
    visited.add(`${hq.col},${hq.row}`);
    hq.isConnected = true;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = getCrossNeighbors(current.col, current.row);

      for (const neighbor of neighbors) {
        const key = `${neighbor.col},${neighbor.row}`;
        
        // Propager seulement vers cellules du même owner et non visitées
        if (!visited.has(key) && neighbor.owner === current.owner) {
          visited.add(key);
          neighbor.isConnected = true;
          queue.push(neighbor);
        }
      }
    }
  }

  // Phase 3 : Mise à jour signalStrength selon connectivité
  for (const cell of allCells) {
    if (cell.owner === 'neutral') continue;
    
    if (cell.isConnected) {
      // Régénération (+5/sec, max 100)
      cell.signalStrength = Math.min(100, cell.signalStrength + 5 * deltaSeconds);
    } else {
      // Dépérissement (-15/sec)
      cell.signalStrength = Math.max(0, cell.signalStrength - 15 * deltaSeconds);
      
      // MORT : Retour à neutral si signalStrength épuisé
      if (cell.signalStrength <= 0) {
        cell.owner = 'neutral';
        cell.isOutpost = false;
        cell.isFortified = false;
        cell.isHQ = false; // Théoriquement impossible mais sécurité
        console.log(`[Territory] Cell (${cell.col}, ${cell.row}) died from isolation`);
      }
    }
  }
}
