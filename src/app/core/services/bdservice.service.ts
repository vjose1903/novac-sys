import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root',
})
export class DBservice {
  // url = 'http://vjose.ddns.net:3000';
  url = 'http://localhost:3000';

  constructor(private http: HttpClient, private toastr: ToastrService, private router: Router) {}
  peticion(ruta: string, metodo: string, json?: string): Observable<any> {
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
  // FActuras
  // =====================================================================
  getFacturas() {
    return this.peticion('cabecera_facturas', 'get');
  }
  getFacturaById(id) {
    return this.peticion(`cabecera_facturas/${id}`, 'get');
  }

  createFacturas(arg) {
    return this.peticion('cabecera_facturas', 'post', JSON.stringify(arg));
  }
  // =====================================================================
  // CLIENTES
  // =====================================================================
  getClientes() {
    return this.peticion('clientes', 'get');
  }
  createCliente(arg) {
    return this.peticion('clientes', 'post', JSON.stringify(arg));
  }
  // =====================================================================
  // USUARIOS
  // =====================================================================

  getEmpleados() {}

  createEmpleados(arg) {
    return this.peticion('empleados/register', 'post', JSON.stringify(arg));
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
  // ARTICULOS
  // =====================================================================

  createArticulo(arg) {
    return this.peticion('articulos', 'post', JSON.stringify(arg));
  }
  getArticulos() {
    return this.peticion('articulos', 'get');
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
  // FACTURAS
  // =====================================================================
  getTiposFacturas() {
    return this.peticion('tipo_facturas', 'get');
  }
  getSecuenciaFacturas() {
    return this.peticion('secuencia_facturas', 'get');
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
