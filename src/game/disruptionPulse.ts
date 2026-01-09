/**
 * Disruption Pulse Effect - BLOC 3.3
 * Coupure des connexions ennemies dans un rayon
 */

import { type GameNode, getNodesByOwner, getDistanceBetweenPoints, disconnectNodes } from './nodeManager';
import { getDisruptorPulseRange } from './abilities';

/**
 * Exécute un pulse de disruption depuis un nœud disruptor
 * Coupe les connexions ennemies dans un rayon
 */
export function executeDisruptionPulse(disruptorNode: GameNode): void {
  const pulseRange = getDisruptorPulseRange();
  const enemyNodes = getNodesByOwner('enemy');
  
  // Trouver tous les nœuds ennemis dans la portée
  const affectedNodes: GameNode[] = [];
  
  for (const enemyNode of enemyNodes) {
    const distance = getDistanceBetweenPoints(
      disruptorNode.x, disruptorNode.y,
      enemyNode.x, enemyNode.y
    );
    
    if (distance <= pulseRange) {
      affectedNodes.push(enemyNode);
    }
  }
  
  // Couper les connexions entre les nœuds affectés
  let connectionsCut = 0;
  
  for (const node of affectedNodes) {
    // Couper toutes les connexions de ce nœud
    const connectionsToCut = [...node.connections];
    
    for (const connectedId of connectionsToCut) {
      disconnectNodes(node.id, connectedId);
      connectionsCut++;
    }
  }
  
  console.log(`[DisruptionPulse] Pulse from ${disruptorNode.id} affected ${affectedNodes.length} nodes, cut ${connectionsCut} connections`);
  
  // Déclencher l'effet visuel (BLOC 3.6)
  import('../render/disruptionPulseEffect').then(({ showDisruptionPulse }) => {
    showDisruptionPulse(disruptorNode.x, disruptorNode.y, pulseRange);
  });
  
  // Son (BLOC 3.6)
  import('../audio/audioManager').then(({ playDisruptionPulse }) => {
    playDisruptionPulse();
  });
}
