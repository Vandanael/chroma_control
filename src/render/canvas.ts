/**
 * Canvas Setup - Retina-ready & Responsive
 * Handles high-DPI displays and window resizing
 */

import { CanvasContext } from '../types';
import { initViewportManager } from '../utils/viewportManager';

let canvasContext: CanvasContext | null = null;

/**
 * Initialize the canvas with proper scaling for Retina displays
 */
export function initCanvas(canvasId: string = 'game-canvas'): CanvasContext {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvas) {
    throw new Error(`Canvas element #${canvasId} not found`);
  }

  const ctx = canvas.getContext('2d', {
    alpha: false,  // Opaque for better performance
    desynchronized: true,  // Reduce latency on supported browsers
  });

  if (!ctx) {
    throw new Error('Could not get 2D context');
  }

  // Setup resize handler avec gestion d'orientation
  const resize = (width: number, height: number) => {
    const dpr = window.devicePixelRatio || 1;

    // Set actual canvas size in memory (scaled for Retina)
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Scale context to match DPR
    ctx.scale(dpr, dpr);

    // Update context reference
    if (canvasContext) {
      canvasContext.width = width;
      canvasContext.height = height;
      canvasContext.dpr = dpr;
    }

    // Apply base styles after resize
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.font = '12px "IBM Plex Mono", monospace';
  };

  // Initial resize
  resize(window.innerWidth, window.innerHeight);

  // Initialiser le gestionnaire de viewport (avec debounce et sauvegarde d'état)
  initViewportManager(canvas, ctx, resize);

  canvasContext = {
    canvas,
    ctx,
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio || 1,
  };

  return canvasContext;
}

/**
 * Get the current canvas context
 */
export function getCanvasContext(): CanvasContext {
  if (!canvasContext) {
    throw new Error('Canvas not initialized. Call initCanvas() first.');
  }
  return canvasContext;
}

/**
 * Clear the canvas with the Deep Space background color
 */
export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  // Fond Deep Space #121214 (Bio-Digital Edition)
  ctx.fillStyle = '#121214';
  ctx.fillRect(0, 0, width, height);
}

