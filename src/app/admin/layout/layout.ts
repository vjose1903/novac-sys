import { Ss } from '../../core/services/singleton.service';
import { TablaClass } from '../components/new_tablas/tabla-class';
import * as _ from 'lodash';
import { Permisos } from '../../core/typescript/permisos';
export class LayoutClass extends TablaClass {
  constructor() {
    super();
  }

  ruta_a_cambiar = '';
  url_actual = '';

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
      notaCredito: Object.values(Permisos.nota_credito),
      notaDebito: Object.values(Permisos.nota_debito),
      vizualizar: [Permisos.factura_compra.get_facturas_by_params, Permisos.factura_venta.get_facturas_by_params],
      flatt: [],
    },
    pagos: {
      recibosIngresos: Object.values(Permisos.recibo_ingreso),
      cuentasPagar: Object.values(Permisos.pagos_compras),
      flatt: [],
    },
    recibos_viajes: {
      viajes: [Permisos.factura_venta.get_viajes_sin_completar],
      flatt: [],
    },
    conduce: {
      conduce: Object.values(Permisos.conduce),
      flatt: [],
    },
    contabilidad: {
      catalogo_cuentas: [...Object.values(Permisos.grupo_cuenta), ...Object.values(Permisos.cuenta_contable)],
      configuracion_entidad_cuenta: Object.values(Permisos.configuracion_entidad_cuenta),
      asientos_contables: Object.values(Permisos.cabeza_asiento_contable),
      deposito: Object.values(Permisos.deposito),
      flatt: [],
    },
    registro: {
      user: Object.values(Permisos.user),
      clientes: Object.values(Permisos.cliente),
      suplidores: Object.values(Permisos.suplidor),
      articulos: Object.values(Permisos.articulo),
      camiones: Object.values(Permisos.vehiculo),
      roles: Object.values(Permisos.role),
      ncf: Object.values(Permisos.secuencia_comprobante),
      periodo_fiscal: Object.values(Permisos.periodo_fiscal),
      divisa: Object.values(Permisos.divisa),
      banco: Object.values(Permisos.banco),
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
