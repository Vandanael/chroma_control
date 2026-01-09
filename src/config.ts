/**
 * Configuration Centralisée - Chroma Control
 * 
 * Toutes les variables magiques du jeu sont centralisées ici pour faciliter
 * l'équilibrage et la maintenance.
 * 
 * ORGANISATION :
 * - AI : Configuration de l'intelligence artificielle
 * - Nodes : Paramètres des nœuds et connexions
 * - Signal : Portée et physique du signal
 * - Victory : Seuils de victoire/défaite
 * - Resources : Énergie, FLUX, et autres ressources
 * - Rendering : Paramètres visuels (opacité, animations, etc.)
 * - Audio : Paramètres audio
 * - UI : Paramètres d'interface utilisateur
 */

// =============================================================================
// AI CONFIGURATION
// =============================================================================

/**
 * Configuration de l'intelligence artificielle
 */
export const AI_CONFIG = {
  /** Délai de démarrage avant que l'IA commence à agir (en millisecondes) */
  startDelayMs: 5000,
  
  /** Portée maximum pour le placement de nœuds par l'IA (en pixels) */
  maxPlacementRange: 200,
  
  /** Variance d'angle pour l'expansion (en radians, ±45°) */
  expansionAngleVariance: Math.PI / 4,
  
  /** Délai de base entre les actions de l'IA (en millisecondes) */
  baseActionDelay: 4000,
  
  /** Délai minimum entre les actions (en millisecondes) - très agressif */
  minActionDelay: 1500,
  
  /** Seuil de saturation du joueur à partir duquel l'IA devient agressive (0-1) */
  aggressiveThreshold: 0.4,
  
  /** Bonus de portée maximum pour l'IA selon la saturation du joueur (en pixels) */
  maxRangeBonus: 50,
  
  /** Distance minimale pour cibler un nœud vulnérable (en pixels) */
  vulnerableTargetMinDistance: 80,
  
  /** Distance maximale pour cibler un nœud vulnérable (en pixels) */
  vulnerableTargetMaxDistance: 120,
  
  /** Distance minimale pour expansion normale (en pixels) */
  expansionMinDistance: 100,
  
  /** Distance maximale pour expansion normale (en pixels) */
  expansionMaxDistance: 200,
  
  /** Nombre de nœuds vulnérables à considérer pour le ciblage */
  vulnerableNodesToConsider: 3,
  
  /** Distance de détection pour jouer le son de capture (en pixels) */
  captureSoundDistance: 100,
} as const;

// =============================================================================
// NODE CONFIGURATION
// =============================================================================

/**
 * Configuration des nœuds et de leurs connexions
 */
export const NODE_CONFIG = {
  /** Rayon de base d'un nœud standard (en pixels) */
  baseRadius: 15,
  
  /** Rayon du Drop-Pod (en pixels) */
  dropPodRadius: 25,
  
  /** Puissance de base d'un nœud */
  basePower: 50,
  
  /** Puissance du Drop-Pod */
  dropPodPower: 100,
  
  /** Portée maximum pour créer une connexion (en pixels) */
  maxConnectionRange: 200,
  
  /** Portée pour le maillage automatique (en pixels) */
  autoMeshRange: 150,
  
  /** Rayon de recherche pour trouver un nœud à une position (en pixels) */
  positionSearchRadius: 30,
  
  /** Rayon de recherche pour les bonus de signal (amplifiers/fortresses) (en pixels) */
  signalBonusSearchRadius: 200,
  
  /** Rayon de recherche pour les contraintes requiresNearby (en pixels) */
  nearbyRequirementRadius: 150,
  
  /** Coût de base pour placer un nœud */
  basePlacementCost: 5,
  
  /** Diviseur pour le coût basé sur la distance */
  distanceCostDivisor: 20,
  
  /** Distance du bord de l'écran pour le Drop-Pod joueur (en pixels) */
  playerDropPodOffsetFromBottom: 100,
  
  /** Position verticale du Drop-Pod ennemi (fraction de la hauteur, 0.25 = 25% du haut) */
  enemyDropPodVerticalPosition: 0.25,
} as const;

// =============================================================================
// SIGNAL CONFIGURATION
// =============================================================================

/**
 * Configuration de la portée et de la physique du signal
 */
export const SIGNAL_CONFIG = {
  /** Portée de base du signal (en pixels) */
  baseRange: 200,
  
  /** Bonus de portée par nœud (en pixels) */
  rangeBonusPerNode: 5,
  
  /** Bonus de portée maximum par pression chromatique (en pixels) */
  maxPressureBonus: 150,
  
  /** Exposant pour la courbe de pression chromatique */
  pressureExponent: 1.5,
  
  /** Portée maximum du signal (plafond, en pixels) */
  maxRange: 600,
  
  /** Densité de connexions maximum pour normalisation (4 connexions = densité max) */
  maxDensityForNormalization: 4,
  
  /** Taux d'atténuation du signal par hop de distance (0-1) */
  attenuationRate: 0.15,
  
  /** Opacité minimale pour un nœud isolé (0-1) */
  minIsolatedOpacity: 0.3,
  
  /** Épaisseur minimale d'un lien (en pixels) */
  minLinkThickness: 1,
} as const;

// =============================================================================
// VICTORY CONFIGURATION
// =============================================================================

/**
 * Configuration des seuils de victoire et défaite
 */
export const VICTORY_CONFIG = {
  /** Seuil de saturation planétaire pour victoire (0-1, 0.7 = 70%) */
  saturationThreshold: 0.7,
  
  /** Seuil de territoire contrôlé pour victoire (0-100, 60 = 60%) */
  territoryVictoryThreshold: 60,
  
  /** Seuil de saturation pour l'IA agressive (0-1, 0.4 = 40%) */
  aiAggressiveSaturationThreshold: 0.4,
} as const;

// =============================================================================
// RESOURCES CONFIGURATION
// =============================================================================

/**
 * Configuration des ressources (Énergie, FLUX, etc.)
 */
export const RESOURCES_CONFIG = {
  /** Énergie initiale du joueur */
  energyInitial: 150,
  
  /** Énergie maximum du joueur */
  energyMax: 200,
  
  /** Régénération d'énergie par seconde */
  energyRegenPerSecond: 1,
  
  /** FLUX maximum */
  fluxMax: 100,
  
  /** FLUX initial */
  fluxInitial: 50,
  
  /** Régénération passive de FLUX par seconde */
  fluxRegenPerSecond: 2,
  
  /** FLUX généré par nœud par seconde */
  fluxPerNode: 0.5,
  
  /** Coût en FLUX pour un Double-Tap */
  doubleTapCost: 30,
  
  /** Seuil d'alerte FLUX bas (en dessous = alerte visuelle) */
  lowFluxThreshold: 30,
} as const;

// =============================================================================
// TIMER CONFIGURATION
// =============================================================================

/**
 * Configuration du timer de partie
 */
export const TIMER_CONFIG = {
  /** Durée de la partie en secondes (300 = 5 minutes) */
  duration: 300,
} as const;

// =============================================================================
// RENDERING CONFIGURATION
// =============================================================================

/**
 * Configuration des paramètres de rendu visuel
 */
export const RENDERING_CONFIG = {
  /** Opacité du territoire (0-1) */
  territoryOpacity: 0.25,
  
  /** Seuil de pression pour afficher les effets visuels (0-1) */
  pressureVisualThreshold: 0.1,
  
  /** Seuil de pression élevée pour pulsation rapide (0-1) */
  highPressureThreshold: 0.7,
  
  /** Seuil de pression moyenne pour pulsation modérée (0-1) */
  mediumPressureThreshold: 0.4,
  
  /** Fréquence de pulsation stable (Hz) */
  stablePulseFrequency: 1.0,
  
  /** Fréquence de pulsation sous pression moyenne (Hz) */
  mediumPulseFrequency: 1.8,
  
  /** Fréquence de pulsation sous pression élevée (Hz) */
  highPulseFrequency: 2.5,
  
  /** Amplitude de pulsation (0-1) */
  pulseAmplitude: 0.3,
  
  /** Opacité de base pour les effets de pression (0-1) */
  basePressureOpacity: 0.4,
  
  /** Opacité maximale pour les effets de pression (0-1) */
  maxPressureOpacity: 0.8,
  
  /** Seuil de force ratio pour gagner (au-dessus = couleur joueur saturée) */
  winningForceRatioThreshold: 0.2,
  
  /** Seuil de force ratio pour perdre (en dessous = magenta qui déborde) */
  losingForceRatioThreshold: -0.2,
  
  /** Durée d'affichage des connexions éphémères (en millisecondes) */
  ephemeralConnectionDuration: 500,
  
  /** Vitesse de pulsation du glow (pour connexions éphémères) */
  glowPulseSpeed: 0.003,
  
  /** Vitesse de rotation de la planète (start screen) */
  planetRotationSpeed: 0.008,
  
  /** Vitesse de zoom de la planète (start screen) */
  planetZoomSpeed: 0.08,
  
  /** Facteur d'accélération du zoom */
  planetZoomAcceleration: 0.1,
  
  /** Échelle de zoom maximum avant arrêt de l'animation */
  planetMaxZoomScale: 4.0,
  
  /** Facteur de réduction pour l'easing du zoom */
  planetZoomEasingFactor: 0.7,
  
  /** Opacité minimale pendant le fade-out du zoom (0-1) */
  planetMinZoomOpacity: 0.2,
  
  /** Durée de transition de fondu "DIVE" (en millisecondes) */
  diveTransitionDuration: 500,
} as const;

// =============================================================================
// AUDIO CONFIGURATION
// =============================================================================

/**
 * Configuration des paramètres audio
 */
export const AUDIO_CONFIG = {
  /** Volume global du master (0-1) */
  masterVolume: 0.3,
  
  /** Volume de l'ambiance (0-1) */
  ambientVolume: 0.1,
  
  /** Volume de base de l'oscillateur d'ambiance (0-1) */
  ambientOscillatorBaseVolume: 0.05,
  
  /** Fréquence de base de l'ambiance (Hz) */
  ambientBaseFrequency: 60,
  
  /** Fréquence du LFO pour variation d'ambiance (Hz) */
  ambientLfoFrequency: 0.1,
  
  /** Boost de volume maximum selon saturation (0-1) */
  maxSaturationVolumeBoost: 0.1,
  
  /** Volume pour placement de nœud (0-1) */
  nodePlacementVolume: 0.4,
  
  /** Durée du son de placement de nœud (en secondes) */
  nodePlacementDuration: 0.15,
  
  /** Volume de l'harmonique (0-1) */
  harmonicVolume: 0.2,
  
  /** Volume pour erreur "Too Far" (0-1) */
  tooFarVolume: 0.25,
  
  /** Volume pour info "Too Far" (0-1) */
  tooFarInfoVolume: 0.1,
  
  /** Durée du son info "Too Far" (en secondes) */
  tooFarInfoDuration: 0.05,
  
  /** Volume pour capture de nœud (0-1) */
  nodeCaptureVolume: 0.15,
  
  /** Délai entre chaque note dans une séquence (en secondes) */
  sequenceNoteDelay: 0.03,
  
  /** Durée d'une note dans une séquence (en secondes) */
  sequenceNoteDuration: 0.08,
  
  /** Volume du bruit de frontière (0-1) */
  borderNoiseVolume: 0.15,
  
  /** Longueur de frontière pour volume maximum (en pixels) */
  borderLengthForMaxVolume: 5000,
  
  /** Fréquence de base du bruit de frontière (Hz) */
  borderNoiseBaseFrequency: 200,
  
  /** Décalage de fréquence selon force ratio (Hz) */
  borderNoisePitchShift: 100,
  
  /** Durée de transition audio (en secondes) */
  audioTransitionDuration: 0.1,
  
  /** Durée de transition audio longue (en secondes) */
  audioLongTransitionDuration: 0.2,
  
  /** Seuil de pression pour activer le bruit de frontière (0-1) */
  borderNoisePressureThreshold: 0.3,
  
  /** Intervalle minimum entre les bruits de frontière (en secondes) */
  borderNoiseMinInterval: 0.05,
  
  /** Volume du bruit de frontière (fraction du volume principal) */
  borderNoiseVolumeRatio: 0.3,
  
  /** Durée du bruit de frontière (en secondes) */
  borderNoiseDuration: 0.05,
  
  /** Fréquence de base pour son de défaite (Hz) */
  defeatBaseFrequency: 150,
  
  /** Fréquence finale pour son de défaite (Hz) */
  defeatFinalFrequency: 80,
  
  /** Durée du son de défaite (en secondes) */
  defeatDuration: 0.35,
  
  /** Volume du son de défaite (0-1) */
  defeatVolume: 0.3,
  
  /** Volume pour transition de phase (0-1) */
  phaseTransitionVolume: 0.4,
  
  /** Durée d'attaque pour transition de phase (en secondes) */
  phaseTransitionAttack: 0.1,
  
  /** Durée de decay pour transition de phase (en secondes) */
  phaseTransitionDecay: 0.5,
  
  /** Durée de sustain pour transition de phase (en secondes) */
  phaseTransitionSustain: 1.0,
} as const;

// =============================================================================
// UI CONFIGURATION
// =============================================================================

/**
 * Configuration de l'interface utilisateur
 */
export const UI_CONFIG = {
  /** Seuil de saturation pour activer Orbit View (0-1, 0.7 = 70%) */
  orbitViewSaturationThreshold: 0.7,
  
  /** Nombre minimum d'interactions pour déclencher REPLAY */
  minInteractionsForReplay: 10,
  
  /** Durée de vie des sparkles de frontière (en secondes) */
  sparkleLifetime: 0.6,
  
  /** Taux de spawn de base pour les sparkles */
  sparkleBaseSpawnRate: 0.3,
  
  /** Variation de position pour les sparkles (en pixels) */
  sparklePositionVariance: 40,
  
  /** Variance d'angle pour les sparkles (en radians) */
  sparkleAngleVariance: 0.8,
  
  /** Luminosité de base pour les sparkles (0-1) */
  sparkleBaseBrightness: 0.7,
  
  /** Seuil de force ratio pour sparkles intenses (0-1) */
  sparkleIntenseForceRatio: 0.2,
  
  /** Seuil de force ratio pour sparkles faibles (0-1) */
  sparkleWeakForceRatio: -0.2,
  
  /** Facteur de réduction de taille en fin de vie pour sparkles (0-1) */
  sparkleSizeReductionFactor: 0.7,
} as const;

// =============================================================================
// SURVIVAL SYSTEM CONFIGURATION
// =============================================================================

/**
 * Configuration du système de survie (Le Cordon)
 */
export const SURVIVAL_CONFIG = {
  /** Temps avant qu'un nœud isolé meure (en millisecondes) */
  isolationDeathTime: 10000, // 10 secondes
} as const;

// =============================================================================
// SCORING CONFIGURATION
// =============================================================================

/**
 * Configuration du système de scoring
 */
export const SCORING_CONFIG = {
  /** Points par seconde par % de territoire contrôlé */
  pointsPerPercentPerSecond: 10,
  
  /** Multiplicateur de points pour densité de réseau */
  densityScoreMultiplier: 10,
  
  /** Points maximum pour densité (si densité = 4) */
  maxDensityScore: 40,
  
  /** Points maximum pour couverture (si 100% couverture) */
  maxCoverageScore: 100,
  
  /** Bonus de survie si aucun nœud isolé */
  survivalBonus: 50,
  
  /** Points de base par nœud possédé */
  pointsPerNode: 10,
} as const;

// =============================================================================
// TERRITORY CONFIGURATION
// =============================================================================

/**
 * Configuration du système de territoire
 */
export const TERRITORY_CONFIG = {
  /** Seuil de pression pour calculer les effets visuels (0-1) */
  pressureVisualThreshold: 0.1,
  
  /** Point milieu pour le calcul de territoire (0-1) */
  territoryMidpoint: 0.5,
} as const;

// =============================================================================
// EXPORT UNIFIED
// =============================================================================

/**
 * Configuration complète du jeu (export unifié pour faciliter l'import)
 */
export const GAME_CONFIG = {
  ai: AI_CONFIG,
  node: NODE_CONFIG,
  signal: SIGNAL_CONFIG,
  victory: VICTORY_CONFIG,
  resources: RESOURCES_CONFIG,
  timer: TIMER_CONFIG,
  rendering: RENDERING_CONFIG,
  audio: AUDIO_CONFIG,
  ui: UI_CONFIG,
  survival: SURVIVAL_CONFIG,
  scoring: SCORING_CONFIG,
  territory: TERRITORY_CONFIG,
} as const;
