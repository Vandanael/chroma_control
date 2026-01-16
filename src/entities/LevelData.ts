/**
 * LevelData.ts
 * Configuration de tous les niveaux du jeu
 */

export interface LevelConfig {
  id: number;
  name: string;
  timeLimit: number; // en secondes
  difficulty: 'tutorial' | 'easy' | 'medium' | 'hard';
  surfaces: string[]; // Surfaces présentes dans ce niveau
  description: string;
  starThresholds: {
    coverage: number; // % minimum pour 1 étoile
    cleanliness: number; // % maximum débordement pour 2 étoiles
    economy: number; // % minimum pression restante pour 3 étoiles
  };
}

/**
 * Tous les niveaux du Monde 1
 * Progression : introduction progressive des surfaces
 */
export const LEVELS: LevelConfig[] = [
  // === TUTORIEL (NEUTRAL UNIQUEMENT) ===
  {
    id: 1,
    name: "Premiers Coups",
    timeLimit: 80,
    difficulty: 'tutorial',
    surfaces: ['Neutral'],      // UNIQUEMENT Neutral
    description: "Apprends les bases : maintiens pour spray, double-tap pour bombe",
    starThresholds: {
      coverage: 85,
      cleanliness: 10,
      economy: 20
    }
  },

  // === NIVEAUX SIMPLES (NEUTRAL UNIQUEMENT) ===
  {
    id: 2,
    name: "Entraînement",
    timeLimit: 65,
    difficulty: 'easy',
    surfaces: ['Neutral'],      // UNIQUEMENT Neutral
    description: "Continue à t'entraîner avec les outils",
    starThresholds: {
      coverage: 90,
      cleanliness: 8,
      economy: 25
    }
  },

  {
    id: 3,
    name: "Maîtrise",
    timeLimit: 60,
    difficulty: 'easy',
    surfaces: ['Neutral'],      // UNIQUEMENT Neutral
    description: "Perfectionne ta technique",
    starThresholds: {
      coverage: 90,
      cleanliness: 7,
      economy: 30
    }
  },

  {
    id: 4,
    name: "Le Défi",
    timeLimit: 70,
    difficulty: 'easy',
    surfaces: ['Neutral'],      // UNIQUEMENT Neutral
    description: "Dernier niveau avant les vraies surfaces",
    starThresholds: {
      coverage: 90,
      cleanliness: 5,
      economy: 30
    }
  },

  // === INTRODUCTION DES SURFACES (À PARTIR DU NIVEAU 5) ===
  {
    id: 5,
    name: "L'Éponge",
    timeLimit: 75,
    difficulty: 'medium',
    surfaces: ['Neutral', 'Sponge'],  // Introduction Éponge
    description: "Les zones éponge absorbent plus de peinture",
    starThresholds: {
      coverage: 92,
      cleanliness: 5,
      economy: 35
    }
  },

  {
    id: 6,
    name: "Surface Glissante",
    timeLimit: 70,
    difficulty: 'medium',
    surfaces: ['Neutral', 'Glass'],  // Introduction Verre
    description: "Le verre fait glisser la peinture plus loin",
    starThresholds: {
      coverage: 92,
      cleanliness: 5,
      economy: 35
    }
  },

  {
    id: 7,
    name: "Attention au Vide",
    timeLimit: 80,
    difficulty: 'medium',
    surfaces: ['Neutral', 'Void'],  // Introduction Vide
    description: "Évite les zones vides, la peinture ne tient pas",
    starThresholds: {
      coverage: 93,
      cleanliness: 4,
      economy: 40
    }
  },

  // === NIVEAUX AVANCES (TOUTES LES SURFACES) ===
  {
    id: 8,
    name: "Le Métal",
    timeLimit: 75,
    difficulty: 'hard',
    surfaces: ['Neutral', 'Metal'],  // Introduction Métal
    description: "Le métal résiste, sois précis",
    starThresholds: {
      coverage: 93,
      cleanliness: 4,
      economy: 40
    }
  },

  {
    id: 9,
    name: "Le Sable",
    timeLimit: 95,
    difficulty: 'hard',
    surfaces: ['Neutral', 'Sand'],  // Introduction Sable
    description: "Le sable absorbe lentement, patience requise",
    starThresholds: {
      coverage: 95,
      cleanliness: 3,
      economy: 45
    }
  },

  {
    id: 10,
    name: "Le Défi Final",
    timeLimit: 110,
    difficulty: 'hard',
    surfaces: ['Neutral', 'Sponge', 'Glass', 'Void', 'Metal', 'Sand'],  // Toutes!
    description: "Le test ultime du Monde 1 - Toutes les surfaces !",
    starThresholds: {
      coverage: 95,
      cleanliness: 2,
      economy: 50
    }
  }
];

/**
 * Retourne la configuration d'un niveau par son ID
 */
export function getLevelConfig(levelId: number): LevelConfig | undefined {
  return LEVELS.find(level => level.id === levelId);
}

/**
 * Retourne le nombre total de niveaux
 */
export function getTotalLevels(): number {
  return LEVELS.length;
}
