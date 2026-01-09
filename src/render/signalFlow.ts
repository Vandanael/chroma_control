/**
 * Signal Flow - Physique Chromatique
 * Animation du signal qui circule le long des courbes de Bézier
 * Du centre (Drop-Pod) vers la périphérie
 */

import { type GameNode } from '../game/nodeManager';
import { getDistanceFromDropPod } from '../game/nodeManager';

// =============================================================================
// CONSTANTS
// =============================================================================

const SIGNAL_SPEED = 0.002; // Vitesse de propagation (pixels/ms)
const SIGNAL_PULSE_WIDTH = 20; // Largeur du pulse de signal (px)
const SIGNAL_BRIGHTNESS = 0.8; // Opacité du signal en transit

// =============================================================================
// SIGNAL PROPAGATION
// =============================================================================

/**
 * Calcule la position du signal le long d'une connexion
 * @param node1 - Nœud source (plus proche du Drop-Pod)
 * @param node2 - Nœud destination
 * @param now - Timestamp actuel
 * @returns Position du signal (0-1) ou null si pas de signal
 */
export function calculateSignalPosition(
  node1: GameNode,
  node2: GameNode,
  now: number
): number | null {
  // Déterminer quel nœud est plus proche du Drop-Pod
  const dist1 = getDistanceFromDropPod(node1);
  const dist2 = getDistanceFromDropPod(node2);
  
  if (!dist1 || !dist2 || dist1.distance === Infinity || dist2.distance === Infinity) {
    return null; // Pas de signal si isolé
  }

  // Le signal va du nœud le plus proche vers le plus loin
  const sourceNode = dist1.distance <= dist2.distance ? node1 : node2;
  const targetNode = dist1.distance <= dist2.distance ? node2 : node1;

  // Calculer la distance entre les nœuds
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Temps de transit basé sur la distance
  const transitTime = distance * SIGNAL_SPEED;

  // Utiliser un timestamp basé sur la position dans le réseau
  // (plus stable que le temps absolu)
  const networkTime = (now * 0.001) % (transitTime * 2); // Cycle de 2x le temps de transit
  
  // Position du signal (0 = source, 1 = destination)
  const position = (networkTime / transitTime) % 1;

  return position;
}

/**
 * Dessine le signal qui circule le long d'une ligne droite (remplace Bézier)
 */
export function drawSignalFlow(
  ctx: CanvasRenderingContext2D,
  node1: GameNode,
  node2: GameNode,
  signalX: number,
  signalY: number,
  signalPosition: number
): void {
  if (signalPosition === null) return;

  // Position déjà calculée sur la ligne droite (passée en paramètre)

  // Dessiner le pulse de signal (gradient radial)
  const gradient = ctx.createRadialGradient(
    signalX, signalY, 0,
    signalX, signalY, SIGNAL_PULSE_WIDTH
  );

  const color = node1.owner === 'player' 
    ? '#00F3FF' 
    : '#FF0055';

  gradient.addColorStop(0, color + 'FF'); // Centre brillant
  gradient.addColorStop(0.5, color + 'AA');
  gradient.addColorStop(1, color + '00'); // Bord transparent

  ctx.save();
  ctx.globalAlpha = SIGNAL_BRIGHTNESS;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(signalX, signalY, SIGNAL_PULSE_WIDTH, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
