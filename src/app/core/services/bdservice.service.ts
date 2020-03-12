import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';
@Injectable({
  providedIn: 'root',
})
export class DBservice {
  // url = 'http://vjose.ddns.net:3000';
  url = 'http://localhost:3000';

  constructor(private http: HttpClient, private toastr: ToastrService, private router: Router) {}
  peticion(ruta: string, metodo: string, json?: string): Observable<any> {
    const xhttp = new XMLHttpRequest();
    if (metodo === 'get' || metodo === 'delete') {
      return this.http[metodo](`${this.url}/${ruta}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + this.getAuthToken(),
          Accept: 'Application/json',
        },
      });
    } else {
      return this.http[metodo](`${this.url}/${ruta}`, json || '', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + this.getAuthToken(),
          Accept: 'Application/json',
        },
      });
    }
  }

  peticionSinLoad(ruta: string, metodo: string, json?: string): Observable<any> {
    // set obs true
    if (metodo === 'get' || metodo === 'delete') {
      return this.http[metodo](`${this.url}/${ruta}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + this.getAuthToken(),
          Accept: 'Application/json',
        },
        params: { spinner: 'no' },
      }).pipe(
        map(val => {
          // set obs false

          return val;
        }),
      );
    } else {
      return this.http[metodo](`${this.url}/${ruta}`, json || '', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + this.getAuthToken(),
          Accept: 'Application/json',
        },
        params: { spinner: 'no' },
      }).pipe(
        map(val => {
          // set obs false
          return val;
        }),
      );
    }
  }

  getAuthToken() {
    return localStorage.getItem('token') || '';
  }
  saveAuthUser(userInfo) {
    // localStorage.setIteADMm('token', token);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  }

  login(arg): Observable<any> {
    return this.peticion('auth/sign_in', 'post', arg).pipe(
      map(val => {
        if (val.data) {
          this.saveAuthUser(val.data);
          this.router.navigate(['/admin']);
        }
        return val;
      }),
    );
  }

  // =====================================================================
  // Facturas
  // =====================================================================
  createFacturas(arg) {
    return this.peticion('cabecera_facturas', 'post', JSON.stringify(arg));
  }
  getFacturas() {
    return this.peticion('cabecera_facturas', 'get');
  }
  getFacturaById(id) {
    return this.peticion(`cabecera_facturas/${id}`, 'get');
  }

  // =====================================================================
  // NUMERO DE COMPROBANTE FISCAL
  // =====================================================================
  PaqueteNCF(arg) {
    let url = '';
    let metodo = 'post';
    if (arg.id) {
      url = `secuencia_comprobantes/${arg.id}`;
      metodo = 'put';
    } else {
      url = 'secuencia_comprobantes';
    }
    return this.peticion(url, metodo, JSON.stringify(arg));
  }
  getNCFregistrados() {
    return this.peticion(`secuencia_comprobantes`, 'get');
  }
  deleteNCF(id) {
    return this.peticion(`secuencia_comprobantes/${id}`, 'delete');
  }
  getPaquetesNCF(tipo_factura_id, estado = true) {
    return this.peticionSinLoad(`paqueteNCF/${tipo_factura_id}/${estado}`, 'get');
  }

  // =====================================================================
  // HISTORICO PRODUCCIONES
  // =====================================================================
  getProducciones() {
    return this.peticion('historico_produccions', 'get');
  }
  createProduccion(arg) {
    return this.peticion('historico_produccions', 'post', JSON.stringify(arg));
  }

  // =====================================================================
  // CLIENTES
  // =====================================================================
  getClienteById(id) {
    return this.peticion(`clientes/${id}`, 'get');
  }
  getClientes() {
    return this.peticion('clientes', 'get');
  }
  createCliente(arg) {
    return this.peticion('clientes', 'post', JSON.stringify(arg));
  }
  editarCliente(arg) {
    return this.peticion('clientes/' + arg.id, 'put', JSON.stringify(arg));
  }
  // =====================================================================
  // SUPLIDORES
  // =====================================================================
  getSuplidores() {
    return this.peticion('suplidores', 'get');
  }
  getNombresSuplidores() {
    return this.peticion('nombreSuplidores', 'get');
  }
  createSuplidor(arg) {
    return this.peticion('suplidores', 'post', JSON.stringify(arg));
  }
  editarSuplidor(arg) {
    return this.peticion('suplidores/' + arg.id, 'patch', JSON.stringify(arg));
  }

  // =====================================================================
  // USUARIOS
  // =====================================================================

  getEmpleados() {
    return this.peticion('users', 'get');
  }
  getVendedores() {
    return this.peticion('users/vendedores', 'get');
  }

  updateEmpleados(arg) {
    return this.peticion('auth', 'patch', JSON.stringify(arg));
  }
  createEmpleados(arg) {
    return this.peticion('auth', 'post', JSON.stringify(arg));
  }

  getEmpleado() {
    return localStorage.getItem('userInfo') || '';
  }

  // =====================================================================
  //  ARCHIVOS
  // =====================================================================

  subirFoto(arg) {
    return this.peticion('imagenes', 'post', JSON.stringify(arg));
  }
  // =====================================================================
  // MOVIMIENTOS INVENTARIOS
  // =====================================================================

  createMovimientoI(arg) {
    return this.peticion('movimientos_inventarios', 'post', JSON.stringify(arg));
  }
  // =====================================================================
  // ARTICULOS
  // =====================================================================

  createArticulo(arg) {
    return this.peticion('articulos', 'post', JSON.stringify(arg));
  }
  editarArticulo(arg) {
    const id = arg.id;
    const body = _.omit(arg, ['id']);
    return this.peticion('articulos/' + id, 'patch', JSON.stringify(body));
  }
  eliminarArticulo(arg) {
    const id = arg.id;
    const body = _.omit(arg, ['id']);
    return this.peticion('articulos/delete/' + id, 'patch', JSON.stringify(null));
  }
  getArticulos() {
    return this.peticion('articulos', 'get');
  }
  getArticulosByDate(date) {
    return this.peticion(`articulos/historico/${date}/0`, 'get');
  }
  getTipoArticuloById(id) {
    return this.peticionSinLoad(`tipo_articulos/${id}`, 'get');
  }
  getTipoArticulos() {
    return this.peticion('tipo_articulos', 'get');
  }
  getOneArticulo(id: number | string) {
    return this.peticion(`articulos/${id}`, 'get');
  }
  getOneArticuloByCodigo(codigo: number | string) {
    return this.peticion(`articulo/codigo/${codigo}`, 'get');
  }
  CountArticulos() {
    return this.peticion('articulo/cant', 'get');
  }

  // =====================================================================
  // RECIBOS
  // =====================================================================
  getTiposRecibos() {
    return this.peticion('tipo_recibos', 'get');
  }
  createRecibo(arg) {
    return this.peticion('recibos_ingresos', 'post', JSON.stringify(arg));
  }
  // =====================================================================
  // FACTURAS
  // =====================================================================
  getTiposFacturas() {
    return this.peticion('tipo_facturas', 'get');
  }
  getSecuenciaFacturas() {
    return this.peticion('secuencia_facturas', 'get');
  }
  getFacturasByClienteIdAndPagada(cliente_id, pagada) {
    return this.peticion(`cabecera_facturas/cliente/${cliente_id}/pagada/${pagada}`, 'get');
  }
  getFacturasByParams(campo, valor) {
    const valor_enc = btoa(valor);
    const VALOR_ENC = _.replace(valor_enc, '\\', '&^IC');
    return this.peticion(`cabecera_facturas/params/${campo}/${VALOR_ENC}`, 'get');
  }
  cancelarFactura(id) {
    return this.peticion(`cabecera_facturas/cancelar_factura/${id}`, 'post', JSON.stringify({}));
  }

  // =====================================================================
  // TOASTS
  // =====================================================================
  toastSuccess(msg?, titulo?) {
    this.toastr.success(msg || '', titulo || '');
  }
  toastError(msg?, titulo?) {
    this.toastr.error(msg || '', titulo || '');
  }
  toastWarning(msg?, titulo?) {
    this.toastr.warning(msg || '', titulo || '');
  }
}
