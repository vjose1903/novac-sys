import { Component, OnInit, Input, ViewChild } from '@angular/core';

import * as _ from 'lodash';
import * as moment from 'moment';
import { GLOBAL } from '../../../core/services/GLOBAL';
import { DBservice } from '../../../core/services/bdservice.service';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { TablasComponent } from '../../../components/tablas/tablas.component';

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

  info = [];
  detalleFacturas: any;
  detalleNota = [];
  @ViewChild(TablasComponent, { static: false }) tablas: TablasComponent;
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
    await this.formarTitulosTabla();
  }
  formarTitulosTabla() {
    this.info = [
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
        titulo: this.tipoNota === 'credito' ? 'Devolver' : 'Aumentar',
        key: 'cant_nota',
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
        titulo: 'Cantidad',
        key: 'cantidad',
        formatoNumero: true,
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
  }

  async getFactura() {
    try {
      this.factura = await this.dbServ.getFacturaById(this.idFactura).toPromise();
      const temp = [];
      for (let i = 0; i < this.factura.detalle_facturas.length; i++) {
        const detalle = this.factura.detalle_facturas[i];
        detalle['select'] = false;
        detalle['cant'] = detalle.cantidad;
        detalle['cant_nota'] = 0;
        if (this.tipoNota === 'credito') {
          detalle['min_'] = 0;
          detalle['max_'] = detalle.cantidad;
        } else {
          detalle['min_'] = detalle.cantidad;
          detalle['max_'] = null;
        }
        temp.push(detalle);
      }
      this.detalleFacturas = temp;
    } catch (error) {
      console.log(error);
      this.dbServ.toastError('Error mostrando factura elegida', 'ERROR');
    }
  }

  getIndexNota(id_) {
    return _.findIndex(this.detalleNota, { id: id_ });
  }
  async sumarTotal() {
    let total = 0;
    for (let i = 0; i < this.detalleNota.length; i++) {
      const detalle = this.detalleNota[i];
      const cantidad = detalle.cant_nota;

      if (this.tipoNota === 'credito') {
        total += cantidad * detalle.precio * -1;
      } else {
        total += cantidad * detalle.precio;
      }

      console.log('>>>> ', total);
    }
    this.TOTAL = total;
  }

  async getInfoChange(info) {
    const entidad = info.body[info.index];
    entidad.cant_nota = parseFloat(entidad.cant_nota);
    if (info.cambio === 'cant_nota') {
      if (this.tipoNota === 'credito') {
        console.log(`${entidad.cant_nota} > ${entidad.cant} = ${entidad.cant_nota > entidad.cant}`);

        if (entidad.cant_nota > entidad.cant) {
          this.dbServ.toastError('Nota de crédito no puede ser mayor a la factura original', 'ERROR');
          this.tablas.enfocarInput('inputNu-' + info.index);
          setTimeout(() => {
            this.tablas.resetInput('cant', 'cant_nota', info.index, false);
          }, 5);
        } else if (isNaN(entidad.cant_nota)) {
          this.tablas.resetInput('especificar', 'cant_nota', info.index, false, 0);
          this.sumarTotal();
        } else {
          this.sumarTotal();
        }
      } else {
        console.log(`${entidad.cant_nota} < ${entidad.cant} = ${entidad.cant_nota < entidad.cant}`);
        if (entidad.cant_nota < entidad.cant) {
          this.dbServ.toastError('Nota de débito no puede ser menor a la factura original', 'ERROR');
          this.tablas.enfocarInput('inputNu-' + info.index);
          setTimeout(() => {
            this.tablas.resetInput('especificar', 'cant_nota', info.index, false, 0);
          }, 5);
        } else {
          this.sumarTotal();
        }
      }
    }
    if (info.cambio === 'select') {
      if (!info.value) {
        this.detalleFacturas[info.index].select = false;
        this.tablas.resetInput('especificar', 'cant_nota', info.index, false, 0);

        const i = this.detalleNota.indexOf(info.body[info.index]);
        _.pullAt(this.detalleNota, i);

        this.sumarTotal();
      } else {
        this.detalleFacturas[info.index].select = true;
        this.detalleNota.push(info.body[info.index]);
      }
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
