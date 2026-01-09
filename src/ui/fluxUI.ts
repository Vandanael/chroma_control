/**
 * FLUX UI - Indicateur de ressource de combat
 * Affiche le FLUX actuel, le taux de régénération, et les alertes visuelles
 */

import { getFlux } from '../game/fluxSystem';
import { getAllNodes } from '../game/nodeManager';
import { RESOURCES_CONFIG } from '../config';

// =============================================================================
// CONSTANTS
// =============================================================================

const FLUX_REGEN_PER_SECOND = RESOURCES_CONFIG.fluxRegenPerSecond;
const FLUX_PER_NODE = RESOURCES_CONFIG.fluxPerNode;
const DOUBLE_TAP_COST = RESOURCES_CONFIG.doubleTapCost;
const LOW_FLUX_THRESHOLD = RESOURCES_CONFIG.lowFluxThreshold;

// =============================================================================
// STATE
// =============================================================================

let fluxUIElement: HTMLElement | null = null;
let fluxBarElement: HTMLElement | null = null;
let fluxValueElement: HTMLElement | null = null;
let fluxRegenElement: HTMLElement | null = null;
let isInitialized = false;

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialise l'UI du FLUX
 */
export function initFluxUI(): void {
  if (isInitialized) return;
  
  // Créer le conteneur FLUX
  const container = document.createElement('div');
  container.id = 'flux-ui-container';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: none; /* Masqué par défaut, affiché uniquement en PLAYING */
    flex-direction: column;
    align-items: center;
    gap: 8px;
    z-index: 1000;
    pointer-events: none;
    font-family: 'IBM Plex Mono', monospace;
  `;
  
  // Label "FLUX"
  const label = document.createElement('div');
  label.textContent = 'FLUX';
  label.style.cssText = `
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 11px;
    color: #888;
    opacity: 0.7;
  `;
  
  // Barre de FLUX
  const barContainer = document.createElement('div');
  barContainer.style.cssText = `
    width: 200px;
    height: 6px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    overflow: hidden;
    position: relative;
  `;
  
  const bar = document.createElement('div');
  bar.id = 'flux-bar';
  bar.style.cssText = `
    height: 100%;
    width: 50%;
    background: linear-gradient(90deg, #00F3FF, #00FF88);
    transition: width 0.2s ease-out, background 0.3s ease;
    border-radius: 2px;
  `;
  
  barContainer.appendChild(bar);
  
  // Valeur et régénération
  const infoContainer = document.createElement('div');
  infoContainer.style.cssText = `
    display: flex;
    gap: 12px;
    align-items: center;
    font-size: 12px;
  `;
  
  const value = document.createElement('span');
  value.id = 'flux-value';
  value.textContent = '50/100';
  value.style.cssText = `
    color: #00F3FF;
    font-weight: 600;
    min-width: 60px;
    text-align: center;
  `;
  
  const regen = document.createElement('span');
  regen.id = 'flux-regen';
  regen.textContent = '+2.0/s';
  regen.style.cssText = `
    color: #666;
    font-size: 10px;
    opacity: 0.8;
  `;
  
  infoContainer.appendChild(value);
  infoContainer.appendChild(regen);
  
  container.appendChild(label);
  container.appendChild(barContainer);
  container.appendChild(infoContainer);
  
  document.body.appendChild(container);
  
  fluxUIElement = container;
  fluxBarElement = bar;
  fluxValueElement = value;
  fluxRegenElement = regen;
  
  isInitialized = true;
  console.log('[FluxUI] Initialized');
}

// =============================================================================
// UPDATE
// =============================================================================

/**
 * Met à jour l'affichage du FLUX
 */
export function updateFluxUI(): void {
  if (!isInitialized || !fluxUIElement || !fluxBarElement || !fluxValueElement || !fluxRegenElement) {
    return;
  }
  
  // Masquer le FLUX UI si on n'est pas en PLAYING (ne pas afficher sur l'écran titre)
  import('../game/state').then(({ getGameState }) => {
    const gameState = getGameState();
    if (gameState !== 'PLAYING') {
      fluxUIElement!.style.display = 'none';
      return;
    }
    
    // Afficher le FLUX UI uniquement en PLAYING
    fluxUIElement!.style.display = 'flex';
    
    const flux = getFlux();
    const nodeCount = getAllNodes().filter(n => n.owner === 'player').length;
    const regenRate = FLUX_REGEN_PER_SECOND + (nodeCount * FLUX_PER_NODE);
    
    // Mettre à jour la barre
    const percentage = (flux.current / flux.max) * 100;
    fluxBarElement.style.width = `${percentage}%`;
    
    // Changer la couleur selon le niveau
    if (flux.current < LOW_FLUX_THRESHOLD) {
      // Rouge si insuffisant pour Double-Tap
      fluxBarElement.style.background = 'linear-gradient(90deg, #FF0055, #FFAA00)';
      fluxBarElement.style.animation = 'pulse 1s ease-in-out infinite';
    } else {
      // Couleur normale (cyan/vert)
      fluxBarElement.style.background = 'linear-gradient(90deg, #00F3FF, #00FF88)';
      fluxBarElement.style.animation = 'none';
    }
    
    // Mettre à jour la valeur
    fluxValueElement.textContent = `${Math.floor(flux.current)}/${flux.max}`;
    fluxValueElement.style.color = flux.current < LOW_FLUX_THRESHOLD ? '#FF0055' : '#00F3FF';
    
    // Mettre à jour la régénération
    fluxRegenElement.textContent = `+${regenRate.toFixed(1)}/s`;
  });
}

/**
 * Affiche un feedback visuel quand FLUX insuffisant
 */
export function showInsufficientFluxFeedback(): void {
  if (!fluxBarElement) return;
  
  // Animation de shake
  fluxBarElement.style.animation = 'shake 0.3s ease-in-out';
  
  setTimeout(() => {
    if (fluxBarElement) {
      fluxBarElement.style.animation = '';
    }
  }, 300);
}

// =============================================================================
// CSS ANIMATIONS (injectées dans le DOM)
// =============================================================================

/**
 * Injecte les animations CSS nécessaires
 */
function injectAnimations(): void {
  if (document.getElementById('flux-ui-animations')) return;
  
  const style = document.createElement('style');
  style.id = 'flux-ui-animations';
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
  `;
  
  document.head.appendChild(style);
}

// Initialiser les animations au chargement
if (typeof document !== 'undefined') {
  injectAnimations();
}
