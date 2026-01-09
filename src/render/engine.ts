/**
 * Render Engine - Bio-Digital "Free-Form" Edition
 * Game Loop pour système de placement libre
 */

import { CanvasContext, DebugState, TouchState } from '../types';
import { clearCanvas } from './canvas';
import { updateTouchState, getInputLatency } from '../input/touch';
import { initNodeSystem, getAllNodes, getNodesByOwner } from '../game/nodeManager';
import { renderWorld } from './worldRenderer';
import { renderWorldOptimized } from './optimizedWorldRenderer';
import { markAllDirty } from './dirtyRectangles';
import { updateScreenShake } from './screenShake';
import { updateAmbientSaturation } from '../audio/audioManager';
import { calculateSaturation } from '../game/saturationSystem';
import { 
  regenEnergy, 
  updateTimer, 
  getTimer, 
  updateTerritoryScore, 
  checkVictoryConditions,
  getGameState
} from '../game/state';
import { renderLowPowerFeedback } from './lowPowerFeedback';
import { updateAI, updateAICanvasDimensions } from '../game/ai';
import { updateSurvivalSystem } from '../game/survivalSystem';
import { updateSyringeAnimations, renderSyringes } from './syringeRenderer';
import { getPredictiveLineInfo } from '../input/unifiedInput';
import { initUIRenderer, updateHUD, updateTimerDisplay } from './uiRenderer';
import { getPlayerColorValue } from '../game/playerColor';
import { updateOrbitViewAvailability } from '../ui/orbitView';

// =============================================================================
// STATE
// =============================================================================

const debugState: DebugState = {
  fps: 0,
  frameCount: 0,
  lastFpsUpdate: 0,
  pressTime: 0,
  detectedUnit: 'none',
  inputLatency: 0,
  state: 'IDLE',
};

let animationFrameId: number | null = null;
let canvasContext: CanvasContext | null = null;
let lastTimestamp: number = 0;

// =============================================================================
// FPS TRACKING
// =============================================================================

function updateFPS(timestamp: number): void {
  debugState.frameCount++;

  if (timestamp - debugState.lastFpsUpdate >= 1000) {
    debugState.fps = debugState.frameCount * 1000 / (timestamp - debugState.lastFpsUpdate);
    debugState.frameCount = 0;
    debugState.lastFpsUpdate = timestamp;
  }
}

// =============================================================================
// DEBUG OVERLAY
// =============================================================================

function updateDebugOverlay(touchState: TouchState): void {
  // FPS
  const fpsEl = document.getElementById('debug-fps');
  if (fpsEl) {
    fpsEl.textContent = debugState.fps.toFixed(0);
  }

  // Press Time (HOLD)
  const pressTimeEl = document.getElementById('debug-press-time');
  if (pressTimeEl) {
    pressTimeEl.textContent = Math.floor(touchState.duration).toString();
  }

  // Input Latency (IN)
  const latencyEl = document.getElementById('debug-latency');
  if (latencyEl) {
    latencyEl.textContent = debugState.inputLatency.toFixed(1);
  }
}

// =============================================================================
// MAIN RENDER LOOP
// =============================================================================

// Import lazy pour éviter circular dependency
let updateSelectorEnergyStateFn: (() => void) | null = null;

function render(timestamp: number): void {
  if (!canvasContext) return;

  const { ctx, width, height } = canvasContext;

  // Calculate delta time
  const deltaSeconds = lastTimestamp > 0 ? (timestamp - lastTimestamp) / 1000 : 0;
  lastTimestamp = timestamp;

  // Update FPS
  updateFPS(timestamp);

  // Only update game logic if PLAYING
  const gameState = getGameState();
  const isPlaying = gameState === 'PLAYING';

  // Arrêter la boucle si on est en START ou GAME_OVER
  if (gameState === 'START' || gameState === 'GAME_OVER') {
    // Continuer le rendu mais ne pas mettre à jour la logique
    clearCanvas(ctx, width, height);
    const nodes = getAllNodes();
    if (nodes.length === 0) {
      initNodeSystem(width, height);
    }
    renderWorld(ctx);
    animationFrameId = requestAnimationFrame(render);
    return;
  }

  if (isPlaying && deltaSeconds > 0 && deltaSeconds < 0.1) {
    // Regenerate energy
    regenEnergy(deltaSeconds);

    // Update FLUX system
    import('../game/fluxSystem').then(({ regenFlux }) => {
      const nodeCount = getAllNodes().filter(n => n.owner === 'player').length;
      regenFlux(deltaSeconds, nodeCount);
    });
    
    // Update FLUX UI
    import('../ui/fluxUI').then(({ updateFluxUI }) => {
      updateFluxUI();
    });

    // Update signal injection cleanup
    import('../game/signalInjection').then(({ cleanupInjections }) => {
      cleanupInjections(performance.now());
    });

    // Update territory grind system
    import('../game/territoryGrind').then(({ updateTerritoryGrind }) => {
      updateTerritoryGrind(deltaSeconds, width, height);
    });

    // Update territory dissolution particles
    import('../render/territoryDissolution').then(({ updateTerritoryDissolution }) => {
      updateTerritoryDissolution(deltaSeconds);
    });

    // Update double-tap burst waves
    import('../game/doubleTapBurst').then(({ updateBurstWaves }) => {
      updateBurstWaves(deltaSeconds);
    });

    // Update border sparkles
    import('../render/borderSparkles').then(({ updateBorderSparkles }) => {
      updateBorderSparkles(deltaSeconds);
    });

    // Update border tension audio
    import('../game/borderPressure').then(({ calculateActiveBorderLength, calculateAveragePressure }) => {
      import('../game/borderPressure').then(({ calculateBorderSegments }) => {
        const borderLength = calculateActiveBorderLength();
        const averagePressure = calculateAveragePressure();
        const segments = calculateBorderSegments();
        const averageForceRatio = segments.length > 0
          ? segments.reduce((sum, seg) => sum + seg.forceRatio, 0) / segments.length
          : 0;
        
        import('../audio/audioManager').then(({ updateBorderTensionAudio }) => {
          if (borderLength > 0 && averagePressure > 0.1) {
            updateBorderTensionAudio(borderLength, averagePressure, averageForceRatio);
          } else {
            import('../audio/audioManager').then(({ stopBorderTensionAudio }) => {
              stopBorderTensionAudio();
            });
          }
        });
      });
    });

    // Update Double-Tap tutorial
    import('../ui/doubleTapTutorial').then(({ updateDoubleTapTutorial }) => {
      updateDoubleTapTutorial();
    });

    // Update timer
    updateTimer(timestamp);

    // Update survival system (Le Cordon)
    updateSurvivalSystem(deltaSeconds);

    // Update territory score (basé sur % territoire réel, pas nombre de nœuds)
    updateTerritoryScore(width, height, deltaSeconds);

    // Check victory conditions (avec dimensions canvas pour saturation)
    checkVictoryConditions(width, height);
  }

  // Update touch state
  const touchState = updateTouchState();

  // PROTOTYPE : Debug state désactivé pour version Review
  // Update debug state
  // debugState.inputLatency = getInputLatency();
  // debugState.pressTime = touchState.duration;
  // debugState.detectedUnit = touchState.detectedUnit;
  // debugState.state = touchState.active ? 'PRESSING' : 'IDLE';

  // Mettre à jour le screen shake
  const shake = updateScreenShake();
  
  // Clear canvas with Deep Space background
  clearCanvas(ctx, width, height);

  // Appliquer le shake au contexte
  if (shake.x !== 0 || shake.y !== 0) {
    ctx.save();
    ctx.translate(shake.x, shake.y);
  }

  // Initialize node system if needed
  const nodes = getAllNodes();
  if (nodes.length === 0) {
    initNodeSystem(width, height);
    markAllDirty(width, height); // Full redraw après init
  } else {
    // Marquer régions sales pour nœuds qui bougent (future optimisation)
    // Pour l'instant, on fait un full redraw chaque frame
    markAllDirty(width, height);
  }

  // Update syringe animations
  updateSyringeAnimations();

  // Update AI (avec dimensions pour calcul saturation)
  if (isPlaying) {
    updateAICanvasDimensions(width, height);
    updateAI();
  }

  // Render world (version optimisée avec batching)
  renderWorldOptimized(ctx, width, height);
  
  // Render ephemeral connections (feedback éphémère 500ms)
  if (isPlaying) {
    import('../render/ephemeralConnections').then(({ renderEphemeralConnections }) => {
      renderEphemeralConnections(ctx);
    });
  }
  
  // Render territory overlay (BLOC 5.2)
  if (isPlaying) {
    import('../render/territoryRenderer').then(({ renderTerritoryOverlay }) => {
      renderTerritoryOverlay(ctx, width, height);
    });
  }

  // Render syringe animations
  renderSyringes(ctx);
  
  // Render disruption pulse effects (BLOC 3.6)
  import('../render/disruptionPulseEffect').then(({ renderDisruptionPulses }) => {
    renderDisruptionPulses(ctx);
  });
  
  // SPRINT 1 : Render particles (Triple Impact)
  import('../render/particles').then(({ renderParticles, updateParticles }) => {
    if (isPlaying && deltaSeconds > 0 && deltaSeconds < 0.1) {
      updateParticles(deltaSeconds);
    }
    renderParticles(ctx);
  });
  
  // Render contested borders (BLOC 5.3)
  if (isPlaying) {
    import('../render/territoryRenderer').then(({ renderContestedBorders }) => {
      renderContestedBorders(ctx, width, height);
    });
  }

  // Render border sparkles (particules de scintillement sur frontières)
  if (isPlaying) {
    import('../render/borderSparkles').then(({ renderBorderSparkles }) => {
      renderBorderSparkles(ctx);
    });
  }

  // Render territory dissolution (particules de grignotage)
  if (isPlaying) {
    import('../render/territoryDissolution').then(({ renderTerritoryDissolution }) => {
      renderTerritoryDissolution(ctx);
    });
  }

  // Render burst waves (ondes de choc du double-tap)
  if (isPlaying) {
    import('../game/doubleTapBurst').then(({ getActiveBursts }) => {
      const bursts = getActiveBursts();
      if (bursts.length > 0) {
        renderBurstWaves(ctx, bursts);
      }
    });
  }

  // Render predictive line (ligne prédictive au survol)
  renderPredictiveLine(ctx);
  
  // PROTOTYPE : Afficher coût discret à côté du curseur
  if (isPlaying) {
    renderCostIndicator(ctx);
  }
  
  // Render signal range visualization (BLOC 1.6)
  if (isPlaying) {
    import('../render/signalRangeVisualizer').then(({ renderSignalRange }) => {
      renderSignalRange(ctx);
    });
  }
  
  // SPRINT 1 : Render Drop-Pod waves (onde de guidage)
  if (isPlaying) {
    import('../render/dropPodWave').then(({ renderDropPodWaves }) => {
      renderDropPodWaves(ctx);
    });
  }
  
  // SPRINT 1 : Render Drop-Pod waves (onde de guidage)
  if (isPlaying) {
    import('../render/dropPodWave').then(({ renderDropPodWaves }) => {
      renderDropPodWaves(ctx);
    });
  }

  // Update HUD (DOM-based Cockpit)
  const timer = getTimer();
  updateTimerDisplay(timer.minutes, timer.seconds);
  updateHUD();
  
  // PROTOTYPE : Node Type Selector désactivé
  // Update Node Type Selector energy state (BLOC 1.4)
  // if (isPlaying) {
  //   if (!updateSelectorEnergyStateFn) {
  //     import('../ui/nodeTypeSelector').then(({ updateSelectorEnergyState }) => {
  //       updateSelectorEnergyStateFn = updateSelectorEnergyState;
  //     });
  //   }
  //   if (updateSelectorEnergyStateFn) {
  //     updateSelectorEnergyStateFn();
  //   }
  // }
  
  // Update Orbit View availability (70% saturation)
  if (isPlaying) {
    updateOrbitViewAvailability(width, height);
    
    // Mettre à jour l'ambiance sonore selon la saturation
    const playerSaturation = calculateSaturation('player', width, height);
    updateAmbientSaturation(playerSaturation);
    
    // Vérifier transitions de phase (BLOC 6.3)
    import('../ui/phaseTransition').then(({ checkPhaseTransitions }) => {
      checkPhaseTransitions();
    });
  }

  // Render LOW POWER feedback
  renderLowPowerFeedback(ctx, width, height);

  // PROTOTYPE : Debug overlay désactivé pour version Review
  // updateDebugOverlay(touchState);

  // Continue loop
  animationFrameId = requestAnimationFrame(render);
}

// =============================================================================
// PREDICTIVE LINE RENDERING
// =============================================================================

// Import lazy pour éviter circular dependency
let calculateSignalRangeFn: ((owner: 'player' | 'enemy') => number) | null = null;

/**
 * Rend la ligne prédictive au survol
 * SPRINT 1 : Ligne qui s'étire jusqu'à la limite max quand hors portée
 */
function renderPredictiveLine(ctx: CanvasRenderingContext2D): void {
  const lineInfo = getPredictiveLineInfo();
  if (!lineInfo) return;

  // Charger la fonction de calcul de portée
  if (!calculateSignalRangeFn) {
    import('../game/signalPhysics').then(({ calculateSignalRange }) => {
      calculateSignalRangeFn = calculateSignalRange;
    });
  }

  ctx.save();
  
  // Utiliser l'offset de placement sur mobile
  const endX = lineInfo.placementOffset ? lineInfo.endX + lineInfo.placementOffset.x : lineInfo.endX;
  const endY = lineInfo.placementOffset ? lineInfo.endY + lineInfo.placementOffset.y : lineInfo.endY;
  
  // SPRINT 1 : Calculer la limite max de portée
  let actualEndX = endX;
  let actualEndY = endY;
  const isOutOfRange = !lineInfo.valid;
  
  if (isOutOfRange && calculateSignalRangeFn) {
    // Calculer la distance depuis le nœud de départ
    const dx = endX - lineInfo.startX;
    const dy = endY - lineInfo.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Récupérer la portée maximale du signal
    const maxRange = calculateSignalRangeFn('player');
    
    // Calculer la position à la limite max
    if (distance > maxRange) {
      const angle = Math.atan2(dy, dx);
      actualEndX = lineInfo.startX + Math.cos(angle) * maxRange;
      actualEndY = lineInfo.startY + Math.sin(angle) * maxRange;
    }
    
    // SPRINT 1 : Ligne rouge pulsante qui s'affine (effet élastique)
    const now = performance.now();
    const pulseSpeed = 0.008; // Vitesse de pulsation
    const pulse = Math.sin(now * pulseSpeed) * 0.3 + 0.7; // 0.4 à 1.0
    
    ctx.strokeStyle = '#FF0055';
    ctx.globalAlpha = pulse * 0.8; // Pulsation d'opacité
    ctx.lineWidth = Math.max(1, 3 * (1 - pulse * 0.5)); // S'affine avec la pulsation (effet élastique)
    ctx.setLineDash([6, 3]); // Pointillés plus espacés
    
    // Dessiner la ligne jusqu'à la limite
    ctx.beginPath();
    ctx.moveTo(lineInfo.startX, lineInfo.startY);
    ctx.lineTo(actualEndX, actualEndY);
    ctx.stroke();
    
    // Indicateur "MAX RANGE" à la fin de la ligne
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#FF0055';
    ctx.beginPath();
    ctx.arc(actualEndX, actualEndY, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Cercle de limite
    ctx.strokeStyle = '#FF0055';
    ctx.lineWidth = 1;
    ctx.globalAlpha = pulse * 0.3;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    const maxRangeVisual = Math.sqrt((actualEndX - lineInfo.startX) ** 2 + (actualEndY - lineInfo.startY) ** 2);
    ctx.arc(lineInfo.startX, lineInfo.startY, maxRangeVisual, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Ligne normale si dans la portée
    ctx.strokeStyle = getPlayerColorValue();
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    
    ctx.beginPath();
    ctx.moveTo(lineInfo.startX, lineInfo.startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Indicateur visuel de placement sur mobile
    if (lineInfo.placementOffset) {
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = getPlayerColorValue();
      ctx.beginPath();
      ctx.arc(endX, endY, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// =============================================================================
// BURST WAVES RENDERING
// =============================================================================

/**
 * Rend les ondes de choc du double-tap burst
 */
function renderBurstWaves(ctx: CanvasRenderingContext2D, bursts: Array<{ x: number; y: number; radius: number; maxRadius: number }>): void {
  ctx.save();
  
  for (const burst of bursts) {
    const progress = burst.radius / burst.maxRadius;
    const opacity = (1 - progress) * 0.6; // Fade-out progressif
    
    // Cercle de l'onde
    ctx.strokeStyle = getPlayerColorValue();
    ctx.lineWidth = 3;
    ctx.globalAlpha = opacity;
    ctx.setLineDash([]);
    
    ctx.beginPath();
    ctx.arc(burst.x, burst.y, burst.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Cercle intérieur (plus lumineux)
    ctx.globalAlpha = opacity * 0.5;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(burst.x, burst.y, burst.radius * 0.8, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  ctx.restore();
}

// =============================================================================
// COST INDICATOR (PROTOTYPE)
// =============================================================================

// Lazy import pour NODE_TYPES
let nodeTypesCache: typeof import('../game/nodeTypes') | null = null;

/**
 * PROTOTYPE : Affiche un indicateur de coût discret à côté du curseur
 */
function renderCostIndicator(ctx: CanvasRenderingContext2D): void {
  const lineInfo = getPredictiveLineInfo();
  if (!lineInfo || !lineInfo.valid) return; // Seulement si dans la portée
  
  // Charger NODE_TYPES si nécessaire
  if (!nodeTypesCache) {
    import('../game/nodeTypes').then((module) => {
      nodeTypesCache = module;
    });
    return; // Skip cette frame, affichera au prochain
  }
  
  const nodeType = 'relay';
  const typeData = nodeTypesCache.NODE_TYPES[nodeType];
  const cost = typeData.cost;
  
  // Position à côté du curseur (offset)
  const offsetX = lineInfo.placementOffset ? lineInfo.endX + lineInfo.placementOffset.x : lineInfo.endX;
  const offsetY = lineInfo.placementOffset ? lineInfo.endY + lineInfo.placementOffset.y : lineInfo.endY;
  
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '11px "IBM Plex Mono", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  
  // Afficher juste le nombre (discret)
  ctx.fillText(`${cost}`, offsetX + 15, offsetY);
  
  ctx.restore();
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Start the render engine
 */
export function startEngine(context: CanvasContext): void {
  canvasContext = context;
  debugState.lastFpsUpdate = performance.now();
  
  // Initialiser le suivi de la souris (pour curseur et UI contextuelle)
  if (context.canvas) {
    initUIRenderer(context.canvas);
  }
  
  animationFrameId = requestAnimationFrame(render);
}

/**
 * Stop the render engine
 */
export function stopEngine(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}
