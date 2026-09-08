import { Injectable } from '@angular/core';
import { fun } from '@core/services/functions.service';
import { VehiculoC } from '../vehiculo';

interface CatalogRequestState<T> {
  data: T | null;
  inflight: Promise<T> | null;
}

interface CatalogOptions {
  force?: boolean;
}

@Injectable({ providedIn: 'root' })
export class VehiculoCatalogService {
  private readonly vehiculoClass = new VehiculoC();
  private readonly camionesState: CatalogRequestState<any[]> = { data: null, inflight: null };

  getCamiones(options: CatalogOptions = {}) {
    return this.getCatalog(
      this.camionesState,
      () => this.vehiculoClass.getAll({ afterPath: `filtro/ `, parameters: { paginado: false, info_vehiculo: true } }).then(res => res['data'] || []),
      options
    );
  }

  invalidate() {
    this.camionesState.data = null;
    this.camionesState.inflight = null;
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
