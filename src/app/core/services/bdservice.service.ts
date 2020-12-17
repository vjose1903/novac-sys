import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfig } from '../../../environments/environment';
import * as _ from 'lodash';
import { FunctionService } from './functions.service';
@Injectable({
  providedIn: 'root',
})
export class DBservice {
  url = AppConfig.url_server;
  ultimoMensajeMostrado: any;

  constructor(private http: HttpClient, private toastr: ToastrService, private router: Router, private fun: FunctionService) {}

  peticion(ruta: string, metodo: string, json?: string): Observable<any> {
    const xhttp = new XMLHttpRequest();
    if (metodo === 'get' || metodo === 'delete') {
      return this.http[metodo](`${this.url}/${ruta}`, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'Application/json',
        },
      });
    } else {
      return this.http[metodo](`${this.url}/${ruta}`, json || '', {
        headers: {
          'Content-Type': 'application/json',
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
          Accept: 'Application/json',
        },
        params: { spinner: 'no' },
      }).pipe(
        map((val) => {
          // set obs false

          return val;
        }),
      );
    } else {
      return this.http[metodo](`${this.url}/${ruta}`, json || '', {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'Application/json',
        },
        params: { spinner: 'no' },
      }).pipe(
        map((val) => {
          // set obs false
          return val;
        }),
      );
    }
  }

  // peticion(ruta: string, metodo: string, json?: string): Observable<any> {
  //   if (metodo === 'get' || metodo === 'delete') {
  //     return this.http[metodo](`${this.url}/${ruta}`);
  //   } else {

  //     return this.http[metodo](`${this.url}/${ruta}`, json || '', {
  //       headers: {
  //         'Conten-Type': 'application/json',
  //         Accept: 'Application/json',
  //       },
  //     });
  //   }
  // }

  // peticionSinLoad(ruta: string, metodo: string, json?: string): Observable<any> {
  //   // set obs true
  //   if (metodo === 'get' || metodo === 'delete') {
  //     return this.http[metodo](`${this.url}/${ruta}`, {
  //       params: { spinner: 'no' },
  //     });
  //   } else {
  //     return this.http[metodo](`${this.url}/${ruta}`, json || '', {
  //       params: { spinner: 'no' },
  //     });
  //   }
  // }

  async validateToken() {
    return await this.peticion('auth/validate_token', 'get').toPromise();
  }

  async login(arg) {
    return await this.peticion('auth/sign_in', 'post', arg).toPromise();
  }

  // =====================================================================
  // Reportes
  // =====================================================================

  createCuadreCaja() {
    return this.peticion('cuadre_cajas/custom/nuevo', 'post', JSON.stringify({}));
  }

  makeReportes(tipo, params) {
    return this.peticion(`reporte/${tipo}?${params}`, 'get');
  }

  reporteVentas(tipo, condicion, desde = ' ', hasta = ' ') {
    return this.peticion(`reporte/ventas/${tipo}/${condicion}/${desde}/${hasta}`, 'get');
  }

  // =====================================================================
  // Conduce
  // =====================================================================

  createConduce(arg) {
    return this.peticion('cabecera_conduces', 'post', JSON.stringify(arg));
  }

  // =====================================================================
  // Facturas
  // =====================================================================
  createFacturas(arg) {
    return this.peticion('cabecera_facturas', 'post', JSON.stringify(arg));
  }

  editarFactura(id, arg) {
    return this.peticion(`cabecera_facturas/custom/update/${id}`, 'patch', JSON.stringify(arg));
  }

  getViajesByCompletada(arg, page, per_page, paginado, estado = false) {
    return this.peticionSinLoad(`cabecera_facturas/custom/viajes/${estado}/${arg}?page=${page}&per_page=${per_page}&paginado=${paginado}`, 'get');
  }

  getFacturas() {
    return this.peticion('cabecera_facturas', 'get');
  }

  getFacturaById(id, params = '') {
    return this.peticion(`cabecera_facturas/${id}${params}`, 'get');
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

  getPaquetesNCFFiltrados(arg, page, per_page, paginado) {
    return this.peticionSinLoad(`secuencia_comprobantes/filtro/${arg}?page=${page}&per_page=${per_page}&paginado=${paginado}`, 'get');
  }

  // =====================================================================
  // HISTORICO PRODUCCIONES
  // =====================================================================
  getProducciones() {
    return this.peticion('producciones', 'get');
  }
  createProduccion(arg) {
    return this.peticion('producciones', 'post', JSON.stringify(arg));
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

  getClientesFiltrados(arg, page, per_page, paginado) {
    return this.peticionSinLoad(`clientes/filtro/${arg}?page=${page}&per_page=${per_page}&paginado=${paginado}`, 'get');
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

  getSuplidoresFiltrados(arg, page, per_page, paginado) {
    return this.peticionSinLoad(`suplidores/filtro/${arg}?page=${page}&per_page=${per_page}&paginado=${paginado}`, 'get');
  }

  // =====================================================================
  // USUARIOS
  // =====================================================================

  getEmpleadosNames() {
    return this.peticion('users/custom/names', 'get');
  }

  getEmpleados() {
    return this.peticion('users', 'get');
  }
  getUserByRole(role) {
    return this.peticion(`users/by_role/${role}`, 'get');
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

  getEmpleadosFiltrados(arg, page, per_page, paginado) {
    return this.peticionSinLoad(`users/filtro/${arg}?page=${page}&per_page=${per_page}&paginado=${paginado}`, 'get');
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

  getCantidadInventario() {
    return this.peticionSinLoad(`articulos/custom/cantidad_inventario`, 'get');
  }

  getCostoArticulo(id, tipo = 'lbs') {
    return this.peticionSinLoad(`articulos/custom/costo/${tipo}/${id}`, 'get');
  }

  getContenidosArticulos(id) {
    return this.peticion(`articulos/get/contenidos/${id}`, 'get');
  }

  getProductosTerminados(id) {
    return this.peticion(`articulos/custom/productos_terminados`, 'get');
  }

  getIngredienteExcede(id, cantidad) {
    return this.peticionSinLoad(`articulos/check_excede/${id}?cantidad=${cantidad}`, 'get');
  }

  getIngredientesFormula(id) {
    return this.peticion(`articulos/ingredientes/${id}`, 'get');
  }

  getArticulosFiltrados(arg, page, per_page, paginado, compra = false, fecha, tipo = 'todos') {
    return this.peticionSinLoad(
      `articulos/filtro/${arg}?page=${page}&per_page=${per_page}&paginado=${paginado}&is_compra=${compra}&tipo=${tipo}&fecha=${fecha}`,
      'get',
    );
  }
  // getArticulosFiltrados(arg, page, per_page, paginado, compra = false, tipo = 'todos') {
  //   return this.peticionSinLoad(`articulos/filtro/${arg}?page=${page}&per_page=${per_page}&paginado=${paginado}&is_compra=${compra}&tipo=${tipo}`, 'get');
  // }

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

  getMateriasPrimas() {
    return this.peticion('articulos/custom/materias_primas', 'get');
  }

  getArticulosByDate(date) {
    return this.peticion(`articulos/historico/${date}`, 'get');
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

  // =====================================================================
  // RECIBOS
  // =====================================================================
  getTiposRecibos() {
    return this.peticion('tipo_recibos', 'get');
  }
  createRecibo(arg) {
    return this.peticion('recibos_ingresos', 'post', JSON.stringify(arg));
  }

  revertirLastReciboByFacturaId(id) {
    return this.peticion(`recibos_ingresos/revertir/${id}`, 'get');
  }

  // =====================================================================
  // NOTAS
  // =====================================================================

  getCantidadDevuelto(aplicadaA) {
    return this.peticion(`cabecera_facturas/custom/get_cantidad_devuelto/${aplicadaA}`, 'get');
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

  getFacturasByClienteIdAndPagada(cliente_id, pagada, page, per_page, paginado) {
    return this.peticion(`cabecera_facturas/cliente/${cliente_id}/pagada/${pagada}?page=${page}&per_page=${per_page}&paginado=${paginado}`, 'get');
  }

  getFacturasByParams(campo, valor, tipo_factura_id, adelantada = false, page, per_page, paginado) {
    const valor_enc = btoa(valor);
    const VALOR_ENC = _.replace(valor_enc, '\\', '&^IC');
    return this.peticion(
      `cabecera_facturas/params/${campo}/${VALOR_ENC}/${tipo_factura_id}/${adelantada}?page=${page}&per_page=${per_page}&paginado=${paginado}`,
      'get',
    );
  }
  cancelarFactura(id) {
    return this.peticion(`cabecera_facturas/anular_factura/${id}`, 'post', JSON.stringify({}));
  }

  // =====================================================================
  // MARCAS
  // =====================================================================

  getMarcas() {
    return this.peticion(`marcas`, 'get');
  }

  updateMarca(arg) {
    const id = arg.id;

    return this.peticion('marcas/' + id, 'patch', JSON.stringify(arg));
  }

  createMarca(arg) {
    return this.peticion('marcas', 'post', JSON.stringify(arg));
  }

  getMarcasFiltradas(arg, page, per_page, paginado) {
    return this.peticionSinLoad(`marcas/filtro/${arg}?page=${page}&per_page=${per_page}&paginado=${paginado}`, 'get');
  }

  // =====================================================================
  // MODELOS
  // =====================================================================

  createModelo(arg) {
    return this.peticion('modelos', 'post', JSON.stringify(arg));
  }

  updateModelo(arg) {
    const id = arg.id;
    return this.peticion('modelos/' + id, 'patch', JSON.stringify(arg));
  }

  getModelosFiltrados(arg, page, per_page, paginado) {
    return this.peticionSinLoad(`modelos/filtro/${arg}?page=${page}&per_page=${per_page}&paginado=${paginado}`, 'get');
  }

  getModelos(page, per_page, paginado) {
    return this.peticionSinLoad(`modelos?page=${page}&per_page=${per_page}&paginado=${paginado}`, 'get');
  }

  getModelosByMarca(marca) {
    return this.peticionSinLoad(`modelos/por_marca/${marca}`, 'get');
  }

  // =====================================================================
  // CAMIONES
  // =====================================================================
  createVehiculos(arg) {
    return this.peticion('vehiculos', 'post', JSON.stringify(arg));
  }

  updateVehiculos(arg) {
    const id = arg.id;
    return this.peticion('vehiculos/' + id, 'patch', JSON.stringify(arg));
  }

  getVehiculosFiltrados(arg, page, per_page, paginado) {
    return this.peticionSinLoad(`vehiculos/filtro/${arg}?page=${page}&per_page=${per_page}&paginado=${paginado}`, 'get');
  }

  eliminarVehiculo(arg) {
    const id = arg.id;
    const body = _.omit(arg, ['id']);
    return this.peticion('vehiculos/delete/' + id, 'patch', JSON.stringify(null));
  }
  // =====================================================================
  // DELETE
  // =====================================================================
  deleteItem(id, item) {
    return this.peticion(`${item}/${id}`, 'delete');
  }

  // =====================================================================
  // TOASTS
  // =====================================================================
  toastSuccess(msg?, titulo?, excepcion = true) {
    if (this.fun.canToast) {
      const msg_ = msg;
      if (this.ultimoMensajeMostrado !== msg_ || excepcion) {
        this.ultimoMensajeMostrado = msg_;
        this.toastr.success(msg || '', titulo || '');
      }
    }
  }

  toastError(msg?, titulo?, excepcion?) {
    if (this.fun.canToast) {
      const msg_ = msg;

      if (this.ultimoMensajeMostrado !== msg_ || excepcion) {
        this.ultimoMensajeMostrado = msg_;
        this.toastr.error(msg || '', titulo || '');
      }
    }
  }

  toastWarning(msg?, titulo?, excepcion?) {
    if (this.fun.canToast) {
      const msg_ = msg;
      if (this.ultimoMensajeMostrado !== msg_ || excepcion) {
        this.ultimoMensajeMostrado = msg_;
        this.toastr.warning(msg || '', titulo || '');
      }
    }
  }
}
