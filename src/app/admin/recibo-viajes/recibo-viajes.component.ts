import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { map } from 'rxjs/operators';
import { DBservice } from '../../core/services/bdservice.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import { obj_paginate } from '../components/tablas/tablas.service';
import { GLOBAL } from '../../core/services/GLOBAL';

@Component({
  selector: 'app-recibo-viajes',
  templateUrl: './recibo-viajes.component.html',
  styleUrls: ['./recibo-viajes.component.scss'],
})
export class ReciboViajesComponent implements OnInit, AfterViewInit {
  @ViewChild('cardTabla', { static: false }) cardTabla: ElementRef;
  viajes;
  viaje_selected = { id: -1 } as any;

  info = [
    {
      titulo: 'Fecha Fact.',
      key: 'fecha',
    },
    {
      titulo: 'Cliente',
      key: 'cliente_mostrar',
    },
    {
      titulo: 'NCF',
      key: 'numero_comprobante',
    },
    {
      titulo: 'Total facturado',
      key: 'total_factura',
      formatoNumero: true,
    },
  ];
  altoDiv: any;
  viajes_pendientes_cant = 0;
  viajes_completados_cant = 0;
  viajes_cant_porciento: any;
  viajes_cant: any;
  constructor(private dbServ: DBservice) {}

  ngOnInit() {
    this.necesarioStart();
  }

  ngAfterViewInit() {
    this.altoDiv = this.cardTabla.nativeElement.offsetHeight;
  }

  necesarioStart() {
    this.getViajes(obj_paginate);
  }

  formatoNumero(num) {
    return GLOBAL.numFormatTwoDecimals(num);
  }

  async getViajes(e) {
    try {
      const page = e.page;
      const per_page = e.per_page;
      const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;

      const res = await this.dbServ.getViajesByCompletada(palabra_a_buscar, page, per_page, true).toPromise();
      let ot = 0;
      res.data.map((fact) => {
        ot += 1;
        fact.cliente_mostrar = fact.cliente.nombre;
        fact.fecha = moment(fact.fecha_equivalente).format('DD-MM-YYYY');
        fact.total_factura = this.recalcularMonto(fact.total_factura, fact.notas);
        if (ot % 2 === 0) fact.fecha_completada = 1;
        // fact.fecha_completada = 1;
        return fact;
      });

      // this.viajes = [];
      this.viajes = res.data;
      this.viajes_cant = res.total_registros ? res.total_registros : 0;

      this.viajes_completados_cant = this.viajes.filter((v) => v.fecha_completada !== null).length;
      this.viajes_pendientes_cant = this.viajes.filter((v) => v.fecha_completada === null).length;

      console.log();

      setTimeout(() => {
        this.viajes_cant_porciento = (this.viajes_completados_cant / this.viajes_cant) * 100;
      }, 5);

      console.log('this.viajes ', this.viajes);
      console.log('this.viajes_pendientes_cant ', this.viajes_pendientes_cant);
    } catch (error) {
      if (error.error) {
        this.dbServ.toastError(error.error.msg, 'ERROR');
      } else {
        this.dbServ.toastError('Error en el servidor, contactar con el desarrollador', 'ERROR');
      }
    }
  }

  verViaje(arg) {
    this.viaje_selected = arg;
    console.log(arg);
  }

  recalcularMonto(monto_original, notas) {
    let monto = monto_original;
    for (let i = 0; i < notas.length; i++) {
      const element = notas[i];
      const totalABS = Math.abs(element.total_factura);

      if (element.tipo_factura_id === 5) {
        monto -= totalABS;
      } else if (element.tipo_factura_id === 4) {
        monto += totalABS;
      }
    }
    return monto;
  }

  accion(bool) {
    if (bool) {
    } else {
      this.viaje_selected = { id: -1 };
    }
  }
}
