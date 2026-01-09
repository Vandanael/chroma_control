/**
 * Planet Animation - Start Screen
 * Animation de la sphère qui tourne et change de couleur
 */

import { getPlayerColorValue } from '../game/playerColor';

// =============================================================================
// STATE
// =============================================================================

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let animationFrameId: number | null = null;
let rotationAngle = 0;
let currentColor = '#00F3FF'; // Cyan par défaut
let zoomScale = 1.0;
let isZooming = false;

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialise l'animation de la planète
 */
export function initPlanetAnimation(containerId: string): void {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn('[PlanetAnimation] Container not found:', containerId);
    return;
  }

  // Créer le canvas
  canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  
  ctx = canvas.getContext('2d');
  if (!ctx) {
    console.warn('[PlanetAnimation] Could not get 2D context');
    return;
  }

  container.appendChild(canvas);
  
  // Démarrer l'animation
  animate();
  
  console.log('[PlanetAnimation] Initialized');
}

/**
 * Met à jour la couleur de la planète (au survol des boutons)
 */
export function setPlanetHoverColor(color: string | null): void {
  if (color) {
    currentColor = color;
  } else {
    // Revenir à la couleur sélectionnée
    currentColor = getPlayerColorValue();
  }
}

/**
 * Déclenche l'animation de zoom (au clic sur START)
 */
export function triggerPlanetZoom(): void {
  isZooming = true;
  console.log('[PlanetAnimation] Zoom animation started');
}

// =============================================================================
// ANIMATION LOOP
// =============================================================================

function animate(): void {
  if (!ctx || !canvas) return;

  // Mettre à jour la rotation (plus calme)
  rotationAngle += 0.008; // Rotation très lente
  
  // Mettre à jour le zoom si actif (easing pour transition fluide)
  if (isZooming) {
    // Easing exponentiel pour sensation de plongée
    const zoomSpeed = 0.08 * (1 + zoomScale * 0.1); // Accélération progressive
    zoomScale += zoomSpeed;
    
    // Opacité fade-out pendant le zoom
    const fadeProgress = Math.min(1, (zoomScale - 1) / 1.5);
    const opacity = 1 - fadeProgress * 0.8; // Fade jusqu'à 20% d'opacité
    
    if (zoomScale > 4.0) {
      // Arrêter l'animation quand le zoom est complet
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      return;
    }
    
    // Appliquer l'opacité
    ctx.globalAlpha = opacity;
  }

  // Effacer le canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Centrer le contexte
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  
  // Easing du zoom pour sensation de plongée
  const easedZoom = isZooming 
    ? 1 + (zoomScale - 1) * 0.7 // Réduire l'effet pour plus de fluidité
    : zoomScale;
  
  ctx.scale(easedZoom, easedZoom);
  
  // Dessiner la sphère avec effet 3D
  drawSphere(ctx, currentColor);
  
  ctx.restore();
  
  // Réinitialiser l'opacité
  if (isZooming) {
    ctx.globalAlpha = 1.0;
  }
  
  // Continuer l'animation
  animationFrameId = requestAnimationFrame(animate);
}

/**
 * Dessine une sphère avec effet 3D
 */
function drawSphere(ctx: CanvasRenderingContext2D, color: string): void {
  const radius = 40;
  
  // Gradient radial pour effet 3D
  const gradient = ctx.createRadialGradient(
    -radius * 0.3, -radius * 0.3, 0, // Point de lumière (haut gauche)
    0, 0, radius // Centre vers bord
  );
  
  gradient.addColorStop(0, color + 'FF'); // Centre lumineux
  gradient.addColorStop(0.5, color + 'CC');
  gradient.addColorStop(1, color + '66'); // Bord plus sombre
  
  // Cercle principal
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Reflet (point lumineux)
  ctx.beginPath();
  ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 0.6;
  ctx.fill();
  ctx.globalAlpha = 1.0;
  
  // Anneau orbital (optionnel, pour effet spatial)
  ctx.strokeStyle = color + '40';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.5, radius * 0.4, rotationAngle, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Nettoie l'animation
 */
export function cleanupPlanetAnimation(): void {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (canvas && canvas.parentNode) {
    canvas.parentNode.removeChild(canvas);
  }
  canvas = null;
  ctx = null;
}
