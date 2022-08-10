import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoaderService } from '../../loader/loader.service';
import { CuadreCajaC } from '../../core/typescript/cuadre_caja';
import { MixinClass } from '../../core/typescript/MixinClass';
import * as _ from 'lodash';
import { ReporteC } from './reporte';
import { PdfService } from '../../core/services/pdf/pdf.service';
import { fun } from '../../core/services/functions.service';
import { ClienteC } from '../registros/registro-clientes/cliente';
import { FacturaC } from '../facturacion/factura';
import { ArticuloC } from '../registros/articulos/articulo';
import { InventarioC } from '../inventario/inventario';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
})
export class ReportesComponent extends MixinClass implements OnInit, OnDestroy {
  reporteClass = new ReporteC();

  instancesClases = {
    cuadre: null,
    ventas_diarias: FacturaC,
    ventas_rango: FacturaC,
    ventas_productos: ArticuloC,
    cuentas_con_pagos: null,
    inventario: InventarioC,
    suplidor_prod: null,
    cuentas_cobrar_cliente: ClienteC,
    cuentas_cobrar_ant_saldo: ClienteC,
    recibos: null,
    notas: null,
  };

  constructor(public loadServ: LoaderService) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'reportes', is_routing: true });
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  async makeCuadre(data?) {
    try {
      let extra = { parameters: { fecha: fun.my_dateFormater(data.fecha, false) } };

      new CuadreCajaC().createOne({}, extra).then((res) => {
        const obj = { data: res.data, type: 'cuadre_caja' };

        PdfService.generatePdf({ oPdf: obj, imprimir: false }).then(async (res) => {
          res = { ...res, configureNewModal: this.configureNewModal };
          ReporteC.visualizarReporte(res);
          this.layServ.nextCheckCuadreToday(true);
        });
      });
    } catch (error) {
      console.error(error);
      fun.toastError(error.error.msg, 'ERROR');
    }
  }

  async makePdf(params) {
    const data = params.data;
    let tipo = '';
    let continuar = true;
    let msg_error = '';

    const extra = { afterPath: 'custom', parameters: null };

    if (params.modal_id === 'cuadre') {
      this.makeCuadre(data);
      return;
    } else if (params.modal_id === 'cuentas_con_pagos') {
      extra.parameters = { desde: fun.my_dateFormater(data.desde, false), hasta: fun.my_dateFormater(data.hasta, false), cliente_id: data.cliente_id };
      tipo = 'cuentas_con_pagos';
      //
    } else if (params.modal_id === 'recibos') {
      extra.parameters = { desde: fun.my_dateFormater(data.desde, false), hasta: fun.my_dateFormater(data.hasta, false), tipo_recibo: data.tipo, order: 'ASC' };
      tipo = 'recibos';
      //
    } else if (params.modal_id === 'ventas_productos') {
      if (data.tipo == '1') extra.parameters = { desde: fun.my_dateFormater(data.fecha, false) };
      else extra.parameters = { desde: fun.my_dateFormater(data.desde, false), hasta: fun.my_dateFormater(data.hasta, false) };

      tipo = 'ventas_productos';
      //
    } else if (params.modal_id === 'suplidor_prod') {
      extra.parameters = { articulo_id: data.articulo_id, desde: fun.my_dateFormater(data.desde, false), hasta: fun.my_dateFormater(data.hasta, false) };
      tipo = 'suplidor_prod';
      //
    } else if (params.modal_id === 'notas') {
      extra.parameters = { desde: fun.my_dateFormater(data.desde, false), hasta: fun.my_dateFormater(data.hasta, false), tipo_factura_id: data.tipo };
      tipo = 'notas';
      //
    }

    extra.afterPath += `/${tipo}`;

    if (continuar) {
      this.reporteClass.getAll(extra).then((res) => {
        this.loadServ.isLoading.next(true);
        const obj = { data: res, type: 'reporte' };

        PdfService.generatePdf({ oPdf: obj, imprimir: false })

          .then(async (res) => {
            res = { ...res, configureNewModal: this.configureNewModal };
            ReporteC.visualizarReporte(res);
          })
          .catch(async (err) => {
            this.loadServ.isLoading.next(false);
          });
      });
    } else {
      fun.toastError(msg_error, 'ERROR');
    }
  }

  async getDataFromModal(arg: any, search: any) {
    fun.logGreen('arg ', arg);
    if (arg?.modal_id == 'cuentas_cobrar_cliente') arg.data.tipo_ = 1;

    if (arg && arg.tipo_modal != 'buscarCliente') this.makePdf(arg);
  }

  openReporteForm(params: { tipo: string; titulo: string }) {
    const obj = {};

    obj['tipo'] = 'reportes';
    obj['titulo'] = params.titulo;
    obj['tipo_reporte'] = params.tipo;

    if (this.instancesClases[params.tipo]) {
      this.instancesClases[params.tipo.toString()].openModalFormReporte({ tipo: params.tipo, inputs: obj, configureNewModal: this.configureNewModal.bind(this) }).then((arg) => {
        console.log('arg ', arg);
      });
    } else {
      let tipo_modal = 'reportes';

      if (params.tipo === 'inventario') {
        tipo_modal = 'inventario';
        this.makePdf({ data: { tipo_: 1 }, modal_id: 'inventario' });
        //
      }

      if (tipo_modal != 'inventario') {
        ReporteC.objReporte = { inputs: obj, id: params.tipo.toString(), header: params.titulo.toString() };

        let modal = ReporteC.objReporte as any;

        this.configureNewModal(modal);
      }
    }
  }
}
