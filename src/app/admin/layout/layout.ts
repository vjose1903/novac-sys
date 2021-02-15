import { Subscription } from 'rxjs';
import { myElectron } from '../../core/services/electron';
import { LayoutService } from './layout.service';

export class LayoutClass extends myElectron {
  constructor(public layServ?: LayoutService) {
    super();
  }

  facturaGuardada: any = undefined;
  info_cambio = {};
  ruta_a_cambiar = '';
  url_actual = '';

  subInit: Subscription;
  subDeciMenu: Subscription;
  subFactG: Subscription;
  subRefresh: Subscription;

  _init_layout() {
    this.subInit = this.layServ.INITCAMBIOMENU.subscribe((res) => {
      if (res && res.bool) {
        this.info_cambio = res;
        this.info_cambio['verificar'] = true;
        this.initCambioMenu(res);
      }
    });

    const temp_url = document.location.href.split('admin/');
    if (temp_url[1]) {
      this.url_actual = temp_url[1].split('/')[0];

      if (this.url_actual === 'factura') {
        this.subFactG = this.layServ.FACTURAGUARDADA.subscribe((res) => {
          if (res) {
            this.rellenarFacturaGuardada((res) => {
              if (res) {
                this.facturaGuardada = res;
              }
            });

            this.layServ.nextFacturaGuardada(undefined);
          }
        });
      }
    }
  }

  rellenarFacturaGuardada(callback = (arg) => {}) {}
  initCambioMenu(arg) {}

  decisionCambioMenu() {}

  _destroy_layout() {
    if (this.subInit) {
      if (this.subInit) this.subInit.unsubscribe();

      if (this.url_actual === 'factura' && this.subFactG) this.subFactG.unsubscribe();
    }
  }

  cambiarItemMenu(arg) {
    this.layServ.nextCambioMenu(arg);
  }
}
// {"condicion":"Crédito","forma_pago":"Efectivo","fecha_viaje":null,"fecha_equivalente":null,"fecha_vencimiento":"13/02/2021","pagada":false,"balance":23500,"devuelta":0,"fecha_valida":null,"tipo_factura_id":2,"numero_comprobante":null,"costoYgasto":null,"numero_factura":null,"total_factura":23500,"Bruto":23500,"itbis":0,"descuento":0,"estado":true,"is_adelantada":false,"is_viaje":false,"is_nota":false,"cliente_id":7,"detalle_facturas_attributes":[{"id":null,"articulo_id":209,"descuento_valor":0,"cantidad_en_unidades":2500,"calcular_saco":true,"cantidad":100,"total":23500,"descuento_porciento":0,"itbis":0,"unidad":"Saco de 25 libras","precio":235,"retirado":2500,"retirado_en_venta":2500}],"FACTURA_DE":13,"tipo":"venta","user_id":1,"tiene_nota":false,"action":"new"}
// {"condicion":"Crédito","forma_pago":"Efectivo","fecha_viaje":null,"fecha_equivalente":null,"fecha_vencimiento":"15/03/2021","pagada":false,"balance":23500,"devuelta":0,"fecha_valida":"30/12/2022","tipo_factura_id":2,"numero_comprobante":null,"costoYgasto":null,"numero_factura":null,"total_factura":23500,"Bruto":23500,"itbis":0,"descuento":0,"estado":true,"is_adelantada":false,"is_viaje":false,"is_nota":false,"cliente_id":7,"detalle_facturas_attributes":[{"id":null,"articulo_id":209,"descuento_valor":0,"cantidad_en_unidades":2500,"calcular_saco":true,"cantidad":100,"total":23500,"descuento_porciento":0,"itbis":0,"unidad":"Saco de 25 libras","precio":235,"retirado":2500,"retirado_en_venta":2500}],"FACTURA_DE":13,"tipo":"venta","user_id":1,"tiene_nota":false,"vendedor_id":2,"action":"new","tipo_factura":"Factura con valor fiscal"}
