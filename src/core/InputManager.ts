/**
 * InputManager.ts - Gestion des inputs tactiles
 * Détection tap, hold, double-tap avec conversion coordonnées
 */

import { INPUT, CANVAS } from '@utils/Constants';

// =============================================================================
// TYPES
// =============================================================================

export type InputEventType = 'tap' | 'double-tap' | 'hold-start' | 'hold-move' | 'hold-end';

export interface InputEvent {
  type: InputEventType;
  x: number;  // Coordonnée canvas
  y: number;  // Coordonnée canvas
  timestamp: number;
}

type InputCallback = (event: InputEvent) => void;

// =============================================================================
// INPUT MANAGER CLASS
// =============================================================================

class InputManager {
  private canvas: HTMLCanvasElement | null = null;
  private callbacks: InputCallback[] = [];
  
  // État du touch
  private isDown = false;
  private startTime = 0;
  private startX = 0;
  private startY = 0;
  private lastX = 0;
  private lastY = 0;
  
  // État pour double-tap
  private lastTapTime = 0;
  private lastTapX = 0;
  private lastTapY = 0;
  
  // Timer pour détecter le hold
  private holdTimer: number | null = null;
  private isHolding = false;
  
  // Bound handlers (pour pouvoir les retirer)
  private boundHandlers: {
    touchStart: (e: TouchEvent) => void;
    touchMove: (e: TouchEvent) => void;
    touchEnd: (e: TouchEvent) => void;
    mouseDown: (e: MouseEvent) => void;
    mouseMove: (e: MouseEvent) => void;
    mouseUp: (e: MouseEvent) => void;
  } | null = null;
  
  /**
   * Initialise l'InputManager avec le canvas cible
   */
  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    
    // Créer les handlers bound
    this.boundHandlers = {
      touchStart: this.handleTouchStart.bind(this),
      touchMove: this.handleTouchMove.bind(this),
      touchEnd: this.handleTouchEnd.bind(this),
      mouseDown: this.handleMouseDown.bind(this),
      mouseMove: this.handleMouseMove.bind(this),
      mouseUp: this.handleMouseUp.bind(this)
    };
    
    // Event listeners tactiles
    canvas.addEventListener('touchstart', this.boundHandlers.touchStart, { passive: false });
    canvas.addEventListener('touchmove', this.boundHandlers.touchMove, { passive: false });
    canvas.addEventListener('touchend', this.boundHandlers.touchEnd, { passive: false });
    canvas.addEventListener('touchcancel', this.boundHandlers.touchEnd, { passive: false });
    
    // Event listeners souris (pour desktop)
    canvas.addEventListener('mousedown', this.boundHandlers.mouseDown);
    canvas.addEventListener('mousemove', this.boundHandlers.mouseMove);
    canvas.addEventListener('mouseup', this.boundHandlers.mouseUp);
    canvas.addEventListener('mouseleave', this.boundHandlers.mouseUp);
    
    console.log('[InputManager] Initialized');
  }
  
  /**
   * Ajoute un callback pour les événements d'input
   */
  onInput(callback: InputCallback): void {
    this.callbacks.push(callback);
  }
  
  /**
   * Retire un callback
   */
  offInput(callback: InputCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index !== -1) {
      this.callbacks.splice(index, 1);
    }
  }
  
  // ==========================================================================
  // TOUCH HANDLERS
  // ==========================================================================
  
  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const { x, y } = this.convertToCanvasCoords(touch.clientX, touch.clientY);
    
    this.handlePointerDown(x, y);
  }
  
  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const { x, y } = this.convertToCanvasCoords(touch.clientX, touch.clientY);
    
    this.handlePointerMove(x, y);
  }
  
  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    this.handlePointerUp();
  }
  
  // ==========================================================================
  // MOUSE HANDLERS
  // ==========================================================================
  
  private handleMouseDown(e: MouseEvent): void {
    const { x, y } = this.convertToCanvasCoords(e.clientX, e.clientY);
    this.handlePointerDown(x, y);
  }
  
  private handleMouseMove(e: MouseEvent): void {
    const { x, y } = this.convertToCanvasCoords(e.clientX, e.clientY);
    this.handlePointerMove(x, y);
  }
  
  private handleMouseUp(): void {
    this.handlePointerUp();
  }
  
  // ==========================================================================
  // POINTER LOGIC (unifié touch/mouse)
  // ==========================================================================
  
  private handlePointerDown(x: number, y: number): void {
    const now = performance.now();
    
    this.isDown = true;
    this.startTime = now;
    this.startX = x;
    this.startY = y;
    this.lastX = x;
    this.lastY = y;
    
    // Vérifier si c'est un double-tap
    const timeSinceLastTap = now - this.lastTapTime;
    const distanceFromLastTap = Math.sqrt(
      Math.pow(x - this.lastTapX, 2) + Math.pow(y - this.lastTapY, 2)
    );
    
    if (timeSinceLastTap < INPUT.DOUBLE_TAP_MAX_GAP && distanceFromLastTap < 50) {
      // Double-tap détecté !
      this.clearHoldTimer();
      this.emit({
        type: 'double-tap',
        x,
        y,
        timestamp: now
      });
      
      // Reset pour éviter un triple-tap
      this.lastTapTime = 0;
      return;
    }
    
    // Démarrer le timer pour détecter le hold
    this.holdTimer = window.setTimeout(() => {
      if (this.isDown) {
        this.isHolding = true;
        this.emit({
          type: 'hold-start',
          x: this.lastX,
          y: this.lastY,
          timestamp: performance.now()
        });
      }
    }, INPUT.HOLD_MIN_DURATION);
  }
  
  private handlePointerMove(x: number, y: number): void {
    if (!this.isDown) return;
    
    this.lastX = x;
    this.lastY = y;
    
    // Si on est en hold, émettre hold-move
    if (this.isHolding) {
      this.emit({
        type: 'hold-move',
        x,
        y,
        timestamp: performance.now()
      });
    }
  }
  
  private handlePointerUp(): void {
    if (!this.isDown) return;
    
    const now = performance.now();
    const duration = now - this.startTime;
    
    this.isDown = false;
    this.clearHoldTimer();
    
    if (this.isHolding) {
      // Fin du hold
      this.isHolding = false;
      this.emit({
        type: 'hold-end',
        x: this.lastX,
        y: this.lastY,
        timestamp: now
      });
    } else if (duration < INPUT.TAP_MAX_DURATION) {
      // C'était un tap court
      this.emit({
        type: 'tap',
        x: this.startX,
        y: this.startY,
        timestamp: now
      });
      
      // Sauvegarder pour la détection de double-tap
      this.lastTapTime = now;
      this.lastTapX = this.startX;
      this.lastTapY = this.startY;
    }
  }
  
  // ==========================================================================
  // UTILS
  // ==========================================================================
  
  /**
   * Convertit les coordonnées écran en coordonnées canvas
   */
  private convertToCanvasCoords(clientX: number, clientY: number): { x: number; y: number } {
    if (!this.canvas) return { x: 0, y: 0 };
    
    const rect = this.canvas.getBoundingClientRect();
    
    // Ratio entre la taille affichée et la taille du canvas
    const scaleX = CANVAS.WIDTH / rect.width;
    const scaleY = CANVAS.HEIGHT / rect.height;
    
    // Position relative au canvas
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    return { x, y };
  }
  
  private clearHoldTimer(): void {
    if (this.holdTimer !== null) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
  }
  
  private emit(event: InputEvent): void {
    for (const callback of this.callbacks) {
      callback(event);
    }
  }
  
  // ==========================================================================
  // CLEANUP
  // ==========================================================================
  
  /**
   * Détruit l'InputManager
   */
  destroy(): void {
    if (this.canvas && this.boundHandlers) {
      this.canvas.removeEventListener('touchstart', this.boundHandlers.touchStart);
      this.canvas.removeEventListener('touchmove', this.boundHandlers.touchMove);
      this.canvas.removeEventListener('touchend', this.boundHandlers.touchEnd);
      this.canvas.removeEventListener('touchcancel', this.boundHandlers.touchEnd);
      this.canvas.removeEventListener('mousedown', this.boundHandlers.mouseDown);
      this.canvas.removeEventListener('mousemove', this.boundHandlers.mouseMove);
      this.canvas.removeEventListener('mouseup', this.boundHandlers.mouseUp);
      this.canvas.removeEventListener('mouseleave', this.boundHandlers.mouseUp);
    }
    
    this.clearHoldTimer();
    this.canvas = null;
    this.callbacks = [];
    this.boundHandlers = null;
    
    console.log('[InputManager] Destroyed');
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const inputManager = new InputManager();
