/**
 * ParticleSystem.ts - Gestion des particules satellites (spray)
 * Pool de particules recyclées avec physique légère
 */

import { Container, Sprite, Texture } from 'pixi.js';
import { SPRAY } from '@utils/Constants';
import { game } from '@core/Game';

// =============================================================================
// TYPES
// =============================================================================

interface Particle {
  sprite: Sprite;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  gravity: number;
  active: boolean;
}

// =============================================================================
// PARTICLE SYSTEM CLASS
// =============================================================================

export class ParticleSystem {
  private container: Container;
  private pool: Particle[] = [];
  private activeParticles: Particle[] = [];
  private dropletTexture: Texture | null = null;
  private poolSize = 100;
  
  constructor() {
    this.container = new Container();
    
    // Récupérer la texture droplet
    const textures = game.gameTextures;
    if (textures) {
      this.dropletTexture = textures.droplet;
    }
    
    // Pré-créer le pool de particules
    this.initPool();
  }
  
  /**
   * Initialise le pool de particules
   */
  private initPool(): void {
    if (!this.dropletTexture) return;
    
    for (let i = 0; i < this.poolSize; i++) {
      const sprite = new Sprite(this.dropletTexture);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      
      this.container.addChild(sprite);
      
      this.pool.push({
        sprite,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        gravity: 0,
        active: false
      });
    }
  }
  
  /**
   * Récupère une particule du pool
   */
  private getParticle(): Particle | null {
    for (const particle of this.pool) {
      if (!particle.active) {
        return particle;
      }
    }
    return null;
  }
  
  /**
   * Spawn des particules satellites lors du spray
   * @param x Position X
   * @param y Position Y
   * @param angle Direction du mouvement (radians)
   * @param speed Vitesse du mouvement
   */
  spawnSprayParticles(x: number, y: number, angle: number, speed: number): void {
    const count = SPRAY.PARTICLE_COUNT;
    const spreadRad = (SPRAY.PARTICLE_SPREAD * Math.PI) / 180;
    const playerColor = game.playerColorValue;
    
    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) continue;
      
      // Angle perpendiculaire au mouvement + spread aléatoire
      const perpAngle = angle + Math.PI / 2;
      const randomSpread = (Math.random() - 0.5) * spreadRad;
      const particleAngle = perpAngle + randomSpread + (Math.random() > 0.5 ? Math.PI : 0);
      
      // Vitesse de la particule proportionnelle à la vitesse du mouvement
      const particleSpeed = (speed * 0.3 + Math.random() * 20) * (0.5 + Math.random() * 0.5);
      
      // Position légèrement décalée
      const offset = SPRAY.BASE_RADIUS * 0.5;
      const startX = x + Math.cos(particleAngle) * offset * Math.random();
      const startY = y + Math.sin(particleAngle) * offset * Math.random();
      
      // Activer la particule
      particle.active = true;
      particle.sprite.visible = true;
      particle.sprite.position.set(startX, startY);
      particle.sprite.alpha = 0.8;
      particle.sprite.scale.set(0.5 + Math.random() * 0.5);
      particle.sprite.tint = playerColor;
      
      particle.vx = Math.cos(particleAngle) * particleSpeed;
      particle.vy = Math.sin(particleAngle) * particleSpeed;
      particle.life = 0;
      particle.maxLife = 300 + Math.random() * 200; // 300-500ms
      particle.gravity = 50 + Math.random() * 50; // Gravité légère
      
      this.activeParticles.push(particle);
    }
  }
  
  /**
   * Spawn des particules radiales (pour la bombe)
   */
  spawnRadialParticles(x: number, y: number, count: number, speed: number): void {
    const playerColor = game.playerColorValue;
    
    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) continue;
      
      // Angle radial uniforme
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const particleSpeed = speed * (0.7 + Math.random() * 0.6);
      
      particle.active = true;
      particle.sprite.visible = true;
      particle.sprite.position.set(x, y);
      particle.sprite.alpha = 0.9;
      particle.sprite.scale.set(0.8 + Math.random() * 0.4);
      particle.sprite.tint = playerColor;
      
      particle.vx = Math.cos(angle) * particleSpeed;
      particle.vy = Math.sin(angle) * particleSpeed;
      particle.life = 0;
      particle.maxLife = 400 + Math.random() * 300; // 400-700ms
      particle.gravity = 80 + Math.random() * 40;
      
      this.activeParticles.push(particle);
    }
  }
  
  /**
   * Met à jour toutes les particules actives
   * @param deltaTime Temps écoulé en ms
   */
  update(deltaTime: number): void {
    const dt = deltaTime / 1000; // Convertir en secondes
    
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];
      
      // Mise à jour de la vie
      particle.life += deltaTime;
      
      if (particle.life >= particle.maxLife) {
        // Désactiver la particule
        particle.active = false;
        particle.sprite.visible = false;
        this.activeParticles.splice(i, 1);
        continue;
      }
      
      // Physique
      particle.vy += particle.gravity * dt; // Gravité
      particle.vx *= 0.98; // Friction air
      particle.vy *= 0.98;
      
      // Position
      particle.sprite.x += particle.vx * dt;
      particle.sprite.y += particle.vy * dt;
      
      // Fade out progressif
      const lifeProgress = particle.life / particle.maxLife;
      particle.sprite.alpha = 0.9 * (1 - lifeProgress * lifeProgress);
      
      // Réduire la taille progressivement
      const scale = particle.sprite.scale.x * (1 - lifeProgress * 0.3);
      particle.sprite.scale.set(scale);
    }
  }
  
  /**
   * Rend les particules actives dans la paintTexture (pour persistance)
   */
  renderToPaint(): void {
    if (this.activeParticles.length > 0) {
      game.renderToPaint(this.container);
    }
  }
  
  /**
   * Retourne le container pour l'ajouter au stage
   */
  getContainer(): Container {
    return this.container;
  }
  
  /**
   * Nettoie toutes les particules
   */
  clear(): void {
    for (const particle of this.activeParticles) {
      particle.active = false;
      particle.sprite.visible = false;
    }
    this.activeParticles = [];
  }
  
  /**
   * Détruit le système
   */
  destroy(): void {
    this.clear();
    this.container.destroy({ children: true });
    this.pool = [];
  }
}
