import { EmpleadoC } from '@registros/registro-empleados/empleado.utils';
import { RetornarDevueltoComponent } from './cuerpo-factura/retornar-devuelto/retornar-devuelto.component';
import { MenuOpcionesExtraComponent } from './menu-opciones-extra/menu-opciones-extra.component';

import { Component, OnInit, OnDestroy, ViewChild, HostListener, AfterViewInit, inject, OnChanges, SimpleChanges, Input, signal } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { CuerpoFacturaComponent } from './cuerpo-factura/cuerpo-factura.component';
import { FacturacionService } from './facturacion.service';
import { ArticuloC } from '@registros/articulos/articulo';
import { tipoDocFacturacion, FacturasI, actionFacturacion, comprobanteNormal, comprobanteElectronico, tFacturaKey, comprobante } from './factura';
import { NcfC } from '@registros/ncf/ncf';
import { PendienteFormComponent } from '@components/formularios en modales/pendiente-form/pendiente-form.component';
import { FormCantidadEfectivoComponent } from '@components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component';
import { BuscarClienteSuplidorComponent } from '@components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { FactsLocalStorage } from './factsLocalStorage';
import { ClienteC } from '@registros/registro-clientes/cliente';
import { SuplidorC } from '@registros/registro-suplidores/suplidores';
import { fun } from '@core/services/functions.service';
import { VehiculoC } from '@registros/registro-vehiculo/vehiculo';
import { seriesDGII, teclasCode, serie } from '@core/typescript/constantes';
import { Permisos } from '@core/typescript/permisos';
import { ConfigI } from '@core/interface/config-interface';
import { Ss } from '@core/services/singleton.service';
import { ConfirmacionImprimirComponent } from '@components/formularios en modales/confirmacion-imprimir/confirmacion-imprimir.component';
import { PdfService } from '@core/services/reports/pdf/pdf.service';
import { ConfigArticuloC, ConfigArticuloI } from '@registros/articulos/configuracion_articulos/articulos_configuracion';
import { HtmlElementsService } from '@core/services/html-elements.service';
import { DateUtils } from '@vjose1903/dateutils';
import { TipoCantidadEfectivo } from '@components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.model';
import Big from 'big.js';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';
import { confirmationButtons, ICallbackModal, modalActionsE, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { CanComponentDeactivate, CanDeactivateGuard } from '@core/guard/can-deactivate.guard';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';


const moment = require('../../core/javascript/moment');

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.scss'],
  standalone: false,
})
export class FacturacionComponent extends FactsLocalStorage implements OnInit, OnChanges, OnDestroy, AfterViewInit, CanComponentDeactivate {
  @ViewChild(CuerpoFacturaComponent, { static: true }) cuerpo: CuerpoFacturaComponent;
  @Input() tipo_documento: any;
  @Input() id_documento: any;
  @Input() action: any;

  secuenciaKeys = [];
  info_cambio: any;
  hasPermisoPreVenta: boolean;
  hasPermisoCotizacion: boolean;
  hasPermisoCamiones: boolean;
  titulo: string;

  datesAvailable = { viaje: { minDate: new Date() } };

  showDeactivationModal = signal<boolean>(true);

  @HostListener('window:keydown', ['$event'])
  @HostListener('window:keyup', ['$event'])
  handleKeyboardEvent(event: any) {
    const isNumpad = event.code.toLowerCase().includes('numpad');

    event.stopPropagation();
    let key = event.keyCode;
    if (isNumpad && event.keyCode != teclasCode._enter) key -= 48;

    const secuenciasAceptadas = [teclasCode._control, teclasCode._P, teclasCode._G, teclasCode._E];

    if (event.type == 'keydown') {
      if (!this.secuenciaKeys.includes(key) && secuenciasAceptadas.includes(key)) this.secuenciaKeys.push(key);
    } else if (event.type == 'keyup') {
      const combinacion = this.secuenciaKeys.join('_');
      this.secuenciaKeys = [];

      if (this.factServ.isVenta() && combinacion == `${teclasCode._control}_${teclasCode._E}`) {
        if (fun.hasValue(document.activeElement.id)) fun.desEnfocarInput(document.activeElement.id);
        fun.clickInput('btnExtra');
      }

      if (combinacion == `${teclasCode._control}_${teclasCode._P}`) {
        if (fun.hasValue(document.activeElement.id)) fun.desEnfocarInput(document.activeElement.id);
        this.imprimirFactura();
      }

      if (combinacion == `${teclasCode._control}_${teclasCode._G}`) {
        if (fun.hasValue(document.activeElement.id)) fun.desEnfocarInput(document.activeElement.id);
        this.archivarFactura();
      }

      if (fun.hasValue(this.popover?.item)) {
        if (this.popover?.tipo == 'extra') {
          if (this.opcionesExtra().length > 0) {
            fun.desEnfocarInput(document.activeElement.id);

            const option = this.opcionesExtra().find(opt => opt.keyboardCode == key);

            if (fun.hasValue(option)) this.selectOptionExtra(option);
          }
        }

        if (this.popover?.tipo == 'movimiento') this.mover_indicador_camion(`${this.entidad_en_turno}_row`, key);
      }
    }
  }

  fechaFactura;
  FechaFacturaMostrar: any;

  factura_a_rellenar: FacturasI;
  formPropietario: UntypedFormGroup;
  fecha;
  modo_factura;
  is_adelantada;
  is_viaje;
  is_editando: boolean;
  ITBIS;
  condicion_fact;
  forma_pago;

  cuerpoFactura = [];
  DESCUENTO;
  BRUTO;
  TOTAL;

  keyboardCodesEnabled = signal<number[]>([]);
  opcionesExtra = signal<any[]>([]);
  NCFcompra = signal('');
  CostoYgasto = signal('');
  is_print = false;
  errorComprobante = false;

  medidas = {
    Libra: 'Libras',
    Quintal: 'Quintales',
    Caja: 'Cajas',
    Paquete: 'Paquetes',
    Unidad: 'Unidades',
    Saco: 'Sacos',
  };

  objArchivo: {
    factura_en_turno: any;
    factura_en_turno_storage?: any;
  };

  ncfMask = [/b/, /[0-9]/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/];
  Devuelta = 0;

  factura_pendiente;
  fecha_vencimiento;
  fecha_equivalente;
  fecha_viaje;
  articulosAcambiar = [];
  newCuerpo: any[];
  paqueteComprobante: any;

  condiciones = [{ nombre: 'Contado' }, { nombre: 'Crédito' }];

  articuloClass = new ArticuloC();

  ncfClass = new NcfC();
  clienteClass = new ClienteC();
  suplidorClass = new SuplidorC();
  vehiculoClass = new VehiculoC();
  userClass = new EmpleadoC();
  configArticuloClass = new ConfigArticuloC();

  popover;
  // camionesSelected = [];

  camiones = [];
  copyCamiones;
  choferes = [];
  copyChoferes;
  movimientosSelected = [];

  camion_row;
  chofer_row;
  entidad_en_turno;

  filterCamionesTargets;
  filterChoferesTargets;

  permissions = Permisos;
  timeInterval;
  tipoDocFacturacion = tipoDocFacturacion;
  fun = fun;
  configApp: ConfigI;
  isInitialized = false;
  config_articulos: ConfigArticuloI;

  facturasSerieOptions = seriesDGII();
  htmlServ = inject(HtmlElementsService);
  factServ = inject(FacturacionService);
  dynamicModalServ = inject(DynamicModalService);
  fb = inject(UntypedFormBuilder);
  router = inject(Router);

  local_index_fact_archivada = this.index_fact_archivada();

  constructor() {
    super();
    
    this.formPropietario = this.fb.group({ id: null, direccion: null, telefono: null, nombre_completo: null });
    
    this.timeInterval = setInterval(() => (this.fecha = DateUtils.format({ include_hour: true })), 1000);
  }

  ngOnInit() {
    this.configApp = Ss.configServ.config;
  }

  ngOnChanges(changes: SimpleChanges): void {
    this._init_mixin({ component: 'cabeza_factura', is_routing: true });
    
    this.validatePermisos().then(result => {
      this.rellenarVariables().then(async () => {
        await this.cuerpo.rellenarVariables();

        if (this.factServ.action == actionFacturacion.update) {
          this.is_editando = true;
          this.procesoRelleno({ id: this.id_documento, tipo: this.factServ.tipoDocumento(), action: actionFacturacion.update });
          //
        } else if (this.factServ.action == actionFacturacion.bill_from_cotizacion) {
          this.procesoRelleno({ id: this.id_documento, tipo: tipoDocFacturacion.venta, action: actionFacturacion.bill_from_cotizacion });
          //
        } else if (this.factServ.action == actionFacturacion.bill_from_pre_venta) {
          this.procesoRelleno({ id: this.id_documento, tipo: tipoDocFacturacion.venta, action: actionFacturacion.bill_from_pre_venta });
          //
        } else if (this.factServ.action == actionFacturacion.duplicate) {
          this.procesoRelleno({ id: this.id_documento, tipo: this.factServ.tipoDocumento(), action: actionFacturacion.duplicate }).then(res => {
            this.abrirModalPropietario();
          });
          //
        } else {
          fun.setTimeout(() => {
            if (this.factServ.isPreVenta() || this.factServ.isCotizacion()) this.abrirModalPropietario();
            else fun.enfocarInput('tipoFact');
          }, 5);
        }
      });
      //

      this.makeOptionsExtra();
      this.getConfiguracionArticulo();
    });
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
    clearInterval(this.timeInterval);
  }

  ngAfterViewInit() {}

  canDeactivate(): boolean | Promise<boolean> {
    if (!this.showDeactivationModal()) return true;

    // Verificar si hay una factura en proceso
    if (this.checkIfFacturacionEnProceso()) {
      return this.handleFacturaEnProceso();
    }

    // Si no hay factura en proceso, permitir la navegación
    return true;
  }

  private async handleFacturaEnProceso(): Promise<boolean> {
    const result = await this.checkSituaciones({ goOut: true });

    if (result.factura_en_proceso) {
      if (result.abrirModal) {
        // Usar las funciones del guard con funciones personalizadas para cada botón
        const response = await CanDeactivateGuard.showConfirmationModal(result.texto_modal, {
          showCancelButton: true,
          showNoButton: true,
          cancelText: 'Cancelar',
          noText: 'No',
          yesText: 'Si',
          header: 'Confirmación',
          width: '30rem',
          onYes: async () => {
            // Función personalizada para el botón "Si" - guardar factura
            await this.agregarFacturaALocalStorage();
          },
          onNo: async () => {
            // Función personalizada para el botón "No" - limpiar factura sin guarda
          },
          onCancel: async () => {
            // Función personalizada para el botón "Cancelar" - mantener estado actual
          },
        });

        return response;
      } else {
        // La factura ya está archivada, permitir navegación
        return true;
      }
    }

    return true;
  }

  checkIfFacturacionEnProceso() {
    return this.cuerpoFactura.length > 0;
  }

  getConfiguracionArticulo() {
    this.configArticuloClass.getOne(1).then(config_articulos => (this.config_articulos = config_articulos.data as ConfigArticuloI));
  }

  validatePermisos() {
    return new Promise<any>((resolve, reject) => {
      const array_promises_permisos = [];

      array_promises_permisos.push(Ss.permissionsService.hasPermission(Object.values(this.permissions.pre_venta)));
      array_promises_permisos.push(Ss.permissionsService.hasPermission(Object.values(this.permissions.cotizacion)));
      array_promises_permisos.push(Ss.permissionsService.hasPermission(this.permissions.factura_venta.seleccionar_camion_en_facturacion));

      Promise.all(array_promises_permisos).then(values => {
        for (let index = 0; index < values.length; index++) {
          const has_permiso = values[index];

          switch (index) {
            case 0:
              this.hasPermisoPreVenta = has_permiso;
              break;
            case 1:
              this.hasPermisoCotizacion = has_permiso;
              break;
            case 2:
              this.hasPermisoCamiones = has_permiso;
              if (this.hasPermisoCamiones) this.getersMovimientoViaje();
              break;
          }
        }

        resolve(true);
      });
    });
  }

  setMinMaxDateCalendar(date?): Date {
    return date ? new Date(date) : new Date();
  }

  makeOptionsExtra() {
    this.opcionesExtra.set([]);
    this.keyboardCodesEnabled.set([]);

    const config_options = [
      { keyboardCode: undefined, key: undefined, code: tipoDocFacturacion.pre_venta, label: 'Seleccionar Pre-Venta', show: () => this.hasPermisoPreVenta, condition: () => true },
      { keyboardCode: undefined, key: undefined, code: tipoDocFacturacion.cotizacion, label: 'Seleccionar Cotización', show: () => this.hasPermisoCotizacion, condition: () => true },
      { keyboardCode: undefined, key: undefined, code: 'retornar_devueltos', label: 'Retornar articulos devueltos', show: () => this.someArticuloHasDevuelto(), condition: this.someArticuloHasDevuelto.bind(this) },
    ];

    for (let index = 0; index < config_options.length; index++) {
      const config_option = config_options[index];

      if (config_option.show()) {
        config_option.key = this.opcionesExtra().length + 1;
        config_option.keyboardCode = teclasCode[`_${config_option.key}`];
        this.keyboardCodesEnabled.update(prev => [...prev, teclasCode[`_${config_option.key}`]]);
        this.opcionesExtra.update(prev => [...prev, config_option]);
      }
    }
  }

  someArticuloHasDevuelto(): boolean {
    // Verificar si hay productos devueltos en el array de productos devueltos
    if (this.factServ.productos_devueltos.length > 0) return true;

    // Verificar si algún detalle tiene la propiedad is_devuelto como true
    const detalles = this.factServ.getDetallesLlenos() || [];
    return detalles.some(detalle => detalle.is_devuelto);
  }

  selectOptionExtra(option) {
    let openModal = true;
    // const modalConfig = { id: undefined, inputs: undefined, component: undefined, header: undefined, botones: undefined, width: '57rem', height: '32rem' };

    const modalConfig = new DynamicModalClass();
    modalConfig.width = '57rem';
    modalConfig.height = '32rem';

    if (this.keyboardCodesEnabled().includes(option.keyboardCode) && option.condition()) {
      modalConfig.id = 'factura_from_documento';

      modalConfig.inputs = { code: option.code };
      modalConfig.component = MenuOpcionesExtraComponent;
      modalConfig.closableEsc = true;

      modalConfig.botones = [{ clase: 'btn btn-gris', action: modalActionsE.close, label: 'Cerrar', disable: false }];

      if (option.code == tipoDocFacturacion.pre_venta) {
        modalConfig.header = 'Seleccionar pre-venta';
      }
      if (option.code == tipoDocFacturacion.cotizacion) {
        modalConfig.header = 'Seleccionar cotización';
      }

      if (option.code == 'retornar_devueltos') {
        modalConfig.header = 'Retornar Articulos Devueltos';
        modalConfig.id = 'retornarDevuelto';
        modalConfig.component = RetornarDevueltoComponent;
        modalConfig.height = '40rem';
        modalConfig.botones.push({ id: 'btn_aceptar', clase: 'btn btn-green', label: 'Aceptar', disable: false });
        modalConfig.inputs = { data: null, articulo_defectuoso: null, articulo_solo_devuelto: null, tipo: null, nombre: null, is_articulo_selected: false, devueltos_list: this.getDevueltos() };

        modalConfig.setCallback(this.processRetornarDevueltoModal.bind(this));
      }

      if (openModal) modalConfig.show();

      if (fun.hasValue(this.popover?.item)) this.cerrarOverlay();
    }
  }

  processRetornarDevueltoModal(arg) {
    const { data } = arg;
    this.cuerpo.retornarDevuelto(data);
  }

  getDevueltos() {
    const detalles = this.factServ.getDetallesLlenos();
    const articulos_defectuosos = detalles.filter(detalle => detalle.is_devuelto);
    const articulos_solo_devueltos = this.factServ.productos_devueltos;
    let acu = 1;
    const list = [...articulos_defectuosos, ...articulos_solo_devueltos].map(articulo => {
      articulo['tipo'] = articulo.is_defectuoso ? 'Articulo Defectuoso' : 'Solo devuelto';
      articulo['id'] = articulo.id = acu;
      acu += 1;
      return articulo;
    });

    return list;
  }

  verificateArchivo() {
    return new Promise(resolve => {
      this.objArchivo = { factura_en_turno: undefined };

      if (this.checkIfFacturacionEnProceso()) {
        this.objArchivo.factura_en_turno = this.formarFacturaAGuardar();
        let comparar_con_localStorage = FactsLocalStorage.getList().find(item => item.archivo_id == this.factura_guardada?.archivo_id);

        const factura_en_turno_storage = comparar_con_localStorage ? fun.omit(comparar_con_localStorage, ['archivo_id', 'cliente', 'suplidor']) : undefined;
        this.objArchivo['factura_en_turno_storage'] = factura_en_turno_storage;
      }

      resolve(true);
    });
  }

  rellenarVariables() {
    return new Promise<void>(resolve => {
      this.isInitialized = false;
      this.factServ.tipoDocumento.set(this.tipo_documento);
      this.factServ.action = this.action;
      this.factServ.productos_devueltos.length = 0;

      if (this.factServ.isVenta()) this.titulo = 'Factura de venta';
      else if (this.factServ.isCompra()) this.titulo = 'Factura de compra';
      else if (this.factServ.isPreVenta()) this.titulo = 'Pre factura';
      else if (this.factServ.isCotizacion()) this.titulo = 'Cotización';

      const useNormalSerie = [this.factServ.isCotizacion(), this.factServ.isPreVenta()].some(condition => condition);

      const serieSelected = useNormalSerie ? serie.normal : this.configApp.serie_default;

      this.factServ.setTipos(this.factServ.tipoDocumento(), serieSelected).then(result => {
        //
        [this.fecha_vencimiento, this.fecha_equivalente, this.fecha_viaje] = Array(3).fill(new Date());
        [this.is_adelantada, this.is_viaje, this.factura_pendiente, this.is_editando, this.errorComprobante] = Array(5).fill(false);
        [this.DESCUENTO, this.BRUTO, this.TOTAL, this.ITBIS, this.camion_row, this.chofer_row] = Array(6).fill(0);
        [this.factServ.pre_venta_selected, this.factServ.cotizacion_selected, this.factura_a_rellenar, this.factServ.propietario_factura, this.objArchivo, this.factura_guardada, this.popover] = Array(7).fill(undefined);
        this.showDeactivationModal.set(true);
        this.NCFcompra.set('');
        this.CostoYgasto.set('');

        this.entidad_en_turno = 'camion';
        this.cuerpoFactura.length = 0;
        this.articulosAcambiar.length = 0;
        this.movimientosSelected.length = 0;

        this.info_cambio = {};
        this.fechaFactura = {};

        this.fechaFactura['front'] = this.formarFechaFactura(new Date())['FechaFactura'];
        this.fechaFactura['back'] = this.fechaFactura['front'];
        this.FechaFacturaMostrar = this.formarFechaFactura(new Date())['FechaFacturaMostrar'];

        this.modo_factura = this.factServ.isPreVenta() ? this.factServ.tipoDocumento() : this.factServ.isCotizacion() ? null : 'normal';

        this.condicion_fact = this.factServ.isPreVenta() ? 'Crédito' : this.factServ.isCotizacion() ? 'Crédito' : 'Contado';
        this.forma_pago = this.factServ.isCotizacion() || this.factServ.isPreVenta() ? null : 'Efectivo';

        this.filterCamionesTargets = ['marca', 'modelo', 'anio', 'propietario.nombre', 'propietario.apellido'];
        this.filterChoferesTargets = ['nombre', 'apellido', 'nombre_completo'];

        if (this.factServ.isVenta()) {
          this.formPropietario.patchValue(this.factServ.clienteContado);
        } else {
          if (fun.hasValue(this.formPropietario)) this.formPropietario.reset();
        }
        this.cuerpo.RESETCUERPO();
        this.isInitialized = true;

        resolve();
      });
    });
  }

  checkPath(factura) {
    return new Promise<void>((resolve, reject) => {
      const actualPath = fun.getActualPath();

      if (!actualPath.includes(factura.tipo) || !this.factServ.action.includes(factura.action)) {
        const action_route = fun.hasValue(factura.action) ? factura?.action : 'new';

        this.router.navigateByUrl(`/admin/factura/${factura.tipo}/${action_route}/${this.id_documento ?? 0}`).then(result => {
          fun.setTimeout(() => {
            this.rellenarVariables().then(() => resolve());
          }, 250);
        });
      } else {
        resolve();
      }
    });
  }

  procesoRelleno(factura) {
    return new Promise<void>(resolve => {
      try {
        this.checkPath(factura).then(res => {
          this.rellenarCabezaFactura(factura).then(factura_rellenada => {
            this.cuerpo.rellenarCuerpoFactura(factura_rellenada['detalle_facturas'], fun.objHas(factura_rellenada, 'archivo_id')).then(res => {
              fun.setTimeout(() => {
                this._sideBarOpened = false;

                this.cuerpo.seleccionarCampoEnTurno();
                resolve();
              }, 250);
            });
          });
        });
      } catch (error) {
        resolve();
      }
    });
  }

  rellenarCabezaFactura(factura: FacturasI) {
    return new Promise(async resolve => {
      const original_factura = fun.deepCloning(factura);

      let productos_devueltos = original_factura?.productos_devueltos || [];
      this.factServ.propietario_factura = {};
      this.factServ.tipoDocumento.set(factura.tipo as tipoDocFacturacion);

      if (factura.id_documento) this.id_documento ??= factura.id_documento;

      // Buscar factura en localStorage si no es nueva y no tiene archivo_id
      const accionesQueRequierenBusqueda = [actionFacturacion.update, actionFacturacion.bill_from_cotizacion, actionFacturacion.bill_from_pre_venta, actionFacturacion.duplicate];
      if (!fun.objHas(factura, 'archivo_id') && accionesQueRequierenBusqueda.includes(original_factura.action)) {
        const factura_archivada = FactsLocalStorage.getList().find(f => f.id_documento == factura?.id);

        if (fun.hasValue(factura_archivada)) {
          factura = factura_archivada;
          productos_devueltos = factura.productos_devueltos;
          this.actualizarLayServFactGuardada(factura_archivada);
        } else {
          const res = (await this.facturaClass.getFacturaById(factura.id ?? null)) as any;
          factura = res.data;

          const accionesContado = [actionFacturacion.bill_from_cotizacion, actionFacturacion.bill_from_pre_venta];
          if (accionesContado.includes(original_factura.action)) factura.condicion = 'Contado';
        }
      }

      // const currentSerie = comprobante[this.configApp.serie_default].factura_de_consumo;

      // const esDeCotizacionOPreVenta = original_factura.action == actionFacturacion.bill_from_pre_venta || original_factura.action == actionFacturacion.bill_from_cotizacion;
      // const value_buscar = esDeCotizacionOPreVenta ? default_serie_key : factura.tipo_factura_id;
      // const by_buscar = esDeCotizacionOPreVenta ? 'key' : 'id';

      if (original_factura.action !== actionFacturacion.duplicate) this.setPropietario(factura);

      // Determinar serie actual
      const tieneComprobanteElectronico = fun.hasValue(factura?.numero_comprobante) && factura.numero_comprobante.includes('E');
      let currentSerie = tieneComprobanteElectronico ? serie.electronica : fun.hasValue(factura.serie) ? factura.serie : serie.electronica;

      let equivalentSerie = false;
      const accionesConSerieDefault = [actionFacturacion.bill_from_cotizacion, actionFacturacion.bill_from_pre_venta, actionFacturacion.duplicate];

      if (accionesConSerieDefault.includes(original_factura.action) && this.configApp.serie_default !== currentSerie) {
        currentSerie = this.configApp.serie_default;
        equivalentSerie = true;
      }

      this.factServ
        .setTipos(this.factServ.tipoDocumento(), currentSerie, equivalentSerie)
        .then(result => {
          // Configurar factura pendiente
          this.factura_pendiente = factura?.factura_pendiente || false;

          // Configurar fechas
          const fecha_facturacion = factura?.fecha_equivalente || fun.deepCloning(this.fechaFactura['back']);
          const fechaFormateada = this.formarFechaFactura(fecha_facturacion);
          this.fechaFactura['front'] = fechaFormateada['FechaFactura'];
          this.fechaFactura['back'] = this.fechaFactura['front'];
          this.FechaFacturaMostrar = fechaFormateada['FechaFacturaMostrar'];

          // Configurar NCF si es necesario
          const tipoFacturaValido = fun.hasValue(this.factServ.tipoFactura) && this.factServ.tipoFactura.referencia !== '00' && this.factServ.tipoFactura.referencia !== '02' && this.factServ.isVenta();
          if (tipoFacturaValido) {
            this.ncfClass.getAll({ afterPath: `custom/${this.factServ.tipoFactura.id}/true` }).then(res => {
              this.paqueteComprobante = res.data;
            });
          }

          // Configurar fechas específicas
          this.fecha_viaje = factura.is_viaje ? new Date(factura.fecha_viaje) : new Date();
          this.fecha_vencimiento = factura.tipo === 'compra' ? new Date(factura.fecha_vencimiento) : new Date();

          // Configurar propiedades de la factura
          this.is_viaje = factura.is_viaje;
          const accionesContado = [actionFacturacion.bill_from_pre_venta, actionFacturacion.bill_from_cotizacion];
          this.condicion_fact = accionesContado.includes(factura.action) ? this.condicion_fact : factura.condicion;

          // Configurar NCF y costo para compras
          this.NCFcompra.set(factura.tipo === tipoDocFacturacion.compra ? factura.numero_comprobante : undefined);
          this.CostoYgasto.set(factura.tipo === tipoDocFacturacion.compra ? factura.costoYgasto : '');

          // Determinar modo de factura
          if (factura.tipo === tipoDocFacturacion.pre_venta) {
            this.modo_factura = this.factServ.action === actionFacturacion.bill_from_pre_venta ? 'normal' : tipoDocFacturacion.cotizacion;
          } else if (factura.tipo === tipoDocFacturacion.cotizacion) {
            this.modo_factura = this.factServ.action === actionFacturacion.bill_from_cotizacion ? 'normal' : tipoDocFacturacion.cotizacion;
          } else if (factura.is_viaje) {
            this.modo_factura = 'viaje';
          } else if (factura.is_adelantada) {
            this.modo_factura = 'adelantada';
          } else {
            this.modo_factura = 'normal';
          }

          // Configurar factura seleccionada según el tipo de acción
          if (original_factura.action === actionFacturacion.bill_from_cotizacion) {
            this.factServ.cotizacion_selected = factura;
            if (fun.isEmpty(factura?.id)) this.factServ.cotizacion_selected.id = this.id_documento;
          } else if (original_factura.action === actionFacturacion.bill_from_pre_venta) {
            this.factServ.pre_venta_selected = factura;
            if (fun.isEmpty(factura?.id)) this.factServ.pre_venta_selected.id = this.id_documento;
          } else {
            this.factura_a_rellenar = factura;
          }

          // Configurar productos devueltos y movimientos
          this.factServ.productos_devueltos = productos_devueltos;

          if (fun.objHas(factura, 'movimientos_viaje')) {
            factura.movimientos_viaje.forEach(movimiento => this.movimientosSelected.push({ vehiculo_id: movimiento.vehiculo_id, user_id: movimiento.user_id }));
          }

          // Filtrar detalles de factura
          factura.detalle_facturas = factura.detalle_facturas.filter(detalle => !detalle.is_devuelto || (detalle.is_devuelto && detalle.is_defectuoso));

          // Limpiar IDs si es duplicado
          if (original_factura.action === actionFacturacion.duplicate) {
            factura.detalle_facturas = factura.detalle_facturas.map(detalle => {
              delete detalle.id;
              return detalle;
            });
          }

          resolve(factura);
        })
        .catch(error => {
          console.error(error);
        });
    });
  }

  async setPropietario(arg) {
    if (arg.tipo == tipoDocFacturacion.compra) {
      const suplidor_response = await this.suplidorClass.getOne(arg.suplidor_id);
      this.factServ.propietario_factura = suplidor_response.data;
      this.factServ.propietario_factura.nombre_completo = this.factServ.propietario_factura.nombre_completo;
    } else {
      if (fun.hasValue(arg.cliente_id)) {
        const cliente_response = await this.clienteClass.getOne(arg.cliente_id);
        this.factServ.propietario_factura = cliente_response.data;
        this.factServ.propietario_factura.nombre_completo = this.factServ.propietario_factura.nombre_completo;
      } else {
        this.factServ.propietario_factura = { id: null, direccion: arg['NoCliente_direccion'], nombre_completo: arg['NoCliente_nombre'], telefono: '' };
      }
    }
    this.formPropietario.patchValue(this.factServ.propietario_factura);
  }

  checkSituaciones(args: { goOut: boolean }): Promise<{ factura_en_proceso: boolean; abrirModal?: boolean; texto_modal?: string; archivo_id?: any }> {
    const { goOut } = args;

    return new Promise(resolve => {
      let documento = this.getDocumentoDescripcion();
      this.verificateArchivo().then(() => {
        if (this.checkIfFacturacionEnProceso()) {
          let texto_modal = '';
          let abrirModal = true;

          if (this.factura_guardada && this.factura_guardada?.archivo_id) {
            const factura_esentials = (data: FacturasI) => {
              let dataParsed = { ...data };
              delete dataParsed.archivo_id;
              delete dataParsed.archivo_date;
              dataParsed.detalle_facturas = dataParsed.detalle_facturas.map(detalle => {
                const dataParsedDetalle = fun.pick(detalle, ['key', 'articulo_id', 'cantidad', 'costo', 'precio', 'itbis', 'total', 'unidad']);
                dataParsedDetalle.unidad = dataParsedDetalle.unidad.toLowerCase();
                return dataParsedDetalle;
              });

              return dataParsed;
            };

            const factura_en_turno_storage = fun.deepCloning(this.objArchivo.factura_en_turno_storage);

            if (fun.isEqual(factura_esentials(this.objArchivo.factura_en_turno), factura_esentials(factura_en_turno_storage))) {
              fun.toastWarning(`La ${documento.descripcion} que estaba realizando esta archivada para poder utilizarla luego.`, 'AVISO');
              abrirModal = false;
            } else {
              texto_modal = `La <strong>${documento.descripcion}</strong> que esta en proceso ya se encuentra archivada <strong>¿desea sobreescribirla?</strong>`;
            }
          } else {
            if (goOut) {
              texto_modal = `Estas a punto de salir del modulo de facturación, <strong> ¿desea guardar la ${documento.descripcion} que esta en proceso, para continuarla luego?</strong>`;
            } else {
              texto_modal = `¿Desea guardar la <strong> ${documento.descripcion}</strong> que esta en proceso, para continuarla luego?`;
            }
          }

          resolve({ factura_en_proceso: true, abrirModal, texto_modal });
        } else {
          resolve({ factura_en_proceso: false });
        }
      });
    });
  }

  rellenarFacturaArchivada(factura) {
    if (fun.hasValue(factura)) {
      if (this.factura_guardada && this.factura_guardada?.archivo_id == factura.archivo_id) {
        fun.toastWarning(`Ya esta ${this.getSideBarTabByKey(this.factura_guardada.tipo)['singleTitle']} esta seleccionada.`, 'AVISO');
      } else {
        this.checkSituaciones({ goOut: false }).then(result => {
          if (result.factura_en_proceso) {
            if (result.abrirModal) {
              let siFunction = () => {
                this.procesoArchivarFactura();
                this.procesoRelleno(factura).then(() => {
                  this.actualizarLayServFactGuardada(factura);
                });
              };

              let noFunction = () => {
                this.procesoRelleno(factura).then(() => {
                  this.actualizarLayServFactGuardada(factura);
                });
              };

              this.dynamicModalServ.confirmationModal({
                id: 'archivar_factura',
                texto: result.texto_modal,
                btnKind: confirmationButtons.siNoCancelar,
                onYes: siFunction.bind(this),
                onNo: noFunction.bind(this),
              });
            } else {
              this.procesoRelleno(factura).then(() => {
                this.actualizarLayServFactGuardada(factura);
              });
            }
          } else {
            this.procesoRelleno(factura).then(() => {
              this.actualizarLayServFactGuardada(factura);
            });
          }
        });
      }
    }
  }

  actualizarLayServFactGuardada(factura) {
    this.factura_guardada = fun.deepCloning(factura);
  }

  checkCambiosModoyCondicionFactura(arg: { elemento_html?; id?; value? }) {
    const sali_de = fun.hasValue(arg.elemento_html) ? arg.elemento_html.id : arg.id;
    const valor = fun.hasValue(arg.elemento_html) ? arg.elemento_html.value : arg.value;

    const condicion = this.condicion_fact;
    const tipo_factura_referencia = this.factServ.tipoFactura.referencia;

    let buscar = false;

    fun.setTimeout(() => {
      const voy_a = document.activeElement.id;
      const dont_have_propietario = fun.isEmpty(this.factServ?.propietario_factura) || fun.isEmpty(this.factServ?.propietario_factura?.id);

      if (this.factServ.isVenta() || this.factServ.isPreVenta()) {
        if (sali_de == 'venta' && (condicion == 'Crédito' || tipo_factura_referencia == comprobante[this.factServ.serieType()].factura_de_credito_fiscal) && dont_have_propietario && (fun.isEmpty(voy_a) || voy_a != 'fecha_viaje')) buscar = true;

        if (sali_de == 'venta' && valor == 'adelantada' && dont_have_propietario) buscar = true;

        if (sali_de == 'fecha_viaje') {
          this.getersMovimientoViaje();
          document.getElementById('btnCamion').click();
        }

        if (this.modo_factura != 'viaje') this.movimientosSelected = [];
      } else {
        if (sali_de == 'fecha_vencimiento' && dont_have_propietario) buscar = true;
      }

      if (buscar) this.abrirModalPropietario();
    }, 250);
  }

  getCalculosDinero(arg) {
    this.TOTAL = arg.total;
    this.ITBIS = arg.itbis;
    this.DESCUENTO = arg.descuento;

    this.calcularBruto();
  }

  calcularBruto() {
    fun.setTimeout(() => {
      const suma = Big(fun.desformatearStNumber(this.TOTAL)).plus(fun.desformatearStNumber(this.DESCUENTO)).minus(fun.desformatearStNumber(this.ITBIS));
      this.BRUTO = fun.roundNumberToDecimal(suma.toNumber());
    }, 5);
  }

  cambiarCondicion(arg) {
    if (arg == 'Crédito') {
      this.modo_factura = 'normal';
      this.fecha_vencimiento = new Date();
      this.fecha_equivalente = new Date();
    } else {
      this.fecha_vencimiento = null;
    }
  }

  async calcularPorcientoComprobante(): Promise<boolean> {
    // Solo procesar si es venta y tiene tipo de factura válido
    if (!this.factServ.isVenta || this.factServ.tipoFactura.referencia === '00' || this.factServ.tipoFactura.referencia === comprobanteNormal.factura_de_consumo) {
      this.paqueteComprobante = undefined;
      this.errorComprobante = false;
      return true;
    }

    try {
      // Obtener paquete de comprobantes
      const paquete = await this.ncfClass.getAll({ afterPath: `custom/${this.factServ.tipoFactura.id}/true` });
      this.paqueteComprobante = paquete.data;

      // Verificar si hay fecha válida para procesar
      if (!fun.hasValue(this.paqueteComprobante?.fecha_valida)) {
        return true;
      }

      const { desde, hasta, secuencia } = this.paqueteComprobante;
      const cantidad = hasta - desde + 1;

      // Calcular porcentaje según rangos
      const porcentaje = this.calcularPorcentajePorRango(cantidad);
      const limite = hasta - porcentaje;
      const restante = hasta - secuencia + 1;

      // Mostrar advertencia si es necesario
      if (secuencia >= limite) {
        const descripcion = this.factServ.tipoFactura.descripcion;
        const mensaje = this.paqueteComprobante.msg === 'Ultimo comprobante de este paquete' ? `Ultimo comprobante para ${descripcion}.` : `Los comprobantes para ${descripcion} se estan agotando, solo quedan ${restante}`;

        fun.toastWarning(mensaje, 'AVISO');
      }

      return true;
    } catch (error) {
      if (fun.isEmpty(error.error?.msg)) {
        fun.toastError('Error calculando la secuencia de comprobantes.', 'AVISO');
      }
      this.errorComprobante = true;
      return false;
    }
  }

  private calcularPorcentajePorRango(cantidad: number): number {
    if (cantidad > 0 && cantidad <= 40) return cantidad * 0.5;
    if (cantidad > 40 && cantidad <= 100) return cantidad * 0.25;
    if (cantidad > 100 && cantidad <= 500) return cantidad * 0.1;
    if (cantidad > 500) return cantidad * 0.04;
    return 0;
  }

  async changeSerie() {
    this.factServ.setTipos(this.factServ.tipoDocumento(), this.factServ.serieType(), true).then(result => {
      this.errorComprobante = false;
      setTimeout(() => this.checkTipoFactura(), 0);
    });
  }

  async checkTipoFactura() {
    this.factServ
      .setTipoFacturaSelected({ value: this.factServ.tipoFacturaReferenciaSelected, by: 'referencia' })
      .then(result => {
        if (this.factServ.isCompra()) {
          const ncf_prefix = `${this.factServ.isComprobanteNormal() ? 'B' : 'E'}${this.factServ.tipoFacturaReferenciaSelected}`;

          if (!this.NCFcompra().startsWith(ncf_prefix)) {
            this.NCFcompra.set(ncf_prefix);
          }
        }

        this.calcularPorcientoComprobante().then(continuar => {
          if (continuar) fun.enfocarInput('condicion');
          else this.errorComprobante = true;
        });
      })
      .catch(error => {
        console.error(error);

        fun.toastError('El tipo de factura introducido es incorrecto.', 'ERROR');
        this.errorComprobante = true;
      });
  }

  saltar(salioDe, valor?) {
    let siguiente_input = '';
    let is_enforcar = true;
    let is_enforcar_cuerpo = false;

    let is_buscar_cliente = false;

    switch (salioDe) {
      case 'tipo':
        if (this.factServ.options_tipos_facturas.includes(valor)) {
          siguiente_input = 'condicion';
          this.errorComprobante = false;
        } else {
          fun.toastError('El tipo de factura introducido es incorrecto.', 'ERROR');
          fun.enfocarAndSelectInput('tipoFact');
          this.errorComprobante = true;
          is_enforcar = false;
        }
        break;

      case 'condicion':
        siguiente_input = this.factServ.isCompra() ? 'gastoDe' : 'venta';
        break;

      case 'gastoDe':
        if (this.factServ.isCompra() && !this.factServ.options_tipos_costos_gastos.includes(valor)) {
          fun.toastError('El tipo de costo y gasto introducido es incorrecto.', 'ERROR');
        } else {
          this.CostoYgasto.set(valor);
          siguiente_input = 'ncf';
        }
        break;

      case 'ncf':
        if (!this.NCFcompra().includes('_')) {
          if (this.condicion_fact === 'Crédito') siguiente_input = 'fecha_vencimiento';
          else {
            is_enforcar = false;
            is_buscar_cliente = true;
          }
        } else {
          fun.enfocarInput('ncf');
          fun.toastWarning('Numero de comprobante incorrecto', 'Aviso');
        }
        break;

      case 'venta':
        if (this.modo_factura == 'normal') {
          if (this.condicion_fact == 'Contado') {
            siguiente_input = 'nom';
          } else {
            is_enforcar = false;
          }

          if (this.factServ.action == actionFacturacion.duplicate) is_enforcar_cuerpo = true;
        } else if (this.modo_factura == 'viaje') {
          siguiente_input = 'fecha_viaje';
        } else if (this.modo_factura == 'adelantada') {
          if (fun.isEmpty(this.factServ.propietario_factura) || this.factServ.propietario_factura.nombre_completo == this.factServ.clienteContado.nombre_completo) is_enforcar = false;
          else is_enforcar_cuerpo = true;
        } else {
          is_enforcar = false;
        }

        break;

      case 'fecha_viaje':
        is_enforcar = false;
        if (this.factServ.action == actionFacturacion.duplicate) is_enforcar_cuerpo = true;
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

    if (is_enforcar) {
      fun.setTimeout(() => fun.enfocarInput(siguiente_input), 10);
    } else fun.desEnfocarInput(salioDe);

    if (is_buscar_cliente) this.abrirModalPropietario();
    if (is_enforcar_cuerpo) this.cuerpo.seleccionarCampoEnTurno();
  }

  iniciarFactura() {
    if (this.condicion_fact !== 'Crédito') {
      this.factServ.propietario_factura = this.formPropietario.getRawValue();

      this.calcularPorcientoComprobante().then(continuar => {
        if (continuar) setTimeout(() => this.cuerpo.seleccionarCampoEnTurno(), 10);
        else this.errorComprobante = true;
      });
    } else {
      fun.toastWarning('Para facturar a crédito debe de seleccionar un cliente', 'Aviso');
    }
  }

  activarNombreDireccion() {
    let is_disabled = false;

    if (this.factServ.isCompra() || (this.is_editando && (this.factServ.isVenta() || this.factServ.isCompra()))) {
      is_disabled = true;
    } else {
      is_disabled = false;

      if (
        this.errorComprobante ||
        this.is_adelantada ||
        (this.condicion_fact == 'Crédito' && this.factServ.tipoDocumento() != tipoDocFacturacion.cotizacion) ||
        this.modo_factura == 'viaje' ||
        this.modo_factura == 'adelantada' ||
        this.factServ.tipoFactura?.referencia == comprobanteNormal.factura_de_credito_fiscal ||
        this.factServ.tipoFactura?.referencia == comprobanteElectronico.factura_de_credito_fiscal ||
        fun.hasValue(this.factServ.pre_venta_selected)
      ) {
        is_disabled = true;
      } else {
        is_disabled = false;
      }
    }

    return is_disabled;
  }

  getCamionInfo(camion, key) {
    let res;
    if (key == 'label') res = `${camion.marca} ${camion.modelo} - ${camion.anio} (${camion.propietario.nombre} ${camion.propietario.apellido})`;

    const movimiento_en_turno = this.movimientosSelected.find(movimiento => movimiento.vehiculo_id == camion.id);
    if (key == 'icon') res = fun.isEmpty(movimiento_en_turno) ? 'far fa-square' : fun.isEmpty(movimiento_en_turno.user_id) ? 'fa-regular fa-square-minus' : 'fas fa-check';
    if (key == 'tooltip') res = fun.isEmpty(movimiento_en_turno) ? 'Camión sin seleccionar' : fun.isEmpty(movimiento_en_turno.user_id) ? 'Chofer sin seleccionar' : 'Camión y chofer seleccionados';

    return res;
  }

  seleccionarCamion(camion?, index_camion?) {
    if (this.camiones.length) {
      camion ??= fun.deepCloning(fun.hasValue(camion) ? camion : this.camiones[this.camion_row]);

      if (this.checkCamionIsSelected(camion)) {
        fun.pull(
          this.movimientosSelected,
          this.movimientosSelected.find((mov) => mov.vehiculo_id == camion.id),
        );
      } else {
        this.movimientosSelected.push({ vehiculo_id: camion.id, user_id: null });
      }

      if (this.checkCamionIsSelected(camion)) this.moverFocoMovimientoViaje('chofer');

      if (fun.hasValue(index_camion) && this.camion_row != index_camion) this.camion_row = index_camion;
    } else {
      if (this.movimientosSelected.length && !this.movimientosSelected.some(mov => fun.isEmpty(mov.user_id))) this.saliendoDeCamionOverlay();
      else fun.toastWarning('Debe de seleccionar almenos un camión y su chofer para el viaje, .', 'Aviso');
    }
  }

  seleccionarChofer(chofer?, index_chofer?) {
    chofer ??= fun.deepCloning(fun.hasValue(chofer) ? chofer : this.choferes[this.chofer_row]);

    const camion_en_turno = fun.deepCloning(this.camiones[this.camion_row]);
    const movimiento_en_turno = this.movimientosSelected.find(movimiento => movimiento.vehiculo_id == camion_en_turno.id);
    movimiento_en_turno.user_id = this.checkChoferIsSelected(chofer) ? null : chofer.id;

    if (fun.hasValue(index_chofer) && this.chofer_row != index_chofer) this.chofer_row = index_chofer;
  }

  moverFocoMovimientoViaje(voy_a) {
    this.entidad_en_turno = voy_a;
    const entidades = { camion: 'searchCamion', chofer: 'searchChofer' };
    fun.setTimeout(() => fun.enfocarInput(entidades[this.entidad_en_turno]), 5);
  }

  checkCamionIsSelected(camion?) {
    camion ??= fun.deepCloning(this.camiones[this.camion_row]);
    return this.movimientosSelected.some(movimiento => movimiento.vehiculo_id == camion.id);
  }

  checkChoferIsSelected(chofer) {
    const camion_en_turno = fun.deepCloning(this.camiones[this.camion_row]);
    const movimiento_en_turno = this.movimientosSelected.find(movimiento => movimiento.vehiculo_id == camion_en_turno.id);

    return fun.hasValue(movimiento_en_turno) ? movimiento_en_turno.user_id == chofer.id : false;
  }

  getIndicadorMovimientoViaje(tipo?) {
    let res;

    const all_selected = this.movimientosSelected.length > 0 && this.movimientosSelected.every(mov => fun.hasValue(mov.user_id));
    const all_deselected = this.movimientosSelected.length == 0;

    if (tipo == 'color') {
      res = all_deselected ? 'no_selected' : all_selected ? 'selected' : 'incompleto';
    } else if (tipo == 'icon') {
      res = all_deselected ? 'fa-x' : all_selected ? 'fa-check' : 'fa-minus';
    } else {
      res = all_selected;
    }

    return res;
  }

  checkMovimientoIsCompleted() {
    const containMovimientoViaje = document.getElementById('overlayMovimientoViaje');
    const entidades = { camion: 'searchCamion', chofer: 'searchChofer' };

    fun.setTimeout(() => {
      const voy_a = document.activeElement;

      if (!containMovimientoViaje.contains(voy_a)) {
        if (this.movimientosSelected.length && !this.movimientosSelected.some(mov => fun.isEmpty(mov.user_id))) {
          this.saliendoDeCamionOverlay();
        } else {
          fun.toastWarning('Debe de seleccionar almenos un camión y un chofer para el viaje.', 'Aviso');
          fun.setTimeout(() => fun.enfocarInput(entidades[this.entidad_en_turno]), 5);
        }
      } else {
        fun.setTimeout(() => fun.enfocarInput(entidades[this.entidad_en_turno]), 5);
      }
    }, 250);
  }

  openOverlay(event, popover, tipo) {
    this.popover = {};
    this.popover['item'] = popover;
    this.popover['tipo'] = tipo;
    this.popover['item'].toggle(event);

    if (tipo == 'movimiento') setTimeout(() => fun.enfocarInput('searchCamion'), 5);
    if (event) event.stopPropagation();
  }

  cerrarOverlay() {
    if (fun.hasValue(this.popover?.item)) {
      if (this.popover['tipo'] == 'camion') {
        this.filterCamion(this.copyCamiones);
        this.camion_row = 0;
      }

      this.popover['item'].hide();
      this.popover = undefined;
    }
  }

  mover_indicador_camion(tipo, key) {
    const listados = { camion_row: this.camiones, chofer_row: this.choferes };

    if (key == teclasCode._arriba) {
      if (this[tipo] == 0) this[tipo] = listados[tipo].length - 1;
      else this[tipo]--;
    } else if (key == teclasCode._abajo) {
      if (this[tipo] == listados[tipo].length - 1) this[tipo] = 0;
      else this[tipo]++;
    } else if (key == teclasCode._izquierda || key == teclasCode._derecha) {
      if (key == teclasCode._derecha && !this.checkCamionIsSelected()) {
        fun.toastWarning('Para seleccionar un chofer primero seleccione el camión', 'Aviso');
        return;
      }
      this.moverFocoMovimientoViaje(key == teclasCode._derecha ? 'chofer' : 'camion');
    } else if (key == teclasCode._esc) {
      this.saliendoDeCamionOverlay('teclado');
    }

    fun.scrollTo({ id: `ulCamion-${this[tipo]}`, behavior: 'smooth', block: 'center', inline: 'center' });
  }

  saliendoDeCamionOverlay(where?) {
    fun.setTimeout(() => {
      if (this.movimientosSelected.length && !this.movimientosSelected.some(mov => fun.isEmpty(mov.user_id))) {
        if (fun.isEmpty(where) || where != 'teclado') {
          if (fun.isEmpty(this.factServ.propietario_factura) || fun.isEmpty(this.factServ.propietario_factura?.id)) this.abrirModalPropietario();
          else this.cuerpo.seleccionarCampoEnTurno();

          this.cerrarOverlay();
        } else {
          if (where == 'teclado') {
            const entidades = { camion: 'searchCamion', chofer: 'searchChofer' };
            fun.desEnfocarInput(entidades[this.entidad_en_turno]);
            this.cerrarOverlay();
          }
        }

        this.entidad_en_turno = 'camion';
      } else {
        fun.toastWarning('Debe de seleccionar almenos un camión y su chofer para el viaje.', 'Aviso');
      }
    }, 5);
  }

  async getersMovimientoViaje() {
    await this.getCamiones();
    await this.getChoferes();
  }

  async getCamiones() {
    const extra = { afterPath: `filtro/ `, parameters: { paginado: false } };
    this.vehiculoClass.getAll(extra).then(res => {
      this.camiones = res['data'].map(camion => {
        camion.selected = false;
        return camion;
      });
      this.copyCamiones = fun.deepCloning(this.camiones);
    });
  }

  async getChoferes() {
    const extra = { parameters: { id: true, filter_key: 'role', filter_value: 'chofer' } };
    this.userClass.getAll(extra).then(res => {
      this.choferes = res['data'].map(chofer => {
        chofer.selected = false;
        return chofer;
      });
    });
    this.copyChoferes = fun.deepCloning(this.choferes);
  }

  filterCamion(camionesFiltrados) {
    this.camiones.length = 0;
    for (const camion of camionesFiltrados) this.camiones.push(camion);
    this.camion_row = 0;
    fun.scrollTo({ id: `ulCamion-${this.camion_row}`, behavior: 'smooth', block: 'center', inline: 'center' });
  }

  filterMovimiento(tipo, entidades_filtradas) {
    const conf = { camion: { lista: 'camiones', indicador: 'camion_row', ul: 'ulCamion' }, chofer: { lista: 'choferes', indicador: 'chofer_row', ul: 'ulChofer' } };

    this[conf[tipo].lista].length = 0;

    for (const entidad of entidades_filtradas) this[conf[tipo].lista].push(entidad);
    this[conf[tipo].indicador] = 0;
    fun.scrollTo({ id: `${conf[tipo].ul}-${this[conf[tipo].indicador]}`, behavior: 'smooth', block: 'center', inline: 'center' });
  }

  // =============================================
  //  MODAL PARA FILTRAR CLIENTES & SUPLIDORES
  // =============================================

  abrirModalPropietario(args?: { send_factura?: boolean }) {
    let documento = this.getDocumentoDescripcion();

    if (this.is_editando && (this.factServ.isVenta() || this.factServ.isCompra())) {
      const entidad = this.factServ.isVenta() ? 'Cliente' : 'Suplidor';
      fun.toastWarning(`Al editar una ${documento.descripcion}, no se le puede cambiar el ${entidad}.`, 'AVISO');
    } else {
      fun.desEnfocarInput(document?.activeElement?.id);

      let botones = [];

      if (this.factServ.isCotizacion() || this.factServ.isPreVenta()) {
        const label = `Salir de ${this.factServ.isCotizacion() ? 'Cotización' : 'Pre venta'}`;
        botones.push({ clase: 'btn btn-gris', function: instance => this.router.navigateByUrl('/admin/dashboard') && instance.close(), label: label, disable: false });
      }

      const include_contado = this.factServ.isVenta() || this.factServ.isCotizacion();

      let after_select = { send_factura: args?.send_factura };
      if (Object.values(after_select).every(value => fun.isEmpty(value))) after_select = null;

      const propietarioModalConf = new DynamicModalClass();

      propietarioModalConf.id = 'buscarCliente';
      propietarioModalConf.inputs = { metodo: this.factServ.tipoDocumento(), include_contado, palabra_a_buscar: ' ', after_select };
      propietarioModalConf.header = this.factServ.isCompra() ? 'BUSCAR SUPLIDOR' : 'BUSCAR CLIENTE';
      propietarioModalConf.width = '57rem';
      propietarioModalConf.height = '32rem';
      propietarioModalConf.component = BuscarClienteSuplidorComponent;
      propietarioModalConf.closableEsc = true;
      propietarioModalConf.botones = botones;
      propietarioModalConf.setCallback(this.processPropietarioModal.bind(this));
      propietarioModalConf.show();
    }
  }

  processPropietarioModal(args: ICallbackModal) {
    if (args.type == modalCloseType.onHide) {
      let documento = this.getDocumentoDescripcion();
      const actualPath = fun.getActualPath();

      if (fun.hasValue(documento) && !documento.has_Propietario && actualPath.includes('factura/venta')) {
        fun.toastWarning(`Para realizar una ${documento.descripcion}, debe de seleccionar el cliente.`, 'AVISO');
      }
    }

    if (args.type == modalCloseType.returnData) {
      const { data } = args;

      this.factServ.propietario_factura = data;

      this.formPropietario.patchValue(this.factServ.propietario_factura);
      const balance = Number(this.factServ.propietario_factura.balance);
      const maxCred = Number(this.factServ.propietario_factura.maximo_credito);

      if (this.factServ.tipoDocumento() != tipoDocFacturacion.cotizacion && this.condicion_fact != 'Contado') {
        if (balance > maxCred - 1000 && balance < maxCred) {
          fun.toastWarning(`Crédito actual RD$${this.formatoNumero(balance)} limite: RD$${this.formatoNumero(maxCred)}`, 'PROXIMO A LIMITE DE CRÉDITO');
        } else if (balance > maxCred) {
          fun.toastError(`Crédito actual RD$${this.formatoNumero(balance)} limite: RD$${this.formatoNumero(maxCred)}`, 'SOBRE VALOR DE CRÉDITO');
        }
      }

      if (data?.after_select?.send_factura) {
        this.imprimirFactura();
      } else if (this.factServ.action == actionFacturacion.duplicate) {
        fun.enfocarAndSelectInput('tipoFact');
      } else {
        this.cuerpo.seleccionarCampoEnTurno();
      }
    }
  }

  // =============================================
  //  MODAL CANCELAR
  // =============================================
  cancelarFactura() {
    let siFunct = () => {
      this.showDeactivationModal.set(false);

      const actionToGoFinder = [actionFacturacion.update, actionFacturacion.duplicate];

      if (actionToGoFinder.includes(this.factServ.action)) {
        this.router.navigateByUrl(`/admin/manipular/buscarFactura/solo_ver`);
      } else {
        this.router.navigateByUrl(`admin/factura/${this.factServ.tipoDocumento()}/${actionFacturacion.new}/0`).then(res_router => this.resetVariables());
      }
    };

    let documento = this.getDocumentoDescripcion();

    this.dynamicModalServ.confirmationModal({
      id: 'confirmCancelarFactura',
      texto: `Seguro que desea cancelar la <strong>${documento.descripcion}</strong>.`,
      btnKind: confirmationButtons.siNo,
      onYes: () => siFunct(),
    });
  }

  // =============================================
  //  MODAL enviarABaseDatos
  // =============================================
  async imprimirFactura() {
    const documento = this.getDocumentoDescripcion();

    // Verificación de propietario
    if (!this.factServ.propietario_factura) {
      const entidad = this.factServ.isCompra() ? 'suplidor' : 'cliente';
      return fun.toastWarning(`${documento.descripcion} no tiene ${entidad} seleccionado`, 'Aviso');
    }

    // Verificación de cuerpo de factura
    if (this.cuerpoFactura.length === 0) {
      fun.toastWarning(`${documento.descripcion} incompleta!!!`, 'Aviso');
      return fun.enfocarInput('codigo-0');
    }

    // Verificación de total
    if (this.TOTAL == 0) {
      fun.toastWarning(`Total de la ${documento.descripcion} no puede ser 0`, 'Aviso');
      return fun.enfocarInput('codigo-0');
    }

    // Verificación de viaje
    if (this.is_viaje && !this.getIndicadorMovimientoViaje()) {
      fun.toastWarning(`Debe seleccionar al menos un camión y un chofer para el viaje.`, 'Aviso');
      return document.getElementById('btnCamion').click();
    }

    // Verificación FC > 250k
    if (this.factServ.isVenta() && this.factServ.tipoFacturaReferenciaSelected == comprobanteElectronico.factura_de_consumo && fun.desformatearStNumber(this.TOTAL) > 250000 && fun.isEmpty(this.factServ?.propietario_factura?.id)) {
      fun.toastWarning('Se debe seleccionar un cliente, para las Facturas de Consumo Electrónico, con valor mayor a RD$250,000.00', 'Aviso');
      return this.abrirModalPropietario({ send_factura: true });
    }

    // Procesar según el tipo de documento
    if (this.factServ.tipoDocumento() != tipoDocFacturacion.compra && (this.condicion_fact == 'Crédito' || this.is_viaje || this.factServ.isPreVenta() || this.factServ.isCotizacion())) {
      return this.abrirModalConfirmacionImprimir();
    } else {
      return this.abrirModalCantidadEfectivo();
    }
  }

  private abrirModalConfirmacionImprimir() {
    const obj = {
      metodo: this.factServ.tipoDocumento(),
      condicion_fact: this.condicion_fact,
      is_viaje: this.is_viaje,
      modo_factura: this.modo_factura,
    };

    const confirmationImprimirModalConf = new DynamicModalClass();

    confirmationImprimirModalConf.id = 'confirmacionImprimir';
    confirmationImprimirModalConf.inputs = obj;
    confirmationImprimirModalConf.header = 'Confirmación';
    confirmationImprimirModalConf.width = '30rem';
    confirmationImprimirModalConf.component = ConfirmacionImprimirComponent;
    confirmationImprimirModalConf.botones = [
      { clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cancelar', disable: false },
      { id: 'btnConfirmar', clase: 'btn btn-verde', label: 'Confirmar', disable: false },
    ];

    confirmationImprimirModalConf.setCallback(this.processImprimir.bind(this));
    confirmationImprimirModalConf.show();
  }

  processImprimir(args: ICallbackModal) {
    if (args.type == modalCloseType.returnData) {
      const { is_print } = args.data;

      this.is_print = is_print;
      this.enviarABaseDatos();
    }
  }

  private async abrirModalCantidadEfectivo() {
    let articulos_a_cambiar = false;

    if (this.factServ.isCompra()) {
      const cuerpo_fact = fun.deepCloning(this.cuerpoFactura);
      this.newCuerpo = await this.revisarPrecios(cuerpo_fact);
      articulos_a_cambiar = this.articulosAcambiar.length > 0;
    }

    const obj = {
      metodo: this.factServ.tipoDocumento(),
      efectivo: this.factServ.action == actionFacturacion.update ? this.factura_a_rellenar.devuelta + this.factura_a_rellenar.total_factura : 0,
      total_factura: this.TOTAL,
      formaPago: this.factServ.action == actionFacturacion.update ? this.factura_a_rellenar.forma_pago : 'Efectivo',
      cambios_articulos: articulos_a_cambiar,
      condicion_fact: this.condicion_fact,
    };

    const cantidadEfectivoModalConfig = new DynamicModalClass();

    cantidadEfectivoModalConfig.id = 'cambioEfectivo';
    cantidadEfectivoModalConfig.inputs = obj;
    cantidadEfectivoModalConfig.header = 'Cantidad de efectivo';
    cantidadEfectivoModalConfig.width = '35rem';
    cantidadEfectivoModalConfig.component = FormCantidadEfectivoComponent;
    cantidadEfectivoModalConfig.closableEsc = true;
    cantidadEfectivoModalConfig.botones = [
      { clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cancelar', disable: false },
      { id: 'btnConfirmar', clase: 'btn btn-verde', functionInOtherComponent: 'btn_aceptar', label: 'Confirmar', disable: true },
    ];

    cantidadEfectivoModalConfig.setCallback(this.recibirCambiosEfectivo.bind(this));
    cantidadEfectivoModalConfig.show();
  }

  async recibirCambiosEfectivo(args: ICallbackModal) {
    if (args.type !== modalCloseType.returnData) return;

    const { is_print, obj } = args.data;

    // Actualizar propiedades del componente
    this.is_print = is_print;
    this.Devuelta = obj.devuelta;
    this.forma_pago = obj.forma_pago;

    // Procesar cambios específicos para compras
    if (this.factServ.isCompra()) {
      if (obj.decision_cambio) await this.cambiarCostos();
      this.cuerpoFactura = this.newCuerpo;
    }

    // Enviar a base de datos
    this.enviarABaseDatos();
  }

  getDocumentoDescripcion() {
    return this.factServ.getDocumentoDescripcion({ metodo: this.factServ.tipoDocumento(), condicion_fact: this.condicion_fact, is_viaje: this.is_viaje, modo_factura: this.modo_factura });
  }

  formarFacturaAGuardar() {
    const factura_a_guardar = this.formarData();
    factura_a_guardar['action'] = this.factServ.action != actionFacturacion.duplicate ? this.factServ.action : actionFacturacion.new;
    factura_a_guardar['factura_pendiente'] = this.factura_pendiente;
    factura_a_guardar['productos_devueltos'] = fun.deepCloning(this.factServ.productos_devueltos);
    return factura_a_guardar;
  }

  agregarFacturaALocalStorage() {
    if (!this.factServ.propietario_factura) this.factServ.propietario_factura = this.formPropietario.value;

    let facturas_localStorage = (FactsLocalStorage.getList() || []).sort((a, b) => fun.compare(a, b, ['archivo_id'], 'asc'));

    const factura_a_guardar = fun.deepCloning(this.objArchivo.factura_en_turno);

    let index_factura = facturas_localStorage.findIndex((facts: any) => facts?.archivo_id == this.factura_guardada?.archivo_id);

    if (!fun.isEmpty(this.factServ.propietario_factura.id)) {
      factura_a_guardar[this.factServ.isVenta() || this.factServ.isPreVenta() ? 'cliente' : 'suplidor'] = this.factServ.propietario_factura;
    }

    if (fun.hasValue(index_factura) && index_factura >= 0) {
      factura_a_guardar['archivo_id'] = this.factura_guardada?.archivo_id;
      facturas_localStorage[index_factura] = factura_a_guardar;
    } else {
      factura_a_guardar['archivo_id'] = facturas_localStorage.length > 0 ? _.last(facturas_localStorage).archivo_id + 1 : 1;

      factura_a_guardar['archivo_id'] = facturas_localStorage.length > 0 ? _.last(facturas_localStorage).archivo_id + 1 : 1;
      facturas_localStorage.push(factura_a_guardar);
    }

    facturas_localStorage.sort((a, b) => fun.compare(a, b, ['archivo_id'], 'asc'));

    FactsLocalStorage.setList(facturas_localStorage);

    this.reloadIndexFactArchivada();
  }

  procesoArchivarFactura(reset: boolean = false) {
    this.agregarFacturaALocalStorage();

    if (reset) this.router.navigateByUrl(`admin/factura/${this.factServ.tipoDocumento()}/${actionFacturacion.new}/0`).then(res_router => this.resetVariables());
  }

  archivarFactura() {
    let documento = this.getDocumentoDescripcion();

    if (this.checkIfFacturacionEnProceso()) {
      this.verificateArchivo().then(() => {
        let is_guardada = false;

        if (this.factura_guardada && this.factura_guardada?.archivo_id) is_guardada = FactsLocalStorage.getList().find((fact: any) => fact.archivo_id == this.factura_guardada?.archivo_id);

        const texto_modal = is_guardada ? `Esta <strong>${documento.descripcion}</strong> ya esta archivada ¿desea sobreescribirla?` : `¿Seguro que desea archivar esta <strong>${documento.descripcion}</strong> para continuarla luego?`;

        this.dynamicModalServ.confirmationModal({
          id: 'archivar_factura',
          texto: texto_modal,
          btnKind: confirmationButtons.siNo,
          onYes: () => this.procesoArchivarFactura(true),
        });
      });
    } else {
      fun.toastWarning(`Debe de iniciar una ${documento.descripcion} para archivarla.`, 'AVISO');
    }
  }

  selectModoFactura(arg) {
    // Resetear estados de modo de factura
    this.is_viaje = arg === 'viaje';
    this.is_adelantada = arg === 'adelantada';
    this.movimientosSelected = [];

    // Actualizar valores de retirado según el modo de factura
    const isAdelantada = this.modo_factura === 'adelantada';
    const valorRetirado = isAdelantada ? 0 : undefined;

    this.cuerpoFactura.forEach(detalle => {
      detalle.retirado = valorRetirado ?? detalle.cantidad_en_unidades;
      detalle.retirado_en_venta = valorRetirado ?? detalle.cantidad_en_unidades;
    });
  }

  getCantidadArticulos() {
    return this.cuerpoFactura.filter(factura => fun.hasValue(factura.cantidad))?.length ?? 0;
  }

  // =============================================
  //  OBTENER LA DATA DEL CUERPO
  // =============================================
  getCuerpoFactura(arg) {
    if (arg.tipo !== 'cuerpo') return;

    this.cuerpoFactura = arg.data;

    // Solo procesar si no es compra
    if (this.factServ.tipoDocumento() === tipoDocFacturacion.compra) return;

    const isAdelantada = this.modo_factura === 'adelantada';
    const valorRetirado = isAdelantada ? 0 : undefined;

    this.cuerpoFactura.forEach(detalle => {
      // Calcular ITBIS
      detalle.itbis = this.configApp.calcular_itbis ? fun.desformatearStNumber(detalle.itbis) : 0;

      // Configurar valores de retirado
      detalle.retirado = valorRetirado ?? detalle.cantidad_en_unidades;
      detalle.retirado_en_venta = valorRetirado ?? detalle.cantidad_en_unidades;
    });
  }

  prueba(arg?) {}

  resetVariables() {
    this.rellenarVariables().then(() => {
      fun.setTimeout(() => {
        if (this.factServ.isPreVenta() || this.factServ.isCotizacion()) this.abrirModalPropietario();
        else fun.enfocarInput('tipoFact');
      }, 5);
    });
  }

  calculatePrecio(costo): number {
    if (costo > 0 || costo != null || costo) {
      const precio = costo / this.configArticuloClass.getWinPercentCalc(this.config_articulos);
      return fun.desformatearStNumber(fun.roundNumberToDecimal(precio));
    }
  }

  procesarCambioCostos(costoDB, costoRow, articulo) {
    if (costoDB === costoRow) return;

    const { contenido_articulos } = articulo;
    const newPrecio = this.calculatePrecio(costoRow);

    // Buscar contenidos padre e hijo
    const contenidoPadre = contenido_articulos.find(contenido => contenido.condicion === 'padre');
    const contenidoHijo = contenido_articulos.find(contenido => contenido.condicion === 'hijo');

    // Procesar contenido padre si existe
    if (contenidoPadre) {
      const { cantidad: cantPadre } = contenidoPadre;
      contenidoPadre.precio = fun.desformatearStNumber(this.calcNewAmounts(cantPadre, newPrecio));
      contenidoPadre.costo = fun.desformatearStNumber(this.calcNewAmounts(cantPadre, costoRow));
    }

    // Procesar contenido hijo si existe
    if (contenidoHijo && contenidoPadre) {
      contenidoHijo.precio = fun.desformatearStNumber(this.calcNewAmounts(contenidoHijo.cantidad, fun.roundNumberToDecimal(contenidoPadre.precio)));
      contenidoHijo.costo = fun.desformatearStNumber(this.calcNewAmounts(contenidoHijo.cantidad, fun.roundNumberToDecimal(contenidoPadre.costo)));
    }

    // Actualizar artículo
    articulo.costo_principal = costoRow;
    articulo.precio_principal = newPrecio;
    articulo.contenido_articulos = this.limpiarContenidos([contenidoPadre, contenidoHijo]);

    // Agregar a la lista de cambios
    this.articulosAcambiar.push(fun.omit(articulo, ['created_at', 'updated_at']));
  }

  private limpiarContenidos(contenidos) {
    return contenidos.filter(contenido => fun.hasValue(contenido)).map(contenido => fun.omit(contenido, ['created_at', 'updated_at']));
  }

  calcNewAmounts(cant, precio) {
    const pre = precio / cant;
    return fun.roundNumberToDecimal(pre);
  }

  async revisarPrecios(cuerpoFact) {
    this.articulosAcambiar.length = 0;

    return cuerpoFact.map(row => {
      const { articulo } = row;
      const { contenido_articulos } = articulo;
      const costoRow = fun.desformatearStNumber(row.costo);
      const costoPrincipalDB = articulo.costo_principal;

      // Determinar el tipo de medida
      const isMedida = this.determinarTipoMedida(articulo, row.unidad, contenido_articulos);

      // Calcular costos según el tipo de medida
      if (contenido_articulos.length === 0 || isMedida === 'principal') {
        this.procesarCambioCostos(costoPrincipalDB, costoRow, articulo);
      } else {
        const { costoPrincipalCalculado, costoRowCalculado } = this.calcularCostosPorMedida(isMedida, contenido_articulos, costoRow);
        this.procesarCambioCostos(costoPrincipalCalculado, costoRowCalculado, articulo);
      }

      return fun.omit(row, ['costo', 'condicion', 'codigo']);
    });
  }

  private determinarTipoMedida(articulo, unidad, contenido_articulos) {
    if (articulo.medida === unidad) return 'principal';

    const contenidoEncontrado = contenido_articulos.find(content => content.medida === unidad);
    return contenidoEncontrado ? contenidoEncontrado.condicion : '';
  }

  private calcularCostosPorMedida(isMedida, contenido_articulos, costoRow) {
    const contenidoPadre = contenido_articulos.find(cont => cont.condicion === 'padre');
    const contenidoHijo = contenido_articulos.find(cont => cont.condicion === 'hijo');

    if (isMedida === 'padre') {
      const { costo, cantidad } = contenidoPadre;
      return { costoPrincipalCalculado: costo * cantidad, costoRowCalculado: cantidad * costoRow };
    }

    // Cálculo para medida hijo
    const esContenidoSimple = contenido_articulos.length === 1;
    const maxContenido = esContenidoSimple ? contenidoPadre.cantidad : contenidoPadre.cantidad * contenidoHijo.cantidad;

    const costoPrincipalCalculado = esContenidoSimple ? contenidoPadre.costo * maxContenido : contenidoHijo.costo * maxContenido;

    return { costoPrincipalCalculado, costoRowCalculado: maxContenido * costoRow };
  }

  ingresarFecha() {
    const modalConfig = new DynamicModalClass();
    modalConfig.width = '35rem';
    modalConfig.component = PendienteFormComponent;
    modalConfig.id = 'facturaPendiente';
    modalConfig.header = 'Factura pendiente';

    modalConfig.botones = [
      { clase: 'btn btn-gris', action: modalActionsE.close, label: 'Cerrar', disable: false },
      { id: 'btn_aceptar', clase: 'btn btn-green', label: 'Aceptar', disable: false },
    ];

    modalConfig.setCallback(this.processPendienteForm.bind(this));
    modalConfig.show();
  }

  async processPendienteForm(arg: ICallbackModal) {
    if (arg.type != modalCloseType.returnData) return;

    const { fecha } = arg.data;

    this.fechaFactura['front'] = this.formarFechaFactura(fecha)['FechaFactura'];
    this.fechaFactura['back'] = this.fechaFactura['front'];
    this.FechaFacturaMostrar = this.formarFechaFactura(fecha)['FechaFacturaMostrar'];
    this.factura_pendiente = true;
  }

  async cambiarCostos() {
    if (this.articulosAcambiar.length > 0) {
      for (let i = 0; i < this.articulosAcambiar.length; i++) {
        const articulo = this.articulosAcambiar[i];
        this.articuloClass.createUpdateOne(articulo).then(res => {});
      }
    }
  }

  revisarLocalStorage() {
    const is_guardada = FactsLocalStorage.getList().find((fact: any) => fact.archivo_id === this.factura_guardada?.archivo_id);

    if (fun.hasValue(is_guardada)) this.quitarFacturaGuardada(this.factura_guardada?.archivo_id);
  }

  formarData() {
    let cuerpo_fact = [...fun.deepCloning(this.cuerpoFactura), ...this.factServ.productos_devueltos];

    const cabecera_fact = {};
    cabecera_fact['id_documento'] = this.id_documento;
    cabecera_fact['condicion'] = this.condicion_fact;
    cabecera_fact['forma_pago'] = this.forma_pago;

    let fecha_equi;
    if (this.factura_pendiente) fecha_equi = new Date(this.fechaFactura['front']);
    else fecha_equi = null;

    cabecera_fact['fecha_viaje'] = this.is_viaje ? new Date(this.fecha_viaje) : null;

    cabecera_fact['fecha_equivalente'] = fecha_equi;

    if (this.condicion_fact == 'Crédito') {
      let fecha_venci;

      if (this.factServ.isVenta() || this.factServ.isPreVenta() || this.factServ.isCotizacion()) {
        fecha_venci = moment(new Date()).add(this.factServ.propietario_factura.limite_credito, 'days').format('YYYY-MM-DD');
      } else {
        fecha_venci = DateUtils.format({ date: this.fecha_vencimiento, dateFormat: 'YYYY-MM-DD' });
      }

      fecha_venci = moment(fecha_venci).add(8, 'hours').format();

      cabecera_fact['fecha_vencimiento'] = fecha_venci;
      cabecera_fact['pagada'] = false;
      cabecera_fact['balance'] = fun.parseStFloatTwoDecimals(this.TOTAL);
      cabecera_fact['devuelta'] = 0;
    } else {
      cabecera_fact['pagada'] = true;
      cabecera_fact['balance'] = 0;
      cabecera_fact['devuelta'] = this.Devuelta;
    }

    let fecha_valida = null;

    if (fun.hasValue(this.paqueteComprobante?.fecha_valida) && DateUtils.isValid(new Date(this.paqueteComprobante?.fecha_valida))) {
      const formatConfig = { dateFormat: 'YYYY-MM-DD', include_hour: true, hourFormat: 'HH:MM:SS', separator: ' ' };

      fecha_valida = DateUtils.format({ date: DateUtils.add(4, 'hours', this.paqueteComprobante?.fecha_valida), ...formatConfig });
    }

    cabecera_fact['fecha_valida'] = fecha_valida;
    cabecera_fact['tipo_factura_id'] = this.factServ?.tipoFactura?.id;
    cabecera_fact['numero_comprobante'] = this.factServ.isCompra() ? this.NCFcompra() : null;
    cabecera_fact['costoYgasto'] = this.factServ.isCompra() ? this.CostoYgasto() : null;
    cabecera_fact['numero_factura'] = null;
    cabecera_fact['total_factura'] = fun.parseStFloatTwoDecimals(this.TOTAL);
    cabecera_fact['Bruto'] = fun.parseStFloatTwoDecimals(this.BRUTO);
    cabecera_fact['itbis'] = fun.parseStFloatTwoDecimals(this.ITBIS);
    cabecera_fact['descuento'] = fun.parseStFloatTwoDecimals(this.DESCUENTO);
    cabecera_fact['estado'] = true;
    cabecera_fact['is_adelantada'] = this.is_adelantada;
    cabecera_fact['is_viaje'] = this.is_viaje;
    cabecera_fact['is_nota'] = false;
    cabecera_fact['movimientos_viaje'] = this.movimientosSelected;
    cabecera_fact['serie'] = this.factServ.serieType();

    cabecera_fact['pre_factura'] = fun.hasValue(this.factServ.pre_venta_selected) ? this.factServ.pre_venta_selected?.id : null;

    cabecera_fact['cotizacion'] = fun.hasValue(this.factServ.cotizacion_selected) ? this.factServ.cotizacion_selected?.id : null;
    if (this.factServ.isCompra) cabecera_fact['can_pagar'] = this.configApp.can_pagar;

    if (this.factServ.isCompra()) {
      cabecera_fact['suplidor_id'] = this.factServ.propietario_factura.id;
    } else {
      if (fun.isEmpty(this.factServ.propietario_factura) || fun.isEmpty(this.factServ.propietario_factura.id)) {
        cabecera_fact['cliente_id'] = null;
        cabecera_fact['NoCliente_nombre'] = this.formPropietario.controls.nombre_completo.value;
        cabecera_fact['NoCliente_direccion'] = this.formPropietario.controls.direccion.value;
      } else {
        cabecera_fact['cliente_id'] = this.factServ.propietario_factura.id;
      }
    }

    cabecera_fact['detalle_facturas'] = cuerpo_fact;

    //

    if (this.factServ.isPreVenta()) {
      cabecera_fact['FACTURA_DE'] = Ss.factServ.tipoFacturaId(tFacturaKey.pre_venta);
    } else if (this.factServ.isCotizacion()) {
      cabecera_fact['FACTURA_DE'] = Ss.factServ.tipoFacturaId(tFacturaKey.cotizacion);
    } else if (this.factServ.isVenta()) {
      cabecera_fact['FACTURA_DE'] = this.condicion_fact == 'Contado' ? Ss.factServ.tipoFacturaId(tFacturaKey.venta_contado) : Ss.factServ.tipoFacturaId(tFacturaKey.venta_credito);
    } else if (this.factServ.isCompra()) {
      cabecera_fact['FACTURA_DE'] = Ss.factServ.tipoFacturaId(tFacturaKey.compra);
    }

    cabecera_fact['tipo'] = this.factServ.tipoDocumento();
    cabecera_fact['tiene_nota'] = this.factura_a_rellenar ? this.factura_a_rellenar.tiene_nota : false;

    if (this.factServ.isVenta() && this.factServ.propietario_factura.vendedor_id) cabecera_fact['vendedor_id'] = Number(this.factServ.propietario_factura.vendedor_id);

    return cabecera_fact;
  }

  async enviarABaseDatos() {
    try {
      const cabecera_fact = this.formarData();

      let res;

      let documento = this.getDocumentoDescripcion();

      if (this.factServ.action == actionFacturacion.update) res = await this.facturaClass.updateOne(cabecera_fact, { afterPath: `custom/update/${this.id_documento}` });
      else res = await this.facturaClass.createOne(cabecera_fact);

      if (this.factura_guardada) this.revisarLocalStorage();

      this.facturaClass.parseDataToPdf(res['data']).then(async factura_parsed => {
        const obj = { data: factura_parsed, type: documento.tipo };

        // PdfService.generatePdf({ oPdf: obj, imprimir: this.is_print, isMostrar: false }).catch(err => fun.toastError(`Error imprimiendo la ${documento.descripcion}.`, 'ERROR'));
        PdfService.generatePdf({ oPdf: obj, imprimir: this.is_print }).catch(err => fun.toastError(`Error imprimiendo la ${documento.descripcion}.`, 'ERROR'));

        this.layServ.nextCheckCuadreToday(true);

        if (this.factServ.action == actionFacturacion.update) this.router.navigateByUrl('/admin/manipular/buscarFactura/solo_ver');
        else {
          // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
          fun.setTimeout(() => {
            this.resetVariables();
          }, 0);
        }
      });
    } catch (error) {
      console.error(error);
    }
  }
}
