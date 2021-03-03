import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { LoaderService } from '../../loader/loader.service';
import { DBservice } from '../../core/services/bdservice.service';
import { IpcService } from '../../core/services/ipc.service';
import { ModalService } from '../components/modal/modal.service';
import { LayoutService } from '../layout/layout.service';
import { mixinClass } from '../mixinClass';
import { PdfService } from '../../core/services/pdf/pdf.service';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
})
export class ReportesComponent extends mixinClass implements OnInit, OnDestroy {
  pdfSrc: any;
  fileName: any;
  tipoModal: string;

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
  subDeci: Subscription;
  subObj: Subscription;
  titulo_moda_reporte;

  ngOnInit() {
    this._init_mixin();
    this._ipc.on('printRes', async (event: Electron.IpcMessageEvent, res) => {
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

        console.log(res);

        this.abrirVisorPdf(obj);
      } else {
        this.dbServ.toastError(res.msg + '   ERROR: ' + res.ERROR, 'ERROR', true);
      }
      setTimeout(() => {
        this.quitarFocodeElectron();
      }, 5);
    });

    this._ipc.on('printBase64Res', async (event: Electron.IpcMessageEvent, res) => {
      if (res.status === 'si') {
        this.dbServ.toastSuccess('Reporte generado correctamente!!', 'CORRECTO', true);
      } else {
        this.dbServ.toastError(res.msg + '   ERROR: ' + res.ERROR, 'ERROR', true);
      }
      setTimeout(() => {
        this.quitarFocodeElectron();
      }, 5);
    });

    this.subDeci = this.mServ.DECISIONMODAL.subscribe((res) => {
      if (res !== undefined) {
        this.decisionModal(res);
        this.mServ.ModalDecision(undefined);
      }
    });

    this.subObj = this.mServ.OBJDEVUELTO.subscribe((res) => {
      if (res && res.tipo_modal === 'buscarCliente') {
        if (this.tipoModal === 'cuentas_cobrar_cliente') {
          res.data.tipo_ = 2;
          this.makePdf(res.data);
        }
      } else if (res && res.tipo_modal !== 'buscarCliente') {
        this.makePdf(res.data);
        this.mServ.ModalObj(undefined);
      }
    });
  }

  initCambioMenu(arg) {
    if (arg.bool) {
      this.layServ.nextDecisionCambioMenu(arg);
    }
  }

  ngOnDestroy() {
    this._destroy_mixin();
    if (this.subDeci) this.subDeci.unsubscribe();
    if (this.subObj) this.subObj.unsubscribe();
    if (this._ipc) this._ipc.removeListener('printRes');
    if (this._ipc) this._ipc.removeListener('printBase64Res');
  }

  async makeCuadre() {
    try {
      const res = await this.dbServ.createCuadreCaja().toPromise();

      const obj = {
        data: res.body,
        type: 'cuadre_caja',
      };

      this._ipc.send('print', obj);
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

    try {
      let tipo = '';
      let params = '';
      if (this.tipoModal === 'ventas_diarias' || this.tipoModal === 'ventas_rango') {
        params = `tipo=${data.tipo}&condicion=${data.condicion}&desde=${data.desde}&hasta=${data.hasta}`;
        tipo = 'ventas';
        //
      } else if (this.tipoModal === 'cuentas_cobrar_cliente' || this.tipoModal === 'cuentas_cobrar_ant_saldo') {
        params = `tipo=${data.tipo_}&cliente_id=${data.id ? data.id : 1}`;
        tipo = 'cuentas_cobrar';
        //
      } else if (this.tipoModal === 'recibos') {
        params = `desde=${data.desde}&hasta=${data.hasta}&tipo_recibo=${data.tipo}&order=ASC`;
        tipo = 'recibos';
        //
      } else if (this.tipoModal === 'ventas_productos') {
        params = data.tipo === '1' ? `desde=${data.fecha}` : (params = `desde=${data.desde}&hasta=${data.hasta}`);
        tipo = 'ventas_productos';
        //
      } else if (this.tipoModal === 'suplidor_prod') {
        params = `articulo_id=${data.articulo_id}&desde=${data.desde}&hasta=${data.hasta}`;
        tipo = 'suplidor_prod';
        //
      } else if (this.tipoModal === 'inventario') {
        params = ``;
        tipo = 'inventario';
        //
      }

      res = await this.dbServ.makeReportes(tipo, params).toPromise();
      // aqui poner el loader
      this.loadServ.isLoading.next(true);
      const obj = {
        data: res,
        type: 'reporte',
      };

      this.generarPdf(obj);

      // this._ipc.send('print', obj);
    } catch (error) {
      this.dbServ.toastError('Error realizando reporte.', 'ERROR', true);
    }
  }

  generarPdf(obj) {
    this.pdfServ.generatePdf(obj, (res) => {
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
        this.dbServ.toastError(res.msg + '   ERROR: ' + res.ERROR, 'ERROR', true);
      }
    });
  }

  abrirModal(tipo) {
    const obj = {};
    this.tipoModal = tipo;
    let abrirModal = true;

    if (tipo === 'cuadre') {
      obj['texto_modal'] = 'Seguro de que desea realizar el cuadre de caja.';
      this.mServ.modalTipo('dinamico_texto');
      //
    } else {
      this.mServ.modalTipo('reportes');
      if (tipo === 'ventas_diarias') {
        this.titulo_moda_reporte = 'Reporte de ventas diarias';
        //
      } else if (tipo === 'ventas_rango') {
        this.titulo_moda_reporte = 'Reporte de ventas por fechas';
        //
      } else if (tipo === 'cuentas_cobrar_cliente') {
        this.titulo_moda_reporte = 'Reporte de CxC por cliente';
        this.tipoModal = 'cuentas_cobrar_cliente';
        this.mServ.modalTipo('buscarCliente');
        obj['data'] = [];
        obj['filtrarCliente'] = '';
        //
      } else if (tipo === 'cuentas_cobrar_ant_saldo') {
        this.titulo_moda_reporte = 'Reporte de CxC por antiguedad de saldos';
        this.tipoModal = 'cuentas_cobrar_ant_saldo';
        abrirModal = false;
        this.makePdf({ tipo_: 1 });
        this.mServ.modalTipo(undefined);
        //
      } else if (tipo === 'recibos') {
        this.titulo_moda_reporte = 'Reporte de recibos de ingreso';
        //
      } else if (tipo === 'ventas_productos') {
        this.titulo_moda_reporte = 'Reporte de productos vendidos por dia';
        //
      } else if (tipo === 'suplidor_prod') {
        this.titulo_moda_reporte = 'Reporte de suplidor por producto';
        //
      } else if (tipo === 'inventario') {
        this.titulo_moda_reporte = 'Reporte de inventario';
        abrirModal = false;
        this.makePdf({ tipo_: 1 });
        //
      }

      obj['tipo'] = 'reportes';
      obj['titulo'] = this.titulo_moda_reporte;
      obj['tipo_reporte'] = tipo;
    }

    if (abrirModal) {
      this.mServ.ModalSeleccion(obj);
      this.mServ.mostrarModal(true);
    }
  }

  abrirVisorPdf(obj) {
    this.tipoModal = 'visor_pdf';
    this.mServ.modalTipo('visor_pdf');
    this.mServ.ModalSeleccion(obj);
    this.loadServ.isLoading.next(false);
    this.mServ.mostrarModal(true);
  }

  decisionModal(decision) {
    if (decision) {
      if (this.tipoModal === 'visor_pdf') {
        const obj = {
          base64: this.pdfSrc,
          filename: this.fileName,
          type: this.fileName === 'cuadre.pdf' ? 'cuadre' : 'reporte',
        };

        this._ipc.send('printBase64', obj);
      } else if (this.tipoModal === 'cuadre') {
        this.makeCuadre();
      }
    }

    setTimeout(() => {
      this.mServ.mostrarModal(false);
      this.resetVariables();
    }, 5);
  }
}
