/**
 * Safe Areas - Gestion des encoches et barres de navigation
 * Assure que l'UI n'est pas cachée par les éléments système
 */

// =============================================================================
// CSS SAFE AREAS
// =============================================================================

/**
 * Applique les safe areas CSS aux éléments UI
 */
export function applySafeAreas(): void {
  const style = document.createElement('style');
  style.id = 'safe-areas-style';
  style.textContent = `
    /* Safe areas pour les barres HUD */
    #hud-top {
      padding-top: env(safe-area-inset-top, 0px);
      padding-left: env(safe-area-inset-left, 0px);
      padding-right: env(safe-area-inset-right, 0px);
    }
    
    #hud-bottom {
      padding-bottom: env(safe-area-inset-bottom, 0px);
      padding-left: env(safe-area-inset-left, 0px);
      padding-right: env(safe-area-inset-right, 0px);
    }
    
    /* Safe areas pour les boutons centraux */
    #orbit-view-button {
      top: calc(50% + env(safe-area-inset-top, 0px) / 2);
      margin-top: env(safe-area-inset-top, 0px);
    }
    
    /* Safe areas pour les écrans overlay */
    .screen-overlay {
      padding-top: env(safe-area-inset-top, 0px);
      padding-bottom: env(safe-area-inset-bottom, 0px);
      padding-left: env(safe-area-inset-left, 0px);
      padding-right: env(safe-area-inset-right, 0px);
    }
    
    /* Canvas doit respecter les safe areas */
    #game-canvas {
      padding-top: env(safe-area-inset-top, 0px);
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
  `;
  
  // Supprimer l'ancien style s'il existe
  const existing = document.getElementById('safe-areas-style');
  if (existing) {
    existing.remove();
  }
  
  document.head.appendChild(style);
  console.log('[SafeAreas] Applied CSS safe areas');
}

/**
 * Obtient les dimensions safe (sans les safe areas)
 */
export function getSafeDimensions(): {
  width: number;
  height: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
} {
  // Calculer les safe areas depuis CSS (fallback à 0)
  const style = getComputedStyle(document.documentElement);
  const top = parseFloat(style.getPropertyValue('--safe-area-inset-top') || '0');
  const bottom = parseFloat(style.getPropertyValue('--safe-area-inset-bottom') || '0');
  const left = parseFloat(style.getPropertyValue('--safe-area-inset-left') || '0');
  const right = parseFloat(style.getPropertyValue('--safe-area-inset-right') || '0');

  return {
    width: window.innerWidth - left - right,
    height: window.innerHeight - top - bottom,
    top,
    bottom,
    left,
    right,
  };
}

/**
 * Initialise les safe areas
 */
export function initSafeAreas(): void {
  applySafeAreas();
  
  // Mettre à jour lors du resize
  window.addEventListener('resize', () => {
    applySafeAreas();
  });
  
  console.log('[SafeAreas] Initialized');
}
