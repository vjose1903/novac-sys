import { Component, OnInit, Input, ViewChild } from '@angular/core';

import * as _ from 'lodash';
import * as moment from 'moment';
import { GLOBAL } from '../../../core/services/GLOBAL';
import { DBservice } from '../../../core/services/bdservice.service';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { TablasComponent } from '../../../components/tablas/tablas.component';
import { ModalService } from '../../../components/modal/modal.service';
import { IpcService } from '../../../core/services/ipc.service';

@Component({
  selector: 'app-notas-cred-deb',
  templateUrl: './notas-cred-deb.component.html',
  styleUrls: ['./notas-cred-deb.component.scss'],
})
export class NotasCredDebComponent implements OnInit {
  factura;
  idFactura: any;
  tipoNota: any;
  tituloPag = '';
  factura_aplicada;
  tipos = {
    credito: 'crédito',
    debito: 'débito',
  };
  fecha: string;
  TOTAL = 0;

  info = [];
  detalleFacturas: any;
  detalleNota = [];
  @ViewChild(TablasComponent, { static: false }) tablas: TablasComponent;
  tipoModal: string;
  constructor(private dbServ: DBservice, private route: ActivatedRoute, private mServ: ModalService, private _ipc: IpcService) {}

  ngOnInit() {
    this.fecha = moment().format('DD/MM/YYYY');
    this.idFactura = this.route.snapshot.params['id'];
    this.tipoNota = this.route.snapshot.params['tipo'];
    if (this.tipoNota === 'credito') {
      this.tituloPag = 'Nota de crédito aplicada a factura ';
    } else {
      this.tituloPag = 'Nota de débito aplicada a factura ';
    }
    this.necesarioStart();
  }
  async necesarioStart() {
    await this.getFactura();
    this.factura_aplicada = this.factura.numero_comprobante;
    await this.formarTitulosTabla();
  }
  formarTitulosTabla() {
    this.info = [
      {
        titulo: 'Seleccione',
        tipo: 'check',
        key: 'select',

        disable: {
          getDisabled: false,
          campo: '',
        },
        title: '',
        customClass: true,
        estilos: [{ width: '5.5rem' }],
      },
      {
        titulo: 'Articulo',
        key: 'descripcion',
      },
      {
        titulo: this.tipoNota === 'credito' ? 'Devolver' : 'Aumentar',
        key: 'cant_nota',
        formatoNumero: true,
        tipo: 'input',
        inputType: 'number',
        disable: {
          getDisabled: true,
          campo: 'select',
        },
        customClass: true,
        estilos: [{ width: '5.5rem' }],
      },
      {
        titulo: 'Cantidad',
        key: 'cantidad',
        formatoNumero: true,
      },
      {
        titulo: 'Unidad',
        key: 'unidad',
      },
      {
        titulo: 'Precio',
        key: 'precio',
        formatoNumero: true,
      },
      {
        titulo: 'Total Facturado',
        key: 'total',
        formatoNumero: true,
      },
      {
        titulo: 'Total nota',
        key: 'total_nota',
        tipo: 'input',
        disable: {
          getDisabled: true,
        },
        customClass: true,
        estilos: [{ width: '12rem' }],
      },
    ];
  }

  async getFactura() {
    try {
      this.factura = await this.dbServ.getFacturaById(this.idFactura).toPromise();
      const temp = [];
      for (let i = 0; i < this.factura.detalle_facturas.length; i++) {
        const detalle = this.factura.detalle_facturas[i];
        detalle['select'] = false;
        detalle['cant'] = detalle.cantidad;
        detalle['cant_nota'] = 0;

        if (this.tipoNota === 'credito') {
          detalle['min_'] = 0;
          detalle['max_'] = detalle.cantidad;
        } else {
          detalle['min_'] = 0;
          detalle['max_'] = null;
        }
        detalle['total_nota'] = 0;
        temp.push(detalle);
      }
      this.detalleFacturas = temp;
    } catch (error) {
      console.log(error);
      this.dbServ.toastError('Error mostrando factura elegida', 'ERROR');
    }
  }

  getIndexNota(id_) {
    return _.findIndex(this.detalleNota, { id: id_ });
  }
  async sumarTotal() {
    let total = 0;
    for (let i = 0; i < this.detalleNota.length; i++) {
      const detalle = this.detalleNota[i];
      const cantidad = detalle.cant_nota;

      if (this.tipoNota === 'credito') {
        total += cantidad * detalle.precio * -1;
      } else {
        total += cantidad * detalle.precio;
      }

      console.log('>>>> ', total);
    }
    this.TOTAL = total;
  }

  async getInfoChange(info) {
    const entidad = info.body[info.index];
    entidad.cant_nota = parseFloat(entidad.cant_nota);
    if (info.cambio === 'cant_nota') {
      if (this.tipoNota === 'credito') {
        if (entidad.cant_nota > entidad.cant) {
          this.dbServ.toastError('Nota de crédito no puede ser mayor a la factura original', 'ERROR');
          this.tablas.enfocarInput('inputNu-' + info.index);
          setTimeout(() => {
            this.tablas.resetInput('cant', 'cant_nota', info.index, false);
          }, 5);
        } else if (isNaN(entidad.cant_nota)) {
          this.tablas.resetInput('especificar', 'cant_nota', info.index, false, 0);
          this.tablas.resetInput('especificar', 'total_nota', info.index, false, 0);
          this.sumarTotal();
        } else {
          this.sumarTotal();
          const total = entidad.cant_nota * entidad.precio;
          entidad.total_nota = this.formatoNumero(total);
        }
      } else {
        if (isNaN(entidad.cant_nota)) {
          this.tablas.resetInput('especificar', 'cant_nota', info.index, false, 0);
          this.tablas.resetInput('especificar', 'total_nota', info.index, false, 0);
        }
        this.sumarTotal();
        const total = entidad.cant_nota * entidad.precio;
        entidad.total_nota = this.formatoNumero(total);
      }
    }

    if (info.cambio === 'select') {
      if (!info.value) {
        this.detalleFacturas[info.index].select = false;
        this.tablas.resetInput('especificar', 'cant_nota', info.index, false, 0);
        this.tablas.resetInput('especificar', 'total_nota', info.index, false, 0);

        const i = this.detalleNota.indexOf(info.body[info.index]);
        _.pullAt(this.detalleNota, i);

        this.sumarTotal();
      } else {
        this.detalleFacturas[info.index].select = true;
        this.detalleNota.push(info.body[info.index]);
      }
    }
  }

  formatoNumero(num) {
    return GLOBAL.formatearNumero(GLOBAL.redondearAdos(num));
  }
  formatoNumeroFactura(num) {
    return _.padStart(num, 8, '0');
  }
  formatoFecha(fecha) {
    return moment(fecha).format('DD/MM/YYYY');
  }
  abrirModal(arg?) {
    if (arg) {
      this.mServ.ModalSeleccion(arg);
    }
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
    if (this.detalleNota.length === 0) {
      this.dbServ.toastWarning('Nota de ' + this.tipoNota + ' no puede estar vacía.', 'Aviso');
    } else {
      if (this.TOTAL === 0) {
        this.dbServ.toastWarning('Total de la nota de ' + this.tipoNota + ' no puede ser 0.', 'Aviso');
      } else {
        const obj = { total_factura: this.TOTAL, devuelta: 0 };
        this.mServ.modalTipo('cambio');
        this.tipoModal = 'cambio';
        this.abrirModal(obj);
      }
    }
  }
}
