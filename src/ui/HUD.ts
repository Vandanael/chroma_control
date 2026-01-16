/**
 * HUD.ts - Interface In-Game
 * Style Minimaliste Organique Enfant-Friendly
 */

import { Container, Graphics, Text, TextStyle, Rectangle } from 'pixi.js';
import { CANVAS, PAINT_AREA, PLAYER_COLORS, PlayerColorName } from '@utils/Constants';
import { PressureState } from '@entities/PressureTank';
import { gsap } from 'gsap';

export class HUD {
  private container: Container;
  private playerColor: number = PLAYER_COLORS.CYAN;
  
  // Zone Info (haut)
  private levelText: Text;
  private timerText: Text;
  
  // Zone Contrôle (bas)
  private pressureGauge: Graphics;
  private pressureGaugeFill: Graphics;
  private pressureLabel: Text;
  private stopButton: Graphics;
  private stopButtonText: Text;
  private replayButton: Graphics;
  private replayButtonText: Text;
  
  // Zone de peinture (bordure visible)
  private paintAreaBorder: Graphics;
  
  // Overlay surchauffe
  private overheatOverlay: Graphics;
  private overheatText: Text;
  
  private onStopCallback: (() => void) | null = null;
  private onReplayCallback: (() => void) | null = null;
  
  constructor() {
    this.container = new Container();
    this.container.sortableChildren = true; // Activer le tri par zIndex
    
    // Zone Info (10% haut)
    this.levelText = this.createText('Niveau 1', 28, 0xFFFFFF);
    this.timerText = this.createText('01:30', 44, 0xFFFFFF);
    
    // Zone Contrôle (20% bas)
    this.pressureGauge = new Graphics();
    this.pressureGaugeFill = new Graphics();
    this.pressureLabel = this.createText('PRESSION: 100%', 18, 0xFFFFFF);
    this.stopButton = new Graphics();
    this.stopButtonText = this.createText('⏸', 32, 0xFFFFFF);
    this.replayButton = new Graphics();
    this.replayButtonText = this.createText('🔄', 32, 0xFFFFFF);
    
    // ✅ Zone de peinture (bordure visible)
    this.paintAreaBorder = new Graphics();
    this.drawPaintAreaBorder();
    
    // ✅ Overlay surchauffe avec texte explicatif
    this.overheatOverlay = new Graphics();
    this.overheatOverlay.visible = false;
    
    this.overheatText = new Text({
      text: '🔥 SURCHAUFFE !\nATTENDS UN PEU...',
      style: new TextStyle({
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: 48,
        fontWeight: '900',
        fill: 0xFFFFFF,
        align: 'center',
        stroke: { color: 0xFF0000, width: 4 }
      })
    });
    this.overheatText.anchor.set(0.5);
    this.overheatText.position.set(CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2);
    this.overheatText.visible = false;
    
    this.setupLayout();
    this.setupButtons();
    
    // Ajouter au container (ordre important : bordure en premier pour être derrière)
    this.container.addChild(this.paintAreaBorder);
    this.container.addChild(this.levelText);
    this.container.addChild(this.timerText);
    this.container.addChild(this.pressureGauge);
    this.container.addChild(this.pressureGaugeFill);
    this.container.addChild(this.pressureLabel);
    this.container.addChild(this.stopButton);
    this.container.addChild(this.stopButtonText);
    this.container.addChild(this.replayButton);
    this.container.addChild(this.replayButtonText);
    this.container.addChild(this.overheatOverlay);
    this.container.addChild(this.overheatText);
  }
  
  /**
   * ✅ Dessine la bordure de la zone de peinture
   */
  private drawPaintAreaBorder(): void {
    this.paintAreaBorder.clear();
    
    // Fond légèrement plus sombre pour distinguer la zone
    this.paintAreaBorder.roundRect(
      PAINT_AREA.X, 
      PAINT_AREA.Y, 
      PAINT_AREA.WIDTH, 
      PAINT_AREA.HEIGHT, 
      PAINT_AREA.BORDER_RADIUS
    );
    this.paintAreaBorder.fill({ color: 0x000000, alpha: 0.3 });
    
    // Bordure visible
    this.paintAreaBorder.roundRect(
      PAINT_AREA.X, 
      PAINT_AREA.Y, 
      PAINT_AREA.WIDTH, 
      PAINT_AREA.HEIGHT, 
      PAINT_AREA.BORDER_RADIUS
    );
    this.paintAreaBorder.stroke({ 
      color: this.playerColor, 
      width: PAINT_AREA.BORDER_WIDTH, 
      alpha: 0.4 
    });
    
    // Coins lumineux pour accentuer
    const cornerSize = 30;
    const corners = [
      // Haut gauche
      { x: PAINT_AREA.X, y: PAINT_AREA.Y },
      // Haut droite
      { x: PAINT_AREA.X + PAINT_AREA.WIDTH - cornerSize, y: PAINT_AREA.Y },
      // Bas gauche
      { x: PAINT_AREA.X, y: PAINT_AREA.Y + PAINT_AREA.HEIGHT - cornerSize },
      // Bas droite
      { x: PAINT_AREA.X + PAINT_AREA.WIDTH - cornerSize, y: PAINT_AREA.Y + PAINT_AREA.HEIGHT - cornerSize }
    ];
    
    corners.forEach((corner, i) => {
      const isTop = i < 2;
      const isLeft = i % 2 === 0;
      
      this.paintAreaBorder.moveTo(
        corner.x + (isLeft ? 0 : cornerSize),
        corner.y + (isTop ? cornerSize : 0)
      );
      this.paintAreaBorder.lineTo(
        corner.x + (isLeft ? 0 : cornerSize),
        corner.y + (isTop ? 0 : cornerSize)
      );
      this.paintAreaBorder.lineTo(
        corner.x + (isLeft ? cornerSize : 0),
        corner.y + (isTop ? 0 : cornerSize)
      );
      this.paintAreaBorder.stroke({ 
        color: this.playerColor, 
        width: 4, 
        alpha: 0.8 
      });
    });
  }
  
  private createText(content: string, fontSize: number, color: number): Text {
    const style = new TextStyle({
      fontFamily: 'Nunito, system-ui, sans-serif',
      fontSize,
      fill: color,
      fontWeight: '700'
    });
    return new Text({ text: content, style });
  }
  
  private setupLayout(): void {
    // === ZONE INFO (Haut) ===
    
    // Niveau (haut gauche)
    this.levelText.anchor.set(0, 0);
    this.levelText.position.set(40, 40);
    this.levelText.alpha = 0.8;
    
    // Timer (haut centre) - GROS et VISIBLE
    this.timerText.anchor.set(0.5, 0);
    this.timerText.position.set(CANVAS.WIDTH / 2, 40);
    (this.timerText.style as TextStyle).fontWeight = '900';
    
    // === ZONE CONTRÔLE (Bas) ===
    
    const controlZoneY = CANVAS.HEIGHT - 200;
    
    // Jauge de pression HORIZONTALE (plus naturel mobile)
    const gaugeWidth = 700;
    const gaugeHeight = 16;
    const gaugeX = (CANVAS.WIDTH - gaugeWidth) / 2;
    const gaugeY = controlZoneY + 20;
    
    // Fond de la jauge
    this.pressureGauge.roundRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight, 9999);
    this.pressureGauge.fill({ color: 0xffffff, alpha: 0.1 });
    
    // Fill de la jauge (sera mis à jour)
    this.pressureGaugeFill.position.set(gaugeX, gaugeY);
    this.updatePressureGaugeFill(100, 'normal');
    
    // Label pression (sous la jauge)
    this.pressureLabel.anchor.set(0.5, 0);
    this.pressureLabel.position.set(CANVAS.WIDTH / 2, gaugeY + gaugeHeight + 12);
    (this.pressureLabel.style as TextStyle).fontSize = 16;
    (this.pressureLabel.style as TextStyle).fontWeight = '600';
    this.pressureLabel.alpha = 0.7;
    
    // Boutons (bas de la zone contrôle)
    const buttonY = controlZoneY + 100;
    const buttonSize = 64;
    const buttonSpacing = 32;
    
    // Bouton STOP (gauche)
    this.drawIconButton(
      this.stopButton,
      CANVAS.WIDTH / 2 - buttonSize - buttonSpacing / 2,
      buttonY,
      buttonSize
    );
    this.stopButtonText.anchor.set(0.5);
    this.stopButtonText.position.set(
      CANVAS.WIDTH / 2 - buttonSize / 2 - buttonSpacing / 2,
      buttonY + buttonSize / 2
    );
    
    // Bouton REPLAY (droite)
    this.drawIconButton(
      this.replayButton,
      CANVAS.WIDTH / 2 + buttonSpacing / 2,
      buttonY,
      buttonSize
    );
    this.replayButtonText.anchor.set(0.5);
    this.replayButtonText.position.set(
      CANVAS.WIDTH / 2 + buttonSize / 2 + buttonSpacing / 2,
      buttonY + buttonSize / 2
    );
    
    // Cacher les boutons par défaut
    this.setButtonsVisible(false);
  }
  
  private drawIconButton(g: Graphics, x: number, y: number, size: number): void {
    g.clear();
    g.circle(x + size / 2, y + size / 2, size / 2);
    g.fill({ color: 0xffffff, alpha: 0.05 });
    g.stroke({ color: 0xffffff, width: 2, alpha: 0.15 });
  }
  
  private setupButtons(): void {
    const buttonY = CANVAS.HEIGHT - 200 + 100;
    const buttonSize = 64;
    const buttonSpacing = 32;
    
    // Bouton STOP
    this.stopButton.eventMode = 'static';
    this.stopButton.cursor = 'pointer';
    this.stopButton.hitArea = new Rectangle(
      CANVAS.WIDTH / 2 - buttonSize - buttonSpacing / 2,
      buttonY,
      buttonSize,
      buttonSize
    );
    
    this.stopButton.on('pointerdown', () => {
      console.log('[HUD] Bouton STOP cliqué');
      this.onStopCallback?.();
    });
    
    // S'assurer que les boutons sont au-dessus
    this.stopButton.zIndex = 100;
    this.stopButtonText.zIndex = 101;
    
    // Bouton REPLAY
    this.replayButton.eventMode = 'static';
    this.replayButton.cursor = 'pointer';
    this.replayButton.hitArea = new Rectangle(
      CANVAS.WIDTH / 2 + buttonSpacing / 2,
      buttonY,
      buttonSize,
      buttonSize
    );
    
    this.replayButton.on('pointerdown', () => {
      console.log('[HUD] Bouton REJOUER cliqué');
      this.onReplayCallback?.();
    });
    
    // S'assurer que les boutons sont au-dessus
    this.replayButton.zIndex = 100;
    this.replayButtonText.zIndex = 101;
  }
  
  private updatePressureGaugeFill(pressure: number, state: PressureState): void {
    const gaugeWidth = 700;
    const gaugeHeight = 16;
    const fillWidth = (gaugeWidth * pressure) / 100;
    
    // Couleur selon l'état
    let color: number;
    let shouldPulse = false;
    
    switch (state) {
      case 'overheat':
        color = 0xFF4466; // Rouge
        shouldPulse = true;
        break;
      case 'low':
        color = 0xFFAA00; // Orange
        break;
      default:
        color = this.playerColor; // Couleur du joueur
    }
    
    this.pressureGaugeFill.clear();
    this.pressureGaugeFill.roundRect(0, 0, fillWidth, gaugeHeight, 9999);
    this.pressureGaugeFill.fill({ color });
    
    // Glow
    this.pressureGaugeFill.filters = [];
    if (shouldPulse) {
      this.pressureGaugeFill.alpha = 0.8;
    } else {
      this.pressureGaugeFill.alpha = 1;
    }
  }
  
  /**
   * Met à jour le timer
   */
  updateTimer(seconds: number): void {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    this.timerText.text = `${minutes}:${secs.toString().padStart(2, '0')}`;
    
    // Couleur dynamique selon le temps restant
    if (seconds <= 10) {
      (this.timerText.style as TextStyle).fill = 0xFF4466; // Rouge
    } else if (seconds <= 30) {
      (this.timerText.style as TextStyle).fill = 0xFFAA00; // Orange
    } else {
      (this.timerText.style as TextStyle).fill = 0xFFFFFF; // Blanc
    }
  }
  
  /**
   * Met à jour la jauge de pression
   */
  updatePressure(pressure: number, state: PressureState): void {
    this.updatePressureGaugeFill(pressure, state);
    this.pressureLabel.text = `PRESSION: ${Math.round(pressure)}%`;
    
    // Couleur du label selon l'état
    switch (state) {
      case 'overheat':
        (this.pressureLabel.style as TextStyle).fill = 0xFF4466;
        break;
      case 'low':
        (this.pressureLabel.style as TextStyle).fill = 0xFFAA00;
        break;
      default:
        (this.pressureLabel.style as TextStyle).fill = 0xFFFFFF;
    }
    
    // ✅ Gestion de l'overlay + texte de surchauffe
    if (state === 'overheat') {
      // Afficher overlay rouge
      this.overheatOverlay.clear();
      this.overheatOverlay.rect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
      this.overheatOverlay.fill({ color: 0xFF0000, alpha: 0.3 });
      this.overheatOverlay.visible = true;
      
      // Afficher texte avec animation pulse
      this.overheatText.visible = true;
      gsap.to(this.overheatText.scale, {
        x: 1.1,
        y: 1.1,
        duration: 0.3,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut'
      });
    } else {
      // Masquer overlay et texte
      this.overheatOverlay.visible = false;
      this.overheatText.visible = false;
      gsap.killTweensOf(this.overheatText.scale);
      this.overheatText.scale.set(1);
    }
  }
  
  /**
   * Affiche/cache les boutons
   */
  setButtonsVisible(visible: boolean): void {
    this.stopButton.visible = visible;
    this.stopButtonText.visible = visible;
    this.replayButton.visible = visible;
    this.replayButtonText.visible = visible;
  }
  
  /**
   * Définit la couleur du joueur
   */
  setPlayerColor(colorName: PlayerColorName): void {
    this.playerColor = PLAYER_COLORS[colorName];
    this.updatePressureGaugeFill(100, 'normal');
    this.drawPaintAreaBorder(); // ✅ Mettre à jour la bordure avec la nouvelle couleur
  }
  
  /**
   * Callbacks
   */
  onStop(callback: () => void): void {
    this.onStopCallback = callback;
  }
  
  onReplay(callback: () => void): void {
    this.onReplayCallback = callback;
  }
  
  /**
   * Retourne le container
   */
  getContainer(): Container {
    return this.container;
  }
  
  /**
   * Détruit le HUD
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
