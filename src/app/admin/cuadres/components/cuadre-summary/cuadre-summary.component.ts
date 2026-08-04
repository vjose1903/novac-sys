import { Component, Input } from '@angular/core';
import { fun } from '@services/functions.service';

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

  formatAmount(value: string | number) {
    return fun.roundNumberToDecimal(value || '0.00');
  }

  fondoCaja() {
    return fun.roundNumberToDecimal(Number(fun.desformatearStNumber(this.operationalTotal || 0)) - Number(fun.desformatearStNumber(this.systemIncomeTotal || 0)));
  }

  difference() {
    return fun.roundNumberToDecimal(Number(fun.desformatearStNumber(this.operationalTotal || 0)) - Number(fun.desformatearStNumber(this.systemIncomeTotal || 0)));
  }
}
