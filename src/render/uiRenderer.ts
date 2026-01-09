/**
 * UI Renderer - Cockpit HUD
 * Met à jour les éléments DOM du HUD (barres haut/bas)
 */

import { getNetworkStats } from '../game/signalPhysics';
import { getNodesByOwner } from '../game/nodeManager';
import { getEnergy } from '../game/state';
import { calculateEnergyProduction } from '../game/energyProduction';
import { calculateTerritoryPercentage } from '../game/territorySystem';

// =============================================================================
// HUD ELEMENTS
// =============================================================================

let isMouseOverCanvas = false;

/**
 * Initialise le suivi de la souris pour l'UI contextuelle
 */
export function initUIRenderer(canvas: HTMLCanvasElement): void {
  canvas.addEventListener('mouseenter', () => {
    isMouseOverCanvas = true;
  });

  canvas.addEventListener('mouseleave', () => {
    isMouseOverCanvas = false;
  });

  console.log('[UIRenderer] Cockpit HUD initialized');
}

/**
 * Met à jour tous les éléments du HUD
 */
export function updateHUD(): void {
  updateTopBar();
  updateBottomBar();
}

/**
 * Met à jour la barre supérieure (Score, Timer, Territoire)
 * Interface minimale - informations essentielles uniquement
 */
function updateTopBar(): void {
  // BLOC 5.4 : Calculer le pourcentage de territoire réel (basé sur zones de contrôle)
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (canvas) {
    const territory = calculateTerritoryPercentage(canvas.width, canvas.height);
    
    const playerScoreEl = document.getElementById('hud-player-score');
    if (playerScoreEl) {
      playerScoreEl.textContent = `${Math.round(territory.player)}%`;
      playerScoreEl.style.opacity = territory.player > 0 ? '1' : '0.3';
    }

    const enemyScoreEl = document.getElementById('hud-enemy-score');
    if (enemyScoreEl) {
      enemyScoreEl.textContent = `${Math.round(territory.enemy)}%`;
      enemyScoreEl.style.opacity = territory.enemy > 0 ? '1' : '0.3';
    }
  } else {
    // Fallback : basé sur nombre de nœuds si canvas non disponible
    const playerNodes = getNodesByOwner('player').length;
    const enemyNodes = getNodesByOwner('enemy').length;
    const totalNodes = playerNodes + enemyNodes;
    
    const playerPercent = totalNodes > 0 ? Math.round((playerNodes / totalNodes) * 100) : 50;
    const enemyPercent = totalNodes > 0 ? Math.round((enemyNodes / totalNodes) * 100) : 50;

    const playerScoreEl = document.getElementById('hud-player-score');
    if (playerScoreEl) {
      playerScoreEl.textContent = `${playerPercent}%`;
      playerScoreEl.style.opacity = playerPercent > 0 ? '1' : '0.3';
    }

    const enemyScoreEl = document.getElementById('hud-enemy-score');
    if (enemyScoreEl) {
      enemyScoreEl.textContent = `${enemyPercent}%`;
      enemyScoreEl.style.opacity = enemyPercent > 0 ? '1' : '0.3';
    }
  }
}

/**
 * Met à jour la barre inférieure (Signal Strength, Contexte Action, Energy)
 * Interface minimale - informations discrètes
 */
function updateBottomBar(): void {
  const stats = getNetworkStats('player');

  // Mettre à jour la portée du signal (discret)
  const signalRangeEl = document.getElementById('signal-range');
  if (signalRangeEl) {
    signalRangeEl.textContent = stats.range.toString();
    // Fade si portée maximale atteinte (moins distrayant)
    signalRangeEl.parentElement!.style.opacity = stats.range >= 500 ? '0.5' : '1';
  }

  // Mettre à jour la densité du réseau (discret)
  const networkDensityEl = document.getElementById('network-density');
  if (networkDensityEl) {
    networkDensityEl.textContent = stats.nodeCount.toString();
    // Fade si réseau très dense (moins distrayant)
    networkDensityEl.parentElement!.style.opacity = stats.nodeCount > 50 ? '0.5' : '1';
  }
  
  // Mettre à jour l'affichage de l'énergie avec production (BLOC 2.2)
  updateEnergyDisplay();

  // Mettre à jour le contexte d'action
  const contextIconEl = document.getElementById('context-icon');
  const contextTextEl = document.getElementById('context-text');

  if (isMouseOverCanvas) {
    // Afficher "PLACE NODE" quand la souris est sur le canvas
    if (contextIconEl) {
      contextIconEl.textContent = '⚪';
    }
    if (contextTextEl) {
      contextTextEl.textContent = 'PLACE NODE';
      contextTextEl.style.color = '#FFFFFF';
    }
  } else {
    if (contextIconEl) {
      contextIconEl.textContent = '⚪';
    }
    if (contextTextEl) {
      contextTextEl.textContent = '--';
      contextTextEl.style.color = '#FFFFFF';
    }
  }
}

/**
 * Met à jour le timer dans la barre supérieure
 */
export function updateTimerDisplay(minutes: number, seconds: number): void {
  const timerEl = document.getElementById('hud-timer');
  if (timerEl) {
    const mins = minutes.toString().padStart(2, '0');
    const secs = seconds.toString().padStart(2, '0');
    timerEl.textContent = `${mins}:${secs}`;
  }
}

/**
 * Met à jour l'affichage de l'énergie avec production (BLOC 2.2)
 */
function updateEnergyDisplay(): void {
  // Créer ou récupérer l'élément d'énergie dans le HUD
  let energyEl = document.getElementById('hud-energy');
  
  if (!energyEl) {
    // Créer l'élément si il n'existe pas
    const hudBottom = document.getElementById('hud-bottom');
    if (hudBottom) {
      energyEl = document.createElement('div');
      energyEl.id = 'hud-energy';
      energyEl.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 4px;
        opacity: 0.7;
      `;
      
      // Insérer après le bloc signal
      const signalEl = document.getElementById('hud-signal');
      if (signalEl && signalEl.parentNode) {
        signalEl.parentNode.insertBefore(energyEl, signalEl.nextSibling);
      } else {
        hudBottom.insertBefore(energyEl, hudBottom.firstChild);
      }
    }
  }
  
  if (!energyEl) return;
  
  const energy = getEnergy();
  const production = calculateEnergyProduction();
  const totalProduction = 1.0 + production; // Regen de base + harvesters
  
  // Afficher énergie actuelle et production
  const sign = totalProduction >= 0 ? '+' : '';
  const productionColor = totalProduction >= 0 ? '#00FF88' : '#FF0055';
  
  energyEl.innerHTML = `
    <div style="text-transform: uppercase; letter-spacing: 0.1em; color: #FFD700;">
      SIGNAL STRENGTH: <span style="color: #FFFFFF;">${Math.floor(energy.current)}</span>
    </div>
    <div style="font-size: 11px; color: ${productionColor}; letter-spacing: 0.05em;">
      ${sign}${totalProduction.toFixed(1)}/s
    </div>
  `;
}
