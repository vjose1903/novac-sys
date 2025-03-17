import { Component, DestroyRef, EventEmitter, inject, input, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { fun } from '../../../../../core/services/functions.service';
import { table_info } from '../../../../components/new_tablas/tabla-class';
import { MoraCalculator, mora_personalizada } from '../../utils/mora-calculator';
import { CommonModule } from '@angular/common';
import { PopoverModule } from 'primeng/popover';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { FacturasI } from '../../../../../admin/facturacion/factura';
import { MoraSelectorService, MoraSelectorKeyI } from './mora-selector.service';
import { skip, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-mora-selector',
  imports: [CommonModule, PopoverModule, FormsModule, TooltipModule],
  templateUrl: './mora-selector.component.html',
  styleUrl: './mora-selector.component.scss',
})
export class MoraSelectorComponent implements OnInit, OnDestroy {
  @Input() allData: FacturasI[];
  @Input() rowData: FacturasI;
  @Input() column: table_info;
  @Input() key: string;
  @Input() returnData: (data: { key: MoraSelectorKeyI; value: string | number; factura_id: number }) => void;
  @Input() showMora: boolean = true;
  @Input() showMoraPersonalizada: boolean = true;
  @Input() subscribeChanges: boolean = true;
  @Input() porcentajeSelected: number | string = 2;
  @Output() porcentajeSelectedChange = new EventEmitter<number | string>();
  @Output() changePorcentajeMora = new EventEmitter<number>();

  mora_personalizada = mora_personalizada;
  porcentajes = [0, 1, 1.5, 2, mora_personalizada];
  customMora: number = 0;
  moraSelectorService = inject(MoraSelectorService);
  moraCalculator!: MoraCalculator;
  private onDestroy$: Subject<void> = new Subject<void>();

  ngOnInit(): void {
    if (this.showMora) {
      this.moraCalculator = new MoraCalculator(this.rowData);
    }

    if (!this.showMoraPersonalizada) this.porcentajes = this.porcentajes.filter(porcentaje => porcentaje != mora_personalizada);

    if (this.subscribeChanges) {
      this.moraSelectorService.porcentajeMora$.pipe(skip(1), takeUntil(this.onDestroy$)).subscribe((porcentaje: number) => {
        this.porcentajeSelected = porcentaje;
        this.porcentajeSelectedChange.emit(porcentaje);
        this.changePorcentaje(porcentaje);
      });
    }
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  formatoNumero(num, decimales = 2) {
    let numformat = '0';
    if (num) numformat = fun.roundNumberToDecimal(num, decimales);
    return numformat;
  }

  getValueForm(column: table_info, data) {
    const value = fun.getProperty(data, this.key);
    return this.formatoNumero(value);
  }

  changePorcentaje(porcentaje: number | string) {
    this.porcentajeSelected = porcentaje;
    this.porcentajeSelectedChange.emit(porcentaje);

    this.changePorcentajeMora.emit(Number(porcentaje));
    this.returnData && this.returnData({ key: MoraSelectorKeyI.porcentaje_mora, value: porcentaje, factura_id: this.rowData?.id });

    if (porcentaje != mora_personalizada) this.customMora = 0;
  }

  changePersonalizedMora(event: any) {
    this.returnData && this.returnData({ key: MoraSelectorKeyI.mora, value: fun.desformatearStNumber(event.target.value), factura_id: this.rowData.id });
  }

  onFocusMora(event: any) {
    if (this.rowData.mora && this.rowData.mora != 0) {
      this.rowData.mora = fun.desformatearStNumber(this.rowData.mora);
    }
  }

  onBlurMora() {
    this.rowData.mora = fun.roundNumberToDecimal(this.rowData.mora);
  }
}
