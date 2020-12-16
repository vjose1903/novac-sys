import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { logoADM, pdfBase64Prueba } from '../../../../myPdf/utils/files';
import { DBservice } from '../../core/services/bdservice.service';
import { IpcService } from '../../core/services/ipc.service';
import { ModalService } from '../components/modal/modal.service';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
})
export class ReportesComponent implements OnInit, OnDestroy {
  pdfSrc: any;
  fileName: any;
  tipoModal: string;

  constructor(private _ipc: IpcService, private mServ: ModalService, private dbServ: DBservice) {}

  appDir;
  subDeci: Subscription;
  subObj: Subscription;
  titulo_moda_reporte;

  ngOnInit() {
    // this.searchAppDir();
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
            height: '55rem',
            reimprimir: res.reimprimir,
            fileName: res.file.split('.')[0],
          };
        }

        this.abrirModalReporte(obj);
      } else {
        this.dbServ.toastError(res.msg + '   ERROR: ' + res.ERROR, 'ERROR', true);
      }
              setTimeout(() => {
                this.quitarFocodeElectron();
              }, 5);
    });

    this._ipc.on('printReporteRes', async (event: Electron.IpcMessageEvent, res) => {
      console.log('res --> ', res);

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
          this.reporte(res.data);
        }
      } else if (res && res.tipo_modal !== 'buscarCliente') {
        this.reporte(res.data);
        this.mServ.ModalObj(undefined);
      }
    });
  }
  ngOnDestroy() {
    this.subDeci.unsubscribe();
    this.subObj.unsubscribe();
  }

  quitarFocodeElectron() {
    document.getElementById('foco_angular').click();
    console.log('foco angular --> ', document.getElementById('foco_angular'));
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

  async reporte(data) {
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
      }

      res = await this.dbServ.makeReportes(tipo, params).toPromise();
      const obj = {
        data: res,
        type: 'reporte',
      };
      this._ipc.send('print', obj);
    } catch (error) {
      this.dbServ.toastError('Error realizando reporte.', 'ERROR', true);
    }
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
        obj['filtrarCliente'] = ' ';
        //
      } else if (tipo === 'cuentas_cobrar_ant_saldo') {
        this.titulo_moda_reporte = 'Reporte de CxC por antiguedad de saldos';
        this.tipoModal = 'cuentas_cobrar_ant_saldo';
        abrirModal = false;
        this.reporte({ tipo_: 1 });
        this.mServ.modalTipo(undefined);
        //
      }

      obj['titulo'] = this.titulo_moda_reporte;
      obj['tipo_reporte'] = tipo;
    }

    if (abrirModal) {
      this.mServ.ModalSeleccion(obj);
      this.mServ.mostrarModal(true);
    }
  }

  abrirModalReporte(obj) {
    this.tipoModal = 'visor_pdf';
    this.mServ.modalTipo('visor_pdf');
    this.mServ.ModalSeleccion(obj);

    this.mServ.mostrarModal(true);
  }

  decisionModal(decision) {
    console.log('decision          --> ', decision);
    console.log('this.tipoModal    --> ', this.tipoModal);
    if (decision) {
      if (this.tipoModal === 'visor_pdf') {
        const obj = {
          base64: this.pdfSrc,
          filename: this.fileName,
        };
        console.log('print Reporte --> ', obj);

        this._ipc.send('printReporte', obj);
      } else if (this.tipoModal === 'cuadre') {
        this.makeCuadre();
      }
      this.mServ.mostrarModal(false);
    }
    this.resetVariables();
  }
}
