/**
 * Grid Input Handler
 * Smart Context System : 1 Clic = 1 Action Contextuelle
 * - NEUTRAL → SCOUT (Déploiement Avant-Poste) : 10 Énergie
 * - PLAYER → DEFEND (Renforcement / Shield) : 20 Énergie
 * - ENEMY → ATTACK (Attaque / Sabotage) : 30 Énergie
 */

import { getCellAtPosition, fortifyCell, getFortifiedCells, unfortifyCell, attackEnemyCell, GridCell } from '../game/gridManager';
import { initiateOutpostDeployment } from '../game/outpostDeployment';
import { spendEnergy, getEnergy } from '../game/state';
import { showLowPowerFeedback } from '../render/lowPowerFeedback';

// =============================================================================
// ACTION TYPES
// =============================================================================

export type ActionType = 'SCOUT' | 'DEFEND' | 'ATTACK' | 'NONE';

export interface ActionInfo {
  type: ActionType;
  cost: number;
  cursorShape: 'circle' | 'square' | 'triangle';
}

// =============================================================================
// ACTION COSTS
// =============================================================================

const SCOUT_COST = 5;  // Réduit pour rendre le jeu moins punitif
const DEFEND_COST = 20;
const ATTACK_COST = 30;

// =============================================================================
// ACTION DETECTION
// =============================================================================

/**
 * Détermine l'action à exécuter selon la cellule cible
 */
export function getActionFromTarget(targetCell: GridCell | null): ActionInfo {
  if (!targetCell) {
    return { type: 'NONE', cost: 0, cursorShape: 'circle' };
}

  switch (targetCell.owner) {
    case 'neutral':
      return { type: 'SCOUT', cost: SCOUT_COST, cursorShape: 'circle' };
    
    case 'player':
      return { type: 'DEFEND', cost: DEFEND_COST, cursorShape: 'square' };
    
    case 'enemy':
      return { type: 'ATTACK', cost: ATTACK_COST, cursorShape: 'triangle' };
    
    default:
      return { type: 'NONE', cost: 0, cursorShape: 'circle' };
  }
}

/**
 * Récupère l'action pour une position donnée (pour le curseur et l'UI)
 */
export function getActionAtPosition(x: number, y: number): ActionInfo {
  const cell = getCellAtPosition(x, y);
  return getActionFromTarget(cell);
}

// =============================================================================
// SETUP
// =============================================================================

/**
 * Initialise les event listeners pour la grille
 */
export function initGridInput(canvas: HTMLCanvasElement): void {
  canvas.addEventListener('click', handleGridClick);
  console.log('[GridInput] Smart Context system initialized');
}

// =============================================================================
// HANDLERS
// =============================================================================

function handleGridClick(event: MouseEvent): void {
  // Récupérer les coordonnées du clic
  const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Trouver la cellule cliquée
  const cell = getCellAtPosition(x, y);

  if (!cell) {
    console.log('[GridInput] Click outside grid');
    return;
  }

  // Déterminer l'action contextuelle
  const action = getActionFromTarget(cell);

  if (action.type === 'NONE') {
    console.log('[GridInput] No action available');
      return;
    }

  // Vérifier l'énergie disponible
  const energy = getEnergy();
  if (energy.current < action.cost) {
    console.warn(`[GridInput] Insufficient energy: ${Math.floor(energy.current)}/${action.cost}`);
    showLowPowerFeedback();
      return;
    }

  // Exécuter l'action correspondante
  let success = false;

  switch (action.type) {
    case 'SCOUT':
      // Déploiement d'avant-poste sur cellule neutre
      if (spendEnergy(action.cost)) {
    const deploymentId = initiateOutpostDeployment(cell.col, cell.row, 'player');
    if (deploymentId) {
          success = true;
          console.log(`[GridInput] SCOUT: Outpost deployment initiated (cost: ${action.cost} energy)`);
    } else {
      // Rembourser l'énergie si le déploiement a échoué
          spendEnergy(-action.cost);
          console.warn('[GridInput] SCOUT: Failed to initiate deployment');
  }
}
      break;

    case 'DEFEND':
      // Fortification de cellule alliée
      if (spendEnergy(action.cost)) {
        // Retirer l'ancienne fortification si elle existe
        const fortifiedCells = getFortifiedCells();
        for (const fortifiedCell of fortifiedCells) {
          unfortifyCell(fortifiedCell.col, fortifiedCell.row);
        }
        
        if (fortifyCell(cell.col, cell.row)) {
          success = true;
          console.log(`[GridInput] DEFEND: Cell fortified (cost: ${action.cost} energy)`);
        } else {
          // Rembourser l'énergie si la fortification a échoué
          spendEnergy(-action.cost);
          console.warn('[GridInput] DEFEND: Failed to fortify cell');
        }
      }
      break;

    case 'ATTACK':
      // Attaque/Sabotage de cellule ennemie
      if (spendEnergy(action.cost)) {
        if (attackEnemyCell(cell.col, cell.row)) {
          success = true;
          console.log(`[GridInput] ATTACK: Enemy cell attacked (cost: ${action.cost} energy)`);
        } else {
          // Rembourser l'énergie si l'attaque a échoué
          spendEnergy(-action.cost);
          console.warn('[GridInput] ATTACK: Failed to attack cell');
        }
      }
      break;
  }
  
  if (!success) {
    console.warn(`[GridInput] Action ${action.type} failed`);
  }
}
