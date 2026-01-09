/**
 * Node Types System - ARCHIVED FOR PROTOTYPE
 * 
 * Ce fichier contient le code des différents types de nœuds (Relay, Amplifier, Harvester, etc.)
 * qui a été mis de côté pour le prototype simplifié.
 * 
 * Pour réactiver les types de nœuds :
 * 1. Renommer ce fichier en nodeTypes.ts
 * 2. Réactiver initNodeTypeSelector() dans main.ts
 * 3. Réactiver getSelectedNodeType() dans unifiedInput.ts
 */

// =============================================================================
// TYPES
// =============================================================================

export type NodeType = 'relay' | 'amplifier' | 'harvester' | 'disruptor' | 'fortress';

export interface NodeTypeData {
  type: NodeType;
  name: string;
  description: string;
  cost: number;
  radius: number;
  maxConnections: number;
  specialAbility: string;
  
  // Bonus passifs
  signalRangeBonus: number;      // Bonus de portée autour de ce nœud (px)
  energyProduction: number;       // Énergie/seconde générée
  defenseStrength: number;        // Résistance aux attaques (1.0 = normal)
  
  // Contraintes
  requiresNearby?: NodeType[];    // Nécessite certains types à proximité
  maxPerNetwork?: number;         // Limite par réseau
}

// =============================================================================
// NODE TYPE DEFINITIONS
// =============================================================================

export const NODE_TYPES: Record<NodeType, NodeTypeData> = {
  relay: {
    type: 'relay',
    name: 'Relay Node',
    description: 'Standard node. Balanced stats.',
    cost: 10,
    radius: 15,
    maxConnections: 6,
    specialAbility: 'None',
    signalRangeBonus: 0,
    energyProduction: 0,
    defenseStrength: 1.0,
  },
  
  amplifier: {
    type: 'amplifier',
    name: 'Signal Amplifier',
    description: 'Extends signal reach by +100px around it.',
    cost: 25,
    radius: 20,
    maxConnections: 4,
    specialAbility: 'Amplify Signal (passive)',
    signalRangeBonus: 100,    // +100px de portée autour de lui
    energyProduction: 0,
    defenseStrength: 0.7,      // Plus fragile
  },
  
  harvester: {
    type: 'harvester',
    name: 'Energy Harvester',
    description: 'Generates +2 energy/second. Requires 3+ connections.',
    cost: 20,
    radius: 15,
    maxConnections: 8,
    specialAbility: 'Energy Generation (passive)',
    signalRangeBonus: 0,
    energyProduction: 2,       // +2 énergie/sec
    defenseStrength: 1.0,
    requiresNearby: ['relay', 'harvester'], // Doit être dans un réseau dense
  },
  
  disruptor: {
    type: 'disruptor',
    name: 'Signal Disruptor',
    description: 'ACTIVE: Pulse that weakens enemy connections. Consumes -1 energy/second.',
    cost: 35,
    radius: 18,
    maxConnections: 4,
    specialAbility: 'Disruption Pulse (30s CD) - ACTIVE',
    signalRangeBonus: 0,
    energyProduction: -1,      // Consomme -1 énergie/sec
    defenseStrength: 0.8,
    maxPerNetwork: 3,          // Max 3 disruptors
  },
  
  fortress: {
    type: 'fortress',
    name: 'Fortress Node',
    description: 'Defensive node. Immune to isolation. Reduces signal range by -50px around it.',
    cost: 50,
    radius: 25,                // Plus gros visuellement
    maxConnections: 6,
    specialAbility: 'Isolation Immunity (passive)',
    signalRangeBonus: -50,     // Trade-off portée
    energyProduction: 0,
    defenseStrength: 2.0,      // Plus résistant
    maxPerNetwork: 2,          // Max 2 fortresses
  },
};

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Récupère les données d'un type de nœud
 */
export function getNodeTypeData(nodeType: NodeType): NodeTypeData {
  return NODE_TYPES[nodeType];
}

/**
 * Liste tous les types disponibles
 */
export function getAllNodeTypes(): NodeType[] {
  return Object.keys(NODE_TYPES) as NodeType[];
}

/**
 * Vérifie si un type existe
 */
export function isValidNodeType(type: string): type is NodeType {
  return type in NODE_TYPES;
}
