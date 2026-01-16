/**
 * GhostTrail.ts - Traînée fantôme pour le spray
 * Version semi-transparente du trait qui fade-out sur 200ms
 */

import { Container, Graphics } from 'pixi.js';
import { game } from '@core/Game';

interface TrailSegment {
  graphics: Graphics;
  startTime: number;
  duration: number; // 200ms
}

export class GhostTrail {
  private container: Container;
  private activeTrails: TrailSegment[] = [];
  private readonly FADE_DURATION = 200; // ms
  
  constructor() {
    this.container = new Container();
    
    // Ajouter au layer paint (sous la peinture principale)
    const paintLayer = game.paintLayer;
    if (paintLayer) {
      paintLayer.addChildAt(this.container, 0); // En dessous
    }
  }
  
  /**
   * Ajoute un segment de traînée fantôme
   */
  addTrailSegment(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    radius: number,
    color: number
  ): void {
    const graphics = new Graphics();
    
    // Dessiner le trait avec alpha initial
    graphics.moveTo(x1, y1);
    graphics.lineTo(x2, y2);
    graphics.stroke({
      color,
      width: radius * 2,
      alpha: 0.3, // Alpha initial
      cap: 'round'
    });
    
    this.container.addChild(graphics);
    
    this.activeTrails.push({
      graphics,
      startTime: performance.now(),
      duration: this.FADE_DURATION
    });
  }
  
  /**
   * Met à jour les traînées (fade-out)
   */
  update(_deltaTime: number): void {
    const now = performance.now();
    
    // Mettre à jour l'alpha de chaque traînée
    for (let i = this.activeTrails.length - 1; i >= 0; i--) {
      const trail = this.activeTrails[i];
      const elapsed = now - trail.startTime;
      const progress = elapsed / trail.duration;
      
      if (progress >= 1) {
        // Traînée terminée, la supprimer
        trail.graphics.destroy();
        this.activeTrails.splice(i, 1);
      } else {
        // Fade-out linéaire
        const alpha = 0.3 * (1 - progress);
        trail.graphics.alpha = alpha;
      }
    }
  }
  
  /**
   * Nettoie toutes les traînées
   */
  clear(): void {
    for (const trail of this.activeTrails) {
      trail.graphics.destroy();
    }
    this.activeTrails = [];
  }
  
  /**
   * Retourne le container
   */
  getContainer(): Container {
    return this.container;
  }
  
  /**
   * Détruit la traînée fantôme
   */
  destroy(): void {
    this.clear();
    this.container.destroy({ children: true });
  }
}
