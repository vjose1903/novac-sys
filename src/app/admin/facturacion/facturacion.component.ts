import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { ModalService } from '../../components/modal/modal.service';
import { DBservice } from '../../core/services/bdservice.service';
import { map, filter } from 'rxjs/operators';
import * as _ from 'lodash';
import { ObservableServcie } from '../../core/services/observables.service';
import { PdfService } from '../../core/services/pdf/pdf.service';
import { IpcService } from '../../core/services/ipc.service';

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
  DESCUENTO = 0.0;
  BRUTO = 0.0;
  TOTAL: number = 0.0;
  lista_tipos_facturas: any;
  lista_secuencia_facturas: any;
  secuenciaVenta: any;
  constructor(
    private _ipc: IpcService,
    private mServ: ModalService,
    private obsServ: ObservableServcie,
    private dbServ: DBservice,
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

  redondearAdos(num) {
    return (Math.round(num * 100) / 100).toFixed(2);
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
    this.fecha = moment().format('DD/MM/YYYY');

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
        this.lista_tipos_facturas = res;
      }
    });
    this.obsServ.SECUENCIA_FACTURAS.subscribe(res => {
      if (res !== undefined) {
        this.lista_secuencia_facturas = res;
        this.secuenciaVenta = res.filter(secu => secu.tipo_factura_id === 13);
        this.numFac = this.secuenciaVenta[0].secuencia;
      }
    });
  }

  ngOnDestroy(): void {}
  getCalculos(arg) {
    console.log('calculos');

    this.TOTAL = parseFloat(arg.Total);

    console.log(arg.Total);
    console.log(this.TOTAL);
    this.calcularBruto();
  }
  getDescuento(arg) {
    console.log('descuento');

    this.DESCUENTO = parseFloat(arg);
    console.log(arg);
    console.log(this.DESCUENTO);

    this.calcularBruto();
  }

  calcularBruto() {
    setTimeout(() => {
      const calculo = this.TOTAL + this.DESCUENTO;
      console.log('============');
      console.log('  CALCULO');
      console.log('============');

      console.log(calculo);
      console.log('============');

      this.BRUTO = calculo;
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
      if (this.condicion_fact !== 'Crédito') {
        this.enfocarInput(campo);

        // if(this.form.value)
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
  }

  p() {}

  prueba() {
    const factCre = {
      id: 4,
      tipo_factura_id: 2,
      suplidor_id: null,
      cliente_id: 2,
      user_id: 1,
      fecha_facturacion: '2019-12-08',
      fecha_vencimiento: '2020-01-07',
      fecha_valida: '2020-12-08',
      numero_comprobante: 'B0100000001',
      numero_factura: 4,
      condicion: 'Crédito',
      forma_pago: 'Efectivo',
      total_factura: 7492.5,
      itbis: 0.0,
      descuento: 0.0,
      estado: true,
      tipo: 'venta',
      created_at: '2019-12-08T18:33:55.439Z',
      updated_at: '2019-12-08T18:33:55.439Z',
      Bruto: 7492.5,
      detalle_facturas: [
        {
          descripcion: 'maiz (25 LBS)',
          unidad: 'Saco',
          precio: 999.99,
          total: 499,
          descuento: 0,
          itbis: 0,
          cantidad: 2,
        },
        {
          descripcion: 'maiz (100 LBS)',
          unidad: 'Saco',
          precio: 999.99,
          total: 6993,
          descuento: 0,
          itbis: 0,
          cantidad: 7,
        },
      ],
      cliente: {
        nombre: 'marcos',
        direccion: 'la vega centro de la ciudad\n',
        rnc: '047-0144534-5',
      },
      suplidor: null,
      tipo_factura: 'Factura con valor fiscal',
    };
    const factCon = {
      id: 15,
      tipo_factura_id: 3,
      suplidor_id: null,
      cliente_id: 1,
      user_id: 1,
      fecha_facturacion: '2019-12-11',
      fecha_vencimiento: null,
      fecha_valida: '2020-12-11',
      numero_comprobante: 'B0200000011',
      numero_factura: 17,
      condicion: 'Contado',
      forma_pago: 'Efectivo',
      total_factura: 2497.5,
      itbis: 0.0,
      descuento: 0.0,
      estado: true,
      tipo: 'venta',
      created_at: '2019-12-11T12:39:38.318Z',
      updated_at: '2019-12-11T12:39:38.318Z',
      Bruto: 2497.5,
      detalle_facturas: [
        {
          descripcion: 'maiz (50 LBS)',
          unidad: 'Saco',
          precio: 999.99,
          total: 2497,
          descuento: 0,
          itbis: 0,
          cantidad: 5,
        },
      ],
      cliente: {
        nombre: 'Cliente contado',
        direccion: 'Autopista duarte KM 0 el Higuero',
        rnc: '',
      },
      suplidor: null,
      tipo_factura: 'Factura de consumo',
    };

    this._ipc.on('testRes', (event: Electron.IpcMessageEvent, res) => {
      console.log(res);
    });
    const Fact = this.pdfServ.makeFacturaVenta(factCre);
    console.log(Fact);

    // this.pdfServ.makeFacturaVenta(factCon);
    console.log('presion');

    this._ipc.send('test', factCre)
  }

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
      if (this.condicion_fact === 'Crédito') {
        cabecera_fact['fecha_vencimiento'] = moment(new Date())
          .add(this.propietario_factura.limite_credito, 'days')
          .format('DD/MM/YYYY');
      }

      cabecera_fact['fecha_valida'] = moment(new Date())
        .add(1, 'year')
        .format('DD/MM/YYYY');

      cabecera_fact['numero_comprobante'] = null;
      cabecera_fact['numero_factura'] = null;
      cabecera_fact['total_factura'] = this.redondearAdos(this.TOTAL);
      cabecera_fact['Bruto'] = this.redondearAdos(this.BRUTO);
      cabecera_fact['itbis'] = this.redondearAdos(this.ITBIS);
      cabecera_fact['descuento'] = this.redondearAdos(this.DESCUENTO);
      cabecera_fact['estado'] = true;
      cabecera_fact['tipo_factura_id'] = TipoFact[0].id;

      if (this.propietario_factura.id === 1) {
        cabecera_fact['cliente_id'] = null;
        cabecera_fact['NoCliente_nombre'] = this.form.controls.nombre.value;
        cabecera_fact['NoCliente_direccion'] = this.form.controls.direccion.value;
      } else {
        cabecera_fact['cliente_id'] = this.propietario_factura.id;
      }

      cabecera_fact['detalle_facturas_attributes'] = cuerpo_fact;
      cabecera_fact['FACTURA_DE'] = 13;
      cabecera_fact['tipo'] = 'venta';
      cabecera_fact['user_id'] = empleado.id;

      // console.log(cabecera_fact);

      this.dbServ.createFacturas(cabecera_fact).subscribe(res => {
        // this.pdfServ.makeFacturaVenta(res);
        console.log(res);
        
      });
    }
  }
}
