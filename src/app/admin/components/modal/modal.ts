import { Subscription } from 'rxjs';
import { GLOBAL } from '../../../core/services/GLOBAL';

import { IpcService } from '../../../core/services/ipc.service';
import { LayoutClass } from '../../layout/layout';
import { LayoutService } from '../../layout/layout.service';
import { ModalService } from './modal.service';

export class modalClass extends LayoutClass {
  pdfSrc: any;
  fileName: any;
  titulo_moda_reporte: any;
  seleccionModal;

  subDeci: Subscription;
  subObj: Subscription;
  subArticuloFiltro: Subscription;
  subEsc: Subscription;
  subInde: Subscription;
  subRefresh: Subscription;
  subSacar: Subscription;
  tipoModal: string;

  _lista = [];
  copySeleccion: any;

  constructor(public mServ: ModalService, public _ipc: IpcService, public layServ?: LayoutService) {
    super(layServ);
  }

  _init_modal(lista) {
    this._lista = lista;

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
          this.seleccionModal = undefined;
          this.tipoModal = undefined;
          this.mServ.ModalDecision(undefined);
        }
      });
    }

    if (this._lista.includes('objDevuelto')) {
      this.subObj = this.mServ.OBJDEVUELTO.subscribe((res) => {
        this.objDevueltoResponse(res);
      });
    }

    if (this._lista.includes('articuloPorCodigo')) {
      this.subArticuloFiltro = this.mServ.ARTICULOFILTRADOPORCODIGO.subscribe((res) => {
        this.articuloFiltroResponse(res);
      });
    }

    if (this._lista.includes('pressEsc')) {
      this.subEsc = this.mServ.PRESSESC.subscribe((res) => {
        this.pressEscResponse(res);
      });
    }

    if (this._lista.includes('indexToFocus')) {
      this.subInde = this.mServ.INDEXTOFOCUS.subscribe((res) => {
        this.indexToFocusResponse(res);
      });
    }

    if (this._lista.includes('refreshFacturas')) {
      this.subRefresh = this.layServ.REFRESHFACTURAS.subscribe((res) => {
        if (res) {
          this.refreshResponse(res);
        }
      });
    }

    if (this._lista.includes('sacarFacturas')) {
      this.subRefresh = this.layServ.SACARFACTURA.subscribe((res) => {
        if (res) {
          this.sacarResponse(res);
        }
      });
    }
  }

  ipcPrintResponse(res) {}
  ipcBase64Resonse(res) {}

  decisionModal(res: any) {}

  articuloFiltroResponse(res) {}
  pressEscResponse(res) {}
  indexToFocusResponse(res) {}

  objDevueltoResponse(res) {}
  refreshResponse(res) {}
  sacarResponse(res) {}

  reporte(data: any) {}

  _destroy_modal() {
    if (this._lista.includes('printRes') && this._ipc) {
      this._ipc.removeListener('printRes');
    }

    if (this._lista.includes('printBase64Res') && this._ipc) {
      this._ipc.removeListener('printBase64Res');
    }

    if (this._lista.includes('decisionModal') && this.subDeci) {
      this.subDeci.unsubscribe();
    }

    if (this._lista.includes('objDevuelto') && this.subObj) {
      this.subObj.unsubscribe();
    }

    if (this._lista.includes('articuloPorCodigo') && this.subArticuloFiltro) {
      this.subArticuloFiltro.unsubscribe();
    }

    if (this._lista.includes('pressEsc') && this.subEsc) {
      this.subEsc.unsubscribe();
    }

    if (this._lista.includes('indexToFocus') && this.subInde) {
      this.subInde.unsubscribe();
    }

    if (this._lista.includes('refreshFacturas')) {
      this.subRefresh.unsubscribe();
    }

    if (this._lista.includes('sacarFacturas')) {
      this.subSacar.unsubscribe();
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
