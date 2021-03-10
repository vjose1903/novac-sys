import { GLOBAL } from '../core/services/GLOBAL';
import { IpcService } from '../core/services/ipc.service';
import { modalClass } from './components/modal/modal';
import { ModalService } from './components/modal/modal.service';
import { LayoutService } from './layout/layout.service';

type lista_sub = 'printBase64Res' | 'decisionModal' | 'objDevuelto' | 'articuloPorCodigo' | 'pressEsc' | 'indexToFocus' | 'refreshFacturas' | 'sacarFacturas';

interface mixinInit {
  component?: String;
  _lista_subs?: Array<lista_sub>;
}

export class mixinClass extends modalClass {
  constructor(public mServ: ModalService, public _ipc: IpcService, public layServ: LayoutService) {
    super(mServ, _ipc, layServ);
  }

  arg_mixin;

  _init_mixin(arg?: mixinInit) {
    this.arg_mixin = arg;
    const lista_sub = this.arg_mixin ? (this.arg_mixin._lista_subs ? this.arg_mixin._lista_subs : []) : [];

    this._init_layout();

    if (lista_sub) {
      this._init_modal(arg);
    }
  }

  _destroy_mixin(algo?) {
    this._destroy_layout();

    const lista_sub = this.arg_mixin ? (this.arg_mixin._lista_subs ? this.arg_mixin._lista_subs : undefined) : undefined;

    if (lista_sub) {
      this._destroy_modal();
    }
  }

  // =========================================================================================================
  my_timeDateFormater(str) {
    return `${this.my_dateFormater(str)} - ${this.my_houreFormater(str)}`;
  }
  // =========================================================================================================
  my_dateFormater(str, front = true) {
    str = str + '';
    let dateObj = new Date(str);

    let month = String(dateObj.getMonth() + 1).padStart(2, '0');
    let day = String(dateObj.getDate()).padStart(2, '0');
    let year = dateObj.getFullYear();
    if (front) {
      str = `${day}/${month}/${year}`;
    } else {
      str = `${year}-${month}-${day}`;
    }
    return str;
  }

  // =========================================================================================================
  my_houreFormater(str) {
    const dateObj = new Date(str);

    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;

    const res = `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes} ${ampm}`;
    return res;
  }

  // =========================================================================================================
  formatoNumero(num) {
    return GLOBAL.formatearNumero(GLOBAL.redondearAdos(num)) + '  ';
  }

  // =========================================================================================================
  my_capitalize(str) {
    const ultimoCaracter = str.length + 1;
    return str.substr(0, 1).toUpperCase() + str.substr(1, ultimoCaracter).toLowerCase();
  }

  // =========================================================================================================
  logBlue(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #5580da');
    if (body) {
      console.log(GLOBAL.duplicarJson(body));
    }
  }

  logYellow(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #dada55');
    if (body) {
      console.log(GLOBAL.duplicarJson(body));
    }
  }

  logRed(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #da555f');
    if (body) {
      console.log(GLOBAL.duplicarJson(body));
    }
  }

  logGreen(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #55da56');
    if (body) {
      console.log(GLOBAL.duplicarJson(body));
    }
  }
}
