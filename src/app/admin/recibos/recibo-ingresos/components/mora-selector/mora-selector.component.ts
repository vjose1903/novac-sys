import { Component, Input, OnInit } from '@angular/core';
import { fun } from '../../../../../core/services/functions.service';
import { table_info } from '../../../../components/new_tablas/tabla-class';
import { MoraCalculator, mora_personalizada } from '../../utils/mora-calculator';
import { CommonModule } from '@angular/common';
import { Popover, PopoverModule } from 'primeng/popover';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mora-selector',
  imports: [CommonModule, PopoverModule, FormsModule],
  templateUrl: './mora-selector.component.html',
  styleUrl: './mora-selector.component.scss',
})
export class MoraSelectorComponent implements OnInit {
  @Input() rowData: any;
  @Input() column: table_info;
  @Input() key: string;

  mora_personalizada = mora_personalizada;
  moraCalculator!: MoraCalculator;
  porcentajes = [0, 1, 1.5, 2, mora_personalizada];
  porcentajeSelected: number | string = 2;
  customMora: number = 0;

  ngOnInit(): void {
    this.moraCalculator = new MoraCalculator(this.rowData);

    this.recalcMora();
  }

  recalcMora() {
    this.rowData.mora = this.moraCalculator.getMora(this.porcentajeSelected);
  }

  formatoNumero(num, decimales = 2) {
    let numformat = '0.00';
    if (num) numformat = fun.roundNumberToDecimal(num, decimales);
    return numformat;
  }

  getValueForm(column: table_info, data) {
    const value = fun.getProperty(data, this.key);
    return this.formatoNumero(value);
  }

  changePorcentaje(porcentaje: number | string) {
    this.porcentajeSelected = porcentaje;
    if (porcentaje != mora_personalizada) this.recalcMora();
  }
}
