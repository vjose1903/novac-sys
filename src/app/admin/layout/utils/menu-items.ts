import { actionFacturacion } from '@admin/facturacion/factura';
import { Permisos } from '@core/typescript/permisos';

export const MENU_CONFIG: MenuItemI[] = [
  {
    id: 'facturacion',
    module: 'factura',
    title: 'Facturación',
    icon: 'assets/img/factura.png',
    permission: [],
    type: 'dropdown',
    subItems: [
      { id: 'pre_venta', title: 'Pre-Venta', permission: [], route: 'factura/pre_venta/new/0', activeRoutes: ['pre_venta', 'new', 'update'] },
      { id: 'venta', title: 'Venta', permission: [], route: 'factura/venta/new/0', activeRoutes: ['venta', actionFacturacion.new, actionFacturacion.update, actionFacturacion.bill_from_cotizacion, actionFacturacion.bill_from_pre_venta] },
      { id: 'compra', title: 'Compra', permission: [], route: 'factura/compra/new/0', activeRoutes: ['compra', 'new', 'update'] },
      { id: 'cotizacion', title: 'Cotización', permission: [], route: 'factura/cotizacion/new/0', activeRoutes: ['cotizacion', 'new', 'update'] },
    ],
  },
  {
    id: 'manipular',
    module: 'manipular',
    title: 'Manipular\ndocumentos',
    icon: 'assets/img/notaM.png',
    permission: [],
    type: 'dropdown',
    subItems: [
      { id: 'nota_credito', title: 'Nota de Crédito', permission: [], route: 'manipular/buscarFactura/nota_credito', activeRoutes: ['buscarFactura/nota_credito', 'nota/credito'] },
      { id: 'nota_debito', title: 'Nota de Débito', permission: [], route: 'manipular/buscarFactura/nota_debito', activeRoutes: ['buscarFactura/nota_debito', 'nota/debito'] },
      { id: 'visualizar', title: 'Visualizar', permission: [], route: 'manipular/buscarFactura/solo_ver', activeRoutes: ['buscarFactura/solo_ver'] },
    ],
  },
  {
    id: 'ecf',
    module: 'ecf',
    title: 'Facturación\nelectrónica',
    icon: 'assets/img/dgii-btn.png',
    permission: [],
    type: 'dropdown',
    subItems: [
      { id: 'ecf_received', title: 'Comprobantes recibidos', permission: [], route: 'ecf/ecf_received', activeRoutes: ['ecf_received'], cssClass: 'text-s-12' },
      { id: 'commertial_approval', title: 'Aprobación comercial recibida', permission: [], route: 'ecf/commertial_approval_received', activeRoutes: ['commertial_approval_received'], cssClass: 'text-s-12' },
    ],
  },
  {
    id: 'pagos',
    module: 'pagos',
    title: 'Pagos',
    icon: 'assets/img/reciboIngreso.png',
    permission: [],
    type: 'dropdown',
    subItems: [
      { id: 'recibosIngresos', title: 'Recibos de ingresos', permission: [], route: 'pagos/pagos/recibo_ingreso', activeRoutes: ['recibo_ingreso'] },
      { id: 'cuentasPagar', title: 'Pago de facturas', permission: [], route: 'pagos/pagos/pago_factura', activeRoutes: ['pago_factura'] },
    ],
  },
  {
    id: 'recibos_viajes',
    module: 'viajes',
    title: 'Pedidos',
    icon: 'assets/img/viaje.png',
    permission: [],
    type: 'single',
    route: 'recibos/viajes/0',
    navigate: true,
    activeRoutes: ['recibos', 'viajes'],
  },
  {
    id: 'conduce',
    module: 'conduce',
    title: 'Conduce',
    icon: 'assets/img/conduce.png',
    permission: [],
    type: 'single',
    route: 'conduce/lista',
    navigate: true,
    activeRoutes: ['conduce'],
  },
  {
    id: 'registros',
    module: 'registros',
    title: 'Registros',
    icon: 'assets/img/registro.png',
    permission: [],
    type: 'dropdown',
    subItems: [
      { id: 'empleados', title: 'Empleados', permission: [], route: 'registros/empleados', activeRoutes: ['empleados'] },
      { id: 'clientes', title: 'Clientes', permission: [], route: 'registros/clientes', activeRoutes: ['clientes'] },
      { id: 'suplidores', title: 'Suplidores', permission: [], route: 'registros/suplidores', activeRoutes: ['suplidores'] },
      { id: 'articulos', title: 'Articulos', permission: [], route: 'registros/articulos', activeRoutes: ['articulos'] },
      { id: 'camiones', title: 'Camiones', permission: [], route: 'registros/camiones', activeRoutes: ['camiones'] },
      { id: 'roles', title: 'Roles', permission: [], route: 'registros/roles', activeRoutes: ['roles'] },
      { id: 'ncf', title: 'NCF', permission: [], route: 'registros/ncf', activeRoutes: ['ncf'] },
      { id: 'periodo_fiscal', title: 'Periodo Fiscal', permission: [], route: 'registros/periodo_fiscal', activeRoutes: ['periodo_fiscal'] },
      { id: 'divisa', title: 'Divisa', permission: [], route: 'registros/divisa', activeRoutes: ['divisa'] },
      { id: 'banco', title: 'Banco', permission: [], route: 'registros/banco', activeRoutes: ['banco'] },
    ],
  },
  {
    id: 'produccion',
    module: 'produccion',
    title: 'Producción',
    icon: 'assets/img/produccion.png',
    permission: [],
    type: 'single',
    route: 'produccion',
    navigate: true,
    activeRoutes: ['produccion'],
  },
  {
    id: 'inventario',
    module: 'inventario',
    title: 'Inventario',
    icon: 'assets/img/inventario.png',
    permission: [],
    type: 'single',
    route: 'inventario',
    navigate: true,
    activeRoutes: ['inventario'],
  },
  {
    id: 'contabilidad',
    module: 'contabilidad',
    title: 'Contabilidad',
    icon: 'assets/img/contabilidad.png',
    permission: [],
    type: 'dropdown',
    cssClass: 'text-s-13',
    subItems: [
      { id: 'catalogo_cuentas', title: 'Catalogo de cuentas', permission: [], route: 'contabilidad/catalogo_cuentas', activeRoutes: ['catalogo_cuentas'] },
      { id: 'asientos_contables', title: 'Libro Diario', permission: [], route: 'contabilidad/libro_diario', activeRoutes: ['libro_diario'] },
      { id: 'configuracion_entidad_cuenta', title: 'Config. de cuentas', tooltip: 'Configuración de cuentas contables', permission: [], route: 'contabilidad/configuracion_entidad_cuenta', activeRoutes: ['configuracion_entidad_cuenta'] },
      { id: 'deposito', title: 'Depósito', permission: [], route: 'contabilidad/deposito', activeRoutes: ['deposito'] },
      { id: 'transferencia', title: 'Transferencias', permission: [], route: 'contabilidad/transferencia', activeRoutes: ['transferencia'], cssClass: 'text-s-13' },
      { id: 'cheque', title: 'Cheques', permission: [], route: 'contabilidad/cheque', activeRoutes: ['cheque'] },
    ],
  },
  {
    id: 'reportes',
    module: 'reportes',
    title: 'Reportes',
    icon: 'assets/img/reporte.png',
    permission: [],
    type: 'single',
    route: 'reportes',
    navigate: true,
    activeRoutes: ['reportes'],
  },
];

export const menuPermissionsObj = {
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
  pagos: {
    recibosIngresos: Object.values(Permisos.recibo_ingreso),
    cuentasPagar: Object.values(Permisos.pagos_compras),
    flatt: [],
  },
  recibos_viajes: {
    recibos_viajes: [Permisos.factura_venta.get_viajes_sin_completar],
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
  contabilidad: {
    catalogo_cuentas: [...Object.values(Permisos.grupo_cuenta), ...Object.values(Permisos.cuenta_contable)],
    configuracion_entidad_cuenta: Object.values(Permisos.configuracion_entidad_cuenta),
    asientos_contables: Object.values(Permisos.cabeza_asiento_contable),
    deposito: Object.values(Permisos.deposito),
    transferencia: Object.values(Permisos.transferencia),
    cheque: Object.values(Permisos.cheque),
    flatt: [],
  },
  reportes: {
    reportes: Object.values(Permisos.reporte),
    flatt: [],
  },
};
export interface MenuItemI {
  id: string;
  module: string;
  title: string;
  icon: string;
  permission: string[];
  type: 'single' | 'dropdown';
  route?: string;
  navigate?: boolean;
  subItems?: SubMenuItemI[];
  activeRoutes?: string[];
  cssClass?: string;
}

export interface SubMenuItemI {
  id: string;
  title: string;
  permission: string[];
  route: string;
  activeRoutes?: string[];
  cssClass?: string;
  tooltip?: string;
}

export interface MenuClickEvent {
  event: any;
  url: string;
  navigate: boolean;
}
