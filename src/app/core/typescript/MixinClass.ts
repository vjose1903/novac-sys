import moment from '../javascript/moment';
import { Ss } from '../services/singleton.service';
import { fun } from '../services/functions.service';
import { TablaClass } from '@core/components/new_tablas/tabla-class';

interface mixinInit {
  component?: String;
  is_routing: boolean;
}

interface fechaFactura {
  FechaFactura?: string;
  FechaFacturaMostrar?: string;
}

export class MixinClass extends TablaClass {
  constructor() {
    super();
  }

  layServ = Ss.layServ;
  arg_mixin;

  _init_mixin(arg?: mixinInit) {
    this.arg_mixin = arg;
  }

  _destroy_mixin(algo?) {
    // Método vacío para compatibilidad
  }

  // =========================================================================================================
  formarFechaFactura(date): fechaFactura {
    const hora = moment(date).hour();
    const minutos = moment(date).minutes();
    const fechaTemp = moment(date).format('YYYY-MM-DD');
    const obj = {};
    obj['FechaFactura'] = fechaTemp + ' ' + (hora <= 9 ? '0' + hora : hora) + ':' + (minutos <= 9 ? '0' + minutos : minutos);
    obj['FechaFacturaMostrar'] = fun.my_dateFormater(obj['FechaFactura']) + ' - ' + fun.my_houreFormater(obj['FechaFactura']);
    return obj;
  }
  // =========================================================================================================
  my_timeDateFormater(str) {
    return `${fun.my_dateFormater(str)} - ${this.my_houreFormater(str)}`;
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
    return fun.roundNumberToDecimal(num);
  }
  // 301,755.67

  // =========================================================================================================
  my_capitalize(str) {
    const ultimoCaracter = str.length + 1;
    return str.substr(0, 1).toUpperCase() + str.substr(1, ultimoCaracter).toLowerCase();
  }

  // =========================================================================================================
  logBlue(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #5580da', body !== undefined ? fun.deepCloning(body) : '');
  }

  logYellow(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #dada55', body !== undefined ? fun.deepCloning(body) : '');
  }

  logRed(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #da555f', body !== undefined ? fun.deepCloning(body) : '');
  }

  logGreen(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #55da56', body !== undefined ? fun.deepCloning(body) : '');
  }
}
