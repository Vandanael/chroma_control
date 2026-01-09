/**
 * Node Manager - Bio-Digital "Free-Form" Edition
 * Système de nœuds libres (X, Y) sans grille
 */

import {
  initSpatialGrid,
  addNodeToGrid,
  removeNodeFromGrid,
  clearSpatialGrid,
  getNodesInRadius,
} from './spatialGrid';
import { NODE_TYPES, type NodeType, getNodeTypeData, type NodeTypeData } from './nodeTypes';

// =============================================================================
// TYPES
// =============================================================================

export type NodeOwner = 'player' | 'enemy';

export interface GameNode {
  id: string;
  x: number;              // Position libre X
  y: number;              // Position libre Y
  owner: NodeOwner;
  power: number;           // Puissance du nœud (affecte taille synapse, 1-100)
  connections: string[];   // IDs des nœuds connectés (tous les liens)
  directConnections: string[]; // IDs des liens directs (créés lors du placement)
  isDropPod: boolean;      // Drop-Pod (point d'origine)
  isIsolated?: boolean;    // Nœud isolé du Drop-Pod
  isolationTime?: number;  // Timestamp si isolé (pour mort progressive)
  creationTime?: number;   // Timestamp de création pour animation spring
  radius?: number;         // Rayon du nœud (calculé dynamiquement)
  nodeType?: string;       // Type de nœud (relay, amplifier, harvester, etc.) - BLOC 1.1
}

// =============================================================================
// CONSTANTS
// =============================================================================

import { NODE_CONFIG } from '../config';

const MAX_CONNECTION_RANGE = NODE_CONFIG.maxConnectionRange;
const AUTO_MESH_RANGE = NODE_CONFIG.autoMeshRange;
const BASE_NODE_RADIUS = NODE_CONFIG.baseRadius;
const BASE_NODE_POWER = NODE_CONFIG.basePower;
const DROP_POD_POWER = NODE_CONFIG.dropPodPower;
const DROP_POD_RADIUS = NODE_CONFIG.dropPodRadius;

// =============================================================================
// STATE
// =============================================================================

let nodes: GameNode[] = [];
let nodeCounter = 0;

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialise le système de nœuds libres
 * Crée les Drop-Pods (joueur bas milieu, IA haut milieu)
 */
export function initNodeSystem(width: number, height: number): void {
  nodes = [];
  nodeCounter = 0;
  
  // Initialiser la grille spatiale
  initSpatialGrid();

  // MINIMALISME : Drop-Pod en bas de l'écran
  // Drop-Pod Joueur (bas centre)
  const playerDropPod: GameNode = {
    id: `node_${nodeCounter++}`,
    x: width / 2,
    y: height - NODE_CONFIG.playerDropPodOffsetFromBottom,
    owner: 'player',
    power: DROP_POD_POWER,
    connections: [],
    directConnections: [],
    isDropPod: true,
    nodeType: 'relay', // PROTOTYPE : Nœud unique 'Chroma Node' (relay)
    radius: DROP_POD_RADIUS,
  };

  // Drop-Pod IA (haut centre, plus proche pour plus d'interaction)
  const enemyDropPod: GameNode = {
    id: `node_${nodeCounter++}`,
    x: width / 2,
    y: height * NODE_CONFIG.enemyDropPodVerticalPosition,
    owner: 'enemy',
    power: DROP_POD_POWER,
    connections: [],
    directConnections: [],
    isDropPod: true,
    nodeType: 'relay', // PROTOTYPE : Nœud unique 'Chroma Node' (relay)
    radius: DROP_POD_RADIUS,
  };

  nodes.push(playerDropPod, enemyDropPod);

  console.log('[NodeManager] Initialized free-form node system');
  console.log(`[NodeManager] Player Drop-Pod: (${playerDropPod.x}, ${playerDropPod.y})`);
  console.log(`[NodeManager] Enemy Drop-Pod: (${enemyDropPod.x}, ${enemyDropPod.y})`);
}

// =============================================================================
// DISTANCE & RANGE
// =============================================================================

/**
 * Calcule la distance euclidienne entre deux nœuds
 */
export function getDistance(node1: GameNode, node2: GameNode): number {
  const dx = node1.x - node2.x;
  const dy = node1.y - node2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcule la distance euclidienne entre deux points
 */
export function getDistanceBetweenPoints(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Trouve le nœud allié le plus proche d'une position
 */
export function findClosestAllyNode(x: number, y: number, owner: NodeOwner): GameNode | null {
  let closest: GameNode | null = null;
  let minDist = Infinity;

  for (const node of nodes) {
    if (node.owner === owner) {
      const dist = getDistanceBetweenPoints(x, y, node.x, node.y);
      if (dist < minDist) {
        minDist = dist;
        closest = node;
      }
    }
  }

  return closest;
}

/**
 * Vérifie si une position est à portée d'un nœud allié
 */
export function isInRange(x: number, y: number, owner: NodeOwner): boolean {
  const closest = findClosestAllyNode(x, y, owner);
  if (!closest) return false;
  
  const dist = getDistanceBetweenPoints(x, y, closest.x, closest.y);
  return dist <= MAX_CONNECTION_RANGE;
}

/**
 * Calcule le coût dynamique pour placer un nœud
 */
export function calculatePlacementCost(x: number, y: number, owner: NodeOwner): number {
  const closest = findClosestAllyNode(x, y, owner);
  if (!closest) return Infinity; // Impossible sans nœud allié
  
  const distance = getDistanceBetweenPoints(x, y, closest.x, closest.y);
  const baseCost = NODE_CONFIG.basePlacementCost;
  const distanceCost = distance / NODE_CONFIG.distanceCostDivisor;
  
  return Math.floor(baseCost + distanceCost);
}

/**
 * Calcule le bonus de portée depuis les amplifiers/fortresses proches (BLOC 1.6 + 4.3)
 */
export function getSignalRangeBonusAt(x: number, y: number, owner: NodeOwner): number {
  const nearbyNodes = getNodesInRadius(x, y, NODE_CONFIG.signalBonusSearchRadius, owner);
  
  let totalBonus = 0;
  for (const node of nearbyNodes) {
    if (node.nodeType === 'amplifier' || node.nodeType === 'fortress') {
      const typeData = NODE_TYPES[node.nodeType as NodeType];
      if (typeData) {
        totalBonus += typeData.signalRangeBonus; // Positif pour amplifier, négatif pour fortress (BLOC 4.3)
      }
    }
  }
  
  return totalBonus;
}

// =============================================================================
// NODE CREATION & MANAGEMENT
// =============================================================================

/**
 * Crée un nouveau nœud à une position donnée (BLOC 1.2 : avec type)
 * @param nodeType - Type de nœud (relay, amplifier, harvester). Par défaut: 'relay'
 */
export function createNodeWithType(
  x: number, 
  y: number, 
  owner: NodeOwner,
  nodeType: NodeType = 'relay'
): GameNode | null {
  // Vérifier la portée
  if (!isInRange(x, y, owner)) {
    console.warn(`[NodeManager] Position (${x}, ${y}) out of range for ${owner}`);
    return null;
  }

  // Trouver le nœud allié le plus proche pour créer la connexion
  const closest = findClosestAllyNode(x, y, owner);
  if (!closest) {
    console.warn(`[NodeManager] No ally node found for ${owner}`);
    return null;
  }

  // Récupérer les données du type
  const typeData = getNodeTypeData(nodeType);
  
  // Vérifier contraintes (BLOC 2.3 : maxPerNetwork pour disruptors)
  if (typeData.maxPerNetwork) {
    const existingCount = getNodesByOwner(owner).filter(n => n.nodeType === nodeType).length;
    if (existingCount >= typeData.maxPerNetwork) {
      console.warn(`[NodeManager] Max ${typeData.maxPerNetwork} ${typeData.name} reached`);
      return null;
    }
  }
  
  // Vérifier contrainte requiresNearby (BLOC 2.5 : harvester nécessite relay/harvester proche)
  if (typeData.requiresNearby && typeData.requiresNearby.length > 0) {
    const nearbyNodes = getNodesInRadius(x, y, NODE_CONFIG.nearbyRequirementRadius, owner);
    const hasRequiredType = nearbyNodes.some(n => 
      n.nodeType && typeData.requiresNearby!.includes(n.nodeType as NodeType)
    );
    
    if (!hasRequiredType) {
      console.warn(`[NodeManager] ${typeData.name} requires nearby ${typeData.requiresNearby.join(' or ')}`);
      return null;
    }
  }

  // Créer le nouveau nœud avec les stats du type
  const newNode: GameNode = {
    id: `node_${nodeCounter++}`,
    x,
    y,
    owner,
    nodeType: nodeType, // BLOC 1.2 : Stocker le type
    power: BASE_NODE_POWER,
    connections: [closest.id], // Tous les liens (sera complété par auto-mesh)
    directConnections: [closest.id], // Lien direct (créé lors du placement)
    isDropPod: false,
    radius: typeData.radius, // Utiliser le radius du type
    creationTime: performance.now(),
  };

  // Ajouter la connexion bidirectionnelle (directe)
  closest.connections.push(newNode.id);
  if (!closest.directConnections) {
    closest.directConnections = [];
  }
  closest.directConnections.push(newNode.id);

  // Ajouter le nœud
  nodes.push(newNode);

  // Ajouter à la grille spatiale (pour optimisation auto-mesh)
  addNodeToGrid(newNode);

  // Auto-mesh : créer des liens automatiques avec tous les nœuds alliés à portée
  autoMeshNode(newNode);
  
  // Enregistrer toutes les connexions pour feedback éphémère (500ms)
  // La connexion directe et toutes les connexions auto-mesh créées
  import('../render/ephemeralConnections').then(({ registerEphemeralConnection }) => {
    for (const connectedId of newNode.connections) {
      registerEphemeralConnection(newNode.id, connectedId, owner);
    }
  });

  console.log(`[NodeManager] Created ${nodeType} node ${newNode.id} at (${x}, ${y}) for ${owner} (radius: ${typeData.radius}px)`);
  
  return newNode;
}

/**
 * Crée un nouveau nœud à une position donnée (legacy - utilise relay par défaut)
 * @deprecated Utiliser createNodeWithType() à la place
 */
export function createNode(x: number, y: number, owner: NodeOwner): GameNode | null {
  return createNodeWithType(x, y, owner, 'relay');
}

/**
 * Crée automatiquement des liens (maillage) avec tous les nœuds alliés à portée
 * OPTIMISÉ : Utilise la grille spatiale pour O(k) au lieu de O(n²)
 * Complexité : O(k) où k = nombre de nœuds dans les cellules voisines (généralement < 10)
 */
function autoMeshNode(node: GameNode): void {
  // Utiliser la grille spatiale pour ne vérifier que les nœuds proches
  const nearbyAllies = getNodesInRadius(node.x, node.y, AUTO_MESH_RANGE, node.owner);
  
  // Filtrer pour exclure le nœud lui-même
  const allyNodes = nearbyAllies.filter((n: GameNode) => n.id !== node.id);
  
  for (const ally of allyNodes) {
    // Créer la connexion si elle n'existe pas déjà
    if (!node.connections.includes(ally.id)) {
      node.connections.push(ally.id);
    }
    if (!ally.connections.includes(node.id)) {
      ally.connections.push(node.id);
    }
  }
  
  // Log seulement si beaucoup de connexions (pour debug)
  if (node.connections.length > 10) {
    console.log(`[NodeManager] Auto-meshed node ${node.id}: ${node.connections.length} connections`);
  }
}

/**
 * Supprime un nœud (et toutes ses connexions)
 */
export function removeNode(nodeId: string): void {
  const node = getNodeById(nodeId);
  if (!node) return;

  // Supprimer les connexions bidirectionnelles (tous types)
  for (const connectedId of node.connections) {
    const connected = getNodeById(connectedId);
    if (connected) {
      connected.connections = connected.connections.filter(id => id !== nodeId);
      if (connected.directConnections) {
        connected.directConnections = connected.directConnections.filter(id => id !== nodeId);
      }
    }
  }

  // Retirer de la grille spatiale
  removeNodeFromGrid(node);

  // Supprimer le nœud
  nodes = nodes.filter(n => n.id !== nodeId);

  console.log(`[NodeManager] Removed node ${nodeId}`);
}

/**
 * Obtient un nœud par son ID
 */
export function getNodeById(id: string): GameNode | null {
  return nodes.find(n => n.id === id) || null;
}

/**
 * Obtient tous les nœuds
 */
export function getAllNodes(): GameNode[] {
  return nodes;
}

/**
 * Obtient tous les nœuds d'un propriétaire
 */
export function getNodesByOwner(owner: NodeOwner): GameNode[] {
  return nodes.filter(n => n.owner === owner);
}

/**
 * Obtient le Drop-Pod d'un propriétaire
 */
export function getDropPod(owner: NodeOwner): GameNode | null {
  return nodes.find(n => n.isDropPod && n.owner === owner) || null;
}

/**
 * Obtient le nœud le plus proche d'une position (tous propriétaires confondus)
 */
export function getNodeAtPosition(x: number, y: number, maxRadius: number = NODE_CONFIG.positionSearchRadius): GameNode | null {
  for (const node of nodes) {
    const dist = getDistanceBetweenPoints(x, y, node.x, node.y);
    const radius = node.radius || BASE_NODE_RADIUS;
    if (dist <= radius + maxRadius) {
      return node;
    }
  }
  return null;
}

// =============================================================================
// CONNECTION MANAGEMENT
// =============================================================================

/**
 * Connecte deux nœuds (bidirectionnel) - Auto-mesh uniquement
 */
export function connectNodes(nodeId1: string, nodeId2: string): void {
  const node1 = getNodeById(nodeId1);
  const node2 = getNodeById(nodeId2);
  
  if (!node1 || !node2) return;
  if (node1.owner !== node2.owner) return; // Même propriétaire uniquement
  
  // Ajouter les connexions (auto-mesh) si elles n'existent pas déjà
  if (!node1.connections.includes(nodeId2)) {
    node1.connections.push(nodeId2);
  }
  if (!node2.connections.includes(nodeId1)) {
    node2.connections.push(nodeId1);
  }
  
  // Note: directConnections n'est pas modifié ici (seulement pour auto-mesh)
}

/**
 * Déconnecte deux nœuds (bidirectionnel)
 */
export function disconnectNodes(nodeId1: string, nodeId2: string): void {
  const node1 = getNodeById(nodeId1);
  const node2 = getNodeById(nodeId2);
  
  if (!node1 || !node2) return;
  
  node1.connections = node1.connections.filter(id => id !== nodeId2);
  node2.connections = node2.connections.filter(id => id !== nodeId1);
}

// =============================================================================
// DISTANCE FROM DROP-POD (Pour atténuation du signal)
// =============================================================================

/**
 * Calcule la distance (en hops) d'un nœud par rapport à son Drop-Pod
 * Utilise BFS pour trouver le chemin le plus court
 */
export function getDistanceFromDropPod(node: GameNode): { distance: number; hops: number } | null {
  const dropPod = getDropPod(node.owner);
  if (!dropPod) {
    return null;
  }

  if (node.id === dropPod.id) {
    return { distance: 0, hops: 0 };
  }

  // BFS pour trouver le chemin le plus court
  const visited = new Set<string>();
  const queue: Array<{ node: GameNode; hops: number; distance: number }> = [
    { node: dropPod, hops: 0, distance: 0 }
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current.node.id)) continue;
    visited.add(current.node.id);

    // Si on a trouvé le nœud cible
    if (current.node.id === node.id) {
      return { distance: current.distance, hops: current.hops };
    }

    // Explorer les connexions
    for (const connectedId of current.node.connections) {
      const connected = getNodeById(connectedId);
      if (connected && connected.owner === node.owner && !visited.has(connectedId)) {
        const dist = getDistance(current.node, connected);
        queue.push({
          node: connected,
          hops: current.hops + 1,
          distance: current.distance + dist
        });
      }
    }
  }

  // Nœud non connecté au Drop-Pod
  return null;
}

// =============================================================================
// RESET
// =============================================================================

/**
 * Réinitialise le système de nœuds
 */
export function resetNodeSystem(): void {
  nodes = [];
  nodeCounter = 0;
  
  // Réinitialiser la grille spatiale
  clearSpatialGrid();
  
  console.log('[NodeManager] Node system reset');
}
