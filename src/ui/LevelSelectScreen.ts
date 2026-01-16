/**
 * LevelSelectScreen.ts
 * Écran de sélection des niveaux - Style Organique Enfant-Friendly
 */

import { Container, Graphics, Text, TextStyle, Rectangle } from 'pixi.js';
import { LEVELS, type LevelConfig } from '@/entities/LevelData';
import type { PlayerProgression } from '@/systems/ProgressionSystem';
import { isLevelUnlocked } from '@/systems/ProgressionSystem';

export class LevelSelectScreen extends Container {
  private progression: PlayerProgression;
  private onLevelSelect: (levelId: number) => void;
  private onBack: () => void;
  private levelButtons: Map<number, Container> = new Map();

  constructor(
    progression: PlayerProgression,
    onLevelSelect: (levelId: number) => void,
    onBack: () => void
  ) {
    super();
    this.progression = progression;
    this.onLevelSelect = onLevelSelect;
    this.onBack = onBack;

    this.createUI();
  }

  private createUI(): void {
    // Fond semi-transparent avec gradient
    const bg = new Graphics();
    bg.rect(0, 0, 1080, 1920);
    bg.fill({ color: 0x0a0a0f, alpha: 0.98 });
    bg.eventMode = 'none'; // NE PAS bloquer les événements
    this.addChild(bg);

    // Activer le tri par zIndex
    this.sortableChildren = true;

    // Header sticky
    this.createHeader();

    // Grille de niveaux (2 colonnes, scroll vertical)
    this.createLevelGrid();
  }

  /**
   * Crée le header avec bouton retour et stats
   */
  private createHeader(): void {
    const headerBg = new Graphics();
    headerBg.rect(0, 0, 1080, 160);
    headerBg.fill({ color: 0x12121a, alpha: 0.95 });
    headerBg.eventMode = 'none'; // NE PAS bloquer les événements des enfants
    this.addChild(headerBg);

    // Bouton Retour "RETOUR" - ZONE CLIQUABLE PARFAITEMENT ALIGNÉE
    const backButton = this.createBackButton();
    // ✅ Position du container : on soustrait hitMargin (60px) pour que le bouton visible soit à (40, 40)
    backButton.position.set(40 - 60, 40 - 60); // Container à (-20, -20) pour bouton visible à (40, 40)
    backButton.zIndex = 1000; // TRÈS AU-DESSUS
    
    console.log('[LevelSelect] ═════════════════════════════════════');
    console.log('[LevelSelect] BackButton créé');
    console.log('[LevelSelect] Position container:', backButton.position.x, backButton.position.y);
    console.log('[LevelSelect] Position bouton visible: (40, 40)');
    console.log('[LevelSelect] Taille bouton: 180×80px');
    console.log('[LevelSelect] Zone cliquable: 300×200px (marges 60px)');
    console.log('[LevelSelect] Zone verte visible pour debug');
    console.log('[LevelSelect] EventMode:', backButton.eventMode);
    console.log('[LevelSelect] Interactive:', backButton.interactive);
    console.log('[LevelSelect] Callback onBack:', typeof this.onBack);
    console.log('[LevelSelect] ═════════════════════════════════════');
    
    this.addChild(backButton);

    // Titre "NIVEAUX"
    const titleStyle = new TextStyle({
      fontFamily: 'Nunito, system-ui, sans-serif',
      fontSize: 44,
      fontWeight: '900',
      fill: 0xffffff,
      letterSpacing: 2
    });
    const title = new Text({ text: 'NIVEAUX', style: titleStyle });
    title.anchor.set(0.5, 0.5);
    title.position.set(540, 80);
    this.addChild(title);

    // Stats totales (⭐ X/30)
    const totalStars = this.progression.totalStars;
    const maxStars = LEVELS.length * 3;
    const statsStyle = new TextStyle({
      fontFamily: 'Nunito, system-ui, sans-serif',
      fontSize: 32,
      fontWeight: '700',
      fill: 0xFFD700
    });
    const stats = new Text({
      text: `⭐ ${totalStars}/${maxStars}`,
      style: statsStyle
    });
    stats.anchor.set(1, 0.5);
    stats.position.set(1040, 80);
    this.addChild(stats);
  }

  /**
   * Crée le bouton retour - ZONE CLIQUABLE PARFAITEMENT ALIGNÉE
   */
  private createBackButton(): Container {
    const container = new Container();
    const buttonWidth = 180;
    const buttonHeight = 80;
    const hitMargin = 60; // ✅ Marge TRÈS généreuse (60px de chaque côté)
    
    // ✅ HitArea d'abord (zone cliquable totale)
    const totalWidth = buttonWidth + (hitMargin * 2);
    const totalHeight = buttonHeight + (hitMargin * 2);
    container.hitArea = new Rectangle(0, 0, totalWidth, totalHeight);
    
    // ✅ DEBUG: Zone cliquable visible (vert semi-transparent) - TOUJOURS VISIBLE
    const debugHitArea = new Graphics();
    debugHitArea.rect(0, 0, totalWidth, totalHeight);
    debugHitArea.fill({ color: 0x00ff00, alpha: 0.2 }); // Vert pour voir clairement
    debugHitArea.stroke({ color: 0x00ff00, width: 3, alpha: 0.6 });
    debugHitArea.eventMode = 'none';
    container.addChild(debugHitArea);
    
    // ✅ Bouton visible CENTRÉ dans la hitArea
    const bg = new Graphics();
    bg.roundRect(hitMargin, hitMargin, buttonWidth, buttonHeight, 40);
    bg.fill({ color: 0xffffff, alpha: 0.05 });
    bg.stroke({ color: 0xffffff, width: 3, alpha: 0.2 });
    bg.eventMode = 'none';
    container.addChild(bg);

    // Texte "RETOUR" - CENTRÉ dans le bouton visible
    const textStyle = new TextStyle({
      fontFamily: 'Nunito, system-ui, sans-serif',
      fontSize: 32,
      fontWeight: '900',
      fill: 0xffffff
    });
    const text = new Text({ text: 'RETOUR', style: textStyle });
    text.anchor.set(0.5);
    text.position.set(hitMargin + buttonWidth / 2, hitMargin + buttonHeight / 2);
    text.eventMode = 'none';
    container.addChild(text);

    // CONFIGURATION ÉVÉNEMENTS
    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.interactive = true;
    container.interactiveChildren = false;
    
    console.log('[BackButton] HitArea:', {
      width: totalWidth,
      height: totalHeight,
      buttonVisible: { x: hitMargin, y: hitMargin, w: buttonWidth, h: buttonHeight }
    });

    // ÉVÉNEMENTS avec logs détaillés
    container.on('pointerdown', (event) => {
      const localPos = container.toLocal(event.global);
      console.log('═════════════════════════════════════════');
      console.log('🔙 BOUTON RETOUR CLIQUÉ !');
      console.log('Position globale:', event.global.x, event.global.y);
      console.log('Position locale:', localPos.x, localPos.y);
      console.log('Container position:', container.x, container.y);
      console.log('HitArea:', container.hitArea);
      console.log('Callback onBack:', typeof this.onBack);
      console.log('═════════════════════════════════════════');
      event.stopPropagation();
      
      // Appeler le callback
      if (this.onBack) {
        this.onBack();
        console.log('✅ Callback onBack() appelé');
      } else {
        console.error('❌ Callback onBack non défini !');
      }
    });

    // Hover effect - TRÈS VISIBLE
    container.on('pointerover', () => {
      console.log('👆 Hover sur RETOUR');
      bg.clear();
      bg.roundRect(0, 0, buttonWidth, buttonHeight, 40);
      bg.fill({ color: 0x00F3FF, alpha: 0.2 });
      bg.stroke({ color: 0x00F3FF, width: 4 });
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.roundRect(0, 0, buttonWidth, buttonHeight, 40);
      bg.fill({ color: 0xffffff, alpha: 0.05 });
      bg.stroke({ color: 0xffffff, width: 3, alpha: 0.2 });
    });

    return container;
  }

  /**
   * Crée la grille de niveaux (2 colonnes) - TAILLE ENFANT XXL
   */
  private createLevelGrid(): void {
    const startY = 220;
    const gridCols = 2;
    const cardWidth = 500; // ENCORE PLUS LARGE
    const cardHeight = 280; // ENCORE PLUS HAUT
    const gapX = 40; // Espacement horizontal
    const gapY = 48; // Espacement vertical généreux
    const startX = (1080 - (cardWidth * gridCols + gapX)) / 2;

    LEVELS.forEach((level, index) => {
      const col = index % gridCols;
      const row = Math.floor(index / gridCols);
      const x = startX + col * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);

      const card = this.createLevelCard(level, x, y, cardWidth, cardHeight);
      this.addChild(card);
      this.levelButtons.set(level.id, card);
    });
  }

  /**
   * Crée une card de niveau (forme blob organique)
   */
  private createLevelCard(
    level: LevelConfig,
    x: number,
    y: number,
    width: number,
    height: number
  ): Container {
    const container = new Container();
    container.position.set(x, y);

    const isUnlocked = isLevelUnlocked(this.progression, level.id);
    const progress = this.progression.levels.get(level.id);
    const stars = progress?.stars || 0;

    // Fond de la card (forme arrondie organique)
    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, 28);
    
    if (isUnlocked) {
      bg.fill({ color: 0xffffff, alpha: 0.05 });
      bg.stroke({ color: 0xffffff, width: 2, alpha: 0.15 });
    } else {
      bg.fill({ color: 0x000000, alpha: 0.3 });
      bg.stroke({ color: 0xffffff, width: 2, alpha: 0.05 });
    }
    container.addChild(bg);

    if (!isUnlocked) {
      // Cadenas pour niveau verrouillé
      const lockStyle = new TextStyle({
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: 64,
        fill: 0x444444
      });
      const lock = new Text({ text: '🔒', style: lockStyle });
      lock.anchor.set(0.5);
      lock.position.set(width / 2, height / 2);
      container.addChild(lock);
      
      container.alpha = 0.4;
      return container;
    }

    // Numéro du niveau (ENCORE PLUS GROS)
    const numStyle = new TextStyle({
      fontFamily: 'Nunito, system-ui, sans-serif',
      fontSize: 80, // 64 → 80px (+25%)
      fontWeight: '900',
      fill: 0xffffff
    });
    const num = new Text({ text: `${level.id}`, style: numStyle });
    num.anchor.set(0, 0);
    num.position.set(32, 24);
    container.addChild(num);

    // Nom du niveau (plus gros)
    const nameStyle = new TextStyle({
      fontFamily: 'Nunito, system-ui, sans-serif',
      fontSize: 26, // 22 → 26px (+18%)
      fontWeight: '700',
      fill: 0xffffff,
      wordWrap: true,
      wordWrapWidth: width - 64
    });
    const name = new Text({ text: level.name, style: nameStyle });
    name.anchor.set(0, 0);
    name.position.set(32, 120);
    container.addChild(name);

    // Étoiles (en bas, plus grosses)
    const starY = height - 50;
    for (let i = 0; i < 3; i++) {
      const starStyle = new TextStyle({
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: 44, // 36 → 44px (+22%)
        fill: i < stars ? 0xFFD700 : 0x333333
      });
      const star = new Text({ text: '⭐', style: starStyle });
      star.anchor.set(0.5);
      star.position.set(width - 130 + i * 52, starY);
      container.addChild(star);
    }

    // Badge difficulté (coin haut droit, plus gros)
    const diffColor = {
      tutorial: 0x00ff88,
      easy: 0x00f3ff,
      medium: 0xffaa00,
      hard: 0xff4466
    }[level.difficulty];

    const diffBg = new Graphics();
    diffBg.roundRect(width - 140, 24, 120, 44, 22);
    diffBg.fill({ color: diffColor, alpha: 0.15 });
    diffBg.stroke({ color: diffColor, width: 2, alpha: 0.5 });
    container.addChild(diffBg);

    const diffStyle = new TextStyle({
      fontFamily: 'Nunito, system-ui, sans-serif',
      fontSize: 16, // 14 → 16px
      fontWeight: '700',
      fill: diffColor,
      letterSpacing: 1
    });
    const diffText = new Text({
      text: level.difficulty.toUpperCase(),
      style: diffStyle
    });
    diffText.anchor.set(0.5);
    diffText.position.set(width - 80, 46);
    container.addChild(diffText);

    // Interaction
    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.hitArea = {
      contains: (x: number, y: number) => {
        return x >= 0 && x <= width && y >= 0 && y <= height;
      }
    };

    container.on('pointerdown', () => {
      this.onLevelSelect(level.id);
    });

    // Hover effect
    container.on('pointerover', () => {
      bg.clear();
      bg.roundRect(0, 0, width, height, 28);
      bg.fill({ color: 0xffffff, alpha: 0.08 });
      bg.stroke({ color: 0x00f3ff, width: 3 });
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.roundRect(0, 0, width, height, 28);
      bg.fill({ color: 0xffffff, alpha: 0.05 });
      bg.stroke({ color: 0xffffff, width: 2, alpha: 0.15 });
    });

    return container;
  }

  /**
   * Met à jour l'affichage avec la nouvelle progression
   */
  updateProgression(progression: PlayerProgression): void {
    this.progression = progression;
    // Recrée toute l'UI
    this.removeChildren();
    this.levelButtons.clear();
    this.createUI();
  }
}
