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
   * Points générés par la possession de nexus.
   * Sprint 1 : +1 point / seconde pendant que le nexus est capturé.
   */
  nexusPoints: number;
}

type GameStateListener = (state: GameState, score: GameScore) => void;

let currentState: GameState = 'START';

const score: GameScore = {
  taps: 0,
  defenders: 0,
  attackers: 0,
  nexusPoints: 0,
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