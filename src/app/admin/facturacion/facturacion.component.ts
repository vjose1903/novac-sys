import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SharedService } from '../../core/services/shared.service';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { SELECCIONMODAL, SHOWMODAL, TIPOMODAL, DECISIONMODAL } from '../../core/services/GLOBAL';
import { Subscription } from 'rxjs';
import { ModalService } from '../../components/modal/modal.service';
import { isUndefined } from 'ngx-bootstrap/chronos/utils/type-checks';
import { DBservice } from '../../core/services/bdservice.service';

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.scss'],
})
export class FacturacionComponent implements OnInit, OnDestroy {
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

  element: HTMLElement;
  listaClientes: any;
  propietario_factura: any;
  constructor(private mServ: ModalService, private dbServ: DBservice, private shServ: SharedService, private fb: FormBuilder, private route: ActivatedRoute) {
    this.form = this.fb.group({
      nombre: ['Cliente contado', Validators.required],
      direccion: ['Autopista duarte KM 0 el Higuero', Validators.required],
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

    this.mServ.OBJDEVUELTO.subscribe(res => {
      if (res !== undefined && res.tipoModal === 'buscarCliente') {
        this.propietario_factura = res;
        console.log(this.propietario_factura);
      }
    });
    this.mServ.DECISIONMODAL.subscribe(res => {
      if (res !== undefined) {
        this.decisionModal(res);
      }
    });
    this.dbServ.getClientes().subscribe(res => {
      this.listaClientes = res;
    });
    this.enfocarInput('nom');
  }

  ngOnDestroy(): void {}
  getCalculos(arg) {
    this.TOTAL = arg.Total;
  }

  saltar(e, campo, nombre?) {
    if (campo === 'dir' && nombre !== null) {
      this.enfocarInput(campo);
    }

    if (campo === 'cod-0' && nombre !== null) {
      this.enfocarInput(campo);
    }
  }

  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.focus();
  }
  // =============================================
  //  MODAL PARA FILTRAR ARTICULOS
  // =============================================

  abrirModalFiltro() {
    this.mServ.modalTipo('buscarCliente');
    this.mServ.ModalSeleccion(this.listaClientes);
    this.mServ.mostrarModal(true);
  }

  cancelarFactura() {
    this.mServ.modalTipo('cancelar');
    this.abrirModal();
  }

  // =============================================
  //  MODAL PARA FILTRAR ARTICULOS
  // =============================================
  abrirModal(arg?) {
    if (arg) {
      this.mServ.ModalSeleccion(arg);
    }
    this.mServ.mostrarModal(true);
  }
  decisionModal(arg) {
    const decision = arg;
  }
}
