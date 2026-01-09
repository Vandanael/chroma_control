/**
 * Low Energy Alert - BLOC 2.4
 * Affiche une alerte quand l'énergie est basse (< 20)
 */

let alertElement: HTMLElement | null = null;
let isAlertVisible = false;

/**
 * Affiche l'alerte basse énergie
 */
export function showLowEnergyAlert(): void {
  if (isAlertVisible) return;
  
  // Créer l'élément d'alerte
  if (!alertElement) {
    alertElement = document.createElement('div');
    alertElement.id = 'low-energy-alert';
    alertElement.style.cssText = `
      position: fixed;
      top: 70px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      background: rgba(255, 0, 85, 0.2);
      border: 2px solid #FF0055;
      border-radius: 8px;
      color: #FF0055;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 12px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      z-index: 1000;
      pointer-events: none;
      backdrop-filter: blur(8px);
      box-shadow: 0 0 20px rgba(255, 0, 85, 0.5);
      animation: pulse-alert 1.5s ease-in-out infinite;
    `;
    alertElement.textContent = '⚠ LOW ENERGY ⚠';
    
    // Ajouter keyframes CSS si pas déjà présent
    if (!document.getElementById('low-energy-alert-styles')) {
      const style = document.createElement('style');
      style.id = 'low-energy-alert-styles';
      style.textContent = `
        @keyframes pulse-alert {
          0%, 100% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
          50% {
            opacity: 0.7;
            transform: translateX(-50%) scale(1.05);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(alertElement);
  }
  
  // Afficher avec animation
  alertElement.style.display = 'block';
  alertElement.style.opacity = '0';
  alertElement.style.transform = 'translateX(-50%) scale(0.9)';
  
  setTimeout(() => {
    if (alertElement) {
      alertElement.style.transition = 'all 0.3s ease-out';
      alertElement.style.opacity = '1';
      alertElement.style.transform = 'translateX(-50%) scale(1)';
    }
  }, 50);
  
  isAlertVisible = true;
}

/**
 * Masque l'alerte basse énergie
 */
export function hideLowEnergyAlert(): void {
  if (!isAlertVisible || !alertElement) return;
  
  alertElement.style.transition = 'all 0.3s ease-out';
  alertElement.style.opacity = '0';
  alertElement.style.transform = 'translateX(-50%) scale(0.9)';
  
  setTimeout(() => {
    if (alertElement) {
      alertElement.style.display = 'none';
    }
    isAlertVisible = false;
  }, 300);
}
