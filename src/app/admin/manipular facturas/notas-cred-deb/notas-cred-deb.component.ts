import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import * as _ from 'lodash';
import * as moment from '../../../core/javascript/moment';
import { ActivatedRoute, Router } from '@angular/router';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { ArticuloC } from '../../registros/articulos/articulo';
import { FacturaC, TiposFacturaC, FacturasI, FacturasAplicadasC } from '../../facturacion/factura';
import { NcfC } from '../../registros/ncf/ncf';
import { ClienteC } from '../../registros/registro-clientes/cliente';
import { PdfService } from '../../../core/services/pdf/pdf.service';
import { NotaC } from './notas';
import { fun } from '../../../core/services/functions.service';
import { Permisos } from '../../../core/typescript/permisos';
import { table_config } from '../../components/new_tablas/tabla-class';
import { SingletonService } from '../../../core/services/singleton.service';

@Component({
  selector: 'app-notas-cred-deb',
  templateUrl: './notas-cred-deb.component.html',
  styleUrls: ['./notas-cred-deb.component.scss'],
})
export class NotasCredDebComponent extends MixinClass implements OnInit, OnDestroy {
  // factura;

  tabIndex = 0;
  idsFacturas: number[];
  facturasConDetalles: Array<FacturasI>;
  tipoNota: any;
  tituloPag = '';

  tipos = { credito: 'crédito', debito: 'débito' };

  fecha: string;
  TOTAL = 0;
  convertObj = { credito: -1, debito: 1 };
  info = [];
  detalleNota = [];
  tipoFactura: any;
  lista_tipos_facturas: any;
  paqueteComprobante;

  notasClass = new NotaC();
  articuloClass = new ArticuloC();
  facturaClass = new FacturaC();
  facturaAplicadasClass = new FacturasAplicadasC();
  tiposFacturasClass = new TiposFacturaC();
  clienteClass = new ClienteC();
  ncfClass = new NcfC();
  permissions = Permisos;

  table_config: table_config = {
    info: [
      { titulo: ' ', tipo: 'switch', select_all: true, key: 'select', estilos: [{ width: '3.5rem' }] },
      { titulo: 'Articulo', tipo: 'text', key: 'descripcion', estilos: [{ 'text-align': 'left' }, { width: '20rem' }] },
      {
        titulo: null,
        key: 'cant_nota',
        tipo: 'input',
        inputType: 'number',
        disable: [{ kind: 'campo', target: 'select', value: [false] }],
        estilos: [{ width: '6rem' }],
      },
      { titulo: 'Cantidad', key: 'cantidad', tipo: 'formatoNumero', estilos: [{ width: '5rem' }] },
      { titulo: 'Unidad', key: 'unidad', tipo: 'text', estilos: [{ width: '4.5rem' }] },
      { titulo: 'Precio', key: 'precio', tipo: 'formatoNumero' },
      { titulo: 'Descuento', key: 'descuento_valor', tipo: 'formatoNumero' },
      { titulo: 'Total Facturado', key: 'total', tipo: 'formatoNumero' },
      { titulo: 'Total nota', key: 'total_nota', tipo: 'input', disable: [{ kind: 'always' }], estilos: [{ width: '8rem' }] },
    ],
    id_tabla: 'notas',
    obj_paginate: { show: false },
    redondo: false,
    colorTitulo: false,
  };

  tablaComponent;

  constructor(private activeRoute: ActivatedRoute, private router: Router, private pdfServ: PdfService, private cdRef: ChangeDetectorRef) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'notas', is_routing: true });
    this.idsFacturas = JSON.parse(this.activeRoute.snapshot.params['ids']);
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

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  async necesarioStart() {
    this.lista_tipos_facturas = await this.tiposFacturasClass.getAll();

    this.getFacturas().then(async (datos) => {
      this.facturasConDetalles = datos as FacturasI[];
      await this.formarTitulosTabla();
      await this.getPaqueteComprobante();
    });
  }

  async getPaqueteComprobante() {
    const TipoFact = this.lista_tipos_facturas.find((tipo) => tipo.referencia === this.tipoFactura);

    this.ncfClass.getAll({ afterPath: `custom/${TipoFact.id}/true` }).then((res) => {
      this.paqueteComprobante = res['data'];
    });
  }

  formarTitulosTabla() {
    const FilaCantNota = _.find(this.table_config.info, { key: 'cant_nota' });
    FilaCantNota.titulo = this.tipoNota === 'credito' ? 'Devolver' : 'Aumentar';
  }

  onCloseTab(eventData) {
    _.pullAt(this.facturasConDetalles, [eventData.index]);
  }

  async getFacturas() {
    return new Promise(async (resolve) => {
      this.facturaClass.getAll({ afterPath: `custom/get_group/${this.idsFacturas}` }).then((res_factura) => {
        let tempFactData: FacturasI[] = res_factura['data'];

        this.facturaAplicadasClass.getAll({ afterPath: `custom/get_cantidad_devuelto/${this.idsFacturas}` }).then((res) => {
          const devueltos = res['data'];

          for (let indexFact = 0; indexFact < tempFactData.length; indexFact++) {
            const factura = tempFactData[indexFact];

            for (let indexDetalles = 0; indexDetalles < factura.detalle_facturas.length; indexDetalles++) {
              const detalle = factura.detalle_facturas[indexDetalles];
              const devueto = devueltos[factura.id]?.detalles[detalle.id] || 0;

              detalle['select'] = false;
              detalle['cant'] = detalle.cantidad - devueto;
              detalle['cant_nota'] = 0;

              detalle['customStyles'] = {
                select: { width: '3.5rem' },
                cantidad: { width: '5rem' },
                total_nota: { width: '7.3rem' },
                cant_nota: { width: '6rem' },
                unidad: { width: '4.5rem' },
                descripcion: { 'text-align': 'left', width: '20rem' },
              };

              detalle['min_'] = 0;
              detalle['max_'] = this.tipoNota == 'credito' ? detalle.cantidad - devueto : null;

              detalle['total_nota'] = '0.00';
              detalle['cantidad'] = detalle.cantidad - devueto;

              resolve(tempFactData);
            }
          }
        });
      });
    });
  }

  async sumarTotal() {
    let total = 0;

    for (let i = 0; i < this.detalleNota.length; i++) {
      const detalle = this.detalleNota[i];

      const cantidad = fun.desformatear(detalle.cant_nota);

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

      if (!detalle.cantidad_en_unidades_nota) detalle.cantidad_en_unidades_nota = 0;

      if (detalle.unidad == 'Saco' && detalle.se_calcula_saco) {
        const peso = this.obtenerSaco(detalle.descripcion, 'peso');

        detalle.cantidad_en_unidades_nota = detalle.cant_nota * peso;
      } else {
        const unidad = detalle.peso_saco ? `${detalle.unidad}_${detalle.peso_saco}` : detalle.unidad;
        detalle.cantidad_en_unidades_nota = detalle.cant_nota * detalle.contenidos[unidad];
      }
    }
  }

  async selectAll(info) {}

  tableInputChange(params) {
    if (params.key == 'select') {
      if (!params.value) {
        params.data.total_nota = '0.00';
        params.data.cant_nota = 0;
        const index = _.findIndex(this.detalleNota, { id: params.data.id });
        _.pullAt(this.detalleNota, index);
      } else {
        this.detalleNota.push(params.data);
      }
    }

    if (params.key == 'cant_nota') {
      const cant_nota = fun.desformatear(params.value);

      if (this.tipoNota == 'credito') {
        if (cant_nota > params.data.cant) {
          fun.toastError('Nota de crédito no puede ser mayor a la factura original', 'ERROR');
          this.enfocarInput(`input-${params.id_tabla}-${params.key}-${params.index}`);
        } else if (isNaN(cant_nota)) {
          params.data.cant_nota = 0;
          params.data.total_nota = '0.00';
        } else {
          const descuento = params.data.descuento_valor / params.data.cantidad;

          const total = cant_nota * (fun.desformatear(params.data.precio) - descuento);
          params.data.total_nota = this.formatoNumero(total);
          params.data.cant_nota = cant_nota;
        }
      } else {
        if (isNaN(cant_nota)) {
          params.data.cant_nota = 0;
          params.data.total_nota = '0.00';
        }
        const descuento = params.data.descuento_valor / params.data.cantidad;

        const total = cant_nota * (params.data.precio - descuento);
        params.data.total_nota = this.formatoNumero(total);
        params.data.cant_nota = cant_nota;
      }
    }

    this.sumarTotal();
    this.checkCantidadEnUnidades();
    // SingletonService.cdRef.detectChanges();
  }

  formatoNumero(num) {
    return fun.numFormatTwoDecimals(num);
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
    const confirmationObj = {
      id: 'archivar_factura',
      texto: 'Seguro que desea cancelar la operación',
      header: 'Confirmación',
      siFunction: (instance) => {
        this.router.navigateByUrl(`/admin/manipular/buscarFactura/nota_${this.tipoNota}`);
        this.closeModal(instance);
      },
      width: '30rem',
    };
    this.confirmationModal(confirmationObj);
  }

  // =============================================
  //  MODAL IMPRIMIR
  // =============================================
  imprimirFactura() {
    const facturasLlenas = _.filter(this.facturasConDetalles, (factura) => this.totalIndividual(factura) > 0);
    if (facturasLlenas.length == 0) {
      fun.toastWarning('Nota de ' + this.tipoNota + ' no puede estar vacía.', 'Aviso');
    } else {
      if (this.TOTAL === 0) {
        fun.toastWarning('Total de la nota de ' + this.tipoNota + ' no puede ser 0.', 'Aviso');
      } else {
        const obj = { total_factura: this.TOTAL, devuelta: 0, factura_de: this.tipoNota, tipo_modal: 'no_devuelta' };

        const confirmationObj = {
          id: 'imprimir_factura',
          texto: 'Seguro que desea imprimir la nota',
          header: 'Confirmación',
          siFunction: (instance) => {
            this.formarNota();
            this.closeModal(instance);
          },
          width: '30rem',
        };
        this.confirmationModal(confirmationObj);
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

  formarDetallesNota(dataFact: FacturasI) {
    const temp = [];
    for (let i = 0; i < dataFact.detalle_facturas.length; i++) {
      const element = dataFact.detalle_facturas[i];

      let unidad_ = element.unidad;
      if (element.select) {
        if (unidad_ == 'Saco') unidad_ = this.obtenerSaco(element.descripcion, 'descripcion');

        const fila = {
          detalle_factura_nota: element.id,
          articulo_id: element.articulo_id,
          cantidad: element.cant_nota,
          cantidad_en_unidades: element.cantidad_en_unidades_nota,
          total: fun.desformatear(element.total_nota),
          descuento_valor: element.descuento_valor ? (element.descuento_valor !== null ? element.descuento_valor : 0) : 0,
          descuento_porciento: element.descuento_porciento ? (element.descuento_porciento !== null ? element.descuento_porciento : 0) : 0,
          itbis: 0,
          unidad: unidad_,
          precio: fun.desformatear(element.precio),
          calcular_saco: element.calcular_saco,
        };

        temp.push(fila);
      }
    }
    return temp;
  }

  confirmationModal(obj: { id: string; texto: string; header: string; siFunction: Function; width?: string }) {
    this.handleModalForm({
      id: obj.id,
      header: obj.header,
      width: obj.width || '30rem',
      html: `<p>
      ${obj.texto}
    </p>`,
      botones: {
        aceptar: { show: false, disable: false },
        cancelar: { show: false, disable: false },
        dinamico: [
          { clase: 'btn btn-blanco mr-2', function: (instance) => this.closeModal(instance), label: 'NO', disable: false },
          {
            clase: 'btn btn-verde',
            function: (instance) => obj.siFunction(instance),
            label: 'SI',
            disable: false,
          },
        ],
      },
    });
  }

  closeModal(modalInstance) {
    modalInstance.closeModal(modalInstance.id, 'cancelar');
  }

  totalIndividual(dataFact) {
    const suma = _.reduce(
      dataFact.detalle_facturas,
      (sum, n) => {
        const number = parseFloat(String(n.total_nota).replace(',', ''));
        return sum + number;
      },
      0,
    );

    return suma;
  }

  changeHeaderStatus(iteraFact, tabPanel, idTab) {
    if (tabPanel) {
      const element = document.getElementsByClassName(idTab);

      if (element.item(0)) element.item(0).setAttribute('style', this.totalIndividual(iteraFact) == 0 ? 'background: #efc2c2' : '');
    }
  }

  totalGlobal() {
    let numb = 0;
    for (const fact of this.facturasConDetalles) {
      numb += this.totalIndividual(fact);
    }
    return numb;
  }

  async formarNota() {
    const TipoFact = this.lista_tipos_facturas.filter((tipo) => tipo.referencia === this.tipoFactura);
    const fecha_valida = this.paqueteComprobante.fecha_valida !== null ? moment(this.paqueteComprobante.fecha_valida).format('DD/MM/YYYY') : null;

    let dataToSend;
    if (this.facturasConDetalles.length > 0) {
      const facturasLlenas = _.filter(this.facturasConDetalles, (factura) => this.totalIndividual(factura) > 0);
      const { cliente_id } = facturasLlenas[0];

      dataToSend = {
        cliente_id,
        user_id: null,
        fecha_valida,
        tipo_factura_id: TipoFact[0].id,
        total: this.totalGlobal(),
        facturas_aplicadas: [],
      };

      for (const factura of facturasLlenas) {
        const objTemp = {
          cabecera_factura_id: factura.id,
          total: this.totalIndividual(factura),
          detalles_facturas_notas: _.filter(factura.detalle_facturas, (data) => data.select == true && data.cant_nota > 0).map((detalle) => {
            let objDetalleTemp = _.pick(detalle, ['detalle_factura_id', 'articulo_id', 'unidad', 'cantidad_en_unidades_nota', 'itbis', 'costo', 'precio', 'total_nota', 'descuento']);
            objDetalleTemp['total'] = fun.desformatear(objDetalleTemp.total_nota);
            objDetalleTemp['cantidad_en_unidades'] = detalle.cantidad_en_unidades_nota;
            objDetalleTemp['cantidad'] = detalle.cant_nota;
            delete objDetalleTemp.total_nota;
            objDetalleTemp['detalle_factura_id'] = detalle.id;
            return objDetalleTemp;
          }),
        };

        dataToSend.facturas_aplicadas.push(objTemp);
      }
    }

    const res = await this.notasClass.createOne(dataToSend);

    this.notasClass.parseDataToPdf(res['data']).then((data_parsed) => {
      const obj = { data: data_parsed, type: 'nota' };

      this.imprimirNota(obj);
    });

    this.router.navigateByUrl(`/admin/manipular/buscarFactura/nota_${this.tipoNota}`);
  }

  imprimirNota(obj) {
    this.pdfServ
      .generatePdf({ oPdf: obj, imprimir: true })
      .then(async (res) => {
        if (res.status === 'si') fun.toastSuccess('Nota de ' + this.tipoNota + ' realizada con exito.', 'CORRECTO');
        else fun.toastError(res.msg, 'ERROR');

        this.layServ.nextCheckCuadreToday(true);
      })
      .catch((err) => fun.toastError(err.msg, 'ERROR'));
  }
}
