/**
 * Survival System - "Le Cordon"
 * BFS depuis Drop-Pod pour identifier les nœuds connectés
 * Nœuds isolés meurent progressivement
 */

import {
  getAllNodes,
  getNodeById,
  getDropPod,
  removeNode,
  type GameNode,
  type NodeOwner,
} from './nodeManager';
import { triggerNodeDestructionFeedback } from '../render/gameFeel';

// =============================================================================
// CONSTANTS
// =============================================================================

import { SURVIVAL_CONFIG } from '../config';

const ISOLATION_DEATH_TIME = SURVIVAL_CONFIG.isolationDeathTime;

// =============================================================================
// BFS (Breadth-First Search)
// =============================================================================

/**
 * Parcourt le graphe depuis le Drop-Pod pour identifier les nœuds connectés
 * Retourne un Set des IDs des nœuds connectés
 */
/**
 * Parcourt le graphe depuis le Drop-Pod pour identifier les nœuds connectés
 * OPTIMISÉ : Utilise un Set pour éviter les doublons, vérifie l'existence des nœuds
 * Retourne un Set des IDs des nœuds connectés
 */
function bfsFromDropPod(owner: NodeOwner): Set<string> {
  const dropPod = getDropPod(owner);
  if (!dropPod) {
    return new Set();
  }

  const connected = new Set<string>();
  const queue: GameNode[] = [dropPod];
  const visited = new Set<string>(); // Double protection contre les cycles

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Éviter les doublons et les cycles
    if (visited.has(current.id) || connected.has(current.id)) {
      continue;
    }
    
    visited.add(current.id);
    connected.add(current.id);

    // Explorer les connexions (vérifier que le nœud existe toujours)
    for (const connectedId of current.connections) {
      // Éviter de revisiter des nœuds déjà traités
      if (visited.has(connectedId) || connected.has(connectedId)) {
        continue;
      }
      
      const connectedNode = getNodeById(connectedId);
      // Vérifier que le nœud existe, appartient au même propriétaire, et n'a pas été visité
      if (connectedNode && connectedNode.owner === owner) {
        queue.push(connectedNode);
      }
    }
  }

  return connected;
}

/**
 * Met à jour l'état de connexion de tous les nœuds
 * Marque les nœuds isolés et déclenche leur mort progressive
 */
export function updateSurvivalSystem(_deltaSeconds: number): void {
  const allNodes = getAllNodes();

  // Séparer par propriétaire
  const playerNodes = allNodes.filter(n => n.owner === 'player');
  const enemyNodes = allNodes.filter(n => n.owner === 'enemy');

  // BFS pour chaque propriétaire
  const playerConnected = bfsFromDropPod('player');
  const enemyConnected = bfsFromDropPod('enemy');

  // Marquer les nœuds isolés
  const now = performance.now();

  for (const node of playerNodes) {
    if (node.isDropPod) {
      // Drop-Pod toujours connecté
      node.isIsolated = false;
      delete node.isolationTime;
      continue;
    }
    
    // BLOC 4.2 : Fortress immunisée contre l'isolation
    if (node.nodeType === 'fortress') {
      node.isIsolated = false;
      delete node.isolationTime;
      continue;
    }

    if (!playerConnected.has(node.id)) {
      // Nœud isolé
      if (!node.isIsolated) {
        node.isIsolated = true;
        node.isolationTime = now;
        console.log(`[SurvivalSystem] Node ${node.id} is now ISOLATED`);
      }

      // Vérifier si le nœud doit mourir
      if (node.isolationTime) {
        const isolationAge = now - node.isolationTime;
        if (isolationAge >= ISOLATION_DEATH_TIME) {
          console.log(`[SurvivalSystem] Node ${node.id} died (isolated for ${isolationAge.toFixed(0)}ms)`);
          
          // Déclencher le feedback de destruction
          triggerNodeDestructionFeedback();
          
          removeNode(node.id);
        }
      }
    } else {
      // Nœud connecté
      if (node.isIsolated) {
        node.isIsolated = false;
        delete node.isolationTime;
        console.log(`[SurvivalSystem] Node ${node.id} reconnected`);
      }
    }
  }

  // Même chose pour les nœuds ennemis
  for (const node of enemyNodes) {
    if (node.isDropPod) {
      node.isIsolated = false;
      delete node.isolationTime;
      continue;
    }
    
    // BLOC 4.2 : Fortress immunisée contre l'isolation
    if (node.nodeType === 'fortress') {
      node.isIsolated = false;
      delete node.isolationTime;
      continue;
    }

    if (!enemyConnected.has(node.id)) {
      if (!node.isIsolated) {
        node.isIsolated = true;
        node.isolationTime = now;
      }

      if (node.isolationTime) {
        const isolationAge = now - node.isolationTime;
        if (isolationAge >= ISOLATION_DEATH_TIME) {
          // Vérifier que le nœud existe encore avant de le supprimer
          if (getNodeById(node.id)) {
            // Déclencher le feedback de destruction
            triggerNodeDestructionFeedback();
            
            removeNode(node.id);
          }
        }
      }
    } else {
      if (node.isIsolated) {
        node.isIsolated = false;
        delete node.isolationTime;
      }
    }
  }
}
