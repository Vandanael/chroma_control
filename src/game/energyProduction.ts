/**
 * Energy Production System - BLOC 2.1
 * Calcule la production d'énergie depuis les harvesters
 */

import { getNodesByOwner } from './nodeManager';
import { NODE_TYPES } from './nodeTypes';

/**
 * Calcule la production totale d'énergie/seconde (BLOC 2.3 : inclut disruptors)
 * Harvesters produisent, disruptors consomment
 */
export function calculateEnergyProduction(): number {
  const playerNodes = getNodesByOwner('player');
  let totalProduction = 0;
  
  for (const node of playerNodes) {
    if (!node.nodeType) continue;
    
    const typeData = NODE_TYPES[node.nodeType as keyof typeof NODE_TYPES];
    if (!typeData) continue;
    
    // Harvesters : production seulement si 3+ connexions et non isolé
    if (node.nodeType === 'harvester') {
      if (node.connections.length >= 3 && !node.isIsolated) {
        totalProduction += typeData.energyProduction;
      }
    }
    // Disruptors : consommation permanente (BLOC 2.3)
    else if (node.nodeType === 'disruptor') {
      totalProduction += typeData.energyProduction; // -1/s
    }
  }
  
  return totalProduction;
}
