import { fun } from './../../../../core/services/functions.service';
import { PeriodoFiscalC } from './../periodo-fiscal';
import { ModalI } from './../../../components/modal/modal-class';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cierre-mensual',
  templateUrl: './cierre-mensual.component.html',
  styleUrls: ['./cierre-mensual.component.scss'],
})
export class CierreMensualComponent implements OnInit, ModalI {
  modal: any = {};
  inputs: any;

  meses = Object.values(PeriodoFiscalC.labels);
  overlay: any;

  ngOnInit(): void {
    console.log('this.inputs ', this.inputs);
  }

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
      if (this.inputs.next_month_open?.label == this.overlay.month_label || this.inputs.prev_month_open?.label == this.overlay.month_label) {
        res = false;
      }
    } else {
      if (this.inputs.actual_month_open?.label == this.overlay.month_label) {
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
