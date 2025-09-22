import { SubTipoArticuloC } from './../../registros/articulos/tipo-articulo/sub-tipo-articulo/sub-tipo-articulo';
import { ToastService } from './../../../core/services/toast.service';
import { ConfiguracionEntidadCuentaI } from './../configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';
import { fun } from './../../../core/services/functions.service';
import { CategoriaEntidadContableC, CategoriaEntidadContableI, entidadesContables } from './categoria-entidad-contable.utils';
import { Permisos } from './../../../core/typescript/permisos';
import { Injectable } from '@angular/core';
import { CategoriaEntidadContableComponent } from './categoria-entidad-contable.component';
import { BehaviorSubject, filter, finalize, first, take } from 'rxjs';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';
import { modalActionsE } from '@core/components/dynamic-modal/config/dynamic-modal.interface';

@Injectable({
  providedIn: 'root',
})
export class CategoriaEntidadContableService {
  private _categoriasChange = new BehaviorSubject<boolean>(false);

  get categoriasChange$() {
    return this._categoriasChange.asObservable().pipe(filter(value => value != false));
  }

  permissions = Permisos;

  allPermisosCategoriaEnt = Object.values(this.permissions.categoria_entidad_contable);

  static categoriaEntContClass = new CategoriaEntidadContableC();
  static subTipoArticuloClass = new SubTipoArticuloC();

  static entidades = {
    plural: { cliente: 'clientes', user: 'empleados', articulo: 'articulos', suplidor: 'suplidores', cuenta_bancaria: 'cuentas bancarias' },
    singular: { cliente: 'cliente', user: 'empleado', articulo: 'articulo', suplidor: 'suplidor', cuenta_bancaria: 'cuenta bancaria' },
  };

  constructor() {}

  setCategoriaChange() {
    this._categoriasChange.next(true);
    this._categoriasChange.next(false);
  }

  openModalCategorias(params: { entidad: entidadesContables; callback: Function; inputs: { configsEntCuentas: Array<ConfiguracionEntidadCuentaI> }; id_modal: string }) {
    const { entidad, id_modal, inputs = {}, callback } = params ?? {};

    const header = `Categorias de ${CategoriaEntidadContableService.entidades.plural[entidad]}`;
    inputs['entidad'] = entidad;

    const categoriasModalConf = new DynamicModalClass();

    categoriasModalConf.id = params.id_modal;
    categoriasModalConf.inputs = inputs;
    categoriasModalConf.header = header;
    categoriasModalConf.width = '70rem';
    categoriasModalConf.component = CategoriaEntidadContableComponent;
    categoriasModalConf.closableEsc = true;
    categoriasModalConf.setCallback(callback);
    categoriasModalConf.botones = [{ clase: 'btn btn-blanco mr-2', action: modalActionsE.close, label: 'Cerrar', disable: false }];
    categoriasModalConf.show();
  }

  static getCategoriasByEntidad(params: { entidad: entidadesContables; config_id: number; tipo_articulo_id?: number; search?: string; per_page?: number; page?: number; paginado?: boolean; showMsgs?: boolean }) {
    return new Promise<any>((resolve, reject) => {
      if (params.entidad == CategoriaEntidadContableC.entidad.articulo) {
        this.getSubTipoArticulo(params)
          .then(result => resolve(result))
          .catch(err => reject(err));
      } else {
        this.getCategoriasContables(params)
          .then(result => resolve(result))
          .catch(err => reject(err));
      }
    });
  }

  static getSubTipoArticulo(params: { entidad: entidadesContables; config_id: number; tipo_articulo_id?: number; search?: string; per_page?: number; page?: number; paginado?: boolean; showMsgs?: boolean }) {
    return new Promise<any>((resolve, reject) => {
      const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;
      const extra = { parameters: { page: params.page, per_page: params.per_page, paginado: true, filter_target: palabra_a_buscar, tipo_articulo_id: params.tipo_articulo_id } };

      this.subTipoArticuloClass
        .getAll(extra)
        .then(res => {
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  static getCategoriasContables(params: { entidad: entidadesContables; config_id: number; search?: string; per_page?: number; page?: number; paginado?: boolean; showMsgs?: boolean }) {
    return new Promise<any>((resolve, reject) => {
      const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;
      if (!fun.objHas(params, 'showMsgs') || fun.isEmpty(params.showMsgs)) params.showMsgs = true;

      const extra = { parameters: { page: params.page, per_page: params.per_page, paginado: params.paginado, filter_target: palabra_a_buscar, configuracion_id: params.config_id } };

      if (!params.showMsgs) extra['requestParams'] = [ToastService.noShowMsgs];

      this.categoriaEntContClass
        .getAll(extra)
        .then(res => {
          res['data'].map((categoria: CategoriaEntidadContableI) => {
            categoria.customStyles = { descripcion: { 'text-align': 'start', width: '80%' } };
            return categoria;
          });
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  getEntidadContableLabel(key: entidadesContables, tipo = 'singular') {
    return CategoriaEntidadContableService.entidades[tipo][key];
  }
}
