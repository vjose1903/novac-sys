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
  @Input() expectedTotal = '0.00';
  @Input() creditInvoicesTotal = '0.00';
  @Input() backendTotals: Record<string, string> = {};
  @Input() openingCashFund = '0.00';

  formatAmount(value: string | number) {
    return fun.roundNumberToDecimal(value || '0.00');
  }

  fondoCaja() {
    return this.difference();
  }

  differenceClass(): string {
    const val = Number(fun.desformatearStNumber(this.difference()));
    if (val < 0) return 'diff-negative';
    if (val === 0) return 'diff-zero';
    return 'diff-positive';
  }

  difference() {
    const expected = this.expectedTotal || this.backendTotals?.expected_total || this.systemIncomeTotal || '0.00';
    return fun.roundNumberToDecimal(Number(fun.desformatearStNumber(this.operationalTotal || 0)) - Number(fun.desformatearStNumber(expected || 0)));
  }
}
