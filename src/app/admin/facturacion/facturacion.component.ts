import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { SharedService } from '../../core/services/shared.service';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.scss'],
})
export class FacturacionComponent implements OnInit {
  form: FormGroup;
  numFac = 0;
  fecha;
  TOTAL;
  ITBIS;
  seleccionModal: any;
  showModal = false;
  modalSearch: boolean;
  control: any;
  rowActual: any;
  drop: boolean;
  UnidadesArticulo: any[];
  tipoModal: string;
  constructor(private shServ: SharedService, private fb: FormBuilder, private route: ActivatedRoute) {
    this.form = this.fb.group({
      nombre: [],
      direccion: [],
      telefono: [],
    });
  }
  formatearNumero(nStr) {
    if (nStr !== undefined) {
      nStr += '';
      const x = nStr.split('.');
      let x1 = x[0];
      const x2 = x.length > 1 ? '.' + x[1] : '';
      const rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
      }
      return x1 + x2;
    }
  }

  ngOnInit() {
    this.fecha = moment().format('L');
  }
  getCalculos(arg) {
    this.TOTAL = arg.Total;
    console.log(arg);
  }

  cancelarFactura() {
    this.tipoModal = 'cancelar';
    this.abrirModal();
  }

  // =============================================
  //  MODAL PARA FILTRAR ARTICULOS
  // =============================================
  abrirModal(arg?) {
    if (arg) {
      this.seleccionModal = arg;
    }
    this.showModal = true;
  }

  reinicarVarModal() {
    this.modalSearch = false;
    this.showModal = false;
  }

  clickRowModal(arg) {}
}
