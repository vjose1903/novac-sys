import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { IpcService } from '../../../core/services/ipc.service';
import { LayoutClass } from '../../layout/layout';
import { LayoutService } from '../../layout/layout.service';
import { ModalService } from './modal.service';
import { VM } from './interfaces';

export class modalClass extends LayoutClass {
  private static a_quien_responder: string;
  private quien_me_llamo = '';
  pdfSrc: any;
  fileName: any;
  titulo_moda_reporte: any;
  seleccionModal;
  tipoModal: string;
  metodos = {};

  subDeci: Subscription;
  subArticuloFiltro: Subscription;
  subObj: Subscription;
  subEsc: Subscription;
  subInde: Subscription;
  subRefresh: Subscription;
  subSacar: Subscription;

  _lista = [];

  constructor(public mServ: ModalService, public _ipc: IpcService, public layServ?: LayoutService) {
    super(layServ);
  }

  _init_modal(arg) {
    this.quien_me_llamo = arg.component;

    this.metodos[this.quien_me_llamo] = this;

    this._lista = arg._lista_subs ? arg._lista_subs : [];

    if (this._lista.includes('printBase64Res')) {
      this._ipc.on('printBase64Res', async (event: any, res) => this.run_subscribe('printBase64Res', res));
    }

    if (this._lista.includes('decisionModal')) {
      this.subDeci = this.mServ.DECISIONMODAL.subscribe((res) => this.run_subscribe('DECISIONMODAL', res));
    }

    if (this._lista.includes('objDevuelto')) {
      this.subObj = this.mServ.OBJDEVUELTO.subscribe(async (res) => {
        this.run_subscribe('OBJDEVUELTO', res);
      });
    }

    if (this._lista.includes('articuloPorCodigo')) {
      this.subArticuloFiltro = this.mServ.ARTICULOFILTRADOPORCODIGO.subscribe((res) => this.run_subscribe('ARTICULOFILTRADOPORCODIGO', res));
    }

    if (this._lista.includes('pressEsc')) {
      this.subEsc = this.mServ.PRESSESC.subscribe((res) => this.run_subscribe('PRESSESC', res));
    }

    if (this._lista.includes('indexToFocus')) {
      this.subInde = this.mServ.INDEXTOFOCUS.subscribe((res) => this.run_subscribe('PRESSESC', res));
    }

    if (this._lista.includes('refreshFacturas')) {
      this.subRefresh = this.layServ.REFRESHFACTURAS.subscribe((res) => this.run_subscribe('REFRESHFACTURAS', res));
    }

    if (this._lista.includes('sacarFacturas')) {
      this.subRefresh = this.layServ.SACARFACTURA.subscribe((res) => this.run_subscribe('SACARFACTURA', res));
    }
  }

  run_subscribe(observable, res) {
    const _this = this.metodos[modalClass.a_quien_responder];

    if (_this) {
      switch (observable) {
        case 'printBase64Res':
          _this.ipcBase64Resonse(res);

          _this.reiniciarVariables([VM._7]);
          setTimeout(() => this.quitarFocodeElectron(), 25);
          break;

        case 'DECISIONMODAL':
          if (res !== undefined) {
            _this.decisionModal(res);

            _this.reiniciarVariables([VM._4, VM._5, VM._9, VM._7]);
          }
          break;

        case 'OBJDEVUELTO':
          _this.objDevueltoResponse(res);
          if (res !== undefined) _this.reiniciarVariables([VM._8, VM._7]);

          break;
        case 'ARTICULOFILTRADOPORCODIGO':
          _this.articuloFiltroResponse(res);
          if (res !== undefined) _this.reiniciarVariables([VM._7]);
          break;

        case 'PRESSESC':
          _this.pressEscResponse(res);
          break;

        case 'INDEXTOFOCUS':
          _this.indexToFocusResponse(res);
          if (res !== undefined) _this.reiniciarVariables([VM._7]);
          break;

        case 'REFRESHFACTURAS':
          if (res) _this.refreshResponse(res);
          break;

        case 'SACARFACTURA':
          if (res) _this.sacarResponse(res);
          break;
      }
    }
  }

  reiniciarVariables(list: Array<VM>) {
    const de_quien_soy = this.quien_me_llamo;
    if (list.includes(VM._1)) this.pdfSrc = undefined; /* pdfSrc */
    if (list.includes(VM._2)) this.fileName = undefined; /* fileName */
    if (list.includes(VM._3)) this.titulo_moda_reporte = undefined; /* titulo_moda_reporte */
    if (list.includes(VM._4)) this.seleccionModal = undefined; /* seleccionModal */
    if (list.includes(VM._5)) this.tipoModal = undefined; /* tipoModal */
    if (list.includes(VM._6)) this.quien_me_llamo = 'undefined'; /* quien_me_llamo */
    if (list.includes(VM._7)) this.mServ.mostrarModal(undefined); /* subMotrar */
    if (list.includes(VM._8)) this.mServ.ModalObj(undefined); /* subObj */
    if (list.includes(VM._9)) this.mServ.ModalDecision(undefined); /* subDeci */
    if (list.includes(VM._10)) if (de_quien_soy && this.metodos[de_quien_soy]) delete this.metodos[de_quien_soy]; /* metodos */
  }

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
    if (this.quien_me_llamo) this.metodos[this.quien_me_llamo].reiniciarVariables([VM._10]);

    if (this._lista.includes('printBase64Res') && this._ipc) this._ipc.removeListener('printBase64Res');

    if (this._lista.includes('decisionModal') && this.subDeci) this.subDeci.unsubscribe();

    if (this._lista.includes('objDevuelto') && this.subObj) this.subObj.unsubscribe();

    if (this._lista.includes('articuloPorCodigo') && this.subArticuloFiltro) this.subArticuloFiltro.unsubscribe();

    if (this._lista.includes('pressEsc') && this.subEsc) this.subEsc.unsubscribe();

    if (this._lista.includes('indexToFocus') && this.subInde) this.subInde.unsubscribe();

    if (this._lista.includes('refreshFacturas') && this.subRefresh) this.subRefresh.unsubscribe();

    if (this._lista.includes('sacarFacturas') && this.subSacar) this.subSacar.unsubscribe();

    if (this._lista.includes('')) {
    }
  }

  public static set aquienResponder(quien_responde) {
    modalClass.a_quien_responder = quien_responde;
  }

  abrirModal(tipo, seleccion, tipo_modal?, callback = (arg) => {}) {
    modalClass.a_quien_responder = this.quien_me_llamo;

    this.tipoModal = tipo_modal ? tipo_modal : tipo;
    this.seleccionModal = seleccion;
    this.mServ.modalTipo(tipo);
    this.mServ.ModalSeleccion(seleccion);
    this.mServ.mostrarModal(true);

    callback(true);
  }
}
