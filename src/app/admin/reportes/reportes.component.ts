import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoaderService } from '../../loader/loader.service';
import { CuadreCajaC } from '../../core/typescript/cuadre_caja';
import { MixinClass } from '../../core/typescript/MixinClass';
import * as _ from 'lodash';
import { ReporteC } from './reporte';
import { PdfService } from '../../core/services/pdf/pdf.service';
import { PdfViewerComponent } from '../components/pdf-viewer/pdf-viewer.component';
import { BuscarClienteSuplidorComponent } from '../components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { FormReportesComponent } from '../components/formularios en modales/form-reportes/form-reportes.component';
import { fun } from '../../core/services/functions.service';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
})
export class ReportesComponent extends MixinClass implements OnInit, OnDestroy {
  pdfSrc: any;
  fileName: any;

  scaleImpresion: any;
  reporteClass = new ReporteC();

  constructor(public loadServ: LoaderService, private pdfServ: PdfService) {
    super();
  }

  appDir;
  titulo_moda_reporte;

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

        this.pdfServ.generatePdf({ oPdf: obj, imprimir: false }).then(async (res) => {
          this.parseDataToVisorPdf(res);
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
    } else if (params.modal_id === 'ventas_diarias' || params.modal_id === 'ventas_rango') {
      let formas_pago = '(';

      data.switches.array.forEach((item) => {
        if (item.value) formas_pago += `'${item.label}',`;
      });

      formas_pago = `${formas_pago.slice(0, formas_pago.length - 1)})`;
      extra.parameters = {
        tipo: data.tipo,
        condicion: data.condicion,
        formas_pago: formas_pago,
        desde: fun.my_dateFormater(data.desde, false),
        hasta: fun.my_dateFormater(data.hasta, false),
      };

      if (_.every(data.switches.array, (item) => item.value === false)) {
        msg_error = 'Debe seleccionar almenos un metodo de pago.';
        continuar = false;
      }

      tipo = 'ventas';
      //
    } else if (params.modal_id === 'cuentas_cobrar_cliente' || params.modal_id === 'cuentas_cobrar_ant_saldo') {
      extra.parameters = { tipo: data.tipo_ ? data.tipo_ : data.tipo, cliente_id: data.id ? data.id : 1 };
      tipo = 'cuentas_cobrar';
      //
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
    } else if (params.modal_id === 'inventario') {
      tipo = 'inventario';
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

        this.pdfServ
          .generatePdf({ oPdf: obj, imprimir: false })
          .then(async (res) => this.parseDataToVisorPdf(res))
          .catch(async (err) => {
            this.loadServ.isLoading.next(false);
          });
      });
    } else {
      fun.toastError(msg_error, 'ERROR');
    }
  }

  async getDataFromModal(arg: any, search: any) {
    if (arg?.modal_id === 'cuentas_cobrar_cliente') {
      arg.data.tipo_ = 1;
      this.makePdf(arg);
    } else if (arg && arg.tipo_modal !== 'buscarCliente') this.makePdf(arg);
  }

  parseDataToVisorPdf(arg) {
    this.scaleImpresion = arg['scale'] ? arg['scale'] : 'noscale';
    if (arg.status === 'si') {
      let obj;

      this.pdfSrc = arg.body;
      this.fileName = arg.file;

      if (arg.file === 'cuadre.pdf') {
        obj = { pdfSrc: arg.body, titulo: 'Cuadre de caja', height: '25rem', reimprimir: arg.reimprimir, fileName: arg.file.split('.')[0] };
      } else if (arg.file === 'reporte.pdf') {
        obj = { pdfSrc: arg.body, titulo: this.titulo_moda_reporte, height: '76vh', reimprimir: arg.reimprimir, fileName: arg.file.split('.')[0] };
      }

      this.abrirVisorPdf(obj);
    } else {
      this.loadServ.isLoading.next(false);
      fun.toastError(arg.msg, 'ERROR');
    }
  }

  formarObjModal(tipo) {
    const obj = {};
    let tipo_modal = 'reportes';

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
      obj['metodo'] = 'venta';
      obj['palabra_a_buscar'] = ' ';

      //
    } else if (tipo === 'cuentas_cobrar_ant_saldo') this.titulo_moda_reporte = 'Reporte de CxC por antiguedad de saldos';
    //
    else if (tipo === 'recibos') this.titulo_moda_reporte = 'Reporte de recibos de ingreso';
    //
    else if (tipo === 'ventas_productos') this.titulo_moda_reporte = 'Reporte de productos vendidos por dia';
    //
    else if (tipo === 'suplidor_prod') this.titulo_moda_reporte = 'Reporte de suplidor por producto';
    //
    else if (tipo === 'notas') this.titulo_moda_reporte = 'Reporte de notas';
    //
    else if (tipo === 'inventario') {
      this.titulo_moda_reporte = 'Reporte de inventario';
      tipo_modal = 'inventario';
      this.makePdf({ data: { tipo_: 1 }, modal_id: 'inventario' });
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

    if (tipo_modal !== 'inventario') {
      const variableData = {
        reportes: { component: FormReportesComponent, width: '510px' },
        buscarCliente: {
          component: BuscarClienteSuplidorComponent,
          width: '900px',
          height: '500px',
          botones: {
            aceptar: { show: false, disable: false },
            cancelar: { show: false, disable: false },
          },
        },
      };

      const objHandler = {
        inputs: obj,
        id: tipo,
        header: this.titulo_moda_reporte,
        botones: {
          aceptar: { show: true, disable: false },
          cancelar: { show: true, disable: false },
        },
      };
      const modal = { ...objHandler, ...variableData[tipo_modal] };

      this.handleModalForm(modal);
    }
  }

  abrirVisorPdf(obj) {
    this.handleModalForm({
      component: PdfViewerComponent,
      inputs: obj,
      id: 'revision_recibo',
      header: obj.titulo,
      width: '900px',
      height: obj.height,
      botones: {
        aceptar: { show: false, disable: false },
        cancelar: { show: false, disable: false },
        dinamico: [
          { clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, 'cancel'), label: 'Cerrar', disable: false },
          {
            clase: 'btn btn-verde',
            function: (instance) => {
              this.imprimirPDF(obj, instance);
            },
            label: 'Imprimir',
            disable: false,
          },
        ],
      },
    });
    this.loadServ.isLoading.next(false);
  }

  imprimirPDF(obj_pdf, modalInstance?) {
    const obj = { base64: obj_pdf.pdfSrc, filename: `${obj_pdf.fileName}.pdf`, type: this.fileName === 'cuadre.pdf' ? 'cuadre' : 'reporte', scale: this.scaleImpresion };

    this.pdfServ
      .imprimirBase64(obj)
      .then((res) => {
        if (res.status === 'si') {
          fun.toastSuccess('Reporte generado correctamente!!', 'CORRECTO');
          if (modalInstance) modalInstance.closeModal(modalInstance.id, 'cancel');
        } else fun.toastError(res.msg, 'ERROR');
      })
      .catch((err) => fun.toastError(err.msg, 'ERROR'));
  }
}
