import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';

import * as _ from 'lodash';
import * as moment from '../../../core/javascript/moment';
import { GLOBAL } from '../../../core/typescript/GLOBAL';
import { ActivatedRoute, Router } from '@angular/router';
import { TablasComponent } from '../../components/tablas/tablas.component';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { ArticuloC } from '../../registros/articulos/articulo';
import { FacturaC, TiposFacturaC } from '../../facturacion/factura';
import { NcfC } from '../../registros/ncf/ncf';
import { ClienteC } from '../../registros/registro-clientes/cliente';
import { PdfService } from '../../../core/services/pdf/pdf.service';

@Component({
  selector: 'app-notas-cred-deb',
  templateUrl: './notas-cred-deb.component.html',
  styleUrls: ['./notas-cred-deb.component.scss'],
})
export class NotasCredDebComponent extends MixinClass implements OnInit, OnDestroy {
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

  articuloClass = new ArticuloC();
  facturaClass = new FacturaC();
  tiposFacturasClass = new TiposFacturaC();
  clienteClass = new ClienteC();
  ncfClass = new NcfC();
  constructor(private activeRoute: ActivatedRoute, private router: Router, private pdfServ: PdfService) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'notas', _lista_subs: ['decisionModal', 'objDevuelto'] });
    this.idFactura = this.activeRoute.snapshot.params['id'];
    this.tipoNota = this.activeRoute.snapshot.params['tipo'];

    this.fecha = moment().format('DD/MM/YYYY');

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

  initCambioMenu(arg) {
    if (arg.bool) {
      this.layServ.nextDecisionCambioMenu(arg);
    }
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  async necesarioStart() {
    this.lista_tipos_facturas = await this.tiposFacturasClass.getAll();

    this.getFactura().then(async (res_factura) => {
      await this.formarTitulosTabla();
      await this.getPropietario(this.factura.cliente_id);
      await this.getPaqueteComprobante();
      this.factura_aplicada = this.factura.numero_comprobante;
    });
  }

  async getPaqueteComprobante() {
    const TipoFact = this.lista_tipos_facturas.find((tipo) => tipo.referencia === this.tipoFactura);

    this.ncfClass.getAll({ afterPath: `custom/${TipoFact.id}/true` }).then((res) => {
      this.paqueteComprobante = res['data'];
    });
  }

  async getPropietario(id) {
    if (id) {
      try {
        this.clienteClass.getOne(id).then((res) => {
          const cliente = res['data'];

          const documento = cliente.documentos_de_identidad.filter((doc) => doc.principal === true)[0];

          this.propietario_factura = {
            nombre: cliente.nombre + ' ' + cliente.apellido,
            direccion: cliente.direccion,
            rnc: documento.documento,
          };
          this.fun.logGreen('this.propietario_factura ', this.propietario_factura);
        });
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
      { titulo: ' ', tipo: 'check', key: 'select', title: '', estilos: [{ width: '3rem' }] },
      { titulo: 'Articulo', tipo: 'text', key: 'descripcion', estilos: [{ 'text-align': 'left' }, { width: '20rem' }] },
      {
        titulo: this.tipoNota === 'credito' ? 'Devolver' : 'Aumentar',
        key: 'cant_nota',
        formatoNumero: true,
        tipo: 'input',
        inputType: 'number',
        disable: [{ kind: 'campo', target: 'select', value: [false] }],
        estilos: [{ width: '6rem' }],
      },
      { titulo: 'Cantidad', key: 'cantidad', tipo: 'formatoNumero', formatoNumero: true, estilos: [{ width: '5rem' }] },
      { titulo: 'Unidad', key: 'unidad', tipo: 'text', estilos: [{ width: '4.5rem' }] },
      { titulo: 'Precio', key: 'precio', tipo: 'formatoNumero', formatoNumero: true },
      { titulo: 'Descuento', key: 'descuento_valor', tipo: 'formatoNumero', formatoNumero: true },
      { titulo: 'Total Facturado', key: 'total', tipo: 'formatoNumero', formatoNumero: true },
      { titulo: 'Total nota', key: 'total_nota', tipo: 'input', disable: [{ kind: 'always' }], estilos: [{ width: '8rem' }] },
    ];
  }

  async getFactura() {
    return new Promise(async (resolve) => {
      this.facturaClass.getOne(this.idFactura).then((res_factura) => {
        this.factura = res_factura['data'];
        this.fun.logRed('this.factura --> ', this.factura);

        this.facturaClass.getAll({ afterPath: `custom/get_cantidad_devuelto/${this.factura.numero_comprobante}` }).then((res) => {
          const devueltos = res['data'];
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

            temp.push(detalle);
          }

          this.detalleFacturas = temp;

          resolve(true);
        });
      });
    });
  }

  async getPrecioSaco(factura, callback = (arg) => {}) {
    const fechaFactura = this.formarFechaFactura(factura.fecha_equivalente)['FechaFactura'];

    this.articuloClass.getArticulosFiltrado({ buscar: 'Saco sistema', fecha: fechaFactura, paginado: false }).then((res) => {
      callback({ estado: true, precio_saco: res.data[0].precio_principal });
    });
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
    this.fun.logBlue(' ----- checkCantidadEnUnidades ----- ');
    for (let i = 0; i < this.detalleNota.length; i++) {
      const detalle = this.detalleNota[i];

      if (!detalle.cantidad_en_unidades_nota) detalle.cantidad_en_unidades_nota = 0;

      if (detalle.unidad === 'Saco' && detalle.se_calcula_saco) {
        const peso = this.obtenerSaco(detalle.descripcion, 'peso');

        detalle.cantidad_en_unidades_nota = detalle.cant_nota * peso;
      } else {
        detalle.cantidad_en_unidades_nota = detalle.cant_nota * detalle.contenidos[detalle.unidad];
      }
      this.fun.logRed('detalle ', GLOBAL.duplicarJson(detalle));
    }
  }

  async selectAll(info) {}

  async getInfoChange(info) {
    const entidad = info.body[info.index];
    entidad.cant_nota = parseFloat(entidad.cant_nota);

    if (info.cambio === 'cant_nota') {
      if (this.tipoNota === 'credito') {
        if (entidad.cant_nota > entidad.cant) {
          this.fun.toastError('Nota de crédito no puede ser mayor a la factura original', 'ERROR');
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
      this.fun.toastWarning('Nota de ' + this.tipoNota + ' no puede estar vacía.', 'Aviso');
    } else {
      if (this.TOTAL === 0) {
        this.fun.toastWarning('Total de la nota de ' + this.tipoNota + ' no puede ser 0.', 'Aviso');
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
        if (unidad_ === 'Saco') unidad_ = this.obtenerSaco(element.descripcion, 'descripcion');

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

    cabecera_fact['detalle_facturas'] = cuerpo_fact;
    cabecera_fact['FACTURA_DE'] = null;
    cabecera_fact['tipo'] = 'nota_' + this.tipoNota;
    cabecera_fact['user_id'] = empleado.id;
    cabecera_fact['aplicada_a'] = this.factura_aplicada;
    cabecera_fact['factura_id'] = this.factura.id;

    if (this.propietario_factura.vendedor_id) cabecera_fact['vendedor_id'] = this.propietario_factura.vendedor_id || null;

    try {
      const res = await this.facturaClass.createOne(cabecera_fact);

      res['data']['FACTURA_DE'] = 'nota';
      const obj = { data: res['data'], type: 'facturacion' };

      this.imprimirNota(obj);

      this.router.navigateByUrl(`/admin/manipular/buscarFactura/nota_${this.tipoNota}`);
    } catch (error) {
      this.fun.toastError(error.statusText, 'ERROR');
    }
  }

  imprimirNota(obj) {
    this.pdfServ
      .generatePdf({ oPdf: obj, imprimir: true })
      .then(async (res) => {
        if (res.status === 'si') this.fun.toastSuccess('Nota de ' + this.tipoNota + ' realizada con exito.', 'CORRECTO');
        else this.fun.toastError(res.msg, 'ERROR');

        this.layServ.nextCheckCuadreToday(true);
      })
      .catch((err) => this.fun.toastError(err.msg, 'ERROR'));
  }
}
