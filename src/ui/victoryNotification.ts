/**
 * Victory Notification - Message à 70% de saturation
 * Affiche un message narratif spécifique à la couleur choisie
 */

import { getSelectedColorType } from '../game/playerColor';
import { getVictoryMessage } from '../narrative/lore';

// =============================================================================
// STATE
// =============================================================================

let hasShownVictoryMessage = false;
let notificationElement: HTMLElement | null = null;

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialise le système de notification de victoire
 */
export function initVictoryNotification(): void {
  // Créer l'élément de notification
  notificationElement = document.createElement('div');
  notificationElement.id = 'victory-notification';
  notificationElement.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: none;
    padding: 32px 48px;
    background: rgba(18, 18, 20, 0.95);
    border: 2px solid;
    border-radius: 8px;
    text-align: center;
    z-index: 2000;
    pointer-events: none;
    font-family: 'IBM Plex Mono', monospace;
    box-shadow: 0 0 60px rgba(0, 243, 255, 0.5);
    transition: all 0.5s ease-out;
  `;
  
  document.body.appendChild(notificationElement);
  console.log('[VictoryNotification] Initialized');
}

/**
 * Affiche le message de victoire à 70% de saturation
 */
export function showVictoryMessage(): void {
  if (hasShownVictoryMessage || !notificationElement) return;
  
  const chroma = getSelectedColorType();
  const victory = getVictoryMessage(chroma);
  
  // Configurer le style selon la couleur
  notificationElement.style.borderColor = victory.color;
  notificationElement.style.boxShadow = `0 0 60px ${victory.color}80`;
  
  // Créer le contenu
  const titleEl = document.createElement('div');
  titleEl.textContent = victory.title;
  titleEl.style.cssText = `
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: ${victory.color};
    text-transform: uppercase;
    margin-bottom: 16px;
  `;
  
  const messageEl = document.createElement('div');
  messageEl.innerHTML = victory.message;
  messageEl.style.cssText = `
    font-size: 14px;
    line-height: 1.6;
    color: #FFFFFF;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;
  
  notificationElement.innerHTML = '';
  notificationElement.appendChild(titleEl);
  notificationElement.appendChild(messageEl);
  
  // Afficher avec animation
  notificationElement.style.display = 'block';
  notificationElement.style.opacity = '0';
  notificationElement.style.transform = 'translate(-50%, -50%) scale(0.8)';
  
  setTimeout(() => {
    notificationElement!.style.opacity = '1';
    notificationElement!.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 100);
  
  // Masquer après 5 secondes
  setTimeout(() => {
    notificationElement!.style.opacity = '0';
    notificationElement!.style.transform = 'translate(-50%, -50%) scale(0.9)';
    setTimeout(() => {
      notificationElement!.style.display = 'none';
      hasShownVictoryMessage = true;
    }, 500);
  }, 5000);
  
  console.log(`[VictoryNotification] Victory message shown for ${chroma}`);
}

/**
 * Réinitialise le système (pour nouvelle partie)
 */
export function resetVictoryNotification(): void {
  hasShownVictoryMessage = false;
  if (notificationElement) {
    notificationElement.style.display = 'none';
  }
}
