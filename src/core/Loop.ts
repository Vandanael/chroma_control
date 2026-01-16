/**
 * Loop.ts - Game loop avec requestAnimationFrame
 * Gère le timing et les callbacks de mise à jour
 */

// =============================================================================
// TYPES
// =============================================================================

type UpdateCallback = (deltaTime: number) => void;

// =============================================================================
// LOOP CLASS
// =============================================================================

class Loop {
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private isRunning = false;
  private callbacks: UpdateCallback[] = [];
  
  /**
   * Ajoute un callback qui sera appelé à chaque frame
   */
  addCallback(callback: UpdateCallback): void {
    this.callbacks.push(callback);
  }
  
  /**
   * Retire un callback
   */
  removeCallback(callback: UpdateCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index !== -1) {
      this.callbacks.splice(index, 1);
    }
  }
  
  /**
   * Démarre le loop
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick(this.lastTime);
    
    console.log('[Loop] Started');
  }
  
  /**
   * Arrête le loop
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    console.log('[Loop] Stopped');
  }
  
  /**
   * Tick du loop
   */
  private tick = (currentTime: number): void => {
    if (!this.isRunning) return;
    
    // Calculer le delta time
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Limiter le delta time pour éviter les sauts (max 100ms)
    const clampedDelta = Math.min(deltaTime, 100);
    
    // Appeler tous les callbacks
    for (const callback of this.callbacks) {
      callback(clampedDelta);
    }
    
    // Planifier la prochaine frame
    this.animationFrameId = requestAnimationFrame(this.tick);
  };
  
  /**
   * Vérifie si le loop est en cours
   */
  get running(): boolean {
    return this.isRunning;
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const loop = new Loop();
