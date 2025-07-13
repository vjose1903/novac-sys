import { computed, Injectable, signal } from '@angular/core';
import { fun } from '@core/services/functions.service';
import { comprobante, comprobanteElectronico, comprobanteNormal, tipoDocFacturacion, TipoFacturaI, tFacturaKey } from './factura';
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

  lista_tipos_facturas: TipoFacturaI[];
  propietario_factura;
  pre_venta_selected;
  cotizacion_selected;
  productos_devueltos = [];
  filasDetalle;
  serieType = signal(serie.electronica);

  isCompra = computed(() => this.tipoDocumento() == tipoDocFacturacion.compra);
  isVenta = computed(() => this.tipoDocumento() == tipoDocFacturacion.venta);
  isCotizacion = computed(() => this.tipoDocumento() == tipoDocFacturacion.cotizacion);
  isPreVenta = computed(() => this.tipoDocumento() == tipoDocFacturacion.pre_venta);

  isComprobanteElectronico = computed(() => this.serieType() == serie.electronica);
  isComprobanteNormal = computed(() => this.serieType() == serie.normal);

  public get clienteContado(): { id?: any; nombre?: string; direccion?: string; telefono?: any } {
    if (fun.hasValue(Ss.configServ)) {
      const configApp = Ss.configServ.config;

      return { id: null, nombre: 'Cliente contado', direccion: configApp.direccion_empresa, telefono: null };
    } else {
      return {};
    }
  }

  constructor() {}

  setTipos(metodo: tipoDocFacturacion, serie: serie, sameTipo: boolean = false) {
    return new Promise<any>((resolve, reject) => {
      this.serieType.set(serie);

      if (metodo == tipoDocFacturacion.compra || metodo == tipoDocFacturacion.venta) {
        const defaultKey = metodo == tipoDocFacturacion.compra ? tFacturaKey.factura_de_credito_fiscal : tFacturaKey.factura_de_consumo;

        const keyTarget = sameTipo && fun.hasValue(this.tipoFactura) ? this.tipoFactura.key : defaultKey;

        this.tipoFactura = this.lista_tipos_facturas.find(tipo_factura => tipo_factura.key == keyTarget && tipo_factura.serie == this.serieType());

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

      this.setTipoFacturaSelected({ value: this.tipoFactura.id, by: 'id' });
      resolve(true);
    });
  }

  setTipoFacturaSelected(args: { value: any; by: string; equivalentSerie?: boolean }) {
    const { value, by, equivalentSerie = false } = args;

    return new Promise<any>((resolve, reject) => {
      const originalTipoFactura = this.lista_tipos_facturas.find(tipo_factura => (by == 'id' ? tipo_factura[by] == value : tipo_factura[by] == value));

      if (equivalentSerie) {
        this.tipoFactura = this.lista_tipos_facturas.find(item => item.key == originalTipoFactura.key && item.serie == this.serieType());
      } else {
        this.tipoFactura = this.lista_tipos_facturas.find(tipo_factura => (by == 'id' ? tipo_factura[by] == value : tipo_factura[by] == value && tipo_factura.serie == this.serieType()));
      }

      this.tipoFacturaReferenciaSelected = this.tipoFactura.referencia;

      resolve(value);
    });
  }

  tipoFacturaId(key: tFacturaKey, serie?: serie) {
    const serieTarget = fun.hasValue(serie) ? serie : this.serieType();
    return this.lista_tipos_facturas.find(tipo_factura => tipo_factura.key == key && tipo_factura.serie == serieTarget).id;
  }

  getDocumentoDescripcion(params: { metodo: string; condicion_fact: string; modo_factura: string; is_viaje: boolean }, print?) {
    const res = { descripcion: undefined, descripcion_short: undefined, has_Propietario: fun.hasValue(this.propietario_factura), tipo: 'facturacion' };
    const actualPath = fun.getActualPath();

    if ((params.metodo == tipoDocFacturacion.cotizacion || params.metodo == tipoDocFacturacion.pre_venta) && (actualPath.includes('cotizacion') || actualPath.includes('pre_venta'))) {
      res.descripcion = params.metodo == tipoDocFacturacion.cotizacion ? 'Cotización' : 'Pre-venta';
      res.tipo = params.metodo == tipoDocFacturacion.cotizacion ? tipoDocFacturacion.cotizacion : tipoDocFacturacion.pre_venta;
      //
    } else if (params.condicion_fact == 'Crédito') {
      res.descripcion = 'Factura a Crédito';
      //
    } else if (params.metodo == tipoDocFacturacion.nota_credito || params.metodo == tipoDocFacturacion.nota_debito) {
      res.descripcion = tipoDocFacturacion.nota_credito ? 'Nota de Crédito' : 'Nota de Dédito';

      //
    } else if (fun.hasValue(this.tipoFactura) && this.tipoFactura?.referencia == '01') {
      res.descripcion = 'Factura con valor fiscal';
      //
    } else if (params.modo_factura == 'adelantada') {
      res.descripcion = 'Factura adelantada';
      //
    } else if (params.is_viaje) {
      res.descripcion = 'Factura de viaje';
      //
    } else {
      if (params.metodo == tipoDocFacturacion.venta) {
        res.descripcion = 'Factura de venta';
        if (params.condicion_fact != 'Crédito') res.has_Propietario = true;
      }
      if (params.metodo == tipoDocFacturacion.compra) res.descripcion = 'Factura de compra';
    }

    if (fun.hasValue(res?.descripcion)) res.descripcion_short = res.descripcion.split(' ')[0];

    return res;
  }

  getDetallesLlenos() {
    if (fun.hasValue(this.filasDetalle)) {
      const filasMap = this.filasDetalle.map(inner_detalle => inner_detalle.value);

      return filasMap.filter(filter_detalle => fun.hasValue(filter_detalle?.key));
    } else {
      return [];
    }
  }
}
