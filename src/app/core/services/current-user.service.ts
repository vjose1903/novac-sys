import { Injectable } from '@angular/core';
import { NgxPermissionsService } from 'ngx-permissions';
import { BehaviorSubject } from 'rxjs';
import { Permisos } from '../typescript/permisos';
import { RequestC } from '../typescript/requests';
import { fun } from './functions.service';

@Injectable({
  providedIn: 'root',
})
export class CurrentUserService {
  requestClass = new RequestC();
  CURENTUSER = new BehaviorSubject<any>(null);

  constructor(private permissionsService: NgxPermissionsService) {}

  nextCurrentUser(nextValue) {
    this.CURENTUSER.next(nextValue);
  }

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
      this.nextCurrentUser(currentUser);
      const permisos = currentUser?.permisos ? currentUser.permisos.map((perm) => perm.permiso) : [];

      this.permissionsService.loadPermissions(permisos);

      this.permissionsService.hasPermission(Permisos.user.create).then((res) => {
        setTimeout(() => resolve(true), 100);
      });
    });
  }

  // getUser() {
  //   fun.logOrange('currentUser >>>> ', this.currentUser);
  //   return this.currentUser;
  // }
}
