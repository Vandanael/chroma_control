/**
 * Node Type Selector UI - BLOC 1.3
 * Barre UI pour sélectionner le type de nœud à placer
 */

import { NODE_TYPES, type NodeType, getAllNodeTypes } from '../game/nodeTypes';
import { getEnergy } from '../game/state';

// =============================================================================
// STATE
// =============================================================================

let selectedNodeType: NodeType = 'relay';
let selectorContainer: HTMLElement | null = null;

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialise le sélecteur de type de nœud
 */
export function initNodeTypeSelector(): void {
  // Créer le conteneur
  selectorContainer = document.createElement('div');
  selectorContainer.id = 'node-type-selector';
  selectorContainer.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 12px;
    padding: 16px;
    background: rgba(34, 34, 34, 0.95);
    border-radius: 12px;
    border: 1px solid rgba(0, 243, 255, 0.3);
    z-index: 100;
    backdrop-filter: blur(8px);
  `;

  // Créer un bouton pour chaque type
  const types = getAllNodeTypes();
  
  for (let i = 0; i < types.length; i++) {
    const nodeType = types[i];
    const typeData = NODE_TYPES[nodeType];
    
    const button = document.createElement('button');
    button.className = 'node-type-button';
    button.dataset.nodeType = nodeType;
    button.dataset.index = i.toString();
    
    // Icônes pour chaque type
    const icons: Record<NodeType, string> = {
      relay: '⚪',
      amplifier: '📡',
      harvester: '⚡',
      disruptor: '💥',
      fortress: '🛡️',
    };
    
    button.innerHTML = `
      <div class="node-icon" style="font-size: 16px; margin-bottom: 2px;">${icons[nodeType]}</div>
      <div class="node-name" style="font-size: 10px; font-weight: 600; letter-spacing: 0.05em;">${typeData.name.split(' ')[0].toUpperCase()}</div>
      <div class="node-cost" style="font-size: 9px; color: #999; margin-top: 1px;">${typeData.cost}⚡</div>
    `;
    
    // Style du bouton
    const isSelected = nodeType === selectedNodeType;
    button.style.cssText = `
      padding: 12px 16px;
      background: ${isSelected ? 'rgba(0, 243, 255, 0.1)' : 'rgba(0, 0, 0, 0.5)'};
      border: 2px solid ${isSelected ? '#00F3FF' : 'rgba(255, 255, 255, 0.2)'};
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      min-width: 80px;
      text-align: center;
      color: #FFFFFF;
      font-family: 'IBM Plex Mono', monospace;
    `;
    
    // Hover effect + Tooltip (BLOC 1.5)
    let tooltip: HTMLElement | null = null;
    
    button.addEventListener('mouseenter', () => {
      if (!isSelected) {
        button.style.borderColor = 'rgba(0, 243, 255, 0.5)';
        button.style.background = 'rgba(0, 243, 255, 0.05)';
      }
      
      // Afficher tooltip (BLOC 1.5)
      showTooltip(button, typeData);
    });
    
    button.addEventListener('mouseleave', () => {
      if (!isSelected) {
        button.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        button.style.background = 'rgba(0, 0, 0, 0.5)';
      }
      
      // Masquer tooltip
      hideTooltip();
    });
    
    // Click handler
    button.addEventListener('click', () => {
      selectNodeType(nodeType);
    });
    
    selectorContainer.appendChild(button);
  }
  
  document.body.appendChild(selectorContainer);
  
  // Raccourcis clavier (1, 2, 3)
  document.addEventListener('keydown', (e) => {
    const index = parseInt(e.key) - 1;
    if (index >= 0 && index < types.length) {
      selectNodeType(types[index]);
    }
  });
  
  console.log('[NodeTypeSelector] Initialized with', types.length, 'types');
}

/**
 * Sélectionne un type de nœud
 */
function selectNodeType(type: NodeType): void {
  selectedNodeType = type;
  
  // Update UI
  if (selectorContainer) {
    const buttons = selectorContainer.querySelectorAll('.node-type-button');
    buttons.forEach(btn => {
      const btnType = (btn as HTMLElement).dataset.nodeType as NodeType;
      const isSelected = btnType === type;
      
      (btn as HTMLElement).style.borderColor = isSelected ? '#00F3FF' : 'rgba(255, 255, 255, 0.2)';
      (btn as HTMLElement).style.background = isSelected 
        ? 'rgba(0, 243, 255, 0.1)' 
        : 'rgba(0, 0, 0, 0.5)';
    });
  }
  
  console.log(`[NodeTypeSelector] Selected type: ${type}`);
}

/**
 * Récupère le type de nœud sélectionné
 */
export function getSelectedNodeType(): NodeType {
  return selectedNodeType;
}

/**
 * Masque/affiche le sélecteur
 */
export function setSelectorVisible(visible: boolean): void {
  if (selectorContainer) {
    selectorContainer.style.display = visible ? 'flex' : 'none';
  }
}

/**
 * Met à jour l'affichage des boutons selon l'énergie disponible (BLOC 1.4)
 */
export function updateSelectorEnergyState(): void {
  if (!selectorContainer) return;
  
  const energy = getEnergy();
  const buttons = selectorContainer.querySelectorAll('.node-type-button');
  
  buttons.forEach(btn => {
    const btnType = (btn as HTMLElement).dataset.nodeType as NodeType;
    const typeData = NODE_TYPES[btnType];
    const canAfford = energy.current >= typeData.cost;
    
    // Griser si pas assez d'énergie
    (btn as HTMLElement).style.opacity = canAfford ? '1' : '0.5';
    (btn as HTMLElement).style.cursor = canAfford ? 'pointer' : 'not-allowed';
    
    // Mettre à jour la couleur du coût
    const costEl = btn.querySelector('.node-cost') as HTMLElement;
    if (costEl) {
      costEl.style.color = canAfford ? '#999' : '#FF0055';
    }
  });
}

// =============================================================================
// TOOLTIPS (BLOC 1.5)
// =============================================================================

let currentTooltip: HTMLElement | null = null;

/**
 * Affiche un tooltip pour un type de nœud
 */
function showTooltip(button: HTMLElement, typeData: NodeTypeData): void {
  // Supprimer tooltip existant
  hideTooltip();
  
  const tooltip = document.createElement('div');
  tooltip.className = 'node-type-tooltip';
  tooltip.style.cssText = `
    position: fixed;
    background: rgba(0, 0, 0, 0.95);
    border: 1px solid #00F3FF;
    border-radius: 8px;
    padding: 12px 16px;
    color: #FFFFFF;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    z-index: 1000;
    pointer-events: none;
    max-width: 250px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  `;
  
  // Contenu du tooltip
  const lines: string[] = [
    `<div style="font-weight: 700; color: #00F3FF; margin-bottom: 8px;">${typeData.name}</div>`,
    `<div style="color: #CCCCCC; margin-bottom: 8px; line-height: 1.4;">${typeData.description}</div>`,
    `<div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 8px; margin-top: 8px;">`,
    `  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">`,
    `    <span style="color: #999;">Cost:</span>`,
    `    <span style="color: #FFFFFF;">${typeData.cost}⚡</span>`,
    `  </div>`,
    `  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">`,
    `    <span style="color: #999;">Radius:</span>`,
    `    <span style="color: #FFFFFF;">${typeData.radius}px</span>`,
    `  </div>`,
  ];
  
  if (typeData.signalRangeBonus !== 0) {
    lines.push(
      `  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">`,
      `    <span style="color: #999;">Signal Bonus:</span>`,
      `    <span style="color: #00FF88;">+${typeData.signalRangeBonus}px</span>`,
      `  </div>`
    );
  }
  
  if (typeData.energyProduction !== 0) {
    lines.push(
      `  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">`,
      `    <span style="color: #999;">Energy:</span>`,
      `    <span style="color: #FFD700;">${typeData.energyProduction > 0 ? '+' : ''}${typeData.energyProduction}/s</span>`,
      `  </div>`
    );
  }
  
  if (typeData.requiresNearby && typeData.requiresNearby.length > 0) {
    lines.push(
      `  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.1);">`,
      `    <span style="color: #FFAA00; font-size: 11px;">Requires nearby: ${typeData.requiresNearby.join(', ')}</span>`,
      `  </div>`
    );
  }
  
  lines.push(`</div>`);
  
  tooltip.innerHTML = lines.join('\n');
  
  // Positionner le tooltip au-dessus du bouton
  const rect = button.getBoundingClientRect();
  tooltip.style.left = `${rect.left + rect.width / 2}px`;
  tooltip.style.top = `${rect.top - 10}px`;
  tooltip.style.transform = 'translate(-50%, -100%)';
  
  document.body.appendChild(tooltip);
  currentTooltip = tooltip;
}

/**
 * Masque le tooltip actuel
 */
function hideTooltip(): void {
  if (currentTooltip) {
    document.body.removeChild(currentTooltip);
    currentTooltip = null;
  }
}
