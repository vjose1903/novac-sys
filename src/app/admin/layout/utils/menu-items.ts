import { actionFacturacion } from '@admin/facturacion/factura';

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
    id: 'recibos_ingresos',
    module: 'recibos_ingresos',
    title: 'Recibos de ingresos',
    icon: 'assets/img/reciboIngreso.png',
    permission: [],
    type: 'single',
    route: 'recibos/lista_ingresos',
    navigate: true,
    activeRoutes: ['recibos', 'lista_ingresos', 'ingresos'],
  },
  {
    id: 'viajes',
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
}

export interface MenuClickEvent {
  event: any;
  url: string;
  navigate: boolean;
}
