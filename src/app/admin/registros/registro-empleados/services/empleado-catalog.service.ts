import { Injectable } from '@angular/core';
import { fun } from '@core/services/functions.service';
import { EmpleadoC } from '../empleado';

interface CatalogRequestState<T> {
  data: T | null;
  inflight: Promise<T> | null;
}

interface CatalogOptions {
  force?: boolean;
}

@Injectable({ providedIn: 'root' })
export class EmpleadoCatalogService {
  private readonly empleadoClass = new EmpleadoC();
  private readonly catalogs = new Map<string, CatalogRequestState<any[]>>();

  getVendedores(options: CatalogOptions = {}) {
    return this.getCatalog('vendedores', { id: true, filter_key: 'role', filter_value: 'vendedor' }, options);
  }

  getChoferes(options: CatalogOptions = {}) {
    return this.getCatalog('choferes', { id: true, filter_key: 'role', filter_value: 'chofer' }, options);
  }

  async getPropietarios(options: CatalogOptions & { includeNoEmpleado?: boolean } = {}) {
    const propietarios = await this.getCatalog('propietarios', { id: true }, options);
    if (!options.includeNoEmpleado) return propietarios;

    return [{ id: -1, nombre_completo: 'No empleado' }, ...propietarios];
  }

  invalidate() {
    this.catalogs.clear();
  }

  private async getCatalog(key: string, parameters: any, options: CatalogOptions) {
    const current = this.catalogs.get(key);
    if (current?.data && !options.force) return fun.deepCloning(current.data);
    if (current?.inflight && !options.force) return fun.deepCloning(await current.inflight);

    const state: CatalogRequestState<any[]> = current || { data: null, inflight: null };
    const request = this.empleadoClass
      .getAll({ parameters })
      .then(res => {
        const data = res['data'] || [];
        state.data = data;
        return data;
      })
      .finally(() => {
        if (state.inflight === request) state.inflight = null;
      });

    state.inflight = request;
    this.catalogs.set(key, state);

    return fun.deepCloning(await request);
  }
}
