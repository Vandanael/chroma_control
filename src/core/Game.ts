/**
 * Game.ts - Application PixiJS principale
 * Gère l'initialisation, les layers et le state global
 */

import { Application, Container, RenderTexture, Sprite, Texture } from 'pixi.js';
import { CANVAS, LAYERS, PLAYER_COLORS, PlayerColorName } from '@utils/Constants';
import { generateAllTextures, clearTextureCache } from '@utils/TextureGenerator';

// =============================================================================
// TYPES
// =============================================================================

export type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface GameTextures {
  brushBlobs: Texture[];
  droplet: Texture;
  splatCores: Texture[];
}

// =============================================================================
// GAME CLASS
// =============================================================================

class Game {
  // PixiJS Application
  private app: Application | null = null;
  
  // Layers
  private layers: {
    background: Container;
    data: Container;
    paint: Container;
    particle: Container;
    ui: Container;
  } | null = null;
  
  // Paint RenderTexture (couche persistante)
  private paintTexture: RenderTexture | null = null;
  private paintSprite: Sprite | null = null;
  
  // Textures procédurales
  private textures: GameTextures | null = null;
  
  // State
  private _state: GameState = 'START';
  private _playerColor: PlayerColorName = 'CYAN';
  private _isInitialized = false;
  
  // Callbacks
  private onStateChangeCallbacks: ((state: GameState) => void)[] = [];
  
  // ==========================================================================
  // GETTERS
  // ==========================================================================
  
  get state(): GameState {
    return this._state;
  }
  
  get playerColor(): PlayerColorName {
    return this._playerColor;
  }
  
  get playerColorValue(): number {
    return PLAYER_COLORS[this._playerColor];
  }
  
  get isInitialized(): boolean {
    return this._isInitialized;
  }
  
  get application(): Application | null {
    return this.app;
  }
  
  get gameTextures(): GameTextures | null {
    return this.textures;
  }
  
  get paintLayer(): Container | null {
    return this.layers?.paint ?? null;
  }
  
  get particleLayer(): Container | null {
    return this.layers?.particle ?? null;
  }
  
  get paintRenderTexture(): RenderTexture | null {
    return this.paintTexture;
  }
  
  /**
   * ✅ Retourne un layer spécifique
   */
  getLayer(layerName: 'background' | 'data' | 'paint' | 'particle' | 'ui'): Container | null {
    return this.layers?.[layerName] ?? null;
  }
  
  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  
  async init(container: HTMLElement): Promise<void> {
    if (this._isInitialized) {
      console.warn('[Game] Already initialized');
      return;
    }
    
    console.log('[Game] Initializing PixiJS application...');
    
    // Créer l'application PixiJS
    this.app = new Application();
    
    await this.app.init({
      width: CANVAS.WIDTH,
      height: CANVAS.HEIGHT,
      backgroundColor: 0x000000,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });
    
    // Ajouter le canvas au container
    container.appendChild(this.app.canvas);
    
    // Configurer le canvas pour responsive
    this.setupResponsiveCanvas();
    
    // Créer les layers
    this.createLayers();
    
    // Créer la RenderTexture pour la peinture persistante
    this.createPaintTexture();
    
    // Générer les textures procédurales
    this.textures = generateAllTextures(this.app);
    
    this._isInitialized = true;
    console.log('[Game] Initialization complete');
    console.log(`[Game] Canvas: ${CANVAS.WIDTH}x${CANVAS.HEIGHT}`);
    console.log(`[Game] Textures loaded: ${this.textures.brushBlobs.length} blobs, ${this.textures.splatCores.length} splats`);
  }
  
  private setupResponsiveCanvas(): void {
    if (!this.app) return;
    
    const canvas = this.app.canvas;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.objectFit = 'contain';
    canvas.style.touchAction = 'none'; // Empêcher les gestes du navigateur
  }
  
  private createLayers(): void {
    if (!this.app) return;
    
    // Créer les containers pour chaque layer
    this.layers = {
      background: new Container(),
      data: new Container(),
      paint: new Container(),
      particle: new Container(),
      ui: new Container()
    };
    
    // Définir les z-index
    this.layers.background.zIndex = LAYERS.BACKGROUND;
    this.layers.data.zIndex = LAYERS.DATA;
    this.layers.paint.zIndex = LAYERS.PAINT;
    this.layers.particle.zIndex = LAYERS.PARTICLE;
    this.layers.ui.zIndex = LAYERS.UI;
    
    // Data layer invisible (pour la lecture des surfaces)
    this.layers.data.visible = false;
    
    // Ajouter au stage dans l'ordre
    this.app.stage.addChild(this.layers.background);
    this.app.stage.addChild(this.layers.data);
    this.app.stage.addChild(this.layers.paint);
    this.app.stage.addChild(this.layers.particle);
    this.app.stage.addChild(this.layers.ui);
    
    // Activer le tri par zIndex
    this.app.stage.sortableChildren = true;
    
    console.log('[Game] Layers created: background, data, paint, particle, ui');
  }
  
  private createPaintTexture(): void {
    if (!this.app) return;
    
    // RenderTexture pour la peinture persistante
    this.paintTexture = RenderTexture.create({
      width: CANVAS.WIDTH,
      height: CANVAS.HEIGHT,
      antialias: true
    });
    
    // Sprite qui affiche la RenderTexture
    this.paintSprite = new Sprite(this.paintTexture);
    this.layers?.paint.addChild(this.paintSprite);
    
    console.log('[Game] Paint RenderTexture created');
  }
  
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  
  setState(newState: GameState): void {
    if (this._state === newState) return;
    
    const oldState = this._state;
    this._state = newState;
    
    console.log(`[Game] State changed: ${oldState} -> ${newState}`);
    
    // Notifier les callbacks
    this.onStateChangeCallbacks.forEach(cb => cb(newState));
  }
  
  onStateChange(callback: (state: GameState) => void): void {
    this.onStateChangeCallbacks.push(callback);
  }
  
  setPlayerColor(color: PlayerColorName): void {
    this._playerColor = color;
    console.log(`[Game] Player color set to: ${color} (0x${PLAYER_COLORS[color].toString(16).toUpperCase()})`);
  }
  
  // ==========================================================================
  // GAME FLOW
  // ==========================================================================
  
  start(): void {
    if (!this._isInitialized) {
      console.error('[Game] Cannot start: not initialized');
      return;
    }
    
    // Nettoyer la peinture
    this.clearPaint();
    
    // Changer l'état
    this.setState('PLAYING');
    
    console.log('[Game] Game started');
  }
  
  pause(): void {
    if (this._state !== 'PLAYING') return;
    this.setState('PAUSED');
  }
  
  resume(): void {
    if (this._state !== 'PAUSED') return;
    this.setState('PLAYING');
  }
  
  gameOver(): void {
    this.setState('GAME_OVER');
  }
  
  restart(): void {
    this.clearPaint();
    this.setState('PLAYING');
  }
  
  backToMenu(): void {
    this.clearPaint();
    this.setState('START');
  }
  
  // ==========================================================================
  // PAINT OPERATIONS
  // ==========================================================================
  
  clearPaint(): void {
    if (!this.app || !this.paintTexture) return;
    
    // Effacer la RenderTexture
    this.app.renderer.render({
      container: new Container(),
      target: this.paintTexture,
      clear: true
    });
    
    console.log('[Game] Paint cleared');
  }
  
  /**
   * Rend un container dans la paintTexture (persistant)
   */
  renderToPaint(container: Container): void {
    if (!this.app || !this.paintTexture) return;
    
    this.app.renderer.render({
      container,
      target: this.paintTexture,
      clear: false // Ne pas effacer, ajouter à l'existant
    });
  }
  
  // ==========================================================================
  // CLEANUP
  // ==========================================================================
  
  destroy(): void {
    console.log('[Game] Destroying...');
    
    // Nettoyer le cache des textures
    clearTextureCache();
    
    // Détruire la RenderTexture
    this.paintTexture?.destroy();
    this.paintTexture = null;
    this.paintSprite = null;
    
    // Détruire les layers
    this.layers?.background.destroy({ children: true });
    this.layers?.data.destroy({ children: true });
    this.layers?.paint.destroy({ children: true });
    this.layers?.particle.destroy({ children: true });
    this.layers?.ui.destroy({ children: true });
    this.layers = null;
    
    // Détruire l'application
    this.app?.destroy(true, { children: true });
    this.app = null;
    
    this._isInitialized = false;
    this.onStateChangeCallbacks = [];
    
    console.log('[Game] Destroyed');
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const game = new Game();
