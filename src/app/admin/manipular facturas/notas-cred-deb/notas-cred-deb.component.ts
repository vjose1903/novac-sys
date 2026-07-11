import { ConfigI } from '@core/interface/config-interface';
import { Ss } from '@core/services/singleton.service';
import { Component, OnInit, OnDestroy, Input, signal, computed, effect, inject } from '@angular/core';
const moment = require('../../../core/javascript/moment');
import { Router } from '@angular/router';
import { MixinClass } from '@core/typescript/MixinClass';
import { ArticuloC, ArticuloI } from '@registros/articulos/articulo';
import { FacturaC, TiposFacturaC, FacturasI, FacturasAplicadasC, DetalleFactura, request_factura_campo, tipoDocFacturacion, TipoFacturaI } from '../../facturacion/factura';
import { NcfC } from '@registros/ncf/ncf';
import { ClienteC } from '@registros/registro-clientes/cliente';
import { NotaC } from './notas';
import { fun } from '@core/services/functions.service';
import { Permisos } from '@core/typescript/permisos';
import { table_config, transformType } from '@components/new_tablas/tabla-class';
import { ConfirmacionImprimirComponent } from '@components/formularios en modales/confirmacion-imprimir/confirmacion-imprimir.component';
import { PdfService } from '@core/services/reports/pdf/pdf.service';
import Big from 'big.js';
import { serie, seriesDGII, seriesDgiiI } from '@core/typescript/constantes';
import { DateUtils } from '@vjose1903/dateutils';
import { confirmationButtons, ICallbackModal, modalActionsE, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';

@Component({
  selector: 'app-notas-cred-deb',
  templateUrl: './notas-cred-deb.component.html',
  styleUrls: ['./notas-cred-deb.component.scss'],
  standalone: false,
})
export class NotasCredDebComponent extends MixinClass implements OnInit, OnDestroy {
  @Input() id_factura: number;
  @Input() tipoNota: any;
  @Input() serie: serie;

  factura!: FacturasI;

  detalleNota = signal<DetalleFactura[]>([]);

  itbisGeneral = computed(() => this.detalleNota().reduce((acumulado, item) => acumulado + fun.desformatearStNumber(item.itbis_real), 0));
  totalGeneral = computed(() => this.detalleNota().reduce((acumulado, item) => acumulado + fun.desformatearStNumber(item.total_nota), 0));
  brutoGeneral = computed(() => Big(this.totalGeneral()).minus(this.itbisGeneral()).toNumber());

  cliente_id!: number;

  cantArticulosSelected = computed(() => {
    return this.detalleNota().filter(detalle => fun.desformatearStNumber(detalle.total_nota) > 0).length;
  });

  tituloPag = '';
  configApp: ConfigI;

  tipos = { credito: 'crédito', debito: 'débito' };

  fecha: string;
  convertObj = { credito: -1, debito: 1 };
  info = [];

  tipoFactura: TipoFacturaI;

  paqueteComprobante;
  is_print = false;

  notasClass = new NotaC();
  articuloClass = new ArticuloC();
  facturaClass = new FacturaC();
  facturaAplicadasClass = new FacturasAplicadasC();
  tiposFacturasClass = new TiposFacturaC();
  clienteClass = new ClienteC();
  ncfClass = new NcfC();
  permissions = Permisos;

  serieSelected = signal<serie>(null);
  serieOptions: seriesDgiiI[] = seriesDGII({ includeAll: false });

  table_config: table_config = {
    info: [
      { titulo: ' ', tipo: 'switch', select_all: true, key: 'select', style: { width: '3.5rem' } },
      { titulo: 'Articulo', tipo: 'text', key: 'descripcion', style: { 'text-align': 'left', 'min-width': '10rem', width: '30%', 'padding-left': '0.5rem' } },
      { titulo: 'Cantidad', key: 'cantidad_', tipo: 'text', style: { width: '7rem', 'text-align': 'center' } },
      { titulo: 'Descuento', key: 'descuento_valor', tipo: 'formatoNumero' },
      { titulo: 'Precio', key: 'precio', tipo: 'formatoNumero' },
      {
        titulo: 'Precio real',
        key: 'precio_real',
        tipo: 'input',
        inputEvents: 'formatoNumero',
        inputType: 'text',
        textAlign: 'end',
        disable: [
          { kind: 'campo', target: 'select', value: [false] },
          { kind: 'campo', target: 'cant_nota', type: 'notEqual', transform: transformType.number, value: [0], global: true },
        ],
        style: { width: '8rem', 'padding-right': '0.5rem' },
      },
      { titulo: 'Total nota', key: 'total_nota', tipo: 'input', textAlign: 'end', disable: [{ kind: 'always' }], style: { width: '8rem' } },
    ],
    id_tabla: 'notas',
    obj_paginate: { show: false },
    redondo: false,
    colorTitulo: false,
  };

  tablaComponent;

  get isCredito() {
    return this.tipoNota === 'credito';
  }

  dynamicModalServ = inject(DynamicModalService);
  private router = inject(Router);

  constructor() {
    super();

    effect(async () => {
      if (this.serieSelected()) {
        const type = this.isCredito ? 'nota_credito' : 'nota_debito';
        this.tipoFactura = Ss.factServ.lista_tipos_facturas.find(tipo => tipo.referencia == NotaC.base_comprobante[this.serieSelected()][type] && tipo.serie == this.serieSelected());

        await this.getPaqueteComprobante();
      }
    });
  }

  ngOnInit() {
    this._init_mixin({ component: 'notas', is_routing: true });
    this.configApp = Ss.configServ.config;

    this.fecha = moment().format('DD/MM/YYYY');
    this.serieSelected.set(this.serie);
    if (this.isCredito) {
      this.tituloPag = 'Nota de crédito aplicada a factura ';

      this.agregarColumnaDevolver();
    } else {
      this.tituloPag = 'Nota de débito aplicada a factura ';
    }

    if (this.configApp.calcular_itbis) this.agregarItbisEnTabla();

    this.necesarioStart();
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  async necesarioStart() {
    this.getFactura().then(async datos => {
      this.factura = datos;

      this.cliente_id = datos.cliente_id;
    });
  }

  async getPaqueteComprobante() {
    const TipoFact = Ss.factServ.lista_tipos_facturas.find(tipo => tipo.referencia === this.tipoFactura.referencia);

    this.ncfClass.getAll({ afterPath: `custom/${TipoFact.id}/true` }).then(res => {
      this.paqueteComprobante = res['data'];
    });
  }

  agregarColumnaDevolver() {
    return new Promise<any>((resolve, reject) => {
      fun.pushAt(this.table_config.info, 2, {
        titulo: 'Devolver',
        key: 'cant_nota',
        tipo: 'input',
        inputType: 'number',
        // interactWithMouse: true,
        textAlign: 'end',
        disable: [
          { kind: 'campo', target: 'select', value: [false] },
          { kind: 'compare', source: 'precio', target: 'precio_real', transform: transformType.number, type: 'notEqual', global: true },
        ],
        style: { width: '6rem' },
      });
      resolve(true);
    });
  }

  agregarItbisEnTabla() {
    const base = this.isCredito ? 7 : 6;
    fun.pushAt(this.table_config.info, base, { titulo: 'Itbis', key: 'itbis', tipo: 'formatoNumero', text_color: 'colorItbis', alert_msg: 'A partir de los 30 días el ITBIS queda retenido.', style: { 'padding-left': '2rem' } });
    fun.pushAt(this.table_config.info, base + 1, { titulo: 'Itbis real', key: 'itbis_real', tipo: 'input', textAlign: 'end', inputType: 'text', disable: [{ kind: 'always' }], style: { width: '7rem', 'padding-right': '0.5rem' } });
  }

  async getFactura(): Promise<FacturasI> {
    return new Promise(async resolve => {
      const args = { campo: request_factura_campo.cabecera_factura_id, valor: this.id_factura, tipo_factura_id: 0, adelantada: false, paginado: false, tipo: tipoDocFacturacion.venta, extra_params: { articulo_in_detalle: true } };
      const res_factura = await this.facturaClass.getFacturasByParams(args);

      const factura: FacturasI = res_factura['data'][0] as FacturasI;

      this.facturaAplicadasClass.getAll({ afterPath: `custom/get_cantidad_devuelto/${this.id_factura}` }).then(res => {
        const devueltos = res['data'];

        const dias_de_creada = Math.round(DateUtils.diffDays(factura.fecha_equivalente));

        for (let indexDetalles = 0; indexDetalles < factura.detalle_facturas.length; indexDetalles++) {
          const detalle = factura.detalle_facturas[indexDetalles];
          const devueto = devueltos[factura.id]?.detalles[detalle.id] || 0;

          const articulo = detalle.articulo as ArticuloI;
          detalle['articulo'] = { ...articulo, descripcion: articulo.nombre };
          detalle['select'] = false;
          detalle['colorItbis'] = dias_de_creada >= 30 ? 'red' : 'black';
          detalle['can_return_itbis'] = dias_de_creada < 30;

          detalle['min_'] = 0;
          detalle['max_'] = this.isCredito ? detalle.cantidad - devueto : null;

          detalle['total_nota'] = '0.00';
          detalle['cantidad'] = detalle.cantidad - devueto;
          detalle['cant_nota'] = 0;
          detalle['cantidad_'] = `${fun.roundNumberToDecimal(detalle['cantidad'])} ${detalle['unidad']}`;
          detalle['precio_real'] = fun.roundNumberToDecimal(detalle.precio);
          detalle['itbis_real'] = fun.roundNumberToDecimal(detalle.itbis);
        }

        resolve(factura);
      });
    });
  }

  async checkCantidadEnUnidades() {
    this.detalleNota.update(detalles => {
      detalles.map(detalle => {
        const cant_nota = fun.desformatearStNumber(detalle.cant_nota);
        const unidad_minima = this.getCantidadUnidadesBase(detalle);

        detalle.cantidad_en_unidades_nota = cant_nota > 0 ? cant_nota * unidad_minima : 0;
      });

      return detalles;
    });
  }

  private getCantidadUnidadesBase(detalle: DetalleFactura): number {
    const cantidad = fun.desformatearStNumber(detalle.cantidad);
    const cantidadEnUnidades = fun.desformatearStNumber(detalle.cantidad_en_unidades);

    if (cantidad > 0 && cantidadEnUnidades > 0) {
      return cantidadEnUnidades / cantidad;
    }

    const unidad = detalle.peso_saco ? `${detalle.unidad}_${detalle.peso_saco}` : detalle.unidad;
    const unidadMinima = detalle.contenidos?.[unidad];

    return fun.desformatearStNumber(unidadMinima);
  }

  async selectAll(info) {}

  tableInputBlur(params) {
    const { data, id_tabla, column, index } = params;
    const { key } = column;

    const current_detalle = this.detalleNota().find(detalle => detalle.id == data.id);
    const detalle_factura = this.factura.detalle_facturas.find(detalle => detalle.id == data.id);

    if (fun.hasValue(current_detalle)) {
      const precio_real = fun.desformatearStNumber(current_detalle.precio_real);
      const precio = fun.desformatearStNumber(current_detalle.precio);
      const cant_nota = fun.desformatearStNumber(current_detalle.cant_nota);

      const inputId = `input-${id_tabla}-${key}-${index}`;

      if (key === 'precio_real') {
        if (fun.isEmpty(precio_real) || isNaN(precio_real)) {
          fun.toastWarning('Debe de introducir un Monto', 'AVISO');
          fun.enfocarInput(inputId);

          return;
        }

        const isPrecioInvalido = this.isCredito ? precio_real > precio : precio_real < precio;
        const mensajeError = this.isCredito
          ? 'Las notas de crédito son utilizadas para reducir el valor de la factura, el precio real no puede ser mayor al original.'
          : 'Las notas de débito son utilizadas para aumentar el valor de la factura, el precio real no puede ser menor al original.';

        if (isPrecioInvalido) {
          fun.toastInfo(mensajeError, 'AVISO');
          fun.enfocarInput(inputId);

          return;
        }

        detalle_factura.precio_real = fun.roundNumberToDecimal(precio_real);
      }

      if (key == 'cant_nota') {
        if (cant_nota < 0) {
          fun.toastWarning('La cantidad no puede ser negativa', 'AVISO');
          fun.enfocarInput(inputId);

          return;
        }

        if (this.isCredito && cant_nota > data.cantidad) {
          fun.toastError('Nota de crédito no puede ser mayor a la factura original', 'ERROR');
          fun.enfocarInput(inputId);

          return;
        }

        if (fun.isEmpty(cant_nota) || isNaN(cant_nota)) {
          detalle_factura.cant_nota = '0';
        } else {
          detalle_factura.cant_nota = cant_nota;
        }
      }
    }
    Ss.cdRef.detectChanges();
  }

  tableInputChange(params) {
    const data = params.data as DetalleFactura;
    const { key, value, id_tabla, index } = params;
    let precio_real_value = data.precio_real;
    let cant_nota_value = fun.desformatearStNumber(data.cant_nota);
    const detalle_factura = this.factura.detalle_facturas.find(detalle => detalle.id == data.id);

    // Manejo del checkbox de selección

    if (key === 'select') {
      if (!value) {
        fun.setTimeout(() => {
          // Actualizar también en el objeto factura.detalle_facturas
          if (detalle_factura) {
            detalle_factura.total_nota = '0.00';
            detalle_factura.cant_nota = '0';
            detalle_factura.precio_real = fun.roundNumberToDecimal(detalle_factura.precio);
          }
          // data.itbis_real = fun.roundNumberToDecimal(this.configApp.calcular_itbis ? data.precio_real * 0.18 : 0);

          this.detalleNota.update(detalles => detalles.filter(detalle => detalle.id !== data.id));
        }, 500);
      } else {
        this.detalleNota.update(detalles => [...detalles, data]);
      }
      return;
    }

    // Manejo de inputs con delay
    // Manejo de cantidad nota
    if (key === 'cant_nota') {
      let cant_nota = fun.desformatearStNumber(value);

      if (this.isCredito && cant_nota > data.cantidad) {
        fun.toastError('Nota de crédito no puede ser mayor a la factura original', 'ERROR');
        fun.enfocarInput(`input-${id_tabla}-${key}-${index}`);
      } else {
        this.sumarTotalRow(data, cant_nota, precio_real_value);
      }

      cant_nota_value = cant_nota;
    }

    // Manejo de precio real
    if (key === 'precio_real') {
      const precio = fun.desformatearStNumber(data.precio);
      let precio_real = fun.desformatearStNumber(value);

      if (fun.isEmpty(precio_real) || isNaN(precio_real)) precio_real = null;
      const inputId = `input-${id_tabla}-${key}-${index}`;

      const isPrecioInvalido = this.isCredito ? precio_real > precio : precio_real < precio;
      const mensajeError = this.isCredito
        ? 'Las notas de crédito son utilizadas para reducir el valor de la factura, el precio real no puede ser mayor al original.'
        : 'Las notas de débito son utilizadas para aumentar el valor de la factura, el precio real no puede ser menor al original.';

      if (isPrecioInvalido) {
        fun.toastInfo(mensajeError, 'AVISO');
        fun.enfocarInput(inputId);
      }

      // TODO: hablar con papi a ver como es que se maneja el itbis en las notas de credito y debito
      detalle_factura.itbis_real = fun.roundNumberToDecimal(this.configApp.calcular_itbis ? precio_real * 0.18 : 0);
      this.sumarTotalRow(detalle_factura, cant_nota_value, precio_real);

      precio_real_value = precio_real;
    }

    // Actualización del estado
    this.detalleNota.update(detalles => detalles.map(detalle => (detalle.id === data.id ? { ...detalle, ...data, precio_real: precio_real_value, cant_nota: cant_nota_value } : detalle)));
    Ss.cdRef.detectChanges();
  }

  sumarTotalRow(data: DetalleFactura, cant_nota: number, precio_real: number) {
    const descuento_big = Big(data.descuento_valor);
    const descuento = descuento_big.div(data.cantidad).toNumber();
    const precio = fun.desformatearStNumber(data.precio);
    const precio_real_value = fun.desformatearStNumber(precio_real);

    if (fun.isEmpty(precio_real_value) || isNaN(precio_real_value) || fun.isEmpty(cant_nota) || isNaN(cant_nota)) {
      data.total_nota = '0.00';
      return;
    }

    let total = 0;

    // TODO: como tomar el precio y el itbis segun si es el mismo precio o no
    // const precio =

    if (this.isCredito) {
      const itbis = data.calcular_itbis && data.can_return_itbis ? precio * 0.18 : 0;
      const precio_itbis = Big(precio).plus(itbis).toNumber();
      total += cant_nota * (precio_itbis - descuento);
    }

    if (precio != precio_real_value) {
      // TODO: preguntar que si se toma el itbis_real sin estar afectado por la disminucion o si se toma el itbis tal cual estuvo al inicio
      const itbis_real = fun.desformatearStNumber(data.itbis_real);
      const precio_itbis_real = precio_real_value + itbis_real;
      const total_real = data.cantidad * (precio_itbis_real - descuento);

      total += Math.abs(data.total - total_real);
    }

    data.total_nota = fun.roundNumberToDecimal(total);
  }

  formatoNumero(num) {
    return fun.roundNumberToDecimal(num);
  }

  formatoNumeroFactura(num) {
    return num.toString().padStart(8, '0');
  }

  formatoFecha(fecha) {
    return moment(fecha).format('DD/MM/YYYY');
  }

  // =============================================
  //  MODAL CANCELAR
  // =============================================
  cancelarFactura() {
    const siFunction = () => {
      this.router.navigateByUrl(`/admin/manipular/buscarFactura/nota_${this.tipoNota}`);
    };

    this.dynamicModalServ.confirmationModal({
      id: 'cancelar_nota',
      texto: 'Seguro que desea cancelar la operación',
      btnKind: confirmationButtons.siNo,
      onYes: siFunction.bind(this),
    });
  }

  // =============================================
  //  MODAL IMPRIMIR
  // =============================================
  imprimirFactura() {
    if (this.totalGeneral() == 0) {
      fun.toastWarning('Total de la nota de ' + this.tipoNota + ' no puede ser 0.', 'Aviso');
    } else {
      const obj = { modo_factura: `nota_${this.tipoNota}`, condicion_fact: 'nota', metodo: `nota`, is_viaje: false };

      const confirmationImprimirModalConf = new DynamicModalClass();

      confirmationImprimirModalConf.id = 'confirmacionImprimir';
      confirmationImprimirModalConf.inputs = obj;
      confirmationImprimirModalConf.header = 'Confirmación'; 
      confirmationImprimirModalConf.width = '30rem';
      confirmationImprimirModalConf.component = ConfirmacionImprimirComponent;
      confirmationImprimirModalConf.botones = [
        { clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cancelar', disable: false },
        { id: 'btnConfirmar', clase: 'btn btn-verde', label: 'Confirmar', disable: false },
      ];

      confirmationImprimirModalConf.setCallback(this.processImprimir.bind(this));
      confirmationImprimirModalConf.show();
    }
  }

  processImprimir(args: ICallbackModal) {
    if (args.type == modalCloseType.returnData) {
      const { is_print } = args.data;

      this.is_print = is_print;
      this.send_nota();
    }
  }

  closeModal(modalInstance) {
    modalInstance.closeModal(modalInstance.id);
  }

  async send_nota() {
    let fecha_valida = null;

    if (fun.hasValue(this.paqueteComprobante?.fecha_valida) && DateUtils.isValid(new Date(this.paqueteComprobante?.fecha_valida))) {
      const formatConfig = { dateFormat: 'YYYY-MM-DD', include_hour: true, hourFormat: 'HH:MM:SS', separator: ' ' };

      fecha_valida = DateUtils.format({ date: DateUtils.add(4, 'hours', this.paqueteComprobante?.fecha_valida), ...formatConfig });
    }

    const dataToSend = {
      cliente_id: this.cliente_id,
      user_id: null,
      fecha_valida,
      tipo_factura_id: this.tipoFactura.id,
      bruto: this.brutoGeneral(),
      itbis: this.itbisGeneral(),
      total: this.totalGeneral(),
      serie: this.serieSelected(),
      facturas_aplicadas: [],
    };

    this.checkCantidadEnUnidades();

    const detalles = this.detalleNota()
      .filter(detalle => fun.desformatearStNumber(detalle.total_nota) > 0)
      .map(detalle => {
        const { id, can_return_itbis, cant_nota, cantidad_en_unidades_nota, cantidad } = detalle;

        let objDetalleTemp = fun.pick(detalle, ['detalle_factura_id', 'articulo_id', 'articulo', 'unidad', 'cantidad_en_unidades_nota', 'itbis', 'itbis_real', 'costo', 'precio', 'precio_real', 'total_nota', 'descuento_valor', 'descripcion']);

        // TODO: VER COMO AGREGO EL CODIGO Y PROBAR LO DE LA DESCRIPCION NO ME CONVENCE
        objDetalleTemp['total'] = fun.desformatearStNumber(objDetalleTemp.total_nota);
        objDetalleTemp['itbis'] = can_return_itbis ? fun.desformatearStNumber(objDetalleTemp.itbis) : 0;
        objDetalleTemp['cantidad_en_unidades'] = cantidad_en_unidades_nota ?? 0;
        objDetalleTemp['cantidad'] = cant_nota;
        objDetalleTemp['cantidad_origin'] = cantidad;
        objDetalleTemp['codigo'] = cantidad;
        objDetalleTemp['detalle_factura_id'] = id;
        objDetalleTemp['itbis_real'] = fun.desformatearStNumber(objDetalleTemp['itbis_real']);
        objDetalleTemp['itbis'] = fun.desformatearStNumber(objDetalleTemp['itbis']);
        objDetalleTemp['precio_real'] = fun.desformatearStNumber(objDetalleTemp['precio_real']);
        objDetalleTemp['precio'] = fun.desformatearStNumber(objDetalleTemp['precio']);
        objDetalleTemp['descuento'] = detalle.descuento_valor;

        objDetalleTemp['descuento_real'] = 0;

        delete objDetalleTemp.total_nota;
        delete objDetalleTemp.cantidad_en_unidades_nota;
        delete objDetalleTemp.descuento_valor;

        return objDetalleTemp;
      });

    const objTemp = {
      cabecera_factura_id: this.factura.id,
      total: this.totalGeneral(),

      detalles_facturas_notas: detalles,
    };

    dataToSend.facturas_aplicadas.push(objTemp);

    const res = await this.notasClass.createOne(dataToSend);

    this.notasClass.parseDataToPdf(res['data']).then(data_parsed => {
      const objToPdf = { data: data_parsed, type: 'nota' };

      PdfService.generatePdf({ oPdf: objToPdf, imprimir: this.is_print }).catch(err => fun.toastError(err.msg, 'ERROR'));
      this.layServ.nextCheckCuadreToday(true);
      this.router.navigateByUrl(`/admin/manipular/buscarFactura/nota_${this.tipoNota}`);
    });
  }
}
