import { Injectable } from '@angular/core';
import { NgxPermissionsService } from 'ngx-permissions';
import { RequestC } from '../typescript/requests';
import { fun } from './functions.service';

@Injectable({
  providedIn: 'root',
})
export class CurrentUserService {
  currentUser = null;

  requestClass = new RequestC();
  constructor(private permissionsService: NgxPermissionsService) {}

  validateUser() {
    return new Promise<any>((resolve, reject) => {
      const token = fun.getAuthToken();

      if (token) {
        this.requestClass
          .getAll({ afterPath: 'auth/validate_token' })
          .then((res) => this.setUser(res.data).then(() => resolve(res.data)))
          .catch((err) => reject({ razon: 'sesion_expired' }));
      } else {
        reject({ razon: 'no_token' });
      }
    });
  }

  setUser(currentUser) {
    return new Promise<any>((resolve) => {
      this.currentUser = currentUser;

      const permisos = currentUser?.permisos ? currentUser.permisos.map((perm) => perm.permiso) : [];

      this.permissionsService.loadPermissions(permisos);

      resolve(true);
    });
  }

  getUser() {
    return this.currentUser;
  }
}
