import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, OnDestroy, OnChanges } from '@angular/core';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import * as _ from 'lodash';
import { GLOBAL } from '../../../core/typescript/GLOBAL';
import { MixinClass } from '../../../core/typescript/MixinClass';
import * as moment from '../../../core/javascript/moment';
import { ArticuloC } from '../../registros/articulos/articulo';

@Component({
  selector: 'app-cuerpo-factura',
  templateUrl: './cuerpo-factura.component.html',
  styleUrls: ['./cuerpo-factura.component.scss'],
})
export class CuerpoFacturaComponent extends MixinClass implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  form: FormGroup;
  ARRAY_ROWFACTURAS;

  seleccionModal;
  showModal;
  modalSearch;
  UnidadesArticulo;
  drop;

  precioDetalle;
  TOTAL;
  ITBIS;

  secuencia;
  inputSecuencia;
  inputDrop;
  filasDetalle;
  llevaDescuento;
  DESCUENTO;
  listaDeDescuentos;

  sacos;
  indexRemove;

  @Input() factura;
  @Input() action;
  @Input() fechaFactura;
  @Input() propietario;
  @Input() metodo;

  @Output() getCalculosDinero = new EventEmitter<any>();
  @Output() getCuerpoFactura = new EventEmitter<any>();
  @Output() getFechaFactura = new EventEmitter<any>();

  tipoModal: string;
  saco_sistema: any;

  articuloClass = new ArticuloC();
  minCodigo;

  constructor(private fb: FormBuilder) {
    super();
    // this.rowFactura = new FormArray([new FormControl()]);
  }

  ngOnInit() {
    this._init_mixin({
      component: 'cuerpo_factura',
      _lista_subs: ['decisionModal', 'objDevuelto', 'printBase64Res', 'articuloPorCodigo', 'pressEsc', 'noFiltro'],
    });

    this.rellenarVariables();
  }

  decisionModal(res) {
    if (this.tipoModal === 'removerArticulo' && res) this.procesoQuitarArticulo();
  }

  articuloFiltroResponse(res) {
    this.objDevueltoResponse(res);
  }

  noFiltroResponse(res) {
    if (res.tipo == 'buscarArticulo') {
      this.enfocarInput(`cod-${res.index}`);
      this.selectContenido(`cod-${res.index}`);
    }
  }

  objDevueltoResponse(res) {
    if (res && res.tipo_modal === 'buscarArticulo') this.llenarRowDespuesDeFiltro(res);
  }

  pressEscResponse(res) {
    if (this.fun.hasValue(res)) setTimeout(() => this.enfocarInput('cod-' + res), 250);
  }

  escucharCambiosEnForm() {
    this.form.valueChanges.subscribe((res) => {
      if (this.fun.hasValue(res)) this.emitirCambiosForm(res);
    });
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  emitirCambiosForm(res) {
    const detalle_factura = [];
    res.rowFactura.forEach((fila) => {
      if (this.fun.hasValue(fila.articulo)) {
        fila.articulo_id = fila?.articulo?.id;
        fila.cantidad = fila.can;
        fila.total = GLOBAL.desformatear(fila.tot);
        fila.descuento_valor = fila.descuento_valor ? (fila.descuento_valor !== null ? fila.descuento_valor : 0) : 0;
        fila.descuento_porciento = fila.descuento_porciento ? (fila.descuento_porciento !== null ? fila.descuento_porciento : 0) : 0;
        fila.itbis = 0;
        fila.unidad = fila.uni;
        fila.precio = GLOBAL.desformatear(fila.pre);
        fila.costo = GLOBAL.desformatear(fila.costo);

        let omitir = ['cod', 'can', 'can_ant', 'des', 'uni', 'pre', 'tot', 'secuencia', 'verificado'];

        if (this.metodo === 'compra') omitir = ['can', 'can_ant', 'des', 'uni', 'tot', 'secuencia', 'verificado'];

        const obj = _.omit(fila, omitir);

        if (fila.cantidad && fila.unidad) detalle_factura.push(GLOBAL.duplicarJson(obj));
      }
    });
    this.getCuerpoFactura.emit(JSON.stringify(detalle_factura));
  }

  async rellenarVariables() {
    return new Promise(async (resolve, reject) => {
      this.ARRAY_ROWFACTURAS = undefined;
      this.seleccionModal = undefined;
      this.showModal = false;
      this.modalSearch = true;
      this.UnidadesArticulo = [];
      this.precioDetalle = undefined;
      this.TOTAL = 0;
      this.ITBIS = 0;
      this.secuencia = 0;
      this.inputSecuencia = 'cod-0';
      this.inputDrop = undefined;
      this.filasDetalle = undefined;
      this.llevaDescuento = undefined;
      this.DESCUENTO = 0;
      this.listaDeDescuentos = [];
      this.sacos = [25, 50, 100];
      this.indexRemove = undefined;

      this.form = this.fb.group({
        rowFactura: this.fb.array([this.createItem(0)]),
      });

      this.ARRAY_ROWFACTURAS = this.form['rowFactura'] as FormArray;

      for (let index = 1; index <= 22; index++) {
        await this.addItem(index);
      }

      setTimeout(() => {
        this.filasDetalle = (this.form.controls['rowFactura'] as FormArray).controls;

        this.escucharCambiosEnForm();

        resolve(true);
      }, 250);
    });
  }

  ngAfterViewInit() {
    this.getSaco();
  }

  async getSaco() {
    this.articuloClass.getArticulosFiltrado({ buscar: 'Saco sistema', fecha: this.fechaFactura, paginado: false }).then((res) => {
      this.saco_sistema = res['data'][0];
    });
  }

  ngOnChanges(simpleChanges) {}

  async procesoQuitarArticulo() {
    await this.sacarDescuento(this.indexRemove);
    await this.removeItem(this.indexRemove);
    await this.calculosTotalesGenerales();
    await this.ajustarSecuencia();
  }

  readPrecio() {
    const res = this.metodo === 'compra' && this.propietario ? false : true;
    return res;
  }

  readDescuento() {
    const res = this.metodo === 'venta' && this.propietario ? false : true;
    return res;
  }

  checkCodigo(i) {
    const formulario = this.filasDetalle[i].getRawValue();

    if (GLOBAL.is_number(formulario.cod)) this.minCodigo = 5;
    else this.minCodigo = undefined;
  }

  ModificarClass(item, clase, action) {
    GLOBAL.ModificarClass(item, clase, action);
  }

  async calcularSacoEnRow(i, row, articulo, lugar) {
    return new Promise((resolve, reject) => {
      try {
        const operacion = row.calcular_saco;
        const se_calcula = row.se_calcula_saco;
        const row_unidad = (this.filasDetalle[i] as any).controls['uni'].value;
        const precio_saco = this.saco_sistema.precio_principal;

        let calculo = 0;

        if (row_unidad == articulo.medida) {
          calculo = articulo.precio_principal;
        } else {
          const splitUnidad = _.split(row_unidad, ' ');
          let unity = splitUnidad[0];
          let peso = 100 / Number(splitUnidad[2]);

          calculo = unity == 'Saco' ? articulo.precio_principal / peso : articulo.contenido_articulos[0].precio;
        }

        const descripcion = (this.filasDetalle[i] as any).controls['des'].value;

        let precio = calculo;
        if (operacion) {
          if (moment(this.fechaFactura).format('YYYY-MM-DD') > moment(this.saco_sistema.fecha_ingreso).format('YYYY-MM-DD')) precio = calculo + precio_saco;
          (this.filasDetalle[i] as any).controls['des'].setValue(`${articulo.nombre}`);
          (this.filasDetalle[i] as any).controls['pre'].setValue(GLOBAL.numFormatTwoDecimals(precio));
        } else {
          (this.filasDetalle[i] as any).controls['pre'].setValue(GLOBAL.numFormatTwoDecimals(precio));
          if (se_calcula || lugar === 'select') (this.filasDetalle[i] as any).controls['des'].setValue(`${descripcion}*`);
        }

        resolve(true);
      } catch (error) {
        this.fun.toastError('Error calculando el precio del saco', 'ERROR');
        resolve(false);
      }
    });
  }

  async CalculoSacos(i, lugar, e?) {
    try {
      const unidad = (this.filasDetalle[i] as any).controls['uni'].value;

      if (e) e.stopPropagation();

      if (this.metodo === 'venta') {
        const articulo = (this.filasDetalle[i] as any).controls['articulo'].value;

        if (articulo.calcular_saco) {
          const row = (this.filasDetalle[i] as any).value;

          if (unidad) {
            this.calcularSacoEnRow(i, row, articulo, lugar).then((res) => (res ? this.calcularTotalRow(i) : () => {}));
          } else {
            this.fun.toastWarning('Para calcular los sacos debe de seleccionar una unidad', 'AVISO');
            (this.filasDetalle[i] as any).controls['calcular_saco'].setValue(true);
          }
        } else {
          if (e) this.fun.toastError('A este articulo no se le calculan los sacos', 'ERROR');
          (this.filasDetalle[i] as any).controls['calcular_saco'].setValue(false);
        }
      }
    } catch (error) {}
  }

  selectedRow(i, bool) {
    const lista = ['cod-' + i, 'can-' + i, 'uni-' + i, 'des-' + i, 'pre-' + i, 'desc-' + i, 'tot-' + i];
    lista.forEach((row) => {
      if (this.checkIfRowContainArticulo(i)) {
        const action = bool ? 'add' : 'remove';
        this.ModificarClass(row, 'inputOscuro', action);
      }
    });
  }

  checkIfRowContainArticulo(i) {
    let res = false;
    if (this.filasDetalle) {
      const element = this.filasDetalle[i] as any;
      res = element.controls['des'].value || element.controls['cod'].value;
    }
    return res;
  }

  // =============================================
  //  RESETEAR FORMULARIO
  // =============================================
  RESETCUERPO() {
    if (this.filasDetalle) {
      for (let i = 0; i < this.filasDetalle.length; i++) {
        (this.filasDetalle[i] as any).controls['descuento_porciento'].enable();
      }
    }

    this.form.reset();
    this.TOTAL = 0;
    this.ITBIS = 0;
    this.secuencia = 0;
    this.inputSecuencia = 'cod-0';
    this.inputDrop = undefined;
    this.DESCUENTO = 0;
    this.listaDeDescuentos = [];
  }

  // =============================================
  //  CREAR MAS INPUTS PARA FACTURA
  // =============================================

  createItem(i): FormGroup {
    return this.fb.group({
      articulo: [null],
      id: [],
      cod: [null],
      can: [null],
      can_ant: [null],
      des: [null],
      uni: [null],
      pre: [null],
      costo: [null],
      descuento_porciento: [null],
      descuento_valor: [null],
      tot: [null],
      secuencia: [i],
      cantidad_en_unidades: [0],
      is_materia_prima: [false],
      calcular_saco: [false],
      verificado: [false],
    });
  }

  addItem(i): void {
    this.ARRAY_ROWFACTURAS = this.form.get('rowFactura') as FormArray;
    this.ARRAY_ROWFACTURAS.push(this.createItem(i));
  }

  removeItem(i: number) {
    (this.form.get('rowFactura') as FormArray).removeAt(i);
  }

  // =============================================
  //  MODIFICAR FACTURA
  // =============================================
  async llenarFactura(rows, is_guardada?, callback = (arg) => {}) {
    this.rellenarVariables().then(async (res) => {
      if (res) {
        for (let j = 0; j < rows.length; j++) {
          const row = rows[j];
          let articulo = row.articulo;

          try {
            if (!is_guardada) {
              this.articuloClass.getArticulosFiltrado({ buscar: row.codigo, fecha: this.fechaFactura }).then((res_articulo) => this.llenarFilas(row, _.first(res_articulo['data']), j));
            } else {
              this.llenarFilas(row, articulo, j);
            }
          } catch (error) {}
        }

        callback(true);
      } else {
        callback(false);
      }
    });
  }

  llenarFilas(row, articulo, j) {
    const cant_en_unidades_actual = row.cantidad_en_unidades;
    const multiplo = row.cantidad_en_unidades / row.cantidad;
    const cant_actual = cant_en_unidades_actual / multiplo;
    const campos = (this.filasDetalle[j] as any).controls;

    campos['pre'].setValue(this.metodo === 'venta' ? GLOBAL.numFormatTwoDecimals(row.precio) : GLOBAL.numFormatTwoDecimals(row.costo));

    campos['costo'].setValue(GLOBAL.numFormatTwoDecimals(row.costo));

    campos['descuento_porciento'].setValue(row.descuento_porciento || null);
    campos['descuento_valor'].setValue(row.descuento_valor);
    campos['tot'].setValue(GLOBAL.numFormatTwoDecimals(row.total));

    campos['cod'].setValue(articulo.codigo);

    // campos['can'].setValue(cant_actual);
    // campos['cantidad_en_unidades'].setValue(cant_en_unidades_actual);
    campos['can'].setValue(row.cantidad);
    campos['cantidad_en_unidades'].setValue(row.cantidad_en_unidades);

    campos['des'].setValue(_.capitalize(articulo.nombre));

    campos['calcular_saco'].setValue(row.calcular_saco);

    campos['articulo'].setValue(articulo);

    if (row.tipo === 'Materia prima') {
      campos['descuento_porciento'].disable({ onlySelf: true });
      campos['is_materia_prima'].setValue(true);
    } else {
      campos['descuento_porciento'].enable();
      campos['is_materia_prima'].setValue(false);
    }

    let uni = row.peso_saco ? 'Saco de ' + row.peso_saco + ' libras' : row.unidad;

    campos['uni'].setValue(uni);

    if (this.metodo === 'venta') {
      try {
        this.calcularSacoEnRow(j, row, articulo, 'llenarFact').then((res) => (res ? this.calcularTotalRow(j) : () => {}));
      } catch (error) {}
    } else {
      this.calcularTotalRow(j);
    }

    this.ajustarSecuencia();
  }

  // =============================================
  //  BOTON ATRAS
  // =============================================
  atras() {
    window.history.back();
  }

  async saltar(input, index) {
    setTimeout(() => {
      const { articulo, cod, can, uni } = this.filasDetalle[index].getRawValue();

      if (index >= 10 && input === 'cod-') this.addItem(index);

      if (input == 'uni-' && this.fun.hasValue(can) && can != 0 && this.fun.hasValue(cod)) this.enfocarInput('uni-' + index);

      if ((input === 'cod-' || input === 'pre-') && this.fun.hasValue(cod) && this.fun.hasValue(can) && can != 0 && this.fun.hasValue(uni)) {
        if (input === 'cod-') index++;

        this.ajustarSecuencia().then((res) => this.enfocarInput(input == 'cod-' ? this.inputSecuencia : `${input}${index}`));
      }

      if (input === 'can-' && this.fun.hasValue(cod)) {
        if (this.fun.isEmpty(articulo) || cod !== articulo.codigo) {
          const obj = { filtrarArticulo: cod, index, metodo: this.metodo, data: [], fecha_articulo: this.fechaFactura };
          this.abrirModal('buscarArticulo', obj);
        } else {
          this.enfocarInput(`can-${index}`);
        }
      }
    }, 0);
  }

  ajustarSecuencia() {
    return new Promise((resolve) => {
      const filas_ocupadas = _.filter(this.filasDetalle, (item) => this.fun.hasValue(item.value.articulo));
      this.secuencia = filas_ocupadas.length;

      this.inputSecuencia = 'cod-' + this.secuencia;
      resolve(true);
    });
  }

  saliDeCantidad(i) {
    const { uni, can, can_ant } = this.filasDetalle[i].getRawValue();
    if (can != can_ant) {
      if (this.fun.hasValue(uni)) this.checkCantidadExede(i, 'change', () => {});
      (this.filasDetalle[i] as any).controls['can_ant'].setValue(can);
    }
  }

  async checkCantidadExede(i, lugar, callback = (arg) => {}) {
    let cantidad = 0;
    this.llenarArrayUnidades(i);
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

        if (this.metodo === 'venta' && excede) {
          this.fun.toastError('Cantidad introducida excede la cantidad en inventario', 'ERROR');

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
      if (error.error) this.fun.toastError(error.error.msg, 'ERROR');
      callback(false);
    }
  }

  async selectMedidaChange(arg, i) {
    const medidaSelected = _.find(this.UnidadesArticulo, (unidad) => unidad.value === arg);

    this.precioDetalle = medidaSelected.precio;
    const costoDetalle = medidaSelected.costo;
    const unidad = medidaSelected.value;

    if (unidad.toLowerCase() === 'medida') {
      (this.filasDetalle[i] as any).controls['uni'].setValue(null);
    } else {
      this.checkCantidadExede(i, 'change', (excede) => {
        if (!excede) {
          (this.filasDetalle[i] as any).controls['uni'].setValue(unidad);
          (this.filasDetalle[i] as any).controls['pre'].setValue(GLOBAL.numFormatTwoDecimals(this.metodo === 'venta' ? this.precioDetalle : costoDetalle));
          (this.filasDetalle[i] as any).controls['costo'].setValue(costoDetalle);

          if (this.metodo === 'venta' && moment(this.fechaFactura).format('YYYY-MM-DD') > moment(this.saco_sistema.fecha_ingreso).format('YYYY-MM-DD')) {
            this.CalculoSacos(i, 'select', undefined);
          }

          this.calcularTotalRow(i).then(() => {
            this.ajustarSecuencia().then(() => {
              if (this.metodo === 'venta') this.enfocarInput(this.inputSecuencia);
              else this.enfocarInput(`pre-${i}`);
            });
          });
        }
      });
    }
  }

  verificarSecuencia(index, mover = true) {
    if (this.secuencia < index && mover) this.enfocarInput(this.inputSecuencia);
  }

  calcularCantidadEnUnidades(params: { index: number; clean?: boolean } = { index: 0, clean: false }) {
    const { controls, value } = this.filasDetalle[params.index];
    const { uni, can } = value;
    let cantidadMinima = 1;

    if (uni && this.UnidadesArticulo.length > 0) {
      const unidad_find = this.UnidadesArticulo.find((_uni) => _.lowerCase(_uni.value) == _.lowerCase(uni));
      if (unidad_find) cantidadMinima = unidad_find.cantidad;
    }

    const cant_unidades = params.clean ? 0 : can * cantidadMinima;
    controls['cantidad_en_unidades'].setValue(cant_unidades);

    if (cant_unidades == 0) {
      controls['pre'].setValue(null);
      controls['tot'].setValue(null);
    }
  }

  calcularTotalRow(index) {
    return new Promise((resolve) => {
      const { controls, value } = this.filasDetalle[index];

      const precio = GLOBAL.desformatear(value.pre);
      const cantidad = value['can'];

      if (precio && cantidad) {
        controls['tot'].setValue(GLOBAL.numFormatTwoDecimals(precio * cantidad));

        this.llenarArrayUnidades(index);
        this.calcularCantidadEnUnidades({ index: index });
        this.calculosTotalesGenerales();
      }

      resolve(true);
    });
  }

  revisarPrecio(i) {
    let input = (this.filasDetalle[i] as any).controls['pre'];
    this.fun.revisarPrecio(input, `pre-${i}`).then((res) => {
      if (!res.error) input.setValue(res.number);
    });
  }

  calcularDescuento(i) {
    const codido = (this.filasDetalle[i] as any).controls['cod'].value;
    const precioTEMP = (this.filasDetalle[i] as any).controls['pre'].value;
    const precio = GLOBAL.desformatear(precioTEMP);
    const cantidad = (this.filasDetalle[i] as any).controls['can'].value;
    let descuento = (this.filasDetalle[i] as any).controls['descuento_porciento'].value;

    if (descuento >= 0 && descuento <= 100) {
      const total = precio * cantidad;

      if (this.fun.hasValue(codido) && (this.fun.isEmpty(descuento) || descuento == 0)) {
        (this.filasDetalle[i] as any).controls['descuento_porciento'].reset();
        (this.filasDetalle[i] as any).controls['descuento_valor'].reset();
        (this.filasDetalle[i] as any).controls['tot'].setValue(GLOBAL.numFormatTwoDecimals(total));

        this.sacarDescuento(i);
      }

      let calculoDesc = 0;
      let nuevoTotal = 0;
      if (this.fun.hasValue(codido) && this.fun.hasValue(precio) && this.fun.hasValue(cantidad) && this.fun.hasValue(descuento)) {
        descuento = descuento / 100;

        calculoDesc = precio * descuento * cantidad;
        (this.filasDetalle[i] as any).controls['descuento_valor'].setValue(calculoDesc);
        nuevoTotal = total - calculoDesc;

        (this.filasDetalle[i] as any).controls['tot'].setValue(GLOBAL.numFormatTwoDecimals(nuevoTotal));
        this.calculosTotalesGenerales();
        this.calculosDescuentoGeneral(calculoDesc, i);
        this.ajustarSecuencia();
      }
    } else {
      if (descuento > 100) this.fun.toastWarning('El descuento es calculado en porciento, el valor del descuento no puede ser mayor a 100', 'AVISO');
      if (descuento < 0) this.fun.toastWarning('El descuento es calculado en porciento, el valor del descuento no puede ser menor a 0', 'AVISO');
      (this.filasDetalle[i] as any).controls['descuento_porciento'].setValue(0);
      this.enfocarInput(`desc-${i}`);
    }
  }

  sacarDescuento(i) {
    let acuDesc = 0;

    const currentDescuento = _.find(this.listaDeDescuentos, (item) => item.fila == i);

    if (this.fun.hasValue(currentDescuento)) {
      _.remove(this.listaDeDescuentos, currentDescuento);
      this.listaDeDescuentos.forEach((element) => (acuDesc = acuDesc + element.desc));

      this.getCalculosDinero.emit({ tipo: 'descuento', monto: acuDesc });
    }
  }

  calculosDescuentoGeneral(descuento, i) {
    let acuDesc = 0;

    let currentDescuento = _.find(this.listaDeDescuentos, (item) => item.fila === i);

    if (this.fun.hasValue(currentDescuento)) currentDescuento.desc = descuento;
    else this.listaDeDescuentos.push({ fila: i, desc: descuento });

    this.listaDeDescuentos.forEach((element) => (acuDesc = acuDesc + element.desc));

    this.getCalculosDinero.emit({ tipo: 'descuento', monto: acuDesc });
  }

  calculosTotalesGenerales() {
    const tempTotal = _.reduce(this.filasDetalle, (acumulado, item) => acumulado + GLOBAL.desformatear(item.value.tot), 0);

    if (tempTotal !== this.TOTAL) {
      this.TOTAL = tempTotal;

      const obj = { total: GLOBAL.redondearAdos(this.TOTAL), ITBIS: '' };

      this.getCalculosDinero.emit({ tipo: 'bruto', monto: obj });
    }
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

  setInputDrop(index) {
    if (this.fun.hasValue(index)) {
      const { articulo } = this.filasDetalle[index].getRawValue();
      if (this.fun.hasValue(articulo)) this.inputDrop = `uni-${index}`;
    } else {
      this.inputDrop = undefined;
    }
  }

  llenarRowDespuesDeFiltro(obj) {
    const ARTICULO = obj.data;

    const index = obj.index;

    if (this.metodo === 'venta' && ARTICULO.existencia == 0) {
      let msg = 'Producto agotado, debe de comprar mas!!!';

      if (ARTICULO.descripcion === 'Producto terminado') msg = 'Producto agotado, debe de producir mas!!!';
      this.fun.toastError(msg, 'ERROR');

      setTimeout(() => {
        this.enfocarInput('cod-' + index);
        this.selectContenido('cod-' + index);
      }, 0);
    } else {
      const cantidades = ARTICULO.cantidades;

      if (this.metodo === 'venta' && ARTICULO.existencia > 0 && ARTICULO.aviso_existencia > cantidades[ARTICULO.medida_alerta]) {
        let cant_restante = GLOBAL.numFormatTwoDecimals(cantidades[ARTICULO.medida_alerta]);

        let msg = `Solo quedan ${cant_restante} ${ARTICULO.medida_alerta} de este producto, debe de aumentar el inventario!!!`;

        if (ARTICULO.descripcion === 'Producto terminado') msg = `Solo quedan ${cant_restante} ${ARTICULO.medida_alerta} de este producto, debe de producir mas!!!`;
        this.fun.toastWarning(msg, 'AVISO');
      }

      (this.filasDetalle[index] as any).controls['articulo'].setValue(ARTICULO);
      (this.filasDetalle[index] as any).controls['cod'].setValue(ARTICULO.codigo);
      (this.filasDetalle[index] as any).controls['des'].setValue(ARTICULO.nombre);
      (this.filasDetalle[index] as any).controls['calcular_saco'].setValue(ARTICULO.calcular_saco);
      (this.filasDetalle[index] as any).controls['can'].setValue(null);
      (this.filasDetalle[index] as any).controls['can_ant'].setValue(null);
      (this.filasDetalle[index] as any).controls['uni'].setValue(null);

      if (this.metodo === 'venta') {
        const objConditions = { si: { value: true, func: 'disable' }, no: { value: false, func: 'enable' } };

        const condition = ARTICULO.descripcion === 'Materia prima' ? 'si' : 'no';

        (this.filasDetalle[index] as any).controls['descuento_porciento'][objConditions[condition].func]();
        (this.filasDetalle[index] as any).controls['is_materia_prima'].setValue([objConditions[condition].value]);
      }

      setTimeout(() => this.enfocarInput('can-' + index), 0);
    }
  }

  async llenarArrayUnidades(index) {
    const { articulo, cod } = this.filasDetalle[index].getRawValue();

    if (cod && articulo) {
      const precioPrincipal = this.metodo === 'venta' ? articulo.precio_principal : articulo.costo_principal;
      const costoPrincipal = articulo.costo_principal;
      this.UnidadesArticulo = [];

      this.UnidadesArticulo.push({ value: 'Medida', precio: 0, costo: 0, cantidad: articulo.contenido[articulo.medida] });

      if (articulo.medida != 'Quintal' || this.metodo == 'compra') {
        this.UnidadesArticulo.push({ value: articulo.medida, precio: articulo.precio_principal, costo: articulo.costo_principal, cantidad: articulo.contenido[articulo.medida] });
      }

      if (articulo.vendido_en == 'Saco' && articulo.calcular_saco) this.entrarSacosAUnidades(precioPrincipal, costoPrincipal);

      if (articulo.is_detallable || this.metodo == 'compra') {
        articulo.contenido_articulos.forEach((element) => {
          this.UnidadesArticulo.push({ value: element.medida, precio: element.precio, costo: element.costo, cantidad: articulo.contenido[element.medida] });
        });
      }

      this.UnidadesArticulo = _.uniqWith(this.UnidadesArticulo, _.isEqual);

      if (this.inputDrop) setTimeout(() => this.enfocarInput(this.inputDrop), 0);
    }
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
}
