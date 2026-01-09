/**
 * Grid Input Handler
 * Bloc 2.2 : Gestion des clics sur la grille pour déploiement d'avant-poste
 * Bloc 4.2 : Deep Click pour fortification
 */

import { getCellAtPosition, fortifyCell, getFortifiedCells, unfortifyCell } from '../game/gridManager';
import { initiateOutpostDeployment } from '../game/outpostDeployment';
import { spendEnergy, getEnergy } from '../game/state';
import { showLowPowerFeedback } from '../render/lowPowerFeedback';

// =============================================================================
// STATE (Deep Click)
// =============================================================================

interface DeepClickState {
  active: boolean;
  startTime: number;
  startX: number;
  startY: number;
  targetCol: number;
  targetRow: number;
}

const deepClickState: DeepClickState = {
  active: false,
  startTime: 0,
  startX: 0,
  startY: 0,
  targetCol: -1,
  targetRow: -1,
};

const DEEP_CLICK_THRESHOLD_MS = 2000; // 2 secondes
const FORTIFY_COST = 20;

// =============================================================================
// SETUP
// =============================================================================

/**
 * Initialise les event listeners pour la grille
 */
export function initGridInput(canvas: HTMLCanvasElement): void {
  canvas.addEventListener('click', handleGridClick);
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('touchstart', handleTouchStart);
  canvas.addEventListener('touchend', handleTouchEnd);
  console.log('[GridInput] Click and deep click handlers registered');
}

/**
 * Update deep click state (à appeler dans la boucle de rendu)
 */
export function updateDeepClick(): DeepClickState {
  if (deepClickState.active) {
    const duration = performance.now() - deepClickState.startTime;
    
    // Si on dépasse le seuil et qu'on n'a pas encore fortifié
    if (duration >= DEEP_CLICK_THRESHOLD_MS) {
      // Tenter la fortification
      handleDeepClickComplete();
    }
  }
  
  return { ...deepClickState };
}

/**
 * Get current deep click progress (0-1)
 */
export function getDeepClickProgress(): number {
  if (!deepClickState.active) return 0;
  const duration = performance.now() - deepClickState.startTime;
  return Math.min(1, duration / DEEP_CLICK_THRESHOLD_MS);
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

  console.log(`[GridInput] Clicked cell (${cell.col}, ${cell.row}), owner: ${cell.owner}`);

  // Si la cellule est neutre ou ennemie, initier un déploiement
  if (cell.owner === 'neutral' || cell.owner === 'enemy') {
    // Vérifier l'énergie disponible (Bloc 4.1)
    const energy = getEnergy();
    const DEPLOYMENT_COST = 10;

    if (energy.current < DEPLOYMENT_COST) {
      console.warn(`[GridInput] Insufficient energy: ${Math.floor(energy.current)}/${DEPLOYMENT_COST}`);
      showLowPowerFeedback(); // Bloc 4.4
      return;
    }

    // Dépenser l'énergie
    if (!spendEnergy(DEPLOYMENT_COST)) {
      console.warn('[GridInput] Failed to spend energy');
      return;
    }

    const deploymentId = initiateOutpostDeployment(cell.col, cell.row, 'player');
    
    if (deploymentId) {
      console.log(`[GridInput] Outpost deployment initiated: ${deploymentId} (cost: ${DEPLOYMENT_COST} energy)`);
    } else {
      console.warn('[GridInput] Failed to initiate deployment');
      // Rembourser l'énergie si le déploiement a échoué
      spendEnergy(-DEPLOYMENT_COST);
    }
  } else {
    console.log('[GridInput] Cannot deploy on owned cell (use deep click for fortify)');
  }
}

// =============================================================================
// DEEP CLICK HANDLERS (Bloc 4.2)
// =============================================================================

function handleMouseDown(event: MouseEvent): void {
  const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  startDeepClick(x, y);
}

function handleMouseUp(): void {
  cancelDeepClick();
}

function handleTouchStart(event: TouchEvent): void {
  if (event.touches.length > 0) {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const x = event.touches[0].clientX - rect.left;
    const y = event.touches[0].clientY - rect.top;
    
    startDeepClick(x, y);
  }
}

function handleTouchEnd(): void {
  cancelDeepClick();
}

function startDeepClick(x: number, y: number): void {
  const cell = getCellAtPosition(x, y);
  
  if (!cell) return;
  
  // Deep click seulement sur cellules alliées non-fortifiées
  if (cell.owner === 'player' && !cell.isFortified) {
    deepClickState.active = true;
    deepClickState.startTime = performance.now();
    deepClickState.startX = x;
    deepClickState.startY = y;
    deepClickState.targetCol = cell.col;
    deepClickState.targetRow = cell.row;
    
    console.log(`[GridInput] Deep click started on (${cell.col}, ${cell.row})`);
  }
}

function cancelDeepClick(): void {
  if (deepClickState.active) {
    console.log('[GridInput] Deep click cancelled');
  }
  deepClickState.active = false;
}

function handleDeepClickComplete(): void {
  if (!deepClickState.active) return;
  
  const { targetCol, targetRow } = deepClickState;
  
  // Vérifier l'énergie
  const energy = getEnergy();
  if (energy.current < FORTIFY_COST) {
    console.warn(`[GridInput] Insufficient energy for fortify: ${Math.floor(energy.current)}/${FORTIFY_COST}`);
    showLowPowerFeedback(); // Bloc 4.4
    cancelDeepClick();
    return;
  }
  
  // Vérifier qu'il n'y a pas déjà une cellule fortifiée
  const fortifiedCells = getFortifiedCells();
  if (fortifiedCells.length > 0) {
    console.warn('[GridInput] Already have a fortified cell, removing old one');
    // Retirer l'ancienne fortification
    for (const cell of fortifiedCells) {
      unfortifyCell(cell.col, cell.row);
    }
  }
  
  // Dépenser l'énergie
  if (!spendEnergy(FORTIFY_COST)) {
    console.warn('[GridInput] Failed to spend energy for fortify');
    cancelDeepClick();
    return;
  }
  
  // Fortifier la cellule
  if (fortifyCell(targetCol, targetRow)) {
    console.log(`[GridInput] Cell (${targetCol}, ${targetRow}) fortified! (cost: ${FORTIFY_COST} energy)`);
  }
  
  cancelDeepClick();
}
