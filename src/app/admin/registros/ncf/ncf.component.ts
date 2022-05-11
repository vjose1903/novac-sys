import { Component, OnInit, OnDestroy } from '@angular/core';
import * as _ from 'lodash';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import * as moment from '../../../core/javascript/moment';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { FacturaC, TiposFacturaC } from '../../facturacion/factura';
import { NcfC } from './ncf';
import { fun } from '../../../core/services/functions.service';
import { table_config } from '../../components/new_tablas/tabla-class';
import { Permisos } from '../../../core/typescript/permisos';

@Component({
  selector: 'app-ncf',
  templateUrl: './ncf.component.html',
  styleUrls: ['./ncf.component.scss'],
})
export class NcfComponent extends MixinClass implements OnInit, OnDestroy {
  form;
  boton = 'Ingresar';
  listaNCF = [];

  estado = false;
  usado = false;

  filtro: any = 0;

  lista_tipos_facturas: any;

  fechaCompra;
  fechaValidez;
  tipo_articulo_id = -1;
  public dpConfig: Partial<BsDatepickerConfig> = new BsDatepickerConfig();
  public dpConfigValidez: Partial<BsDatepickerConfig> = new BsDatepickerConfig();
  aletarTipoArticulo = false;
  ncfSelected;
  Desde;
  Hasta;

  isCreando: boolean = false;

  is_editando = false;

  desdeAlert = false;
  hastaAlert = false;
  listaNCFBack = [];

  facturaClass = new FacturaC();
  tiposFacturasClass = new TiposFacturaC();
  ncfClass = new NcfC();
  permissions = Permisos;

  table_config: table_config = {
    info: [
      { titulo: 'Cod.', tipo: 'text', key: 'codigo', estilos: [{ width: '5rem' }] },
      { titulo: 'Tipo', tipo: 'text', key: 'tipoC', estilos: [{ width: '3rem' }] },
      { titulo: 'Secuencia', tipo: 'text', key: 'secuencia_' },
      { titulo: 'Desde', tipo: 'text', key: 'desde' },
      { titulo: 'Hasta', tipo: 'text', key: 'hasta' },
      { titulo: 'Usado', tipo: 'icon', key: 'usado_', estilos: [{ width: '4rem' }], iconsArray: [{ key: 'usado_', text_color: 'colorUsado' }] },
      { titulo: 'Activo', tipo: 'icon', key: 'estado_', estilos: [{ width: '4rem' }], iconsArray: [{ key: 'estado_', text_color: 'colorEstado' }] },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_ncf',
    padre_functions: { data_request: (params) => this.getPaquetesNCF(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
    botones: { editar: { show: true, permiso: this.permissions.secuencia_comprobante.update }, borrar: { show: true, permiso: this.permissions.secuencia_comprobante.destroy } },
  };
  tablaComponent;
  formPermissions = [Permisos.secuencia_comprobante.create, Permisos.secuencia_comprobante.update];

  constructor(private tServ: TablasService, private localeService: BsLocaleService) {
    super();
    this.dpConfig = Object.assign({}, { showWeekNumbers: false, dateInputFormat: 'DD/MM/YYYY' });
    this.dpConfigValidez = Object.assign({}, { showWeekNumbers: false, minDate: this.fechaCompra, dateInputFormat: 'DD/MM/YYYY' });
  }

  ngOnInit() {
    this.localeService.use('es');
    this._init_mixin({ component: 'reg_ncf', is_routing: true });
    this.necesarioStart();

    this.setDateInputs(new Date());
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  text(arg) {
    this.setDateInputs(new Date());
  }

  // calculateFechaValida() {

  //   setTimeout(() => {
  //     const anio = moment(this.fechaCompra).add(1, 'year').format('YYYY');

  //     const newFecha = moment('12/31/' + anio).format('DD/MM/YYYY');

  //     this.fechaValidez = newFecha;
  //   }, 50);
  // }

  setDateInputs(actual) {
    actual = moment(actual).format('MM/DD/YYYY');
    const anio = moment(new Date(actual)).add(1, 'year').format('YYYY');

    const newFecha = moment('12/31/' + anio).format('MM/DD/YYYY');
    this.fechaCompra = moment(actual).format('DD/MM/YYYY');
    this.fechaValidez = moment(newFecha).format('DD/MM/YYYY');
  }

  async necesarioStart() {
    await this.getTiposFacturas();
    await this.getPaquetesNCF(this.tServ.obj_paginate.default);
  }

  async getTiposFacturas() {
    try {
      this.lista_tipos_facturas = await this.tiposFacturasClass.getAll();
      const temp = fun.duplicarJson(this.lista_tipos_facturas);
      for (let i = 0; i < temp.length; i++) {
        const element = temp[i];
        if (!element.referencia || element.referencia === '02' || element.referencia === '00') {
          _.pullAt(temp, i);
        }
      }
      this.lista_tipos_facturas = temp;
    } catch (error) {}
  }

  filtrarNCF() {
    if (this.filtro === 'todos') {
      this.listaNCF = fun.duplicarJson(this.listaNCFBack);
    } else {
      this.listaNCF = this.listaNCFBack.filter((pack) => Number(pack.tipo_factura_id) === Number(this.filtro));
    }
  }

  async getPaquetesNCF(params?: { per_page: number; page: number; search: string }) {
    try {
      const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

      const res = await this.ncfClass.getAll({ afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } });
      this.listaNCF.length = 0;
      this.listaNCFBack.length = 0;
      const tempNCF = [];
      res.data.forEach((ncf) => {
        if (ncf.tipo_factura_id !== 1 && ncf.tipo_factura_id !== 3) {
          ncf.cantidad = ncf.hasta - ncf.desde + 1;
          ncf.tipoC = this.lista_tipos_facturas.filter((tipo) => tipo.id === ncf.tipo_factura_id)[0].referencia;
          ncf.tipoC_ = this.lista_tipos_facturas.filter((tipo) => tipo.id === ncf.tipo_factura_id)[0].descripcion;
          ncf.codigo = _.padStart(ncf.id, 5, '0');
          ncf.fecha_compra = moment(ncf.fecha_compra, 'YYYY-MM-DD[T]HH:mm:ss').format('DD/MM/YYYY');
          ncf.fecha_valida = moment(ncf.fecha_valida, 'YYYY-MM-DD[T]HH:mm:ss').format('DD/MM/YYYY');

          ncf.secuencia_ = ncf.estado || ncf.usado ? ncf.secuencia : '-';
          ncf.estado_ = ncf.estado ? 'fas fa-check' : 'fas fa-times';
          ncf.colorUsado = ncf.usado ? 'green' : 'red';
          ncf.colorEstado = ncf.estado ? 'green' : 'red';
          ncf.estado_ = ncf.estado ? 'fas fa-check' : 'fas fa-times';
          ncf.usado_ = ncf.usado ? 'fas fa-check' : 'fas fa-times';

          ncf.customStyles = { codigo: { width: '5rem' }, tipoC: { width: '3rem' }, usado_: { width: '4rem' }, estado_: { width: '4rem' } };

          tempNCF.push(ncf);
        }
      });

      this.listaNCF = tempNCF;
      this.listaNCFBack = fun.duplicarJson(tempNCF);

      this.tablaComponent.changeConfig([{ total_count: res.total_registros }]);
    } catch (error) {
      console.error(error);

      fun.toastError('Error buscando Paquetes de NCF registrados.', 'ERROR');
    }
  }

  checkTipoArticuloSelect() {
    if (this.tipo_articulo_id === -1) {
      this.aletarTipoArticulo = true;
    }
  }

  checkInputs(arg) {
    switch (arg) {
      case 'desde':
        if (this.Desde) {
          this.desdeAlert = false;
        } else {
          this.desdeAlert = true;
        }
        break;
      case 'hasta':
        if (this.Hasta) {
          this.hastaAlert = false;
        } else {
          this.hastaAlert = true;
        }
        break;

      default:
        break;
    }
  }

  selectTipoFactura(a) {
    this.aletarTipoArticulo = false;
  }

  saltar(campo) {
    if (campo != 'send') this.enfocarInput(campo);
    else {
      if (!this.formIsInvalid()) setTimeout(() => this.submit(), 250);
    }
  }

  async submit() {
    const obj = {
      id: this.ncfSelected ? this.ncfSelected.id : null,
      tipo_factura_id: this.tipo_articulo_id,
      desde: this.Desde,
      hasta: this.Hasta,
      fecha_compra: moment(this.fechaCompra, 'DD/MM/YYYY').format(),
      fecha_valida: moment(this.fechaValidez, 'DD/MM/YYYY').format(),
      secuencia: this.ncfSelected ? this.ncfSelected.secuencia : this.Desde,
      estado: this.is_editando ? this.estado : false,
      usado: this.is_editando ? this.usado : false,
      status: true,
    };

    try {
      const res = await this.ncfClass.createUpdateOne(obj);
      const actualPagination = this.tServ.getPaginationById('lista_ncf');
      this.getPaquetesNCF(actualPagination);
      if (this.is_editando) {
        fun.toastSuccess('Comprobante editado', 'CORRECTO');
      } else {
        fun.toastSuccess('Comprobante ingresado', 'CORRECTO');
      }
      this.borrar();
    } catch (error) {
      console.error(error);
      fun.toastError(error.error.msg, 'ERROR');
    }
  }

  formIsInvalid() {
    let res = true;
    if (this.tipo_articulo_id !== -1 && this.Desde && this.Hasta && this.fechaCompra && this.fechaValidez) res = false;
    else res = true;
    return res;
  }

  atras() {}

  borrar() {
    this.estado = false;
    this.usado = false;
    this.is_editando = false;
    this.ncfSelected = undefined;
    this.tipo_articulo_id = -1;
    this.boton = 'Ingresar';
    this.ncfSelected = undefined;
    this.Desde = undefined;
    this.Hasta = undefined;
    this.isCreando = true;

    this.setDateInputs(new Date());
  }

  llenarCampos(item) {
    this.fechaCompra = item.fecha_compra;
    this.fechaValidez = item.fecha_valida;
    this.tipo_articulo_id = item.tipo_factura_id;
    this.Desde = item.desde;
    this.Hasta = item.hasta;

    this.ncfSelected = fun.duplicarJson(item);
  }

  nuevoRegistro() {
    this.isCreando = true;
  }

  tableClick_action(params) {
    if (params.action == 'update') this.editarItem(params.data);
    if (params.action == 'delete') this.eliminarReg(params.data);
  }

  editarItem(data) {
    if (data.usado) {
      fun.toastWarning('Los comprobantes usados no pueden ser editados.', 'AVISO');
    } else {
      this.is_editando = true;

      this.ncfSelected = data;
      this.boton = 'Editar';

      this.estado = data.estado;
      this.usado = data.usado;

      this.llenarCampos(data);
    }
  }

  eliminarReg(data?) {
    const comprobanteData = data;
    comprobanteData.nombre = 'comprobante para ' + comprobanteData.tipoC_ + ' numero: ' + comprobanteData.codigo;

    const objConfirmationModal = {
      id: 'eliminar_comprobante',
      header: 'Confirmar',
      texto: `Desea eliminar comprobante para <b>${comprobanteData.tipoC_}</b> numero: <b>${comprobanteData.codigo}</b>`,
      width: '510px',
      siFunction: (instance) => {
        this.ncfClass.deleteOne(comprobanteData.id).then((res) => {
          const actualPagination = this.tServ.getPaginationById('lista_ncf');
          this.getPaquetesNCF(actualPagination);
          instance.closeModal(instance.id, 'eliminar_comprobante');
        });
      },
    };
    this.confirmationModal(objConfirmationModal);
  }

  confirmationModal(obj: { id: string; texto: string; header: string; siFunction: Function; width?: string }) {
    this.handleModalForm({
      id: obj.id,
      header: obj.header,
      width: obj.width || '30rem',
      html: `<p>
        ${obj.texto}
      </p>`,
      botones: {
        aceptar: { show: false, disable: false },
        cancelar: { show: false, disable: false },
        dinamico: [
          { clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, obj.id), label: 'NO', disable: false },
          {
            clase: 'btn btn-verde',
            function: (instance) => obj.siFunction(instance),
            label: 'SI',
            disable: false,
          },
        ],
      },
    });
  }
}
