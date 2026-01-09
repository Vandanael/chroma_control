/**
 * Chroma Control Interface - UI Futuriste Cyber-Tech
 * Interface de sélection avec design NASA-futurism et effets de glow multicouches
 */

import { PlayerColor, getPlayerColor as getPlayerColorFromConstants } from '../game/constants';
import { setPlayerColor } from '../game/playerColor';
import { setOrbHoverColor } from '../render/orbAnimation';

// =============================================================================
// CONSTANTS
// =============================================================================

const COLORS: Record<PlayerColor, { value: string; name: string }> = {
  CYAN: { value: '#00F3FF', name: 'CYAN' },
  GREEN: { value: '#00FF88', name: 'GREEN' },
  AMBER: { value: '#FFAA00', name: 'AMBER' },
};

const TRANSITION_DURATION = 400; // 0.4s

// =============================================================================
// STATE
// =============================================================================

let activeColor: PlayerColor = 'CYAN';
let isInitialized = false;

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialise l'interface Chroma Control
 */
export function initChromaControlInterface(): void {
  if (isInitialized) return;
  
  // Injecter les styles CSS
  injectChromaControlStyles();
  
  // Créer la structure HTML
  createChromaControlHTML();
  
  // Initialiser les interactions
  setupColorButtons();
  setupStartButton();
  
  // Sélectionner CYAN par défaut
  selectColor('CYAN');
  
  isInitialized = true;
  console.log('[ChromaControlInterface] Initialized');
}

/**
 * Injecte les styles CSS avancés
 */
function injectChromaControlStyles(): void {
  if (document.getElementById('chroma-control-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'chroma-control-styles';
  style.textContent = `
    /* =============================================================================
       CHROMA CONTROL INTERFACE - Cyber-Tech Design
       ============================================================================= */
    
    .chroma-control-container {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #080808;
      z-index: 900;
      overflow: hidden;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    
    /* Overlay Grain (Noise) */
    .chroma-control-container::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
      pointer-events: none;
      z-index: 1;
    }
    
    /* Scanlines (CRT Effect) */
    .chroma-control-container::after {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.15) 0px,
        rgba(0, 0, 0, 0.15) 1px,
        transparent 1px,
        transparent 2px
      );
      pointer-events: none;
      z-index: 2;
      opacity: 0.1;
    }
    
    .chroma-control-inner {
      position: relative;
      z-index: 10;
      max-width: 600px;
      width: 90%;
      padding: 64px 48px;
      background: rgba(8, 8, 8, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      transition: border-color ${TRANSITION_DURATION}ms ease, box-shadow ${TRANSITION_DURATION}ms ease;
    }
    
    /* Glow multicouches pour le container - sera mis à jour dynamiquement */
    .chroma-control-inner {
      box-shadow: 
        0 0 20px rgba(0, 243, 255, 0.15),
        0 0 60px rgba(0, 243, 255, 0.08),
        inset 0 0 40px rgba(0, 243, 255, 0.05);
    }
    
    /* Point chaud intense au centre + diffusion large */
    .chroma-control-inner::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 2px;
      height: 2px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 
        0 0 4px currentColor,
        0 0 8px currentColor,
        0 0 16px currentColor,
        0 0 32px currentColor,
        0 0 64px currentColor,
        0 0 128px rgba(0, 243, 255, 0.15);
      opacity: 0.6;
      pointer-events: none;
      transition: all ${TRANSITION_DURATION}ms ease;
    }
    
    .chroma-control-title {
      font-size: 42px;
      font-weight: 700;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      text-align: center;
      margin-bottom: 16px;
      transition: color ${TRANSITION_DURATION}ms ease, text-shadow ${TRANSITION_DURATION}ms ease;
      font-family: 'Rajdhani', 'Inter', sans-serif;
    }
    
    /* Glow multicouches pour le titre */
    .chroma-control-title {
      text-shadow: 
        0 0 10px currentColor,
        0 0 30px currentColor,
        0 0 60px currentColor,
        0 0 100px rgba(0, 243, 255, 0.3);
    }
    
    .chroma-control-subtitle {
      font-size: 14px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      text-align: center;
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 48px;
      font-weight: 300;
    }
    
    /* Sphère Orbitale */
    .chroma-sphere-container {
      position: relative;
      width: 240px;
      height: 240px;
      margin: 0 auto 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .chroma-sphere {
      position: relative;
      width: 180px;
      height: 180px;
      border-radius: 50%;
      transition: background ${TRANSITION_DURATION}ms ease, box-shadow ${TRANSITION_DURATION}ms ease;
      z-index: 1;
    }
    
    /* Glow multicouches pour la sphère - sera mis à jour dynamiquement */
    .chroma-sphere {
      background: radial-gradient(circle at 30% 30%, currentColor, currentColor40, transparent);
      box-shadow: 
        0 0 40px currentColor,
        0 0 80px currentColor,
        0 0 120px rgba(0, 243, 255, 0.4),
        inset 0 0 60px rgba(255, 255, 255, 0.1);
    }
    
    /* Point chaud au centre de la sphère */
    .chroma-sphere::before {
      content: '';
      position: absolute;
      top: 30%;
      left: 30%;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 
        0 0 20px currentColor,
        0 0 40px currentColor,
        0 0 80px currentColor;
      opacity: 0.8;
      transition: all ${TRANSITION_DURATION}ms ease;
    }
    
    /* Diffusion large autour de la sphère */
    .chroma-sphere::after {
      content: '';
      position: absolute;
      inset: -40px;
      border-radius: 50%;
      background: radial-gradient(circle, currentColor, transparent);
      opacity: 0.15;
      filter: blur(20px);
      transition: all ${TRANSITION_DURATION}ms ease;
      pointer-events: none;
    }
    
    /* Anneau orbital */
    .chroma-orbit-ring {
      position: absolute;
      width: 240px;
      height: 240px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      animation: orbit-rotate 20s linear infinite;
      transition: border-color ${TRANSITION_DURATION}ms ease;
    }
    
    .chroma-orbit-ring::before {
      content: '';
      position: absolute;
      top: -2px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 4px;
      background: currentColor;
      border-radius: 50%;
      box-shadow: 
        0 0 10px currentColor,
        0 0 20px currentColor;
      transition: background ${TRANSITION_DURATION}ms ease, box-shadow ${TRANSITION_DURATION}ms ease;
    }
    
    @keyframes orbit-rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    /* Boutons de couleur - Ghost Buttons */
    .chroma-color-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-bottom: 40px;
    }
    
    .chroma-color-button {
      position: relative;
      padding: 12px 24px;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.7);
      font-family: 'Rajdhani', 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all ${TRANSITION_DURATION}ms ease;
      overflow: hidden;
    }
    
    /* Glow subtil pour les boutons non sélectionnés */
    .chroma-color-button::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 6px;
      opacity: 0;
      transition: opacity ${TRANSITION_DURATION}ms ease;
      pointer-events: none;
    }
    
    .chroma-color-button:hover::before {
      opacity: 0.3;
    }
    
    /* État sélectionné - Remplissage avec dégradé */
    .chroma-color-button.selected {
      border-color: currentColor;
      color: currentColor;
      background: linear-gradient(135deg, currentColor, transparent);
      background-size: 200% 200%;
      background-position: 0% 0%;
    }
    
    .chroma-color-button.selected::before {
      opacity: 1;
      box-shadow: 
        0 0 20px currentColor,
        0 0 40px currentColor,
        inset 0 0 20px rgba(255, 255, 255, 0.1);
    }
    
    /* Glow multicouches pour le bouton sélectionné */
    .chroma-color-button.selected {
      box-shadow: 
        0 0 15px currentColor,
        0 0 30px currentColor,
        0 0 60px rgba(0, 243, 255, 0.3);
    }
    
    /* Bouton START */
    .chroma-start-button {
      width: 100%;
      padding: 18px 32px;
      background: transparent;
      border: 2px solid;
      border-radius: 8px;
      color: currentColor;
      font-family: 'Rajdhani', 'Inter', sans-serif;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all ${TRANSITION_DURATION}ms ease;
      position: relative;
      overflow: hidden;
    }
    
    /* Glow multicouches pour le bouton START */
    .chroma-start-button {
      box-shadow: 
        0 0 20px currentColor,
        0 0 40px currentColor,
        0 0 80px rgba(0, 243, 255, 0.4);
    }
    
    .chroma-start-button::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, currentColor, transparent);
      opacity: 0;
      transition: opacity ${TRANSITION_DURATION}ms ease;
      pointer-events: none;
    }
    
    .chroma-start-button:hover::before {
      opacity: 0.15;
    }
    
    .chroma-start-button:hover {
      transform: translateY(-2px);
      box-shadow: 
        0 0 30px currentColor,
        0 0 60px currentColor,
        0 0 120px rgba(0, 243, 255, 0.6);
    }
    
    .chroma-start-button:active {
      transform: translateY(0);
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .chroma-control-inner {
        padding: 48px 32px;
      }
      
      .chroma-control-title {
        font-size: 32px;
      }
      
      .chroma-sphere-container {
        width: 200px;
        height: 200px;
      }
      
      .chroma-sphere {
        width: 150px;
        height: 150px;
      }
      
      .chroma-orbit-ring {
        width: 200px;
        height: 200px;
      }
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Crée la structure HTML de l'interface
 */
function createChromaControlHTML(): void {
  const startScreen = document.getElementById('start-screen');
  if (!startScreen) return;
  
  // Remplacer le contenu existant
  startScreen.innerHTML = `
    <div class="chroma-control-container">
      <div class="chroma-control-inner" id="chroma-control-inner">
        <h1 class="chroma-control-title" id="chroma-control-title">CHROMA CONTROL</h1>
        <p class="chroma-control-subtitle">Expand your color</p>
        
        <!-- Sphère Orbitale -->
        <div class="chroma-sphere-container">
          <div class="chroma-orbit-ring" id="chroma-orbit-ring"></div>
          <div class="chroma-sphere" id="chroma-sphere"></div>
        </div>
        
        <!-- Boutons de couleur (IDs originaux pour compatibilité) -->
        <div class="chroma-color-buttons">
          <button class="chroma-color-button color-button" id="btn-color-cyan" data-color="CYAN" style="--color: ${COLORS.CYAN.value}">
            ${COLORS.CYAN.name}
          </button>
          <button class="chroma-color-button color-button" id="btn-color-green" data-color="GREEN" style="--color: ${COLORS.GREEN.value}">
            ${COLORS.GREEN.name}
          </button>
          <button class="chroma-color-button color-button" id="btn-color-amber" data-color="AMBER" style="--color: ${COLORS.AMBER.value}">
            ${COLORS.AMBER.name}
          </button>
        </div>
        
        <!-- Bouton START (ID original pour compatibilité) -->
        <button class="chroma-start-button cta-button" id="btn-initiate-signal" style="--color: ${COLORS.CYAN.value}">
          START
        </button>
      </div>
    </div>
  `;
  
  // Ajouter la police Rajdhani si elle n'est pas déjà chargée
  if (!document.getElementById('rajdhani-font')) {
    const link = document.createElement('link');
    link.id = 'rajdhani-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;600;700&display=swap';
    document.head.appendChild(link);
  }
}

/**
 * Configure les boutons de couleur
 */
function setupColorButtons(): void {
  const buttons = document.querySelectorAll('.chroma-color-button, .color-button');
  
  buttons.forEach(button => {
    const buttonEl = button as HTMLElement;
    const color = buttonEl.dataset.color as PlayerColor;
    const colorValue = COLORS[color].value;
    
    // Définir la couleur CSS variable
    buttonEl.style.setProperty('--color', colorValue);
    buttonEl.style.color = colorValue;
    
    // Hover : changer la couleur de la planète
    buttonEl.addEventListener('mouseenter', () => {
      setPlanetHoverColor(colorValue);
    });
    
    buttonEl.addEventListener('mouseleave', () => {
      if (activeColor !== color) {
        setPlanetHoverColor(null);
      }
    });
    
    // Click : sélectionner la couleur
    buttonEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectColor(color);
    });
  });
}

/**
 * Configure le bouton START
 */
function setupStartButton(): void {
  // Le bouton START utilise maintenant l'ID original pour compatibilité
  const startButton = document.getElementById('btn-initiate-signal');
  if (!startButton) {
    console.warn('[ChromaControlInterface] Start button not found');
    return;
  }
  
  // Le système existant dans main.ts écoute déjà sur ce bouton
  // Pas besoin d'ajouter un listener supplémentaire
  console.log('[ChromaControlInterface] Start button configured');
}

/**
 * Sélectionne une couleur et met à jour toute l'interface
 */
function selectColor(color: PlayerColor): void {
  activeColor = color;
  const colorValue = COLORS[color].value;
  
  // Mettre à jour le système de jeu
  setPlayerColor(color);
  setPlanetHoverColor(colorValue);
  
  // Mettre à jour les boutons de couleur
  const buttons = document.querySelectorAll('.chroma-color-button');
  buttons.forEach(btn => {
    const btnEl = btn as HTMLElement;
    const btnColor = btnEl.dataset.color as PlayerColor;
    
    if (btnColor === color) {
      btnEl.classList.add('selected');
      btnEl.style.setProperty('--color', colorValue);
      btnEl.style.color = colorValue;
    } else {
      btnEl.classList.remove('selected');
      btnEl.style.setProperty('--color', COLORS[btnColor].value);
      btnEl.style.color = COLORS[btnColor].value;
    }
  });
  
  // Mettre à jour la sphère
  const sphere = document.getElementById('chroma-sphere');
  if (sphere) {
    sphere.style.background = `radial-gradient(circle at 30% 30%, ${colorValue}, ${colorValue}40, transparent)`;
    sphere.style.setProperty('--color', colorValue);
    sphere.style.color = colorValue;
    
    // Glow multicouches dynamique
    const r = parseInt(colorValue.slice(1, 3), 16);
    const g = parseInt(colorValue.slice(3, 5), 16);
    const b = parseInt(colorValue.slice(5, 7), 16);
    
    sphere.style.boxShadow = `
      0 0 40px ${colorValue},
      0 0 80px ${colorValue},
      0 0 120px rgba(${r}, ${g}, ${b}, 0.4),
      inset 0 0 60px rgba(255, 255, 255, 0.1)
    `;
  }
  
  // Mettre à jour l'anneau orbital
  const orbitRing = document.getElementById('chroma-orbit-ring');
  if (orbitRing) {
    orbitRing.style.borderColor = `${colorValue}33`;
    orbitRing.style.setProperty('--color', colorValue);
    orbitRing.style.color = colorValue;
  }
  
  // Mettre à jour le bouton START (ID original pour compatibilité)
  const startButton = document.getElementById('btn-initiate-signal');
  if (startButton) {
    startButton.style.setProperty('--color', colorValue);
    startButton.style.borderColor = colorValue;
    startButton.style.color = colorValue;
    
    const r = parseInt(colorValue.slice(1, 3), 16);
    const g = parseInt(colorValue.slice(3, 5), 16);
    const b = parseInt(colorValue.slice(5, 7), 16);
    
    startButton.style.boxShadow = `
      0 0 20px ${colorValue},
      0 0 40px ${colorValue},
      0 0 80px rgba(${r}, ${g}, ${b}, 0.4)
    `;
  }
  
  // Mettre à jour le titre
  const title = document.getElementById('chroma-control-title');
  if (title) {
    title.style.color = colorValue;
    const r = parseInt(colorValue.slice(1, 3), 16);
    const g = parseInt(colorValue.slice(3, 5), 16);
    const b = parseInt(colorValue.slice(5, 7), 16);
    
    title.style.textShadow = `
      0 0 10px ${colorValue},
      0 0 30px ${colorValue},
      0 0 60px ${colorValue},
      0 0 100px rgba(${r}, ${g}, ${b}, 0.3)
    `;
  }
  
  // Mettre à jour le container avec point chaud
  const container = document.getElementById('chroma-control-inner');
  if (container) {
    container.style.borderColor = `${colorValue}50`;
    container.style.setProperty('--color', colorValue);
    container.style.color = colorValue;
    
    const r = parseInt(colorValue.slice(1, 3), 16);
    const g = parseInt(colorValue.slice(3, 5), 16);
    const b = parseInt(colorValue.slice(5, 7), 16);
    
    container.style.boxShadow = `
      0 0 20px rgba(${r}, ${g}, ${b}, 0.15),
      0 0 60px rgba(${r}, ${g}, ${b}, 0.08),
      inset 0 0 40px rgba(${r}, ${g}, ${b}, 0.05)
    `;
  }
  
  // Mettre à jour le point chaud du container
  const containerBefore = container?.querySelector('::before');
  if (container) {
    // Le ::before sera mis à jour via CSS variable
    container.style.setProperty('--color', colorValue);
  }
  
  console.log(`[ChromaControlInterface] Color selected: ${color}`);
}

/**
 * Obtient la couleur actuellement sélectionnée
 */
export function getActiveColor(): PlayerColor {
  return activeColor;
}
