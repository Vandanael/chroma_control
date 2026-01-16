/**
 * Constants.ts - Configuration centralisée
 * Toutes les valeurs de config du jeu en un seul endroit
 */

// =============================================================================
// COULEURS JOUEUR
// =============================================================================

export const PLAYER_COLORS = {
  CYAN: 0x00F3FF,
  GREEN: 0x00FF88,
  AMBER: 0xFFAA00
} as const;

export type PlayerColorName = keyof typeof PLAYER_COLORS;

// =============================================================================
// DIMENSIONS
// =============================================================================

export const CANVAS = {
  WIDTH: 1080,
  HEIGHT: 1920,
  ASPECT_RATIO: 1080 / 1920 // 0.5625 (portrait)
} as const;

// Zone de peinture (exclut header et boutons)
export const PAINT_AREA = {
  X: 40,                        // Marge gauche
  Y: 120,                       // Sous le header (timer, niveau)
  WIDTH: 1080 - 80,             // 1000px (avec marges)
  HEIGHT: 1920 - 120 - 280,     // 1520px (exclut header 120 + contrôles 280)
  BORDER_WIDTH: 3,              // Épaisseur bordure
  BORDER_RADIUS: 24,            // Coins arrondis
  get RIGHT() { return this.X + this.WIDTH; },
  get BOTTOM() { return this.Y + this.HEIGHT; }
} as const;

// =============================================================================
// SURFACES / FRICTION
// =============================================================================

export const SURFACES = {
  NEUTRAL: { color: 0x808080, friction: 1.0, name: 'Neutre' },
  SPONGE:  { color: 0xFF0000, friction: 3.0, name: 'Éponge' },
  GLASS:   { color: 0x0000FF, friction: 0.2, name: 'Verre' },
  VOID:    { color: 0x000000, friction: Infinity, name: 'Vide' },
  METAL:   { color: 0x00FF00, friction: 1.5, name: 'Métal' },
  SAND:    { color: 0xFFFF00, friction: 2.0, name: 'Sable' }
} as const;

// =============================================================================
// PRESSION (RESSOURCE)
// =============================================================================

export const PRESSURE = {
  MAX: 100,
  SPRAY_CONSUMPTION: 6,      // unités/sec (8→6 pour plus de spray)
  BOMB_CONSUMPTION: 15,      // unités (fixe) (25→15 pour 6 bombes)
  REGEN_RATE: 20,            // unités/sec (si aucun input)
  OVERHEAT_DURATION: 1200    // ms
} as const;

// =============================================================================
// SPRAY (BRUSH)
// =============================================================================

export const SPRAY = {
  BASE_RADIUS: 80,           // px (plus gros pour les enfants)
  MIN_RADIUS: 40,            // px (sur éponge)
  MAX_RADIUS: 400,           // px (sur verre)
  INTERPOLATION_STEP: 10,    // px entre les points (augmenté)
  TRAIL_DELAY_FRAMES: 2,     // frames de délai pour l'inertie
  PARTICLE_COUNT: 4,         // particules par frame (augmenté)
  PARTICLE_SPREAD: 35        // angle de dispersion (degrés)
} as const;

// =============================================================================
// BOMBE (SPLAT)
// =============================================================================

export const BOMB = {
  CORE_RADIUS: 360,          // px (20% de l'écran = ~415k px²)
  EXPAND_DURATION: 100,      // ms (plus grosse = plus lente)
  PARTICLE_COUNT: 60,        // gouttes radiales (augmenté pour grosse bombe)
  SECONDARY_DELAY: 50,       // ms avant éclaboussures secondaires
  SECONDARY_COUNT: 12        // éclaboussures secondaires (augmenté)
} as const;

// =============================================================================
// INPUT
// =============================================================================

export const INPUT = {
  TAP_MAX_DURATION: 120,     // ms - au-delà = hold
  DOUBLE_TAP_MAX_GAP: 350,   // ms entre deux taps (✅ 200→350 enfant-friendly)
  HOLD_MIN_DURATION: 120     // ms avant de considérer un hold
} as const;

// =============================================================================
// SCORING
// =============================================================================

export const SCORING = {
  COVERAGE_MULTIPLIER: 1000,
  CLEANLINESS_MULTIPLIER: 500,
  ECONOMY_MULTIPLIER: 300,
  TIME_MULTIPLIER: 10,
  WIN_THRESHOLD: 0.9         // 90% couverture minimum
} as const;

// =============================================================================
// AUDIO
// =============================================================================

export const AUDIO = {
  MASTER_VOLUME: 0.8,
  SFX_VOLUME: 1.0,
  MUSIC_VOLUME: 0.5
} as const;

// =============================================================================
// TEXTURES PROCÉDURALES
// =============================================================================

export const TEXTURES = {
  BRUSH_BLOB_COUNT: 5,       // nombre de variations
  BRUSH_BLOB_SIZE: 64,       // px
  DROPLET_SIZE: 16,          // px
  SPLAT_CORE_COUNT: 3,       // nombre de variations
  SPLAT_CORE_SIZE: 128       // px
} as const;

// =============================================================================
// LAYER Z-INDEX
// =============================================================================

export const LAYERS = {
  BACKGROUND: 0,
  DATA: 1,                   // layer invisible pour friction
  PAINT: 2,                  // couche de peinture persistante
  PARTICLE: 3,               // particules temporaires
  UI: 4                      // interface utilisateur
} as const;
