import { Component, OnInit, OnDestroy, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from '../../core/javascript/moment';
import * as _ from 'lodash';
import { CuerpoFacturaComponent } from './cuerpo-factura/cuerpo-factura.component';
import { tipos_facturas } from '../../core/typescript/GLOBAL';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { FacturacionService } from './facturacion.service';
import { ArticuloC } from '../registros/articulos/articulo';
import { TiposFacturaC, tipo_factura_id } from './factura';
import { NcfC } from '../registros/ncf/ncf';
import { PdfService } from '../../core/services/pdf/pdf.service';
import { PendienteFormComponent } from '../components/formularios en modales/pendiente-form/pendiente-form.component';
import { FormCantidadEfectivoComponent } from '../components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component';
import { BuscarClienteSuplidorComponent } from '../components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { FactsLocalStorage } from './factsLocalStorage';
import { ClienteC } from '../registros/registro-clientes/cliente';
import { SuplidorC } from '../registros/registro-suplidores/suplidores';
import { fun } from '../../core/services/functions.service';
import { VehiculoC } from '../registros/registro-vehiculo/vehiculo';
import { teclasCode } from '../../core/typescript/constantes';
import { Permisos } from '../../core/typescript/permisos';
import { ConfigI } from '../../core/typescript/config-interface';
import { SingletonService } from '../../core/services/singleton.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { ConfirmacionImprimirComponent } from './confirmacion-imprimir/confirmacion-imprimir.component';

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.scss'],
})
export class FacturacionComponent extends FactsLocalStorage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(CuerpoFacturaComponent, { static: true }) cuerpo: CuerpoFacturaComponent;

  secuenciaKeys = [];
  info_cambio: any;
  productosDevueltos: any[];
  hasPermissionPreVenta: boolean;
  hasPermissionCamiones: boolean;

  @HostListener('window:keydown', ['$event'])
  @HostListener('window:keyup', ['$event'])
  handleKeyboardEvent(event: any) {
    event.stopPropagation();
    const key = event.keyCode;
    const secuenciasAceptadas = [teclasCode._control, teclasCode._P, teclasCode._G];

    if (event.type === 'keydown') {
      if (!this.secuenciaKeys.includes(key) && secuenciasAceptadas.includes(key)) this.secuenciaKeys.push(key);
    } else if (event.type === 'keyup') {
      const combinacion = _.join(this.secuenciaKeys, '_');
      this.secuenciaKeys = [];

      if (combinacion === `${teclasCode._control}_${teclasCode._P}`) {
        if (fun.hasValue(document.activeElement.id)) fun.desEnfocarInput(document.activeElement.id);
        this.imprimirFactura();
      }

      if (combinacion === `${teclasCode._control}_${teclasCode._G}`) {
        if (fun.hasValue(document.activeElement.id)) fun.desEnfocarInput(document.activeElement.id);
        this.archivarFactura();
      }

      if (fun.hasValue(this.overlay)) this.mover_indicador_camion(key);
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
  tipoFacturaAnterior;
  lista_tipos_facturas;
  NCFcompra;
  CostoYgasto;
  metodo;
  is_print = false;

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
  tipoFacturaClass = new TiposFacturaC();
  ncfClass = new NcfC();
  clienteClass = new ClienteC();
  suplidorClass = new SuplidorC();
  vehiculoClass = new VehiculoC();
  numero_pre_factura;
  pre_factura_selected;

  overlay;
  camionesSelected: any;
  camiones = [];
  camion_row;
  filterCamionesTargets;
  copyCamiones;
  permissions = Permisos;
  configApp: ConfigI;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private localeService: BsLocaleService,
    public factServ: FacturacionService,
    public pdfServ: PdfService,
    private permissionsService: NgxPermissionsService,
  ) {
    super(pdfServ);

    this.form = this.fb.group({ id: [], nombre: [], direccion: [], telefono: [] });

    this.dpConfig = Object.assign({}, { showWeekNumbers: false, minDate: new Date(), dateInputFormat: 'DD/MM/YYYY' });

    setInterval(() => (this.fecha = this.my_timeDateFormater(new Date())), 1000);
  }

  ngOnInit() {
    this._init_mixin({ component: 'cabeza_factura', is_routing: true });
    this.localeService.use('es');
    this.configApp = SingletonService.configServ.getConfig({ isPromise: false });
    this.rellenarVariables();

    this.permissionsService.hasPermission(Object.values(this.permissions.pre_venta)).then((result) => (this.hasPermissionPreVenta = result));
    this.permissionsService.hasPermission(this.permissions.factura_venta.seleccionar_camion_en_facturacion).then((result) => (this.hasPermissionCamiones = result));
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  ngAfterViewInit() {
    this.getFacturasGuardadas();
  }

  formarObjArchivo(factura_para_rellenar?) {
    return new Promise((resolve) => {
      this.objArchivo = {
        factura_en_turno: undefined,
        factura_para_rellenar: undefined,
        // archivo_id_en_turno: undefined,
      };

      this.objArchivo['facturas_localStorage'] = fun.getFacturasguardadas();

      if (this.checkIfFacturacionEnProceso()) {
        this.objArchivo['factura_en_turno'] = this.formarFacturaAGuardar();

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
      [this.fecha_vencimiento, this.fecha_equivalente, this.fecha_viaje] = Array(3).fill(new Date());
      [this.is_adelantada, this.is_viaje, this.FacturaAtrasada] = Array(3).fill(false);
      [this.CuerpoFactura, this.articulosAcambiar, this.camionesSelected] = Array(3).fill([]);
      [this.DESCUENTO, this.BRUTO, this.TOTAL, this.ITBIS, this.camion_row] = Array(5).fill(0);
      [this.numero_pre_factura, this.NCFcompra, this.pre_factura_selected, this.action, this.factura_a_editar, this.propietario_factura, this.objArchivo, this.factura_guardada, this.overlay] = Array(9).fill(undefined);
      this.info_cambio = {};
      this.fechaFactura = {};
      this.CostoYgasto = '';

      this.metodo = this.route.snapshot.params['tipo'];

      this.action = this.route.snapshot.params['action'];
      const id_factura = this.route.snapshot.params['id'];
      this.fechaFactura['front'] = this.formarFechaFactura(new Date())['FechaFactura'];
      this.fechaFactura['back'] = this.fechaFactura['front'];
      this.FechaFacturaMostrar = this.formarFechaFactura(new Date())['FechaFacturaMostrar'];
      this.modo_factura = this.metodo == 'pre-venta' ? 'Pre_factura' : 'normal';
      this.condicion_fact = this.metodo == 'pre-venta' ? 'Crédito' : 'Contado';
      this.forma_pago = 'Efectivo';

      this.filterCamionesTargets = ['marca', 'modelo', 'anio', 'propietario.nombre', 'propietario.apellido'];

      this.factServ.setTipos(this.metodo, (res) => {
        if (res) {
          this.tipoFactura = this.factServ.tipoFactura;
          this.TiposFacturas = this.factServ.TiposFacturas;
          this.tipos_facturas = this.factServ.tipos_facturas;
          this.TiposCostosGastos = this.factServ.TiposCostosGastos;
          this.tipos_costosYgastos = this.factServ.tipos_costosYgastos;
        }
      });

      if (this.metodo == 'venta') {
        this.form.patchValue({ id: null, nombre: 'Cliente contado', direccion: this.configApp.direccion_empresa, telefono: null });
        if (this.hasPermissionCamiones) this.getCamiones();
      } else {
        if (fun.hasValue(this.form)) this.form.reset();
      }

      if (this.action == 'update') {
        this.factura_a_editar = {};
        this.rellenarCampos(id_factura, 'editar').then(() => {
          this.cuerpo.llenarFactura(this.factura_a_editar.detalle_facturas);
          this.cuerpo.seleccionarCampoEnTurno();
        });
      } else {
        setTimeout(() => {
          if (this.metodo != 'pre-venta') this.enfocarInput('tipoFact');
          else this.abrirModalFiltro();
        }, 5);
      }
    });
  }

  procesoRelleno(factura) {
    return new Promise((resolve) => {
      try {
        this.rellenarCampos(null, 'fact_guardada', factura).then(() => {
          this.cuerpo.seleccionarCampoEnTurno();

          this.cuerpo.llenarFactura(factura['detalle_facturas'], true).then((res) => {
            setTimeout(() => {
              this.getCuerpoFactura({ tipo: 'cuerpo', data: factura['detalle_facturas'] });

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
        let factura;
        this.propietario_factura = {};

        if (tipo == 'editar') {
          factura = await this.facturaClass.getFacturaById(id);
          factura = factura['data'];

          this.factura_a_editar = factura;
          this.propietario_factura = factura.cliente;
          this.propietario_factura['id'] = factura.cliente_id;
          this.form.patchValue(this.propietario_factura);
        } else {
          factura = fact;
          this.setPropietario(factura);
          const tipo = _.find(this.lista_tipos_facturas, (fact) => fact.id == factura['tipo_factura_id']);
          factura['tipo_factura'] = tipo ? tipo['descripcion'] : '';
        }

        this.metodo = this.pre_factura_selected ? 'venta' : factura.tipo;
        this.FacturaAtrasada = fact ? fact?.FacturaAtrasada : false;

        const fecha_facturacion = fact?.fecha_equivalente ? fact?.fecha_equivalente : fun.duplicarJson(this.fechaFactura['back']);

        this.fechaFactura['front'] = this.formarFechaFactura(fecha_facturacion)['FechaFactura'];
        this.fechaFactura['back'] = this.fechaFactura['front'];

        this.FechaFacturaMostrar = this.formarFechaFactura(fecha_facturacion)['FechaFacturaMostrar'];
        this.tipoFactura = tipos_facturas[_.lowerCase(factura.tipo_factura)];

        if (fun.hasValue(this.tipoFactura) && this.tipoFactura != '00' && this.tipoFactura != '02') {
          const tipoFact = this.lista_tipos_facturas.find((tipo) => tipo.referencia === this.tipoFactura);
          const paquete = await this.ncfClass.getAll({ afterPath: `custom/${tipoFact.id}/true` });
          this.paqueteComprobante = paquete.data;
        }

        if (factura.is_viaje) this.fecha_viaje = new Date(factura.fecha_viaje);
        else this.fecha_viaje = new Date();

        if (factura.tipo == 'compra') this.fecha_vencimiento = new Date(factura.fecha_vencimiento);
        else this.fecha_vencimiento = new Date();

        this.is_viaje = factura.is_viaje;
        this.condicion_fact = this.pre_factura_selected ? this.condicion_fact : factura.condicion;

        this.NCFcompra = factura.tipo == 'compra' ? factura.numero_comprobante : undefined;
        this.CostoYgasto = factura.tipo == 'compra' ? factura.costoYgasto : '';

        this.modo_factura = this.pre_factura_selected ? this.modo_factura : factura.is_viaje ? 'viaje' : factura.is_adelantada ? 'adelantada' : 'normal';
        this.tipoFactura = this.pre_factura_selected ? '02' : this.tipoFactura;

        resolve(true);
      });
    });
  }

  async setPropietario(arg) {
    if (arg.tipo == 'venta' || arg.tipo == 'Pre_factura') {
      if (fun.hasValue(arg.cliente_id)) {
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
              fun.toastWarning('La factura que estaba realizando esta archivada para poder utilizarla luego.', 'AVISO');
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
    if (fun.hasValue(factura)) {
      if (this.factura_guardada && this.factura_guardada?.archivo_id == factura.archivo_id) {
        fun.toastWarning('Ya esta factura esta seleccionada.', 'AVISO');
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
    this.factura_guardada = fun.duplicarJson(factura);
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

  checkNumeroPreFactura() {
    if (fun.hasValue(this.numero_pre_factura)) {
      if (this.numero_pre_factura.includes('_')) fun.toastWarning('Numero de Pre-factura incompleto', 'Aviso');
      else {
        this.buscarPreFactura(this.numero_pre_factura);
      }
    } else {
      if (this.condicion_fact == 'Contado') this.enfocarInput('nom');
      else {
        this.abrirModalFiltro();
        this.desEnfocarInput('numero_pre_factura');
      }
    }
  }

  selectPreFactura(data, modalInstance) {
    this.pre_factura_selected = data;

    this.rellenarCampos(null, 'pre-factura', data).then(() => {
      this.cuerpo.llenarFactura(data.detalle_facturas).then((res) => {
        setTimeout(() => this.cuerpo.seleccionarCampoEnTurno(), 250);
      });
    });

    modalInstance.closeModal(modalInstance.id, 'continuar');
  }

  checkIfFacturacionEnProceso() {
    return this.CuerpoFactura.length;
  }

  checkCambiosModoyCondicionFactura(arg) {
    const sali_de = arg.id;
    const valor = arg.value;
    const condicion = this.condicion_fact;
    const tipo_factura = this.tipoFactura;
    let buscar = false;

    if (this.metodo == 'venta' || this.metodo == 'pre-venta') {
      setTimeout(() => {
        const voy_a = document.activeElement.id;
        const nombre = this.propietario_factura ? this.propietario_factura.nombre : 'Cliente contado';

        if (sali_de == 'venta' && condicion == 'Crédito' && nombre == 'Cliente contado') {
          if (voy_a != 'fecha_viaje' && voy_a == 'nom') buscar = true;
        }

        if (sali_de == 'venta' && tipo_factura == '01' && voy_a != 'fecha_viaje' && nombre == 'Cliente contado') buscar = true;

        if (sali_de == 'venta' && valor == 'adelantada' && nombre == 'Cliente contado') buscar = true;

        if (sali_de == 'fecha_viaje') document.getElementById('btnCamion').click();

        if (buscar) this.abrirModalFiltro();

        if (this.modo_factura != 'viaje') this.camionesSelected = [];
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

            if (fun.hasValue(this.paqueteComprobante.fecha_valida)) {
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

              const msg = this.paqueteComprobante.msg === 'Ultimo comprobante de este paquete' ? `Ultimo comprobante para ${tipoFact.descripcion}.` : `Los comprobantes para ${tipoFact.descripcion} se estan agotando, solo quedan ${restante}`;

              if (secuencia >= limite) fun.toastWarning(msg, 'AVISO');
            }
            resolve(true);
          } catch (error) {
            if (fun.isEmpty(error.error.msg)) fun.toastError('Error calculando la secuencia de comprobantes.', 'AVISO');

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
      fun.toastError('El tipo de factura introducido es incorrecto.', 'ERROR');
      this.enfocarInput('tipoFact');
    }
  }

  saltar(salioDe, valor?) {
    let siguiente_input = '';
    let is_enforcar = true;

    let is_buscar_cliente = false;

    switch (salioDe) {
      case 'tipo':
        if (this.tipos_facturas.includes(valor)) siguiente_input = 'condicion';
        else {
          fun.toastError('El tipo de factura introducido es incorrecto.', 'ERROR');
          this.enfocarInput('tipoFact');
          is_enforcar = false;
        }
        break;

      case 'condicion':
        siguiente_input = this.metodo == 'compra' ? 'gastoDe' : 'venta';
        break;

      case 'gastoDe':
        if (this.metodo == 'compra' && !this.tipos_costosYgastos.includes(valor)) {
          fun.toastError('El tipo de costo y gasto introducido es incorrecto.', 'ERROR');
        } else {
          this.CostoYgasto = valor;
          siguiente_input = 'ncf';
        }
        break;

      case 'ncf':
        if (!this.NCFcompra.includes('_')) {
          if (this.condicion_fact === 'Crédito') siguiente_input = 'fecha_vencimiento';
          else {
            is_enforcar = false;
            is_buscar_cliente = true;
          }
        } else {
          fun.toastWarning('Numero de comprobante incorrecto', 'Aviso');
        }
        break;

      case 'fecha_vencimiento':
        is_enforcar = false;
        is_buscar_cliente = true;
        break;

      case 'venta':
        let debe_buscar = false;

        if (this.modo_factura == 'normal') {
          if (this.condicion_fact == 'Contado') {
            if (this.hasPermissionPreVenta) siguiente_input = 'numero_pre_factura';
            else siguiente_input = 'nom';
          } else {
            debe_buscar = true;
          }
        } else if (this.modo_factura == 'viaje') {
          siguiente_input = 'fecha_viaje';
        } else if (this.modo_factura == 'adelantada') {
          if (fun.isEmpty(this.propietario_factura) || this.propietario_factura.nombre == 'Cliente contado') is_enforcar = false;
          else this.cuerpo.seleccionarCampoEnTurno();
        } else {
          debe_buscar = true;
        }

        if (debe_buscar) {
          is_enforcar = false;
          is_buscar_cliente = true;
        }
        break;

      case 'fecha_viaje':
        is_enforcar = false;
        break;

      case 'numero_pre_factura':
        is_enforcar = false;
        this.checkNumeroPreFactura();
        break;

      case 'nom':
        siguiente_input = 'dir';
        break;

      case 'dir':
        this.iniciarFactura();
        break;

      default:
        break;
    }

    if (is_enforcar) this.enfocarInput(siguiente_input);
    else this.desEnfocarInput(salioDe);

    if (is_buscar_cliente) this.abrirModalFiltro();
  }

  iniciarFactura() {
    if (this.condicion_fact !== 'Crédito') {
      this.propietario_factura = this.form.value;

      setTimeout(() => this.cuerpo.seleccionarCampoEnTurno(), 10);
    } else {
      fun.toastWarning('Para facturar a crédito debe de seleccionar un cliente', 'Aviso');
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

  openOverlay(event, overlay) {
    this.overlay = overlay;
    this.overlay.toggle(event);
    setTimeout(() => this.enfocarInput('searchCamion'), 5);
    if (event) event.stopPropagation();
  }

  seleccionarCamion(camion?) {
    if (this.camiones.length) {
      const camion_en_turno = fun.duplicarJson(fun.hasValue(camion) ? camion : this.camiones[this.camion_row]);

      if (this.checkCamionIsSelected(camion_en_turno)) {
        _.pull(this.camionesSelected, _.find(this.camionesSelected, { vehiculo_id: camion_en_turno.id }));
      } else {
        this.camionesSelected.push({ vehiculo_id: camion_en_turno.id });
      }
    } else {
      if (this.camionesSelected.length) this.saliendoDeCamionOverlay();
      else fun.toastWarning('Debe de seleccionar almenos un camión para el viaje.', 'Aviso');
    }
  }

  checkCamionIsSelected(camion) {
    return _.some(this.camionesSelected, { vehiculo_id: camion.id });
  }

  checkCamionSeleccionado() {
    const containCamiones = document.getElementById('overlayCamion');
    setTimeout(() => {
      const voy_a = document.activeElement;

      if (!containCamiones.contains(voy_a)) {
        if (!this.camionesSelected.length) {
          fun.toastWarning('Debe de seleccionar almenos un camión para el viaje.', 'Aviso');
          setTimeout(() => this.enfocarInput('searchCamion'), 5);
        } else {
          if (this.overlay) this.saliendoDeCamionOverlay();
        }
      } else {
        setTimeout(() => this.enfocarInput('searchCamion'), 5);
      }
    }, 250);
  }

  cerrarOverlayCamion() {
    this.filterCamion(this.copyCamiones);
    this.overlay.hide();
    this.camion_row = 0;
  }

  getCamionLabel(camion) {
    return `${camion.marca} ${camion.modelo} - ${camion.anio} (${camion.propietario.nombre} ${camion.propietario.apellido})`;
  }

  mover_indicador_camion(key) {
    if (key == teclasCode._arriba) {
      if (this.camion_row == 0) this.camion_row = this.camiones.length - 1;
      else this.camion_row--;
    } else if (key == teclasCode._abajo) {
      if (this.camion_row == this.camiones.length - 1) this.camion_row = 0;
      else this.camion_row++;
    } else if (key == teclasCode._esc) {
      this.saliendoDeCamionOverlay('teclado');
    }

    fun.scrollTo({ id: `overlayCamion-${this.camion_row}`, behavior: 'smooth', block: 'center', inline: 'center' });
  }

  saliendoDeCamionOverlay(where?) {
    setTimeout(() => {
      if (!this.camionesSelected.length) {
        fun.toastWarning('Debe de seleccionar almenos un camión para el viaje.', 'Aviso');
      } else {
        if (fun.isEmpty(where) || where != 'teclado') {
          if (fun.isEmpty(this.propietario_factura) || fun.isEmpty(this.propietario_factura?.id)) this.abrirModalFiltro();
          else this.cuerpo.seleccionarCampoEnTurno();

          this.cerrarOverlayCamion();
        } else {
          if (where == 'teclado') {
            this.desEnfocarInput('searchCamion');

            this.cerrarOverlayCamion();
          }
        }
      }
    }, 5);
  }

  async getCamiones() {
    const extra = { afterPath: `filtro/ `, parameters: { paginado: false } };

    this.vehiculoClass.getAll(extra).then((res) => {
      this.camiones = res['data'].map((camion) => {
        camion.selected = false;
        return camion;
      });

      this.copyCamiones = fun.duplicarJson(this.camiones);
    });
  }

  filterCamion(camionesFiltrados) {
    this.camiones.length = 0;
    for (const camion of camionesFiltrados) this.camiones.push(camion);
    this.camion_row = 0;
    fun.scrollTo({ id: `overlayCamion-${this.camion_row}`, behavior: 'smooth', block: 'center', inline: 'center' });
  }

  // =============================================
  //  MODAL PARA FILTRAR CLIENTES & SUPLIDORES
  // =============================================

  abrirModalFiltro() {
    const input_activo = document?.activeElement?.id;

    if (fun.hasValue(input_activo)) this.desEnfocarInput(input_activo);
    const metodo = this.metodo == 'pre-venta' ? 'venta' : this.metodo;

    this.handleModalForm({
      component: BuscarClienteSuplidorComponent,
      inputs: { metodo: metodo, palabra_a_buscar: ' ' },
      id: 'buscarCliente',
      header: this.metodo === 'venta' || this.metodo == 'pre-venta' ? 'BUSCAR CLIENTE' : 'BUSCAR SUPLIDOR',
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
      if (this.action == 'update') this.router.navigateByUrl(`/admin/manipular/buscarFactura/solo_ver`).then(() => this.resetVariables());
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

    if (_.has(obj, 'cancelarFunction') && fun.hasValue(obj.cancelarFunction)) {
      fun.pushAt(config.botones.dinamico, 0, { clase: 'btn btn-blanco mr-2', function: (instance) => obj.cancelarFunction(instance), label: 'Cancelar', disable: false });
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
    if (!this.propietario_factura) {
      if (this.metodo == 'compra') fun.toastWarning('Factura no tiene suplidor seleccionado', 'Aviso');
      else fun.toastWarning('Factura no tiene cliente seleccionado', 'Aviso');
    } else {
      if (this.CuerpoFactura.length == 0) {
        fun.toastWarning('Factura incompleta!!!', 'Aviso');
        fun.enfocarInput('cod-0');
      } else {
        if (this.TOTAL == 0) {
          fun.toastWarning('Total de la factura no puede ser 0', 'Aviso');
          fun.enfocarInput('cod-0');
        } else {
          if (this.condicion_fact == 'Crédito' || this.is_viaje || this.modo_factura == 'Pre_factura') {
            const obj = { modo_factura: this.modo_factura, condicion_fact: this.condicion_fact, metodo: this.metodo };

            this.handleModalForm({
              component: ConfirmacionImprimirComponent,
              inputs: obj,
              id: 'confirmacionImprimir',
              header: 'Confirmación',
              width: '30rem',
              botones: {
                aceptar: { show: false, disable: false },
                cancelar: { show: false, disable: false },
                dinamico: [
                  { clase: 'btn btn-blanco mr-2', function: (instance) => this.closeModal(instance), label: 'Cancelar', disable: false },
                  { btn_id: 'btnConfirmar', clase: 'btn btn-verde', function_in_other_component: 'btn_aceptar', label: 'Confirmar', disable: false },
                ],
              },
            });
          } else {
            let articulos_a_cambiar = false;

            if (this.metodo == 'compra') {
              const cuerpo_fact = fun.duplicarJson(this.CuerpoFactura);
              this.newCuerpo = await this.revisarPrecios(cuerpo_fact);
            }

            if (this.articulosAcambiar.length > 0) articulos_a_cambiar = true;

            const obj = {
              modo_factura: this.modo_factura,
              condicion_fact: this.condicion_fact,
              metodo: this.metodo,
              total_factura: this.TOTAL,
              efectivo: this.action == 'update' ? this.factura_a_editar.devuelta + this.factura_a_editar.total_factura : 0,
              tipo_modal: 'devuelta',
              formaPago: this.action == 'update' ? this.factura_a_editar.forma_pago : 'Efectivo',
              factura_de: this.metodo,
              cambios_articulos: articulos_a_cambiar,
            };

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

    let facturas_localStorage = fun.duplicarJson(this.objArchivo.facturas_localStorage);

    const factura_a_guardar = fun.duplicarJson(this.objArchivo.factura_en_turno);

    let index_fact_archivada = _.findIndex(facturas_localStorage, (facts: any) => facts?.archivo_id === this.factura_guardada?.archivo_id);

    if (!fun.isEmpty(this.propietario_factura.id)) factura_a_guardar[this.metodo === 'venta' || this.metodo == 'pre-venta' ? 'cliente' : 'suplidor'] = this.propietario_factura;

    if (index_fact_archivada && index_fact_archivada >= 0) {
      factura_a_guardar['archivo_id'] = this.factura_guardada?.archivo_id;
      facturas_localStorage[index_fact_archivada] = factura_a_guardar;
    } else {
      facturas_localStorage = _.orderBy(facturas_localStorage, ['archivo_id'], ['asc']);
      factura_a_guardar['archivo_id'] = facturas_localStorage.length > 0 ? _.last(facturas_localStorage).archivo_id + 1 : 1;

      facturas_localStorage.push(factura_a_guardar);
    }

    facturas_localStorage = _.orderBy(facturas_localStorage, ['archivo_id'], ['asc']);

    fun.setFacturasGuardadas(facturas_localStorage);
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

        if (this.factura_guardada && this.factura_guardada?.archivo_id) is_guardada = _.find(this.objArchivo.facturas_localStorage, (fact: any) => fact.archivo_id == this.factura_guardada?.archivo_id);

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
      fun.toastWarning('Debe de iniciar una factura para archivarla', 'AVISO');
    }
  }

  selectModoFactura(arg) {
    this.is_viaje = false;
    this.is_adelantada = false;
    this.camionesSelected = [];
    if (fun.isEmpty(this.tipoFactura)) this.tipoFactura = this.tipoFacturaAnterior;

    if (arg === 'viaje') this.is_viaje = true;
    else if (arg === 'adelantada') this.is_adelantada = true;
    else if (arg === 'Pre_factura') {
      this.tipoFacturaAnterior = this.tipoFactura;
      this.tipoFactura = null;
    }
  }

  // =============================================
  //  OBTENER LA DATA DEL CUERPO
  // =============================================git

  getCuerpoFactura(arg) {
    if (arg.tipo == 'cuerpo') {
      this.CuerpoFactura = arg.data;

      if (this.metodo === 'venta' || this.metodo == 'pre-venta') {
        this.CuerpoFactura.map((articulo) => {
          articulo.retirado = this.modo_factura === 'adelantada' ? 0 : articulo.cantidad_en_unidades;
          articulo.retirado_en_venta = this.modo_factura === 'adelantada' ? 0 : articulo.cantidad_en_unidades;
          return articulo;
        });
      }
    }

    if (arg.tipo == 'devuelto') {
      this.productosDevueltos = arg.data;
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
      return fun.desformatear(fun.redondearAdos(precio));
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
            temporal.precio = fun.desformatear(precio);
            temporal.costo = fun.desformatear(costo);
          }
        } else {
          if (contenido.precio) {
            cantHijo = contenido.cantidad;
            const prePadre = this.calcularNuevosPrecios(cantPadre, precioRow);
            const cosPadre = this.calcularNuevosPrecios(cantPadre, costoRow);
            const precio = this.calcularNuevosPrecios(cantHijo, fun.redondearAdos(prePadre));
            const costo = this.calcularNuevosPrecios(cantHijo, fun.redondearAdos(cosPadre));
            temporal.precio = fun.desformatear(precio);
            temporal.costo = fun.desformatear(costo);
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

      const costoRow = fun.desformatear(row.pre);

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

      //
    } else if (arg.modal_id == 'confirmacionImprimir') {
      this.is_print = arg.is_print;
      this.enviarABaseDatos();
      //
    } else if (arg.modal_id == 'cambioEfectivo') {
      this.is_print = arg.is_print;
      this.Devuelta = arg.obj.devuelta;
      this.forma_pago = arg.obj.forma_pago;

      if (this.metodo === 'compra') {
        if (arg.obj.decision_cambio) await this.cambiarCostos();

        this.CuerpoFactura = this.newCuerpo;
        this.enviarABaseDatos();
      } else {
        this.enviarABaseDatos();
      }

      //
    } else if (arg.modal_id == 'buscarCliente') {
      this.propietario_factura = arg.data;

      this.form.patchValue(this.propietario_factura);
      const balance = _.parseInt(this.propietario_factura.balance);
      const maxCred = _.parseInt(this.propietario_factura.maximo_credito);

      if (balance > maxCred - 1000 && balance < maxCred) {
        fun.toastWarning(`Credito actual RD$${this.formatoNumero(balance)}  limite: RD$${this.formatoNumero(maxCred)}`, 'PROXIMO A LIMITE DE CREDITO');
      } else if (balance > maxCred) {
        fun.toastError(` Credito actual RD$${this.formatoNumero(balance)}            limite: RD$${this.formatoNumero(maxCred)}`, 'SOBRE VALOR DE CREDITO');
      }

      this.cuerpo.seleccionarCampoEnTurno();
    }
  }

  calcularNuevosPrecios(cant, precio) {
    const pre = precio / cant;
    return fun.redondearAdos(pre);
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

    if (fun.hasValue(is_guardada)) this.quitarFacturaGuardada(this.factura_guardada?.archivo_id);
  }

  formarData() {
    const tipoFact = _.find(this.lista_tipos_facturas, { referencia: this.tipoFactura });
    const tipoPreFactura = _.find(this.lista_tipos_facturas, { descripcion: 'Pre_factura' });

    let cuerpo_fact = [...fun.duplicarJson(this.CuerpoFactura), ...this.productosDevueltos];

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

      if (this.metodo === 'venta' || this.metodo == 'pre-venta') {
        fecha_venci = moment(new Date()).add(this.propietario_factura.limite_credito, 'days').format('DD/MM/YYYY');
      } else fecha_venci = moment(this.fecha_vencimiento).format('DD/MM/YYYY');

      cabecera_fact['fecha_vencimiento'] = fecha_venci;
      cabecera_fact['pagada'] = false;
      cabecera_fact['balance'] = fun.parseFloatTwoDecimals(this.TOTAL);
      cabecera_fact['devuelta'] = 0;
    } else {
      cabecera_fact['pagada'] = this.is_viaje ? false : true;
      cabecera_fact['balance'] = this.is_viaje ? fun.parseFloatTwoDecimals(this.TOTAL) : 0;
      cabecera_fact['devuelta'] = this.is_viaje ? 0 : this.Devuelta;
    }
    cabecera_fact['fecha_valida'] = this.paqueteComprobante ? (this.paqueteComprobante.fecha_valida !== null ? moment(this.paqueteComprobante.fecha_valida).format('DD/MM/YYYY') : null) : null;

    cabecera_fact['tipo_factura_id'] = this.modo_factura == 'Pre_factura' ? tipoPreFactura.id : tipoFact.id;
    cabecera_fact['numero_comprobante'] = this.metodo === 'venta' || this.metodo == 'pre-venta' ? null : this.NCFcompra;
    cabecera_fact['costoYgasto'] = this.metodo === 'venta' || this.metodo == 'pre-venta' ? null : this.CostoYgasto;
    cabecera_fact['numero_factura'] = null;
    cabecera_fact['total_factura'] = fun.parseFloatTwoDecimals(this.TOTAL);
    cabecera_fact['Bruto'] = this.BRUTO;
    cabecera_fact['itbis'] = fun.parseFloatTwoDecimals(this.ITBIS);
    cabecera_fact['descuento'] = fun.parseFloatTwoDecimals(this.DESCUENTO);
    cabecera_fact['estado'] = true;
    cabecera_fact['is_adelantada'] = this.is_adelantada;
    cabecera_fact['is_viaje'] = this.is_viaje;
    cabecera_fact['is_nota'] = false;
    cabecera_fact['camiones_viajes'] = this.camionesSelected;
    cabecera_fact['pre_factura'] = fun.hasValue(this.pre_factura_selected) ? this.pre_factura_selected?.id : null;

    if (this.metodo === 'venta' || this.metodo == 'pre-venta') {
      if (fun.isEmpty(this.propietario_factura) || fun.isEmpty(this.propietario_factura.id)) {
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
    cabecera_fact['FACTURA_DE'] = this.modo_factura == 'Pre_factura' ? tipo_factura_id.Pre_factura : this.metodo == 'venta' ? (this.condicion_fact == 'Contado' ? tipo_factura_id.Venta_Contado : tipo_factura_id.Venta_Credito) : tipo_factura_id.Compra;
    cabecera_fact['tipo'] = this.modo_factura == 'Pre_factura' ? 'Pre_factura' : this.metodo;

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

    if (this.factura_guardada) this.revisarLocalStorage();

    this.facturaClass.parseDataToPdf(res['data']).then(async (factura_parsed) => {
      const obj = { data: factura_parsed, type: 'facturacion' };

      this.pdfServ.generatePdf({ oPdf: obj, imprimir: this.is_print }).catch((err) => fun.toastError('Error imprimiendo la factura', 'ERROR'));

      this.layServ.nextCheckCuadreToday(true);

      if (metodo === 'editar_factura') this.router.navigateByUrl('/admin/manipular/buscarFactura/solo_ver');
      else await this.resetVariables();
    });
  }
}
