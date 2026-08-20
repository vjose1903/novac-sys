import { Injectable } from '@angular/core';
import { ArticuloC, tipos_articulos, TipoArticuloC } from '../articulo';
import { fun } from '@core/services/functions.service';

interface CatalogRequestState<T> {
  data: T | null;
  inflight: Promise<T> | null;
}

interface CatalogOptions {
  force?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ArticuloCatalogService {
  private readonly articuloClass = new ArticuloC();
  private readonly tipoArticuloClass = new TipoArticuloC();
  private readonly tipoArticulosState: CatalogRequestState<any[]> = { data: null, inflight: null };
  private readonly productosTerminadosPorFecha = new Map<string, CatalogRequestState<any[]>>();

  getTipoArticulos(options: CatalogOptions = {}) {
    return this.getCatalog(this.tipoArticulosState, () => this.tipoArticuloClass.getAll().then(res => res.data || []), options);
  }

  getProductosTerminados(fecha: string, options: CatalogOptions = {}) {
    let state = this.productosTerminadosPorFecha.get(fecha);
    if (!state) {
      state = { data: null, inflight: null };
      this.productosTerminadosPorFecha.set(fecha, state);
    }

    return this.getCatalog(
      state,
      () => this.articuloClass.getArticulosFiltrado({ buscar: ' ', fecha, paginado: false, tipo: tipos_articulos.producto_terminado, mode: 'formula' }).then(res => res['data'] || []),
      options
    );
  }

  invalidateProductosTerminados() {
    this.productosTerminadosPorFecha.clear();
  }

  invalidateTipoArticulos() {
    this.tipoArticulosState.data = null;
    this.tipoArticulosState.inflight = null;
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
