import { Component, OnInit, OnDestroy, ViewChild, HostListener, AfterViewInit, OnChanges } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from '../../../utils/javascript/moment';
import { DBservice } from '../../core/services/bdservice.service';
import * as _ from 'lodash';
import { CuerpoFacturaComponent } from './cuerpo-factura/cuerpo-factura.component';
import { GLOBAL, tipos_facturas } from '../../core/services/GLOBAL';
import { ModalService } from '../components/modal/modal.service';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { mixinClass } from '../mixinClass';
import { FacturacionService } from './facturacion.service';
import { modalClass } from '../components/modal/modal';
import { Subscription } from 'rxjs';
import { ArticuloC } from '../registros/articulos/articulo';
import { FacturaC } from './factura';

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.scss'],
})
export class FacturacionComponent extends mixinClass implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(CuerpoFacturaComponent, { static: true }) cuerpo: CuerpoFacturaComponent;

  secuenciaKeys = [];
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
    archivo_id_en_turno: any;
    factura_para_rellenar: any;
    archivo_id_para_rellenar: any;
    facturas_localStorage?: any;
    factura_en_turno_storage?: any;
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
  subFactG: Subscription;
  condiciones = [{ nombre: 'Contado' }, { nombre: 'Crédito' }];

  articuloClass = new ArticuloC();
  facturaClass = new FacturaC();

  constructor(
    public mServ: ModalService,
    private dbServ: DBservice,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private localeService: BsLocaleService,
    public factServ: FacturacionService,
  ) {
    super();

    this.form = this.fb.group({
      id: [],
      nombre: [],
      direccion: [],
      telefono: [],
    });

    this.dpConfig = Object.assign({}, { showWeekNumbers: false, minDate: new Date(), dateInputFormat: 'DD/MM/YYYY' });

    setInterval(() => (this.fecha = this.my_timeDateFormater(new Date())), 1000);
  }

  ngOnInit() {
    this._init_mixin({ component: 'cabeza_factura', _lista_subs: ['decisionModal', 'objDevuelto', 'printBase64Res', 'sacarFacturas'] });
    this.localeService.use('es');
    this.rellenarVariables();

    this.subFactG = this.layServ.FACTURAGUARDADA.subscribe((facturaGuardada) => {
      console.log('facturaGuardada --> ', facturaGuardada);

      if (facturaGuardada) {
        let obj = { texto_modal: '' };

        this.formarObjArchivo(facturaGuardada).then(() => {
          let abrir_modal = true;
          const is_factura_en_proceso = this.checkIfFacturacionEnProceso();
          if (is_factura_en_proceso) {
            // para saber si la factura que estaba en turno era una factura ya archivada
            if (this.objArchivo.archivo_id_en_turno) {
              if (_.isEqual(this.objArchivo.factura_en_turno, this.objArchivo.factura_en_turno_storage)) {
                this.fun.toastWarning('La factura que estaba realizando esta archivada para poder utilizarla luego.', 'AVISO');
                this.procesoRelleno(this.objArchivo.factura_para_rellenar);
                abrir_modal = false;
              } else {
                obj.texto_modal = 'La factura que esta en proceso ya se encuentra archivada ¿desea sobreescribirla?';
              }
            } else obj.texto_modal = '¿Desea archivar la factura que esta en proceso?';

            if (abrir_modal) this.abrirModal('dinamico_texto', obj, 'desplegar_factura');
          } else {
            this.procesoRelleno(facturaGuardada);
          }
          // si el modal no se abrira asignando el archivo_id de la factura que se va a rellenar como el que estara en turno
          if (!abrir_modal || !is_factura_en_proceso) this.objArchivo.archivo_id_en_turno = facturaGuardada.archivo_id;
          this.layServ.factura_guardada = GLOBAL.duplicarJson(facturaGuardada);
        });
      }
    });
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
    this.subFactG.unsubscribe();
  }

  ngAfterViewInit() {
    this.usuario = this.fun.getUser();
  }

  sacarResponse(res) {
    if (res.quien_llamo === 'layout') {
      this.formarObjArchivo().then(() => {
        if (_.get(this.objArchivo, 'archivo_id_en_turno')) {
          if (this.fun.isEmpty(_.find(this.objArchivo.facturas_localStorage, this.objArchivo.archivo_id_en_turno))) {
            this.layServ.factura_guardada = undefined;
            this.objArchivo.archivo_id_en_turno = undefined;
          }
        }
      });
    }
  }

  formarObjArchivo(factura_para_rellenar?) {
    return new Promise((resolve) => {
      this.objArchivo = {
        factura_en_turno: undefined,
        archivo_id_en_turno: _.get(this.objArchivo, 'archivo_id_en_turno'),
        factura_para_rellenar: undefined,
        archivo_id_para_rellenar: undefined,
      };

      this.objArchivo['facturas_localStorage'] = this.fun.getFacturasguardadas();

      if (this.checkIfFacturacionEnProceso()) {
        this.objArchivo['factura_en_turno'] = this.formarFacturaAGuardar();

        let comparar_con_localStorage = _.find(this.objArchivo.facturas_localStorage, (item) => item.archivo_id == this.objArchivo.archivo_id_en_turno);
        comparar_con_localStorage = _.omit(comparar_con_localStorage, ['archivo_id', 'factura_id', 'cliente', 'suplidor', 'tipo_factura']);
        this.objArchivo['factura_en_turno_storage'] = comparar_con_localStorage;
      }

      if (factura_para_rellenar) {
        this.objArchivo['archivo_id_para_rellenar'] = factura_para_rellenar.archivo_id;
        factura_para_rellenar = _.omit(factura_para_rellenar, ['archivo_id', 'factura_id', 'cliente', 'suplidor', 'tipo_factura']);
        this.objArchivo['factura_para_rellenar'] = factura_para_rellenar;
      }

      resolve(true);
    });
  }

  rellenarVariables() {
    this.dbServ.getTiposFacturas().subscribe((res) => {
      this.fun.logRed(' -----getTiposFacturas-----');
      this.lista_tipos_facturas = res;
    });

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
    this.layServ.factura_guardada = undefined;
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
      this.form.patchValue({ id: null, nombre: 'Cliente contado', direccion: 'Autopista duarte KM 0 el Higuero', telefono: null });
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
              this.layServ.nextRefresh(true);
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
    return new Promise(async (resolve) => {
      let res;
      this.propietario_factura = {};

      if (tipo === 'editar') {
        res = await this.facturaClass.getFacturaById(id);
        res = res['data'];

        this.factura_a_editar = res;
        this.propietario_factura = res.cliente;
        this.propietario_factura['id'] = res.cliente_id;
      } else {
        res = fact;
        this.setPropietario(res);

        const tipo = _.find(this.lista_tipos_facturas, (fact) => fact.id === res['tipo_factura_id']);
        res['tipo_factura'] = tipo ? tipo['descripcion'] : '';
      }

      this.metodo = res.tipo;
      this.FacturaAtrasada = fact ? fact?.FacturaAtrasada : false;

      const fecha_facturacion = fact?.fecha_equivalente ? fact?.fecha_equivalente : GLOBAL.duplicarJson(this.fechaFactura['back']);

      this.fechaFactura['front'] = this.formarFechaFactura(fecha_facturacion)['FechaFactura'];
      this.fechaFactura['back'] = this.fechaFactura['front'];

      this.FechaFacturaMostrar = this.formarFechaFactura(fecha_facturacion)['FechaFacturaMostrar'];

      this.tipoFactura = tipos_facturas[_.lowerCase(res.tipo_factura)];

      await this.calcularPorcientoComprobante().then((res_calculo) => {
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

  setPropietario(arg) {
    if (arg.tipo === 'venta') {
      if (arg.cliente) this.propietario_factura['id'] = arg.cliente_id;
      else arg['cliente'] = { id: null, direccion: arg['NoCliente_direccion'], nombre: arg['NoCliente_nombre'], telefono: '' };
      this.propietario_factura = arg.cliente;

      this.form.patchValue(arg.cliente);
    } else {
      this.propietario_factura['id'] = arg.suplidor_id;
      this.propietario_factura = arg.suplidor;
      this.form.patchValue(arg.suplidor);
    }
  }

  initCambioMenu(arg) {
    if (arg.bool) {
      this.formarObjArchivo().then(() => {
        console.log('this.checkIfFacturacionEnProceso() --> ', this.checkIfFacturacionEnProceso());

        if (this.checkIfFacturacionEnProceso()) {
          let obj;
          let abrirModal = true;
          let archivo_id;

          this.layServ.nextDecisionCambioMenu({ bool: false, ruta: arg.ruta });

          if (_.get(this.objArchivo, 'archivo_id_en_turno')) {
            if (_.isEqual(this.objArchivo.factura_en_turno, this.objArchivo.factura_en_turno_storage)) {
              this.fun.toastWarning('La factura que estaba realizando esta archivada para poder utilizarla luego.', 'AVISO');
              abrirModal = false;
              this.layServ.nextFacturaGuardada(undefined);
            } else {
              obj.texto_modal = 'La factura que esta en proceso ya se encuentra archivada ¿desea sobreescribirla?';
            }
          } else obj = { texto_modal: 'Estas a punto de salir del modulo de facturación, ¿desea guardar la factura para continuarla luego?' };

          this.procesoCambio(abrirModal, archivo_id, obj);
        } else {
          this.fun.logYellow('NO HAY NADA EMPEZADO');
          this.layServ.nextDecisionCambioMenu({ bool: true, ruta: arg.ruta, verificar: true });
          this.layServ.nextFacturaGuardada(undefined);
        }
      });
    }
  }

  procesoCambio(abrirModal, archivo_id, obj) {
    if (abrirModal) {
      if (this.layServ.factura_guardada) this.layServ.factura_guardada['archivo_id'] = archivo_id;
      this.abrirModal('dinamico_texto', obj, 'salir_layout');
    } else {
      this.info_cambio['bool'] = true;
      this.info_cambio['verificar'] = true;
      this.layServ.nextDecisionCambioMenu(this.info_cambio);
    }
  }

  decisionModal(res) {
    if (this.fun.hasValue(res)) this.luegoDecision(res);

    if (this.fun.hasValue(res) && res.bool) {
      this.fechaFactura['front'] = this.formarFechaFactura(res.Date)['FechaFactura'];
      this.fechaFactura['back'] = this.fechaFactura['front'];
      this.FechaFacturaMostrar = this.formarFechaFactura(res.Date)['FechaFacturaMostrar'];
      this.FacturaAtrasada = true;
      this.cuerpo.getSaco();
    }
  }

  objDevueltoResponse(res) {
    if (res && res.tipo_modal === 'buscarCliente') {
      this.propietario_factura = res.data;

      this.form.patchValue(this.propietario_factura);
      this.enfocarInput('cod-0');
      const balance = _.parseInt(this.propietario_factura.balance);
      const maxCred = _.parseInt(this.propietario_factura.maximo_credito);

      if (balance > maxCred - 1000 && balance < maxCred) {
        this.fun.toastWarning(`Credito actual RD$${this.formatoNumero(balance)}  limite: RD$${this.formatoNumero(maxCred)}`, 'PROXIMO A LIMITE DE CREDITO');
      } else if (balance > maxCred) {
        this.fun.toastError(` Credito actual RD$${this.formatoNumero(balance)}            limite: RD$${this.formatoNumero(maxCred)}`, 'SOBRE VALOR DE CREDITO');
      }
      //
    } else if (res && res.tipo_modal === 'buscarSuplidor') {
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

  checkIfFacturaGuardada() {
    return !!this.layServ.factura_guardada;
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
      this.fun.toastWarning('Para facturar a credito debe de seleccionar un cliente', 'Aviso');
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

  trimEndNcf() {
    const input = document.getElementById('ncf') as any;
    const valor = input.value;

    this.setCaretPosition(input, input.value.length - 8);
    valor.substring(0, 3);
    input.value = valor;
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

    this.abrirModal(tipo, obj);
  }

  // =============================================
  //  MODAL CANCELAR
  // =============================================
  cancelarFactura() {
    this.abrirModal('cancelar', null);
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
            this.abrirModal('imprimir', null);
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

            this.abrirModal('cambio', obj);
          }
        }
      }
    }
  }

  luegoDecision(arg) {
    if (arg) {
      if (this.tipoModal === 'imprimir') {
        this.enviarABaseDatos();
      } else if (this.tipoModal === 'cancelar') {
        if (this.action !== 'update') this.resetVariables();
        if (this.action === 'update') this.router.navigateByUrl(`/admin/factura/${this.metodo}/new/0`).then(() => this.resetVariables());
      }
    }

    if (this.tipoModal === 'salir_layout') {
      if (arg) this.agregarFacturaALocalStorage();

      this.info_cambio['bool'] = true;

      this.layServ.nextDecisionCambioMenu(this.info_cambio);
      this.fun.logRed('salir_layout --> ');

      this.layServ.nextFacturaGuardada(undefined);
    } else if (this.tipoModal === 'desplegar_factura') {
      if (arg) this.agregarFacturaALocalStorage();

      setTimeout(() => {
        this.procesoRelleno(this.objArchivo.factura_para_rellenar);
        // asignando el archivo_id de la factura que se va a rellenar como el que estara en turno
        this.objArchivo.archivo_id_en_turno = this.objArchivo.archivo_id_para_rellenar;
      }, 250);
    } else if (this.tipoModal === 'archivar_factura') {
      if (arg) {
        this.agregarFacturaALocalStorage();
        setTimeout(() => {
          modalClass.aquienResponder = 'layout';
          this.layServ.nextRefresh(true);
          this.resetVariables();
        }, 250);
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

    let facturas_localStorage = GLOBAL.duplicarJson(this.objArchivo.facturas_localStorage);
    const factura_a_guardar = GLOBAL.duplicarJson(this.objArchivo.factura_en_turno);

    let index_fact_archivada = _.findIndex(facturas_localStorage, (facts: any) => facts?.archivo_id === this.objArchivo.archivo_id_en_turno);

    if (index_fact_archivada >= 0) {
      factura_a_guardar['archivo_id'] = this.objArchivo.archivo_id_en_turno;
      facturas_localStorage[index_fact_archivada] = factura_a_guardar;
    } else {
      facturas_localStorage = _.orderBy(facturas_localStorage, ['archivo_id'], ['asc']);
      factura_a_guardar['archivo_id'] = facturas_localStorage.length > 0 ? _.last(facturas_localStorage).archivo_id + 1 : 1;
      facturas_localStorage.push(factura_a_guardar);
    }
    facturas_localStorage = _.orderBy(facturas_localStorage, ['archivo_id'], ['asc']);

    this.fun.setFacturasGuardadas(facturas_localStorage);
  }

  archivarFactura() {
    this.formarObjArchivo().then(() => {
      if (this.checkIfFacturacionEnProceso()) {
        let is_guardada;

        if (this.objArchivo.archivo_id_en_turno)
          is_guardada = _.find(this.objArchivo.facturas_localStorage, (fact: any) => fact.archivo_id == this.objArchivo.archivo_id_en_turno);

        const obj = {
          texto_modal: this.fun.hasValue(is_guardada)
            ? 'Esta factura ya esta archivada ¿desea sobreescribirla?'
            : '¿Seguro que desea archivar esta factura para continuarla luego?',
        };

        this.abrirModal('dinamico_texto', obj, 'archivar_factura');
      } else {
        this.fun.toastWarning('Debe de iniciar una factura para archivarla', 'AVISO');
      }
    });
  }

  selectModoFactura(arg) {
    this.is_viaje = false;
    this.is_adelantada = false;

    if (arg === 'viaje') this.is_viaje = true;
    else if (arg === 'adelantada') this.is_adelantada = true;
  }

  // =============================================
  //  OBTENER LA DATA DEL CUERPO
  // =============================================

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
      return GLOBAL.desformatear(GLOBAL.redondearAdos(precio));
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

      const costoRow = GLOBAL.desformatear(row.pre);

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
    this.abrirModal('pendiente', null);
  }

  calcularNuevosPrecios(cant, precio) {
    const pre = precio / cant;
    return GLOBAL.redondearAdos(pre);
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
    const is_guardada = _.find(this.objArchivo.facturas_localStorage, (fact: any) => fact.archivo_id === this.layServ.factura_guardada.archivo_id);

    if (this.fun.hasValue(is_guardada)) {
      modalClass.aquienResponder = 'layout';
      this.layServ.nextSacar({ quien_llamo: 'facturacion', body: this.layServ.factura_guardada });
    }
  }

  formarData() {
    const empleado = this.fun.getUser();
    const TipoFact = this.lista_tipos_facturas.filter((tipo) => tipo.referencia === this.tipoFactura);

    let cuerpo_fact = GLOBAL.duplicarJson(this.CuerpoFactura);

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
      if (this.metodo === 'venta') fecha_venci = moment(new Date()).add(this.propietario_factura.limite_credito, 'days').format('DD/MM/YYYY');
      else fecha_venci = moment(this.fecha_vencimiento).format('DD/MM/YYYY');

      cabecera_fact['fecha_vencimiento'] = fecha_venci;
      cabecera_fact['pagada'] = false;
      cabecera_fact['balance'] = GLOBAL.parseFloatTwoDecimals(this.TOTAL);
      cabecera_fact['devuelta'] = 0;
    } else {
      cabecera_fact['pagada'] = this.is_viaje ? false : true;
      cabecera_fact['balance'] = this.is_viaje ? GLOBAL.parseFloatTwoDecimals(this.TOTAL) : 0;
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
    cabecera_fact['total_factura'] = GLOBAL.parseFloatTwoDecimals(this.TOTAL);
    cabecera_fact['Bruto'] = this.BRUTO;
    cabecera_fact['itbis'] = GLOBAL.parseFloatTwoDecimals(this.ITBIS);
    cabecera_fact['descuento'] = GLOBAL.parseFloatTwoDecimals(this.DESCUENTO);
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
    cabecera_fact['FACTURA_DE'] = this.metodo === 'venta' ? 13 : 14;
    cabecera_fact['tipo'] = this.metodo;
    cabecera_fact['user_id'] = empleado.id;

    cabecera_fact['tiene_nota'] = this.factura_a_editar ? this.factura_a_editar.tiene_nota : false;

    if (this.metodo === 'venta' && this.propietario_factura.vendedor_id) cabecera_fact['vendedor_id'] = Number(this.propietario_factura.vendedor_id);

    return cabecera_fact;
  }

  async enviarABaseDatos() {
    try {
      const cabecera_fact = this.formarData();

      let res;
      const metodo = this.action === 'update' ? 'editar_factura' : '';

      if (metodo === 'editar_factura') res = await this.dbServ.editarFactura(this.factura_a_editar.id, cabecera_fact).toPromise();
      else res = await this.dbServ.createFacturas(cabecera_fact).toPromise();

      let res_factura = res['data'];

      if (this.layServ.factura_guardada) this.revisarLocalStorage();

      await this.resetVariables();

      res_factura['FACTURA_DE'] = this.metodo;

      const obj = { data: res_factura, type: 'facturacion' };

      if (this.metodo === 'venta') {
        this.pdfServ.generatePdf(obj).then((res_pdf) => {
          if (res_pdf.status === 'si') {
            const objBase = { base64: res_pdf.body, filename: res_pdf.file, type: 'facturacion' };
            this._ipc.send('printBase64', objBase);
          }
        });
      }

      this.layServ.nextCheckCuadreToday(true);
    } catch (error) {
      console.error(error);
      try {
        this.fun.toastError(error.error.msg, 'ERROR');
      } catch (error) {
        console.error('error--> ', error);
      }
    }
  }

  async printBase64Res(res) {
    if (res.status === 'si') {
    } else {
      this.fun.toastError('Error imprimiendo la factura.', 'ERROR');
    }
  }
}
