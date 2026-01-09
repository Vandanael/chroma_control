/**
 * Outpost Deployment System
 * Bloc 2.2 : Système de déploiement d'avant-poste en 3 phases
 * 
 * Phase 1 - Transit : Signal éphémère (250ms/cellule)
 * Phase 2 - Impact : Création avant-poste
 * Phase 3 - Expansion : Capture cross pattern (4 voisins)
 */

import { GridCell, getCells, getCellsByOwner, captureAsOutpost, captureCrossNeighbors } from './gridManager';
import { findPath } from '../utils/pathfinding';

// =============================================================================
// TYPES
// =============================================================================

export type DeploymentPhase = 'transit' | 'impact' | 'expansion' | 'complete';

export interface OutpostDeployment {
  id: string;
  path: GridCell[];              // Chemin à parcourir
  currentIndex: number;          // Index actuel dans le chemin
  phase: DeploymentPhase;
  startTime: number;             // Timestamp de début (ms)
  nextCellTime: number;          // Timestamp pour la prochaine cellule
  targetCell: GridCell;          // Cellule cible
  owner: 'player' | 'enemy';
  transitCells: GridCell[];      // Cellules traversées (pour effet éphémère)
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TRANSIT_SPEED_MS = 250;     // 250ms par cellule (verrouillé)
const EXPANSION_DELAY_MS = 100;   // 100ms pour feedback visuel expansion

// =============================================================================
// STATE
// =============================================================================

const activeDeployments: Map<string, OutpostDeployment> = new Map();
let deploymentCounter = 0;

// =============================================================================
// DEPLOYMENT CREATION
// =============================================================================

/**
 * Initie un déploiement d'avant-poste
 * @returns ID du déploiement ou null si impossible
 */
export function initiateOutpostDeployment(
  targetCol: number,
  targetRow: number,
  owner: 'player' | 'enemy'
): string | null {
  const allCells = getCells();
  const ownedCells = getCellsByOwner(owner);

  if (ownedCells.length === 0) {
    console.warn('[Deployment] No owned cells to start from');
    return null;
  }

  // Trouver la cellule alliée la plus proche de la cible
  const targetCell = allCells.find(c => c.col === targetCol && c.row === targetRow);
  if (!targetCell) {
    console.warn(`[Deployment] Target cell (${targetCol}, ${targetRow}) not found`);
    return null;
  }

  // Trouver la cellule alliée la plus proche
  let closestCell = ownedCells[0];
  let minDist = Math.abs(closestCell.col - targetCol) + Math.abs(closestCell.row - targetRow);

  for (const cell of ownedCells) {
    const dist = Math.abs(cell.col - targetCol) + Math.abs(cell.row - targetRow);
    if (dist < minDist) {
      minDist = dist;
      closestCell = cell;
    }
  }

  // Calculer le chemin avec A*
  const path = findPath(
    allCells,
    closestCell.col,
    closestCell.row,
    targetCol,
    targetRow
  );

  if (!path || path.length === 0) {
    console.warn('[Deployment] No path found');
    return null;
  }

  // Créer le déploiement
  const id = `deploy_${owner}_${deploymentCounter++}`;
  const deployment: OutpostDeployment = {
    id,
    path,
    currentIndex: 0,
    phase: 'transit',
    startTime: performance.now(),
    nextCellTime: performance.now() + TRANSIT_SPEED_MS,
    targetCell,
    owner,
    transitCells: [],
  };

  activeDeployments.set(id, deployment);
  console.log(`[Deployment] ${id} initiated: ${path.length} cells to traverse`);

  return id;
}

// =============================================================================
// UPDATE LOOP
// =============================================================================

/**
 * Met à jour tous les déploiements actifs
 * À appeler dans la boucle de rendu principale
 */
export function updateDeployments(): void {
  const now = performance.now();
  const toRemove: string[] = [];

  for (const [id, deployment] of activeDeployments) {
    switch (deployment.phase) {
      case 'transit':
        updateTransitPhase(deployment, now);
        break;

      case 'impact':
        updateImpactPhase(deployment, now);
        break;

      case 'expansion':
        updateExpansionPhase(deployment, now);
        break;

      case 'complete':
        toRemove.push(id);
        break;
    }
  }

  // Nettoyer les déploiements terminés
  for (const id of toRemove) {
    activeDeployments.delete(id);
    console.log(`[Deployment] ${id} completed and removed`);
  }
}

// =============================================================================
// PHASE 1 - TRANSIT
// =============================================================================

function updateTransitPhase(deployment: OutpostDeployment, now: number): void {
  // Vérifier si on doit passer à la cellule suivante
  if (now >= deployment.nextCellTime) {
    // Ajouter la cellule actuelle aux cellules traversées (effet éphémère)
    const currentCell = deployment.path[deployment.currentIndex];
    if (currentCell) {
      deployment.transitCells.push(currentCell);
    }

    deployment.currentIndex++;

    // Si on a atteint la fin du chemin → Phase 2 (Impact)
    if (deployment.currentIndex >= deployment.path.length) {
      deployment.phase = 'impact';
      deployment.nextCellTime = now; // Impact immédiat
      console.log(`[Deployment] ${deployment.id} → PHASE 2 (Impact)`);
    } else {
      // Prochaine cellule dans 250ms
      deployment.nextCellTime = now + TRANSIT_SPEED_MS;
    }
  }
}

// =============================================================================
// PHASE 2 - IMPACT
// =============================================================================

function updateImpactPhase(deployment: OutpostDeployment, now: number): void {
  // Capturer la cible comme avant-poste
  captureAsOutpost(
    deployment.targetCell.col,
    deployment.targetCell.row,
    deployment.owner
  );

  console.log(`[Deployment] ${deployment.id} → PHASE 3 (Expansion)`);
  deployment.phase = 'expansion';
  deployment.nextCellTime = now + EXPANSION_DELAY_MS;
}

// =============================================================================
// PHASE 3 - EXPANSION
// =============================================================================

function updateExpansionPhase(deployment: OutpostDeployment, now: number): void {
  if (now >= deployment.nextCellTime) {
    // Capturer les 4 voisins en croix
    const captured = captureCrossNeighbors(
      deployment.targetCell.col,
      deployment.targetCell.row,
      deployment.owner
    );

    console.log(`[Deployment] ${deployment.id} expanded: ${captured.length} cells captured`);
    console.log(`[Deployment] ${deployment.id} → COMPLETE`);
    deployment.phase = 'complete';
  }
}

// =============================================================================
// ACCESSORS
// =============================================================================

/**
 * Récupère tous les déploiements actifs
 */
export function getActiveDeployments(): OutpostDeployment[] {
  return Array.from(activeDeployments.values());
}

/**
 * Récupère un déploiement spécifique
 */
export function getDeployment(id: string): OutpostDeployment | null {
  return activeDeployments.get(id) || null;
}

/**
 * Annule un déploiement
 */
export function cancelDeployment(id: string): void {
  if (activeDeployments.delete(id)) {
    console.log(`[Deployment] ${id} cancelled`);
  }
}

/**
 * Annule tous les déploiements
 */
export function clearAllDeployments(): void {
  activeDeployments.clear();
  console.log('[Deployment] All deployments cleared');
}
