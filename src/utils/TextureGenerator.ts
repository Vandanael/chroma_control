/**
 * TextureGenerator.ts - Génération de textures procédurales
 * Brush blobs, droplets et splat cores générés en code
 */

import { Graphics, RenderTexture, Application, Texture } from 'pixi.js';
import { TEXTURES } from './Constants';

// Cache des textures générées
const textureCache: Map<string, Texture> = new Map();

/**
 * Génère une forme blob organique (pas un cercle parfait)
 */
function generateBlobShape(
  graphics: Graphics,
  centerX: number,
  centerY: number,
  baseRadius: number,
  irregularity: number = 0.3,
  seed: number = 0
): void {
  const points: { x: number; y: number }[] = [];
  const segments = 24;
  
  // Générateur pseudo-aléatoire simple basé sur seed
  const random = (i: number) => {
    const x = Math.sin(seed * 9999 + i * 7919) * 10000;
    return x - Math.floor(x);
  };
  
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    // Variation du rayon pour forme organique
    const radiusVariation = 1 + (random(i) - 0.5) * irregularity;
    const r = baseRadius * radiusVariation;
    
    points.push({
      x: centerX + Math.cos(angle) * r,
      y: centerY + Math.sin(angle) * r
    });
  }
  
  // Dessiner avec des courbes de Bézier pour lisser
  graphics.moveTo(points[0].x, points[0].y);
  
  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length];
    const nextNext = points[(i + 2) % points.length];
    
    // Point de contrôle pour courbe lisse
    const cpX = next.x;
    const cpY = next.y;
    const endX = (next.x + nextNext.x) / 2;
    const endY = (next.y + nextNext.y) / 2;
    
    graphics.quadraticCurveTo(cpX, cpY, endX, endY);
  }
  
  graphics.closePath();
}

/**
 * Génère les textures de brush blob (5 variations)
 */
export function generateBrushBlobs(app: Application): Texture[] {
  const textures: Texture[] = [];
  const size = TEXTURES.BRUSH_BLOB_SIZE;
  
  for (let i = 0; i < TEXTURES.BRUSH_BLOB_COUNT; i++) {
    const cacheKey = `brush_blob_${i}`;
    
    if (textureCache.has(cacheKey)) {
      textures.push(textureCache.get(cacheKey)!);
      continue;
    }
    
    const graphics = new Graphics();
    const center = size / 2;
    const radius = size / 2 - 4; // Marge pour éviter le clipping
    
    // Forme blob avec gradient radial simulé
    // Couche externe (plus transparente)
    graphics.fill({ color: 0xFFFFFF, alpha: 0.3 });
    generateBlobShape(graphics, center, center, radius, 0.35, i * 100);
    graphics.fill();
    
    // Couche centrale (plus opaque)
    graphics.fill({ color: 0xFFFFFF, alpha: 0.6 });
    generateBlobShape(graphics, center, center, radius * 0.7, 0.25, i * 100 + 1);
    graphics.fill();
    
    // Cœur (opaque)
    graphics.fill({ color: 0xFFFFFF, alpha: 1.0 });
    generateBlobShape(graphics, center, center, radius * 0.4, 0.15, i * 100 + 2);
    graphics.fill();
    
    // Créer la RenderTexture
    const renderTexture = RenderTexture.create({
      width: size,
      height: size,
      antialias: true
    });
    
    app.renderer.render({ container: graphics, target: renderTexture });
    
    textureCache.set(cacheKey, renderTexture);
    textures.push(renderTexture);
    
    graphics.destroy();
  }
  
  return textures;
}

/**
 * Génère la texture droplet (goutte simple)
 */
export function generateDropletTexture(app: Application): Texture {
  const cacheKey = 'droplet';
  
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }
  
  const size = TEXTURES.DROPLET_SIZE;
  const graphics = new Graphics();
  const center = size / 2;
  
  // Goutte avec gradient
  graphics.fill({ color: 0xFFFFFF, alpha: 0.4 });
  graphics.circle(center, center, size / 2 - 1);
  graphics.fill();
  
  graphics.fill({ color: 0xFFFFFF, alpha: 0.7 });
  graphics.circle(center, center, size / 3);
  graphics.fill();
  
  graphics.fill({ color: 0xFFFFFF, alpha: 1.0 });
  graphics.circle(center, center, size / 5);
  graphics.fill();
  
  const renderTexture = RenderTexture.create({
    width: size,
    height: size,
    antialias: true
  });
  
  app.renderer.render({ container: graphics, target: renderTexture });
  
  textureCache.set(cacheKey, renderTexture);
  graphics.destroy();
  
  return renderTexture;
}

/**
 * Génère les textures splat core (3 variations pour les bombes)
 */
export function generateSplatCores(app: Application): Texture[] {
  const textures: Texture[] = [];
  const size = TEXTURES.SPLAT_CORE_SIZE;
  
  for (let i = 0; i < TEXTURES.SPLAT_CORE_COUNT; i++) {
    const cacheKey = `splat_core_${i}`;
    
    if (textureCache.has(cacheKey)) {
      textures.push(textureCache.get(cacheKey)!);
      continue;
    }
    
    const graphics = new Graphics();
    const center = size / 2;
    const radius = size / 2 - 8;
    
    // Forme splat plus chaotique (irregularity plus haute)
    graphics.fill({ color: 0xFFFFFF, alpha: 0.2 });
    generateBlobShape(graphics, center, center, radius, 0.5, i * 200);
    graphics.fill();
    
    graphics.fill({ color: 0xFFFFFF, alpha: 0.5 });
    generateBlobShape(graphics, center, center, radius * 0.75, 0.4, i * 200 + 1);
    graphics.fill();
    
    graphics.fill({ color: 0xFFFFFF, alpha: 0.8 });
    generateBlobShape(graphics, center, center, radius * 0.5, 0.3, i * 200 + 2);
    graphics.fill();
    
    graphics.fill({ color: 0xFFFFFF, alpha: 1.0 });
    generateBlobShape(graphics, center, center, radius * 0.25, 0.2, i * 200 + 3);
    graphics.fill();
    
    const renderTexture = RenderTexture.create({
      width: size,
      height: size,
      antialias: true
    });
    
    app.renderer.render({ container: graphics, target: renderTexture });
    
    textureCache.set(cacheKey, renderTexture);
    textures.push(renderTexture);
    
    graphics.destroy();
  }
  
  return textures;
}

/**
 * Génère toutes les textures procédurales
 */
export function generateAllTextures(app: Application): {
  brushBlobs: Texture[];
  droplet: Texture;
  splatCores: Texture[];
} {
  console.log('[TextureGenerator] Generating procedural textures...');
  
  const brushBlobs = generateBrushBlobs(app);
  console.log(`[TextureGenerator] Generated ${brushBlobs.length} brush blobs`);
  
  const droplet = generateDropletTexture(app);
  console.log('[TextureGenerator] Generated droplet texture');
  
  const splatCores = generateSplatCores(app);
  console.log(`[TextureGenerator] Generated ${splatCores.length} splat cores`);
  
  return { brushBlobs, droplet, splatCores };
}

/**
 * Nettoie le cache des textures
 */
export function clearTextureCache(): void {
  textureCache.forEach((texture) => texture.destroy());
  textureCache.clear();
  console.log('[TextureGenerator] Texture cache cleared');
}
