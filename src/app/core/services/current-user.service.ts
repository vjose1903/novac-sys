import { Injectable } from '@angular/core';
import { NgxPermissionsService } from 'ngx-permissions';
import { BehaviorSubject, Observable } from 'rxjs';
import { Permisos } from '../typescript/permisos';
import { RequestC } from '../typescript/requests';
import { fun } from './functions.service';

@Injectable({
  providedIn: 'root',
})
export class CurrentUserService {
  requestClass = new RequestC();
  private validationPromise: Promise<any> | null = null;

  // Inicializar con null para poder detectar cuando no hay usuario cargado
  private _currentUser: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private permissionsService: NgxPermissionsService) {
    // Registrar instancia para poder resetearla desde logout
    fun.setCurrentUserServiceInstance(this);
  }

  nextCurrentUser(nextValue) {
    this._currentUser.next(nextValue);
  }

  get currentUser$(): Observable<any> {
    return this._currentUser.asObservable();
  }

  validateUser() {
    // Si ya hay una validación en progreso, retornar la misma promesa
    if (this.validationPromise) {
      return this.validationPromise;
    }

    this.validationPromise = new Promise<any>((resolve, reject) => {
      const token = fun.getAuthToken();

      if (token) {
        this.requestClass
          .getAll({ afterPath: 'auth/validate_token' })
          .then(res => {
            this.setUser(res.data).then(() => {
              this.validationPromise = null; // Limpiar después del éxito
              resolve(res.data);
            });
          })
          .catch(err => {
            console.log('%c Error en validación:', 'color: red', err);

            this.validationPromise = null; // Limpiar después del error
            reject({ razon: 'sesion_expired' });
          });
      } else {
        this.validationPromise = null;
        reject({ razon: 'no_token' });
      }
    });

    return this.validationPromise;
  }

  setUser(currentUser) {
    return new Promise<any>(resolve => {
      this.nextCurrentUser(currentUser);

      const permisos = currentUser?.permisos ? currentUser.permisos.map(perm => perm.permiso) : [];

      this.permissionsService.loadPermissions(permisos);
      resolve(true);
    });
  }

  // Método para limpiar el cache (llamado desde logout)
  clearValidationCache() {
    this.validationPromise = null;
    this.nextCurrentUser(null);
    this.permissionsService.flushPermissions(); // Limpiar permisos también
  }
}
