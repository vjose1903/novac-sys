import { Injectable, NgZone } from '@angular/core';
import { DocumentosC } from '../typescript/documentos_de_identidad';

@Injectable({
  providedIn: 'root',
})
export class FunctionService {
  canToast = false;

  currentUser = null;

  constructor() {}

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
      btn_side.setAttribute('data-cant-facturas', facturas.length);
    }
  }

  // __________________________________________________________________________________________________
  // Nombre: getPersonaByDocIdentidad
  // Descripcion : Esta funcion busca una persona sea empleado, cliente o suplidor por su documento de identidad
  // _________________________________________________________________________________________________

  getPersonaByDocIdentidad(params: { documento: any; tipo: 'cedula' | 'rnc'; tabla_origen: 'user' | 'cliente' | 'suplidor' }) {
    return new Promise((resolve, reject) => {
      let extra = { afterPath: 'persona', parameters: {} };

      extra['parameters'] = { all: true, documentos_de_identidad: true, filter_key: 'cedula', filter_value: params.documento, tabla_origen: params.tabla_origen };

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
      }, 150);
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
}
