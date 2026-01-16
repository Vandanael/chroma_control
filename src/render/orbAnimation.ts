/**
 * Orb Animation - Start Screen (Minimalist Retro-Futur)
 * Orbe vivante avec 3 couches d'animation : respiration, onde, particules
 */

// Couleurs disponibles
const COLORS = {
  CYAN: '#00F3FF',
  GREEN: '#00FF88',
  AMBER: '#FFAA00',
} as const;

type ColorType = keyof typeof COLORS;

/**
 * Récupère la couleur sélectionnée depuis le DOM
 */
function getSelectedColor(): string {
  const selectedButton = document.querySelector('.color-button.selected');
  if (selectedButton) {
    const colorType = (selectedButton as HTMLElement).dataset.color as ColorType;
    return COLORS[colorType] || COLORS.CYAN;
  }
  return COLORS.CYAN; // Par défaut
}

// =============================================================================
// STATE
// =============================================================================

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let animationFrameId: number | null = null;
let currentColor = '#00F3FF'; // Cyan par défaut
let zoomScale = 1.0;
let isZooming = false;
let lastFrameTime = 0; // Pour calculer le deltaTime

// Animation state
let breathingPhase = 0; // Phase de respiration (0-2π)
let wavePhase = 0; // Phase de l'onde (0-1)
let waveActive = false; // Si une onde est active
let lastWaveTime = 0; // Timestamp de la dernière onde
const WAVE_INTERVAL = 5000; // 5 secondes entre les ondes
const WAVE_DURATION = 1500; // 1.5 secondes de durée

// Particules en orbite
interface OrbitingParticle {
  angle: number;
  speed: number;
  radiusX: number;
  radiusY: number;
  phase: number;
}

const particles: OrbitingParticle[] = [
  { angle: 0, speed: 0.08, radiusX: 1.0, radiusY: 0.85, phase: 0 },
  { angle: Math.PI / 3, speed: 0.12, radiusX: 1.1, radiusY: 0.9, phase: Math.PI / 2 },
  { angle: (2 * Math.PI) / 3, speed: 0.1, radiusX: 0.95, radiusY: 0.88, phase: Math.PI },
];

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialise l'animation de l'orbe
 */
export function initOrbAnimation(containerId: string): void {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn('[OrbAnimation] Container not found:', containerId);
    return;
  }

  // Vérifier si un canvas existe déjà dans ce container
  if (canvas && canvas.parentNode === container) {
    // Réafficher le canvas s'il était caché
    canvas.style.display = 'block';
    console.log('[OrbAnimation] Animation already initialized, re-showing');
    return;
  }

  // Si le canvas existe ailleurs, le déplacer
  if (canvas && canvas.parentNode && canvas.parentNode !== container) {
    canvas.parentNode.removeChild(canvas);
  }

  // Créer le canvas
  canvas = document.createElement('canvas');
  canvas.width = 320; // CORRECTION : Taille doublée (160 → 320) pour orbe plus grande
  canvas.height = 320;
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  canvas.style.pointerEvents = 'none'; // Ne pas bloquer les clics
  canvas.style.position = 'relative'; // Position relative dans le container
  canvas.style.zIndex = '1'; // Au-dessus du fond mais sous les boutons
  
  ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    console.warn('[OrbAnimation] Could not get 2D context');
    return;
  }

  container.appendChild(canvas);
  
  // Initialiser la couleur
  currentColor = getSelectedColor();
  
  // Initialiser le temps pour la première onde
  lastWaveTime = performance.now();
  lastFrameTime = performance.now();
  
  // Réinitialiser le zoom si nécessaire
  isZooming = false;
  zoomScale = 1.0;
  
  // Démarrer l'animation si elle n'est pas déjà en cours
  if (!animationFrameId) {
  animate(performance.now());
  }
  
  console.log('[OrbAnimation] Initialized');
}

/**
 * Met à jour la couleur de l'orbe (au survol des boutons)
 */
export function setOrbHoverColor(color: string | null): void {
  if (color) {
    currentColor = color;
  } else {
    // Revenir à la couleur sélectionnée
    currentColor = getSelectedColor();
  }
}

/**
 * Déclenche l'animation de zoom (au clic sur START)
 */
export function triggerOrbZoom(): void {
  isZooming = true;
  console.log('[OrbAnimation] Zoom animation started');
}

// =============================================================================
// ANIMATION LOOP
// =============================================================================

function animate(timestamp: number): void {
  // Vérifier que le canvas est toujours dans le DOM
  if (!canvas || !ctx) {
    // Si le canvas a été retiré, réessayer de l'initialiser
    const container = document.getElementById('planet-animation-container');
    if (container && !canvas) {
      console.log('[OrbAnimation] Canvas missing, reinitializing...');
      initOrbAnimation('planet-animation-container');
    }
    // Continuer l'animation même si le canvas n'est pas prêt
    animationFrameId = requestAnimationFrame(animate);
    return;
  }
  
  // Vérifier que le canvas est toujours dans le DOM
  if (!canvas.parentNode) {
    // Canvas retiré du DOM, réessayer de l'ajouter
    const container = document.getElementById('planet-animation-container');
    if (container) {
      container.appendChild(canvas);
    }
  }

  const now = timestamp || performance.now();
  const deltaTime = lastFrameTime > 0 ? now - lastFrameTime : 16; // Delta en millisecondes
  lastFrameTime = now;
  
  // Mettre à jour les phases d'animation
  breathingPhase += (deltaTime / 4000) * Math.PI * 2; // Cycle de 4 secondes
  if (breathingPhase > Math.PI * 2) breathingPhase -= Math.PI * 2;
  
  // Gérer les ondes périodiques
  if (!waveActive && now - lastWaveTime >= WAVE_INTERVAL) {
    waveActive = true;
    wavePhase = 0;
    lastWaveTime = now;
  }
  
  if (waveActive) {
    wavePhase += deltaTime / WAVE_DURATION;
    if (wavePhase >= 1) {
      waveActive = false;
      wavePhase = 0;
    }
  }
  
  // Mettre à jour les particules
  particles.forEach(particle => {
    particle.angle += particle.speed * (deltaTime / 1000);
    if (particle.angle > Math.PI * 2) particle.angle -= Math.PI * 2;
  });
  
  // Mettre à jour le zoom si actif (mais ne jamais arrêter l'animation)
  if (isZooming) {
    const zoomSpeed = 0.08 * (1 + zoomScale * 0.1);
    zoomScale += zoomSpeed;
    
    const fadeProgress = Math.min(1, (zoomScale - 1) / 1.5);
    const opacity = 1 - fadeProgress * 0.8;
    
    // Ne pas arrêter l'animation même si le zoom dépasse 4.0
    // Juste réinitialiser le zoom
    if (zoomScale > 4.0) {
      isZooming = false;
      zoomScale = 1.0;
    } else {
    ctx.globalAlpha = opacity;
    }
  }

  // Effacer le canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Centrer le contexte
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  
  // Appliquer le zoom si actif
  if (isZooming) {
    const easedZoom = 1 + (zoomScale - 1) * 0.7;
    ctx.scale(easedZoom, easedZoom);
  }
  
  const baseRadius = 70; // CORRECTION : Rayon doublé (35 → 70) pour orbe ~140px de diamètre (au moins 2x plus grande)
  
  // COUCHE 1 : Respiration organique (contour déformé)
  drawBreathingOrb(ctx, currentColor, baseRadius, breathingPhase);
  
  // COUCHE 2 : Onde circulaire (si active)
  if (waveActive) {
    drawWave(ctx, currentColor, baseRadius, wavePhase);
  }
  
  // COUCHE 3 : Particules en orbite
  drawOrbitingParticles(ctx, currentColor, baseRadius);
  
  ctx.restore();
  
  // Réinitialiser l'opacité
  if (isZooming) {
    ctx.globalAlpha = 1.0;
  }
  
  // Continuer l'animation (TOUJOURS)
  animationFrameId = requestAnimationFrame(animate);
}

/**
 * Dessine l'orbe avec respiration organique (cercle plein déformé avec lueur)
 */
function drawBreathingOrb(
  ctx: CanvasRenderingContext2D,
  color: string,
  baseRadius: number,
  phase: number
): void {
  // Amplitude de déformation : 2-4% du rayon
  const deformationAmplitude = baseRadius * 0.03;
  
  // Créer un contour déformé avec du noise/harmoniques
  ctx.beginPath();
  const points = 64; // Nombre de points pour le contour
  
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    
    // Déformation avec plusieurs harmoniques sinusoïdales
    const deformation1 = Math.sin(angle * 2 + phase) * deformationAmplitude;
    const deformation2 = Math.sin(angle * 3 + phase * 1.3) * deformationAmplitude * 0.5;
    const deformation3 = Math.sin(angle * 5 + phase * 0.7) * deformationAmplitude * 0.3;
    
    const radius = baseRadius + deformation1 + deformation2 + deformation3;
    
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.closePath();
  
  // LUEUR SUBTILE (seul élément autorisé) - rayon ~20-30% du diamètre, opacité 20-30%
  const glowRadius = baseRadius * 1.25; // 25% du diamètre
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
  
  // Convertir couleur hex en rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  // Gradient : centre opaque, bord transparent
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.25)`); // 25% opacité au centre
  gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.15)`); // 15% à 60%
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`); // Transparent au bord
  
  // Dessiner la lueur
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // CERCLE PLEIN (rempli, pas juste contour)
  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const deformation1 = Math.sin(angle * 2 + phase) * deformationAmplitude;
    const deformation2 = Math.sin(angle * 3 + phase * 1.3) * deformationAmplitude * 0.5;
    const deformation3 = Math.sin(angle * 5 + phase * 0.7) * deformationAmplitude * 0.3;
    const radius = baseRadius + deformation1 + deformation2 + deformation3;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  
  // Remplir le cercle avec la couleur
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Dessine une onde circulaire qui s'étend (contour fin, pas de fill)
 */
function drawWave(
  ctx: CanvasRenderingContext2D,
  color: string,
  baseRadius: number,
  progress: number
): void {
  // L'onde s'étend jusqu'à ~200% du diamètre
  const maxRadius = baseRadius * 2;
  const currentRadius = baseRadius + (maxRadius - baseRadius) * progress;
  
  // Opacité : départ 30%, fin 0%
  const opacity = 0.3 * (1 - progress);
  
  // Convertir couleur hex en rgba pour l'opacité
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  ctx.beginPath();
  ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
  ctx.lineWidth = 1.5; // Contour fin 1-2px
  ctx.stroke();
}

/**
 * Dessine les particules en orbite (2-3 micro-points, orbite elliptique)
 */
function drawOrbitingParticles(
  ctx: CanvasRenderingContext2D,
  color: string,
  baseRadius: number
): void {
  // Convertir couleur hex en rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  particles.forEach(particle => {
    // Orbite elliptique - distance 150-200% du rayon
    const orbitRadius = baseRadius * 1.75; // ~175% du rayon
    const x = Math.cos(particle.angle + particle.phase) * orbitRadius * particle.radiusX;
    const y = Math.sin(particle.angle + particle.phase) * orbitRadius * particle.radiusY;
    
    // Particule : micro-point (3-4px de diamètre)
    ctx.beginPath();
    ctx.arc(x, y, 1.75, 0, Math.PI * 2); // Rayon 1.75px = diamètre ~3.5px
    // Opacité 60-80% (on utilise 70% pour un bon compromis)
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.7)`;
    ctx.fill();
  });
}

/**
 * Nettoie l'animation (mais ne l'arrête pas complètement)
 * L'animation continue de tourner en arrière-plan
 */
export function cleanupOrbAnimation(): void {
  // Ne pas annuler l'animation, juste cacher le canvas
  // L'animation continue de tourner pour qu'elle soit prête quand on revient
  if (canvas && canvas.parentNode) {
    canvas.style.display = 'none';
  }
  // Ne pas mettre canvas/ctx à null pour garder l'animation active
}
