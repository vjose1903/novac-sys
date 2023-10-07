import { fun } from './../../core/services/functions.service';
import { Injectable } from '@angular/core';
import { tFacturaD, tipoDocFacturacion, TipoFacturaI } from './factura';
import * as _ from 'lodash';

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

  constructor() {}

  setTipos(metodo) {
    return new Promise<any>((resolve, reject) => {
      if (metodo == tipoDocFacturacion.compra) {
        this.tipoFactura = _.find(this.lista_tipos_facturas, { referencia: '01' });
        // this.tipoFactura = '01';

        this.htmlTiposFacturas =
          '<div style=" max-width: 21rem;" > \
        <span>01 Valor fiscal</span><br>\
        <span>02 Factura de consumo</span><br>\
        </div>';

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

        this.options_tipos_facturas = ['01', '02'];
        this.options_tipos_costos_gastos = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
      } else if (metodo == tipoDocFacturacion.venta) {
        this.tipoFactura = _.find(this.lista_tipos_facturas, { referencia: '02' });
        // this.tipoFactura = '02';
        // <span>00 Factura sin comprobante</span><br>\
        this.htmlTiposFacturas =
          '<div style=" max-width: 21rem;" > \
          <span>01 Valor fiscal</span><br>\
          <span>02 Factura de consumo</span><br>\
          <span>11 Comprobante de compras</span><br>\
          <span>12 Registro de unico ingreso</span><br>\
          <span>13 Comprobante para gastos menores</span><br>\
          <span>14 Comprobante de regimen especiales</span><br>\
          <span>15 Comprobante gubernamental</span><br>\
          <span>16 Comprobante para exportaciones</span><br>\
          <span>17 Comprobantes para pago al exterior</span><br>\
          </div>';

        this.options_tipos_facturas = ['00', '01', '02', '11', '12', '13', '14', '15', '16', '17'];
      } else if (metodo == tipoDocFacturacion.cotizacion) {
        this.tipoFactura = _.find(this.lista_tipos_facturas, { descripcion: tipoDocFacturacion.cotizacion });
      } else if (metodo == tipoDocFacturacion.pre_venta) {
        this.tipoFactura = _.find(this.lista_tipos_facturas, { descripcion: tipoDocFacturacion.pre_venta });
      }

      this.setTipoFacturaSelected(metodo, this.tipoFactura.id, 'id');
      resolve(true);
    });
  }

  setTipoFacturaSelected(metodo, value, by = 'referencia') {
    return new Promise<any>((resolve, reject) => {
      if (this.options_tipos_facturas?.includes(value) || by != 'referencia') {
        this.tipoFactura = _.find(this.lista_tipos_facturas, (tipo_factura) => tipo_factura[by] == value);
        this.tipoFacturaReferenciaSelected = this.tipoFactura.referencia;
        resolve(value);
      } else {
        reject(undefined);
      }
    });
  }

  tipoFacturaId(descripcion: tFacturaD) {
    return _.find(this.lista_tipos_facturas, { descripcion: descripcion }).id;
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
