import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { ModalService } from '../../components/modal/modal.service';
import { DBservice } from '../../core/services/bdservice.service';
import { map, filter } from 'rxjs/operators';
import * as _ from 'lodash';
import { ObservableServcie } from '../../core/services/observables.service';
import { PdfService } from '../../core/services/pdf/pdf.service';
import { IpcService } from '../../core/services/ipc.service';
import { CuerpoFacturaComponent } from './cuerpo-factura/cuerpo-factura.component';
import { GLOBAL } from '../../core/services/GLOBAL';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.scss'],
})
export class FacturacionComponent implements OnInit, OnDestroy {
  form: FormGroup;
  fecha;
  tipoVenta = 'false';
  ITBIS = 0;
  seleccionModal;
  showModal = false;
  modalSearch: boolean;
  control;

  tipoModal: string;
  condicion_fact = 'Contado';
  forma_pago = 'Efectivo';
  element: HTMLElement;
  listaClientes;
  propietario_factura;
  tipos_facturas = [];
  public TiposFacturas: string;
  showTipos: boolean;
  tipoFactura;
  CuerpoFactura = [];
  DESCUENTO = 0.0;
  BRUTO = 0.0;
  TOTAL = 0.0;
  lista_tipos_facturas;
  NCFcompra;
  CostoYgasto = '';
  metodo: any;
  labelSearch: string;
  listaSuplidores: any;
  TiposCostosGastos: string;
  tipos_costosYgastos: string[];
  medidas = {
    Libra: 'Libras',
    Quintal: 'Quintales',
    Caja: 'Cajas',
    Paquete: 'Paquetes',
    Unidad: 'Unidades',
  };
  listaArticulos: any;
  usuario: any;

  @ViewChild(CuerpoFacturaComponent, { static: true }) cuerpo: CuerpoFacturaComponent;
  ncfMask = [/b/, /[0-9]/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/];
  Devuelta = 0;

  subObj: Subscription;
  subDeci: Subscription;
  subTipoF: Subscription;
  subSecu: Subscription;
  FacturaAtrasada = false;
  FechaFacturaAtrasada;

  constructor(
    private _ipc: IpcService,
    private mServ: ModalService,
    private obsServ: ObservableServcie,
    private dbServ: DBservice,
    private fb: FormBuilder,
    private pdfServ: PdfService,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      id: [],
      nombre: [],
      direccion: [],
      telefono: [],
    });
  }

  formatoNumero(num) {
    return GLOBAL.formatearNumero(GLOBAL.redondearAdos(num)) + '  ';
  }

  ngOnInit() {
    this.usuario = JSON.parse(this.dbServ.getEmpleado());
    this.GetArticulos();

    this.metodo = this.route.snapshot.params['tipo'];

    this.propietario_factura = null;

    if (this.metodo === 'venta') {
      this.tipoFactura = '02';
      this.TiposFacturas =
        '<div style=" max-width: 21rem;" > \
      <span>00 Factura sin comprobante</span><br>\
      <span>01 Valor fiscal</span><br>\
      <span>02 Factura de consumo</span><br>\
      <span>03 Nota de debito</span><br>\
      <span>04 Nota de credito</span><br>\
      <span>11 Comprobante de compras</span><br>\
      <span>12 Registro de unico ingreso</span><br>\
      <span>13 Comprobante para gastos menores</span><br>\
      <span>14 Comprobante de regimen especiales</span><br>\
      <span>15 Comprobante gubernamental</span><br>\
      <span>16 Comprobante para exportaciones</span><br>\
      <span>17 Comprobantes para pago al exterior</span><br>\
      </div>';
      this.tipos_facturas = ['00', '01', '02', '03', '04', '11', '12', '13', '14', '15', '16', '17'];
      this.labelSearch = 'Cliente';
      this.form.patchValue({
        id: 1,
        nombre: 'Cliente contado',
        direccion: 'Autopista duarte KM 0 el Higuero',
      });
    } else {
      this.tipoFactura = '01';
      this.TiposFacturas = '<div style=" max-width: 21rem;" > \
      <span>01 Valor fiscal</span><br>\
      <span>02 Factura de consumo</span><br>\
      </div>';

      this.TiposCostosGastos =
        '<div style=" max-width: 30rem; min-width: 30rem;" > \
      <span>1 Gastos de personal </span><br>\
      <span>2 Gastos de trabajos, suministros y servicios</span><br>\
      <span>3 Arrendamientos</span><br>\
      <span>4 Gastos de activos fijos</span><br>\
      <span>5 Gastos de representación</span><br>\
      <span>6 Gastos deducciones admitidas</span><br>\
      <span>7 Gastos financieros</span><br>\
      <span>8 Gastos extraordinarios</span><br>\
      <span>9 Compras y gastos que forman parte del costo de venta</span><br>\
      <span>10 Adquisiciones de activos</span><br>\
      <span>11 Gastos de Seguros</span><br>\
      </div>';
      this.tipos_facturas = ['01', '02'];
      this.tipos_costosYgastos = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
      this.labelSearch = 'Suplidor';
    }
    this.fecha = moment().format('DD/MM/YYYY');
    // this.fecha = moment().format('DD/MM/YYYY');

    this.subObj = this.mServ.OBJDEVUELTO.subscribe(res => {
      if (res && res.tipoModal === 'buscarCliente') {
        this.propietario_factura = res;
        this.form.patchValue(this.propietario_factura);
        this.enfocarInput('cod-0');
        this.mServ.ModalObj(undefined);
        const balance = _.parseInt(this.propietario_factura.balance);
        const maxCred = _.parseInt(this.propietario_factura.maximo_credito);

        if (balance > maxCred - 1000 && balance < maxCred) {
          this.dbServ.toastWarning(`Credito actual RD$${this.formatoNumero(balance)}  limite: RD$${this.formatoNumero(maxCred)}`, 'PROXIMO A LIMITE DE CREDITO');
        } else if (balance > maxCred) {
          this.dbServ.toastError(` Credito actual RD$${this.formatoNumero(balance)}            limite: RD$${this.formatoNumero(maxCred)}`, 'SOBRE VALOR DE CREDITO');
        }
      } else if (res && res.tipoModal === 'cambio') {
        this.Devuelta = res.devuelta;
        this.forma_pago = res.forma_pago;
        this.IMPRIMIR();
        this.mServ.ModalObj(undefined);
      }
    });
    this.subDeci = this.mServ.DECISIONMODAL.subscribe(res => {
      if (res !== undefined) {
        this.decisionModal(res);
        this.mServ.ModalDecision(undefined);
      }
      if (res !== undefined && res.bool) {
        this.filterArticulosByDate(res.Date);
        this.mServ.ModalDecision(undefined);
      }
    });

    if (this.metodo === 'compra') {
      this.dbServ
        .getSuplidores()
        .pipe(
          map(
            val =>
              (val = val.map(suplidor => {
                suplidor.documentos_de_identidad.map(docu => {
                  if (docu.principal) {
                    suplidor.documento_identidad = docu.documento;
                  }
                });
                suplidor.codigo = _.padStart(suplidor.id, 5, '0');
                return suplidor;
              })),
          ),
        )
        .subscribe(res => {
          this.listaSuplidores = JSON.parse(JSON.stringify(res));
        });
    } else {
      this.dbServ
        .getClientes()
        .pipe(
          map(
            cliente =>
              (cliente = cliente.map(cli => {
                cli.documentos_de_identidad.map(docu => {
                  if (docu.principal) {
                    cli.documento_identidad = docu.documento;
                  }
                });
                return cli;
              })),
          ),
        )
        .subscribe(res => {
          this.listaClientes = res;
        });
    }

    setTimeout(() => {
      this.enfocarInput('tipoFact');
    }, 5);

    this.subTipoF = this.dbServ.getTiposFacturas().subscribe(res => {
      this.lista_tipos_facturas = res;
    });

    this.subSecu = this.obsServ.SECUENCIA_FACTURAS.subscribe(res => {
      if (res !== undefined) {
        // this.secuenciaVenta = res.filter(secu => secu.tipo_factura_id === 13);
        // this.numFac = this.secuenciaVenta[0].secuencia;
      }
    });
  }
  ngOnDestroy(): void {
    this.mServ.ModalObj(null);
    this.mServ.modalTipo(null);
    this.mServ.ModalSeleccion(null);
    this.CancelarFactura();
    this.GetArticulos();
    this.subObj.unsubscribe();
    this.subDeci.unsubscribe();
    this.subTipoF.unsubscribe();
    this.subSecu.unsubscribe();
  }

  setWidthPop(bool, e) {
    e.select();
    if (bool) {
      document.documentElement.style.setProperty('--popInfo', '17rem');
    } else {
      document.documentElement.style.setProperty('--popInfo', '25rem');
    }
  }
  GetArticulos() {
    this.dbServ.getArticulos().subscribe(res => {
      res.sort((a, b) => {
        return a.id > b.id ? 1 : -1;
      });

      if (res !== undefined && res !== null) {
        this.listaArticulos = res;
      }
    });
  }
  getCalculos(arg) {
    this.TOTAL = parseFloat(arg.Total);
    this.calcularBruto();
  }
  getDescuento(arg) {
    this.DESCUENTO = parseFloat(arg);

    this.calcularBruto();
  }

  calcularBruto() {
    setTimeout(() => {
      const calculo = this.TOTAL + this.DESCUENTO;

      this.BRUTO = calculo;
    }, 5);
  }

  verTipos() {
    this.showTipos = false;
  }
  ocultarTipos() {
    this.showTipos = true;
  }
  validarRayaAbajo() {
    if (this.NCFcompra && this.NCFcompra !== null) {
      let char = '';
      let num = 0;
      for (let index = 0; index < this.NCFcompra.length; index++) {
        const c = this.NCFcompra.charAt(index);
        char = c;
        num = index;
      }

      if (num < 10 || char === '_') {
        return false;
      } else {
        return true;
      }
    }
  }

  cambiarTipoVenta(arg) {
    if (arg === 'Crédito') {
      this.tipoVenta = 'false';
    }
  }

  saltar(campo, valor?, salioDe?) {
    if (campo === 'buscarCliente') {
      this.desEnfocarInput(salioDe);
      this.abrirModalFiltro();
    }

    if (campo === 'condicion') {
      if (this.tipos_facturas.includes(valor)) {
        this.tipoFactura = valor;
        this.NCFcompra = 'b' + valor;
        this.enfocarInput(campo);
      } else {
        this.dbServ.toastError('El tipo de factura introducido es incorrecto.', 'ERROR');
      }
    }
    if (campo === 'venta') {
      this.desEnfocarInput(salioDe);
      this.enfocarInput(campo);
    }
    if (campo === 'costo') {
      this.enfocarInput(campo);
    }
    if (campo === 'pago') {
      if (this.metodo === 'compra' && !this.tipos_costosYgastos.includes(valor)) {
        this.dbServ.toastError('El tipo de costo y gasto introducido es incorrecto.', 'ERROR');
      } else {
        this.CostoYgasto = valor;
        if (this.condicion_fact === 'Contado') {
          this.enfocarInput(campo);
        } else {
          if (this.metodo === 'venta') {
            this.enfocarInput('nom');
          } else {
            this.enfocarInput('ncf');
          }
        }
      }
    }
    if (campo === 'nom') {
      if (this.metodo === 'venta') {
        this.enfocarInput('nom');
      } else {
        this.enfocarInput('ncf');
      }
    }
    if (campo === 'filtro') {
      if (this.validarRayaAbajo()) {
        this.abrirModalFiltro();
      } else {
        this.dbServ.toastWarning('Numero de comprobante incorrecto', 'Aviso');
      }
    }

    if (campo === 'dir' && valor !== null) {
      this.enfocarInput(campo);
    }

    if (campo === 'cod-0' && valor !== null) {
      if (this.condicion_fact !== 'Crédito') {
        this.enfocarInput(campo);

        this.propietario_factura = this.form.value;
      } else {
        this.dbServ.toastWarning('Para facturar a credito debe de seleccionar un cliente', 'Aviso');
      }
    }
  }
  setCaretPosition(ctrl, pos) {
    // Modern browsers
    if (ctrl.setSelectionRange) {
      ctrl.focus();
      ctrl.setSelectionRange(pos, pos);

      // IE8 and below
    } else if (ctrl.createTextRange) {
      const range = ctrl.createTextRange();
      range.collapse(true);
      range.moveEnd('character', pos);
      range.moveStart('character', pos);
      range.select();
    }
  }
  pru() {
    const input = document.getElementById('ncf') as any;
  }
  trimEndNcf() {
    const input = document.getElementById('ncf') as any;
    const valor = input.value;

    this.setCaretPosition(input, input.value.length - 8);
    valor.substring(0, 3);
    input.value = valor;
  }

  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.focus();
  }
  desEnfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.blur();
  }

  // =============================================
  //  MODAL PARA FILTRAR CLIENTES & SUPLIDORES
  // =============================================

  abrirModalFiltro() {
    this.mServ.modalTipo('buscarCliente');
    if (this.metodo === 'venta') {
      this.quitarContadoDeLista();
      this.mServ.ModalSeleccion(this.listaClientes);
    } else {
      this.mServ.ModalSeleccion(this.listaSuplidores);
    }
    this.mServ.mostrarModal(true);
  }

  quitarContadoDeLista() {
    const temp = JSON.parse(JSON.stringify(this.listaClientes));
    this.listaClientes = [];
    const cliente = temp.filter(cli => cli.nombre === 'Cliente contado');
    const index = _.indexOf(temp, cliente[0]);

    _.pullAt(temp, index);
    this.listaClientes = temp;
  }

  // =============================================
  //  MODAL CANCELAR
  // =============================================
  cancelarFactura() {
    this.mServ.modalTipo('cancelar');
    this.tipoModal = 'cancelar';
    this.abrirModal();
  }
  // =============================================
  //  MODAL IMPRIMIR
  // =============================================
  imprimirFactura() {
    if (!this.propietario_factura) {
      this.dbServ.toastWarning('Factura no tiene cliente', 'Aviso');
    } else {
      if (this.CuerpoFactura.length === 0) {
        this.dbServ.toastWarning('Factura no tiene Articulos', 'Aviso');
      } else {
        if (this.TOTAL === 0) {
          this.dbServ.toastWarning('Total de la factura no puede ser 0', 'Aviso');
        } else {
          if (this.condicion_fact === 'Crédito') {
            this.mServ.modalTipo('imprimir');
            this.tipoModal = 'imprimir';
            this.abrirModal();
          } else {
            const obj = { total_factura: this.TOTAL, devuelta: 0 };
            this.mServ.modalTipo('cambio');
            this.tipoModal = 'cambio';
            this.abrirModal(obj);
          }
        }
      }
    }
  }

  abrirModal(arg?) {
    if (arg) {
      this.mServ.ModalSeleccion(arg);
    }
    this.mServ.mostrarModal(true);
  }
  decisionModal(arg) {
    if (arg) {
      if (this.tipoModal === 'imprimir') {
        this.IMPRIMIR();
      } else if (this.tipoModal === 'cancelar') {
        this.CancelarFactura();
      }
    }
    this.tipoModal = '';
  }

  // =============================================
  //  OBTENER LA DATA DEL CUERPO
  // =============================================

  isPart(obj) {
    const x = _.findIndex(this.CuerpoFactura, o => {
      return o.des === obj.des;
    });

    return x;
  }

  getCuerpoFactura(arg) {
    this.CuerpoFactura = [];
    const obj = JSON.parse(arg);
    this.CuerpoFactura = obj;
  }

  CancelarFactura() {
    this.propietario_factura = null;
    this.NCFcompra = null;
    this.CostoYgasto = null;
    this.mServ.ModalObj(null);
    this.mServ.modalTipo(null);
    this.mServ.ModalSeleccion(null);
    this.FacturaAtrasada = false;
    this.FechaFacturaAtrasada = null;

    if (this.metodo === 'venta') {
      this.form.patchValue({
        id: 1,
        nombre: 'Cliente contado',
        direccion: 'Autopista duarte KM 0 el Higuero',
        telefono: null,
      });
      this.tipoFactura = '02';
    } else {
      this.tipoFactura = '01';
      this.form.patchValue({
        id: null,
        nombre: null,
        direccion: null,
        telefono: null,
      });
    }

    this.DESCUENTO = 0.0;
    this.BRUTO = 0.0;
    this.TOTAL = 0.0;
    this.condicion_fact = 'Contado';
    this.forma_pago = 'Efectivo';

    this.ITBIS = 0;
    this.cuerpo.RESETCUERPO();
    this.enfocarInput('tipoFact');
  }
  calculatePrice(costo): number {
    if (costo > 0 || costo != null || costo) {
      const precio = costo / 0.9;
      return GLOBAL.desformatear(GLOBAL.redondearAdos(precio));
    }
  }

  calculoMedidaprincipal(roundArticulo, costoRow, precioRow, contenido_articulo, newArticulo) {
    if (roundArticulo !== costoRow) {
      let cantPadre;
      let cantHijo;
      const tempContenido = [];

      precioRow = this.calculatePrice(costoRow);
      if (contenido_articulo.length > 0) {
        contenido_articulo.forEach(contenido => {
          let temporal = contenido;
          if (contenido.condicion === 'padre') {
            if (contenido.precio) {
              cantPadre = contenido.cantidad;
              const precio = this.calcularNuevosPrecios(cantPadre, precioRow);
              const costo = this.calcularNuevosPrecios(cantPadre, costoRow);
              temporal.precio = GLOBAL.desformatear(precio);
              temporal.costo = GLOBAL.desformatear(costo);
            }
          } else {
            if (contenido.precio) {
              cantHijo = contenido.cantidad;
              const prePadre = this.calcularNuevosPrecios(cantPadre, precioRow);
              const cosPadre = this.calcularNuevosPrecios(cantPadre, costoRow);
              const precio = this.calcularNuevosPrecios(cantHijo, GLOBAL.redondearAdos(prePadre));
              const costo = this.calcularNuevosPrecios(cantHijo, GLOBAL.redondearAdos(cosPadre));
              temporal.precio = GLOBAL.desformatear(precio);
              temporal.costo = GLOBAL.desformatear(costo);
            } else {
              temporal = null;
            }
          }
          if (temporal !== null) {
            const tempu = _.omit(temporal, ['created_at', 'updated_at']);
            tempContenido.push(tempu);
          }
        });
      }

      newArticulo.costo_principal = costoRow;
      newArticulo.precio_principal = precioRow;
      newArticulo.contenido_articulos_attributes = tempContenido;
      newArticulo.user_id = this.usuario.id;

      const tempEnviar = _.omit(newArticulo, ['created_at', 'updated_at', 'contenido_articulos']);

      this.dbServ.editarArticulo(tempEnviar).subscribe(
        res => {},
        err => {
          this.mostrarErrores(err.error);
        },
      );
    }
  }

  revisarPrecios(cuerpoFact) {
    const tempCuerpo = [];

    cuerpoFact.forEach(row => {
      const Articulo = this.listaArticulos.filter(art => art.id === row.articulo_id);

      const articulo = JSON.parse(JSON.stringify(Articulo[0]));
      const contenido_articulo = articulo.contenido_articulos;
      const costoRow = GLOBAL.desformatear(row.pre);
      const precioRow = 0;

      const roundArticulo = articulo.costo_principal;

      const newArticulo = JSON.parse(JSON.stringify(articulo));
      let temp = {};
      let costoA;
      let costoR;
      const contenidoPadre = contenido_articulo.filter(cont => cont.condicion === 'padre');
      const contenidoHijo = contenido_articulo.filter(cont => cont.condicion === 'hijo');

      let medidaEs = '';
      if (articulo.medida === row.unidad) {
        medidaEs = 'principal';
      }
      contenido_articulo.forEach(content => {
        if (content.medida === row.unidad) {
          medidaEs = content.condicion;
        }
      });

      if (contenido_articulo.length === 0 || row.unidad === 'Caja' || row.unidad === 'Quintal') {
        this.calculoMedidaprincipal(roundArticulo, costoRow, precioRow, contenido_articulo, newArticulo);
      } else {
        if (medidaEs === 'padre') {
          costoA = contenidoPadre[0].costo * contenidoPadre[0].cantidad;
          costoR = contenidoPadre[0].cantidad * costoRow;
        } else {
          let MaxContenido = 0;
          if (contenido_articulo.length === 1) {
            MaxContenido = contenidoPadre[0].cantidad;
            costoA = contenidoPadre[0].costo * MaxContenido;
          } else {
            MaxContenido = contenidoPadre[0].cantidad * contenidoHijo[0].cantidad;
            costoA = contenidoHijo[0].costo * MaxContenido;
          }
          costoR = MaxContenido * costoRow;
        }
        this.calculoMedidaprincipal(costoA, costoR, precioRow, contenido_articulo, newArticulo);
      }

      temp = _.omit(row, ['costo', 'condicion', 'pre']);
      tempCuerpo.push(temp);
    });
    return tempCuerpo;
  }

  mostrarErrores(arg) {
    for (const error in arg) {
      if (arg.hasOwnProperty(error)) {
        const element = arg[error];
        this.dbServ.toastError(element, 'Error');
      }
    }
  }

  ingresarFecha() {
    this.mServ.modalTipo('pendiente');
    this.tipoModal = 'pendiente';
    this.abrirModal();
  }

  calcularNuevosPrecios(cant, precio) {
    const pre = precio / cant;
    return GLOBAL.redondearAdos(pre);
  }

  async filterArticulosByDate(date) {
    this.FacturaAtrasada = true;
    this.FechaFacturaAtrasada = moment(date).format('DD/MM/YYYY');
    try {
      this.listaArticulos = await this.dbServ.getArticulosByDate(date).toPromise();
    } catch (error) {
      console.log(error);
      this.dbServ.toastError('Algo salio mal buscando historico de articulos', 'ERROR');
    }
  }

  IMPRIMIR() {
    const empleado = JSON.parse(this.dbServ.getEmpleado());
    const TipoFact = this.lista_tipos_facturas.filter(tipo => tipo.referencia === this.tipoFactura);

    const cuerpo_fact = JSON.parse(JSON.stringify(this.CuerpoFactura));

    const cabecera_fact = {};
    cabecera_fact['condicion'] = this.condicion_fact;
    cabecera_fact['forma_pago'] = this.forma_pago;
    cabecera_fact['fecha_facturacion'] = this.FechaFacturaAtrasada ? this.FechaFacturaAtrasada : null;
    if (this.condicion_fact === 'Crédito') {
      cabecera_fact['fecha_vencimiento'] = moment(new Date())
        .add(this.propietario_factura.limite_credito, 'days')
        .format('DD/MM/YYYY');
      cabecera_fact['pagada'] = false;
      cabecera_fact['balance'] = GLOBAL.redondearAdos(this.TOTAL);
      cabecera_fact['devuelta'] = 0;
    } else {
      cabecera_fact['pagada'] = true;
      cabecera_fact['balance'] = 0;
      cabecera_fact['devuelta'] = this.Devuelta;
    }

    cabecera_fact['fecha_valida'] = moment(new Date())
      .add(1, 'year')
      .format('DD/MM/YYYY');

    cabecera_fact['adelantada'] = this.tipoVenta === 'true' ? true : false;
    cabecera_fact['numero_comprobante'] = this.metodo === 'venta' ? null : this.NCFcompra;
    cabecera_fact['costoYgasto'] = this.metodo === 'venta' ? null : this.CostoYgasto;
    cabecera_fact['numero_factura'] = null;
    cabecera_fact['total_factura'] = GLOBAL.redondearAdos(this.TOTAL);
    cabecera_fact['Bruto'] = GLOBAL.redondearAdos(this.BRUTO);
    cabecera_fact['itbis'] = GLOBAL.redondearAdos(this.ITBIS);
    cabecera_fact['descuento'] = GLOBAL.redondearAdos(this.DESCUENTO);
    cabecera_fact['estado'] = true;
    cabecera_fact['tipo_factura_id'] = TipoFact[0].id;
    if (this.metodo === 'venta') {
      if (this.propietario_factura && this.propietario_factura.id === 1) {
        cabecera_fact['cliente_id'] = null;
        cabecera_fact['NoCliente_nombre'] = this.form.controls.nombre.value;
        cabecera_fact['NoCliente_direccion'] = this.form.controls.direccion.value;
      } else {
        cabecera_fact['cliente_id'] = this.propietario_factura.id;
      }
    }

    cabecera_fact['detalle_facturas_attributes'] = cuerpo_fact;
    cabecera_fact['FACTURA_DE'] = this.metodo === 'venta' ? 13 : 14;
    cabecera_fact['tipo'] = this.metodo;
    cabecera_fact['user_id'] = empleado.id;

    if (this.metodo === 'compra') {
      cabecera_fact['suplidor_id'] = this.form.controls.id.value;
      cabecera_fact['detalle_facturas_attributes'] = this.revisarPrecios(cabecera_fact['detalle_facturas_attributes']);
    }

    if (this.metodo === 'venta' && this.propietario_factura.vendedor_id) {
      cabecera_fact['vendedor_id'] = this.propietario_factura.vendedor_id;
    }
    // console.log(cabecera_fact);

    this.dbServ.createFacturas(cabecera_fact).subscribe(
      res => {
        console.log(res);
        this._ipc.on('printRes', (event: Electron.IpcMessageEvent, res) => {
          console.log('printRes=====> ', res);

          if (res.status) {
            this.CancelarFactura();
            this.GetArticulos();
            this.dbServ.toastSuccess(res.msg, 'CORRECTO');
          } else {
            this.dbServ.toastError(res.msg + '   ERROR: ' + res.err, 'ERROR');
          }
        });
        res['FACTURA_DE'] = this.metodo;
        // this._ipc.send('print', res);
      },
      err => {
        this.dbServ.toastError(err.statusText, 'ERROR');
      },
    );
  }
}
