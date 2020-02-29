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
import { Subscription } from 'rxjs';

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
  subDeci: Subscription;
  @ViewChild(TablasComponent, { static: false }) tablas: TablasComponent;
  tipoModal: string;
  subObj: Subscription;
  subTipoF: Subscription;
  tipoFactura: any;
  lista_tipos_facturas: any;
  propietario_factura: any;
  constructor(private dbServ: DBservice, private route: ActivatedRoute, private mServ: ModalService, private _ipc: IpcService) {}

  ngOnInit() {
    this.fecha = moment().format('DD/MM/YYYY');
    this.idFactura = this.route.snapshot.params['id'];
    this.tipoNota = this.route.snapshot.params['tipo'];
    if (this.tipoNota === 'credito') {
      this.tituloPag = 'Nota de crédito aplicada a factura ';
      this.tipoFactura = '04';
    } else {
      this.tituloPag = 'Nota de débito aplicada a factura ';
      this.tipoFactura = '03';
    }
    this.necesarioStart();

    this.subDeci = this.mServ.DECISIONMODAL.subscribe(res => {
      if (res !== null && res !== undefined) {
        this.decisionModal(res);
      }
    });

    this.subTipoF = this.dbServ.getTiposFacturas().subscribe(res => {
      this.lista_tipos_facturas = res;
    });
    this.subObj = this.mServ.OBJDEVUELTO.subscribe(res => {
      if (res && res.tipoModal === 'cambio') {
        this.decisionModal(res);
      }
    });
  }

  ngOnDestroy(): void {
    this.subDeci.unsubscribe();
    this.subObj.unsubscribe();
    this.subTipoF.unsubscribe();
  }

  async necesarioStart() {
    await this.getFactura();
    this.factura_aplicada = this.factura.numero_comprobante;
    await this.formarTitulosTabla();
    await this.getPropietario(this.factura.cliente_id);
  }
  async getPropietario(id) {
    console.log(id);

    if (id) {
      try {
        console.log('entro');

        this.propietario_factura = await this.dbServ.getClienteById(id).toPromise();
        console.log(this.propietario_factura);
      } catch (error) {
        console.error(error);
      }
    } else {
      console.log('entro');
      this.propietario_factura;
    }
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
      arg.tipo__ = this.tipoNota;
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

  async decisionModal(res) {
    console.log(this.detalleFacturas);
    const temp = [];
    if (res) {
      for (let i = 0; i < this.detalleFacturas.length; i++) {
        const element = this.detalleFacturas[i];
        if (element.select) {
          temp.push(element);
        }
      }
      console.log(temp);
    }

    const empleado = JSON.parse(this.dbServ.getEmpleado());
    const TipoFact = this.lista_tipos_facturas.filter(tipo => tipo.referencia === this.tipoFactura);

    const cuerpo_fact = GLOBAL.duplicarJson(temp);

    const cabecera_fact = {};
    cabecera_fact['condicion'] = 'contado';
    cabecera_fact['forma_pago'] = 'efectivo';
    cabecera_fact['fecha_facturacion'] = null;
    // cabecera_fact['fecha_vencimiento'] = moment(new Date())
    //   .add(this.propietario_factura.limite_credito, 'days')
    //   .format('DD/MM/YYYY');

    cabecera_fact['pagada'] = true;
    cabecera_fact['balance'] = 0;
    cabecera_fact['devuelta'] = this.TOTAL * -1;

    cabecera_fact['fecha_valida'] = moment(new Date())
      .add(1, 'year')
      .format('DD/MM/YYYY');

    cabecera_fact['adelantada'] = false;
    cabecera_fact['numero_comprobante'] = null;
    cabecera_fact['costoYgasto'] = null;
    cabecera_fact['numero_factura'] = null;
    cabecera_fact['total_factura'] = GLOBAL.redondearAdos(this.TOTAL);
    cabecera_fact['Bruto'] = 0;
    cabecera_fact['itbis'] = 0;
    cabecera_fact['descuento'] = 0;
    cabecera_fact['estado'] = true;
    cabecera_fact['tipo_factura_id'] = TipoFact[0].id;
    cabecera_fact['is_nota'] = true;

    if (this.factura.cliente_id === null) {
      cabecera_fact['cliente_id'] = null;
      cabecera_fact['NoCliente_nombre'] = this.factura.cliente.nombre;
      cabecera_fact['NoCliente_direccion'] = this.factura.cliente.direccion;
    } else {
      cabecera_fact['cliente_id'] = this.factura.cliente_id;
    }

    cabecera_fact['detalle_facturas_attributes'] = cuerpo_fact;
    cabecera_fact['FACTURA_DE'] = null;
    cabecera_fact['tipo'] = 'nota_' + this.tipoNota;
    cabecera_fact['user_id'] = empleado.id;

    if (this.propietario_factura.vendedor_id) {
      cabecera_fact['vendedor_id'] = this.propietario_factura.vendedor_id;
    }
    console.log(cabecera_fact);

    // this.dbServ.createFacturas(cabecera_fact).subscribe(
    //   res => {
    //     console.log(res);
    //     this._ipc.on('printRes', (event: Electron.IpcMessageEvent, res) => {
    //       console.log('printRes=====> ', res);

    //       if (res.status) {
    //         this.CancelarFactura();
    //         this.GetArticulos();
    //         this.dbServ.toastSuccess(res.msg, 'CORRECTO');
    //       } else {
    //         this.dbServ.toastError(res.msg + '   ERROR: ' + res.err, 'ERROR');
    //       }
    //     });
    //     res['FACTURA_DE'] = this.metodo;
    //     // this._ipc.send('print', res);
    //   },
    //   err => {
    //     this.dbServ.toastError(err.statusText, 'ERROR');
    //   },
    // );
  }
}
