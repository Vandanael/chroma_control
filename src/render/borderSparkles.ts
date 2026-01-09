/**
 * Border Sparkles - Particules orbitales sur les frontières
 * CORRECTION VISUELLE : Les particules orbitent le long de la ligne de frontière, pas un nuage chaotique
 */

import { type GameNode, getAllNodes, getNodesByOwner } from '../game/nodeManager';
import { calculateBorderSegments, type BorderSegment } from '../game/borderPressure';
import { getPlayerColorValue } from '../game/playerColor';
import { COLORS } from '../game/constants';

// =============================================================================
// CONSTANTS
// =============================================================================

const SPARKLE_LIFETIME = 2.0; // 2 secondes (plus long pour suivre la frontière)
const BASE_SPAWN_RATE = 0.15; // CORRECTION : Réduit de 50% (0.3 → 0.15)
const MAX_SPAWN_RATE = 0.75; // CORRECTION : Réduit de 50% (1.5 → 0.75)
const BASE_SPEED = 30; // Vitesse le long de la frontière
const MAX_SPEED = 60; // Plus rapide sous pression
const PARTICLE_SIZE = 4; // CORRECTION : Taille uniforme 4-5px
const PARTICLE_OPACITY = 0.7; // 60-80% opacité

// =============================================================================
// TYPES
// =============================================================================

interface Sparkle {
  // Position sur la frontière (0.0 à 1.0 le long du segment)
  position: number;
  // Segment de frontière auquel appartient cette particule
  segmentIndex: number;
  // Direction : 1 = sens horaire, -1 = sens anti-horaire
  direction: number;
  // Vitesse le long de la frontière
  speed: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

// =============================================================================
// STATE
// =============================================================================

const activeSparkles: Sparkle[] = [];
let cachedSegments: BorderSegment[] = []; // Cache des segments pour calculer positions

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Met à jour les particules orbitales le long des frontières
 * CORRECTION : Les particules suivent la ligne de frontière, pas un nuage chaotique
 */
export function updateBorderSparkles(deltaSeconds: number): void {
  const borderSegments = calculateBorderSegments();
  cachedSegments = borderSegments; // Mettre en cache pour le rendu
  const playerColor = getPlayerColorValue();
  
  // Spawner des particules selon la pression de chaque segment
  for (let segIndex = 0; segIndex < borderSegments.length; segIndex++) {
    const segment = borderSegments[segIndex];
    
    // CORRECTION : Taux de spawn réduit de 50%
    const spawnRate = BASE_SPAWN_RATE + (MAX_SPAWN_RATE - BASE_SPAWN_RATE) * segment.pressure;
    
    // Probabilité de spawn multipliée par la pression
    if (Math.random() < spawnRate * deltaSeconds * 60 * segment.pressure) {
      // Position initiale aléatoire le long de la frontière (0.0 à 1.0)
      const initialPosition = Math.random();
      
      // Direction alternée : certaines vont dans un sens, d'autres dans l'autre
      const direction = Math.random() < 0.5 ? 1 : -1;
      
      // Vitesse selon la pression (plus rapide si frontière sous pression)
      const speed = BASE_SPEED + (MAX_SPEED - BASE_SPEED) * segment.pressure;
      
      // Couleur : blanc ou couleur joueur (pas de magenta)
      let color = '#FFFFFF';
      if (segment.forceRatio > 0.1) {
        // On gagne : couleur du joueur
        color = playerColor;
      }
      
      activeSparkles.push({
        position: initialPosition,
        segmentIndex: segIndex,
        direction,
        speed,
        life: SPARKLE_LIFETIME,
        maxLife: SPARKLE_LIFETIME,
        size: PARTICLE_SIZE,
        color,
      });
    }
  }
  
  // Mettre à jour les particules : elles se déplacent le long de la frontière
  for (let i = activeSparkles.length - 1; i >= 0; i--) {
    const sparkle = activeSparkles[i];
    
    // Vérifier que le segment existe encore
    if (sparkle.segmentIndex >= cachedSegments.length) {
      activeSparkles.splice(i, 1);
      continue;
    }
    
    const segment = cachedSegments[sparkle.segmentIndex];
    
    // Déplacer la particule le long de la frontière
    const distancePerSecond = sparkle.speed / segment.distance; // Normalisé par la longueur
    sparkle.position += sparkle.direction * distancePerSecond * deltaSeconds;
    
    // Boucler si la particule dépasse les limites (0.0 ou 1.0)
    if (sparkle.position < 0) {
      sparkle.position = 1.0 + sparkle.position; // Boucle
    } else if (sparkle.position > 1.0) {
      sparkle.position = sparkle.position - 1.0; // Boucle
    }
    
    sparkle.life -= deltaSeconds;
    
    // Supprimer si expirée ou si le segment n'existe plus
    if (sparkle.life <= 0 || segment.pressure < 0.1) {
      activeSparkles.splice(i, 1);
    }
  }
}

/**
 * Rend les particules orbitales le long des frontières
 * CORRECTION : Les particules sont positionnées sur la ligne de frontière
 */
export function renderBorderSparkles(ctx: CanvasRenderingContext2D): void {
  if (activeSparkles.length === 0) return;
  
  ctx.save();
  
  for (const sparkle of activeSparkles) {
    // Vérifier que le segment existe
    if (sparkle.segmentIndex >= cachedSegments.length) continue;
    
    const segment = cachedSegments[sparkle.segmentIndex];
    
    // Calculer la position sur la ligne de frontière
    const t = sparkle.position; // 0.0 à 1.0 le long du segment
    const x = segment.playerNodeX + (segment.enemyNodeX - segment.playerNodeX) * t;
    const y = segment.playerNodeY + (segment.enemyNodeY - segment.playerNodeY) * t;
    
    const lifeRatio = sparkle.life / sparkle.maxLife;
    const opacity = lifeRatio * PARTICLE_OPACITY; // Opacité 60-80%
    
    ctx.globalAlpha = opacity;
    ctx.fillStyle = sparkle.color;
    ctx.shadowBlur = 0; // Pas de glow pour garder subtil
    
    ctx.beginPath();
    ctx.arc(x, y, sparkle.size, 0, Math.PI * 2);
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
