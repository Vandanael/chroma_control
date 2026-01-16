/**
 * PaintSystem.ts - Système principal de peinture
 * Orchestre le BrushStroke, les particules et le SplatEffect
 * Gère la consommation de pression
 */

import { BrushStroke } from '@entities/BrushStroke';
import { SplatEffect } from '@entities/SplatEffect';
import { GhostTrail } from '@entities/GhostTrail';
import { PressureTank } from '@entities/PressureTank';
import { ParticleSystem } from './ParticleSystem';
import { audioSystem } from './AudioSystem';
import { haptics } from '@utils/Haptics';
import { game } from '@core/Game';
import { materialSystem } from './MaterialSystem';
import { PAINT_AREA } from '@utils/Constants';

// =============================================================================
// TYPES
// =============================================================================

interface Point {
  x: number;
  y: number;
  time: number;
}

// =============================================================================
// PAINT SYSTEM CLASS
// =============================================================================

export class PaintSystem {
  private brushStroke: BrushStroke;
  private particleSystem: ParticleSystem;
  private splatEffect: SplatEffect;
  private ghostTrail: GhostTrail;
  private pressureTank: PressureTank | null;
  
  // État du spray
  private isSpaying = false;
  private lastPoint: Point | null = null;
  private pointHistory: Point[] = [];
  private spraySoundId: number | null = null;
  private lastSurfaceSound: number = 0; // Timestamp du dernier son de surface
  
  constructor(pressureTank?: PressureTank) {
    this.pressureTank = pressureTank || null;
    this.particleSystem = new ParticleSystem();
    this.brushStroke = new BrushStroke();
    this.splatEffect = new SplatEffect(this.particleSystem);
    this.ghostTrail = new GhostTrail();
    
    // Ajouter les containers au layer particule
    const particleLayer = game.particleLayer;
    if (particleLayer) {
      particleLayer.addChild(this.particleSystem.getContainer());
      particleLayer.addChild(this.splatEffect.getContainer());
    }
  }
  
  // ==========================================================================
  // HELPERS
  // ==========================================================================
  
  /**
   * ✅ Vérifie si un point est dans la zone de peinture
   */
  private isInPaintArea(x: number, y: number): boolean {
    return (
      x >= PAINT_AREA.X &&
      x <= PAINT_AREA.X + PAINT_AREA.WIDTH &&
      y >= PAINT_AREA.Y &&
      y <= PAINT_AREA.Y + PAINT_AREA.HEIGHT
    );
  }
  
  /**
   * ✅ Clamp un point aux limites de la zone de peinture
   */
  private clampToPaintArea(x: number, y: number): { x: number; y: number } {
    return {
      x: Math.max(PAINT_AREA.X, Math.min(PAINT_AREA.X + PAINT_AREA.WIDTH, x)),
      y: Math.max(PAINT_AREA.Y, Math.min(PAINT_AREA.Y + PAINT_AREA.HEIGHT, y))
    };
  }
  
  // ==========================================================================
  // SPRAY (HOLD)
  // ==========================================================================
  
  /**
   * Démarre le spray à la position donnée
   */
  startSpray(x: number, y: number): void {
    // ✅ Vérifier si dans la zone de peinture
    if (!this.isInPaintArea(x, y)) {
      return;
    }
    
    // Vérifier si on peut sprayer
    if (this.pressureTank && !this.pressureTank.canSpray) {
      return;
    }
    
    this.isSpaying = true;
    this.lastPoint = { x, y, time: performance.now() };
    this.pointHistory = [this.lastPoint];
    
    // Commencer à consommer la pression
    this.pressureTank?.startConsuming();
    
    // Jouer le son de spray (loop)
    this.spraySoundId = audioSystem.play('spray') || null;
    
    // Vibration continue pour le spray
    haptics.vibrate('spray');
    
    this.brushStroke.startStroke(x, y);
  }
  
  /**
   * Continue le spray vers une nouvelle position
   */
  continueSpray(x: number, y: number): void {
    if (!this.isSpaying) return;
    
    // Si en surchauffe, arrêter le spray
    if (this.pressureTank && !this.pressureTank.canSpray) {
      this.endSpray();
      return;
    }
    
    // ✅ Clamp aux limites de la zone de peinture
    const clamped = this.clampToPaintArea(x, y);
    x = clamped.x;
    y = clamped.y;
    
    const now = performance.now();
    const currentPoint: Point = { x, y, time: now };
    
    // Calculer la vitesse et direction
    if (this.lastPoint) {
      const dx = x - this.lastPoint.x;
      const dy = y - this.lastPoint.y;
      const dt = (now - this.lastPoint.time) / 1000; // en secondes
      
      if (dt > 0) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = distance / dt;
        const angle = Math.atan2(dy, dx);
        
        // Dessiner le trait
        this.brushStroke.continueStroke(x, y);
        
        // Ajouter une traînée fantôme
        const colorValue = game.playerColorValue;
        const friction = materialSystem.getFrictionAt(x, y);
        const radius = 30 / friction; // Même calcul que BrushStroke
        this.ghostTrail.addTrailSegment(
          this.lastPoint.x,
          this.lastPoint.y,
          x,
          y,
          radius,
          colorValue
        );
        
        // Jouer un son de surface occasionnellement (tous les 300ms)
        if (now - this.lastSurfaceSound > 300) {
          this.playSurfaceSound(x, y);
          this.lastSurfaceSound = now;
        }
        
        // Spawn des particules satellites si on bouge assez vite
        if (speed > 50) {
          this.particleSystem.spawnSprayParticles(x, y, angle, speed);
        }
      }
    }
    
    this.lastPoint = currentPoint;
    this.pointHistory.push(currentPoint);
    
    // Garder seulement les 10 derniers points pour l'historique
    if (this.pointHistory.length > 10) {
      this.pointHistory.shift();
    }
  }
  
  /**
   * Termine le spray
   */
  endSpray(): void {
    if (!this.isSpaying) return;
    
    this.isSpaying = false;
    this.brushStroke.endStroke();
    
    // Arrêter de consommer la pression
    this.pressureTank?.stopConsuming();
    
    // Arrêter le son de spray
    if (this.spraySoundId !== null) {
      audioSystem.stop('spray', this.spraySoundId);
      this.spraySoundId = null;
    }
    
    // Arrêter la vibration
    haptics.stopContinuousVibration();
    
    // Rendre les particules restantes dans la paint texture
    this.particleSystem.renderToPaint();
    
    this.lastPoint = null;
    this.pointHistory = [];
  }
  
  // ==========================================================================
  // BOMBE (DOUBLE-TAP)
  // ==========================================================================
  
  /**
   * Déclenche une bombe à la position donnée
   */
  triggerBomb(x: number, y: number): void {
    // ✅ Vérifier si dans la zone de peinture
    if (!this.isInPaintArea(x, y)) {
      return;
    }
    
    // S'assurer de terminer tout spray en cours
    if (this.isSpaying) {
      this.endSpray();
    }
    
    // Vérifier si on peut lancer une bombe
    if (this.pressureTank && !this.pressureTank.consumeBomb()) {
      // Pas assez de pression
      return;
    }
    
    // Jouer les sons de bombe
    audioSystem.play('bomb_impact');
    // Délai pour le splash
    setTimeout(() => {
      audioSystem.play('bomb_splash');
    }, 50);
    
    // Vibration forte pour la bombe
    haptics.vibrate('bomb');
    
    this.splatEffect.trigger(x, y);
  }
  
  // ==========================================================================
  // UPDATE
  // ==========================================================================
  
  /**
   * Met à jour le système (appelé chaque frame)
   * @param deltaTime Temps écoulé en ms
   */
  update(deltaTime: number): void {
    // Mettre à jour les particules
    this.particleSystem.update(deltaTime);
    
    // Mettre à jour la traînée fantôme
    this.ghostTrail.update(deltaTime);
  }
  
  /**
   * Joue un son spécifique selon la surface
   */
  private playSurfaceSound(x: number, y: number): void {
    const friction = materialSystem.getFrictionAt(x, y);
    
    // Déterminer le type de surface selon la friction
    if (friction === 3.0) {
      audioSystem.play('surface_sponge');
    } else if (friction === 0.2) {
      audioSystem.play('surface_glass');
    } else if (friction === 1.5) {
      audioSystem.play('surface_metal');
    } else if (friction === 2.0) {
      audioSystem.play('surface_sand');
    }
    // Pas de son pour Neutral (friction 1.0) ou Void (Infinity)
  }
  
  // ==========================================================================
  // GETTERS
  // ==========================================================================
  
  get spraying(): boolean {
    return this.isSpaying;
  }
  
  get bombAnimating(): boolean {
    return this.splatEffect.animating;
  }
  
  // ==========================================================================
  // CLEANUP
  // ==========================================================================
  
  /**
   * Nettoie tout
   */
  clear(): void {
    this.endSpray();
    this.particleSystem.clear();
    this.ghostTrail.clear();
    this.lastSurfaceSound = 0;
  }
  
  /**
   * Détruit le système
   */
  destroy(): void {
    this.clear();
    this.brushStroke.destroy();
    this.particleSystem.destroy();
    this.splatEffect.destroy();
    this.ghostTrail.destroy();
  }
}
