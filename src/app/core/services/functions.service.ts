import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { DocumentosC } from '../typescript/documentos_de_identidad';
import * as _ from 'lodash';
import { AppConfig } from '../../../environments/environment';
import { GLOBAL } from '../typescript/GLOBAL';

@Injectable({
  providedIn: 'root',
})
export class FunctionService {
  canToast = false;

  currentUser = null;

  constructor(private toastr: ToastrService) {}

  nextCanToast(nextValue) {
    this.canToast = nextValue;
  }

  setUser(currentUser) {
    this.currentUser = currentUser;
  }

  getUser() {
    return this.currentUser;
  }

  getFacturasguardadas() {
    return JSON.parse(localStorage.getItem('facturas_guardadas')) || [];
  }

  setFacturasGuardadas(facturas) {
    localStorage.removeItem('facturas_guardadas');
    localStorage.setItem('facturas_guardadas', JSON.stringify(facturas));

    const btn_side = document.getElementById('btn_side_facturas');

    if (btn_side) {
      if (facturas.length.length > 0) btn_side.setAttribute('data-cant-facturas', facturas.length);
      else btn_side.removeAttribute('data-cant-facturas');
    }
  }

  // __________________________________________________________________________________________________
  // Nombre: checkNumbers
  // Descripcion : Esta funcion retorna true si algun caracter de una cadena no es un numero
  // _________________________________________________________________________________________________

  checkNumbers(arg) {
    let res = false;
    for (let i = 0; i < arg.length; i++) {
      const tempCaracter = arg.charAt(i);
      if (tempCaracter !== ',') {
        const caracter = _.parseInt(tempCaracter);
        if (_.isNaN(caracter)) {
          res = true;
          break;
        }
      }
    }
    return res;
  }

  // __________________________________________________________________________________________________
  // Nombre: checkLongMillares
  // Descripcion : Esta funcion validad que los millares sean de 3 en 3
  // _________________________________________________________________________________________________
  checkLongMillares(num) {
    let res = false;
    const splitNum = _.split(num, ',');

    splitNum.forEach((element, i) => {
      if (i !== 0) {
        if (element.length !== 3) res = true;
      }
    });

    return res;
  }

  revisarPrecio(input, id): any {
    return new Promise((resolve) => {
      const precioTEMPO = input.value;
      const res = { number: null, error: true };

      if (this.hasValue(precioTEMPO)) {
        const splitPrecio = _.split(precioTEMPO, '.');
        let precioTEMP;
        let enteros = splitPrecio[0];
        let tempdecimales = splitPrecio[1];

        if (tempdecimales === undefined) tempdecimales = '00';

        if (splitPrecio.length > 2 || this.checkNumbers(enteros) || this.checkLongMillares(enteros) || this.checkNumbers(tempdecimales) || this.checkLongMillares(tempdecimales)) {
          this.toastError('Valor introducido es invalido', 'ERROR');
          document.getElementById(id).focus();
        } else {
          //
          if (splitPrecio.length === 2) {
            if (this.isEmpty(enteros)) enteros = '0';

            let decimales;
            if (tempdecimales.length > 2) decimales = tempdecimales.substring(0, 2);
            else decimales = _.padEnd(tempdecimales, 2, '0');

            precioTEMP = _.join([enteros, decimales], '.');
          } else if (splitPrecio.length === 1) {
            precioTEMP = _.join([enteros, '00'], '.');
          }
          res.number = GLOBAL.formatearNumero(precioTEMP);
          res.error = false;
        }
      }

      resolve(res);
    });
  }
  // __________________________________________________________________________________________________
  // Nombre: getPersonaByDocIdentidad
  // Descripcion : Esta funcion busca una persona sea empleado, cliente o suplidor por su documento de identidad
  // _________________________________________________________________________________________________

  getPersonaByDocIdentidad(params: { documento: any; tipo: 'cedula' | 'rnc' }) {
    return new Promise((resolve, reject) => {
      let extra = { afterPath: 'persona', parameters: {} };

      extra['parameters'] = { all: true, documentos_de_identidad: true, filter_key: 'cedula', filter_value: params.documento };

      new DocumentosC()
        .getAll(extra)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }

  // __________________________________________________________________________________________________
  // Nombre: awaitTyping
  // Descripcion : Esta funcion espera a que terminen de escribir para ejecutar una funcion
  // _________________________________________________________________________________________________

  timeout;
  awaitTyping(event?) {
    const promise = new Promise((resolve) => {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        if (!event || event.keyCode != 13) resolve(true);
      }, 500);
    });
    return promise;
  }

  // __________________________________________________________________________________________________
  // Nombre: hasValue
  // Descripcion : Esta funcion valida que si una variable tiene valor
  // __________________________________________________________________________________________________

  hasValue(value) {
    return !this.isEmpty(value);
  }

  // __________________________________________________________________________________________________
  // Nombre: scrollTo
  // Descripcion : Esta funcion mueve el scroll hasta un elemento proporcionados
  // __________________________________________________________________________________________________
  scrollTo(id, block_: any = 'start', inline_: any = 'center') {
    if (id && document.getElementById(`${id}`)) document.getElementById(`${id}`).scrollIntoView({ behavior: 'smooth', block: block_, inline: inline_ });
  }

  // __________________________________________________________________________________________________
  // Nombre: remplaceKeyFromJson
  // Descripcion : Esta funcion cambia los key especificados de un objeto json
  // __________________________________________________________________________________________________
  remplaceKeyFromJson(json, params) {
    let jsonString = JSON.stringify(json);

    for (let i = 0; i < params.length; i++) {
      const element = params[i];
      jsonString = _.replace(jsonString, `"${element.old_key}"`, `"${element.new_key}"`);
    }

    return JSON.parse(jsonString);
  }
  // __________________________________________________________________________________________________
  // Nombre: IsJsonString
  // Descripcion : Esta funcion valida que un string sea un json valido
  // __________________________________________________________________________________________________
  IsJsonString(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
  // __________________________________________________________________________________________________
  // Nombre: isEmpty
  // Descripcion : Esta funcion valida que si una variable esta vacia
  // __________________________________________________________________________________________________

  isEmpty(value) {
    return (
      // es null o indefinido
      value == null ||
      // si tiene longitud 0
      (value.hasOwnProperty('length') && value.length === 0) ||
      // si es un string vacio o con lleno de espacios
      (typeof value === 'string' && value.trim().length === 0) ||
      // si es un objeto y no tiene propiedades
      (value.constructor === Object && Object.keys(value).length === 0)
    );
  }

  getAuthToken() {
    return localStorage.getItem('access-token');
  }

  async logout(callback = (arg) => {}) {
    try {
      localStorage.removeItem('facturas_guardadas');
      localStorage.removeItem('access-token');
      localStorage.removeItem('client');
      localStorage.removeItem('content-type');
      localStorage.removeItem('expiry');
      localStorage.removeItem('token-type');
      localStorage.removeItem('uid');
      callback(true);
    } catch (error) {
      callback(false);
    }

    // this.router.navigateByUrl('/auth/login');
  }

  decryptConfigPassword(str) {
    const str_remplace = btoa(str);

    return str_remplace == _.replace(AppConfig.config_password, 'VMj$pt30r=', '=');
  }

  logBlue(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #5580da', body !== undefined ? body : '');
  }

  logYellow(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #dada55', body !== undefined ? body : '');
  }

  logRed(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #da555f', body !== undefined ? body : '');
  }

  logGreen(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #55da56', body !== undefined ? body : '');
  }

  // =====================================================================
  // TOASTS
  // =====================================================================

  toastSuccess(msg?, titulo = 'CORRECTO') {
    if (this.canToast) this.toastr.success(msg || '', titulo || '');
  }

  toastError(msg?, titulo = 'ERROR') {
    console.log('toy aq1uiiiiiii');
    console.log('this.canToast ', this.canToast);

    if (this.canToast) this.toastr.error(msg || '', titulo || '');
  }

  toastWarning(msg?, titulo = 'AVISO') {
    if (this.canToast) this.toastr.warning(msg || '', titulo || '');
  }
}
