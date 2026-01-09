/**
 * Chroma Control - Main Entry Point
 * Bio-Digital Edition
 */

import { initCanvas } from './render/canvas';
import { initTouchInput, onTouchEnd, onUnitChange } from './input/touch';
import { initUnifiedInput } from './input/unifiedInput';
import { initSafeAreas } from './utils/safeAreas';
import { startEngine } from './render/engine';
import { clearRenderCaches } from './render/optimizedWorldRenderer';
import { clearEphemeralConnections } from './render/ephemeralConnections';
import { UnitType } from './types';
import {
  debugEndMatch,
  getScore,
  incrementScore,
  onGameStateChange,
  resetScore,
  setGameState,
  startTimer,
  stopTimer,
  getGameResult,
} from './game/state';
import { setAIEnabled, initAI } from './game/ai';
import { resetNodeSystem } from './game/nodeManager';
import { clearAllSyringes } from './render/syringeRenderer';
import { setPlayerColor } from './game/playerColor';
import { PlayerColor, getPlayerColor as getPlayerColorFromConstants, COLORS } from './game/constants';
import { initOrbAnimation, setOrbHoverColor, triggerOrbZoom } from './render/orbAnimation';
import { initOrbitView } from './ui/orbitView';
import { getVictoryMessage, DEFEAT_MESSAGE, getRandomLoadingMessage } from './narrative/lore';
import { getSelectedColorType, getPlayerColorValue } from './game/playerColor';
import { initVictoryNotification, resetVictoryNotification } from './ui/victoryNotification';
import { RENDERING_CONFIG, UI_CONFIG } from './config';
// PROTOTYPE : testNodeTypes désactivé (types simplifiés)
// import { testNodeTypes } from './game/nodeTypes';
// PROTOTYPE : Node Type Selector désactivé
// import { initNodeTypeSelector } from './ui/nodeTypeSelector';

// =============================================================================
// INITIALIZATION
// =============================================================================

// PROTOTYPE : testNodeTypes désactivé
// (window as any).testNodeTypes = testNodeTypes;

function init(): void {
  console.log('[Chroma Control] Initializing Bio-Digital Edition...');

  // Initialize Canvas
  const canvasContext = initCanvas('game-canvas');
  console.log(
    `[Canvas] Initialized at ${canvasContext.width}x${canvasContext.height} (DPR: ${canvasContext.dpr})`,
  );

  // Initialize Input Systems
  initTouchInput(canvasContext.canvas);

  // Initialiser le système d'input unifié (PointerEvents)
  initUnifiedInput(canvasContext.canvas);
  
  // Initialiser les safe areas (notch, barres de navigation)
  initSafeAreas();
  console.log('[Input] Free-form placement system initialized');

  // Start Render Engine
  startEngine(canvasContext);
  console.log('[Engine] Render loop started');

  // Wire UI Layers (doit être appelé avant setGameState pour que le listener soit enregistré)
  // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt
  requestAnimationFrame(async () => {
    wireUiLayers();

    // DÉSACTIVÉ : Ancienne interface Chroma Control (remplacée par design minimaliste)
    // import('./ui/chromaControlInterface').then(({ initChromaControlInterface }) => {
    //   initChromaControlInterface();
    // });
    
    // Initialiser l'animation de l'orbe (minimaliste retro-futur)
    // Attendre que le DOM soit complètement chargé
    setTimeout(() => {
      initOrbAnimation('planet-animation-container');
    }, 100);
    
    // Initialiser Orbit View
    initOrbitView();
    
    // Initialiser Victory Notification
    initVictoryNotification();
    
    // Initialiser FLUX UI
    import('./ui/fluxUI').then(({ initFluxUI }) => {
      initFluxUI();
    });
    
    // DÉSACTIVÉ : Double-Tap Tutorial (sera réactivé plus tard quand mieux conçu)
    // import('./ui/doubleTapTutorial').then(({ initDoubleTapTutorial }) => {
    //   initDoubleTapTutorial();
    // });
    
    // PROTOTYPE : Node Type Selector désactivé (nœud unique 'Chroma Node')
    // initNodeTypeSelector();
    
    // Initialiser l'audio (asynchrone, ne bloque pas le rendu)
    const { initAudio } = await import('./audio/audioManager');
    initAudio().catch(err => {
      console.warn('[Audio] Failed to initialize audio:', err);
    });
    
    // Afficher un message de chargement aléatoire dans la console
    console.log(`%c${getRandomLoadingMessage()}`, 'color: #00F3FF; font-size: 12px; font-family: monospace;');
    
    // État initial : START (après avoir enregistré le listener)
    setGameState('START');
    
    console.log('[Chroma Control] Bio-Digital Edition Ready!');
  });
}

// =============================================================================
// UI LAYERS (START / REPLAY / DEBUG)
// =============================================================================

function wireUiLayers(): void {
  console.log('[wireUiLayers] Starting UI wiring...');
  const body = document.body;
  const startScreen = document.getElementById('start-screen');
  const gameOverScreen = document.getElementById('game-over-screen');
  const replayScreen = document.getElementById('replay-screen');
  const startButton = document.getElementById('btn-initiate-signal');
  const rebootButton = document.getElementById('btn-reboot-system');
  const replayButton = document.getElementById('btn-replay-signal');
  const replayGameButton = document.getElementById('btn-replay-game');
  const backToMenuButton = document.getElementById('btn-back-to-menu');
  const debugEndButton = document.getElementById('btn-debug-end');
  const replayScoreEl = document.getElementById('replay-score');
  const gameOverTitleEl = document.getElementById('game-over-title');
  const gameOverMessageEl = document.getElementById('game-over-message');
  const statScoreEl = document.getElementById('stat-score');
  const statDurationEl = document.getElementById('stat-duration');
  const statNodesEl = document.getElementById('stat-nodes');
  
  // Boutons de sélection de couleur
  const colorButtons = document.querySelectorAll('.color-button');
  const cyanButton = document.getElementById('btn-color-cyan');
  
  console.log('[wireUiLayers] Elements found:', {
    startScreen: !!startScreen,
    startButton: !!startButton,
    colorButtons: colorButtons.length,
    cyanButton: !!cyanButton,
  });
  
  // Fonction pour mettre à jour le bouton START et le titre avec la couleur sélectionnée (minimaliste)
  function updateStartButtonColor(color: PlayerColor): void {
    if (!startButton) return;
    const colorValue = color === 'CYAN' ? '#00F3FF' : color === 'GREEN' ? '#00FF88' : '#FFAA00';
    const button = startButton as HTMLElement;
    const titleEl = document.getElementById('start-title');
    
    // Mettre à jour le bouton START (pas de glow)
    button.style.borderColor = colorValue;
    button.style.color = colorValue;
    button.style.boxShadow = 'none';
    
    // Hover : fond rempli à 10%
    button.onmouseenter = () => {
      button.style.background = `${colorValue}1A`; // 10% opacité
    };
    button.onmouseleave = () => {
      button.style.background = 'transparent';
    };
    
    // Mettre à jour le titre (pas de glow, pas d'ombre)
    if (titleEl) {
      titleEl.style.color = colorValue;
      titleEl.style.textShadow = 'none';
    }
    
    // Mettre à jour le gradient radial du fond (3-5% opacité max)
    const overlay = startScreen as HTMLElement;
    if (overlay) {
      const r = parseInt(colorValue.slice(1, 3), 16);
      const g = parseInt(colorValue.slice(3, 5), 16);
      const b = parseInt(colorValue.slice(5, 7), 16);
      overlay.style.backgroundImage = `
        radial-gradient(circle at center, rgba(${r}, ${g}, ${b}, 0.04) 0%, transparent 70%),
        url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E")
      `;
    }
  }
  
  // Sélection de couleur
  colorButtons.forEach(button => {
    const buttonEl = button as HTMLElement;
    const color = buttonEl.dataset.color as PlayerColor;
    
    // Hover : changer la couleur de l'orbe
    button.addEventListener('mouseenter', () => {
      const colorValue = getPlayerColorFromConstants(color);
      setOrbHoverColor(colorValue);
    });
    
    button.addEventListener('mouseleave', () => {
      setOrbHoverColor(null);
    });
    
    // Click : sélectionner la couleur
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Sanitisation : valider la couleur avant traitement (protection XSS)
      const validColors: PlayerColor[] = ['CYAN', 'GREEN', 'AMBER'];
      if (!validColors.includes(color as PlayerColor)) {
        console.warn('[Security] Invalid color selection attempted:', color);
        return;
      }
      
      console.log('[StartScreen] Color button clicked:', color);
      setPlayerColor(color);
      
      // Mettre à jour l'état visuel des boutons
      colorButtons.forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
      
      // Mettre à jour le bouton START et l'orbe
      updateStartButtonColor(color);
      const colorValue = getPlayerColorFromConstants(color);
      setOrbHoverColor(colorValue);
    });
  });
  
  // Sélectionner CYAN par défaut
  if (cyanButton) {
    cyanButton.classList.add('selected');
    updateStartButtonColor('CYAN');
    // Mettre à jour le gradient radial du fond au chargement
    const overlay = startScreen as HTMLElement;
    if (overlay) {
      overlay.style.backgroundImage = `
        radial-gradient(circle at center, rgba(0, 243, 255, 0.04) 0%, transparent 70%),
        url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E")
      `;
    }
    console.log('[StartScreen] Default color (CYAN) selected');
  } else {
    console.warn('[StartScreen] Cyan button not found!');
  }
  
  // Vérifier que les boutons sont bien trouvés
  console.log('[StartScreen] Color buttons found:', colorButtons.length);
  console.log('[StartScreen] Start button found:', !!startButton);

  // Reflect game state in DOM (data attribute + visibility)
  onGameStateChange((state, score) => {
    body.setAttribute('data-game-state', state);

    // Afficher/masquer les écrans
    if (startScreen) {
      const isVisible = state === 'START';
      (startScreen as HTMLElement).style.display = isVisible ? 'flex' : 'none';
      
      // L'animation est déjà initialisée dans init(), pas besoin de la réinitialiser ici
    }
    
    // Désactiver les événements pointer sur le canvas quand on n'est pas en jeu
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (canvas) {
      if (state === 'PLAYING') {
        canvas.style.pointerEvents = 'auto';
      } else {
        canvas.style.pointerEvents = 'none';
      }
    }
    if (gameOverScreen) {
      (gameOverScreen as HTMLElement).style.display =
        state === 'GAME_OVER' ? 'flex' : 'none';
    }
    if (replayScreen) {
      (replayScreen as HTMLElement).style.display =
        state === 'REPLAY' ? 'flex' : 'none';
    }

    // Mettre à jour l'écran Game Over selon victoire/défaite
    if (state === 'GAME_OVER') {
      // Obtenir les dimensions du canvas pour calcul de saturation
      const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
      const canvasWidth = canvas?.width || 1920;
      const canvasHeight = canvas?.height || 1080;
      const result = getGameResult(canvasWidth, canvasHeight);
      
      // Mettre à jour le titre
      if (gameOverTitleEl) {
        if (result === 'victory') {
          gameOverTitleEl.textContent = 'VICTOIRE';
          gameOverTitleEl.style.color = getPlayerColorValue();
        } else {
          gameOverTitleEl.textContent = 'DÉFAITE';
          gameOverTitleEl.style.color = COLORS.ENEMY;
        }
      }
      
      // Mettre à jour le message
      if (gameOverMessageEl) {
        if (result === 'victory') {
          const chroma = getSelectedColorType();
          const victory = getVictoryMessage(chroma);
          gameOverMessageEl.textContent = victory.message.replace(/<[^>]*>/g, '');
          gameOverMessageEl.style.color = victory.color;
        } else {
          gameOverMessageEl.textContent = DEFEAT_MESSAGE.message.replace(/<[^>]*>/g, '');
          gameOverMessageEl.style.color = DEFEAT_MESSAGE.color;
        }
      }
      
      // Mettre à jour les stats
      import('./game/state').then(({ getElapsedTimeFormatted, getScore }) => {
        import('./game/territorySystem').then(({ calculateTerritoryPercentage }) => {
          import('./game/nodeManager').then(({ getNodesByOwner }) => {
            const elapsed = getElapsedTimeFormatted();
            const gameScore = getScore();
            const territory = calculateTerritoryPercentage(canvasWidth, canvasHeight);
            const playerNodes = getNodesByOwner('player');
            
            // Score (% territoire)
            if (statScoreEl) {
              statScoreEl.textContent = `${Math.round(territory.player)}%`;
            }
            
            // Durée
            if (statDurationEl) {
              statDurationEl.textContent = `${elapsed.minutes}:${elapsed.seconds.toString().padStart(2, '0')}`;
            }
            
            // Nœuds placés
            if (statNodesEl) {
              statNodesEl.textContent = `${playerNodes.length}`;
            }
          });
        });
      });
      
      // Mettre à jour les boutons
      if (replayGameButton) {
        const colorValue = result === 'victory' ? getPlayerColorValue() : COLORS.ENEMY;
        replayGameButton.style.borderColor = colorValue;
        replayGameButton.style.color = colorValue;
      }
      
      if (backToMenuButton) {
        backToMenuButton.style.borderColor = '#888888';
        backToMenuButton.style.color = '#888888';
      }
      
      // Fade out audio doux en cas de défaite
      if (result === 'defeat') {
        import('./audio/audioManager').then(({ fadeOutAudio }) => {
          fadeOutAudio(1.0); // Fade out sur 1 seconde
        });
      }
    }

    if (replayScoreEl) {
      const total = Math.round(score.nexusPoints || 0);
      replayScoreEl.textContent = `${total.toString().padStart(3, '0')} pts`;
    }
  });

  // START → PLAYING avec transition "DIVE" (fondu 0.5s)
  startButton?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[StartScreen] START button clicked');
    if (!startScreen) {
      console.warn('[StartScreen] Start screen element not found!');
      return;
    }
    
    // Déclencher l'animation de zoom de l'orbe
    triggerOrbZoom();
    
    // Transition de fondu "DIVE"
    startScreen.classList.add('fade-out');
    console.log('[StartScreen] Fade-out transition started');
    
    // Attendre la fin de la transition avant de démarrer le jeu
    setTimeout(() => {
      console.log('[StartScreen] Starting game...');
      // Initialiser le Drop-Pod avec la couleur choisie (déjà fait via setPlayerColor)
      resetScore();
      resetVictoryNotification();
      initAI();
      setAIEnabled(true);
      startTimer();
      setGameState('PLAYING');
    }, RENDERING_CONFIG.diveTransitionDuration);
  });
  
  if (!startButton) {
    console.error('[StartScreen] START button not found in DOM!');
  }

  // GAME OVER → REJOUER (nouveau bouton REJOUER)
  replayGameButton?.addEventListener('click', () => {
    resetScore();
    resetNodeSystem();
    resetVictoryNotification();
    clearAllSyringes();
    clearRenderCaches();
    clearEphemeralConnections();
    setAIEnabled(false);
    stopTimer();
    // Relancer directement une nouvelle partie
    setTimeout(() => {
      initAI();
      setAIEnabled(true);
      startTimer();
      setGameState('PLAYING');
    }, 100);
  });
  
  // GAME OVER → MENU (nouveau bouton MENU)
  backToMenuButton?.addEventListener('click', () => {
    resetScore();
    resetNodeSystem();
    resetVictoryNotification();
    clearAllSyringes();
    clearRenderCaches();
    clearEphemeralConnections();
    setAIEnabled(false);
    stopTimer();
    setGameState('START');
  });
  
  // Legacy: GAME OVER → START (reboot) - gardé pour compatibilité
  rebootButton?.addEventListener('click', () => {
    resetScore();
    resetNodeSystem();
    resetVictoryNotification();
    clearAllSyringes();
    clearRenderCaches();
    clearEphemeralConnections();
    setAIEnabled(false);
    stopTimer();
    setGameState('START');
  });

  // REPLAY → START (retour à l'écran de démarrage)
  replayButton?.addEventListener('click', () => {
    resetScore();
    resetNodeSystem();
    resetVictoryNotification();
    clearAllSyringes();
    clearRenderCaches();
    clearEphemeralConnections();
    setAIEnabled(false);
    stopTimer();
    setGameState('START');
  });

  // Bouton DEBUG pour forcer la fin de match
  debugEndButton?.addEventListener('click', () => {
    debugEndMatch();
  });

  // Touch end → mise à jour du score + éventuelle fin de match auto
  onTouchEnd((state) => {
    console.log(
      `[Touch] End - Duration: ${state.duration.toFixed(
        0,
      )}ms, Unit: ${state.detectedUnit}`,
    );

    if (
      state.detectedUnit === 'scout' ||
      state.detectedUnit === 'defender' ||
      state.detectedUnit === 'attacker'
    ) {
      incrementScore(state.detectedUnit);
    }

    const snapshot = getScore();
    const interactions =
      snapshot.taps + snapshot.defenders + snapshot.attackers;
    if (
      interactions >= UI_CONFIG.minInteractionsForReplay &&
      document.body.getAttribute('data-game-state') === 'PLAYING'
    ) {
      setGameState('REPLAY');
    }
  });

  // Log de changement d'unité (pour ressenti)
  onUnitChange((unit: UnitType, duration: number) => {
    console.log(
      `[Unit] Changed to ${unit.toUpperCase()} at ${duration.toFixed(0)}ms`,
    );
  });
}

// =============================================================================
// STARTUP
// =============================================================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
