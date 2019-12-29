import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
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
import { CuerpoFacturaComponent } from './cuerpo-factura/cuerpo-factura.component';

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.scss'],
})
export class FacturacionComponent implements OnInit, OnDestroy {
  form: FormGroup;
  fecha;

  ITBIS = 0;
  seleccionModal;
  showModal = false;
  modalSearch: boolean;
  control;
  rowActual;
  drop: boolean;
  UnidadesArticulo = [];
  tipoModal: string;
  condicion_fact = 'Contado';
  forma_pago = 'Efectivo';
  element: HTMLElement;
  listaClientes;
  propietario_factura;
  tipos_facturas = [];
  public TiposFacturas: string;
  showTipos: boolean;
  tipoFactura;
  CuerpoFactura = [];
  DESCUENTO = 0.0;
  BRUTO = 0.0;
  TOTAL = 0.0;
  lista_tipos_facturas;
  lista_secuencia_facturas;
  NCFcompra;
  CostoYgasto = '';
  @ViewChild(CuerpoFacturaComponent, { static: true }) cuerpo: CuerpoFacturaComponent;
  metodo: any;
  labelSearch: string;
  listaSuplidores: any;
  TiposCostosGastos: string;
  tipos_costosYgastos: string[];
  medidas = {
    Libra: 'Libras',
    Quintal: 'Quintales',
    Caja: 'Cajas',
    Paquete: 'Paquetes',
    Unidad: 'Unidades',
  };
  ncfMask = [/b/, /[0-9]/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/];
  listaArticulos: any;
  usuario: any;

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
      id: [],
      nombre: [],
      direccion: [],
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
    const string = num + '';
    const splitStr = _.split(string, '.');
    const enteros = splitStr[0];
    let tempdecimales = splitStr[1];
    if (splitStr.length === 1) {
      tempdecimales = '00';
    }

    const decimales = tempdecimales.substring(0, 2);
    const Arreglo = [enteros, decimales];
    const numStr = _.join(Arreglo, '.');
    return parseFloat(numStr).toFixed(2);
    // return (Math.round(num * 100) / 100).toFixed(2);
  }

  desformatear(sTnum) {
    let temp = 0;

    if (sTnum !== null) {
      if (sTnum !== undefined) {
        const x = sTnum.split(',');
        if (x.length === 1) {
          temp += parseFloat(x[0]);
          return temp;
        } else if (x.length >= 2) {
          let joined = '';
          joined = _.join(x, '');
          temp += parseFloat(joined);

          return temp;
        }
      }
    } else {
      return sTnum;
    }
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
    this.usuario = JSON.parse(this.dbServ.getEmpleado());
    this.GetArticulos();

    this.metodo = this.route.snapshot.params['tipo'];

    console.log(this.metodo);

    this.propietario_factura = null;

    if (this.metodo === 'venta') {
      this.tipoFactura = '02';
      this.TiposFacturas =
        '<div style=" max-width: 21rem;" > \
      <span>00 Factura sin comprobante</span><br>\
      <span>01 Valor fiscal</span><br>\
      <span>02 Factura de consumo</span><br>\
      <span>03 Nota de debito</span><br>\
      <span>04 Nota de credito</span><br>\
      <span>11 Comprobante de compras</span><br>\
      <span>12 Registro de unico ingreso</span><br>\
      <span>13 Comprobante para gastos menores</span><br>\
      <span>14 Comprobante de regimen especiales</span><br>\
      <span>15 Comprobante gubernamental</span><br>\
      <span>16 Comprobante para exportaciones</span><br>\
      <span>17 Comprobantes para pago al exterior</span><br>\
      </div>';
      this.tipos_facturas = ['00', '01', '02', '03', '04', '11', '12', '13', '14', '15', '16', '17'];
      this.labelSearch = 'Cliente';
      this.form.patchValue({
        id: 1,
        nombre: 'Cliente contado',
        direccion: 'Autopista duarte KM 0 el Higuero',
      });
    } else {
      this.tipoFactura = '01';
      this.TiposFacturas = '<div style=" max-width: 21rem;" > \
      <span>01 Valor fiscal</span><br>\
      <span>02 Factura de consumo</span><br>\
      </div>';

      this.TiposCostosGastos =
        '<div style=" max-width: 30rem; min-width: 30rem;" > \
      <span>1 Gastos de personal </span><br>\
      <span>2 Gastos de trabajos, suministros y servicios</span><br>\
      <span>3 Arrendamientos</span><br>\
      <span>4 Gastos de activos fijos</span><br>\
      <span>5 Gastos de representación</span><br>\
      <span>6 Gastos deducciones admitidas</span><br>\
      <span>7 Gastos financieros</span><br>\
      <span>8 Gastos extraordinarios</span><br>\
      <span>9 Compras y gastos que forman parte del costo de venta</span><br>\
      <span>10 Adquisiciones de activos</span><br>\
      <span>11 Gastos de Seguros</span><br>\
      </div>';
      this.tipos_facturas = ['01', '02'];
      this.tipos_costosYgastos = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
      this.labelSearch = 'Suplidor';
    }
    this.fecha = moment().format('DD/MM/YYYY');

    this.mServ.OBJDEVUELTO.subscribe(res => {
      if (res !== undefined && res !== null && res.tipoModal === 'buscarCliente') {
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

    if (this.metodo === 'compra') {
      this.dbServ
        .getSuplidores()
        .pipe(
          map(
            val =>
              (val = val.map(suplidor => {
                suplidor.documentos_de_identidad.map(docu => {
                  if (docu.principal) {
                    suplidor.documento_identidad = docu.documento;
                  }
                });
                suplidor.codigo = _.padStart(suplidor.id, 5, '0');
                return suplidor;
              })),
          ),
        )
        .subscribe(res => {
          this.listaSuplidores = JSON.parse(JSON.stringify(res));
        });
    } else {
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
    }

    setTimeout(() => {
      this.enfocarInput('tipoFact');
    }, 5);

    this.dbServ.getTiposFacturas().subscribe(res => {
      this.lista_tipos_facturas = res;
    });

    this.obsServ.SECUENCIA_FACTURAS.subscribe(res => {
      if (res !== undefined) {
        this.lista_secuencia_facturas = res;
        // this.secuenciaVenta = res.filter(secu => secu.tipo_factura_id === 13);
        // this.numFac = this.secuenciaVenta[0].secuencia;
      }
    });
  }
  ngOnDestroy(): void {
    this.mServ.ModalObj(null);
    this.mServ.modalTipo(null);
    this.mServ.ModalSeleccion(null);
    this.GetArticulos();
  }

  setWidthPop(bool, e) {
    e.select();
    if (bool) {
      document.documentElement.style.setProperty('--popInfo', '17rem');
    } else {
      document.documentElement.style.setProperty('--popInfo', '25rem');
    }
  }
  GetArticulos() {
    this.dbServ.getArticulos().subscribe(res => {
      res.sort((a, b) => {
        return a.id > b.id ? 1 : -1;
      });

      if (res !== undefined && res !== null) {
        console.log(res);

        this.listaArticulos = res;
      }
    });
  }
  getCalculos(arg) {
    this.TOTAL = parseFloat(arg.Total);

    this.calcularBruto();
  }
  getDescuento(arg) {
    this.DESCUENTO = parseFloat(arg);

    this.calcularBruto();
  }

  calcularBruto() {
    setTimeout(() => {
      const calculo = this.TOTAL + this.DESCUENTO;

      this.BRUTO = calculo;
    }, 5);
  }

  verTipos() {
    this.showTipos = false;
  }
  ocultarTipos() {
    this.showTipos = true;
  }
  validarRayaAbajo() {
    if (this.NCFcompra && this.NCFcompra !== null) {
      let char = '';
      let num = 0;
      for (let index = 0; index < this.NCFcompra.length; index++) {
        const c = this.NCFcompra.charAt(index);
        char = c;
        num = index;
      }

      if (num < 10 || char === '_') {
        return false;
      } else {
        return true;
      }
    }
  }

  saltar(campo, valor?) {
    if (campo === 'condicion') {
      if (this.tipos_facturas.includes(valor)) {
        this.tipoFactura = valor;
        this.NCFcompra = 'b' + valor;
        this.enfocarInput(campo);
      } else {
        this.dbServ.toastError('El tipo de factura introducido es incorrecto.', 'ERROR');
      }
    }
    if (campo === 'costo') {
      this.enfocarInput(campo);
    }
    if (campo === 'pago') {
      if (this.metodo === 'compra' && !this.tipos_costosYgastos.includes(valor)) {
        this.dbServ.toastError('El tipo de costo y gasto introducido es incorrecto.', 'ERROR');
      } else {
        this.CostoYgasto = valor;
        if (this.condicion_fact === 'Contado') {
          this.enfocarInput(campo);
        } else {
          if (this.metodo === 'venta') {
            this.enfocarInput('nom');
          } else {
            this.enfocarInput('ncf');
          }
        }
      }
    }
    if (campo === 'nom') {
      if (this.metodo === 'venta') {
        this.enfocarInput('nom');
      } else {
        this.enfocarInput('ncf');
      }
    }
    if (campo === 'filtro') {
      if (this.validarRayaAbajo()) {
        this.abrirModalFiltro();
      } else {
        this.dbServ.toastWarning('Numero de comprobante incorrecto', 'Aviso');
      }
    }

    if (campo === 'dir' && valor !== null) {
      this.enfocarInput(campo);
    }

    if (campo === 'cod-0' && valor !== null) {
      if (this.condicion_fact !== 'Crédito') {
        this.enfocarInput(campo);

        this.propietario_factura = this.form.value;
      } else {
        this.dbServ.toastWarning('Para facturar a credito debe de seleccionar un cliente', 'Aviso');
      }
    }
  }
  setCaretPosition(ctrl, pos) {
    // Modern browsers
    if (ctrl.setSelectionRange) {
      ctrl.focus();
      ctrl.setSelectionRange(pos, pos);

      // IE8 and below
    } else if (ctrl.createTextRange) {
      const range = ctrl.createTextRange();
      range.collapse(true);
      range.moveEnd('character', pos);
      range.moveStart('character', pos);
      range.select();
    }
  }
  pru() {
    const input = document.getElementById('ncf') as any;
    console.log('-------------');
    console.log(input.value.length);
    console.log('-------------');
  }
  trimEndNcf() {
    const input = document.getElementById('ncf') as any;
    const valor = input.value;

    this.setCaretPosition(input, input.value.length - 8);
    valor.substring(0, 3);
    input.value = valor;
  }

  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.focus();
  }

  // =============================================
  //  MODAL PARA FILTRAR CLIENTES & SUPLIDORES
  // =============================================

  abrirModalFiltro() {
    this.mServ.modalTipo('buscarCliente');
    if (this.metodo === 'venta') {
      this.quitarContadoDeLista();
      this.mServ.ModalSeleccion(this.listaClientes);
    } else {
      this.mServ.ModalSeleccion(this.listaSuplidores);
    }
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
    if (!this.propietario_factura) {
      this.dbServ.toastWarning('Factura no tiene cliente', 'Aviso');
    } else {
      if (this.CuerpoFactura.length === 0) {
        this.dbServ.toastWarning('Factura no tiene Articulos', 'Aviso');
      } else {
        this.mServ.modalTipo('imprimir');
        this.tipoModal = 'imprimir';
        this.abrirModal();
      }
    }
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
      } else if (this.tipoModal === 'cancelar') {
        this.CancelarFactura();
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
    console.log(obj);

    this.CuerpoFactura = obj;
  }

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

    this._ipc.on('printRes', (event: Electron.IpcMessageEvent, res) => {
      console.log(res);
    });
    this._ipc.send('test', factCon);
  }

  CancelarFactura() {
    this.propietario_factura = null;
    this.NCFcompra = null;
    this.CostoYgasto = null;
    this.mServ.ModalObj(null);
    this.mServ.modalTipo(null);
    this.mServ.ModalSeleccion(null);

    if (this.metodo === 'venta') {
      this.form.patchValue({
        id: 1,
        nombre: 'Cliente contado',
        direccion: 'Autopista duarte KM 0 el Higuero',
        telefono: null,
      });
      this.tipoFactura = '02';
    } else {
      this.tipoFactura = '01';
      this.form.patchValue({
        id: null,
        nombre: null,
        direccion: null,
        telefono: null,
      });
    }

    this.CuerpoFactura = [];

    this.DESCUENTO = 0.0;
    this.BRUTO = 0.0;
    this.TOTAL = 0.0;
    this.condicion_fact = 'Contado';
    this.forma_pago = 'Efectivo';
    this.rowActual = undefined;
    this.ITBIS = 0;
    this.cuerpo.RESETCUERPO();
    this.enfocarInput('tipoFact');
  }
  calculatePrice(costo): number {
    if (costo > 0 || costo != null || costo) {
      const precio = costo / 0.9;
      return this.desformatear(this.redondearAdos(precio));
    }
  }

  calculoMedidaprincipal(roundArticulo, costoRow, precioRow, contenido_articulo, newArticulo) {
    if (roundArticulo !== costoRow) {
      let cantPadre;
      let cantHijo;
      const tempContenido = [];

      precioRow = this.calculatePrice(costoRow);

      contenido_articulo.forEach(contenido => {
        let temporal = contenido;
        if (!contenido.referencia) {
          if (contenido.precio) {
            cantPadre = contenido.cantidad;
            const precio = this.calcularNuevosPrecios(cantPadre, precioRow);
            const costo = this.calcularNuevosPrecios(cantPadre, costoRow);
            temporal.precio = this.desformatear(precio);
            temporal.costo = this.desformatear(costo);
          }
        } else {
          if (contenido.precio) {
            cantHijo = contenido.cantidad;
            const prePadre = this.calcularNuevosPrecios(cantPadre, precioRow);
            const cosPadre = this.calcularNuevosPrecios(cantPadre, costoRow);
            const precio = this.calcularNuevosPrecios(cantHijo, this.redondearAdos(prePadre));
            const costo = this.calcularNuevosPrecios(cantHijo, this.redondearAdos(cosPadre));
            temporal.precio = this.desformatear(precio);
            temporal.costo = this.desformatear(costo);
          } else {
            temporal = null;
          }
        }
        if (temporal !== null) {
          const tempu = _.omit(temporal, ['created_at', 'updated_at']);
          tempContenido.push(tempu);
        }
      });

      newArticulo.costo_principal = costoRow;
      newArticulo.precio_principal = precioRow;
      newArticulo.contenido_articulos_attributes = tempContenido;
      newArticulo.user_id = this.usuario.id;

      const tempEnviar = _.omit(newArticulo, ['created_at', 'updated_at', 'contenido_articulos']);
      console.log(tempEnviar);

      this.dbServ.editarArticulo(tempEnviar).subscribe(
        res => {},
        err => {
          console.log(err);
          this.mostrarErrores(err.error);
        },
      );
    }
  }

  revisarPrecios(cuerpoFact) {
    const tempCuerpo = [];

    cuerpoFact.forEach(row => {
      const Articulo = this.listaArticulos.filter(art => art.id === row.articulo_id);

      const articulo = JSON.parse(JSON.stringify(Articulo));
      const contenido_articulo = articulo[0].contenido_articulos;
      const costoRow = this.desformatear(row.pre);
      let precioRow = 0;

      const roundArticulo = articulo[0].costo_principal;

      const newArticulo = articulo[0];
      let temp = {};

      if (row.unidad === 'Caja' || row.unidad === 'Quintal') {
        this.calculoMedidaprincipal(roundArticulo, costoRow, precioRow, contenido_articulo, newArticulo);
      } else {
        const contenidoPadre = contenido_articulo.filter(cont => cont.medida === row.unidad);
        const contenidoHijo = contenido_articulo.filter(cont => cont.medida !== row.unidad);
        let costoA;
        let costoR;
        if (row.unidad === 'Paquete' || row.unidad === 'Libra') {
          costoA = contenidoPadre[0].costo * contenidoPadre[0].cantidad;
          costoR = contenidoPadre[0].cantidad * costoRow;
        } else {
          const MaxContenido = contenidoPadre[0].cantidad * contenidoHijo[0].cantidad;
          costoA = contenidoHijo[0].costo * MaxContenido;
          costoR = MaxContenido * costoRow;
        }

        this.calculoMedidaprincipal(costoA, costoR, precioRow, contenido_articulo, newArticulo);
      }

      temp = _.omit(row, ['costo', 'pre']);
      tempCuerpo.push(temp);
    });
    return tempCuerpo;
  }
  mostrarErrores(arg) {
    for (const error in arg) {
      if (arg.hasOwnProperty(error)) {
        const element = arg[error];
        this.dbServ.toastError(element, 'Error');
      }
    }
  }
  calcularNuevosPrecios(cant, precio) {
    const pre = precio / cant;
    return this.redondearAdos(pre);
  }

  IMPRIMIR() {
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

    cabecera_fact['numero_comprobante'] = this.metodo === 'venta' ? null : this.NCFcompra;
    cabecera_fact['costoYgasto'] = this.metodo === 'venta' ? null : this.CostoYgasto;
    cabecera_fact['numero_factura'] = null;
    cabecera_fact['total_factura'] = this.redondearAdos(this.TOTAL);
    cabecera_fact['Bruto'] = this.redondearAdos(this.BRUTO);
    cabecera_fact['itbis'] = this.redondearAdos(this.ITBIS);
    cabecera_fact['descuento'] = this.redondearAdos(this.DESCUENTO);
    cabecera_fact['estado'] = true;
    cabecera_fact['tipo_factura_id'] = TipoFact[0].id;
    if (this.metodo === 'venta') {
      if (this.propietario_factura.id === 1) {
        cabecera_fact['cliente_id'] = null;
        cabecera_fact['NoCliente_nombre'] = this.form.controls.nombre.value;
        cabecera_fact['NoCliente_direccion'] = this.form.controls.direccion.value;
      } else {
        cabecera_fact['cliente_id'] = this.propietario_factura.id;
      }
    }
    if (this.metodo === 'compra') {
      cabecera_fact['suplidor_id'] = this.form.controls.id.value;
    }

    cabecera_fact['detalle_facturas_attributes'] = cuerpo_fact;
    cabecera_fact['FACTURA_DE'] = this.metodo === 'venta' ? 13 : 14;
    cabecera_fact['tipo'] = this.metodo;
    cabecera_fact['user_id'] = empleado.id;

    if (this.metodo === 'compra') {
      cabecera_fact['detalle_facturas_attributes'] = this.revisarPrecios(cabecera_fact['detalle_facturas_attributes']);
    }
    console.log(cabecera_fact);
    console.log('');
    console.log('');
    console.log('');
    console.log('=============');
    console.log('');
    console.log('');
    console.log('');
    console.log('');
    console.log('');

    this.dbServ.createFacturas(cabecera_fact).subscribe(res => {
      console.log(res);

      this._ipc.on('printRes', (event: Electron.IpcMessageEvent, res) => {
        console.log(res);
        res.status = true;
        if (res.status) {
          this.CancelarFactura();
          this.GetArticulos();
        }
      });
      res['FACTURA_DE'] = this.metodo;
      this._ipc.send('print', res);
    });
  }
}
