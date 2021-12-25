import { GLOBAL } from '../core/services/GLOBAL';
import { modalClass } from './components/modal/modal';
import * as moment from '../../utils/javascript/moment';

type lista_sub = 'printBase64Res' | 'decisionModal' | 'objDevuelto' | 'articuloPorCodigo' | 'pressEsc' | 'refreshFacturas' | 'sacarFacturas' | 'noFiltro';

interface mixinInit {
  component?: String;
  _lista_subs?: Array<lista_sub>;
}

interface fechaFactura {
  FechaFactura?: string;
  FechaFacturaMostrar?: string;
}

export class mixinClass extends modalClass {
  constructor() {
    super();
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
  formarFechaFactura(date): fechaFactura {
    const hora = moment(date).hour();
    const minutos = moment(date).minutes();
    const fechaTemp = moment(date).format('YYYY-MM-DD');
    const obj = {};
    obj['FechaFactura'] = fechaTemp + ' ' + (hora <= 9 ? '0' + hora : hora) + ':' + (minutos <= 9 ? '0' + minutos : minutos);
    obj['FechaFacturaMostrar'] = GLOBAL.my_dateFormater(obj['FechaFactura']) + ' - ' + GLOBAL.my_houreFormater(obj['FechaFactura']);
    return obj;
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
  clickInput(arg) {
    const element = document.getElementById(arg) as HTMLElement;
    element.click();
    console.log('CLICK ', element);
  }
  // =========================================================================================================
  enfocarInput(arg) {
    const element = document.getElementById(arg) as HTMLElement;
    element.focus();
  }
  // =========================================================================================================
  desEnfocarInput(arg) {
    const element = document.getElementById(arg) as HTMLElement;
    element.blur();
  }

  // =========================================================================================================
  selectContenido(arg) {
    const element = document.getElementById(arg) as any;
    element.select();
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
    console.log(`%c ${text}`, 'background: #00000000; color: #5580da', body !== undefined ? GLOBAL.duplicarJson(body) : '');
  }

  logYellow(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #dada55', body !== undefined ? GLOBAL.duplicarJson(body) : '');
  }

  logRed(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #da555f', body !== undefined ? GLOBAL.duplicarJson(body) : '');
  }

  logGreen(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #55da56', body !== undefined ? GLOBAL.duplicarJson(body) : '');
  }
}
