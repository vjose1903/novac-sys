import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { fun } from './functions.service';

export interface NavigationState {
  isNavigating: boolean;
  currentRoute: string;
  pendingRoute?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private router = inject(Router);

  private navigationState$ = new BehaviorSubject<NavigationState>({
    isNavigating: false,
    currentRoute: '',
  });

  constructor() {
    this.initializeNavigationState();
  }

  private initializeNavigationState() {
    this.navigationState$.next({
      isNavigating: false,
      currentRoute: this.router.url,
    });
  }

  /**
   * Obtiene el estado actual de navegación
   */
  getNavigationState(): Observable<NavigationState> {
    return this.navigationState$.asObservable();
  }

  /**
   * Navega a una ruta con validación de componentes
   */
  async navigateTo(route: string, options?: { skipConfirmation?: boolean; forceNavigation?: boolean }): Promise<boolean> {
    const currentState = this.navigationState$.value;

    // Si ya estamos en la ruta, no hacer nada
    if (currentState.currentRoute === route) {
      fun.toastWarning('Ya se encuentra en este módulo.', 'AVISO');
      return false;
    }

    // Si hay una navegación en progreso, esperar
    if (currentState.isNavigating) {
      return false;
    }

    // Actualizar estado de navegación
    this.navigationState$.next({ ...currentState, isNavigating: true, pendingRoute: route });

    try {
      // Si se fuerza la navegación o se omite confirmación, navegar directamente
      if (options?.forceNavigation || options?.skipConfirmation) {
        await this.performNavigation(route);
        return true;
      }

      // Intentar navegar (el guard se encargará de la validación)
      // Usar navigate en lugar de navigateByUrl para que respete los guards
      const success = await this.router.navigate([route]);

      if (success) {
        this.updateNavigationState(route);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error durante la navegación:', error);
      return false;
    } finally {
      // Limpiar estado de navegación
      this.navigationState$.next({ ...this.navigationState$.value, isNavigating: false, pendingRoute: undefined });
    }
  }

  /**
   * Realiza la navegación efectiva
   */
  private async performNavigation(route: string): Promise<void> {
    await this.router.navigate([route]);
    this.updateNavigationState(route);
  }

  /**
   * Actualiza el estado de navegación
   */
  private updateNavigationState(route: string): void {
    this.navigationState$.next({
      isNavigating: false,
      currentRoute: route,
      pendingRoute: undefined,
    });
  }

  /**
   * Cancela la navegación pendiente
   */
  cancelNavigation(): void {
    const currentState = this.navigationState$.value;
    this.navigationState$.next({
      ...currentState,
      isNavigating: false,
      pendingRoute: undefined,
    });
  }

  /**
   * Obtiene la ruta actual
   */
  getCurrentRoute(): string {
    return this.navigationState$.value.currentRoute;
  }

  /**
   * Verifica si hay una navegación en progreso
   */
  isNavigating(): boolean {
    return this.navigationState$.value.isNavigating;
  }
}
