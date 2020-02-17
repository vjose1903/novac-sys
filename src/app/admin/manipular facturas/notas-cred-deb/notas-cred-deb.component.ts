import { Component, OnInit, Input } from '@angular/core';

import * as _ from 'lodash';
import * as moment from 'moment';
import { GLOBAL } from '../../../core/services/GLOBAL';
import { DBservice } from '../../../core/services/bdservice.service';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-notas-cred-deb',
  templateUrl: './notas-cred-deb.component.html',
  styleUrls: ['./notas-cred-deb.component.scss'],
})
export class NotasCredDebComponent implements OnInit {
  factura;
  idFactura: any;
  tipoNota: any;
  tituloPag = '';
  factura_aplicada;
  tipos = {
    credito: 'crédito',
    debito: 'débito',
  };
  fecha: string;
  TOTAL = 0;

  info = [
    {
      titulo: 'Seleccione',
      tipo: 'check',
      key: 'select',

      disable: {
        getDisabled: false,
        campo: '',
      },
      title: '',
      customClass: true,
      estilos: [{ width: '5.5rem' }],
    },
    {
      titulo: 'Articulo',
      key: 'descripcion',
    },
    {
      titulo: 'Cantidad',
      key: 'cantidad',
      formatoNumero: true,
      tipo: 'input',
      inputType: 'number',
      disable: {
        getDisabled: true,
        campo: 'select',
      },
      customClass: true,
      estilos: [{ width: '5.5rem' }],
    },
    {
      titulo: 'Unidad',
      key: 'unidad',
    },
    {
      titulo: 'Descuento',
      key: 'descuento',
      formatoNumero: true,
    },
    {
      titulo: 'Precio',
      key: 'precio',
      formatoNumero: true,
    },
    {
      titulo: 'Total',
      key: 'total',
      formatoNumero: true,
    },
  ];
  detalleFacturas: any;

  constructor(private dbServ: DBservice, private route: ActivatedRoute) {}

  ngOnInit() {
    this.fecha = moment().format('DD/MM/YYYY');
    this.idFactura = this.route.snapshot.params['id'];
    this.tipoNota = this.route.snapshot.params['tipo'];
    if (this.tipoNota === 'credito') {
      this.tituloPag = 'Nota de crédito aplicada a factura ';
    } else {
      this.tituloPag = 'Nota de débito aplicada a factura ';
    }
    this.necesarioStart();
  }
  async necesarioStart() {
    await this.getFactura();
    this.factura_aplicada = this.factura.numero_comprobante;
  }

  async getFactura() {
    try {
      this.factura = await this.dbServ.getFacturaById(this.idFactura).toPromise();
      const temp = [];
      for (let i = 0; i < this.factura.detalle_facturas.length; i++) {
        const detalle = this.factura.detalle_facturas[i];
        detalle['select'] = false;
        temp.push(detalle);
      }
      this.detalleFacturas = temp;
    } catch (error) {
      console.log(error);
      this.dbServ.toastError('Error mostrando factura elegida', 'ERROR');
    }
  }

  formatoNumero(num) {
    return GLOBAL.formatearNumero(GLOBAL.redondearAdos(num));
  }
  formatoNumeroFactura(num) {
    return _.padStart(num, 8, '0');
  }
  formatoFecha(fecha) {
    return moment(fecha).format('DD/MM/YYYY');
  }
}
