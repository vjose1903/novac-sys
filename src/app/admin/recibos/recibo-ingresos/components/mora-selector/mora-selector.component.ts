import { Component, DestroyRef, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { fun } from '../../../../../core/services/functions.service';
import { table_info } from '../../../../components/new_tablas/tabla-class';
import { MoraCalculator, mora_personalizada } from '../../utils/mora-calculator';
import { CommonModule } from '@angular/common';
import { PopoverModule } from 'primeng/popover';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { FacturasI } from '../../../../../admin/facturacion/factura';
import { MoraSelectorService } from './mora-selector.service';
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
  @Input() returnDara: (data: FacturasI[]) => void;
  @Input() showMora: boolean = true;
  @Input() showMoraPersonalizada: boolean = true;
  @Input() subscribeChanges: boolean = true;
  @Output() changePorcentajeMora = new EventEmitter<number>();

  mora_personalizada = mora_personalizada;
  moraCalculator!: MoraCalculator;
  porcentajes = [0, 1, 1.5, 2, mora_personalizada];
  customMora: number = 0;
  porcentajeSelected: number | string = 2;
  moraSelectorService = inject(MoraSelectorService);
  
  private onDestroy$: Subject<void> = new Subject<void>();

  ngOnInit(): void {
    if (this.showMora) {
      this.moraCalculator = new MoraCalculator(this.rowData);

      this.recalcMora();
    }

    if (!this.showMoraPersonalizada) this.porcentajes = this.porcentajes.filter(porcentaje => porcentaje != mora_personalizada);

    if (this.subscribeChanges) {
      this.moraSelectorService.porcentajeMora$.pipe(skip(1), takeUntil(this.onDestroy$)).subscribe((porcentaje: number) => {
        console.log('%c --> ', 'color: red', porcentaje);
        this.porcentajeSelected = porcentaje;
        this.recalcMora();
      });
    }
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  recalcMora() {
    this.setMora(this.moraCalculator.getMora({ porcentaje: this.porcentajeSelected }) as string);
  }

  setMora(mora: string) {
    this.rowData.mora = mora;

    if (this.rowData.select && this.rowData.pagoT) {
      const balance = fun.desformatearStNumber(this.rowData.balance);
      mora = fun.desformatearStNumber(mora);
      this.rowData.monto = fun.roundNumberToDecimal(balance + mora);
    }

    this.returnDara(this.allData);
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
    if (this.showMora && porcentaje != mora_personalizada) this.recalcMora();

    this.changePorcentajeMora.emit(Number(porcentaje));
  }

  changePersonalizedMora(event: any) {
    this.setMora(fun.desformatearStNumber(event.target.value));
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
