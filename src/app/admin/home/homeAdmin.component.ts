import { Component, OnDestroy, OnInit } from '@angular/core';
import { IpcService } from '../../core/services/ipc.service';
import { GLOBAL } from '../../core/services/GLOBAL';
import { ModalService } from '../components/modal/modal.service';
import { LayoutService } from '../layout/layout.service';
import { mixinClass } from '../mixinClass';

@Component({
  selector: 'app-homeAdmin',
  templateUrl: './homeAdmin.component.html',
  styleUrls: ['./homeAdmin.component.scss'],
})
// export class HomeAdminComponent extends LayoutClass implements OnInit, OnDestroy {
export class HomeAdminComponent extends mixinClass implements OnInit, OnDestroy {
  constructor(public _ipc: IpcService, public mServ: ModalService, public layServ: LayoutService) {
    super(mServ, _ipc, layServ);
  }

  initCambioMenu(arg) {
    console.log(arg);

    if (arg.bool) {
      this.layServ.nextDecisionCambioMenu(arg);
    }
  }

  cedula = null;
  ngOnInit() {
    this._init_mixin();
  }
  ngOnDestroy() {
    this._destroy_mixin();
  }

  p() {
    // document.getElementById('imgd').classList.add('rubberBand');
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

    this.mServ.modalTipo('mostrarFactura');
    this.mServ.ModalSeleccion(obj);
    this.mServ.mostrarModal(true);
  }
}
