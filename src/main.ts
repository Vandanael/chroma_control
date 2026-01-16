/**
 * Chroma Control - Main Entry Point
 * Organic Paint - MVP
 */

import { initOrbAnimation, setOrbHoverColor, cleanupOrbAnimation } from './render/orbAnimation';
import { game, GameState } from '@core/Game';
import { inputManager, InputEvent } from '@core/InputManager';
import { loop } from '@core/Loop';
import { PaintSystem } from '@systems/PaintSystem';
import { Level } from '@entities/Level';
import { PressureTank } from '@entities/PressureTank';
import { HUD } from '@ui/HUD';
import { GameOverScreen } from '@ui/GameOverScreen';
import { LevelSelectScreen } from '@ui/LevelSelectScreen';
import { TutorialOverlay } from '@ui/TutorialOverlay'; // ✅ Tutoriel interactif
import { ScoringSystem } from '@systems/ScoringSystem';
import { calculateStars } from '@systems/StarSystem';
import { loadProgression, updateLevelProgress, type PlayerProgression } from '@systems/ProgressionSystem';
import { audioSystem } from '@systems/AudioSystem';
import { haptics } from '@utils/Haptics';
import { pixelCounter } from '@utils/PixelCounter';
import { PlayerColorName } from '@utils/Constants';
import { Container } from 'pixi.js';

// =============================================================================
// STATE
// =============================================================================

let selectedColor: PlayerColorName = 'CYAN';
let selectedLevelId = 1; // Niveau sélectionné
let playerProgression: PlayerProgression | null = null;
let gameInitialized = false;
let paintSystem: PaintSystem | null = null;
let currentLevel: Level | null = null;
let pressureTank: PressureTank | null = null;
let hud: HUD | null = null;
let gameOverScreen: GameOverScreen | null = null;
let levelSelectScreen: LevelSelectScreen | null = null;
let scoringSystem: ScoringSystem | null = null;
let gameTimer = 0; // Temps restant en secondes
let gameStartTime = 0; // Timestamp de début de partie

// =============================================================================
// INITIALIZATION
// =============================================================================

function init(): void {
  console.log('[Chroma Control] Initializing...');

  // Charger la progression du joueur
  playerProgression = loadProgression();
  console.log('[Progression] Loaded:', playerProgression);

  // ✅ Vérifier si premier lancement (tutoriel)
  const hasSeenTutorial = localStorage.getItem('chroma_tutorial_seen');
  if (!hasSeenTutorial) {
    console.log('[Tutorial] First launch detected');
    // Le tutoriel sera affiché après initialisation du game
  }

  // Initialiser l'animation de l'orbe
  requestAnimationFrame(() => {
    setTimeout(() => {
      initOrbAnimation('planet-animation-container');
      console.log('[Orb] Animation initialized');
    }, 100);
  });

  // Wire UI pour les boutons de couleur et le bouton START
  wireStartScreen();
  
  // Écouter les changements d'état du jeu
  game.onStateChange(handleGameStateChange);
}

// =============================================================================
// UI WIRING
// =============================================================================

function wireStartScreen(): void {
  const colorButtons = document.querySelectorAll('.color-button');

  // Mapping des couleurs
  const colorMap: Record<PlayerColorName, string> = {
    CYAN: '#00F3FF',
    GREEN: '#00FF88',
    AMBER: '#FFAA00'
  };

  colorButtons.forEach((btn) => {
    const colorValue = (btn as HTMLElement).style.color;
    
    // Survol : changer la couleur de l'orbe temporairement
    btn.addEventListener('mouseenter', () => {
      setOrbHoverColor(colorValue);
    });
    
    btn.addEventListener('mouseleave', () => {
      // Revenir à la couleur sélectionnée
      setOrbHoverColor(colorMap[selectedColor]);
    });
    
    // Clic : sélectionner la couleur
    btn.addEventListener('click', () => {
      colorButtons.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedColor = ((btn as HTMLElement).dataset.color || 'CYAN') as PlayerColorName;
      console.log('[UI] Color selected:', selectedColor);
      
      // Mettre à jour l'orbe avec la couleur sélectionnée
      setOrbHoverColor(colorMap[selectedColor]);
      
      // Mettre à jour la couleur du bouton START
      updateStartButtonColor();
    });
  });

  // Sélectionner CYAN par défaut
  const cyanButton = document.getElementById('btn-color-cyan');
  if (cyanButton) {
    cyanButton.classList.add('selected');
  }

  // Bouton START -> ouvre la sélection de niveaux
  const startButton = document.getElementById('btn-start');
  if (startButton) {
    startButton.addEventListener('click', handleSelectLevelClick);
  }
  
  // Bouton DEBUG -> vider le cache
  const debugButton = document.getElementById('btn-debug-cache');
  if (debugButton) {
    debugButton.addEventListener('click', () => {
      if (confirm('Vider le cache et recharger la page ?')) {
        console.log('[Debug] Clearing localStorage...');
        localStorage.clear();
        console.log('[Debug] Reloading...');
        window.location.reload();
      }
    });
    
    debugButton.addEventListener('mouseenter', (e) => {
      (e.target as HTMLElement).style.background = 'rgba(255, 68, 102, 0.3)';
      (e.target as HTMLElement).style.transform = 'scale(1.1)';
    });
    
    debugButton.addEventListener('mouseleave', (e) => {
      (e.target as HTMLElement).style.background = 'rgba(255, 68, 102, 0.2)';
      (e.target as HTMLElement).style.transform = 'scale(1)';
    });
  }
  
  // =========================================================================
  // SETTINGS TOGGLES
  // =========================================================================
  setupSettingsToggles();
}

/**
 * ✅ Configure les toggles de settings (Leaderboard, Langue, Dark Mode)
 */
function setupSettingsToggles(): void {
  // Charger les settings depuis localStorage
  const settings = {
    leaderboard: localStorage.getItem('chroma_leaderboard') === 'true',
    language: localStorage.getItem('chroma_language') || 'FR',
    darkmode: localStorage.getItem('chroma_darkmode') === 'true'
  };
  
  console.log('[Settings] Loaded:', settings);
  
  // Appliquer les settings initiaux
  applySettings(settings);
  
  // Toggle Leaderboard
  const leaderboardToggle = document.getElementById('toggle-leaderboard');
  if (leaderboardToggle) {
    if (settings.leaderboard) {
      leaderboardToggle.classList.add('active');
    }
    leaderboardToggle.addEventListener('click', () => {
      leaderboardToggle.classList.toggle('active');
      const isActive = leaderboardToggle.classList.contains('active');
      localStorage.setItem('chroma_leaderboard', isActive.toString());
      console.log('[Settings] Leaderboard:', isActive);
    });
  }
  
  // Toggle Language
  const languageToggle = document.getElementById('toggle-language');
  if (languageToggle) {
    const langOptions = languageToggle.querySelectorAll('.lang-option');
    langOptions.forEach(opt => {
      if ((opt as HTMLElement).dataset.lang === settings.language) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
    
    languageToggle.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('lang-option')) {
        const newLang = target.dataset.lang || 'FR';
        langOptions.forEach(opt => opt.classList.remove('active'));
        target.classList.add('active');
        localStorage.setItem('chroma_language', newLang);
        console.log('[Settings] Language:', newLang);
        applyLanguage(newLang as 'FR' | 'EN');
      }
    });
  }
  
  // Toggle Dark Mode
  const darkmodeToggle = document.getElementById('toggle-darkmode');
  if (darkmodeToggle) {
    if (settings.darkmode) {
      darkmodeToggle.classList.add('active');
    }
    darkmodeToggle.addEventListener('click', () => {
      darkmodeToggle.classList.toggle('active');
      const isActive = darkmodeToggle.classList.contains('active');
      localStorage.setItem('chroma_darkmode', isActive.toString());
      console.log('[Settings] Dark Mode:', isActive);
      applyDarkMode(isActive);
      
      // Changer l'icône
      const icon = document.getElementById('darkmode-icon');
      if (icon) {
        icon.textContent = isActive ? '☀️' : '🌙';
      }
    });
  }
}

/**
 * ✅ Applique tous les settings au démarrage
 */
function applySettings(settings: { leaderboard: boolean; language: string; darkmode: boolean }): void {
  applyLanguage(settings.language as 'FR' | 'EN');
  applyDarkMode(settings.darkmode);
  
  // Update dark mode icon
  const icon = document.getElementById('darkmode-icon');
  if (icon) {
    icon.textContent = settings.darkmode ? '☀️' : '🌙';
  }
}

/**
 * ✅ Applique le mode sombre/clair
 */
function applyDarkMode(isDark: boolean): void {
  const html = document.documentElement;
  if (isDark) {
    html.removeAttribute('data-theme'); // Dark est le défaut
  } else {
    html.setAttribute('data-theme', 'light');
  }
}

/**
 * ✅ Applique la langue (textes de l'interface)
 */
function applyLanguage(lang: 'FR' | 'EN'): void {
  const translations: Record<'FR' | 'EN', Record<string, string>> = {
    FR: {
      title: 'CHROMA<br>CONTROL',
      subtitle: 'expand your color',
      play: 'JOUER',
      footer: 'Made by'
    },
    EN: {
      title: 'CHROMA<br>CONTROL',
      subtitle: 'expand your color',
      play: 'PLAY',
      footer: 'Made by'
    }
  };
  
  const t = translations[lang];
  
  // Titre
  const title = document.getElementById('start-title');
  if (title) title.innerHTML = t.title;
  
  // Bouton
  const playBtn = document.getElementById('btn-start');
  if (playBtn) playBtn.textContent = t.play;
  
  console.log('[Language] Applied:', lang);
}

function updateStartButtonColor(): void {
  const startButton = document.getElementById('btn-start');
  const colors: Record<PlayerColorName, string> = {
    CYAN: '#00F3FF',
    GREEN: '#00FF88',
    AMBER: '#FFAA00'
  };
  
  if (startButton) {
    startButton.style.borderColor = colors[selectedColor];
    startButton.style.color = colors[selectedColor];
  }
}

// =============================================================================
// GAME FLOW
// =============================================================================

/**
 * Ouvre l'écran de sélection de niveaux
 */
async function handleSelectLevelClick(): Promise<void> {
  console.log('[UI] Opening level select');
  
  if (!playerProgression) return;
  
  // Initialiser le jeu si pas encore fait
  if (!gameInitialized) {
    const gameContainer = document.getElementById('game-container');
    
    if (!gameContainer) {
      console.error('[Main] Game container not found');
      return;
    }
    
    try {
      await game.init(gameContainer);
      
      // Initialiser l'InputManager avec le canvas PixiJS
      const canvas = game.application?.canvas;
      if (canvas) {
        inputManager.init(canvas);
        inputManager.onInput(handleInput);
      }
      
      // Créer le PressureTank
      pressureTank = new PressureTank();
      
      // Créer le HUD
      hud = new HUD();
      hud.setPlayerColor(selectedColor);
      
      // Créer le GameOverScreen
      gameOverScreen = new GameOverScreen();
      gameOverScreen.setPlayerColor(selectedColor);
      
      // Créer le LevelSelectScreen
      levelSelectScreen = new LevelSelectScreen(
        playerProgression,
        handleLevelSelected,
        handleBackToStart
      );
      
      // Créer le ScoringSystem
      scoringSystem = new ScoringSystem();
      
      // Ajouter le HUD, GameOverScreen et LevelSelectScreen au layer UI
      const uiLayer = game.application?.stage.children[4];
      if (uiLayer instanceof Container) {
        uiLayer.addChild(hud.getContainer());
        uiLayer.addChild(gameOverScreen.getContainer());
        uiLayer.addChild(levelSelectScreen);
      }
      
      // Connecter les callbacks du GameOverScreen
      gameOverScreen.onReplay(() => {
        handleRestartLevel();
      });
      
      gameOverScreen.onMenu(() => {
        handleBackToLevelSelect();
      });
      
      gameOverScreen.onNext(() => {
        handleNextLevel();
      });
      
      // Connecter le PressureTank au HUD
      pressureTank.onChange((pressure, state) => {
        hud?.updatePressure(pressure, state);
      });
      
      // Connecter les boutons du HUD
      hud.onStop(() => {
        handleBackToLevelSelect();
      });
      
      hud.onReplay(() => {
        handleRestartLevel();
      });
      
      // Créer le PaintSystem avec le PressureTank
      paintSystem = new PaintSystem(pressureTank);
      
      // Ajouter le callback de mise à jour au loop
      loop.addCallback(updateGame);
      
      gameInitialized = true;
    } catch (error) {
      console.error('[Main] Failed to initialize game:', error);
      return;
    }
  }
  
  // Cacher l'écran de start
  const startScreen = document.getElementById('start-screen');
  if (startScreen) {
    startScreen.style.display = 'none';
  }
  
  // Nettoyer l'animation de l'orbe
  cleanupOrbAnimation();
  
  // Afficher l'écran de sélection
  if (levelSelectScreen) {
    levelSelectScreen.visible = true;
    console.log('[UI] LevelSelectScreen visible:', levelSelectScreen.visible);
    console.log('[UI] LevelSelectScreen children:', levelSelectScreen.children.length);
  } else {
    console.error('[UI] LevelSelectScreen is null!');
  }
  
  // Afficher le container de jeu (pour PixiJS)
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    gameContainer.style.display = 'block';
    console.log('[UI] Game container displayed');
  }
}

/**
 * ✅ Affiche le tutoriel si premier lancement
 */
function showTutorialIfFirstTime(onComplete: () => void): void {
  const hasSeenTutorial = localStorage.getItem('chroma_tutorial_seen');
  
  if (!hasSeenTutorial) {
    console.log('[Tutorial] Showing tutorial...');
    const tutorialOverlay = new TutorialOverlay();
    
    // Configurer les callbacks
    const completeHandler = () => {
      console.log('[Tutorial] Completed');
      localStorage.setItem('chroma_tutorial_seen', 'true');
      const uiLayer = game.getLayer('ui');
      if (uiLayer) {
        uiLayer.removeChild(tutorialOverlay.getContainer());
      }
      onComplete();
    };
    
    tutorialOverlay.setOnComplete(completeHandler);
    tutorialOverlay.setOnSkip(completeHandler); // Skip = même effet
    
    // Ajouter au layer UI
    const uiLayer = game.getLayer('ui');
    if (uiLayer) {
      uiLayer.addChild(tutorialOverlay.getContainer());
      tutorialOverlay.setPlayerColor(selectedColor);
      tutorialOverlay.showStep('tap'); // Afficher la première étape
    }
  } else {
    console.log('[Tutorial] Already seen, skipping');
    onComplete();
  }
}

/**
 * Lance un niveau spécifique
 */
async function handleLevelSelected(levelId: number): Promise<void> {
  console.log('[UI] Level selected:', levelId);
  
  selectedLevelId = levelId;
  
  // Cacher l'écran de sélection
  if (levelSelectScreen) {
    levelSelectScreen.visible = false;
  }
  
  // ✅ Afficher le tutoriel si premier lancement (niveau 1 uniquement)
  if (levelId === 1) {
    showTutorialIfFirstTime(async () => {
      await startLevel(levelId);
    });
  } else {
    await startLevel(levelId);
  }
}

/**
 * ✅ Démarre réellement le niveau (après tutoriel si applicable)
 */
async function startLevel(levelId: number): Promise<void> {
  // Charger le niveau
  currentLevel = new Level(levelId);
  await currentLevel.load();
  
  // Définir la couleur du joueur
  game.setPlayerColor(selectedColor);
  
  // Initialiser le timer
  gameTimer = currentLevel.getConfig().timeLimit;
  gameStartTime = performance.now();
  hud?.updateTimer(gameTimer);
  
  // Reset la pression
  pressureTank?.reset();
  
  // Clear le paint
  paintSystem?.clear();
  
  // Démarrer le jeu
  game.start();
  loop.start();
}

/**
 * Retour à l'écran de start
 */
function handleBackToStart(): void {
  console.log('[UI] ========================================');
  console.log('[UI] BACK TO START SCREEN CALLED');
  console.log('[UI] ========================================');
  
  // Cacher l'écran de sélection
  if (levelSelectScreen) {
    levelSelectScreen.visible = false;
    console.log('[UI] LevelSelectScreen hidden');
  } else {
    console.error('[UI] LevelSelectScreen is null!');
  }
  
  // Afficher l'écran de start
  const startScreen = document.getElementById('start-screen');
  if (startScreen) {
    startScreen.style.display = 'flex';
    console.log('[UI] Start screen displayed');
  } else {
    console.error('[UI] Start screen element not found!');
  }
  
  // Cacher le container de jeu
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    gameContainer.style.display = 'none';
    console.log('[UI] Game container hidden');
  }
  
  // Réinitialiser l'orbe
  initOrbAnimation('planet-animation-container');
  console.log('[UI] Orb animation reinitialized');
}

/**
 * Retour à l'écran de sélection de niveaux
 */
function handleBackToLevelSelect(): void {
  console.log('[UI] Back to level select');
  
  // Arrêter le jeu
  game.gameOver();
  loop.stop();
  
  // Cacher le HUD et GameOverScreen
  hud?.setButtonsVisible(false);
  gameOverScreen?.hide();
  
  // Détruire le niveau actuel
  if (currentLevel) {
    currentLevel.destroy();
    currentLevel = null;
  }
  
  // Clear le paint
  paintSystem?.clear();
  
  // Afficher l'écran de sélection
  if (levelSelectScreen && playerProgression) {
    levelSelectScreen.updateProgression(playerProgression);
    levelSelectScreen.visible = true;
  }
}

/**
 * Relance le niveau actuel
 */
function handleRestartLevel(): void {
  console.log('[UI] Restart level');
  
  game.restart();
  pressureTank?.reset();
  
  if (currentLevel) {
    gameTimer = currentLevel.getConfig().timeLimit;
    gameStartTime = performance.now();
    hud?.updateTimer(gameTimer);
  }
  
  gameOverScreen?.hide();
}

/**
 * Passe au niveau suivant
 */
async function handleNextLevel(): Promise<void> {
  console.log('[UI] Next level');
  
  // Détruire le niveau actuel
  if (currentLevel) {
    currentLevel.destroy();
  }
  
  // Charger le niveau suivant
  const nextLevelId = selectedLevelId + 1;
  await handleLevelSelected(nextLevelId);
  
  // Cacher l'écran de fin
  gameOverScreen?.hide();
}

function handleGameStateChange(state: GameState): void {
  console.log('[Main] Game state changed:', state);
  
  const startScreen = document.getElementById('start-screen');
  const gameContainer = document.getElementById('game-container');
  
  switch (state) {
    case 'START':
      if (startScreen) startScreen.style.display = 'flex';
      if (gameContainer) gameContainer.style.display = 'none';
      // Arrêter le loop
      loop.stop();
      // Cacher les boutons
      hud?.setButtonsVisible(false);
      // Nettoyer le paint
      paintSystem?.clear();
      // Reset le PressureTank
      pressureTank?.reset();
      // Reset le timer
      if (currentLevel) {
        gameTimer = currentLevel.getConfig().timeLimit;
        gameStartTime = 0;
        hud?.updateTimer(gameTimer);
      }
      // Cacher l'écran de fin
      gameOverScreen?.hide();
      // Réinitialiser l'orbe
      initOrbAnimation('planet-animation-container');
      break;
      
    case 'PLAYING':
      if (startScreen) startScreen.style.display = 'none';
      if (gameContainer) gameContainer.style.display = 'block';
      // Afficher les boutons
      hud?.setButtonsVisible(true);
      // Démarrer le loop si pas déjà en cours
      if (!loop.running) {
        loop.start();
      }
      break;
      
    case 'PAUSED':
      loop.stop();
      break;
      
    case 'GAME_OVER':
      loop.stop();
      hud?.setButtonsVisible(false);
      // L'écran de fin est déjà affiché par endGame()
      break;
  }
}

// =============================================================================
// INPUT HANDLING
// =============================================================================

function handleInput(event: InputEvent): void {
  if (game.state !== 'PLAYING' || !paintSystem) return;
  
  switch (event.type) {
    case 'hold-start':
      paintSystem.startSpray(event.x, event.y);
      break;
      
    case 'hold-move':
      paintSystem.continueSpray(event.x, event.y);
      break;
      
    case 'hold-end':
      paintSystem.endSpray();
      break;
      
    case 'double-tap':
      paintSystem.triggerBomb(event.x, event.y);
      break;
      
    case 'tap':
      // Un tap simple pourrait déclencher un petit splat ou rien
      // Pour l'instant, on fait un petit spray au point de tap
      paintSystem.startSpray(event.x, event.y);
      paintSystem.endSpray();
      break;
  }
}

// =============================================================================
// GAME UPDATE
// =============================================================================

function updateGame(deltaTime: number): void {
  if (game.state !== 'PLAYING') return;
  
  // Mettre à jour le PressureTank
  pressureTank?.update(deltaTime);
  
  // Mettre à jour le système de peinture (particules, etc.)
  paintSystem?.update(deltaTime);
  
  // Mettre à jour le timer
  gameTimer -= deltaTime / 1000;
  const timeUsed = (performance.now() - gameStartTime) / 1000;
  
  if (gameTimer <= 0) {
    gameTimer = 0;
    endGame(false, timeUsed);
    return;
  }
  
  hud?.updateTimer(gameTimer);
  
  // Vérifier les conditions de victoire (toutes les secondes)
  if (Math.floor(timeUsed) !== Math.floor((timeUsed - deltaTime / 1000))) {
    checkVictoryCondition(timeUsed);
  }
}

/**
 * Vérifie les conditions de victoire
 */
function checkVictoryCondition(timeUsed: number): void {
  if (!scoringSystem || !pressureTank || !currentLevel) return;
  
  // Obtenir la couverture
  const coverage = pixelCounter.forceRecalculate();
  if (!coverage) return;
  
  // Vérifier si on a gagné
  if (scoringSystem.checkVictory(coverage.coverageRatio)) {
    endGame(true, timeUsed);
  }
}

/**
 * Termine la partie et affiche l'écran de fin
 */
function endGame(isVictory: boolean, timeUsed: number): void {
  if (!scoringSystem || !pressureTank || !currentLevel || !gameOverScreen || !playerProgression) return;
  
  // Arrêter le jeu
  game.gameOver();
  loop.stop();
  hud?.setButtonsVisible(false);
  
  // Calculer le score
  const coverage = pixelCounter.forceRecalculate();
  if (!coverage) return;
  
  const score = scoringSystem.calculateCurrentScore(
    pressureTank,
    timeUsed,
    currentLevel.getConfig().timeLimit
  );
  
  if (!score) return;
  
  // Calculer les métriques pour les étoiles
  const metrics = scoringSystem.calculateMetrics(pressureTank);
  if (!metrics) return;
  
  // Calculer les étoiles
  const levelConfig = currentLevel.getConfig();
  const starResult = calculateStars(
    levelConfig,
    metrics.coveragePercent,
    metrics.overflowPercent,
    metrics.pressurePercent
  );
  
  // Sauvegarder la progression
  if (isVictory) {
    updateLevelProgress(
      playerProgression,
      selectedLevelId,
      starResult.totalStars,
      score.total,
      timeUsed
    );
    console.log('[Progression] Level completed:', selectedLevelId, 'Stars:', starResult.totalStars);
  }
  
  // Jouer le son de complétion si victoire
  if (isVictory) {
    audioSystem.play('completion');
    haptics.vibrate('completion');
  }
  
  // Afficher l'écran de fin
  gameOverScreen.show(
    isVictory,
    score,
    coverage.coverageRatio,
    timeUsed,
    pressureTank.pressure,
    isVictory ? starResult : undefined
  );
}

// =============================================================================
// START
// =============================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
