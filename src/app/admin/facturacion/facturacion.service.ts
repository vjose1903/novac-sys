import { fun } from './../../core/services/functions.service';
import { Injectable } from '@angular/core';
import { tFacturaD, tipoDocFacturacion, TipoFacturaI } from './factura';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class FacturacionService {
  tipoFacturaReferenciaSelected: string;
  tipoFactura: TipoFacturaI;
  htmlTiposFacturas: string;
  options_tipos_facturas: string[];
  htmlTiposCostosGastos: string;
  options_tipos_costos_gastos: string[];
  lista_tipos_facturas: TipoFacturaI[];
  propietario_factura;

  referencia_tipos_facturas = {
    'factura sin comprobante': '00',
    'factura con valor fiscal': '01',
    'factura de consumo': '02',
    'comprobante de compras': '11',
    'registro de unico ingreso': '12',
    'comprobante para gastos menores': '13',
    'comprobante de regimen especiales': '14',
    'comprobante gubernamental': '15',
    'comprobante para exportaciones': '16',
    'comprobantes para pago al exterior': '17',
  };

  constructor() {}

  setTipos(metodo) {
    return new Promise<any>((resolve, reject) => {
      if (metodo == tipoDocFacturacion.compra) {
        this.tipoFactura = _.find(this.lista_tipos_facturas, { referencia: '01' });
        // this.tipoFactura = '01';

        this.htmlTiposFacturas = '<div style=" max-width: 21rem;" > \
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
    if (print) console.log(' ');
    if (print) console.log('params ', params);
    if (print) console.log(' ');

    const actualPath = fun.getActualPath();
    let documento;

    if ((params.metodo == tipoDocFacturacion.cotizacion || params.metodo == tipoDocFacturacion.pre_venta) && actualPath.includes('cotizacion')) {
      documento = params.metodo == tipoDocFacturacion.cotizacion ? 'Cotización' : 'Pre venta';
    } else if (params.condicion_fact == 'Crédito') documento = 'Factura a Crédito';
    else if (this.tipoFactura.referencia == '01') documento = 'Factura con valor fiscal';
    else if (params.modo_factura == 'adelantada') documento = 'Factura adelantada';
    else if (params.is_viaje) documento = 'Factura de viaje';
    else {
      if (params.metodo == tipoDocFacturacion.venta) documento = 'Factura de venta';
      if (params.metodo == tipoDocFacturacion.compra) documento = 'Factura de compra';
    }

    return { descripcion: documento, descripcion_short: documento.split(' ')[0], has_Propietario: fun.hasValue(this.propietario_factura) };
  }
}
