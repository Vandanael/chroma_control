/**
 * Phase Transition System - BLOC 6.3
 * Transitions dramatiques entre phases avec message, son et shake
 */

import { getCurrentGamePhase, getElapsedTime, type GamePhase } from '../game/gamePhases';
import { triggerScreenShake } from '../render/screenShake';

// =============================================================================
// STATE
// =============================================================================

let lastPhase: GamePhase | null = null;
let transitionShown = false;

// =============================================================================
// PHASE TRANSITIONS (BLOC 6.3)
// =============================================================================

/**
 * Vérifie et déclenche les transitions de phase
 */
export function checkPhaseTransitions(): void {
  const currentPhase = getCurrentGamePhase();
  const elapsed = getElapsedTime();
  
  // Première détection de phase
  if (lastPhase === null) {
    lastPhase = currentPhase;
    return;
  }
  
  // Transition détectée
  if (lastPhase !== currentPhase && !transitionShown) {
    showPhaseTransition(currentPhase, elapsed);
    lastPhase = currentPhase;
    transitionShown = true;
    
    // Réinitialiser après 3 secondes
    setTimeout(() => {
      transitionShown = false;
    }, 3000);
  }
}

/**
 * Affiche la transition de phase (BLOC 6.3)
 */
function showPhaseTransition(phase: GamePhase, elapsed: number): void {
  const messages: Record<GamePhase, { title: string; subtitle: string; color: string }> = {
    early: { title: 'EARLY GAME', subtitle: 'Expansion Phase', color: '#00F3FF' },
    mid: { title: 'MID GAME', subtitle: 'Territory War', color: '#FFAA00' },
    late: { title: 'LATE GAME', subtitle: 'Final Push', color: '#FF0055' },
  };
  
  const message = messages[phase];
  
  // Créer l'élément de transition
  let transitionEl = document.getElementById('phase-transition');
  
  if (!transitionEl) {
    transitionEl = document.createElement('div');
    transitionEl.id = 'phase-transition';
    transitionEl.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 2000;
      pointer-events: none;
      text-align: center;
      font-family: 'IBM Plex Mono', monospace;
    `;
    document.body.appendChild(transitionEl);
  }
  
  transitionEl.innerHTML = `
    <div style="
      font-size: 48px;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: ${message.color};
      text-transform: uppercase;
      margin-bottom: 12px;
      text-shadow: 0 0 20px ${message.color};
    ">${message.title}</div>
    <div style="
      font-size: 18px;
      color: #FFFFFF;
      opacity: 0.8;
      letter-spacing: 0.1em;
    ">${message.subtitle}</div>
  `;
  
  // Animation d'apparition
  transitionEl.style.opacity = '0';
  transitionEl.style.transform = 'translate(-50%, -50%) scale(0.8)';
  transitionEl.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
  
  setTimeout(() => {
    if (transitionEl) {
      transitionEl.style.opacity = '1';
      transitionEl.style.transform = 'translate(-50%, -50%) scale(1)';
    }
  }, 50);
  
  // Son dramatique (BLOC 6.3)
  import('../audio/audioManager').then(({ playPhaseTransition }) => {
    playPhaseTransition(phase);
  });
  
  // Screen shake (BLOC 6.3)
  triggerScreenShake(3); // Intensité 3
  
  // Masquer après 2 secondes
  setTimeout(() => {
    if (transitionEl) {
      transitionEl.style.transition = 'all 0.5s ease-out';
      transitionEl.style.opacity = '0';
      transitionEl.style.transform = 'translate(-50%, -50%) scale(0.9)';
      
      setTimeout(() => {
        if (transitionEl) {
          transitionEl.style.display = 'none';
        }
      }, 500);
    }
  }, 2000);
}
