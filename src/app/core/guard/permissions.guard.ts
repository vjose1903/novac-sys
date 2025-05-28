import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgxPermissionsService } from 'ngx-permissions';
import { CurrentUserService } from '../services/current-user.service';
import { firstValueFrom } from 'rxjs';
import { filter, timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PermissionsGuardService {
  private readonly DEFAULT_REDIRECT = '/admin/dashboard';
  private readonly PERMISSIONS_TIMEOUT = 10000;

  private readonly permissionsService = inject(NgxPermissionsService);
  private readonly router = inject(Router);
  private readonly currentUserService = inject(CurrentUserService);

  /**
   * Espera a que los permisos estén cargados antes de verificarlos
   */
  private async waitForPermissionsToLoad(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.currentUserService.currentUser$.pipe(
          filter(user => user !== null && user !== undefined),
          timeout(this.PERMISSIONS_TIMEOUT)
        )
      );
      return true;
    } catch (error) {
      console.warn('Timeout esperando permisos del usuario:', error);
      return false;
    }
  }

  /**
   * Verifica permisos de forma genérica
   */
  private async verifyPermissions(permissions: string[], redirectTo: string, requireAll: boolean): Promise<boolean> {
    const permissionsLoaded = await this.waitForPermissionsToLoad();

    if (!permissionsLoaded) {
      if (requireAll) {
        console.warn('No se pudieron cargar los permisos, redirigiendo a dashboard');
      }
      this.router.navigate([redirectTo]);
      return false;
    }

    const checkMethod = requireAll ? (permission: string) => !!this.permissionsService.getPermission(permission) : (permission: string) => !!this.permissionsService.getPermission(permission);

    const hasRequiredPermissions = requireAll ? permissions.every(checkMethod) : permissions.some(checkMethod);

    if (!hasRequiredPermissions) {
      if (!requireAll) {
        console.warn(`%c Usuario no tiene permisos: ${permissions.join(', ')}`, 'color: red');
      }
      this.router.navigate([redirectTo]);
      return false;
    }

    return true;
  }

  /**
   * Verifica si el usuario tiene al menos uno de los permisos especificados
   */
  async hasPermissions(permissions: string[], redirectTo: string = this.DEFAULT_REDIRECT): Promise<boolean> {
    return this.verifyPermissions(permissions, redirectTo, false);
  }

  /**
   * Verifica si el usuario tiene TODOS los permisos especificados
   */
  async hasAllPermissions(permissions: string[], redirectTo: string = this.DEFAULT_REDIRECT): Promise<boolean> {
    return this.verifyPermissions(permissions, redirectTo, true);
  }

  /**
   * Crea un guard funcional para verificar permisos
   */
  static createPermissionGuard(permissions: string[], redirectTo: string = '/admin/dashboard', requireAll: boolean = false) {
    return async () => {
      const permissionsGuardService = inject(PermissionsGuardService);
      return requireAll ? await permissionsGuardService.hasAllPermissions(permissions, redirectTo) : await permissionsGuardService.hasPermissions(permissions, redirectTo);
    };
  }

  /**
   * Verifica permisos sin redirección automática (síncrono)
   * Solo usar cuando estés seguro de que los permisos ya están cargados
   */
  checkPermissions(permissions: string[], requireAll: boolean = false): boolean {
    const checkMethod = (permission: string) => !!this.permissionsService.getPermission(permission);

    return requireAll ? permissions.every(checkMethod) : permissions.some(checkMethod);
  }
}
