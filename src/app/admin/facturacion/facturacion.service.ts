import { computed, Injectable, signal } from '@angular/core';
import { fun } from '@core/services/functions.service';
import { comprobante, comprobanteElectronico, comprobanteNormal, tipoDocFacturacion, TipoFacturaI, tFacturaKey, TiposFacturaC } from './factura';
import { Ss } from '@core/services/singleton.service';
import { serie } from '@core/typescript/constantes';

@Injectable({
  providedIn: 'root',
})
export class FacturacionService {
  action;
  tipoDocumento = signal<tipoDocFacturacion | null>(null);
  tipoFacturaReferenciaSelected: string;
  tipoFactura: TipoFacturaI;
  htmlTiposFacturas: string;
  options_tipos_facturas: string[];
  htmlTiposCostosGastos: string;
  options_tipos_costos_gastos: string[];
  lista_tipos_facturas: Array<TipoFacturaI>;
  propietario_factura;
  pre_venta_selected;
  cotizacion_selected;
  productos_devueltos = [];
  filasDetalle;

  tipoFacturaClass = new TiposFacturaC();
  serieType = signal(serie.electronica);

  isCompra = computed(() => this.tipoDocumento() == tipoDocFacturacion.compra);
  isVenta = computed(() => this.tipoDocumento() == tipoDocFacturacion.venta);
  isCotizacion = computed(() => this.tipoDocumento() == tipoDocFacturacion.cotizacion);
  isPreVenta = computed(() => this.tipoDocumento() == tipoDocFacturacion.pre_venta);

  isComprobanteElectronico = computed(() => this.serieType() == serie.electronica);
  isComprobanteNormal = computed(() => this.serieType() == serie.normal);

  public get clienteContado(): { id?: any; direccion?: string; telefono?: any; nombre_completo?: string } {
    if (fun.hasValue(Ss.configServ)) {
      const configApp = Ss.configServ.config;

      return { id: null, nombre_completo: 'Cliente contado', direccion: configApp.direccion_empresa, telefono: null };
    } else {
      return {};
    }
  }

  constructor() {}

  setTipos(args: { metodo: tipoDocFacturacion; serie: serie; equivalentSerie?: boolean; tipoFacturaId?: number }) {
    return new Promise<any>(async (resolve, reject) => {
      const { metodo, serie, equivalentSerie, tipoFacturaId } = args;

      this.serieType.set(serie);

      if (metodo == tipoDocFacturacion.compra || metodo == tipoDocFacturacion.venta) {
        const defaultKey = metodo == tipoDocFacturacion.compra ? tFacturaKey.factura_de_credito_fiscal : tFacturaKey.factura_de_consumo;

        const keyTarget = equivalentSerie && fun.hasValue(this.tipoFactura) ? this.tipoFactura.key : defaultKey;

        this.tipoFactura = this.lista_tipos_facturas.find(tipo_factura => (tipoFacturaId ? tipo_factura.id == tipoFacturaId : tipo_factura.key == keyTarget && tipo_factura.serie == this.serieType()));

        this.htmlTiposFacturas = `<div style=" max-width: 21rem;" > \
          <span>${comprobante[this.serieType()].factura_de_credito_fiscal} Factura de credito fiscal</span><br>\
          <span>${comprobante[this.serieType()].factura_de_consumo} Factura de consumo</span><br>\
        </div>`;

        this.htmlTiposCostosGastos =
          '<div style=" max-width: 30rem; min-width: 30rem;" > \
        <span>1 Gastos de personal </span><br>\
        <span>2 Gastos de trabajos, suministros y servicios</span><br>\
        <span>3 Arrendamientos</span><br>\
        <span>4 Gastos de activos fijos</span><br>\
        <span>5 Gastos de representación</span><br>\
        <span>6 Gastos deducciones admitidas</span><br>\
        <span>7 Gastos financieros</span><br>\
        <span>8 Gastos extraordinarios</span><br>\
        <span>9 Compras y gastos que forman parte del costo de venta</span><br>\
        <span>10 Adquisiciones de activos</span><br>\
        <span>11 Gastos de Seguros</span><br>\
        </div>';

        this.options_tipos_facturas = [comprobante[this.serieType()].factura_de_credito_fiscal, comprobante[this.serieType()].factura_de_consumo];
        this.options_tipos_costos_gastos = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
      } else if (metodo == tipoDocFacturacion.cotizacion) {
        this.tipoFactura = this.lista_tipos_facturas.find(tipo_factura => tipo_factura.key == tFacturaKey.cotizacion && tipo_factura.serie == this.serieType());
      } else if (metodo == tipoDocFacturacion.pre_venta) {
        this.tipoFactura = this.lista_tipos_facturas.find(tipo_factura => tipo_factura.key == tFacturaKey.pre_venta && tipo_factura.serie == this.serieType());
      }

      await this.setTipoFacturaSelected({ value: this.tipoFactura.id, by: 'id', equivalentSerie: false });
      resolve(true);
    });
  }

  setTipoFacturaSelected(args: { value: any; by: string; equivalentSerie?: boolean }) {
    const { value, by, equivalentSerie = false } = args;

    return new Promise<any>(resolve => {
      // Buscar el tipo de factura original
      const originalTipoFactura = this.lista_tipos_facturas.find(tipo_factura => tipo_factura[by] === value);

      if (!originalTipoFactura) {
        resolve(value);
        return;
      }

      // Determinar el tipo de factura final según equivalentSerie
      if (equivalentSerie) {
        this.tipoFactura = this.lista_tipos_facturas.find(item => item.key === originalTipoFactura.key && item.serie === this.serieType());
      } else {
        this.tipoFactura = this.lista_tipos_facturas.find(tipo_factura => tipo_factura[by] === value && tipo_factura.serie === this.serieType());
      }

      // Actualizar referencia seleccionada si se encontró el tipo de factura
      if (this.tipoFactura) this.tipoFacturaReferenciaSelected = this.tipoFactura.referencia;

      resolve(value);
    });
  }

  tipoFacturaId(key: tFacturaKey, serie?: serie) {
    const serieTarget = fun.hasValue(serie) ? serie : this.serieType();
    return this.lista_tipos_facturas.find(tipo_factura => tipo_factura.key == key && tipo_factura.serie == serieTarget).id;
  }

  getDocumentoDescripcion(params: { metodo: string; condicion_fact: string; modo_factura: string; is_viaje: boolean }) {
    const res = {
      descripcion: undefined,
      descripcion_short: undefined,
      has_Propietario: fun.hasValue(this.propietario_factura),
      tipo: 'facturacion',
    };

    const actualPath = fun.getActualPath();
    const { metodo, condicion_fact, modo_factura, is_viaje } = params;

    // Determinar descripción según el tipo de documento
    if (this.isCotizacionOrPreVenta(metodo, actualPath)) {
      res.descripcion = metodo === tipoDocFacturacion.cotizacion ? 'Cotización' : 'Pre-venta';
      res.tipo = metodo;
    } else if (metodo === tipoDocFacturacion.pago_factura) {
      res.descripcion = 'Pago de factura';
    } else if (condicion_fact === 'Crédito') {
      res.descripcion = 'Factura a Crédito';
    } else if (condicion_fact === 'conduce') {
      res.descripcion = 'Conduce de mercancía';
    } else if (this.isNotaCreditoOrDebito(metodo)) {
      res.descripcion = metodo === tipoDocFacturacion.nota_credito ? 'Nota de Crédito' : 'Nota de Débito';
    } else if (this.isFacturaConValorFiscal()) {
      res.descripcion = 'Factura con valor fiscal';
    } else if (modo_factura === 'adelantada') {
      res.descripcion = 'Factura adelantada';
    } else if (is_viaje) {
      res.descripcion = 'Factura de viaje';
    } else {
      this.setDescripcionPorMetodo(res, metodo, condicion_fact);
    }

    // Generar descripción corta si existe descripción
    if (fun.hasValue(res.descripcion)) {
      res.descripcion_short = res.descripcion.split(' ')[0];
    }

    return res;
  }

  private isCotizacionOrPreVenta(metodo: string, actualPath: string): boolean {
    return (metodo === tipoDocFacturacion.cotizacion || metodo === tipoDocFacturacion.pre_venta) && (actualPath.includes('cotizacion') || actualPath.includes('pre_venta'));
  }

  private isNotaCreditoOrDebito(metodo: string): boolean {
    return metodo === tipoDocFacturacion.nota_credito || metodo === tipoDocFacturacion.nota_debito;
  }

  private isFacturaConValorFiscal(): boolean {
    return fun.hasValue(this.tipoFactura) && this.tipoFactura?.referencia === '01';
  }

  private setDescripcionPorMetodo(res: any, metodo: string, condicion_fact: string): void {
    if (metodo === tipoDocFacturacion.venta) {
      res.descripcion = 'Factura de venta';
      if (condicion_fact !== 'Crédito') res.has_Propietario = true;
    } else if (metodo === tipoDocFacturacion.compra) {
      res.descripcion = 'Factura de compra';
    }
  }

  async getTiposFacturas(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const tiposFacturas = (await this.tipoFacturaClass.getAll()) as unknown as TipoFacturaI[];

        const tiposFacturasOrdenados = tiposFacturas.sort((a, b) => fun.compare(a, b, ['id'], 'asc')) as TipoFacturaI[];

        this.lista_tipos_facturas = tiposFacturasOrdenados;
        resolve();
      } catch (error) {
        fun.logRed('error: ', error);
        reject(error);
      }
    });
  }

  getDetallesLlenos() {
    if (!fun.hasValue(this.filasDetalle)) return [];

    return this.filasDetalle.controls.map(inner_detalle => inner_detalle.value).filter(detalle => fun.hasValue(detalle?.key));
  }
}
