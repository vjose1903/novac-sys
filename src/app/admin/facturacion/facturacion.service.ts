import { Injectable, signal } from '@angular/core';
import { fun } from '@core/services/functions.service';
import { comprobante, comprobanteElectronico, comprobanteNormal, tFacturaD, tipoDocFacturacion, TipoFacturaI } from './factura';
import { Ss } from '@core/services/singleton.service';
import { serie } from '@core/typescript/constantes';

@Injectable({
  providedIn: 'root',
})
export class FacturacionService {
  action;
  tipoDocumento: tipoDocFacturacion;
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
  serieType = serie.normal;

  public get clienteContado(): { id?: any; nombre?: string; direccion?: string; telefono?: any } {
    if (fun.hasValue(Ss.configServ)) {
      const configApp = Ss.configServ.getConfig({ isPromise: false });

      return { id: null, nombre: 'Cliente contado', direccion: configApp.direccion_empresa, telefono: null };
    } else {
      return {};
    }
  }

  public get isCompra(): boolean {
    return this.tipoDocumento == tipoDocFacturacion.compra;
  }

  public get isVenta(): boolean {
    return this.tipoDocumento == tipoDocFacturacion.venta;
  }

  public get isCotizacion(): boolean {
    return this.tipoDocumento == tipoDocFacturacion.cotizacion;
  }

  public get isPreVenta(): boolean {
    return this.tipoDocumento == tipoDocFacturacion.pre_venta;
  }

  public get isComprobanteElectronico(): boolean {
    return this.serieType == serie.electronica;
  }

  public get isComprobanteNormal(): boolean {
    return this.serieType == serie.normal;
  }

  constructor() {}

  setTipos(metodo: tipoDocFacturacion, serie: serie, sameTipo: boolean = false) {
    return new Promise<any>((resolve, reject) => {
      this.serieType = serie;

      if (metodo == tipoDocFacturacion.compra) {
        const referenciaTarget = sameTipo && fun.hasValue(this.tipoFactura) ? this.tipoFactura.descripcion : tFacturaD.factura_con_valor_fiscal;
        this.tipoFactura = this.lista_tipos_facturas.find((tipo_factura) => tipo_factura.descripcion == referenciaTarget && tipo_factura.serie == this.serieType);

        this.htmlTiposFacturas = `<div style=" max-width: 21rem;" > \
        <span>${comprobante[this.serieType].valor_fiscal} Valor fiscal</span><br>\
        <span>${comprobante[this.serieType].factura_consumo} Factura de consumo</span><br>\
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

        this.options_tipos_facturas = [comprobante[this.serieType].valor_fiscal, comprobante[this.serieType].factura_consumo];
        this.options_tipos_costos_gastos = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
      } else if (metodo == tipoDocFacturacion.venta) {
        const referenciaTarget = sameTipo && fun.hasValue(this.tipoFactura) ? this.tipoFactura.descripcion : tFacturaD.factura_de_consumo;
        this.tipoFactura = this.lista_tipos_facturas.find((tipo_factura) => tipo_factura.descripcion == referenciaTarget && tipo_factura.serie == this.serieType);

        this.htmlTiposFacturas = `<div style=" max-width: 21rem;" > \
          <span>${comprobante[this.serieType].valor_fiscal} Valor fiscal</span><br>\
          <span>${comprobante[this.serieType].factura_consumo} Factura de consumo</span><br>\
          <span>${comprobante[this.serieType].comprobante_compras} Comprobante de compras</span><br>\
          <span>${comprobante[this.serieType].gastos_menores} Comprobante para gastos menores</span><br>\
          <span>${comprobante[this.serieType].comprobante_regimen_especiales} Comprobante de regimen especiales</span><br>\
          <span>${comprobante[this.serieType].comprobante_gubernamental} Comprobante gubernamental</span><br>\
          <span>${comprobante[this.serieType].comprobante_exportaciones} Comprobante para exportaciones</span><br>\
          <span>${comprobante[this.serieType].comprobantes_pago_exterior} Comprobantes para pago al exterior</span><br>\
          </div>`;

        this.options_tipos_facturas = [
          comprobante[this.serieType].valor_fiscal,
          comprobante[this.serieType].factura_consumo,
          comprobante[this.serieType].comprobante_compras,
          comprobante[this.serieType].gastos_menores,
          comprobante[this.serieType].comprobante_regimen_especiales,
          comprobante[this.serieType].comprobante_gubernamental,
          comprobante[this.serieType].comprobante_exportaciones,
          comprobante[this.serieType].comprobantes_pago_exterior,
        ];
      } else if (metodo == tipoDocFacturacion.cotizacion) {
        this.tipoFactura = this.lista_tipos_facturas.find((tipo_factura) => tipo_factura.descripcion == tipoDocFacturacion.cotizacion && tipo_factura.serie == this.serieType);
      } else if (metodo == tipoDocFacturacion.pre_venta) {
        this.tipoFactura = this.lista_tipos_facturas.find((tipo_factura) => tipo_factura.descripcion == tipoDocFacturacion.pre_venta && tipo_factura.serie == this.serieType);
      }

      this.setTipoFacturaSelected(this.tipoFactura.id, 'id');
      resolve(true);
    });
  }

  setTipoFacturaSelected(value, by = 'referencia') {
    return new Promise<any>((resolve, reject) => {
      this.tipoFactura = this.lista_tipos_facturas.find((tipo_factura) => tipo_factura[by] == value && tipo_factura.serie == this.serieType);
      this.tipoFacturaReferenciaSelected = this.tipoFactura.referencia;

      resolve(value);
    });
  }

  tipoFacturaId(descripcion: tFacturaD) {
    return this.lista_tipos_facturas.find((tipo_factura) => tipo_factura.descripcion == descripcion && tipo_factura.serie == this.serieType).id;
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
      const filasMap = this.filasDetalle.map((inner_detalle) => inner_detalle.value);

      return filasMap.filter((filter_detalle) => fun.hasValue(filter_detalle?.key));
    } else {
      return [];
    }
  }
}
