import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoaderService } from '../../loader/loader.service';
import { CuadreCajaC } from '../../core/typescript/cuadre_caja';
import { MixinClass } from '../../core/typescript/MixinClass';
import * as _ from 'lodash';
import { ReporteC } from './reporte';
import { PdfService } from '../../core/services/pdf/pdf.service';
import { KEYWORD_ELECTRON_PRINT_BASE64 } from '../../../../electron/shared-electron-angular';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
})
export class ReportesComponent extends MixinClass implements OnInit, OnDestroy {
  pdfSrc: any;
  fileName: any;
  tipoModal: string;
  scaleImpresion: any;
  reporteClass = new ReporteC();

  constructor(public loadServ: LoaderService, private pdfServ: PdfService) {
    super();
  }

  appDir;
  titulo_moda_reporte;

  ngOnInit() {
    this._init_mixin({ component: 'reportes', is_routing: true, _lista_subs: ['decisionModal', 'objDevuelto'] });
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  objDevueltoResponse(res) {
    if (res && res.tipo_modal === 'buscarCliente') {
      if (this.tipoModal === 'cuentas_cobrar_cliente') {
        res.data.tipo_ = 1;
        this.makePdf(res.data);
      }
    } else if (res && res.tipo_modal !== 'buscarCliente') this.makePdf(res.data);
  }

  ngOnDestroy() {
    this._destroy_mixin();
    if (this.subDeci) this.subDeci.unsubscribe();
    if (this.subObj) this.subObj.unsubscribe();
  }

  async makeCuadre(data?) {
    try {
      let extra = { parameters: { fecha: this.fun.my_dateFormater(data.fecha, false) } };

      new CuadreCajaC().createOne({}, extra).then((res) => {
        const obj = { data: res.data, type: 'cuadre_caja' };

        this.pdfServ.generatePdf({ oPdf: obj, imprimir: false }).then(async (res) => {
          this.parseDataToVisorPdf(res);
          this.layServ.nextCheckCuadreToday(true);
        });
      });
    } catch (error) {
      console.error(error);
      this.fun.toastError(error.error.msg, 'ERROR');
    }
  }

  resetVariables() {
    this.pdfSrc = undefined;
    this.fileName = undefined;
    this.tipoModal = undefined;
  }

  async makePdf(data) {
    let tipo = '';
    let continuar = true;
    let msg_error = '';

    const extra = { afterPath: 'custom', parameters: null };

    if (this.tipoModal === 'cuadre') {
      this.makeCuadre(data);
      return;
    } else if (this.tipoModal === 'ventas_diarias' || this.tipoModal === 'ventas_rango') {
      let formas_pago = '(';

      this.seleccionModal.switches.array.forEach((item) => {
        if (item.value) formas_pago += `'${item.label}',`;
      });

      formas_pago = `${formas_pago.slice(0, formas_pago.length - 1)})`;
      extra.parameters = {
        tipo: data.tipo,
        condicion: data.condicion,
        formas_pago: formas_pago,
        desde: this.fun.my_dateFormater(data.desde, false),
        hasta: this.fun.my_dateFormater(data.hasta, false),
      };

      if (_.every(this.seleccionModal.switches.array, (item) => item.value === false)) {
        msg_error = 'Debe seleccionar almenos un metodo de pago.';
        continuar = false;
      }

      tipo = 'ventas';
      //
    } else if (this.tipoModal === 'cuentas_cobrar_cliente' || this.tipoModal === 'cuentas_cobrar_ant_saldo') {
      extra.parameters = { tipo: data.tipo_ ? data.tipo_ : data.tipo, cliente_id: data.id ? data.id : 1 };
      tipo = 'cuentas_cobrar';
      //
    } else if (this.tipoModal === 'cuentas_con_pagos') {
      extra.parameters = { desde: this.fun.my_dateFormater(data.desde, false), hasta: this.fun.my_dateFormater(data.hasta, false), cliente_id: data.cliente_id };
      tipo = 'cuentas_con_pagos';
      //
    } else if (this.tipoModal === 'recibos') {
      extra.parameters = { desde: this.fun.my_dateFormater(data.desde, false), hasta: this.fun.my_dateFormater(data.hasta, false), tipo_recibo: data.tipo, order: 'ASC' };
      tipo = 'recibos';
      //
    } else if (this.tipoModal === 'ventas_productos') {
      if (data.tipo == '1') extra.parameters = { desde: this.fun.my_dateFormater(data.fecha, false) };
      else extra.parameters = { desde: this.fun.my_dateFormater(data.desde, false), hasta: this.fun.my_dateFormater(data.hasta, false) };

      tipo = 'ventas_productos';
      //
    } else if (this.tipoModal === 'suplidor_prod') {
      extra.parameters = { articulo_id: data.articulo_id, desde: this.fun.my_dateFormater(data.desde, false), hasta: this.fun.my_dateFormater(data.hasta, false) };
      tipo = 'suplidor_prod';
      //
    } else if (this.tipoModal === 'inventario') {
      tipo = 'inventario';
      //
    }

    extra.afterPath += `/${tipo}`;

    if (continuar) {
      this.reporteClass.getAll(extra).then((res) => {
        this.loadServ.isLoading.next(true);
        const obj = { data: res, type: 'reporte' };

        this.pdfServ
          .generatePdf({ oPdf: obj, imprimir: false })
          .then(async (res) => this.parseDataToVisorPdf(res))
          .catch(async (err) => {
            this.loadServ.isLoading.next(false);
          });
      });
    } else {
      this.fun.toastError(msg_error, 'ERROR');
    }
  }

  parseDataToVisorPdf(arg) {
    this.scaleImpresion = arg['scale'] ? arg['scale'] : 'noscale';
    if (arg.status === 'si') {
      let obj;

      this.pdfSrc = arg.body;
      this.fileName = arg.file;

      if (arg.file === 'cuadre.pdf') {
        obj = {
          pdfSrc: arg.body,
          titulo: 'Cuadre de caja',
          height: '25rem',
          reimprimir: arg.reimprimir,
          fileName: arg.file.split('.')[0],
        };
      } else if (arg.file === 'reporte.pdf') {
        obj = {
          pdfSrc: arg.body,
          titulo: this.titulo_moda_reporte,
          height: '76vh',
          reimprimir: arg.reimprimir,
          fileName: arg.file.split('.')[0],
        };
      }

      this.abrirVisorPdf(obj);
    } else {
      this.loadServ.isLoading.next(false);
      this.fun.toastError(arg.msg, 'ERROR');
    }
  }

  formarObjModal(tipo) {
    const obj = {};
    let tipo_modal = 'reportes';
    this.tipoModal = tipo;
    let abrirModal = true;

    if (tipo === 'cuadre') this.titulo_moda_reporte = 'Reporte de cuadre de caja';
    //
    else if (tipo === 'ventas_diarias') this.titulo_moda_reporte = 'Reporte de ventas diarias';
    //
    else if (tipo === 'ventas_rango') this.titulo_moda_reporte = 'Reporte de ventas por fechas';
    //
    else if (tipo === 'cuentas_con_pagos') this.titulo_moda_reporte = 'Reporte de facturas a crédito con sus pagos';
    //
    else if (tipo === 'cuentas_cobrar_cliente') {
      this.titulo_moda_reporte = 'Reporte de CxC por cliente';
      tipo_modal = 'buscarCliente';

      obj['data'] = [];
      obj['filtrarCliente'] = null;
      //
    } else if (tipo === 'cuentas_cobrar_ant_saldo') this.titulo_moda_reporte = 'Reporte de CxC por antiguedad de saldos';
    //
    else if (tipo === 'recibos') this.titulo_moda_reporte = 'Reporte de recibos de ingreso';
    //
    else if (tipo === 'ventas_productos') this.titulo_moda_reporte = 'Reporte de productos vendidos por dia';
    //
    else if (tipo === 'suplidor_prod') this.titulo_moda_reporte = 'Reporte de suplidor por producto';
    //
    else if (tipo === 'inventario') {
      this.titulo_moda_reporte = 'Reporte de inventario';
      abrirModal = false;
      this.makePdf({ tipo_: 1 });
      //
    }

    obj['tipo'] = 'reportes';
    obj['titulo'] = this.titulo_moda_reporte;
    obj['tipo_reporte'] = tipo;

    if (tipo === 'ventas_diarias' || tipo === 'ventas_rango') {
      obj['switches'] = {
        title: 'Seleccione los metodos de pago deseados',
        array: [
          { label: 'Efectivo', value: true },
          { label: 'Tarjeta', value: true },
          { label: 'Cheque', value: true },
          { label: 'Transferencia', value: false },
        ],
      };
    }

    if (abrirModal) this.abrirModal(tipo_modal, obj, tipo);
  }

  abrirVisorPdf(obj) {
    this.abrirModal('visor_pdf', obj);
    this.loadServ.isLoading.next(false);
  }

  decisionModal(decision) {
    if (decision) {
      if (this.tipoModal === 'visor_pdf') {
        const obj = { base64: this.seleccionModal.pdfSrc, filename: `${this.seleccionModal.fileName}.pdf`, type: this.fileName === 'cuadre.pdf' ? 'cuadre' : 'reporte', scale: this.scaleImpresion };

        this.pdfServ
          .imprimirBase64(obj)
          .then((res) => {
            if (res.status === 'si') this.fun.toastSuccess('Reporte generado correctamente!!', 'CORRECTO');
            else this.fun.toastError(res.msg, 'ERROR');
          })
          .catch((err) => this.fun.toastError(err.msg, 'ERROR'));
        //
      } else if (this.tipoModal === 'cuadre') {
        this.makeCuadre();
      }
    }
  }
}
