import { Subscription } from 'rxjs';

import { LayoutClass } from '../../layout/layout';

import { VM } from './interfaces';
import { SingletonService } from '../../../core/services/singleton.service';

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
  subNoFiltro: Subscription;


  _lista = [];

  fun = SingletonService.fun;
  zone = SingletonService.zone;
  _ipc = SingletonService._ipc;
  mServ = SingletonService.mServ;

  constructor() {
    super();
  }

  _init_modal(arg, layServ) {
    this.quien_me_llamo = arg.component;

    this.metodos[this.quien_me_llamo] = this;

    this._lista = arg._lista_subs ? arg._lista_subs : [];

    if (this._lista.includes('decisionModal')) {
      this.subDeci = this.mServ.DECISIONMODAL.subscribe((res) => this.run_subscribe('DECISIONMODAL', res));
    }

    if (this._lista.includes('objDevuelto')) {
      this.subObj = this.mServ.OBJDEVUELTO.subscribe(async (res) => this.run_subscribe('OBJDEVUELTO', res));
    }

    if (this._lista.includes('articuloPorCodigo')) {
      this.subArticuloFiltro = this.mServ.ARTICULOFILTRADOPORCODIGO.subscribe((res) => this.run_subscribe('ARTICULOFILTRADOPORCODIGO', res));
    }

    if (this._lista.includes('pressEsc')) {
      this.subEsc = this.mServ.PRESSESC.subscribe((res) => this.run_subscribe('PRESSESC', res));
    }

    if (this._lista.includes('noFiltro')) {
      this.subNoFiltro = this.mServ.NOFILTRO.subscribe((res) => this.run_subscribe('NOFILTRO', res));
    }
  }

  run_subscribe(observable, res) {
    const _this = this.metodos[modalClass.a_quien_responder];

    if (_this) {
      switch (observable) {
        case 'DECISIONMODAL':
          if (res !== undefined) {
            _this.decisionModal(res);
            // _this.reiniciarVariables([VM._4, VM._5, VM._9, VM._7]);
            _this.reiniciarVariables([VM._4, VM._5, VM._7]);
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

        case 'NOFILTRO':
          _this.noFiltroResponse(res);
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

  decisionModal(res: any) {}
  articuloFiltroResponse(res) {}
  pressEscResponse(res) {}
  noFiltroResponse(res) {}
  objDevueltoResponse(res) {}
  refreshResponse(res) {}
  reporte(data: any) {}

  _destroy_modal() {
    if (this.quien_me_llamo) this.metodos[this.quien_me_llamo].reiniciarVariables([VM._10]);

    if (this._lista.includes('decisionModal') && this.subDeci) this.subDeci.unsubscribe();

    if (this._lista.includes('objDevuelto') && this.subObj) this.subObj.unsubscribe();

    if (this._lista.includes('articuloPorCodigo') && this.subArticuloFiltro) this.subArticuloFiltro.unsubscribe();

    if (this._lista.includes('pressEsc') && this.subEsc) this.subEsc.unsubscribe();

    if (this._lista.includes('noFiltro') && this.subNoFiltro) this.subNoFiltro.unsubscribe();

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
