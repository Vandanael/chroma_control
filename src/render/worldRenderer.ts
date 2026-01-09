/**
 * World Renderer - Bio-Digital "Free-Form" Edition
 * Rendu organique sans grille : Nœuds libres + Synapses pulsantes
 */

import { COLORS } from '../game/constants';
import { getPlayerColorValue } from '../game/playerColor';
import { getAllNodes, getNodeById, getDropPod, type GameNode, getDistance } from '../game/nodeManager';
import { calculateNodeOpacity, calculateLinkThickness } from '../game/signalPhysics';
// Bézier curves removed - using straight lines instead
import { calculateSignalPosition, drawSignalFlow } from './signalFlow';
import { calculatePopScale } from './gameFeel';
import { spawnPlacementParticles } from './particles';
import {
  getNodeOrganicRadius,
  getTerritoryWaveRadius,
  renderRadarWaves,
  initOrbitingParticles,
  renderOrbitingParticles,
  hasOrbitingParticles,
  clearOrganicAnimations,
} from './organicAnimations';

// =============================================================================
// CONSTANTS
// =============================================================================

const BASE_NODE_RADIUS = 15;
const DROP_POD_RADIUS = 25;
const GLOW_PULSE_SPEED = 0.003; // Vitesse de pulsation du glow
const ISOLATION_FADE_RATE = 0.33; // -33% opacité par seconde
const ISOLATION_DEATH_TIME = 3000; // 3 secondes avant mort

// =============================================================================
// RENDERING
// =============================================================================

/**
 * Rend le monde organique (fond + auras + nœuds)
 * MINIMALISME : Les lignes permanentes sont supprimées, seules les auras sont affichées
 */
export function renderWorld(ctx: CanvasRenderingContext2D): void {
  const nodes = getAllNodes();
  
  if (nodes.length === 0) return;

  // Fond noir pur (pas de points subtils)
  // Le fond est géré par clearCanvas dans engine.ts

  // ÉTAPE 1 : LES AURAS (zones d'influence) - DESSINER EN PREMIER
  drawNodeAuras(ctx, nodes);

  // ÉTAPE 2 : LES NŒUDS - DESSINER AU-DESSUS
  drawNodes(ctx, nodes);
  
  // ÉTAPE 3 : ONDES RADAR (pour nœuds boostés)
  const now = performance.now();
  const playerColor = getPlayerColorValue();
  renderRadarWaves(ctx, BASE_NODE_RADIUS, (nodeId: string) => {
    const node = getNodeById(nodeId);
    return node ? { x: node.x, y: node.y } : null;
  });
  
  // ÉTAPE 4 : PARTICULES EN ORBITE (pour nœuds hubs)
  const playerNodes = nodes.filter(n => n.owner === 'player');
  for (const node of playerNodes) {
    // Nœud hub = 3+ connexions
    if (node.connections && node.connections.length >= 3) {
      if (!hasOrbitingParticles(node.id)) {
        initOrbitingParticles(node.id, 1); // 1 particule par hub
      }
    }
  }
  renderOrbitingParticles(ctx, BASE_NODE_RADIUS, (nodeId: string) => {
    const node = getNodeById(nodeId);
    return node ? { x: node.x, y: node.y } : null;
  }, playerColor);
  
  // NOTE : Les synapses permanentes sont supprimées pour le minimalisme
  // Seules les connexions éphémères (500ms) sont affichées (gérées par ephemeralConnections.ts)
}

// =============================================================================
// AURAS (Zones d'influence)
// =============================================================================

/**
 * Dessine les auras des nœuds avec dégradé radial flou
 * Les auras se superposent pour créer une tache de couleur unifiée et organique
 */
function drawNodeAuras(ctx: CanvasRenderingContext2D, nodes: GameNode[]): void {
  ctx.save();
  
  // Séparer par propriétaire
  const playerNodes = nodes.filter(n => n.owner === 'player');
  const enemyNodes = nodes.filter(n => n.owner === 'enemy');
  
  // Rendre les auras joueur
  const playerColor = getPlayerColorValue();
  drawAurasForOwner(ctx, playerNodes, playerColor);
  
  // Rendre les auras ennemi
  drawAurasForOwner(ctx, enemyNodes, COLORS.ENEMY);
  
  ctx.restore();
}

/**
 * Dessine les auras pour un propriétaire donné
 * Chaque nœud génère une aura circulaire avec dégradé radial (Shadow/Glow)
 */
// Lazy import pour signal injection
let signalInjectionModule: typeof import('../game/signalInjection') | null = null;

function drawAurasForOwner(
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
    const glowPulse = Math.sin(now * GLOW_PULSE_SPEED) * 0.1 + 0.9; // 0.8 à 1.0
    
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
    
    // Dessiner l'aura avec ondulation organique
    ctx.fillStyle = gradient;
    ctx.beginPath();
    
    // Utiliser l'ondulation organique pour le contour de l'aura
    const segments = 48; // Plus de segments pour une ondulation plus fluide
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const waveRadius = getTerritoryWaveRadius(auraRadius, angle, now, node.id);
      const x = node.x + waveRadius * Math.cos(angle);
      const y = node.y + waveRadius * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Dessine les synapses pour un propriétaire donné
 * Distingue les liens directs (opacité 1.0) des liens auto-mesh (opacité 0.3)
 */
function drawSynapsesForOwner(ctx: CanvasRenderingContext2D, nodes: GameNode[]): void {
  const drawnConnections = new Set<string>(); // Éviter de dessiner deux fois

  // D'abord, dessiner tous les liens auto-mesh (opacité 0.3)
  for (const node of nodes) {
    for (const connectedId of node.connections) {
      // Créer une clé unique pour la connexion
      const key1 = `${node.id}-${connectedId}`;
      const key2 = `${connectedId}-${node.id}`;
      
      if (drawnConnections.has(key1) || drawnConnections.has(key2)) {
        continue;
      }

      const connected = getNodeById(connectedId);
      if (!connected || connected.owner !== node.owner) {
        continue;
      }

      // Vérifier si c'est un lien direct
      const isDirect = (node.directConnections && node.directConnections.includes(connectedId)) ||
                       (connected.directConnections && connected.directConnections.includes(node.id));
      
      // Dessiner seulement les liens auto-mesh ici (les directs seront dessinés après)
      if (isDirect) {
        continue; // On les dessinera après avec opacité 1.0
      }

      // Opacité 0.3 pour auto-mesh (avec atténuation par distance)
      const nodeOpacity1 = calculateNodeOpacity(node);
      const nodeOpacity2 = calculateNodeOpacity(connected);
      const avgOpacity = (nodeOpacity1 + nodeOpacity2) / 2;
      
      ctx.globalAlpha = 0.3 * avgOpacity; // Opacité réduite + atténuation
      ctx.lineWidth = 2; // Ligne fine pour auto-mesh

      // Ligne droite simple (remplace courbe de Bézier)
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(connected.x, connected.y);
      ctx.stroke();

      drawnConnections.add(key1);
    }
  }

  // Ensuite, dessiner les liens directs (opacité 1.0) par-dessus
  drawnConnections.clear(); // Réinitialiser pour les liens directs
  
  for (const node of nodes) {
    if (!node.directConnections) continue;
    
    for (const connectedId of node.directConnections) {
      const key1 = `${node.id}-${connectedId}`;
      const key2 = `${connectedId}-${node.id}`;
      
      if (drawnConnections.has(key1) || drawnConnections.has(key2)) {
        continue;
      }

      const connected = getNodeById(connectedId);
      if (!connected || connected.owner !== node.owner) {
        continue;
      }

      // lineWidth proportionnel à la power moyenne + atténuation par distance
      const avgPower = (node.power + connected.power) / 2;
      const baseLineWidth = Math.max(2, avgPower / 10); // Min 2px, max ~10px
      const lineWidth = calculateLinkThickness(node, connected, baseLineWidth);
      
      ctx.lineWidth = lineWidth;

      // Animation de pulsation (légère variation de l'opacité)
      const now = performance.now();
      const pulse = Math.sin(now * GLOW_PULSE_SPEED) * 0.1 + 0.9; // 0.8 à 1.0
      
      // Opacité avec atténuation par distance
      const nodeOpacity1 = calculateNodeOpacity(node);
      const nodeOpacity2 = calculateNodeOpacity(connected);
      const avgOpacity = (nodeOpacity1 + nodeOpacity2) / 2;
      ctx.globalAlpha = pulse * avgOpacity; // Pulsation + atténuation

      // Ligne droite simple (remplace courbe de Bézier)
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(connected.x, connected.y);
      ctx.stroke();
      
      // Dessiner le signal qui circule (physique chromatique) - ligne droite aussi
      const signalPos = calculateSignalPosition(node, connected, now);
      if (signalPos !== null) {
        // Calculer position sur ligne droite au lieu de courbe
        const midX = node.x + (connected.x - node.x) * signalPos;
        const midY = node.y + (connected.y - node.y) * signalPos;
        drawSignalFlow(ctx, node, connected, midX, midY, signalPos);
      }

      drawnConnections.add(key1);
    }
  }

  ctx.globalAlpha = 1.0;
}

// =============================================================================
// NODES
// =============================================================================

/**
 * Dessine tous les nœuds
 */
function drawNodes(ctx: CanvasRenderingContext2D, nodes: GameNode[]): void {
  for (const node of nodes) {
    drawNode(ctx, node);
  }
}

/**
 * Easing function pour animation spring (rebond avec overshoot)
 */
// easeOutBack supprimé - maintenant dans gameFeel.ts

/**
 * Calcule la distance depuis le Drop-Pod via la chaîne de connexions
 * OPTIMISÉ : Utilise object pool pour éviter allocations
 */
function getDistanceFromDropPod(node: GameNode): { distance: number } {
  const dropPod = getDropPod(node.owner);
  if (!dropPod) {
    return { distance: 0 };
  }

  // Si c'est le Drop-Pod lui-même
  if (node.isDropPod) {
    return { distance: 0 };
  }

  // BFS standard (optimisation object pool désactivée pour éviter circular imports)
  const visited = new Set<string>();
  const queue: Array<{ node: GameNode; hops: number; distance: number }> = [{ node, hops: 0, distance: 0 }];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (current.node.id === dropPod.id) {
      return { distance: current.distance };
    }

    if (visited.has(current.node.id)) continue;
    visited.add(current.node.id);

    for (const connectedId of current.node.connections) {
      if (visited.has(connectedId)) continue;
      
      const connected = getNodeById(connectedId);
      if (connected && connected.owner === node.owner) {
        const dist = getDistance(current.node, connected);
        queue.push({
          node: connected,
          hops: current.hops + 1,
          distance: current.distance + dist,
        });
      }
    }
  }

  // Pas de chemin trouvé (isolé)
  return { distance: Infinity };
}

/**
 * Dessine un nœud avec taille dynamique et animations organiques
 */
function drawNode(ctx: CanvasRenderingContext2D, node: GameNode): void {
  const now = performance.now();
  
  // Calculer la distance depuis le Drop-Pod
  const { distance } = getDistanceFromDropPod(node);
  
  // Taille dynamique : utiliser le radius du type de nœud (BLOC 1.2)
  let baseRadius = node.isDropPod ? DROP_POD_RADIUS : (node.radius || BASE_NODE_RADIUS);
  let opacity = 1.0;
  
  if (!node.isDropPod && distance < Infinity) {
    // Réduction de taille selon la distance (max 50% de réduction)
    const distanceFactor = Math.min(1, distance / 500); // 500px = réduction max
    baseRadius = baseRadius * (1 - distanceFactor * 0.5);
    
    // Réduction d'opacité selon la distance (max 30% de réduction)
    opacity = 1 - distanceFactor * 0.3;
  }

  // SPRINT 1 : Animation pop enrichie (0 → 1.3 → 1.0, 600ms)
  let scale = 1;
  if (node.creationTime) {
    scale = calculatePopScale(node.creationTime, now, 600); // SPRINT 1 : 600ms
    
    if (scale >= 1.0 && scale <= 1.01) { // Tolérance pour éviter les boucles
      delete node.creationTime;
    }
  }

  const baseRadiusScaled = baseRadius * scale;

  // Gestion de l'isolation (mort progressive)
  if (node.isIsolated && node.isolationTime) {
    const isolationAge = now - node.isolationTime;
    const fadeProgress = (isolationAge / ISOLATION_DEATH_TIME) * ISOLATION_FADE_RATE;
    opacity = Math.max(0, opacity - fadeProgress);
    
    // Supprimer le nœud si mort
    if (opacity <= 0) {
      // Le nœud sera supprimé par le système de survie
      return;
    }
  }

  // Couleur selon le propriétaire
  const color = node.owner === 'player' ? getPlayerColorValue() : COLORS.ENEMY;

  // Déterminer l'état du nœud pour l'animation organique
  let nodeState: 'calm' | 'boosted' | 'stressed' = 'calm';
  
  // Vérifier si le nœud est boosté (injection de signal active)
  let signalInjectionModule: typeof import('../game/signalInjection') | null = null;
  import('../game/signalInjection').then(module => {
    signalInjectionModule = module;
  });
  
  if (signalInjectionModule) {
    const multiplier = signalInjectionModule.getAuraMultiplier(node.id, now);
    if (multiplier > 1.0) {
      nodeState = 'boosted';
    }
  }
  
  // Vérifier si le nœud est sous pression (frontière contestée)
  // TODO: Implémenter la détection de frontière contestée
  // Pour l'instant, on garde 'calm' ou 'boosted'

  // Animation de scintillement (glow pulsant)
  const glowPulse = Math.sin(now * GLOW_PULSE_SPEED) * 0.3 + 0.7; // 0.4 à 1.0
  const shadowBlur = 15 * glowPulse * opacity;
  
  ctx.save();
  ctx.shadowBlur = shadowBlur;
  ctx.shadowColor = color;
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;

  // BLOC 4.4 : Fortress = hexagone, autres = cercle avec déformation organique
  if (node.nodeType === 'fortress') {
    // Dessiner un hexagone avec déformation organique
    ctx.beginPath();
    const sides = 6;
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2; // Rotation pour pointe en haut
      const organicRadius = getNodeOrganicRadius(baseRadiusScaled, angle, now, node.id, nodeState);
      const x = node.x + organicRadius * Math.cos(angle);
      const y = node.y + organicRadius * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    
    // Bordure épaisse (4px) pour fortress
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.globalAlpha = opacity * 0.8;
    ctx.stroke();
  } else {
    // Cercle avec déformation organique (nœuds normaux)
    ctx.beginPath();
    const segments = 32; // Nombre de segments pour la déformation organique
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const organicRadius = getNodeOrganicRadius(baseRadiusScaled, angle, now, node.id, nodeState);
      const x = node.x + organicRadius * Math.cos(angle);
      const y = node.y + organicRadius * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  // Cœur plus lumineux (pour Drop-Pod et nœuds puissants)
  if (node.isDropPod || node.power > 75) {
    ctx.shadowBlur = 0;
    ctx.globalAlpha = opacity * 0.8;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(node.x, node.y, baseRadiusScaled * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  
  // Indicateur de cooldown pour disruptors (BLOC 3.4)
  if (node.nodeType === 'disruptor' && node.owner === 'player') {
    import('../game/abilities').then(({ getCooldownProgress, isAbilityReady }) => {
      const progress = getCooldownProgress(node.id);
      const ready = isAbilityReady(node.id);
      
      if (!ready) {
        // Cercle de cooldown autour du nœud
        ctx.save();
        ctx.strokeStyle = '#FF0055';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        
        // Arc de progression
        ctx.beginPath();
        ctx.arc(
          node.x, node.y,
          (node.radius || 18) + 8,
          -Math.PI / 2,
          -Math.PI / 2 + (Math.PI * 2 * progress),
          false
        );
        ctx.stroke();
        
        ctx.restore();
      } else {
        // Indicateur "prêt" (pulsation)
        const pulse = Math.sin(performance.now() * 0.01) * 0.3 + 0.7;
        ctx.save();
        ctx.strokeStyle = '#00FF88';
        ctx.lineWidth = 2;
        ctx.globalAlpha = pulse * 0.8;
        ctx.beginPath();
        ctx.arc(node.x, node.y, (node.radius || 18) + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    });
  }
}
