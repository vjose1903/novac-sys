import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';

import * as _ from 'lodash';
import * as moment from '../../../../utils/javascript/moment';
import { GLOBAL } from '../../../core/services/GLOBAL';
import { DBservice } from '../../../core/services/bdservice.service';
import { ActivatedRoute, Router } from '@angular/router';
import { IpcService } from '../../../core/services/ipc.service';
import { TablasComponent } from '../../components/tablas/tablas.component';
import { ModalService } from '../../components/modal/modal.service';
import { LayoutService } from '../../layout/layout.service';
import { mixinClass } from '../../mixinClass';
import { PdfService } from '../../../core/services/pdf/pdf.service';

@Component({
  selector: 'app-notas-cred-deb',
  templateUrl: './notas-cred-deb.component.html',
  styleUrls: ['./notas-cred-deb.component.scss'],
})
export class NotasCredDebComponent extends mixinClass implements OnInit, OnDestroy {
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
  @ViewChild(TablasComponent) tablas: TablasComponent;
  tipoModal: string;
  tipoFactura: any;
  lista_tipos_facturas: any;
  propietario_factura: any;
  paqueteComprobante;
  constructor(
    private dbServ: DBservice,
    private activeRoute: ActivatedRoute,
    public mServ: ModalService,
    public _ipc: IpcService,

    private router: Router,
    public layServ: LayoutService,
    public pdfServ: PdfService,
  ) {
    super(mServ, _ipc, layServ);
  }

  ngOnInit() {
    this._init_mixin({ component: 'notas', _lista_subs: ['decisionModal', 'objDevuelto', 'printBase64Res'] });
    this.idFactura = this.activeRoute.snapshot.params['id'];
    this.tipoNota = this.activeRoute.snapshot.params['tipo'];

    this.fecha = moment().format('DD/MM/YYYY');
    this.dbServ.getTiposFacturas().subscribe((res) => {
      this.lista_tipos_facturas = res;
    });

    if (this.tipoNota === 'credito') {
      this.tituloPag = 'Nota de crédito aplicada a factura ';
      this.tipoFactura = '04';
    } else {
      this.tituloPag = 'Nota de débito aplicada a factura ';
      this.tipoFactura = '03';
    }

    this.necesarioStart();
  }

  objDevueltoResponse(res) {
    if (res && res.tipo_modal === 'cambio') {
      this.decisionModal(res.data);
    }
  }

  printBase64Res(res) {
    if (res.status === 'si') {
      this.dbServ.toastSuccess('Nota de ' + this.tipoNota + ' realizada con exito.', 'CORRECTO');
    } else {
      this.dbServ.toastError(res.msg, 'ERROR', true);
    }
  }

  initCambioMenu(arg) {
    if (arg.bool) {
      this.layServ.nextDecisionCambioMenu(arg);
    }
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  async necesarioStart() {
    await this.getFactura();
    await this.formarTitulosTabla();
    await this.getPropietario(this.factura.cliente_id);
    await this.getPaqueteComprobante();
    this.factura_aplicada = this.factura.numero_comprobante;
  }

  async getPaqueteComprobante() {
    const TipoFact = this.lista_tipos_facturas.filter((tipo) => tipo.referencia === this.tipoFactura);
    const paquete = await this.dbServ.getPaquetesNCF(TipoFact[0].id).toPromise();
    this.paqueteComprobante = paquete.body;
  }
  async getPropietario(id) {
    if (id) {
      try {
        const cliente = await this.dbServ.getClienteById(id).toPromise();

        const documento = cliente.documentos_de_identidad.filter((doc) => doc.principal === true)[0];
        this.propietario_factura = {
          nombre: cliente.nombre + ' ' + cliente.apellido,
          direccion: cliente.direccion,
          rnc: documento.documento,
        };
      } catch (error) {}
    } else {
      this.propietario_factura = {
        nombre: this.factura.NoCliente_nombre,
        direccion: this.factura.NoCliente_direccion,
        rnc: '------------',
      };
    }
  }
  formarTitulosTabla() {
    this.info = [
      {
        titulo: ' ',
        tipo: 'check',
        key: 'select',
        disable: {
          getDisabled: false,
          campo: '',
        },
        title: '',
        estilos: [{ width: '3rem' }],
      },
      {
        titulo: 'Articulo',
        key: 'descripcion',
        estilos: [{ 'text-align': 'left' }, { width: '20rem' }],
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
        estilos: [{ width: '6rem' }],
      },
      {
        titulo: 'Cantidad',
        key: 'cantidad',
        formatoNumero: true,
        estilos: [{ width: '5rem' }],
      },
      {
        titulo: 'Unidad',
        key: 'unidad',
        estilos: [{ width: '4.5rem' }],
      },
      {
        titulo: 'Precio',
        key: 'precio',
        formatoNumero: true,
      },
      {
        titulo: 'Descuento',
        key: 'descuento_valor',
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
        estilos: [{ width: '8rem' }],
      },
    ];
  }

  async getFactura() {
    try {
      this.factura = await this.dbServ.getFacturaById(this.idFactura, '?get_contenidos=true').toPromise();
      const devueltos = await this.dbServ.getCantidadDevuelto(this.factura.numero_comprobante).toPromise();

      const temp = [];
      for (let i = 0; i < this.factura.detalle_facturas.length; i++) {
        const detalle = this.factura.detalle_facturas[i];

        const devueto = devueltos[detalle.id] !== undefined ? devueltos[detalle.id] : 0;

        detalle['select'] = false;
        detalle['cant'] = detalle.cantidad - devueto;
        detalle['cant_nota'] = 0;

        detalle['customStyles'] = {
          'td-select': { width: '3rem' },
          'td-cantidad': { width: '5rem' },
          'td-total_nota': { width: '7.3rem' },
          'td-cant_nota': { width: '6rem' },
          'td-unidad': { width: '4.5rem' },
          'td-descripcion': { 'text-align': 'left', width: '20rem' },
        };

        if (this.tipoNota === 'credito') {
          detalle['min_'] = 0;
          detalle['max_'] = detalle.cantidad - devueto;
        } else {
          detalle['min_'] = 0;
          detalle['max_'] = null;
        }

        detalle['total_nota'] = 0;
        detalle['cantidad'] = detalle.cantidad - devueto;

        // if (detalle.calcular_saco && detalle.se_calcula_saco) {
        //   this.getPrecioSaco(this.factura, (res) => {
        //     if (res.estado) {
        //       detalle['precio'] = detalle['precio'] + res.precio_saco;
        //       detalle['total'] = detalle['cantidad'] * detalle['precio'];
        //     }
        //   });
        // }

        // let contenido = {};
        // try {
        //   contenido = await this.dbServ.getContenidosArticulos(detalle.articulo_id).toPromise();
        //   detalle['contenidos'] = contenido;
        // } catch (error) {
        //   if (error.error) {
        //     this.dbServ.toastError(error.error.msg, 'ERROR', true);
        //   } else {
        //     this.dbServ.toastError('Error en el servidor, contactar con el desarrollador', 'ERROR', true);
        //   }
        // }

        temp.push(detalle);
      }

      this.detalleFacturas = temp;
    } catch (error) {
      this.dbServ.toastError('Error mostrando factura elegida', 'ERROR', true);
    }
  }

  async getPrecioSaco(factura, callback = (arg) => {}) {
    try {
      const fechaFactura = this.formarFechaFactura(factura.fecha_equivalente)['FechaFactura'];
      const res = await this.dbServ.getArticulosFiltrados('Saco sistema', 1, 1, true, false, fechaFactura, 'todos').toPromise();

      callback({ estado: true, precio_saco: res.data[0].precio_principal });
    } catch (error) {
      this.dbServ.toastError('Error calculando el precio del saco', 'ERROR');
      callback({ estado: false });
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
      const descuento = detalle.descuento_valor / detalle.cantidad;

      if (this.tipoNota === 'credito') {
        total += cantidad * (detalle.precio - descuento) * -1;
      } else {
        total += cantidad * (detalle.precio - descuento);
      }
    }
    this.TOTAL = total;
  }

  async checkCantidadEnUnidades() {
    for (let i = 0; i < this.detalleNota.length; i++) {
      const detalle = this.detalleNota[i];

      if (!detalle.cantidad_en_unidades_nota) {
        detalle.cantidad_en_unidades_nota = 0;
      }

      if (detalle.unidad === 'Saco' && detalle.se_calcula_saco) {
        const peso = this.obtenerSaco(detalle.descripcion, 'peso');
        detalle.cantidad_en_unidades_nota = detalle.cant_nota * peso;
      } else {
        detalle.cantidad_en_unidades_nota = detalle.cant_nota * detalle.contenidos[detalle.unidad];
      }
    }
  }

  async selectAll(info) {}

  async getInfoChange(info) {
    const entidad = info.body[info.index];
    entidad.cant_nota = parseFloat(entidad.cant_nota);

    if (info.cambio === 'cant_nota') {
      if (this.tipoNota === 'credito') {
        if (entidad.cant_nota > entidad.cant) {
          this.dbServ.toastError('Nota de crédito no puede ser mayor a la factura original', 'ERROR', true);
          this.tablas.enfocarInput('inputNu-' + info.index);
          setTimeout(() => {
            this.tablas.resetInput('cant', 'cant_nota', info.index, false);
          }, 5);
        } else if (isNaN(entidad.cant_nota)) {
          this.tablas.resetInput('especificar', 'cant_nota', info.index, false, 0);
          this.tablas.resetInput('especificar', 'total_nota', info.index, false, 0);
        } else {
          const descuento = entidad.descuento_valor / entidad.cantidad;

          const total = entidad.cant_nota * (entidad.precio - descuento);
          entidad.total_nota = this.formatoNumero(total);
        }
      } else {
        if (isNaN(entidad.cant_nota)) {
          this.tablas.resetInput('especificar', 'cant_nota', info.index, false, 0);
          this.tablas.resetInput('especificar', 'total_nota', info.index, false, 0);
        }
        const descuento = entidad.descuento_valor / entidad.cantidad;

        const total = entidad.cant_nota * (entidad.precio - descuento);
        entidad.total_nota = this.formatoNumero(total);
      }
      this.sumarTotal();
      this.checkCantidadEnUnidades();
    }

    if (info.cambio === 'select') {
      if (!info.value) {
        this.detalleFacturas[info.index].select = false;
        this.tablas.resetInput('especificar', 'cant_nota', info.index, false, 0);
        this.tablas.resetInput('especificar', 'total_nota', info.index, false, 0);

        const i = this.detalleNota.indexOf(info.body[info.index]);
        _.pullAt(this.detalleNota, i);

        this.sumarTotal();
        this.checkCantidadEnUnidades();
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

  // =============================================
  //  MODAL CANCELAR
  // =============================================
  cancelarFactura() {
    this.abrirModal('cancelar', null);
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
        const obj = { total_factura: this.TOTAL, devuelta: 0, factura_de: this.tipoNota, tipo__: 'no_devuelta' };
        this.abrirModal('imprimir', obj);
      }
    }
  }

  async decisionModal(res) {
    if (res) {
      if (this.tipoModal === 'imprimir') {
        this.formarNota();
      } else if (this.tipoModal === 'cancelar') {
        this.router.navigateByUrl(`/admin/manipular/buscarFactura/nota_${this.tipoNota}`);
      }
    }
  }

  obtenerSaco(descripcion, tipo) {
    let num = '' as any;
    const split = _.split(descripcion, '(')[1];
    const splitFinal = _.split(split, ' ')[0];

    if (tipo === 'descripcion') {
      num = 'Saco de ' + splitFinal + ' libras';
    } else {
      num = _.parseInt(splitFinal);
    }
    return num;
  }

  formarDetallesNota() {
    const temp = [];
    for (let i = 0; i < this.detalleFacturas.length; i++) {
      const element = this.detalleFacturas[i];

      let unidad_ = element.unidad;
      if (element.select) {
        if (unidad_ === 'Saco') {
          unidad_ = this.obtenerSaco(element.descripcion, 'descripcion');
        }

        const fila = {
          detalle_factura_nota: element.id,
          articulo_id: element.articulo_id,
          cantidad: element.cant_nota,
          cantidad_en_unidades: element.cantidad_en_unidades_nota,
          total: GLOBAL.desformatear(element.total_nota),
          descuento_valor: element.descuento_valor ? (element.descuento_valor !== null ? element.descuento_valor : 0) : 0,
          descuento_porciento: element.descuento_porciento ? (element.descuento_porciento !== null ? element.descuento_porciento : 0) : 0,
          itbis: 0,
          unidad: unidad_,
          precio: GLOBAL.desformatear(element.precio),
          calcular_saco: element.calcular_saco,
        };

        temp.push(fila);
      }
    }
    return temp;
  }

  async formarNota() {
    const empleado = this.fun.getUser();
    const TipoFact = this.lista_tipos_facturas.filter((tipo) => tipo.referencia === this.tipoFactura);

    const cuerpo_fact = this.formarDetallesNota();

    const cabecera_fact = {};
    cabecera_fact['condicion'] = 'Contado';
    cabecera_fact['forma_pago'] = 'Efectivo';
    cabecera_fact['fecha_equivalente'] = null;
    // cabecera_fact['fecha_vencimiento'] = moment(new Date())
    //   .add(this.propietario_factura.limite_credito, 'days')
    //   .format('DD/MM/YYYY');

    cabecera_fact['pagada'] = true;
    cabecera_fact['balance'] = 0;
    cabecera_fact['devuelta'] = this.TOTAL * -1;

    cabecera_fact['fecha_valida'] = this.paqueteComprobante.fecha_valida !== null ? moment(this.paqueteComprobante.fecha_valida).format('DD/MM/YYYY') : null;

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
    cabecera_fact['tiene_nota'] = false;

    if (this.factura.cliente_id === null) {
      cabecera_fact['cliente_id'] = null;
      cabecera_fact['NoCliente_nombre'] = this.propietario_factura.nombre;
      cabecera_fact['NoCliente_direccion'] = this.propietario_factura.direccion;
    } else {
      cabecera_fact['cliente_id'] = this.factura.cliente_id;
    }

    cabecera_fact['detalle_facturas_attributes'] = cuerpo_fact;
    cabecera_fact['FACTURA_DE'] = null;
    cabecera_fact['tipo'] = 'nota_' + this.tipoNota;
    cabecera_fact['user_id'] = empleado.id;
    cabecera_fact['aplicada_a'] = this.factura_aplicada;
    cabecera_fact['factura_id'] = this.factura.id;

    if (this.propietario_factura.vendedor_id) {
      cabecera_fact['vendedor_id'] = this.propietario_factura.vendedor_id;
    }

    try {
      const res = await this.dbServ.createFacturas(cabecera_fact).toPromise();

      res['FACTURA_DE'] = 'nota';
      const obj = {
        data: res,
        type: 'facturacion',
      };

      this.imprimirNota(obj);

      this.router.navigateByUrl(`/admin/manipular/buscarFactura/nota_${this.tipoNota}`);
    } catch (error) {
      this.dbServ.toastError(error.statusText, 'ERROR', true);
    }
  }

  imprimirNota(obj) {
    this.pdfServ.generatePdf(obj).then((res) => {
      if (res.status === 'si') {
        const objBase = {
          base64: res.body,
          filename: res.file,
          type: 'facturacion',
        };
        this._ipc.send('printBase64', objBase);
      }
    });
  }
}
