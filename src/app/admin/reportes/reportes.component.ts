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
  constructor(private _ipc: IpcService, private mServ: ModalService, private dbServ: DBservice) {}
  appDir;
  subDeci: Subscription;
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
            height: '37rem',
            fileName: res.file.split('.')[0],
          };
        }
        this.abrirModalReporte(obj);
        setTimeout(() => {
          this.quitarFocodeElectron();
        }, 5);
      } else {
        this.dbServ.toastError(res.msg + '   ERROR: ' + res.ERROR, 'ERROR', true);
      }
    });

    this._ipc.on('printReporteRes', async (event: Electron.IpcMessageEvent, res) => {
      if (res.status === 'si') {
        this.dbServ.toastSuccess('Reporte generado correctamente!!', 'CORRECTO', true);
      } else {
        this.dbServ.toastError(res.msg + '   ERROR: ' + res.ERROR, 'ERROR', true);
      }
    });

    this.subDeci = this.mServ.DECISIONMODAL.subscribe((res) => {
      if (res !== undefined) {
        this.decisionModal(res);
        this.mServ.ModalDecision(undefined);
      }
    });
  }
  ngOnDestroy() {
    this.subDeci.unsubscribe();
  }

  quitarFocodeElectron() {
    document.getElementById('foco_angular').click();
  }

  async makeCuadre() {
    try {
      const res = await this.dbServ.createCuadreCaja().toPromise();
      const obj = {
        data: res.body,
        type: 'cuadre_caja',
      };
      this._ipc.send('print', obj);

      // setTimeout(() => {
      //   const obj = {
      //     pdfSrc: pdfBase64Prueba,
      //     titulo: 'Cuadre de caja',
      //     height: '37rem',
      //   };
      //   console.log('voy a abrir el modal');
      //   this.abrirModalReporte(obj);
      // }, 1000);
    } catch (error) {
      console.error(error);
    }
  }

  resetVariables() {
    this.pdfSrc = undefined;
    this.fileName = undefined;
  }

  abrirModalReporte(obj) {
    this.mServ.modalTipo('visor_pdf');
    this.mServ.ModalSeleccion(obj);

    this.mServ.mostrarModal(true);
  }

  decisionModal(decision) {
    if (decision) {
      const obj = {
        base64: this.pdfSrc,
        filename: this.fileName,
      };
      this._ipc.send('printReporte', obj);
    }
    this.resetVariables();
  }
}
