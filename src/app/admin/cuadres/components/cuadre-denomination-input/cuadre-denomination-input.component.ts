import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CuadreDenominacion, DenominationType } from '../../cuadre-caja.model';

@Component({
  selector: 'app-cuadre-denomination-input',
  templateUrl: './cuadre-denomination-input.component.html',
  styleUrls: ['./cuadre-denomination-input.component.scss'],
  standalone: false,
})
export class CuadreDenominationInputComponent {
  @Input() title = '';
  @Input() type: DenominationType = 'bill';
  @Input() items: CuadreDenominacion[] = [];
  @Input() readonly = false;
  @Output() itemsChange = new EventEmitter<CuadreDenominacion[]>();

  addItem() {
    this.itemsChange.emit([
      ...this.items,
      {
        denomination_type: this.type,
        currency_code: this.type === 'foreign_currency' ? 'USD' : 'DOP',
        denomination_value: '0.00',
        quantity: '0',
        exchange_rate: this.type === 'foreign_currency' ? '1.000000' : '1.000000',
      },
    ]);
  }

  removeItem(index: number) {
    this.itemsChange.emit(this.items.filter((_, itemIndex) => itemIndex !== index));
  }

  patchItem(index: number, key: keyof CuadreDenominacion, value: string) {
    const next = this.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item));
    this.itemsChange.emit(next);
  }

  lineTotal(item: CuadreDenominacion) {
    const value = Number(item.denomination_value || 0);
    const quantity = Number(item.quantity || 0);
    const rate = Number(item.exchange_rate || 1);
    return (value * quantity * rate).toFixed(2);
  }

  sectionTotal() {
    return this.items.reduce((total, item) => total + Number(this.lineTotal(item)), 0).toFixed(2);
  }
}
