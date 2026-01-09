/**
 * Organic Animations - Esthétique Organique In-Game
 * Unification avec l'Écran Titre : Tout respire, pulse, ondule
 */

// =============================================================================
// CONSTANTS - Paramètres globaux d'animation
// =============================================================================

// Nœuds
const NODE_BREATH_AMPLITUDE_CALM = 0.03;      // 3% du rayon (état calme)
const NODE_BREATH_AMPLITUDE_BOOSTED = 0.09;  // 9% du rayon (état boosté)
const NODE_BREATH_AMPLITUDE_STRESSED = 0.06;  // 6% du rayon (sous pression)
const NODE_BREATH_CYCLE_CALM = 3500;         // 3.5 secondes (état calme)
const NODE_BREATH_CYCLE_BOOSTED = 1750;      // 1.75 secondes (état boosté)
const NODE_BREATH_CYCLE_STRESSED = 1500;     // 1.5 secondes (sous pression)

// Territoires/Auras
const TERRITORY_WAVE_AMPLITUDE = 0.03;        // 3% du rayon
const TERRITORY_WAVE_SPEED = 0.0012;         // Vitesse de l'onde (5-6s pour parcourir)
const TERRITORY_BREATH_AMPLITUDE = 0.015;    // 1.5% de la surface
const TERRITORY_BREATH_CYCLE = 4500;         // 4.5 secondes

// Frontières
const BORDER_WAVE_AMPLITUDE = 0.07;          // 7% (plus que territoire calme)
const BORDER_WAVE_FREQUENCY = 0.002;         // Fréquence plus rapide

// Ondes radar
const RADAR_WAVE_SPEED = 800;                // 800px/s
const RADAR_WAVE_DURATION = 1500;            // 1.5 secondes
const RADAR_WAVE_MAX_RADIUS = 3.0;           // 300% du diamètre

// Particules en orbite
const ORBIT_RADIUS_MULTIPLIER = 1.5;         // 150% du rayon du nœud
const ORBIT_ROTATION_TIME = 8000;            // 8 secondes pour un tour complet
const ORBIT_PARTICLE_OPACITY = 0.6;          // 60% opacité

// =============================================================================
// STATE - Suivi des animations actives
// =============================================================================

interface RadarWave {
  nodeId: string;
  startTime: number;
  startX: number;
  startY: number;
}

interface OrbitingParticle {
  nodeId: string;
  angle: number;
  radius: number;
  phase: number; // Décalage de phase pour désynchroniser
}

const activeRadarWaves: RadarWave[] = [];
const orbitingParticles: Map<string, OrbitingParticle[]> = new Map();

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Génère un décalage de phase unique pour chaque nœud (basé sur l'ID)
 */
function getNodePhase(nodeId: string): number {
  // Hash simple de l'ID pour obtenir un décalage de phase
  let hash = 0;
  for (let i = 0; i < nodeId.length; i++) {
    hash = ((hash << 5) - hash) + nodeId.charCodeAt(i);
    hash = hash & hash; // Convertir en 32bit
  }
  return (hash % 1000) / 1000 * Math.PI * 2; // 0 à 2π
}

/**
 * Calcule la déformation organique du contour d'un nœud
 * Utilise une combinaison de sin/cos pour créer une forme organique
 */
export function getNodeOrganicRadius(
  baseRadius: number,
  angle: number,
  time: number,
  nodeId: string,
  state: 'calm' | 'boosted' | 'stressed' = 'calm'
): number {
  const phase = getNodePhase(nodeId);
  const timeOffset = time * 0.001; // Convertir ms en secondes
  
  // Déterminer les paramètres selon l'état
  let amplitude: number;
  let cycleSpeed: number;
  
  switch (state) {
    case 'boosted':
      amplitude = NODE_BREATH_AMPLITUDE_BOOSTED;
      cycleSpeed = (2 * Math.PI) / (NODE_BREATH_CYCLE_BOOSTED / 1000);
      break;
    case 'stressed':
      amplitude = NODE_BREATH_AMPLITUDE_STRESSED;
      cycleSpeed = (2 * Math.PI) / (NODE_BREATH_CYCLE_STRESSED / 1000);
      break;
    default: // calm
      amplitude = NODE_BREATH_AMPLITUDE_CALM;
      cycleSpeed = (2 * Math.PI) / (NODE_BREATH_CYCLE_CALM / 1000);
      break;
  }
  
  // Respiration globale (expansion/contraction)
  const breath = Math.sin(timeOffset * cycleSpeed + phase) * amplitude;
  
  // Déformation organique du contour (noise/sin sur le rayon)
  // Utilise plusieurs fréquences pour un effet plus organique
  const noise1 = Math.sin(angle * 3 + timeOffset * 0.5 + phase) * 0.02;
  const noise2 = Math.sin(angle * 5 + timeOffset * 0.3 + phase * 1.3) * 0.015;
  const noise3 = Math.sin(angle * 7 + timeOffset * 0.2 + phase * 2.1) * 0.01;
  
  const organicDeformation = noise1 + noise2 + noise3;
  
  return baseRadius * (1 + breath + organicDeformation);
}

/**
 * Calcule l'ondulation du contour d'un territoire/aura
 */
export function getTerritoryWaveRadius(
  baseRadius: number,
  angle: number,
  time: number,
  nodeId: string
): number {
  const phase = getNodePhase(nodeId);
  const timeOffset = time * 0.001;
  
  // Onde qui parcourt le contour
  const waveAngle = angle + timeOffset * TERRITORY_WAVE_SPEED * 1000;
  const wave = Math.sin(waveAngle * 2 + phase) * TERRITORY_WAVE_AMPLITUDE;
  
  // Respiration globale (expansion/contraction)
  const breathCycle = (2 * Math.PI) / (TERRITORY_BREATH_CYCLE / 1000);
  const breath = Math.sin(timeOffset * breathCycle + phase) * TERRITORY_BREATH_AMPLITUDE;
  
  return baseRadius * (1 + wave + breath);
}

/**
 * Calcule l'ondulation d'une frontière contestée
 */
export function getBorderWaveOffset(
  distance: number, // Distance le long de la frontière (0 à 1)
  time: number,
  pressure: number // 0 à 1, pression de la frontière
): number {
  const timeOffset = time * 0.001;
  
  // Amplitude proportionnelle à la pression
  const amplitude = BORDER_WAVE_AMPLITUDE * (0.5 + pressure * 0.5);
  
  // Fréquence plus rapide sous pression
  const frequency = BORDER_WAVE_FREQUENCY * (1 + pressure);
  
  // Onde qui parcourt la frontière
  const wave = Math.sin(distance * Math.PI * 4 + timeOffset * frequency * 1000) * amplitude;
  
  return wave;
}

/**
 * Déclenche une onde radar depuis un nœud
 */
export function triggerRadarWave(nodeId: string, x: number, y: number): void {
  activeRadarWaves.push({
    nodeId,
    startTime: performance.now(),
    startX: x,
    startY: y,
  });
  
  // Nettoyer les ondes expirées après un délai
  setTimeout(() => {
    const now = performance.now();
    for (let i = activeRadarWaves.length - 1; i >= 0; i--) {
      if (now - activeRadarWaves[i].startTime > RADAR_WAVE_DURATION) {
        activeRadarWaves.splice(i, 1);
      }
    }
  }, RADAR_WAVE_DURATION + 100);
}

/**
 * Rend toutes les ondes radar actives
 */
export function renderRadarWaves(
  ctx: CanvasRenderingContext2D,
  nodeRadius: number,
  getNodePosition: (nodeId: string) => { x: number; y: number } | null
): void {
  const now = performance.now();
  
  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;
  ctx.setLineDash([4, 4]);
  
  for (let i = activeRadarWaves.length - 1; i >= 0; i--) {
    const wave = activeRadarWaves[i];
    const age = now - wave.startTime;
    
    if (age > RADAR_WAVE_DURATION) {
      activeRadarWaves.splice(i, 1);
      continue;
    }
    
    const progress = age / RADAR_WAVE_DURATION;
    const radius = nodeRadius * 2 * (1 + progress * (RADAR_WAVE_MAX_RADIUS - 1));
    
    // Opacité fade out
    const opacity = (1 - progress) * 0.6;
    ctx.globalAlpha = opacity;
    
    // Déformation organique du contour de l'onde
    const nodePos = getNodePosition(wave.nodeId);
    if (!nodePos) continue;
    
    ctx.beginPath();
    const segments = 32;
    for (let j = 0; j <= segments; j++) {
      const angle = (j / segments) * Math.PI * 2;
      const organicRadius = radius * (1 + Math.sin(angle * 3 + progress * Math.PI * 2) * 0.05);
      const x = nodePos.x + Math.cos(angle) * organicRadius;
      const y = nodePos.y + Math.sin(angle) * organicRadius;
      
      if (j === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
  }
  
  ctx.restore();
}

/**
 * Initialise les particules en orbite pour un nœud hub
 */
export function initOrbitingParticles(nodeId: string, count: number = 1): void {
  const particles: OrbitingParticle[] = [];
  
  for (let i = 0; i < count; i++) {
    particles.push({
      nodeId,
      angle: (i / count) * Math.PI * 2, // Répartir uniformément
      radius: 0, // Sera calculé dynamiquement
      phase: Math.random() * Math.PI * 2, // Décalage aléatoire
    });
  }
  
  orbitingParticles.set(nodeId, particles);
}

/**
 * Vérifie si un nœud a des particules en orbite
 */
export function hasOrbitingParticles(nodeId: string): boolean {
  return orbitingParticles.has(nodeId);
}

/**
 * Supprime les particules en orbite d'un nœud
 */
export function removeOrbitingParticles(nodeId: string): void {
  orbitingParticles.delete(nodeId);
}

/**
 * Rend les particules en orbite autour des nœuds
 */
export function renderOrbitingParticles(
  ctx: CanvasRenderingContext2D,
  nodeRadius: number,
  getNodePosition: (nodeId: string) => { x: number; y: number } | null,
  color: string
): void {
  const now = performance.now();
  const timeOffset = now * 0.001;
  
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = ORBIT_PARTICLE_OPACITY;
  
  for (const [nodeId, particles] of orbitingParticles.entries()) {
    const nodePos = getNodePosition(nodeId);
    if (!nodePos) continue;
    
    const orbitRadius = nodeRadius * ORBIT_RADIUS_MULTIPLIER;
    
    for (const particle of particles) {
      // Rotation autour du nœud
      const rotationSpeed = (2 * Math.PI) / (ORBIT_ROTATION_TIME / 1000);
      const angle = particle.angle + timeOffset * rotationSpeed + particle.phase;
      
      // Position orbitale
      const x = nodePos.x + Math.cos(angle) * orbitRadius;
      const y = nodePos.y + Math.sin(angle) * orbitRadius;
      
      // Taille de la particule (4-6px)
      const size = 5;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  ctx.restore();
}

/**
 * Nettoie toutes les animations organiques
 */
export function clearOrganicAnimations(): void {
  activeRadarWaves.length = 0;
  orbitingParticles.clear();
}
