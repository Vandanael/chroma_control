/**
 * StarSystem.ts
 * Calcule le nombre d'étoiles obtenues selon les performances
 */

import type { LevelConfig } from '@/entities/LevelData';

export interface StarResult {
  totalStars: number;
  stars: {
    coverage: boolean; // 1 étoile : couverture minimale atteinte
    cleanliness: boolean; // 2 étoiles : débordement minimal
    economy: boolean; // 3 étoiles : économie de pression
  };
}

/**
 * Calcule les étoiles obtenues selon les métriques
 */
export function calculateStars(
  levelConfig: LevelConfig,
  coverage: number, // 0-100
  overflow: number, // 0-100
  pressureRemaining: number // 0-100
): StarResult {
  const { starThresholds } = levelConfig;

  const stars = {
    coverage: coverage >= starThresholds.coverage,
    cleanliness: overflow <= starThresholds.cleanliness,
    economy: pressureRemaining >= starThresholds.economy
  };

  let totalStars = 0;
  if (stars.coverage) totalStars = 1;
  if (stars.coverage && stars.cleanliness) totalStars = 2;
  if (stars.coverage && stars.cleanliness && stars.economy) totalStars = 3;

  return { totalStars, stars };
}
