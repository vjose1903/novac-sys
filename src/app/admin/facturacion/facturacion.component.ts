import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { DBservice } from '../../core/services/bdservice.service';
import { map, filter } from 'rxjs/operators';
import * as _ from 'lodash';
import { PdfService } from '../../core/services/pdf/pdf.service';
import { IpcService } from '../../core/services/ipc.service';
import { CuerpoFacturaComponent } from './cuerpo-factura/cuerpo-factura.component';
import { GLOBAL } from '../../core/services/GLOBAL';
import { Subscription } from 'rxjs';
import { ModalService } from '../components/modal/modal.service';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { FunctionService } from '../../core/services/functions.service';

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.scss'],
})
export class FacturacionComponent implements OnInit, OnDestroy {
  hora: number;
  minutos: number;
  fecha_busqueda_articulos: string;
  time: { hour: number; minute: number };
  FechaFactura: string;
  FechaFacturaMostrar: string;
  @HostListener('window:keydown', ['$event'])
  @HostListener('window:keyup', ['$event'])
  handleKeyboardEvent(event: any) {
    // arriba 38
    // abajo 40
    // enter 13
    // control 17
    // shift 16
    // alt 18
    event.stopPropagation();
    const key = event.keyCode;

    if (event.type === 'keydown') {
      if (!this.secuenciaKeys.includes(key)) {
        this.secuenciaKeys.push(key);
      }
    } else if (event.type === 'keyup') {
      const conbinacion = _.join(this.secuenciaKeys, '_');
      this.secuenciaKeys = [];

      if (conbinacion === '17_80') {
        this.imprimirFactura();
      }
    }
  }

  secuenciaKeys = [];

  form: FormGroup;
  fecha;
  modo_factura = 'normal';
  is_adelantada = false;
  is_viaje = false;
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
  // listaArticulos: any;
  usuario: any;
  public dpConfig: Partial<BsDatepickerConfig> = new BsDatepickerConfig();
  @ViewChild(CuerpoFacturaComponent, { static: true }) cuerpo: CuerpoFacturaComponent;
  ncfMask = [/b/, /[0-9]/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/];
  Devuelta = 0;

  subObj: Subscription;
  subDeci: Subscription;
  FacturaAtrasada = false;
  // FechaFactura = moment().format('YYYY-MM-DD');
  fecha_vencimiento = new Date();
  fecha_equivalente = new Date();
  fecha_viaje = new Date();
  articulosAcambiar = [];
  newCuerpo: any[];
  paqueteComprobante: any;

  constructor(
    private _ipc: IpcService,
    private mServ: ModalService,
    private fun: FunctionService,
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
    this.dpConfig = Object.assign(
      {},
      {
        // locale:'en',
        showWeekNumbers: false,
        minDate: new Date(),
        dateInputFormat: 'DD/MM/YYYY',
      },
    );
    setInterval(() => {
      this.fecha = GLOBAL.my_dateFormater(new Date()) + ' - ' + GLOBAL.my_houreFormater(new Date());
    }, 1000);
  }

  formatoNumero(num) {
    return GLOBAL.formatearNumero(GLOBAL.redondearAdos(num)) + '  ';
  }

  formarFechaFactura(date) {
    const hora = moment(date).hour();
    const minutos = moment(date).minutes();
    const fechaTemp = moment(date).format('YYYY-MM-DD');

    // this.FechaFacturaMostrar = moment(date).format('DD/MM/YYYY');

    this.FechaFactura = fechaTemp + ' ' + hora + ':' + minutos;
    this.FechaFacturaMostrar = GLOBAL.my_dateFormater(this.FechaFactura) + ' - ' + GLOBAL.my_houreFormater(this.FechaFactura);
  }

  ngOnInit() {
    this.formarFechaFactura(new Date());
    this.usuario = this.fun.getUser();

    this.metodo = this.route.snapshot.params['tipo'];

    this.propietario_factura = null;

    if (this.metodo === 'venta') {
      this.tipoFactura = '02';
      this.TiposFacturas =
        '<div style=" max-width: 21rem;" > \
      <span>00 Factura sin comprobante</span><br>\
      <span>01 Valor fiscal</span><br>\
      <span>02 Factura de consumo</span><br>\
      <span>11 Comprobante de compras</span><br>\
      <span>12 Registro de unico ingreso</span><br>\
      <span>13 Comprobante para gastos menores</span><br>\
      <span>14 Comprobante de regimen especiales</span><br>\
      <span>15 Comprobante gubernamental</span><br>\
      <span>16 Comprobante para exportaciones</span><br>\
      <span>17 Comprobantes para pago al exterior</span><br>\
      </div>';
      this.tipos_facturas = ['00', '01', '02', '11', '12', '13', '14', '15', '16', '17'];
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

    // this.fecha = moment().format('DD/MM/YYYY');

    this.subObj = this.mServ.OBJDEVUELTO.subscribe((res) => {
      if (res && res.tipo_modal === 'buscarCliente') {
        this.propietario_factura = res.data;

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
      } else if (res && res.tipo_modal === 'buscarSuplidor') {
        this.propietario_factura = res.data;
        this.form.patchValue(this.propietario_factura);
        this.enfocarInput('cod-0');
        this.mServ.ModalObj(undefined);
      } else if (res && res.tipo_modal === 'cambio') {
        this.Devuelta = res.data.devuelta;
        this.forma_pago = res.data.forma_pago;
        if (this.metodo === 'compra') {
          if (res.data.decision_cambio) {
            this.cambiarCostos();
          }

          this.CuerpoFactura = this.newCuerpo;
          this.IMPRIMIR();
          this.mServ.ModalObj(undefined);
        } else {
          this.IMPRIMIR();
          this.mServ.ModalObj(undefined);
        }
      }
    });

    this.subDeci = this.mServ.DECISIONMODAL.subscribe((res) => {
      if (res !== undefined) {
        this.decisionModal(res);
        this.mServ.ModalDecision(undefined);
      }
      if (res !== undefined && res.bool) {
        this.formarFechaFactura(res.Date);
        this.FacturaAtrasada = true;
        this.mServ.ModalDecision(undefined);
      }
    });

    setTimeout(() => {
      this.enfocarInput('tipoFact');
    }, 5);

    this.dbServ.getTiposFacturas().subscribe((res) => {
      this.lista_tipos_facturas = res;
    });
  }

  ngOnDestroy(): void {
    this.mServ.ModalObj(null);
    this.mServ.modalTipo(null);
    this.mServ.ModalSeleccion(null);
    this.mServ.ModalTablaHeight(false);
    this.mServ.mostrarModal(false);
    this.CancelarFactura();
    this.subObj.unsubscribe();
    this.subDeci.unsubscribe();
  }

  setWidthPop(bool, e) {
    e.select();
    if (bool) {
      document.documentElement.style.setProperty('--popInfo', '17rem');
    } else {
      document.documentElement.style.setProperty('--popInfo', '25rem');
    }
  }

  checkCambiosModoyCondicionFactura(arg) {
    const sali_de = arg.id;
    const valor = arg.value;
    const condicion = this.condicion_fact;
    let buscar = false;

    if (this.metodo === 'venta') {
      setTimeout(() => {
        const voy_a = document.activeElement.id;
        const nombre = this.propietario_factura ? this.propietario_factura.nombre : 'Cliente contado';
        if (sali_de === 'venta' && condicion === 'Crédito' && nombre === 'Cliente contado') {
          if (voy_a !== 'fecha_equivalente' && voy_a === 'nom') {
            buscar = true;
          }
        }
        if (sali_de === 'venta' && valor === 'adelantada' && nombre === 'Cliente contado') {
          buscar = true;
        }
        if (sali_de === 'venta' && condicion === 'Contado' && valor === 'normal' && voy_a !== 'nom' && voy_a !== 'dir') {
          this.iniciarFactura('cod-0');
        }

        if (sali_de === 'fecha_equivalente' && condicion === 'Crédito' && nombre === 'Cliente contado') {
          buscar = true;
        }

        if (buscar) {
          this.abrirModalFiltro();
        }
      }, 250);
    }
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
      this.modo_factura = 'normal';
      this.fecha_vencimiento = new Date();
      this.fecha_equivalente = new Date();
    } else {
      this.fecha_vencimiento = null;
    }
  }

  async calcularPorcientoComprobante() {
    const TipoFact = this.lista_tipos_facturas.filter((tipo) => tipo.referencia === this.tipoFactura);
    if (this.metodo === 'venta') {
      if (this.tipoFactura !== '00' && this.tipoFactura !== '0' && this.tipoFactura !== '02' && this.tipoFactura !== '2') {
        try {
          const paquete = await this.dbServ.getPaquetesNCF(TipoFact[0].id).toPromise();

          this.paqueteComprobante = paquete.body;

          if (this.paqueteComprobante.fecha_valida !== null) {
            const desde = this.paqueteComprobante.desde;
            const hasta = this.paqueteComprobante.hasta;
            const secuencia = this.paqueteComprobante.secuencia;

            const cant = hasta - desde;
            const cantidad = cant + 1;
            let porciento = 0;

            if (cantidad > 0 && cantidad <= 40) {
              porciento = cantidad * 0.5;
            } else if (cantidad > 40 && cantidad <= 100) {
              porciento = cantidad * 0.25;
            } else if (cantidad > 100 && cantidad <= cantidad * 500) {
              porciento = cantidad * 0.1;
            } else if (cantidad > 500) {
              porciento = cantidad * 0.04;
            }
            const limite = hasta - porciento;
            const restante = hasta - secuencia + 1;

            const msg =
              this.paqueteComprobante.msg === 'Ultimo comprobante de este paquete'
                ? `Ultimo comprobante para ${TipoFact[0].descripcion}.`
                : `Los comprobantes para ${TipoFact[0].descripcion} se estan agotando, solo quedan ${restante}`;

            if (secuencia >= limite) {
              this.dbServ.toastWarning(msg, 'AVISO');
            }
          }
          return 'si';
        } catch (error) {
          this.dbServ.toastError(error.error.msg, 'ERROR');
          this.enfocarInput('tipoFact');
          return 'no';
        }
      }
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
        const continuar = this.calcularPorcientoComprobante();

        this.enfocarInput(campo);
      } else {
        this.dbServ.toastError('El tipo de factura introducido es incorrecto.', 'ERROR', true);
      }
    }

    if (campo === 'venta') {
      this.desEnfocarInput(salioDe);
      this.enfocarInput(campo);
    }

    if (campo === 'costo' || campo === 'fecha_vencimiento' || campo === 'fecha_equivalente') {
      this.enfocarInput(campo);
    }
    if (campo === 'pago') {
      if (this.metodo === 'compra' && !this.tipos_costosYgastos.includes(valor)) {
        this.dbServ.toastError('El tipo de costo y gasto introducido es incorrecto.', 'ERROR', true);
      } else {
        this.CostoYgasto = valor;
        if (this.condicion_fact === 'Contado') {
          const enfocar = this.metodo === 'compra' && campo === 'pago' ? 'ncf' : campo;
          this.enfocarInput(enfocar);
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
        this.dbServ.toastWarning('Numero de comprobante incorrecto', 'Aviso', true);
      }
    }

    if (campo === 'dir' && valor !== null) {
      this.enfocarInput(campo);
    }

    if (campo === 'cod-0' && valor !== null) {
      this.iniciarFactura(campo);
    }
  }

  iniciarFactura(campo) {
    if (this.condicion_fact !== 'Crédito') {
      this.enfocarInput(campo);
      this.propietario_factura = this.form.value;
    } else {
      this.dbServ.toastWarning('Para facturar a credito debe de seleccionar un cliente', 'Aviso', true);
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

  activarNombreDireccion() {
    let res = false;
    if (this.metodo === 'compra') {
      res = true;
    } else {
      res = false;

      if (this.is_adelantada || this.condicion_fact === 'Crédito' || this.modo_factura === 'viaje' || this.modo_factura === 'adelantada') {
        res = true;
      } else {
        res = false;
      }
    }

    return res;
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
    if (this.metodo === 'venta') {
      this.mServ.modalTipo('buscarCliente');
      const obj = {
        data: [],
        filtrarCliente: ' ',
      };
      this.mServ.ModalSeleccion(obj);
    } else {
      this.mServ.modalTipo('buscarSuplidor');

      const obj = {
        data: [],
        filtrarSuplidor: ' ',
      };

      this.mServ.ModalSeleccion(obj);
    }

    setTimeout(() => {
      this.mServ.mostrarModal(true);
    }, 250);

    this.mServ.ModalTablaHeight(true);
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
  async imprimirFactura() {
    if (!this.propietario_factura) {
      if (this.metodo === 'compra') {
        this.dbServ.toastWarning('Factura no tiene suplidor', 'Aviso', true);
      } else {
        this.dbServ.toastWarning('Factura no tiene cliente', 'Aviso', true);
      }
    } else {
      if (this.CuerpoFactura.length === 0) {
        this.dbServ.toastWarning('Factura incompleta!!!', 'Aviso', true);
      } else {
        if (this.TOTAL === 0) {
          this.dbServ.toastWarning('Total de la factura no puede ser 0', 'Aviso', true);
        } else {
          if (this.condicion_fact === 'Crédito' || this.is_viaje) {
            this.mServ.modalTipo('imprimir');
            this.tipoModal = 'imprimir';
            this.abrirModal();
          } else {
            let articulos_a_cambiar = false;

            if (this.metodo === 'compra') {
              const cuerpo_fact = JSON.parse(JSON.stringify(this.CuerpoFactura));
              this.newCuerpo = await this.revisarPrecios(cuerpo_fact);
            }

            if (this.articulosAcambiar.length > 0) {
              articulos_a_cambiar = true;
            }

            const obj = { total_factura: this.TOTAL, devuelta: 0, tipo__: 'devuelta', factura_de: this.metodo, cambios_articulos: articulos_a_cambiar };
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

  selectFecha(arg) {
    setTimeout(() => {
      this.enfocarInput(arg);
    }, 250);
  }

  selectModoFactura(arg) {
    this.is_viaje = false;
    this.is_adelantada = false;

    if (arg === 'viaje') {
      this.is_viaje = true;
    } else if (arg === 'adelantada') {
      this.is_adelantada = true;
    }
  }

  // =============================================
  //  OBTENER LA DATA DEL CUERPO
  // =============================================

  isPart(obj) {
    const x = _.findIndex(this.CuerpoFactura, (o) => {
      return o.des === obj.des;
    });

    return x;
  }

  getCuerpoFactura(arg) {
    this.CuerpoFactura = [];

    const obj = JSON.parse(arg);
    this.CuerpoFactura = obj;

    if (this.metodo === 'venta') {
      this.CuerpoFactura.map((articulo) => {
        articulo.retirado = this.modo_factura === 'adelantada' ? 0 : articulo.cantidad_en_unidades;
        articulo.retirado_en_venta = this.modo_factura === 'adelantada' ? 0 : articulo.cantidad_en_unidades;
        return articulo;
      });
    }
  }

  CancelarFactura() {
    this.articulosAcambiar = [];
    this.newCuerpo = undefined;
    this.FechaFacturaMostrar = undefined;
    this.propietario_factura = null;
    this.NCFcompra = null;
    this.CostoYgasto = null;
    this.mServ.ModalObj(null);
    this.mServ.modalTipo(null);
    this.mServ.ModalSeleccion(null);
    this.FacturaAtrasada = false;
    this.fecha_equivalente = new Date();
    this.fecha_vencimiento = new Date();
    this.fecha_viaje = new Date();
    this.modo_factura = 'normal';
    this.is_adelantada = false;
    this.is_viaje = false;
    this.formarFechaFactura(new Date());

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
        contenido_articulo.forEach((contenido) => {
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
      this.articulosAcambiar.push(tempEnviar);
    }
  }

  async revisarPrecios(cuerpoFact) {
    const tempCuerpo = [];

    for (let i = 0; i < cuerpoFact.length; i++) {
      const row = cuerpoFact[i];

      let articulo;
      let codigo = 0;
      try {
        articulo = await this.dbServ.getArticulosFiltrados(row.cod, 0, 0, true, false, this.FechaFactura, 'todos').toPromise();
      } catch (error) {}

      // const articulo = JSON.parse(JSON.stringify(Articulo[0]));

      const contenido_articulo = articulo.contenido_articulos;
      const costoRow = GLOBAL.desformatear(row.pre);
      const precioRow = 0;

      const roundArticulo = articulo.costo_principal;

      const newArticulo = JSON.parse(JSON.stringify(articulo));
      let temp = {};
      let costoA;
      let costoR;
      const contenidoPadre = contenido_articulo.filter((cont) => cont.condicion === 'padre');
      const contenidoHijo = contenido_articulo.filter((cont) => cont.condicion === 'hijo');

      let medidaEs = '';
      if (articulo.medida === row.unidad) {
        medidaEs = 'principal';
      }
      contenido_articulo.forEach((content) => {
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

      temp = _.omit(row, ['costo', 'condicion', 'pre', 'cod']);
      tempCuerpo.push(temp);
    }
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

  parsearDetalleComprarDetallesCompra(cuerpo) {
    cuerpo.forEach((element) => {
      delete element.pre;
      element.precio = null;
    });
    return cuerpo;
  }
  async cambiarCostos() {
    if (this.articulosAcambiar.length > 0) {
      for (let i = 0; i < this.articulosAcambiar.length; i++) {
        const articulo = this.articulosAcambiar[i];
        try {
          const res = await this.dbServ.editarArticulo(articulo).toPromise();
        } catch (error) {
          console.error(error);
          this.dbServ.toastError('Error actualizando costos articulos.', 'ERROR', true);
        }
      }
    }
  }
  async IMPRIMIR() {
    const empleado = this.fun.getUser();
    const TipoFact = this.lista_tipos_facturas.filter((tipo) => tipo.referencia === this.tipoFactura);

    const cuerpo_fact = JSON.parse(JSON.stringify(this.CuerpoFactura));

    const cabecera_fact = {};
    cabecera_fact['condicion'] = this.condicion_fact;
    cabecera_fact['forma_pago'] = this.forma_pago;

    let fecha_equi;
    if (this.FacturaAtrasada) {
      fecha_equi = this.FechaFactura;
    } else {
      fecha_equi = null;
    }

    cabecera_fact['fecha_viaje'] = this.is_viaje ? this.fecha_viaje : null;
    cabecera_fact['fecha_equivalente'] = fecha_equi;

    if (this.condicion_fact === 'Crédito') {
      let fecha_venci;
      if (this.metodo === 'venta') {
        fecha_venci = moment(new Date()).add(this.propietario_factura.limite_credito, 'days').format('DD/MM/YYYY');
      } else {
        fecha_venci = moment(this.fecha_vencimiento).format('DD/MM/YYYY');
      }
      cabecera_fact['fecha_vencimiento'] = fecha_venci;
      cabecera_fact['pagada'] = false;
      cabecera_fact['balance'] = GLOBAL.redondearAdos(this.TOTAL);
      cabecera_fact['devuelta'] = 0;
    } else {
      cabecera_fact['pagada'] = this.is_viaje ? false : true;
      cabecera_fact['balance'] = this.is_viaje ? GLOBAL.redondearAdos(this.TOTAL) : 0;
      cabecera_fact['devuelta'] = this.is_viaje ? 0 : this.Devuelta;
    }

    cabecera_fact['fecha_valida'] = this.paqueteComprobante
      ? this.paqueteComprobante.fecha_valida !== null
        ? moment(this.paqueteComprobante.fecha_valida).format('DD/MM/YYYY')
        : null
      : null;

    cabecera_fact['tipo_factura_id'] = TipoFact[0].id;
    cabecera_fact['numero_comprobante'] = this.metodo === 'venta' ? null : this.NCFcompra;
    cabecera_fact['costoYgasto'] = this.metodo === 'venta' ? null : this.CostoYgasto;
    cabecera_fact['numero_factura'] = null;
    cabecera_fact['total_factura'] = GLOBAL.desformatear(GLOBAL.redondearAdos(this.TOTAL));
    cabecera_fact['Bruto'] = this.BRUTO;
    cabecera_fact['itbis'] = GLOBAL.redondearAdos(this.ITBIS);
    cabecera_fact['descuento'] = GLOBAL.desformatear(GLOBAL.redondearAdos(this.DESCUENTO));
    cabecera_fact['estado'] = true;
    cabecera_fact['is_adelantada'] = this.is_adelantada;
    cabecera_fact['is_viaje'] = this.is_viaje;
    cabecera_fact['is_nota'] = false;

    if (this.metodo === 'venta') {
      if (this.propietario_factura && this.propietario_factura.id === 1) {
        cabecera_fact['cliente_id'] = null;
        cabecera_fact['NoCliente_nombre'] = this.form.controls.nombre.value;
        cabecera_fact['NoCliente_direccion'] = this.form.controls.direccion.value;
      } else {
        cabecera_fact['cliente_id'] = this.propietario_factura.id;
      }
    } else if (this.metodo === 'compra') {
      cabecera_fact['suplidor_id'] = this.propietario_factura.id;
    }

    cabecera_fact['detalle_facturas_attributes'] = cuerpo_fact;
    cabecera_fact['FACTURA_DE'] = this.metodo === 'venta' ? 13 : 14;
    cabecera_fact['tipo'] = this.metodo;
    cabecera_fact['user_id'] = empleado.id;
    cabecera_fact['tiene_nota'] = false;

    if (this.metodo === 'venta' && this.propietario_factura.vendedor_id) {
      cabecera_fact['vendedor_id'] = this.propietario_factura.vendedor_id;
    }

    try {
      const res = await this.dbServ.createFacturas(cabecera_fact).toPromise();
      await this.CancelarFactura();

      this.dbServ.toastSuccess('Factura de ' + this.metodo + ' realizada correctamente.', 'CORRECTO', true);
      res['FACTURA_DE'] = this.metodo;
      const obj = {
        data: res,
        type: 'facturacion',
      };

      this._ipc.send('print', obj);

      await this._ipc.on('printRes', (event: Electron.IpcMessageEvent, res) => {
        if (res.status) {
        } else {
          this.dbServ.toastError(res.msg + '   ERROR: ' + res.err, 'ERROR', true);
        }
      });
    } catch (error) {
      console.error(error);
      this.dbServ.toastError(error.error.msg, 'ERROR', true);
    }
  }
}
