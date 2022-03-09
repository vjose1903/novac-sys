import { GLOBAL } from './GLOBAL';
import * as moment from '../javascript/moment';
import { ModalClass } from '../../admin/components/new_modal/modal-class';
import { SingletonService } from '../services/singleton.service';

type lista_sub = 'decisionModal' | 'objDevuelto' | 'articuloPorCodigo' | 'pressEsc' | 'refreshFacturas' | 'sacarFacturas' | 'noFiltro';

interface mixinInit {
  component?: String;
  _lista_subs?: Array<lista_sub>;
}

interface fechaFactura {
  FechaFactura?: string;
  FechaFacturaMostrar?: string;
}

export class MixinClass extends ModalClass {
  constructor() {
    super();
  }
  fun = SingletonService.fun;
  layServ = SingletonService.layServ;
  arg_mixin;

  _init_mixin(arg?: mixinInit) {
    this.arg_mixin = arg;
    const lista_sub = this.arg_mixin ? (this.arg_mixin._lista_subs ? this.arg_mixin._lista_subs : []) : [];

    this._init_layout(arg.component);

    if (lista_sub) {
      this._init_modal(arg, this.layServ);
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
    obj['FechaFacturaMostrar'] = this.fun.my_dateFormater(obj['FechaFactura']) + ' - ' + this.fun.my_houreFormater(obj['FechaFactura']);
    return obj;
  }
  // =========================================================================================================
  my_timeDateFormater(str) {
    return `${this.fun.my_dateFormater(str)} - ${this.my_houreFormater(str)}`;
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
    if (element) element.click();
  }
  // =========================================================================================================
  enfocarInput(arg) {
    const element = document.getElementById(arg) as HTMLElement;
    if (element) element.focus();
  }
  // =========================================================================================================
  desEnfocarInput(arg) {
    const element = document.getElementById(arg) as HTMLElement;
    if (element) element.blur();
  }

  // =========================================================================================================
  selectContenido(arg) {
    const element = document.getElementById(arg) as any;
    if (element) element.select();
  }
  // =========================================================================================================
  formatoNumero(num) {
    return this.fun.formatearNumero(this.fun.redondearAdos(num)) + '  ';
  }
  // 301,755.67

  // =========================================================================================================
  my_capitalize(str) {
    const ultimoCaracter = str.length + 1;
    return str.substr(0, 1).toUpperCase() + str.substr(1, ultimoCaracter).toLowerCase();
  }

  // =========================================================================================================
  logBlue(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #5580da', body !== undefined ? this.fun.duplicarJson(body) : '');
  }

  logYellow(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #dada55', body !== undefined ? this.fun.duplicarJson(body) : '');
  }

  logRed(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #da555f', body !== undefined ? this.fun.duplicarJson(body) : '');
  }

  logGreen(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #55da56', body !== undefined ? this.fun.duplicarJson(body) : '');
  }
}

// export interface MixinClass extends ModalClass, modalClass, LayoutClass {}

// applyMixins(MixinClass, [ModalClass, modalClass, LayoutClass]);
