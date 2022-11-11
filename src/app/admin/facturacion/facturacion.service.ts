import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FacturacionService {
  pre_factura_selected;

  tipoFactura: string;
  TiposFacturas: string;
  tipos_facturas: string[];
  TiposCostosGastos: string;
  tipos_costosYgastos: string[];

  constructor() {}

  setTipos(metodo, callback = (arg) => {}) {
    if (metodo === 'venta') {
      this.tipoFactura = '02';
      // <span>00 Factura sin comprobante</span><br>\
      this.TiposFacturas =
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
      this.tipos_facturas = ['00', '01', '02', '11', '12', '13', '14', '15', '16', '17'];
    } else {
      this.tipoFactura = '01';
      this.TiposFacturas = '<div style=" max-width: 21rem;" > \
      <span>01 Valor fiscal</span><br>\
      <span>02 Factura de consumo</span><br>\
      </div>';

      this.TiposCostosGastos =
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
      this.tipos_facturas = ['01', '02'];
      this.tipos_costosYgastos = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
    }

    callback(true);
  }
}
