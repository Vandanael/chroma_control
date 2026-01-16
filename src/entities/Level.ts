/**
 * Level.ts - Gestion des niveaux
 * Charge le data map et affiche le background visuel
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { CANVAS, SURFACES } from '@utils/Constants';
import { game } from '@core/Game';
import { materialSystem } from '@systems/MaterialSystem';
import { getLevelConfig, type LevelConfig } from '@/entities/LevelData';

// =============================================================================
// TYPES
// =============================================================================

// =============================================================================
// LEVEL CLASS
// =============================================================================

export class Level {
  private container: Container;
  private backgroundGraphics: Graphics;
  private labelsContainer: Container;
  private config: LevelConfig;
  
  constructor(levelId: number) {
    const config = getLevelConfig(levelId);
    if (!config) {
      throw new Error(`Level ${levelId} not found`);
    }
    this.config = config;
    this.container = new Container();
    this.backgroundGraphics = new Graphics();
    this.labelsContainer = new Container();
    
    this.container.addChild(this.backgroundGraphics);
    this.container.addChild(this.labelsContainer);
  }
  
  /**
   * Charge le niveau
   */
  async load(): Promise<void> {
    console.log(`[Level] Loading level: ${this.config.name}`);
    
    // Créer la data map selon les surfaces du niveau
    const { surfaces } = this.config;
    
    // SI UNIQUEMENT NEUTRAL : créer une data map vide (tout disponible)
    if (surfaces.length === 1 && surfaces[0] === 'Neutral') {
      materialSystem.createEmptyDataMap();
      console.log('[Level] Empty data map created (Neutral only)');
    } else {
      // SINON : créer la data map avec toutes les zones (test map)
      // (Dans une version finale, on chargerait des vraies images selon levelId)
      materialSystem.createTestDataMap();
      console.log('[Level] Test data map created (with materials)');
    }
    
    // Dessiner le background visuel selon les surfaces du niveau
    this.drawBackground();
    
    // Ajouter au layer background
    const backgroundLayer = game.application?.stage.children[0];
    if (backgroundLayer instanceof Container) {
      backgroundLayer.addChild(this.container);
    }
    
    console.log(`[Level] Level loaded: ${this.config.name}`);
  }
  
  /**
   * Dessine le background visuel avec les zones de surface
   * Adapté selon les surfaces présentes dans le niveau
   */
  private drawBackground(): void {
    const g = this.backgroundGraphics;
    g.clear();
    
    // Fond noir
    g.rect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
    g.fill({ color: 0x0a0a0a });
    
    // Dessiner les zones selon les surfaces du niveau
    const { surfaces } = this.config;
    
    // SI UNIQUEMENT NEUTRAL : ne rien dessiner de plus (fond noir suffit)
    if (surfaces.length === 1 && surfaces[0] === 'Neutral') {
      return; // Pas de zones visuelles, tout est disponible
    }
    
    let zoneIndex = 0;
    
    // Positions prédéfinies pour les zones (500×500 pour Solution 3 Équilibrée)
    const positions = [
      { x: 290, y: 250, w: 500, h: 500 },    // Centre haut
      { x: 290, y: 870, w: 500, h: 500 },    // Centre milieu
      { x: 290, y: 1370, w: 500, h: 500 }    // Centre bas
    ];
    
    // Dessiner chaque surface présente
    surfaces.forEach(surfaceName => {
      if (surfaceName === 'Neutral') return; // Le fond est déjà neutre
      
      const pos = positions[zoneIndex % positions.length];
      zoneIndex++;
      
      if (surfaceName === 'Sponge') {
        this.drawZone(g, pos.x, pos.y, pos.w, pos.h, SURFACES.SPONGE.color, 'ÉPONGE', 'Étalement réduit');
      } else if (surfaceName === 'Glass') {
        this.drawZone(g, pos.x, pos.y, pos.w, pos.h, SURFACES.GLASS.color, 'VERRE', 'Étalement augmenté');
      } else if (surfaceName === 'Void') {
        this.drawVoidZone(g, pos.x, pos.y, pos.w, pos.h);
      } else if (surfaceName === 'Metal') {
        this.drawZone(g, pos.x, pos.y, pos.w, pos.h, SURFACES.METAL.color, 'MÉTAL', 'Résistance moyenne');
      } else if (surfaceName === 'Sand') {
        this.drawZone(g, pos.x, pos.y, pos.w, pos.h, SURFACES.SAND.color, 'SABLE', 'Absorption lente');
      }
    });
  }
  
  /**
   * Dessine une zone avec indicateur visuel
   */
  private drawZone(
    g: Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    label: string,
    description: string
  ): void {
    // Fond légèrement teinté
    g.rect(x, y, width, height);
    g.fill({ color, alpha: 0.05 });
    
    // Contour subtil
    g.rect(x, y, width, height);
    g.stroke({ color, width: 2, alpha: 0.3 });
    
    // Label
    const style = new TextStyle({
      fontFamily: 'IBM Plex Mono',
      fontSize: 20,
      fill: color
    });
    
    const text = new Text({ text: label, style });
    text.position.set(x + 10, y + 10);
    text.alpha = 0.5;
    this.labelsContainer.addChild(text);
    
    // Description
    const descStyle = new TextStyle({
      fontFamily: 'IBM Plex Mono',
      fontSize: 14,
      fill: 0x666666
    });
    
    const descText = new Text({ text: description, style: descStyle });
    descText.position.set(x + 10, y + 35);
    this.labelsContainer.addChild(descText);
  }
  
  /**
   * Dessine une zone vide (interdite)
   */
  private drawVoidZone(
    g: Graphics,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    // Fond noir
    g.rect(x, y, width, height);
    g.fill({ color: 0x000000 });
    
    // Hachures diagonales
    const spacing = 20;
    g.stroke({ color: 0x333333, width: 1 });
    
    for (let i = -height; i < width + height; i += spacing) {
      const x1 = x + Math.max(0, i);
      const y1 = y + Math.max(0, -i);
      const x2 = x + Math.min(width, i + height);
      const y2 = y + Math.min(height, height - i);
      
      if (x1 < x + width && x2 > x && y1 < y + height && y2 > y) {
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
      }
    }
    g.stroke();
    
    // Contour rouge d'avertissement
    g.rect(x, y, width, height);
    g.stroke({ color: 0xFF0000, width: 2, alpha: 0.3 });
    
    // Label
    const style = new TextStyle({
      fontFamily: 'IBM Plex Mono',
      fontSize: 20,
      fill: 0xFF0000
    });
    
    const text = new Text({ text: 'ZONE INTERDITE', style });
    text.position.set(x + 10, y + 10);
    text.alpha = 0.5;
    this.labelsContainer.addChild(text);
  }
  
  /**
   * Retourne la config du niveau
   */
  getConfig(): LevelConfig {
    return this.config;
  }
  
  /**
   * Détruit le niveau
   */
  destroy(): void {
    this.container.destroy({ children: true });
    materialSystem.destroy();
    console.log(`[Level] Level destroyed: ${this.config.name}`);
  }
}

