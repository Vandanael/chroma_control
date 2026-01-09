/**
 * Chroma Control - Main Entry Point
 * Sprint 0: Game Feel Validation
 *
 * This module initializes:
 * - Canvas (Retina-ready)
 * - Touch input system (duration-based unit detection)
 * - Render engine with debug overlay
 */

import { initCanvas } from './render/canvas';
import { initTouchInput, onTouchEnd, onUnitChange } from './input/touch';
import { startEngine } from './render/engine';
import { UnitType } from './types';
import {
  debugEndMatch,
  getScore,
  incrementScore,
  onGameStateChange,
  resetScore,
  setGameState,
} from './game/state';

// =============================================================================
// INITIALIZATION
// =============================================================================

function init(): void {
  console.log('[Chroma Control] Initializing Sprint 0...');

  // 1. Initialize Canvas (Retina-ready)
  const canvasContext = initCanvas('game-canvas');
  console.log(
    `[Canvas] Initialized at ${canvasContext.width}x${canvasContext.height} (DPR: ${canvasContext.dpr})`,
  );

  // 2. Initialize Touch Input
  initTouchInput(canvasContext.canvas);
  console.log('[Input] Touch handlers registered');

  // 3. Start Render Engine
  startEngine(canvasContext);
  console.log('[Engine] Render loop started');

  // 4. UI wiring: START / REPLAY / DEBUG
  wireUiLayers();

  // 5. Log initialization complete
  console.log('[Chroma Control] Sprint 0 Ready!');
  console.log('');
  console.log('=== CONTROLS ===');
  console.log('Tap (<300ms)      → Scout [SCT]');
  console.log('Hold (300-1500ms) → Defender [DEF]');
  console.log('Long (>1500ms)    → Attacker [ATK]');
  console.log('================');
}

// =============================================================================
// UI LAYERS (START / REPLAY / DEBUG)
// =============================================================================

function wireUiLayers(): void {
  const body = document.body;
  const startScreen = document.getElementById('start-screen');
  const replayScreen = document.getElementById('replay-screen');
  const startButton = document.getElementById('btn-initiate-signal');
  const replayButton = document.getElementById('btn-replay-signal');
  const debugEndButton = document.getElementById('btn-debug-end');
  const replayScoreEl = document.getElementById('replay-score');

  // Reflect game state in DOM (data attribute + visibility)
  onGameStateChange((state, score) => {
    body.setAttribute('data-game-state', state);

    if (startScreen) {
      (startScreen as HTMLElement).style.display =
        state === 'START' ? 'flex' : 'none';
    }
    if (replayScreen) {
      (replayScreen as HTMLElement).style.display =
        state === 'REPLAY' ? 'flex' : 'none';
    }

    if (replayScoreEl) {
      const total = Math.round(score.nexusPoints || 0);
      replayScoreEl.textContent = `${total.toString().padStart(3, '0')} pts`;
    }
  });

  // START → PLAYING
  startButton?.addEventListener('click', () => {
    resetScore();
    setGameState('PLAYING');
  });

  // REPLAY → nouveau RUN
  replayButton?.addEventListener('click', () => {
    resetScore();
    setGameState('PLAYING');
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

    // TODO: Effet visuel "released" (sera réimplémenté avec Voronoi)
    // addReleasedAnimation(state.x, state.y, state.detectedUnit);

    // Règle simple de fin de match pour Sprint 0 :
    // après 10 interactions productives, on bascule en REPLAY
    const snapshot = getScore();
    const interactions =
      snapshot.taps + snapshot.defenders + snapshot.attackers;
    if (
      interactions >= 10 &&
      document.body.getAttribute('data-game-state') === 'PLAYING'
    ) {
      setGameState('REPLAY');
    }
  });

  // Log de changement d’unité (pour ressenti)
  onUnitChange((unit: UnitType, duration: number) => {
    console.log(
      `[Unit] Changed to ${unit.toUpperCase()} at ${duration.toFixed(0)}ms`,
    );
  });

  // État initial : START
  setGameState('START');
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
