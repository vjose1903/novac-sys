import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { GLOBAL } from '../../../core/typescript/GLOBAL';
import * as _ from 'lodash';
import * as moment from '../../../core/javascript/moment';
import { ActivatedRoute, Router } from '@angular/router';
import { TablasComponent } from '../../components/tablas/tablas.component';
import { TablasService } from '../../components/tablas/tablas.service';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { LoaderService } from '../../../loader/loader.service';
import { ArticuloC } from '../../registros/articulos/articulo';
import { FacturaC, TiposFacturaC } from '../../facturacion/factura';
import { NcfC } from '../../registros/ncf/ncf';
import { PdfService } from '../../../core/services/pdf/pdf.service';
import { PdfViewerComponent } from '../../components/pdf-viewer/pdf-viewer.component';
import { BuscarClienteSuplidorComponent } from '../../components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { NotaC } from '../notas-cred-deb/notas';

@Component({
  selector: 'app-buscar-factura',
  templateUrl: './buscar-factura.component.html',
  styleUrls: ['./buscar-factura.component.scss'],
})
export class BuscarFacturaComponent extends MixinClass implements OnInit, OnDestroy {
  facturas: any;
  campoSelected: string;
  clienteBuscado: any;
  listaClientes;
  facturaSelected: any;
  @ViewChild(TablasComponent) tablas: TablasComponent;
  buscarPara: any;
  NCF;
  Para: string;
  tipoModal: any;

  lista_tipos_facturas: any;
  existenComprobantes = false;
  tipo_factu_nota: any;
  paqueteComprobante: any;
  tipo_factura_id = null;
  valor: any;
  notasClass = new NotaC();
  articuloClass = new ArticuloC();
  facturaClass = new FacturaC();
  tiposFacturasClass = new TiposFacturaC();
  ncfClass = new NcfC();
  notas: any = [];
  notaSelected: string;
  showSide: boolean = false;
  TablasComponent;

  constructor(private route: ActivatedRoute, private router: Router, private tServ: TablasService, public loadServ: LoaderService, private pdfServ: PdfService) {
    super();
  }
  campo = null;
  placeHolder = '';

  info = [
    { titulo: ' ', tipo: 'icon', key: 'estatus', text_color: 'colorEstado', color: true, estilos: [{ width: '2rem' }] },
    { titulo: 'Numero Fact', tipo: 'text', key: 'secuencia', estilos: [{ width: '7rem' }] },
    { titulo: 'Tipo', tipo: 'text', key: 'tipo_factura' },
    { titulo: 'Comprobante', tipo: 'text', key: 'numero_comprobante', estilos: [{ width: '7rem' }] },
    { titulo: 'Condicion', tipo: 'text', key: 'condicion', estilos: [{ width: '6rem' }] },
    { titulo: 'Fecha Facturación', tipo: 'text', key: 'fecha' },
    { titulo: 'Fecha Vencimiento', tipo: 'text', key: 'fechaV' },
    { titulo: 'Total facturado', tipo: 'formatoNumero', key: 'total_factura', formatoNumero: true },
    { titulo: 'Balance tactura', tipo: 'formatoNumero', key: 'balance', formatoNumero: true },
    {
      titulo: '7',
      tipo: 'icon',
      key: 'view',
      text_color: 'viewColor',
      color: true,
      estilos: [{ width: '0%' }, { color: 'var(--transparente00)' }],
    },
    {
      titulo: 'Acciones',
      text_tooltip: 'tooltip_select',
      tipo: 'icon',
      key: {
        key: 'selected',
        source: 'is_selected',
        clases: [
          { value: true, clase: 'far fa-check-square' },
          { value: false, clase: 'far fa-square' },
        ],
      },
      text_color: 'selectedColor',
      color: true,
      estilos: [{ width: '9%' }],
    },
  ];

  infoNota = [
    { titulo: 'Fecha', tipo: 'text', key: 'fecha' },
    { titulo: 'Comprobante', tipo: 'text', key: 'numero_comprobante', estilos: [{ width: '7rem' }] },
    { titulo: 'Total nota', tipo: 'formatoNumero', key: 'total', formatoNumero: true },
    { titulo: 'Seleccione', tipo: 'icon', key: 'view', text_color: 'viewColor', color: true },
  ];

  ncfMask = [/b/, /[0-9]/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/];

  ngOnInit() {
    this._init_mixin({ component: 'buscar_factura', is_routing: true, _lista_subs: ['decisionModal', 'objDevuelto', 'pressEsc', 'noFiltro'] });
    this.buscarPara = this.route.snapshot.params['para'];

    if (this.buscarPara === 'nota_credito') {
      this.tipo_factu_nota = '04';
    } else if (this.buscarPara === 'nota_debito') {
      this.tipo_factu_nota = '03';
    }

    this.necesarioStart();
    this.completarTituloPag();
  }

  async necesarioStart() {
    await this.getTipoFacturas();

    this.tServ.initPagination('facturas_params', this.tServ.obj_paginate.default);

    if (this.buscarPara === 'nota_credito' || this.buscarPara === 'nota_debito') await this.getPaqueteComprobante();

    this.enfocarInput('campoI');
  }

  pressEscResponse(res) {
    if (this.fun.hasValue(res)) this.enfocarInput('valorI');
  }

  reimprimirFactura(obj, modalInstance) {
    this.loadServ.isLoading.next(true);
    this.pdfServ
      .generatePdf({ oPdf: obj, imprimir: true })
      .then(async (res) => {
        this.loadServ.isLoading.next(false);
        if (res.status === 'si') {
          this.fun.toastSuccess(res.msg, 'CORRECTO');
          modalInstance.closeModal(modalInstance.id, 'imprimir');
        } else this.fun.toastError(res.msg, 'ERROR');
      })
      .catch((err) => {
        this.loadServ.isLoading.next(false);
        this.fun.toastError(err.msg, 'ERROR');
      });
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  noFiltroResponse(res) {
    if (res.tipo == 'buscarCliente') {
      this.enfocarInput('valorI');
      this.selectContenido('valorI');
    }
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
    this.borrar('salir');
  }

  async getPaqueteComprobante() {
    try {
      const tipoFact = this.lista_tipos_facturas.find((tipo) => tipo.referencia === this.tipo_factu_nota);
      const res = await this.ncfClass.getAll({ afterPath: `custom/${tipoFact.id}/true` });

      this.paqueteComprobante = res['data'] as any;

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
            ? `Ultimo comprobante para ${tipoFact.descripcion}.`
            : `Los comprobantes para ${tipoFact.descripcion} se estan agotando, solo quedan ${restante}`;

        if (secuencia >= limite) {
          this.fun.toastWarning(msg, 'AVISO');
        }
      }
    } catch (error) {
      this.existenComprobantes = true;
      console.error(error);
      this.fun.toastError(error.error.msg, 'ERROR');
    }
  }

  completarTituloPag() {
    if (this.buscarPara === 'anular_factura') {
      this.Para = ' Anular factura';
    } else if (this.buscarPara === 'nota_credito') {
      this.Para = ' Nota de crédito';
    } else if (this.buscarPara === 'nota_debito') {
      this.Para = ' Nota de débito';
    } else if (this.buscarPara === 'solo_ver') {
      this.Para = ' Visualizar';
    }

    if (this.Para == ' Visualizar') {
      this.info = _.filter(this.info, (infoItem) => {
        if (infoItem.key === 'view') {
          infoItem.titulo = 'Acciones';
          infoItem.estilos = [{ width: '9%' }];
        }
        return !(infoItem.key?.key === 'selected');
      });
    }
  }

  async getTipoFacturas() {
    try {
      const res = await this.tiposFacturasClass.getAll();

      this.lista_tipos_facturas = res;
    } catch (error) {
      console.error(error);
    }
  }

  async openSide() {
    this.tServ.initPagination('notas', this.tServ.obj_paginate.default);

    this.getNotas(this.tServ.getPaginationById('notas'));
    this.showSide = true;
    setTimeout(() => this.TablasComponent.calcularAlto(), 100);
  }

  getNotas(e) {
    return new Promise(async (resolve) => {
      const page = e.page;
      const per_page = e.per_page;
      const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;

      const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: page, per_page: per_page, paginado: true } };

      const busqueda = await this.notasClass.getAll(extra);

      busqueda['data'].map((fact) => {
        fact.secuencia = _.padStart(fact.numero_factura, 8, '0');
        fact.fecha = moment(fact.fecha_equivalente).format('DD/MM/YYYY');
        fact.total_factura = this.fun.numFormatTwoDecimals(Math.abs(fact.total_factura));
        fact.selectedColor = 'gris-claro';
        fact.viewColor = 'gris-claro';
        fact.view = 'far fa-eye-slash';

        fact.iconsMoveEvents = [{ key: 'view', hover: ['fa-eye', 'text-black'], leave: ['fa-eye-slash', 'text-gris-claro'] }];

        fact.customStyles = { 'td-view': { 'font-size': '1.5rem' }, 'td-numero_comprobante': { width: '7rem' } };

        return fact;
      });

      this.notas = busqueda['data'];
      console.log('this.notas ', this.notas);

      const obj = { total: busqueda.total_registros, tabla: 'notas' };

      this.tServ.Func_total_paginas(obj);
      resolve(true);
    });
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
      const fechaFactura = this.formarFechaFactura(factura.fecha_equivalente)['FechaFactura'];

      this.articuloClass.getArticulosFiltrado({ buscar: 'Saco sistema', fecha: fechaFactura, paginado: false }).then((res) => {
        const precio_saco = res.data[0].precio_principal;
        detalle.precio = detalle.precio + precio_saco;
        detalle.total = detalle.precio * detalle.cantidad;
      });
    } else {
      detalle.precio = detalle.precio;
    }

    return detalle;
  }

  async pedirFactura(campo, valor, e) {
    try {
      const fechaA = moment().format('YYYY-MM-DD');

      const args = { campo, valor, tipo_factura_id: this.tipo_factura_id, adelantada: false, page: e.page, per_page: e.per_page, paginado: true, fact_de: 'venta' };
      const busqueda = await this.facturaClass.getFacturasByParams(args);

      busqueda['data'].map((fact) => {
        fact.secuencia = _.padStart(fact.numero_factura, 8, '0');
        fact.fecha = moment(fact.fecha_equivalente).format('DD/MM/YYYY');
        fact.fechaV = moment(fact.fecha_vencimiento).isValid() ? moment(fact.fecha_vencimiento).format('DD/MM/YYYY') : '';
        fact.pagoT = true;
        fact.estatus = fact.estado ? 'fas fa-check' : 'fas fa-times';
        fact.monto = this.fun.formatearNumero(this.fun.redondearAdos(fact.balance));
        fact.pago_a_tiempo = fact.fecha_vencimiento > fechaA ? true : false;
        fact.colorEstado = fact.estado ? 'green' : 'red';
        fact.viewColor = 'gris-claro';
        fact.view = 'far fa-eye-slash';
        fact.is_selected = false;
        fact.tooltip_select = 'Seleccionar Factura';

        fact.iconsMoveEvents = [{ key: 'view', hover: ['fa-eye', 'text-black'], leave: ['fa-eye-slash', 'text-gris-claro'] }];
        // fact.customStyles = [{ view: { estilos: [{ 'font-size': '1.5rem' }] } }, { 'td-estatus': { estilos: [{ width: '2rem' }] } }];
        fact.customStyles = {
          'td-condicion': { width: '6rem' },
          'td-secuencia': { width: '7rem' },
          'td-numero_comprobante': { width: '7rem' },
          'td-estatus': { width: '2rem' },
          'td-view': { width: '4%', 'padding-left': '1rem', 'font-size': '1.5rem' },
          'td-selected': { width: '4%', 'font-size': '1.5rem' },
        };

        if (this.Para === ' Visualizar') {
          delete fact.customStyles['td-selected'];
          fact.customStyles['td-view'].width = '9%';
        }

        return fact;
      });

      const obj = { total: busqueda.total_registros, tabla: 'facturas_params' };

      this.tServ.Func_total_paginas(obj);
      this.facturas = this.fun.duplicarJson(busqueda['data']);

      if (this.facturas.length > 0) {
        if (this.campo === '2') {
          this.facturas[0]['mostrarFacturaPara'] = this.buscarPara;

          this.parseFactura(this.facturas[0], 'venta', this.buscarPara).then((res) => {
            this.facturaSelected = res;
          });
        }
      } else {
        if (this.campo === '1') {
          if (this.tipo_factura_id === '0') {
            this.fun.toastError('Este cliente no tiene facturas a credito a su nombre', 'ERROR');
          } else {
            this.fun.toastError('Este cliente no tiene facturas del tipo seleccionada', 'ERROR');
          }
        } else if (this.campo === '3') {
          this.fun.toastError('No existen facturas con este número.', 'ERROR');
        } else if (this.campo === '2') {
          this.fun.toastError('La factura buscada no existe', 'ERROR');
        }
      }
    } catch (error) {
      console.error(error);
    }
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

      this.pedirFactura(this.campo, '0', this.tServ.getPaginationById('facturas_params'));
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
  }

  parseFactura(factura, fact_de, buscarPara) {
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        factura['FACTURA_DE'] = fact_de;
        factura['mostrarFacturaPara'] = buscarPara;
        resolve(factura);
      }, 5);
    });
  }

  clickIconHandler(item) {
    if (item.column === 'view') {
      this.parseFactura(item.row, 'venta', 'revisar').then((res) => {
        this.facturaSelected = res;

        this.mostrarFactura(res);
      });
    } else if (item.column === 'selected') {
      item.row.is_selected = !item.row.is_selected;

      // const factura_in_turn = _.find(this.facturas, (item) => item.id == item.row.id);
      // factura_in_turn.is_selected = !factura_in_turn.is_selected;
    }
  }

  selectNota(event) {
    if (event.column === 'view') {
      this.parseFactura(event.row, 'nota', 'reimprimir').then((res) => {
        this.notaSelected = res;
        this.mostrarFactura(res);
      });
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
    const actualPagination = this.tServ.getPaginationById('facturas_params');

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

          this.pedirFactura(this.campo, valor, actualPagination);
        } else {
          if (this.tipo_factura_id === '0') {
            this.pedirFactura(this.campo, valor, actualPagination);
          } else {
            this.pedirFactura(this.campo, valor, actualPagination);
          }
        }
      } else {
        this.enfocarInput(campo);
      }
    } else {
      if (campo === 'buscarFactura') {
        this.fun.toastWarning('Numero de comprobante incorrecto', 'Aviso');
      }
    }
  }

  async abrirModalFiltro(nombre) {
    const obj = {
      data: this.listaClientes,
      palabra_a_buscar: nombre,
      metodo: 'venta',
    };

    this.handleModalForm({
      component: BuscarClienteSuplidorComponent,
      inputs: obj,
      id: 'buscarCliente',
      header: 'Buscar cliente',
      width: '900px',
      height: '500px',
      botones: {
        aceptar: { show: false, disable: false },
        cancelar: { show: false, disable: false },
        // dinamico: [{ clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, 'cancelar'), label: 'Cerrar', disable: false }],
      },
    });
  }

  formatoNumeroFactura(num) {
    return _.padStart(num, 8, '0');
  }

  editarFactura() {
    this.router.navigateByUrl(`/admin/factura/venta/update/${this.facturaSelected.id}`);
  }

  decisionesModal() {
    if (this.buscarPara === 'anular_factura') this.CancelarFactura();

    if (this.tipoModal === 'cancelarBusqueda') this.borrar();
  }

  // get hayFacturasSelecciomnadas(): boolean {
  //   return _.some(this.facturas, { is_selected: true });
  // }

  async CancelarFactura() {
    try {
      const res = await this.facturaClass.createOne(null, { afterPath: `anular_factura/${this.facturaSelected.id}` });
      const actualPagination = this.tServ.getPaginationById('facturas_params');
      this.pedirFactura(this.campo, this.valor, actualPagination);
    } catch (error) {
      console.error(error);
    }
  }

  get idsFacturasSeleccionadas() {
    const facturasSelecc = _.filter(this.facturas, { is_selected: true });
    const ids = _.map(facturasSelecc, 'id');
    return ids;
  }

  continuarAManipularFactura() {
    const url = `/admin/manipular/nota/${this.buscarPara === 'nota_credito' ? 'credito' : 'debito'}/${JSON.stringify(this.idsFacturasSeleccionadas)}`;
    this.router.navigateByUrl(url);
  }

  mostrarFactura(dataFactura) {
    const toPDFData = { data: dataFactura, type: 'facturacion' };
    this.pdfServ.generatePdf({ oPdf: toPDFData, imprimir: false }).then(async (res) => {
      if (res.status === 'si') {
        const inputs = { pdfSrc: res.body, titulo: 'PRUEBA REPORTE', height: '30rem', reimprimir: res.reimprimir, fileName: res.file.split('.')[0] };
        const obj_modal = {
          component: PdfViewerComponent,
          inputs: inputs,
          id: 'mostrarFactura',
          header: 'Mostrar Factura',
          width: '900px',
          botones: {
            aceptar: { show: false, disable: false },
            cancelar: { show: false, disable: false },
            dinamico: [{ clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, 'cancelar'), label: 'Cerrar', disable: false }],
          },
        };

        if (this.Para == ' Visualizar') {
          obj_modal.botones.dinamico.push({
            clase: 'btn btn-amarillo ml-2',
            function: (instance) => this.reimprimirFactura({ data: this.facturaSelected, type: 'facturacion' }, instance),
            label: 'Reimprimir',
            disable: false,
          });
        }
        this.handleModalForm(obj_modal);
      }
    });
  }
  getDataFromModal(arg, search) {
    if (arg.modal_id === 'buscarCliente') {
      this.clienteBuscado = arg.data;
      (document.getElementById('valorI') as any).value = arg.data.nombre;
      this.valor = arg.data.id;
      const actualPagination = this.tServ.getPaginationById('facturas_params');
      this.pedirFactura('1', arg.data.id, actualPagination);
    }
  }
}
