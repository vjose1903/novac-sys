import { Component, OnInit, OnDestroy, ViewChild, HostListener, AfterViewInit, OnChanges } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from '../../core/javascript/moment';
import * as _ from 'lodash';
import { CuerpoFacturaComponent } from './cuerpo-factura/cuerpo-factura.component';
import { applyMixins, GLOBAL, tipos_facturas } from '../../core/typescript/GLOBAL';
import { ModalService } from '../components/modal/modal.service';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { MixinClass } from '../../core/typescript/MixinClass';
import { FacturacionService } from './facturacion.service';
import { modalClass } from '../components/modal/modal';
import { Subscription } from 'rxjs';
import { ArticuloC } from '../registros/articulos/articulo';
import { FacturaC, TiposFacturaC } from './factura';
import { NcfC } from '../registros/ncf/ncf';
import { PdfService } from '../../core/services/pdf/pdf.service';
import { PendienteFormComponent } from '../components/formularios en modales/pendiente-form/pendiente-form.component';
import { FormCantidadEfectivoComponent } from '../components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component';
import { BuscarClienteSuplidorComponent } from '../components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { FactsLocalStorage } from './factsLocalStorage';
import { ClienteC } from '../registros/registro-clientes/cliente';
import { SuplidorC } from '../registros/registro-suplidores/suplidores';

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.scss'],
})
export class FacturacionComponent extends FactsLocalStorage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(CuerpoFacturaComponent, { static: true }) cuerpo: CuerpoFacturaComponent;

  secuenciaKeys = [];
  info_cambio: any;
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
      if (!this.secuenciaKeys.includes(key)) this.secuenciaKeys.push(key);
    } else if (event.type === 'keyup') {
      const combinacion = _.join(this.secuenciaKeys, '_');
      this.secuenciaKeys = [];

      if (combinacion === '17_80') this.imprimirFactura();

      if (combinacion === '17_71') this.archivarFactura();
    }
  }

  fechaFactura;
  FechaFacturaMostrar: any;
  action: any;
  factura_a_editar;
  form: FormGroup;
  fecha;
  modo_factura;
  is_adelantada;
  is_viaje;
  ITBIS;
  condicion_fact;
  forma_pago;
  propietario_factura;
  tipos_facturas;
  public TiposFacturas: string;
  CuerpoFactura;
  DESCUENTO;
  BRUTO;
  TOTAL;
  tipoFactura;
  lista_tipos_facturas;
  NCFcompra;
  CostoYgasto;
  metodo;
  // archivo_id_desplegada = undefined;

  TiposCostosGastos: string;
  tipos_costosYgastos: string[];

  medidas = {
    Libra: 'Libras',
    Quintal: 'Quintales',
    Caja: 'Cajas',
    Paquete: 'Paquetes',
    Unidad: 'Unidades',
    Saco: 'Sacos',
  };
  // facturaGuardada;
  usuario: any;
  public dpConfig: Partial<BsDatepickerConfig> = new BsDatepickerConfig();
  objArchivo: {
    factura_en_turno: any;
    factura_para_rellenar: any;
    facturas_localStorage?: any;
    factura_en_turno_storage?: any;
    // archivo_id_en_turno?: any;
  };

  ncfMask = [/b/, /[0-9]/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/];
  Devuelta = 0;

  FacturaAtrasada;
  fecha_vencimiento;
  fecha_equivalente;
  fecha_viaje;
  articulosAcambiar;
  newCuerpo: any[];
  paqueteComprobante: any;

  condiciones = [{ nombre: 'Contado' }, { nombre: 'Crédito' }];

  articuloClass = new ArticuloC();
  facturaClass = new FacturaC();
  tipoFacturaClass = new TiposFacturaC();
  ncfClass = new NcfC();
  clienteClass = new ClienteC();
  suplidorClass = new SuplidorC();

  constructor(
    public mServ: ModalService,

    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private localeService: BsLocaleService,
    public factServ: FacturacionService,
    public pdfServ: PdfService,
  ) {
    super();

    this.form = this.fb.group({ id: [], nombre: [], direccion: [], telefono: [] });

    this.dpConfig = Object.assign({}, { showWeekNumbers: false, minDate: new Date(), dateInputFormat: 'DD/MM/YYYY' });

    setInterval(() => (this.fecha = this.my_timeDateFormater(new Date())), 1000);
  }

  ngOnInit() {
    this._init_mixin({ component: 'cabeza_factura', is_routing: true, _lista_subs: ['decisionModal', 'objDevuelto'] });
    this.localeService.use('es');
    this.rellenarVariables();
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  ngAfterViewInit() {
    this.usuario = this.fun.getUser();
    this.getFacturasGuardadas();
  }


  formarObjArchivo(factura_para_rellenar?) {
    return new Promise((resolve) => {
      this.objArchivo = {
        factura_en_turno: undefined,
        factura_para_rellenar: undefined,
        // archivo_id_en_turno: undefined,
      };

      this.objArchivo['facturas_localStorage'] = this.fun.getFacturasguardadas();

      if (this.checkIfFacturacionEnProceso()) {
        this.objArchivo['factura_en_turno'] = this.formarFacturaAGuardar();
        console.log('this.factura_guardada ', this.factura_guardada);

        let comparar_con_localStorage = _.find(this.objArchivo.facturas_localStorage, (item) => item.archivo_id == this.factura_guardada?.archivo_id);
        comparar_con_localStorage = comparar_con_localStorage ? _.omit(comparar_con_localStorage, ['archivo_id', 'factura_id', 'cliente', 'suplidor', 'tipo_factura']) : undefined;
        this.objArchivo['factura_en_turno_storage'] = comparar_con_localStorage;
      }

      if (factura_para_rellenar) {
        factura_para_rellenar = _.omit(factura_para_rellenar, ['archivo_id', 'factura_id', 'cliente', 'suplidor', 'tipo_factura']);
        this.objArchivo['factura_para_rellenar'] = factura_para_rellenar;
      }

      resolve(true);
    });
  }

  getTiposFacturas() {
    return new Promise((resolve) => {
      this.tipoFacturaClass.getAll().then((tiposFacturas) => {
        this.lista_tipos_facturas = tiposFacturas;
        resolve(true);
      });
    });
  }

  rellenarVariables() {
    this.getTiposFacturas().then((resultado) => {
      this.info_cambio = {};
      this.fechaFactura = {};
      this.fechaFactura['front'] = this.formarFechaFactura(new Date())['FechaFactura'];
      this.fechaFactura['back'] = this.fechaFactura['front'];
      this.FechaFacturaMostrar = this.formarFechaFactura(new Date())['FechaFacturaMostrar'];
      this.action = undefined;
      this.factura_a_editar = undefined;
      this.modo_factura = 'normal';
      this.is_adelantada = false;
      this.is_viaje = false;
      this.condicion_fact = 'Contado';
      this.forma_pago = 'Efectivo';
      this.propietario_factura = undefined;
      this.objArchivo = undefined;
      this.CuerpoFactura = [];
      this.DESCUENTO = 0.0;
      this.BRUTO = 0.0;
      this.TOTAL = 0.0;
      this.ITBIS = 0;
      this.NCFcompra = undefined;
      this.CostoYgasto = '';
      // this.facturaGuardada = undefined;
      this.factura_guardada = undefined;
      this.metodo = this.route.snapshot.params['tipo'];
      this.action = this.route.snapshot.params['action'];
      const id_factura = this.route.snapshot.params['id'];
      this.FacturaAtrasada = false;
      this.fecha_vencimiento = new Date();
      this.fecha_equivalente = new Date();
      this.fecha_viaje = new Date();
      this.articulosAcambiar = [];

      this.factServ.setTipos(this.metodo, (res) => {
        if (res) {
          this.tipoFactura = this.factServ.tipoFactura;
          this.TiposFacturas = this.factServ.TiposFacturas;
          this.tipos_facturas = this.factServ.tipos_facturas;
          this.TiposCostosGastos = this.factServ.TiposCostosGastos;
          this.tipos_costosYgastos = this.factServ.tipos_costosYgastos;
        }
      });

      if (this.metodo === 'venta') {
        this.form.patchValue({ id: null, nombre: 'Cliente contado', direccion: 'Autopista duarte KM 0 el Higüero', telefono: null });
      } else {
        this.form.reset();
      }

      if (this.action === 'update') {
        this.factura_a_editar = {};
        this.rellenarCampos(id_factura, 'editar').then(() => {
          this.cuerpo.llenarFactura(this.factura_a_editar.detalle_facturas);
          this.enfocarInput('cod-0');
        });
      } else {
        setTimeout(() => this.enfocarInput('tipoFact'), 5);
      }
    });
  }

  procesoRelleno(factura) {
    return new Promise((resolve) => {
      try {
        this.rellenarCampos(null, 'fact_guardada', factura).then(() => {
          this.enfocarInput('cod-0');

          // TODO: revisar cuando cambie el backend para las facturas

          this.cuerpo.llenarFactura(factura['detalle_facturas'], true, (res) => {
            setTimeout(() => {
              this.getCuerpoFactura(factura['detalle_facturas'], true);
              modalClass.aquienResponder = 'layout';
              // this.layServ.nextRefresh(true);
              this._sideBarOpened = false;
              resolve(true);
            }, 250);
          });
        });
      } catch (error) {
        resolve(false);
      }
    });
  }

  rellenarCampos(id, tipo?, fact?) {
    return new Promise((resolve) => {
      this.getTiposFacturas().then(async (resultado) => {
        let res;
        this.propietario_factura = {};

        if (tipo === 'editar') {
          res = await this.facturaClass.getFacturaById(id);
          res = res['data'];

          this.factura_a_editar = res;
          this.propietario_factura = res.cliente;
          this.propietario_factura['id'] = res.cliente_id;
          this.form.patchValue(this.propietario_factura);
        } else {
          res = fact;
          this.setPropietario(res);
          const tipo = _.find(this.lista_tipos_facturas, (fact) => fact.id == res['tipo_factura_id']);
          res['tipo_factura'] = tipo ? tipo['descripcion'] : '';
        }

        this.metodo = res.tipo;
        this.FacturaAtrasada = fact ? fact?.FacturaAtrasada : false;

        const fecha_facturacion = fact?.fecha_equivalente ? fact?.fecha_equivalente : this.fun.duplicarJson(this.fechaFactura['back']);

        this.fechaFactura['front'] = this.formarFechaFactura(fecha_facturacion)['FechaFactura'];
        this.fechaFactura['back'] = this.fechaFactura['front'];

        this.FechaFacturaMostrar = this.formarFechaFactura(fecha_facturacion)['FechaFacturaMostrar'];
        this.tipoFactura = tipos_facturas[_.lowerCase(res.tipo_factura)];

        if (this.tipoFactura != '00' && this.tipoFactura != '02') {
          const tipoFact = this.lista_tipos_facturas.find((tipo) => tipo.referencia === this.tipoFactura);
          const paquete = await this.ncfClass.getAll({ afterPath: `custom/${tipoFact.id}/true` });
          this.paqueteComprobante = paquete.data;
        }

        if (res.is_viaje) this.fecha_viaje = new Date(res.fecha_viaje);
        else this.fecha_viaje = new Date();

        if (res.tipo === 'compra') this.fecha_vencimiento = new Date(res.fecha_vencimiento);
        else this.fecha_vencimiento = new Date();

        this.is_viaje = res.is_viaje;
        this.condicion_fact = res.condicion;

        this.NCFcompra = res.tipo === 'compra' ? res.numero_comprobante : undefined;
        this.CostoYgasto = res.tipo === 'compra' ? res.costoYgasto : '';

        this.modo_factura = res.is_viaje ? 'viaje' : res.is_adelantada ? 'adelantada' : 'normal';

        resolve(true);
      });
    });
  }

  async setPropietario(arg) {
    if (arg.tipo === 'venta') {
      if (this.fun.hasValue(arg.cliente_id)) {
        const cliente_response = await this.clienteClass.getOne(arg.cliente_id);
        this.propietario_factura = cliente_response.data;
        this.propietario_factura.nombre = this.propietario_factura.nombre_completo;
      } else {
        this.propietario_factura = { id: null, direccion: arg['NoCliente_direccion'], nombre: arg['NoCliente_nombre'], telefono: '' };
      }
    } else {
      const suplidor_response = await this.suplidorClass.getOne(arg.suplidor_id);
      this.propietario_factura = suplidor_response.data;
      this.propietario_factura.nombre = this.propietario_factura.nombre_completo;
    }
    this.form.patchValue(this.propietario_factura);
  }

  checkSituaciones(factura?): Promise<{ factura_en_proceso: boolean; abrirModal?: boolean; texto_modal?: string; archivo_id?: any }> {
    return new Promise((resolve) => {
      this.formarObjArchivo(factura).then(() => {
        if (this.checkIfFacturacionEnProceso()) {
          let texto_modal = '';
          let abrirModal = true;

          if (this.factura_guardada && this.factura_guardada?.archivo_id) {
            if (_.isEqual(this.objArchivo.factura_en_turno, this.objArchivo.factura_en_turno_storage)) {
              this.fun.toastWarning('La factura que estaba realizando esta archivada para poder utilizarla luego.', 'AVISO');
              abrirModal = false;
            } else {
              texto_modal = 'La factura que esta en proceso ya se encuentra archivada ¿desea sobreescribirla?';
            }
          } else {
            texto_modal = 'Estas a punto de salir del modulo de facturación, ¿desea guardar la factura para continuarla luego?';
          }

          resolve({ factura_en_proceso: true, abrirModal, texto_modal });
        } else {
          resolve({ factura_en_proceso: false });
        }
      });
    });
  }

  procesoCambio(abrirModal, texto_modal, callback) {
    if (abrirModal) {
      // if (this.factura_guardada) this.factura_guardada['archivo_id'] = this.objArchivo.archivo_id_en_turno;
      console.log('this.factura_guardada ', this.factura_guardada);

      let salirFunction = (instance) => {
        this.agregarFacturaALocalStorage();
        this.info_cambio['bool'] = true;
        this.runFinalizarCambioMenu(this.info_cambio);
        this.closeModal(instance);
      };

      let noGuardar = (instance) => {
        this.info_cambio['bool'] = true;
        this.runFinalizarCambioMenu(this.info_cambio);
        this.closeModal(instance);
      };

      let cancelarFunction = (instance) => {
        this.info_cambio['bool'] = false;
        this.runFinalizarCambioMenu(this.info_cambio);
        this.closeModal(instance);
      };

      const confirmationObj = {
        id: 'salir_layout',
        texto: texto_modal,
        header: 'Confirmación',
        siFunction: (instance) => salirFunction(instance),
        noFunction: (instance) => noGuardar(instance),
        cancelarFunction: (instance) => cancelarFunction(instance),
        width: '30rem',
      };

      this.confirmationModal(confirmationObj);
    } else {
      this.info_cambio['bool'] = true;
      this.info_cambio['verificar'] = true;
      this.runFinalizarCambioMenu(this.info_cambio);

      callback({ bool: true });
    }
  }

  setFacturaArchivada(factura) {
    if (this.fun.hasValue(factura)) {
      if (this.factura_guardada && this.factura_guardada?.archivo_id == factura.archivo_id) {
        this.fun.toastWarning('Ya esta factura esta seleccionada.', 'AVISO');
      } else {
        this.checkSituaciones().then((result) => {
          if (result.factura_en_proceso) {
            if (result.abrirModal) {
              let siFunction = (instance) => {
                this.archivarFact(instance);
                this.procesoRelleno(factura);
                this.actualizarLayServFactguardada(factura);
              };

              let noSobreEscribir = (instance) => {
                this.procesoRelleno(factura);
                this.actualizarLayServFactguardada(factura);
                this.closeModal(instance);
              };

              const cancelarRelleno = (instance) => this.closeModal(instance);

              const confirmationObj = {
                id: 'archivar_factura',
                texto: result.texto_modal,
                header: 'Confirmación',
                siFunction: (instance) => siFunction(instance),
                noFunction: (instance) => noSobreEscribir(instance),
                cancelarFunction: (instance) => cancelarRelleno(instance),
                width: '30rem',
              };

              this.confirmationModal(confirmationObj);
            } else {
              this.procesoRelleno(factura);
              this.actualizarLayServFactguardada(factura);
            }
          } else {
            this.procesoRelleno(factura);
            this.actualizarLayServFactguardada(factura);
          }
        });

      }
    }
  }

  actualizarLayServFactguardada(factura) {
    this.factura_guardada = this.fun.duplicarJson(factura);
    this.factura_guardada.archivo_id = factura.archivo_id;
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.info_cambio = arg;
      this.info_cambio['verificar'] = true;
      this.checkSituaciones().then((result) => {
        if (result.factura_en_proceso) {
          this.procesoCambio(result.abrirModal, result.texto_modal, callback);
        } else {
          this.runFinalizarCambioMenu(this.info_cambio);
          callback({ bool: true });
        }
      });
    }
  }

  // decisionModal(res) {
  //   if (this.fun.hasValue(res)) this.luegoDecision(res);

  //   if (this.fun.hasValue(res) && res.bool) {
  //     this.fechaFactura['front'] = this.formarFechaFactura(res.Date)['FechaFactura'];
  //     this.fechaFactura['back'] = this.fechaFactura['front'];
  //     this.FechaFacturaMostrar = this.formarFechaFactura(res.Date)['FechaFacturaMostrar'];
  //     this.FacturaAtrasada = true;
  //     this.cuerpo.getSaco();
  //   }
  // }

  objDevueltoResponse(res) {
    if (res && res.tipo_modal === 'buscarSuplidor') {
      this.propietario_factura = res.data;
      this.form.patchValue(this.propietario_factura);
      this.enfocarInput('cod-0');
      //
    } else if (res && res.tipo_modal === 'cambio') {
      this.Devuelta = res.data.devuelta;
      this.forma_pago = res.data.forma_pago;

      if (this.metodo === 'compra') {
        if (res.data.decision_cambio) {
          this.cambiarCostos();
        }
        this.CuerpoFactura = this.newCuerpo;
        this.enviarABaseDatos();
      } else {
        this.enviarABaseDatos();
      }
    }
  }

  checkIfFacturacionEnProceso() {
    return this.CuerpoFactura.length;
  }

  setWidthPop(bool, e) {
    e.select();
    const size = bool ? '18rem' : '26rem';
    document.documentElement.style.setProperty('--popInfo', size);
  }

  checkCambiosModoyCondicionFactura(arg) {
    const sali_de = arg.id;
    const valor = arg.value;
    const condicion = this.condicion_fact;
    const tipo_factura = this.tipoFactura;
    let buscar = false;

    if (this.metodo === 'venta') {
      setTimeout(() => {
        const voy_a = document.activeElement.id;
        const nombre = this.propietario_factura ? this.propietario_factura.nombre : 'Cliente contado';

        if (sali_de === 'venta' && condicion === 'Crédito' && nombre === 'Cliente contado') {
          if (voy_a !== 'fecha_equivalente' && voy_a === 'nom') buscar = true;
        }
        if (sali_de === 'venta' && tipo_factura === '01' && voy_a !== 'fecha_equivalente' && nombre === 'Cliente contado') buscar = true;

        if (sali_de === 'venta' && valor === 'adelantada' && nombre === 'Cliente contado') buscar = true;

        if (sali_de === 'venta' && condicion === 'Contado' && valor === 'normal' && voy_a !== 'nom' && voy_a !== 'dir') this.iniciarFactura('cod-0');

        if (sali_de === 'fecha_equivalente' && condicion === 'Crédito' && nombre === 'Cliente contado') buscar = true;

        if (buscar) this.abrirModalFiltro();
      }, 250);
    }
  }

  getCalculosDinero(arg) {
    if (arg.tipo == 'descuento') this.DESCUENTO = parseFloat(arg.monto);
    else if (arg.tipo == 'bruto') this.TOTAL = parseFloat(arg.monto.total);
    this.calcularBruto();
  }

  calcularBruto() {
    setTimeout(() => (this.BRUTO = this.TOTAL + this.DESCUENTO), 5);
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

      if (num < 10 || char === '_') return false;
      else return true;
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
    return new Promise(async (resolve) => {
      const tipoFact = this.lista_tipos_facturas.find((tipo) => tipo.referencia === this.tipoFactura);

      if (this.metodo === 'venta') {
        if (this.tipoFactura != '00' && this.tipoFactura != '02') {
          try {
            const paquete = await this.ncfClass.getAll({ afterPath: `custom/${tipoFact.id}/true` });

            this.paqueteComprobante = paquete.data;

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
                  ? `Ultimo comprobante para ${tipoFact.descripcion}.`
                  : `Los comprobantes para ${tipoFact.descripcion} se estan agotando, solo quedan ${restante}`;

              if (secuencia >= limite) this.fun.toastWarning(msg, 'AVISO');
            }
            resolve(true);
          } catch (error) {
            if (error.error.msg) {
              this.fun.toastError(error.error.msg, 'ERROR');
            } else {
              this.fun.toastError('Error calculando la secuencia de comprobantes.', 'AVISO');
            }

            this.enfocarInput('tipoFact');
            resolve(false);
          }
        } else {
          this.paqueteComprobante = undefined;
          resolve(true);
        }
      } else {
        resolve(true);
      }
    });
  }

  async checkTipoFactura(campo, valor, check = false) {
    if (this.tipos_facturas.includes(valor)) {
      this.tipoFactura = valor;
      this.NCFcompra = 'b' + valor;

      if (check) {
        this.calcularPorcientoComprobante().then((continuar) => {
          if (continuar) this.enfocarInput(campo);
          else this.enfocarInput('tipoFact');
        });
      } else {
        this.enfocarInput(campo);
      }
    } else {
      this.fun.toastError('El tipo de factura introducido es incorrecto.', 'ERROR');
    }
  }

  saltar(campo, valor?, salioDe?) {
    if (campo === 'buscarCliente') {
      this.desEnfocarInput(salioDe);
      this.abrirModalFiltro();
    }

    if (campo === 'condicion') this.checkTipoFactura(campo, valor, false);

    if (campo === 'venta') {
      this.desEnfocarInput(salioDe);
      this.enfocarInput(campo);
    }

    if (campo === 'costo' || campo === 'fecha_vencimiento' || campo === 'fecha_equivalente') this.enfocarInput(campo);

    if (campo === 'pago') {
      if (this.metodo === 'compra' && !this.tipos_costosYgastos.includes(valor)) {
        this.fun.toastError('El tipo de costo y gasto introducido es incorrecto.', 'ERROR');
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
      if (this.metodo === 'venta') this.enfocarInput('nom');
      else this.enfocarInput('ncf');
    }

    if (campo === 'filtro') {
      if (this.validarRayaAbajo()) {
        this.abrirModalFiltro();
        this.desEnfocarInput(salioDe);
      } else this.fun.toastWarning('Numero de comprobante incorrecto', 'Aviso');
    }

    if (campo === 'dir' && valor !== null) this.enfocarInput(campo);

    if (campo === 'cod-0' && valor !== null) this.iniciarFactura(campo);
  }

  iniciarFactura(campo) {
    if (this.condicion_fact !== 'Crédito') {
      this.enfocarInput(campo);
      this.propietario_factura = this.form.value;
    } else {
      this.fun.toastWarning('Para facturar a crédito debe de seleccionar un cliente', 'Aviso');
    }
  }

  activarNombreDireccion() {
    let res = false;
    if (this.metodo === 'compra' || this.factura_a_editar) {
      res = true;
    } else {
      res = false;

      if (this.is_adelantada || this.condicion_fact === 'Crédito' || this.modo_factura === 'viaje' || this.modo_factura === 'adelantada' || this.tipoFactura === '01') {
        res = true;
      } else {
        res = false;
      }
    }

    return res;
  }

  // =============================================
  //  MODAL PARA FILTRAR CLIENTES & SUPLIDORES
  // =============================================

  abrirModalFiltro() {
    let tipo = 'buscarCliente';
    let obj = {};
    obj['data'] = [];

    if (this.metodo === 'venta') obj['filtrarCliente'] = null;
    if (this.metodo === 'compra') {
      tipo = 'buscarSuplidor';
      obj['filtrarSuplidor'] = null;
    }

    this.handleModalForm({
      component: BuscarClienteSuplidorComponent,
      inputs: { metodo: this.metodo, palabra_a_buscar: ' ' },
      id: 'buscarCliente',
      header: this.metodo === 'venta' ? 'BUSCAR CLIENTE' : 'BUSCAR SUPLIDOR',
      width: '56.25rem',
      height: '31.25rem',
      botones: {
        aceptar: { show: false, disable: false },
        cancelar: { show: false, disable: false },
      },
    });
  }

  // =============================================
  //  MODAL CANCELAR
  // =============================================
  cancelarFactura() {
    let si = (instance) => {
      if (this.action !== 'update') this.resetVariables();
      if (this.action === 'update') this.router.navigateByUrl(`/admin/manipular/buscarFactura/solo_ver`).then(() => this.resetVariables());
      this.closeModal(instance);
    };

    let obj = {
      id: 'cancelar_factura',
      header: 'Confirmación',
      texto: 'Seguro que desea cancelar la factura',
      siFunction: si,
    };

    this.confirmationModal(obj);
  }

  confirmationModal(obj: { id: string; texto: string; header: string; siFunction: Function; width?: string; noFunction?: Function; cancelarFunction?: Function }) {
    const config = {
      id: obj.id,
      header: obj.header,
      width: obj.width || '30rem',
      html: `<p> ${obj.texto} </p>`,
      botones: {
        aceptar: { show: false, disable: false },
        cancelar: { show: false, disable: false },
        dinamico: [
          { clase: 'btn btn-blanco mr-2', function: (instance) => (_.has(obj, 'noFunction') ? obj?.noFunction(instance) : this.closeModal(instance)), label: 'No', disable: false },
          { clase: 'btn btn-verde', function: (instance) => obj.siFunction(instance), label: 'Si', disable: false },
        ],
      },
    };

    if (_.has(obj, 'cancelarFunction') && this.fun.hasValue(obj.cancelarFunction)) {
      this.fun.pushAt(config.botones.dinamico, 0, { clase: 'btn btn-blanco mr-2', function: (instance) => obj.cancelarFunction(instance), label: 'Cancelar', disable: false });
    }

    this.handleModalForm(config);
  }

  closeModal(modalInstance) {
    modalInstance.closeModal(modalInstance.id, 'cancelar');
  }

  // =============================================
  //  MODAL enviarABaseDatos
  // =============================================
  async imprimirFactura() {
    if (!this.usuario) this.usuario = this.fun.getUser();

    if (!this.propietario_factura) {
      if (this.metodo === 'compra') this.fun.toastWarning('Factura no tiene suplidor seleccionado', 'Aviso');
      else this.fun.toastWarning('Factura no tiene cliente seleccionado', 'Aviso');
    } else {
      if (this.CuerpoFactura.length === 0) {
        this.fun.toastWarning('Factura incompleta!!!', 'Aviso');
      } else {
        if (this.TOTAL === 0) {
          this.fun.toastWarning('Total de la factura no puede ser 0', 'Aviso');
        } else {
          if (this.condicion_fact === 'Crédito' || this.is_viaje) {
            const confirmationObj = {
              id: 'imprimir_factura',
              texto: 'Seguro que desea imprimir la factura',
              header: 'Confirmación',
              siFunction: (instance) => {
                this.enviarABaseDatos();
                this.closeModal(instance);
              },
              width: '30rem',
            };
            this.confirmationModal(confirmationObj);
          } else {
            let articulos_a_cambiar = false;

            if (this.metodo === 'compra') {
              const cuerpo_fact = JSON.parse(JSON.stringify(this.CuerpoFactura));
              this.newCuerpo = await this.revisarPrecios(cuerpo_fact);
            }

            if (this.articulosAcambiar.length > 0) articulos_a_cambiar = true;

            const obj = {
              total_factura: this.TOTAL,
              devuelta: this.action === 'update' ? this.factura_a_editar.devuelta + this.factura_a_editar.total_factura : 0,
              tipo__: 'devuelta',
              factura_de: this.metodo,
              cambios_articulos: articulos_a_cambiar,
            };

            // TODO:
            this.handleModalForm({
              component: FormCantidadEfectivoComponent,
              inputs: obj,
              id: 'cambioEfectivo',
              header: 'Cantidad de efectivo',
              width: '34.375rem',
              botones: {
                aceptar: { show: false, disable: false },
                cancelar: { show: false, disable: false },
                dinamico: [
                  { clase: 'btn btn-blanco mr-2', function: (instance) => this.closeModal(instance), label: 'Cancelar', disable: false },
                  { btn_id: 'btnConfirmar', clase: 'btn btn-verde', function_in_other_component: 'btn_aceptar', label: 'Confirmar', disable: true },
                ],
              },
            });
          }
        }
      }
    }
  }

  formarFacturaAGuardar() {
    const factura_a_guardar = this.formarData();
    factura_a_guardar['action'] = this.action;
    factura_a_guardar['FacturaAtrasada'] = this.FacturaAtrasada;
    return factura_a_guardar;
  }

  agregarFacturaALocalStorage() {
    if (!this.propietario_factura) this.propietario_factura = this.form.value;

    let facturas_localStorage = this.fun.duplicarJson(this.objArchivo.facturas_localStorage);

    const factura_a_guardar = this.fun.duplicarJson(this.objArchivo.factura_en_turno);

    let index_fact_archivada = _.findIndex(facturas_localStorage, (facts: any) => facts?.archivo_id === this.factura_guardada?.archivo_id);

    if (!this.fun.isEmpty(this.propietario_factura.id)) factura_a_guardar[this.metodo === 'venta' ? 'cliente' : 'suplidor'] = this.propietario_factura;

    if (index_fact_archivada && index_fact_archivada >= 0) {
      factura_a_guardar['archivo_id'] = this.factura_guardada.archivo_id;
      facturas_localStorage[index_fact_archivada] = factura_a_guardar;
    } else {
      facturas_localStorage = _.orderBy(facturas_localStorage, ['archivo_id'], ['asc']);
      factura_a_guardar['archivo_id'] = facturas_localStorage.length > 0 ? _.last(facturas_localStorage).archivo_id + 1 : 1;

      facturas_localStorage.push(factura_a_guardar);
    }

    facturas_localStorage = _.orderBy(facturas_localStorage, ['archivo_id'], ['asc']);

    this.fun.setFacturasGuardadas(facturas_localStorage);
  }

  archivarFact(modalInstance, reset = false) {
    this.agregarFacturaALocalStorage();
    this.getFacturasGuardadas();

    this.closeModal(modalInstance);
    if (reset) this.resetVariables();
  }

  archivarFactura() {
    if (this.checkIfFacturacionEnProceso()) {
      this.formarObjArchivo().then(() => {
        let is_guardada = false;
        console.log('this.factura_guardada ', this.factura_guardada);

        if (this.factura_guardada && this.factura_guardada.archivo_id) is_guardada = _.find(this.objArchivo.facturas_localStorage, (fact: any) => fact.archivo_id == this.factura_guardada.archivo_id);

        const texto_modal = is_guardada ? 'Esta factura ya esta archivada ¿desea sobreescribirla?' : '¿Seguro que desea archivar esta factura para continuarla luego?';

        const confirmationObj = {
          id: 'archivar_factura',
          texto: texto_modal,
          header: 'Confirmación',
          siFunction: (instance) => this.archivarFact(instance, true),
          width: '30rem',
        };

        this.confirmationModal(confirmationObj);
      });
    } else {
      this.fun.toastWarning('Debe de iniciar una factura para archivarla', 'AVISO');
    }
  }

  selectModoFactura(arg) {
    this.is_viaje = false;
    this.is_adelantada = false;

    if (arg === 'viaje') this.is_viaje = true;
    else if (arg === 'adelantada') this.is_adelantada = true;
  }

  // =============================================
  //  OBTENER LA DATA DEL CUERPO
  // =============================================git

  getCuerpoFactura(arg, recuperar?) {
    this.CuerpoFactura = [];
    let obj;

    if (!recuperar) obj = JSON.parse(arg);
    else obj = arg;

    this.CuerpoFactura = obj;

    if (this.metodo === 'venta') {
      this.CuerpoFactura.map((articulo) => {
        delete articulo.is_materia_prima;
        articulo.retirado = this.modo_factura === 'adelantada' ? 0 : articulo.cantidad_en_unidades;
        articulo.retirado_en_venta = this.modo_factura === 'adelantada' ? 0 : articulo.cantidad_en_unidades;
        return articulo;
      });
    }
  }

  prueba() {}

  resetVariables() {
    this.cuerpo.RESETCUERPO();
    this.rellenarVariables();
  }

  calculatePrice(costo): number {
    if (costo > 0 || costo != null || costo) {
      const precio = costo / 0.9;
      return this.fun.desformatear(this.fun.redondearAdos(precio));
    }
  }

  calculoMedidaPrincipal(costo_db, costoRow, articulo) {
    const contenido_articulo = articulo.contenido_articulos;

    if (costo_db !== costoRow) {
      let cantPadre;
      let cantHijo;
      const tempContenido = [];

      let precioRow = this.calculatePrice(costoRow);

      contenido_articulo.forEach((contenido) => {
        let temporal = contenido;
        if (contenido.condicion === 'padre') {
          if (contenido.precio) {
            cantPadre = contenido.cantidad;
            const precio = this.calcularNuevosPrecios(cantPadre, precioRow);
            const costo = this.calcularNuevosPrecios(cantPadre, costoRow);
            temporal.precio = this.fun.desformatear(precio);
            temporal.costo = this.fun.desformatear(costo);
          }
        } else {
          if (contenido.precio) {
            cantHijo = contenido.cantidad;
            const prePadre = this.calcularNuevosPrecios(cantPadre, precioRow);
            const cosPadre = this.calcularNuevosPrecios(cantPadre, costoRow);
            const precio = this.calcularNuevosPrecios(cantHijo, this.fun.redondearAdos(prePadre));
            const costo = this.calcularNuevosPrecios(cantHijo, this.fun.redondearAdos(cosPadre));
            temporal.precio = this.fun.desformatear(precio);
            temporal.costo = this.fun.desformatear(costo);
          } else {
            temporal = null;
          }
        }
        if (temporal !== null) {
          const tempu = _.omit(temporal, ['created_at', 'updated_at']);
          tempContenido.push(tempu);
        }
      });

      articulo.costo_principal = costoRow;
      articulo.precio_principal = precioRow;
      articulo.contenido_articulos = tempContenido;
      articulo.user_id = this.usuario.id;

      const tempEnviar = _.omit(articulo, ['created_at', 'updated_at', 'contenido_articulos']);
      this.articulosAcambiar.push(tempEnviar);
    }
  }

  async revisarPrecios(cuerpoFact) {
    const tempCuerpo = [];
    this.articulosAcambiar = [];

    for (let i = 0; i < cuerpoFact.length; i++) {
      const row = cuerpoFact[i];

      let articulo = row.articulo;

      const contenido_articulo = articulo.contenido_articulos;

      const costoRow = this.fun.desformatear(row.pre);

      const costoPrincipal = articulo.costo_principal;

      let temp = {};
      let costoA;
      let costoR;
      const contenidoPadre = contenido_articulo.filter((cont) => cont.condicion === 'padre')[0];
      const contenidoHijo = contenido_articulo.filter((cont) => cont.condicion === 'hijo')[0];

      let medidaEs = '';
      if (articulo.medida === row.unidad) medidaEs = 'principal';

      contenido_articulo.forEach((content) => {
        if (content.medida === row.unidad) medidaEs = content.condicion;
      });

      if (contenido_articulo.length === 0 || medidaEs === 'principal') {
        this.calculoMedidaPrincipal(costoPrincipal, costoRow, articulo);
      } else {
        if (medidaEs === 'padre') {
          costoA = contenidoPadre.costo * contenidoPadre.cantidad;
          costoR = contenidoPadre.cantidad * costoRow;
        } else {
          let MaxContenido = 0;
          if (contenido_articulo.length === 1) {
            MaxContenido = contenidoPadre.cantidad;
            costoA = contenidoPadre.costo * MaxContenido;
          } else {
            MaxContenido = contenidoPadre.cantidad * contenidoHijo.cantidad;
            costoA = contenidoHijo.costo * MaxContenido;
          }
          costoR = MaxContenido * costoRow;
        }
        this.calculoMedidaPrincipal(costoA, costoR, articulo);
      }

      temp = _.omit(row, ['costo', 'condicion', 'pre', 'cod']);
      tempCuerpo.push(temp);
    }
    return tempCuerpo;
  }

  ingresarFecha() {
    this.handleModalForm({
      component: PendienteFormComponent,
      id: 'facturaPendiente',
      header: 'Factura pendiente',
      width: '34.375rem',
    });
  }

  async getDataFromModal(arg, search) {
    if (arg.modal_id === 'facturaPendiente') {
      this.fechaFactura['front'] = this.formarFechaFactura(arg.fecha)['FechaFactura'];
      this.fechaFactura['back'] = this.fechaFactura['front'];
      this.FechaFacturaMostrar = this.formarFechaFactura(arg.fecha)['FechaFacturaMostrar'];
      this.FacturaAtrasada = true;
    } else if (arg.modal_id == 'cambioEfectivo') {
      this.Devuelta = arg.obj.devuelta;
      this.forma_pago = arg.obj.forma_pago;

      if (this.metodo === 'compra') {
        if (arg.obj.decision_cambio) {
          await this.cambiarCostos();
        }
        this.CuerpoFactura = this.newCuerpo;
        this.enviarABaseDatos();
      } else {
        this.enviarABaseDatos();
      }
    } else if (arg.modal_id == 'buscarCliente') {
      this.propietario_factura = arg.data;

      this.form.patchValue(this.propietario_factura);
      this.enfocarInput('cod-0');
      const balance = _.parseInt(this.propietario_factura.balance);
      const maxCred = _.parseInt(this.propietario_factura.maximo_credito);

      if (balance > maxCred - 1000 && balance < maxCred) {
        this.fun.toastWarning(`Credito actual RD$${this.formatoNumero(balance)}  limite: RD$${this.formatoNumero(maxCred)}`, 'PROXIMO A LIMITE DE CREDITO');
      } else if (balance > maxCred) {
        this.fun.toastError(` Credito actual RD$${this.formatoNumero(balance)}            limite: RD$${this.formatoNumero(maxCred)}`, 'SOBRE VALOR DE CREDITO');
      }
    }
  }

  calcularNuevosPrecios(cant, precio) {
    const pre = precio / cant;
    return this.fun.redondearAdos(pre);
  }

  async cambiarCostos() {
    if (this.articulosAcambiar.length > 0) {
      for (let i = 0; i < this.articulosAcambiar.length; i++) {
        const articulo = this.articulosAcambiar[i];
        this.articuloClass.createUpdateOne(articulo).then((res) => {});
      }
    }
  }

  revisarLocalStorage() {
    const is_guardada = _.find(this.objArchivo.facturas_localStorage, (fact: any) => fact.archivo_id === this.factura_guardada?.archivo_id);

    if (this.fun.hasValue(is_guardada))
      this.quitarFacturaGuardada(this.factura_guardada?.archivo_id);

  }

  formarData() {
    const empleado = this.fun.getUser();
    const tipoFact = this.lista_tipos_facturas.filter((tipo) => tipo.referencia === this.tipoFactura);

    let cuerpo_fact = this.fun.duplicarJson(this.CuerpoFactura);

    const cabecera_fact = {};
    cabecera_fact['condicion'] = this.condicion_fact;
    cabecera_fact['forma_pago'] = this.forma_pago;

    let fecha_equi;
    if (this.FacturaAtrasada) fecha_equi = this.fechaFactura['front'];
    else fecha_equi = null;

    cabecera_fact['fecha_viaje'] = this.is_viaje ? this.fecha_viaje : null;
    cabecera_fact['fecha_equivalente'] = fecha_equi;

    if (this.condicion_fact === 'Crédito') {
      let fecha_venci;

      if (this.metodo === 'venta') {
        fecha_venci = moment(new Date()).add(this.propietario_factura.limite_credito, 'days').format('DD/MM/YYYY');
      } else fecha_venci = moment(this.fecha_vencimiento).format('DD/MM/YYYY');

      cabecera_fact['fecha_vencimiento'] = fecha_venci;
      cabecera_fact['pagada'] = false;
      cabecera_fact['balance'] = this.fun.parseFloatTwoDecimals(this.TOTAL);
      cabecera_fact['devuelta'] = 0;
    } else {
      cabecera_fact['pagada'] = this.is_viaje ? false : true;
      cabecera_fact['balance'] = this.is_viaje ? this.fun.parseFloatTwoDecimals(this.TOTAL) : 0;
      cabecera_fact['devuelta'] = this.is_viaje ? 0 : this.Devuelta;
    }
    cabecera_fact['fecha_valida'] = this.paqueteComprobante ? (this.paqueteComprobante.fecha_valida !== null ? moment(this.paqueteComprobante.fecha_valida).format('DD/MM/YYYY') : null) : null;

    cabecera_fact['tipo_factura_id'] = tipoFact[0].id;
    cabecera_fact['numero_comprobante'] = this.metodo === 'venta' ? null : this.NCFcompra;
    cabecera_fact['costoYgasto'] = this.metodo === 'venta' ? null : this.CostoYgasto;
    cabecera_fact['numero_factura'] = null;
    cabecera_fact['total_factura'] = this.fun.parseFloatTwoDecimals(this.TOTAL);
    cabecera_fact['Bruto'] = this.BRUTO;
    cabecera_fact['itbis'] = this.fun.parseFloatTwoDecimals(this.ITBIS);
    cabecera_fact['descuento'] = this.fun.parseFloatTwoDecimals(this.DESCUENTO);
    cabecera_fact['estado'] = true;
    cabecera_fact['is_adelantada'] = this.is_adelantada;
    cabecera_fact['is_viaje'] = this.is_viaje;
    cabecera_fact['is_nota'] = false;

    if (this.metodo === 'venta') {
      if (this.fun.isEmpty(this.propietario_factura) || this.fun.isEmpty(this.propietario_factura.id)) {
        cabecera_fact['cliente_id'] = null;
        cabecera_fact['NoCliente_nombre'] = this.form.controls.nombre.value;
        cabecera_fact['NoCliente_direccion'] = this.form.controls.direccion.value;
      } else {
        cabecera_fact['cliente_id'] = this.propietario_factura.id;
      }
    } else if (this.metodo === 'compra') {
      cabecera_fact['suplidor_id'] = this.propietario_factura.id;
    }

    cabecera_fact['detalle_facturas'] = cuerpo_fact;
    cabecera_fact['FACTURA_DE'] = this.metodo === 'venta' ? (this.condicion_fact == 'Contado' ? 13 : 18) : 14;
    cabecera_fact['tipo'] = this.metodo;
    cabecera_fact['user_id'] = empleado.id;

    cabecera_fact['tiene_nota'] = this.factura_a_editar ? this.factura_a_editar.tiene_nota : false;

    if (this.metodo === 'venta' && this.propietario_factura.vendedor_id) cabecera_fact['vendedor_id'] = Number(this.propietario_factura.vendedor_id);

    return cabecera_fact;
  }

  async enviarABaseDatos() {
    const cabecera_fact = this.formarData();

    let res;
    const metodo = this.action === 'update' ? 'editar_factura' : '';

    if (metodo === 'editar_factura') res = await this.facturaClass.updateOne(cabecera_fact, { afterPath: `custom/update/${this.factura_a_editar.id}` });
    else res = await this.facturaClass.createOne(cabecera_fact);

    let res_factura = res['data'];

    if (this.factura_guardada) this.revisarLocalStorage();

    res_factura['FACTURA_DE'] = this.metodo;

    const obj = { data: res_factura, type: 'facturacion' };

    if (this.metodo === 'venta') {
      this.pdfServ.generatePdf({ oPdf: obj, imprimir: true }).catch((err) => this.fun.toastError('Error imprimiendo la factura', 'ERROR'));
    }

    this.layServ.nextCheckCuadreToday(true);

    if (metodo === 'editar_factura') this.router.navigateByUrl('/admin/manipular/buscarFactura/solo_ver');
    else await this.resetVariables();
  }
}

// export interface FacturacionComponent extends FactsLocalStorage {}

// applyMixins(FacturacionComponent, [FactsLocalStorage]);
