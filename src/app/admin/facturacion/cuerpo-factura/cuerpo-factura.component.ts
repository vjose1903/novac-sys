import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import * as _ from 'lodash';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { ArticuloC } from '../../registros/articulos/articulo';
import { BuscarArticuloComponent } from '../../components/formularios en modales/buscar-articulo/buscar-articulo.component';
import { fun } from '../../../core/services/functions.service';

@Component({
  selector: 'app-cuerpo-factura',
  templateUrl: './cuerpo-factura.component.html',
  styleUrls: ['./cuerpo-factura.component.scss'],
})
export class CuerpoFacturaComponent extends MixinClass implements OnInit, OnDestroy {
  form: FormGroup;
  ARRAY_ROWFACTURAS;

  UnidadesArticulo;
  drop;

  precioDetalle;
  TOTAL;
  ITBIS;

  secuencia;
  inputSecuencia;
  inputDrop;
  filasDetalle;
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

  articuloClass = new ArticuloC();
  minCodigo;

  constructor(private fb: FormBuilder) {
    super();
    // this.rowFactura = new FormArray([new FormControl()]);
  }

  ngOnInit() {
    this._init_mixin({ component: 'cuerpo_factura', is_routing: false });

    this.rellenarVariables();
  }

  escucharCambiosEnForm() {
    this.form.valueChanges.subscribe((res) => {
      if (fun.hasValue(res)) this.emitirCambiosForm(res);
    });
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  emitirCambiosForm(res) {
    const detalle_factura = [];
    res.rowFactura.forEach((fila) => {
      if (fun.hasValue(fila.articulo)) {
        fila.articulo_id = fila?.articulo?.id;
        fila.cantidad = fila.can;
        fila.total = fun.desformatear(fila.tot);
        fila.descuento_valor = fila.descuento_valor ? (fun.hasValue(fila.descuento_valor) ? fila.descuento_valor : 0) : 0;
        fila.itbis = 0;
        fila.unidad = fila.uni;
        fila.precio = fun.desformatear(fila.pre);
        fila.costo = fun.desformatear(fila.costo);

        let omitir = ['cod', 'can', 'can_ant', 'des', 'uni', 'pre', 'tot', 'secuencia', 'verificado'];

        if (this.metodo === 'compra') omitir = ['can', 'can_ant', 'des', 'uni', 'tot', 'secuencia', 'verificado'];

        const obj = _.omit(fila, omitir);

        if (fila.cantidad && fila.unidad) detalle_factura.push(fun.duplicarJson(obj));
      }
    });
    this.getCuerpoFactura.emit(JSON.stringify(detalle_factura));
  }

  async rellenarVariables() {
    return new Promise(async (resolve, reject) => {
      this.ARRAY_ROWFACTURAS = undefined;
      this.UnidadesArticulo = [];
      this.precioDetalle = undefined;
      this.TOTAL = 0;
      this.ITBIS = 0;
      this.secuencia = 0;
      this.inputSecuencia = 'cod-0';
      this.inputDrop = undefined;
      this.filasDetalle = undefined;
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

  async procesoQuitarArticulo() {
    await this.sacarDescuento(this.indexRemove);
    await this.removeItem(this.indexRemove);
    await this.calculosTotalesGenerales();
    await this.ajustarSecuencia();
  }

  checkDisable(input, index, verificate) {
    let isDisable = false;

    if (verificate) {
      if (fun.isEmpty(this.propietario)) isDisable = true;
      if (!isDisable && input == 'pre-') isDisable = this.readPrecio();
    } else {
      isDisable = true;
    }

    fun.ModificarClass(`${input}${index}`, 'disabled', isDisable ? 'add' : 'remove');

    if (isDisable) {
      this.desEnfocarInput(`${input}${index}`);
      document.getElementById(`${input}${index}`)['value'] = null;
    }
  }

  readPrecio() {
    const res = this.metodo == 'compra' && this.propietario ? false : true;
    return res;
  }

  readDescuento() {
    const res = this.metodo == 'venta' && this.propietario ? false : true;
    return res;
  }

  checkCodigo(i) {
    const formulario = this.filasDetalle[i].getRawValue();

    if (fun.hasValue(formulario.cod) && fun.is_number(formulario.cod)) this.minCodigo = 5;
    else this.minCodigo = undefined;
  }

  selectedRow(i, bool) {
    const lista = ['cod-' + i, 'can-' + i, 'uni-' + i, 'des-' + i, 'pre-' + i, 'desc-' + i, 'tot-' + i];
    lista.forEach((row) => {
      if (this.checkIfRowContainArticulo(i)) {
        const action = bool ? 'add' : 'remove';
        fun.ModificarClass(row, 'inputOscuro', action);
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
    if (this.form) this.form.reset();
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
      descuento_valor: [null],
      tot: [null],
      secuencia: [i],
      cantidad_en_unidades: [0],
      is_materia_prima: [false],
      calcular_saco: [false],
      verificado: [false],
    });
  }

  addItem(index): void {
    this.ARRAY_ROWFACTURAS = this.form.get('rowFactura') as FormArray;
    this.ARRAY_ROWFACTURAS.push(this.createItem(index));
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

    campos['pre'].setValue(this.metodo === 'venta' ? fun.numFormatTwoDecimals(row.precio) : fun.numFormatTwoDecimals(row.costo));
    campos['costo'].setValue(fun.numFormatTwoDecimals(row.costo));
    campos['descuento_valor'].setValue(row.descuento_valor);
    campos['tot'].setValue(fun.numFormatTwoDecimals(row.total));

    campos['cod'].setValue(articulo.codigo);

    // campos['can'].setValue(cant_actual);
    // campos['cantidad_en_unidades'].setValue(cant_en_unidades_actual);
    campos['can'].setValue(row.cantidad);
    campos['cantidad_en_unidades'].setValue(row.cantidad_en_unidades);

    campos['des'].setValue(_.capitalize(articulo.nombre));

    campos['calcular_saco'].setValue(row.calcular_saco);

    campos['articulo'].setValue(articulo);

    campos['is_materia_prima'].setValue(row.tipo == 'Materia prima');

    let uni = row.peso_saco ? 'Saco de ' + row.peso_saco + ' libras' : row.unidad;

    campos['uni'].setValue(uni);

    this.calcularTotalRow(j);

    this.ajustarSecuencia();
  }

  // =============================================
  //  BOTON ATRAS
  // =============================================
  atras() {
    window.history.back();
  }

  seleccionarCampoEnTurno() {
    setTimeout(() => {
      this.ajustarSecuencia().then((res) => this.enfocarInput(this.inputSecuencia));
    }, 100);
  }

  async saltar(input, index) {
    setTimeout(() => {
      if (fun.hasValue(this.propietario)) {
        const { articulo, cod, can, uni } = this.filasDetalle[index].getRawValue();

        if (index >= 10 && input === 'can-') this.addItem(index);

        if (input == 'uni-' && fun.hasValue(can) && can != 0 && fun.hasValue(cod)) this.enfocarInput('uni-' + index);

        if ((input === 'cod-' || input === 'pre-') && fun.hasValue(cod) && fun.hasValue(can) && can != 0 && fun.hasValue(uni)) {
          if (input === 'cod-') index++;

          this.ajustarSecuencia().then((res) => this.enfocarInput(input == 'cod-' ? this.inputSecuencia : `${input}${index}`));
        }

        if (input === 'can-' && fun.hasValue(cod)) {
          if (fun.isEmpty(articulo) || cod !== articulo.codigo) {
            const obj = { palabra_a_buscar: cod, index, metodo: this.metodo, data: [], fecha_articulo: this.fechaFactura };
            this.handleModalForm({
              component: BuscarArticuloComponent,
              inputs: obj,
              id: 'buscarArticulo',
              header: 'BUSCAR ARTICULO',
              width: '56.25rem',
              height: '31.25rem',
              botones: {
                aceptar: { show: false, disable: false },
                cancelar: { show: false, disable: false },
              },
            });
            this.enfocarInput('input_fantasma');
          } else {
            this.enfocarInput(`can-${index}`);
          }
        }
      }
    }, 0);
  }

  ajustarSecuencia() {
    return new Promise((resolve) => {
      const filas_ocupadas = _.filter(this.filasDetalle, (item) => fun.hasValue(item.value.articulo));
      this.secuencia = filas_ocupadas.length;

      this.inputSecuencia = 'cod-' + this.secuencia;
      resolve(true);
    });
  }

  saliDeCantidad(i) {
    const { uni, can, can_ant } = this.filasDetalle[i].getRawValue();
    if (can != can_ant) {
      if (fun.hasValue(uni)) this.checkCantidadExede(i, 'change', () => {});
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
          fun.toastError('Cantidad introducida excede la cantidad en inventario', 'ERROR');

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
      if (error.error) fun.toastError(error.error.msg, 'ERROR');
      callback(false);
    }
  }

  async selectMedidaChange(arg, index) {
    const medidaSelected = _.find(this.UnidadesArticulo, (unidad) => unidad.value === arg);

    this.precioDetalle = medidaSelected.precio;
    const costoDetalle = medidaSelected.costo;
    const unidad = medidaSelected.value;

    if (unidad.toLowerCase() === 'medida') {
      (this.filasDetalle[index] as any).controls['uni'].setValue(null);
    } else {
      this.checkCantidadExede(index, 'change', (excede) => {
        if (!excede) {
          (this.filasDetalle[index] as any).controls['uni'].setValue(unidad);
          (this.filasDetalle[index] as any).controls['pre'].setValue(fun.numFormatTwoDecimals(this.metodo === 'venta' ? this.precioDetalle : costoDetalle));
          (this.filasDetalle[index] as any).controls['costo'].setValue(costoDetalle);

          this.calcularTotalRow(index).then(() => {
            this.ajustarSecuencia().then(() => {
              if (this.metodo == 'venta') this.enfocarInput(this.inputSecuencia);
              else this.enfocarInput(`pre-${index}`);
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

      const precio = fun.desformatear(value.pre);
      const cantidad = value['can'];

      if (precio && cantidad) {
        controls['tot'].setValue(fun.numFormatTwoDecimals(precio * cantidad));

        this.llenarArrayUnidades(index);
        this.calcularCantidadEnUnidades({ index: index });
        this.calculosTotalesGenerales();
      }

      resolve(true);
    });
  }

  revisarPrecio(index) {
    let input = (this.filasDetalle[index] as any).controls['pre'];
    fun.revisarPrecio(input, `pre-${index}`).then((res) => {
      if (!res.error) input.setValue(res.number);
    });
  }

  calcularDescuento(i) {
    const codido = (this.filasDetalle[i] as any).controls['cod'].value;
    const precioTEMP = (this.filasDetalle[i] as any).controls['pre'].value;
    const precio = fun.desformatear(precioTEMP);
    const cantidad = (this.filasDetalle[i] as any).controls['can'].value;

    let descuento = (this.filasDetalle[i] as any).controls['descuento_valor'].value;

    if (descuento >= 0) {
      const total = precio * cantidad;

      if (fun.hasValue(codido) && (fun.isEmpty(descuento) || descuento == 0)) {
        (this.filasDetalle[i] as any).controls['descuento_valor'].reset();
        (this.filasDetalle[i] as any).controls['tot'].setValue(fun.numFormatTwoDecimals(total));
        this.sacarDescuento(i);
      }

      let nuevoTotal = 0;
      if (fun.hasValue(codido) && fun.hasValue(precio) && fun.hasValue(cantidad) && fun.hasValue(descuento)) {
        nuevoTotal = total - descuento;

        (this.filasDetalle[i] as any).controls['tot'].setValue(fun.numFormatTwoDecimals(nuevoTotal));
        this.calculosTotalesGenerales();
        this.calculosDescuentoGeneral(descuento, i);
        this.ajustarSecuencia();
      }
    } else {
      if (descuento < 0) fun.toastWarning('El descuento no puede ser menor a 0', 'AVISO');
      (this.filasDetalle[i] as any).controls['descuento_valor'].setValue(0);
      this.enfocarInput(`desc-${i}`);
    }
  }

  sacarDescuento(index) {
    let acuDesc = 0;

    const currentDescuento = _.find(this.listaDeDescuentos, (item) => item.fila == index);

    if (fun.hasValue(currentDescuento)) {
      _.remove(this.listaDeDescuentos, currentDescuento);
      this.listaDeDescuentos.forEach((element) => (acuDesc = acuDesc + element.desc));

      this.getCalculosDinero.emit({ tipo: 'descuento', monto: acuDesc });
    }
  }

  calculosDescuentoGeneral(descuento, index) {
    let acuDesc = 0;

    let currentDescuento = _.find(this.listaDeDescuentos, (item) => item.fila === index);

    if (fun.hasValue(currentDescuento)) currentDescuento.desc = descuento;
    else this.listaDeDescuentos.push({ fila: index, desc: descuento });

    this.listaDeDescuentos.forEach((element) => (acuDesc = acuDesc + element.desc));

    this.getCalculosDinero.emit({ tipo: 'descuento', monto: acuDesc });
  }

  calculosTotalesGenerales() {
    const tempTotal = _.reduce(this.filasDetalle, (acumulado, item) => acumulado + fun.desformatear(item.value.tot), 0);

    if (tempTotal !== this.TOTAL) {
      this.TOTAL = tempTotal;

      const obj = { total: fun.redondearAdos(this.TOTAL), ITBIS: '' };

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

      const confirmationObj = {
        id: 'removerArticulo',
        texto: 'Seguro que desea remover el articulo',
        header: 'Confirmación',
        siFunction: (instance) => {
          this.closeModal(instance);
          this.procesoQuitarArticulo();
        },
        width: '30rem',
      };
      this.confirmationModal(confirmationObj);
    }

    if (e) e.stopPropagation();
  }

  setInputDrop(index) {
    if (fun.hasValue(index)) {
      const { articulo } = this.filasDetalle[index].getRawValue();
      if (fun.hasValue(articulo)) this.inputDrop = `uni-${index}`;
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
      fun.toastError(msg, 'ERROR');

      setTimeout(() => {
        this.enfocarInput('cod-' + index);
        this.selectContenido('cod-' + index);
      }, 0);
    } else {
      const cantidades = ARTICULO.cantidades;

      if (this.metodo === 'venta' && ARTICULO.existencia > 0 && ARTICULO.aviso_existencia > cantidades[ARTICULO.medida_alerta]) {
        let cant_restante = fun.numFormatTwoDecimals(cantidades[ARTICULO.medida_alerta]);

        let msg = `Solo quedan ${cant_restante} ${ARTICULO.medida_alerta} de este producto, debe de aumentar el inventario!!!`;

        if (ARTICULO.descripcion === 'Producto terminado') msg = `Solo quedan ${cant_restante} ${ARTICULO.medida_alerta} de este producto, debe de producir mas!!!`;
        fun.toastWarning(msg, 'AVISO');
      }

      (this.filasDetalle[index] as any).controls['articulo'].setValue(ARTICULO);
      (this.filasDetalle[index] as any).controls['cod'].setValue(ARTICULO.codigo);
      (this.filasDetalle[index] as any).controls['des'].setValue(ARTICULO.nombre);
      (this.filasDetalle[index] as any).controls['calcular_saco'].setValue(ARTICULO.calcular_saco);
      (this.filasDetalle[index] as any).controls['can'].setValue(null);
      (this.filasDetalle[index] as any).controls['can_ant'].setValue(null);
      (this.filasDetalle[index] as any).controls['uni'].setValue(null);

      if (this.metodo === 'venta') (this.filasDetalle[index] as any).controls['is_materia_prima'].setValue(ARTICULO.descripcion == 'Materia prima');

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

      if (articulo.vendido_en == 'Saco' && articulo.calcular_saco && this.metodo != 'compra') this.entrarSacosAUnidades(precioPrincipal, costoPrincipal);

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
    return fun.redondearAdos(res);
  }

  async getDataFromModal(arg, search) {
    if (arg?.tipo == 'data_no_found') {
      this.enfocarInput(`cod-${arg.index}`);
      this.selectContenido(`cod-${arg.index}`);
    } else {
      this.llenarRowDespuesDeFiltro(arg);
    }
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
    console.warn('modalInstance: ', modalInstance);

    modalInstance.closeModal(modalInstance.id, 'cancelar');
  }
}
