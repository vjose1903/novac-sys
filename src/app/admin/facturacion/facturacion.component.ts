import { EmpleadoC } from './../registros/registro-empleados/empleado';
import { RetornarDevueltoComponent } from './cuerpo-factura/retornar-devuelto/retornar-devuelto.component';
import { MenuOpcionesExtraComponent } from './menu-opciones-extra/menu-opciones-extra.component';

import { Component, OnInit, OnDestroy, ViewChild, HostListener, AfterViewInit, inject, effect, OnChanges, SimpleChanges, Input } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
const moment = require('../../core/javascript/moment');
import * as _ from 'lodash';
import { CuerpoFacturaComponent } from './cuerpo-factura/cuerpo-factura.component';
import { FacturacionService } from './facturacion.service';
import { ArticuloC } from '../registros/articulos/articulo';
import { tipoDocFacturacion, FacturasI, tFacturaD, actionFacturacion, comprobanteNormal, comprobanteElectronico } from './factura';
import { NcfC } from '../registros/ncf/ncf';
import { PendienteFormComponent } from '../components/formularios en modales/pendiente-form/pendiente-form.component';
import { FormCantidadEfectivoComponent } from '../components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component';
import { BuscarClienteSuplidorComponent } from '../components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { FactsLocalStorage } from './factsLocalStorage';
import { ClienteC } from '../registros/registro-clientes/cliente';
import { SuplidorC } from '../registros/registro-suplidores/suplidores';
import { fun } from '../../core/services/functions.service';
import { VehiculoC } from '../registros/registro-vehiculo/vehiculo';
import { seriesDGII, teclasCode, serie } from '../../core/typescript/constantes';
import { Permisos } from '../../core/typescript/permisos';
import { ConfigI } from '../../core/interface/config-interface';
import { Ss } from '../../core/services/singleton.service';
import { ConfirmacionImprimirComponent } from '../components/formularios en modales/confirmacion-imprimir/confirmacion-imprimir.component';
import { ModalClass } from '../components/modal/modal-class';
import { PdfService } from '../../core/services/reports/pdf/pdf.service';
import { ConfigArticuloC, ConfigArticuloI } from '../registros/articulos/configuracion_articulos/articulos_configuracion';
import { HtmlElementsService } from '../../core/services/html-elements.service';

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.scss'],
  standalone: false,
})
export class FacturacionComponent extends FactsLocalStorage implements OnInit, OnChanges, OnDestroy, AfterViewInit {
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

  console = console;
  datesAvailable = { viaje: { minDate: new Date() } };

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

      if (this.factServ.isVenta && combinacion == `${teclasCode._control}_${teclasCode._E}`) {
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
          if (this.optionesExtra.length > 0) {
            fun.desEnfocarInput(document.activeElement.id);

            const option = this.optionesExtra.find(opt => opt.keyboardCode == key);

            if (fun.hasValue(option)) this.selectOptionExtra(option, 'teclado');
          }
        }

        if (this.popover?.tipo == 'movimiento') this.mover_indicador_camion(`${this.entidad_en_turno}_row`, key);
      }
    }
  }

  fechaFactura;
  FechaFacturaMostrar: any;

  factura_a_rellenar: FacturasI;
  form: UntypedFormGroup;
  fecha;
  modo_factura;
  is_adelantada;
  is_viaje;
  is_editando: boolean;
  ITBIS;
  condicion_fact;
  forma_pago;

  optionesExtra = [];
  keyboardCodesEnabled = [];
  cuerpoFactura = [];
  DESCUENTO;
  BRUTO;
  TOTAL;

  NCFcompra;
  CostoYgasto;
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
  ƒ;
  permissions = Permisos;
  configApp: ConfigI;
  timeInterval;
  tipoDocFacturacion = tipoDocFacturacion;
  fun = fun;
  isInitialized = false;
  cofig_articulos: ConfigArticuloI;

  facturasSerieOptions = seriesDGII;
  htmlServ = inject(HtmlElementsService);
  factServ = inject(FacturacionService);

  local_index_fact_archivada = this.index_fact_archivada();

  constructor(
    private fb: UntypedFormBuilder,

    private router: Router
  ) {
    super();

    this.form = this.fb.group({ id: [], nombre: [], direccion: [], telefono: [] });

    this.timeInterval = setInterval(() => (this.fecha = this.my_timeDateFormater(new Date())), 1000);
  }

  ngOnInit() {
    this.configApp = Ss.configServ.getConfig({ isPromise: false });
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('%c changes', 'color: red', changes);
    this._init_mixin({ component: 'cabeza_factura', is_routing: true });

    this.validatePermisos().then(result => {
      this.rellenarVariables().then(() => {
        console.log('%c this.factServ.action ', 'color: cyan', this.factServ.action);
        console.log('%c this.factServ.tipoDocumento ', 'color: cyan', this.factServ.tipoDocumento);
        if (this.factServ.action == actionFacturacion.update) {
          this.is_editando = true;
          this.procesoRelleno({ id: this.id_documento, tipo: this.factServ.tipoDocumento, action: actionFacturacion.update });
          //
        } else if (this.factServ.action == actionFacturacion.bill_from_cotizacion) {
          this.procesoRelleno({ id: this.id_documento, tipo: tipoDocFacturacion.venta, action: actionFacturacion.bill_from_cotizacion });
          //ƒ
        } else if (this.factServ.action == actionFacturacion.bill_from_pre_venta) {
          this.procesoRelleno({ id: this.id_documento, tipo: tipoDocFacturacion.venta, action: actionFacturacion.bill_from_pre_venta });
          //
        } else if (this.factServ.action == actionFacturacion.duplicate) {
          this.procesoRelleno({ id: this.id_documento, tipo: this.factServ.tipoDocumento, action: actionFacturacion.duplicate }).then(res => {
            this.abrirModalPropietario({ include_contado: true });
          });
          //
        } else {
          setTimeout(() => {
            if (this.factServ.isPreVenta || this.factServ.isCotizacion) this.abrirModalPropietario();
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

  getConfiguracionArticulo() {
    this.configArticuloClass.getOne(1).then(cofig_articulos => (this.cofig_articulos = cofig_articulos.data as ConfigArticuloI));
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
    const config_options = [
      { keyboardCode: undefined, key: undefined, code: tipoDocFacturacion.pre_venta, label: 'Seleccionar Pre-Venta', show: this.hasPermisoPreVenta, condition: () => true },
      { keyboardCode: undefined, key: undefined, code: tipoDocFacturacion.cotizacion, label: 'Seleccionar Cotización', show: this.hasPermisoCotizacion, condition: () => true },
      { keyboardCode: undefined, key: undefined, code: 'retornar_devueltos', label: 'Retornar articulos devueltos', show: true, condition: this.someArticuloHasDevuelto.bind(this) },
    ];

    for (let index = 0; index < config_options.length; index++) {
      const config_option = config_options[index];

      if (config_option.show) {
        config_option.key = this.optionesExtra.length + 1;
        config_option.keyboardCode = teclasCode[`_${config_option.key}`];
        this.keyboardCodesEnabled.push(teclasCode[`_${config_option.key}`]);
        this.optionesExtra.push(config_option);
      }
    }
  }

  someArticuloHasDevuelto() {
    const detalles = this.factServ.getDetallesLlenos();
    return detalles.some(detalle => detalle.is_devuelto) || this.factServ.productos_devueltos.length > 0;
  }

  selectOptionExtra(option, where) {
    let openModal = true;
    const modalConfig = { id: undefined, inputs: undefined, component: undefined, header: undefined, botones: undefined, width: '57rem', height: '32rem' };

    if (this.keyboardCodesEnabled.includes(option.keyboardCode) && option.condition()) {
      modalConfig.id = 'factura_from_documento';
      modalConfig.component = MenuOpcionesExtraComponent;

      modalConfig.inputs = option;
      modalConfig.botones = { cancelar: { show: true } };

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
        modalConfig.botones = { aceptar: { show: true, disable: true }, cancelar: { show: true, disable: false } };
        modalConfig.inputs = { data: null, articulo_defectuoso: null, articulo_solo_devuelto: null, tipo: null, nombre: null, is_articulo_selected: false, devueltos_list: this.getDevueltos(), detalles: this.factServ.getDetallesLlenos() };
      }

      if (openModal) {
        this.openNewModal({ component: modalConfig.component, inputs: modalConfig.inputs, id: modalConfig.id, header: modalConfig.header, width: modalConfig.width, height: modalConfig.height, botones: modalConfig.botones });
      }

      if (fun.hasValue(this.popover?.item)) this.cerrarOverlay();
    }
  }

  getDevueltos() {
    const detalles = this.factServ.getDetallesLlenos();
    const articulos_defectuosos = _.filter(detalles, detalle => detalle.is_devuelto);
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

        const factura_en_turno_storage = comparar_con_localStorage ? _.omit(comparar_con_localStorage, ['archivo_id', 'cliente', 'suplidor']) : undefined;
        this.objArchivo['factura_en_turno_storage'] = factura_en_turno_storage;
      }

      resolve(true);
    });
  }

  // NOTE: TEMPORAL

  verificateSerieValidity() {
    let disable = false;
    if (this.factServ.tipoDocumento != tipoDocFacturacion.compra) disable = true;

    const option = this.facturasSerieOptions.find(option => option.value == serie.electronica);
    if (option) option.disabled = disable;
  }

  rellenarVariables() {
    return new Promise<void>(resolve => {
      this.isInitialized = false;

      this.factServ.tipoDocumento = this.tipo_documento;
      this.factServ.action = this.action;
      this.factServ.productos_devueltos.length = 0;
      // NOTE: TEMPORAL
      this.verificateSerieValidity();

      if (this.factServ.isVenta) this.titulo = 'Factura de venta';
      else if (this.factServ.isCompra) this.titulo = 'Factura de compra';
      else if (this.factServ.isPreVenta) this.titulo = 'Pre factura';
      else if (this.factServ.isCotizacion) this.titulo = 'Cotización';

      this.factServ.setTipos(this.factServ.tipoDocumento, serie.normal).then(result => {
        //
        [this.fecha_vencimiento, this.fecha_equivalente, this.fecha_viaje] = Array(3).fill(new Date());
        [this.is_adelantada, this.is_viaje, this.factura_pendiente, this.is_editando, this.errorComprobante] = Array(5).fill(false);
        [this.DESCUENTO, this.BRUTO, this.TOTAL, this.ITBIS, this.camion_row, this.chofer_row] = Array(6).fill(0);
        [this.NCFcompra, this.factServ.pre_venta_selected, this.factServ.cotizacion_selected, this.factura_a_rellenar, this.factServ.propietario_factura, this.objArchivo, this.factura_guardada, this.popover] = Array(8).fill(undefined);

        this.entidad_en_turno = 'camion';
        this.cuerpoFactura.length = 0;
        this.articulosAcambiar.length = 0;
        this.movimientosSelected.length = 0;

        this.info_cambio = {};
        this.fechaFactura = {};
        this.CostoYgasto = '';

        this.fechaFactura['front'] = this.formarFechaFactura(new Date())['FechaFactura'];
        this.fechaFactura['back'] = this.fechaFactura['front'];
        this.FechaFacturaMostrar = this.formarFechaFactura(new Date())['FechaFacturaMostrar'];

        this.modo_factura = this.factServ.isPreVenta ? this.factServ.tipoDocumento : this.factServ.isCotizacion ? null : 'normal';

        this.condicion_fact = this.factServ.isPreVenta ? 'Crédito' : this.factServ.isCotizacion ? 'Crédito' : 'Contado';
        this.forma_pago = this.factServ.isCotizacion || this.factServ.isPreVenta ? null : 'Efectivo';

        this.filterCamionesTargets = ['marca', 'modelo', 'anio', 'propietario.nombre', 'propietario.apellido'];
        this.filterChoferesTargets = ['nombre', 'apellido', 'nombre_completo'];

        if (this.factServ.isVenta) {
          this.form.patchValue(this.factServ.clienteContado);
        } else {
          if (fun.hasValue(this.form)) this.form.reset();
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
          this.rellenarVariables().then(() => resolve());
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
            //
            this.cuerpo.rellenarCuerpoFactura(factura_rellenada['detalle_facturas'], fun.objHas(factura_rellenada, 'archivo_id')).then(res => {
              setTimeout(() => {
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
      let productos_devueltos = fun.hasValue(original_factura?.productos_devueltos) ? original_factura?.productos_devueltos : [];

      this.factServ.propietario_factura = {};

      this.factServ.tipoDocumento = factura.tipo as tipoDocFacturacion;
      if (factura.id_documento) this.id_documento ??= factura.id_documento;

      if (!fun.objHas(factura, 'archivo_id') && [actionFacturacion.update, actionFacturacion.bill_from_cotizacion, actionFacturacion.bill_from_pre_venta, actionFacturacion.duplicate].includes(original_factura.action)) {
        const factura_archivada = FactsLocalStorage.getList().find(factura => factura.id_documento == factura?.id);

        if (fun.hasValue(factura_archivada)) {
          factura = factura_archivada;
          productos_devueltos = factura.productos_devueltos;
          this.actualizarLayServFactGuardada(factura_archivada);
        } else {
          const id = factura.id ?? null;
          const res = await this.facturaClass.getFacturaById(id);

          factura = res['data'];
          if ([actionFacturacion.bill_from_cotizacion, actionFacturacion.bill_from_pre_venta].includes(original_factura.action)) factura.condicion = 'Contado';
        }
      }

      const value_buscar = original_factura.action == actionFacturacion.bill_from_pre_venta || original_factura.action == actionFacturacion.bill_from_cotizacion ? '02' : factura.tipo_factura_id;
      const by_buscar = original_factura.action == actionFacturacion.bill_from_pre_venta || original_factura.action == actionFacturacion.bill_from_cotizacion ? 'referencia' : 'id';

      if (![actionFacturacion.duplicate].includes(original_factura.action)) this.setPropietario(factura);

      const currentSerie = fun.hasValue(factura?.numero_comprobante) && factura.numero_comprobante.includes('E') ? serie.electronica : serie.normal;

      this.factServ.setTipos(this.factServ.tipoDocumento, currentSerie).then(result => {
        this.factServ
          .setTipoFacturaSelected(value_buscar, by_buscar)
          .then(async result => {
            this.factura_pendiente = fun.hasValue(factura) && fun.objHas(factura, 'factura_pendiente') ? factura?.factura_pendiente : false;

            const fecha_facturacion = factura?.fecha_equivalente ? factura?.fecha_equivalente : fun.deepCloning(this.fechaFactura['back']);

            this.fechaFactura['front'] = this.formarFechaFactura(fecha_facturacion)['FechaFactura'];
            this.fechaFactura['back'] = this.fechaFactura['front'];

            this.FechaFacturaMostrar = this.formarFechaFactura(fecha_facturacion)['FechaFacturaMostrar'];

            if (fun.hasValue(this.factServ.tipoFactura) && this.factServ.tipoFactura.referencia != '00' && this.factServ.tipoFactura.referencia != '02' && this.factServ.isVenta) {
              this.ncfClass.getAll({ afterPath: `custom/${this.factServ.tipoFactura.id}/true` }).then(res => {
                this.paqueteComprobante = res.data;
              });
            }

            if (factura.is_viaje) this.fecha_viaje = new Date(factura.fecha_viaje);
            else this.fecha_viaje = new Date();

            if (factura.tipo == 'compra') this.fecha_vencimiento = new Date(factura.fecha_vencimiento);
            else this.fecha_vencimiento = new Date();

            this.is_viaje = factura.is_viaje;
            this.condicion_fact = factura.action == actionFacturacion.bill_from_pre_venta || factura.action == actionFacturacion.bill_from_cotizacion ? this.condicion_fact : factura.condicion;

            this.NCFcompra = factura.tipo == tipoDocFacturacion.compra ? factura.numero_comprobante : undefined;
            this.CostoYgasto = factura.tipo == tipoDocFacturacion.compra ? factura.costoYgasto : '';

            if (factura.tipo == tipoDocFacturacion.pre_venta) this.modo_factura = this.factServ.action == actionFacturacion.bill_from_pre_venta ? 'normal' : tipoDocFacturacion.cotizacion;
            else if (factura.tipo == tipoDocFacturacion.cotizacion) this.modo_factura = this.factServ.action == actionFacturacion.bill_from_cotizacion ? 'normal' : tipoDocFacturacion.cotizacion;
            else if (factura.is_viaje) this.modo_factura = 'viaje';
            else if (factura.is_adelantada) this.modo_factura = 'adelantada';
            else this.modo_factura = 'normal';

            if (original_factura.action == actionFacturacion.bill_from_cotizacion) {
              this.factServ.cotizacion_selected = factura;
              if (fun.isEmpty(factura?.id)) this.factServ.cotizacion_selected.id = this.id_documento;
            } else if (original_factura.action == actionFacturacion.bill_from_pre_venta) {
              this.factServ.pre_venta_selected = factura;
              if (fun.isEmpty(factura?.id)) this.factServ.pre_venta_selected.id = this.id_documento;
            } else {
              this.factura_a_rellenar = factura;
            }

            this.factServ.productos_devueltos = productos_devueltos;

            if (fun.objHas(factura, 'movimientos_viaje')) {
              factura.movimientos_viaje.forEach(movimiento => this.movimientosSelected.push({ vehiculo_id: movimiento.vehiculo_id, user_id: movimiento.user_id }));
            }

            factura.detalle_facturas = _.filter(factura.detalle_facturas, detalle => !detalle.is_devuelto || (detalle.is_devuelto && detalle.is_defectuoso));

            if (original_factura.action == actionFacturacion.duplicate) {
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
    });
  }

  async setPropietario(arg) {
    if (arg.tipo == tipoDocFacturacion.compra) {
      const suplidor_response = await this.suplidorClass.getOne(arg.suplidor_id);
      this.factServ.propietario_factura = suplidor_response.data;
      this.factServ.propietario_factura.nombre = this.factServ.propietario_factura.nombre_completo;
    } else {
      if (fun.hasValue(arg.cliente_id)) {
        const cliente_response = await this.clienteClass.getOne(arg.cliente_id);
        this.factServ.propietario_factura = cliente_response.data;
        this.factServ.propietario_factura.nombre = this.factServ.propietario_factura.nombre_completo;
      } else {
        this.factServ.propietario_factura = { id: null, direccion: arg['NoCliente_direccion'], nombre: arg['NoCliente_nombre'], telefono: '' };
      }
    }
    this.form.patchValue(this.factServ.propietario_factura);
  }

  checkSituaciones(): Promise<{ factura_en_proceso: boolean; abrirModal?: boolean; texto_modal?: string; archivo_id?: any }> {
    return new Promise(resolve => {
      let documento = this.getDocumentoDescripcion();
      this.verificateArchivo().then(() => {
        if (this.checkIfFacturacionEnProceso()) {
          let texto_modal = '';
          let abrirModal = true;

          if (this.factura_guardada && this.factura_guardada?.archivo_id) {
            if (fun.isEqual(this.objArchivo.factura_en_turno, this.objArchivo.factura_en_turno_storage)) {
              fun.toastWarning(`La ${documento.descripcion} que estaba realizando esta archivada para poder utilizarla luego.`, 'AVISO');
              abrirModal = false;
            } else {
              texto_modal = `La ${documento.descripcion} que esta en proceso ya se encuentra archivada ¿desea sobreescribirla?`;
            }
          } else {
            texto_modal = `Estas a punto de salir del modulo de facturación, ¿desea guardar la ${documento.descripcion} para continuarla luego?`;
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
      let salirFunction = instance => {
        this.agregarFacturaALocalStorage();
        this.info_cambio['bool'] = true;
        this.runFinalizarCambioMenu(this.info_cambio);
        this.closeModal(instance);
      };

      let noGuardar = instance => {
        this.info_cambio['bool'] = true;
        this.runFinalizarCambioMenu(this.info_cambio);
        this.closeModal(instance);
      };

      let cancelarFunction = instance => {
        this.info_cambio['bool'] = false;
        this.runFinalizarCambioMenu(this.info_cambio);
        this.closeModal(instance);
      };

      const confirmationObj = {
        id: 'salir_layout',
        texto: texto_modal,
        header: 'Confirmación',
        siFunction: instance => salirFunction(instance),
        noFunction: instance => noGuardar(instance),
        cancelarFunction: instance => cancelarFunction(instance),
        width: '30rem',
      };

      this.confirmationModal(confirmationObj);
    } else {
      this.info_cambio['bool'] = true;
      this.runFinalizarCambioMenu(this.info_cambio);

      callback({ bool: true });
    }
  }

  rellenarFacturaArchivada(factura) {
    console.log('%c this.factServ.tipoDocumento ', 'color: yellow', this.factServ.tipoDocumento);
    console.log('%c this.factServ.action ', 'color: yellow', this.factServ.action);
    console.log('%c this.id_documento ', 'color: yellow', this.id_documento);

    if (fun.hasValue(factura)) {
      if (this.factura_guardada && this.factura_guardada?.archivo_id == factura.archivo_id) {
        fun.toastWarning(`Ya esta ${this.getSideBarTabByKey(this.factura_guardada.tipo)['singleTitle']} esta seleccionada.`, 'AVISO');
      } else {
        this.checkSituaciones().then(result => {
          if (result.factura_en_proceso) {
            if (result.abrirModal) {
              let siFunction = instance => {
                this.procesoArchivarFactura(instance);
                this.procesoRelleno(factura).then(() => {
                  this.actualizarLayServFactGuardada(factura);
                });
              };

              let noFunction = instance => {
                this.procesoRelleno(factura).then(() => {
                  this.actualizarLayServFactGuardada(factura);
                  this.closeModal(instance);
                });
              };

              const cancelarRelleno = instance => this.closeModal(instance);

              const confirmationObj = {
                id: 'archivar_factura',
                texto: result.texto_modal,
                header: 'Confirmación',
                siFunction: instance => siFunction.bind(this)(instance),
                noFunction: instance => noFunction.bind(this)(instance),
                cancelarFunction: instance => cancelarRelleno(instance),
                width: '30rem',
              };

              this.confirmationModal(confirmationObj);
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

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.info_cambio = arg;
      this.checkSituaciones().then(result => {
        if (result.factura_en_proceso) {
          this.procesoCambio(result.abrirModal, result.texto_modal, callback);
        } else {
          this.runFinalizarCambioMenu(this.info_cambio);
          callback({ bool: true });
        }
      });
    }
  }

  checkIfFacturacionEnProceso() {
    return this.cuerpoFactura.length > 0;
  }

  checkCambiosModoyCondicionFactura(arg: { elemento_html?; id?; value? }) {
    const sali_de = fun.hasValue(arg.elemento_html) ? arg.elemento_html.id : arg.id;
    const valor = fun.hasValue(arg.elemento_html) ? arg.elemento_html.value : arg.value;

    const condicion = this.condicion_fact;
    const tipo_factura_referencia = this.factServ.tipoFactura.referencia;

    let buscar = false;

    setTimeout(() => {
      const voy_a = document.activeElement.id;
      const dont_have_propietario = fun.isEmpty(this.factServ?.propietario_factura) || fun.isEmpty(this.factServ?.propietario_factura?.id);

      if (this.factServ.isVenta || this.factServ.isPreVenta) {
        if (sali_de == 'venta' && (condicion == 'Crédito' || tipo_factura_referencia == '01') && dont_have_propietario && (fun.isEmpty(voy_a) || voy_a != 'fecha_viaje')) buscar = true;

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
    this.TOTAL = fun.roundNumberToDecimal(arg.total);
    this.ITBIS = fun.roundNumberToDecimal(arg.itbis);
    this.DESCUENTO = fun.roundNumberToDecimal(arg.descuento);

    this.calcularBruto();
  }

  calcularBruto() {
    setTimeout(() => {
      const suma = fun.desformatearStNumber(this.TOTAL) + fun.desformatearStNumber(this.DESCUENTO) - fun.desformatearStNumber(this.ITBIS);
      this.BRUTO = fun.roundNumberToDecimal(suma);
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

  async calcularPorcientoComprobante() {
    return new Promise(async resolve => {
      if (this.factServ.isVenta) {
        if (this.factServ.tipoFactura.referencia != '00' && this.factServ.tipoFactura.referencia != comprobanteNormal.factura_consumo && this.factServ.tipoFactura.referencia != comprobanteElectronico.factura_consumo) {
          try {
            const paquete = await this.ncfClass.getAll({ afterPath: `custom/${this.factServ.tipoFactura.id}/true` });

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

              const descripcion = this.factServ.tipoFactura.descripcion;

              const msg = this.paqueteComprobante.msg == 'Ultimo comprobante de este paquete' ? `Ultimo comprobante para ${descripcion}.` : `Los comprobantes para ${descripcion} se estan agotando, solo quedan ${restante}`;

              if (secuencia >= limite) fun.toastWarning(msg, 'AVISO');
            }
            resolve(true);
          } catch (error) {
            if (fun.isEmpty(error.error.msg)) fun.toastError('Error calculando la secuencia de comprobantes.', 'AVISO');

            this.errorComprobante = true;
            resolve(false);
          }
        } else {
          this.paqueteComprobante = undefined;
          this.errorComprobante = false;
          resolve(true);
        }
      } else {
        resolve(true);
      }
    });
  }

  async changeSerie() {
    this.factServ.setTipos(this.factServ.tipoDocumento, this.factServ.serieType, true).then(result => {
      this.errorComprobante = false;
      setTimeout(() => this.checkTipoFactura(), 0);
    });
  }

  async checkTipoFactura() {
    this.factServ
      .setTipoFacturaSelected(this.factServ.tipoFacturaReferenciaSelected)
      .then(result => {
        this.NCFcompra = `${this.factServ.isComprobanteNormal ? 'B' : 'E'}${this.factServ.tipoFacturaReferenciaSelected}`;

        this.calcularPorcientoComprobante().then(continuar => {
          if (continuar) fun.enfocarInput('condicion');
          else this.errorComprobante = true;
        });
      })
      .catch(error => {
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
        siguiente_input = this.factServ.isCompra ? 'gastoDe' : 'venta';
        break;

      case 'gastoDe':
        if (this.factServ.isCompra && !this.factServ.options_tipos_costos_gastos.includes(valor)) {
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
          if (fun.isEmpty(this.factServ.propietario_factura) || this.factServ.propietario_factura.nombre == this.factServ.clienteContado.nombre) is_enforcar = false;
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
      setTimeout(() => fun.enfocarInput(siguiente_input), 10);
    } else fun.desEnfocarInput(salioDe);

    if (is_buscar_cliente) this.abrirModalPropietario();
    if (is_enforcar_cuerpo) this.cuerpo.seleccionarCampoEnTurno();
  }

  iniciarFactura() {
    if (this.condicion_fact !== 'Crédito') {
      this.factServ.propietario_factura = this.form.value;

      setTimeout(() => this.cuerpo.seleccionarCampoEnTurno(), 10);
    } else {
      fun.toastWarning('Para facturar a crédito debe de seleccionar un cliente', 'Aviso');
    }
  }

  activarNombreDireccion() {
    let is_disabled = false;

    if (this.factServ.isCompra || (this.is_editando && (this.factServ.isVenta || this.factServ.isCompra))) {
      is_disabled = true;
    } else {
      is_disabled = false;

      if (
        this.errorComprobante ||
        this.is_adelantada ||
        (this.condicion_fact == 'Crédito' && this.factServ.tipoDocumento != tipoDocFacturacion.cotizacion) ||
        this.modo_factura == 'viaje' ||
        this.modo_factura == 'adelantada' ||
        this.factServ.tipoFactura?.referencia == comprobanteNormal.valor_fiscal ||
        this.factServ.tipoFactura?.referencia == comprobanteElectronico.valor_fiscal ||
        fun.hasValue(this.factServ.pre_venta_selected)
      ) {
        is_disabled = true;
      } else {
        is_disabled = false;
      }
    }

    return is_disabled;
  }

  openOverlay(event, overlay, tipo) {
    this.popover = {};
    this.popover['item'] = overlay;
    this.popover['tipo'] = tipo;

    this.popover['item'].toggle(event);

    if (tipo == 'movimiento') setTimeout(() => fun.enfocarInput('searchCamion'), 5);
    if (event) event.stopPropagation();
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
        _.pull(this.movimientosSelected, _.find(this.movimientosSelected, { vehiculo_id: camion.id }));
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
    setTimeout(() => fun.enfocarInput(entidades[this.entidad_en_turno]), 5);
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

    setTimeout(() => {
      const voy_a = document.activeElement;

      if (!containMovimientoViaje.contains(voy_a)) {
        if (this.movimientosSelected.length && !this.movimientosSelected.some(mov => fun.isEmpty(mov.user_id))) {
          this.saliendoDeCamionOverlay();
        } else {
          fun.toastWarning('Debe de seleccionar almenos un camión y un chofer para el viaje.', 'Aviso');
          setTimeout(() => fun.enfocarInput(entidades[this.entidad_en_turno]), 5);
        }
      } else {
        setTimeout(() => fun.enfocarInput(entidades[this.entidad_en_turno]), 5);
      }
    }, 250);
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
    setTimeout(() => {
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

  abrirModalPropietario(params?: { include_contado: boolean }) {
    if (fun.isEmpty(params)) params = { include_contado: false };
    let documento = this.getDocumentoDescripcion();

    if (this.is_editando && (this.factServ.isVenta || this.factServ.isCompra)) {
      const entidad = this.factServ.isVenta ? 'Cliente' : 'Suplidor';
      fun.toastWarning(`Al editar una ${documento.descripcion}, no se le puede cambiar el ${entidad}.`, 'AVISO');
    } else {
      fun.desEnfocarInput(document?.activeElement?.id);

      let botones = fun.deepCloning(ModalClass.noShowAceptarCancelarButtons);

      if (this.factServ.isCotizacion || this.factServ.isPreVenta) {
        const label = `Salir de ${this.factServ.isCotizacion ? 'Cotización' : 'Pre venta'}`;
        botones['dinamico'] = [{ clase: 'btn btn-gris', function: instance => this.router.navigateByUrl('/admin/dashboard') && this.closeModal(instance), label: label, disable: false }];
      }

      const include_contado = this.factServ.tipoDocumento === tipoDocFacturacion.cotizacion || params.include_contado;

      this.openNewModal({
        component: BuscarClienteSuplidorComponent,
        inputs: { metodo: this.factServ.tipoDocumento, include_contado: include_contado, palabra_a_buscar: ' ' },
        id: 'buscarCliente',
        header: this.factServ.isCompra ? 'BUSCAR SUPLIDOR' : 'BUSCAR CLIENTE',
        width: '56.25rem',
        height: '31.25rem',
        botones: botones,
      });
    }
  }

  onHideModal(arg) {
    if (arg.modal.id == 'buscarCliente') {
      let documento = this.getDocumentoDescripcion();
      const actualPath = fun.getActualPath();

      if (fun.hasValue(documento) && !documento.has_Propietario && actualPath.includes('factura')) {
        fun.toastWarning(`Para realizar una ${documento.descripcion}, debe de seleccionar el cliente.`, 'AVISO');
      }
    }
  }

  // =============================================
  //  MODAL CANCELAR
  // =============================================
  cancelarFactura() {
    let si = instance => {
      if (this.factServ.action !== actionFacturacion.update) this.router.navigateByUrl(`admin/factura/${this.factServ.tipoDocumento}/${actionFacturacion.new}/0`).then(res_router => this.resetVariables());
      else if (this.factServ.action == actionFacturacion.update || this.factServ.action == actionFacturacion.bill_from_cotizacion) this.router.navigateByUrl(`/admin/manipular/buscarFactura/solo_ver`);

      this.closeModal(instance);
    };

    let documento = this.getDocumentoDescripcion();

    let obj = { id: 'cancelar_factura', header: 'Confirmación', texto: `Seguro que desea cancelar la ${documento.descripcion}`, siFunction: si };

    this.confirmationModal(obj);
  }

  // =============================================
  //  MODAL enviarABaseDatos
  // =============================================
  async imprimirFactura() {
    let documento = this.getDocumentoDescripcion();
    if (!this.factServ.propietario_factura) {
      if (this.factServ.isCompra) fun.toastWarning(`${documento.descripcion} no tiene suplidor seleccionado`, 'Aviso');
      else fun.toastWarning(`${documento.descripcion} no tiene cliente seleccionado`, 'Aviso');
    } else {
      if (this.cuerpoFactura.length == 0) {
        fun.toastWarning(`${documento.descripcion} incompleta!!!`, 'Aviso');
        fun.enfocarInput('codigo-0');
      } else {
        if (this.TOTAL == 0) {
          fun.toastWarning(`Total de la ${documento.descripcion} no puede ser 0`, 'Aviso');
          fun.enfocarInput('codigo-0');
        } else {
          if (this.is_viaje && !this.getIndicadorMovimientoViaje()) {
            fun.toastWarning(`Debe seleccionar al menos un camión y un chofer para el viaje.`, 'Aviso');
            document.getElementById('btnCamion').click();
          } else {
            if (this.factServ.tipoDocumento != tipoDocFacturacion.compra && (this.condicion_fact == 'Crédito' || this.is_viaje || this.factServ.isPreVenta || this.factServ.isCotizacion)) {
              const obj = { metodo: this.factServ.tipoDocumento, condicion_fact: this.condicion_fact, is_viaje: this.is_viaje, modo_factura: this.modo_factura };

              this.openNewModal({
                component: ConfirmacionImprimirComponent,
                inputs: obj,
                id: 'confirmacionImprimir',
                header: 'Confirmación',
                width: '30rem',
                botones: {
                  ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
                  dinamico: [
                    { clase: 'btn btn-blanco', function: instance => this.closeModal(instance), label: 'Cancelar', disable: false },
                    { btn_id: 'btnConfirmar', clase: 'btn btn-verde', function_in_other_component: 'btn_aceptar', label: 'Confirmar', disable: false },
                  ],
                },
              });
            } else {
              let articulos_a_cambiar = false;

              if (this.factServ.isCompra) {
                const cuerpo_fact = fun.deepCloning(this.cuerpoFactura);
                this.newCuerpo = await this.revisarPrecios(cuerpo_fact);
              }

              if (this.articulosAcambiar.length > 0) articulos_a_cambiar = true;

              const obj = {
                modo_factura: this.modo_factura,
                condicion_fact: this.condicion_fact,
                metodo: this.factServ.tipoDocumento,
                total_factura: this.TOTAL,
                efectivo: this.factServ.action == actionFacturacion.update ? this.factura_a_rellenar.devuelta + this.factura_a_rellenar.total_factura : 0,
                tipo_modal: 'devuelta',
                formaPago: this.factServ.action == actionFacturacion.update ? this.factura_a_rellenar.forma_pago : 'Efectivo',
                factura_de: this.factServ.tipoDocumento,
                cambios_articulos: articulos_a_cambiar,
              };

              this.openNewModal({
                component: FormCantidadEfectivoComponent,
                inputs: obj,
                id: 'cambioEfectivo',
                header: 'Cantidad de efectivo',
                width: '34.375rem',
                botones: {
                  ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
                  dinamico: [
                    { clase: 'btn btn-blanco', function: instance => this.closeModal(instance), label: 'Cancelar', disable: false },
                    { btn_id: 'btnConfirmar', clase: 'btn btn-verde', function_in_other_component: 'btn_aceptar', label: 'Confirmar', disable: true },
                  ],
                },
              });
            }
          }
        }
      }
    }
  }

  getDocumentoDescripcion() {
    return this.factServ.getDocumentoDescripcion({ metodo: this.factServ.tipoDocumento, condicion_fact: this.condicion_fact, is_viaje: this.is_viaje, modo_factura: this.modo_factura });
  }

  formarFacturaAGuardar() {
    const factura_a_guardar = this.formarData();
    factura_a_guardar['action'] = this.factServ.action != actionFacturacion.duplicate ? this.factServ.action : actionFacturacion.new;
    factura_a_guardar['factura_pendiente'] = this.factura_pendiente;
    factura_a_guardar['productos_devueltos'] = fun.deepCloning(this.factServ.productos_devueltos);

    return factura_a_guardar;
  }

  agregarFacturaALocalStorage() {
    if (!this.factServ.propietario_factura) this.factServ.propietario_factura = this.form.value;

    let facturas_localStorage = FactsLocalStorage.getList();

    const factura_a_guardar = fun.deepCloning(this.objArchivo.factura_en_turno);

    let index_factura = facturas_localStorage.findIndex((facts: any) => facts?.archivo_id == this.factura_guardada?.archivo_id);

    if (!fun.isEmpty(this.factServ.propietario_factura.id)) {
      factura_a_guardar[this.factServ.isVenta || this.factServ.isPreVenta ? 'cliente' : 'suplidor'] = this.factServ.propietario_factura;
    }

    if (fun.hasValue(index_factura) && index_factura >= 0) {
      factura_a_guardar['archivo_id'] = this.factura_guardada?.archivo_id;
      facturas_localStorage[index_factura] = factura_a_guardar;
    } else {
      facturas_localStorage = facturas_localStorage.sort((a, b) => fun.compare(a, b, ['archivo_id'], 'asc'));
      factura_a_guardar['archivo_id'] = facturas_localStorage.length > 0 ? _.last(facturas_localStorage).archivo_id + 1 : 1;

      facturas_localStorage.push(factura_a_guardar);
    }

    facturas_localStorage = facturas_localStorage.sort((a, b) => fun.compare(a, b, ['archivo_id'], 'asc'));

    FactsLocalStorage.setList(facturas_localStorage);

    this.reloadIndexFactArchivada();
  }

  procesoArchivarFactura(modalInstance, reset = false) {
    this.agregarFacturaALocalStorage();
    // this.getFacturasGuardadas();
    this.closeModal(modalInstance);

    if (reset) this.router.navigateByUrl(`admin/factura/${this.factServ.tipoDocumento}/${actionFacturacion.new}/0`).then(res_router => this.resetVariables());
  }

  archivarFactura() {
    let documento = this.getDocumentoDescripcion();

    if (this.checkIfFacturacionEnProceso()) {
      this.verificateArchivo().then(() => {
        let is_guardada = false;

        if (this.factura_guardada && this.factura_guardada?.archivo_id) is_guardada = FactsLocalStorage.getList().find((fact: any) => fact.archivo_id == this.factura_guardada?.archivo_id);

        const texto_modal = is_guardada ? `Esta ${documento.descripcion} ya esta archivada ¿desea sobreescribirla?` : `¿Seguro que desea archivar esta ${documento.descripcion} para continuarla luego?`;

        const confirmationObj = { id: 'archivar_factura', texto: texto_modal, header: 'Confirmación', siFunction: instance => this.procesoArchivarFactura(instance, true), width: '30rem' };

        this.confirmationModal(confirmationObj);
      });
    } else {
      fun.toastWarning(`Debe de iniciar una ${documento.descripcion} para archivarla.`, 'AVISO');
    }
  }

  selectModoFactura(arg) {
    this.is_viaje = false;
    this.is_adelantada = false;
    this.movimientosSelected = [];

    if (arg === 'viaje') this.is_viaje = true;
    else if (arg === 'adelantada') this.is_adelantada = true;
  }

  getCantidadArticulos() {
    const articulos_a_vender = _.filter(this.cuerpoFactura, factura => fun.hasValue(factura.cantidad));
    return articulos_a_vender.length;
  }

  // =============================================
  //  OBTENER LA DATA DEL CUERPO
  // =============================================
  getCuerpoFactura(arg) {
    if (arg.tipo == 'cuerpo') {
      this.cuerpoFactura = arg.data;

      if (this.factServ.tipoDocumento != tipoDocFacturacion.compra) {
        this.cuerpoFactura.map(detalle => {
          detalle.itbis = this.configApp.calcular_itbis ? fun.desformatearStNumber(detalle.itbis) : 0;
          detalle.retirado = this.modo_factura === 'adelantada' ? 0 : detalle.cantidad_en_unidades;
          detalle.retirado_en_venta = this.modo_factura === 'adelantada' ? 0 : detalle.cantidad_en_unidades;

          return detalle;
        });
      }
    }
  }

  prueba(arg?) {}

  resetVariables() {
    
    this.rellenarVariables().then(() => {
      setTimeout(() => {
        if (this.factServ.isPreVenta || this.factServ.isCotizacion) this.abrirModalPropietario();
        else fun.enfocarInput('tipoFact');
      }, 5);
    });
  }

  calculatePrecio(costo): number {
    if (costo > 0 || costo != null || costo) {
      const precio = costo / this.configArticuloClass.getWinPercerntCalc(this.cofig_articulos);
      return fun.desformatearStNumber(fun.roundNumberToDecimal(precio));
    }
  }

  sendRequestChangeCost(costoDB, costoRow, articulo) {
    const contenidoArticulo = articulo.contenido_articulos;

    if (costoDB !== costoRow) {
      let cantPadre;
      let cantHijo;
      const tempContenido = [];

      let precioRow = this.calculatePrecio(costoRow);
      const contenidoPadre = contenidoArticulo.find(contenido => contenido.condicion == 'padre');
      const contenidoHijo = contenidoArticulo.find(contenido => contenido.condicion == 'padre');

      if (contenidoPadre) {
        cantPadre = contenidoPadre.cantidad;
        const precioPadre = this.calcNewAmounts(cantPadre, precioRow);
        const costoPadre = this.calcNewAmounts(cantPadre, costoRow);
        contenidoPadre.precio = fun.desformatearStNumber(precioPadre);
        contenidoPadre.costo = fun.desformatearStNumber(costoPadre);
      }

      if (contenidoHijo) {
        const precio = this.calcNewAmounts(cantHijo, fun.roundNumberToDecimal(contenidoPadre.precio));
        const costo = this.calcNewAmounts(cantHijo, fun.roundNumberToDecimal(contenidoPadre.costo));
        contenidoHijo.precio = fun.desformatearStNumber(precio);
        contenidoHijo.costo = fun.desformatearStNumber(costo);
      }

      [contenidoPadre, contenidoHijo].forEach(contenido => {
        if (fun.hasValue(contenido)) {
          const newContent = _.omit(contenido, ['created_at', 'updated_at']);
          tempContenido.push(newContent);
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
      let temp = {};
      const row = cuerpoFact[i];

      let articulo = row.articulo;
      const contenido_articulo = articulo.contenido_articulos;

      let costoRow = fun.desformatearStNumber(row.costo);
      let costoPrincipalDB = articulo.costo_principal;

      const contenidoPadre = contenido_articulo.find(cont => cont.condicion === 'padre');
      const contenidoHijo = contenido_articulo.find(cont => cont.condicion === 'hijo');

      let isMedida = '';
      if (articulo.medida == row.unidad) isMedida = 'principal';

      contenido_articulo.forEach(content => {
        if (content.medida === row.unidad) isMedida = content.condicion;
      });

      if (contenido_articulo.length === 0 || isMedida === 'principal') {
        this.sendRequestChangeCost(costoPrincipalDB, costoRow, articulo);
      } else {
        if (isMedida === 'padre') {
          costoPrincipalDB = contenidoPadre.costo * contenidoPadre.cantidad;
          costoRow = contenidoPadre.cantidad * costoRow;
        } else {
          let MaxContenido = 0;
          if (contenido_articulo.length === 1) {
            MaxContenido = contenidoPadre.cantidad;
            costoPrincipalDB = contenidoPadre.costo * MaxContenido;
          } else {
            MaxContenido = contenidoPadre.cantidad * contenidoHijo.cantidad;
            costoPrincipalDB = contenidoHijo.costo * MaxContenido;
          }
          costoRow = MaxContenido * costoRow;
        }
        this.sendRequestChangeCost(costoPrincipalDB, costoRow, articulo);
      }

      temp = _.omit(row, ['costo', 'condicion', 'codigo']);
      tempCuerpo.push(temp);
    }
    return tempCuerpo;
  }

  ingresarFecha() {
    this.openNewModal({
      component: PendienteFormComponent,
      id: 'facturaPendiente',
      header: 'Factura pendiente',
      width: '34.375rem',
    });
  }

  async getDataFromModal(arg, search?) {
    if (arg.modal_id === 'facturaPendiente') {
      this.fechaFactura['front'] = this.formarFechaFactura(arg.fecha)['FechaFactura'];
      this.fechaFactura['back'] = this.fechaFactura['front'];
      this.FechaFacturaMostrar = this.formarFechaFactura(arg.fecha)['FechaFacturaMostrar'];
      this.factura_pendiente = true;

      //
    } else if (arg.modal_id == 'confirmacionImprimir') {
      this.is_print = arg.is_print;
      this.enviarABaseDatos();
      //
    } else if (arg.modal_id == 'cambioEfectivo') {
      this.is_print = arg.is_print;
      this.Devuelta = arg.obj.devuelta;
      this.forma_pago = arg.obj.forma_pago;

      if (this.factServ.isCompra) {
        if (arg.obj.decision_cambio) await this.cambiarCostos();

        this.cuerpoFactura = this.newCuerpo;
        this.enviarABaseDatos();
      } else {
        this.enviarABaseDatos();
      }
    } else if (arg.modal_id == 'retornarDevuelto') {
      this.cuerpo.getDataFromModal(arg, search);
    } else if (arg.modal_id == 'buscarCliente') {
      this.factServ.propietario_factura = arg.data;

      this.form.patchValue(this.factServ.propietario_factura);
      const balance = _.parseInt(this.factServ.propietario_factura.balance);
      const maxCred = _.parseInt(this.factServ.propietario_factura.maximo_credito);

      if (this.factServ.tipoDocumento != tipoDocFacturacion.cotizacion) {
        if (balance > maxCred - 1000 && balance < maxCred) {
          fun.toastWarning(`Credito actual RD$${this.formatoNumero(balance)} limite: RD$${this.formatoNumero(maxCred)}`, 'PROXIMO A LIMITE DE CREDITO');
        } else if (balance > maxCred) {
          fun.toastError(`Credito actual RD$${this.formatoNumero(balance)} limite: RD$${this.formatoNumero(maxCred)}`, 'SOBRE VALOR DE CREDITO');
        }
      }

      if (this.factServ.action == actionFacturacion.duplicate) {
        fun.enfocarAndSelectInput('tipoFact');
      } else {
        this.cuerpo.seleccionarCampoEnTurno();
      }
    }
  }

  calcNewAmounts(cant, precio) {
    const pre = precio / cant;
    return fun.roundNumberToDecimal(pre);
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
    if (this.factura_pendiente) fecha_equi = moment(this.fechaFactura['front']).format();
    else fecha_equi = null;

    cabecera_fact['fecha_viaje'] = this.is_viaje ? moment(this.fecha_viaje).format() : null;

    cabecera_fact['fecha_equivalente'] = fecha_equi;

    if (this.condicion_fact == 'Crédito') {
      let fecha_venci;

      if (this.factServ.isVenta || this.factServ.isPreVenta || this.factServ.isCotizacion) {
        fecha_venci = moment(new Date()).add(this.factServ.propietario_factura.limite_credito, 'days').format('YYYY-MM-DD');
      } else {
        fecha_venci = moment(this.fecha_vencimiento).format('YYYY-MM-DD');
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

    if (fun.hasValue(this.paqueteComprobante?.fecha_valida) && moment(this.paqueteComprobante?.fecha_valida).isValid()) {
      fecha_valida = moment(this.paqueteComprobante?.fecha_valida).format('YYYY-MM-DD');
      fecha_valida = moment(fecha_valida).add(8, 'hours').format();
    }

    cabecera_fact['fecha_valida'] = fecha_valida;
    cabecera_fact['tipo_factura_id'] = this.factServ.tipoFactura.id;
    cabecera_fact['numero_comprobante'] = this.factServ.isCompra ? this.NCFcompra : null;
    cabecera_fact['costoYgasto'] = this.factServ.isCompra ? this.CostoYgasto : null;
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
    cabecera_fact['serie'] = this.factServ.serieType;

    cabecera_fact['pre_factura'] = fun.hasValue(this.factServ.pre_venta_selected) ? this.factServ.pre_venta_selected?.id : null;

    cabecera_fact['cotizacion'] = fun.hasValue(this.factServ.cotizacion_selected) ? this.factServ.cotizacion_selected?.id : null;

    if (this.factServ.isCompra) {
      cabecera_fact['suplidor_id'] = this.factServ.propietario_factura.id;
    } else {
      if (fun.isEmpty(this.factServ.propietario_factura) || fun.isEmpty(this.factServ.propietario_factura.id)) {
        cabecera_fact['cliente_id'] = null;
        cabecera_fact['NoCliente_nombre'] = this.form.controls.nombre.value;
        cabecera_fact['NoCliente_direccion'] = this.form.controls.direccion.value;
      } else {
        cabecera_fact['cliente_id'] = this.factServ.propietario_factura.id;
      }
    }

    cabecera_fact['detalle_facturas'] = cuerpo_fact;
    //

    if (this.factServ.isPreVenta) {
      cabecera_fact['FACTURA_DE'] = Ss.factServ.tipoFacturaId(tFacturaD.pre_venta);
    } else if (this.factServ.isCotizacion) {
      cabecera_fact['FACTURA_DE'] = Ss.factServ.tipoFacturaId(tFacturaD.cotizacion);
    } else if (this.factServ.isVenta) {
      cabecera_fact['FACTURA_DE'] = this.condicion_fact == 'Contado' ? Ss.factServ.tipoFacturaId(tFacturaD.venta_contado) : Ss.factServ.tipoFacturaId(tFacturaD.venta_credito);
    } else if (this.factServ.isCompra) {
      cabecera_fact['FACTURA_DE'] = Ss.factServ.tipoFacturaId(tFacturaD.compra);
    }

    cabecera_fact['tipo'] = this.factServ.tipoDocumento;
    cabecera_fact['tiene_nota'] = this.factura_a_rellenar ? this.factura_a_rellenar.tiene_nota : false;

    if (this.factServ.isVenta && this.factServ.propietario_factura.vendedor_id) cabecera_fact['vendedor_id'] = Number(this.factServ.propietario_factura.vendedor_id);

    return cabecera_fact;
  }

  async enviarABaseDatos() {
    const cabecera_fact = this.formarData();

    let res;

    let documento = this.getDocumentoDescripcion();

    if (this.factServ.action == actionFacturacion.update) res = await this.facturaClass.updateOne(cabecera_fact, { afterPath: `custom/update/${this.id_documento}` });
    else res = await this.facturaClass.createOne(cabecera_fact);

    if (this.factura_guardada) this.revisarLocalStorage();

    this.facturaClass.parseDataToPdf(res['data']).then(async factura_parsed => {
      const obj = { data: factura_parsed, type: documento.tipo };

      PdfService.generatePdf({ oPdf: obj, imprimir: this.is_print }).catch(err => fun.toastError(`Error imprimiendo la ${documento.descripcion}.`, 'ERROR'));

      this.layServ.nextCheckCuadreToday(true);

      if (this.factServ.action == actionFacturacion.update) this.router.navigateByUrl('/admin/manipular/buscarFactura/solo_ver');
      else await this.resetVariables();
    });
  }
}
