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

  constructor() {}

  openModalCategorias(params: { entidad: entidadesContables; openNewModal: Function; inputs: { configsEntCuentas: Array<ConfiguracionEntidadCuentaI> }; id_modal: string }) {
    const entidades = { cliente: 'clientes', user: 'empleados', articulo: 'articulos', suplidor: 'suplidores', cuenta_bancaria: 'cuentas bancarias' };

    const header = `Categorias de ${entidades[params.entidad]}`;
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

  static getCategoriasByEntidad(params: { entidad: entidadesContables; config_id: number; search?: string; per_page?: number; page?: number }) {
    return new Promise<any>((resolve, reject) => {
      const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

      const extra = { parameters: { page: params.page, per_page: params.per_page, paginado: true, filter_target: palabra_a_buscar, configuracion_id: params.config_id } };

      this.categoriaEntContClass.getAll(extra).then((res) => {
        res['data'].map((categoria: CategoriaEntidadContableI) => {
          categoria.customStyles = { descripcion: { 'text-align': 'start', width: '80%' } };
          return categoria;
        });
        resolve(res);
      });
    });
  }
}
