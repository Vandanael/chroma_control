/**
 * ProgressionSystem.ts
 * Gère la sauvegarde et le chargement de la progression du joueur
 */

import { getTotalLevels } from '@/entities/LevelData';

const STORAGE_KEY = 'chroma_control_progression';

export interface LevelProgress {
  levelId: number;
  completed: boolean;
  stars: number; // 0-3
  bestScore: number;
  bestTime: number;
  attempts: number;
}

export interface PlayerProgression {
  levels: Map<number, LevelProgress>;
  currentLevel: number;
  totalStars: number;
  lastPlayed: number; // timestamp
}

/**
 * Charge la progression depuis le LocalStorage
 */
export function loadProgression(): PlayerProgression {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createNewProgression();
    }

    const data = JSON.parse(stored);
    const progression: PlayerProgression = {
      levels: new Map(Object.entries(data.levels).map(([id, progress]) => [
        parseInt(id),
        progress as LevelProgress
      ])),
      currentLevel: data.currentLevel || 1,
      totalStars: data.totalStars || 0,
      lastPlayed: data.lastPlayed || Date.now()
    };

    return progression;
  } catch (error) {
    console.error('Erreur chargement progression:', error);
    return createNewProgression();
  }
}

/**
 * Sauvegarde la progression dans le LocalStorage
 */
export function saveProgression(progression: PlayerProgression): void {
  try {
    const data = {
      levels: Object.fromEntries(progression.levels),
      currentLevel: progression.currentLevel,
      totalStars: progression.totalStars,
      lastPlayed: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Erreur sauvegarde progression:', error);
  }
}

/**
 * Crée une nouvelle progression vierge
 */
function createNewProgression(): PlayerProgression {
  const levels = new Map<number, LevelProgress>();
  const totalLevels = getTotalLevels();

  for (let i = 1; i <= totalLevels; i++) {
    levels.set(i, {
      levelId: i,
      completed: false,
      stars: 0,
      bestScore: 0,
      bestTime: 0,
      attempts: 0
    });
  }

  return {
    levels,
    currentLevel: 1,
    totalStars: 0,
    lastPlayed: Date.now()
  };
}

/**
 * Met à jour la progression après avoir terminé un niveau
 */
export function updateLevelProgress(
  progression: PlayerProgression,
  levelId: number,
  stars: number,
  score: number,
  time: number
): void {
  const levelProgress = progression.levels.get(levelId);
  if (!levelProgress) return;

  // Met à jour les stats du niveau
  levelProgress.attempts += 1;
  levelProgress.completed = stars > 0;

  // Met à jour le meilleur score
  if (score > levelProgress.bestScore) {
    levelProgress.bestScore = score;
  }

  // Met à jour le meilleur temps (si complété)
  if (stars > 0 && (levelProgress.bestTime === 0 || time < levelProgress.bestTime)) {
    levelProgress.bestTime = time;
  }

  // Met à jour les étoiles (garde le meilleur)
  if (stars > levelProgress.stars) {
    const starDiff = stars - levelProgress.stars;
    levelProgress.stars = stars;
    progression.totalStars += starDiff;
  }

  // Débloque le niveau suivant si complété
  if (stars > 0 && levelId < getTotalLevels()) {
    progression.currentLevel = Math.max(progression.currentLevel, levelId + 1);
  }

  saveProgression(progression);
}

/**
 * Vérifie si un niveau est débloqué
 */
export function isLevelUnlocked(progression: PlayerProgression, levelId: number): boolean {
  return levelId <= progression.currentLevel;
}

/**
 * Réinitialise toute la progression
 */
export function resetProgression(): PlayerProgression {
  const newProgression = createNewProgression();
  saveProgression(newProgression);
  return newProgression;
}
