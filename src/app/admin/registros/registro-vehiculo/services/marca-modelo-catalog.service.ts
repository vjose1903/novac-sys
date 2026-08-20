import { Injectable } from '@angular/core';
import { MarcaC, ModeloC } from '@components/formularios en modales/formulario-marca-modelo/marca-modelo';
import { fun } from '@core/services/functions.service';

interface CatalogRequestState<T> {
  data: T | null;
  inflight: Promise<T> | null;
}

interface CatalogOptions {
  force?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MarcaModeloCatalogService {
  private readonly marcaClass = new MarcaC();
  private readonly modeloClass = new ModeloC();
  private readonly marcasState: CatalogRequestState<any[]> = { data: null, inflight: null };
  private readonly marcasFiltroState: CatalogRequestState<any[]> = { data: null, inflight: null };
  private readonly modelosPorMarca = new Map<number, CatalogRequestState<any[]>>();

  getMarcas(options: CatalogOptions = {}) {
    return this.getCatalog(this.marcasState, () => this.marcaClass.getAll().then(res => res as any[]), options);
  }

  getMarcasFiltro(options: CatalogOptions = {}) {
    const extra = { afterPath: `filtro/ `, parameters: { paginado: false, page: 1, per_page: 1 } };
    return this.getCatalog(this.marcasFiltroState, () => this.marcaClass.getAll(extra).then(res => res as any[]), options);
  }

  getModelosPorMarca(marcaId: number, options: CatalogOptions = {}) {
    let state = this.modelosPorMarca.get(marcaId);
    if (!state) {
      state = { data: null, inflight: null };
      this.modelosPorMarca.set(marcaId, state);
    }

    return this.getCatalog(state, () => this.modeloClass.getAll({ afterPath: `por_marca/${marcaId}` }).then(res => res as any[]), options);
  }

  invalidateMarcas() {
    this.marcasState.data = null;
    this.marcasState.inflight = null;
    this.marcasFiltroState.data = null;
    this.marcasFiltroState.inflight = null;
  }

  invalidateModelos(marcaId?: number) {
    if (fun.hasValue(marcaId)) {
      this.modelosPorMarca.delete(marcaId);
      return;
    }

    this.modelosPorMarca.clear();
  }

  invalidate() {
    this.invalidateMarcas();
    this.invalidateModelos();
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
