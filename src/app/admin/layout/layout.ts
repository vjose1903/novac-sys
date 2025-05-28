import { Subscription } from 'rxjs';
import { Ss } from '@core/services/singleton.service';
import { TablaClass } from '@components/new_tablas/tabla-class';
import { Permisos } from '@core/typescript/permisos';

export class LayoutClass extends TablaClass {
  constructor() {
    super();
  }

  ruta_a_cambiar = '';
  url_actual = '';

  subDeciMenu: Subscription;

  subRefresh: Subscription;

  layServ;

  private static metodos = {};
  private static lastComponentInitLayout;
  private static layoutComponent;

  menuPermissionsObj = {
    facturacion: {
      venta: Object.values(Permisos.factura_venta),
      compra: Object.values(Permisos.factura_compra),
      pre_venta: Object.values(Permisos.pre_venta),
      cotizacion: Object.values(Permisos.cotizacion),
      flatt: [],
    },
    manipularFacturas: {
      nota_credito: Object.values(Permisos.nota_credito),
      nota_debito: Object.values(Permisos.nota_debito),
      vizualizar: [Permisos.factura_compra.get_facturas_by_params, Permisos.factura_venta.get_facturas_by_params],
      flatt: [],
    },
    facturacionElectonica: {
      ecf_received: Object.values(Permisos.ecf_reception),
      commertial_approval: Object.values(Permisos.commertial_approval_reception),
      flatt: [],
    },
    ingresos: {
      recibos_ingresos: Object.values(Permisos.recibo_ingreso),
      viajes: [Permisos.factura_venta.get_viajes_sin_completar],
      flatt: [],
    },
    conduce: {
      conduce: Object.values(Permisos.conduce),
      flatt: [],
    },
    registro: {
      empleados: Object.values(Permisos.user),
      clientes: Object.values(Permisos.cliente),
      suplidores: Object.values(Permisos.suplidor),
      articulos: Object.values(Permisos.articulo),
      camiones: Object.values(Permisos.vehiculo),
      roles: Object.values(Permisos.role),
      ncf: Object.values(Permisos.secuencia_comprobante),
      flatt: [],
    },
    produccion: {
      produccion: Object.values(Permisos.produccion),
      flatt: [],
    },
    inventario: {
      inventario: Object.values(Permisos.movimiento_inventario),
      flatt: [],
    },
    reportes: {
      reportes: Object.values(Permisos.reporte),
      flatt: [],
    },
  };

  _init_layout(arg) {
    this.layServ = Ss.layServ;
    if (arg.component == 'layout') LayoutClass.layoutComponent ||= this;

    if (arg.component != 'layout' && arg.is_routing) {
      LayoutClass.metodos[arg.component] = this;
      LayoutClass.lastComponentInitLayout = arg.component;
    }
  }

  runRouterNavigate(arg) {
    if (arg && arg.bool) {
      const tempLastComponent = LayoutClass.lastComponentInitLayout;

      LayoutClass.metodos[tempLastComponent].iniciarCambioMenu(arg, (callback) => {
        if (callback.bool) delete LayoutClass.metodos[tempLastComponent];
      });
    }
  }

  iniciarCambioMenu(arg, callback = (arg) => {}) {}

  runFinalizarCambioMenu(arg) {
    LayoutClass.layoutComponent.finalizarCambioMenu(arg);
  }

  _destroy_layout(refresh = false) {
    if (refresh) {
      LayoutClass.layoutComponent = undefined;
      LayoutClass.metodos = {};
      LayoutClass.lastComponentInitLayout = undefined;
    }
  }
}
