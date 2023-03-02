import { Ss } from './../../core/services/singleton.service';
import { VehiculoC } from './../registros/registro-vehiculo/vehiculo';
import { Validators } from '@angular/forms';
import { ModalHistorialPagosComponent } from './../components/formularios en modales/modal-historial-pagos/modal-historial-pagos.component';
import { CrudG } from '../../core/typescript/crud-g';
import * as _ from 'lodash';
import { fun } from '../../core/services/functions.service';
import * as moment from '../../core/javascript/moment';
import { PdfViewerComponent } from '../components/pdf-viewer/pdf-viewer.component';
import { DetalleFacturaComponent } from '../manipular facturas/detalle-factura/detalle-factura.component';
import { ModalClass } from '../components/modal/modal-class';
import { ReporteC } from '../reportes/reporte';
import { PdfService } from '../../core/services/pdf/pdf.service';

export enum deleteDocumentosTypes {
  anular = 'anular',
  delete = 'delete',
}

export enum tipoDocFacturacion {
  pre_venta = 'pre_venta',
  venta = 'venta',
  compra = 'compra',
  cotizacion = 'cotizacion',
  nota_credito = 'nota_credito',
  nota_debito = 'nota_debito',
}

export enum actionFacturacion {
  new = 'new',
  update = 'update',
  bill_from_cotizacion = 'bill_from_cotizacion',
  bill_from_pre_venta = 'bill_from_pre_venta',
}

export class FacturaC extends CrudG<FacturasI> {
  constructor() {
    super('cabecera_facturas');
  }

  static inputsMovimientosViaje = [
    {
      label: 'Seleccione el camión',
      formControl: 'vehiculo_id',
      items: [],
      bindLabel: 'info_vehiculo',
      bindValue: 'id',
      searchFunction: FacturaC.getCamiones,
      blurFunction: FacturaC.cleanCamiones,
      notFoundText: 'Camión no encontrado',
      disabledFunction: () => false,
      validators: Validators.required,
    },
  ];

  static openModalReporteForm(params: { tipo: any; inputs: any; openNewModal; titulo?: any }) {
    return new Promise<any>((resolve, reject) => {
      if (params.tipo != 'movimientos_vehiculo') {
        params.inputs['switches'] = {
          title: 'Seleccione los metodos de pago deseados',
          array: [
            { label: 'Efectivo', value: true },
            { label: 'Tarjeta', value: true },
            { label: 'Cheque', value: true },
            { label: 'Transferencia', value: false },
          ],
        };
      } else {
        params.inputs['dinamyc_selections'] = FacturaC.inputsMovimientosViaje;
      }

      ReporteC.objReporte = { inputs: params.inputs, id: params.tipo, header: params.inputs.titulo, returnDataFromModal: returnDataFromModal };

      params.openNewModal(ReporteC.objReporte);

      function returnDataFromModal(arg) {
        FacturaC.requestReporte({ reporte: arg, pdf: params });
      }
    });
  }

  static async cleanCamiones() {
    FacturaC.inputsMovimientosViaje[0].items = [];
  }

  static async getCamiones(event) {
    if (fun.hasValue(event.term)) {
      fun.awaitTyping().then((res) => {
        const extra = { afterPath: `filtro/${event.term}`, parameters: { paginado: false, info_vehiculo: true } };
        new VehiculoC().getAll(extra).then((res) => {
          FacturaC.inputsMovimientosViaje[0].items = res['data'];
        });
      });
    } else {
      FacturaC.inputsMovimientosViaje[0].items = [];
    }
  }

  static requestReporte(params: { reporte; pdf }) {
    if (params.pdf.tipo != 'movimientos_vehiculo' && _.every(params.reporte.data.switches.array, (item) => item.value == false)) {
      fun.toastError('Debe seleccionar almenos un metodo de pago.', 'ERROR');
    } else {
      const requestParams = { afterPath: `custom/${params.pdf.tipo}`, parameters: {} };
      let formas_pago = '';

      if (params.pdf.tipo != 'movimientos_vehiculo') {
        formas_pago = '(';

        params.reporte.data.switches.array.forEach((item) => {
          if (item.value) formas_pago += `'${item.label}',`;
        });

        formas_pago = `${formas_pago.slice(0, formas_pago.length - 1)})`;
      }

      requestParams.parameters['tipo_factura_id'] = params.reporte.data.tipo_factura_id;
      requestParams.parameters['tipo'] = params.reporte.data.tipo;
      requestParams.parameters['condicion'] = params.reporte.data.condicion;
      requestParams.parameters['desde'] = fun.my_dateFormater(params.reporte.data.desde, false);
      requestParams.parameters['hasta'] = fun.my_dateFormater(params.reporte.data.hasta, false);

      for (let index = 0; index < FacturaC.inputsMovimientosViaje.length; index++) {
        const item = FacturaC.inputsMovimientosViaje[index];
        requestParams.parameters[item.formControl] = params.reporte.data[item.formControl];
      }

      if (params.pdf.tipo != 'movimientos_vehiculo') requestParams.parameters['formas_pago'] = formas_pago;

      ReporteC.requestReporteAndMakePdf(requestParams, 'reporte', transformRequestResponse).then((response) => {
        let objPdfView = { ...response, titulo: params.pdf.inputs.titulo, fileName: _.first(response.file.split('.')), openNewModal: params.pdf.openNewModal };

        ReporteC.visualizarReporte(objPdfView);
      });
    }

    function transformRequestResponse(requestResponse) {
      const configApp = Ss.configServ.getConfig({ isPromise: false });

      requestResponse.contenido_reporte = requestResponse.contenido_reporte.map((item) => {
        const largo_nombre = configApp.calcular_itbis && params.pdf.tipo != 'movimientos_vehiculo' ? 58 : 48;

        if (fun.objHas(item, 'cliente_nombre') && item.cliente_nombre.length > largo_nombre) item.cliente_nombre = `${item.cliente_nombre.substring(0, largo_nombre)} ...`;

        return item;
      });

      if (params.pdf.tipo != 'movimientos_vehiculo') {
        if (configApp.calcular_itbis) {
          requestResponse.tipo_reporte += '_itbis';
        }
      }

      return requestResponse;
    }
  }

  getFacturaById(id: number) {
    const extra = { parameters: { actual_price: true, movimientos_viaje: true } };
    return new Promise((resolve) => this.getOne(id, extra).then((res) => resolve(res)));
  }

  getFacturasByParams(args: { campo: string; valor: string; tipo_factura_id: number; page: number; per_page: number; paginado: boolean; tipo: string; adelantada?: boolean; pagada?: any; estado?: boolean }) {
    const valor_enc = btoa(args.valor);
    const VALOR_ENC = _.replace(valor_enc, '\\', '&^IC');
    args.pagada ??= '0';

    const extra = {
      afterPath: `custom/get_documentos`,
      parameters: {
        page: args.page,
        per_page: args.per_page,
        paginado: args.paginado,
        tipo: args.tipo,
        pagada: args.pagada,
        campo: args.campo,
        valor: VALOR_ENC,
        tipo_factura_id: args.tipo_factura_id,
        is_adelantada: fun.objHas(args, 'adelantada') ? args.adelantada : '0',
        estado: fun.objHas(args, 'estado') ? args.estado : '0',
      },
    };

    return this.dynamic(extra);
  }

  parseDataToPdf(data) {
    return new Promise((resolve) => {
      const pick_factura1 = ['Bruto', 'cliente', 'balance', 'condicion', 'descuento', 'identificador', 'detalle_facturas', 'numero_factura', 'devuelta', 'estado', 'fecha_completada', 'fecha_equivalente', 'fecha_valida', 'fecha_vencimiento'];
      const pick_factura2 = ['fecha_viaje', 'forma_pago', 'id', 'is_viaje', 'monto', 'numero_comprobante', 'tipo', 'tipo_factura_id', 'itbis', 'suplidor', 'tipo_factura', 'total_factura', 'usuario', 'vendedor'];
      const pick_factura = [...pick_factura1, ...pick_factura2];

      let temp_data_parsed = _.pick(fun.duplicarJson(data), pick_factura);

      const data_parsed = fun.remplaceKeyFromJson(temp_data_parsed, [
        { old_key: 'tipo_factura', new_key: 'tipo_pdf' },
        { old_key: 'numero_factura', new_key: 'numero_documento' },
      ]);

      data_parsed.fecha_equivalente = moment(data_parsed.fecha_equivalente).format();
      data_parsed.tipo_pdf = data_parsed.tipo_pdf.toUpperCase();
      if (data_parsed.tipo_pdf == 'COTIZACION') data_parsed.tipo_pdf = 'COTIZACIÓN';
      data_parsed.total = data_parsed.total_factura;
      data_parsed.contenido_reporte = [];

      if (fun.hasValue(data_parsed.cliente) && data_parsed.cliente.nombre.length > 80) data_parsed.cliente.nombre = `${data_parsed.cliente.nombre.substring(0, 80)}...`;
      if (fun.hasValue(data_parsed.suplidor) && data_parsed.suplidor.nombre.length > 80) data_parsed.suplidor.nombre = `${data_parsed.suplidor.nombre.substring(0, 80)}...`;

      data_parsed.detalle_facturas.forEach((detalle) => {
        if ((detalle.is_devuelto && detalle.is_defectuoso) || !detalle.is_devuelto) {
          detalle['cantidad'] = `${fun.numFormatTwoDecimals(detalle.cantidad)} ${detalle.unidad}`;
          data_parsed.contenido_reporte.push(detalle);
        }
      });

      resolve(data_parsed);
    });
  }

  modalVerDetalles(data) {
    return {
      component: DetalleFacturaComponent,
      inputs: { data: data },
      id: `detalle_factura`,
      header: 'Detalles Factura',
      width: '30rem',
      height: '10rem',
      botones: {
        ...fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons),
        dinamico: [{ clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, 'cancelar'), label: 'Cerrar', disable: false }],
      },
    };
  }

  handleMostrarFactura(toPDFData, dataModal?, botones_dinamicos?) {
    return new Promise<any>((resolve, reject) => {
      PdfService.generatePdf({ oPdf: toPDFData, imprimir: false }).then(async (res) => {
        if (res.status === 'si') {
          const inputs = { base64: res.base64, reimprimir: res.reimprimir, fileName: _.first(res.file.split('.')), viewerOptions: { height: '40rem' } };

          const obj_modal = {
            component: PdfViewerComponent,
            inputs: inputs,
            id: dataModal.id,
            header: dataModal.header,
            width: '900px',
            botones: {
              ...fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons),
              dinamico: [{ clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, 'cancelar'), label: 'Cerrar', disable: false }],
            },
          };

          if (fun.hasValue(botones_dinamicos)) obj_modal.botones.dinamico = botones_dinamicos;

          resolve(obj_modal);
        }
      });
    });
  }

  abrirModalHistorial(pagos, notas, openNewModal) {
    if (pagos.length > 0 || notas.length > 0) {
      for (let i = 0; i < pagos.length; i++) {
        const pago = pagos[i];
        pago.numero_recibo = _.padStart(pago.numero_recibo, 8, '0');
        pago.fecha_equivalente = moment(pago.fecha_equivalente).format('DD/MM/YYYY');
      }

      for (let i = 0; i < notas.length; i++) {
        const nota = notas[i];
        nota.total = Math.abs(nota.total);
        nota.fecha_equivalente = moment(nota.fecha_equivalente).format('DD/MM/YYYY');
      }

      const obj = { abonos: pagos, notas: notas };
      openNewModal({
        component: ModalHistorialPagosComponent,
        inputs: obj,
        id: 'historial_pago',
        header: 'Historial de moviemientos a balance de factura',
        width: '700px',
        height: '400px',
        botones: fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons),
      });
    }
  }
}

export class TiposFacturaC extends CrudG<any> {
  constructor() {
    super('tipo_facturas');
  }
}

export class FacturasAplicadasC extends CrudG<any> {
  constructor() {
    super('facturas_aplicadas');
  }
}

export enum tFacturaD {
  factura_sin_comprobante = 'Factura sin comprobante',
  factura_con_valor_fiscal = 'Factura con valor fiscal',
  factura_de_consumo = 'Factura de consumo',
  nota_de_debito = 'Nota de debito',
  nota_de_credito = 'Nota de credito',
  comprobante_de_compras = 'Comprobante de compras',
  registro_de_unico_ingreso = 'Registro de unico ingreso',
  comprobante_para_gastos_menores = 'Comprobante para gastos menores',
  comprobante_de_regimen_especiales = 'Comprobante de regimen especiales',
  comprobante_gubernamental = 'Comprobante gubernamental',
  comprobante_para_exportaciones = 'Comprobante para exportaciones',
  comprobantes_para_pago_al_exterior = 'Comprobantes para pago al exterior',
  venta_contado = 'Venta Contado',
  compra = 'Compra',
  conduce = 'Conduce',
  produccion = 'Produccion',
  recibo_ingreso = 'Recibo_ingreso',
  venta_credito = 'Venta Credito',
  pre_venta = 'pre_venta',
  cotizacion = 'cotizacion',
}

export interface TipoFacturaI {
  id: number;
  descripcion: string;
  referencia: string;
  updated_at: any;
  created_at: any;
}
export interface FacturasI {
  id: number;
  tipo_factura_id: number;
  suplidor_id: null;
  cliente_id: number;
  user_id: number;
  fecha_viaje: string;
  fecha_equivalente: string;
  fecha_vencimiento: null;
  fecha_valida: null;
  fecha_completada: null;
  numero_comprobante: string;
  numero_factura: number;
  condicion: string;
  forma_pago: string;
  total_factura: number;
  itbis: number;
  descuento: number;
  Bruto: number;
  estado: boolean;
  tipo: string;
  NoCliente_nombre: null;
  NoCliente_direccion: null;
  costoYgasto: null;
  pagada: boolean;
  vendedor_id: number;
  balance: number;
  devuelta: number;
  is_adelantada: boolean;
  is_nota: boolean;
  is_viaje: boolean;
  tiene_nota: boolean;
  aplicada_a: null;
  tipo_factura: string;
  detalle_facturas: DetalleFactura[];
  cliente: Cliente;
  suplidor: Suplidor;
  usuario: string;
  vendedor: string;
  notas: any;
  pagos: Pago[];
  [propName: string]: any;
}

export interface Cliente {
  nombre: string;
  telefono: string;
  direccion: string;
  rnc: string;
}

export interface DetalleFactura {
  id: number;
  articulo_id: number;
  total: number;
  descuento_valor: number;
  itbis: number;
  cantidad: number;
  cantidad_en_unidades: number;
  retirado: number;
  retirado_en_venta: number;
  calcular_saco: boolean;
  detalle_factura_nota: null;
  articulo: string;
  se_calcula_saco: boolean;
  precio: number;
  costo: number;
  tipo: string;
  codigo: string;
  descripcion: string;
  unidad: string;
  peso_saco: string;
  contenidos: Contenidos;
  select: boolean;
  cant: number;
  cant_nota: number | string;
  total_nota: string | number;
  cantidad_en_unidades_nota: null;
  [propName: string]: any;
}

export interface Contenidos {
  Saco_100?: number;
  Saco_50?: number;
  Saco_25?: number;
  Quintal?: number;
  Libra?: number;
}

export interface Pago {
  id: number;
  recibos_ingreso_id: number;
  cabecera_factura_id: number;
  balance_factura: number;
  balance_anterior_factura: number;
  pago_total: boolean;
  deposito: number;
  descripcion: string;
  pago_a_tiempo: boolean;
  is_ultimo: boolean;
  created_at: string;
  updated_at: string;
  numero_recibo: number;
  recibo_creado_por: string;
  fecha_equivalente: string;
}

export interface Suplidor {
  nombre: string;
  telefono: string;
  direccion: string;
  rnc: string;
}

export interface Notas {
  id?: number;
  tipo_factura_id?: number;
  user_id?: number;
  numero_comprobante?: string;
  total_factura?: number;
  estado?: boolean;
  aplicada_a?: string;
  detalle_facturas?: DetalleFacturaNota[];
}

export interface DetalleFacturaNota {
  id?: number;
  cabecera_factura_id?: number;
  articulo_id?: number;
  unidad?: string;
  total?: number;
  cantidad?: number;
  cantidad_en_unidades?: number;
  itbis?: number;
  precio?: number;
  costo?: null;
  retirado?: null;
  retirado_en_venta?: null;
  descuento_valor?: number;
  created_at?: Date;
  updated_at?: Date;
  calcular_saco?: boolean;
  detalle_factura_nota?: number;
  [propName: string]: any;
}
