import { Component, OnInit, OnDestroy } from '@angular/core';
import * as _ from 'lodash';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { GLOBAL } from '../../../core/typescript/GLOBAL';
import * as moment from '../../../core/javascript/moment';
import { TablasService } from '../../components/tablas/tablas.service';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { FacturaC, TiposFacturaC } from '../../facturacion/factura';
import { NcfC } from './ncf';
import { fun } from '../../../core/services/functions.service';

@Component({
  selector: 'app-ncf',
  templateUrl: './ncf.component.html',
  styleUrls: ['./ncf.component.scss'],
})
export class NcfComponent extends MixinClass implements OnInit, OnDestroy {
  form;
  boton = 'Ingresar';
  listaNCF;

  seleccionModal: any;
  estado = false;
  usado = false;

  info = [
    { titulo: 'Cod.', tipo: 'text', key: 'codigo', estilos: [{ width: '3rem' }] },
    { titulo: 'Tipo', tipo: 'text', key: 'tipoC', estilos: [{ width: '2rem' }] },
    { titulo: 'Secuencia', tipo: 'text', key: 'secuencia_' },
    { titulo: 'Desde', tipo: 'text', key: 'desde' },
    { titulo: 'Hasta', tipo: 'text', key: 'hasta' },
    { titulo: 'Usado', tipo: 'icon', key: 'usado_', text_color: 'colorUsado', isIcon: true, color: true, estilos: [{ width: '3.5rem' }] },
    { titulo: 'Activo', tipo: 'icon', key: 'estado_', text_color: 'colorEstado', isIcon: true, color: true, estilos: [{ width: '3.5rem' }] },
  ];

  filtro: any = 0;
  botones = { titulo: true, borrar: true, editar: true };

  lista_tipos_facturas: any;

  fechaCompra;
  fechaValidez;
  tipo_articulo_id = -1;
  public dpConfig: Partial<BsDatepickerConfig> = new BsDatepickerConfig();
  public dpConfigValidez: Partial<BsDatepickerConfig> = new BsDatepickerConfig();
  aletarTipoArticulo = false;
  paqueteSelected: string;
  Desde;
  Hasta;

  isCreando: boolean = false;

  is_editando = false;
  ncfSelected;

  desdeAlert = false;
  hastaAlert = false;
  listaNCFBack: any[];

  facturaClass = new FacturaC();
  tiposFacturasClass = new TiposFacturaC();
  ncfClass = new NcfC();
  constructor(private tServ: TablasService, private localeService: BsLocaleService) {
    super();
    this.dpConfig = Object.assign(
      {},
      {
        showWeekNumbers: false,
        dateInputFormat: 'DD/MM/YYYY',
        // maxDate: new Date(),
      },
    );

    this.dpConfigValidez = Object.assign(
      {},
      {
        showWeekNumbers: false,
        minDate: this.fechaCompra,
        dateInputFormat: 'DD/MM/YYYY',
      },
    );
  }

  ngOnInit() {
    this.localeService.use('es');
    this._init_mixin({ component: 'reg_ncf', is_routing: true, _lista_subs: ['decisionModal'] });
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

  async getPaquetesNCF(e) {
    try {
      const page = e.page;
      const per_page = e.per_page;
      const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;
      // `secuencia_comprobantes/filtro/${arg}?page=${page}&per_page=${per_page}&paginado=${paginado}`

      const res = await this.ncfClass.getAll({ afterPath: `filtro/${palabra_a_buscar}`, parameters: { page, per_page, paginado: true } });

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

          ncf.customStyles = { 'td-codigo': { width: '3rem' }, 'td-tipoC': { width: '2rem' }, 'td-usado_': { width: '3.5rem' }, 'td-estado_': { width: '3.5rem' } };

          tempNCF.push(ncf);
        }
      });

      this.listaNCF = tempNCF;
      this.listaNCFBack = fun.duplicarJson(tempNCF);

      const obj = { total: res.total_registros, tabla: 'lista_ncf' };

      this.tServ.Func_total_paginas(obj);
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
    this.paqueteSelected = undefined;
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

  editarItem(item) {
    this.is_editando = true;

    if (item.METODO === 'editar') {
      this.paqueteSelected = item.ARG;
      this.boton = 'Editar';

      this.estado = item.ARG.estado;
      this.usado = item.ARG.usado;

      this.llenarCampos(item.ARG);
    }
  }

  localAbrirModal(arg?) {
    const comprobanteData = arg.ARG;
    comprobanteData.nombre = 'comprobante para ' + comprobanteData.tipoC_ + ' numero: ' + comprobanteData.codigo;
    const objConfirmationModal = {
      id: 'eliminar_comprobante',
      header: 'Confirmar',
      texto: `Desea eliminar comprobante para <b>${comprobanteData.tipoC_}</b> numero: <b>${comprobanteData.codigo}</b>`,
      width: '510px',
      siFunction: (instance) => {
        this.ncfClass.deleteOne(comprobanteData.id).then(
          () => {
            fun.toastSuccess('comprobante para ' + comprobanteData.tipoC_ + ' numero: ' + comprobanteData.codigo + ' borrado', 'CORRECTO');
            const actualPagination = this.tServ.getPaginationById('lista_ncf');
            this.getPaquetesNCF(actualPagination);
            instance.closeModal(instance.id, 'eliminar_comprobante');
          },
          (err) => {
            this.mostrarErrores(err.error);
          },
        );
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

  decisionModal(arg) {
    if (arg !== null && arg !== undefined) {
      const obj = fun.duplicarJson(this.seleccionModal);
      if (arg && obj) {
        this.ncfClass.deleteOne(obj.id).then(
          () => {
            fun.toastSuccess('comprobante para ' + obj.tipoC_ + ' numero: ' + obj.codigo + ' borrado', 'CORRECTO');
            const actualPagination = this.tServ.getPaginationById('lista_ncf');
            this.getPaquetesNCF(actualPagination);
          },
          (err) => {
            this.mostrarErrores(err.error);
          },
        );
      }
    }
  }

  mostrarErrores(arg) {
    if (Array.isArray(arg)) {
      arg.forEach((error) => {
        fun.toastError(error, 'ERROR');
      });
    } else {
      for (const key in arg) {
        if (arg.hasOwnProperty(key)) {
          const element = arg[key];

          if (key !== 'status') {
            fun.toastError(element, 'ERROR');
          }
        }
      }
    }
  }
}
