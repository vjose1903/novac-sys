import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import * as _ from 'lodash';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { ArticuloC } from '../../registros/articulos/articulo';
import { BuscarArticuloComponent } from '../../components/formularios en modales/buscar-articulo/buscar-articulo.component';
import { fun } from '../../../core/services/functions.service';
import { RemoverArticuloComponent } from './remover-articulo/remover-articulo.component';
import { razon_remover } from './remover-articulo/contantes';
import { ConfigI } from '../../../core/typescript/config-interface';
import { SingletonService } from '../../../core/services/singleton.service';

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
  @Input() modo_factura;
  @Input() pre_factura_selected;

  @Output() getCalculosDinero = new EventEmitter<any>();
  @Output() getCuerpoFactura = new EventEmitter<any>();
  @Output() getFechaFactura = new EventEmitter<any>();

  articuloClass = new ArticuloC();
  minCodigo;
  productosDevueltos: any;
  dropRowConfig: any;
  configApp: ConfigI;
  constructor(private fb: FormBuilder) {
    super();
    // this.rowFactura = new FormArray([new FormControl()]);
  }

  ngOnInit() {
    this._init_mixin({ component: 'cuerpo_factura', is_routing: false });
    this.configApp = SingletonService.configServ.getConfig({ isPromise: false }) as ConfigI;
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

        let omitir = ['cod', 'can', 'can_ant', 'des', 'uni', 'pre', 'tot', 'key', 'secuencia', 'verificado', 'is_materia_prima'];

        if (this.metodo === 'compra') omitir = ['can', 'can_ant', 'des', 'uni', 'tot', 'key', 'secuencia', 'verificado', 'is_materia_prima'];

        const obj = _.omit(fila, omitir);

        if (fila.cantidad && fila.unidad) detalle_factura.push(fun.duplicarJson(obj));
      }
    });

    this.getCuerpoFactura.emit({ tipo: 'cuerpo', data: fun.duplicarJson(detalle_factura) });
    this.getCuerpoFactura.emit({ tipo: 'devuelto', data: this.productosDevueltos });
  }

  async rellenarVariables() {
    return new Promise(async (resolve, reject) => {
      this.ARRAY_ROWFACTURAS = undefined;
      this.UnidadesArticulo = [];
      this.productosDevueltos = [];
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

  procesoQuitarArticulo(key, data) {
    if (this.pre_factura_selected && data) {
      this.retirarArticuloPreFactura(key, data);
    } else {
      this.pasosQuitarArticulo(key);
    }
  }

  retirarArticuloPreFactura(key, data) {
    const detalle_actual = _.find(this.filasDetalle, (detalle) => detalle.value.key == key);
    const cantidad_articulo_original = detalle_actual.value.can;
    // is_devuelto
    detalle_actual.controls.can.setValue(detalle_actual.value.can - data.cantidad);
    detalle_actual.controls.cantidad_en_unidades.setValue(detalle_actual.value.can * detalle_actual.value.articulo.contenido[detalle_actual.value.articulo.medida]);

    if (data.cantidad < cantidad_articulo_original) {
      if (data.razon == razon_remover.producto_defectuoso) {
        const producto_defectuoso = this.parsearProductoDevueltos(fun.duplicarJson(detalle_actual.value), data, true);
        setTimeout(() => this.llenarFilas(producto_defectuoso, producto_defectuoso.articulo, this.secuencia), 10);
        //
      } else if (data.razon == razon_remover.no_venta) {
        const producto_devuelto = this.parsearProductoDevueltos(fun.duplicarJson(detalle_actual.value), data, false);
        setTimeout(() => this.modificarProductosDevueltos('add', producto_devuelto), 10);
        //
      }
    } else if (detalle_actual.value.can == data.cantidad) this.pasosQuitarArticulo;
  }

  modificarProductosDevueltos(action, data) {
    if (action == 'add') {
      const producto = _.pick(data, ['articulo_id', 'cantidad', 'articulo', 'calcular_saco', 'cantidad_en_unidades', 'costo', 'descuento_valor', 'id', 'is_defectuoso', 'is_devuelto', 'itbis', 'precio', 'total', 'unidad']);
      producto['articulo_id'] = producto.articulo.id;

      this.productosDevueltos.push(producto);
    }
    // if (action == 'remove') this.productosDevueltos.push(data);
  }

  parsearProductoDevueltos(producto, data, is_defectuoso) {
    producto.can = data.cantidad;
    producto.cantidad = data.cantidad;
    producto.cantidad_en_unidades = data.cantidad * producto.articulo.contenido[producto.articulo.medida];
    producto.id = null;
    producto.key = fun.generateKey();
    producto['is_defectuoso'] = is_defectuoso;
    producto['from_pre_factura'] = true;
    producto['is_devuelto'] = true;

    if (is_defectuoso) producto.precio /= 2;
    if (is_defectuoso) producto.total /= 2;
    return producto;
  }

  async pasosQuitarArticulo(key) {
    await this.sacarDescuento(key);
    await this.removeItem(this.indexRemove);
    await this.calculosTotalesGenerales();
    await this.ajustarSecuencia();
  }

  abrirOverlay(dropRowConfig, event) {
    this.dropRowConfig = dropRowConfig;
    this.dropRowConfig.toggle(event);
  }

  readPrecio() {
    let res = true;

    if (fun.hasValue(this.propietario)) {
      if (this.metodo == 'compra') {
        res = false;
      } else if (this.metodo == 'venta') {
        res = !this.configApp.facturacion_editar_precio;
      }
    }

    return res;
  }

  readDescuento() {
    const res = (this.metodo == 'venta' || this.metodo === 'pre_venta') && this.propietario ? false : true;
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
    if (fun.hasValue(this.form)) this.form.reset();
    this.TOTAL = 0;
    this.ITBIS = 0;
    this.secuencia = 0;
    this.inputSecuencia = 'cod-0';
    this.inputDrop = undefined;
    this.DESCUENTO = 0;
    this.listaDeDescuentos = [];
    this.productosDevueltos = [];
  }

  // =============================================
  //  CREAR MAS INPUTS PARA FACTURA
  // =============================================

  createItem(i): FormGroup {
    return this.fb.group({
      key: [null],
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
      is_defectuoso: [false],
      is_devuelto: [false],
      from_pre_factura: [false],
      vende_sin_inventario: [false],
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
  async llenarFactura(rows, is_guardada?) {
    return new Promise<any>((resolve, reject) => {
      this.rellenarVariables().then(async (res) => {
        if (res) {
          for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            let articulo = row.articulo;

            try {
              if (!is_guardada) {
                this.articuloClass.getArticulosFiltrado({ buscar: row.codigo, fecha: this.fechaFactura }).then((res_articulo) => this.llenarFilas(row, _.first(res_articulo['data']), index));
              } else {
                this.llenarFilas(row, articulo, index);
              }
            } catch (error) {}
          }

          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  llenarFilas(row, articulo, index) {
    const campos = (this.filasDetalle[index] as any).controls;

    campos['pre'].setValue(this.metodo === 'venta' || this.metodo === 'pre_venta' ? fun.numFormatTwoDecimals(row.precio) : fun.numFormatTwoDecimals(row.costo));
    campos['costo'].setValue(fun.numFormatTwoDecimals(row.costo));
    campos['descuento_valor'].setValue(fun.isEmpty(row.descuento_valor) || row.descuento_valor == 0 ? null : row.descuento_valor);
    campos['tot'].setValue(fun.numFormatTwoDecimals(row.total));

    campos['cod'].setValue(articulo.codigo);

    campos['can'].setValue(row.cantidad);
    campos['key'].setValue(fun.generateKey());
    campos['cantidad_en_unidades'].setValue(row.cantidad_en_unidades);

    campos['des'].setValue(`${_.capitalize(articulo.nombre)} ${row.is_defectuoso ? ' (defectuoso)' : ''}`);

    campos['calcular_saco'].setValue(row.calcular_saco);
    campos['is_defectuoso'].setValue(row.is_defectuoso);
    campos['is_devuelto'].setValue(row.is_devuelto || false);
    campos['from_pre_factura'].setValue(row.from_pre_factura || false);

    campos['articulo'].setValue(articulo);
    campos['vende_sin_inventario'].setValue(this.configApp.vende_sin_inventario);

    campos['is_materia_prima'].setValue(row.tipo == 'Materia prima');

    let uni = row.peso_saco ? 'Saco de ' + row.peso_saco + ' libras' : row.unidad;

    campos['uni'].setValue(uni);

    this.calcularTotalRow(index);

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
      this.ajustarSecuencia().then((res) => setTimeout(() => this.enfocarInput(this.inputSecuencia), 10));
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
            const metodo = this.metodo == 'pre_venta' ? 'venta' : this.metodo;
            const obj = { palabra_a_buscar: cod, index, metodo: metodo, data: [], fecha_articulo: this.fechaFactura };
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
      if (this.metodo === 'venta' && !this.pre_factura_selected && fun.hasValue(uni)) this.checkCantidadExede(i, 'change', () => {});
      (this.filasDetalle[i] as any).controls['can_ant'].setValue(can);
    }
  }

  async checkCantidadExede(i, lugar, callback = (arg) => {}) {
    let cantidad = 0;
    this.llenarArrayUnidades(i);
    this.calcularCantidadEnUnidades({ index: i });

    const articulo = (this.filasDetalle[i] as any).controls['articulo'].value;
    const from_pre_factura = (this.filasDetalle[i] as any).controls['from_pre_factura'].value;

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

        if (this.metodo === 'venta' && !from_pre_factura && excede) {
          fun.toastError('Cantidad introducida excede la cantidad en inventario', 'ERROR');
          if (this.configApp.vende_sin_inventario) {
            callback(false);
          } else {
            setTimeout(() => {
              this.enfocarInput('can-' + i);
              this.selectContenido('can-' + i);
              this.calcularCantidadEnUnidades({ index: i, clean: true });
              (this.filasDetalle[i] as any).controls['uni'].setValue(null);
              (this.filasDetalle[i] as any).controls['can_ant'].setValue(null);
            }, 250);
            callback(true);
          }
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
          (this.filasDetalle[index] as any).controls['pre'].setValue(fun.numFormatTwoDecimals(this.metodo === 'venta' || this.metodo === 'pre_venta' ? this.precioDetalle : costoDetalle));
          (this.filasDetalle[index] as any).controls['costo'].setValue(costoDetalle);

          this.calcularTotalRow(index).then(() => {
            this.ajustarSecuencia().then(() => {
              if (this.metodo == 'venta' || this.metodo === 'pre_venta') this.enfocarInput(this.inputSecuencia);
              else this.enfocarInput(`pre-${index}`);
            });
          });
        }
      });
    }
  }

  verificarSecuencia(index, mover = true) {
    if (this.secuencia < index && mover) this.enfocarInput(this.inputSecuencia);
    else {
      if (mover) (document.activeElement as any).select();
    }
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

  calcularDescuento(index) {
    const codido = (this.filasDetalle[index] as any).controls['cod'].value;
    const precioTEMP = (this.filasDetalle[index] as any).controls['pre'].value;
    const key = (this.filasDetalle[index] as any).controls['key'].value;
    const precio = fun.desformatear(precioTEMP);
    const cantidad = (this.filasDetalle[index] as any).controls['can'].value;

    let descuento = (this.filasDetalle[index] as any).controls['descuento_valor'].value;

    if (descuento >= 0) {
      const total = precio * cantidad;

      if (fun.hasValue(codido) && (fun.isEmpty(descuento) || descuento == 0)) {
        (this.filasDetalle[index] as any).controls['descuento_valor'].reset();
        (this.filasDetalle[index] as any).controls['tot'].setValue(fun.numFormatTwoDecimals(total));
        this.sacarDescuento(key);
      }

      let nuevoTotal = 0;
      if (fun.hasValue(codido) && fun.hasValue(precio) && fun.hasValue(cantidad) && fun.hasValue(descuento)) {
        nuevoTotal = total - descuento;

        (this.filasDetalle[index] as any).controls['tot'].setValue(fun.numFormatTwoDecimals(nuevoTotal));
        this.calculosTotalesGenerales();
        this.calculosDescuentoGeneral(descuento, key);
        this.ajustarSecuencia();
      }
    } else {
      if (descuento < 0) fun.toastWarning('El descuento no puede ser menor a 0', 'AVISO');
      (this.filasDetalle[index] as any).controls['descuento_valor'].setValue(0);
      this.enfocarInput(`desc-${index}`);
    }
  }

  sacarDescuento(key) {
    const currentDescuento = _.find(this.listaDeDescuentos, (item) => item.key == key);

    if (fun.hasValue(currentDescuento)) {
      _.remove(this.listaDeDescuentos, currentDescuento);
      const acuDesc = _.reduce(this.listaDeDescuentos, (acumulado, item) => acumulado + item.desc, 0);

      this.getCalculosDinero.emit({ tipo: 'descuento', monto: acuDesc });
    }
  }

  calculosDescuentoGeneral(descuento, key) {
    let currentDescuento = _.find(this.listaDeDescuentos, (item) => item.key === key);

    if (fun.hasValue(currentDescuento)) currentDescuento.desc = descuento;
    else this.listaDeDescuentos.push({ key: key, desc: descuento });

    const acuDesc = _.reduce(this.listaDeDescuentos, (acumulado, item) => acumulado + item.desc, 0);

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

  modalRemover(index, event?) {
    const name = (this.filasDetalle[index] as any).controls['des'].value;
    const cantidad = (this.filasDetalle[index] as any).controls['can'].value;
    const unidad = (this.filasDetalle[index] as any).controls['uni'].value;
    const key = (this.filasDetalle[index] as any).controls['key'].value;
    this.indexRemove = index;

    let obj = { index, key, cantidad, is_prefactura_selected: fun.hasValue(this.pre_factura_selected) };
    obj['nombre'] = unidad ? `${name} (${unidad})` : name;

    this.handleModalForm({
      component: RemoverArticuloComponent,
      inputs: obj,
      id: 'removerArticulo',
      header: 'Confirmación',
      width: this.modo_factura != 'Pre_factura' ? '30rem' : '40rem',
      botones: {
        aceptar: { show: true, disable: false },
        cancelar: { show: true, disable: false },
      },
    });

    if (this.dropRowConfig) this.dropRowConfig.hide();
    if (event) event.stopPropagation();
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
    const articulo = obj.data;

    const index = obj.index;

    if ((this.metodo === 'venta' || this.metodo === 'pre_venta') && articulo.existencia == 0) {
      let msg = 'Producto agotado, debe de comprar mas!!!';

      if (_.lowerCase(articulo.descripcion) === 'producto terminado') msg = 'Producto agotado, debe de producir mas!!!';
      fun.toastError(msg, 'ERROR');

      if (this.configApp.vende_sin_inventario) {
        this.continuarLlenarRow({ articulo: articulo, index: index });
      } else {
        setTimeout(() => {
          this.enfocarInput('cod-' + index);
          this.selectContenido('cod-' + index);
        }, 0);
      }
    } else {
      this.continuarLlenarRow({ articulo: articulo, index: index });
    }
  }

  continuarLlenarRow(params: { articulo: any; index: number }) {
    const cantidades = params.articulo.cantidades;

    if ((this.metodo === 'venta' || this.metodo === 'pre_venta') && params.articulo.existencia > 0 && params.articulo.aviso_existencia > cantidades[params.articulo.medida_alerta]) {
      let cant_restante = fun.numFormatTwoDecimals(cantidades[params.articulo.medida_alerta]);

      let msg = `Solo quedan ${cant_restante} ${params.articulo.medida_alerta} de este producto, debe de aumentar el inventario!!!`;

      if (_.lowerCase(params.articulo.descripcion) === 'producto terminado') msg = `Solo quedan ${cant_restante} ${params.articulo.medida_alerta} de este producto, debe de producir mas!!!`;
      fun.toastWarning(msg, 'AVISO');
    }

    (this.filasDetalle[params.index] as any).controls['articulo'].setValue(params.articulo);
    (this.filasDetalle[params.index] as any).controls['key'].setValue(fun.generateKey());
    (this.filasDetalle[params.index] as any).controls['cod'].setValue(params.articulo.codigo);
    (this.filasDetalle[params.index] as any).controls['des'].setValue(params.articulo.nombre);
    (this.filasDetalle[params.index] as any).controls['calcular_saco'].setValue(params.articulo.calcular_saco);
    (this.filasDetalle[params.index] as any).controls['can'].setValue(null);
    (this.filasDetalle[params.index] as any).controls['can_ant'].setValue(null);
    (this.filasDetalle[params.index] as any).controls['uni'].setValue(null);
    (this.filasDetalle[params.index] as any).controls['vende_sin_inventario'].setValue(this.configApp.vende_sin_inventario);

    if (this.metodo === 'venta' || this.metodo === 'pre_venta') (this.filasDetalle[params.index] as any).controls['is_materia_prima'].setValue(params.articulo.descripcion == 'Materia prima');

    setTimeout(() => this.enfocarInput('can-' + params.index), 0);
  }

  async llenarArrayUnidades(index) {
    const { articulo, cod } = this.filasDetalle[index].getRawValue();

    if (cod && articulo) {
      const precioPrincipal = this.metodo === 'venta' || this.metodo === 'pre_venta' ? articulo.precio_principal : articulo.costo_principal;
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
      if (arg.modal_id == 'removerArticulo') {
        this.procesoQuitarArticulo(arg.key, arg.data);
      } else this.llenarRowDespuesDeFiltro(arg);
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
