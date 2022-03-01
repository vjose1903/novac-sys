import { Component, OnDestroy, OnInit } from '@angular/core';
import { GLOBAL } from '../../core/typescript/GLOBAL';
import { MixinClass } from '../../core/typescript/MixinClass';
import { SingletonService } from '../../core/services/singleton.service';
import { ConfigI } from '../../core/typescript/config-interface';

@Component({
  selector: 'app-homeAdmin',
  templateUrl: './homeAdmin.component.html',
  styleUrls: ['./homeAdmin.component.scss'],
})
// export class HomeAdminComponent extends LayoutClass implements OnInit, OnDestroy {
export class HomeAdminComponent extends MixinClass implements OnInit, OnDestroy {
  constructor() {
    super();
  }

  imgLogo;
  configServ = SingletonService.configServ;

  initCambioMenu(arg) {
    if (arg.bool) this.layServ.nextDecisionCambioMenu(arg);
  }

  cedula = null;
  ngOnInit() {
    this._init_mixin({ component: 'home' });

    this.configServ.getConfig().then((config: ConfigI) => {
      this.imgLogo = `data:image/png;base64,${config.logo_empresa}`;
    });
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  verificar() {
    GLOBAL.ValidaCedula(this.cedula);
  }
  mostrar() {
    const obj = {
      id: 1,
      tipo_factura_id: 2,
      suplidor_id: 1,
      cliente_id: null,
      user_id: 1,
      fecha_equivalente: '2020-02-11',
      fecha_vencimiento: '2020-02-11',
      fecha_valida: '2021-02-11',
      numero_comprobante: 'B0100000410',
      numero_factura: 1,
      condicion: 'Crédito',
      forma_pago: 'Efectivo',
      total_factura: 489000.0,
      itbis: 0.0,
      descuento: 0.0,
      estado: true,
      tipo: 'compra',
      created_at: '2020-02-11T13:13:43.464Z',
      updated_at: '2020-02-11T13:13:43.464Z',
      Bruto: 489000.0,
      NoCliente_nombre: null,
      NoCliente_direccion: null,
      costoYgasto: '9',
      pagada: false,
      vendedor_id: null,
      balance: 489000.0,
      devuelta: 0.0,
      adelantada: false,
      detalle_facturas: [
        {
          descripcion: 'Maiz',
          unidad: 'Quintal',
          costo: 895.0,
          precio: 895.0,
          total: 179000.0,
          descuento: 0.0,
          itbis: 0.0,
          cantidad: 200.0,
          tipo: 'Materia prima',
        },
        {
          descripcion: 'soya',
          unidad: 'Quintal',
          costo: 700.0,
          precio: 700.0,
          total: 140000.0,
          descuento: 0.0,
          itbis: 0.0,
          cantidad: 200.0,
          tipo: 'Materia prima',
        },
        {
          descripcion: 'Grasa',
          unidad: 'Quintal',
          costo: 850.0,
          precio: 850.0,
          total: 170000.0,
          descuento: 0.0,
          itbis: 0.0,
          cantidad: 200.0,
          tipo: 'Materia prima',
        },
      ],
      cliente: null,
      suplidor: {
        nombre: 'Animal farm',
        direccion: 'Santiago Republica dominicana',
        rnc: '131-13543-5',
      },
      tipo_factura: 'Factura con valor fiscal',
      usuario: 'Mari Santos',
    };

    this.abrirModal('mostrarFactura', obj);
  }
}
