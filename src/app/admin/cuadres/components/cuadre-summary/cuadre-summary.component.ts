import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-cuadre-summary',
  templateUrl: './cuadre-summary.component.html',
  styleUrls: ['./cuadre-summary.component.scss'],
  standalone: false,
})
export class CuadreSummaryComponent {
  @Input() systemIncomeTotal = '0.00';
  @Input() operationalTotal = '0.00';
  @Input() physicalCashTotal = '0.00';
  @Input() otherPaymentMethodsTotal = '0.00';
  @Input() additionalTransfersTotal = '0.00';
  @Input() backendTotals: Record<string, string> = {};

  fondoCaja() {
    return (Number(this.operationalTotal || 0) - Number(this.systemIncomeTotal || 0)).toFixed(2);
  }

  difference() {
    return (Number(this.operationalTotal || 0) - Number(this.systemIncomeTotal || 0)).toFixed(2);
  }
}
