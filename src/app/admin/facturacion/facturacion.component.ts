import { RetornarDevueltoComponent } from './cuerpo-factura/retornar-devuelto/retornar-devuelto.component';
import { MenuOpcionesExtraComponent } from './menu-opciones-extra/menu-opciones-extra.component';

import { Component, OnInit, OnDestroy, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from '../../core/javascript/moment';
import * as _ from 'lodash';
import { CuerpoFacturaComponent } from './cuerpo-factura/cuerpo-factura.component';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { FacturacionService } from './facturacion.service';
import { ArticuloC } from '../registros/articulos/articulo';
import { tipoDocFacturacion, FacturasI, tFacturaD, actionFacturacion } from './factura';
import { NcfC } from '../registros/ncf/ncf';
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
import { Ss } from '../../core/services/singleton.service';
import { ConfirmacionImprimirComponent } from './confirmacion-imprimir/confirmacion-imprimir.component';
import { ButtonsI, ModalClass } from '../components/modal/modal-class';
import { PdfService } from '../../core/services/pdf/pdf.service';

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.scss'],
})
export class FacturacionComponent extends FactsLocalStorage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(CuerpoFacturaComponent, { static: true }) cuerpo: CuerpoFacturaComponent;

  secuenciaKeys = [];
  info_cambio: any;
  hasPermisoPreVenta: boolean;
  hasPermisoCotizacion: boolean;
  hasPermisoCamiones: boolean;
  titulo: string;

  @HostListener('window:keydown', ['$event'])
  @HostListener('window:keyup', ['$event'])
  handleKeyboardEvent(event: any) {
    event.stopPropagation();
    const key = event.keyCode;
    const secuenciasAceptadas = [teclasCode._control, teclasCode._P, teclasCode._G, teclasCode._E];

    if (event.type == 'keydown') {
      if (!this.secuenciaKeys.includes(key) && secuenciasAceptadas.includes(key)) this.secuenciaKeys.push(key);
    } else if (event.type == 'keyup') {
      const combinacion = _.join(this.secuenciaKeys, '_');
      this.secuenciaKeys = [];

      if (this.factServ.tipoDocumento == tipoDocFacturacion.venta && combinacion == `${teclasCode._control}_${teclasCode._E}`) {
        if (fun.hasValue(document.activeElement.id)) fun.desEnfocarInput(document.activeElement.id);
        document.getElementById('btnExtra').click();
      }

      if (combinacion == `${teclasCode._control}_${teclasCode._P}`) {
        if (fun.hasValue(document.activeElement.id)) fun.desEnfocarInput(document.activeElement.id);
        this.imprimirFactura();
      }

      if (combinacion == `${teclasCode._control}_${teclasCode._G}`) {
        if (fun.hasValue(document.activeElement.id)) fun.desEnfocarInput(document.activeElement.id);
        this.archivarFactura();
      }

      if (fun.hasValue(this.overlay?.item)) {
        if (this.overlay?.tipo == 'extra') {
          if (this.optionesExtra.length > 0) {
            const option = _.find(this.optionesExtra, { keyboardCode: key });

            fun.desEnfocarInput(document.activeElement.id);

            if (fun.hasValue(option)) this.selectOptionExtra(_.find(this.optionesExtra, { keyboardCode: key }), 'teclado');
          }
        }
        if (this.overlay?.tipo == 'camion') this.mover_indicador_camion(key);
      }
    }
  }

  fechaFactura;
  FechaFacturaMostrar: any;

  id_documento: any;
  factura_a_rellenar: FacturasI;
  form: FormGroup;
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
    facturas_localStorage?: any;
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

  overlay;
  camionesSelected = [];
  camiones = [];
  camion_row;
  filterCamionesTargets;
  copyCamiones;
  permissions = Permisos;
  configApp: ConfigI;
  timeInterval;
  tipoDocFacturacion = tipoDocFacturacion;
  fun = fun;

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router, private localeService: BsLocaleService, public factServ: FacturacionService) {
    super();

    this.form = this.fb.group({ id: [], nombre: [], direccion: [], telefono: [] });

    this.dpConfig = Object.assign({}, { showWeekNumbers: false, minDate: new Date(), dateInputFormat: 'DD/MM/YYYY' });

    this.timeInterval = setInterval(() => (this.fecha = this.my_timeDateFormater(new Date())), 1000);
  }

  ngOnInit() {
    this._init_mixin({ component: 'cabeza_factura', is_routing: true });
    this.localeService.use('es');
    this.configApp = Ss.configServ.getConfig({ isPromise: false });
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
    clearInterval(this.timeInterval);
  }

  ngAfterViewInit() {
    this.validatePermisos().then((result) => {
      this.rellenarVariables().then((res) => {
        if (this.factServ.action == actionFacturacion.update) {
          this.is_editando = true;
          this.procesoRelleno({ id: this.id_documento, tipo: this.factServ.tipoDocumento, action: actionFacturacion.update });
        } else if (this.factServ.action == actionFacturacion.bill_from_cotizacion) {
          this.procesoRelleno({ id: this.id_documento, tipo: 'venta', action: actionFacturacion.bill_from_cotizacion });
        } else if (this.factServ.action == actionFacturacion.bill_from_pre_venta) {
          this.procesoRelleno({ id: this.id_documento, tipo: 'venta', action: actionFacturacion.bill_from_pre_venta });
        } else {
          setTimeout(() => {
            if (this.factServ.tipoDocumento == tipoDocFacturacion.pre_venta || this.factServ.tipoDocumento == tipoDocFacturacion.cotizacion) this.abrirModalFiltro();
            else fun.enfocarInput('tipoFact');
          }, 5);
        }
      });
      //
      this.makeOptionsExtra();
    });
  }

  validatePermisos() {
    return new Promise<any>((resolve, reject) => {
      const array_promises_permisos = [];

      array_promises_permisos.push(Ss.permissionsService.hasPermission(Object.values(this.permissions.pre_venta)));
      array_promises_permisos.push(Ss.permissionsService.hasPermission(Object.values(this.permissions.cotizacion)));
      array_promises_permisos.push(Ss.permissionsService.hasPermission(this.permissions.factura_venta.seleccionar_camion_en_facturacion));

      Promise.all(array_promises_permisos).then((values) => {
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
              if (this.hasPermisoCamiones) this.getCamiones();
              break;
          }
        }

        resolve(true);
      });
    });
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
    return _.some(detalles, (detalle) => detalle.is_devuelto) || this.factServ.productos_devueltos.length > 0;
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

      if (fun.hasValue(this.overlay?.item)) this.cerrarOverlay();
    }
  }

  getDevueltos() {
    const detalles = this.factServ.getDetallesLlenos();
    const articulos_defectuosos = _.filter(detalles, (detalle) => detalle.is_devuelto);
    const articulos_solo_devueltos = this.factServ.productos_devueltos;
    let acu = 1;
    const list = [...articulos_defectuosos, ...articulos_solo_devueltos].map((articulo) => {
      articulo['tipo'] = articulo.is_defectuoso ? 'Articulo Defectuoso' : 'Solo devuelto';
      articulo['id'] = articulo.id = acu;
      acu += 1;
      return articulo;
    });

    return list;
  }

  verificateArchivo() {
    return new Promise((resolve) => {
      this.objArchivo = { factura_en_turno: undefined, facturas_localStorage: fun.getFacturasguardadas() };

      if (this.checkIfFacturacionEnProceso()) {
        this.objArchivo.factura_en_turno = this.formarFacturaAGuardar();
        let comparar_con_localStorage = _.find(this.objArchivo.facturas_localStorage, (item) => item.archivo_id == this.factura_guardada?.archivo_id);

        const factura_en_turno_storage = comparar_con_localStorage ? _.omit(comparar_con_localStorage, ['archivo_id', 'cliente', 'suplidor']) : undefined;
        this.objArchivo['factura_en_turno_storage'] = factura_en_turno_storage;
      }

      resolve(true);
    });
  }

  rellenarVariables() {
    return new Promise<any>((resolve, reject) => {
      this.factServ.tipoDocumento = this.route.snapshot.params['tipo'];
      this.factServ.productos_devueltos.length = 0;

      if (this.factServ.tipoDocumento == tipoDocFacturacion.venta) this.titulo = 'Factura de venta';
      else if (this.factServ.tipoDocumento == tipoDocFacturacion.compra) this.titulo = 'Factura de compra';
      else if (this.factServ.tipoDocumento == tipoDocFacturacion.pre_venta) this.titulo = 'Pre factura';
      else if (this.factServ.tipoDocumento == tipoDocFacturacion.cotizacion) this.titulo = 'Cotización';

      this.factServ.setTipos(this.factServ.tipoDocumento).then((result) => {
        //
        [this.fecha_vencimiento, this.fecha_equivalente, this.fecha_viaje] = Array(3).fill(new Date());
        [this.is_adelantada, this.is_viaje, this.factura_pendiente, this.is_editando] = Array(4).fill(false);
        [this.DESCUENTO, this.BRUTO, this.TOTAL, this.ITBIS, this.camion_row] = Array(5).fill(0);
        [this.NCFcompra, this.factServ.pre_venta_selected, this.factServ.cotizacion_selected, this.factServ.action, this.factura_a_rellenar, this.factServ.propietario_factura, this.objArchivo, this.factura_guardada, this.overlay] =
          Array(9).fill(undefined);

        this.cuerpoFactura.length = 0;
        this.articulosAcambiar.length = 0;
        this.camionesSelected.length = 0;

        this.info_cambio = {};
        this.fechaFactura = {};
        this.CostoYgasto = '';

        this.factServ.action = this.route.snapshot.params['action'];
        this.id_documento = this.route.snapshot.params['id'];

        this.fechaFactura['front'] = this.formarFechaFactura(new Date())['FechaFactura'];
        this.fechaFactura['back'] = this.fechaFactura['front'];
        this.FechaFacturaMostrar = this.formarFechaFactura(new Date())['FechaFacturaMostrar'];

        this.modo_factura = this.factServ.tipoDocumento == tipoDocFacturacion.pre_venta ? this.factServ.tipoDocumento : this.factServ.tipoDocumento == tipoDocFacturacion.cotizacion ? null : 'normal';

        this.condicion_fact = this.factServ.tipoDocumento == tipoDocFacturacion.pre_venta ? 'Crédito' : this.factServ.tipoDocumento == tipoDocFacturacion.cotizacion ? 'Crédito' : 'Contado';
        this.forma_pago = this.factServ.tipoDocumento == tipoDocFacturacion.cotizacion || this.factServ.tipoDocumento == tipoDocFacturacion.pre_venta ? null : 'Efectivo';

        this.filterCamionesTargets = ['marca', 'modelo', 'anio', 'propietario.nombre', 'propietario.apellido'];

        if (this.factServ.tipoDocumento == tipoDocFacturacion.venta) {
          this.form.patchValue({ id: null, nombre: 'Cliente contado', direccion: this.configApp.direccion_empresa, telefono: null });
        } else {
          if (fun.hasValue(this.form)) this.form.reset();
        }

        resolve(true);
      });
    });
  }

  checkPath(factura) {
    return new Promise<any>((resolve, reject) => {
      const actualPath = fun.getActualPath();
      const res = { same_modulo: true };

      if (!actualPath.includes(factura.tipo) || !this.factServ.action.includes(factura.action)) {
        const action_route = fun.hasValue(factura.action) ? factura?.action : 'new';
        const id_route = fun.hasValue(factura.cotizacion) ? factura?.cotizacion : fun.hasValue(factura.pre_factura) ? factura.pre_factura : fun.hasValue(factura.id_documento) ? factura.id_documento : '0';

        res.same_modulo = false;
        this.router.navigateByUrl(`/admin/factura/${factura.tipo}/${action_route}/${id_route}`).then((result) => {
          this.rellenarVariables().then((result) => resolve(res));
        });
      } else {
        resolve(res);
      }
    });
  }

  procesoRelleno(factura) {
    return new Promise((resolve) => {
      try {
        this.checkPath(factura).then((res) => {
          this.rellenarCabezaFactura(factura).then((factura_rellenada) => {
            //

            this.cuerpo.rellenarCuerpoFactura(factura_rellenada['detalle_facturas']).then((res) => {
              setTimeout(() => {
                this._sideBarOpened = false;

                this.cuerpo.seleccionarCampoEnTurno();
                resolve(true);
              }, 250);
            });
          });
        });
      } catch (error) {
        resolve(false);
      }
    });
  }

  rellenarCabezaFactura(factura: FacturasI) {
    return new Promise(async (resolve) => {
      const original_factura = fun.duplicarJson(factura);
      let productos_devueltos = fun.hasValue(original_factura?.productos_devueltos) ? original_factura?.productos_devueltos : [];

      this.factServ.propietario_factura = {};

      this.factServ.tipoDocumento = factura.tipo;

      if (!_.has(factura, 'archivo_id') && [actionFacturacion.update, actionFacturacion.bill_from_cotizacion, actionFacturacion.bill_from_pre_venta].includes(original_factura.action)) {
        const factura_archivada = _.find(fun.getFacturasguardadas(), { id_documento: factura?.id });

        if (fun.hasValue(factura_archivada)) {
          factura = factura_archivada;
          productos_devueltos = factura.productos_devueltos;
          this.actualizarLayServFactGuardada(factura_archivada);
        } else {
          const id = factura.id ? factura.id : factura.cotizacion ? factura.cotizacion : factura.pre_factura ? factura.pre_factura : null;
          const res = await this.facturaClass.getFacturaById(id);
          factura = res['data'];
        }
      }

      const value_buscar = original_factura.action == actionFacturacion.bill_from_pre_venta || original_factura.action == actionFacturacion.bill_from_cotizacion ? '02' : factura.tipo_factura_id;
      const by_buscar = original_factura.action == actionFacturacion.bill_from_pre_venta || original_factura.action == actionFacturacion.bill_from_cotizacion ? 'referencia' : 'id';

      this.setPropietario(factura);

      this.factServ
        .setTipoFacturaSelected(this.factServ.tipoDocumento, value_buscar, by_buscar)
        .then(async (result) => {
          this.factura_pendiente = fun.hasValue(factura) && _.has(factura, 'factura_pendiente') ? factura?.factura_pendiente : false;

          const fecha_facturacion = factura?.fecha_equivalente ? factura?.fecha_equivalente : fun.duplicarJson(this.fechaFactura['back']);

          this.fechaFactura['front'] = this.formarFechaFactura(fecha_facturacion)['FechaFactura'];
          this.fechaFactura['back'] = this.fechaFactura['front'];

          this.FechaFacturaMostrar = this.formarFechaFactura(fecha_facturacion)['FechaFacturaMostrar'];

          if (fun.hasValue(this.factServ.tipoFactura) && this.factServ.tipoFactura.referencia != '00' && this.factServ.tipoFactura.referencia != '02' && this.factServ.tipoDocumento == tipoDocFacturacion.venta) {
            this.ncfClass.getAll({ afterPath: `custom/${this.factServ.tipoFactura.id}/true` }).then((res) => {
              this.paqueteComprobante = res.data;
            });
          }

          if (factura.is_viaje) this.fecha_viaje = new Date(factura.fecha_viaje);
          else this.fecha_viaje = new Date();

          if (factura.tipo == 'compra') this.fecha_vencimiento = new Date(factura.fecha_vencimiento);
          else this.fecha_vencimiento = new Date();

          this.is_viaje = factura.is_viaje;
          this.condicion_fact = factura.action == actionFacturacion.bill_from_pre_venta || factura.action == actionFacturacion.bill_from_cotizacion ? this.condicion_fact : factura.condicion;

          this.NCFcompra = factura.tipo == 'compra' ? factura.numero_comprobante : undefined;
          this.CostoYgasto = factura.tipo == 'compra' ? factura.costoYgasto : '';

          if (factura.tipo == 'pre_venta') this.modo_factura = this.factServ.action == actionFacturacion.bill_from_pre_venta ? 'normal' : tipoDocFacturacion.cotizacion;
          else if (factura.tipo == 'cotizacion') this.modo_factura = this.factServ.action == actionFacturacion.bill_from_cotizacion ? 'normal' : tipoDocFacturacion.cotizacion;
          else if (factura.is_viaje) this.modo_factura = 'viaje';
          else if (factura.is_adelantada) this.modo_factura = 'adelantada';
          else this.modo_factura = 'normal';

          if (original_factura.action == actionFacturacion.bill_from_cotizacion) {
            this.factServ.cotizacion_selected = factura;
            if (fun.isEmpty(factura?.id)) this.factServ.cotizacion_selected.id = factura.cotizacion;
          } else if (original_factura.action == actionFacturacion.bill_from_pre_venta) {
            this.factServ.pre_venta_selected = factura;
            if (fun.isEmpty(factura?.id)) this.factServ.pre_venta_selected.id = factura.pre_factura;
          } else {
            this.factura_a_rellenar = factura;
          }

          this.factServ.productos_devueltos = productos_devueltos;

          if (_.has(factura, 'camiones_viajes')) {
            factura.camiones_viajes.forEach((camion) => this.camionesSelected.push({ vehiculo_id: camion.vehiculo_id }));
          }

          factura.detalle_facturas = _.filter(factura.detalle_facturas, (detalle) => !detalle.is_devuelto || (detalle.is_devuelto && detalle.is_defectuoso));

          resolve(factura);
        })
        .catch((error) => {
          console.error(error);
        });
    });
  }

  async setPropietario(arg) {
    if (arg.tipo == 'compra') {
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
    return new Promise((resolve) => {
      let documento = this.getDocumentoDescripcion();
      this.verificateArchivo().then(() => {
        if (this.checkIfFacturacionEnProceso()) {
          let texto_modal = '';
          let abrirModal = true;

          if (this.factura_guardada && this.factura_guardada?.archivo_id) {
            if (_.isEqual(this.objArchivo.factura_en_turno, this.objArchivo.factura_en_turno_storage)) {
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

  rellenarFacturaArchivada(factura) {
    if (fun.hasValue(factura)) {
      if (this.factura_guardada && this.factura_guardada?.archivo_id == factura.archivo_id) {
        fun.toastWarning(`Ya esta ${this.getSideBarTabByKey(this.factura_guardada.tipo)['singleTitle']} esta seleccionada.`, 'AVISO');
      } else {
        this.checkSituaciones().then((result) => {
          if (result.factura_en_proceso) {
            if (result.abrirModal) {
              let siFunction = (instance) => {
                this.procesoArchivarFactura(instance);
                this.procesoRelleno(factura).then((result) => {
                  this.actualizarLayServFactGuardada(factura);
                });
              };

              let noFunction = (instance) => {
                this.procesoRelleno(factura).then((result) => {
                  this.actualizarLayServFactGuardada(factura);
                  this.closeModal(instance);
                });
              };

              const cancelarRelleno = (instance) => this.closeModal(instance);

              const confirmationObj = {
                id: 'archivar_factura',
                texto: result.texto_modal,
                header: 'Confirmación',
                siFunction: (instance) => siFunction(instance),
                noFunction: (instance) => noFunction(instance),
                cancelarFunction: (instance) => cancelarRelleno(instance),
                width: '30rem',
              };

              this.confirmationModal(confirmationObj);
            } else {
              this.procesoRelleno(factura).then((result) => {
                this.actualizarLayServFactGuardada(factura);
              });
            }
          } else {
            this.procesoRelleno(factura).then((result) => {
              this.actualizarLayServFactGuardada(factura);
            });
          }
        });
      }
    }
  }

  actualizarLayServFactGuardada(factura) {
    this.factura_guardada = fun.duplicarJson(factura);
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

  checkIfFacturacionEnProceso() {
    return this.cuerpoFactura.length > 0;
  }

  checkCambiosModoyCondicionFactura(arg) {
    const sali_de = arg.id;
    const valor = arg.value;
    const condicion = this.condicion_fact;
    const tipo_factura_referencia = this.factServ.tipoFactura.referencia;
    let buscar = false;

    if (this.factServ.tipoDocumento == tipoDocFacturacion.venta || this.factServ.tipoDocumento == tipoDocFacturacion.pre_venta) {
      setTimeout(() => {
        const voy_a = document.activeElement.id;
        const nombre = this.factServ.propietario_factura ? this.factServ.propietario_factura.nombre : 'Cliente contado';

        if (sali_de == 'venta' && (condicion == 'Crédito' || tipo_factura_referencia == '01') && nombre == 'Cliente contado' && (fun.isEmpty(voy_a) || voy_a != 'fecha_viaje')) buscar = true;

        if (sali_de == 'venta' && valor == 'adelantada' && nombre == 'Cliente contado') buscar = true;

        if (sali_de == 'fecha_viaje') {
          this.getCamiones();
          document.getElementById('btnCamion').click();
        }

        if (buscar) this.abrirModalFiltro();

        if (this.modo_factura != 'viaje') this.camionesSelected = [];
      }, 250);
    }
  }

  getCalculosDinero(arg) {
    this.TOTAL = fun.numFormatTwoDecimals(arg.total);
    this.ITBIS = fun.numFormatTwoDecimals(arg.itbis);
    this.DESCUENTO = fun.numFormatTwoDecimals(arg.descuento);

    this.calcularBruto();
  }

  calcularBruto() {
    setTimeout(() => {
      const suma = fun.desformatear(this.TOTAL) + fun.desformatear(this.DESCUENTO) - fun.desformatear(this.ITBIS);
      this.BRUTO = fun.numFormatTwoDecimals(suma);
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
    return new Promise(async (resolve) => {
      if (this.factServ.tipoDocumento == tipoDocFacturacion.venta) {
        if (this.factServ.tipoFactura.referencia != '00' && this.factServ.tipoFactura.referencia != '02') {
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

            fun.enfocarInput('tipoFact');
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
    this.factServ
      .setTipoFacturaSelected(this.factServ.tipoDocumento, valor)
      .then((result) => {
        this.NCFcompra = 'B' + valor;

        if (check) {
          this.calcularPorcientoComprobante().then((continuar) => {
            if (continuar) fun.enfocarInput(campo);
            else fun.enfocarAndSelectInput('tipoFact');
          });
        } else {
          fun.enfocarInput(campo);
        }
      })
      .catch((error) => {
        fun.toastError('El tipo de factura introducido es incorrecto.', 'ERROR');
        fun.enfocarAndSelectInput('tipoFact');
      });
  }

  saltar(salioDe, valor?) {
    let siguiente_input = '';
    let is_enforcar = true;

    let is_buscar_cliente = false;

    switch (salioDe) {
      case 'tipo':
        if (this.factServ.options_tipos_facturas.includes(valor)) siguiente_input = 'condicion';
        else {
          fun.toastError('El tipo de factura introducido es incorrecto.', 'ERROR');
          fun.enfocarAndSelectInput('tipoFact');
          is_enforcar = false;
        }
        break;

      case 'condicion':
        siguiente_input = this.factServ.tipoDocumento == tipoDocFacturacion.compra ? 'gastoDe' : 'venta';
        break;

      case 'gastoDe':
        if (this.factServ.tipoDocumento == tipoDocFacturacion.compra && !this.factServ.options_tipos_costos_gastos.includes(valor)) {
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

      case 'fecha_vencimiento':
        is_enforcar = false;
        is_buscar_cliente = true;
        break;

      case 'venta':
        if (this.modo_factura == 'normal') {
          if (this.condicion_fact == 'Contado') {
            siguiente_input = 'nom';
          } else {
            is_enforcar = false;
          }
        } else if (this.modo_factura == 'viaje') {
          siguiente_input = 'fecha_viaje';
        } else if (this.modo_factura == 'adelantada') {
          if (fun.isEmpty(this.factServ.propietario_factura) || this.factServ.propietario_factura.nombre == 'Cliente contado') is_enforcar = false;
          else this.cuerpo.seleccionarCampoEnTurno();
        } else {
          is_enforcar = false;
        }

        break;

      case 'fecha_viaje':
        is_enforcar = false;
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

    if (is_enforcar) fun.enfocarInput(siguiente_input);
    else fun.desEnfocarInput(salioDe);

    if (is_buscar_cliente) this.abrirModalFiltro();
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

    if (this.factServ.tipoDocumento == tipoDocFacturacion.compra || (this.is_editando && (this.factServ.tipoDocumento == tipoDocFacturacion.venta || this.factServ.tipoDocumento == tipoDocFacturacion.compra))) {
      is_disabled = true;
    } else {
      is_disabled = false;

      if (
        this.is_adelantada ||
        (this.condicion_fact == 'Crédito' && this.factServ.tipoDocumento != tipoDocFacturacion.cotizacion) ||
        this.modo_factura == 'viaje' ||
        this.modo_factura == 'adelantada' ||
        this.factServ.tipoFactura?.referencia == '01' ||
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
    this.overlay = {};
    this.overlay['item'] = overlay;
    this.overlay['tipo'] = tipo;
    this.overlay['item'].toggle(event);

    if (tipo == 'camion') setTimeout(() => fun.enfocarInput('searchCamion'), 5);
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
          setTimeout(() => fun.enfocarInput('searchCamion'), 5);
        } else {
          if (fun.hasValue(this.overlay?.item)) this.saliendoDeCamionOverlay();
        }
      } else {
        setTimeout(() => fun.enfocarInput('searchCamion'), 5);
      }
    }, 250);
  }

  cerrarOverlay() {
    if (fun.hasValue(this.overlay)) {
      if (this.overlay['tipo'] == 'camion') {
        this.filterCamion(this.copyCamiones);
        this.camion_row = 0;
      }

      this.overlay['item'].hide();
      this.overlay = undefined;
    }
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
          if (fun.isEmpty(this.factServ.propietario_factura) || fun.isEmpty(this.factServ.propietario_factura?.id)) this.abrirModalFiltro();
          else this.cuerpo.seleccionarCampoEnTurno();

          this.cerrarOverlay();
        } else {
          if (where == 'teclado') {
            fun.desEnfocarInput('searchCamion');

            this.cerrarOverlay();
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
    let documento = this.getDocumentoDescripcion();
    if (this.is_editando && (this.factServ.tipoDocumento == tipoDocFacturacion.venta || this.factServ.tipoDocumento == tipoDocFacturacion.compra)) {
      const entidad = this.factServ.tipoDocumento == tipoDocFacturacion.venta ? 'Cliente' : 'Suplidor';
      fun.toastWarning(`Al editar una ${documento.descripcion}, no se le puede cambiar el ${entidad}.`, 'AVISO');
    } else {
      const input_activo = document?.activeElement?.id;

      let botones = fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons);

      if (this.factServ.tipoDocumento == tipoDocFacturacion.cotizacion || this.factServ.tipoDocumento == tipoDocFacturacion.pre_venta) {
        const label = `Salir de ${this.factServ.tipoDocumento == tipoDocFacturacion.cotizacion ? 'Cotización' : 'Pre venta'}`;
        botones['dinamico'] = [{ clase: 'btn btn-gris mr-2', function: (instance) => this.router.navigateByUrl('/admin/dashboard') && this.closeModal(instance), label: label, disable: false }];
      }

      if (fun.hasValue(input_activo)) fun.desEnfocarInput(input_activo);
      const include_contado = this.factServ.tipoDocumento === tipoDocFacturacion.cotizacion;

      this.openNewModal({
        component: BuscarClienteSuplidorComponent,
        inputs: { metodo: this.factServ.tipoDocumento, include_contado: include_contado, palabra_a_buscar: ' ' },
        id: 'buscarCliente',
        header: this.factServ.tipoDocumento == tipoDocFacturacion.compra ? 'BUSCAR SUPLIDOR' : 'BUSCAR CLIENTE',
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
    if (this.getCantidadArticulos() == 0 && this.factura_pendiente == false) {
      fun.toastWarning(`No existe factura iniciada para cancelar`, 'Aviso');
      return;
    }

    let si = (instance) => {
      if (this.factServ.action !== actionFacturacion.update) this.router.navigateByUrl(`admin/factura/${this.factServ.tipoDocumento}/new/0`).then((res_router) => this.resetVariables());
      else if (this.factServ.action == actionFacturacion.update || this.factServ.action == actionFacturacion.bill_from_cotizacion) this.router.navigateByUrl(`/admin/manipular/buscarFactura/solo_ver`);

      this.closeModal(instance);
    };

    let documento = this.getDocumentoDescripcion();

    let obj = { id: 'cancelar_factura', header: 'Confirmación', texto: `Seguro que desea cancelar la ${documento.descripcion}`, siFunction: si };

    this.confirmationModal(obj);
  }

  confirmationModal(obj: { id: string; texto: string; header: string; siFunction: Function; width?: string; noFunction?: Function; cancelarFunction?: Function }) {
    const config = {
      id: obj.id,
      header: obj.header,
      width: obj.width || '30rem',
      html: `<p> ${obj.texto} </p>`,
      botones: {
        ...fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons),
        dinamico: [
          { clase: 'btn btn-blanco mr-2', function: (instance) => (_.has(obj, 'noFunction') ? obj?.noFunction(instance) : this.closeModal(instance)), label: 'No', disable: false },
          { clase: 'btn btn-verde', function: (instance) => obj.siFunction(instance), label: 'Si', disable: false },
        ],
      },
    };

    if (_.has(obj, 'cancelarFunction') && fun.hasValue(obj.cancelarFunction)) {
      fun.pushAt(config.botones.dinamico, 0, { clase: 'btn btn-blanco mr-2', function: (instance) => obj.cancelarFunction(instance), label: 'Cancelar', disable: false });
    }

    this.openNewModal(config);
  }

  closeModal(modalInstance) {
    modalInstance.closeModal(modalInstance.id, 'cancelar');
  }

  // =============================================
  //  MODAL enviarABaseDatos
  // =============================================
  async imprimirFactura() {
    let documento = this.getDocumentoDescripcion();
    if (!this.factServ.propietario_factura) {
      if (this.factServ.tipoDocumento == tipoDocFacturacion.compra) fun.toastWarning(`${documento.descripcion} no tiene suplidor seleccionado`, 'Aviso');
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
          if (
            this.factServ.tipoDocumento != tipoDocFacturacion.compra &&
            (this.condicion_fact == 'Crédito' || this.is_viaje || this.factServ.tipoDocumento == tipoDocFacturacion.pre_venta || this.factServ.tipoDocumento == tipoDocFacturacion.cotizacion)
          ) {
            const obj = { metodo: this.factServ.tipoDocumento, condicion_fact: this.condicion_fact, is_viaje: this.is_viaje, modo_factura: this.modo_factura };

            this.openNewModal({
              component: ConfirmacionImprimirComponent,
              inputs: obj,
              id: 'confirmacionImprimir',
              header: 'Confirmación',
              width: '30rem',
              botones: {
                ...fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons),
                dinamico: [
                  { clase: 'btn btn-blanco mr-2', function: (instance) => this.closeModal(instance), label: 'Cancelar', disable: false },
                  { btn_id: 'btnConfirmar', clase: 'btn btn-verde', function_in_other_component: 'btn_aceptar', label: 'Confirmar', disable: false },
                ],
              },
            });
          } else {
            let articulos_a_cambiar = false;

            if (this.factServ.tipoDocumento == tipoDocFacturacion.compra) {
              const cuerpo_fact = fun.duplicarJson(this.cuerpoFactura);
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
                ...fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons),
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

  getDocumentoDescripcion() {
    return this.factServ.getDocumentoDescripcion({ metodo: this.factServ.tipoDocumento, condicion_fact: this.condicion_fact, is_viaje: this.is_viaje, modo_factura: this.modo_factura });
  }

  formarFacturaAGuardar() {
    const factura_a_guardar = this.formarData();
    factura_a_guardar['action'] = this.factServ.action;
    factura_a_guardar['factura_pendiente'] = this.factura_pendiente;
    factura_a_guardar['productos_devueltos'] = fun.duplicarJson(this.factServ.productos_devueltos);

    return factura_a_guardar;
  }

  agregarFacturaALocalStorage() {
    if (!this.factServ.propietario_factura) this.factServ.propietario_factura = this.form.value;

    let facturas_localStorage = fun.duplicarJson(this.objArchivo.facturas_localStorage);

    const factura_a_guardar = fun.duplicarJson(this.objArchivo.factura_en_turno);

    let index_fact_archivada = _.findIndex(facturas_localStorage, (facts: any) => facts?.archivo_id == this.factura_guardada?.archivo_id);

    if (!fun.isEmpty(this.factServ.propietario_factura.id)) {
      factura_a_guardar[this.factServ.tipoDocumento == tipoDocFacturacion.venta || this.factServ.tipoDocumento == tipoDocFacturacion.pre_venta ? 'cliente' : 'suplidor'] = this.factServ.propietario_factura;
    }

    if (fun.hasValue(index_fact_archivada) && index_fact_archivada >= 0) {
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

  procesoArchivarFactura(modalInstance, reset = false) {
    this.agregarFacturaALocalStorage();
    this.getFacturasGuardadas();
    this.closeModal(modalInstance);

    if (reset) this.router.navigateByUrl(`admin/factura/${this.factServ.tipoDocumento}/new/0`).then((res_router) => this.resetVariables());
  }

  archivarFactura() {
    let documento = this.getDocumentoDescripcion();

    if (this.checkIfFacturacionEnProceso()) {
      this.verificateArchivo().then(() => {
        let is_guardada = false;

        if (this.factura_guardada && this.factura_guardada?.archivo_id) is_guardada = _.find(this.objArchivo.facturas_localStorage, (fact: any) => fact.archivo_id == this.factura_guardada?.archivo_id);

        const texto_modal = is_guardada ? `Esta ${documento.descripcion} ya esta archivada ¿desea sobreescribirla?` : `¿Seguro que desea archivar esta ${documento.descripcion} para continuarla luego?`;

        const confirmationObj = { id: 'archivar_factura', texto: texto_modal, header: 'Confirmación', siFunction: (instance) => this.procesoArchivarFactura(instance, true), width: '30rem' };

        this.confirmationModal(confirmationObj);
      });
    } else {
      fun.toastWarning(`Debe de iniciar una ${documento.descripcion} para archivarla.`, 'AVISO');
    }
  }

  selectModoFactura(arg) {
    this.is_viaje = false;
    this.is_adelantada = false;
    this.camionesSelected = [];

    if (arg === 'viaje') this.is_viaje = true;
    else if (arg === 'adelantada') this.is_adelantada = true;
  }

  getCantidadArticulos() {
    const articulos_a_vender = _.filter(this.cuerpoFactura, (factura) => fun.hasValue(factura.cantidad));
    return articulos_a_vender.length;
  }

  // =============================================
  //  OBTENER LA DATA DEL CUERPO
  // =============================================
  getCuerpoFactura(arg) {
    if (arg.tipo == 'cuerpo') {
      this.cuerpoFactura = arg.data;

      // TODO: aqui tengo que revisar que pasa en facturacion con el itbis

      if (this.factServ.tipoDocumento != tipoDocFacturacion.compra) {
        this.cuerpoFactura.map((detalle) => {
          detalle.itbis = this.configApp.calcular_itbis ? fun.desformatear(detalle.itbis) : 0;
          detalle.retirado = this.modo_factura === 'adelantada' ? 0 : detalle.cantidad_en_unidades;
          detalle.retirado_en_venta = this.modo_factura === 'adelantada' ? 0 : detalle.cantidad_en_unidades;

          return detalle;
        });
      }
    }
  }

  prueba(arg?) {}

  resetVariables() {
    this.cuerpo.RESETCUERPO();
    this.rellenarVariables().then((res) => {
      setTimeout(() => {
        if (this.factServ.tipoDocumento == tipoDocFacturacion.pre_venta || this.factServ.tipoDocumento == tipoDocFacturacion.cotizacion) this.abrirModalFiltro();
        else fun.enfocarInput('tipoFact');
      }, 5);
    });
  }

  calculatePrice(costo): number {
    if (costo > 0 || costo != null || costo) {
      const precio = costo / 0.9;
      return fun.desformatear(fun.redondearNum(precio));
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
            const precio = this.calcularNuevosPrecios(cantHijo, fun.redondearNum(prePadre));
            const costo = this.calcularNuevosPrecios(cantHijo, fun.redondearNum(cosPadre));
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

      const costoRow = fun.desformatear(row.precio);

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

  async getDataFromModal(arg, search) {
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

      if (this.factServ.tipoDocumento == tipoDocFacturacion.compra) {
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

      this.cuerpo.seleccionarCampoEnTurno();
    }
  }

  calcularNuevosPrecios(cant, precio) {
    const pre = precio / cant;
    return fun.redondearNum(pre);
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
    let cuerpo_fact = [...fun.duplicarJson(this.cuerpoFactura), ...this.factServ.productos_devueltos];

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

      if (this.factServ.tipoDocumento == tipoDocFacturacion.venta || this.factServ.tipoDocumento == tipoDocFacturacion.pre_venta || this.factServ.tipoDocumento == tipoDocFacturacion.cotizacion) {
        fecha_venci = moment(new Date()).add(this.factServ.propietario_factura.limite_credito, 'days').format('YYYY-MM-DD');
      } else {
        fecha_venci = moment(this.fecha_vencimiento).format('YYYY-MM-DD');
      }

      fecha_venci = moment(fecha_venci).add(8, 'hours').format();

      cabecera_fact['fecha_vencimiento'] = fecha_venci;
      cabecera_fact['pagada'] = false;
      cabecera_fact['balance'] = fun.parseFloatTwoDecimals(this.TOTAL);
      cabecera_fact['devuelta'] = 0;
    } else {
      cabecera_fact['pagada'] = this.is_viaje ? false : true;
      cabecera_fact['balance'] = this.is_viaje ? fun.parseFloatTwoDecimals(this.TOTAL) : 0;
      cabecera_fact['devuelta'] = this.is_viaje ? 0 : this.Devuelta;
    }

    let fecha_valida = null;

    if (fun.hasValue(this.paqueteComprobante?.fecha_valida) && moment(this.paqueteComprobante?.fecha_valida).isValid()) {
      fecha_valida = moment(this.paqueteComprobante?.fecha_valida).format('YYYY-MM-DD');
      fecha_valida = moment(fecha_valida).add(8, 'hours').format();
    }

    cabecera_fact['fecha_valida'] = fecha_valida;
    cabecera_fact['tipo_factura_id'] = this.factServ.tipoFactura.id;
    cabecera_fact['numero_comprobante'] = this.factServ.tipoDocumento == tipoDocFacturacion.compra ? this.NCFcompra : null;
    cabecera_fact['costoYgasto'] = this.factServ.tipoDocumento == tipoDocFacturacion.compra ? this.CostoYgasto : null;
    cabecera_fact['numero_factura'] = null;
    cabecera_fact['total_factura'] = fun.parseFloatTwoDecimals(this.TOTAL);
    cabecera_fact['Bruto'] = fun.parseFloatTwoDecimals(this.BRUTO);
    cabecera_fact['itbis'] = fun.parseFloatTwoDecimals(this.ITBIS);
    cabecera_fact['descuento'] = fun.parseFloatTwoDecimals(this.DESCUENTO);
    cabecera_fact['estado'] = true;
    cabecera_fact['is_adelantada'] = this.is_adelantada;
    cabecera_fact['is_viaje'] = this.is_viaje;
    cabecera_fact['is_nota'] = false;
    cabecera_fact['camiones_viajes'] = this.camionesSelected;

    cabecera_fact['pre_factura'] = fun.hasValue(this.factServ.pre_venta_selected) ? this.factServ.pre_venta_selected?.id : null;

    cabecera_fact['cotizacion'] = fun.hasValue(this.factServ.cotizacion_selected) ? this.factServ.cotizacion_selected?.id : null;

    if (this.factServ.tipoDocumento == tipoDocFacturacion.compra) {
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

    if (this.factServ.tipoDocumento == tipoDocFacturacion.pre_venta) {
      cabecera_fact['FACTURA_DE'] = Ss.factServ.tipoFacturaId(tFacturaD.pre_venta);
    } else if (this.factServ.tipoDocumento == tipoDocFacturacion.cotizacion) {
      cabecera_fact['FACTURA_DE'] = Ss.factServ.tipoFacturaId(tFacturaD.cotizacion);
    } else if (this.factServ.tipoDocumento == tipoDocFacturacion.venta) {
      cabecera_fact['FACTURA_DE'] = this.condicion_fact == 'Contado' ? Ss.factServ.tipoFacturaId(tFacturaD.venta_contado) : Ss.factServ.tipoFacturaId(tFacturaD.venta_credito);
    } else if (this.factServ.tipoDocumento == tipoDocFacturacion.compra) {
      cabecera_fact['FACTURA_DE'] = Ss.factServ.tipoFacturaId(tFacturaD.compra);
    }

    cabecera_fact['tipo'] = this.factServ.tipoDocumento;
    cabecera_fact['tiene_nota'] = this.factura_a_rellenar ? this.factura_a_rellenar.tiene_nota : false;

    if (this.factServ.tipoDocumento == tipoDocFacturacion.venta && this.factServ.propietario_factura.vendedor_id) cabecera_fact['vendedor_id'] = Number(this.factServ.propietario_factura.vendedor_id);

    return cabecera_fact;
  }

  async enviarABaseDatos() {
    const cabecera_fact = this.formarData();

    let res;

    let documento = this.getDocumentoDescripcion();

    if (this.factServ.action == actionFacturacion.update) res = await this.facturaClass.updateOne(cabecera_fact, { afterPath: `custom/update/${this.factura_a_rellenar.id}` });
    else res = await this.facturaClass.createOne(cabecera_fact);

    if (this.factura_guardada) this.revisarLocalStorage();

    this.facturaClass.parseDataToPdf(res['data']).then(async (factura_parsed) => {
      const obj = { data: factura_parsed, type: documento.tipo };

      PdfService.generatePdf({ oPdf: obj, imprimir: this.is_print }).catch((err) => fun.toastError(`Error imprimiendo la ${documento.descripcion}.`, 'ERROR'));

      this.layServ.nextCheckCuadreToday(true);

      if (this.factServ.action == actionFacturacion.update) this.router.navigateByUrl('/admin/manipular/buscarFactura/solo_ver');
      else await this.resetVariables();
    });
  }
}
