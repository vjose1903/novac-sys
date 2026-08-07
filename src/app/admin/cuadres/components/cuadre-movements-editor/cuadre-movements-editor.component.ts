import { Component, EventEmitter, Input, Output } from '@angular/core';
import { fun } from '@services/functions.service';
import { CuadreMovimiento, MovementGroup } from '../../cuadre-caja.model';

@Component({
  selector: 'app-cuadre-movements-editor',
  templateUrl: './cuadre-movements-editor.component.html',
  styleUrls: ['./cuadre-movements-editor.component.scss'],
  standalone: false,
})
export class CuadreMovementsEditorComponent {
  @Input() title = '';
  @Input() group: MovementGroup = 'other_payment_methods';
  @Input() items: CuadreMovimiento[] = [];
  @Input() readonly = false;
  @Output() itemsChange = new EventEmitter<CuadreMovimiento[]>();

  paymentMethods = [
    { value: 'card', label: 'Tarjeta' },
    { value: 'check', label: 'Cheque' },
    { value: 'deposit', label: 'Depósito' },
    { value: 'bank_transfer', label: 'Transferencia' },
    { value: 'cash', label: 'Efectivo' },
    { value: 'other', label: 'Otro' },
  ];

  addItem() {
    this.itemsChange.emit([
      ...this.items,
      {
        movement_group: this.group,
        payment_method: this.group === 'additional_transfers' ? 'bank_transfer' : 'card',
        description: '',
        reference: '',
        amount: '0.00',
      },
    ]);
  }

  removeItem(index: number) {
    this.itemsChange.emit(this.items.filter((_, itemIndex) => itemIndex !== index));
  }

  patchItem(index: number, key: keyof CuadreMovimiento, value: string) {
    const next = this.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value, movement_group: this.group } : item));
    this.itemsChange.emit(next);
  }

  sectionTotal() {
    return fun.roundNumberToDecimal(this.items.reduce((total, item) => total + Number(fun.desformatearStNumber(item.amount || 0)), 0));
  }
}
