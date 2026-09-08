import { Injectable } from '@angular/core';
import { fun } from '@core/services/functions.service';
import { PermisosC, RolesC } from '../roles';

interface CatalogRequestState<T> {
  data: T | null;
  inflight: Promise<T> | null;
}

interface CatalogOptions {
  force?: boolean;
}

@Injectable({ providedIn: 'root' })
export class RolesCatalogService {
  private readonly rolesClass = new RolesC();
  private readonly permisosClass = new PermisosC();
  private readonly rolesState: CatalogRequestState<any[]> = { data: null, inflight: null };
  private readonly permisosState: CatalogRequestState<any[]> = { data: null, inflight: null };

  getRoles(options: CatalogOptions = {}) {
    return this.getCatalog(this.rolesState, () => this.rolesClass.getAll().then(res => res.data || []), options);
  }

  getPermisosAcciones(options: CatalogOptions = {}) {
    return this.getCatalog(this.permisosState, () => this.permisosClass.getAll({ parameters: { permisos_acciones: true } }).then(res => res.data || []), options);
  }

  invalidateRoles() {
    this.rolesState.data = null;
    this.rolesState.inflight = null;
  }

  invalidatePermisos() {
    this.permisosState.data = null;
    this.permisosState.inflight = null;
  }

  private async getCatalog<T>(state: CatalogRequestState<T>, loader: () => Promise<T>, options: CatalogOptions) {
    if (state.data && !options.force) return fun.deepCloning(state.data);
    if (state.inflight && !options.force) return fun.deepCloning(await state.inflight);

    const request = loader()
      .then(data => {
        state.data = data;
        return data;
      })
      .finally(() => {
        if (state.inflight === request) state.inflight = null;
      });

    state.inflight = request;
    return fun.deepCloning(await request);
  }
}
