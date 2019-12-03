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
import { map, filter } from 'rxjs/operators';
import * as _ from 'lodash';
import { ObservableServcie } from '../../core/services/observables.service';
import { PdfService } from '../../core/services/pdf.service';

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.scss'],
})
export class FacturacionComponent implements OnInit, OnDestroy {
  form: FormGroup;
  numFac = 0;
  fecha;

  ITBIS = 0;
  seleccionModal: any;
  showModal = false;
  modalSearch: boolean;
  control: any;
  rowActual: any;
  drop: boolean;
  UnidadesArticulo: any[];
  tipoModal: string;
  condicion_fact = 'Contado';
  numeroComprobante;
  forma_pago = 'Efectivo';
  element: HTMLElement;
  listaClientes: any;
  propietario_factura;
  // propietario_factura = {
  //   id: 1,
  //   nombre: 'Cliente contado',
  //   direccion: 'Autopista duarte KM 0 el Higuero',
  //   telefono: null,
  // };
  tipos_facturas = ['00', '01', '02', '03', '04', '11', '12', '13', '14', '15', '16', '17'];

  public TiposFacturas: string =
    '<div style=" max-width: 21rem;" ><span>00 Factura sin comprobante</span><br><span>01 Valor fiscal</span><br><span>02 Factura de consumo</span><br><span>03 Nota de debito</span><br><span>04 Nota de credito</span><br><span>11 Comprobante de compras</span><br><span>12 Registro de unico ingreso</span><br> <span>13 Comprobante para gastos menores</span><br> <span>14 Comprobante de regimen especiales</span><br> <span>15 Comprobante gubernamental</span><br> <span>16 Comprobante para exportaciones</span><br> <span>17 Comprobantes para pago al exterior</span><br></div>';

  showTipos: boolean;
  tipoFactura: any;
  CuerpoFactura = [];
  DESCUENTO = 0;
  BRUTO = 0;
  TOTAL = 0;
  lista_tipos_facturas: any;
  lista_secuencia_facturas: any;
  secuenciaVenta: any;
  constructor(
    private mServ: ModalService,
    private obsServ: ObservableServcie,
    private dbServ: DBservice,
    private shServ: SharedService,
    private fb: FormBuilder,
    private pdfServ: PdfService,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      id: [1],
      nombre: ['Cliente contado', Validators.required],
      direccion: ['Autopista duarte KM 0 el Higuero', Validators.required],
      telefono: [],
    });
  }

  // formatoNumerosMasCero(num) {
  //   return _.padStart(num.toString(), 8, '0');
  // }
  // formatearComprobante(ref) {
  //   let num = 1572;

  //   const objTipoFact = this.lista_tipos_facturas.filter(tipo => tipo.referencia === ref);

  //   const objSecuenciaFact = this.lista_secuencia_facturas.filter(secu => secu.tipo_factura_id === objTipoFact[0].id);

  //   num = objSecuenciaFact[0].secuencia;
  //   if (ref === '00') {
  //     this.numeroComprobante = null;
  //   } else {
  //     this.numeroComprobante = 'B' + ref + this.formatoNumerosMasCero(num);
  //   }
  // }

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
        console.log(res);

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

    this.obsServ.TIPOS_FACTURAS.subscribe(res => {
      if (res !== undefined) {
        console.log('tipos');

        console.log(res);
        console.log('==================');
        this.lista_tipos_facturas = res;
      }
    });
    this.obsServ.SECUENCIA_FACTURAS.subscribe(res => {
      if (res !== undefined) {
        this.lista_secuencia_facturas = res;
        console.log('secuencia');

        console.log(res);

        console.log('==================');
        this.secuenciaVenta = res.filter(secu => secu.tipo_factura_id === 13);
        this.numFac = this.secuenciaVenta[0].secuencia;
      }
    });
  }

  ngOnDestroy(): void {}
  getCalculos(arg) {
    this.TOTAL = arg.Total;
    this.calcularBruto();
  }
  getDescuento(arg) {
    this.DESCUENTO = arg;
    this.calcularBruto();
  }

  calcularBruto() {
    setTimeout(() => {
      this.BRUTO = this.TOTAL + this.DESCUENTO;
    }, 5);
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
        // this.formatearComprobante(valor);
        this.enfocarInput(campo);
      } else {
        this.dbServ.toastError('El tipo de factura introducido es incorrecto.', 'ERROR');
      }
    }
    if (campo === 'nom' || campo === 'pago') {
      this.enfocarInput(campo);
    }
    if (campo === 'dir' && valor !== null) {
      this.enfocarInput(campo);
    }

    if (campo === 'cod-0' && valor !== null) {
      if (this.condicion_fact !== 'Credito' && !this.propietario_factura) {
        this.enfocarInput(campo);
        const cliente = this.listaClientes.filter(cli => cli.nombre === 'Cliente contado');
        this.propietario_factura = cliente[0];
      } else {
        this.dbServ.toastWarning('Para facturar a credito debe de seleccionar un cliente', 'Aviso');
      }
    }
  }

  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.focus();
  }
  // =============================================
  //  MODAL PARA FILTRAR CLIENTES
  // =============================================

  abrirModalFiltro() {
    this.quitarContadoDeLista();
    this.mServ.modalTipo('buscarCliente');
    this.mServ.ModalSeleccion(this.listaClientes);
    this.mServ.mostrarModal(true);
  }

  quitarContadoDeLista() {
    const temp = JSON.parse(JSON.stringify(this.listaClientes));
    this.listaClientes = [];
    const cliente = temp.filter(cli => cli.nombre === 'Cliente contado');
    const index = _.indexOf(temp, cliente[0]);

    _.pullAt(temp, index);
    this.listaClientes = temp;
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
    const x = _.findIndex(this.CuerpoFactura, o => {
      return o.des === obj.des;
    });

    return x;
  }

  getCuerpoFactura(arg) {
    this.CuerpoFactura = [];
    const obj = JSON.parse(arg);

    this.CuerpoFactura = obj;
    console.log(this.CuerpoFactura);
  }

  p() {}

  IMPRIMIR() {
    if (!this.propietario_factura) {
      this.dbServ.toastWarning('Factura no tiene cliente', 'Aviso');
    } else {
      const empleado = JSON.parse(this.dbServ.getEmpleado());
      const TipoFact = this.lista_tipos_facturas.filter(tipo => tipo.referencia === this.tipoFactura);

      const cuerpo_fact = JSON.parse(JSON.stringify(this.CuerpoFactura));

      const cabecera_fact = {};
      cabecera_fact['condicion'] = this.condicion_fact;
      cabecera_fact['forma_pago'] = this.forma_pago;
      cabecera_fact['fecha_facturacion'] = null;
      if (this.condicion_fact === 'Credito') {
        cabecera_fact['fecha_vencimiento'] = moment(new Date())
          .add(this.propietario_factura.limite_credito, 'days')
          .format('DD/MM/YYYY');
      }

      cabecera_fact['fecha_valida'] = moment(new Date())
        .add(1, 'year')
        .format('DD/MM/YYYY');

      cabecera_fact['numero_comprobante'] = null;
      cabecera_fact['numero_factura'] = null;
      cabecera_fact['total_factura'] = this.TOTAL;
      cabecera_fact['itbis'] = this.ITBIS;
      cabecera_fact['descuento'] = this.DESCUENTO;
      cabecera_fact['estado'] = true;
      cabecera_fact['tipo_factura_id'] = TipoFact[0].id;
      cabecera_fact['cliente_id'] = this.propietario_factura.id;

      cabecera_fact['detalle_facturas_attributes'] = cuerpo_fact;
      cabecera_fact['FACTURA_DE'] = 13;
      cabecera_fact['tipo'] = 'venta';
      cabecera_fact['user_id'] = empleado.id;
      this.dbServ.createFacturas(cabecera_fact).subscribe(res => {
        console.log(res);
        console.log(this.pdfServ.cabeceraFacturaVenta(res));
      });
      // console.log(cabecera_fact);
    }
  }
}
