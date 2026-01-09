/**
 * Ephemeral Connections - Feedback visuel éphémère (500ms)
 * Affiche les lignes de connexion uniquement lors du placement d'un nouveau nœud
 */

import { getAllNodes, getNodeById, type GameNode } from '../game/nodeManager';
import { getPlayerColorValue } from '../game/playerColor';
import { COLORS } from '../game/constants';
import { calculateNodeOpacity, calculateLinkThickness } from '../game/signalPhysics';
import { calculateSignalPosition, drawSignalFlow } from './signalFlow';

// =============================================================================
// CONSTANTS
// =============================================================================

const EPHEMERAL_DURATION = 500; // 500ms d'affichage (flash de connexion amélioré)
const GLOW_PULSE_SPEED = 0.003;

// =============================================================================
// STATE
// =============================================================================

interface EphemeralConnection {
  nodeId1: string;
  nodeId2: string;
  timestamp: number;
  owner: 'player' | 'enemy';
}

const ephemeralConnections: EphemeralConnection[] = [];

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Enregistre une nouvelle connexion pour affichage éphémère
 */
export function registerEphemeralConnection(
  nodeId1: string,
  nodeId2: string,
  owner: 'player' | 'enemy'
): void {
  const now = performance.now();
  
  // Vérifier si la connexion existe déjà
  const exists = ephemeralConnections.some(
    conn => 
      (conn.nodeId1 === nodeId1 && conn.nodeId2 === nodeId2) ||
      (conn.nodeId1 === nodeId2 && conn.nodeId2 === nodeId1)
  );
  
  if (!exists) {
    ephemeralConnections.push({
      nodeId1,
      nodeId2,
      timestamp: now,
      owner,
    });
  }
}

/**
 * Nettoie les connexions expirées
 */
function cleanupExpiredConnections(now: number): void {
  for (let i = ephemeralConnections.length - 1; i >= 0; i--) {
    const age = now - ephemeralConnections[i].timestamp;
    if (age >= EPHEMERAL_DURATION) {
      ephemeralConnections.splice(i, 1);
    }
  }
}

/**
 * Rend les connexions éphémères (flash de lumière qui parcourt le maillage)
 */
export function renderEphemeralConnections(ctx: CanvasRenderingContext2D): void {
  const now = performance.now();
  cleanupExpiredConnections(now);
  
  if (ephemeralConnections.length === 0) return;
  
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Séparer par propriétaire
  const playerConnections = ephemeralConnections.filter(c => c.owner === 'player');
  const enemyConnections = ephemeralConnections.filter(c => c.owner === 'enemy');
  
  // Rendre les connexions joueur
  ctx.strokeStyle = getPlayerColorValue();
  renderConnectionsForOwner(ctx, playerConnections, now);
  
  // Rendre les connexions ennemi
  ctx.strokeStyle = COLORS.ENEMY;
  renderConnectionsForOwner(ctx, enemyConnections, now);
  
  ctx.restore();
}

/**
 * Rend les connexions pour un propriétaire donné
 */
function renderConnectionsForOwner(
  ctx: CanvasRenderingContext2D,
  connections: EphemeralConnection[],
  now: number
): void {
  for (const conn of connections) {
    const node1 = getNodeById(conn.nodeId1);
    const node2 = getNodeById(conn.nodeId2);
    
    if (!node1 || !node2) continue;
    
    // Calculer l'âge de la connexion (0 à 1)
    const age = now - conn.timestamp;
    const progress = Math.min(1, age / EPHEMERAL_DURATION);
    
    // Animation de fade-out avec ease-out (plus dramatique)
    // Ease-out cubic: 1 - (1 - t)^3
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const fadeOut = 1 - easedProgress; // 1.0 → 0.0 avec courbe ease-out
    
    // Animation de pulsation renforcée (flash de lumière plus visible)
    const pulse = Math.sin(now * GLOW_PULSE_SPEED * 15) * 0.3 + 0.7; // 0.4 à 1.0 (plus prononcé)
    const opacity = fadeOut * pulse * 0.95; // Max 95% d'opacité avec pulsation
    
    // Opacité avec atténuation par distance
    const nodeOpacity1 = calculateNodeOpacity(node1);
    const nodeOpacity2 = calculateNodeOpacity(node2);
    const avgOpacity = (nodeOpacity1 + nodeOpacity2) / 2;
    
    ctx.globalAlpha = opacity * pulse * avgOpacity;
    
    // lineWidth proportionnel à la power moyenne
    const avgPower = (node1.power + node2.power) / 2;
    const baseLineWidth = Math.max(2, avgPower / 10);
    const lineWidth = calculateLinkThickness(node1, node2, baseLineWidth);
    
    ctx.lineWidth = lineWidth;
    
    // Dessiner la ligne
    ctx.beginPath();
    ctx.moveTo(node1.x, node1.y);
    ctx.lineTo(node2.x, node2.y);
    ctx.stroke();
    
    // Dessiner le signal qui circule (physique chromatique)
    const signalPos = calculateSignalPosition(node1, node2, now);
    if (signalPos !== null) {
      const midX = node1.x + (node2.x - node1.x) * signalPos;
      const midY = node1.y + (node2.y - node1.y) * signalPos;
      drawSignalFlow(ctx, node1, node2, midX, midY, signalPos);
    }
  }
  
  ctx.globalAlpha = 1.0;
}

/**
 * Nettoie toutes les connexions éphémères (appelé lors du reset)
 */
export function clearEphemeralConnections(): void {
  ephemeralConnections.length = 0;
}
