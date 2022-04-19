import { Component, OnInit } from '@angular/core';
import { fun } from '../../../core/services/functions.service';
import { ModalI } from '../../components/modal/modal-class';
@Component({
  selector: 'app-detalle-nota',
  templateUrl: './detalle-nota.component.html',
  styleUrls: ['./detalle-nota.component.scss'],
})
export class DetalleNotaComponent implements OnInit, ModalI {
  constructor() {}
  modal: {};
  inputs: any;
  tabIndex = 0;

  info = [
    { titulo: 'Articulo', tipo: 'text', key: 'descripcion', estilos: [{ 'text-align': 'left' }, { width: '50%' }, { 'padding-left': '1rem' }] },
    { titulo: 'Cantidad', key: 'cantidad', tipo: 'formatoNumero', formatoNumero: true, estilos: [{ width: '25%' }] },
    { titulo: 'Unidad', key: 'unidad', tipo: 'text', estilos: [{ width: '25%' }] },
  ];

  ngOnInit(): void {
    this.parseInfo();
  }

  parseInfo() {
    this.inputs.data.facturas_aplicadas.map((factura_aplicada) => {
      factura_aplicada.detalles_facturas_notas.map((detalle) => {
        detalle.descripcion = detalle.articulo.nombre;
        detalle.customStyles = {
          'td-descripcion': { width: '50%', 'padding-left': '1rem', 'text-align': 'left' },
          'td-cantidad': { width: '25%' },
          'td-unidad': { width: '25%' },
        };
        return detalle;
      });
      return factura_aplicada;
    });
  }

  numFormat(str) {
    return fun.numFormatTwoDecimals(str);
  }

  btn_aceptar() {
    throw new Error('Method not implemented.');
  }
}
