import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ModalService } from '../components/modal/modal.service';
import { DBservice } from '../../core/services/bdservice.service';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { map } from 'rxjs/operators';
import { GLOBAL } from '../../core/services/GLOBAL';
import * as _ from 'lodash';
import * as moment from '../../../utils/javascript/moment';
import { IpcService } from '../../core/services/ipc.service';

import { LayoutService } from '../layout/layout.service';
import { mixinClass } from '../mixinClass';
import { PdfService } from '../../core/services/pdf/pdf.service';
import { ArticuloC } from '../registros/articulos/articulo';

@Component({
  selector: 'app-conduce',
  templateUrl: './conduce.component.html',
  styleUrls: ['./conduce.component.scss'],
})
export class ConduceComponent extends mixinClass implements OnInit, OnDestroy, AfterViewInit {
  listaClientes;

  cliente;
  facturas_adelantadas = [];
  facturas_adelantadas_wait = [];

  form: FormGroup;
  ARRAY_ROWARTICULOS: any;
  indexRemove: any;
  filasDetalle;

  secuencia = 0;
  inputSecuencia = 'cod-0';
  inputDrop;

  listaArticulos = [];
  UnidadesArticulo: any[];
  sacos = [25, 50, 100];

  TOTAL: number;

  info = [
    {
      titulo: 'Numero Fact',
      key: 'secuencia',
    },
    {
      titulo: 'NCF',
      key: 'numero_comprobante',
    },
    {
      titulo: 'Fecha Facturacion',
      key: 'fecha',
    },
    {
      titulo: 'Total Facturado',
      key: 'total_factura',
      formatoNumero: true,
    },
  ];

  facturaAdelantadaSelected;
  CuerpoConduce = [];
  rowsExcede = [];
  FechaConduce: any;

  articuloClass = new ArticuloC();

  constructor(
    public mServ: ModalService,
    public _ipc: IpcService,
    private dbServ: DBservice,
    private fb: FormBuilder,
    public layServ: LayoutService,
    public pdfServ: PdfService,
  ) {
    super(mServ, _ipc, layServ);
  }

  ngOnInit() {
    this._init_mixin({
      component: 'conduce',
      _lista_subs: ['decisionModal', 'objDevuelto', 'articuloPorCodigo', 'pressEsc', 'printBase64Res', 'noFiltro'],
    });

    this.form = this.fb.group({
      rowFactura: this.fb.array([this.createItem(0)]),
    });

    this.ARRAY_ROWARTICULOS = this.form['rowFactura'] as FormArray;

    for (let index = 1; index <= 22; index++) {
      this.addItem(index);
    }

    this.necesarioStar();
  }

  async necesarioStar() {
    this.FechaConduce = this.formarFechaFactura(new Date())['FechaFactura'];
    this.enfocarInput('clienteI');
  }

  initCambioMenu(arg) {
    if (arg.bool) this.layServ.nextDecisionCambioMenu(arg);
  }

  ngOnDestroy() {
    this._destroy_mixin();
    this.resetModalVaribales();
  }

  async decisionModal(res) {
    if (res) {
      if (this.tipoModal === 'removerArticulo') this.procesoQuitarArticulo();

      if (this.tipoModal === 'cancelar_conduce') this.cancelarConduce(2);

      if (this.tipoModal === 'conduce_lleno') {
        await this.form.reset();
        await this.SeleccionarFactruaAdelantada(this.facturas_adelantadas_wait);
        this.facturas_adelantadas_wait = [];
      }

      if (this.tipoModal === 'imprimir_conduce') await this.sendData();

      setTimeout(() => this.resetModalVaribales(), 1000);
    }
  }

  noFiltroResponse(res) {
    if (res.tipo == 'buscarCliente') {
      this.enfocarInput('clienteI');
      this.selectContenido('clienteI');
    }

    if (res.tipo == 'buscarArticulo') {
      this.enfocarInput(`cod-${res.index}`);
      this.selectContenido(`cod-${res.index}`);
    }
  }

  objDevueltoResponse(res) {
    if (res) {
      if (res.tipo_modal === 'buscarCliente') {
        this.cliente = res.data;
        (document.getElementById('clienteI') as any).value = res.data.nombre;
        this.BuscarFacturasAdelantadas(res.data.id);
        setTimeout(() => this.enfocarInput('cod-0'), 10);
        //
      } else if (res && res.tipo_modal === 'buscarArticulo') {
        this.LLenarRowDespuesDeFiltro(res);
        setTimeout(() => this.enfocarInput('can-' + res.index), 10);
        //
      } else if (res.tipo_modal === 'seleccionar_articulos_adelantados') {
        // mirar aqui el res
        console.log('res -> ', res);

        this.llenarConduce(res.data.body).then((res) => {
          console.log('TERMINE DE LLENAR EL CONDUCE');
        });
      }
      setTimeout(() => this.resetModalVaribales(), 1000);
    }
  }

  articuloFiltroResponse(res) {
    if (res && res.tipo_modal === 'buscarArticulo') {
      this.LLenarRowDespuesDeFiltro(res);
      setTimeout(() => this.enfocarInput('can-' + res.index), 10);
    }
  }

  pressEscResponse(res) {
    if (this.fun.hasValue(res)) {
      this.enfocarInput('cod-' + res);
      this.selectContenido('cod-' + res);
    }
  }

  resetModalVaribales() {
    this.tipoModal = undefined;
  }

  ngAfterViewInit() {
    this.filasDetalle = (this.form.controls['rowFactura'] as FormArray).controls;
  }

  aumentarSecuencia() {
    this.secuencia++;
    this.inputSecuencia = 'cod-' + this.secuencia;
  }

  // aumentarSecuencia() {
  //   this.secuencia++;
  //   this.inputSecuencia = 'cod-' + this.secuencia;
  //   this.inputDrop = 'uni-' + this.secuencia;
  //   this.drop = false;
  // }

  async procesoQuitarArticulo() {
    await this.removeItem(this.indexRemove);
    await this.disminuirSecuencia();
    // await this.chequearExcede();
  }

  async chequearExcede() {
    for (let i = 0; i < this.filasDetalle.value.length; i++) {
      const element = this.filasDetalle.value[i];

      if (element.cod) {
        const excede = await this.checkCantidadExede(i, 'change', element.des);
      } else {
        this.rowsExcede = _.difference(this.rowsExcede, [i]);
      }
    }
  }

  disminuirSecuencia() {
    this.secuencia--;
    this.inputSecuencia = 'cod-' + this.secuencia;
  }

  async saltar(input, i) {
    let index = i;
    const unidad = (this.filasDetalle[i] as any).controls['uni'].value;
    const articulo = (this.filasDetalle[i] as any).controls['articulo'].value;
    const codigo = (this.filasDetalle[i] as any).controls['cod'].value;
    const cantidad = (this.filasDetalle[i] as any).controls['can'].value;

    if (i >= 10 && input === 'cod-') this.addItem(i);

    if (input === 'can-' && this.fun.hasValue(codigo)) {
      if (this.fun.isEmpty(articulo) || codigo !== articulo.codigo) {
        const obj = { filtrarArticulo: codigo, index: i, metodo: 'venta', data: [], fecha_articulo: this.FechaConduce };

        this.desEnfocarInput('cod-' + i);
        this.abrirModal('buscarArticulo', obj);
      } else {
        this.enfocarInput(`can-${i}`);
      }
    }

    if (input === 'uni-') {
      if (this.fun.hasValue(cantidad) && cantidad != 0 && this.fun.hasValue(codigo)) this.enfocarInput('uni-' + index);
    }

    if (input === 'cod-' && this.fun.hasValue(unidad) && _.lowerCase(unidad) != _.lowerCase('medida')) {
      this.aumentarSecuencia();
      if (this.fun.hasValue(cantidad) && cantidad != 0 && this.fun.hasValue(codigo)) this.enfocarInput('cod-' + (index + 1));
    }
  }

  LLenarRowDespuesDeFiltro(obj) {
    const ARTICULO = obj.data;

    const i = obj.index;

    if (ARTICULO.existencia === 0) {
      let msg = 'Producto agotado, debe de comprar mas!!!';

      if (ARTICULO.descripcion === 'Producto terminado') msg = 'Producto agotado, debe de producir mas!!!';
      this.dbServ.toastError(msg, 'ERROR');

      setTimeout(() => {
        this.enfocarInput('cod-' + i);
        this.selectContenido('cod-' + i);
      }, 5);
    } else {
      const cantidades = ARTICULO.cantidades;

      if (ARTICULO.existencia > 0 && ARTICULO.aviso_existencia > cantidades[ARTICULO.medida_alerta]) {
        let cant_restante = GLOBAL.numFormatTwoDecimals(cantidades[ARTICULO.medida_alerta]);

        let msg = `Solo quedan ${cant_restante} ${ARTICULO.medida_alerta} de este producto, debe de aumentar el inventario!!!`;

        if (ARTICULO.descripcion === 'Producto terminado') msg = `Solo quedan ${cant_restante} ${ARTICULO.medida_alerta} de este producto, debe de producir mas!!!`;
        this.dbServ.toastWarning(msg, 'AVISO');
      }

      (this.filasDetalle[i] as any).controls['articulo'].setValue(ARTICULO);
      (this.filasDetalle[i] as any).controls['cod'].setValue(ARTICULO.codigo);
      (this.filasDetalle[i] as any).controls['des'].setValue(ARTICULO.nombre);
      (this.filasDetalle[i] as any).controls['can'].setValue(null);
      (this.filasDetalle[i] as any).controls['can_ant'].setValue(null);
      (this.filasDetalle[i] as any).controls['uni'].setValue(null);

      this.enfocarInput('can-' + i);
    }
  }

  async llenarArrayUnidades(art?, i?) {
    const codigo = (this.filasDetalle[i] as any).controls['cod'].value;
    if (!art) art = (this.filasDetalle[i] as any).controls['articulo'].value;
    if (codigo && art) {
      const precioPrincipal = art.precio_principal;
      const costoPrincipal = art.costo_principal;
      this.UnidadesArticulo = [];

      this.UnidadesArticulo.push({ value: 'Medida', precio: 0, costo: 0, cantidad: art.contenido[art.medida] });

      if (art.contenido_articulos.length === 0 || art.medida !== 'Quintal') {
        this.UnidadesArticulo.push({ value: art.medida, precio: art.precio_principal, costo: art.costo_principal, cantidad: art.contenido[art.medida] });
      }

      if (art.descripcion === 'Producto terminado' || art.descripcion === 'Materia prima') {
        if (art.vendido_en === 'Saco' && art.calcular_saco) this.entrarSacosAUnidades(precioPrincipal, costoPrincipal);
      }

      const detallable = art.is_detallable;
      if (detallable) this.articuloDetallable(art);

      this.UnidadesArticulo = _.uniqWith(this.UnidadesArticulo, _.isEqual);

      const estoy_en = document.activeElement.id;
      if (_.includes(estoy_en, 'uni')) setTimeout(() => this.enfocarInput(estoy_en), 150);
    }
  }

  articuloDetallable(art) {
    art.contenido_articulos.forEach((element) => {
      this.UnidadesArticulo.push({ value: element.medida, precio: element.precio, costo: element.costo, cantidad: art.contenido[element.medida] });
    });
  }

  entrarSacosAUnidades(precioQuintal, costoQuintal) {
    this.sacos.forEach((saco) => {
      const valor = 'Saco de ' + saco + ' libras';
      this.UnidadesArticulo.push({
        value: valor,
        precio: this.calcularPrecioSaco(saco, precioQuintal),
        costo: this.calcularPrecioSaco(saco, costoQuintal),
        cantidad: saco,
      });
    });
  }

  calcularPrecioSaco(cant, precio) {
    const res = (cant / 100) * precio;
    return GLOBAL.redondearAdos(res);
  }
  // =============================================
  //  MODAL PARA FILTRAR CLIENTES
  // =============================================

  async abrirModalFiltro(nombre) {
    if (this.fun.hasValue(nombre)) {
      const obj = { data: [], filtrarCliente: nombre };
      this.desEnfocarInput('clienteI');
      this.abrirModal('buscarCliente', obj);
    }
  }

  calcularCantidadEnUnidades(params: { index: number; clean?: boolean } = { index: 0, clean: false }) {
    const control = this.filasDetalle[params.index].controls;
    const valores = this.filasDetalle[params.index].value;

    const unidad = valores['uni'];
    const cantidad = valores['can'];

    let cantidadMinima = 1;
    if (unidad && this.UnidadesArticulo.length > 0) cantidadMinima = this.UnidadesArticulo.find((uni) => _.lowerCase(uni.value) === _.lowerCase(unidad)).cantidad;

    const cant_unidades = params.clean ? 0 : cantidad * cantidadMinima;
    control['cantidad_en_unidades'].setValue(cant_unidades);
  }
  prueba() {
    console.log('this.filasDetalle --> ', this.filasDetalle);
  }
  // =============================================
  async checkCantidadExede(i, lugar, callback = (arg) => {}) {
    let cantidad = 0;
    this.calcularCantidadEnUnidades({ index: i });

    const articulo = (this.filasDetalle[i] as any).controls['articulo'].value;

    const rowsIgual = _.map(
      _.filter(this.filasDetalle, (item) => item.controls.articulo?.value?.id == articulo.id),
      'value',
    );

    cantidad = _.reduce(rowsIgual, (acumulado, item) => acumulado + item.cantidad_en_unidades, 0);

    if (lugar === 'saltar') i--;

    try {
      let excede = true;

      const extra = { afterPath: `check_excede/${articulo.id}`, parameters: { cantidad: cantidad } };
      await this.articuloClass.getAll(extra).then((res) => {
        excede = res['data'];

        if (excede) {
          this.dbServ.toastError('Cantidad introducida excede la cantidad en inventario', 'ERROR');

          setTimeout(() => {
            this.enfocarInput('can-' + i);
            this.selectContenido('can-' + i);
            this.calcularCantidadEnUnidades({ index: i, clean: true });
            (this.filasDetalle[i] as any).controls['uni'].setValue(null);
            (this.filasDetalle[i] as any).controls['can_ant'].setValue(null);
          }, 250);

          callback(true);
        } else {
          callback(false);
        }
      });
    } catch (error) {
      if (error.error) this.dbServ.toastError(error.error.msg, 'ERROR');
      callback(false);
    }
  }

  addItem(i): void {
    this.ARRAY_ROWARTICULOS = this.form.get('rowFactura') as FormArray;
    this.ARRAY_ROWARTICULOS.push(this.createItem(i));
  }

  removeItem(i: number) {
    (this.form.get('rowFactura') as FormArray).removeAt(i);
  }

  verificarSecuencia(i, input?) {
    if (this.secuencia < i) this.enfocarInput(this.inputSecuencia);

    if (this.filasDetalle) {
      const codigo = (this.filasDetalle[i] as any).controls['cod'].value;
      const art = (this.filasDetalle[i] as any).controls['articulo'].value;

      if (input === 'unidad' && this.fun.hasValue(codigo) && this.fun.hasValue(art)) {
        this.setInputDrop(i);
        this.llenarArrayUnidades(null, i);
      }
    }
  }

  saliDeCantidad(i) {
    const unidad = (this.filasDetalle[i] as any).controls['uni'].value;
    const cantidad = (this.filasDetalle[i] as any).controls['can'].value;
    const cantidad_anterior = (this.filasDetalle[i] as any).controls['can_ant'].value;

    if (cantidad != cantidad_anterior) {
      if (this.fun.hasValue(unidad)) this.checkCantidadExede(i, 'change', () => {});

      (this.filasDetalle[i] as any).controls['can_ant'].setValue(cantidad);
    }
  }

  async selectMedidaChange(arg, i) {
    const medidaSelected = _.find(this.UnidadesArticulo, (unidad) => unidad.value === arg);

    const unidad = medidaSelected.value;

    if (unidad.toLowerCase() === 'medida') {
      (this.filasDetalle[i] as any).controls['uni'].setValue(null);
    } else {
      this.checkCantidadExede(i, 'change', (excede) => {
        if (!excede) (this.filasDetalle[i] as any).controls['uni'].setValue(unidad);
      });
    }
  }

  async calculateCantidadEnUnidades(params: { index: number; clean?: boolean } = { index: 0, clean: false }) {
    const control = this.filasDetalle[params.index].controls;
    const valores = this.filasDetalle[params.index].value;

    const unidad = valores['uni'];
    const cantidad = valores['can'];

    let cantidadMinima = 1;
    if (unidad && this.UnidadesArticulo.length > 0) cantidadMinima = this.UnidadesArticulo.find((uni) => _.lowerCase(uni.value) === _.lowerCase(unidad)).cantidad;

    const cant_unidades = params.clean ? 0 : cantidad * cantidadMinima;
    control['cantidad_en_unidades'].setValue(cant_unidades);
  }

  setInputDrop(arg) {
    this.inputDrop = 'uni-' + arg;
  }

  createItem(i): FormGroup {
    return this.fb.group({
      id: [],
      articulo: [null],
      detalle_factura_id: [],
      cod: [null],
      uni: [null],
      des: [null],
      can: [null],
      can_ant: [null],
      max_can: [9007199254740991],
      can_original: [0],
      cantidad_en_unidades: [null],
      secuencia: [i],
    });
  }

  modalRemover(i, e?) {
    const name = (this.filasDetalle[i] as any).controls['des'].value;
    const unidad = (this.filasDetalle[i] as any).controls['uni'].value;
    let obj = {};
    obj['nombre'] = unidad ? `${name} (${unidad})` : name;

    if (name) {
      this.indexRemove = i;
      this.abrirModal('removerArticulo', obj);
    }

    if (e) e.stopPropagation();
  }

  selectedRow(i, bool) {
    const lista = [`cod-${i}`, `can-${i}`, `uni-${i}`, `des-${i}`];

    lista.forEach((row) => {
      if (this.checkIfRowContainArticulo(i)) GLOBAL.ModificarClass(row, 'inputOscuro', bool ? 'add' : 'remove');
    });
  }

  async BuscarFacturasAdelantadas(id) {
    try {
      this.facturas_adelantadas = await this.dbServ
        .getFacturasByParams('1', id, 0, true, 0, 0, false)
        .pipe(
          map(
            (fact) =>
              (fact = fact.data.map((val) => {
                val.secuencia = _.padStart(val.numero_factura, 8, '0');
                val.fecha = moment(val.fecha_equivalente).format('DD-MM-YYYY');
                val.fechaV = moment(val.fecha_vencimiento).isValid() ? moment(val.fecha_vencimiento).format('DD-MM-YYYY') : '';
                val.estado_ = val.estado ? 'fas fa-check' : 'fas fa-times';
                val.monto = GLOBAL.formatearNumero(GLOBAL.redondearAdos(val.balance));

                for (let i = 0; i < val.detalle_facturas.length; i++) {
                  const detalle = val.detalle_facturas[i];
                  detalle.select = false;
                }

                return val;
              })),
          ),
        )
        .toPromise();
      console.log(' facturas_adelantadas ==> ', this.facturas_adelantadas);
    } catch (error) {}
  }

  async SeleccionarFactruaAdelantada(factura) {
    if (factura) {
      factura.detalle_facturas.map((detalle) => {
        const formArray = this.form.get('rowFactura') as FormArray;
        const existe = formArray.value.find((d) => d.detalle_factura_id === detalle.id);

        detalle.select = !!existe;
        detalle.disable = !!existe;

        return detalle;
      });
      this.abrirModal('seleccionar_articulos_adelantados', factura.detalle_facturas);
      // }
    }
  }

  checkIfRowContainArticulo(i) {
    let res = false;
    if (this.filasDetalle) {
      const element = this.filasDetalle[i] as any;
      res = element.controls['des'].value || element.controls['cod'].value;
    }
    return res;
  }

  abrirModalDinamicText(texto, type) {
    const obj = { texto_modal: texto };
    let tipo_modal;

    if (type === 1) tipo_modal = 'conduce_lleno';
    else if (type === 2) tipo_modal = 'imprimir_conduce';
    else tipo_modal = 'cancelar_conduce';

    this.abrirModal('dinamico_texto', obj, tipo_modal);
  }

  parsearDetalleModal(articulos) {
    const articulos_parsed = [];

    for (let i = 0; i < this.filasDetalle.length; i++) {
      const row_conduce = this.filasDetalle[i].value;

      if (row_conduce.id) {
        for (let j = 0; j < articulos.length; j++) {
          const articulo = articulos[j];

          const i = _.findIndex(this.filasDetalle, (control: any) => {
            return control.id === articulo.id;
          });

          if (i !== -1) {
            articulo.cantidad = this.filasDetalle[i].value.can + articulo.retirado;
            articulos_parsed.push(articulo);
          } else {
            if (row_conduce.cod && row_conduce.des) {
              articulos_parsed.push(row_conduce);
            }
          }
        }
      } else {
        if (row_conduce.cod && row_conduce.des) {
          articulos_parsed.push(row_conduce);
        }
      }
    }
    this.form.reset();
  }
  // TODO: seguir de aqui para abajo

  llenarConduce(detalles, conteo = 0, firstResolve = null) {
    return new Promise((resolve) => {
      firstResolve ??= resolve;
      this.llenarFila(detalles[conteo], this.secuencia).then((res) => {
        conteo++;
        if (conteo < detalles.length) this.llenarConduce(detalles, conteo, firstResolve);
        else firstResolve(true);
      });
    });

    // this.llenarFila(detalles[conteo], this.secuencia).then((res) => {});

    // for (let j = 0; j < detalles.length; j++) {
    //   const detalle = detalles[j];
    //   console.log('this.secuencia --> ', this.secuencia);

    // for (let i = 0; i < this.filasDetalle.length; i++) {
    //   const filaDetalle = this.filasDetalle[i].value;

    //   const existe = this.filasDetalle.find((d) => d.value.detalle_factura_id === detalle.id);

    //   if (filaDetalle.des && filaDetalle.cod) {
    //     if (!filaDetalle.detalle_factura_id && filaDetalle.articulo.id === detalle.articulo_id) {
    //       const splitUnidad = _.split(filaDetalle.uni, ' ');

    //       if (detalle.peso_saco && detalle.peso_saco === splitUnidad[2]) {
    //         this.llenarFila(detalle, i);
    //       } else if (detalle.unidad === filaDetalle.uni) {
    //         this.llenarFila(detalle, i);
    //       }
    //     }
    //   } else {
    //     if (!existe && detalle.destroy !== 1) this.llenarFila(detalle, i);
    //   }
    // }
    // }
    // const sig_detalle_factura_id = (this.filasDetalle[0] as any).controls['detalle_factura_id'].value;

    // if (sig_detalle_factura_id) {
    //   this.enfocarInput('can-0');
    // } else {
    //   this.enfocarInput('cod-0');
    // }
  }

  verSiExcede(i) {
    return this.rowsExcede.includes(i);
  }

  disableCamposFactAdelantadas(i) {
    let res = false;
    const detalle_factura_id = (this.filasDetalle[i] as any).controls['detalle_factura_id'].value;
    if (detalle_factura_id) {
      res = true;
    }
    return res;
  }

  async llenarFila(element, i) {
    return new Promise((resolve) => {
      const cant_en_unidades_actual = element.cantidad_en_unidades - element.retirado;
      const multiplo = element.cantidad_en_unidades / element.cantidad;
      const cant_actual = cant_en_unidades_actual / multiplo;
      this.articuloClass.getArticulosFiltrado({ buscar: element.codigo, fecha: this.FechaConduce }).then((result) => {
        const articulo = _.first(result);
        // const cant_en_unidades_actual = cant_en_unidades_actual * multiplo;

        (this.filasDetalle[i] as any).controls['detalle_factura_id'].setValue(element.id);
        // (this.control[i] as any).controls['articulo_id'].setValue(element.articulo_id);
        (this.filasDetalle[i] as any).controls['cod'].setValue(element.codigo);

        (this.filasDetalle[i] as any).controls['can'].setValue(cant_actual);
        (this.filasDetalle[i] as any).controls['can_ant'].setValue(cant_actual);
        (this.filasDetalle[i] as any).controls['max_can'].setValue(cant_actual);
        (this.filasDetalle[i] as any).controls['can_original'].setValue(element.cantidad);
        (this.filasDetalle[i] as any).controls['cantidad_en_unidades'].setValue(cant_en_unidades_actual);
        (this.filasDetalle[i] as any).controls['articulo'].setValue(articulo);

        (this.filasDetalle[i] as any).controls['des'].setValue(articulo.nombre);
        let uni = '';

        if (element.peso_saco) uni = 'Saco de ' + element.peso_saco + ' libras';
        else uni = element.unidad;

        (this.filasDetalle[i] as any).controls['uni'].setValue(uni);
        (this.filasDetalle[i] as any).controls['uni'].disable();

        setTimeout(async () => {
          this.checkCantidadExede(i, 'change', (res) => {
            if (res) this.rowsExcede.push(i);
          });

          this.aumentarSecuencia();
          resolve(true);
        }, 100);
      });
    });
  }

  excedeMaxCan(i) {
    const detalle_factura_id = (this.filasDetalle[i] as any).controls['detalle_factura_id'].value;
    const max_can = (this.filasDetalle[i] as any).controls['max_can'].value;
    const can_original = (this.filasDetalle[i] as any).controls['can_original'].value;
    const can = (this.filasDetalle[i] as any).controls['can'].value;
    if (detalle_factura_id && can > max_can) {
      if (can_original > max_can) {
        this.dbServ.toastError('No puede introducir una cantidad mayor a la cantidad restante de la factura ', 'ERROR');
      } else {
        this.dbServ.toastError('No puede introducir una cantidad mayor a la cantidad de la factura ', 'ERROR');
      }
      (this.filasDetalle[i] as any).controls['can'].setValue(max_can);
      this.enfocarInput('can-' + i);
    }
  }

  getMaxCan(i) {
    const detalle_factura_id = (this.filasDetalle[i] as any).controls['detalle_factura_id'].value;
    const max_can = (this.filasDetalle[i] as any).controls['max_can'].value;
    if (detalle_factura_id) {
      return max_can;
    } else {
      return 9007199254740991;
    }
  }

  p() {
    for (let i = 0; i < this.filasDetalle.value.length; i++) {
      const element = this.filasDetalle.value[i];
      if (element.des) {
      } else {
        break;
      }
    }
  }
  async ParsearCuerpo() {
    this.CuerpoConduce = [];
    let res = true;

    // for (let i = 0; i < this.control.value.length; i++) {
    //   const element = this.control.value[i];
    for (let i = 0; i < this.filasDetalle.length; i++) {
      const control = this.filasDetalle[i] as any;

      const codigo_ = control['cod'].value;
      const unidad_ = control['uni'].value;
      const cantidad_ = control['can'].value;

      if (codigo_ && unidad_ && cantidad_) {
        try {
          control['articulo'] = await this.dbServ.getArticulosFiltrados(codigo_, 0, 0, true, false, this.FechaConduce, 'todos').toPromise();
        } catch (error) {}

        // control['articulo'] = this.listaArticulos.filter((art) => art.codigo === control.cod)[0].id;

        this.CuerpoConduce.push({
          detalle_factura_id: control['detalle_factura_id'].value ? control['detalle_factura_id'].value : null,
          articulo_id: control['articulo'].value.id,
          cantidad: cantidad_,
          cantidad_en_unidades: control['cantidad_en_unidades'].value,
          unidad: unidad_,
        });
        this.checkCantidadExede(i, 'change', (res) => {
          if (res) {
            res = false;
          }
        });
      } else {
        break;
      }
    }
    return res;
  }

  async imprimirConduce() {
    if (!this.cliente) {
      this.dbServ.toastWarning('Conduce no tiene cliente', 'Aviso');
    } else {
      const cuerpoBien = await this.ParsearCuerpo();

      if (cuerpoBien) {
        if (this.CuerpoConduce.length === 0) {
          this.dbServ.toastWarning('Conduce no tiene Articulos', 'Aviso');
        } else {
          this.abrirModalDinamicText('Seguro que desea imprimir el conduce', 2);
        }
      }
    }
  }

  async sendData() {
    const empleado = this.fun.getUser();

    const cabecera_conduce = {};
    cabecera_conduce['user_id'] = empleado.id;
    cabecera_conduce['cliente_id'] = this.cliente.id;
    cabecera_conduce['numero_conduce'] = '';
    cabecera_conduce['detalle_conduces_attributes'] = this.CuerpoConduce;

    try {
      const res = await this.dbServ.createConduce(cabecera_conduce).toPromise();
      this.dbServ.toastSuccess('Conduce realizado.', 'CORRECTO');

      const obj = { data: res, type: 'conduce' };

      this.cancelarConduce(2);
      this.pdfServ.generatePdf(obj).then((res) => {
        if (res.status === 'si') {
          const objBase = {
            base64: res.body,
            filename: res.file,
            type: 'conduce',
          };
          this._ipc.send('printBase64', objBase);
          this.layServ.nextCheckCuadreToday(true);
        }
      });
    } catch (error) {
      if (error.error) {
        this.dbServ.toastError(error.error.msg, 'ERROR');
      }
    }
  }

  printBase64Res(res) {
    if (res.status === 'si') {
    } else {
      this.dbServ.toastError(res.msg, 'ERROR');
    }
  }

  resetForm() {
    for (let i = 0; i < this.filasDetalle.length; i++) {
      const control = this.filasDetalle[i].value;

      if (control.des && control.cod) {
        (this.filasDetalle[i] as any).controls['detalle_factura_id'].setValue(null);
        // (this.control[i] as any).controls['articulo_id'].setValue(null);
        (this.filasDetalle[i] as any).controls['articulo'].setValue(null);
        (this.filasDetalle[i] as any).controls['cod'].setValue(null);

        (this.filasDetalle[i] as any).controls['des'].setValue(null);
        (this.filasDetalle[i] as any).controls['can'].setValue(null);
        (this.filasDetalle[i] as any).controls['max_can'].setValue(9007199254740991);
        (this.filasDetalle[i] as any).controls['can_original'].setValue(0);
        (this.filasDetalle[i] as any).controls['cantidad_en_unidades'].setValue(null);
        (this.filasDetalle[i] as any).controls['uni'].setValue(null);
        (this.filasDetalle[i] as any).controls['uni'].enable();
      }
    }
  }

  borrar() {
    this.resetForm();
    this.cliente = undefined;
    this.facturas_adelantadas_wait = [];
    this.facturas_adelantadas = [];
    this.secuencia = 0;
    this.inputSecuencia = 'cod-0';
    this.inputDrop = undefined;
    this.facturaAdelantadaSelected = undefined;
    this.rowsExcede = [];
  }

  cancelarConduce(secuencia) {
    if (secuencia === 1) {
      this.abrirModalDinamicText('Conduce no terminado, ¿Desea cancelarlo?', null);
    } else {
      this.borrar();
      (document.getElementById('clienteI') as any).value = '';
      setTimeout(() => this.enfocarInput('clienteI'), 10);
    }
  }
}
