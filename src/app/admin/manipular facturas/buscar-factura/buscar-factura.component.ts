import { tipoDocFacturacion } from './../../facturacion/factura';
import { Ss } from './../../../core/services/singleton.service';
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import * as _ from 'lodash';
import * as moment from '../../../core/javascript/moment';
import { ActivatedRoute, Router } from '@angular/router';
import { TablasService } from '../../components/new_tablas/tablas.service';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { LoaderService } from '../../../loader/loader.service';
import { ArticuloC } from '../../registros/articulos/articulo';
import { FacturaC, TiposFacturaC } from '../../facturacion/factura';
import { NcfC } from '../../registros/ncf/ncf';
import { PdfService } from '../../../core/services/pdf/pdf.service';
import { PdfViewerComponent } from '../../components/pdf-viewer/pdf-viewer.component';
import { BuscarClienteSuplidorComponent } from '../../components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { NotaC } from '../notas-cred-deb/notas';
import { fun } from '../../../core/services/functions.service';
import { Permisos } from '../../../core/typescript/permisos';
import { table_config } from '../../components/new_tablas/tabla-class';
import { ModalClass } from '../../components/modal/modal-class';
import { BuscarFacturaC } from './buscar-factura';

@Component({
  selector: 'app-buscar-factura',
  templateUrl: './buscar-factura.component.html',
  styleUrls: ['./buscar-factura.component.scss'],
})
export class BuscarFacturaComponent extends MixinClass implements OnInit, OnDestroy {
  facturas = [];

  facturaSelected: any;
  buscarPara: any;
  para: string;

  lista_tipos_facturas: any;
  noExistenComprobantes = false;
  paqueteComprobante: any;
  tipo_factura_id = null;
  valor_a_buscar: any;

  notasClass = new NotaC();
  articuloClass = new ArticuloC();
  facturaClass = new FacturaC();
  tiposFacturasClass = new TiposFacturaC();
  ncfClass = new NcfC();

  notas: any = [];
  notaSelected: string;
  showSide: boolean = false;
  TablasComponent;
  idsFacturasSeleccionadas = [];
  permissions = Permisos;

  tipos_documentos = [];
  tipo_documento_selected = 'venta';

  buscar_por = null;

  campos = {
    cliente: 1,
    numeroComprobante: 2,
    numeroFactura: 3,
    ultimas50: 4,
    suplidor: 5,
  };

  fun = fun;

  table_config;

  tablaComponent;

  table_notas_config: table_config = {
    info: [
      { titulo: 'Fecha', tipo: 'date', key: 'fecha_equivalente' },
      { titulo: 'Comprobante', tipo: 'text', key: 'numero_comprobante', estilos: [{ width: '7rem' }] },
      { titulo: 'Total nota', tipo: 'formatoNumero', key: 'total' },
      { titulo: 'Acciones', tipo: 'icon', key: 'actions', iconsArray: [{ key: 'view', tooltip: 'Ver Nota', text_color: 'viewColor' }] },
    ],
    colores: true,
    filtrar: { local: false },
    id_tabla: 'lista_notas',
    padre_functions: { data_request: (params) => this.pedirNotas(params) },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
  };

  tablaNotasComponent;
  hasPermisoPreVenta: boolean = false;
  hasPermisoCotizacion: boolean = false;

  constructor(private route: ActivatedRoute, private router: Router, private tServ: TablasService, public loadServ: LoaderService) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'buscar_factura', is_routing: true });
    this.buscarPara = this.route.snapshot.params['para'];

    this.necesarioStart();
  }

  necesarioStart() {
    this.verificatePermisos().then(async (res) => {
      this.selectTableConfig();
      this.completarTituloPag();
      await this.getTipoFacturas();

      fun.enfocarInput(this.buscarPara === 'solo_ver' ? 'tipoI' : 'buscarPorI');
    });
  }

  verificatePermisos() {
    return new Promise<any>((resolve, reject) => {
      const promomiseList = <any>[];

      promomiseList.push(Ss.permissionsService.hasPermission(Object.values(this.permissions.pre_venta)));
      promomiseList.push(Ss.permissionsService.hasPermission(Object.values(this.permissions.cotizacion)));

      Promise.all(promomiseList).then((values) => {
        const permisos = ['hasPermisoPreVenta', 'hasPermisoCotizacion'];

        for (let index = 0; index < permisos.length; index++) {
          const permiso = permisos[index];
          const has_permiso = values[index];
          this[permiso] = has_permiso;
        }

        resolve(true);
      });
    });
  }

  pressEscResponse(res) {
    if (fun.hasValue(res)) fun.enfocarInput('valorI');
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      arg['verificar'] = true;
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
    this.borrar('salir');
  }

  async getPaqueteComprobante() {
    try {
      const tipoFact = this.lista_tipos_facturas.find((tipo) => tipo.referencia === NotaC.base_comprobante[this.buscarPara]);
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

        const msg = this.paqueteComprobante.msg == 'Ultimo comprobante de este paquete' ? `Ultimo comprobante para ${tipoFact.descripcion}.` : `Los comprobantes para ${tipoFact.descripcion} se estan agotando, solo quedan ${restante}`;

        if (secuencia >= limite) fun.toastWarning(msg, 'AVISO');
      }
    } catch (error) {
      this.noExistenComprobantes = true;
      console.error(error);
      // fun.toastError(error.error.msg, 'ERROR');
    }
  }

  completarTituloPag() {
    if (this.buscarPara == 'anular_factura') {
      this.para = 'Anular factura';
    } else if (this.buscarPara == 'nota_credito') {
      this.para = 'Nota de crédito';
    } else if (this.buscarPara == 'nota_debito') {
      this.para = 'Nota de débito';
    } else if (this.buscarPara == 'solo_ver') {
      this.para = 'Visualizar';

      const td_actions = _.find(this.table_config.info, { key: 'actions' });
      const btn_select = _.find(td_actions.iconsArray, { id: 'select' });

      _.pull(td_actions.iconsArray, btn_select);

      this.makeTiposDocumentos();
    }
  }

  makeTiposDocumentos() {
    const tipos = [
      { condition: true, value: tipoDocFacturacion.venta, label: 'Factura de venta' },
      { condition: true, value: tipoDocFacturacion.compra, label: 'Factura de compra' },
      { condition: this.hasPermisoPreVenta, value: tipoDocFacturacion.pre_venta, label: 'Pre-Venta' },
      { condition: this.hasPermisoCotizacion, value: tipoDocFacturacion.cotizacion, label: 'Cotización' },
    ];

    tipos.forEach((tipo) => {
      if (tipo.condition) this.tipos_documentos.push(tipo);
    });
  }

  async getTipoFacturas() {
    try {
      const res = await this.tiposFacturasClass.getAll();

      this.lista_tipos_facturas = res;
    } catch (error) {
      console.error(error);
    }
  }

  onHideSide() {
    this.notas.length = 0;
  }

  async openSide() {
    this.pedirNotas(this.tServ.obj_paginate.default);
    this.showSide = true;
  }

  async pedirNotas(params?: { per_page: number; page: number; search: string }) {
    return new Promise(async (resolve) => {
      this.notas.length = 0;
      const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

      const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true, tipo_nota: this.buscarPara.includes('credito') ? NotaC.tipo_nota.credito : NotaC.tipo_nota.debito } };

      const res = await this.notasClass.getAll(extra);

      res['data'].forEach((nota) => {
        nota.secuencia = _.padStart(nota.numero_factura, 8, '0');
        nota.total = Math.abs(nota.total);
        nota.selectedColor = 'gris-claro';
        nota.viewColor = 'gris-claro';
        nota.view = 'far fa-eye-slash';

        nota.iconsMoveEvents = [{ key: 'view', hover: ['fa-eye', 'text-black'], leave: ['fa-eye-slash', 'text-gris-claro'] }];

        nota.customStyles = {
          actions: [{ key: 'view', estilos: 'font-size: 1.2rem !important' }],
          numero_comprobante: { width: '7rem' },
        };

        this.notas.push(nota);
      });

      setTimeout(() => this.tablaNotasComponent.changeConfig([{ total_count: res.total_registros }]), 10);
      resolve(true);
    });
  }

  mostrarListaFacturas() {
    let res = false;
    if (this.facturas && this.facturas.length > 0) {
      if (this.buscar_por == this.campos.cliente || this.buscar_por == this.campos.ultimas50 || this.buscar_por == this.campos.suplidor) {
        res = true;
      } else if (this.buscar_por == this.campos.numeroFactura && this.tipo_factura_id == '0') {
        res = true;
      } else {
        res = false;
      }
    } else {
      res = false;
    }

    return res;
  }

  async pedirFactura(params?: { per_page: number; page: number; search: string }) {
    try {
      this.facturas.length = 0;

      const args = { campo: this.buscar_por, valor: this.valor_a_buscar, tipo_factura_id: this.tipo_factura_id, adelantada: false, page: params.page, per_page: params.per_page, paginado: true, fact_de: this.tipo_documento_selected };

      const res = await this.facturaClass.getFacturasByParams(args);

      res['data'].forEach((fact) => {
        const pago_a_tiempo = this.getIsPagoAtiempo(fact);
        const estatus = this.getIsActiveInfo(fact);

        fact.secuencia = _.padStart(fact.numero_factura, 8, '0');
        fact.fechaV = fun.hasValue(fact?.fecha_vencimiento) && moment(fact?.fecha_vencimiento).isValid() ? moment(fact.fecha_vencimiento).format('DD/MM/YYYY') : '';
        fact.colorFechaV = pago_a_tiempo ? 'black' : 'red';
        fact.is_active = estatus.icon;
        fact.is_active_tooltip = estatus.tooltip;
        fact.is_active_color = estatus.color;
        fact.monto = fun.numFormatTwoDecimals(fact.balance);
        fact.viewColor = 'gris-claro';
        fact.view = 'far fa-eye-slash';
        fact.delete = 'far fa-trash-alt';
        fact.make_bill = 'fas fa-external-link-alt';

        fact.is_selected = this.idsFacturasSeleccionadas.includes(fact.id);
        fact.tooltip_select = 'Seleccionar Factura';

        fact.iconsMoveEvents = [{ key: 'view', hover: ['fa-eye', 'text-black'], leave: ['fa-eye-slash', 'text-gris-claro'] }];

        fact.customStyles = {
          condicion: { width: '6rem' },
          secuencia: { width: '7rem' },
          numero_comprobante: { width: '7rem' },
          estado: [{ key: 'estado', isTd: true, estilos: 'width: 2rem !important;' }],
          actions: [
            { key: 'actions', isTd: true, estilos: 'width: 8% !important;' },
            { key: 'view', estilos: 'font-size: 1.1rem !important;' },
            { key: 'delete', estilos: 'font-size: 1.1rem !important;' },
            { key: 'make_bill', estilos: 'font-size: 1.1rem !important; margin:  0rem 0.8rem !important;' },
            { key: 'selected', estilos: 'margin-left: 0.8rem !important; font-size: 1.2rem !important;' },
          ],
        };

        if (this.para == 'Visualizar') _.pull(fact.customStyles.actions, _.find(fact.customStyles.actions, { key: 'selected' }));

        this.facturas.push(fact);
      });

      this.facturas = _.orderBy(this.facturas, ['fecha_equivalente'], ['desc']);

      console.log('this.facturas ', this.facturas);

      if (this.facturas.length > 0) {
        if (this.buscar_por == this.campos.numeroComprobante || (this.buscar_por == this.campos.numeroFactura && this.tipo_factura_id != '0')) {
          this.facturaClass.parseDataToPdf(this.facturas[0]).then((factura_parsed) => {
            const continuar = this.buscarPara != 'solo_ver' && (this.buscar_por == this.campos.numeroComprobante || this.buscar_por == this.campos.numeroFactura);
            this.facturaSelected = factura_parsed;
            this.mostrarFactura(factura_parsed, 'facturacion', null, continuar);
          });
        } else {
          setTimeout(() => this.tablaComponent.changeConfig([{ total_count: res.total_registros }]), 100);
        }
      } else {
        if (this.buscar_por == this.campos.cliente) {
          fun.toastError('Este cliente no tiene facturas del tipo seleccionada', 'ERROR');
        } else if (this.buscar_por == this.campos.suplidor) {
          fun.toastError('Este suplidor no tiene facturas del tipo seleccionada', 'ERROR');
        } else if (this.buscar_por == this.campos.numeroFactura) {
          fun.toastError('No existen facturas con este número.', 'ERROR');
        } else if (this.buscar_por == this.campos.numeroComprobante) {
          fun.toastError('La factura buscada no existe', 'ERROR');
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  getIsActiveInfo(factura) {
    let res = { icon: null, tooltip: null, color: null };

    if (this.tipo_documento_selected == 'compra') {
      res.icon = factura.estado ? (factura.balance < 1 ? 'fas fa-check' : 'fas fa-exclamation-triangle') : 'fas fa-times';
      res.tooltip = factura.estado ? (factura.balance < 1 ? 'Factura saldada' : 'Factura pendiente de pago') : 'Factura anulada';
      res.color = factura.estado ? (factura.balance < 1 ? 'green' : 'yellow') : 'red';
    } else {
      res.icon = factura.estado ? 'fas fa-check' : 'fas fa-times';
      res.tooltip = factura.estado ? 'Factura Activa' : 'Factura Inactiva';
      res.color = factura.estado ? 'green' : 'red';
    }
    return res;
  }
  getIsPagoAtiempo(factura) {
    let pago_a_tiempo = true;

    if (factura.condicion != 'Crédito' || factura.pagada) return pago_a_tiempo;
    console.log(' ');
    console.log('factura: ', factura);

    const fecha_actual = moment().format('YYYY-MM-DD');

    pago_a_tiempo = moment(factura.fecha_vencimiento).format('YYYY-MM-DD') > fecha_actual;

    return pago_a_tiempo;
  }

  resetFacturas() {
    this.facturas.length = 0;
    if (fun.hasValue(this.table_config)) {
      this.tServ.initPagination('facturas_params', this.table_config.obj_paginate);
    }
  }

  selectTableConfig() {
    this.table_config = BuscarFacturaC.tables_config[this.tipo_documento_selected];
    this.table_config['padre_functions'] = { data_request: (params) => this.pedirFactura(params) };
  }

  changeSelect(tipo, valor) {
    if (tipo == 'tipo_documento') {
      this.buscar_por = null;
      this.selectTableConfig();
    }

    this.tipo_factura_id = null;
    this.valor_a_buscar = null;
    this.idsFacturasSeleccionadas.length = 0;

    const valorInput = document.getElementById('valorI') as any;
    if (fun.hasValue(valorInput)) valorInput.value = null;

    this.resetFacturas();
    const tipos_cero = [this.campos.numeroComprobante, this.campos.ultimas50, this.campos.numeroFactura].map((item) => `${item}`);

    if (tipos_cero.includes(valor)) this.tipo_factura_id = '0';

    if (valor == this.campos.ultimas50) this.pedirFactura(this.tServ.obj_paginate.default);
  }

  getProperties(tipo) {
    let res;

    if (tipo == 'label') {
      if (this.buscar_por == this.campos.cliente) res = 'Cliente';
      if (this.buscar_por == this.campos.numeroComprobante) res = 'Numero Comprobante';
      if (this.buscar_por == this.campos.numeroFactura) res = this.tipo_documento_selected == tipoDocFacturacion.cotizacion ? 'Número Cotización' : 'Número Factura';
      if (this.buscar_por == this.campos.suplidor) res = 'Suplidor';
    } else {
      if (this.buscar_por == this.campos.cliente) res = 'Nombre Cliente';
      if (this.buscar_por == this.campos.numeroComprobante) res = 'Escriba numero de comprobante';
      if (this.buscar_por == this.campos.numeroFactura) res = this.tipo_documento_selected == tipoDocFacturacion.cotizacion ? 'Escriba número de Cotización' : 'Escriba número de Factura';
      if (this.buscar_por == this.campos.suplidor) res = 'Nombre Suplidor';
    }
    return res;
  }

  changePaginate(arg) {
    this.pedirFactura(arg);
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
    this.resetFacturas();
    if (tipo != 'salir') (document.getElementById('valorI') as any).value = null;

    this.tipo_documento_selected = 'venta';
    this.tipo_factura_id = null;
    this.buscar_por = null;
    fun.enfocarInput(this.buscarPara === 'solo_ver' ? 'tipoI' : 'buscarPorI');
  }

  tableClickIcon(params) {
    if (params.id_tabla == 'lista_notas') {
      if (params.columnKey == 'actions') {
        if (params.iconKey == 'view') {
          this.notaSelected = params.data;

          this.notasClass.parseDataToPdf(params.data).then((data_parsed) => this.mostrarFactura(data_parsed, 'nota', params.data));
        }
      }
    } else if (params.id_tabla == 'facturas_params') {
      if (params.columnKey == 'actions') {
        if (params.iconKey == 'view') {
          this.facturaClass.parseDataToPdf(params.data).then((factura_parsed) => {
            this.facturaSelected = factura_parsed;
            console.log('this.facturaSelected ', this.facturaSelected);

            this.mostrarFactura(factura_parsed, this.tipo_documento_selected == tipoDocFacturacion.cotizacion ? 'cotizacion' : 'facturacion');
          });
        }

        if (params.idIcon == 'select') {
          params.data.is_selected = !params.data.is_selected;

          params.data.is_selected ? this.idsFacturasSeleccionadas.push(params.data.id) : _.pull(this.idsFacturasSeleccionadas, params.data.id);
        }

        if (params.iconKey == 'delete') {
          fun.logRed('BORRAR FACTURA ', params);
        }

        if (params.iconKey == 'make_bill') this.pasarCotizacionAfacturar(params.data);
      }
    }
  }

  pasarCotizacionAfacturar(cotizacion) {
    setTimeout(() => this.router.navigateByUrl(`/admin/factura/venta/bill_from_cotizacion/${cotizacion.id}`), 10);
  }

  saltar(salioDe, valor) {
    this.resetFacturas();
    const actualPagination = this.tServ.getPaginationById('facturas_params', 'saltar');

    let siguiente_input;
    this.valor_a_buscar = valor;

    switch (salioDe) {
      case 'tipoI':
        siguiente_input = 'buscarPorI';
        break;

      case 'buscarPorI':
        siguiente_input = this.buscar_por == this.campos.numeroComprobante || this.tipo_documento_selected == tipoDocFacturacion.cotizacion ? 'valorI' : 'campoTipoFact';
        break;

      case 'campoTipoFact':
        siguiente_input = 'valorI';
        break;

      case 'cliente':
        fun.desEnfocarInput('valorI');

        if (fun.hasValue(valor) || valor == ' ') this.abrirModalFiltro(valor);

        break;

      case 'buscarFactura':
        if (this.buscar_por == this.campos.numeroComprobante) this.valor_a_buscar = valor.toUpperCase();

        fun.desEnfocarInput('valorI');
        this.pedirFactura(actualPagination);

        break;
    }

    if (fun.hasValue(siguiente_input)) fun.enfocarInput(siguiente_input);
  }

  async abrirModalFiltro(nombre) {
    const obj = { data: null, palabra_a_buscar: nombre, metodo: this.tipo_documento_selected };

    this.openNewModal({
      component: BuscarClienteSuplidorComponent,
      inputs: obj,
      id: 'buscarClienteOsuplidor',
      header: this.tipo_documento_selected == 'compra' ? 'Buscar Suplidor' : 'Buscar Cliente',
      width: '900px',
      height: '500px',
      botones: fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons),
    });
  }

  formatoNumeroFactura(num) {
    return _.padStart(num, 8, '0');
  }

  editarFactura() {
    this.facturaClass.getAll({ afterPath: `custom/canUpdate/${this.facturaSelected.id}` }).then((res) => {
      console.log('===> ', `/admin/factura/venta/update/${this.facturaSelected.id}`);

      setTimeout(() => this.router.navigateByUrl(`/admin/factura/venta/update/${this.facturaSelected.id}`), 10);
    });
  }

  async AnularFactura() {
    try {
      const res = await this.facturaClass.createOne(null, { afterPath: `anular_factura/${this.facturaSelected.id}` });
      const actualPagination = this.tServ.getPaginationById('facturas_params', 'CancelarFactura');
      this.pedirFactura(actualPagination);
    } catch (error) {
      console.error(error);
    }
  }

  async continuarANotas(idFactSelect?) {
    if (this.buscarPara.includes('nota')) await this.getPaqueteComprobante();

    if ((this.noExistenComprobantes = false)) {
      const url = `/admin/manipular/nota/${this.buscarPara === 'nota_credito' ? 'credito' : 'debito'}/${JSON.stringify(idFactSelect ? [idFactSelect] : this.idsFacturasSeleccionadas)}`;
      this.router.navigateByUrl(url);
    }
  }

  mostrarFactura(dataFactura, type, dataDB?, continuar?) {
    const toPDFData = { data: dataFactura, type: type };
    console.log('type ', type);

    let botonesDinamicos = [{ clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, 'cancelar'), label: 'Cerrar', disable: false }];

    if (continuar)
      botonesDinamicos.push({
        clase: 'btn btn-verde mr-2',
        function: (instance) => {
          this.continuarANotas(dataFactura.id);
          instance.closeModal(instance.id, 'cancelar');
        },
        label: 'Continuar',
        disable: false,
      });

    PdfService.generatePdf({ oPdf: toPDFData, imprimir: false }).then(async (res) => {
      if (res.status === 'si') {
        const inputs = {
          show_estado: true,
          estado_documento: dataFactura.estado,
          base64: res.base64,
          height: '40rem',
          reimprimir: res.reimprimir,
          fileName: _.first(res.file.split('.')),
        };

        const obj_modal = {
          component: PdfViewerComponent,
          inputs: inputs,
          id: 'mostrarFactura',
          header: type == 'nota' ? 'MOSTRAR NOTA' : 'MOSTRAR FACTURA',
          width: '900px',
          botones: {
            ...fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons),
            dinamico: botonesDinamicos,
          },
        };

        if (this.tipo_documento_selected != tipoDocFacturacion.cotizacion) {
          obj_modal.botones.dinamico.push({
            clase: 'btn btn-gris ml-2',
            function: (instance) => this.verDetalles(type == 'nota' ? dataDB : dataFactura, type),
            label: 'Ver detalles',
            disable: false,
          });
        } else {
          obj_modal.botones.dinamico.push({
            clase: 'btn btn-gris ml-2',
            function: (instance) => {
              instance.closeModal(instance.id, 'mostrarFactura');
              this.tableClickIcon({ id_tabla: 'facturas_params', columnKey: 'actions', iconKey: 'make_bill', data: dataFactura });
            },
            label: 'Facturar',
            disable: false,
          });

          // id_tabla == 'facturas_params'
          // columnKey == 'actions'
          // iconKey == 'make_bill'
        }

        if (this.para == 'Visualizar' || type == 'nota') {
          const editButton = {
            clase: 'btn btn-verde ml-2',
            function: (instance) => {
              this.editarFactura();
              instance.closeModal(instance.id, 'mostrarFactura');
            },
            label: 'Editar',
            disable: false,
          };

          obj_modal.botones.dinamico.push({
            clase: 'btn btn-amarillo ml-2',
            function: (instance) => this.reimprimirDocumento({ data: dataFactura, type: type }, instance),
            label: 'Reimprimir',
            disable: false,
          });

          if (this.buscarPara == 'solo_ver') obj_modal.botones.dinamico.push(editButton);
        }

        this.openNewModal(obj_modal);
      }
    });
  }

  reimprimirDocumento(obj, modalInstance) {
    this.loadServ.isLoading.next(true);
    PdfService.generatePdf({ oPdf: obj, imprimir: true })
      .then(async (res) => {
        this.loadServ.isLoading.next(false);
        if (res.status === 'si') {
          fun.toastSuccess(res.msg, 'CORRECTO');
          modalInstance.closeModal(modalInstance.id, 'imprimir');
        } else fun.toastError(res.msg, 'ERROR');
      })
      .catch((err) => {
        this.loadServ.isLoading.next(false);
        fun.toastError(err.msg, 'ERROR');
      });
  }

  verDetalles(data, tipo) {
    let configModal;
    if (tipo == 'nota') configModal = this.notasClass.modalVerDetalles(data);
    if (tipo == 'facturacion') configModal = this.facturaClass.modalVerDetalles(data);

    this.openNewModal(configModal);
  }

  getDataFromModal(arg, search) {
    console.log('arg ', arg);

    if (arg.modal_id == 'buscarClienteOsuplidor') {
      if (arg?.tipo == 'data_no_found') {
        fun.enfocarAndSelectInput('valorI');
      } else {
        (document.getElementById('valorI') as any).value = arg.data.nombre_completo;

        const actualPagination = this.tServ.getPaginationById('facturas_params', 'getDataFromModal');

        this.buscar_por = this.tipo_documento_selected == 'compra' ? this.campos.suplidor : this.campos.cliente;
        this.valor_a_buscar = arg.data.id;

        this.pedirFactura(actualPagination);
      }
    }
  }
}
