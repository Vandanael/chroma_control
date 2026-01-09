/**
 * Game State Management
 * - START     : écran titre + call-to-action
 * - PLAYING   : gameplay
 * - GAME_OVER : écran de fin (victoire/défaite)
 * - REPLAY    : écran de fin avec score + reset (legacy)
 */

import { getNodesByOwner } from './nodeManager';
import { hasReachedSaturation, calculateSaturation } from './saturationSystem';
import { getDefeatReason, calculateDetailedScore } from './gameBalance';
import { RESOURCES_CONFIG, TIMER_CONFIG, VICTORY_CONFIG, SCORING_CONFIG } from '../config';

export type GameState = 'START' | 'PLAYING' | 'GAME_OVER' | 'REPLAY';

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
   * +1 point / seconde par cellule.
   */
  nexusPoints: number;
  /**
   * Score basé sur territoire
   */
  territoryScore: number;
  /**
   * Score de l'IA
   */
  enemyScore: number;
}

type GameStateListener = (state: GameState, score: GameScore) => void;

// =============================================================================
// ENCAPSULATION PRIVÉE - Protection anti-triche
// Variables critiques encapsulées dans le scope du module (non accessibles depuis window)
// =============================================================================

// Variables privées du module - non accessibles depuis la console du navigateur
// (TypeScript compile en modules ES6 qui isolent le scope)
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
  current: RESOURCES_CONFIG.energyInitial,
  max: RESOURCES_CONFIG.energyMax,
  regenPerSecond: RESOURCES_CONFIG.energyRegenPerSecond,
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
  energy.current = RESOURCES_CONFIG.energyInitial;
  
  // Réinitialiser le cache de vérification de victoire
  resetVictoryCheckCache();
  
  // Réinitialiser les systèmes de combat
  import('./fluxSystem').then(({ resetFlux }) => resetFlux());
  import('./signalInjection').then(({ clearInjections }) => clearInjections());
  import('./territoryGrind').then(({ clearTerritoryGrind }) => clearTerritoryGrind());
  import('./doubleTapBurst').then(({ clearBursts }) => clearBursts());
  import('../render/borderSparkles').then(({ clearBorderSparkles }) => clearBorderSparkles());
  import('../render/territoryDissolution').then(({ clearTerritoryDissolution }) => clearTerritoryDissolution());
  import('../render/organicAnimations').then(({ clearOrganicAnimations }) => clearOrganicAnimations());
  import('../ui/doubleTapTutorial').then(({ resetTutorial }) => resetTutorial());
}

export function incrementScore(unit: 'scout' | 'defender' | 'attacker'): void {
  if (unit === 'scout') score.taps += 1;
  if (unit === 'defender') score.defenders += 1;
  if (unit === 'attacker') score.attackers += 1;
}

/**
 * Ajoute des points issus de la possession de nexus.
 * État global du jeu.
 */
export function addNexusPoints(deltaSeconds: number): void {
  // Validation du delta (protection contre manipulation)
  if (typeof deltaSeconds !== 'number' || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0 || deltaSeconds > 1) {
    console.warn('[Security] Invalid delta time in addNexusPoints:', deltaSeconds);
    return;
  }
  score.nexusPoints += deltaSeconds; // 1 point / seconde
}

export function onGameStateChange(listener: GameStateListener): void {
  listeners.push(listener);
}

export function setGameState(state: GameState): void {
  // Validation de l'état (protection contre injection)
  // Note: validation synchrone pour éviter les problèmes de timing
  const validStates: GameState[] = ['START', 'PLAYING', 'GAME_OVER', 'REPLAY'];
  if (!validStates.includes(state)) {
    console.error('[Security] Invalid game state attempted:', state);
    return;
  }
  
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
// ÉNERGIE
// =============================================================================

export function getEnergy(): EnergyState {
  return { ...energy };
}

// Import lazy pour éviter circular dependency
let calculateEnergyProductionFn: (() => number) | null = null;

export function regenEnergy(deltaSeconds: number): void {
  // Validation du delta (protection contre manipulation)
  if (typeof deltaSeconds !== 'number' || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0 || deltaSeconds > 1) {
    console.warn('[Security] Invalid delta time in regenEnergy:', deltaSeconds);
    return;
  }
  
  // Production de base
  let totalProduction = energy.regenPerSecond;
  
  // Production depuis les harvesters (BLOC 2.1)
  if (!calculateEnergyProductionFn) {
    import('./energyProduction').then(({ calculateEnergyProduction }) => {
      calculateEnergyProductionFn = calculateEnergyProduction;
    });
  }
  
  if (calculateEnergyProductionFn) {
    totalProduction += calculateEnergyProductionFn();
  }
  
  // BLOC 6.2 : Appliquer modificateur de phase (lazy import)
  import('./gamePhases').then(({ getCurrentPhaseModifiers }) => {
    const modifiers = getCurrentPhaseModifiers();
    totalProduction *= modifiers.energyRegenMultiplier;
  }).catch(() => {
    // Si erreur, continuer sans modificateur
  });
  
  // Clamp la production pour éviter les valeurs extrêmes
  const safeProduction = Math.max(0, Math.min(totalProduction, energy.max * 10));
  
  energy.current = Math.min(
    energy.max,
    energy.current + safeProduction * deltaSeconds,
  );
}

export function spendEnergy(amount: number): boolean {
  // Validation du montant (protection contre manipulation)
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
    console.warn('[Security] Invalid energy amount in spendEnergy:', amount);
    return false;
  }
  
  // Clamp pour éviter les valeurs extrêmes (protection contre overflow)
  const safeAmount = Math.max(0, Math.min(amount, energy.max * 2));
  
  if (safeAmount <= 0) return true;
  if (energy.current < safeAmount) return false;
  energy.current -= safeAmount;
  return true;
}

// =============================================================================
// TIMER
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
  duration: TIMER_CONFIG.duration,
  remaining: TIMER_CONFIG.duration,
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
// SCORE CALCULATION
// =============================================================================

// Import lazy pour éviter circular dependency
let calculateTerritoryPercentageFn: ((w: number, h: number) => { player: number; enemy: number; neutral: number }) | null = null;

/**
 * Calcule le score basé sur le territoire contrôlé (basé sur % territoire, pas nombre de nœuds)
 */
export function updateTerritoryScore(canvasWidth: number, canvasHeight: number, deltaSeconds: number): void {
  // Validation des paramètres (protection contre manipulation)
  if (typeof deltaSeconds !== 'number' || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0 || deltaSeconds > 1) {
    console.warn('[Security] Invalid delta time in updateTerritoryScore:', deltaSeconds);
    return;
  }
  
  if (typeof canvasWidth !== 'number' || !Number.isFinite(canvasWidth) || canvasWidth < 0 || canvasWidth > 10000) {
    console.warn('[Security] Invalid canvas width:', canvasWidth);
    return;
  }
  
  if (typeof canvasHeight !== 'number' || !Number.isFinite(canvasHeight) || canvasHeight < 0 || canvasHeight > 10000) {
    console.warn('[Security] Invalid canvas height:', canvasHeight);
    return;
  }

  // Charger la fonction de calcul de territoire
  if (!calculateTerritoryPercentageFn) {
    import('./territorySystem').then(({ calculateTerritoryPercentage }) => {
      calculateTerritoryPercentageFn = calculateTerritoryPercentage;
    });
    return; // Première fois, on skip
  }

  // Utiliser le système de territoire réel (BLOC 5.4)
  const territory = calculateTerritoryPercentageFn(canvasWidth, canvasHeight);
  
  // Points basés sur le % de territoire contrôlé (clamp pour sécurité)
  const playerPoints = Math.max(0, Math.min(
    (territory.player / 100) * SCORING_CONFIG.pointsPerPercentPerSecond * deltaSeconds,
    1000
  ));
  const enemyPoints = Math.max(0, Math.min(
    (territory.enemy / 100) * SCORING_CONFIG.pointsPerPercentPerSecond * deltaSeconds,
    1000
  ));

  score.territoryScore += playerPoints;
  score.enemyScore += enemyPoints;
}

// Cache pour éviter de recalculer à chaque frame
let lastTerritoryCheck: { player: number; enemy: number } | null = null;
let lastNodeCountCheck: { player: number; enemy: number } | null = null;

/**
 * Vérifie les conditions de victoire/défaite (basé sur territoire, pas nombre de nœuds)
 * OPTIMISÉ : Ne s'exécute que si le territoire ou le nombre de nœuds a changé
 * @param canvasWidth - Largeur du canvas (pour calcul territoire)
 * @param canvasHeight - Hauteur du canvas (pour calcul territoire)
 */
export function checkVictoryConditions(canvasWidth?: number, canvasHeight?: number): void {
  if (currentState !== 'PLAYING') return;
  if (!canvasWidth || !canvasHeight) return;

  // Vérification rapide du nombre de nœuds (backup conditions)
  const playerNodes = getNodesByOwner('player');
  const enemyNodes = getNodesByOwner('enemy');
  const currentNodeCount = { player: playerNodes.length, enemy: enemyNodes.length };
  
  // Si le nombre de nœuds a changé, vérifier immédiatement
  if (!lastNodeCountCheck || 
      lastNodeCountCheck.player !== currentNodeCount.player || 
      lastNodeCountCheck.enemy !== currentNodeCount.enemy) {
    lastNodeCountCheck = currentNodeCount;
    
    // VICTOIRE ALTERNATIVE : Plus de nœuds ennemis (backup)
    if (enemyNodes.length === 0 && playerNodes.length > 0) {
      console.log('[Victory] Player wins! All enemy nodes eliminated.');
      setGameState('GAME_OVER');
      return;
    }

    // DÉFAITE : Plus de nœuds joueur
    if (playerNodes.length === 0) {
      console.log('[Defeat] Player lost! No nodes remaining.');
      setGameState('GAME_OVER');
      return;
    }
  }

  // Vérification du territoire (seulement si nécessaire)
  import('./territorySystem').then(({ calculateTerritoryPercentage }) => {
    const territory = calculateTerritoryPercentage(canvasWidth, canvasHeight);
    
    // Ne vérifier que si le territoire a changé significativement (seuil de 1%)
    if (!lastTerritoryCheck || 
        Math.abs(territory.player - lastTerritoryCheck.player) > 1 ||
        Math.abs(territory.enemy - lastTerritoryCheck.enemy) > 1) {
      lastTerritoryCheck = { player: territory.player, enemy: territory.enemy };
      
      // VICTOIRE : seuil de territoire contrôlé
      if (territory.player >= VICTORY_CONFIG.territoryVictoryThreshold) {
        console.log(`[Victory] TERRITORY DOMINATION! Player controls ${territory.player.toFixed(1)}% of territory!`);
        setGameState('GAME_OVER');
        return;
      }

      // DÉFAITE : Ennemi contrôle le seuil de territoire
      if (territory.enemy >= VICTORY_CONFIG.territoryVictoryThreshold) {
        console.log(`[Defeat] Enemy controls ${territory.enemy.toFixed(1)}% of territory!`);
        setGameState('GAME_OVER');
        return;
      }
    }
  });
}

/**
 * Réinitialise le cache de vérification de victoire (appelé lors d'un reset)
 */
export function resetVictoryCheckCache(): void {
  lastTerritoryCheck = null;
  lastNodeCountCheck = null;
}

/**
 * Récupère le résultat de la partie (victoire ou défaite) - basé sur territoire
 */
export function getGameResult(canvasWidth?: number, canvasHeight?: number): 'victory' | 'defeat' | null {
  if (currentState !== 'GAME_OVER') return null;

  if (!canvasWidth || !canvasHeight) {
    // Fallback : nombre de nœuds
    const playerNodes = getNodesByOwner('player');
    const enemyNodes = getNodesByOwner('enemy');
    if (enemyNodes.length === 0 && playerNodes.length > 0) {
      return 'victory';
    }
    return 'defeat';
  }

  // Charger la fonction de calcul de territoire
  if (!calculateTerritoryPercentageFn) {
    import('./territorySystem').then(({ calculateTerritoryPercentage }) => {
      calculateTerritoryPercentageFn = calculateTerritoryPercentage;
    });
    // Fallback temporaire
    const playerNodes = getNodesByOwner('player');
    const enemyNodes = getNodesByOwner('enemy');
    if (enemyNodes.length === 0 && playerNodes.length > 0) {
      return 'victory';
    }
    return 'defeat';
  }

  // Utiliser le système de territoire réel
  const territory = calculateTerritoryPercentageFn(canvasWidth, canvasHeight);
  
  if (territory.player >= VICTORY_CONFIG.territoryVictoryThreshold) {
    return 'victory';
  } else if (territory.enemy >= VICTORY_CONFIG.territoryVictoryThreshold) {
    return 'defeat';
  } else {
    // Fallback : nombre de nœuds
    const playerNodes = getNodesByOwner('player');
    const enemyNodes = getNodesByOwner('enemy');
    if (enemyNodes.length === 0 && playerNodes.length > 0) {
      return 'victory';
    }
    return 'defeat';
  }
}

/**
 * Récupère la raison de la défaite (pour feedback au joueur)
 */
export function getDefeatReasonText(canvasWidth?: number, canvasHeight?: number): string | null {
  if (currentState !== 'GAME_OVER') return null;

  const playerNodes = getNodesByOwner('player');
  const enemyNodes = getNodesByOwner('enemy');
  const isolatedNodes = playerNodes.filter(n => n.isIsolated && !n.isDropPod).length;

  if (!canvasWidth || !canvasHeight) {
    return getDefeatReason(
      playerNodes.length,
      enemyNodes.length,
      0,
      0,
      isolatedNodes
    );
  }

  const playerSaturation = calculateSaturation('player', canvasWidth, canvasHeight);
  const enemySaturation = calculateSaturation('enemy', canvasWidth, canvasHeight);

  return getDefeatReason(
    playerNodes.length,
    enemyNodes.length,
    playerSaturation,
    enemySaturation,
    isolatedNodes
  );
}

/**
 * Récupère le score détaillé du joueur
 */
export function getDetailedPlayerScore(canvasWidth?: number, canvasHeight?: number): ReturnType<typeof calculateDetailedScore> | null {
  if (!canvasWidth || !canvasHeight) return null;
  return calculateDetailedScore('player', canvasWidth, canvasHeight);
}