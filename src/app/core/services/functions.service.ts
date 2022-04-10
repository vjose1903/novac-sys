import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { DocumentosC } from '../typescript/documentos_de_identidad';
import * as _ from 'lodash';

import { ConfigurationService } from './configuration.service';
import { ConfigI } from '../typescript/config-interface';
import { SingletonService } from './singleton.service';

export class fun {
  constructor() {}

  static getFacturasguardadas() {
    return JSON.parse(localStorage.getItem('facturas_guardadas')) || [];
  }

  static setFacturasGuardadas(facturas) {
    localStorage.removeItem('facturas_guardadas');
    localStorage.setItem('facturas_guardadas', JSON.stringify(facturas));

    const btn_side = document.getElementById('btn_side_facturas');

    if (btn_side) {
      if (facturas.length.length > 0) btn_side.setAttribute('data-cant-facturas', facturas.length);
      else btn_side.removeAttribute('data-cant-facturas');
    }
  }

  // __________________________________________________________________________________________________
  // Nombre: duplicarJson
  // Descripcion : Esta funcion retorna un objeto igual al especificado sin la referencia al original
  // _________________________________________________________________________________________________

  static duplicarJson(json: Object | Array<any>) {
    return _.cloneDeep(json);
  }

  // __________________________________________________________________________________________________
  // Nombre: checkNumbers
  // Descripcion : Esta funcion retorna true si algun caracter de una cadena no es un numero
  // _________________________________________________________________________________________________

  static checkNumbers(arg) {
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
  // Nombre: pushAt
  // Descripcion : Esta funcion agrega un item en un indice especificado de un arreglo
  // _________________________________________________________________________________________________
  static pushAt(arr, index, newItem) {
    const copyArr = this.duplicarJson(arr);
    arr.length = 0;
    const newArr = [...copyArr.slice(0, index), newItem, ...copyArr.slice(index)];
    newArr.forEach((item) => arr.push(item));
  }

  // __________________________________________________________________________________________________
  // Nombre: checkLongMillares
  // Descripcion : Esta funcion validad que los millares sean de 3 en 3
  // _________________________________________________________________________________________________
  static checkLongMillares(num) {
    let res = false;
    const splitNum = _.split(num, ',');

    splitNum.forEach((element, i) => {
      if (i !== 0) {
        if (element.length !== 3) res = true;
      }
    });

    return res;
  }

  static revisarPrecio(input, id): any {
    return new Promise((resolve) => {
      const precioTEMPO = input.value;
      const res = { number: null, error: true };

      if (fun.hasValue(precioTEMPO)) {
        const splitPrecio = _.split(precioTEMPO, '.');
        let precioTEMP;
        let enteros = splitPrecio[0];
        let tempdecimales = splitPrecio[1];

        if (tempdecimales === undefined) tempdecimales = '00';

        if (splitPrecio.length > 2 || fun.checkNumbers(enteros) || fun.checkLongMillares(enteros) || fun.checkNumbers(tempdecimales) || fun.checkLongMillares(tempdecimales)) {
          fun.toastError('Valor introducido es invalido', 'ERROR');
          document.getElementById(id).focus();
        } else {
          //
          if (splitPrecio.length === 2) {
            if (fun.isEmpty(enteros)) enteros = '0';

            let decimales;
            if (tempdecimales.length > 2) decimales = tempdecimales.substring(0, 2);
            else decimales = _.padEnd(tempdecimales, 2, '0');

            precioTEMP = _.join([enteros, decimales], '.');
          } else if (splitPrecio.length === 1) {
            precioTEMP = _.join([enteros, '00'], '.');
          }
          res.number = this.formatearNumero(precioTEMP);
          res.error = false;
        }
      }

      resolve(res);
    });
  }
  // __________________________________________________________________________________________________
  // Nombre: formatearNumero
  // Descripcion : Esta funcion le da formato de numero a un string
  // _________________________________________________________________________________________________

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
  // __________________________________________________________________________________________________
  // Nombre: redondearAdos
  // Descripcion : Esta funcion redondea a 2 decimales
  // _________________________________________________________________________________________________

  static redondearAdos(num) {
    const string = num + '';
    const splitStr = _.split(string, '.');

    let enteros = splitStr[0];

    const splitEnteros = _.split(enteros, ',');

    enteros = _.join(splitEnteros, '');

    let tempdecimales = splitStr[1];
    if (splitStr.length === 1) {
      tempdecimales = '00';
    }

    const decimales = tempdecimales.substring(0, 2);
    const Arreglo = [enteros, decimales];
    const numStr = _.join(Arreglo, '.');

    return parseFloat(numStr).toFixed(2);
  }

  // __________________________________________________________________________________________________
  // Nombre: parseFloatTwoDecimals
  // Descripcion : Esta funcion toma un string y lo vuelve entero y lo redondea a 2 decimales
  // _________________________________________________________________________________________________

  static parseFloatTwoDecimals(sTnum) {
    return fun.desformatear(fun.redondearAdos(sTnum));
  }

  // __________________________________________________________________________________________________
  // Nombre: isFunction
  // Descripcion : Esta funcion revisa si el argumento pasado es una funcion
  // _________________________________________________________________________________________________

  static isFunction(arg) {
    return fun.hasValue(arg) ? arg instanceof Function : false;
  }
  // __________________________________________________________________________________________________
  // Nombre: numFormatTwoDecimals
  // Descripcion : Esta funcion toma un string y lo formatea a dos decimales
  // _________________________________________________________________________________________________
  static numFormatTwoDecimals(num) {
    return fun.formatearNumero(fun.redondearAdos(num));
  }

  // __________________________________________________________________________________________________
  // Nombre: desformatear
  // Descripcion : Esta funcion toma un string y lo vuelve un entero
  // _________________________________________________________________________________________________
  static desformatear(sTnum: any) {
    const number = typeof sTnum == 'string' ? parseFloat(sTnum.replaceAll(',', '')) : sTnum;
    return number;

    // let temp = 0;

    // if (sTnum) {
    //   const x = _.split(sTnum, ',');
    //   if (x.length === 1) {
    //     temp += parseFloat(x[0]);
    //     return temp;
    //   } else if (x.length >= 2) {
    //     let joined = '';
    //     joined = _.join(x, '');
    //     temp += parseFloat(joined);
    //     return temp;
    //   }
    // } else {
    //   return sTnum;
    // }
  }
  // __________________________________________________________________________________________________
  // Nombre: getPersonaByDocIdentidad
  // Descripcion : Esta funcion busca una persona sea empleado, cliente o suplidor por su documento de identidad
  // _________________________________________________________________________________________________

  static getPersonaByDocIdentidad(params: { documento: any; tipo: 'cedula' | 'rnc' }) {
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
  // Nombre: roundDecenaMayor
  // Descripcion : Esta funcion redondea un numero a la decena mayor al mismo
  // _________________________________________________________________________________________________

  static roundDecenaMayor(value) {
    if (0 > value) {
      const decenaMenor = Math.ceil(value / 10) * 10;
      return decenaMenor + 10;
    }
    const decenaMenor = Math.floor(value / 10) * 10;
    return decenaMenor + 10;
  }

  // __________________________________________________________________________________________________
  // Nombre: ValidaCedula
  // Descripcion : Esta funcion Valida una cedula
  // _________________________________________________________________________________________________

  static ValidaCedula(cedula) {
    // Declaración de variables a nivel de método o función.
    let verificador = 0;
    let digito = 0;
    const digitoVerificador = cedula.charAt(10); // es el ultimo numero despues del guion
    let suma = 0;
    /*Control de errores en el código*/
    try {
      // verificamos que la longitud del parametro sea igual a 11
      // recorremos en un ciclo for cada dígito de la cédula
      for (let i = 0; i < 10; i++) {
        // se multiplica el numero entre 1 y 2 alternadamente
        digito = _.parseInt(cedula.charAt(i)) * (i % 2 === 0 ? 1 : 2);
        // si la multiplicacion da de dos digitos se suman los numeros individuales
        if (digito > 9) {
          digito = _.parseInt(digito.toString().charAt(0)) + _.parseInt(digito.toString().charAt(1));
        }
        suma += digito;
      }
      /*Obtenemos el verificador restandole la decena mayor a la sumatoria*/
      verificador = fun.roundDecenaMayor(suma) - suma;

      // si el verificador da igual a la resta esta correcta

      if ((verificador === 10 && digitoVerificador === '0') || verificador.toString() === digitoVerificador.toString()) {
        // console.log('cedula ', cedula.substring(0, 3) + '-' + cedula.substring(3, 10) + '-' + cedula.substring(10, 11));

        // console.log('=====================');
        // console.log('|      correcto      |');
        // console.log('=====================');

        return true;
      }
    } catch {
      // console.log('cedula ', cedula.substring(0, 3) + '-' + cedula.substring(3, 10) + '-' + cedula.substring(10, 11));
      // console.log('=====================');
      // console.log('|     inorrecto     |');
      // console.log('=====================');
      return false;
    }

    // console.log('cedula ', cedula.substring(0, 3) + '-' + cedula.substring(3, 10) + '-' + cedula.substring(10, 11));
    // console.log('=====================');
    // console.log('|     incorrecto     |');
    // console.log('=====================');
    return false;
  }

  // __________________________________________________________________________________________________
  // Nombre: ModificarClass
  // Descripcion : Esta funcion añada o quita una clase de un elemento html
  // _________________________________________________________________________________________________
  static ModificarClass(item, clase, action: 'add' | 'remove') {
    if (document.getElementById(item)) document.getElementById(item).classList[action](clase);
  }

  // __________________________________________________________________________________________________
  // Nombre: Capitalice
  // Descripcion : Esta capitaliza un string
  // _________________________________________________________________________________________________
  static Capitalice(str) {
    const ultimosCaractes = fun.hasValue(str) ? str.length + 1 : null;
    return fun.hasValue(str) ? _.upperCase(str.substr(0, 1)) + str.substr(1, ultimosCaractes) : str;
  }

  // __________________________________________________________________________________________________
  // Nombre: my_houreFormater
  // Descripcion : Esta formatea una hora
  // _________________________________________________________________________________________________
  static my_houreFormater(str) {
    const dateObj = new Date(str);

    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;

    const res = `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes} ${ampm}`;
    return res;
  }

  // __________________________________________________________________________________________________
  // Nombre: my_dateFormater
  // Descripcion : Esta formatea un date
  // _________________________________________________________________________________________________
  static my_dateFormater(str, front = true) {
    str = str + '';
    let dateObj = new Date(str);

    let month = String(dateObj.getMonth() + 1).padStart(2, '0');
    let day = String(dateObj.getDate()).padStart(2, '0');
    let year = dateObj.getFullYear();

    if (front) str = `${day}/${month}/${year}`;
    else str = `${year}-${month}-${day}`;

    return str;
  }

  // __________________________________________________________________________________________________
  // Nombre: awaitTyping
  // Descripcion : Esta funcion espera a que terminen de escribir para ejecutar una funcion
  // _________________________________________________________________________________________________
  static is_number(caracter) {
    if (typeof caracter === 'number') caracter = `${caracter}`;
    let ascii = caracter.charCodeAt(0);

    return ascii >= 48 && ascii <= 57;
  }

  // __________________________________________________________________________________________________
  // Nombre: awaitTyping
  // Descripcion : Esta funcion espera a que terminen de escribir para ejecutar una funcion
  // _________________________________________________________________________________________________

  static is_letter(caracter) {
    let ascii = caracter.toUpperCase().charCodeAt(0);
    return ascii >= 65 && ascii <= 90;
  }
  // __________________________________________________________________________________________________
  // Nombre: awaitTyping
  // Descripcion : Esta funcion espera a que terminen de escribir para ejecutar una funcion
  // _________________________________________________________________________________________________

  static timeout;
  static awaitTyping(event?) {
    const promise = new Promise((resolve) => {
      clearTimeout(fun.timeout);
      fun.timeout = setTimeout(() => {
        if (!event || event.keyCode != 13) resolve(true);
      }, 500);
    });
    return promise;
  }

  // __________________________________________________________________________________________________
  // Nombre: multiAssing
  // Descripcion : Esta funcion hace un multiAsignamiento en onjetos a partir de otro objeto
  // __________________________________________________________________________________________________
  static multiAssing(obj: Object, sources: Array<{ key: string; value: any }>) {
    for (let index = 0; index < sources.length; index++) {
      const element = sources[index];
      obj[element.key] = element.value;
    }
  }

  // __________________________________________________________________________________________________
  // Nombre: isEmpty
  // Descripcion : Esta funcion valida que si una variable esta vacia
  // __________________________________________________________________________________________________

  static isEmpty(value) {
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

  // __________________________________________________________________________________________________
  // Nombre: hasValue
  // Descripcion : Esta funcion valida que si una variable tiene valor
  // __________________________________________________________________________________________________

  static hasValue(value) {
    return !fun.isEmpty(value);
  }

  // __________________________________________________________________________________________________
  // Nombre: scrollTo
  // Descripcion : Esta funcion mueve el scroll hasta un elemento proporcionados
  // __________________________________________________________________________________________________
  static scrollTo(id, block_: any = 'start', inline_: any = 'center') {
    if (id && document.getElementById(`${id}`)) document.getElementById(`${id}`).scrollIntoView({ behavior: 'smooth', block: block_, inline: inline_ });
  }

  // __________________________________________________________________________________________________
  // Nombre: remplaceKeyFromJson
  // Descripcion : Esta funcion cambia los key especificados de un objeto json
  // __________________________________________________________________________________________________
  static remplaceKeyFromJson(json, params) {
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
  static IsJsonString(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  static getAuthToken() {
    return localStorage.getItem('access-token');
  }

  static async logout() {
    return new Promise((resolve) => {
      try {
        localStorage.removeItem('facturas_guardadas');
        localStorage.removeItem('access-token');
        localStorage.removeItem('client');
        localStorage.removeItem('content-type');
        localStorage.removeItem('expiry');
        localStorage.removeItem('token-type');
        localStorage.removeItem('uid');
        resolve(true);
      } catch (error) {
        resolve(false);
      }
    });

    // this.router.navigateByUrl('/auth/login');
  }

  static decryptConfigPassword(str) {
    const str_remplace = btoa(str);
    const config: ConfigI = SingletonService.configServ.getConfig({ isPromise: false });
    return str_remplace == _.replace(config.config_password, 'VMj$pt30r=', '=');
  }
  // ----------------------------------------------------------------------------------------------------------

  static logBlue(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #5580da', body !== undefined ? body : '');
  }
  // ----------------------------------------------------------------------------------------------------------

  static logYellow(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #dada55', body !== undefined ? body : '');
  }
  // ----------------------------------------------------------------------------------------------------------

  static logRed(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #da555f', body !== undefined ? body : '');
  }
  // ----------------------------------------------------------------------------------------------------------

  static logGreen(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #55da56', body !== undefined ? body : '');
  }

  // ----------------------------------------------------------------------------------------------------------

  static logOrange(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #df8211', body !== undefined ? body : '');
  }
  // ----------------------------------------------------------------------------------------------------------

  static logPurple(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #9954d9', body !== undefined ? body : '');
  }

  // =====================================================================
  // TOASTS
  // =====================================================================

  static toastSuccess(msg?, titulo = 'CORRECTO') {
    if (SingletonService.sharedServ.canToast) SingletonService.toastr.success(msg || '', titulo || '');
  }

  static toastError(msg?, titulo = 'ERROR') {
    if (SingletonService.sharedServ.canToast) SingletonService.toastr.error(msg || '', titulo || '');
  }

  static toastWarning(msg?, titulo = 'AVISO') {
    if (SingletonService.sharedServ.canToast) SingletonService.toastr.warning(msg || '', titulo || '');
  }
}
