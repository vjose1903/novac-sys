import { RetornarDevueltoComponent } from './retornar-devuelto/retornar-devuelto.component';
import { FacturacionService } from './../facturacion.service';
import { tipoDocFacturacion } from './../factura';
import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormArray } from '@angular/forms';
import * as _ from 'lodash';
import { MixinClass } from '../../../core/typescript/MixinClass';
import { ArticuloC } from '../../registros/articulos/articulo';
import { BuscarArticuloComponent } from '../../components/formularios en modales/buscar-articulo/buscar-articulo.component';
import { fun } from '../../../core/services/functions.service';
import { RemoverArticuloComponent } from './remover-articulo/remover-articulo.component';
import { razon_remover } from './remover-articulo/contantes';
import { ConfigI } from '../../../core/typescript/config-interface.utils';
import { Ss } from '../../../core/services/singleton.service';
import { ModalClass } from '../../components/modal/modal-class';

@Component({
  selector: 'app-cuerpo-factura',
  templateUrl: './cuerpo-factura.component.html',
  styleUrls: ['./cuerpo-factura.component.scss'],
})
export class CuerpoFacturaComponent extends MixinClass implements OnInit, OnDestroy {
  form: UntypedFormGroup;
  ARRAY_ROWFACTURAS;

  UnidadesArticulo = [];
  drop;

  precioDetalle;

  secuencia;
  inputSecuencia;
  inputDrop;

  listaDeDescuentos = [];
  fun = fun;
  tipoDocFacturacion = tipoDocFacturacion;

  sacos;

  @Input() factura;
  @Input() fechaFactura;
  @Input() modo_factura;

  @Output() getCalculosDinero = new EventEmitter<any>();
  @Output() getCuerpoFactura = new EventEmitter<any>();
  @Output() getFechaFactura = new EventEmitter<any>();

  articuloClass = new ArticuloC();
  minCodigo;

  dropRowConfig: any;
  configApp: ConfigI;
  constructor(private fb: UntypedFormBuilder, public factServ: FacturacionService) {
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
        fila.total = fun.desformatear(fila.total);
        fila.descuento_valor = fun.hasValue(fila.descuento_valor) ? fun.desformatear(fila.descuento_valor) : 0;
        fila.precio = fun.desformatear(fila.precio);
        fila.costo = fun.desformatear(fila.costo);

        if (fila.cantidad && fila.unidad) detalle_factura.push(fun.duplicarJson(fila));
      }
    });

    this.getCuerpoFactura.emit({ tipo: 'cuerpo', data: fun.duplicarJson(detalle_factura) });
  }

  async rellenarVariables() {
    return new Promise(async (resolve, reject) => {
      try {
        this.listaDeDescuentos.length = 0;
        this.UnidadesArticulo.length = 0;
        this.secuencia = 0;

        [this.ARRAY_ROWFACTURAS, this.precioDetalle, this.inputDrop, this.factServ.filasDetalle] = Array(4).fill(undefined);
        this.inputSecuencia = 'codigo-0';

        this.sacos = [25, 50, 100];

        this.form = this.fb.group({
          rowFactura: this.fb.array([this.createItem()]),
        });

        this.ARRAY_ROWFACTURAS = this.form['rowFactura'] as UntypedFormArray;

        for (let index = 1; index <= 25; index++) await this.addItem();

        this.factServ.filasDetalle = (this.form.controls['rowFactura'] as UntypedFormArray).controls;
        this.escucharCambiosEnForm();

        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  pasosQuitarArticulo(key) {
    return new Promise<any>(async (resolve, reject) => {
      await this.sacarDescuento(key);
      await this.removeItem(key);
      await this.enviarTotalesGenerales();
      await this.ajustarSecuencia();
      resolve(true);
    });
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
    const formulario = this.factServ.filasDetalle[i].getRawValue();

    if (fun.hasValue(formulario.codigo) && fun.is_number(formulario.codigo)) this.minCodigo = 5;
    else this.minCodigo = undefined;
  }

  selectedRow(i, bool) {
    const lista = ['codigo-' + i, 'cantidad-' + i, 'unidad-' + i, 'descripcion-' + i, 'precio-' + i, 'desc-' + i, 'total-' + i];
    lista.forEach((row) => {
      if (this.checkIfRowContainArticulo(i)) {
        const action = bool ? 'add' : 'remove';
        fun.ModificarClass(row, 'inputOscuro', action);
      }
    });
  }

  checkIfRowContainArticulo(i) {
    let res = false;
    if (this.factServ.filasDetalle) {
      const element = this.factServ.filasDetalle[i] as any;
      res = element.controls['descripcion'].value || element.controls['codigo'].value;
    }
    return res;
  }

  hasArticulosDevueltos(index) {
    const current_detalle = this.factServ.filasDetalle[index].getRawValue();

    const detalles = this.factServ.getDetallesLlenos();

    return detalles.some((detalle) => detalle.key_origin == current_detalle.key) || this.factServ.productos_devueltos.some((detalle) => detalle.key_origin == current_detalle.key);
  }

  // =============================================
  //  RESETEAR FORMULARIO
  // =============================================
  RESETCUERPO() {
    if (fun.hasValue(this.form)) this.form.reset();
    this.secuencia = 0;
    this.inputSecuencia = 'codigo-0';
    this.inputDrop = undefined;
    this.listaDeDescuentos.length = 0;
  }

  // =============================================
  //  CREAR MAS INPUTS PARA FACTURA
  // =============================================

  createItem(): UntypedFormGroup {
    return this.fb.group({
      key: [null],
      articulo: [null],
      detalle_id: [null],
      codigo: [null],
      cantidad: [null],
      cantidad_origin: [0],
      cantidad_ant: [null],
      descripcion: [null],
      unidad: [null],
      precio: [null],
      costo: [null],
      descuento_valor: [null],
      total: [null],
      itbis: [null],
      cantidad_en_unidades: [0],
      cantidad_en_unidades_origin: [0],
      calcular_saco: [false],
      is_defectuoso: [false],
      is_devuelto: [false],
      from_pre_factura: [false],
      vende_sin_inventario: [false],
      is_bad_price: [false],
      actual_price: [null],
      actual_price_value: [null],
      key_origin: [null],
      producto_origin: [null],
    });
  }

  addItem(): void {
    this.ARRAY_ROWFACTURAS = this.form.get('rowFactura') as UntypedFormArray;
    this.ARRAY_ROWFACTURAS.push(this.createItem());
  }

  removeItem(key: string) {
    const index = _.findIndex(this.factServ.filasDetalle, (detalle) => detalle.value.key == key);
    (this.form.get('rowFactura') as UntypedFormArray).removeAt(index);
  }

  // =============================================
  //  MODIFICAR FACTURA
  // =============================================
  async rellenarCuerpoFactura(detalles, is_archivada) {
    return new Promise<any>((resolve, reject) => {
      this.getActualPriceDetalles(detalles, is_archivada).then((actual_prices_db) => {
        this.rellenarVariables()
          .then(async (res) => {
            if (res) {
              for (let index = 0; index < detalles.length; index++) {
                if (index + 1 >= this.ARRAY_ROWFACTURAS.value.length) this.addItem();

                const detalle_en_turno = detalles[index];

                if (is_archivada) {
                  const actual_price_db = actual_prices_db.find((item) => item.id == detalle_en_turno.articulo_id);
                  detalle_en_turno.actual_price = actual_price_db.costos;
                }

                if (detalle_en_turno.unidad.includes('Saco de')) {
                  detalle_en_turno.peso_saco = Number(detalle_en_turno.unidad.split(' ')[2]);
                }

                await this.getArticuloToLlenar(detalle_en_turno).then((articulo) => {
                  this.llenarDetalles(detalle_en_turno, articulo, index);
                  this.seleccionarCampoEnTurno();
                });
              }

              resolve(true);
            } else {
              resolve(false);
            }
          })
          .catch((error) => {});
      });
    });
  }

  getActualPriceDetalles(detalles, is_archivada) {
    return new Promise<any>((resolve, reject) => {
      if (is_archivada) {
        const extra = { afterPath: `custom/get_actual_price_detalles`, parameters: { ids: fun.removerDuplicados(detalles.map((detalle) => detalle.articulo_id)).join(','), costos: true } };

        this.articuloClass.dynamic(extra).then((res) => resolve(res.data));
      } else {
        resolve(null);
      }
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
    const controls = (this.factServ.filasDetalle[index] as any).controls;

    controls['detalle_id'].setValue(fun.hasValue(data?.id) ? data?.id : null);
    controls['articulo'].setValue(articulo);
    controls['codigo'].setValue(articulo.codigo);
    controls['precio'].setValue(this.factServ.tipoDocumento == tipoDocFacturacion.compra ? fun.numFormatTwoDecimals(data.costo) : fun.numFormatTwoDecimals(data.precio));
    controls['costo'].setValue(fun.numFormatTwoDecimals(data.costo));
    controls['descuento_valor'].setValue(fun.isEmpty(data.descuento_valor) || data.descuento_valor == 0 ? null : fun.numFormatTwoDecimals(data.descuento_valor));
    controls['cantidad'].setValue(data.cantidad);
    controls['cantidad_origin'].setValue(fun.hasValue(data.cantidad) ? data.cantidad : 0);
    controls['cantidad_en_unidades_origin'].setValue(0);
    controls['cantidad_en_unidades'].setValue(0);
    controls['key_origin'].setValue(fun.hasValue(data?.key_origin) ? data.key_origin : null);
    controls['key'].setValue(fun.hasValue(data?.key) ? data.key : fun.generateKey());
    controls['descripcion'].setValue(`${fun.capitalice(articulo.nombre)} ${data.is_defectuoso ? ' (defectuoso)' : ''}`);
    controls['calcular_saco'].setValue(data.calcular_saco);
    controls['is_defectuoso'].setValue(data.is_defectuoso);
    controls['is_devuelto'].setValue(data.is_devuelto || false);
    controls['from_pre_factura'].setValue(data.from_pre_factura || false);
    controls['vende_sin_inventario'].setValue(this.configApp.vende_sin_inventario);

    controls['is_bad_price'].setValue(this.getBadPrice(data).bool);
    controls['actual_price'].setValue(data?.actual_price);
    controls['actual_price_value'].setValue(this.getBadPrice(data).monto);
    controls['producto_origin'].setValue(fun.hasValue(data?.producto_origin) ? data.producto_origin : null);

    let unidad = fun.hasValue(data.peso_saco) ? `Saco de ${data.peso_saco} libras` : data.unidad;

    controls['unidad'].setValue(unidad);

    this.calcularMontosRow(index);
    this.calcularCantidadEnUnidades({ index: index });

    this.ajustarSecuencia();
  }

  getBadPrice(data) {
    const medida = data.peso_saco || data.unidad.includes('Saco de') ? `Saco_${data.peso_saco}` : data.unidad;

    let current_monto = this.factServ.tipoDocumento == tipoDocFacturacion.compra ? data.costo : data.precio;

    const tipo = this.factServ.tipoDocumento == tipoDocFacturacion.compra ? 'costo' : 'precio';
    let actual_price_monto = fun.hasValue(data.actual_price) ? data.actual_price[medida][tipo] : current_monto;

    if (data.is_defectuoso) actual_price_monto = actual_price_monto / 2;

    current_monto = fun.numFormatTwoDecimals(current_monto);
    actual_price_monto = fun.numFormatTwoDecimals(actual_price_monto);

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
        const { articulo, codigo, cantidad, unidad } = this.factServ.filasDetalle[index].getRawValue();

        if (index >= 10 && input === 'cantidad-') this.addItem();

        if (input == 'unidad-' && fun.hasValue(cantidad) && cantidad != 0 && fun.hasValue(codigo)) fun.enfocarInput('unidad-' + index);

        if ((input === 'codigo-' || input === 'precio-') && fun.hasValue(codigo) && fun.hasValue(cantidad) && cantidad != 0 && fun.hasValue(unidad)) {
          if (input === 'codigo-') index++;

          this.ajustarSecuencia().then((res) => fun.enfocarInput(input == 'codigo-' ? this.inputSecuencia : `${input}${index}`));
        }

        if (input === 'cantidad-' && fun.hasValue(codigo)) {
          if (fun.isEmpty(articulo) || codigo !== articulo.codigo) {
            const metodo = this.factServ.tipoDocumento == tipoDocFacturacion.pre_venta ? tipoDocFacturacion.venta : this.factServ.tipoDocumento;
            const obj = { palabra_a_buscar: codigo, index, metodo: metodo, data: [], fecha_articulo: this.fechaFactura };
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
            fun.enfocarAndSelectInput(`cantidad-${index}`);
          }
        }
      }
    }, 0);
  }

  ajustarSecuencia() {
    return new Promise((resolve) => {
      const filas_ocupadas = _.filter(this.factServ.filasDetalle, (item) => fun.hasValue(item.value.articulo));
      this.secuencia = filas_ocupadas.length;

      this.inputSecuencia = 'codigo-' + this.secuencia;

      resolve(true);
    });
  }

  saliDeCantidad(i) {
    const { unidad, cantidad, cantidad_ant } = this.factServ.filasDetalle[i].getRawValue();

    if (cantidad != cantidad_ant) {
      if (this.factServ.tipoDocumento == tipoDocFacturacion.venta && !this.factServ.pre_venta_selected && fun.hasValue(unidad)) this.checkCantidadExede(i, 'change', () => {});
      (this.factServ.filasDetalle[i] as any).controls['cantidad_ant'].setValue(cantidad);
    }
  }

  async checkCantidadExede(i, lugar, callback = (arg) => {}) {
    let cantidad = 0;
    this.llenarArrayUnidades(i);
    this.calcularCantidadEnUnidades({ index: i });

    const articulo = (this.factServ.filasDetalle[i] as any).controls['articulo'].value;
    const from_pre_factura = (this.factServ.filasDetalle[i] as any).controls['from_pre_factura'].value;

    const rowsIgual = _.map(
      _.filter(this.factServ.filasDetalle, (item) => item.value?.articulo?.id == articulo.id),
      'value',
    );

    cantidad = _.reduce(rowsIgual, (acumulado, item) => acumulado + (item.cantidad_en_unidades - item.cantidad_en_unidades_origin), 0);

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
              fun.enfocarAndSelectInput('cantidad-' + i);
              this.calcularCantidadEnUnidades({ index: i, clean: true });
              (this.factServ.filasDetalle[i] as any).controls['unidad'].setValue(null);
              (this.factServ.filasDetalle[i] as any).controls['cantidad_ant'].setValue(null);
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
      (this.factServ.filasDetalle[index] as any).controls['unidad'].setValue(null);
    } else {
      this.checkCantidadExede(index, 'change', (excede) => {
        if (!excede) {
          (this.factServ.filasDetalle[index] as any).controls['unidad'].setValue(unidad);
          (this.factServ.filasDetalle[index] as any).controls['precio'].setValue(fun.numFormatTwoDecimals(this.factServ.tipoDocumento == tipoDocFacturacion.compra ? costoDetalle : this.precioDetalle));
          (this.factServ.filasDetalle[index] as any).controls['costo'].setValue(costoDetalle);

          this.calcularMontosRow(index).then((result) => {
            this.ajustarSecuencia().then(() => {
              if (this.factServ.tipoDocumento == tipoDocFacturacion.compra) fun.enfocarInput(`precio-${index}`);
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
    const { controls, value } = this.factServ.filasDetalle[params.index];
    const { unidad, cantidad, cantidad_origin } = value;
    let cantidadMinima = 1;

    if (unidad && this.UnidadesArticulo.length > 0) {
      const unidad_find = this.UnidadesArticulo.find((_uni) => _uni.value.toLowerCase() == unidad.toLowerCase());
      if (unidad_find) cantidadMinima = unidad_find.cantidad;
    }

    const cant_unidades = params.clean ? 0 : cantidad * cantidadMinima;
    controls['cantidad_en_unidades'].setValue(cant_unidades);

    const cant_origin_unidades = params.clean ? 0 : (cantidad_origin || 0) * cantidadMinima;
    controls['cantidad_en_unidades_origin'].setValue(cant_origin_unidades);

    if (cant_unidades == 0) {
      controls['precio'].setValue(null);
      controls['total'].setValue(null);
    }
  }

  calcularMontosRow(index: number) {
    return new Promise<any>((resolve, reject) => {
      const { controls, value } = this.factServ.filasDetalle[index];

      let { cantidad, articulo, codigo, key } = value;

      const precio = fun.desformatear(value['precio']);
      let descuento = fun.desformatear(value['descuento_valor']);

      const itbis = articulo?.calcular_itbis ? precio * 0.18 : 0;
      const total = (precio + itbis) * cantidad;

      if (descuento >= 0 || fun.isEmpty(descuento)) {
        if (fun.hasValue(codigo) && (fun.isEmpty(descuento) || descuento == 0)) {
          controls['descuento_valor'].reset();
          controls['total'].setValue(fun.numFormatTwoDecimals(total));
          this.sacarDescuento(key);
        }
      } else {
        if (descuento < 0) fun.toastWarning('El descuento no puede ser menor a 0', 'AVISO');
        controls['descuento_valor'].setValue(0);
        fun.enfocarInput(`desc-${index}`);
      }

      if (fun.hasValue(codigo) && fun.hasValue(precio) && fun.hasValue(cantidad) && fun.hasValue(descuento)) {
        let nuevoTotal = 0;
        nuevoTotal = total - descuento;

        if (nuevoTotal < 0) {
          fun.toastError('El descuento no puede ser mayor al valor total de la venta.');
          fun.enfocarAndSelectInput(`desc-${index}`);
        } else {
          let currentDescuento = _.find(this.listaDeDescuentos, (item) => item.key == key);

          if (fun.hasValue(currentDescuento)) currentDescuento.valor = descuento;
          else this.listaDeDescuentos.push({ key: key, valor: descuento });

          controls['total'].setValue(fun.numFormatTwoDecimals(nuevoTotal));
          controls['itbis'].setValue(fun.numFormatTwoDecimals(itbis));
          this.ajustarSecuencia();
        }
      }

      this.enviarTotalesGenerales();
      resolve(true);
    });
  }

  sacarDescuento(key) {
    const currentDescuento = _.find(this.listaDeDescuentos, (item) => item.key == key);
    if (fun.hasValue(currentDescuento)) _.remove(this.listaDeDescuentos, currentDescuento);
  }

  enviarTotalesGenerales() {
    const tempTotal = _.reduce(this.factServ.filasDetalle, (acumulado, item) => acumulado + fun.desformatear(item.value.total), 0);
    const tempDesc = _.reduce(this.listaDeDescuentos, (acumulado, item) => acumulado + item.valor, 0);
    const tempItbis = _.reduce(this.factServ.filasDetalle, (acumulado, item) => acumulado + fun.desformatear(item.value.itbis) * item.value.cantidad, 0);

    const obj = { total: fun.redondearNum(tempTotal), itbis: fun.redondearNum(tempItbis), descuento: fun.redondearNum(tempDesc) };

    this.getCalculosDinero.emit(obj);
  }

  revisarPrecio(formControlName, input_id, index) {
    let input = (this.factServ.filasDetalle[index] as any).controls[formControlName];
    fun.revisarPrecio(input, `${input_id}-${index}`).then((res) => {
      if (!res.error) input.setValue(res.number);
    });
  }

  handleInputEvent(type, formControlName, index) {
    let input = (this.factServ.filasDetalle[index] as any).controls[formControlName];

    if (fun.hasValue(input.value) && !isNaN(input.value)) {
      if (type == 'focus') input.setValue(fun.desformatear(input.value));
      if (type == 'blur') input.setValue(fun.numFormatTwoDecimals(input.value) != '0.00' ? fun.numFormatTwoDecimals(input.value) : null);
    }
  }

  getActualPrice(index, event?) {
    const actual_price_value = (this.factServ.filasDetalle[index] as any).controls['actual_price_value'].value;

    const siFunction = (instance) => {
      const campos = (this.factServ.filasDetalle[index] as any).controls;

      campos['is_bad_price'].setValue(false);
      campos['precio'].setValue(actual_price_value);
      this.calcularMontosRow(index).then((result) => instance.closeModal(instance.id, 'get_actual_price'));
    };

    const label = this.factServ.tipoDocumento == tipoDocFacturacion.compra ? 'costo' : 'precio';
    this.confirmationModal({ id: 'get_actual_price', header: 'Confirmar', texto: `Seguro que desea obtener el ${label} actual`, siFunction: siFunction });

    if (this.dropRowConfig) this.dropRowConfig.hide();
    if (event) event.stopPropagation();
  }

  getInfoBadPrice(index) {
    let res = { icon: undefined, tooltip: undefined };

    const formulario_data = this.factServ.filasDetalle[index].getRawValue();

    const actual_price_value = fun.desformatear(formulario_data.actual_price_value);
    const precio = fun.desformatear(formulario_data.precio);
    const tipo = this.factServ.tipoDocumento == tipoDocFacturacion.compra ? 'Costo' : 'Precio';

    res.icon = actual_price_value > precio ? 'fa-arrow-up' : 'fa-arrow-down';
    res.tooltip = actual_price_value > precio ? `${tipo} subió` : `${tipo} bajó`;

    return res;
  }

  modalRemover(index, event?) {
    const data = this.factServ.filasDetalle[index].getRawValue();

    const { descripcion, cantidad, unidad, key } = data;

    let obj = { index, key, cantidad, is_prefactura_selected: fun.hasValue(this.factServ.pre_venta_selected), data_detalle: data };
    obj['nombre'] = unidad ? `${descripcion} (${unidad})` : descripcion;

    this.openNewModal({
      component: RemoverArticuloComponent,
      inputs: obj,
      id: 'removerArticulo',
      header: 'Confirmación',
      width: obj.is_prefactura_selected ? '40rem' : '30rem',
      botones: { aceptar: { show: true, disable: false }, cancelar: { show: true, disable: false } },
    });

    if (this.dropRowConfig) this.dropRowConfig.hide();
    if (event) event.stopPropagation();
  }

  retornarArticulosDevueltos(index, tipo, event) {
    const current_detalle = tipo == 'defectuoso' ? this.factServ.filasDetalle[index].getRawValue() : null;
    const detalles = this.factServ.getDetallesLlenos();

    const articulo_defectuoso = _.find(detalles, (detalle) => detalle.key_origin == current_detalle.key);
    const articulo_solo_devuelto = _.find(this.factServ.productos_devueltos, (detalle) => detalle.key_origin == current_detalle.key);

    const name = current_detalle.descripcion;
    const unidad = current_detalle.unidad;

    const inputs = { data: current_detalle, articulo_defectuoso: articulo_defectuoso, articulo_solo_devuelto: articulo_solo_devuelto, tipo: tipo, is_articulo_selected: true };
    inputs['nombre'] = unidad ? `${name} (${unidad})` : name;

    this.openNewModal({
      component: RetornarDevueltoComponent,
      inputs: inputs,
      id: 'retornarDevuelto',
      header: 'Retornar Articulos Devueltos',
      width: '40rem',
      botones: { aceptar: { show: true, disable: true }, cancelar: { show: true, disable: false } },
    });

    if (this.dropRowConfig) this.dropRowConfig.hide();
    if (event) event.stopPropagation();
  }

  setInputDrop(index) {
    if (fun.hasValue(index) && fun.hasValue(this.factServ.filasDetalle)) {
      const { articulo } = this.factServ.filasDetalle[index].getRawValue();
      if (fun.hasValue(articulo)) this.inputDrop = `unidad-${index}`;
    } else {
      this.inputDrop = undefined;
    }
  }

  llenarRowDespuesDeFiltro(obj) {
    const articulo = obj.data;

    const index = obj.index;

    if ((this.factServ.tipoDocumento == tipoDocFacturacion.venta || this.factServ.tipoDocumento == tipoDocFacturacion.pre_venta) && articulo.existencia == 0 && articulo.tipo_articulo.tipo != 'servicio') {
      let msg = 'Producto agotado, debe de comprar mas!!!';

      if (articulo.descripcion.toLowerCase() == 'producto terminado') msg = 'Producto agotado, debe de producir mas!!!';
      fun.toastError(msg, 'ERROR');

      if (this.configApp.vende_sin_inventario) {
        this.continuarLlenarRow({ articulo: articulo, index: index });
      } else {
        setTimeout(() => fun.enfocarAndSelectInput('codigo-' + index), 10);
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

      if (params.articulo.descripcion.toLowerCase() == 'producto terminado') msg = `Solo quedan ${cant_restante} ${params.articulo.medida_alerta} de este producto, debe de producir mas!!!`;
      fun.toastWarning(msg, 'AVISO');
    }

    (this.factServ.filasDetalle[params.index] as any).controls['articulo'].setValue(params.articulo);
    (this.factServ.filasDetalle[params.index] as any).controls['key'].setValue(fun.generateKey());
    (this.factServ.filasDetalle[params.index] as any).controls['codigo'].setValue(params.articulo.codigo);
    (this.factServ.filasDetalle[params.index] as any).controls['descripcion'].setValue(params.articulo.nombre);
    (this.factServ.filasDetalle[params.index] as any).controls['calcular_saco'].setValue(params.articulo.calcular_saco);
    (this.factServ.filasDetalle[params.index] as any).controls['cantidad'].setValue(null);
    (this.factServ.filasDetalle[params.index] as any).controls['cantidad_ant'].setValue(null);
    (this.factServ.filasDetalle[params.index] as any).controls['unidad'].setValue(null);
    (this.factServ.filasDetalle[params.index] as any).controls['vende_sin_inventario'].setValue(this.configApp.vende_sin_inventario);

    (this.factServ.filasDetalle[params.index] as any).controls['is_bad_price'].setValue(false);
    (this.factServ.filasDetalle[params.index] as any).controls['actual_price'].setValue(null);
    (this.factServ.filasDetalle[params.index] as any).controls['actual_price_value'].setValue(null);
    (this.factServ.filasDetalle[params.index] as any).controls['producto_origin'].setValue(null);

    setTimeout(() => fun.enfocarInput('cantidad-' + params.index), 0);
  }

  async llenarArrayUnidades(index) {
    const { articulo, codigo } = this.factServ.filasDetalle[index].getRawValue();

    if (codigo && articulo) {
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

      this.UnidadesArticulo = _.uniqWith(this.UnidadesArticulo, fun.isEqual);

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

  async getDataFromModal(arg, search?) {
    if (arg?.tipo == 'data_no_found') fun.enfocarAndSelectInput(`codigo-${arg.index}`);

    if (arg.modal_id == 'retornarDevuelto') this.retornarDevuelto(arg);

    if (arg.modal_id == 'removerArticulo') this.procesoQuitarArticulo(arg.key, arg.data);

    if (arg.modal_id == 'buscarArticulo') this.llenarRowDespuesDeFiltro(arg);
  }

  retornarDevuelto(arg) {
    const infoRetorno = [
      { tipo: 'defectuoso', data: arg.data?.defectuoso, contenedor_retorno: this.factServ.filasDetalle },
      { tipo: 'solo_devuelto', data: arg.data?.solo_devuelto, contenedor_retorno: this.factServ.productos_devueltos },
    ];

    infoRetorno.forEach((itemRetorno) => {
      if (fun.hasValue(itemRetorno?.data?.key) && itemRetorno?.data?.cantidad > 0) {
        let articulo_devuelto = _.find(itemRetorno.contenedor_retorno, (item) => {
          const entidad = itemRetorno.tipo == 'defectuoso' ? item.value : item;
          return entidad.key == itemRetorno?.data?.key;
        });

        const articulo_devuelto_index = _.findIndex(itemRetorno.contenedor_retorno, articulo_devuelto);
        const campos_devuelto = (articulo_devuelto as any)?.controls;

        if (itemRetorno.tipo == 'defectuoso') articulo_devuelto = articulo_devuelto.value;

        const retornar_info = this.parsearProductoDevueltos(fun.duplicarJson(itemRetorno.data?.origin), fun.duplicarJson(itemRetorno.data), false);

        if (retornar_info['cantidad'] == articulo_devuelto.cantidad) {
          if (itemRetorno.tipo == 'defectuoso') {
            this.pasosQuitarArticulo(articulo_devuelto.key);
          } else {
            _.pullAt(itemRetorno.contenedor_retorno, articulo_devuelto_index);
          }
        } else {
          if (itemRetorno.tipo == 'defectuoso') {
            campos_devuelto['cantidad'].setValue(articulo_devuelto.cantidad - retornar_info['cantidad']);
            campos_devuelto['cantidad_en_unidades'].setValue(articulo_devuelto.cantidad_en_unidades - retornar_info['cantidad_en_unidades']);
            campos_devuelto['descuento_valor'].setValue(fun.numFormatTwoDecimals(articulo_devuelto.descuento_valor - retornar_info['descuento_valor']));
            this.calcularMontosRow(articulo_devuelto_index);
          } else {
            articulo_devuelto['cantidad'] -= retornar_info['cantidad'];
            articulo_devuelto['cantidad_en_unidades'] -= retornar_info['cantidad_en_unidades'];
            articulo_devuelto['descuento_valor'] -= retornar_info['descuento_valor'];

            articulo_devuelto['total'] = articulo_devuelto['cantidad'] * fun.desformatear(articulo_devuelto['precio']) - articulo_devuelto['descuento_valor'];
          }
        }

        // ----- CAMBIO DEL ARTICULO ORIGEN -----
        const articulo_origin = _.find(this.factServ.filasDetalle, (detalle) => detalle.value.key == articulo_devuelto.key_origin);
        if (fun.hasValue(articulo_origin)) {
          const articulo_origin_index = _.findIndex(this.factServ.filasDetalle, articulo_origin);

          const campos_origin = (articulo_origin as any).controls;

          campos_origin['cantidad'].setValue(articulo_origin.value.cantidad + retornar_info['cantidad']);
          campos_origin['cantidad_en_unidades'].setValue(articulo_origin.value.cantidad_en_unidades + retornar_info['cantidad_en_unidades']);
          campos_origin['descuento_valor'].setValue(fun.numFormatTwoDecimals(articulo_origin.value.descuento_valor + retornar_info['descuento_valor']));
          this.calcularMontosRow(articulo_origin_index);
        } else {
          retornar_info.key = retornar_info.key_origin;
          [retornar_info.is_defectuoso, retornar_info.is_devuelto, retornar_info.from_pre_factura] = Array(3).fill(false);
          [retornar_info.key_origin, retornar_info.producto_origin] = Array(2).fill(undefined);

          this.llenarDetalles(retornar_info, retornar_info.articulo, this.secuencia);
        }
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
    const current_detalle = _.find(this.factServ.filasDetalle, (detalle) => detalle.value.key == key);
    const index_current_detalle = _.findIndex(this.factServ.filasDetalle, (detalle) => detalle.value.key == key);

    const origin_current_detalle = fun.duplicarJson(current_detalle.value);

    const medida = current_detalle.value.articulo.tipo_articulo.tipo == 'servicio' ? 'Servicio' : current_detalle.value.articulo.medida;

    const promiseArray = [];

    if (origin_current_detalle.cantidad == data_remover.cantidad) {
      promiseArray.push(this.pasosQuitarArticulo(origin_current_detalle.key));
    } else {
      current_detalle.controls['cantidad'].setValue(current_detalle.value.cantidad - data_remover.cantidad);
      current_detalle.controls['cantidad_en_unidades'].setValue(current_detalle.value.cantidad * current_detalle.value.articulo.contenido[medida]);
      current_detalle.controls['descuento_valor'].setValue(fun.numFormatTwoDecimals((origin_current_detalle.descuento_valor / origin_current_detalle.cantidad) * current_detalle.value.cantidad));

      promiseArray.push(this.calcularMontosRow(index_current_detalle).then((result) => {}));
    }

    Promise.all(promiseArray).then((res) => {
      const detalles_llenos = this.factServ.getDetallesLlenos();

      if (data_remover.cantidad <= origin_current_detalle.cantidad) {
        if (data_remover.razon == razon_remover.producto_defectuoso) {
          const articulo_ya_retirado = _.find(detalles_llenos, (detalle) => detalle.key_origin == current_detalle.value.key);
          const articulo_retirado_index = fun.hasValue(articulo_ya_retirado) ? _.findIndex(this.factServ.filasDetalle, (detalle) => detalle.value.key == articulo_ya_retirado.key) : null;

          const producto_defectuoso = this.parsearProductoDevueltos(origin_current_detalle, data_remover, true);

          setTimeout(() => {
            if (fun.hasValue(articulo_ya_retirado)) {
              this.addToProductosDevueltos(producto_defectuoso, 'modify', { data: articulo_ya_retirado, tipo: 'producto_defectuoso', index: articulo_retirado_index });
            } else {
              this.llenarDetalles(producto_defectuoso, producto_defectuoso.articulo, this.secuencia);
            }
          }, 10);
        } else if (data_remover.razon == razon_remover.no_venta) {
          const articulo_ya_retirado = _.find(this.factServ.productos_devueltos, (detalle) => detalle.key_origin == current_detalle.value.key);

          const producto_devuelto = this.parsearProductoDevueltos(origin_current_detalle, data_remover, false);

          const action = fun.hasValue(articulo_ya_retirado) ? 'modify' : 'add';
          setTimeout(() => this.addToProductosDevueltos(producto_devuelto, action, { data: articulo_ya_retirado, tipo: 'producto_devuelto' }), 10);
          //
        }
      }
    });
  }

  addToProductosDevueltos(data, tipo: 'add' | 'modify', articulo_ya_retirado?) {
    const array1 = ['key', 'articulo_id', 'cantidad', 'articulo', 'calcular_saco', 'cantidad_en_unidades', 'costo', 'descuento_valor', 'descripcion'];
    const array2 = ['is_defectuoso', 'is_devuelto', 'itbis', 'precio', 'total', 'unidad', 'key_origin', 'producto_origin'];
    const producto = _.pick(data, [...array1, ...array2]);

    producto['articulo_id'] = producto.articulo.id;

    if (tipo == 'add') {
      this.factServ.productos_devueltos.push(producto);
    }

    if (tipo == 'modify') {
      if (articulo_ya_retirado.tipo == 'producto_devuelto') {
        articulo_ya_retirado.data.cantidad += producto.cantidad;
        articulo_ya_retirado.data.cantidad_en_unidades += producto.cantidad_en_unidades;
        articulo_ya_retirado.data.descuento_valor += producto.descuento_valor;
        articulo_ya_retirado.data.total += producto.total;

        articulo_ya_retirado.data.total = articulo_ya_retirado.data.total - articulo_ya_retirado.data.descuento_valor;
      }

      if (articulo_ya_retirado.tipo == 'producto_defectuoso') {
        const campos = (this.factServ.filasDetalle[articulo_ya_retirado.index] as any).controls;

        campos['cantidad'].setValue(producto.cantidad + articulo_ya_retirado.data.cantidad);
        campos['descuento_valor'].setValue(fun.numFormatTwoDecimals(producto.descuento_valor + articulo_ya_retirado.data.descuento_valor));

        this.calcularMontosRow(articulo_ya_retirado.index);
      }
    }
  }

  parsearProductoDevueltos(producto_origin, data_remover, is_defectuoso) {
    const articulo_a_retirar = fun.duplicarJson(producto_origin);

    const medida = articulo_a_retirar.articulo.tipo_articulo.tipo == 'servicio' ? 'Servicio' : articulo_a_retirar.articulo.medida;

    articulo_a_retirar.descuento_valor = (articulo_a_retirar.descuento_valor / articulo_a_retirar.cantidad) * data_remover.cantidad;

    articulo_a_retirar.cantidad = data_remover.cantidad;
    articulo_a_retirar.cantidad_en_unidades = data_remover.cantidad * articulo_a_retirar.articulo.contenido[medida];

    articulo_a_retirar.total = articulo_a_retirar.cantidad * fun.desformatear(articulo_a_retirar.precio);
    articulo_a_retirar.key_origin = articulo_a_retirar.key;

    articulo_a_retirar.key = fun.generateKey();
    articulo_a_retirar['is_defectuoso'] = is_defectuoso;
    articulo_a_retirar['from_pre_factura'] = true;
    articulo_a_retirar['is_devuelto'] = true;
    articulo_a_retirar['producto_origin'] = fun.duplicarJson(producto_origin);

    if (is_defectuoso) articulo_a_retirar.precio = fun.numFormatTwoDecimals(fun.desformatear(articulo_a_retirar.precio) / 2);
    if (is_defectuoso) articulo_a_retirar.total /= 2;

    return articulo_a_retirar;
  }
}
