/**
 * PixelCounter.ts - Calcul de couverture optimisé
 * Compte les pixels couverts vs pixels cibles
 */

import { CANVAS } from '@utils/Constants';
import { game } from '@core/Game';
import { materialSystem } from '@systems/MaterialSystem';

// =============================================================================
// TYPES
// =============================================================================

export interface CoverageResult {
  pixelsCovered: number;
  pixelsTarget: number;
  pixelsOverflow: number; // Pixels peints sur zone interdite (void)
  coverageRatio: number; // pixelsCovered / pixelsTarget
  cleanlinessRatio: number; // 1 - (pixelsOverflow / pixelsTarget)
}

// =============================================================================
// PIXEL COUNTER CLASS
// =============================================================================

class PixelCounter {
  private frameCounter = 0;
  private readonly UPDATE_INTERVAL = 10; // Mettre à jour toutes les 10 frames
  
  /**
   * Calcule la couverture actuelle
   * Optimisé : ne calcule que toutes les N frames
   */
  calculateCoverage(force: boolean = false): CoverageResult | null {
    if (!force && this.frameCounter++ % this.UPDATE_INTERVAL !== 0) {
      return null;
    }
    
    const paintTexture = game.paintRenderTexture;
    const app = game.application;
    if (!paintTexture || !app || !materialSystem.loaded) {
      return null;
    }
    
    // Extraire les pixels de la RenderTexture en utilisant extract.canvas()
    const extract = app.renderer.extract;
    const canvas = extract.canvas(paintTexture);
    
    if (!canvas) {
      return this.calculateCoverageFallback();
    }
    
    // Lire les pixels depuis le canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return this.calculateCoverageFallback();
    }
    
    const paintData = ctx.getImageData(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
    
    // Compter les pixels
    let pixelsCovered = 0;
    let pixelsTarget = 0;
    let pixelsOverflow = 0;
    
    // Parcourir tous les pixels (échantillonnage pour performance)
    const sampleRate = 4; // Un pixel sur 4 pour accélérer
    
    for (let y = 0; y < CANVAS.HEIGHT; y += sampleRate) {
      for (let x = 0; x < CANVAS.WIDTH; x += sampleRate) {
        const index = (y * CANVAS.WIDTH + x) * 4;
        const a = paintData.data[index + 3];
        
        // Si pixel peint (alpha > seuil)
        const isPainted = a > 10;
        
        // Vérifier la surface à cette position
        const surface = materialSystem.getSurfaceAt(x, y);
        
        // Zone cible = toutes les surfaces sauf void
        if (surface.type !== 'VOID') {
          pixelsTarget += sampleRate * sampleRate; // Compenser l'échantillonnage
          
          if (isPainted) {
            pixelsCovered += sampleRate * sampleRate;
          }
        } else {
          // Zone interdite (void)
          if (isPainted) {
            pixelsOverflow += sampleRate * sampleRate;
          }
        }
      }
    }
    
    const coverageRatio = pixelsTarget > 0 ? pixelsCovered / pixelsTarget : 0;
    const cleanlinessRatio = pixelsTarget > 0 
      ? Math.max(0, 1 - (pixelsOverflow / pixelsTarget))
      : 1;
    
    return {
      pixelsCovered,
      pixelsTarget,
      pixelsOverflow,
      coverageRatio,
      cleanlinessRatio
    };
  }
  
  /**
   * Méthode fallback si on ne peut pas extraire directement la RenderTexture
   */
  private calculateCoverageFallback(): CoverageResult {
    // Approche simplifiée : estimer basé sur la surface totale
    // Cette méthode est moins précise mais fonctionne toujours
    const totalPixels = CANVAS.WIDTH * CANVAS.HEIGHT;
    
    // Estimation : on suppose qu'une partie de la zone est peinte
    // Dans un vrai système, on devrait lire directement la RenderTexture
    // Pour l'instant, on retourne des valeurs par défaut
    return {
      pixelsCovered: 0,
      pixelsTarget: totalPixels * 0.8, // Estimation
      pixelsOverflow: 0,
      coverageRatio: 0,
      cleanlinessRatio: 1
    };
  }
  
  /**
   * Force un recalcul immédiat
   */
  forceRecalculate(): CoverageResult | null {
    this.frameCounter = 0;
    return this.calculateCoverage(true);
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const pixelCounter = new PixelCounter();
