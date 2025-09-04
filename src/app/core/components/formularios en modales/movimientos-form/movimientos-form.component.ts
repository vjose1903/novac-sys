<<<<<<< HEAD:src/app/admin/components/formularios en modales/movimientos-form/movimientos-form.component.ts
import { HtmlElementsService } from './../../../../core/services/html-elements.service';
import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { fun } from '../../../../core/services/functions.service';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ModalComponentI, ModalI } from '../../modal/modal-class';
=======
import { HtmlElementsService } from '@core/services/html-elements.service';
import { Component, OnInit, AfterViewInit, inject, Input } from '@angular/core';
import { fun } from '@core/services/functions.service';
import { MixinClass } from '@core/typescript/MixinClass';
>>>>>>> dev:src/app/core/components/formularios en modales/movimientos-form/movimientos-form.component.ts
import { MovimientosC } from './movimiento-model';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';
import { ArticuloI } from '@registros/articulos/articulo';

@Component({
  selector: 'app-movimientos-form',
  templateUrl: './movimientos-form.component.html',
  styleUrls: ['./movimientos-form.component.scss'],
  standalone: false,
})
export class MovimientosFormComponent extends MixinClass implements OnInit, AfterViewInit, IDynamicModal {
  form;
  tipo_movimiento;
  tipo_salida;
  medida;
  element: any;
  cantidad = 0;
  motivo;
  medidas;

  movimientosC = new MovimientosC();
  plural = { Quintal: 'Quintales', Libra: 'Libras', Caja: 'Cajas', Paquete: 'Paquetes', Unidad: 'Unidades', Saco: 'Sacos' };
<<<<<<< HEAD:src/app/admin/components/formularios en modales/movimientos-form/movimientos-form.component.ts
=======
  @Input() modalConfig!: IModalConfiguration;
  @Input() modalWrapper!: DynamicModalComponent;
  @Input() data!: ArticuloI;
>>>>>>> dev:src/app/core/components/formularios en modales/movimientos-form/movimientos-form.component.ts

  htmlServ = inject(HtmlElementsService);
  modalComponent: ModalComponentI = {};
  inputs: any;

  constructor() {
    super();
  }

  ngOnInit() {
<<<<<<< HEAD:src/app/admin/components/formularios en modales/movimientos-form/movimientos-form.component.ts
    this.medidas = Object.keys(this.inputs.cantidades);
=======
    this.medidas = Object.keys(this.data.cantidades);
>>>>>>> dev:src/app/core/components/formularios en modales/movimientos-form/movimientos-form.component.ts
  }

  ngAfterViewInit() {
    fun.enfocarInput('tipo_movimiento');
  }

  formatoNumero(arg) {
    return fun.roundNumberToDecimal(arg);
  }

  mostrarExistencia(arg) {
    if (this.cantidad && this.medida) {
      const med = this.cantidad === 1 ? this.medida : this.plural[this.medida];
      if (arg === 'mov') {
        if (this.tipo_movimiento === 'entrada') {
          return 'Aumentará ' + this.cantidad + ' ' + med;
        } else if (this.tipo_movimiento === 'salida') {
          return 'Disminuirá ' + this.cantidad + ' ' + med;
        }
      } else {
        const existenciaPorMedida = this.data.cantidades[this.medida];
        let calculo = 0;
        if (this.tipo_movimiento === 'entrada') {
          calculo = existenciaPorMedida + this.cantidad;
        } else {
          calculo = existenciaPorMedida - this.cantidad;
        }
        return 'Proximo en inventario ' + this.formatoNumero(calculo) + ' ' + med;
      }
    }
  }

  saltar(campo) {
    if (campo !== 'send') {
      fun.enfocarInput(campo);
    } else {
      this.submit();
    }
  }

  abilitarBtnSend() {
    let res = true;
    if (this.tipo_movimiento && this.medida && this.cantidad && this.motivo) {
      if (this.tipo_movimiento === 'salida') {
        res = false;
        if (!this.tipo_salida) {
          res = true;
        }
      } else {
        res = false;
      }
    } else {
      res = true;
    }

    return res;
  }

  selectTipoMov() {
    if (this.tipo_movimiento === 'entrada') this.tipo_salida = undefined;
  }
<<<<<<< HEAD:src/app/admin/components/formularios en modales/movimientos-form/movimientos-form.component.ts

  btn_aceptar() {
    const obj = { articulo_id: this.inputs.id, cantidad: this.cantidad, cantidad_en_unidades: this.inputs.contenido[this.medida] * this.cantidad, accion: this.tipo_movimiento, motivo: this.motivo, medida: this.medida, tipo_salida: this.tipo_salida };

    this.movimientosC.createOne(obj).then((res: any) => {
      fun.toastSuccess(fun.capitalice(this.tipo_movimiento) + ' de inventario exitosa.', 'CORRECTO');
      this.resetForm();

      const obj = { bool: true, body: res.articulo };
      this.modalComponent.closeModal(this.modalComponent.id, { data: obj });
=======

  submit() {
    const obj = { articulo_id: this.data.id, cantidad: this.cantidad, cantidad_en_unidades: this.data.contenido[this.medida] * this.cantidad, accion: this.tipo_movimiento, motivo: this.motivo, medida: this.medida, tipo_salida: this.tipo_salida };

    console.log('obj, ---> ', obj);

    this.movimientosC.createOne(obj).then(res => {
      fun.toastSuccess(`${fun.capitalice(this.tipo_movimiento)} de inventario exitosa.`, 'CORRECTO');
      this.resetForm();

      const obj = { bool: true, body: res.articulo };

      this.modalConfig.close({ data: obj });
>>>>>>> dev:src/app/core/components/formularios en modales/movimientos-form/movimientos-form.component.ts
    });
  }

  resetForm() {
    this.tipo_movimiento = undefined;
    this.medida = undefined;
    this.cantidad = undefined;
    this.motivo = undefined;
    fun.enfocarInput('tipo_movimiento');
  }
}
