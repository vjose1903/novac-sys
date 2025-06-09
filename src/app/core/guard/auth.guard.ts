import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { fun } from '../services/functions.service';
import { CurrentUserService } from '../services/current-user.service';
import { ConfigurationService } from '../services/configuration.service';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard {
  private readonly router = inject(Router);
  private readonly currentUserService = inject(CurrentUserService);
  private readonly configurationService = inject(ConfigurationService);

  private validationPromise: Promise<boolean> | null = null;
  private isValidated = false;

  constructor() {
    // Registrar instancia para poder resetearla desde logout
    fun.setAuthGuardInstance(this);
  }

  async canActivate(): Promise<boolean> {
    const token = fun.getAuthToken();

    if (fun.isEmpty(token)) {
      return this.handleInvalidToken();
    }

    // Verificar configuración y realizar validación
    await this.ensureConfigLoaded();

    // Si ya está validado, retornar true inmediatamente
    if (this.isValidated) return true;

    // Si ya hay una validación en progreso, esperar su resultado
    if (this.validationPromise) return this.validationPromise;

    // Crear nueva promesa de validación
    this.validationPromise = this.performValidation();
    return this.validationPromise;
  }

  /**
   * Maneja el caso cuando no hay token válido
   */
  private handleInvalidToken(): boolean {
    this.resetValidation();
    fun.logout().then(() => this.router.navigateByUrl('/auth/login'));
    return false;
  }

  /**
   * Asegura que la configuración esté cargada antes de continuar
   */
  private async ensureConfigLoaded(): Promise<void> {
    if (this.configurationService.isConfigLoaded()) return;

    await firstValueFrom(this.configurationService.configLoaded$.pipe(filter(loaded => loaded)));
  }

  /**
   * Realiza la validación del usuario
   */
  private async performValidation(): Promise<boolean> {
    try {
      await this.currentUserService.validateUser();
      this.setValidationState(true);
      return true;
    } catch (error) {
      this.setValidationState(false);
      return this.handleValidationError(error);
    }
  }

  /**
   * Establece el estado de validación
   */
  private setValidationState(isValid: boolean): void {
    this.isValidated = isValid;
    this.validationPromise = null;
  }

  /**
   * Maneja errores de validación
   */
  private handleValidationError(error: any): boolean {
    const shouldRedirectToLogin = error.razon === 'sesion_expired' || error.razon === 'no_token';

    if (shouldRedirectToLogin) {
      fun.logout().then(() => this.router.navigateByUrl('/auth/login'));
    }

    return false;
  }

  /**
   * Resetea el estado de validación (llamado desde logout)
   */
  resetValidation(): void {
    this.isValidated = false;
    this.validationPromise = null;
  }
}
