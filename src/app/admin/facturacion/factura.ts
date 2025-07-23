import { Ss } from '@core/services/singleton.service';
import { VehiculoC } from '@registros/registro-vehiculo/vehiculo';
import { Validators } from '@angular/forms';
import { ModalHistorialPagosComponent } from '@components/formularios en modales/modal-historial-pagos/modal-historial-pagos.component';
import { CrudG } from '@core/typescript/crud-g';
import * as _ from 'lodash';
import { fun } from '@core/services/functions.service';
const moment = require('../../core/javascript/moment');
import { PdfViewerComponent } from '@components/pdf-viewer/pdf-viewer.component';
import { DetalleFacturaComponent } from '../manipular facturas/detalle-factura/detalle-factura.component';
import { ModalClass } from '@components/modal/modal-class';
import { ReporteC } from '../reportes/reporte';
import { PdfService } from '@core/services/reports/pdf/pdf.service';
import { serie, unidadAbrev } from '@core/typescript/constantes';
import { csvConfig as csvConfigVentas } from '@core/services/reports/excel/configs/report/ventas';
import { csvConfig as csvConfigMovimientosVehiculo } from '@core/services/reports/excel/configs/report/movimientos_vehiculo';
import { ReportGroupTypeE } from '@admin/reportes/reporte.utils';
import { ArticuloI } from '@registros/articulos/articulo';
import { DateUtils } from '@vjose1903/dateutils';

export enum comprobanteNormal {
  factura_de_credito_fiscal = '01',
  factura_de_consumo = '02',
  nota_de_debito = '03',
  nota_de_credito = '04',
  comprobante_compras = '11',
  gastos_menores = '13',
  regimenes_especiales = '14',
  gubernamental = '15',
  comprobante_de_exportaciones = '16',
  comprobante_pagos_al_exterior = '17',
}

export enum comprobanteElectronico {
  factura_de_credito_fiscal = '31',
  nota_de_debito = '33',
  nota_de_credito = '34',
  factura_de_consumo = '32',
  comprobante_compras = '41',
  gastos_menores = '43',
  regimenes_especiales = '44',
  gubernamental = '45',
  comprobante_de_exportaciones = '46',
  comprobante_pagos_al_exterior = '47',
}

export enum request_factura_campo {
  todas = '0',
  cliente_id = '1',
  numero_comprobante = '2',
  numero_factura = '3',
  last_50 = '4',
  suplidor_id = '5',
  cabecera_factura_id = '6',
}

export const comprobante = {
  normal: {
    factura_de_credito_fiscal: comprobanteNormal.factura_de_credito_fiscal,
    factura_de_consumo: comprobanteNormal.factura_de_consumo,
    compras: comprobanteNormal.comprobante_compras,
    gastos_menores: comprobanteNormal.gastos_menores,
    regimenes_especiales: comprobanteNormal.regimenes_especiales,
    gubernamental: comprobanteNormal.gubernamental,
    comprobante_de_exportaciones: comprobanteNormal.comprobante_de_exportaciones,
    comprobante_pagos_al_exterior: comprobanteNormal.comprobante_pagos_al_exterior,
  },
  electronica: {
    factura_de_credito_fiscal: comprobanteElectronico.factura_de_credito_fiscal,
    factura_de_consumo: comprobanteElectronico.factura_de_consumo,
    compras: comprobanteElectronico.comprobante_compras,
    gastos_menores: comprobanteElectronico.gastos_menores,
    regimenes_especiales: comprobanteElectronico.regimenes_especiales,
    gubernamental: comprobanteElectronico.gubernamental,
    comprobante_de_exportaciones: comprobanteElectronico.comprobante_de_exportaciones,
    comprobante_pagos_al_exterior: comprobanteElectronico.comprobante_pagos_al_exterior,
  },
};

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

export enum tipoDocFacturacionLabel {
  pre_venta = 'pre-venta',
  venta = 'venta',
  compra = 'compra',
  cotizacion = 'cotización',
  nota_credito = 'nota de crédito',
  nota_debito = 'nota de débito',
}

export enum actionFacturacion {
  new = 'new',
  update = 'update',
  duplicate = 'duplicate',
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
      optionLabel: 'info_vehiculo',
      optionValue: 'id',
      searchFunction: FacturaC.getCamiones,
      blurFunction: FacturaC.cleanCamiones,
      placeholder: 'Ingrese el nombre del camión',
      notFoundText: 'Camión no encontrado',
      disabledFunction: () => false,
      validators: Validators.required,
    },
  ];

  static openModalReporteForm(params: { tipo: any; inputs: any; openNewModal; titulo?: any }) {
    return new Promise<any>((resolve, reject) => {
      if (params.tipo != 'movimientos_vehiculo') {
        params.inputs['switchGroup'] = {
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

  static async getCamiones(name) {
    if (fun.hasValue(name)) {
      fun.awaitTyping().then(res => {
        const extra = { afterPath: `filtro/${name}`, parameters: { paginado: false, info_vehiculo: true } };
        new VehiculoC().getAll(extra).then(res => {
          FacturaC.inputsMovimientosViaje[0].items = res['data'];
        });
      });
    } else {
      FacturaC.inputsMovimientosViaje[0].items = [];
    }
  }

  static requestReporte(params: { reporte; pdf }) {
    if (params.pdf.tipo != 'movimientos_vehiculo' && _.every(params.reporte.data.switchGroup.array, item => item.value == false)) {
      fun.toastError('Debe seleccionar almenos un metodo de pago.', 'ERROR');
    } else {
      const configApp = Ss.configServ.config;

      const requestParams = { afterPath: `custom/${params.pdf.tipo}`, parameters: {} };
      let formas_pago = '';

      if (params.pdf.tipo != 'movimientos_vehiculo') {
        formas_pago = '(';

        params.reporte.data.switchGroup.array.forEach(item => {
          if (item.value) formas_pago += `'${item.label}',`;
        });

        formas_pago = `${formas_pago.slice(0, formas_pago.length - 1)})`;

        let configKey = '';
        let prefix = null;

        if (params.reporte.data.tipo == ReportGroupTypeE.detallado || params.pdf.tipo == 'ventas_diarias') {
          configKey = `detallado${configApp.calcular_itbis ? '_itbis' : ''}`;

          if (params.pdf.tipo == 'ventas_diarias') prefix = params.pdf.tipo;
        } else if (params.reporte.data.tipo == ReportGroupTypeE.agrupado) {
          configKey = `agrupado${configApp.calcular_itbis ? '_itbis' : ''}`;
          prefix = 'ventas';
        }

        ReporteC.configCsv = csvConfigVentas[configKey];
        if (fun.hasValue(prefix)) ReporteC.configCsv.prefix = prefix;
      } else {
        ReporteC.configCsv = csvConfigMovimientosVehiculo;
      }

      requestParams.parameters['tipo_factura_id'] = params.reporte.data.tipo_factura_id;
      requestParams.parameters['tipo'] = params.reporte.data.tipo;
      requestParams.parameters['condicion'] = params.reporte.data.condicion;
      requestParams.parameters['desde'] = fun.my_dateFormater(params.reporte.data.desde, false);
      requestParams.parameters['hasta'] = fun.my_dateFormater(params.reporte.data.hasta, false);
      requestParams.parameters['serie'] = params.reporte.data.serie;

      for (let index = 0; index < FacturaC.inputsMovimientosViaje.length; index++) {
        const item = FacturaC.inputsMovimientosViaje[index];
        requestParams.parameters[item.formControl] = params.reporte.data[item.formControl];
      }

      if (params.pdf.tipo != 'movimientos_vehiculo') requestParams.parameters['formas_pago'] = formas_pago;

      ReporteC.requestReporteAndMakePdf(requestParams, 'reporte', transformRequestResponse).then(response => {
        let objPdfView = { ...response, titulo: params.pdf.inputs.titulo, fileName: _.first(response.file.split('.')), openNewModal: params.pdf.openNewModal };

        ReporteC.visualizarReporte(objPdfView);
      });
    }

    function transformRequestResponse(requestResponse) {
      const configApp = Ss.configServ.config;

      requestResponse.contenido_reporte = requestResponse.contenido_reporte.map(item => {
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
    return new Promise(resolve => this.getOne(id, extra).then(res => resolve(res)));
  }

  getFacturasByParams(args: {
    campo: string;
    valor: string | number;
    tipo_factura_id: number;
    tipo: string;
    page?: number;
    per_page?: number;
    paginado?: boolean;
    adelantada?: boolean;
    pagada?: any;
    estado?: boolean;
    movimientos_viaje?: boolean;
    extra_params?: any;
  }) {
    const valor_enc = fun.encriptar(args.valor.toString());
    const VALOR_ENC = valor_enc.replace('\\', '&^IC');
    args.pagada ??= '0';
    args.extra_params ??= {};

    const extra = {
      afterPath: `custom/get_documentos`,
      parameters: {
        page: args.page ?? 1,
        per_page: args.per_page ?? 20,
        paginado: args.paginado ?? false,
        tipo: args.tipo,
        pagada: args.pagada,
        campo: args.campo,
        valor: VALOR_ENC,
        tipo_factura_id: args.tipo_factura_id,
        is_adelantada: fun.objHas(args, 'adelantada') ? args.adelantada : '0',
        estado: fun.objHas(args, 'estado') ? args.estado : '0',
        movimientos_viaje: args.movimientos_viaje ?? false,
        ...args.extra_params,
      },
    };

    return this.dynamic(extra);
  }

  parseDataToPdf(data) {
    return new Promise<FacturasI>(resolve => {
      const pick_factura1 = ['Bruto', 'cliente', 'balance', 'condicion', 'descuento', 'identificador', 'detalle_facturas', 'numero_factura', 'devuelta', 'estado', 'fecha_completada', 'fecha_equivalente', 'fecha_valida', 'fecha_vencimiento'];
      const pick_factura2 = [
        'fecha_viaje',
        'forma_pago',
        'id',
        'is_viaje',
        'monto',
        'numero_comprobante',
        'tipo',
        'tipo_factura_id',
        'itbis',
        'suplidor',
        'tipo_factura',
        'total_factura',
        'usuario',
        'vendedor',
        'movimientos_viaje',
        'serie',
        'qr_url_dgii',
        'fecha_hora_firma',
        'is_aceptada',
        'dgii_message',
        'security_code',
        'is_ncf_modificado',
        'document_reference',
      ];
      const pick_factura = [...pick_factura1, ...pick_factura2];

      let temp_data_parsed = _.pick(fun.deepCloning(data), pick_factura);

      const data_parsed = fun.remplaceKeyFromJson(temp_data_parsed, [
        { old_key: 'tipo_factura', new_key: 'tipo_pdf' },
        { old_key: 'numero_factura', new_key: 'numero_documento' },
      ]);

      // data_parsed.fecha_equivalente = moment(data_parsed.fecha_equivalente).format();
      data_parsed.tipo_pdf = data_parsed.tipo_pdf.toUpperCase();
      if (data_parsed.tipo_pdf == 'COTIZACION') data_parsed.tipo_pdf = 'COTIZACIÓN';
      data_parsed.total = data_parsed.total_factura;
      data_parsed.contenido_reporte = [];

      const truncarNombre = entidad => {
        if (fun.hasValue(entidad) && entidad.nombre_completo.length > 80) {
          entidad.nombre_completo = `${entidad.nombre_completo.substring(0, 80)}...`;
        }
      };

      truncarNombre(data_parsed.cliente);
      truncarNombre(data_parsed.suplidor);

      data_parsed.detalle_facturas.forEach(detalle => {
        if ((detalle.is_devuelto && detalle.is_defectuoso) || !detalle.is_devuelto) {
          detalle['cantidad'] = `${fun.roundNumberToDecimal(detalle.cantidad)} ${unidadAbrev[fun.normalizarTexto(detalle.unidad)]}.`;
          data_parsed.contenido_reporte.push(detalle);
        }
      });

      resolve(data_parsed);
    });
  }

  modalVerDetalles(data, documento = 'Factura') {
    return {
      component: DetalleFacturaComponent,
      inputs: { data, documento: documento.toLowerCase() },
      id: `detalle_factura`,
      header: `Detalles ${documento}`,
      width: '35rem',
      minHeight: '10rem',
      botones: {
        ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
        dinamico: [{ clase: 'btn btn-blanco', function: instance => instance.closeModal(instance.id), label: 'Cerrar', disable: false }],
      },
    };
  }

  handleMostrarFactura(toPDFData, dataModal?, botones_dinamicos?) {
    return new Promise<any>((resolve, reject) => {
      PdfService.generatePdf({ oPdf: toPDFData, imprimir: false })
        .then(async res => {
          const inputs = { base64: res.base64, reimprimir: res.reimprimir, fileName: _.first(res.file.split('.')) };

          const obj_modal = {
            component: PdfViewerComponent,
            inputs: inputs,
            id: dataModal.id,
            header: dataModal.header,
            width: '900px',
            height: '70vh',
            botones: {
              ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
              dinamico: [{ clase: 'btn btn-blanco', function: instance => instance.closeModal(instance.id), label: 'Cerrar', disable: false }],
            },
          };

          if (fun.hasValue(botones_dinamicos)) obj_modal.botones.dinamico = botones_dinamicos;

          resolve(obj_modal);
        })
        .catch(err => {
          fun.toastError(err.msg, 'ERROR');
          reject(err);
        });
    });
  }

  abrirModalHistorial(pagos, notas, openNewModal) {
    if (pagos.length > 0 || notas.length > 0) {
      for (let i = 0; i < pagos.length; i++) {
        const pago = pagos[i];
        pago.numero_recibo = pago.numero_recibo.toString().padStart(8, '0');
        pago.fecha_equivalente = DateUtils.format({ date: pago.fecha_equivalente, dateFormat: 'DD/MM/YYYY' });
      }

      for (let i = 0; i < notas.length; i++) {
        const nota = notas[i];
        nota.total = Math.abs(nota.total);
        nota.fecha_equivalente = DateUtils.format({ date: nota.fecha_equivalente, dateFormat: 'DD/MM/YYYY' });
      }

      const obj = { abonos: pagos, notas: notas };
      openNewModal({
        component: ModalHistorialPagosComponent,
        inputs: obj,
        id: 'historial_pago',
        header: 'Historial de moviemientos a balance de factura',
        width: '700px',
        height: '400px',
        botones: fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
      });
    }
  }
}

export class TiposFacturaC extends CrudG<TipoFacturaI> {
  constructor() {
    super('tipo_facturas');
  }
}

export class FacturasAplicadasC extends CrudG<any> {
  constructor() {
    super('facturas_aplicadas');
  }
}

export enum tFacturaKey {
  factura_sin_comprobante = 'factura_sin_comprobante',
  factura_de_credito_fiscal = 'factura_de_credito_fiscal',
  factura_de_consumo = 'factura_de_consumo',
  nota_de_debito = 'nota_de_debito',
  nota_de_credito = 'nota_de_credito',
  comprobante_compras = 'comprobante_compras',
  registro_unico_ingreso = 'registro_unico_ingreso',
  gastos_menores = 'gastos_menores',
  regimenes_especiales = 'regimenes_especiales',
  gubernamental = 'gubernamental',
  comprobante_de_exportaciones = 'comprobante_de_exportaciones',
  comprobante_pagos_al_exterior = 'comprobante_pagos_al_exterior',
  venta_contado = 'venta_contado',
  venta_credito = 'venta_credito',
  compra = 'compra',
  conduce = 'conduce',
  produccion = 'produccion',
  recibo_ingreso = 'recibo_ingreso',
  pre_venta = 'pre_venta',
  cotizacion = 'cotizacion',
}

export interface TipoFacturaI {
  id: number;
  descripcion: string;
  referencia: string;
  serie: serie;
  key: string;
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
  is_ncf_modificado?: boolean;
  document_reference?: DocumentoReferenced;
  [propName: string]: any;
}

export interface Cliente {
  nombre: string;
  telefono: string;
  direccion: string;
  rnc: string;
}

export interface DocumentoReferenced {
  id: number;
  document_referenced: FacturasI;
  document_origin: FacturasI;
  referenced_at: Date;
  referenced_by: any;
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
  articulo: string | ArticuloI;
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
  cantidad_en_unidades_nota: number | null;
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
  mora: number;
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
