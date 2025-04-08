import { ConfigI } from '@core/interface/config-interface';
import { Ss } from '@core/services/singleton.service';
import { Component, OnInit, OnDestroy, Input, signal, computed, effect } from '@angular/core';
import * as _ from 'lodash';
const moment = require('../../../core/javascript/moment');
import { Router } from '@angular/router';
import { MixinClass } from '@core/typescript/MixinClass';
import { ArticuloC } from '../../registros/articulos/articulo';
import { FacturaC, TiposFacturaC, FacturasI, FacturasAplicadasC, request_factura_campo, tipoDocFacturacion, DetalleFactura } from '../../facturacion/factura';
import { NcfC } from '../../registros/ncf/ncf';
import { ClienteC } from '../../registros/registro-clientes/cliente';

import { NotaC } from './notas';
import { fun } from '@core/services/functions.service';
import { Permisos } from '@core/typescript/permisos';
import { table_config, transformType } from '../../components/new_tablas/tabla-class';
import { ConfirmacionImprimirComponent } from '../../components/formularios en modales/confirmacion-imprimir/confirmacion-imprimir.component';
import { ModalClass } from '../../components/modal/modal-class';
import { PdfService } from '@core/services/reports/pdf/pdf.service';

@Component({
  selector: 'app-notas-cred-deb',
  templateUrl: './notas-cred-deb.component.html',
  styleUrls: ['./notas-cred-deb.component.scss'],
  standalone: false,
})
export class NotasCredDebComponent extends MixinClass implements OnInit, OnDestroy {
  @Input() id_factura: number;
  @Input() tipoNota: any;

  factura!: FacturasI;

  detalleNota = signal<DetalleFactura[]>([]);
  cliente_id!: number;

  totalGlobal = computed(() => {
    return this.detalleNota().reduce((acumulado, item) => acumulado + fun.desformatearStNumber(item.total_nota), 0);
  });

  cantArticulosSelected = computed(() => {
    return this.detalleNota().filter(detalle => fun.desformatearStNumber(detalle.total_nota) > 0).length;
  });

  tituloPag = '';
  configApp: ConfigI;

  tipos = { credito: 'crédito', debito: 'débito' };

  fecha: string;
  convertObj = { credito: -1, debito: 1 };
  info = [];
  tipoFactura: any;

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
          { kind: 'campo', target: 'cant_nota', type: 'notEqual', transform: transformType.number, value: [0] },
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

  constructor(private router: Router) {
    super();

    effect(() => {});
  }

  ngOnInit() {
    this._init_mixin({ component: 'notas', is_routing: true });
    this.configApp = Ss.configServ.getConfig({ isPromise: false });

    this.fecha = moment().format('DD/MM/YYYY');

    if (this.isCredito) {
      this.tituloPag = 'Nota de crédito aplicada a factura ';
      this.tipoFactura = '04';
      this.agregarColumnaDevolver();
    } else {
      this.tituloPag = 'Nota de débito aplicada a factura ';
      this.tipoFactura = '03';
    }

    if (this.configApp.calcular_itbis) this.agregarItbisEnTabla();

    this.necesarioStart();
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

  async necesarioStart() {
    this.getFactura().then(async datos => {
      this.factura = datos;

      this.cliente_id = datos.cliente_id;

      await this.getPaqueteComprobante();
    });
  }

  async getPaqueteComprobante() {
    const TipoFact = Ss.factServ.lista_tipos_facturas.find(tipo => tipo.referencia === this.tipoFactura);

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
        textAlign: 'end',
        disable: [
          { kind: 'campo', target: 'select', value: [false] },
          { kind: 'compare', source: 'precio', target: 'precio_real', transform: transformType.number, type: 'notEqual' },
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
      const args = { campo: request_factura_campo.cabecera_factura_id, valor: this.id_factura, tipo_factura_id: 0, adelantada: false, paginado: false, tipo: tipoDocFacturacion.venta };
      const res_factura = await this.facturaClass.getFacturasByParams(args);

      const factura: FacturasI = res_factura['data'][0] as FacturasI;

      this.facturaAplicadasClass.getAll({ afterPath: `custom/get_cantidad_devuelto/${this.id_factura}` }).then(res => {
        const devueltos = res['data'];

        const dias_de_creada = Math.round(moment().diff(factura.fecha_equivalente, 'days', true));

        for (let indexDetalles = 0; indexDetalles < factura.detalle_facturas.length; indexDetalles++) {
          const detalle = factura.detalle_facturas[indexDetalles];
          const devueto = devueltos[factura.id]?.detalles[detalle.id] || 0;

          detalle['select'] = false;
          detalle['cant'] = detalle.cantidad - devueto;
          detalle['cant_nota'] = 0;
          detalle['colorItbis'] = dias_de_creada >= 30 ? 'red' : 'black';
          detalle['can_return_itbis'] = dias_de_creada < 30;

          detalle['min_'] = 0;
          detalle['max_'] = this.isCredito ? detalle.cantidad - devueto : null;

          detalle['total_nota'] = '0.00';
          detalle['cantidad'] = detalle.cantidad - devueto;
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
        if (!detalle.cantidad_en_unidades_nota) detalle.cantidad_en_unidades_nota = 0;

        const unidad = detalle.peso_saco ? `${detalle.unidad}_${detalle.peso_saco}` : detalle.unidad;
        const unidad_minima = detalle.contenidos[unidad];
        if (detalle.cant_nota) detalle.cantidad_en_unidades_nota = fun.desformatearStNumber(detalle.cant_nota) * unidad_minima;
      });

      return detalles;
    });
  }

  async selectAll(info) {}

  tableInputBlur(params) {
    const { data, id_tabla, column, index } = params;
    const { key } = column;

    const current_detalle = this.detalleNota().find(detalle => detalle.id == data.id);
    const detalle_factura = this.factura.detalle_facturas.find(detalle => detalle.id == data.id);

    if (fun.hasValue(current_detalle)) {
      const total_nota = fun.desformatearStNumber(current_detalle.total_nota);
      const precio_real = fun.desformatearStNumber(current_detalle.precio_real);
      const precio = fun.desformatearStNumber(current_detalle.precio);
      const cantidad = fun.desformatearStNumber(current_detalle.cantidad);
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

        if (this.isCredito && cant_nota > data.cant) {
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
  }

  tableInputChange(params) {
    const data = params.data as DetalleFactura;
    const { key, value, id_tabla, index } = params;
    let precio_real_value = data.precio_real;
    let cant_nota_value = fun.desformatearStNumber(data.cant_nota);
    // Manejo del checkbox de selección
    if (key === 'select') {
      if (!value) {
        data.total_nota = '0.00';
        data.cant_nota = 0;
        data.precio_real = fun.roundNumberToDecimal(data.precio);
        data.itbis_real = fun.roundNumberToDecimal(this.configApp.calcular_itbis ? data.precio_real * 0.18 : 0);

        this.detalleNota.update(detalles => detalles.filter(detalle => detalle.id !== data.id));
      } else {
        this.detalleNota.update(detalles => [...detalles, data]);
      }
      return;
    }

    // Manejo de inputs con delay
    // Manejo de cantidad nota
    if (key === 'cant_nota') {
      let cant_nota = fun.desformatearStNumber(value);

      if (this.isCredito && cant_nota > data.cant) {
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

      data.itbis_real = fun.roundNumberToDecimal(this.configApp.calcular_itbis ? precio_real * 0.18 : 0);
      this.sumarTotalRow(data, cant_nota_value, precio_real);

      precio_real_value = precio_real;
    }

    // Actualización del estado
    this.detalleNota.update(detalles => detalles.map(detalle => (detalle.id === data.id ? { ...detalle, ...data, precio_real: precio_real_value, cant_nota: cant_nota_value } : detalle)));
  }

  sumarTotalRow(data: DetalleFactura, cant_nota: number, precio_real: number) {
    const descuento = data.descuento_valor / data.cantidad;
    const precio = fun.desformatearStNumber(data.precio);
    const precio_real_value = fun.desformatearStNumber(precio_real);

    if (fun.isEmpty(precio_real_value) || isNaN(precio_real_value) || fun.isEmpty(cant_nota) || isNaN(cant_nota)) {
      data.total_nota = '0.00';
      return;
    }

    let total = 0;

    if (this.isCredito) {
      const itbis = data.calcular_itbis && data.can_return_itbis ? precio * 0.18 : 0;
      const precio_itbis = precio + itbis;
      total += cant_nota * (precio_itbis - descuento);
    }

    if (precio != precio_real_value) {
      const itbis_real = fun.desformatearStNumber(data.itbis_real);
      const precio_itbis_real = precio_real_value + itbis_real;
      const total_real = data.cant * (precio_itbis_real - descuento);

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
    const confirmationObj = {
      id: 'archivar_factura',
      texto: 'Seguro que desea cancelar la operación',
      header: 'Confirmación',
      siFunction: instance => {
        this.router.navigateByUrl(`/admin/manipular/buscarFactura/nota_${this.tipoNota}`);
        this.closeModal(instance);
      },
      width: '30rem',
    };
    this.confirmationModal(confirmationObj);
  }

  async getDataFromModal(arg, search?) {
    if (arg.modal_id === 'confirmacionImprimir') {
      this.is_print = arg.is_print;
      this.formarNota();
    }
  }

  // =============================================
  //  MODAL IMPRIMIR
  // =============================================
  imprimirFactura() {
    if (this.totalGlobal() == 0) {
      fun.toastWarning('Total de la nota de ' + this.tipoNota + ' no puede ser 0.', 'Aviso');
    } else {
      const obj = { modo_factura: 'nota', condicion_fact: 'nota', metodo: `nota_${this.tipoNota}`, is_viaje: false };

      this.openNewModal({
        component: ConfirmacionImprimirComponent,
        inputs: obj,
        id: 'confirmacionImprimir',
        header: 'Confirmación',
        width: '30rem',
        botones: {
          ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
          dinamico: [
            { clase: 'btn btn-blanco', function: instance => this.closeModal(instance), label: 'Cancelar', disable: false },
            { btn_id: 'btnConfirmar', clase: 'btn btn-verde', function_in_other_component: 'btn_aceptar', label: 'Confirmar', disable: false },
          ],
        },
      });
    }
  }

  confirmationModal(obj: { id: string; texto: string; header: string; siFunction: Function; width?: string }) {
    this.openNewModal({
      id: obj.id,
      header: obj.header,
      width: obj.width || '30rem',
      html: `<p> ${obj.texto} </p>`,
      botones: {
        ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
        dinamico: [
          { clase: 'btn btn-blanco w-9', function: instance => this.closeModal(instance), label: 'No', disable: false },
          { clase: 'btn btn-verde w-9', function: instance => obj.siFunction(instance), label: 'Si', disable: false },
        ],
      },
    });
  }

  closeModal(modalInstance) {
    modalInstance.closeModal(modalInstance.id, 'cancelar');
  }

  async formarNota() {
    const TipoFact = Ss.factServ.lista_tipos_facturas.filter(tipo => tipo.referencia === this.tipoFactura);
    const fecha_valida = this.paqueteComprobante.fecha_valida !== null ? moment(this.paqueteComprobante.fecha_valida).format('DD/MM/YYYY') : null;

    const dataToSend = {
      cliente_id: this.cliente_id,
      user_id: null,
      fecha_valida,
      tipo_factura_id: TipoFact[0].id,
      total: this.totalGlobal(),
      facturas_aplicadas: [],
    };

    this.checkCantidadEnUnidades();

    const objTemp = {
      cabecera_factura_id: this.factura.id,
      total: this.totalGlobal(),

      detalles_facturas_notas: this.detalleNota()
        .filter(detalle => fun.desformatearStNumber(detalle.total_nota) > 0)
        .map(detalle => {
          const { id, can_return_itbis, cant_nota, cantidad_en_unidades_nota } = detalle;

          let objDetalleTemp = fun.pick(detalle, ['detalle_factura_id', 'articulo_id', 'unidad', 'cantidad_en_unidades_nota', 'itbis', 'itbis_real', 'costo', 'precio', 'precio_real', 'total_nota', 'descuento_valor']);

          objDetalleTemp['total'] = fun.desformatearStNumber(objDetalleTemp.total_nota);
          objDetalleTemp['itbis'] = can_return_itbis ? fun.desformatearStNumber(objDetalleTemp.itbis) : 0;
          objDetalleTemp['cantidad_en_unidades'] = cantidad_en_unidades_nota;
          objDetalleTemp['cantidad'] = cant_nota;
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
        }),
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
