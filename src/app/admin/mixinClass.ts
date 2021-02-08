import { GLOBAL } from '../core/services/GLOBAL';
import { IpcService } from '../core/services/ipc.service';
import { modalClass } from './components/modal/modal';
import { ModalService } from './components/modal/modal.service';
import { LayoutService } from './layout/layout.service';

interface mixinInit {
  _lista_subs: Array<string>;
}

export class mixinClass extends modalClass {
  constructor(public mServ: ModalService, public _ipc: IpcService, public layServ: LayoutService) {
    super(mServ, _ipc, layServ);
  }

  argumentos_mixin;

  _init_mixin(arg?: mixinInit) {
    this.argumentos_mixin = arg;
    const lista_sub = this.argumentos_mixin ? (this.argumentos_mixin._lista_subs ? this.argumentos_mixin._lista_subs : []) : [];

    this._init_layout();

    if (lista_sub) {
      this._init_modal(lista_sub);
    }
  }

  _destroy_mixin() {
    this._destroy_layout();

    const lista_sub = this.argumentos_mixin ? (this.argumentos_mixin._lista_subs ? this.argumentos_mixin._lista_subs : []) : [];
    if (lista_sub) {
      this._destroy_modal();
    }
  }

  formatoNumero(num) {
    return GLOBAL.formatearNumero(GLOBAL.redondearAdos(num)) + '  ';
  }

  my_capitalize(str) {
    const ultimoCaracter = str.length + 1;
    return str.substr(0, 1).toUpperCase() + str.substr(1, ultimoCaracter).toLowerCase();
  }

  logBlue(text: any) {
    console.log(`%c ${text}`, 'background: #00000000; color: #5580da');
  }

  logYellow(text: any) {
    console.log(`%c ${text}`, 'background: #00000000; color: #dada55');
  }

  logRed(text: any) {
    console.log(`%c ${text}`, 'background: #00000000; color: #da555f');
  }

  logGreen(text: any) {
    console.log(`%c ${text}`, 'background: #00000000; color: #55da56');
  }
}
