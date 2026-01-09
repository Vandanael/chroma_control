/**
 * Optimized World Renderer - Batching & Performance
 * Version optimisée avec batching, sprite cache, et dirty rectangles
 */

import { COLORS } from '../game/constants';
import { getPlayerColorValue } from '../game/playerColor';
import { getAllNodes, getNodeById, type GameNode } from '../game/nodeManager';
import { calculateNodeOpacity, calculateLinkThickness } from '../game/signalPhysics';
import { calculateDynamicCurvature } from './bezierCurves';
import { getSprite, clearSpriteCache } from './spriteCache';
import { acquireSet, releaseSet, acquireArray, releaseArray } from './objectPool';
import { markDirty, needsFullRedraw, getAndClearDirtyRegions } from './dirtyRectangles';

// Lazy import pour signal injection
let signalInjectionModule: typeof import('../game/signalInjection') | null = null;

// =============================================================================
// CONSTANTS
// =============================================================================

const BASE_NODE_RADIUS = 15;
const DROP_POD_RADIUS = 25;

// =============================================================================
// BATCHED RENDERING
// =============================================================================

interface BatchedPath {
  color: string;
  opacity: number;
  lineWidth: number;
  paths: Array<{ x1: number; y1: number; x2: number; y2: number; curvature: number }>;
}

/**
 * Rend le monde avec batching optimisé
 */
export function renderWorldOptimized(
  ctx: CanvasRenderingContext2D,
  _width: number,
  _height: number
): void {
  const nodes = getAllNodes();
  if (nodes.length === 0) return;

  // Vérifier si full redraw nécessaire
  const fullRedraw = needsFullRedraw();
  const dirtyRegions = getAndClearDirtyRegions();

  if (fullRedraw || dirtyRegions.length === 0) {
    // Full redraw
    renderFullWorld(ctx, nodes);
  } else {
    // Partial redraw (dirty rectangles)
    for (const region of dirtyRegions) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(region.x, region.y, region.width, region.height);
      ctx.clip();
      
      renderFullWorld(ctx, nodes);
      
      ctx.restore();
    }
  }
}

// Lazy import pour settings
let settingsModule: typeof import('../game/settings') | null = null;

/**
 * Rend le monde complet avec batching
 * MINIMALISME : Les lignes permanentes sont optionnelles (paramètre utilisateur)
 */
function renderFullWorld(ctx: CanvasRenderingContext2D, nodes: GameNode[]): void {
  // Charger les paramètres (lazy, une seule fois)
  if (!settingsModule) {
    import('../game/settings').then(module => {
      settingsModule = module;
    });
  }
  
  // ÉTAPE 1 : AURAS (zones d'influence avec dégradé radial) - DESSINER EN PREMIER
  renderNodeAuras(ctx, nodes);

  // ÉTAPE 2 : LIGNES DE CONNEXION (si activées dans les paramètres)
  if (settingsModule && settingsModule.getSettings().showConnections) {
    renderPermanentConnections(ctx, nodes);
  }

  // ÉTAPE 3 : NŒUDS (avec sprite cache)
  renderNodesBatched(ctx, nodes);
  
  // NOTE : Les connexions éphémères (500ms) sont affichées séparément (gérées par ephemeralConnections.ts)
}

/**
 * Rend les auras des nœuds avec dégradé radial flou
 * Les auras se superposent pour créer une tache de couleur unifiée et organique
 */
function renderNodeAuras(ctx: CanvasRenderingContext2D, nodes: GameNode[]): void {
  ctx.save();
  
  // Séparer par propriétaire
  const playerNodes = acquireArray<GameNode>();
  const enemyNodes = acquireArray<GameNode>();
  
  for (const node of nodes) {
    if (node.owner === 'player') {
      playerNodes.push(node);
    } else {
      enemyNodes.push(node);
    }
  }
  
  // Rendre les auras joueur
  const playerColor = getPlayerColorValue();
  renderAurasForOwner(ctx, playerNodes, playerColor);
  
  // Rendre les auras ennemi
  renderAurasForOwner(ctx, enemyNodes, COLORS.ENEMY);
  
  // Libérer les tableaux
  releaseArray(playerNodes);
  releaseArray(enemyNodes);
  
  ctx.restore();
}

/**
 * Rend les auras pour un propriétaire donné
 * Chaque nœud génère une aura circulaire avec dégradé radial (Shadow/Glow)
 * Prend en compte l'injection de signal (aura gonfle et devient plus opaque)
 */
function renderAurasForOwner(
  ctx: CanvasRenderingContext2D,
  nodes: GameNode[],
  color: string
): void {
  const AURA_RADIUS = 120; // Rayon de base de l'aura (zone d'influence)
  const now = performance.now();
  
  // Charger le système d'injection de signal (lazy, une seule fois)
  if (!signalInjectionModule) {
    import('../game/signalInjection').then(module => {
      signalInjectionModule = module;
    });
  }
  
  for (const node of nodes) {
    // Calculer l'opacité du nœud
    const nodeOpacity = calculateNodeOpacity(node);
    
    // Animation de pulsation légère
    const glowPulse = Math.sin(now * 0.003) * 0.1 + 0.9; // 0.8 à 1.0
    
    // Rayon de base de l'aura (plus grand pour Drop-Pod)
    let baseAuraRadius = node.isDropPod ? AURA_RADIUS * 1.5 : AURA_RADIUS;
    
    // Appliquer le multiplicateur d'injection de signal
    if (signalInjectionModule) {
      const multiplier = signalInjectionModule.getAuraMultiplier(node.id, now);
      baseAuraRadius *= multiplier;
    }
    
    const auraRadius = baseAuraRadius;
    
    // Boost d'opacité si injection active
    let opacityBoost = 0;
    if (signalInjectionModule) {
      opacityBoost = signalInjectionModule.getOpacityBoost(node.id, now);
    }
    
    // Créer un dégradé radial
    const gradient = ctx.createRadialGradient(
      node.x, node.y, 0,                    // Centre (début)
      node.x, node.y, auraRadius              // Rayon extérieur
    );
    
    // Dégradé : transparent au centre → visible au bord → fade out
    // Opacité augmentée si injection active
    const baseOpacity = nodeOpacity * glowPulse;
    const finalOpacity = Math.min(1.0, baseOpacity + opacityBoost);
    
    const colorTransparent = color + '00'; // Transparent
    const colorMid = color + Math.floor(0.15 * finalOpacity * 255).toString(16).padStart(2, '0');
    const colorEdge = color + Math.floor(0.25 * finalOpacity * 255).toString(16).padStart(2, '0');
    const colorFade = color + '00'; // Fade out
    
    gradient.addColorStop(0, colorTransparent);
    gradient.addColorStop(0.3, colorMid);
    gradient.addColorStop(0.7, colorEdge);
    gradient.addColorStop(0.95, colorEdge);
    gradient.addColorStop(1, colorFade);
    
    // Dessiner l'aura
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(node.x, node.y, auraRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Rend les synapses pour un propriétaire avec batching
 */
function renderSynapsesBatchedForOwner(
  ctx: CanvasRenderingContext2D,
  nodes: GameNode[],
  color: string
): void {
  const drawnConnections = acquireSet();
  const batches: Map<string, BatchedPath> = new Map();

  // Collecter tous les chemins par opacité/lineWidth
  for (const node of nodes) {
    for (const connectedId of node.connections) {
      const key1 = `${node.id}-${connectedId}`;
      const key2 = `${connectedId}-${node.id}`;

      if (drawnConnections.has(key1) || drawnConnections.has(key2)) {
        continue;
      }

      const connected = getNodeById(connectedId);
      if (!connected || connected.owner !== node.owner) {
        continue;
      }

      const isDirect = (node.directConnections && node.directConnections.includes(connectedId)) ||
                       (connected.directConnections && connected.directConnections.includes(node.id));

      // Calculer propriétés
      const nodeOpacity1 = calculateNodeOpacity(node);
      const nodeOpacity2 = calculateNodeOpacity(connected);
      const avgOpacity = (nodeOpacity1 + nodeOpacity2) / 2;
      
      const avgPower = (node.power + connected.power) / 2;
      const baseLineWidth = Math.max(2, avgPower / 10);
      const lineWidth = isDirect 
        ? calculateLinkThickness(node, connected, baseLineWidth)
        : 2;
      
      const finalOpacity = isDirect ? avgOpacity : 0.3 * avgOpacity;
      const curvature = calculateDynamicCurvature(node.x, node.y, connected.x, connected.y) * (isDirect ? 1 : 0.5);

      // Clé de batch (opacité + lineWidth)
      const batchKey = `${finalOpacity.toFixed(2)}-${lineWidth.toFixed(1)}`;

      if (!batches.has(batchKey)) {
        batches.set(batchKey, {
          color,
          opacity: finalOpacity,
          lineWidth,
          paths: [],
        });
      }

      batches.get(batchKey)!.paths.push({
        x1: node.x,
        y1: node.y,
        x2: connected.x,
        y2: connected.y,
        curvature,
      });

      drawnConnections.add(key1);
    }
  }

  // Dessiner tous les batches
  for (const batch of batches.values()) {
    ctx.strokeStyle = batch.color;
    ctx.globalAlpha = batch.opacity;
    ctx.lineWidth = batch.lineWidth;

    ctx.beginPath();
    for (const path of batch.paths) {
      // Ligne droite simple (remplace courbe de Bézier)
      ctx.moveTo(path.x1, path.y1);
      ctx.lineTo(path.x2, path.y2);
    }
    ctx.stroke();
  }

  releaseSet(drawnConnections);
  ctx.globalAlpha = 1.0;
}

/**
 * Rend les lignes de connexion permanentes (si activées)
 * Opacité subtile (0.3) pour ne pas surcharger visuellement
 */
function renderPermanentConnections(ctx: CanvasRenderingContext2D, nodes: GameNode[]): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Séparer par propriétaire
  const playerNodes = acquireArray<GameNode>();
  const enemyNodes = acquireArray<GameNode>();
  
  for (const node of nodes) {
    if (node.owner === 'player') {
      playerNodes.push(node);
    } else {
      enemyNodes.push(node);
    }
  }
  
  // Rendre les connexions joueur
  const playerColor = getPlayerColorValue();
  renderPermanentConnectionsForOwner(ctx, playerNodes, playerColor);
  
  // Rendre les connexions ennemi
  renderPermanentConnectionsForOwner(ctx, enemyNodes, COLORS.ENEMY);
  
  // Libérer les tableaux
  releaseArray(playerNodes);
  releaseArray(enemyNodes);
  
  ctx.restore();
}

/**
 * Rend les connexions permanentes pour un propriétaire donné
 */
function renderPermanentConnectionsForOwner(
  ctx: CanvasRenderingContext2D,
  nodes: GameNode[],
  color: string
): void {
  const drawnConnections = acquireSet();
  
  for (const node of nodes) {
    for (const connectedId of node.connections) {
      const key1 = `${node.id}-${connectedId}`;
      const key2 = `${connectedId}-${node.id}`;
      
      if (drawnConnections.has(key1) || drawnConnections.has(key2)) {
        continue;
      }
      
      const connected = getNodeById(connectedId);
      if (!connected || connected.owner !== node.owner) {
        continue;
      }
      
      // Opacité subtile (0.3) pour ne pas surcharger
      const nodeOpacity1 = calculateNodeOpacity(node);
      const nodeOpacity2 = calculateNodeOpacity(connected);
      const avgOpacity = (nodeOpacity1 + nodeOpacity2) / 2;
      
      ctx.globalAlpha = 0.3 * avgOpacity;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5; // Ligne fine et subtile
      
      // Ligne droite simple
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(connected.x, connected.y);
      ctx.stroke();
      
      drawnConnections.add(key1);
    }
  }
  
  releaseSet(drawnConnections);
  ctx.globalAlpha = 1.0;
}

/**
 * Helper pour point de contrôle Bézier
 */
function getBezierControlPoint(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curvature: number
): { x: number; y: number } {
  const BEZIER_OFFSET = 30;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) return { x: x1, y: y1 };
  
  const perpX = -dy / length;
  const perpY = dx / length;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  return {
    x: midX + perpX * BEZIER_OFFSET * curvature,
    y: midY + perpY * BEZIER_OFFSET * curvature,
  };
}

/**
 * Rend les nœuds avec sprite cache
 */
function renderNodesBatched(ctx: CanvasRenderingContext2D, nodes: GameNode[]): void {
  const now = performance.now();

  for (const node of nodes) {
    const color = node.owner === 'player' ? getPlayerColorValue() : COLORS.ENEMY;
    const radius = node.isDropPod ? DROP_POD_RADIUS : BASE_NODE_RADIUS;
    const opacity = calculateNodeOpacity(node);
    
    // Déterminer l'état
    let state: 'normal' | 'pulsing' | 'isolated' = 'normal';
    if (node.isIsolated) {
      state = 'isolated';
    } else if (node.creationTime && (now - node.creationTime) < 300) {
      state = 'pulsing';
    }

    // Obtenir sprite depuis cache
    const sprite = getSprite(radius, color, node.isDropPod, state, node.owner);

    // Dessiner avec drawImage (opération la plus rapide)
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.drawImage(
      sprite as any, // OffscreenCanvas compatible avec drawImage
      node.x - radius,
      node.y - radius,
      radius * 2,
      radius * 2
    );
    ctx.restore();

    // Marquer région comme sale pour dirty rectangles
    markDirty(node.x - radius - 5, node.y - radius - 5, radius * 2 + 10, radius * 2 + 10);
  }
}

/**
 * Nettoie les caches (appelé lors du reset)
 */
export function clearRenderCaches(): void {
  clearSpriteCache();
  // markAllDirty sera appelé avec les vraies dimensions depuis engine.ts
}
