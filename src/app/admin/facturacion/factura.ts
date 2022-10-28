import { CrudG } from '../../core/typescript/crud-g';
import * as _ from 'lodash';
import { fun } from '../../core/services/functions.service';
import * as moment from '../../core/javascript/moment';
import { PdfViewerComponent } from '../components/pdf-viewer/pdf-viewer.component';
import { DetalleFacturaComponent } from '../manipular facturas/detalle-factura/detalle-factura.component';
import { ModalClass } from '../components/modal/modal-class';
import { ReporteC } from '../reportes/reporte';
import { PdfService } from '../../core/services/pdf/pdf.service';

export enum tipoDocFacturacion {
  pre_venta = 'pre_venta',
  venta = 'venta',
  compra = 'compra',
  cotizacion = 'cotizacion',
}

export class FacturaC extends CrudG<FacturasI> {
  constructor() {
    super('cabecera_facturas');
  }

  static openModalReporteForm(params: { tipo: any; inputs: any; openNewModal; titulo?: any }) {
    return new Promise<any>((resolve, reject) => {
      params.inputs['switches'] = {
        title: 'Seleccione los metodos de pago deseados',
        array: [
          { label: 'Efectivo', value: true },
          { label: 'Tarjeta', value: true },
          { label: 'Cheque', value: true },
          { label: 'Transferencia', value: false },
        ],
      };

      ReporteC.objReporte = { inputs: params.inputs, id: params.tipo, header: params.inputs.titulo, returnDataFromModal: returnDataFromModal };

      params.openNewModal(ReporteC.objReporte);

      function returnDataFromModal(arg) {
        FacturaC.requestReporte({ reporte: arg, pdf: params });
      }
    });
  }

  static requestReporte(params: { reporte; pdf }) {
    if (_.every(params.reporte.data.switches.array, (item) => item.value === false)) {
      fun.toastError('Debe seleccionar almenos un metodo de pago.', 'ERROR');
    } else {
      const requestParams = { afterPath: 'custom/ventas', parameters: null };
      let formas_pago = '(';

      params.reporte.data.switches.array.forEach((item) => {
        if (item.value) formas_pago += `'${item.label}',`;
      });

      formas_pago = `${formas_pago.slice(0, formas_pago.length - 1)})`;
      requestParams.parameters = {
        tipo: params.reporte.data.tipo,
        condicion: params.reporte.data.condicion,
        formas_pago: formas_pago,
        desde: fun.my_dateFormater(params.reporte.data.desde, false),
        hasta: fun.my_dateFormater(params.reporte.data.hasta, false),
      };

      ReporteC.requestReporteAndMakePdf(requestParams, 'reporte').then((response) => {
        let objPdfView = { ...response, titulo: params.pdf.inputs.titulo, height: '76vh', fileName: _.first(response.file.split('.')), openNewModal: params.pdf.openNewModal };

        ReporteC.visualizarReporte(objPdfView);
      });
    }
  }

  getFacturaById(id: number) {
    return new Promise((resolve) => this.getOne(id).then((res) => resolve(res)));
  }

  getFacturasByParams(args: { campo: string; valor: 'string'; tipo_factura_id: number; adelantada: boolean; page: number; per_page: number; paginado: boolean; fact_de: string }) {
    // `params/${campo}/${VALOR_ENC}/${tipo_factura_id}/${adelantada}?page=${page}&per_page=${per_page}&paginado=${paginado}`

    const valor_enc = btoa(args.valor);
    const VALOR_ENC = _.replace(valor_enc, '\\', '&^IC');

    const extra = {
      afterPath: `params/${args.campo}/${VALOR_ENC}/${args.tipo_factura_id}/${args.adelantada}`,
      parameters: { page: args.page, per_page: args.per_page, paginado: args.paginado },
    };
    return this.getAll(extra);
  }

  parseDataToPdf(data) {
    return new Promise((resolve) => {
      const pick_factura = [
        'Bruto',
        'cliente',
        'balance',
        'condicion',
        'descuento',
        'identificador',
        'detalle_facturas',
        'numero_factura',
        'devuelta',
        'estado',
        'fecha_equivalente',
        'fecha_valida',
        'fecha_vencimiento',
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
      ];

      let temp_data_parsed = _.pick(fun.duplicarJson(data), pick_factura);

      const data_parsed = fun.remplaceKeyFromJson(temp_data_parsed, [
        { old_key: 'tipo_factura', new_key: 'tipo_pdf' },
        { old_key: 'detalle_facturas', new_key: 'contenido_reporte' },
        { old_key: 'numero_factura', new_key: 'numero_documento' },
      ]);
      console.log('data_parsed ', data_parsed);

      data_parsed.fecha_equivalente = moment(data_parsed.fecha_equivalente);
      data_parsed.tipo_pdf = data_parsed.tipo_pdf.toUpperCase();
      data_parsed.total = data_parsed.total_factura;

      data_parsed.contenido_reporte.map((detalle) => {
        detalle['cantidad'] = `${fun.numFormatTwoDecimals(detalle.cantidad)} ${detalle.unidad}`;
        return detalle;
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

  handleMostrarFactura(dataFactura, botones_dinamicos?) {
    return new Promise<any>((resolve, reject) => {
      const toPDFData = { data: dataFactura, type: 'facturacion' };

      PdfService.generatePdf({ oPdf: toPDFData, imprimir: false }).then(async (res) => {
        if (res.status === 'si') {
          const inputs = { base64: res.base64, height: '40rem', reimprimir: res.reimprimir, fileName: _.first(res.file.split('.')) };
          const obj_modal = {
            component: PdfViewerComponent,
            inputs: inputs,
            id: 'mostrarFactura',
            header: 'MOSTRAR FACTURA',
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

export enum tipoFacturaId {
  Factura_sin_comprobante = 1,
  Factura_con_valor_fiscal = 2,
  Factura_de_consumo = 3,
  Nota_de_debito = 4,
  Nota_de_credito = 5,
  Comprobante_de_compras = 6,
  Registro_de_unico_ingreso = 7,
  Comprobante_para_gastos_menores = 8,
  Comprobante_de_regimen_especiales = 9,
  Comprobante_gubernamental = 10,
  Comprobante_para_exportaciones = 11,
  Comprobantes_para_pago_al_exterior = 12,
  Venta_Contado = 13,
  Compra = 14,
  Conduce = 15,
  Produccion = 16,
  Recibo_ingreso = 17,
  Venta_Credito = 18,
  pre_venta = 19,
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
