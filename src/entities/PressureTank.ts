/**
 * PressureTank.ts - Ressource de pression du joueur
 * Gère la consommation et la régénération
 */

import { PRESSURE } from '@utils/Constants';
import { audioSystem } from '@systems/AudioSystem';
import { haptics } from '@utils/Haptics';

// =============================================================================
// TYPES
// =============================================================================

export type PressureState = 'normal' | 'low' | 'overheat';

type PressureCallback = (pressure: number, state: PressureState) => void;

// =============================================================================
// PRESSURE TANK CLASS
// =============================================================================

export class PressureTank {
  private _pressure: number = PRESSURE.MAX;
  private _state: PressureState = 'normal';
  private _isConsuming = false;
  private overheatTimer = 0;
  
  // Callbacks
  private onChangeCallbacks: PressureCallback[] = [];
  
  // ==========================================================================
  // GETTERS
  // ==========================================================================
  
  get pressure(): number {
    return this._pressure;
  }
  
  get percentage(): number {
    return this._pressure / PRESSURE.MAX;
  }
  
  get state(): PressureState {
    return this._state;
  }
  
  get isOverheated(): boolean {
    return this._state === 'overheat';
  }
  
  get canSpray(): boolean {
    return this._state !== 'overheat' && this._pressure > 0;
  }
  
  get canBomb(): boolean {
    return this._state !== 'overheat' && this._pressure >= PRESSURE.BOMB_CONSUMPTION;
  }
  
  // ==========================================================================
  // CONSUMPTION
  // ==========================================================================
  
  /**
   * Démarre la consommation (spray)
   */
  startConsuming(): void {
    if (this._state === 'overheat') return;
    this._isConsuming = true;
  }
  
  /**
   * Arrête la consommation
   */
  stopConsuming(): void {
    this._isConsuming = false;
  }
  
  /**
   * Consomme de la pression pour une bombe
   * @returns true si la bombe a pu être lancée
   */
  consumeBomb(): boolean {
    if (!this.canBomb) return false;
    
    this._pressure = Math.max(0, this._pressure - PRESSURE.BOMB_CONSUMPTION);
    this.updateState();
    this.notifyChange();
    
    return true;
  }
  
  // ==========================================================================
  // UPDATE
  // ==========================================================================
  
  /**
   * Met à jour la pression (appelé chaque frame)
   * @param deltaTime Temps écoulé en ms
   */
  update(deltaTime: number): void {
    const dt = deltaTime / 1000; // Convertir en secondes
    
    // Si en surchauffe, décrémenter le timer
    if (this._state === 'overheat') {
      this.overheatTimer -= deltaTime;
      
      if (this.overheatTimer <= 0) {
        // Fin de la surchauffe
        this._state = 'normal';
        this._pressure = PRESSURE.MAX * 0.3; // Récupère 30% de pression
        this.notifyChange();
      }
      return;
    }
    
    // Consommation ou régénération
    if (this._isConsuming) {
      // Consommer la pression (spray)
      this._pressure = Math.max(0, this._pressure - PRESSURE.SPRAY_CONSUMPTION * dt);
      
      // Vérifier la surchauffe
      if (this._pressure <= 0) {
        this.triggerOverheat();
      } else {
        this.updateState();
      }
      
      this.notifyChange();
    } else {
      // Régénérer la pression
      if (this._pressure < PRESSURE.MAX) {
        this._pressure = Math.min(PRESSURE.MAX, this._pressure + PRESSURE.REGEN_RATE * dt);
        this.updateState();
        this.notifyChange();
      }
    }
  }
  
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  
  /**
   * Met à jour l'état basé sur la pression
   */
  private updateState(): void {
    if (this._state === 'overheat') return;
    
    if (this._pressure <= PRESSURE.MAX * 0.2) {
      this._state = 'low';
    } else {
      this._state = 'normal';
    }
  }
  
  /**
   * Déclenche la surchauffe
   */
  private triggerOverheat(): void {
    this._state = 'overheat';
    this._pressure = 0;
    this.overheatTimer = PRESSURE.OVERHEAT_DURATION;
    this._isConsuming = false;
    
    // Jouer le son de surchauffe
    audioSystem.play('overheat');
    
    // Double pulse de vibration pour la surchauffe
    haptics.vibrate('overheat');
    
    console.log('[PressureTank] OVERHEAT!');
  }
  
  // ==========================================================================
  // CALLBACKS
  // ==========================================================================
  
  /**
   * Ajoute un callback pour les changements de pression
   */
  onChange(callback: PressureCallback): void {
    this.onChangeCallbacks.push(callback);
  }
  
  /**
   * Notifie les callbacks
   */
  private notifyChange(): void {
    for (const callback of this.onChangeCallbacks) {
      callback(this._pressure, this._state);
    }
  }
  
  // ==========================================================================
  // RESET
  // ==========================================================================
  
  /**
   * Réinitialise la pression
   */
  reset(): void {
    this._pressure = PRESSURE.MAX;
    this._state = 'normal';
    this._isConsuming = false;
    this.overheatTimer = 0;
    this.notifyChange();
  }
}
