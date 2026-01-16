/**
 * Haptics.ts - Gestion des vibrations tactiles
 * Utilise la Vibration API du navigateur
 */

// =============================================================================
// TYPES
// =============================================================================

export type HapticPattern = 'spray' | 'bomb' | 'overheat' | 'completion';

// =============================================================================
// HAPTICS CLASS
// =============================================================================

class Haptics {
  private isSupported: boolean;
  private isEnabled: boolean = true;
  
  constructor() {
    // Vérifier si la Vibration API est supportée
    this.isSupported = 'vibrate' in navigator;
    
    if (!this.isSupported) {
      console.warn('[Haptics] Vibration API not supported');
    }
  }
  
  /**
   * Active ou désactive les vibrations
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
  
  /**
   * Vérifie si les vibrations sont activées
   */
  get enabled(): boolean {
    return this.isEnabled && this.isSupported;
  }
  
  /**
   * Vibre avec un pattern spécifique
   */
  vibrate(pattern: HapticPattern): void {
    if (!this.enabled) return;
    
    switch (pattern) {
      case 'spray':
        // Vibration légère continue (10ms toutes les 50ms)
        this.startContinuousVibration(10, 50);
        break;
        
      case 'bomb':
        // Impulsion forte (100ms)
        navigator.vibrate(100);
        break;
        
      case 'overheat':
        // Double pulse (50ms, pause 30ms, 50ms)
        navigator.vibrate([50, 30, 50]);
        break;
        
      case 'completion':
        // Triple pulse court (30ms, pause 20ms, 30ms, pause 20ms, 30ms)
        navigator.vibrate([30, 20, 30, 20, 30]);
        break;
    }
  }
  
  /**
   * Arrête toutes les vibrations
   */
  stop(): void {
    if (!this.isSupported) return;
    navigator.vibrate(0);
  }
  
  /**
   * Démarre une vibration continue
   */
  private continuousVibrationInterval: number | null = null;
  
  private startContinuousVibration(duration: number, interval: number): void {
    // Arrêter toute vibration continue existante
    this.stopContinuousVibration();
    
    // Démarrer la vibration
    navigator.vibrate(duration);
    
    // Répéter à intervalles réguliers
    this.continuousVibrationInterval = window.setInterval(() => {
      if (this.enabled) {
        navigator.vibrate(duration);
      }
    }, interval);
  }
  
  /**
   * Arrête la vibration continue
   */
  stopContinuousVibration(): void {
    if (this.continuousVibrationInterval !== null) {
      clearInterval(this.continuousVibrationInterval);
      this.continuousVibrationInterval = null;
    }
    this.stop();
  }
  
  /**
   * Vibre avec un pattern personnalisé
   */
  vibratePattern(pattern: number | number[]): void {
    if (!this.enabled) return;
    navigator.vibrate(pattern);
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const haptics = new Haptics();
