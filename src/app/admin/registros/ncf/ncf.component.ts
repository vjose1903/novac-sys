import { Component, OnInit, OnDestroy } from '@angular/core';
import { DBservice } from '../../../core/services/bdservice.service';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { GLOBAL } from '../../../core/services/GLOBAL';
import * as moment from 'moment';
import { ModalService } from '../../components/modal/modal.service';
import { TablasService } from '../../components/tablas/tablas.service';
import { IpcService } from '../../../core/services/ipc.service';
import { LayoutService } from '../../layout/layout.service';
import { mixinClass } from '../../mixinClass';

@Component({
  selector: 'app-ncf',
  templateUrl: './ncf.component.html',
  styleUrls: ['./ncf.component.scss'],
})
export class NcfComponent extends mixinClass implements OnInit, OnDestroy {
  titulo;
  form;
  boton = 'Ingresar';
  listaNCF;

  indexSelected: any;
  tipoModal: string;
  seleccionModal: any;
  estado = false;
  usado = false;

  info = [
    {
      titulo: 'Cod.',
      key: 'codigo',
      customClass: true,
      estilos: [{ width: '3.5rem' }],
    },
    {
      titulo: 'Tipo',
      key: 'tipoC',
    },
    {
      titulo: 'Secuencia',
      key: 'secuencia_',
    },
    {
      titulo: 'Desde',
      key: 'desde',
    },
    {
      titulo: 'Hasta',
      key: 'hasta',
    },
    {
      titulo: 'Usado',
      key: 'usado_',
      text_color: 'colorUsado',
      isIcon: true,
      color: true,
      customClass: true,
      estilos: [{ width: '3.5rem' }],
    },
    {
      titulo: 'Activo',
      key: 'estado_',
      text_color: 'colorEstado',
      isIcon: true,
      color: true,
      customClass: true,
      estilos: [{ width: '3.5rem' }],
    },
  ];

  filtro: any = 0;
  botones = {
    titulo: true,
    borrar: true,
    editar: true,
  };

  subDeci: Subscription;
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

  is_editando = false;
  ncfSelected;

  desdeAlert = false;
  hastaAlert = false;
  listaNCFBack: any[];
  constructor(
    private dbServ: DBservice,
    public _ipc: IpcService,
    public layServ: LayoutService,
    public mServ: ModalService,
    private tServ: TablasService,
  ) {
    super(mServ, _ipc, layServ);
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
    this._init_mixin();
    this.titulo = 'Paquetes de numeros comprobantes fiscales';
    this.necesarioStart();

    this.setDateInputs(new Date());
    this.subDeci = this.mServ.DECISIONMODAL.subscribe((res) => {
      if (res !== null && res !== undefined) {
        this.decisionModal(res);
      }
    });
  }

  initCambioMenu(arg) {
    if (arg.bool) {

      this.layServ.nextDecisionCambioMenu(arg);
    }
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
    this.subDeci.unsubscribe();
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
    await this.getPaquetesNCF(this.tServ.obj_paginate);
  }

  async getTiposFacturas() {
    try {
      this.lista_tipos_facturas = await this.dbServ.getTiposFacturas().toPromise();
      const temp = GLOBAL.duplicarJson(this.lista_tipos_facturas);
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
      this.listaNCF = GLOBAL.duplicarJson(this.listaNCFBack);
    } else {
      this.listaNCF = this.listaNCFBack.filter((pack) => Number(pack.tipo_factura_id) === Number(this.filtro));
    }
  }

  async getPaquetesNCF(e) {
    try {
      const page = e.page;
      const per_page = e.per_page;
      const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;

      const res = await this.dbServ.getPaquetesNCFFiltrados(palabra_a_buscar, page, per_page, true).toPromise();

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

          ncf.customStyles = { 'td-usado_': { width: '3.5rem' }, 'td-codigo': { width: '3.5rem' }, 'td-estado_': { width: '3.5rem' } };

          tempNCF.push(ncf);
        }
      });

      this.listaNCF = tempNCF;
      this.listaNCFBack = GLOBAL.duplicarJson(tempNCF);

      const obj = {
        total: res.total_registros,
        tabla: 'listaNCF',
      };

      this.tServ.Func_total_paginas(obj);
    } catch (error) {
      console.error(error);

      this.dbServ.toastError('Error buscando Paquetes de NCF registrados.', 'ERROR', true);
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

  saltar(input) {}

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
      const res = await this.dbServ.PaqueteNCF(obj).toPromise();

      this.getPaquetesNCF(this.tServ.obj_paginate);
      if (this.is_editando) {
        this.dbServ.toastSuccess('Comprobante editado', 'CORRECTO');
      } else {
        this.dbServ.toastSuccess('Comprobante ingresado', 'CORRECTO');
      }
      this.borrar();
    } catch (error) {
      console.error(error);
      this.dbServ.toastError(error.error.msg, 'ERROR', true);
    }
  }
  abilitarBtnSend() {
    let res = true;
    if (this.tipo_articulo_id !== -1 && this.Desde && this.Hasta && this.fechaCompra && this.fechaValidez) {
      res = false;
    } else {
      res = true;
    }
    return res;
  }

  atras() {}

  borrar() {
    this.estado = false;
    this.usado = false;
    this.is_editando = false;
    this.ncfSelected = undefined;
    this.tipo_articulo_id = -1;
    this.titulo = 'Paquetes de numeros comprobantes fiscales';
    this.boton = 'Ingresar';
    this.paqueteSelected = undefined;
    this.Desde = undefined;
    this.Hasta = undefined;

    this.setDateInputs(new Date());
  }

  llenarCampos(item) {
    this.fechaCompra = item.fecha_compra;
    this.fechaValidez = item.fecha_valida;
    this.tipo_articulo_id = item.tipo_factura_id;
    this.Desde = item.desde;
    this.Hasta = item.hasta;

    this.ncfSelected = GLOBAL.duplicarJson(item);
  }

  editarItem(item) {
    this.indexSelected = item.INDEX;
    this.is_editando = true;

    if (item.METODO === 'editar') {
      this.paqueteSelected = item.ARG;
      this.titulo = ' Editar paquete de NCF numero: ' + item.ARG.codigo + ' de: ' + item.ARG.tipoC_;
      this.boton = 'Editar';

      this.estado = item.ARG.estado;
      this.usado = item.ARG.usado;

      this.llenarCampos(item.ARG);
    }
  }

  abrirModal(arg?) {
    this.indexSelected = arg.INDEX;
    this.mServ.modalTipo('borrar');
    this.tipoModal = 'borrar';
    this.seleccionModal = arg.ARG;
    this.seleccionModal.nombre = 'comprobante para ' + arg.ARG.tipoC_ + ' numero: ' + arg.ARG.codigo;
    this.mServ.ModalSeleccion(arg.ARG);
    this.mServ.mostrarModal(true);
  }

  decisionModal(arg) {
    if (arg && this.seleccionModal) {
      this.dbServ.deleteNCF(this.seleccionModal.id).subscribe(
        (res) => {
          this.dbServ.toastSuccess(
            'comprobante para ' + this.seleccionModal.tipoC_ + ' numero: ' + this.seleccionModal.codigo + ' borrado',
            'CORRECTO',
          );
          _.pullAt(this.listaNCF, this.indexSelected);
          this.tipoModal = '';
        },
        (err) => {
          this.mostrarErrores(err.error);
        },
      );
    }
  }
  mostrarErrores(arg) {
    if (Array.isArray(arg)) {
      arg.forEach((error) => {
        this.dbServ.toastError(error, 'ERROR', true);
      });
    } else {
      for (const key in arg) {
        if (arg.hasOwnProperty(key)) {
          const element = arg[key];

          if (key !== 'status') {
            this.dbServ.toastError(element, 'ERROR', true);
          }
        }
      }
    }
  }
}
