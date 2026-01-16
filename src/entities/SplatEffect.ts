/**
 * SplatEffect.ts - Effet d'explosion de bombe
 * Animation scale du core + particules radiales + éclaboussures secondaires
 */

import { Container, Sprite, Texture } from 'pixi.js';
import gsap from 'gsap';
import { BOMB } from '@utils/Constants';
import { game } from '@core/Game';
import { ParticleSystem } from '@systems/ParticleSystem';

// =============================================================================
// SPLAT EFFECT CLASS
// =============================================================================

export class SplatEffect {
  private container: Container;
  private coreSprite: Sprite | null = null;
  private splatTextures: Texture[] = [];
  private particleSystem: ParticleSystem;
  private isAnimating = false;
  
  constructor(particleSystem: ParticleSystem) {
    this.container = new Container();
    this.particleSystem = particleSystem;
    
    // Récupérer les textures splat
    const textures = game.gameTextures;
    if (textures) {
      this.splatTextures = textures.splatCores;
    }
  }
  
  /**
   * Déclenche l'effet de bombe à la position donnée
   */
  trigger(x: number, y: number): void {
    if (this.isAnimating) return;
    if (this.splatTextures.length === 0) return;
    
    this.isAnimating = true;
    const playerColor = game.playerColorValue;
    
    // Choisir une texture aléatoire
    const textureIndex = Math.floor(Math.random() * this.splatTextures.length);
    const texture = this.splatTextures[textureIndex];
    
    // Créer le sprite core
    this.coreSprite = new Sprite(texture);
    this.coreSprite.anchor.set(0.5);
    this.coreSprite.position.set(x, y);
    this.coreSprite.tint = playerColor;
    this.coreSprite.rotation = Math.random() * Math.PI * 2;
    
    // Commencer à scale 0
    const targetScale = (BOMB.CORE_RADIUS * 2) / texture.width;
    this.coreSprite.scale.set(0);
    
    this.container.addChild(this.coreSprite);
    
    // Animation d'expansion (0 -> 100% en 80ms)
    gsap.to(this.coreSprite.scale, {
      x: targetScale,
      y: targetScale,
      duration: BOMB.EXPAND_DURATION / 1000,
      ease: 'back.out(1.5)',
      onComplete: () => {
        this.onExpandComplete(x, y);
      }
    });
    
    // Spawn des particules radiales immédiatement
    this.particleSystem.spawnRadialParticles(x, y, BOMB.PARTICLE_COUNT, 300);
    
    // Éclaboussures secondaires avec délai
    setTimeout(() => {
      this.spawnSecondaryDroplets(x, y);
    }, BOMB.SECONDARY_DELAY);
  }
  
  /**
   * Appelé quand l'expansion est terminée
   */
  private onExpandComplete(x: number, y: number): void {
    // Rendre le core dans la paintTexture
    if (this.coreSprite) {
      game.renderToPaint(this.container);
      
      // Settling animation (vibration puis stabilisation)
      this.playSettlingAnimation(x, y);
    }
  }
  
  /**
   * Animation de settling (vibration post-impact)
   */
  private playSettlingAnimation(x: number, y: number): void {
    if (!this.coreSprite) return;
    
    const originalX = x;
    const originalY = y;
    const amplitude = 2; // 2px d'amplitude
    
    // Timeline GSAP pour la vibration
    const tl = gsap.timeline({
      onComplete: () => {
        this.cleanup();
      }
    });
    
    // Vibration rapide (3 oscillations)
    for (let i = 0; i < 3; i++) {
      const decay = 1 - (i / 3);
      tl.to(this.coreSprite.position, {
        x: originalX + amplitude * decay,
        y: originalY - amplitude * decay * 0.5,
        duration: 0.03
      })
      .to(this.coreSprite.position, {
        x: originalX - amplitude * decay,
        y: originalY + amplitude * decay * 0.5,
        duration: 0.03
      });
    }
    
    // Retour à la position originale avec ease-out
    tl.to(this.coreSprite.position, {
      x: originalX,
      y: originalY,
      duration: 0.1,
      ease: 'power2.out'
    });
  }
  
  /**
   * Spawn des éclaboussures secondaires
   */
  private spawnSecondaryDroplets(x: number, y: number): void {
    // Positions décalées autour du centre
    for (let i = 0; i < BOMB.SECONDARY_COUNT; i++) {
      const angle = (i / BOMB.SECONDARY_COUNT) * Math.PI * 2 + Math.random() * 0.5;
      const distance = BOMB.CORE_RADIUS * (0.8 + Math.random() * 0.4);
      
      const dropX = x + Math.cos(angle) * distance;
      const dropY = y + Math.sin(angle) * distance;
      
      // Spawn quelques particules à chaque position secondaire
      this.particleSystem.spawnRadialParticles(dropX, dropY, 5, 100);
    }
  }
  
  /**
   * Nettoie l'effet
   */
  private cleanup(): void {
    if (this.coreSprite) {
      this.container.removeChild(this.coreSprite);
      this.coreSprite.destroy();
      this.coreSprite = null;
    }
    this.isAnimating = false;
  }
  
  /**
   * Retourne le container
   */
  getContainer(): Container {
    return this.container;
  }
  
  /**
   * Vérifie si l'effet est en cours
   */
  get animating(): boolean {
    return this.isAnimating;
  }
  
  /**
   * Détruit l'effet
   */
  destroy(): void {
    if (this.coreSprite) {
      gsap.killTweensOf(this.coreSprite.scale);
      gsap.killTweensOf(this.coreSprite.position);
    }
    this.cleanup();
    this.container.destroy({ children: true });
  }
}
