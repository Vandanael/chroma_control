/**
 * Canvas Setup - Retina-ready & Responsive
 * Handles high-DPI displays and window resizing
 */

import { CanvasContext, COLORS } from '../types';

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

  // Setup resize handler
  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Set actual canvas size in memory (scaled for Retina)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale context to match DPR
    ctx.scale(dpr, dpr);

    // Update context reference
    if (canvasContext) {
      canvasContext.width = rect.width;
      canvasContext.height = rect.height;
      canvasContext.dpr = dpr;
    }

    // Apply base styles after resize
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.font = '12px "IBM Plex Mono", monospace';
  };

  // Initial resize
  resize();

  // Handle window resize
  window.addEventListener('resize', resize);

  canvasContext = {
    canvas,
    ctx,
    width: canvas.getBoundingClientRect().width,
    height: canvas.getBoundingClientRect().height,
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
 * Clear the canvas with the paper background color
 */
export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draw the coordinate grid (subtle, always visible)
 */
export function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gridSize = 40;  // 40px grid cells
  const offsetX = (width % gridSize) / 2;
  const offsetY = (height % gridSize) / 2;

  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 0.5;

  // Vertical lines
  for (let x = offsetX; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = offsetY; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw coordinate markers at intersections
  ctx.fillStyle = COLORS.grid;
  ctx.font = '8px "IBM Plex Mono", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  let gridX = 0;
  for (let x = offsetX; x <= width; x += gridSize * 2) {
    let gridY = 0;
    for (let y = offsetY; y <= height; y += gridSize * 2) {
      // Small dot at intersection
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
      gridY++;
    }
    gridX++;
  }
}

/**
 * Apply paper grain texture (subtle noise)
 */
export function applyGrain(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number = 0.03): void {
  const imageData = ctx.getImageData(0, 0, width * (window.devicePixelRatio || 1), height * (window.devicePixelRatio || 1));
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * intensity * 255;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));     // R
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise)); // G
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise)); // B
  }

  ctx.putImageData(imageData, 0, 0);
}
