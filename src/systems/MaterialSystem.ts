/**
 * MaterialSystem.ts - Système de lecture des surfaces
 * Lit le DataLayer (canvas offscreen) pour déterminer la friction
 */

import { SURFACES, CANVAS } from '@utils/Constants';

// =============================================================================
// TYPES
// =============================================================================

export type SurfaceType = keyof typeof SURFACES;

export interface SurfaceInfo {
  type: SurfaceType;
  friction: number;
  name: string;
}

// =============================================================================
// MATERIAL SYSTEM CLASS
// =============================================================================

class MaterialSystem {
  private dataCanvas: HTMLCanvasElement | null = null;
  private dataCtx: CanvasRenderingContext2D | null = null;
  private imageData: ImageData | null = null;
  private isLoaded = false;
  
  // Cache pour éviter les lectures répétées
  private cache: Map<string, SurfaceInfo> = new Map();
  private cacheSize = 1000;
  
  /**
   * Charge une data map (image PNG avec zones colorées)
   */
  async loadDataMap(imagePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        // Créer le canvas offscreen
        this.dataCanvas = document.createElement('canvas');
        this.dataCanvas.width = CANVAS.WIDTH;
        this.dataCanvas.height = CANVAS.HEIGHT;
        
        this.dataCtx = this.dataCanvas.getContext('2d', { willReadFrequently: true });
        if (!this.dataCtx) {
          reject(new Error('Could not get 2D context'));
          return;
        }
        
        // Dessiner l'image dans le canvas (redimensionnée si nécessaire)
        this.dataCtx.drawImage(img, 0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
        
        // Pré-charger l'ImageData pour des lectures rapides
        this.imageData = this.dataCtx.getImageData(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
        
        this.isLoaded = true;
        this.cache.clear();
        
        console.log(`[MaterialSystem] Data map loaded: ${imagePath}`);
        resolve();
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load data map: ${imagePath}`));
      };
      
      img.src = imagePath;
    });
  }
  
  /**
   * Crée une data map vide (tout neutre)
   */
  createEmptyDataMap(): void {
    this.dataCanvas = document.createElement('canvas');
    this.dataCanvas.width = CANVAS.WIDTH;
    this.dataCanvas.height = CANVAS.HEIGHT;
    
    this.dataCtx = this.dataCanvas.getContext('2d', { willReadFrequently: true });
    if (!this.dataCtx) return;
    
    // Remplir avec la couleur neutre
    this.dataCtx.fillStyle = `#${SURFACES.NEUTRAL.color.toString(16).padStart(6, '0')}`;
    this.dataCtx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
    
    this.imageData = this.dataCtx.getImageData(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
    this.isLoaded = true;
    this.cache.clear();
    
    console.log('[MaterialSystem] Empty data map created (all neutral)');
  }
  
  /**
   * Crée une data map de test avec différentes zones
   */
  createTestDataMap(): void {
    this.dataCanvas = document.createElement('canvas');
    this.dataCanvas.width = CANVAS.WIDTH;
    this.dataCanvas.height = CANVAS.HEIGHT;
    
    this.dataCtx = this.dataCanvas.getContext('2d', { willReadFrequently: true });
    if (!this.dataCtx) return;
    
    // Fond neutre
    this.dataCtx.fillStyle = `#${SURFACES.NEUTRAL.color.toString(16).padStart(6, '0')}`;
    this.dataCtx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
    
    // Zone éponge (en haut à gauche) - Rouge
    this.dataCtx.fillStyle = `#${SURFACES.SPONGE.color.toString(16).padStart(6, '0')}`;
    this.dataCtx.fillRect(50, 200, 400, 400);
    
    // Zone verre (en haut à droite) - Bleu
    this.dataCtx.fillStyle = `#${SURFACES.GLASS.color.toString(16).padStart(6, '0')}`;
    this.dataCtx.fillRect(630, 200, 400, 400);
    
    // Zone vide (bande au milieu) - Noir
    this.dataCtx.fillStyle = `#${SURFACES.VOID.color.toString(16).padStart(6, '0')}`;
    this.dataCtx.fillRect(440, 700, 200, 600);
    
    // Zone métal (en bas à gauche) - Vert
    this.dataCtx.fillStyle = `#${SURFACES.METAL.color.toString(16).padStart(6, '0')}`;
    this.dataCtx.fillRect(50, 1400, 400, 400);
    
    // Zone sable (en bas à droite) - Jaune
    this.dataCtx.fillStyle = `#${SURFACES.SAND.color.toString(16).padStart(6, '0')}`;
    this.dataCtx.fillRect(630, 1400, 400, 400);
    
    this.imageData = this.dataCtx.getImageData(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
    this.isLoaded = true;
    this.cache.clear();
    
    console.log('[MaterialSystem] Test data map created');
  }
  
  /**
   * Récupère les informations de surface à une position donnée
   */
  getSurfaceAt(x: number, y: number): SurfaceInfo {
    // Valeur par défaut
    const defaultSurface: SurfaceInfo = {
      type: 'NEUTRAL',
      friction: SURFACES.NEUTRAL.friction,
      name: SURFACES.NEUTRAL.name
    };
    
    if (!this.isLoaded || !this.imageData) {
      return defaultSurface;
    }
    
    // Clamp les coordonnées
    const px = Math.floor(Math.max(0, Math.min(CANVAS.WIDTH - 1, x)));
    const py = Math.floor(Math.max(0, Math.min(CANVAS.HEIGHT - 1, y)));
    
    // Vérifier le cache
    const cacheKey = `${px},${py}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Lire la couleur du pixel
    const index = (py * CANVAS.WIDTH + px) * 4;
    const r = this.imageData.data[index];
    const g = this.imageData.data[index + 1];
    const b = this.imageData.data[index + 2];
    
    // Convertir en couleur hex
    const color = (r << 16) | (g << 8) | b;
    
    // Trouver la surface correspondante
    const surface = this.colorToSurface(color);
    
    // Mettre en cache
    if (this.cache.size >= this.cacheSize) {
      // Vider le cache si trop grand
      this.cache.clear();
    }
    this.cache.set(cacheKey, surface);
    
    return surface;
  }
  
  /**
   * Récupère la friction à une position donnée
   */
  getFrictionAt(x: number, y: number): number {
    return this.getSurfaceAt(x, y).friction;
  }
  
  /**
   * Vérifie si une position est sur une zone vide (interdit)
   */
  isVoidAt(x: number, y: number): boolean {
    return this.getSurfaceAt(x, y).type === 'VOID';
  }
  
  /**
   * Convertit une couleur en type de surface
   */
  private colorToSurface(color: number): SurfaceInfo {
    // Tolérance pour la comparaison de couleurs
    const tolerance = 30;
    
    for (const [type, info] of Object.entries(SURFACES)) {
      if (this.colorsMatch(color, info.color, tolerance)) {
        return {
          type: type as SurfaceType,
          friction: info.friction,
          name: info.name
        };
      }
    }
    
    // Par défaut, neutre
    return {
      type: 'NEUTRAL',
      friction: SURFACES.NEUTRAL.friction,
      name: SURFACES.NEUTRAL.name
    };
  }
  
  /**
   * Compare deux couleurs avec tolérance
   */
  private colorsMatch(c1: number, c2: number, tolerance: number): boolean {
    const r1 = (c1 >> 16) & 0xFF;
    const g1 = (c1 >> 8) & 0xFF;
    const b1 = c1 & 0xFF;
    
    const r2 = (c2 >> 16) & 0xFF;
    const g2 = (c2 >> 8) & 0xFF;
    const b2 = c2 & 0xFF;
    
    return Math.abs(r1 - r2) <= tolerance &&
           Math.abs(g1 - g2) <= tolerance &&
           Math.abs(b1 - b2) <= tolerance;
  }
  
  /**
   * Vérifie si le système est chargé
   */
  get loaded(): boolean {
    return this.isLoaded;
  }
  
  /**
   * Nettoie le système
   */
  destroy(): void {
    this.dataCanvas = null;
    this.dataCtx = null;
    this.imageData = null;
    this.isLoaded = false;
    this.cache.clear();
    
    console.log('[MaterialSystem] Destroyed');
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const materialSystem = new MaterialSystem();
