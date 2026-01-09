/**
 * Territory Grind System - Grignotage de territoire
 * Les auras de joueur qui touchent des zones ennemies effacent la couleur adverse
 */

import { type GameNode, getAllNodes, getNodesByOwner } from './nodeManager';

// =============================================================================
// CONSTANTS
// =============================================================================

const GRIND_CHECK_INTERVAL = 100; // Vérifier toutes les 100ms
const ERASE_RATE = 0.06; // ÉQUILIBRAGE : Réduit de 0.1 → 0.06 (6% par seconde au lieu de 10%)

// =============================================================================
// STATE
// =============================================================================

interface TerritoryZone {
  x: number;
  y: number;
  enemyOpacity: number; // Opacité de la zone ennemie (0.0 à 1.0)
  lastUpdate: number;
}

const territoryZones = new Map<string, TerritoryZone>();

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Met à jour le système de grignotage de territoire
 */
export function updateTerritoryGrind(deltaSeconds: number, width: number, height: number): void {
  const now = performance.now();
  const playerNodes = getNodesByOwner('player');
  const enemyNodes = getNodesByOwner('enemy');
  
  // Vérifier les collisions entre auras joueur et zones ennemies
  for (const playerNode of playerNodes) {
    const auraRadius = 120; // Rayon de base de l'aura
    const nodeX = playerNode.x;
    const nodeY = playerNode.y;
    
    // Vérifier les nœuds ennemis à portée
    for (const enemyNode of enemyNodes) {
      const dx = nodeX - enemyNode.x;
      const dy = nodeY - enemyNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const enemyAuraRadius = 120;
      
      // Si les auras se chevauchent
      if (distance < auraRadius + enemyAuraRadius) {
        // Calculer la zone de collision
        const midX = (nodeX + enemyNode.x) / 2;
        const midY = (nodeY + enemyNode.y) / 2;
        
        // Créer ou mettre à jour une zone de grignotage
        const zoneKey = `${Math.floor(midX / 20)}_${Math.floor(midY / 20)}`;
        let zone = territoryZones.get(zoneKey);
        
        if (!zone) {
          zone = {
            x: midX,
            y: midY,
            enemyOpacity: 1.0,
            lastUpdate: now,
          };
          territoryZones.set(zoneKey, zone);
        }
        
        // Réduire l'opacité ennemie
        zone.enemyOpacity = Math.max(0, zone.enemyOpacity - ERASE_RATE * deltaSeconds);
        zone.lastUpdate = now;
      }
    }
  }
  
  // Nettoyer les zones expirées (pas mises à jour depuis 1 seconde)
  for (const [key, zone] of territoryZones.entries()) {
    if (now - zone.lastUpdate > 1000) {
      territoryZones.delete(key);
    }
  }
}

/**
 * Obtient l'opacité ennemie réduite pour une position
 */
export function getEnemyOpacityReduction(x: number, y: number): number {
  const zoneKey = `${Math.floor(x / 20)}_${Math.floor(y / 20)}`;
  const zone = territoryZones.get(zoneKey);
  if (!zone) return 0;
  
  // Retourner la réduction d'opacité (1.0 = opacité complète, 0.0 = effacée)
  return 1.0 - zone.enemyOpacity;
}

/**
 * Nettoie toutes les zones (pour reset)
 */
export function clearTerritoryGrind(): void {
  territoryZones.clear();
}
