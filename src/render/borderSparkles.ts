/**
 * Border Sparkles - Particules de scintillement sur les frontières de collision
 * Intensité proportionnelle à la pression : plus de particules, plus grosses et lumineuses sur fronts actifs
 */

import { type GameNode, getAllNodes, getNodesByOwner } from '../game/nodeManager';
import { calculateBorderSegments, type BorderSegment } from '../game/borderPressure';
import { getPlayerColorValue } from '../game/playerColor';
import { COLORS } from '../game/constants';

// =============================================================================
// CONSTANTS
// =============================================================================

const SPARKLE_LIFETIME = 0.6; // 600ms (légèrement plus long)
const BASE_SPAWN_RATE = 0.3; // Taux de base
const MAX_SPAWN_RATE = 1.5; // Taux max sous pression
const BASE_SPEED = 20;
const MAX_SPEED = 35; // Plus rapide sous pression
const BASE_SIZE = 1;
const MAX_SIZE = 3; // Plus grosses sous pression

// =============================================================================
// TYPES
// =============================================================================

interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number; // Taille de la particule
  brightness: number; // Luminosité (0.0 à 1.0)
  color: string; // Couleur (joueur ou blanc selon force ratio)
}

// =============================================================================
// STATE
// =============================================================================

const activeSparkles: Sparkle[] = [];

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Met à jour les particules de scintillement avec intensité selon la pression
 */
export function updateBorderSparkles(deltaSeconds: number): void {
  const borderSegments = calculateBorderSegments();
  const playerColor = getPlayerColorValue();
  
  // Spawner des particules selon la pression de chaque segment
  for (const segment of borderSegments) {
    // Taux de spawn proportionnel à la pression
    const spawnRate = BASE_SPAWN_RATE + (MAX_SPAWN_RATE - BASE_SPAWN_RATE) * segment.pressure;
    
    // Probabilité de spawn multipliée par la pression
    if (Math.random() < spawnRate * deltaSeconds * 60 * segment.pressure) {
      // Position sur la frontière avec variation
      const angle = Math.random() * Math.PI * 2;
      const offset = (Math.random() - 0.5) * 40; // Variation de position
      const sparkleX = segment.x + Math.cos(angle) * offset;
      const sparkleY = segment.y + Math.sin(angle) * offset;
      
      // Direction perpendiculaire à la frontière
      const perpAngle = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.8;
      const speed = BASE_SPEED + (MAX_SPEED - BASE_SPEED) * segment.pressure + Math.random() * 10;
      
      // Taille et luminosité selon la pression
      const size = BASE_SIZE + (MAX_SIZE - BASE_SIZE) * segment.pressure;
      const brightness = 0.7 + 0.3 * segment.pressure; // 0.7 à 1.0
      
      // Couleur selon le rapport de force
      // Force ratio > 0 = on gagne (couleur joueur)
      // Force ratio < 0 = on perd (blanc/neutre)
      // Force ratio ≈ 0 = équilibre (blanc)
      let color = '#FFFFFF';
      if (segment.forceRatio > 0.2) {
        // On gagne : couleur du joueur
        color = playerColor;
      } else if (segment.forceRatio < -0.2) {
        // On perd : Magenta (ennemi)
        color = COLORS.ENEMY;
      }
      
      activeSparkles.push({
        x: sparkleX,
        y: sparkleY,
        vx: Math.cos(perpAngle) * speed,
        vy: Math.sin(perpAngle) * speed,
        life: SPARKLE_LIFETIME,
        maxLife: SPARKLE_LIFETIME,
        size,
        brightness,
        color,
      });
    }
  }
  
  // Mettre à jour et nettoyer les particules
  for (let i = activeSparkles.length - 1; i >= 0; i--) {
    const sparkle = activeSparkles[i];
    
    sparkle.x += sparkle.vx * deltaSeconds;
    sparkle.y += sparkle.vy * deltaSeconds;
    sparkle.life -= deltaSeconds;
    
    if (sparkle.life <= 0) {
      activeSparkles.splice(i, 1);
    }
  }
}

/**
 * Rend les particules de scintillement avec taille et luminosité dynamiques
 */
export function renderBorderSparkles(ctx: CanvasRenderingContext2D): void {
  if (activeSparkles.length === 0) return;
  
  ctx.save();
  
  for (const sparkle of activeSparkles) {
    const lifeRatio = sparkle.life / sparkle.maxLife;
    const opacity = lifeRatio * sparkle.brightness; // Opacité avec luminosité
    const currentSize = sparkle.size * (0.7 + 0.3 * lifeRatio); // Légère réduction en fin de vie
    
    ctx.globalAlpha = opacity;
    ctx.fillStyle = sparkle.color;
    
    // Glow autour des particules importantes
    if (sparkle.size > 2) {
      ctx.shadowBlur = 8;
      ctx.shadowColor = sparkle.color;
    } else {
      ctx.shadowBlur = 0;
    }
    
    ctx.beginPath();
    ctx.arc(sparkle.x, sparkle.y, currentSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

/**
 * Nettoie toutes les particules (pour reset)
 */
export function clearBorderSparkles(): void {
  activeSparkles.length = 0;
}
