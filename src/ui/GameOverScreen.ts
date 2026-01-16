/**
 * GameOverScreen.ts - Écran de fin de partie
 * Style Minimaliste Organique Enfant-Friendly
 */

import { Container, Graphics, Text, TextStyle, Rectangle } from 'pixi.js';
import { CANVAS, PLAYER_COLORS, PlayerColorName } from '@utils/Constants';
import { ScoreBreakdown } from '@systems/ScoringSystem';
import { StarResult } from '@systems/StarSystem';

type ButtonCallback = () => void;

export class GameOverScreen {
  private container: Container;
  private background: Graphics;
  private titleText: Text;
  private scoreText: Text;
  private starsContainer: Container;
  private statsText: Text;
  private nextButton: Graphics;
  private nextButtonText: Text;
  private replayButton: Graphics;
  private replayButtonText: Text;
  private menuButton: Graphics;
  private menuButtonText: Text;
  
  private onReplayCallback: ButtonCallback | null = null;
  private onMenuCallback: ButtonCallback | null = null;
  private onNextCallback: ButtonCallback | null = null;
  private playerColor: number = PLAYER_COLORS.CYAN;
  
  constructor() {
    this.container = new Container();
    this.container.visible = false;
    this.container.sortableChildren = true; // Activer le tri par zIndex
    
    // Créer les éléments
    this.background = new Graphics();
    this.titleText = this.createText('VICTOIRE', 64, 0xFFFFFF);
    this.scoreText = this.createText('0', 80, 0xFFFFFF);
    this.starsContainer = new Container();
    this.statsText = this.createText('', 20, 0xFFFFFF);
    this.nextButton = new Graphics();
    this.nextButtonText = this.createText('SUIVANT >', 24, 0x0a0a0f);
    this.replayButton = new Graphics();
    this.replayButtonText = this.createText('REJOUER', 24, 0xFFFFFF);
    this.menuButton = new Graphics();
    this.menuButtonText = this.createText('MENU', 24, 0xFFFFFF);
    
    this.setupLayout();
    this.setupButtons();
    
    // Ajouter au container
    this.container.addChild(this.background);
    this.container.addChild(this.titleText);
    this.container.addChild(this.scoreText);
    this.container.addChild(this.starsContainer);
    this.container.addChild(this.statsText);
    this.container.addChild(this.nextButton);
    this.container.addChild(this.nextButtonText);
    this.container.addChild(this.replayButton);
    this.container.addChild(this.replayButtonText);
    this.container.addChild(this.menuButton);
    this.container.addChild(this.menuButtonText);
  }
  
  private createText(content: string, fontSize: number, color: number): Text {
    const style = new TextStyle({
      fontFamily: 'Nunito, system-ui, sans-serif',
      fontSize,
      fill: color,
      fontWeight: '900'
    });
    return new Text({ text: content, style });
  }
  
  private setupLayout(): void {
    // Fond semi-transparent avec gradient
    this.background.clear();
    this.background.rect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
    this.background.fill({ color: 0x0a0a0f, alpha: 0.95 });
    this.background.eventMode = 'none'; // NE PAS bloquer les événements
    
    // Titre (haut)
    this.titleText.anchor.set(0.5, 0);
    this.titleText.position.set(CANVAS.WIDTH / 2, 200);
    
    // Score (sous le titre) - GROS
    this.scoreText.anchor.set(0.5, 0);
    this.scoreText.position.set(CANVAS.WIDTH / 2, 320);
    (this.scoreText.style as TextStyle).fontWeight = '900';
    
    // Stats (sous les étoiles)
    this.statsText.anchor.set(0.5, 0);
    this.statsText.position.set(CANVAS.WIDTH / 2, 620);
    (this.statsText.style as TextStyle).fontWeight = '600';
    (this.statsText.style as TextStyle).fill = 0xaaaaaa;
    
    // Boutons (bas) - 3 boutons
    const buttonY = CANVAS.HEIGHT - 250;
    const buttonWidth = 280;
    const buttonHeight = 72;
    const buttonSpacing = 24;
    
    // Bouton SUIVANT (haut, pleine largeur, couleur active)
    const nextButtonWidth = 600;
    this.drawBlobButton(
      this.nextButton,
      (CANVAS.WIDTH - nextButtonWidth) / 2,
      buttonY - 100,
      nextButtonWidth,
      buttonHeight,
      this.playerColor
    );
    this.nextButtonText.anchor.set(0.5, 0.5);
    this.nextButtonText.position.set(
      CANVAS.WIDTH / 2,
      buttonY - 100 + buttonHeight / 2
    );
    (this.nextButtonText.style as TextStyle).fill = 0x0a0a0f; // Texte sombre sur fond coloré
    this.nextButton.visible = false;
    this.nextButtonText.visible = false;
    
    // Bouton REJOUER (gauche, glass)
    this.drawGlassButton(
      this.replayButton,
      (CANVAS.WIDTH - buttonWidth * 2 - buttonSpacing) / 2,
      buttonY,
      buttonWidth,
      buttonHeight
    );
    this.replayButtonText.anchor.set(0.5, 0.5);
    this.replayButtonText.position.set(
      (CANVAS.WIDTH - buttonWidth * 2 - buttonSpacing) / 2 + buttonWidth / 2,
      buttonY + buttonHeight / 2
    );
    
    // Bouton MENU (droite, glass)
    this.drawGlassButton(
      this.menuButton,
      (CANVAS.WIDTH - buttonWidth * 2 - buttonSpacing) / 2 + buttonWidth + buttonSpacing,
      buttonY,
      buttonWidth,
      buttonHeight
    );
    this.menuButtonText.anchor.set(0.5, 0.5);
    this.menuButtonText.position.set(
      (CANVAS.WIDTH - buttonWidth * 2 - buttonSpacing) / 2 + buttonWidth + buttonSpacing + buttonWidth / 2,
      buttonY + buttonHeight / 2
    );
  }
  
  private drawBlobButton(
    g: Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number
  ): void {
    g.clear();
    g.roundRect(x, y, width, height, 36);
    g.fill({ color });
  }
  
  private drawGlassButton(
    g: Graphics,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    g.clear();
    g.roundRect(x, y, width, height, 36);
    g.fill({ color: 0xffffff, alpha: 0.05 });
    g.stroke({ color: 0xffffff, width: 2, alpha: 0.15 });
  }
  
  private setupButtons(): void {
    const buttonY = CANVAS.HEIGHT - 250;
    const buttonWidth = 280;
    const buttonHeight = 72;
    const buttonSpacing = 24;
    const nextButtonWidth = 600;
    
    // Bouton SUIVANT
    this.nextButton.eventMode = 'static';
    this.nextButton.cursor = 'pointer';
    this.nextButton.hitArea = new Rectangle(
      (CANVAS.WIDTH - nextButtonWidth) / 2,
      buttonY - 100,
      nextButtonWidth,
      buttonHeight
    );
    
    this.nextButton.on('pointerdown', () => {
      console.log('[GameOver] Bouton SUIVANT cliqué');
      this.onNextCallback?.();
    });
    
    // S'assurer que les boutons sont au-dessus
    this.nextButton.zIndex = 100;
    this.nextButtonText.zIndex = 101;
    
    // Bouton REJOUER
    this.replayButton.eventMode = 'static';
    this.replayButton.cursor = 'pointer';
    this.replayButton.hitArea = new Rectangle(
      (CANVAS.WIDTH - buttonWidth * 2 - buttonSpacing) / 2,
      buttonY,
      buttonWidth,
      buttonHeight
    );
    
    this.replayButton.on('pointerdown', () => {
      console.log('[GameOver] Bouton REJOUER cliqué');
      this.onReplayCallback?.();
    });
    
    // S'assurer que les boutons sont au-dessus
    this.replayButton.zIndex = 100;
    this.replayButtonText.zIndex = 101;
    
    // Bouton MENU
    this.menuButton.eventMode = 'static';
    this.menuButton.cursor = 'pointer';
    this.menuButton.hitArea = new Rectangle(
      (CANVAS.WIDTH - buttonWidth * 2 - buttonSpacing) / 2 + buttonWidth + buttonSpacing,
      buttonY,
      buttonWidth,
      buttonHeight
    );
    
    this.menuButton.on('pointerdown', () => {
      console.log('[GameOver] Bouton MENU cliqué');
      this.onMenuCallback?.();
    });
    
    // S'assurer que les boutons sont au-dessus
    this.menuButton.zIndex = 100;
    this.menuButtonText.zIndex = 101;
  }
  
  /**
   * Affiche l'écran de fin avec les résultats
   */
  show(
    isVictory: boolean,
    score: ScoreBreakdown,
    coverageRatio: number,
    timeUsed: number,
    pressureRemaining: number,
    starResult?: StarResult,
    hasNextLevel?: boolean
  ): void {
    // Titre
    this.titleText.text = isVictory ? '🎉 BRAVO !' : '😢 PRESQUE...';
    (this.titleText.style as TextStyle).fill = isVictory ? 0x00FF88 : 0xFF4466;
    
    // Score (juste le nombre, gros)
    this.scoreText.text = `${score.total}`;
    (this.scoreText.style as TextStyle).fill = isVictory ? 0x00FF88 : 0xFF4466;
    
    // Étoiles (animation bounce)
    this.starsContainer.removeChildren();
    if (starResult && isVictory) {
      const starSize = 80;
      const starSpacing = 100;
      const startX = CANVAS.WIDTH / 2 - (3 * starSpacing) / 2 + starSpacing / 2;
      const starY = 480;
      
      for (let i = 0; i < 3; i++) {
        const starStyle = new TextStyle({
          fontFamily: 'Nunito, system-ui, sans-serif',
          fontSize: starSize,
          fill: i < starResult.totalStars ? 0xFFD700 : 0x333333
        });
        const star = new Text({ text: '⭐', style: starStyle });
        star.anchor.set(0.5);
        star.position.set(startX + i * starSpacing, starY);
        
        // Animation scale bounce avec délai
        star.scale.set(0);
        setTimeout(() => {
          let scale = 0;
          const animate = () => {
            scale += 0.1;
            if (scale <= 1.3) {
              star.scale.set(Math.min(scale, 1.3));
              requestAnimationFrame(animate);
            } else {
              star.scale.set(1);
            }
          };
          animate();
        }, i * 150);
        
        this.starsContainer.addChild(star);
      }
    }
    
    // Stats (compactes)
    const minutes = Math.floor(timeUsed / 60);
    const seconds = Math.floor(timeUsed % 60);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    const coveragePercent = Math.round(coverageRatio * 100);
    
    this.statsText.text = `Couverture ${coveragePercent}%  •  Pression ${Math.round(pressureRemaining)}%  •  Temps ${timeStr}`;
    
    // Afficher le bouton SUIVANT uniquement si victoire ET niveau suivant existe
    const showNextButton = isVictory && (hasNextLevel ?? false);
    this.nextButton.visible = showNextButton;
    this.nextButtonText.visible = showNextButton;
    
    // Afficher
    this.container.visible = true;
  }
  
  /**
   * Cache l'écran
   */
  hide(): void {
    this.container.visible = false;
  }
  
  /**
   * Définit la couleur du joueur
   */
  setPlayerColor(colorName: PlayerColorName): void {
    this.playerColor = PLAYER_COLORS[colorName];
    
    // Mettre à jour le bouton SUIVANT
    const buttonY = CANVAS.HEIGHT - 250;
    const buttonWidth = 600;
    const buttonHeight = 72;
    
    this.drawBlobButton(
      this.nextButton,
      (CANVAS.WIDTH - buttonWidth) / 2,
      buttonY - 100,
      buttonWidth,
      buttonHeight,
      this.playerColor
    );
  }
  
  /**
   * Définit les callbacks
   */
  onReplay(callback: ButtonCallback): void {
    this.onReplayCallback = callback;
  }
  
  onMenu(callback: ButtonCallback): void {
    this.onMenuCallback = callback;
  }
  
  onNext(callback: ButtonCallback): void {
    this.onNextCallback = callback;
  }
  
  /**
   * Retourne le container
   */
  getContainer(): Container {
    return this.container;
  }
  
  /**
   * Détruit l'écran
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
