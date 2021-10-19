import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { LoaderService } from '../../loader/loader.service';
import { DBservice } from '../../core/services/bdservice.service';
import { IpcService } from '../../core/services/ipc.service';
import { ModalService } from '../components/modal/modal.service';
import { LayoutService } from '../layout/layout.service';
import { mixinClass } from '../mixinClass';
import { PdfService } from '../../core/services/pdf/pdf.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
})
export class ReportesComponent extends mixinClass implements OnInit, OnDestroy {
  pdfSrc: any;
  fileName: any;
  tipoModal: string;
  scaleImpresion: any;

  constructor(
    public _ipc: IpcService,
    public mServ: ModalService,
    private dbServ: DBservice,
    public layServ: LayoutService,
    public loadServ: LoaderService,
    public pdfServ: PdfService,
  ) {
    super(mServ, _ipc, layServ);
  }

  appDir;
  titulo_moda_reporte;

  ngOnInit() {
    this._init_mixin({ component: 'reportes', _lista_subs: ['decisionModal', 'objDevuelto', 'printBase64Res'] });
  }

  initCambioMenu(arg) {
    if (arg.bool) {
      this.layServ.nextDecisionCambioMenu(arg);
    }
  }

  printBase64Res(res) {
    if (res.status === 'si') {
      this.dbServ.toastSuccess('Reporte generado correctamente!!', 'CORRECTO', true);
    } else {
      this.dbServ.toastError(res.msg, 'ERROR', true);
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
      const params = `fecha=${this.my_dateFormater(data.fecha, false)}`;

      const res = await this.dbServ.createCuadreCaja(params).toPromise();

      const obj = {
        data: res.body,
        type: 'cuadre_caja',
      };
      this.generarPdf(obj);
    } catch (error) {
      console.error(error);
      this.dbServ.toastError(error.error.msg, 'ERROR', true);
    }
  }

  resetVariables() {
    this.pdfSrc = undefined;
    this.fileName = undefined;
    this.tipoModal = undefined;
  }

  async makePdf(data) {
    let res = {} as any;
    console.log('SELECCION MODAL ', this.seleccionModal);
    try {
      let tipo = '';
      let params = '';
      let continuar = true;
      let msg_error = '';

      if (this.tipoModal === 'cuadre') {
        this.makeCuadre(data);
        return;
      } else if (this.tipoModal === 'ventas_diarias' || this.tipoModal === 'ventas_rango') {
        let formas_pago = '(';

        this.seleccionModal.switches.array.forEach((item) => {
          if (item.value) formas_pago += `'${item.label}',`;
        });

        formas_pago = `${formas_pago.slice(0, formas_pago.length - 1)})`;

        params = `tipo=${data.tipo}&condicion=${data.condicion}&formas_pago=${formas_pago}&desde=${this.my_dateFormater(data.desde, false)}&hasta=${this.my_dateFormater(
          data.hasta,
          false,
        )}`;

        if (_.every(this.seleccionModal.switches.array, (item) => item.value === false)) {
          msg_error = 'Debe seleccionar almenos un metodo de pago.';
          continuar = false;
        }

        tipo = 'ventas';
        //
      } else if (this.tipoModal === 'cuentas_cobrar_cliente' || this.tipoModal === 'cuentas_cobrar_ant_saldo') {
        params = `tipo=${data.tipo_ ? data.tipo_ : data.tipo}&cliente_id=${data.id ? data.id : 1}`;
        tipo = 'cuentas_cobrar';
        //
      } else if (this.tipoModal === 'recibos') {
        params = `desde=${this.my_dateFormater(data.desde, false)}&hasta=${this.my_dateFormater(data.hasta, false)}&tipo_recibo=${data.tipo}&order=ASC`;
        tipo = 'recibos';
        //
      } else if (this.tipoModal === 'ventas_productos') {
        params =
          data.tipo === '1'
            ? `desde=${this.my_dateFormater(data.fecha, false)}`
            : (params = `desde=${this.my_dateFormater(data.desde, false)}&hasta=${this.my_dateFormater(data.hasta, false)}`);
        tipo = 'ventas_productos';
        //
      } else if (this.tipoModal === 'suplidor_prod') {
        params = `articulo_id=${data.articulo_id}&desde=${this.my_dateFormater(data.desde, false)}&hasta=${this.my_dateFormater(data.hasta, false)}`;
        tipo = 'suplidor_prod';
        //
      } else if (this.tipoModal === 'inventario') {
        params = ``;
        tipo = 'inventario';
        //
      }

      if (continuar) {
        res = await this.dbServ.makeReportes(tipo, params).toPromise();
        // aqui poner el loader
        this.loadServ.isLoading.next(true);
        const obj = {
          data: res,
          type: 'reporte',
        };

        this.generarPdf(obj);
      } else {
        this.fun.toastError(msg_error, 'ERROR', true);
      }
    } catch (error) {
      this.dbServ.toastError('Error realizando reporte.', 'ERROR', true);
    }
  }

  generarPdf(obj) {
    this.pdfServ.generatePdf(obj).then((res) => {
      this.scaleImpresion = res['scale'] ? res['scale'] : 'noscale';
      if (res.status === 'si') {
        let obj;

        this.pdfSrc = res.body;
        this.fileName = res.file;

        if (res.file === 'cuadre.pdf') {
          obj = {
            pdfSrc: res.body,
            titulo: 'Cuadre de caja',
            height: '25rem',
            reimprimir: res.reimprimir,
            fileName: res.file.split('.')[0],
          };
        } else if (res.file === 'reporte.pdf') {
          obj = {
            pdfSrc: res.body,
            titulo: this.titulo_moda_reporte,
            height: '83vh',
            reimprimir: res.reimprimir,
            fileName: res.file.split('.')[0],
          };
        }

        this.abrirVisorPdf(obj);
      } else {
        this.loadServ.isLoading.next(false);
        this.dbServ.toastError(res.msg, 'ERROR', true);
      }
    });
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

    console.log('obj ', obj);

    if (abrirModal) this.abrirModal(tipo_modal, obj, tipo);
  }

  abrirVisorPdf(obj) {
    this.abrirModal('visor_pdf', obj);
    this.loadServ.isLoading.next(false);
  }

  decisionModal(decision) {
    if (decision) {
      if (this.tipoModal === 'visor_pdf') {
        const obj = {
          base64: this.seleccionModal.pdfSrc,
          filename: `${this.seleccionModal.fileName}.pdf`,
          type: this.fileName === 'cuadre.pdf' ? 'cuadre' : 'reporte',
          scale: this.scaleImpresion,
        };

        this._ipc.send('printBase64', obj);
      } else if (this.tipoModal === 'cuadre') {
        this.makeCuadre();
      }
    }
  }
}
