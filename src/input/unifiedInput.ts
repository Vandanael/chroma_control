/**
 * Unified Input System - PointerEvents
 * Gère de manière transparente souris (Desktop) et tactile (Mobile)
 * Évite les conflits entre mousedown et touchstart
 */

import { getGameState } from '../game/state';
import { createNodeWithType } from '../game/nodeManager';
import { initiateSyringeAnimation } from '../render/syringeRenderer';
import { isWithinSignalRange } from '../game/signalPhysics';
import {
  getNodeAtPosition,
  findClosestAllyNode,
  type GameNode,
} from '../game/nodeManager';
import { getSelectedColorType, getPlayerColorValue } from '../game/playerColor';
import { playNodePlacement, playTooFarInfo } from '../audio/audioManager';
// PROTOTYPE : Node Type Selector désactivé
// import { getSelectedNodeType } from '../ui/nodeTypeSelector';
import type { NodeType } from '../game/nodeTypes';
import { spendEnergy, getEnergy } from '../game/state';
import { NODE_TYPES } from '../game/nodeTypes';

// Lazy import pour double-tap burst
let doubleTapBurstModule: typeof import('../game/doubleTapBurst') | null = null;
let signalInjectionModule: typeof import('../game/signalInjection') | null = null;

// =============================================================================
// CONSTANTS
// =============================================================================

// Zones de collision adaptatives (plus larges sur mobile)
const DESKTOP_NODE_HIT_RADIUS = 20;
const MOBILE_NODE_HIT_RADIUS = 40; // 2x plus large pour "fat finger"

// Offset visuel pour placement tactile (le doigt ne masque pas la seringue)
const MOBILE_PLACEMENT_OFFSET_Y = -60; // Offset vers le haut

// =============================================================================
// STATE
// =============================================================================

let pointerX = 0;
let pointerY = 0;
let isPointerOverCanvas = false;
let closestAllyNode: GameNode | null = null;
let isMobile = false;
let activePointerId: number | null = null; // Éviter double-trigger

// =============================================================================
// DEVICE DETECTION
// =============================================================================

/**
 * Détecte si on est sur mobile
 */
function detectMobile(): boolean {
  return 'ontouchstart' in window || 
         navigator.maxTouchPoints > 0 ||
         /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Obtient le rayon de collision adaptatif
 */
function getHitRadius(): number {
  return isMobile ? MOBILE_NODE_HIT_RADIUS : DESKTOP_NODE_HIT_RADIUS;
}

// =============================================================================
// SETUP
// =============================================================================

/**
 * Initialise le système d'input unifié avec PointerEvents
 */
export function initUnifiedInput(canvas: HTMLCanvasElement): void {
  isMobile = detectMobile();
  
  // Utiliser PointerEvents (unifie souris et tactile)
  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerUp);
  canvas.addEventListener('pointerenter', () => { isPointerOverCanvas = true; });
  canvas.addEventListener('pointerleave', () => { 
    isPointerOverCanvas = false;
    activePointerId = null;
  });

  // Prévenir les événements par défaut (scroll, zoom)
  canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });

  console.log(`[UnifiedInput] Initialized (${isMobile ? 'Mobile' : 'Desktop'})`);
}

// =============================================================================
// POINTER TRACKING
// =============================================================================

function handlePointerMove(event: PointerEvent): void {
  // Ignorer si ce n'est pas le pointeur actif
  if (activePointerId !== null && event.pointerId !== activePointerId) {
    return;
  }

  const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
  pointerX = event.clientX - rect.left;
  pointerY = event.clientY - rect.top;

  // Mettre à jour le nœud allié le plus proche
  closestAllyNode = findClosestAllyNode(pointerX, pointerY, 'player');
}

// =============================================================================
// POINTER CLICK/TOUCH
// =============================================================================

function handlePointerDown(event: PointerEvent): void {
  // Bloquer l'input si le jeu n'est pas en état PLAYING
  if (getGameState() !== 'PLAYING') {
    return;
  }

  // Enregistrer le pointeur actif (éviter double-trigger)
  activePointerId = event.pointerId;

  const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Vérifier si on clique/touche un nœud existant
  const hitRadius = getHitRadius();
  const clickedNode = getNodeAtPosition(x, y, hitRadius);
  
  if (clickedNode) {
    // Charger les modules si nécessaire (lazy, une seule fois)
    if (!doubleTapBurstModule) {
      import('../game/doubleTapBurst').then(module => {
        doubleTapBurstModule = module;
      });
    }
    if (!signalInjectionModule) {
      import('../game/signalInjection').then(module => {
        signalInjectionModule = module;
      });
    }
    
    // Gérer le double-tap burst
    if (doubleTapBurstModule) {
      if (doubleTapBurstModule.handleNodeClick(clickedNode.id, clickedNode.owner)) {
        // Double-tap détecté et traité - ne pas faire d'injection
        return;
      }
    }
    
    // Si ce n'est pas un double-tap, gérer les actions normales
    if (clickedNode.owner === 'enemy') {
      // Attaquer un nœud ennemi (à implémenter)
      handleAttackNode(clickedNode);
      return;
    }
    
    if (clickedNode.owner === 'player') {
      // Injection de signal sur nœud allié (simple clic)
      if (signalInjectionModule) {
        signalInjectionModule.injectSignal(clickedNode.id);
      }
      return;
    }
    
    return;
  }

  // Placement libre d'un nouveau nœud
  handlePlaceNode(x, y, event);
}

function handlePointerUp(event: PointerEvent): void {
  // Libérer le pointeur actif
  if (activePointerId === event.pointerId) {
    activePointerId = null;
  }
}

/**
 * Place un nouveau nœud à la position donnée
 * Avec offset visuel sur mobile pour que le doigt ne masque pas la seringue
 */
function handlePlaceNode(x: number, y: number, event: PointerEvent): void {
  // Sanitisation : valider les coordonnées (protection contre manipulation)
  const canvas = event.target as HTMLCanvasElement;
  const rect = canvas.getBoundingClientRect();
  const maxX = rect.width;
  const maxY = rect.height;
  
  // Validation synchrone (protection contre manipulation)
  if (typeof x !== 'number' || typeof y !== 'number' || 
      !Number.isFinite(x) || !Number.isFinite(y) ||
      x < 0 || y < 0 || x > maxX || y > maxY) {
    console.warn('[Security] Invalid coordinates in handlePlaceNode:', x, y);
    return;
  }
  
  // Offset visuel sur mobile (placement au-dessus du doigt)
  let placementX = x;
  let placementY = y;
  
  if (isMobile && event.pointerType === 'touch') {
    placementY = y + MOBILE_PLACEMENT_OFFSET_Y;
    
    // Ajuster si on sort du canvas
    if (placementY < 0) {
      placementY = y; // Pas d'offset si ça sort en haut
    }
  }

  // Vérifier la portée du signal (sur la position d'origine, pas l'offset)
  if (!isWithinSignalRange(x, y, 'player')) {
    console.warn(`[UnifiedInput] Position (${x}, ${y}) out of signal range`);
    // SPRINT 1 : Plus de message texte, juste un bip discret
    playTooFarInfo(); // Bip d'information discret (pas d'erreur)
    return;
  }

  // PROTOTYPE : Nœud unique 'Chroma Node' (relay par défaut)
  const nodeType: NodeType = 'relay';
  const typeData = NODE_TYPES[nodeType];
  
  // BLOC 6.2 : Appliquer modificateur de phase au coût
  let actualCost = typeData.cost;
  
  // Charger les modificateurs de phase de manière synchrone si possible
  import('../game/gamePhases').then(({ getCurrentPhaseModifiers }) => {
    const modifiers = getCurrentPhaseModifiers();
    actualCost = Math.ceil(typeData.cost * modifiers.costMultiplier);
  }).catch(() => {
    // Si erreur, utiliser le coût de base
    actualCost = typeData.cost;
  });
  
  // Pour l'instant, utiliser le coût de base (les modificateurs seront appliqués au prochain frame)
  // TODO: Rendre cela synchrone si nécessaire
  
  // Vérifier le coût (BLOC 1.4)
  if (!spendEnergy(actualCost)) {
    console.warn(`[UnifiedInput] Not enough energy to place ${nodeType} (cost: ${actualCost}, current: ${getEnergy().current})`);
    // SPRINT 1 : Plus de message texte pour l'énergie non plus
    playTooFarInfo(); // Bip d'information discret
    return;
  }
  
  // Créer le nouveau nœud avec le type sélectionné (BLOC 1.2)
  const newNode = createNodeWithType(placementX, placementY, 'player', nodeType);
  if (!newNode) {
    console.warn(`[UnifiedInput] Failed to create ${nodeType} node`);
    // Rembourser l'énergie si création échoue
    spendEnergy(-typeData.cost);
    return;
  }

  // Jouer le son de placement (tonalité selon la couleur)
  const playerColor = getSelectedColorType();
  playNodePlacement(playerColor);

  // Lancer l'animation de seringue depuis le nœud allié le plus proche
  const allyNode = findClosestAllyNode(x, y, 'player');
  if (allyNode) {
    initiateSyringeAnimation(allyNode.x, allyNode.y, placementX, placementY, 'player', () => {
      console.log(`[UnifiedInput] Syringe animation completed for node ${newNode.id}`);
    });
  }

  console.log(`[UnifiedInput] Node placed at (${placementX}, ${placementY})`);
}

/**
 * Affiche le message "Too far from Signal" (élégant et intégré)
 */
function showTooFarMessage(x: number, y: number): void {
  const messageEl = document.getElementById('too-far-message');
  if (!messageEl) return;
  
  // Positionner le message près du pointeur (avec offset sur mobile)
  const offsetY = isMobile ? MOBILE_PLACEMENT_OFFSET_Y : -40;
  messageEl.style.left = `${x + 20}px`;
  messageEl.style.top = `${y + offsetY}px`;
  messageEl.style.display = 'block';
  
  // Animation d'apparition élégante (fade + scale)
  messageEl.style.opacity = '0';
  messageEl.style.transform = 'scale(0.8) translateY(-10px)';
  messageEl.style.transition = 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
  
  // Forcer le reflow pour déclencher l'animation
  void messageEl.offsetWidth;
  
  messageEl.style.opacity = '1';
  messageEl.style.transform = 'scale(1) translateY(0)';
  
  // Masquer après 1.2 secondes avec fade-out
  setTimeout(() => {
    messageEl.style.opacity = '0';
    messageEl.style.transform = 'scale(0.9) translateY(-5px)';
    messageEl.style.transition = 'all 0.3s ease-out';
    setTimeout(() => {
      messageEl.style.display = 'none';
      messageEl.style.transform = 'scale(0.8) translateY(-10px)';
    }, 300);
  }, 1200);
}

/**
 * Attaque un nœud ennemi ou active une capacité (BLOC 3.2)
 */
function handleAttackNode(node: GameNode): void {
  // Si c'est un disruptor allié, activer la capacité (BLOC 3.2)
  if (node.owner === 'player' && node.nodeType === 'disruptor') {
    import('../game/abilities').then(({ isAbilityReady, useAbility }) => {
      if (isAbilityReady(node.id)) {
        useAbility(node.id);
        // Déclencher l'effet de disruption pulse (BLOC 3.3)
        import('../game/disruptionPulse').then(({ executeDisruptionPulse }) => {
          executeDisruptionPulse(node);
        });
      } else {
        console.log(`[UnifiedInput] Disruptor ${node.id} on cooldown`);
      }
    });
  } else {
    console.log(`[UnifiedInput] Attack node ${node.id} (not implemented yet)`);
  }
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
  placementOffset?: { x: number; y: number };
} | null {
  if (!isPointerOverCanvas) return null;
  
  if (!closestAllyNode) {
    return null;
  }

  const inRange = isWithinSignalRange(pointerX, pointerY, 'player');
  
  // Calculer offset de placement sur mobile
  let placementOffset: { x: number; y: number } | undefined;
  if (isMobile && activePointerId !== null) {
    placementOffset = {
      x: 0,
      y: MOBILE_PLACEMENT_OFFSET_Y,
    };
  }

  return {
    valid: inRange,
    startX: closestAllyNode.x,
    startY: closestAllyNode.y,
    endX: pointerX,
    endY: pointerY,
    placementOffset,
  };
}

/**
 * Récupère la position du pointeur
 */
export function getPointerPosition(): { x: number; y: number; isOverCanvas: boolean; isMobile: boolean } {
  return { 
    x: pointerX, 
    y: pointerY, 
    isOverCanvas: isPointerOverCanvas,
    isMobile,
  };
}
