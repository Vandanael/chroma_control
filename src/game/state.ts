/**
 * Game State Management
 * - START   : écran titre + call-to-action
 * - PLAYING : gameplay / tests de game feel
 * - REPLAY  : écran de fin avec score + reset
 */

export type GameState = 'START' | 'PLAYING' | 'REPLAY';

export interface EnergyState {
  current: number;
  max: number;
  regenPerSecond: number;
}

export interface GameScore {
  taps: number;
  defenders: number;
  attackers: number;
  /**
   * Points générés par la possession de cellules.
   * Sprint 5 : +1 point / seconde par cellule.
   */
  nexusPoints: number;
  /**
   * Score basé sur territoire (Sprint 5.4)
   */
  territoryScore: number;
  /**
   * Score de l'IA
   */
  enemyScore: number;
}

type GameStateListener = (state: GameState, score: GameScore) => void;

let currentState: GameState = 'START';

const score: GameScore = {
  taps: 0,
  defenders: 0,
  attackers: 0,
  nexusPoints: 0,
  territoryScore: 0,
  enemyScore: 0,
};

const energy: EnergyState = {
  current: 50,
  max: 100,
  regenPerSecond: 3,
};

const listeners: GameStateListener[] = [];

export function getGameState(): GameState {
  return currentState;
}

export function getScore(): GameScore {
  return { ...score };
}

export function resetScore(): void {
  score.taps = 0;
  score.defenders = 0;
  score.attackers = 0;
  score.nexusPoints = 0;
  score.territoryScore = 0;
  score.enemyScore = 0;
  energy.current = 50;
}

export function incrementScore(unit: 'scout' | 'defender' | 'attacker'): void {
  if (unit === 'scout') score.taps += 1;
  if (unit === 'defender') score.defenders += 1;
  if (unit === 'attacker') score.attackers += 1;
}

/**
 * Ajoute des points issus de la possession de nexus.
 * Utilisé à partir du Sprint 1.
 */
export function addNexusPoints(deltaSeconds: number): void {
  if (deltaSeconds <= 0) return;
  score.nexusPoints += deltaSeconds; // 1 point / seconde
}

export function onGameStateChange(listener: GameStateListener): void {
  listeners.push(listener);
}

export function setGameState(state: GameState): void {
  currentState = state;
  const snapshot = getScore();
  for (const listener of listeners) {
    listener(state, snapshot);
  }
}

/**
 * Debug helper: force la fin de match et affiche REPLAY
 */
export function debugEndMatch(): void {
  setGameState('REPLAY');
}

// =============================================================================
// ÉNERGIE (Sprint 4)
// =============================================================================

export function getEnergy(): EnergyState {
  return { ...energy };
}

export function regenEnergy(deltaSeconds: number): void {
  if (deltaSeconds <= 0) return;
  energy.current = Math.min(
    energy.max,
    energy.current + energy.regenPerSecond * deltaSeconds,
  );
}

export function spendEnergy(amount: number): boolean {
  if (amount <= 0) return true;
  if (energy.current < amount) return false;
  energy.current -= amount;
  return true;
}

// =============================================================================
// TIMER (Sprint 5.3)
// =============================================================================

interface TimerState {
  enabled: boolean;
  startTime: number;
  duration: number; // en secondes
  remaining: number; // en secondes
}

const timer: TimerState = {
  enabled: false,
  startTime: 0,
  duration: 300, // 5 minutes
  remaining: 300,
};

export function startTimer(): void {
  timer.enabled = true;
  timer.startTime = performance.now();
  timer.remaining = timer.duration;
  console.log('[Timer] Started: 5:00');
}

export function stopTimer(): void {
  timer.enabled = false;
}

export function updateTimer(currentTime: number): void {
  if (!timer.enabled) return;

  const elapsed = (currentTime - timer.startTime) / 1000; // en secondes
  timer.remaining = Math.max(0, timer.duration - elapsed);

  // Fin du match si timer à 0
  if (timer.remaining <= 0 && currentState === 'PLAYING') {
    console.log('[Timer] Time\'s up!');
    setGameState('REPLAY');
  }
}

export function getTimer(): { remaining: number; minutes: number; seconds: number } {
  const minutes = Math.floor(timer.remaining / 60);
  const seconds = Math.floor(timer.remaining % 60);
  return { remaining: timer.remaining, minutes, seconds };
}

// =============================================================================
// SCORE CALCULATION (Sprint 5.4)
// =============================================================================

/**
 * Calcule le score basé sur le territoire contrôlé
 */
export function updateTerritoryScore(playerCells: number, enemyCells: number, deltaSeconds: number): void {
  if (deltaSeconds <= 0) return;

  // +1 point/seconde par cellule
  const playerPoints = playerCells * deltaSeconds;
  const enemyPoints = enemyCells * deltaSeconds;

  score.territoryScore += playerPoints;
  score.enemyScore += enemyPoints;
}

/**
 * Vérifie les conditions de victoire
 */
export function checkVictoryConditions(): void {
  if (currentState !== 'PLAYING') return;

  const VICTORY_SCORE = 500;

  // Victoire par score
  if (score.territoryScore >= VICTORY_SCORE) {
    console.log('[Victory] Player wins by score!');
    setGameState('REPLAY');
  } else if (score.enemyScore >= VICTORY_SCORE) {
    console.log('[Victory] Enemy wins by score!');
    setGameState('REPLAY');
  }
}