import { Component, OnInit } from '@angular/core';
import { DBservice } from '../../../core/services/bdservice.service';

@Component({
  selector: 'app-buscar-factura',
  templateUrl: './buscar-factura.component.html',
  styleUrls: ['./buscar-factura.component.scss'],
})
export class BuscarFacturaComponent implements OnInit {
  facturas: any;
  campoSelected: string;
  constructor(private dbServ: DBservice) {}
  campo = null;
  placeHolder = '';
  ngOnInit() {}
  async pedirFactura(campo, valor) {
    try {
      this.facturas = this.dbServ.getFacturasByParams(campo, valor).toPromise;
    } catch (error) {
      console.error(error);
    }
  }
  changeSelect(valor) {
    if (valor === '1') {
      this.campoSelected = 'Cliente';
      this.placeHolder = 'Nombre Cliente';
    } else if (valor === '2') {
      this.campoSelected = 'Numero Comprobante';
      this.placeHolder = 'Escriba numero de comprobante';
    } else if (valor === '3') {
      this.campoSelected = 'Numero Factura';
      this.placeHolder = 'Escriba numero de factura';
    }
  }
  saltar(campo, valor) {}
}
