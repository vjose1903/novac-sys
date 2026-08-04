import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { DivisaService } from '@admin/registros/divisa/divisa.service';
import { fun } from '@services/functions.service';
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
  @Input() fixedRows = false;
  @Input() divisas: any[] = [];
  @Output() itemsChange = new EventEmitter<CuadreDenominacion[]>();
  divisaServ = inject(DivisaService);

  addItem() {
    if (this.fixedRows) return;
    this.itemsChange.emit([
      ...this.items,
      {
        denomination_type: this.type,
        ...this.defaultCurrency(),
        denomination_value: '0.00',
        quantity: '0',
      },
    ]);
  }

  removeItem(index: number) {
    if (this.fixedRows) return;
    this.itemsChange.emit(this.items.filter((_, itemIndex) => itemIndex !== index));
  }

  patchItem(index: number, key: keyof CuadreDenominacion, value: string) {
    const next = this.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item));
    this.itemsChange.emit(next);
  }

  clearZeroOnFocus(index: number, key: keyof CuadreDenominacion, event: FocusEvent) {
    if (this.readonly) return;
    const input = event.target as HTMLInputElement;
    if (input.value.trim() !== '' && Number(input.value) === 0) {
      input.value = '';
      this.patchItem(index, key, '');
    }
  }

  restoreZeroOnBlur(index: number, key: keyof CuadreDenominacion, event: FocusEvent) {
    if (this.readonly) return;
    const input = event.target as HTMLInputElement;
    if (input.value.trim() === '') {
      input.value = '0';
      this.patchItem(index, key, '0');
    }
  }

  changeDivisa(index: number, divisaId: number) {
    const divisa = this.availableDivisas().find(item => item.id == divisaId) || this.divisaServ.getDivisaInfoById(divisaId);
    const next = this.items.map((item, itemIndex) =>
      itemIndex === index
        ? {
            ...item,
            divisa_id: divisaId,
            currency_code: this.currencyCode(divisa),
          }
        : item
    );
    this.itemsChange.emit(next);
  }

  lineTotal(item: CuadreDenominacion) {
    return this.formatAmount(this.itemTotal(item));
  }

  denominationLabel(item: CuadreDenominacion) {
    return Number(item.denomination_value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  sectionTotal() {
    return this.formatAmount(this.items.reduce((total, item) => total + this.itemTotal(item), 0));
  }

  selectedDivisaId(item: CuadreDenominacion) {
    if (item.divisa_id) return item.divisa_id;
    return this.availableDivisas().find(divisa => [this.currencyCode(divisa), divisa?.code, divisa?.simbolo].includes(item.currency_code))?.id;
  }

  exchangeRateLabel(item: CuadreDenominacion) {
    return fun.roundNumberToDecimal(this.exchangeRate(item), 2);
  }

  availableDivisas() {
    const options = this.divisas.length ? this.divisas : this.divisaServ.listaDivisas;
    if (this.type !== 'foreign_currency') return options;

    const principalId = this.divisaServ.getDivisaPrincipalInfo()?.id;
    return options.filter(item => item.id !== principalId && !item.is_principal);
  }

  private defaultCurrency() {
    const divisa = this.availableDivisas()[0] || (this.type === 'foreign_currency' ? this.divisaServ.listaDivisas.find(item => !item.is_principal) : this.divisaServ.getDivisaPrincipalInfo());
    return {
      divisa_id: divisa?.id,
      currency_code: this.currencyCode(divisa) || (this.type === 'foreign_currency' ? 'USD' : 'DOP'),
    };
  }

  private currencyCode(divisa: any) {
    return divisa?.code || divisa?.codigo || divisa?.simbolo || divisa?.nombre || '';
  }

  private itemTotal(item: CuadreDenominacion) {
    const value = Number(item.denomination_value || 0);
    const quantity = Number(item.quantity || 0);
    return value * quantity * this.exchangeRate(item);
  }

  private exchangeRate(item: CuadreDenominacion) {
    if (this.type !== 'foreign_currency') return 1;
    const divisa = this.findDivisa(item);
    return Number(divisa?.current_tasa || 1);
  }

  private findDivisa(item: CuadreDenominacion) {
    return this.availableDivisas().find(divisa => divisa.id == this.selectedDivisaId(item));
  }

  private formatAmount(value: number, digits = 2) {
    return fun.roundNumberToDecimal(value, digits);
  }
}
