import { DateUtils } from '@vjose1903/dateutils';
import { fun } from '@core/services/functions.service';
import { Component, Input, OnInit } from '@angular/core';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';
import { CommonModule } from '@angular/common';
import { PopoverModule } from 'primeng/popover';

@Component({
  selector: 'app-cierre-mensual',
  templateUrl: './cierre-mensual.component.html',
  styleUrls: ['./cierre-mensual.component.scss'],
  imports: [CommonModule, PopoverModule],
})
export class CierreMensualComponent implements OnInit, IDynamicModal {
  @Input() modalConfig!: IModalConfiguration;
  @Input() modalWrapper!: DynamicModalComponent;

  // inputs
  @Input() next_month_open!: { label: string };
  @Input() prev_month_open!: { label: string };
  @Input() actual_month_open!: { label: string };
  @Input() fecha_inicio: any;
  @Input() fecha_cierre: any;
  @Input() detalle_periodo_fiscal: any;

  meses = DateUtils.getMonthsLabelArray();
  overlay: any;

  ngOnInit(): void {}

  openOverlay(event, overlay, month_label, month_status) {
    this.overlay = {};
    this.overlay['item'] = overlay;
    this.overlay['month_label'] = month_label;
    this.overlay['month_status'] = month_status;
    this.overlay['item'].toggle(event);

    if (event) event.stopPropagation();
  }

  cerrarOverlay() {
    if (fun.hasValue(this.overlay?.item)) {
      this.overlay['item'].hide();
      this.overlay = undefined;
    }
  }

  disableOverlayOption(tipo) {
    let res = true;

    if (tipo == 'open') {
      if (this.next_month_open?.label == this.overlay.month_label || this.prev_month_open?.label == this.overlay.month_label) {
        res = false;
      }
    } else {
      if (this.actual_month_open?.label == this.overlay.month_label) {
        res = false;
      }
    }

    return res;
  }

  actionMonth(tipo) {
    if (!this.disableOverlayOption(tipo)) {
      console.log('tipo ', tipo);
    } else {
      fun.toastWarning(`El mes de: ${this.overlay.month_label.toUpperCase()} no puede ser ${tipo == 'open' ? 'Abierto' : 'Cerrado'}.`, 'AVISO');
    }
  }

  btn_aceptar() {}
}
