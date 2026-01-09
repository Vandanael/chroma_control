/**
 * Render Engine - Game Loop & Debug Overlay
 * Handles the main render loop, FPS tracking, and debug display
 */

import { CanvasContext, DebugState, TouchState, UnitType, COLORS, Nexus, NexusLink, Triangle } from '../types';
import { clearCanvas, drawGrid } from './canvas';
import { drawUnitIndicator, drawProgressArc, drawCoordinates, drawCoordinatesWithLabel, getUnitColor, easeOutCubic, drawTriangleHatching } from './effects';
import { updateTouchState, getInputLatency, getUnitProgress } from '../input/touch';
import { addNexusPoints, getEnergy, getGameState, getScore, regenEnergy, spendEnergy } from '../game/state';

// =============================================================================
// STATE
// =============================================================================

const debugState: DebugState = {
  fps: 0,
  frameCount: 0,
  lastFpsUpdate: 0,
  pressTime: 0,
  detectedUnit: 'none',
  inputLatency: 0,
  state: 'IDLE',
};

// Animation state for released indicators
interface ReleasedAnimation {
  x: number;
  y: number;
  unitType: UnitType;
  startTime: number;
  duration: number;
}

let releasedAnimations: ReleasedAnimation[] = [];
const RELEASE_ANIMATION_DURATION = 800;  // ms

// =============================================================================
// SPRINT 1-3 - NEXUS + IA simple
// =============================================================================

const NEXUS_CAPTURE_TIME_MS = 3000;
const NEXUS_RADIUS = 26;

// Pour Sprint 2 : 5 nexus en croix autour du centre.
let nexusList: Nexus[] = [];
let lastRenderTimestamp: number | null = null;

// IA rouge très simple (Sprint 3)
interface EnemyAgent {
  targetId: string | null;
  timeOnTarget: number;
  captureDuration: number; // en secondes
  cooldown: number;        // temps entre deux décisions
  cooldownTimer: number;
}

const enemyAgent: EnemyAgent = {
  targetId: null,
  timeOnTarget: 0,
  captureDuration: NEXUS_CAPTURE_TIME_MS / 1000,
  cooldown: 2,
  cooldownTimer: 1,
};

// Liens (Sprint 4)
const LINK_ANIMATION_DURATION_MS = 400;
const LINK_ENERGY_COST = 10;
const LINK_SCORE_PER_SECOND = 2;
const MAX_LINKS_PER_NEXUS = 3;

let links: NexusLink[] = [];
let selectedNexusId: string | null = null;

// Triangles (Sprint 5)
const TRIANGLE_ANIMATION_DURATION_MS = 600;
const TRIANGLE_SCORE_MULTIPLIER = 5; // ×5 le score des nexus inclus

let triangles: Triangle[] = [];

// =============================================================================
// DEBUG OVERLAY UPDATE
// =============================================================================

function updateDebugOverlay(touchState: TouchState): void {
  // FPS
  const fpsEl = document.getElementById('debug-fps');
  if (fpsEl) {
    fpsEl.textContent = debugState.fps.toFixed(1);
    fpsEl.style.color = debugState.fps >= 55 ? COLORS.defender : COLORS.attacker;
  }

  // Press Time
  const pressTimeEl = document.getElementById('debug-press-time');
  if (pressTimeEl) {
    pressTimeEl.textContent = `${Math.floor(touchState.duration)} ms`;
  }

  // Detected Unit
  const unitEl = document.getElementById('debug-unit');
  if (unitEl) {
    const unitName = touchState.detectedUnit.toUpperCase();
    unitEl.textContent = unitName === 'NONE' ? '--' : unitName;
    unitEl.className = `value unit-${touchState.detectedUnit}`;
  }

  // Input Latency
  const latencyEl = document.getElementById('debug-latency');
  if (latencyEl) {
    latencyEl.textContent = `${debugState.inputLatency.toFixed(1)} ms`;
    latencyEl.style.color = debugState.inputLatency < 16 ? COLORS.defender : COLORS.attacker;
  }

  // State
  const stateEl = document.getElementById('debug-state');
  if (stateEl) {
    stateEl.textContent = debugState.state;
    stateEl.style.color = debugState.state === 'PRESSING' ? COLORS.attacker : COLORS.annotation;
  }
}

// =============================================================================
// FPS TRACKING
// =============================================================================

function updateFPS(timestamp: number): void {
  debugState.frameCount++;

  if (timestamp - debugState.lastFpsUpdate >= 1000) {
    debugState.fps = debugState.frameCount * 1000 / (timestamp - debugState.lastFpsUpdate);
    debugState.frameCount = 0;
    debugState.lastFpsUpdate = timestamp;
  }
}

// =============================================================================
// RENDER FUNCTIONS
// =============================================================================

function renderActiveTouch(
  ctx: CanvasRenderingContext2D,
  touchState: TouchState
): void {
  if (!touchState.active) return;

  const { x, y, duration, detectedUnit } = touchState;
  const progress = getUnitProgress(duration);

  // Draw progress arc around touch point
  const arcColor = getUnitColor(detectedUnit);
  drawProgressArc(ctx, x, y, Math.min(1, duration / 2000), 35, arcColor);

  // Draw unit indicator with animation progress
  drawUnitIndicator(ctx, x, y, detectedUnit, easeOutCubic(progress), true);

  // Draw coordinates
  const gridX = Math.floor(x / 40);
  const gridY = Math.floor(y / 40);
  drawCoordinates(ctx, x, y, gridX, gridY);
}

function renderReleasedAnimations(
  ctx: CanvasRenderingContext2D,
  timestamp: number
): void {
  // Filter out completed animations
  releasedAnimations = releasedAnimations.filter(anim => {
    const elapsed = timestamp - anim.startTime;
    return elapsed < anim.duration;
  });

  // Render remaining animations
  for (const anim of releasedAnimations) {
    const elapsed = timestamp - anim.startTime;
    const progress = elapsed / anim.duration;

    // Fade out
    ctx.save();
    ctx.globalAlpha = 1 - easeOutCubic(progress);

    // Scale up slightly as it fades
    const scale = 1 + progress * 0.3;
    ctx.translate(anim.x, anim.y);
    ctx.scale(scale, scale);
    ctx.translate(-anim.x, -anim.y);

    drawUnitIndicator(ctx, anim.x, anim.y, anim.unitType, 1, false);

    ctx.restore();
  }
}

function renderLinks(
  ctx: CanvasRenderingContext2D,
  timestamp: number,
): void {
  ctx.save();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;

  for (const link of links) {
    const from = nexusList.find((n) => n.id === link.fromId);
    const to = nexusList.find((n) => n.id === link.toId);
    if (!from || !to) continue;

    const elapsed = timestamp - link.createdAt;
    const t = Math.min(1, elapsed / link.animationDuration);

    const x1 = from.x;
    const y1 = from.y;
    const x2 = to.x;
    const y2 = to.y;

    const xm = x1 + (x2 - x1) * t;
    const ym = y1 + (y2 - y1) * t;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(xm, ym);
    ctx.stroke();
  }

  ctx.restore();
}

// =============================================================================
// TRIANGLES (Sprint 5)
// =============================================================================

/**
 * Détecte les triangles formés par 3 nexus liés.
 * Un triangle est formé si 3 nexus du même propriétaire sont tous liés entre eux.
 */
function detectTriangles(): void {
  const newTriangles: Triangle[] = [];

  // Pour chaque combinaison de 3 nexus
  for (let i = 0; i < nexusList.length; i++) {
    for (let j = i + 1; j < nexusList.length; j++) {
      for (let k = j + 1; k < nexusList.length; k++) {
        const a = nexusList[i];
        const b = nexusList[j];
        const c = nexusList[k];

        // Tous les 3 doivent être possédés par le même propriétaire (joueur ou ennemi)
        if (a.owner === 'neutral' || b.owner === 'neutral' || c.owner === 'neutral') continue;
        if (a.owner !== b.owner || b.owner !== c.owner) continue;

        // Vérifier que les 3 liens existent
        const hasAB = links.some(
          (l) =>
            (l.fromId === a.id && l.toId === b.id) ||
            (l.fromId === b.id && l.toId === a.id),
        );
        const hasBC = links.some(
          (l) =>
            (l.fromId === b.id && l.toId === c.id) ||
            (l.fromId === c.id && l.toId === b.id),
        );
        const hasCA = links.some(
          (l) =>
            (l.fromId === c.id && l.toId === a.id) ||
            (l.fromId === a.id && l.toId === c.id),
        );

        if (!hasAB || !hasBC || !hasCA) continue;

        // Vérifier si ce triangle existe déjà
        const triangleId = [a.id, b.id, c.id].sort().join('-');
        const exists = triangles.some((t) => t.id === triangleId);
        if (exists) continue;

        // Nouveau triangle détecté !
        newTriangles.push({
          id: triangleId,
          nexusIds: [a.id, b.id, c.id],
          owner: a.owner,
          createdAt: performance.now(),
          animationDuration: TRIANGLE_ANIMATION_DURATION_MS,
        });
      }
    }
  }

  // Ajouter les nouveaux triangles
  triangles.push(...newTriangles);
}

/**
 * Rendu des triangles avec hachures.
 */
function renderTriangles(
  ctx: CanvasRenderingContext2D,
  timestamp: number,
): void {
  for (const triangle of triangles) {
    const a = nexusList.find((n) => n.id === triangle.nexusIds[0]);
    const b = nexusList.find((n) => n.id === triangle.nexusIds[1]);
    const c = nexusList.find((n) => n.id === triangle.nexusIds[2]);

    if (!a || !b || !c) continue;

    // Progression de l’animation (hachures qui apparaissent progressivement)
    const elapsed = timestamp - triangle.createdAt;
    const progress = Math.min(1, elapsed / triangle.animationDuration);

    // Dessiner les hachures
    if (triangle.owner === 'player' || triangle.owner === 'enemy') {
      drawTriangleHatching(
        ctx,
        a.x,
        a.y,
        b.x,
        b.y,
        c.x,
        c.y,
        triangle.owner,
        progress,
        8, // spacing 8px
      );
    }
  }
}

// =============================================================================
// MAIN RENDER LOOP
// =============================================================================

let animationFrameId: number | null = null;
let canvasContext: CanvasContext | null = null;
let lastGameState: string = 'START';

function ensureNexusLayout(width: number, height: number): void {
  if (nexusList.length === 0) {
    const cx = width / 2;
    const cy = height / 2;
    const offset = 120;

    nexusList = [
      { id: 'center', x: cx, y: cy, radius: NEXUS_RADIUS, owner: 'neutral', state: 'idle', capturingBy: 'neutral', captureProgress: 0 },
      { id: 'top', x: cx, y: cy - offset, radius: NEXUS_RADIUS, owner: 'neutral', state: 'idle', capturingBy: 'neutral', captureProgress: 0 },
      { id: 'bottom', x: cx, y: cy + offset, radius: NEXUS_RADIUS, owner: 'neutral', state: 'idle', capturingBy: 'neutral', captureProgress: 0 },
      { id: 'left', x: cx - offset, y: cy, radius: NEXUS_RADIUS, owner: 'neutral', state: 'idle', capturingBy: 'neutral', captureProgress: 0 },
      { id: 'right', x: cx + offset, y: cy, radius: NEXUS_RADIUS, owner: 'neutral', state: 'idle', capturingBy: 'neutral', captureProgress: 0 },
    ];
  } else {
    // Recentrer la croix si la taille d'écran change
    const cx = width / 2;
    const cy = height / 2;
    const offset = 120;
    for (const nexus of nexusList) {
      if (nexus.id === 'center') {
        nexus.x = cx;
        nexus.y = cy;
      } else if (nexus.id === 'top') {
        nexus.x = cx;
        nexus.y = cy - offset;
      } else if (nexus.id === 'bottom') {
        nexus.x = cx;
        nexus.y = cy + offset;
      } else if (nexus.id === 'left') {
        nexus.x = cx - offset;
        nexus.y = cy;
      } else if (nexus.id === 'right') {
        nexus.x = cx + offset;
        nexus.y = cy;
      }
      nexus.radius = NEXUS_RADIUS;
    }
  }
}

function findNearestNexus(x: number, y: number, maxDistance: number): Nexus | null {
  let best: Nexus | null = null;
  let bestDist = maxDistance;
  for (const nexus of nexusList) {
    const d = Math.hypot(nexus.x - x, nexus.y - y);
    if (d < bestDist) {
      best = nexus;
      bestDist = d;
    }
  }
  return best;
}

function canAddLinkBetween(a: Nexus, b: Nexus): boolean {
  if (a.id === b.id) return false;
  if (a.owner !== 'player' || b.owner !== 'player') return false;

  // Vérifier si le lien existe déjà
  const exists = links.some(
    (l) =>
      (l.fromId === a.id && l.toId === b.id) ||
      (l.fromId === b.id && l.toId === a.id),
  );
  if (exists) return false;

  // Max 3 liens par nexus
  const countLinksFor = (id: string) =>
    links.filter((l) => l.fromId === id || l.toId === id).length;
  if (countLinksFor(a.id) >= MAX_LINKS_PER_NEXUS) return false;
  if (countLinksFor(b.id) >= MAX_LINKS_PER_NEXUS) return false;

  return true;
}

function tryCreateLinkFromTap(touchState: TouchState, gameState: string): void {
  if (gameState !== 'PLAYING') return;

  // On ne crée des liens que sur des taps rapides (scout)
  if (touchState.detectedUnit !== 'scout') return;

  const nearest = findNearestNexus(touchState.x, touchState.y, 60);
  if (!nearest || nearest.owner !== 'player') return;

  if (!selectedNexusId) {
    // Premier nexus sélectionné
    selectedNexusId = nearest.id;
  } else {
    const first = nexusList.find((n) => n.id === selectedNexusId);
    const second = nearest;
    selectedNexusId = null;
    if (!first) return;

    if (!canAddLinkBetween(first, second)) return;

    // Coût en énergie
    if (!spendEnergy(LINK_ENERGY_COST)) {
      // Pas assez d'énergie → pas de lien
      return;
    }

    const id = `${first.id}-${second.id}-${Date.now()}`;
    links.push({
      id,
      fromId: first.id,
      toId: second.id,
      owner: 'player',
      createdAt: performance.now(),
      animationDuration: LINK_ANIMATION_DURATION_MS,
    });
  }
}

function updateAndRenderNexus(
  ctx: CanvasRenderingContext2D,
  nexus: Nexus,
  touchState: TouchState,
  gameState: string,
  deltaSeconds: number,
  enemyCapturing: boolean
): void {
  const { x, y, radius } = nexus;

  const isTouching =
    touchState.active &&
    Math.hypot(touchState.x - x, touchState.y - y) <= radius + 20 &&
    gameState === 'PLAYING';

  // Mise à jour de la progression de capture côté joueur (tap & hold)
  if (gameState === 'PLAYING') {
    if (isTouching) {
      nexus.state = 'capturing';
      nexus.capturingBy = 'player';
      nexus.captureProgress = Math.min(
        1,
        touchState.duration / NEXUS_CAPTURE_TIME_MS,
      );
      if (nexus.captureProgress >= 1) {
        nexus.owner = 'player';
        nexus.state = 'owned';
        nexus.capturingBy = 'player';
      }
    } else if (nexus.capturingBy === 'player' && nexus.owner === 'neutral') {
      // Le joueur lâche avant la fin : retour à neutre
      nexus.state = 'idle';
      nexus.capturingBy = 'neutral';
      nexus.captureProgress = 0;
    }
  }

  // État "contested" si l'IA essaye de voler un nexus déjà possédé
  const isContested =
    enemyCapturing &&
    nexus.owner === 'player' &&
    gameState === 'PLAYING';
  if (isContested) {
    nexus.state = 'contested';
  } else if (nexus.owner === 'player' && nexus.state !== 'capturing') {
    nexus.state = 'owned';
    nexus.capturingBy = 'player';
  } else if (nexus.owner === 'enemy' && nexus.state !== 'capturing') {
    nexus.state = 'owned';
    nexus.capturingBy = 'enemy';
  }

  // Dessin
  ctx.save();

  // Base : style neutre / joueur / ennemi
  let baseColor = COLORS.neutral;
  if (nexus.owner === 'player') baseColor = COLORS.player;
  if (nexus.owner === 'enemy') baseColor = COLORS.enemy;

  ctx.strokeStyle = baseColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, radius - 6, 0, Math.PI * 2);
  ctx.stroke();

  // Arc de progression pendant la capture (joueur)
  if (nexus.state === 'capturing' && nexus.capturingBy === 'player') {
    const progress = nexus.captureProgress;
    const color = COLORS.player;
    drawProgressArc(ctx, x, y, progress, radius + 10, color);
  }

  // Remplissage progressif une fois capturé
  if (nexus.owner === 'player') {
    ctx.fillStyle = `${COLORS.player}CC`;
    ctx.beginPath();
    ctx.arc(x, y, radius - 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (nexus.owner === 'enemy') {
    ctx.fillStyle = `${COLORS.enemy}CC`;
    ctx.beginPath();
    ctx.arc(x, y, radius - 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Indication visuelle de contestation : anneau externe rouge terre-cuite
  if (isContested) {
    ctx.strokeStyle = COLORS.enemy;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Annotation coordonnées
  const gridX = Math.floor(x / 40);
  const gridY = Math.floor(y / 40);
  let label = 'TARGET';
  if (nexus.owner === 'player') label = 'CAPTURED';
  if (nexus.owner === 'enemy') label = 'ENEMY';
  if (isContested) label = 'CONTESTED';
  drawCoordinatesWithLabel(ctx, x, y, gridX, gridY, label);

  ctx.restore();
}

function render(timestamp: number): void {
  if (!canvasContext) return;

  const { ctx, width, height } = canvasContext;

  // Delta temps (pour le score 1 pt/seconde)
  let deltaSeconds = 0;
  if (lastRenderTimestamp !== null) {
    deltaSeconds = (timestamp - lastRenderTimestamp) / 1000;
  }
  lastRenderTimestamp = timestamp;

  // Update FPS
  updateFPS(timestamp);

  // Update touch state
  const touchState = updateTouchState();

  // Update debug state
  debugState.inputLatency = getInputLatency();
  debugState.pressTime = touchState.duration;
  debugState.detectedUnit = touchState.detectedUnit;
  debugState.state = touchState.active ? 'PRESSING' : 'IDLE';

  // Création de liens sur tap (Sprint 4)
  if (!touchState.active) {
    tryCreateLinkFromTap(touchState, gameState);
  }

  // Clear and draw background
  clearCanvas(ctx, width, height);

  // Draw grid
  drawGrid(ctx, width, height);
  ensureNexusLayout(width, height);

  const gameState = getGameState();

  // Réinitialisation des liens et triangles au démarrage d'une nouvelle partie
  if (gameState === 'PLAYING' && (lastGameState === 'START' || lastGameState === 'REPLAY')) {
    links = [];
    triangles = [];
    selectedNexusId = null;
  }
  lastGameState = gameState;

  // Mise à jour de l'IA ennemie (Sprint 3)
  if (gameState !== 'PLAYING') {
    enemyAgent.targetId = null;
    enemyAgent.timeOnTarget = 0;
    enemyAgent.cooldownTimer = enemyAgent.cooldown;
  } else {
    // Choix de cible si nécessaire
    if (!enemyAgent.targetId) {
      enemyAgent.cooldownTimer -= deltaSeconds;
      if (enemyAgent.cooldownTimer <= 0) {
        const neutralOrPlayer = nexusList.filter(
          (n) => n.owner === 'neutral' || n.owner === 'player',
        );
        if (neutralOrPlayer.length > 0) {
          const idx = Math.floor(Math.random() * neutralOrPlayer.length);
          enemyAgent.targetId = neutralOrPlayer[idx].id;
          enemyAgent.timeOnTarget = 0;
        } else {
          enemyAgent.cooldownTimer = enemyAgent.cooldown;
        }
      }
    } else {
      const target = nexusList.find((n) => n.id === enemyAgent.targetId);
      if (!target) {
        enemyAgent.targetId = null;
        enemyAgent.timeOnTarget = 0;
        enemyAgent.cooldownTimer = enemyAgent.cooldown;
      } else {
        enemyAgent.timeOnTarget += deltaSeconds;
        if (enemyAgent.timeOnTarget >= enemyAgent.captureDuration) {
          target.owner = 'enemy';
          target.state = 'owned';
          target.capturingBy = 'enemy';
          target.captureProgress = 1;
          enemyAgent.targetId = null;
          enemyAgent.timeOnTarget = 0;
          enemyAgent.cooldownTimer = enemyAgent.cooldown;
        }
      }
    }
  }

  // NEXUS (Sprint 1-2) : mise à jour + rendu + score par nombre de nexus capturés
  let ownedCount = 0;
  for (const nexus of nexusList) {
    const enemyCapturing = enemyAgent.targetId === nexus.id && gameState === 'PLAYING';
    updateAndRenderNexus(ctx, nexus, touchState, gameState, deltaSeconds, enemyCapturing);
    if (nexus.owner === 'player') {
      ownedCount += 1;
    }
  }

  // Détection de triangles (Sprint 5) - après mise à jour des liens
  if (gameState === 'PLAYING') {
    detectTriangles();
  }

  // Triangles (Sprint 5) - rendu avant les liens pour que les hachures soient en arrière-plan
  renderTriangles(ctx, timestamp);

  // Liens (Sprint 4)
  renderLinks(ctx, timestamp);

  // Score = +1 point/seconde par nexus possédé + bonus triangles (×5)
  if (gameState === 'PLAYING' && deltaSeconds > 0) {
    let baseScore = ownedCount;
    
    // Bonus triangles : ×5 le score des nexus inclus dans les triangles
    const triangleNexusIds = new Set<string>();
    for (const triangle of triangles) {
      if (triangle.owner === 'player') {
        triangle.nexusIds.forEach((id) => triangleNexusIds.add(id));
      }
    }
    const triangleNexusCount = Array.from(triangleNexusIds).filter(
      (id) => nexusList.find((n) => n.id === id)?.owner === 'player',
    ).length;
    
    // Score = nexus normaux + (nexus dans triangles × 5)
    const normalNexusCount = ownedCount - triangleNexusCount;
    const triangleBonus = triangleNexusCount * TRIANGLE_SCORE_MULTIPLIER;
    baseScore = normalNexusCount + triangleBonus;
    
    if (baseScore > 0) {
      addNexusPoints(deltaSeconds * baseScore);
    }
  }

  // Énergie (Sprint 4)
  if (gameState === 'PLAYING' && deltaSeconds > 0) {
    regenEnergy(deltaSeconds);
  }

  const energyHud = document.getElementById('energy-hud');
  if (energyHud) {
    const energy = getEnergy();
    energyHud.textContent = `⚡ ${String(Math.floor(energy.current))
      .padStart(3, '0')} / ${energy.max}`;
  }

  // Draw released animations
  renderReleasedAnimations(ctx, timestamp);

  // Draw active touch
  renderActiveTouch(ctx, touchState);

  // Update debug overlay
  updateDebugOverlay(touchState);

  // HUD Score (Sprint 1)
  const scoreHud = document.getElementById('score-hud');
  if (scoreHud) {
    const total = Math.round(getScore().nexusPoints || 0);
    scoreHud.textContent = total.toString().padStart(3, '0');
  }

  // Continue loop
  animationFrameId = requestAnimationFrame(render);
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Start the render engine
 */
export function startEngine(context: CanvasContext): void {
  canvasContext = context;
  debugState.lastFpsUpdate = performance.now();
  animationFrameId = requestAnimationFrame(render);
}

/**
 * Stop the render engine
 */
export function stopEngine(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

/**
 * Add a released animation (called when touch ends)
 */
export function addReleasedAnimation(x: number, y: number, unitType: UnitType): void {
  if (unitType === 'none') return;

  releasedAnimations.push({
    x,
    y,
    unitType,
    startTime: performance.now(),
    duration: RELEASE_ANIMATION_DURATION,
  });
}

/**
 * Get current debug state
 */
export function getDebugState(): DebugState {
  return { ...debugState };
}
