import { FacturacionService } from './../facturacion.service';
import { tipoDocFacturacion } from './../factura';
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
import { Ss } from '../../../core/services/singleton.service';
import { ModalClass } from '../../components/modal/modal-class';

@Component({
  selector: 'app-cuerpo-factura',
  templateUrl: './cuerpo-factura.component.html',
  styleUrls: ['./cuerpo-factura.component.scss'],
})
export class CuerpoFacturaComponent extends MixinClass implements OnInit, OnDestroy {
  form: FormGroup;
  ARRAY_ROWFACTURAS;

  UnidadesArticulo = [];
  drop;

  precioDetalle;

  secuencia;
  inputSecuencia;
  inputDrop;
  filasDetalle;
  DESCUENTO;
  listaDeDescuentos = [];
  fun = fun;
  tipoDocFacturacion = tipoDocFacturacion;

  sacos;
  indexRemove;

  @Input() factura;
  @Input() fechaFactura;
  @Input() modo_factura;

  @Output() getCalculosDinero = new EventEmitter<any>();
  @Output() getCuerpoFactura = new EventEmitter<any>();
  @Output() getFechaFactura = new EventEmitter<any>();

  articuloClass = new ArticuloC();
  minCodigo;
  productos_devueltos = [];
  dropRowConfig: any;
  configApp: ConfigI;
  constructor(private fb: FormBuilder, public factServ: FacturacionService) {
    super();
    // this.rowFactura = new FormArray([new FormControl()]);
  }

  ngOnInit() {
    this._init_mixin({ component: 'cuerpo_factura', is_routing: false });
    this.configApp = Ss.configServ.getConfig({ isPromise: false }) as ConfigI;
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
        fila.descuento_valor = fila.descuento_valor ? (fun.hasValue(fila.descuento_valor) ? fun.desformatear(fila.descuento_valor) : 0) : 0;
        fila.unidad = fila.uni;
        fila.precio = fun.desformatear(fila.pre);
        fila.costo = fun.desformatear(fila.costo);

        let omitir = ['cod', 'can', 'can_ant', 'des', 'uni', 'pre', 'tot', 'key', 'secuencia', 'verificado'];

        if (this.factServ.tipoDocumento == tipoDocFacturacion.compra) omitir = ['can', 'can_ant', 'des', 'uni', 'tot', 'key', 'secuencia', 'verificado'];

        const obj = _.omit(fila, omitir);

        if (fila.cantidad && fila.unidad) detalle_factura.push(fun.duplicarJson(obj));
      }
    });

    this.getCuerpoFactura.emit({ tipo: 'cuerpo', data: fun.duplicarJson(detalle_factura) });
    this.getCuerpoFactura.emit({ tipo: 'devuelto', data: this.productos_devueltos });
  }

  async rellenarVariables() {
    return new Promise(async (resolve, reject) => {
      try {
        this.listaDeDescuentos.length = 0;
        this.UnidadesArticulo.length = 0;
        this.productos_devueltos.length = 0;

        [this.ARRAY_ROWFACTURAS, this.precioDetalle, this.inputDrop, this.filasDetalle, this.indexRemove] = Array(5).fill(undefined);
        [this.secuencia, this.DESCUENTO] = Array(2).fill(0);
        this.inputSecuencia = 'cod-0';

        this.sacos = [25, 50, 100];

        this.form = this.fb.group({
          rowFactura: this.fb.array([this.createItem(0)]),
        });

        this.ARRAY_ROWFACTURAS = this.form['rowFactura'] as FormArray;

        for (let index = 1; index <= 25; index++) await this.addItem(index);

        this.filasDetalle = (this.form.controls['rowFactura'] as FormArray).controls;
        this.escucharCambiosEnForm();

        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  procesoQuitarArticulo(key, data_remover) {
    if (this.factServ.pre_venta_selected && data_remover) {
      this.retirarArticuloPreFactura(key, data_remover);
    } else {
      this.pasosQuitarArticulo(key);
    }
  }

  retirarArticuloPreFactura(key, data_remover) {
    const current_detalle = _.find(this.filasDetalle, (detalle) => detalle.value.key == key);
    const index_current_detalle = _.findIndex(this.filasDetalle, (detalle) => detalle.value.key == key);

    const origin_current_detalle = fun.duplicarJson(current_detalle.value);
    fun.logRed('origin_current_detalle.can ', origin_current_detalle.can);

    const medida = current_detalle.value.articulo.tipo_articulo.tipo == 'servicio' ? 'Servicio' : current_detalle.value.articulo.medida;

    current_detalle.controls.can.setValue(current_detalle.value.can - data_remover.cantidad);
    current_detalle.controls.cantidad_en_unidades.setValue(current_detalle.value.can * current_detalle.value.articulo.contenido[medida]);
    current_detalle.controls.descuento_valor.setValue((origin_current_detalle.descuento_valor / origin_current_detalle.can) * current_detalle.value.can);

    this.calcularDescuento(index_current_detalle);
    this.calcularTotalRow(index_current_detalle);

    const detalles_llenos = this.getDetallesLlenos();

    console.log(' ');
    console.log(' ');
    console.log('detalle_actual ', current_detalle.value);
    console.log(' ');

    if (data_remover.cantidad <= origin_current_detalle.can) {
      if (data_remover.razon == razon_remover.producto_defectuoso) {
        const articulo_ya_retirado = _.find(detalles_llenos, (detalle) => detalle.key_origin == current_detalle.value.key);
        const articulo_retirado_index = fun.hasValue(articulo_ya_retirado) ? _.findIndex(this.filasDetalle, (detalle) => detalle.value.key == articulo_ya_retirado.key) : null;

        const producto_defectuoso = this.parsearProductoDevueltos(origin_current_detalle, data_remover, true);

        setTimeout(() => {
          if (fun.hasValue(articulo_ya_retirado)) {
            this.addToProductosDevueltos(producto_defectuoso, 'modify', { data: articulo_ya_retirado, tipo: 'producto_defectuoso', index: articulo_retirado_index });
          } else {
            this.llenarDetalles(producto_defectuoso, producto_defectuoso.articulo, this.secuencia);
          }
        }, 10);
        //
      } else if (data_remover.razon == razon_remover.no_venta) {
        const articulo_ya_retirado = _.find(this.productos_devueltos, (detalle) => detalle.key_origin == current_detalle.value.key);
        console.log('this.productos_devueltos ', this.productos_devueltos);

        const producto_devuelto = this.parsearProductoDevueltos(origin_current_detalle, data_remover, false);

        const action = fun.hasValue(articulo_ya_retirado) ? 'modify' : 'add';
        setTimeout(() => this.addToProductosDevueltos(producto_devuelto, action, { data: articulo_ya_retirado, tipo: 'producto_devuelto' }), 10);
        //
      }
    }
    fun.logGreen('origin_current_detalle.can ', origin_current_detalle.can);
    fun.logYellow('data_remover.cantidad ', data_remover.cantidad);

    if (origin_current_detalle.can == data_remover.cantidad) this.pasosQuitarArticulo(origin_current_detalle.key);
  }

  addToProductosDevueltos(data, tipo: 'add' | 'modify', articulo_ya_retirado?) {
    const producto = _.pick(data, ['key', 'articulo_id', 'cantidad', 'articulo', 'calcular_saco', 'cantidad_en_unidades', 'costo', 'descuento_valor', 'id', 'is_defectuoso', 'is_devuelto', 'itbis', 'precio', 'total', 'unidad', 'key_origin']);
    producto['articulo_id'] = producto.articulo.id;

    console.log('  ');
    console.log('next_producto_retirar ', producto);

    if (tipo == 'add') {
      this.productos_devueltos.push(producto);
    }

    if (tipo == 'modify') {
      console.log('articulo_ya_retirado.data ', articulo_ya_retirado.data);

      if (articulo_ya_retirado.tipo == 'producto_devuelto') {
        let producto_devuelto = _.find(this.productos_devueltos, { key: producto.key });
        console.log('producto_devuelto ', producto_devuelto);
      }

      if (articulo_ya_retirado.tipo == 'producto_defectuoso') {
        const campos = (this.filasDetalle[articulo_ya_retirado.index] as any).controls;

        campos['can'].setValue(producto.cantidad + articulo_ya_retirado.data.can);
        campos['cantidad_en_unidades'].setValue(producto.cantidad_en_unidades + articulo_ya_retirado.data.cantidad_en_unidades);

        campos['tot'].setValue(fun.numFormatTwoDecimals(data.total));

        this.calcularDescuento(articulo_ya_retirado.index);

        fun.logOrange('campos ', campos);
      }
    }
  }

  parsearProductoDevueltos(producto_origin, data_remover, is_defectuoso) {
    const articulo_a_retirar = fun.duplicarJson(producto_origin);

    const medida = articulo_a_retirar.articulo.tipo_articulo.tipo == 'servicio' ? 'Servicio' : articulo_a_retirar.articulo.medida;

    articulo_a_retirar.descuento_valor = (articulo_a_retirar.descuento_valor / articulo_a_retirar.can) * data_remover.cantidad;

    articulo_a_retirar.can = data_remover.cantidad;
    articulo_a_retirar.cantidad = data_remover.cantidad;
    articulo_a_retirar.cantidad_en_unidades = data_remover.cantidad * articulo_a_retirar.articulo.contenido[medida];

    articulo_a_retirar.total = articulo_a_retirar.cantidad * articulo_a_retirar.precio;
    articulo_a_retirar.key_origin = articulo_a_retirar.key;

    articulo_a_retirar.id = null;
    articulo_a_retirar.key = fun.generateKey();
    articulo_a_retirar['is_defectuoso'] = is_defectuoso;
    articulo_a_retirar['from_pre_factura'] = true;
    articulo_a_retirar['is_devuelto'] = true;

    if (is_defectuoso) articulo_a_retirar.precio /= 2;
    if (is_defectuoso) articulo_a_retirar.total /= 2;

    return articulo_a_retirar;
  }

  async pasosQuitarArticulo(key) {
    await this.sacarDescuento(key);
    await this.removeItem(this.indexRemove);
    await this.enviarTotalesGenerales();
    await this.ajustarSecuencia();
  }

  abrirOverlay(dropRowConfig, event) {
    this.dropRowConfig = dropRowConfig;
    this.dropRowConfig.toggle(event);
  }

  readPrecio() {
    let res = true;

    if (fun.hasValue(this.factServ.propietario_factura)) {
      if (this.factServ.tipoDocumento == tipoDocFacturacion.compra) {
        res = false;
      } else {
        res = !this.configApp.facturacion_editar_precio;
      }
    }

    return res;
  }

  readDescuento() {
    const res = (this.factServ.tipoDocumento == tipoDocFacturacion.venta || this.factServ.tipoDocumento === tipoDocFacturacion.pre_venta) && this.factServ.propietario_factura ? false : true;
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

  hasArticulosDevueltos(index) {
    const current_detalle = this.filasDetalle[index].getRawValue();

    const detalles = this.getDetallesLlenos();

    return _.some(detalles, (detalle) => detalle.key_origin == current_detalle.key);
  }

  getDetallesLlenos() {
    return _.filter(
      this.filasDetalle.map((inner_detalle) => inner_detalle.value),
      (filter_detalle) => fun.hasValue(filter_detalle?.key),
    );
  }

  // =============================================
  //  RESETEAR FORMULARIO
  // =============================================
  RESETCUERPO() {
    if (fun.hasValue(this.form)) this.form.reset();
    this.secuencia = 0;
    this.inputSecuencia = 'cod-0';
    this.inputDrop = undefined;
    this.DESCUENTO = 0;
    this.listaDeDescuentos.length = 0;
    this.productos_devueltos.length = 0;
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
      itbis: [null],
      secuencia: [i],
      cantidad_en_unidades: [0],

      calcular_saco: [false],
      verificado: [false],
      is_defectuoso: [false],
      is_devuelto: [false],
      from_pre_factura: [false],
      vende_sin_inventario: [false],
      is_bad_price: [false],
      actual_price: [null],
      actual_price_value: [null],
      key_origin: [null],
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
  async rellenarCuerpoFactura(detalles) {
    return new Promise<any>((resolve, reject) => {
      this.rellenarVariables()
        .then(async (res) => {
          if (res) {
            for (let index = 0; index < detalles.length; index++) {
              if (index + 1 >= this.ARRAY_ROWFACTURAS.value.length) this.addItem(index + 1);

              const row = detalles[index];

              await this.getArticuloToLlenar(row).then((articulo) => {
                this.llenarDetalles(row, articulo, index);
                this.seleccionarCampoEnTurno();
                this.calcularDescuento(index);
              });
            }

            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch((error) => {});
    });
  }

  getArticuloToLlenar(row) {
    return new Promise<any>(async (resolve, reject) => {
      let articulo = row.articulo;

      if (fun.isEmpty(articulo) || fun.isEmpty(row.articulo.id)) {
        const res = await this.articuloClass.getArticulosFiltrado({ buscar: row.codigo, fecha: this.fechaFactura });
        articulo = _.first(res['data']);
      }

      resolve(articulo);
    });
  }

  llenarDetalles(data, articulo, index) {
    const campos = (this.filasDetalle[index] as any).controls;

    campos['articulo'].setValue(articulo);
    campos['cod'].setValue(articulo.codigo);
    campos['pre'].setValue(this.factServ.tipoDocumento == tipoDocFacturacion.compra ? fun.numFormatTwoDecimals(data.costo) : fun.numFormatTwoDecimals(data.precio));
    campos['costo'].setValue(fun.numFormatTwoDecimals(data.costo));
    campos['descuento_valor'].setValue(fun.isEmpty(data.descuento_valor) || data.descuento_valor == 0 ? null : data.descuento_valor);
    campos['tot'].setValue(fun.numFormatTwoDecimals(data.total));
    campos['can'].setValue(data.cantidad);
    campos['cantidad_en_unidades'].setValue(data.cantidad_en_unidades);
    campos['key_origin'].setValue(fun.hasValue(data?.key_origin) ? data.key_origin : null);
    campos['key'].setValue(fun.generateKey());
    campos['des'].setValue(`${_.capitalize(articulo.nombre)} ${data.is_defectuoso ? ' (defectuoso)' : ''}`);
    campos['calcular_saco'].setValue(data.calcular_saco);
    campos['is_defectuoso'].setValue(data.is_defectuoso);
    campos['is_devuelto'].setValue(data.is_devuelto || false);
    campos['from_pre_factura'].setValue(data.from_pre_factura || false);
    campos['vende_sin_inventario'].setValue(this.configApp.vende_sin_inventario);

    campos['is_bad_price'].setValue(this.getBadPrice(data).bool);
    campos['actual_price'].setValue(data?.actual_price);
    campos['actual_price_value'].setValue(this.getBadPrice(data).monto);

    let uni = data.peso_saco ? `Saco de ${data.peso_saco} libras` : data.unidad;

    campos['uni'].setValue(uni);

    this.calcularTotalRow(index);
    this.calcularDescuento(index);

    this.ajustarSecuencia();
  }

  getBadPrice(data) {
    const medida = data.peso_saco ? `Saco_${data.peso_saco}` : data.unidad;
    let current_monto = this.factServ.tipoDocumento == tipoDocFacturacion.compra ? data.costo : data.precio;
    const tipo = this.factServ.tipoDocumento == tipoDocFacturacion.compra ? 'costo' : 'precio';
    let actual_price_monto = data.actual_price[medida][tipo];

    if (data.is_defectuoso) {
      actual_price_monto = actual_price_monto / 2;
    }

    return { bool: current_monto != actual_price_monto, monto: fun.numFormatTwoDecimals(actual_price_monto) };
  }

  // =============================================
  //  BOTON ATRAS
  // =============================================
  atras() {
    window.history.back();
  }

  seleccionarCampoEnTurno() {
    setTimeout(() => {
      this.ajustarSecuencia().then((res) => setTimeout(() => fun.enfocarInput(this.inputSecuencia), 10));
    }, 100);
  }

  async saltar(input, index) {
    setTimeout(() => {
      if (fun.hasValue(this.factServ.propietario_factura)) {
        const { articulo, cod, can, uni } = this.filasDetalle[index].getRawValue();

        if (index >= 10 && input === 'can-') this.addItem(index);

        if (input == 'uni-' && fun.hasValue(can) && can != 0 && fun.hasValue(cod)) fun.enfocarInput('uni-' + index);

        if ((input === 'cod-' || input === 'pre-') && fun.hasValue(cod) && fun.hasValue(can) && can != 0 && fun.hasValue(uni)) {
          if (input === 'cod-') index++;

          this.ajustarSecuencia().then((res) => fun.enfocarInput(input == 'cod-' ? this.inputSecuencia : `${input}${index}`));
        }

        if (input === 'can-' && fun.hasValue(cod)) {
          if (fun.isEmpty(articulo) || cod !== articulo.codigo) {
            const metodo = this.factServ.tipoDocumento == tipoDocFacturacion.pre_venta ? tipoDocFacturacion.venta : this.factServ.tipoDocumento;
            const obj = { palabra_a_buscar: cod, index, metodo: metodo, data: [], fecha_articulo: this.fechaFactura };
            this.openNewModal({
              component: BuscarArticuloComponent,
              inputs: obj,
              id: 'buscarArticulo',
              header: 'BUSCAR ARTICULO',
              width: '56.25rem',
              height: '31.25rem',
              botones: {
                ...fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons),
              },
            });

            fun.enfocarInput('input_fantasma');
          } else {
            fun.enfocarAndSelectInput(`can-${index}`);
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
      if (this.factServ.tipoDocumento == tipoDocFacturacion.venta && !this.factServ.pre_venta_selected && fun.hasValue(uni)) this.checkCantidadExede(i, 'change', () => {});
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

        if (this.factServ.tipoDocumento == tipoDocFacturacion.venta && !from_pre_factura && excede) {
          fun.toastError('Cantidad introducida excede la cantidad en inventario', 'ERROR');
          if (this.configApp.vende_sin_inventario) {
            callback(false);
          } else {
            setTimeout(() => {
              fun.enfocarAndSelectInput('can-' + i);
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
          (this.filasDetalle[index] as any).controls['pre'].setValue(fun.numFormatTwoDecimals(this.factServ.tipoDocumento == tipoDocFacturacion.compra ? costoDetalle : this.precioDetalle));
          (this.filasDetalle[index] as any).controls['costo'].setValue(costoDetalle);

          this.calcularTotalRow(index).then((result) => {
            this.ajustarSecuencia().then(() => {
              if (this.factServ.tipoDocumento == tipoDocFacturacion.compra) fun.enfocarInput(`pre-${index}`);
              else fun.enfocarInput(this.inputSecuencia);
            });
          });
        }
      });
    }
  }

  verificarSecuencia(index, mover = true) {
    if (this.secuencia < index && mover) fun.enfocarInput(this.inputSecuencia);
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
      const articulo = value['articulo'];
      const descuento = value['descuento_valor'];

      if (precio && cantidad) {
        const itbis = articulo.calcular_itbis ? precio * 0.18 : 0;

        let total = (precio + itbis) * cantidad;
        total -= descuento;

        controls['tot'].setValue(fun.numFormatTwoDecimals(total));

        controls['itbis'].setValue(fun.numFormatTwoDecimals(itbis));

        this.llenarArrayUnidades(index);
        this.calcularCantidadEnUnidades({ index: index });
        this.enviarTotalesGenerales();
      }

      resolve(true);
    });
  }

  calcularDescuento(index: number) {
    console.log('this.getDetallesLlenos ', this.getDetallesLlenos());

    const articulo = (this.filasDetalle[index] as any).controls['articulo'].value;
    const codido = (this.filasDetalle[index] as any).controls['cod'].value;
    const precioTEMP = (this.filasDetalle[index] as any).controls['pre'].value;
    const key = (this.filasDetalle[index] as any).controls['key'].value;

    console.log('index ', index);
    console.log('key ', key);

    const precio = fun.desformatear(precioTEMP);
    const itbis = articulo.calcular_itbis ? precio * 0.18 : 0;
    const cantidad = (this.filasDetalle[index] as any).controls['can'].value;

    let descuento = fun.desformatear((this.filasDetalle[index] as any).controls['descuento_valor'].value);

    if (descuento >= 0 || fun.isEmpty(descuento)) {
      const total = (precio + itbis) * cantidad;

      if (fun.hasValue(codido) && (fun.isEmpty(descuento) || descuento == 0)) {
        (this.filasDetalle[index] as any).controls['descuento_valor'].reset();
        (this.filasDetalle[index] as any).controls['tot'].setValue(fun.numFormatTwoDecimals(total));
        this.sacarDescuento(key);
        this.enviarTotalesGenerales();
      }

      if (fun.hasValue(codido) && fun.hasValue(precio) && fun.hasValue(cantidad) && fun.hasValue(descuento)) {
        let nuevoTotal = 0;
        nuevoTotal = total - descuento;
        // TODO: revisar por que cuando quito un producto de una prefactura el descuento se aumenta enves de dividirse
        if (nuevoTotal < 0) {
          fun.toastError('El descuento no puede ser mayor al valor total de la venta.');
          fun.enfocarAndSelectInput(`desc-${index}`);
        } else {
          let currentDescuento = _.find(this.listaDeDescuentos, (item) => item.key == key);

          if (fun.hasValue(currentDescuento)) currentDescuento.desc = descuento;
          else this.listaDeDescuentos.push({ key: key, valor: descuento });

          (this.filasDetalle[index] as any).controls['tot'].setValue(fun.numFormatTwoDecimals(nuevoTotal));

          this.enviarTotalesGenerales();
          this.ajustarSecuencia();
        }
      }
    } else {
      if (descuento < 0) fun.toastWarning('El descuento no puede ser menor a 0', 'AVISO');
      (this.filasDetalle[index] as any).controls['descuento_valor'].setValue(0);
      fun.enfocarInput(`desc-${index}`);
    }
  }

  sacarDescuento(key) {
    const currentDescuento = _.find(this.listaDeDescuentos, (item) => item.key == key);
    if (fun.hasValue(currentDescuento)) _.remove(this.listaDeDescuentos, currentDescuento);
  }

  enviarDescuentoGeneral() {}

  enviarTotalesGenerales() {
    const tempTotal = _.reduce(this.filasDetalle, (acumulado, item) => acumulado + fun.desformatear(item.value.tot), 0);
    const tempDesc = _.reduce(this.listaDeDescuentos, (acumulado, item) => acumulado + item.valor, 0);
    const tempItbis = _.reduce(this.filasDetalle, (acumulado, item) => acumulado + fun.desformatear(item.value.itbis) * item.value.can, 0);
    // this.getCalculosDinero.emit({ tipo: 'descuento', monto: acuDesc });

    const obj = { total: fun.redondearNum(tempTotal), itbis: fun.redondearNum(tempItbis), descuento: fun.redondearNum(tempDesc) };

    this.getCalculosDinero.emit(obj);
  }

  revisarPrecio(formControlName, input_id, index) {
    let input = (this.filasDetalle[index] as any).controls[formControlName];
    fun.revisarPrecio(input, `${input_id}-${index}`).then((res) => {
      if (!res.error) input.setValue(res.number);
    });
  }

  handleInputEvent(type, formControlName, index) {
    let input = (this.filasDetalle[index] as any).controls[formControlName];

    if (fun.hasValue(input.value) && !isNaN(input.value)) {
      if (type == 'focus') input.setValue(fun.desformatear(input.value));
      if (type == 'blur') input.setValue(fun.numFormatTwoDecimals(input.value) != '0.00' ? fun.numFormatTwoDecimals(input.value) : null);
    }
  }

  getActualPrice(index, event?) {
    const actual_price_value = (this.filasDetalle[index] as any).controls['actual_price_value'].value;

    const siFunction = (instance) => {
      const campos = (this.filasDetalle[index] as any).controls;

      campos['is_bad_price'].setValue(false);
      campos['pre'].setValue(actual_price_value);
      this.calcularTotalRow(index).then((result) => {
        instance.closeModal(instance.id, 'get_actual_price');
      });
    };

    const label = this.factServ.tipoDocumento == tipoDocFacturacion.compra ? 'costo' : 'precio';
    this.confirmationModal({ id: 'get_actual_price', header: 'Confirmar', texto: `Seguro que desea obtener el ${label} actual`, siFunction: siFunction });

    if (this.dropRowConfig) this.dropRowConfig.hide();
    if (event) event.stopPropagation();
  }

  getInfoBadPrice(index) {
    let res = { icon: undefined, tooltip: undefined };

    const formulario_data = this.filasDetalle[index].getRawValue();

    const actual_price_value = fun.desformatear(formulario_data.actual_price_value);
    const precio = fun.desformatear(formulario_data.pre);
    const tipo = this.factServ.tipoDocumento == tipoDocFacturacion.compra ? 'Costo' : 'Precio';

    res.icon = actual_price_value > precio ? 'fa-arrow-up' : 'fa-arrow-down';
    res.tooltip = actual_price_value > precio ? `${tipo} subió` : `${tipo} bajó`;

    return res;
  }

  modalRemover(index, event?) {
    const data = this.filasDetalle[index].getRawValue();

    const name = (this.filasDetalle[index] as any).controls['des'].value;
    const cantidad = (this.filasDetalle[index] as any).controls['can'].value;
    const unidad = (this.filasDetalle[index] as any).controls['uni'].value;
    const key = (this.filasDetalle[index] as any).controls['key'].value;
    this.indexRemove = index;

    let obj = { index, key, cantidad, is_prefactura_selected: fun.hasValue(this.factServ.pre_venta_selected), data_detalle: data };
    obj['nombre'] = unidad ? `${name} (${unidad})` : name;

    this.openNewModal({
      component: RemoverArticuloComponent,
      inputs: obj,
      id: 'removerArticulo',
      header: 'Confirmación',
      width: this.modo_factura != 'pre_venta' ? '30rem' : '40rem',
      botones: {
        aceptar: { show: true, disable: false },
        cancelar: { show: true, disable: false },
      },
    });

    if (this.dropRowConfig) this.dropRowConfig.hide();
    if (event) event.stopPropagation();
  }

  setInputDrop(index) {
    if (fun.hasValue(index) && fun.hasValue(this.filasDetalle)) {
      const { articulo } = this.filasDetalle[index].getRawValue();
      if (fun.hasValue(articulo)) this.inputDrop = `uni-${index}`;
    } else {
      this.inputDrop = undefined;
    }
  }

  llenarRowDespuesDeFiltro(obj) {
    const articulo = obj.data;

    const index = obj.index;

    if ((this.factServ.tipoDocumento == tipoDocFacturacion.venta || this.factServ.tipoDocumento == tipoDocFacturacion.pre_venta) && articulo.existencia == 0 && articulo.tipo_articulo.tipo != 'servicio') {
      let msg = 'Producto agotado, debe de comprar mas!!!';

      if (_.lowerCase(articulo.descripcion) === 'producto terminado') msg = 'Producto agotado, debe de producir mas!!!';
      fun.toastError(msg, 'ERROR');

      if (this.configApp.vende_sin_inventario) {
        this.continuarLlenarRow({ articulo: articulo, index: index });
      } else {
        setTimeout(() => fun.enfocarAndSelectInput('cod-' + index), 10);
      }
    } else {
      this.continuarLlenarRow({ articulo: articulo, index: index });
    }
  }

  continuarLlenarRow(params: { articulo: any; index: number }) {
    const cantidades = params.articulo.cantidades;

    if ((this.factServ.tipoDocumento == tipoDocFacturacion.venta || this.factServ.tipoDocumento == tipoDocFacturacion.pre_venta) && params.articulo.existencia > 0 && params.articulo.aviso_existencia > cantidades[params.articulo.medida_alerta]) {
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

    (this.filasDetalle[params.index] as any).controls['is_bad_price'].setValue(false);
    (this.filasDetalle[params.index] as any).controls['actual_price'].setValue(null);
    (this.filasDetalle[params.index] as any).controls['actual_price_value'].setValue(null);

    setTimeout(() => fun.enfocarInput('can-' + params.index), 0);
  }

  async llenarArrayUnidades(index) {
    const { articulo, cod } = this.filasDetalle[index].getRawValue();

    if (cod && articulo) {
      const medida = articulo.tipo_articulo.tipo == 'servicio' ? 'Servicio' : articulo.medida;
      const precioPrincipal = this.factServ.tipoDocumento == tipoDocFacturacion.compra ? articulo.costo_principal : articulo.precio_principal;
      const costoPrincipal = articulo.costo_principal;
      this.UnidadesArticulo = [];

      this.UnidadesArticulo.push({ value: 'Medida', precio: 0, costo: 0, cantidad: articulo.contenido[articulo.medida] });

      if (medida != 'Quintal' || this.factServ.tipoDocumento == tipoDocFacturacion.compra) {
        this.UnidadesArticulo.push({ value: medida, precio: articulo.precio_principal, costo: articulo.costo_principal, cantidad: articulo.contenido[medida] });
      }

      if (articulo.vendido_en == 'Saco' && articulo.calcular_saco && this.factServ.tipoDocumento != tipoDocFacturacion.compra) this.entrarSacosAUnidades(precioPrincipal, costoPrincipal);

      if (articulo.is_detallable || this.factServ.tipoDocumento == tipoDocFacturacion.compra) {
        articulo.contenido_articulos.forEach((element) => {
          this.UnidadesArticulo.push({ value: element.medida, precio: element.precio, costo: element.costo, cantidad: articulo.contenido[element.medida] });
        });
      }

      this.UnidadesArticulo = _.uniqWith(this.UnidadesArticulo, _.isEqual);

      if (this.inputDrop) setTimeout(() => fun.enfocarInput(this.inputDrop), 0);
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
    return fun.redondearNum(res);
  }

  async getDataFromModal(arg, search) {
    if (arg?.tipo == 'data_no_found') fun.enfocarAndSelectInput(`cod-${arg.index}`);

    if (arg.modal_id == 'removerArticulo') this.procesoQuitarArticulo(arg.key, arg.data);

    if (arg.modal_id == 'buscarArticulo') this.llenarRowDespuesDeFiltro(arg);
  }

  confirmationModal(obj: { id: string; texto: string; header: string; siFunction: Function; width?: string }) {
    this.openNewModal({
      id: obj.id,
      header: obj.header,
      width: obj.width || '30rem',
      html: `<p> ${obj.texto} </p>`,
      botones: {
        ...fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons),
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
}
