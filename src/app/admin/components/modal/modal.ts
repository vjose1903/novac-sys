import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DBservice } from '../../../core/services/bdservice.service';
import { myElectron } from '../../../core/services/electron';
import { IpcService } from '../../../core/services/ipc.service';
import { ModalService } from './modal.service';

export class modalClass extends myElectron {
  pdfSrc: any;
  fileName: any;
  titulo_moda_reporte: any;

  subDeci: Subscription;
  subObj: Subscription;
  tipoModal: string;

  _lista = [];
  constructor(public mServ: ModalService, public _ipc: IpcService) {
    super();
  }

  getInit(lista_) {
    this._lista = lista_;
    console.log('Inicio de clase modal');

    if (this._lista.includes('printRes')) {
      this._ipc.on('printRes', async (event: Electron.IpcMessageEvent, res) => {
        this.ipcPrintResponse(res);

        setTimeout(() => {
          this.quitarFocodeElectron();
        }, 5);
      });
    }

    if (this._lista.includes('printBase64Res')) {
      this._ipc.on('printBase64Res', async (event: Electron.IpcMessageEvent, res) => {
        this.ipcBase64Resonse(res);

        setTimeout(() => {
          this.quitarFocodeElectron();
        }, 5);
      });
    }

    if (this._lista.includes('decisionModal')) {
      this.subDeci = this.mServ.DECISIONMODAL.subscribe((res) => {
        if (res !== undefined) {
          this.decisionModal(res);
          this.mServ.ModalDecision(undefined);
        }
      });
    }

    if (this._lista.includes('objDevuelto')) {
      this.subObj = this.mServ.OBJDEVUELTO.subscribe((res) => {
        this.objDevueltoResponse(res);
      });
    }
  }

  ipcPrintResponse(res) {}
  ipcBase64Resonse(res) {}

  decisionModal(res: any) {}
  objDevueltoResponse(res) {}

  reporte(data: any) {}

  getDestroy() {
    if (this._lista.includes('printRes')) {
      this._ipc.removeListener('printRes');
    }

    if (this._lista.includes('printBase64Res')) {
      this._ipc.removeListener('printBase64Res');
    }

    if (this._lista.includes('decisionModal')) {
      this.subDeci.unsubscribe();
    }

    if (this._lista.includes('objDevuelto')) {
      this.subObj.unsubscribe();
    }

    if (this._lista.includes('')) {
    }
  }

  resetModalVariables() {
    this.tipoModal = undefined;
  }

  abrirModal(tipo_modal, tipo, seleccion) {
    this.tipoModal = tipo_modal;
    this.mServ.modalTipo(tipo);

    this.mServ.ModalSeleccion(seleccion);
    this.mServ.mostrarModal(true);
  }
}
