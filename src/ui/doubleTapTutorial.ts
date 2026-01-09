/**
 * Double-Tap Tutorial - Tutoriel interactif pour découvrir le Double-Tap
 * Apparaît après 60 secondes de jeu OU lors du premier combat proche
 */

import { getGameState } from '../game/state';
import { getAllNodes, getNodesByOwner } from '../game/nodeManager';
import { getFlux } from '../game/fluxSystem';

// =============================================================================
// CONSTANTS
// =============================================================================

const TUTORIAL_TRIGGER_TIME = 60000; // 60 secondes
const TUTORIAL_COMBAT_DISTANCE = 300; // Distance pour déclencher sur combat proche
const TUTORIAL_DURATION = 10000; // 10 secondes d'affichage
const TUTORIAL_FADE_DURATION = 2000; // 2 secondes de fade-out

// =============================================================================
// STATE
// =============================================================================

let tutorialElement: HTMLElement | null = null;
let tutorialShown = false;
let tutorialStartTime = 0;
let gameStartTime = 0;
let isInitialized = false;

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialise le système de tutoriel
 */
export function initDoubleTapTutorial(): void {
  if (isInitialized) return;
  
  // Créer l'élément de tutoriel
  const container = document.createElement('div');
  container.id = 'double-tap-tutorial';
  container.style.cssText = `
    position: fixed;
    bottom: 120px;
    left: 50%;
    transform: translateX(-50%);
    display: none;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    z-index: 1001;
    pointer-events: none;
    font-family: 'IBM Plex Mono', monospace;
    background: rgba(18, 18, 20, 0.95);
    border: 2px solid rgba(0, 243, 255, 0.6);
    border-radius: 12px;
    padding: 20px 30px;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 20px rgba(0, 243, 255, 0.4);
  `;
  
  // Icône de double-tap
  const icon = document.createElement('div');
  icon.textContent = '👆👆';
  icon.style.cssText = `
    font-size: 32px;
    margin-bottom: 8px;
    animation: bounce 1s ease-in-out infinite;
  `;
  
  // Titre
  const title = document.createElement('div');
  title.textContent = 'DOUBLE-TAP';
  title.style.cssText = `
    text-transform: uppercase;
    letter-spacing: 0.15em;
    font-size: 14px;
    font-weight: 600;
    color: #00F3FF;
    margin-bottom: 4px;
  `;
  
  // Description
  const description = document.createElement('div');
  description.textContent = 'Double-cliquez sur un nœud allié pour déclencher une onde de choc (30 FLUX)';
  description.style.cssText = `
    font-size: 11px;
    color: #AAA;
    text-align: center;
    line-height: 1.4;
    max-width: 300px;
  `;
  
  // Indicateur FLUX
  const fluxInfo = document.createElement('div');
  fluxInfo.id = 'tutorial-flux-info';
  fluxInfo.textContent = 'FLUX requis: 30';
  fluxInfo.style.cssText = `
    font-size: 10px;
    color: #666;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  `;
  
  container.appendChild(icon);
  container.appendChild(title);
  container.appendChild(description);
  container.appendChild(fluxInfo);
  
  document.body.appendChild(container);
  
  tutorialElement = container;
  
  // Injecter les animations CSS
  injectTutorialAnimations();
  
  isInitialized = true;
  console.log('[DoubleTapTutorial] Initialized');
}

/**
 * Injecte les animations CSS nécessaires
 */
function injectTutorialAnimations(): void {
  if (document.getElementById('double-tap-tutorial-animations')) return;
  
  const style = document.createElement('style');
  style.id = 'double-tap-tutorial-animations';
  style.textContent = `
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateX(-50%) translateY(20px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    
    @keyframes fadeOut {
      from { opacity: 1; transform: translateX(-50%) translateY(0); }
      to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
  `;
  
  document.head.appendChild(style);
}

// =============================================================================
// UPDATE
// =============================================================================

/**
 * Met à jour le système de tutoriel
 */
export function updateDoubleTapTutorial(): void {
  if (!isInitialized || tutorialShown) return;
  
  const gameState = getGameState();
  if (gameState !== 'PLAYING') {
    gameStartTime = 0;
    return;
  }
  
  // Initialiser le temps de début de partie
  if (gameStartTime === 0) {
    gameStartTime = performance.now();
  }
  
  const elapsed = performance.now() - gameStartTime;
  
  // Vérifier les conditions de déclenchement
  const shouldShow = 
    elapsed >= TUTORIAL_TRIGGER_TIME || // 60 secondes écoulées
    isCombatNearby(); // Combat proche détecté
  
  if (shouldShow && !tutorialShown) {
    showTutorial();
  }
  
  // Mettre à jour l'affichage si le tutoriel est actif
  if (tutorialShown && tutorialElement) {
    const age = performance.now() - tutorialStartTime;
    
    // Mettre à jour l'info FLUX
    const fluxInfo = document.getElementById('tutorial-flux-info');
    if (fluxInfo) {
      const flux = getFlux();
      const canAfford = flux.current >= 30;
      fluxInfo.textContent = `FLUX requis: 30 (${Math.floor(flux.current)} disponible)`;
      fluxInfo.style.color = canAfford ? '#00FF88' : '#FF0055';
    }
    
    // Fade-out après la durée
    if (age >= TUTORIAL_DURATION) {
      hideTutorial();
    } else if (age >= TUTORIAL_DURATION - TUTORIAL_FADE_DURATION) {
      // Commencer le fade-out
      const fadeProgress = (age - (TUTORIAL_DURATION - TUTORIAL_FADE_DURATION)) / TUTORIAL_FADE_DURATION;
      if (tutorialElement) {
        tutorialElement.style.opacity = String(1 - fadeProgress);
      }
    }
  }
}

/**
 * Vérifie si un combat est proche (nœuds joueur et ennemi à moins de 300px)
 */
function isCombatNearby(): boolean {
  const playerNodes = getNodesByOwner('player');
  const enemyNodes = getNodesByOwner('enemy');
  
  for (const playerNode of playerNodes) {
    for (const enemyNode of enemyNodes) {
      const dx = playerNode.x - enemyNode.x;
      const dy = playerNode.y - enemyNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < TUTORIAL_COMBAT_DISTANCE) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Affiche le tutoriel
 */
function showTutorial(): void {
  if (!tutorialElement || tutorialShown) return;
  
  tutorialShown = true;
  tutorialStartTime = performance.now();
  
  tutorialElement.style.display = 'flex';
  tutorialElement.style.animation = 'fadeIn 0.5s ease-out';
  tutorialElement.style.opacity = '1';
  
  console.log('[DoubleTapTutorial] Tutorial shown');
}

/**
 * Cache le tutoriel
 */
function hideTutorial(): void {
  if (!tutorialElement) return;
  
  tutorialElement.style.animation = 'fadeOut 0.5s ease-in';
  tutorialElement.style.opacity = '0';
  
  setTimeout(() => {
    if (tutorialElement) {
      tutorialElement.style.display = 'none';
    }
  }, 500);
}

/**
 * Marque le tutoriel comme complété (après premier Double-Tap réussi)
 */
export function markTutorialCompleted(): void {
  if (tutorialShown && tutorialElement) {
    hideTutorial();
    console.log('[DoubleTapTutorial] Tutorial completed');
  }
}

/**
 * Réinitialise le tutoriel (pour nouvelle partie)
 */
export function resetTutorial(): void {
  tutorialShown = false;
  tutorialStartTime = 0;
  gameStartTime = 0;
  
  if (tutorialElement) {
    tutorialElement.style.display = 'none';
    tutorialElement.style.opacity = '1';
  }
}
