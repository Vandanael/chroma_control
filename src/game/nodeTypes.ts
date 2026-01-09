/**
 * Node Types System - PROTOTYPE SIMPLIFIED
 * 
 * PROTOTYPE : Un seul type de nœud ('Chroma Node' = relay)
 * Le code complet des types multiples est dans nodeTypes.archived.ts
 */

// =============================================================================
// TYPES
// =============================================================================

export type NodeType = 'relay';

export interface NodeTypeData {
  type: NodeType;
  name: string;
  description: string;
  cost: number;
  radius: number;
  maxConnections: number;
  specialAbility: string;
  
  // Bonus passifs
  signalRangeBonus: number;
  energyProduction: number;
  defenseStrength: number;
  
  // Contraintes
  requiresNearby?: NodeType[];
  maxPerNetwork?: number;
}

// =============================================================================
// NODE TYPE DEFINITIONS - PROTOTYPE : UN SEUL TYPE
// =============================================================================

export const NODE_TYPES: Record<NodeType, NodeTypeData> = {
  relay: {
    type: 'relay',
    name: 'Chroma Node', // PROTOTYPE : Nom simplifié
    description: 'Standard signal node.',
    cost: 10,
    radius: 15,
    maxConnections: 6,
    specialAbility: 'None',
    signalRangeBonus: 0,
    energyProduction: 0,
    defenseStrength: 1.0,
  },
};

// =============================================================================
// UTILITIES
// =============================================================================

export function getNodeTypeData(nodeType: NodeType): NodeTypeData {
  return NODE_TYPES[nodeType];
}

export function getAllNodeTypes(): NodeType[] {
  return Object.keys(NODE_TYPES) as NodeType[];
}

export function isValidNodeType(type: string): type is NodeType {
  return type in NODE_TYPES;
}
