const moment = require('../javascript/moment');
import { DocumentosC } from '../typescript/documentos_de_identidad';
import * as _ from 'lodash';

import { ConfigI } from '../interface/config-interface';
import { Ss } from './singleton.service';
import { BehaviorSubject } from 'rxjs';
import { ELECTRON_RELOAD } from '../../../../electron/shared-electron-angular';
import { MessageTask } from '../models/message-task';
import { RetryOptions } from '../interface/retry-until';
export const windowSize = new BehaviorSubject<any>(undefined);
export class fun {
  constructor() {}

  // ----------------------------------------------------------------------------------------------------------

  static setWindowSize(nextValue) {
    windowSize.next(nextValue);
  }

  getWindowSize = windowSize.asObservable();

  // __________________________________________________________________________________________________
  // Nombre: reloadElectron
  // Descripcion : Esta funcion recarga el electron
  // _________________________________________________________________________________________________
  static reloadElectron() {
    const task = new MessageTask(ELECTRON_RELOAD);

    Ss._ipc
      .sendTask(task)
      .then(res => {})
      .catch(err => console.error(err));
  }
  // __________________________________________________________________________________________________
  // Nombre: removerDuplicados
  // Descripcion : Esta funcion retorna un arreglo sin duplicados
  // _________________________________________________________________________________________________
  static removerDuplicados<T>(arr: T[]): T[] {
    return Array.from(new Set(arr));
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
  // Nombre: deepCloning
  // Descripcion : Esta funcion retorna un objeto igual al especificado sin la referencia al original
  // _________________________________________________________________________________________________

  static deepCloning(obj: Object | Array<any>) {
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
        descriptor.value = fun.deepCloning(descriptor.value);
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

    const promise = new Promise(resolve => {
      fun.awaitTyping().then(res => {
        if (typeof searchText == 'number') searchText = `${searchText}`;
        if (fun.isEmpty(searchText)) resolve(copyData);

        const data_filtered = fun.deepCloning(copyData).filter(obj => {
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

  static revisarNumber(input, id): any {
    return new Promise(resolve => {
      const precioTEMPO = input.value;

      const res = { number: null, error: true };

      if (fun.hasValue(precioTEMPO)) {
        const newNumber = fun.roundNumberToDecimal(precioTEMPO);

        if (isNaN(Number(fun.desformatearStNumber(newNumber)))) {
          fun.toastError('Valor introducido es invalido', 'ERROR');
          if (document.getElementById(id)) document.getElementById(id).focus();
        } else {
          res.number = newNumber;
          res.error = false;
        }
      }

      resolve(res);
    });
  }

  // __________________________________________________________________________________________________
  // Nombre: redondearNum
  // Descripcion : Esta funcion redondea a 2 decimales
  // _________________________________________________________________________________________________
  static redondearNum(numero, decimales = 2) {
    const factor = Math.pow(10, decimales);
    const numberRounded = Math.round((numero + Number.EPSILON) * factor) / factor;
    return numberRounded.toFixed(decimales);
  }

  // __________________________________________________________________________________________________
  // Nombre: roundNumberToDecimal
  // Descripcion : Esta funcion redondea a 2 decimales
  // _________________________________________________________________________________________________

  static roundNumberToDecimal(number, cant = 2): string {
    if (fun.isEmpty(number)) return number;

    if (typeof number == 'string' || isNaN(number)) number = parseFloat(fun.desformatearStNumber(number));

    const numerRounded = fun.redondearNum(number, cant);

    // Formateamos el número con comas para separar millares
    const partes = numerRounded.split('.');
    const enteros = partes[0];
    const decimales = partes[1];
    const numeroFormateado = `${enteros.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${cant >= 1 ? `.${decimales}` : ''}`;

    return numeroFormateado;
  }

  // __________________________________________________________________________________________________
  // Nombre: checkLongDecimales
  // Descripcion : Esta funcion verifica que los numeros decimales no excedan el numero especificado
  // _________________________________________________________________________________________________

  static checkLongDecimales(currentValue, cant = 2) {
    const result = { value: currentValue, error: false };

    const splitStr = currentValue.split('.');

    if (splitStr.length > 1 && splitStr[1].length > cant) {
      splitStr[1] = splitStr[1].slice(0, cant);
      result.value = _.join(splitStr, '.');
      result.error = true;
    }

    return result;
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

  static parseStFloatTwoDecimals(sTnum) {
    return fun.desformatearStNumber(fun.roundNumberToDecimal(sTnum));
  }

  // __________________________________________________________________________________________________
  // Nombre: isFunction
  // Descripcion : Esta funcion revisa si el argumento pasado es una funcion
  // _________________________________________________________________________________________________

  static isFunction(arg) {
    return fun.hasValue(arg) ? arg instanceof Function : false;
  }

  // __________________________________________________________________________________________________
  // Nombre: generateKey
  // Descripcion : Esta funcion retorna un id unico
  // _________________________________________________________________________________________________
  static generateKey(): string {
    return `${moment().unix()}${Math.round(Math.random() * 10000)}`;
  }

  // __________________________________________________________________________________________________
  // Nombre: identifyObject
  // Descripcion : Esta funcion le agrega una propiedad id a un objeto
  // _________________________________________________________________________________________________
  static identifyObject(object: any | Array<any>, key = 'id') {
    if (Array.isArray(object)) {
      object.map(item => (item[key] = fun.generateKey()));
    } else {
      object[key] = fun.generateKey();
    }
  }

  // __________________________________________________________________________________________________
  // Nombre: desformatear
  // Descripcion : Esta funcion toma un string y lo vuelve un entero
  // _________________________________________________________________________________________________
  static desformatearStNumber(sTnum: any) {
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
        .then(res => {
          for (const persona of res.data) {
            persona.persona.documentos_de_identidad.map(doc => {
              doc.id = null;
              return doc;
            });
          }
          resolve(res);
        })
        .catch(err => reject(err));
    });
  }

  // __________________________________________________________________________________________________
  // Nombre: normalizarTexto
  // Descripcion : Esta funcion normaliza un texto para que no tenga acentos
  // _________________________________________________________________________________________________

  static normalizarTexto(texto: string): string {
    const textoMinusculas = texto.toLowerCase();

    const textoSinAcentos = textoMinusculas.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return textoSinAcentos;
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
    if (!fun.hasValue(str)) return str;

    const upperCaseText = str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return upperCaseText;
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
  static awaitTyping(event?: KeyboardEvent, waitingTime = 700): Promise<void> {
    return new Promise(resolve => {
      if (fun.timeout) clearTimeout(fun.timeout);

      if (event?.key === 'Enter' || event?.keyCode === 13) return resolve();

      fun.timeout = setTimeout(resolve, waitingTime);
    });
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
  /**
   * Nombre: isEmpty
   * Descripción: Esta función valida si una variable está vacía.
   * @param value La variable a evaluar.
   * @returns true si la variable está vacía, false en caso contrario.
   * @example fun.isEmpty(variable)
   */

  static isEmpty(value: any) {
    if (value == null) return true;

    if (typeof value === 'string') return value.trim().length === 0;

    if (Array.isArray(value)) return value.length === 0;

    if (value instanceof Date) return isNaN(value.getTime());

    if (typeof value === 'object') return Object.keys(value).length === 0;

    return false;
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
  // _________________________________________________________________________________________________
  static enfocarInput(arg, element?) {
    element ??= document.getElementById(arg) as HTMLElement;
    if (element) element.focus();
  }

  // __________________________________________________________________________________________________
  // Nombre: desEnfocarInput
  // Descripcion : Esta funcion desenfoca un elemento html
  // _________________________________________________________________________________________________
  static desEnfocarInput(inputId?: string) {
    const element = document.getElementById('input_fantasma');
    if (element) element.click();

    if (inputId) {
      const input = document.getElementById(inputId);
      if (input) input.blur();
    }
  }
  // __________________________________________________________________________________________________
  // Nombre: clickInputFantasma
  // Descripcion : Esta funcion clickea el input fantasma
  // __________________________________________________________________________________________________
  static clickInputFantasma() {
    const element = document.getElementById('input_fantasma');

    if (element) element.click();
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
    keysArray.forEach(key => {
      element.dispatchEvent(new KeyboardEvent(event, { key: key }));
    });
  }

  // __________________________________________________________________________________________________
  // Nombre: getKeyByValue
  // Descripcion : Esta funcion retorna el key de un objeto buscando por su valor
  // __________________________________________________________________________________________________
  static getKeyByValue(object, value): any {
    return Object.keys(object).find(key => object[key] == value);
  }

  // __________________________________________________________________________________________________
  // Nombre: retryUntil
  // Descripcion : Esta funcion recibe una tarea y la repite hasta que las condiciones establecidas se cumplan
  // _________________________________________________________________________________________________

  static async retryUntil<T>(params: { task: () => Promise<T>; retryWhen: (response: T) => boolean; actionAfterRetry: (response: T) => void; actionIfNoSuccess: () => void; options?: RetryOptions }): Promise<void> {
    const { task, retryWhen, actionAfterRetry, actionIfNoSuccess, options = {} } = params;
    const { delayBetweenRetries = 500, retryMax = 20, logError = false } = options;

    let retryCount = 0;

    const executeTask = async (): Promise<void> => {
      try {
        const response = await task();
        const shouldRetry = retryWhen(response);
        const hasRetries = retryCount < retryMax;

        if (shouldRetry && hasRetries) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, delayBetweenRetries));
          return executeTask();
        }

        if (shouldRetry && !hasRetries) {
          if (logError) {
            console.error(`Max number of retries (${retryMax}) reached`);
          }
          Ss.zone.run(() => actionIfNoSuccess());
        } else {
          Ss.zone.run(() => actionAfterRetry(response));
        }
      } catch (error) {
        if (logError) {
          console.error('Task execution failed:', error);
        }
        Ss.zone.run(() => actionIfNoSuccess());
      }
    };

    Ss.zone.runOutsideAngular(() => executeTask());
  }

  // __________________________________________________________________________________________________
  // Nombre: compare
  // Descripcion : Esta funcion se utiliza para ordenar un arreglo
  // __________________________________________________________________________________________________
  static compare(a: any, b: any, keys: Array<string> | string, order: 'asc' | 'desc' = 'asc') {
    if (typeof keys == 'string') keys = [keys];

    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];

      if (typeof a === 'object' && typeof b === 'object') {
        const valueA = a[key];
        const valueB = b[key];

        if (valueA < valueB) return order === 'asc' ? -1 : 1;
        if (valueA > valueB) return order === 'asc' ? 1 : -1;
      } else {
        if (a === b) continue;
        if (typeof a === 'number' && typeof b === 'number') return order === 'asc' ? a - b : b - a;
        if (typeof a === 'string' && typeof b === 'string') return order === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
        if (a instanceof Date && b instanceof Date) return order === 'asc' ? a.getTime() - b.getTime() : b.getTime() - a.getTime();
      }
    }

    return 0;
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
    return new Promise(resolve => {
      try {
        localStorage.removeItem('access-token');
        localStorage.removeItem('client');
        localStorage.removeItem('content-type');
        localStorage.removeItem('expiry');
        localStorage.removeItem('token-type');
        localStorage.removeItem('uid');

        // Resetear el estado del guard y limpiar cache
        const authGuard = fun.getAuthGuardInstance();
        const currentUserService = fun.getCurrentUserServiceInstance();

        if (authGuard) authGuard.resetValidation();
        if (currentUserService) currentUserService.clearValidationCache();

        Ss.layServ.nextLogOut(undefined);
        resolve(true);
      } catch (error) {
        resolve(false);
      }
    });
  }

  static decryptConfigPassword(str) {
    const str_remplace = btoa(str);
    
    const config: ConfigI = Ss.configServ.config;
    return str_remplace == config.config_password.replace('VMj$pt30r=', '=');
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
    if (Ss.sharedServ.canToast) Ss.toastr.info(msg || '', titulo || '', { enableHtml: true });
  }

  static toastSuccess(msg?, titulo = 'CORRECTO') {
    if (Ss.sharedServ.canToast) Ss.toastr.success(msg || '', titulo || '', { enableHtml: true });
  }

  static toastError(msg?, titulo = 'ERROR') {
    if (Ss.sharedServ.canToast) Ss.toastr.error(msg || '', titulo || '', { enableHtml: true });
  }

  static toastWarning(msg?, titulo = 'AVISO') {
    if (Ss.sharedServ.canToast) Ss.toastr.warning(msg || '', titulo || '', { enableHtml: true });
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
  // LODASH
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

  // __________________________________________________________________________________________________
  // Nombre: pushAt
  // Descripcion : Esta funcion agrega un item en un indice especificado de un arreglo
  // _________________________________________________________________________________________________
  static pushAt(arr, index, newItem) {
    const copyArr = fun.deepCloning(arr);
    arr.length = 0;
    const newArr = [...copyArr.slice(0, index), newItem, ...copyArr.slice(index)];
    newArr.forEach(item => arr.push(item));
  }

  // __________________________________________________________________________________________________
  // Nombre: pull
  // Descripcion : Esta funcion remueve un item  de un arreglo
  // _________________________________________________________________________________________________
  static pull(array, item_remove) {
    const index = array.findIndex(item => fun.isEqual(item, item_remove));
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
    return prop.split('.').reduce((objeto, property) => objeto?.[property], obj);
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
  static pick(obj: any, props: Array<string>): any {
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

  // Métodos helper para obtener instancias de servicios
  private static authGuardInstance: any = null;
  private static currentUserServiceInstance: any = null;

  static setAuthGuardInstance(instance: any) {
    fun.authGuardInstance = instance;
  }

  static getAuthGuardInstance() {
    return fun.authGuardInstance;
  }

  static setCurrentUserServiceInstance(instance: any) {
    fun.currentUserServiceInstance = instance;
  }

  static getCurrentUserServiceInstance() {
    return fun.currentUserServiceInstance;
  }
}
