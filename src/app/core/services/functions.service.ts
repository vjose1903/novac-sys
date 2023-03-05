import * as moment from '../javascript/moment';
import { DocumentosC } from '../typescript/documentos_de_identidad';
import * as _ from 'lodash';

import { ConfigI } from '../typescript/config-interface';
import { Ss } from './singleton.service';
import { BehaviorSubject } from 'rxjs';
import { KEYWORD_ELECTRON_RELOAD } from '../../../../electron/shared-electron-angular';
import { MessageTask } from '../models/message-task';

export const windowSize = new BehaviorSubject<any>(undefined);
export class fun {
  constructor() {}

  // ----------------------------------------------------------------------------------------------------------

  static setWindowSize(nextValue) {
    windowSize.next(nextValue);
  }

  getWindowSize = windowSize.asObservable();

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
  // Nombre: reloadElectron
  // Descripcion : Esta funcion recarga el electron
  // _________________________________________________________________________________________________
  static   reloadElectron() {
    const task = new MessageTask(KEYWORD_ELECTRON_RELOAD);

    Ss._ipc
      .sendTask(task)
      .then((res) => {})
      .catch((err) => console.error(err));
  }
  // __________________________________________________________________________________________________
  // Nombre: getTypeNavigation
  // Descripcion : Esta funcion retorna cual es el tipo de navegacion que acaba de ocurrir
  // _________________________________________________________________________________________________
  static getTypeNavigation() {
    return window.performance.navigation.type;
  }

  // __________________________________________________________________________________________________
  // Nombre: crearContador
  // Descripcion : Esta funcion crea una variable contador para poder utilizarla en otras funciones
  // _________________________________________________________________________________________________
  static crearContador() {
    let count = 0;
    return () => {
      count++;
      console.log(count);
    };
  }

  // __________________________________________________________________________________________________
  // Nombre: date_formater
  // Descripcion : Esta funcion formatea una fecha con los parametros establecidos
  // _________________________________________________________________________________________________
  static date_formater(params: { date: any; dateFormat?: 'DD/MM/YYYY'; con_hora?: boolean }) {
    let fecha = moment(params.date).format(params.dateFormat);
    if (params.con_hora) fecha += ` - ${moment(params.date).format('LT')}`;
    return fecha;
  }
  // __________________________________________________________________________________________________
  // Nombre: duplicarJson
  // Descripcion : Esta funcion retorna un objeto igual al especificado sin la referencia al original
  // _________________________________________________________________________________________________

  static duplicarJson(obj: Object | Array<any>) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    let copy;
    if (Array.isArray(obj)) {
      copy = [...obj];
    } else {
      copy = Object.create(Object.getPrototypeOf(obj));
    }
    Object.getOwnPropertyNames(obj).forEach(function (key) {
      let descriptor = Object.getOwnPropertyDescriptor(obj, key);
      if (descriptor.value && typeof descriptor.value === 'object') {
        descriptor.value = fun.duplicarJson(descriptor.value);
      }
      Object.defineProperty(copy, key, descriptor);
    });
    return copy;
  }

  static my_filter_data(copyData, searchText, targets) {
    function pick_object(obj, array_string = []) {
      for (const key in obj) {
        const value = obj[key];

        if (typeof value != 'boolean') {
          if (typeof value == 'number') array_string.push(`${value}`);
          if (typeof value == 'string') array_string.push(value);
          if (typeof value == 'object') pick_object(value, array_string);
        }
      }

      return array_string;
    }

    const promise = new Promise((resolve) => {
      fun.awaitTyping().then((res) => {
        if (typeof searchText == 'number') searchText = `${searchText}`;
        if (this.isEmpty(searchText)) resolve(copyData);

        const data_filtered = fun.duplicarJson(copyData).filter((obj) => {
          const obj_picked = _.pick(obj, targets);
          const array_picked = pick_object(obj_picked);

          const is_include = array_picked.some((value: any) => value.toLocaleLowerCase().includes(searchText.toLocaleLowerCase()));

          return is_include;
        });

        resolve(data_filtered);
      });
    });

    return promise;
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
      if (fun.isEmpty(x1)) x1 = 0;
      const x2 = x.length > 1 ? '.' + x[1] : '';
      const rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
      }
      return x1 + x2;
    }
  }

  // __________________________________________________________________________________________________
  // Nombre: redondearNum
  // Descripcion : Esta funcion redondea a 2 decimales
  // _________________________________________________________________________________________________

  static redondearNum(num, cant = 2) {
    const string = num + '';
    const splitStr = _.split(string, '.');

    let enteros = splitStr[0];

    const splitEnteros = _.split(enteros, ',');

    enteros = _.join(splitEnteros, '');

    let tempdecimales = splitStr[1];
    if (splitStr.length == 1) tempdecimales = _.padEnd('', cant, '0');

    const decimales = fun.checkCeros(tempdecimales.substring(0, cant));
    const Arreglo = [enteros, decimales];
    const numStr = _.join(Arreglo, '.');

    return numStr;
  }

  // __________________________________________________________________________________________________
  // Nombre: checkLongDecimales
  // Descripcion : Esta funcion verifica que los numeros decimales no excedan el numero especificado
  // _________________________________________________________________________________________________

  static checkLongDecimales(currentValue, cant = 2) {
    const result = { value: currentValue, error: false };

    const splitStr = _.split(currentValue, '.');

    if (splitStr.length > 1 && splitStr[1].length > cant) {
      splitStr[1] = splitStr[1].slice(0, cant);
      result.value = _.join(splitStr, '.');
      result.error = true;
    }

    return result;
  }

  // __________________________________________________________________________________________________
  // Nombre: checkCeros
  // Descripcion : Esta funcion verifica que en un numero decimal no existan 0 a la derecha
  // _________________________________________________________________________________________________

  static checkCeros(num) {
    let result = num;
    if (num.length < 2) num += '00';

    if (num.charAt(num.length - 1) == '0' && num.length > 2) {
      let numSliced = num.slice(0, num.length - 1);

      return fun.checkCeros(numSliced);
    } else {
      return result;
    }
  }

  // __________________________________________________________________________________________________
  // Nombre: roundToNearestMultipleOf5
  // Descripcion : Esta funcion redondea un numero dado al multiplo de 5 mas cercano
  // _________________________________________________________________________________________________

  static roundToNearestMultipleOf5(number: number): number {
    return Math.ceil(number / 5) * 5;
  }
  // __________________________________________________________________________________________________
  // Nombre: parseFloatTwoDecimals
  // Descripcion : Esta funcion toma un string y lo vuelve entero y lo redondea a 2 decimales
  // _________________________________________________________________________________________________

  static parseFloatTwoDecimals(sTnum) {
    return fun.desformatear(fun.redondearNum(sTnum));
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
    if (typeof num == 'string') num = this.desformatear(num);
    return fun.formatearNumero(fun.redondearNum(num));
  }

  // __________________________________________________________________________________________________
  // Nombre: generateKey
  // Descripcion : Esta funcion retorna un id unico
  // _________________________________________________________________________________________________
  static generateKey(): string {
    return moment().unix() + '' + Math.round(Math.random() * 10000);
  }

  // __________________________________________________________________________________________________
  // Nombre: desformatear
  // Descripcion : Esta funcion toma un string y lo vuelve un entero
  // _________________________________________________________________________________________________
  static desformatear(sTnum: any) {
    const number = typeof sTnum == 'string' ? parseFloat(sTnum.replaceAll(',', '')) : sTnum;
    return number;
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
        .then((res) => {
          for (const persona of res.data) {
            persona.persona.documentos_de_identidad.map((doc) => {
              doc.id = null;
              return doc;
            });
          }
          resolve(res);
        })
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
  // Nombre: is_number
  // Descripcion : Esta funcion evalua si un parametro pasado es un numero
  // _________________________________________________________________________________________________
  static is_number(caracter) {
    if (fun.isEmpty(caracter)) return false;

    if (typeof caracter === 'number') caracter = `${caracter}`;
    let ascii = caracter.charCodeAt(0);

    return ascii >= 48 && ascii <= 57;
  }

  // __________________________________________________________________________________________________
  // Nombre: is_letter
  // Descripcion : Esta funcion evalua si un parametro pasado es un caracter
  // _________________________________________________________________________________________________

  static is_letter(caracter) {
    if (fun.isEmpty(caracter)) return false;

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
        if (!event || event.keyCode != 13) resolve(event);
      }, 700);
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
      (value.hasOwnProperty('length') && value.length == 0) ||
      // si es un string vacio o con lleno de espacios
      (typeof value == 'string' && value.trim().length == 0) ||
      // si es un objeto y no tiene propiedades
      (value.constructor == Object && Object.keys(value).length == 0)
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
  static scrollTo(params: { id: string; block: 'start' | 'center' | 'end' | 'nearest'; inline: 'start' | 'center' | 'end' | 'nearest'; behavior: 'auto' | 'smooth' }) {
    if (params.id && document.getElementById(`${params.id}`)) document.getElementById(`${params.id}`).scrollIntoView({ behavior: params.behavior, block: params.block, inline: params.inline });
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

  // __________________________________________________________________________________________________
  // Nombre: clickInput
  // Descripcion : Esta funcion hace click en un elemento html
  // __________________________________________________________________________________________________
  static clickInput(arg) {
    const element = document.getElementById(arg) as HTMLElement;
    if (element) element.click();
  }

  // __________________________________________________________________________________________________
  // Nombre: enfocarInput
  // Descripcion : Esta funcion enfoca un elemento html
  // __________________________________________________________________________________________________
  static enfocarInput(arg) {
    const element = document.getElementById(arg) as HTMLElement;

    if (element) element.focus();
  }

  // __________________________________________________________________________________________________
  // Nombre: desEnfocarInput
  // Descripcion : Esta funcion desenfoca un elemento html
  // __________________________________________________________________________________________________
  static desEnfocarInput(arg) {
    const element = document.getElementById(arg) as HTMLElement;
    if (element) element.blur();
  }

  // __________________________________________________________________________________________________
  // Nombre: selectContenido
  // Descripcion : Esta funcion selecciona el contenido de un elemento html
  // __________________________________________________________________________________________________
  static selectContenido(arg) {
    const element = document.getElementById(arg) as any;
    if (element) element.select();
  }

  // __________________________________________________________________________________________________
  // Nombre: getActualPath
  // Descripcion : Esta funcion returna en un string la ruta actual en la que estas posicionado
  // __________________________________________________________________________________________________
  static getActualPath() {
    const actualPath = window.location.pathname;
    return actualPath;
  }

  // __________________________________________________________________________________________________
  // Nombre: enfocarAndSelectInput
  // Descripcion : Esta funcion enfoca y selecciona el contenido de un elemento html
  // __________________________________________________________________________________________________
  static enfocarAndSelectInput(arg) {
    fun.enfocarInput(arg);
    setTimeout(() => this.selectContenido(arg), 10);
  }

  // __________________________________________________________________________________________________
  // Nombre: keyboardEvent
  // Descripcion : Esta funcion simula un evento de teclado
  // __________________________________________________________________________________________________
  static keyboardEvent(element: any, event: 'keyup' | 'keydown', keysArray: Array<string>): any {
    keysArray.forEach((key) => {
      element.dispatchEvent(new KeyboardEvent(event, { key: key }));
    });
  }

  // __________________________________________________________________________________________________
  // Nombre: getKeyByValue
  // Descripcion : Esta funcion retorna el key de un objeto buscando por su valor
  // __________________________________________________________________________________________________
  static getKeyByValue(object, value): any {
    return Object.keys(object).find((key) => object[key] == value);
  }

  // __________________________________________________________________________________________________
  // Nombre: createNestedObject
  // Descripcion : Esta funcion le crea al objeto pasado un valor anidado
  // __________________________________________________________________________________________________
  static createNestedObject(base, names, value?) {
    var lastName = arguments.length == 3 ? names.pop() : false;
    for (var i = 0; i < names.length; i++) {
      base = base[names[i]] = base[names[i]] || {};
    }
    if (lastName) base = base[lastName] = value;
    return base;
  }
  static getAuthToken() {
    return fun.hasValue(localStorage.getItem('access-token')) ? localStorage.getItem('access-token') : undefined;
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

        Ss.layServ.nextLogOut(undefined);
        resolve(true);
      } catch (error) {
        resolve(false);
      }
    });

    // this.router.navigateByUrl('/auth/login');
  }

  static decryptConfigPassword(str) {
    const str_remplace = btoa(str);
    const config: ConfigI = Ss.configServ.getConfig({ isPromise: false });
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

  // ----------------------------------------------------------------------------------------------------------
  static LightenDarkenColor(col, amt) {
    col = parseInt(col, 16);

    return (((col & 0x0000ff) + amt) | ((((col >> 8) & 0x00ff) + amt) << 8) | (((col >> 16) + amt) << 16))?.toString(16);
  }

  /* Suma el porcentaje indicado a un color (RR, GG o BB) hexadecimal para aclararlo */
  static addLight(color: any, amount: any) {
    let cc = parseInt(color, 16) + amount;
    let c = cc > 255 ? 255 : cc;
    c = c?.toString(16).length > 1 ? c?.toString(16) : `0${c?.toString(16)}`;
    return c;
  }

  /* Aclara un color hexadecimal de 6 caracteres #RRGGBB segun el porcentaje indicado */
  static lighten(color: any, amount: any) {
    color = color.indexOf('#') >= 0 ? color.substring(1, color.length) : color;
    amount = parseInt(`${(255 * amount) / 100}`);
    return (color = `#${this.addLight(color.substring(0, 2), amount)}${this.addLight(color.substring(2, 4), amount)}${this.addLight(color.substring(4, 6), amount)}`);
  }

  /* Resta el porcentaje indicado a un color (RR, GG o BB) hexadecimal para oscurecerlo */
  static subtractLight(color: any, amount: any) {
    let cc = parseInt(color, 16) - amount;
    let c: any = cc < 0 ? 0 : cc;
    c = c?.toString(16).length > 1 ? c?.toString(16) : `0${c?.toString(16)}`;
    return c;
  }

  /* Oscurece un color hexadecimal de 6 caracteres #RRGGBB segun el porcentaje indicado */
  static darken(color: any, amount: any) {
    color = color.indexOf('#') >= 0 ? color.substring(1, color.length) : color;
    amount = parseInt(`${(255 * amount) / 100}`);
    return (color = `#${this.subtractLight(color.substring(0, 2), amount)}${this.subtractLight(color.substring(2, 4), amount)}${this.subtractLight(color.substring(4, 6), amount)}`);
  }

  // =====================================================================
  // TOASTS
  // =====================================================================

  static toastInfo(msg?, titulo = 'INFORMACION') {
    if (Ss.sharedServ.canToast) Ss.toastr.info(msg || '', titulo || '');
  }

  static toastSuccess(msg?, titulo = 'CORRECTO') {
    if (Ss.sharedServ.canToast) Ss.toastr.success(msg || '', titulo || '');
  }

  static toastError(msg?, titulo = 'ERROR') {
    if (Ss.sharedServ.canToast) Ss.toastr.error(msg || '', titulo || '');
  }

  static toastWarning(msg?, titulo = 'AVISO') {
    if (Ss.sharedServ.canToast) Ss.toastr.warning(msg || '', titulo || '');
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
  // LODASH
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

  // __________________________________________________________________________________________________
  // Nombre: pushAt
  // Descripcion : Esta funcion agrega un item en un indice especificado de un arreglo
  // _________________________________________________________________________________________________
  static pushAt(arr, index, newItem) {
    const copyArr = fun.duplicarJson(arr);
    arr.length = 0;
    const newArr = [...copyArr.slice(0, index), newItem, ...copyArr.slice(index)];
    newArr.forEach((item) => arr.push(item));
  }

  // __________________________________________________________________________________________________
  // Nombre: pull
  // Descripcion : Esta funcion remueve un item  de un arreglo
  // _________________________________________________________________________________________________
  static pull(array, item_remove) {
    console.log('item_remove ', item_remove);
    console.log('array ', array);

    const index = array.findIndex((item) => fun.isEqual(item, item_remove));
    array.splice(index, 1);
  }

  // __________________________________________________________________________________________________
  // Nombre: pullAt
  // Descripcion : Esta funcion remueve un item en un indice especificado de un arreglo
  // _________________________________________________________________________________________________
  static pullAt(array, index) {
    array.splice(index, 1);
  }

  // __________________________________________________________________________________________________
  // Nombre: objHas
  // Descripcion : Esta funcion retorna un valor booleano si el objeto evaluado contiene todas las propiedades evaluadas
  // _________________________________________________________________________________________________

  static objHas(obj, props) {
    let result = true;
    const props_split = props.split('.');

    for (let index = 0; index < props_split.length; index++) {
      const current_prop = props_split[index];
      const current_object = fun.getCurrentObjLevel(obj, props_split, index);

      if (fun.hasValue(current_object)) result = current_object.hasOwnProperty(current_prop);
      else result = false;

      if (result == false) break;
    }

    return result;
  }

  // __________________________________________________________________________________________________
  // Nombre: getProperty
  // Descripcion : Esta funcion retorna el valor de una propiedad de un objeto
  // _________________________________________________________________________________________________
  static getProperty(obj, prop) {
    const props_split = prop.split('.');
    return props_split.reduce((objeto, property) => (typeof objeto == 'undefined' || objeto === null ? objeto : objeto[property]), obj);
  }

  // __________________________________________________________________________________________________
  // Nombre: setProperty
  // Descripcion : Esta funcion setea una propiedad a un objeto
  // _________________________________________________________________________________________________
  static setProperty(obj, prop, valor) {
    const props_split = prop.split('.');

    fun.createNestedObject(obj, [...props_split], valor);
  }

  // __________________________________________________________________________________________________
  // Nombre: pick
  // Descripcion : Esta funcion retorna un nuevo objeto con las propiedades requeridas
  // _________________________________________________________________________________________________
  static pick(obj, props): any {
    const result = {};

    for (let index = 0; index < props.length; index++) {
      const prop = props[index];
      const props_split = prop.split('.');

      if (fun.hasValue(fun.getProperty(obj, prop))) {
        fun.createNestedObject(result, [...props_split], fun.getProperty(obj, prop));
      }
    }
    return result;
  }

  // __________________________________________________________________________________________________
  // Nombre: omit
  // Descripcion : Esta funcion retorna un nuevo objeto con las propiedades omitidas
  // _________________________________________________________________________________________________
  static omit(obj, props) {
    for (let index = 0; index < props.length; index++) {
      const prop = props[index];

      if (fun.hasValue(fun.getProperty(obj, prop))) {
        const props_split = prop.split('.');
        let current_object = obj;

        for (let innerIndex = 0; innerIndex < props_split.length; innerIndex++) {
          const currentProp = props_split[innerIndex];

          current_object = fun.getCurrentObjLevel(obj, props_split, innerIndex);

          if (innerIndex == props_split.length - 1) delete current_object[currentProp];
        }
      }
    }

    return obj;
  }

  static getCurrentObjLevel(mainObj, props_split, actualIndex, deepLevel = 0) {
    let obj_en_turno = mainObj;

    if (fun.hasValue(mainObj) && actualIndex > 0 && deepLevel < actualIndex) {
      const nextLevel = mainObj[props_split[deepLevel]];
      deepLevel += 1;
      obj_en_turno = fun.getCurrentObjLevel(nextLevel, props_split, actualIndex, deepLevel);
    }

    return obj_en_turno;
  }

  toString = Object.prototype.toString;

  static createMap() {
    return Object.create(null);
  }
  static isWindow(obj) {
    return obj && obj.window === obj;
  }
  static isScope(obj) {
    return obj && obj.$evalAsync && obj.$watch;
  }
  static isRegExp(value) {
    return toString.call(value) === '[object RegExp]';
  }
  static simpleCompare(a, b) {
    return a === b || (a !== a && b !== b);
  }
  static isDate(value) {
    return toString.call(value) === '[object Date]';
  }
  static isArray(arr) {
    return Array.isArray(arr) || arr instanceof Array;
  }

  static isEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    if (obj1 === null || obj2 === null) return false;
    if (obj1 !== obj1 && obj2 !== obj2) return true; // NaN === NaN

    let length, key, keySet;

    if (typeof obj1 === typeof obj2 && typeof obj1 === 'object') {
      if (fun.isArray(obj1)) {
        if (!fun.isArray(obj2)) return false;

        if ((length = obj1.length) === obj2.length) {
          for (key = 0; key < length; key++) {
            if (!fun.isEqual(obj1[key], obj2[key])) return false;
          }

          return true;
        }
      } else if (fun.isDate(obj1)) {
        if (!fun.isDate(obj2)) return false;
        return fun.simpleCompare(obj1.getTime(), obj2.getTime());
      } else if (fun.isRegExp(obj1)) {
        if (!fun.isRegExp(obj2)) return false;
        return obj1.toString() === obj2.toString();
      } else {
        if (fun.isScope(obj1) || fun.isScope(obj2) || fun.isWindow(obj1) || fun.isWindow(obj2) || fun.isArray(obj2) || fun.isDate(obj2) || fun.isRegExp(obj2)) return false;
        keySet = fun.createMap();
        for (key in obj1) {
          if (key.charAt(0) === '$' || fun.isFunction(obj1[key])) continue;
          if (!fun.isEqual(obj1[key], obj2[key])) return false;
          keySet[key] = true;
        }
        for (key in obj2) {
          if (!(key in keySet) && key.charAt(0) !== '$' && fun.hasValue(obj2[key]) && !fun.isFunction(obj2[key])) return false;
        }
        return true;
      }
    }
    return false;
  }
}
