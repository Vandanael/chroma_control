/**
 * TutorialOverlay.ts - Tutoriel interactif
 * Style Minimaliste Organique Enfant-Friendly
 */

import { Container, Graphics, Text, TextStyle, Rectangle } from 'pixi.js';
import { CANVAS, PLAYER_COLORS, PlayerColorName } from '@utils/Constants';

export type TutorialStep = 'tap' | 'hold' | 'double-tap' | 'complete';

export class TutorialOverlay {
  private container: Container;
  private background: Graphics;
  private titleText: Text;
  private instructionText: Text;
  private iconText: Text;
  private skipButton: Graphics;
  private skipButtonText: Text;
  
  private onComplete: (() => void) | null = null;
  private onSkip: (() => void) | null = null;
  private playerColor: number = PLAYER_COLORS.CYAN;
  
  constructor() {
    this.container = new Container();
    this.container.visible = false;
    
    // Fond semi-transparent avec glass effect
    this.background = new Graphics();
    this.background.rect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
    this.background.fill({ color: 0x0a0a0f, alpha: 0.95 });
    this.container.addChild(this.background);
    
    // Titre
    this.titleText = new Text({
      text: 'TUTORIEL',
      style: new TextStyle({
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: 56,
        fontWeight: '900',
        fill: 0xffffff
      })
    });
    this.titleText.anchor.set(0.5, 0);
    this.titleText.position.set(CANVAS.WIDTH / 2, 250);
    this.container.addChild(this.titleText);
    
    // Icône/Emoji (gros)
    this.iconText = new Text({
      text: '👆',
      style: new TextStyle({
        fontFamily: 'system-ui',
        fontSize: 120
      })
    });
    this.iconText.anchor.set(0.5);
    this.iconText.position.set(CANVAS.WIDTH / 2, 500);
    this.container.addChild(this.iconText);
    
    // Instructions
    this.instructionText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: 28,
        fontWeight: '600',
        fill: 0xffffff,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 800
      })
    });
    this.instructionText.anchor.set(0.5, 0);
    this.instructionText.position.set(CANVAS.WIDTH / 2, 650);
    this.container.addChild(this.instructionText);
    
    // Bouton Skip (blob style)
    this.skipButton = new Graphics();
    this.skipButtonText = new Text({
      text: 'PASSER',
      style: new TextStyle({
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: 24,
        fontWeight: '700',
        fill: 0xffffff
      })
    });
    this.skipButtonText.anchor.set(0.5);
    
    this.setupSkipButton();
    this.container.addChild(this.skipButton);
    this.container.addChild(this.skipButtonText);
  }
  
  /**
   * Configure le bouton Skip (style glass)
   */
  private setupSkipButton(): void {
    const buttonWidth = 200;
    const buttonHeight = 64;
    const x = CANVAS.WIDTH / 2 - buttonWidth / 2;
    const y = CANVAS.HEIGHT - 200;
    
    this.skipButton.clear();
    this.skipButton.roundRect(x, y, buttonWidth, buttonHeight, 32);
    this.skipButton.fill({ color: 0xffffff, alpha: 0.05 });
    this.skipButton.stroke({ color: 0xffffff, width: 2, alpha: 0.15 });
    
    this.skipButtonText.position.set(CANVAS.WIDTH / 2, y + buttonHeight / 2);
    
    this.skipButton.eventMode = 'static';
    this.skipButton.cursor = 'pointer';
    this.skipButton.interactive = true;
    this.skipButton.hitArea = new Rectangle(x, y, buttonWidth, buttonHeight);
    
    this.skipButton.on('pointerdown', () => {
      this.onSkip?.();
    });
    
    // Hover effect
    this.skipButton.on('pointerover', () => {
      this.skipButton.clear();
      this.skipButton.roundRect(x, y, buttonWidth, buttonHeight, 32);
      this.skipButton.fill({ color: 0xffffff, alpha: 0.08 });
      this.skipButton.stroke({ color: this.playerColor, width: 3 });
    });
    
    this.skipButton.on('pointerout', () => {
      this.skipButton.clear();
      this.skipButton.roundRect(x, y, buttonWidth, buttonHeight, 32);
      this.skipButton.fill({ color: 0xffffff, alpha: 0.05 });
      this.skipButton.stroke({ color: 0xffffff, width: 2, alpha: 0.15 });
    });
  }
  
  /**
   * Affiche une étape du tutoriel
   */
  showStep(step: TutorialStep): void {
    switch (step) {
      case 'tap':
        this.iconText.text = '👆';
        this.instructionText.text = 'Touche l\'écran\npour peindre un point';
        break;
      case 'hold':
        this.iconText.text = '✋';
        this.instructionText.text = 'Maintiens appuyé\npour peindre en continu';
        break;
      case 'double-tap':
        this.iconText.text = '💥';
        this.instructionText.text = 'Double-touche\npour une explosion de peinture';
        break;
      case 'complete':
        this.iconText.text = '🎉';
        this.instructionText.text = 'C\'est parti !';
        this.titleText.text = 'PRÊT !';
        setTimeout(() => {
          this.hide();
          this.onComplete?.();
        }, 1500);
        break;
    }
    
    this.container.visible = true;
  }
  
  /**
   * Cache le tutoriel
   */
  hide(): void {
    this.container.visible = false;
  }
  
  /**
   * Définit la couleur du joueur
   */
  setPlayerColor(colorName: PlayerColorName): void {
    this.playerColor = PLAYER_COLORS[colorName];
  }
  
  /**
   * Définit les callbacks
   */
  setOnComplete(callback: () => void): void {
    this.onComplete = callback;
  }
  
  setOnSkip(callback: () => void): void {
    this.onSkip = callback;
  }
  
  /**
   * Retourne le container
   */
  getContainer(): Container {
    return this.container;
  }
  
  /**
   * Détruit l'overlay
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
