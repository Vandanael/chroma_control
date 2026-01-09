/**
 * Node Input Manager - Signal Physics Edition
 * Placement libre basé sur la portée du signal (pas d'énergie)
 */

import { getGameState } from '../game/state';
import { createNode } from '../game/nodeManager';
import { initiateSyringeAnimation } from '../render/syringeRenderer';
import { isWithinSignalRange } from '../game/signalPhysics';
import {
  getNodeAtPosition,
  findClosestAllyNode,
  type GameNode,
} from '../game/nodeManager';

// =============================================================================
// STATE
// =============================================================================

let mouseX = 0;
let mouseY = 0;
let isMouseOverCanvas = false;
let closestAllyNode: GameNode | null = null;

// =============================================================================
// SETUP
// =============================================================================

/**
 * Initialise les event listeners pour le placement libre
 */
export function initNodeInput(canvas: HTMLCanvasElement): void {
  canvas.addEventListener('click', handleNodeClick);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseenter', () => { isMouseOverCanvas = true; });
  canvas.addEventListener('mouseleave', () => { isMouseOverCanvas = false; });
  console.log('[NodeInput] Free-form placement system initialized (Signal Physics)');
}

// =============================================================================
// MOUSE TRACKING
// =============================================================================

function handleMouseMove(event: MouseEvent): void {
  const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
  mouseX = event.clientX - rect.left;
  mouseY = event.clientY - rect.top;

  // Mettre à jour le nœud allié le plus proche
  closestAllyNode = findClosestAllyNode(mouseX, mouseY, 'player');
}

// =============================================================================
// CLICK HANDLER
// =============================================================================

function handleNodeClick(event: MouseEvent): void {
  // Bloquer l'input si le jeu n'est pas en état PLAYING
  if (getGameState() !== 'PLAYING') {
    return;
  }
  
  const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Vérifier si on clique sur un nœud existant (pour attaque/suppression)
  const clickedNode = getNodeAtPosition(x, y, 20);
  
  if (clickedNode) {
    if (clickedNode.owner === 'enemy') {
      // Attaquer un nœud ennemi (à implémenter)
      handleAttackNode(clickedNode);
    }
    return;
  }

  // Placement libre d'un nouveau nœud
  handlePlaceNode(x, y);
}

/**
 * Place un nouveau nœud à la position donnée
 */
function handlePlaceNode(x: number, y: number): void {
  // Vérifier la portée du signal
  if (!isWithinSignalRange(x, y, 'player')) {
    console.warn(`[NodeInput] Position (${x}, ${y}) out of signal range`);
    showTooFarMessage(x, y);
    return;
  }

  // Créer le nouveau nœud
  const newNode = createNode(x, y, 'player');
  if (!newNode) {
    console.warn(`[NodeInput] Failed to create node`);
    return;
  }

  // Lancer l'animation de seringue depuis le nœud allié le plus proche
  const allyNode = findClosestAllyNode(x, y, 'player');
  if (allyNode) {
    initiateSyringeAnimation(allyNode.x, allyNode.y, x, y, 'player', () => {
      console.log(`[NodeInput] Syringe animation completed for node ${newNode.id}`);
    });
  }

  console.log(`[NodeInput] Node placed at (${x}, ${y})`);
}

/**
 * Affiche le message "Too far from Signal"
 */
function showTooFarMessage(x: number, y: number): void {
  const messageEl = document.getElementById('too-far-message');
  if (!messageEl) return;
  
  // Positionner le message près du curseur
  messageEl.style.left = `${x + 20}px`;
  messageEl.style.top = `${y - 30}px`;
  messageEl.style.display = 'block';
  messageEl.style.opacity = '1';
  
  // Masquer après 1.5 secondes
  setTimeout(() => {
    messageEl.style.opacity = '0';
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 300);
  }, 1500);
}

/**
 * Attaque un nœud ennemi (à implémenter)
 */
function handleAttackNode(node: GameNode): void {
  console.log(`[NodeInput] Attack node ${node.id} (not implemented yet)`);
}

// =============================================================================
// PREDICTIVE LINE (Pour le rendu)
// =============================================================================

/**
 * Récupère les informations pour la ligne prédictive
 */
export function getPredictiveLineInfo(): {
  valid: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
} | null {
  if (!isMouseOverCanvas) return null;
  
  if (!closestAllyNode) {
    return null;
  }

  const inRange = isWithinSignalRange(mouseX, mouseY, 'player');

  return {
    valid: inRange,
    startX: closestAllyNode.x,
    startY: closestAllyNode.y,
    endX: mouseX,
    endY: mouseY,
  };
}

/**
 * Récupère la position de la souris
 */
export function getMousePosition(): { x: number; y: number; isOverCanvas: boolean } {
  return { x: mouseX, y: mouseY, isOverCanvas: isMouseOverCanvas };
}
