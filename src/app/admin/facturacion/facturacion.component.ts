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
import { map } from 'rxjs/operators';
import * as _ from 'lodash';

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
  tipos_facturas = ['01', '02', '03', '04', '11', '12', '13', '14', '15', '16', '17'];

  public TiposFacturas: string =
    '<div style=" max-width: 21rem;" ><span>01 Valor fiscal</span><br><span>02 Factura de consumo</span><br><span>03 Nota de debito</span><br><span>04 Nota de credito</span><br><span>11 Comprobante de compras</span><br><span>12 Registro de unico ingreso</span><br> <span>13 Comprobante para gastos menores</span><br> <span>14 Comprobante de regimen especiales</span><br> <span>15 Comprobante gubernamental</span><br> <span>16 Comprobante para exportaciones</span><br> <span>17 Comprobantes para pago al exterior</span><br></div>';
  showTipos: boolean;
  tipoFactura: any;
  CuerpoPactura = [];
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
        this.form.patchValue(this.propietario_factura);
        this.enfocarInput('cod-0');
      }
    });
    this.mServ.DECISIONMODAL.subscribe(res => {
      if (res !== undefined) {
        this.decisionModal(res);
      }
    });
    this.dbServ
      .getClientes()
      .pipe(
        map(
          cliente =>
            (cliente = cliente.map(cli => {
              cli.documentos_de_identidad.map(docu => {
                if (docu.principal) {
                  cli.documento_identidad = docu.documento;
                }
              });

              return cli;
            })),
        ),
      )
      .subscribe(res => {
        this.listaClientes = res;
      });
    setTimeout(() => {
      this.enfocarInput('tipoFact');
    }, 5);
  }

  ngOnDestroy(): void {}
  getCalculos(arg) {
    this.TOTAL = arg.Total;
  }

  verTipos() {
    this.showTipos = false;
  }
  ocultarTipos() {
    this.showTipos = true;
  }

  saltar(campo, valor?) {
    if (campo === 'condicion') {
      if (this.tipos_facturas.includes(valor)) {
        this.tipoFactura = valor;
        this.enfocarInput(campo);
      } else {
        this.dbServ.toastError('El tipo de factura introducido es incorrecto.', 'ERROR');
      }
    }
    if (campo === 'nom') {
      this.enfocarInput(campo);
    }
    if (campo === 'dir' && valor !== null) {
      this.enfocarInput(campo);
    }

    if (campo === 'cod-0' && valor !== null) {
      this.enfocarInput(campo);
      this.propietario_factura = {
        nombre: this.form.controls.nombre.value,
        direccion: this.form.controls.direccion.value,
        telefono: this.form.controls.telefono.value,
      };
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

  // =============================================
  //  MODAL CANCELAR
  // =============================================
  cancelarFactura() {
    this.mServ.modalTipo('cancelar');
    this.tipoModal = 'cancelar';
    this.abrirModal();
  }
  // =============================================
  //  MODAL IMPRIMIR
  // =============================================
  imprimirFactura() {
    this.mServ.modalTipo('imprimir');
    this.tipoModal = 'imprimir';
    this.abrirModal();
  }

  abrirModal(arg?) {
    if (arg) {
      this.mServ.ModalSeleccion(arg);
    }
    this.mServ.mostrarModal(true);
  }
  decisionModal(arg) {
    if (arg) {
      if (this.tipoModal === 'imprimir') {
        this.IMPRIMIR();
      }
    }
    this.tipoModal = '';
  }

  // =============================================
  //  OBTENER LA DATA DEL CUERPO
  // =============================================

  isPart(obj) {
    const x = _.findIndex(this.CuerpoPactura, o => {
      return o.tot === obj.tot;
    });

    return x;
  }
  getCuerpoFactura(arg) {
    const obj = JSON.parse(arg);
    obj.forEach(fila => {
      if (fila.tot !== null) {
        console.log(fila);
        console.log(this.isPart(fila));
        const index = this.isPart(fila);

        if (this.isPart(fila) === -1) {
          if (this.CuerpoPactura[index] && this.CuerpoPactura[index].cod !== fila.cod) {
            this.CuerpoPactura.push(fila);
          }
        } else {
          // const index = this.isPart(fila);
          if (this.CuerpoPactura[index].tot !== fila.tot) {
            this.CuerpoPactura[index] = fila;
          }
        }
      }
    });
  }

  IMPRIMIR() {
    console.log(this.CuerpoPactura);
  }
}
