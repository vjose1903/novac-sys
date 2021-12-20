import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, OnDestroy, OnChanges } from '@angular/core';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import * as _ from 'lodash';
import { DBservice } from '../../../core/services/bdservice.service';
import { GLOBAL } from '../../../core/services/GLOBAL';
import { ModalService } from '../../components/modal/modal.service';
import { mixinClass } from '../../mixinClass';
import { IpcService } from '../../../core/services/ipc.service';
import { LayoutService } from '../../layout/layout.service';
import * as moment from '../../../../utils/javascript/moment';
import { ArticuloC } from '../../registros/articulos/articulo';

@Component({
  selector: 'app-cuerpo-factura',
  templateUrl: './cuerpo-factura.component.html',
  styleUrls: ['./cuerpo-factura.component.scss'],
})
export class CuerpoFacturaComponent extends mixinClass implements OnInit, OnChanges, AfterViewInit, OnDestroy {
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
  control;
  llevaDescuento;
  DESCUENTO;
  listaDeDescuentos;

  sacos;
  indexRemove;

  @Input() factura;
  @Input() action;
  @Input() FechaFactura;
  @Input() propietario;
  @Input() metodo;

  @Output() getCalculosDinero = new EventEmitter<any>();
  @Output() getCuerpoFactura = new EventEmitter<any>();
  @Output() getFechaFactura = new EventEmitter<any>();

  tipoModal: string;
  saco_sistema: any;

  articuloClass = new ArticuloC();

  constructor(private dbServ: DBservice, public mServ: ModalService, private fb: FormBuilder, public _ipc: IpcService, public layServ: LayoutService) {
    super(mServ, _ipc, layServ);
    // this.rowFactura = new FormArray([new FormControl()]);
  }

  ngOnInit() {
    this.rellenarVariables();

    this._init_mixin({
      component: 'cuerpo_factura',
      _lista_subs: ['decisionModal', 'objDevuelto', 'printBase64Res', 'articuloPorCodigo', 'pressEsc', 'indexToFocus'],
    });
  }

  decisionModal(res) {
    if (this.tipoModal === 'removerArticulo' && res) this.procesoQuitarArticulo();
  }

  articuloFiltroResponse(res) {
    this.objDevueltoResponse(res);
  }

  indexToFocusResponse(res) {
    if (this.fun.hasValue(res)) {
      this.enfocarInput(`cod-${res}`);
      this.selectContenido(`cod-${res}`);
    }
  }

  objDevueltoResponse(res) {
    if (res && res.tipo_modal === 'buscarArticulo') this.LLenarRowDespuesDeFiltro(res);
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

        let omitir = ['cod', 'can', 'can_ant', 'des', 'uni', 'pre', 'tot', 'costo', 'secuencia', 'verificado'];

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
      this.control = undefined;
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
        this.control = (this.form.controls['rowFactura'] as FormArray).controls;

        this.escucharCambiosEnForm();

        resolve(true);
      }, 250);
    });
  }

  ngAfterViewInit() {
    this.getSaco();
  }

  async getSaco() {
    try {
      const res = await this.dbServ.getArticulosFiltrados('Saco sistema', 1, 1, true, false, this.FechaFactura, 'todos').toPromise();
      this.saco_sistema = res.data[0];
    } catch (error) {
      console.error(error);
    }
  }

  ngOnChanges(simpleChanges) {
    if (simpleChanges.factura && simpleChanges.factura.currentValue && this.action === 'update' && _.hasIn(this.factura, 'id')) {
      this.llenarFactura(this.factura.detalle_facturas);
    }
  }

  async procesoQuitarArticulo() {
    await this.sacarDescuento(this.indexRemove);
    await this.removeItem(this.indexRemove);
    await this.calculosTotalesGenerales();
    await this.disminuirSecuencia();
  }

  readPrecio() {
    const res = this.metodo === 'compra' && this.propietario ? false : true;
    return res;
  }

  readDescuento() {
    const res = this.metodo === 'venta' && this.propietario ? false : true;
    return res;
  }

  ModificarClass(item, clase, action) {
    GLOBAL.ModificarClass(item, clase, action);
  }

  async calcularSacoEnRow(i, row, articulo, lugar) {
    return new Promise((resolve, reject) => {
      try {
        const operacion = row.calcular_saco;
        const se_calcula = row.se_calcula_saco;
        const row_unidad = (this.control[i] as any).controls['uni'].value;
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

        const descripcion = (this.control[i] as any).controls['des'].value;

        let precio = calculo;
        if (operacion) {
          if (moment(this.FechaFactura).format('YYYY-MM-DD') > moment(this.saco_sistema.fecha_ingreso).format('YYYY-MM-DD')) precio = calculo + precio_saco;
          (this.control[i] as any).controls['des'].setValue(`${articulo.nombre}`);
          (this.control[i] as any).controls['pre'].setValue(GLOBAL.numFormatTwoDecimals(precio));
        } else {
          (this.control[i] as any).controls['pre'].setValue(GLOBAL.numFormatTwoDecimals(precio));
          if (se_calcula || lugar === 'select') (this.control[i] as any).controls['des'].setValue(`${descripcion}*`);
        }

        resolve(true);
      } catch (error) {
        this.dbServ.toastError('Error calculando el precio del saco', 'ERROR');
        resolve(false);
      }
    });
  }

  async CalculoSacos(i, lugar, e?) {
    try {
      const unidad = (this.control[i] as any).controls['uni'].value;

      if (e) e.stopPropagation();

      if (this.metodo === 'venta') {
        const articulo = (this.control[i] as any).controls['articulo'].value;

        if (articulo.calcular_saco) {
          const row = (this.control[i] as any).value;

          if (unidad) {
            this.calcularSacoEnRow(i, row, articulo, lugar).then((res) => (res ? this.calcularTotalRow(i) : () => {}));
          } else {
            this.dbServ.toastWarning('Para calcular los sacos debe de seleccionar una unidad', 'AVISO');
            (this.control[i] as any).controls['calcular_saco'].setValue(true);
          }
        } else {
          if (e) this.dbServ.toastError('A este articulo no se le calculan los sacos', 'ERROR');
          (this.control[i] as any).controls['calcular_saco'].setValue(false);
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
    if (this.control) {
      const element = this.control[i] as any;
      res = element.controls['des'].value || element.controls['cod'].value;
    }
    return res;
  }

  // =============================================
  //  RESETEAR FORMULARIO
  // =============================================
  RESETCUERPO() {
    if (this.control) {
      for (let i = 0; i < this.control.length; i++) {
        (this.control[i] as any).controls['descuento_porciento'].enable();
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
            if (!is_guardada) articulo = await this.dbServ.getArticulosFiltrados(row.codigo, 0, 0, true, false, this.FechaFactura, 'todos').toPromise();

            const cant_en_unidades_actual = row.cantidad_en_unidades;
            const multiplo = row.cantidad_en_unidades / row.cantidad;
            const cant_actual = cant_en_unidades_actual / multiplo;
            const campos = (this.control[j] as any).controls;

            campos['pre'].setValue(this.metodo === 'venta' ? GLOBAL.numFormatTwoDecimals(row.precio) : GLOBAL.numFormatTwoDecimals(row.costo));

            campos['costo'].setValue(GLOBAL.numFormatTwoDecimals(row.costo));

            campos['descuento_porciento'].setValue(row.descuento_porciento || null);
            campos['descuento_valor'].setValue(row.descuento_valor);
            campos['tot'].setValue(GLOBAL.numFormatTwoDecimals(row.total));

            campos['cod'].setValue(articulo.codigo);

            campos['can'].setValue(cant_actual);
            campos['cantidad_en_unidades'].setValue(cant_en_unidades_actual);

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

            this.aumentarSecuencia();
          } catch (error) {}
        }

        callback(true);
      } else {
        callback(false);
      }
    });
  }

  // =============================================
  //  BOTON ATRAS
  // =============================================
  atras() {
    window.history.back();
  }

  element: any;

  async saltar(e, input, i) {
    const index = i;

    const articulo = (this.control[i] as any).controls['articulo'].value;
    const codigo = (this.control[i] as any).controls['cod'].value;
    const cantidad = (this.control[i] as any).controls['can'].value;
    const unidad = (this.control[i] as any).controls['uni'].value;

    if (i >= 10 && input === 'cod-') this.addItem(i);

    if (input === 'uni-') {
      if (this.fun.hasValue(cantidad) && cantidad != 0 && this.fun.hasValue(codigo)) this.enfocarInput('uni-' + index);
    }

    if ((input === 'cod-' || input === 'pre-') && this.fun.hasValue(codigo) && this.fun.hasValue(cantidad) && this.fun.hasValue(unidad)) {
      let index = i;

      if (input === 'cod-') index++;

      this.aumentarSecuencia();
      if (this.metodo === 'venta') this.enfocarInput('cod-' + index);
      else this.enfocarInput('pre-' + index);
    }

    if (input === 'can-' && this.fun.hasValue(codigo)) {
      if (this.fun.isEmpty(articulo) || codigo !== articulo.codigo) {
        const obj = { filtrarArticulo: codigo, index: i, metodo: this.metodo, data: [], fecha_articulo: this.FechaFactura };

        this.desEnfocarInput('cod-' + i);
        this.abrirModal('buscarArticulo', obj);
      } else {
        this.enfocarInput(`can-${i}`);
      }
    }
  }

  aumentarSecuencia() {
    this.secuencia++;
    this.inputSecuencia = 'cod-' + this.secuencia;
  }

  disminuirSecuencia() {
    this.secuencia--;
    this.inputSecuencia = 'cod-' + this.secuencia;
  }

  saliDeCantidad(i) {
    const unidad = (this.control[i] as any).controls['uni'].value;
    const cantidad = (this.control[i] as any).controls['can'].value;
    const cantidad_anterior = (this.control[i] as any).controls['can_ant'].value;

    if (cantidad != cantidad_anterior) {
      if (this.fun.hasValue(unidad)) this.checkCantidadExede(i, 'change', () => {});

      (this.control[i] as any).controls['can_ant'].setValue(cantidad);
    }
  }

  async checkCantidadExede(i, lugar, callback = (arg) => {}) {
    let cantidad = 0;
    this.calcularCantidadEnUnidades({ index: i });
    const descripcion = (this.control[i] as any).controls['des'].value;

    const articulo = (this.control[i] as any).controls['articulo'].value;

    const rowsIgual = _.map(
      _.filter(this.control, (item) => item.value.des === descripcion),
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
          this.dbServ.toastError('Cantidad introducida excede la cantidad en inventario', 'ERROR');

          setTimeout(() => {
            this.enfocarInput('can-' + i);
            this.selectContenido('can-' + i);
            this.calcularCantidadEnUnidades({ index: i, clean: true });
            (this.control[i] as any).controls['uni'].setValue(null);
            (this.control[i] as any).controls['can_ant'].setValue(null);
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

  async selectMedidaChange(arg, i) {
    const medidaSelected = _.find(this.UnidadesArticulo, (unidad) => unidad.value === arg);

    this.precioDetalle = medidaSelected.precio;
    const costoDetalle = medidaSelected.costo;
    const unidad = medidaSelected.value;

    if (unidad.toLowerCase() === 'medida') {
      (this.control[i] as any).controls['uni'].setValue(null);
    } else {
      this.checkCantidadExede(i, 'change', (res) => {
        if (!res) {
          (this.control[i] as any).controls['uni'].setValue(unidad);
          (this.control[i] as any).controls['pre'].setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(this.metodo === 'venta' ? this.precioDetalle : costoDetalle)));
          (this.control[i] as any).controls['costo'].setValue(costoDetalle);

          if (this.metodo === 'venta' && moment(this.FechaFactura).format('YYYY-MM-DD') > moment(this.saco_sistema.fecha_ingreso).format('YYYY-MM-DD')) {
            this.CalculoSacos(i, 'select', undefined);
          }

          this.calcularTotalRow(i);
        }
      });
    }
  }

  verificarSecuencia(i, input?) {
    if (this.secuencia < i) this.enfocarInput(this.inputSecuencia);

    if (this.control) {
      const codigo = (this.control[i] as any).controls['cod'].value;
      const art = (this.control[i] as any).controls['articulo'].value;

      if (input === 'unidad' && this.fun.hasValue(codigo) && this.fun.hasValue(art)) {
        this.setInputDrop(i);
        this.llenarArrayUnidades(null, i);
      }
    }
  }

  calcularCantidadEnUnidades(params: { index: number; clean?: boolean } = { index: 0, clean: false }) {
    const control = this.control[params.index].controls;
    const valores = this.control[params.index].value;

    const unidad = valores['uni'];
    const cantidad = valores['can'];

    let cantidadMinima = 1;

    if (unidad && this.UnidadesArticulo.length > 0) {
      const unidad_find = this.UnidadesArticulo.find((uni) => _.lowerCase(uni.value) == _.lowerCase(unidad));
      if (unidad_find) cantidadMinima = unidad_find.cantidad;
    }

    const cant_unidades = params.clean ? 0 : cantidad * cantidadMinima;
    control['cantidad_en_unidades'].setValue(cant_unidades);
  }

  calcularTotalRow(i) {
    const control = this.control[i].controls;
    const valores = this.control[i].value;

    const precio = GLOBAL.desformatear(valores.pre);
    const cantidad = valores['can'];

    if (precio && cantidad) {
      control['tot'].setValue(GLOBAL.numFormatTwoDecimals(precio * cantidad));

      this.calcularCantidadEnUnidades({ index: i });
      this.calculosTotalesGenerales();
    }
  }

  checkNumbers(arg) {
    let res = false;
    for (let i = 0; i < arg.length; i++) {
      const tempCaracter = arg.charAt(i);
      if (tempCaracter !== ',') {
        const caracter = _.parseInt(tempCaracter);
        if (_.isNaN(caracter)) {
          res = true;
        }
      }
    }
    return res;
  }
  checkLongMillares(num) {
    let res = false;
    const splitNum = _.split(num, ',');
    splitNum.forEach((element, i) => {
      if (i !== 0) {
        if (element.length !== 3) {
          res = true;
        }
      }
    });
    return res;
  }

  revisarPrecio(i) {
    let input = (this.control[i] as any).controls['pre'];
    this.fun.revisarPrecio(input, `pre-${i}`).then((res) => {
      if (!res.error) input.setValue(res.number);
    });
  }

  calcularDescuento(i) {
    const codido = (this.control[i] as any).controls['cod'].value;
    const precioTEMP = (this.control[i] as any).controls['pre'].value;
    const precio = GLOBAL.desformatear(precioTEMP);
    const cantidad = (this.control[i] as any).controls['can'].value;
    let descuento = (this.control[i] as any).controls['descuento_porciento'].value;

    if (descuento >= 0 && descuento <= 100) {
      const total = precio * cantidad;

      if (this.fun.hasValue(codido) && (this.fun.isEmpty(descuento) || descuento == 0)) {
        (this.control[i] as any).controls['descuento_porciento'].reset();
        (this.control[i] as any).controls['descuento_valor'].reset();
        (this.control[i] as any).controls['tot'].setValue(GLOBAL.numFormatTwoDecimals(total));

        this.sacarDescuento(i);
      }

      let calculoDesc = 0;
      let nuevoTotal = 0;
      if (this.fun.hasValue(codido) && this.fun.hasValue(precio) && this.fun.hasValue(cantidad) && this.fun.hasValue(descuento)) {
        descuento = descuento / 100;

        calculoDesc = precio * descuento * cantidad;
        (this.control[i] as any).controls['descuento_valor'].setValue(calculoDesc);
        nuevoTotal = total - calculoDesc;

        (this.control[i] as any).controls['tot'].setValue(GLOBAL.numFormatTwoDecimals(nuevoTotal));
        this.calculosTotalesGenerales();
        this.calculosDescuentoGeneral(calculoDesc, i);
        this.aumentarSecuencia();
      }
    } else {
      if (descuento > 100) this.fun.toastWarning('El descuento es calculado en porciento, el valor del descuento no puede ser mayor a 100', 'AVISO');
      if (descuento < 0) this.fun.toastWarning('El descuento es calculado en porciento, el valor del descuento no puede ser menor a 0', 'AVISO');
      (this.control[i] as any).controls['descuento_porciento'].setValue(0);
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
    let tempTotal = _.reduce(this.control, (acumulado, item) => acumulado + GLOBAL.desformatear(item.value.tot), 0);

    if (tempTotal !== this.TOTAL) {
      this.TOTAL = tempTotal;

      const obj = { total: GLOBAL.redondearAdos(this.TOTAL), ITBIS: '' };

      this.getCalculosDinero.emit({ tipo: 'bruto', monto: obj });
    }
  }

  modalRemover(i, e?) {
    const name = (this.control[i] as any).controls['des'].value;
    const unidad = (this.control[i] as any).controls['uni'].value;
    let obj = {};
    obj['nombre'] = unidad ? `${name} (${unidad})` : name;

    if (name) {
      this.indexRemove = i;
      this.abrirModal('removerArticulo', obj);
    }

    if (e) e.stopPropagation();
  }

  setInputDrop(arg) {
    this.inputDrop = 'uni-' + arg;
  }

  LLenarRowDespuesDeFiltro(obj) {
    const ARTICULO = obj.data;

    const i = obj.index;

    if (this.metodo === 'venta' && ARTICULO.existencia === 0) {
      let msg = 'Producto agotado, debe de comprar mas!!!';

      if (ARTICULO.descripcion === 'Producto terminado') msg = 'Producto agotado, debe de producir mas!!!';
      this.dbServ.toastError(msg, 'ERROR');

      setTimeout(() => {
        this.enfocarInput('cod-' + i);
        this.selectContenido('cod-' + i);
      }, 5);
    } else {
      const cantidades = ARTICULO.cantidades;

      if (this.metodo === 'venta' && ARTICULO.existencia > 0 && ARTICULO.aviso_existencia > cantidades[ARTICULO.medida_alerta]) {
        let cant_restante = GLOBAL.numFormatTwoDecimals(cantidades[ARTICULO.medida_alerta]);

        let msg = `Solo quedan ${cant_restante} ${ARTICULO.medida_alerta} de este producto, debe de aumentar el inventario!!!`;

        if (ARTICULO.descripcion === 'Producto terminado') msg = `Solo quedan ${cant_restante} ${ARTICULO.medida_alerta} de este producto, debe de producir mas!!!`;
        this.dbServ.toastWarning(msg, 'AVISO');
      }

      (this.control[i] as any).controls['articulo'].setValue(ARTICULO);
      (this.control[i] as any).controls['cod'].setValue(ARTICULO.codigo);
      (this.control[i] as any).controls['des'].setValue(ARTICULO.nombre);
      (this.control[i] as any).controls['calcular_saco'].setValue(ARTICULO.calcular_saco);
      (this.control[i] as any).controls['can'].setValue(null);
      (this.control[i] as any).controls['can_ant'].setValue(null);
      (this.control[i] as any).controls['uni'].setValue(null);

      if (this.metodo === 'venta') {
        if (ARTICULO.descripcion === 'Materia prima') {
          (this.control[i] as any).controls['descuento_porciento'].disable({ onlySelf: true });
          (this.control[i] as any).controls['is_materia_prima'].setValue(true);
        } else {
          (this.control[i] as any).controls['descuento_porciento'].enable();
          (this.control[i] as any).controls['is_materia_prima'].setValue(false);
        }
      }
      this.enfocarInput('can-' + i);
    }
  }

  async llenarArrayUnidades(art?, i?) {
    const codigo = (this.control[i] as any).controls['cod'].value;
    if (!art) art = (this.control[i] as any).controls['articulo'].value;
    if (codigo && art) {
      const precioPrincipal = this.metodo === 'venta' ? art.precio_principal : art.costo_principal;
      const costoPrincipal = art.costo_principal;
      this.UnidadesArticulo = [];

      this.UnidadesArticulo.push({ value: 'Medida', precio: 0, costo: 0, cantidad: art.contenido[art.medida] });

      if (this.metodo === 'compra') this.medidasCuandoCompra(art);

      if (this.metodo === 'venta' && (art.contenido_articulos.length === 0 || art.medida !== 'Quintal')) {
        this.UnidadesArticulo.push({ value: art.medida, precio: art.precio_principal, costo: art.costo_principal, cantidad: art.contenido[art.medida] });
      }

      if (this.metodo === 'venta' && (art.descripcion === 'Producto terminado' || art.descripcion === 'Materia prima')) {
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

  medidasCuandoCompra(art) {
    this.UnidadesArticulo.push({ value: art.medida, precio: art.precio_principal, costo: art.costo_principal, cantidad: art.contenido[art.medida] });

    art.contenido_articulos.forEach((element) => {
      this.UnidadesArticulo.push({ value: element.medida, precio: element.precio, costo: element.costo, cantidad: art.contenido[element.medida] });
    });
  }
}
