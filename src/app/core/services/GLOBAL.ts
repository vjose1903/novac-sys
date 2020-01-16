import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import * as _ from 'lodash';

export class GLOBAL {
  static formatearNumero(nStr) {
    if (nStr !== undefined) {
      nStr += '';
      const x = nStr.split('.');
      let x1 = x[0];
      const x2 = x.length > 1 ? '.' + x[1] : '';
      const rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
      }
      return x1 + x2;
    }
  }
  static duplicarJson(json) {
    return JSON.parse(JSON.stringify(json));
  }
  static redondearAdos(num) {
    const string = num + '';
    const splitStr = _.split(string, '.');
    const enteros = splitStr[0];
    let tempdecimales = splitStr[1];
    if (splitStr.length === 1) {
      tempdecimales = '00';
    }

    const decimales = tempdecimales.substring(0, 2);
    const Arreglo = [enteros, decimales];
    const numStr = _.join(Arreglo, '.');
    return parseFloat(numStr).toFixed(2);
    // return (Math.round(num * 100) / 100).toFixed(2);
  }
  static desformatear(sTnum) {
    let temp = 0;

    if (sTnum !== null) {
      if (sTnum !== undefined) {
        const x = sTnum.split(',');
        if (x.length === 1) {
          temp += parseFloat(x[0]);
          return temp;
        } else if (x.length >= 2) {
          let joined = '';
          joined = _.join(x, '');
          temp += parseFloat(joined);

          return temp;
        }
      }
    } else {
      return sTnum;
    }
  }
}

// ===========================================================================
// PARA MODAL
// ===========================================================================
// export const TIPOMODAL = new BehaviorSubject<any>('');
// export const SHOWMODAL = new BehaviorSubject<boolean>(false);
// export const SELECCIONMODAL = new BehaviorSubject<any>({});
// export const DECISIONMODAL = new BehaviorSubject<any>(false);
// export const OBJDEVUELTO = new BehaviorSubject<any>({});
// export const INDEXTOFOCUS = new BehaviorSubject<any>(0);

// ===========================================================================
// PARA MOSTRAR EL LOADING
// ===========================================================================
export const showLoadin = new BehaviorSubject<boolean>(false);
