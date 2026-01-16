/**
 * ScoringSystem.ts - Calcul du score en temps réel
 * Composantes : Couverture, Propreté, Économie, Temps
 */

import { SCORING } from '@utils/Constants';
import { pixelCounter } from '@utils/PixelCounter';
import { PressureTank } from '@entities/PressureTank';

// =============================================================================
// TYPES
// =============================================================================

export interface ScoreBreakdown {
  coverage: number;
  cleanliness: number;
  economy: number;
  time: number;
  total: number;
}

export interface ScoreData {
  coverageRatio: number;
  cleanlinessRatio: number;
  pressureRemaining: number;
  timeUsed: number;
  timeLimit: number;
}

export interface ScoreMetrics {
  coveragePercent: number; // 0-100
  overflowPercent: number; // 0-100
  pressurePercent: number; // 0-100
}

// =============================================================================
// SCORING SYSTEM CLASS
// =============================================================================

export class ScoringSystem {
  /**
   * Calcule le score complet à partir des données
   */
  calculateScore(data: ScoreData): ScoreBreakdown {
    // Couverture : (pixels couverts / pixels cibles) × 1000
    const coverage = data.coverageRatio * SCORING.COVERAGE_MULTIPLIER;
    
    // Propreté : (1 - débordement) × 500
    const cleanliness = data.cleanlinessRatio * SCORING.CLEANLINESS_MULTIPLIER;
    
    // Économie : (pression restante / 100) × 300
    const economy = (data.pressureRemaining / 100) * SCORING.ECONOMY_MULTIPLIER;
    
    // Temps : (temps limite - temps utilisé) × 10
    const timeRemaining = Math.max(0, data.timeLimit - data.timeUsed);
    const time = timeRemaining * SCORING.TIME_MULTIPLIER;
    
    const total = coverage + cleanliness + economy + time;
    
    return {
      coverage: Math.round(coverage),
      cleanliness: Math.round(cleanliness),
      economy: Math.round(economy),
      time: Math.round(time),
      total: Math.round(total)
    };
  }
  
  /**
   * Calcule le score à partir de l'état actuel du jeu
   */
  calculateCurrentScore(
    pressureTank: PressureTank,
    timeUsed: number,
    timeLimit: number
  ): ScoreBreakdown | null {
    // Obtenir la couverture
    const coverage = pixelCounter.forceRecalculate();
    if (!coverage) return null;
    
    const data: ScoreData = {
      coverageRatio: coverage.coverageRatio,
      cleanlinessRatio: coverage.cleanlinessRatio,
      pressureRemaining: pressureTank.pressure,
      timeUsed,
      timeLimit
    };
    
    return this.calculateScore(data);
  }
  
  /**
   * Calcule les métriques pour les étoiles à partir de l'état actuel
   */
  calculateMetrics(pressureTank: PressureTank): ScoreMetrics | null {
    const coverage = pixelCounter.forceRecalculate();
    if (!coverage) return null;
    
    return {
      coveragePercent: coverage.coverageRatio * 100,
      overflowPercent: (1 - coverage.cleanlinessRatio) * 100,
      pressurePercent: pressureTank.pressure
    };
  }
  
  /**
   * Vérifie si les conditions de victoire sont remplies
   */
  checkVictory(coverageRatio: number): boolean {
    return coverageRatio >= SCORING.WIN_THRESHOLD;
  }
  
  /**
   * Vérifie si les conditions de défaite sont remplies
   */
  checkDefeat(timeUsed: number, timeLimit: number): boolean {
    return timeUsed >= timeLimit;
  }
}
