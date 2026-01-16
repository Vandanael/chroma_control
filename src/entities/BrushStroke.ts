/**
 * BrushStroke.ts - Trait de peinture organique
 * Dessine dans la RenderTexture avec interpolation fluide
 * Applique la friction selon le type de surface
 */

import { Container, Sprite, Texture } from 'pixi.js';
import { SPRAY } from '@utils/Constants';
import { game } from '@core/Game';
import { materialSystem } from '@systems/MaterialSystem';

// =============================================================================
// TYPES
// =============================================================================

interface Point {
  x: number;
  y: number;
}

// =============================================================================
// BRUSH STROKE CLASS
// =============================================================================

export class BrushStroke {
  private container: Container;
  private lastPoint: Point | null = null;
  private brushTextures: Texture[] = [];
  private currentColor: number;
  
  constructor() {
    this.container = new Container();
    this.currentColor = game.playerColorValue;
    
    // Récupérer les textures de brush
    const textures = game.gameTextures;
    if (textures) {
      this.brushTextures = textures.brushBlobs;
    }
  }
  
  /**
   * Démarre un nouveau trait à la position donnée
   */
  startStroke(x: number, y: number): void {
    this.lastPoint = { x, y };
    this.currentColor = game.playerColorValue;
    
    // Dessiner le premier point
    this.drawBlobAt(x, y, SPRAY.BASE_RADIUS);
  }
  
  /**
   * Continue le trait vers une nouvelle position
   * Interpole entre les points pour un trail fluide
   */
  continueStroke(x: number, y: number): void {
    if (!this.lastPoint) {
      this.startStroke(x, y);
      return;
    }
    
    // Calculer la distance
    const dx = x - this.lastPoint.x;
    const dy = y - this.lastPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Si la distance est trop petite, ne pas dessiner
    if (distance < SPRAY.INTERPOLATION_STEP / 2) {
      return;
    }
    
    // Interpoler entre les points
    const steps = Math.ceil(distance / SPRAY.INTERPOLATION_STEP);
    
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const interpX = this.lastPoint.x + dx * t;
      const interpY = this.lastPoint.y + dy * t;
      
      // Variation légère du rayon pour effet organique
      const radiusVariation = 0.9 + Math.random() * 0.2;
      const radius = SPRAY.BASE_RADIUS * radiusVariation;
      
      this.drawBlobAt(interpX, interpY, radius);
    }
    
    this.lastPoint = { x, y };
  }
  
  /**
   * Termine le trait
   */
  endStroke(): void {
    // Rendre le contenu dans la paintTexture
    if (this.container.children.length > 0) {
      game.renderToPaint(this.container);
      
      // Nettoyer le container temporaire
      this.container.removeChildren();
    }
    
    this.lastPoint = null;
  }
  
  /**
   * Dessine un blob à la position donnée
   * Applique la friction de la surface pour modifier le rayon
   */
  private drawBlobAt(x: number, y: number, radius: number): void {
    if (this.brushTextures.length === 0) return;
    
    // Vérifier si on est sur une zone vide (interdit)
    if (materialSystem.isVoidAt(x, y)) {
      // TODO: Feedback visuel/sonore que c'est interdit
      return;
    }
    
    // Récupérer la friction de la surface
    const friction = materialSystem.getFrictionAt(x, y);
    
    // Calculer le rayon effectif : effectiveRadius = baseRadius * (1/friction)
    // - Éponge (friction 3.0) → rayon réduit à 33%
    // - Neutre (friction 1.0) → rayon normal
    // - Verre (friction 0.2) → rayon augmenté à 500%
    const effectiveRadius = radius / friction;
    
    // Clamp le rayon entre min et max
    const clampedRadius = Math.max(
      SPRAY.MIN_RADIUS,
      Math.min(SPRAY.MAX_RADIUS, effectiveRadius)
    );
    
    // Choisir une texture aléatoire
    const textureIndex = Math.floor(Math.random() * this.brushTextures.length);
    const texture = this.brushTextures[textureIndex];
    
    // Créer le sprite
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.position.set(x, y);
    
    // Scale pour atteindre le rayon souhaité
    const scale = (clampedRadius * 2) / texture.width;
    sprite.scale.set(scale);
    
    // Rotation aléatoire pour variation
    sprite.rotation = Math.random() * Math.PI * 2;
    
    // Appliquer la couleur du joueur
    sprite.tint = this.currentColor;
    
    // Ajouter au container
    this.container.addChild(sprite);
    
    // Rendre immédiatement dans la paintTexture pour feedback instantané
    game.renderToPaint(this.container);
    this.container.removeChildren();
  }
  
  /**
   * Nettoie les ressources
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
