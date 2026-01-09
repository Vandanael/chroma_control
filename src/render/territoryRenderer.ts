/**
 * Territory Renderer - BLOC 5.2 & 5.3
 * Rend les zones de contrôle et les frontières contestées
 */

import { calculateTerritoryInfluence, areZonesContested } from '../game/territorySystem';
import { getNodesByOwner } from '../game/nodeManager';
import { getPlayerColorValue } from '../game/playerColor';
import { COLORS } from '../game/constants';
import { getBorderWaveOffset } from './organicAnimations';

// =============================================================================
// CONSTANTS
// =============================================================================

const TERRITORY_GRID_SIZE = 20; // Résolution de la grille (20px par cellule)
const TERRITORY_OPACITY = 0.25; // CORRECTION : Opacité augmentée (0.15 → 0.25) pour meilleure visibilité

// =============================================================================
// TERRITORY OVERLAY
// =============================================================================

/**
 * Rend l'overlay territorial (BLOC 5.2)
 * CORRECTION VISUELLE : Anti-aliasing avec gradients radiaux pour bords doux
 */
export function renderTerritoryOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const gridWidth = Math.ceil(width / TERRITORY_GRID_SIZE);
  const gridHeight = Math.ceil(height / TERRITORY_GRID_SIZE);
  
  ctx.save();
  
  // Activer l'anti-aliasing pour des bords doux
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Parcourir la grille et dessiner les zones avec gradients radiaux pour bords doux
  for (let gy = 0; gy < gridHeight; gy++) {
    for (let gx = 0; gx < gridWidth; gx++) {
      const x = gx * TERRITORY_GRID_SIZE;
      const y = gy * TERRITORY_GRID_SIZE;
      const centerX = x + TERRITORY_GRID_SIZE / 2;
      const centerY = y + TERRITORY_GRID_SIZE / 2;
      
      const influence = calculateTerritoryInfluence(centerX, centerY);
      
      if (influence === 'neutral') continue; // Ne pas dessiner les zones neutres
      
      // Couleur selon la zone
      const baseColor = influence === 'player' ? getPlayerColorValue() : COLORS.ENEMY;
      
      // Créer un gradient radial avec feather edge pour bords doux
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,                    // Centre
        centerX, centerY, TERRITORY_GRID_SIZE * 0.7  // Rayon avec fade out
      );
      
      const colorOpaque = baseColor + Math.floor(TERRITORY_OPACITY * 255).toString(16).padStart(2, '0');
      const colorTransparent = baseColor + '00'; // Transparent
      
      gradient.addColorStop(0, colorOpaque);
      gradient.addColorStop(0.7, colorOpaque);
      gradient.addColorStop(1, colorTransparent);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, TERRITORY_GRID_SIZE, TERRITORY_GRID_SIZE);
    }
  }
  
  ctx.restore();
}

/**
 * Rend les frontières contestées avec gradient dynamique et pulsation de tension
 * Gradient de couleur selon le rapport de force : joueur (gagne) → blanc (équilibre) → magenta (perd)
 */
export function renderContestedBorders(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const playerNodes = getNodesByOwner('player');
  const enemyNodes = getNodesByOwner('enemy');
  
  // Vérifier si les zones sont contestées
  if (!areZonesContested(playerNodes, enemyNodes, 300)) {
    return;
  }
  
  // Utiliser le système de pression des frontières (import synchrone pour le rendu)
  // Note: Pour éviter les imports dynamiques dans le rendu, on calcule directement ici
  // mais on pourrait aussi pré-calculer dans la boucle de mise à jour
  
  const now = performance.now();
  const playerColor = getPlayerColorValue();
  
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Calculer les segments de frontière et la pression moyenne
  let totalPressure = 0;
  let segmentCount = 0;
  const borderSegments: Array<{ playerNode: typeof playerNodes[0]; enemyNode: typeof enemyNodes[0]; pressure: number; forceRatio: number }> = [];
  
  for (const playerNode of playerNodes) {
    for (const enemyNode of enemyNodes) {
      const dx = playerNode.x - enemyNode.x;
      const dy = playerNode.y - enemyNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = 300;
      
      if (distance < maxDistance) {
        // Calculer la pression
        const overlapDistance = 240; // AURA_RADIUS * 2
        let pressure = 0;
        
        if (distance < overlapDistance) {
          pressure = 1.0;
        } else {
          const excessDistance = distance - overlapDistance;
          pressure = Math.max(0, 1.0 - (excessDistance / (maxDistance - overlapDistance)));
        }
        
        // Calculer le rapport de force
        const playerPower = playerNode.power + (playerNode.connections.length * 5);
        const enemyPower = enemyNode.power + (enemyNode.connections.length * 5);
        const totalPower = playerPower + enemyPower;
        const forceRatio = totalPower > 0 ? (playerPower - enemyPower) / totalPower : 0;
        
        if (pressure > 0.1) {
          borderSegments.push({ playerNode, enemyNode, pressure, forceRatio });
          totalPressure += pressure;
          segmentCount++;
        }
      }
    }
  }
  
  if (segmentCount === 0) {
    ctx.restore();
    return;
  }
  
  const averagePressure = totalPressure / segmentCount;
  
  // Calculer la pulsation selon la pression moyenne
  const pulseFrequency = averagePressure > 0.7 ? 2.5 : averagePressure > 0.4 ? 1.8 : 1.0; // 1Hz stable, 2-3Hz sous pression
  const pulse = Math.sin(now * 0.001 * pulseFrequency * Math.PI * 2) * 0.3 + 0.7; // 0.4 à 1.0
  
  // Dessiner les frontières avec gradient dynamique
  for (const segment of borderSegments) {
    const { playerNode, enemyNode, pressure, forceRatio } = segment;
    
    // Couleur selon le rapport de force
    // Force ratio > 0.2 = on gagne (couleur joueur saturée)
    // Force ratio ≈ 0 = équilibre (blanc/neutre)
    // Force ratio < -0.2 = on perd (magenta qui déborde)
    let borderColor: string;
    if (forceRatio > 0.2) {
      // On gagne : couleur du joueur saturée
      borderColor = playerColor;
    } else if (forceRatio < -0.2) {
      // On perd : Magenta qui déborde
      borderColor = COLORS.ENEMY;
    } else {
      // Équilibre : blanc/neutre
      borderColor = '#FFFFFF';
    }
    
    // Opacité selon la pression et la pulsation
    const baseOpacity = 0.4 + pressure * 0.4; // 0.4 à 0.8
    const finalOpacity = baseOpacity * pulse;
    
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2 + pressure * 2; // 2px à 4px selon pression
    ctx.globalAlpha = finalOpacity;
    
    // Ligne pointillée avec espacement variable selon pression
    const dashLength = 8 - pressure * 4; // 8px à 4px
    ctx.setLineDash([dashLength, 4]);
    
    // Dessiner la frontière avec ondulation organique
    ctx.beginPath();
    const segments = 20; // Nombre de segments pour l'ondulation
    const dx = enemyNode.x - playerNode.x;
    const dy = enemyNode.y - playerNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / distance; // Vecteur perpendiculaire
    const perpY = dx / distance;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments; // 0 à 1 le long de la frontière
      const baseX = playerNode.x + dx * t;
      const baseY = playerNode.y + dy * t;
      
      // Ondulation organique perpendiculaire à la ligne
      const waveOffset = getBorderWaveOffset(t, now, pressure);
      const offsetX = baseX + perpX * waveOffset * distance * 0.1;
      const offsetY = baseY + perpY * waveOffset * distance * 0.1;
      
      if (i === 0) {
        ctx.moveTo(offsetX, offsetY);
      } else {
        ctx.lineTo(offsetX, offsetY);
      }
    }
    ctx.stroke();
    
    // Glow autour de la ligne pour les fronts très actifs
    if (pressure > 0.7) {
      ctx.shadowBlur = 10 * pressure;
      ctx.shadowColor = borderColor;
      ctx.globalAlpha = finalOpacity * 0.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
  
  ctx.restore();
}
