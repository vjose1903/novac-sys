import { ConfigI } from '../../../core/interface/config-interface';
import { Ss } from './../../../core/services/singleton.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import * as _ from 'lodash';
const moment = require('../../../core/javascript/moment');
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
import { ConfirmacionImprimirComponent } from '../../facturacion/confirmacion-imprimir/confirmacion-imprimir.component';
import { ModalClass } from '../../components/modal/modal-class';

@Component({
    selector: 'app-notas-cred-deb',
    templateUrl: './notas-cred-deb.component.html',
    styleUrls: ['./notas-cred-deb.component.scss'],
    standalone: false
})
export class NotasCredDebComponent extends MixinClass implements OnInit, OnDestroy {
  // factura;

  tabIndex = 0;
  idsFacturas: number[];
  facturasConDetalles: Array<FacturasI>;
  tipoNota: any;
  tituloPag = '';
  configApp: ConfigI;

  tipos = { credito: 'crédito', debito: 'débito' };

  fecha: string;
  convertObj = { credito: -1, debito: 1 };
  info = [];
  detalleNota = [];
  tipoFactura: any;

  paqueteComprobante;
  is_print = false;

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
      { titulo: 'Articulo', tipo: 'text', key: 'descripcion', estilos: [{ 'text-align': 'left' }, { width: '20rem' }, { 'padding-left': '0.5rem' }] },
      { titulo: 'Cantidad', key: 'cantidad_', tipo: 'text', estilos: [{ width: '7rem' }] },
      { titulo: 'Descuento', key: 'descuento_valor', tipo: 'formatoNumero' },
      { titulo: 'Precio', key: 'precio', tipo: 'formatoNumero' },
      {
        titulo: 'Precio real',
        key: 'precio_real',
        tipo: 'input',
        inputEvents: 'formatoNumero',
        inputType: 'text',
        textAlign: 'end',
        disable: [{ kind: 'campo', target: 'select', value: [false] }],
        estilos: [{ width: '8rem' }],
      },
      { titulo: 'Total nota', key: 'total_nota', tipo: 'input', textAlign: 'end', disable: [{ kind: 'always' }], estilos: [{ width: '8rem' }] },
    ],
    id_tabla: 'notas',
    obj_paginate: { show: false },
    redondo: false,
    colorTitulo: false,
  };

  tablaComponent;

  constructor(private activeRoute: ActivatedRoute, private router: Router) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'notas', is_routing: true });
    this.configApp = Ss.configServ.getConfig({ isPromise: false });

    this.idsFacturas = this.activeRoute.snapshot.params['ids'];

    this.tipoNota = this.activeRoute.snapshot.params['tipo'];
    this.fecha = moment().format('DD/MM/YYYY');

    if (this.tipoNota === 'credito') {
      this.tituloPag = 'Nota de crédito aplicada a factura ';
      this.tipoFactura = '04';
      this.agregarColumnaDevolver();
    } else {
      this.tituloPag = 'Nota de débito aplicada a factura ';
      this.tipoFactura = '03';
    }

    if (this.configApp.calcular_itbis) this.agregarItbisEnTabla();

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
    this.getFacturas().then(async (datos) => {
      this.facturasConDetalles = datos as FacturasI[];
      await this.getPaqueteComprobante();
    });
  }

  async getPaqueteComprobante() {
    const TipoFact = Ss.factServ.lista_tipos_facturas.find((tipo) => tipo.referencia === this.tipoFactura);

    this.ncfClass.getAll({ afterPath: `custom/${TipoFact.id}/true` }).then((res) => {
      this.paqueteComprobante = res['data'];
    });
  }

  agregarColumnaDevolver() {
    return new Promise<any>((resolve, reject) => {
      fun.pushAt(this.table_config.info, 2, {
        titulo: 'Devolver',
        key: 'cant_nota',
        tipo: 'input',
        inputType: 'number',
        textAlign: 'end',
        disable: [{ kind: 'campo', target: 'select', value: [false] }],
        estilos: [{ width: '6rem' }],
      });
      resolve(true);
    });
  }

  agregarItbisEnTabla() {
    const base = this.tipoNota == 'credito' ? 7 : 6;
    fun.pushAt(this.table_config.info, base, { titulo: 'Itbis', key: 'itbis', tipo: 'formatoNumero', text_color: 'colorItbis', alert_msg: 'A partir de los 30 días el ITBIS queda retenido.', estilos: [{ 'padding-left': '2rem' }] });
    fun.pushAt(this.table_config.info, base + 1, { titulo: 'Itbis real', key: 'itbis_real', tipo: 'input', textAlign: 'end', inputType: 'text', disable: [{ kind: 'always' }], estilos: [{ width: '7rem' }] });
  }

  onCloseTab(eventData) {
    _.pullAt(this.facturasConDetalles, [eventData.index]);
  }

  async getFacturas() {
    return new Promise(async (resolve) => {
      this.facturaClass.getAll({ afterPath: `custom/get_group`, parameters: { ids: this.idsFacturas } }).then((res_factura) => {
        let tempFactData: FacturasI[] = res_factura['data'];

        this.facturaAplicadasClass.getAll({ afterPath: `custom/get_cantidad_devuelto/${this.idsFacturas}` }).then((res) => {
          const devueltos = res['data'];

          for (let indexFact = 0; indexFact < tempFactData.length; indexFact++) {
            const factura = tempFactData[indexFact];

            const dias_de_creada = Math.round(moment().diff(factura.fecha_equivalente, 'days', true));

            for (let indexDetalles = 0; indexDetalles < factura.detalle_facturas.length; indexDetalles++) {
              const detalle = factura.detalle_facturas[indexDetalles];
              const devueto = devueltos[factura.id]?.detalles[detalle.id] || 0;

              detalle['select'] = false;
              detalle['cant'] = detalle.cantidad - devueto;
              detalle['cant'] = detalle.cantidad - devueto;
              detalle['cant_nota'] = 0;
              detalle['colorItbis'] = dias_de_creada >= 30 ? 'red' : 'black';
              detalle['can_return_itbis'] = dias_de_creada < 30;

              detalle['customStyles'] = {
                select: { width: '3.5rem' },
                descripcion: { 'text-align': 'left', width: '20rem', 'padding-left': '0.5rem' },
                cant_nota: { width: '6rem' },
                cantidad_: { width: '7rem' },
                precio_real: { width: '8rem', 'padding-right': '0.8rem' },
                itbis_real: { width: '7rem', 'padding-right': '0.8rem' },
                total_nota: { width: '7.3rem' },
              };

              detalle['min_'] = 0;
              detalle['max_'] = this.tipoNota == 'credito' ? detalle.cantidad - devueto : null;

              detalle['total_nota'] = '0.00';
              detalle['cantidad'] = detalle.cantidad - devueto;
              detalle['cantidad_'] = `${fun.roundNumberToDecimal(detalle['cantidad'])} ${detalle['unidad']}`;
              detalle['precio_real'] = fun.roundNumberToDecimal(detalle.precio);
              detalle['itbis_real'] = fun.roundNumberToDecimal(detalle.itbis);

              resolve(tempFactData);
            }
          }
        });
      });
    });
  }

  async checkCantidadEnUnidades() {
    for (let i = 0; i < this.detalleNota.length; i++) {
      const detalle = this.detalleNota[i];

      if (!detalle.cantidad_en_unidades_nota) detalle.cantidad_en_unidades_nota = 0;

      const unidad = detalle.peso_saco ? `${detalle.unidad}_${detalle.peso_saco}` : detalle.unidad;
      const unidad_minima = detalle.contenidos[unidad];
      detalle.cantidad_en_unidades_nota = detalle.cant_nota * unidad_minima;
    }
  }

  async selectAll(info) {}

  tableInputChange(params) {
    if (params.key == 'select') {
      if (!params.value) {
        params.data.total_nota = '0.00';
        params.data.cant_nota = 0;
        params.data.precio_real = fun.roundNumberToDecimal(params.data.precio);

        const itbis = this.configApp.calcular_itbis ? params.data.precio_real * 0.18 : 0;
        params.data.itbis_real = fun.roundNumberToDecimal(itbis);

        const index = _.findIndex(this.detalleNota, { id: params.data.id });
        _.pullAt(this.detalleNota, index);
      } else {
        this.detalleNota.push(params.data);
      }
    }
    fun.awaitTyping().then(() => {
      if (params.key == 'cant_nota') {
        const cant_nota = fun.desformatearStNumber(params.value);

        if (isNaN(cant_nota)) {
          params.data.cant_nota = 0;
          params.data.total_nota = '0.00';
        }

        if (this.tipoNota == 'credito') {
          if (cant_nota > params.data.cant) {
            fun.toastError('Nota de crédito no puede ser mayor a la factura original', 'ERROR');
            fun.enfocarInput(`input-${params.id_tabla}-${params.key}-${params.index}`);
          } else {
            params.data.cant_nota = cant_nota;
            this.sumarTotalRow(params);
          }
        }
      }

      if (params.key == 'precio_real') {
        let msg;
        let precio = fun.desformatearStNumber(params.data.precio);
        let precio_real = fun.desformatearStNumber(params.value);

        if (this.tipoNota == 'credito') {
          if (precio_real > precio) msg = 'Las notas de crédito son utilizadas para reducir el valor de la factura, el precio real no puede ser mayor al original.';
        } else {
          if (precio_real < precio) msg = 'Las notas de débito son utilizadas para aumenrtar el valor de la factura, el precio real no puede ser menor al original.';
        }

        if (fun.hasValue(msg)) {
          fun.toastInfo(msg, 'AVISO');
          fun.enfocarInput(`input-${params.id_tabla}-${params.key}-${params.index}`);

          return;
        } else {
          const itbis = this.configApp.calcular_itbis ? precio_real * 0.18 : 0;

          params.data.precio_real = precio_real;
          params.data.itbis_real = fun.roundNumberToDecimal(itbis);
          this.sumarTotalRow(params);
        }
      }

      this.checkCantidadEnUnidades();
    });
  }

  sumarTotalRow(params) {
    const descuento = params.data.descuento_valor / params.data.cantidad;
    const precio = fun.desformatearStNumber(params.data.precio);
    const precio_real = fun.desformatearStNumber(params.data.precio_real);
    let total = 0;

    if (this.tipoNota == 'credito') {
      const itbis = params.data.calcular_itbis && params.data.can_return_itbis ? precio * 0.18 : 0;
      const precio_itbis = precio + itbis;
      total += params.data.cant_nota * (precio_itbis - descuento);
    }

    if (precio != precio_real) {
      const itbis_real = fun.desformatearStNumber(params.data.itbis_real);
      const precio_itbis_real = precio_real + itbis_real;
      const total_real = params.data.cant * (precio_itbis_real - descuento);

      total += Math.abs(params.data.total - total_real);
    }

    params.data.total_nota = this.formatoNumero(total);
  }

  formatoNumero(num) {
    return fun.roundNumberToDecimal(num);
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

  async getDataFromModal(arg, search?) {
    if (arg.modal_id === 'confirmacionImprimir') {
      this.is_print = arg.is_print;
      this.formarNota();
    }
  }

  getCantidadArticulos(factura_en_turno) {
    const detalles_selected = _.filter(factura_en_turno.detalle_facturas, { select: true });
    return detalles_selected.length;
  }

  // =============================================
  //  MODAL IMPRIMIR
  // =============================================
  imprimirFactura() {
    const facturasLlenas = _.filter(this.facturasConDetalles, (factura) => this.totalIndividual(factura) > 0);

    if (facturasLlenas.length == 0) {
      fun.toastWarning('Nota de ' + this.tipoNota + ' no puede estar vacía.', 'Aviso');
    } else {
      if (this.totalGlobal() == 0) {
        fun.toastWarning('Total de la nota de ' + this.tipoNota + ' no puede ser 0.', 'Aviso');
      } else {
        const obj = { modo_factura: 'nota', condicion_fact: 'nota', metodo: `nota_${this.tipoNota}`, is_viaje: false };

        this.openNewModal({
          component: ConfirmacionImprimirComponent,
          inputs: obj,
          id: 'confirmacionImprimir',
          header: 'Confirmación',
          width: '30rem',
          botones: {
            ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
            dinamico: [
              { clase: 'btn btn-blanco', function: (instance) => this.closeModal(instance), label: 'Cancelar', disable: false },
              { btn_id: 'btnConfirmar', clase: 'btn btn-verde', function_in_other_component: 'btn_aceptar', label: 'Confirmar', disable: false },
            ],
          },
        });
      }
    }
  }

  obtenerSaco(descripcion, tipo) {
    let result = '' as any;
    const split = _.split(descripcion, '(')[1];
    const splitFinal = _.split(split, ' ')[0];

    if (tipo === 'descripcion') {
      result = 'Saco de ' + splitFinal + ' libras';
    } else {
      result = _.parseInt(splitFinal);
    }
    return result;
  }

  confirmationModal(obj: { id: string; texto: string; header: string; siFunction: Function; width?: string }) {
    this.openNewModal({
      id: obj.id,
      header: obj.header,
      width: obj.width || '30rem',
      html: `<p> ${obj.texto} </p>`,
      botones: {
        ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
        dinamico: [
          { clase: 'btn btn-blanco', function: (instance) => this.closeModal(instance), label: 'NO', disable: false },
          { clase: 'btn btn-verde', function: (instance) => obj.siFunction(instance), label: 'SI', disable: false },
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
      (acumulado, item) => {
        const number = parseFloat(String(item.total_nota).replace(',', ''));
        return acumulado + number;
      },
      0,
    );

    return suma;
  }

  changeHeaderStatus(iteraFact, tabPanel, idTab): any {
    if (tabPanel) {
      const element = document.getElementsByClassName(idTab);

      if (element.item(0)) element.item(0).setAttribute('style', this.totalIndividual(iteraFact) == 0 ? 'background: #efc2c2' : '');
    }
  }

  totalGlobal() {
    const total = _.reduce(this.facturasConDetalles, (acumulado, item) => acumulado + this.totalIndividual(item), 0);
    return total;
  }

  async formarNota() {
    const TipoFact = Ss.factServ.lista_tipos_facturas.filter((tipo) => tipo.referencia === this.tipoFactura);
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

          detalles_facturas_notas: _.filter(factura.detalle_facturas, (data) => data.select == true && fun.desformatearStNumber(data.total_nota) > 0).map((detalle) => {
            let objDetalleTemp = _.pick(detalle, ['detalle_factura_id', 'articulo_id', 'unidad', 'cantidad_en_unidades_nota', 'itbis', 'itbis_real', 'costo', 'precio', 'precio_real', 'total_nota', 'descuento_valor']);

            objDetalleTemp['total'] = fun.desformatearStNumber(objDetalleTemp.total_nota);
            objDetalleTemp['itbis'] = detalle.can_return_itbis ? objDetalleTemp.itbis : 0;
            objDetalleTemp['cantidad_en_unidades'] = detalle.cantidad_en_unidades_nota;
            objDetalleTemp['cantidad'] = detalle.cant_nota;
            objDetalleTemp['detalle_factura_id'] = detalle.id;
            objDetalleTemp['itbis_real'] = fun.desformatearStNumber(objDetalleTemp['itbis_real']);
            objDetalleTemp['itbis'] = fun.desformatearStNumber(objDetalleTemp['itbis']);
            objDetalleTemp['precio_real'] = fun.desformatearStNumber(objDetalleTemp['precio_real']);
            objDetalleTemp['precio'] = fun.desformatearStNumber(objDetalleTemp['precio']);

            objDetalleTemp = fun.remplaceKeyFromJson(objDetalleTemp, [{ old_key: 'descuento_valor', new_key: 'descuento' }]);

            objDetalleTemp['descuento_real'] = 0;

            delete objDetalleTemp.total_nota;
            delete objDetalleTemp.cantidad_en_unidades_nota;
            return objDetalleTemp;
          }),
        };

        dataToSend.facturas_aplicadas.push(objTemp);
      }
    }

    const res = await this.notasClass.createOne(dataToSend);

    this.notasClass.parseDataToPdf(res['data']).then((data_parsed) => {
      const objToPdf = { data: data_parsed, type: 'nota' };

      PdfService.generatePdf({ oPdf: objToPdf, imprimir: this.is_print }).catch((err) => fun.toastError(err.msg, 'ERROR'));
      this.layServ.nextCheckCuadreToday(true);
      this.router.navigateByUrl(`/admin/manipular/buscarFactura/nota_${this.tipoNota}`);
    });
  }
}
