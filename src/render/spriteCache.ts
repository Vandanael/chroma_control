/**
 * Sprite Cache - Pre-rendering avec OffscreenCanvas
 * Cache les différents états de nœuds pour éviter de les redessiner chaque frame
 */

// =============================================================================
// TYPES
// =============================================================================

interface CachedSprite {
  canvas: OffscreenCanvas;
  radius: number;
  state: 'normal' | 'pulsing' | 'isolated';
  owner: 'player' | 'enemy';
  isDropPod: boolean;
}

// =============================================================================
// STATE
// =============================================================================

const spriteCache = new Map<string, CachedSprite>();
const MAX_CACHE_SIZE = 50; // Limite pour éviter consommation mémoire excessive

// =============================================================================
// CONSTANTS
// =============================================================================

const SPRITE_SIZE = 100; // Taille du sprite (doit être > 2 * max radius)

// =============================================================================
// SPRITE GENERATION
// =============================================================================

/**
 * Génère un sprite pour un nœud
 */
function generateSprite(
  radius: number,
  color: string,
  isDropPod: boolean,
  state: 'normal' | 'pulsing' | 'isolated'
): OffscreenCanvas {
  const canvas = new OffscreenCanvas(SPRITE_SIZE, SPRITE_SIZE);
  const ctx = canvas.getContext('2d', { alpha: true });
  
  if (!ctx) {
    throw new Error('Could not get OffscreenCanvas context');
  }

  const centerX = SPRITE_SIZE / 2;
  const centerY = SPRITE_SIZE / 2;

  // Fond transparent
  ctx.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);

  // Glow (shadow)
  if (state === 'pulsing') {
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
  } else {
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
  }

  // Cercle principal
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Cœur lumineux (pour Drop-Pod et nœuds puissants)
  if (isDropPod) {
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  // Effet d'isolation (opacité réduite)
  if (state === 'isolated') {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    ctx.globalCompositeOperation = 'source-over';
  }

  return canvas;
}

/**
 * Obtient ou génère un sprite pour un nœud
 */
export function getSprite(
  radius: number,
  color: string,
  isDropPod: boolean,
  state: 'normal' | 'pulsing' | 'isolated',
  owner: 'player' | 'enemy'
): OffscreenCanvas {
  // Clé de cache
  const cacheKey = `${owner}-${radius}-${isDropPod ? 'drop' : 'node'}-${state}`;

  // Vérifier le cache
  const cached = spriteCache.get(cacheKey);
  if (cached) {
    return cached.canvas;
  }

  // Générer nouveau sprite
  const sprite = generateSprite(radius, color, isDropPod, state);
  
  // Ajouter au cache (avec limite)
  if (spriteCache.size >= MAX_CACHE_SIZE) {
    // Supprimer le plus ancien (FIFO)
    const firstKey = spriteCache.keys().next().value;
    if (firstKey) {
      spriteCache.delete(firstKey);
    }
  }
  
  spriteCache.set(cacheKey, {
    canvas: sprite,
    radius,
    state,
    owner,
    isDropPod,
  });

  return sprite;
}

/**
 * Nettoie le cache (appelé lors du reset)
 */
export function clearSpriteCache(): void {
  spriteCache.clear();
  console.log('[SpriteCache] Cleared');
}
