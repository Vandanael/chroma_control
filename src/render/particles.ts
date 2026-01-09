/**
 * Particle System - SPRINT 1
 * Particules minimalistes pour effet "Triple Impact"
 */

import { getPlayerColorValue } from '../game/playerColor';

// =============================================================================
// TYPES
// =============================================================================

export interface Particle {
  x: number;
  y: number;
  vx: number; // Vitesse X
  vy: number; // Vitesse Y
  life: number; // 0.0 à 1.0 (1.0 = mort)
  color: string;
}

// =============================================================================
// STATE
// =============================================================================

const activeParticles: Particle[] = [];

// =============================================================================
// PARTICLE MANAGEMENT
// =============================================================================

/**
 * SPRINT 1 : Génère 10 particules à l'impact d'un placement de nœud
 * @param x - Position X du nœud
 * @param y - Position Y du nœud
 * @param color - Couleur des particules (couleur du joueur)
 */
export function spawnPlacementParticles(x: number, y: number, color: string): void {
  const particleCount = 10;
  
  for (let i = 0; i < particleCount; i++) {
    // Angle aléatoire (360°)
    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() * 0.3 - 0.15); // Légère variation
    const speed = 30 + Math.random() * 20; // 30-50px/s
    
    activeParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0, // Commence à 1.0, diminue jusqu'à 0
      color,
    });
  }
}

/**
 * Met à jour toutes les particules actives
 * @param deltaSeconds - Temps écoulé depuis la dernière frame
 */
export function updateParticles(deltaSeconds: number): void {
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const particle = activeParticles[i];
    
    // Mettre à jour la position
    particle.x += particle.vx * deltaSeconds;
    particle.y += particle.vy * deltaSeconds;
    
    // Réduire la vie (fade-out)
    particle.life -= deltaSeconds * 3.33; // 300ms = 1.0 / 0.3 = 3.33
    
    // Supprimer si mort
    if (particle.life <= 0) {
      activeParticles.splice(i, 1);
    }
  }
}

/**
 * Rend toutes les particules actives
 * @param ctx - Contexte de rendu Canvas
 */
export function renderParticles(ctx: CanvasRenderingContext2D): void {
  if (activeParticles.length === 0) return;
  
  ctx.save();
  
  for (const particle of activeParticles) {
    const opacity = Math.max(0, particle.life); // Fade-out linéaire
    
    ctx.globalAlpha = opacity;
    ctx.fillStyle = particle.color;
    
    // Cercle simple (pas de sprite pour performance)
    const radius = 2 * (1 - particle.life * 0.5); // Rétrécit légèrement (2px → 1px)
    
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

/**
 * Nettoie toutes les particules (pour reset)
 */
export function clearParticles(): void {
  activeParticles.length = 0;
}
