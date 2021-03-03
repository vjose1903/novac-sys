import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { DBservice } from '../../../core/services/bdservice.service';
import { Subscription } from 'rxjs';
import { GLOBAL } from '../../../core/services/GLOBAL';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { TablasComponent } from '../../components/tablas/tablas.component';
import { ModalService } from '../../components/modal/modal.service';
import { TablasService } from '../../components/tablas/tablas.service';
import { IpcService } from '../../../core/services/ipc.service';
import { LayoutService } from '../../layout/layout.service';
import { mixinClass } from '../../mixinClass';
import { PdfService } from '../../../core/services/pdf/pdf.service';
@Component({
  selector: 'app-buscar-factura',
  templateUrl: './buscar-factura.component.html',
  styleUrls: ['./buscar-factura.component.scss'],
})
export class BuscarFacturaComponent extends mixinClass implements OnInit, OnDestroy {
  facturas: any;
  campoSelected: string;
  clienteBuscado: any;
  listaClientes: unknown;
  facturaSelected: any;
  @ViewChild(TablasComponent) tablas: TablasComponent;
  BuscarPara: any;
  NCF;
  Para: string;
  tipoModal: any;
  indexSelected: any;
  lista_tipos_facturas: any;
  existenComprobantes = false;
  tipo_factu_nota: any;
  paqueteComprobante: any;
  tipo_factura_id = null;
  valor: any;

  constructor(
    private dbServ: DBservice,
    public mServ: ModalService,
    private route: ActivatedRoute,
    private router: Router,
    private tServ: TablasService,
    public _ipc: IpcService,
    public layServ: LayoutService,
    public pdfServ: PdfService,
  ) {
    super(mServ, _ipc, layServ);
  }
  campo = null;
  placeHolder = '';
  info = [
    {
      titulo: ' ',
      key: 'estatus',
      text_color: 'colorEstado',
      isIcon: true,
      color: true,
      customClass: true,
      estilos: [{ width: '2rem' }],
    },
    {
      titulo: 'Numero Fact',
      key: 'secuencia',
      customClass: true,
      estilos: [{ width: '7rem' }],
    },
    {
      titulo: 'Tipo',
      key: 'tipo_factura',
    },
    {
      titulo: 'Comprobante',
      key: 'numero_comprobante',
      customClass: true,
      estilos: [{ width: '7rem' }],
    },
    {
      titulo: 'Condicion',
      key: 'condicion',
      customClass: true,
      estilos: [{ width: '6rem' }],
    },
    {
      titulo: 'Fecha Facturacion',
      key: 'fecha',
    },
    {
      titulo: 'Fecha Vencimiento',
      key: 'fechaV',
    },
    {
      titulo: 'Total facturado',
      key: 'total_factura',
      formatoNumero: true,
    },
    {
      titulo: 'Balance tactura',
      key: 'balance',
      formatoNumero: true,
    },

    {
      titulo: 'Seleccione',
      key: 'select',
      text_color: 'selectColor',
      isIcon: true,
      color: true,
    },

    // {
    //   titulo: 'Seleccione',
    //   tipo: 'check',
    //   key: 'select',

    //   disable: {
    //     getDisabled: false,
    //     campo: '',
    //   },
    //   title: '',
    // },
  ];
  ncfMask = [/b/, /[0-9]/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/];

  ngOnInit() {
    this._init_mixin({ _lista_subs: ['decisionModal', 'objDevuelto', 'printBase64Res', 'pressEsc'] });
    this.BuscarPara = this.route.snapshot.params['para'];

    if (this.BuscarPara === 'nota_credito') {
      this.tipo_factu_nota = '04';
    } else if (this.BuscarPara === 'nota_debito') {
      this.tipo_factu_nota = '03';
    }

    this.necesarioStart();
    this.completarTituloPag();
  }

  ipcBase64Resonse(res) {
    if (res.status === 'si') {
      this.dbServ.toastSuccess(res.msg, 'CORRECTO', true);
    } else {
      this.dbServ.toastError(res.msg, 'ERROR', true);
    }
    setTimeout(() => {
      this.mServ.mostrarModal(false);
    }, 5);
  }

  objDevueltoResponse(res) {
    if (res && res.tipo_modal === 'buscarCliente') {
      this.clienteBuscado = res.data;
      (document.getElementById('valorI') as any).value = res.data.nombre;
      this.pedirFactura('1', res.data.id, this.tServ.obj_paginate);
      this.mServ.ModalObj(undefined);
    }
  }

  pressEscResponse(res) {
    if (res !== undefined && res !== null) {
      this.enfocarInput('valorI');
    }
  }

  reimprimirFactura(obj) {
    this.pdfServ.generatePdf(obj, (res) => {
      console.log('res --> ', res);

      if (res.status === 'si') {
        const objBase = {
          base64: res.body,
          filename: res.file,
          type: 'conduce',
        };
        this._ipc.send('printBase64', objBase);
      }
    });
  }

  decisionModal(res) {
    if (res) {
      if (this.tipoModal === 'mostrarFactura') {
        if (this.BuscarPara === 'anular_factura') {
          this.facturaSelected['identificadorFact'] =
            this.campo === '2'
              ? ' con el comprobante fiscal ' + this.facturaSelected.numero_comprobante
              : ' con el numero de factura ' + this.formatoNumeroFactura(this.facturaSelected.numero_factura);
          setTimeout(() => {
            this.abrirModal(this.facturaSelected, 'cancelar');
          }, 10);
        } else if (this.BuscarPara === 'solo_ver') {
          if (res.tipo === 'reimrimir') {
            const obj = {
              data: this.facturaSelected,
              type: 'facturacion',
            };

            this.reimprimirFactura(obj);
          } else {
            this.editarFactura();
          }
        } else {
          this.mServ.ModalDecision(undefined);
          const url = `/admin/manipular/nota/${this.BuscarPara === 'nota_credito' ? 'credito' : 'debito'}/${this.facturaSelected.id}`;
          this.router.navigateByUrl(url);
        }
      } else if (this.tipoModal === 'cancelarBusqueda') {
        this.decisionesModal();
      }
    } else {
      if (this.tipoModal === 'cancelar') {
        setTimeout(() => {
          this.abrirModal(this.facturas[0], 'mostrarFactura');
        }, 10);
      }
    }
  }

  initCambioMenu(arg) {
    if (arg.bool) {
      this.layServ.nextDecisionCambioMenu(arg);
    }
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
    this.borrar('salir');
  }

  async getPaqueteComprobante() {
    try {
      const TipoFact = this.lista_tipos_facturas.filter((tipo) => tipo.referencia === this.tipo_factu_nota);
      const paquete = await this.dbServ.getPaquetesNCF(TipoFact[0].id).toPromise();
      this.paqueteComprobante = paquete.body;

      if (this.paqueteComprobante.fecha_valida !== null) {
        const desde = this.paqueteComprobante.desde;
        const hasta = this.paqueteComprobante.hasta;
        const secuencia = this.paqueteComprobante.secuencia;

        const cant = hasta - desde;
        const cantidad = cant + 1;
        let porciento = 0;

        if (cantidad > 0 && cantidad <= 40) {
          porciento = cantidad * 0.5;
        } else if (cantidad > 40 && cantidad <= 100) {
          porciento = cantidad * 0.25;
        } else if (cantidad > 100 && cantidad <= cantidad * 500) {
          porciento = cantidad * 0.1;
        } else if (cantidad > 500) {
          porciento = cantidad * 0.04;
        }
        const limite = hasta - porciento;
        const restante = hasta - secuencia + 1;

        const msg =
          this.paqueteComprobante.msg === 'Ultimo comprobante de este paquete'
            ? `Ultimo comprobante para ${TipoFact[0].descripcion}.`
            : `Los comprobantes para ${TipoFact[0].descripcion} se estan agotando, solo quedan ${restante}`;

        if (secuencia >= limite) {
          this.dbServ.toastWarning(msg, 'AVISO');
        }
      }
    } catch (error) {
      this.existenComprobantes = true;
      console.error(error);
      this.dbServ.toastError(error.error.msg, 'ERROR', true);
    }
  }
  completarTituloPag() {
    if (this.BuscarPara === 'anular_factura') {
      this.Para = ' Anular factura';
    } else if (this.BuscarPara === 'nota_credito') {
      this.Para = ' Nota de crédito';
    } else if (this.BuscarPara === 'nota_debito') {
      this.Para = ' Nota de débito';
    } else if (this.BuscarPara === 'solo_ver') {
      this.Para = ' Visualizar';
    }
  }

  async getTipoFacturas() {
    try {
      const res = await this.dbServ.getTiposFacturas().toPromise();
      this.lista_tipos_facturas = res;
    } catch (error) {
      console.error(error);
    }
  }

  async necesarioStart() {
    await this.getTipoFacturas();

    if (this.BuscarPara === 'nota_credito' || this.BuscarPara === 'nota_debito') {
      await this.getPaqueteComprobante();
    }

    this.enfocarInput('campoI');
  }

  mostrarListaFacturas() {
    let res = false;
    if (this.facturas && this.facturas.length > 0) {
      if (this.campo === '1' || this.campo === '4') {
        res = true;
      } else if (this.campo === '3' && this.tipo_factura_id === '0') {
        res = true;
      } else {
        res = false;
      }
    } else {
      res = false;
    }

    return res;
  }

  async calcularPrecio(detalle, factura) {
    if (detalle.calcular_saco) {
      const fechaFactura = this.formarFechaFactura(factura.fecha_equivalente);
      const res = await this.dbServ.getArticulosFiltrados('Saco sistema', 1, 1, true, false, fechaFactura, 'todos').toPromise();

      const precio_saco = res.data[0].precio_principal;
      detalle.precio = detalle.precio + precio_saco;
      detalle.total = detalle.precio * detalle.cantidad;
    } else {
      detalle.precio = detalle.precio;
    }

    return detalle;
  }

  formarFechaFactura(date) {
    const hora = moment(date).hour();
    const minutos = moment(date).minutes();
    const fechaTemp = moment(date).format('YYYY-MM-DD');

    return fechaTemp + ' ' + (hora <= 9 ? '0' + hora : hora) + ':' + (minutos <= 9 ? '0' + minutos : minutos);
  }

  async pedirFactura(campo, valor, e) {
    try {
      const fechaA = moment().format('YYYY-MM-DD');
      // this.facturas = undefined;
      const page = e.page;
      const per_page = e.per_page;
      const busqueda = await this.dbServ.getFacturasByParams(campo, valor, this.tipo_factura_id, false, page, per_page, true).toPromise();

      busqueda['data'].map((fact) => {
        fact.secuencia = _.padStart(fact.numero_factura, 8, '0');
        fact.fecha = moment(fact.fecha_equivalente).format('DD/MM/YYYY');
        fact.fechaV = moment(fact.fecha_vencimiento).isValid() ? moment(fact.fecha_vencimiento).format('DD/MM/YYYY') : '';
        fact.pagoT = true;
        fact.estatus = fact.estado ? 'fas fa-check' : 'fas fa-times';
        fact.monto = GLOBAL.formatearNumero(GLOBAL.redondearAdos(fact.balance));
        fact.pago_a_tiempo = fact.fecha_vencimiento > fechaA ? true : false;
        fact.colorEstado = fact.estado ? 'green' : 'red';
        fact.selectColor = 'gris-claro';
        fact.select = 'far fa-eye-slash';

        fact.iconsMoveEvents = [{ key: 'select', hover: ['fa-eye', 'text-black'], leave: ['fa-eye-slash', 'text-gris-claro'] }];
        // fact.customStyles = [{ select: { estilos: [{ 'font-size': '1.5rem' }] } }, { 'td-estatus': { estilos: [{ width: '2rem' }] } }];
        fact.customStyles = {
          'td-select': { 'font-size': '1.5rem' },
          'td-condicion': { width: '6rem' },
          'td-secuencia': { width: '7rem' },
          'td-numero_comprobante': { width: '7rem' },
          'td-estatus': { width: '2rem' },
        };

        return fact;
      });

      // for (let i = 0; i < busqueda['data'].length; i++) {
      //   const factura = busqueda['data'][i];
      //   for (let j = 0; j < factura.detalle_facturas.length; j++) {
      //     let detalle = factura.detalle_facturas[j];

      //     detalle = await this.calcularPrecio(detalle, factura);
      //   }
      // }
      const obj = {
        total: busqueda.total_registros,
        tabla: 'facturas_parms',
      };

      this.tServ.Func_total_paginas(obj);
      this.facturas = GLOBAL.duplicarJson(busqueda['data']);

      if (this.facturas.length > 0) {
        if (this.campo === '2') {
          this.facturas[0]['mostrarFacturaPara'] = this.BuscarPara;
          this.facturaSelected = this.facturas[0];
          this.abrirModal(this.facturas[0], 'mostrarFactura');
        }
      } else {
        if (this.campo === '1') {
          if (this.tipo_factura_id === '0') {
            this.dbServ.toastError('Este cliente no tiene facturas a credito a su nombre', 'ERROR', true);
          } else {
            this.dbServ.toastError('Este cliente no tiene facturas del tipo seleccionada', 'ERROR', true);
          }
        } else if (this.campo === '3') {
          this.dbServ.toastError('No existen facturas con este número.', 'ERROR', true);
        } else if (this.campo === '2') {
          this.dbServ.toastError('La factura buscada no existe', 'ERROR', true);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  async abrirModalFiltro(nombre) {
    this.mServ.modalTipo('buscarCliente');
    this.tipoModal = 'buscarCliente';

    const obj = {
      data: this.listaClientes,
      filtrarCliente: nombre,
    };

    this.mServ.ModalSeleccion(obj);

    this.mServ.mostrarModal(true);
    // this.mServ.ModalTablaHeight(true);
  }

  changeSelect(valor) {
    this.tipo_factura_id = null;
    this.facturas = undefined;
    if (valor === '1') {
      this.campoSelected = 'Cliente';
      this.placeHolder = 'Nombre Cliente';
    } else if (valor === '2') {
      this.campoSelected = 'Numero Comprobante';
      this.placeHolder = 'Escriba numero de comprobante';
      this.tipo_factura_id = 0;
    } else if (valor === '3') {
      this.campoSelected = 'Numero Factura';
      this.placeHolder = 'Escriba numero de factura';
    } else if (valor === '4') {
      this.tipo_factura_id = '0';
      this.valor = '0';
      this.pedirFactura(this.campo, '0', this.tServ.obj_paginate);
    }
  }

  changePaginate(arg) {
    this.pedirFactura(this.campo, this.valor, arg);
  }

  abilitarBtns() {
    let res = true;
    if (this.facturaSelected) {
      res = false;
    } else {
      res = true;
    }
    return res;
  }

  abrirModal(arg, tipo) {
    const obj = arg;

    this.tipoModal = tipo;
    this.mServ.modalTipo(tipo);
    this.mServ.ModalSeleccion(obj);
    this.mServ.mostrarModal(true);
  }
  borrar(tipo = '') {
    this.tipoModal = null;
    this.NCF = null;
    this.facturas = undefined;
    if (tipo !== 'salir') {
      (document.getElementById('valorI') as any).value = null;
    }
    this.tipo_factura_id = null;
    this.campo = null;
    this.enfocarInput('campoI');
    this.mServ.mostrarModal(false);
    this.mServ.modalTipo(undefined);
    this.mServ.ModalDecision(undefined);
  }

  selectFactura(item) {
    if (item.column === 'select') {
      this.facturaSelected = undefined;
      setTimeout(() => {
        this.facturaSelected = this.facturas[item.index];
        this.indexSelected = item.index;

        this.facturaSelected['FACTURA_DE'] = 'venta';
        this.facturaSelected['mostrarFacturaPara'] = this.BuscarPara;
        this.abrirModal(this.facturaSelected, 'mostrarFactura');
      }, 5);
    }
  }

  confirmarSeleccion() {}
  validarRayaAbajo() {
    if (this.NCF) {
      let char = '';
      let num = 0;
      for (let index = 0; index < this.NCF.length; index++) {
        const c = this.NCF.charAt(index);
        char = c;
        num = index;
      }

      if (num < 10 || char === '_') {
        return false;
      } else {
        return true;
      }
    }
  }
  saltar(campo, valor) {
    if (valor && this.campo) {
      this.valor = valor;
      if (campo === 'cliente') {
        if (valor || valor === ' ') {
          this.abrirModalFiltro(valor);
          this.desEnfocarInput('valorI');
        }
      } else if (campo === 'buscarFactura') {
        this.NCF = null;

        if (this.campo === '2') {
          valor = valor.toUpperCase();
          this.NCF = valor;
          if (this.validarRayaAbajo()) {
            this.pedirFactura(this.campo, valor, this.tServ.obj_paginate);
          } else {
            this.dbServ.toastWarning('Numero de comprobante incorrecto', 'Aviso');
          }
        } else {
          if (this.tipo_factura_id === '0') {
            this.pedirFactura(this.campo, valor, this.tServ.obj_paginate);
          } else {
            this.pedirFactura(this.campo, valor, this.tServ.obj_paginate);
          }
        }
      } else {
        this.enfocarInput(campo);
      }
    }
  }
  formatoNumeroFactura(num) {
    return _.padStart(num, 8, '0');
  }
  enfocarInput(arg) {
    const element = document.getElementById(arg) as HTMLElement;
    element.focus();
  }
  desEnfocarInput(arg) {
    const element = document.getElementById(arg) as HTMLElement;
    element.blur();
  }
  selectContenido(arg) {
    const element = document.getElementById(arg) as any;
    element.select();
  }
  editarFactura() {
    this.router.navigateByUrl(`/admin/factura/venta/update/${this.facturaSelected.id}`);
  }
  decisionesModal() {
    if (this.BuscarPara === 'anular_factura') {
      this.CancelarFactura();
    }
    if (this.tipoModal === 'cancelarBusqueda') {
      this.borrar();
    }
  }
  async CancelarFactura() {
    try {
      const res = await this.dbServ.cancelarFactura(this.facturaSelected.id).toPromise();
      const temp = GLOBAL.duplicarJson(this.facturas);

      this.facturas = [];
      temp[this.indexSelected].estado = false;
      temp[this.indexSelected].select = false;
      this.facturas = temp;
    } catch (error) {
      console.error(error);
    }
  }
}
