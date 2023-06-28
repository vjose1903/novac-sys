import { ToastService } from './../../../core/services/toast.service';
import { ConfiguracionEntidadCuentaI } from './../configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';
import { fun } from './../../../core/services/functions.service';
import { CategoriaEntidadContableC, CategoriaEntidadContableI, entidadesContables } from './categoria-entidad-contable.utils';
import { Permisos } from './../../../core/typescript/permisos';
import { Injectable } from '@angular/core';
import { CategoriaEntidadContableComponent } from './categoria-entidad-contable.component';
import { ModalClass } from '../../components/modal/modal-class';

@Injectable({
  providedIn: 'root',
})
export class CategoriaEntidadContableService {
  permissions = Permisos;

  allPermisosCategoriaEnt = Object.values(this.permissions.categoria_entidad_contable);

  static categoriaEntContClass = new CategoriaEntidadContableC();
  static entidades = {
    plural: { cliente: 'clientes', user: 'empleados', articulo: 'articulos', suplidor: 'suplidores', cuenta_bancaria: 'cuentas bancarias' },
    singular: { cliente: 'cliente', user: 'empleado', articulo: 'articulo', suplidor: 'suplidor', cuenta_bancaria: 'cuenta bancaria' },
  };

  constructor() {}

  openModalCategorias(params: { entidad: entidadesContables; openNewModal: Function; inputs: { configsEntCuentas: Array<ConfiguracionEntidadCuentaI> }; id_modal: string }) {
    const header = `Categorias de ${CategoriaEntidadContableService.entidades.plural[params.entidad]}`;
    params.inputs['entidad'] = params.entidad;

    params.openNewModal({
      component: CategoriaEntidadContableComponent,
      inputs: params.inputs,
      id: params.id_modal,
      header: header,
      width: '70rem',
      botones: {
        ...fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons),
        dinamico: [{ clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, 'cancelar'), label: 'Cerrar', disable: false }],
      },
    });
  }

  static getCategoriasByEntidad(params: { entidad: entidadesContables; config_id: number; search?: string; per_page?: number; page?: number; paginado?: boolean; showMsgs?: boolean }) {
    return new Promise<any>((resolve, reject) => {
      const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;
      if (!fun.objHas(params, 'showMsgs') || fun.isEmpty(params.showMsgs)) params.showMsgs = true;

      const extra = { parameters: { page: params.page, per_page: params.per_page, paginado: params.paginado, filter_target: palabra_a_buscar, configuracion_id: params.config_id } };

      if (!params.showMsgs) extra['requestParams'] = [ToastService.noShowMsgs];

      this.categoriaEntContClass
        .getAll(extra)
        .then((res) => {
          console.log('ANDO AQUIIIIII');

          res['data'].map((categoria: CategoriaEntidadContableI) => {
            categoria.customStyles = { descripcion: { 'text-align': 'start', width: '80%' } };
            return categoria;
          });
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getEntidadContableLabel(key: entidadesContables, tipo = 'singular') {
    return CategoriaEntidadContableService.entidades[tipo][key];
  }
}
