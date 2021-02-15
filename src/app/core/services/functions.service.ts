import { Injectable } from '@angular/core';

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
    console.log(`%c ${text}`, 'background: #00000000; color: #5580da', body ? body : '');
  }

  logYellow(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #dada55', body ? body : '');
  }

  logRed(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #da555f', body ? body : '');
  }

  logGreen(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #55da56', body ? body : '');
  }
}
