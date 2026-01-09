/**
 * Orbit View - Navigation vers l'espace
 * Apparaît après 70% de saturation planétaire
 */

import { calculateSaturation } from '../game/saturationSystem';
import { getSelectedColorType } from '../game/playerColor';
import { getOrbitViewMessage } from '../narrative/lore';
import { showVictoryMessage } from './victoryNotification';

// =============================================================================
// STATE
// =============================================================================

let orbitViewButton: HTMLElement | null = null;
let isOrbitViewAvailable = false;

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialise le bouton Orbit View
 */
export function initOrbitView(): void {
  orbitViewButton = document.getElementById('orbit-view-button');
  
  if (!orbitViewButton) {
    console.warn('[OrbitView] Button not found');
    return;
  }

  // Listener pour le clic
  orbitViewButton.addEventListener('click', () => {
    if (isOrbitViewAvailable) {
      triggerOrbitView();
    }
  });

  console.log('[OrbitView] Initialized');
}

/**
 * Met à jour la disponibilité du bouton Orbit View
 */
export function updateOrbitViewAvailability(canvasWidth: number, canvasHeight: number): void {
  if (!orbitViewButton) return;

  const saturation = calculateSaturation('player', canvasWidth, canvasHeight);
  
  import('../config').then(({ UI_CONFIG }) => {
    // Afficher le bouton si saturation >= seuil
    if (saturation >= UI_CONFIG.orbitViewSaturationThreshold && !isOrbitViewAvailable) {
      isOrbitViewAvailable = true;
      orbitViewButton.style.display = 'block';
      
      // Animation d'apparition
      orbitViewButton.style.opacity = '0';
      orbitViewButton.style.transform = 'translate(-50%, -50%) scale(0.8)';
      
      setTimeout(() => {
        orbitViewButton!.style.transition = 'all 0.5s ease-out';
        orbitViewButton!.style.opacity = '1';
        orbitViewButton!.style.transform = 'translate(-50%, -50%) scale(1)';
      }, 100);
      
      // Afficher le message de victoire
      showVictoryMessage();
      
      console.log(`[OrbitView] Button now available (${UI_CONFIG.orbitViewSaturationThreshold * 100}% saturation reached)`);
    } else if (saturation < UI_CONFIG.orbitViewSaturationThreshold && isOrbitViewAvailable) {
      // Masquer si la saturation redescend
      isOrbitViewAvailable = false;
      orbitViewButton.style.display = 'none';
    }
  });
}

/**
 * Déclenche la transition vers Orbit View
 */
function triggerOrbitView(): void {
  console.log('[OrbitView] Transitioning to orbit...');
  
  const chroma = getSelectedColorType();
  const message = getOrbitViewMessage(chroma);
  
  // Animation de zoom out
  if (orbitViewButton) {
    orbitViewButton.style.transition = 'all 1s ease-in';
    orbitViewButton.style.transform = 'translate(-50%, -50%) scale(0)';
    orbitViewButton.style.opacity = '0';
  }

  // Afficher le message narratif
  setTimeout(() => {
    // Créer un overlay pour le message
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(18, 18, 20, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      flex-direction: column;
      gap: 24px;
    `;
    
    const titleEl = document.createElement('div');
    titleEl.textContent = '⬆ ORBIT VIEW ⬆';
    titleEl.style.cssText = `
      font-size: 32px;
      font-family: monospace;
      letter-spacing: 0.2em;
      color: #00F3FF;
      text-transform: uppercase;
    `;
    
    const messageEl = document.createElement('div');
    messageEl.innerHTML = message;
    messageEl.style.cssText = `
      font-size: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #FFFFFF;
      text-align: center;
      line-height: 1.6;
      max-width: 600px;
      padding: 0 20px;
    `;
    
    overlay.appendChild(titleEl);
    overlay.appendChild(messageEl);
    document.body.appendChild(overlay);
    
    // Retirer après 4 secondes
    setTimeout(() => {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 1s';
      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 1000);
    }, 4000);
    
    // Réinitialiser le bouton
    if (orbitViewButton) {
      orbitViewButton.style.display = 'none';
      orbitViewButton.style.transform = 'translate(-50%, -50%) scale(1)';
      orbitViewButton.style.opacity = '1';
    }
  }, 1000);
}
