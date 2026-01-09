/**
 * Territory Dissolution - Effet visuel de grignotage de territoire
 * Particules qui se détachent du territoire ennemi lors du grignotage
 */

import { type GameNode, getNodesByOwner } from '../game/nodeManager';
import { COLORS } from '../game/constants';

// =============================================================================
// CONSTANTS
// =============================================================================

const DISSOLUTION_PARTICLE_LIFETIME = 1.0; // 1 seconde
const DISSOLUTION_SPAWN_RATE = 0.5; // Probabilité de spawn par frame
const DISSOLUTION_PARTICLE_SPEED = 15; // Vitesse des particules

// =============================================================================
// TYPES
// =============================================================================

interface DissolutionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string; // Couleur ennemie (Magenta)
}

// =============================================================================
// STATE
// =============================================================================

const activeParticles: DissolutionParticle[] = [];

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Met à jour les particules de dissolution
 */
export function updateTerritoryDissolution(deltaSeconds: number): void {
  const playerNodes = getNodesByOwner('player');
  const enemyNodes = getNodesByOwner('enemy');
  
  // Vérifier les collisions entre auras joueur et ennemi
  for (const playerNode of playerNodes) {
    const auraRadius = 120;
    
    for (const enemyNode of enemyNodes) {
      const dx = playerNode.x - enemyNode.x;
      const dy = playerNode.y - enemyNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const enemyAuraRadius = 120;
      
      // Si les auras se chevauchent (grignotage actif)
      if (distance < auraRadius + enemyAuraRadius && distance > 0) {
        // Spawner des particules de dissolution
        if (Math.random() < DISSOLUTION_SPAWN_RATE * deltaSeconds * 60) {
          // Position sur la frontière (côté ennemi)
          const t = 0.6 + Math.random() * 0.2; // Position sur la ligne, côté ennemi
          const particleX = playerNode.x + (enemyNode.x - playerNode.x) * t;
          const particleY = playerNode.y + (enemyNode.y - playerNode.y) * t;
          
          // Direction depuis l'ennemi vers le joueur (dissolution)
          const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.8;
          const speed = DISSOLUTION_PARTICLE_SPEED + Math.random() * 10;
          
          activeParticles.push({
            x: particleX,
            y: particleY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: DISSOLUTION_PARTICLE_LIFETIME,
            maxLife: DISSOLUTION_PARTICLE_LIFETIME,
            color: COLORS.ENEMY, // Magenta
          });
        }
      }
    }
  }
  
  // Mettre à jour et nettoyer les particules
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const particle = activeParticles[i];
    
    particle.x += particle.vx * deltaSeconds;
    particle.y += particle.vy * deltaSeconds;
    particle.life -= deltaSeconds;
    
    // Réduire la vitesse (friction)
    particle.vx *= 0.98;
    particle.vy *= 0.98;
    
    if (particle.life <= 0) {
      activeParticles.splice(i, 1);
    }
  }
}

/**
 * Rend les particules de dissolution
 */
export function renderTerritoryDissolution(ctx: CanvasRenderingContext2D): void {
  if (activeParticles.length === 0) return;
  
  ctx.save();
  
  for (const particle of activeParticles) {
    const opacity = particle.life / particle.maxLife;
    const size = 2 + (1 - opacity) * 2; // 2px → 4px
    
    // Couleur qui fade vers transparent
    const alpha = Math.floor(opacity * 255).toString(16).padStart(2, '0');
    const color = particle.color + alpha;
    
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

/**
 * Nettoie toutes les particules (pour reset)
 */
export function clearTerritoryDissolution(): void {
  activeParticles.length = 0;
}
