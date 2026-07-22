import { Injectable } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class CuerpoFacturaFormService {
  createForm(fb: UntypedFormBuilder, rows = 26): UntypedFormGroup {
    const form = fb.group({
      rowFactura: fb.array([]),
    });

    const formArray = form.get('rowFactura') as UntypedFormArray;
    const formItems = Array.from({ length: rows }, () => this.createItem(fb));
    formItems.forEach(item => formArray.push(item));

    return form;
  }

  createItem(fb: UntypedFormBuilder): UntypedFormGroup {
    return fb.group({
      key: [null],
      articulo: [null],
      unidades: [null],
      detalle_id: [null],
      codigo: [null],
      cantidad: [null],
      cantidad_initial: [0],
      cantidad_ant: [null],
      descripcion: [null],
      unidad: [null],
      precio: [null],
      costo: [null],
      descuento_valor: [null],
      total: [null],
      itbis: [null],
      cantidad_en_unidades: [0],
      cantidad_en_unidades_initial: [0],
      calcular_saco: [false],
      is_defectuoso: [false],
      is_devuelto: [false],
      from_pre_factura: [false],
      vende_sin_inventario: [false],
      is_bad_price: [false],
      actual_price: [null],
      actual_price_value: [null],
      key_initial: [null],
      producto_initial: [null],
    });
  }
}
