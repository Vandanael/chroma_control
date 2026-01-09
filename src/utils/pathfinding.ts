/**
 * Pathfinding A* - Calcul du chemin le plus court
 * Optimisé pour grille 25×16 (Manhattan distance)
 */

import { GridCell } from '../game/gridManager';

// =============================================================================
// TYPES
// =============================================================================

interface PathNode {
  col: number;
  row: number;
  g: number; // Coût depuis le départ
  h: number; // Heuristique (distance estimée vers cible)
  f: number; // Score total (g + h)
  parent: PathNode | null;
}

// =============================================================================
// HEURISTIQUE (Distance Manhattan)
// =============================================================================

/**
 * Calcule la distance Manhattan entre deux positions
 * Optimale pour grille orthogonale (4 directions)
 */
function heuristic(col1: number, row1: number, col2: number, row2: number): number {
  return Math.abs(col1 - col2) + Math.abs(row1 - row2);
}

// =============================================================================
// PATHFINDING A*
// =============================================================================

/**
 * Trouve le chemin le plus court entre start et target
 * @param allCells - Toutes les cellules de la grille
 * @param startCol - Colonne de départ
 * @param startRow - Ligne de départ
 * @param targetCol - Colonne cible
 * @param targetRow - Ligne cible
 * @returns Tableau de cellules du chemin (start exclu, target inclus) ou null si impossible
 */
export function findPath(
  allCells: GridCell[],
  startCol: number,
  startRow: number,
  targetCol: number,
  targetRow: number
): GridCell[] | null {
  // Early exit si start = target
  if (startCol === targetCol && startRow === targetRow) {
    return [];
  }

  // Vérifier que la cible existe
  const targetCell = allCells.find(c => c.col === targetCol && c.row === targetRow);
  if (!targetCell) {
    console.warn(`[Pathfinding] Target cell (${targetCol}, ${targetRow}) not found`);
    return null;
  }

  // Open list (à explorer) et Closed list (déjà explorés)
  const openList: PathNode[] = [];
  const closedSet = new Set<string>();

  // Node de départ
  const startNode: PathNode = {
    col: startCol,
    row: startRow,
    g: 0,
    h: heuristic(startCol, startRow, targetCol, targetRow),
    f: heuristic(startCol, startRow, targetCol, targetRow),
    parent: null,
  };

  openList.push(startNode);

  // Boucle principale A*
  while (openList.length > 0) {
    // Trouver le node avec le meilleur score f
    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift()!;

    const key = `${current.col},${current.row}`;

    // Si on a atteint la cible, reconstruire le chemin
    if (current.col === targetCol && current.row === targetRow) {
      return reconstructPath(current, allCells);
    }

    // Ajouter à la closed list
    closedSet.add(key);

    // Explorer les voisins (4 directions : haut, bas, gauche, droite)
    const neighbors = getNeighbors(current.col, current.row);

    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.col},${neighbor.row}`;

      // Skip si déjà exploré
      if (closedSet.has(neighborKey)) {
        continue;
      }

      // Vérifier que le voisin existe
      const neighborCell = allCells.find(
        c => c.col === neighbor.col && c.row === neighbor.row
      );

      if (!neighborCell) {
        continue;
      }

      // Vérifier si le voisin est traversable
      // Obstacle = cellule ennemie (pour l'instant, on permet de traverser)
      // Dans le futur, on pourrait bloquer les cellules ennemies
      const isBlocked = false; // neighborCell.owner === 'enemy';

      if (isBlocked) {
        continue;
      }

      // Calculer le coût g (coût depuis le départ)
      const tentativeG = current.g + 1;

      // Chercher si le voisin est déjà dans l'open list
      const existingNode = openList.find(
        n => n.col === neighbor.col && n.row === neighbor.row
      );

      if (existingNode) {
        // Si on a trouvé un meilleur chemin, mettre à jour
        if (tentativeG < existingNode.g) {
          existingNode.g = tentativeG;
          existingNode.f = tentativeG + existingNode.h;
          existingNode.parent = current;
        }
      } else {
        // Ajouter le voisin à l'open list
        const h = heuristic(neighbor.col, neighbor.row, targetCol, targetRow);
        const neighborNode: PathNode = {
          col: neighbor.col,
          row: neighbor.row,
          g: tentativeG,
          h: h,
          f: tentativeG + h,
          parent: current,
        };
        openList.push(neighborNode);
      }
    }
  }

  // Aucun chemin trouvé
  console.warn(`[Pathfinding] No path found from (${startCol}, ${startRow}) to (${targetCol}, ${targetRow})`);
  return null;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Retourne les 4 voisins orthogonaux (haut, bas, gauche, droite)
 */
function getNeighbors(col: number, row: number): { col: number; row: number }[] {
  return [
    { col: col, row: row - 1 }, // Haut
    { col: col, row: row + 1 }, // Bas
    { col: col - 1, row: row }, // Gauche
    { col: col + 1, row: row }, // Droite
  ];
}

/**
 * Reconstruit le chemin depuis le node cible
 * @returns Tableau de cellules (start exclu, target inclus)
 */
function reconstructPath(targetNode: PathNode, allCells: GridCell[]): GridCell[] {
  const path: GridCell[] = [];
  let current: PathNode | null = targetNode;

  while (current !== null) {
    const cell = allCells.find(c => c.col === current!.col && c.row === current!.row);
    if (cell) {
      path.unshift(cell); // Ajouter au début
    }
    current = current.parent;
  }

  // Retirer la cellule de départ (on veut seulement le chemin à parcourir)
  if (path.length > 0) {
    path.shift();
  }

  console.log(`[Pathfinding] Path found with ${path.length} cells`);
  return path;
}

// =============================================================================
// UTILITAIRES DE DISTANCE
// =============================================================================

/**
 * Calcule la distance Manhattan entre deux cellules
 */
export function manhattanDistance(cell1: GridCell, cell2: GridCell): number {
  return Math.abs(cell1.col - cell2.col) + Math.abs(cell1.row - cell2.row);
}

/**
 * Vérifie si deux cellules sont adjacentes (4 directions)
 */
export function areNeighbors(cell1: GridCell, cell2: GridCell): boolean {
  return manhattanDistance(cell1, cell2) === 1;
}
