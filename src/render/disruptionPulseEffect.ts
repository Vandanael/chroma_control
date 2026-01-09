/**
 * Disruption Pulse Visual Effect - BLOC 3.6
 * Effet visuel du pulse de disruption
 */

// =============================================================================
// STATE
// =============================================================================

interface PulseEffect {
  x: number;
  y: number;
  radius: number;
  startTime: number;
  duration: number;
}

const activePulses: PulseEffect[] = [];

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Affiche un effet de pulse de disruption
 */
export function showDisruptionPulse(x: number, y: number, maxRadius: number): void {
  activePulses.push({
    x,
    y,
    radius: 0,
    startTime: performance.now(),
    duration: 800, // 0.8 secondes
  });
}

/**
 * Rend tous les effets de pulse actifs
 */
export function renderDisruptionPulses(ctx: CanvasRenderingContext2D): void {
  const now = performance.now();
  
  for (let i = activePulses.length - 1; i >= 0; i--) {
    const pulse = activePulses[i];
    const elapsed = now - pulse.startTime;
    const progress = Math.min(1, elapsed / pulse.duration);
    
    if (progress >= 1) {
      activePulses.splice(i, 1);
      continue;
    }
    
    // Rayon qui grandit
    pulse.radius = 200 * progress;
    
    // Opacité qui diminue
    const opacity = 1 - progress;
    
    // Cercle de pulse
    ctx.save();
    ctx.strokeStyle = '#FF0055';
    ctx.lineWidth = 3;
    ctx.globalAlpha = opacity * 0.8;
    ctx.beginPath();
    ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Cercle intérieur (plus lumineux)
    ctx.strokeStyle = '#FF4488';
    ctx.lineWidth = 2;
    ctx.globalAlpha = opacity * 0.5;
    ctx.beginPath();
    ctx.arc(pulse.x, pulse.y, pulse.radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  }
}
