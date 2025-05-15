import { RetornarDevueltoComponent } from './retornar-devuelto/retornar-devuelto.component';
import { FacturacionService } from './../facturacion.service';
import { tipoDocFacturacion } from './../factura';
import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormArray, FormGroup, FormArray } from '@angular/forms';
import * as _ from 'lodash';
import { MixinClass } from '@core/typescript/MixinClass';
import { ArticuloC } from '@registros/articulos/articulo';
import { BuscarArticuloComponent } from '@components/formularios en modales/buscar-articulo/buscar-articulo.component';
import { fun } from '@core/services/functions.service';
import { RemoverArticuloComponent } from './remover-articulo/remover-articulo.component';
import { razon_remover } from './remover-articulo/contantes';
import { ConfigI } from '@core/interface/config-interface';
import { Ss } from '@core/services/singleton.service';
import { ModalClass } from '@components/modal/modal-class';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-cuerpo-factura',
  templateUrl: './cuerpo-factura.component.html',
  styleUrls: ['./cuerpo-factura.component.scss'],
  standalone: false,
})
export class CuerpoFacturaComponent extends MixinClass implements OnInit, OnDestroy {
  form: UntypedFormGroup;
  ARRAY_ROWFACTURAS;

  drop;

  precioDetalle;

  secuencia;
  inputSecuencia;
  inputDrop;

  listaDeDescuentos = [];
  fun = fun;
  tipoDocFacturacion = tipoDocFacturacion;

  sacos;

  @Input() isInitialized;
  @Input() factura;
  @Input() fechaFactura;
  @Input() modo_factura;

  @Output() getCalculosDinero = new EventEmitter<any>();
  @Output() getCuerpoFactura = new EventEmitter<any>();
  @Output() getFechaFactura = new EventEmitter<any>();

  articuloClass = new ArticuloC();
  minCodigo;

  dropRowMenu: any;
  configApp: ConfigI;
  dropdownMedidaOpen: boolean = false;
  precioCostoKey: string;
  lastCuerpoChange;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: UntypedFormBuilder,
    public factServ: FacturacionService
  ) {
    super();
    // this.rowFactura = new FormArray([new FormControl()]);
  }

  ngOnInit() {
    this._init_mixin({ component: 'cuerpo_factura', is_routing: false });
    this.configApp = Ss.configServ.getConfig({ isPromise: false }) as ConfigI;
    this.rellenarVariables();
  }

  ngOnDestroy() {
    if (this.destroy$) this.destroy$.next();
    if (this.destroy$) this.destroy$.complete();
    this._destroy_mixin();
  }

  escucharCambiosEnForm() {
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(changes => {
      if (!fun.isEqual(this.lastCuerpoChange, fun.deepCloning(this.factServ.getDetallesLlenos())) && fun.hasValue(this.factServ.getDetallesLlenos())) {
        this.lastCuerpoChange = fun.deepCloning(this.factServ.getDetallesLlenos());
        setTimeout(() => {
          this.emitirCambiosForm(this.factServ.getDetallesLlenos());
        }, 250);
      }
    });
  }

  emitirCambiosForm(detalles_llenos) {
    const detalle_factura = [];
    detalles_llenos.forEach((fila, index) => {
      if (fun.hasValue(fila.articulo)) {
        fila.articulo_id = fila?.articulo?.id;
        fila.total = fun.desformatearStNumber(fila.total);
        fila.descuento_valor = fun.hasValue(fila.descuento_valor) ? fun.desformatearStNumber(fila.descuento_valor) : 0;
        fila.precio = fun.desformatearStNumber(fila.precio);
        fila.costo = fun.desformatearStNumber(fila.costo);
        this.calcularCantidadEnUnidades({ index: index });

        if (fila.cantidad && fila.unidad) detalle_factura.push(fun.deepCloning(fila));
      }
    });

    this.getCuerpoFactura.emit({ tipo: 'cuerpo', data: fun.deepCloning(detalle_factura) });
  }

  async rellenarVariables() {
    console.log('%c ---rellenarVariables ---', 'color: cyan; font-weight: bold;');
    
    return new Promise(async (resolve, reject) => {
      try {
        this.listaDeDescuentos.length = 0;
        this.secuencia = 0;

        [this.ARRAY_ROWFACTURAS, this.precioDetalle, this.inputDrop, this.factServ.filasDetalle] = Array(4).fill(undefined);
        this.inputSecuencia = 'codigo-0';

        this.sacos = [25, 50, 100];

        this.createForm().then(() => {
          this.lastCuerpoChange = fun.deepCloning(this.factServ.getDetallesLlenos());
          this.escucharCambiosEnForm();
        });

        this.ARRAY_ROWFACTURAS = this.form['rowFactura'] as UntypedFormArray;

        for (let index = 1; index <= 25; index++) await this.addItem();

        this.factServ.filasDetalle = (this.form.controls['rowFactura'] as UntypedFormArray).controls;

        this.precioCostoKey = this.factServ.isCompra ? 'costo' : 'precio';

        console.log('%c this.precioCostoKey ', 'color: lime; font-weight: bold;', this.precioCostoKey);

        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  createForm() {
    return new Promise<void>(resolve => {
      this.form = this.fb.group({
        rowFactura: this.fb.array([this.createItem()]),
      });

      resolve();
    });
  }

  pasosQuitarArticulo(key) {
    return new Promise<any>(async (resolve, reject) => {
      await this.sacarDescuento(key);
      await this.removeItem(key);
      await this.enviarTotalesGenerales();
      await this.ajustarSecuencia();
      await this.setInputDrop(undefined);
      resolve(true);
    });
  }

  abrirOverlay(dropRowMenu, event, index_cuerpo) {
    if (this.checkIfRowContainArticulo(index_cuerpo)) {
      this.dropRowMenu = dropRowMenu;
      this.dropRowMenu.toggle(event);
    }
  }

  readPrecio() {
    let res = true;

    if (fun.hasValue(this.factServ.propietario_factura)) {
      if (this.factServ.isCompra) {
        res = false;
      } else {
        res = !this.configApp.facturacion_editar_precio;
      }
    }

    return res;
  }

  readDescuento() {
    const res = (this.factServ.isVenta || this.factServ.tipoDocumento === tipoDocFacturacion.pre_venta) && this.factServ.propietario_factura ? false : true;
    return res;
  }

  checkCodigo(index) {
    const formulario = this.factServ.filasDetalle[index].getRawValue();

    if (fun.hasValue(formulario.codigo) && fun.is_number(formulario.codigo)) this.minCodigo = 5;
    else this.minCodigo = undefined;
  }

  selectedRow(index, bool) {
    const lista = [`codigo-${index}`, `cantidad-${index}`, `unidad-${index}`, `descripcion-${index}`, `precio-${index}`, `costo-${index}`, `descuento_valor-${index}`, `total-${index}`];
    lista.forEach(row => {
      if (this.checkIfRowContainArticulo(index)) {
        const action = bool ? 'add' : 'remove';
        fun.ModificarClass(row, 'inputOscuro', action);
      }
    });
  }

  checkIfRowContainArticulo(index) {
    let res = false;
    if (this.factServ.filasDetalle) {
      const element = this.factServ.filasDetalle[index] as FormGroup;
      res = element.controls['descripcion'].value || element.controls['codigo'].value;
    }
    return res;
  }

  hasArticulosDevueltos(index) {
    const current_detalle = this.factServ.filasDetalle[index].getRawValue();

    const detalles = this.factServ.getDetallesLlenos();

    return detalles.some(detalle => detalle.key_initial == current_detalle.key && fun.hasValue(current_detalle.key)) || this.factServ.productos_devueltos.some(detalle => detalle.key_initial == current_detalle.key);
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
      unidades: [null],
      detalle_id: [null],
      codigo: [null],
      cantidad: [null],
      cantidad_initial: [0],
      cantidad_ant: [null],
      descripcion: [null],
      unidad: [null],
      precio: [null],
      costo: [null],
      descuento_valor: [null],
      total: [null],
      itbis: [null],
      cantidad_en_unidades: [0],
      cantidad_en_unidades_initial: [0],
      calcular_saco: [false],
      is_defectuoso: [false],
      is_devuelto: [false],
      from_pre_factura: [false],
      vende_sin_inventario: [false],
      is_bad_price: [false],
      actual_price: [null],
      actual_price_value: [null],
      key_initial: [null],
      producto_initial: [null],
    });
  }

  addItem(): void {
    this.ARRAY_ROWFACTURAS = this.form.get('rowFactura') as FormArray;
    this.ARRAY_ROWFACTURAS.push(this.createItem());
  }

  removeItem(key: string) {
    const index = this.factServ.filasDetalle.findIndex(detalle => detalle.value.key == key);
    (this.form.get('rowFactura') as FormArray).removeAt(index);
  }

  // =============================================
  //  MODIFICAR FACTURA
  // =============================================
  async rellenarCuerpoFactura(detalles, is_archivada) {
    return new Promise<void>(resolve => {
      this.getActualPriceDetalles(detalles, is_archivada).then(actual_prices_db => {
        this.rellenarVariables()
          .then(async res => {
            if (res) {
              for (let index = 0; index < detalles.length; index++) {
                if (index + 1 >= this.ARRAY_ROWFACTURAS.value.length) this.addItem();
                const detalle_en_turno = detalles[index];

                if (is_archivada) {
                  const actual_price_db = actual_prices_db.find(item => item.id == detalle_en_turno.articulo_id);
                  detalle_en_turno.actual_price = actual_price_db.costos;
                }

                if (detalle_en_turno.unidad.includes('Saco de')) {
                  detalle_en_turno.peso_saco = Number(detalle_en_turno.unidad.split(' ')[2]);
                }

                await this.getArticuloToLlenar(detalle_en_turno).then(articulo => {
                  this.llenarDetalles(detalle_en_turno, articulo, index);
                  if (fun.hasValue(this.factServ.propietario_factura)) this.seleccionarCampoEnTurno();
                });
              }

              resolve();
            } else {
              resolve();
            }
          })
          .catch(error => {});
      });
    });
  }

  getActualPriceDetalles(detalles, is_archivada) {
    return new Promise<any>(resolve => {
      if (is_archivada) {
        const extra = { afterPath: `custom/get_actual_price_detalles`, parameters: { ids: fun.removerDuplicados(detalles.map(detalle => detalle.articulo_id)).join(','), costos: true } };
        this.articuloClass.dynamic(extra).then(res => resolve(res.data));
      } else {
        resolve(null);
      }
    });
  }

  getArticuloToLlenar(row) {
    return new Promise<any>(async resolve => {
      let articulo = row.articulo;

      if (fun.isEmpty(articulo) || fun.isEmpty(row.articulo.id)) {
        const res = await this.articuloClass.getArticulosFiltrado({ buscar: row.codigo, fecha: this.fechaFactura });
        articulo = _.first(res['data']);
      }

      resolve(articulo);
    });
  }

  llenarDetalles(data, articulo, index) {
    const formGroup = this.factServ.filasDetalle[index] as FormGroup;
    const detalle = {};
    detalle['detalle_id'] = fun.hasValue(data?.id) ? data?.id : null;
    detalle['articulo'] = articulo;
    detalle['unidades'] = this.llenarArrayUnidades(articulo);
    detalle['codigo'] = articulo.codigo;
    detalle['precio'] = fun.roundNumberToDecimal(data.precio);
    detalle['costo'] = fun.roundNumberToDecimal(data.costo);
    detalle['descuento_valor'] = fun.isEmpty(data.descuento_valor) || data.descuento_valor == 0 ? null : fun.roundNumberToDecimal(data.descuento_valor);
    detalle['cantidad'] = data.cantidad;
    detalle['cantidad_initial'] = fun.hasValue(data.cantidad) ? data.cantidad : 0;
    detalle['cantidad_en_unidades_initial'] = 0;
    detalle['cantidad_en_unidades'] = 0;
    detalle['key_initial'] = fun.hasValue(data?.key_initial) ? data.key_initial : null;
    detalle['key'] = fun.hasValue(data?.key) ? data.key : fun.generateKey();
    detalle['descripcion'] = `${_.capitalize(articulo.nombre)} ${data.is_defectuoso ? ' (defectuoso)' : ''}`;
    detalle['calcular_saco'] = data.calcular_saco;
    detalle['is_defectuoso'] = data.is_defectuoso;
    detalle['is_devuelto'] = data.is_devuelto || false;
    detalle['from_pre_factura'] = data.from_pre_factura || false;
    detalle['vende_sin_inventario'] = this.configApp.vende_sin_inventario;

    detalle['is_bad_price'] = this.getBadPrice(data).bool;
    detalle['actual_price'] = data?.actual_price;
    detalle['actual_price_value'] = this.getBadPrice(data).monto;
    detalle['producto_initial'] = fun.hasValue(data?.producto_initial) ? data.producto_initial : null;

    let unidad = fun.hasValue(data.peso_saco) ? `Saco de ${data.peso_saco} libras` : data.unidad;

    detalle['unidad'] = unidad;

    formGroup.patchValue(detalle);

    this.calcularMontosRow(index);

    this.ajustarSecuencia();
  }

  test(arg) {
    const current_detalle = this.factServ.filasDetalle[arg].getRawValue();
  }

  getBadPrice(data) {
    const response = { bool: false, monto: '' };

    const medida = data.peso_saco || data.unidad.includes('Saco de') ? `Saco_${data.peso_saco}` : data.unidad;

    let current_monto = this.factServ.isCompra ? data.costo : data.precio;

    const tipo = this.factServ.isCompra ? 'costo' : 'precio';
    let actual_price_monto = fun.hasValue(data.actual_price) ? data.actual_price[medida][tipo] : current_monto;

    if (data.is_defectuoso) actual_price_monto = actual_price_monto / 2;

    current_monto = fun.roundNumberToDecimal(current_monto);
    actual_price_monto = fun.roundNumberToDecimal(actual_price_monto);

    response.bool = this.factServ.isCompra ? false : current_monto != actual_price_monto;
    response.monto = this.factServ.isCompra ? current_monto : actual_price_monto;
    return response;
  }

  // =============================================
  //  BOTON ATRAS
  // =============================================
  atras() {
    window.history.back();
  }

  seleccionarCampoEnTurno() {
    if (fun.hasValue(this.factServ.propietario_factura)) {
      setTimeout(() => {
        this.ajustarSecuencia('seleccionarCampoEnTurno').then(res =>
          setTimeout(() => {
            fun.enfocarInput(this.inputSecuencia);
          }, 10)
        );
      }, 100);
    }
  }

  async saltar(input, index) {
    setTimeout(() => {
      if (index >= 10 && input === 'cantidad-') this.addItem();

      if (input == 'precioOCompra-') input = this.factServ.isCompra ? 'costo-' : 'precio-';

      const { articulo, codigo, cantidad, unidad } = this.factServ.filasDetalle[index].getRawValue();

      if (input == 'unidad-' && fun.hasValue(cantidad) && cantidad != 0 && fun.hasValue(codigo)) {
        this.saliDeCantidad(index).then(excede => {
          if (!excede) fun.enfocarInput('unidad-' + index);
        });
      }

      if ((input === 'precio-' || input === 'costo-') && fun.hasValue(codigo) && fun.hasValue(cantidad) && cantidad != 0 && fun.hasValue(unidad)) {
        fun.enfocarInput(`${input}${index}`);
      }

      if (input === 'cantidad-' && fun.hasValue(codigo)) {
        if (fun.isEmpty(articulo) || codigo !== articulo.codigo) {
          const metodo = this.factServ.isPreVenta ? tipoDocFacturacion.venta : this.factServ.tipoDocumento;
          const obj = { palabra_a_buscar: codigo, index, metodo: metodo, data: [], fecha_articulo: this.fechaFactura };
          this.openNewModal({
            component: BuscarArticuloComponent,
            inputs: obj,
            id: 'buscarArticulo',
            header: 'BUSCAR ARTICULO',
            width: '56.25rem',
            height: '31.25rem',
            botones: {
              ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
            },
          });

          fun.enfocarInput('input_fantasma');
        } else {
          fun.enfocarAndSelectInput(`cantidad-${index}`);
        }
      }
    }, 10);
  }

  ajustarSecuencia(where?: string) {
    return new Promise(resolve => {
      const filas_ocupadas = this.factServ.filasDetalle.filter(item => fun.hasValue(item.value.articulo));

      this.secuencia = filas_ocupadas.length;

      this.inputSecuencia = 'codigo-' + this.secuencia;

      resolve(true);
    });
  }

  saliDeCantidad(index) {
    return new Promise<boolean>(resolve => {
      const formGroup = this.factServ.filasDetalle[index] as FormGroup;
      const detale = {};
      const { unidad, cantidad, cantidad_ant } = formGroup.getRawValue();

      if (cantidad != cantidad_ant && fun.hasValue(unidad)) {
        if (this.factServ.isVenta && !this.factServ.pre_venta_selected && fun.hasValue(unidad))
          this.checkCantidadExede(index, 'change').then(excede => {
            if (excede) {
              fun.enfocarAndSelectInput('cantidad-' + index);
              detale['cantidad'] = cantidad_ant;
              detale['unidad'] = null;
            } else {
              detale['cantidad_ant'] = cantidad;
            }
            formGroup.patchValue(detale);

            resolve(excede);
          });
      } else {
        formGroup.controls['cantidad_ant'].setValue(cantidad);
        resolve(false);
      }
    });
  }

  async checkCantidadExede(index, lugar) {
    return new Promise<boolean>(async resolve => {
      let sumCantidad = 0;

      if (this.configApp.vende_sin_inventario) {
        resolve(false);
        return;
      }

      const formGroup = this.factServ.filasDetalle[index] as FormGroup;
      const { articulo, from_pre_factura } = formGroup.value;

      const rowsIgual = _.map(
        this.factServ.filasDetalle.filter(item => item.value?.articulo?.id == articulo.id),
        'value'
      );

      sumCantidad = _.reduce(rowsIgual, (acumulado, item) => acumulado + (item.cantidad_en_unidades - item.cantidad_en_unidades_initial), 0);

      if (lugar === 'saltar') index--;

      try {
        let excede = true;

        const extra = { afterPath: `check_excede/${articulo.id}`, parameters: { cantidad: sumCantidad } };

        await this.articuloClass.getAll(extra).then((res: any) => {
          excede = res['data'];

          if (!excede || from_pre_factura || this.factServ.isCompra || this.factServ.isCotizacion) {
            resolve(false);
          } else if (this.factServ.isVenta && !from_pre_factura) {
            fun.toastError('Cantidad introducida excede la cantidad en inventario', 'ERROR');

            setTimeout(() => resolve(true), 20);
          }
        });
      } catch (error) {
        if (error.error) fun.toastError(error.error.msg, 'ERROR');
        resolve(false);
      }
    });
  }

  changeStateDropDownMedida(open) {
    this.dropdownMedidaOpen = open;
  }

  hideDropdownMedida() {
    setTimeout(() => this.setInputDrop(undefined), 100);
  }

  showDropdownMedida(event, dropdown) {
    fun.awaitTyping(null, 10).then(() => {
      if (!this.dropdownMedidaOpen && event.type == 'focus') {
        dropdown.show();
        this.changeStateDropDownMedida(true);
      }
    });
  }

  async selectMedidaChange(evento, index) {
    if (evento.originalEvent.type == 'click') this.selectMedida(index);
  }

  async selectMedida(index) {
    if (this.dropdownMedidaOpen) {
      const formGroup = this.factServ.filasDetalle[index] as FormGroup;
      const detalle = {};

      let { unidad: unidadaSelected, unidades } = formGroup.getRawValue();

      fun.desEnfocarInput(`unidad-${index}`);
      this.setInputDrop(undefined);

      if (unidadaSelected) {
        const medidaSelected = unidades.find(unidad => unidad.value === unidadaSelected);

        this.precioDetalle = medidaSelected.precio;
        const costoDetalle = medidaSelected.costo;

        this.checkCantidadExede(index, 'change').then(excede => {
          if (excede) {
            setTimeout(() => {
              formGroup.controls['unidad'].setValue(null);
              fun.enfocarInput(`unidad-${index}`);
            }, 200);
          } else {
            console.log('  ');
            console.log('  ');
            console.log('%c this.factServ.tipoDocumento ', 'color: magenta; font-weight: bold;', this.factServ.tipoDocumento);
            console.log('%c this.factServ.isCompra ', 'color: magenta; font-weight: bold;', this.factServ.isCompra);
            console.log('%c this.precioCostoKey ', 'color: lime; font-weight: bold;', this.precioCostoKey);
            console.log('unidadaSelected ', unidadaSelected);
            console.log('unidades ', unidades);
            console.log('medidaSelected ', medidaSelected);

            console.log('this.precioDetalle ', this.precioDetalle);
            console.log('costoDetalle ', costoDetalle);

            detalle['precio'] = fun.roundNumberToDecimal(this.precioDetalle);
            detalle['costo'] = fun.roundNumberToDecimal(costoDetalle);
            formGroup.patchValue(detalle);

            console.log('formGroup ', formGroup.getRawValue());

            this.calcularMontosRow(index).then(() => {
              this.factServ.isCompra ? fun.enfocarInput(`costo-${index}`) : this.seleccionarCampoEnTurno();
            });
          }
        });
      } else {
        setTimeout(() => fun.enfocarInput(`unidad-${index}`), 100);
      }
    }
  }

  verificarSecuencia(index) {
    if (this.secuencia < index) {
      fun.enfocarInput(this.inputSecuencia);
    }
  }

  calcularCantidadEnUnidades(params: { index: number; clean?: boolean } = { index: 0, clean: false }) {
    const formGroup = this.factServ.filasDetalle[params.index] as FormGroup;
    const { unidad, cantidad, cantidad_initial, unidades } = formGroup.value;
    const detalles = {};

    let cantidadMinima = 1;

    if (unidad && unidades.length > 0) {
      const unidad_find = unidades.find(_uni => _uni.value.toLowerCase() == unidad.toLowerCase());
      if (unidad_find) cantidadMinima = unidad_find.cantidad;
    }

    const cant_unidades = params.clean ? 0 : cantidad * cantidadMinima;
    detalles['cantidad_en_unidades'] = cant_unidades;

    const cant_unidades_initial = params.clean ? 0 : (cantidad_initial || 0) * cantidadMinima;
    detalles['cantidad_en_unidades_initial'] = cant_unidades_initial;

    if (cant_unidades == 0) {
      detalles['precio'] = null;
      detalles['total'] = null;
    }

    formGroup.patchValue(detalles);
  }

  calcularMontosRow(index: number) {
    return new Promise<any>((resolve, reject) => {
      const formGroup = this.factServ.filasDetalle[index] as FormGroup;
      const detalle = {};
      let { cantidad, articulo, codigo, key, precio, costo, descuento_valor } = formGroup.value;

      precio = fun.desformatearStNumber(precio);
      costo = fun.desformatearStNumber(costo);
      let descuento = fun.desformatearStNumber(descuento_valor);

      const precioOcosto = this.factServ.isCompra ? costo : precio;

      const total = precioOcosto * cantidad - descuento;
      const itbis = articulo?.calcular_itbis ? total * 0.18 : 0;

      if (descuento == 0 || fun.isEmpty(descuento)) {
        if (fun.hasValue(codigo) && (fun.isEmpty(descuento) || descuento == 0)) {
          formGroup.controls['descuento_valor'].reset();

          if (fun.hasValue(total) && total > 0) {
            detalle['total'] = fun.roundNumberToDecimal(total);
          }
          this.sacarDescuento(key);
        }
      } else {
        if (descuento < 0) {
          fun.toastWarning('El descuento no puede ser menor a 0', 'AVISO');
          detalle['descuento_valor'] = 0;
          fun.enfocarInput(`descuento_valor-${index}`);
        }
      }

      if (fun.hasValue(codigo) && fun.hasValue(precioOcosto) && fun.hasValue(cantidad) && fun.hasValue(descuento)) {
        if (total < 0) {
          fun.toastError('El descuento no puede ser mayor al valor total de la venta.');
          fun.enfocarAndSelectInput(`descuento_valor-${index}`);
        } else {
          let currentDescuento = this.listaDeDescuentos.find(item => item.key == key);

          if (fun.hasValue(currentDescuento)) currentDescuento.valor = descuento;
          else this.listaDeDescuentos.push({ key: key, valor: descuento });

          detalle['total'] = fun.roundNumberToDecimal(total);
          detalle['itbis'] = fun.roundNumberToDecimal(itbis);
          this.ajustarSecuencia();
        }
      }

      formGroup.patchValue(detalle);

      this.enviarTotalesGenerales();
      resolve(true);
    });
  }

  sacarDescuento(key) {
    const currentDescuento = this.listaDeDescuentos.find(item => item.key == key);
    if (fun.hasValue(currentDescuento)) this.listaDeDescuentos = this.listaDeDescuentos.filter(item => item.key != key);
  }

  enviarTotalesGenerales() {
    const tempTotal = _.reduce(this.factServ.filasDetalle, (acumulado, item) => acumulado + fun.desformatearStNumber(item.value.total), 0);
    const tempDesc = _.reduce(this.listaDeDescuentos, (acumulado, item) => acumulado + item.valor, 0);
    const tempItbis = _.reduce(this.factServ.filasDetalle, (acumulado, item) => acumulado + fun.desformatearStNumber(item.value.itbis) * item.value.cantidad, 0);

    const obj = { total: fun.roundNumberToDecimal(tempTotal), itbis: fun.roundNumberToDecimal(tempItbis), descuento: fun.roundNumberToDecimal(tempDesc) };

    this.getCalculosDinero.emit(obj);
  }

  revisarPrecio(formControlName, index) {
    let input = (this.factServ.filasDetalle[index] as FormGroup).controls[formControlName];

    fun.revisarNumber(input, `${formControlName}-${index}`).then(res => {
      if (!res.error) {
        const value = fun.roundNumberToDecimal(res.number) != '0.00' ? fun.roundNumberToDecimal(res.number) : null;
        input.setValue(value);
      } else {
        input.setValue(null);
      }
    });
  }

  handleInputEvent(type, formControlName, index) {
    let input = (this.factServ.filasDetalle[index] as FormGroup).controls[formControlName];

    if (type == 'focus' && fun.hasValue(input.value)) input.setValue(fun.desformatearStNumber(input.value));
    if (type == 'blur') {
      this.revisarPrecio(formControlName, index);
      setTimeout(() => this.calcularMontosRow(index), 10);
    }
  }

  getActualPrice(index, event?) {
    const actual_price_value = (this.factServ.filasDetalle[index] as FormGroup).controls['actual_price_value'].value;

    const siFunction = instance => {
      const formGroup = this.factServ.filasDetalle[index] as FormGroup;
      const detalle = {};
      const campoToSolve = this.factServ.isCompra ? 'costo' : 'precio';

      detalle['is_bad_price'] = false;
      detalle[campoToSolve] = actual_price_value;
      formGroup.patchValue(detalle);

      this.calcularMontosRow(index).then(result => instance.closeModal(instance.id, 'get_actual_price'));
    };

    const label = this.factServ.isCompra ? 'costo' : 'precio';
    this.confirmationModal({ id: 'get_actual_price', header: 'Confirmar', texto: `Seguro que desea obtener el ${label} actual`, siFunction: siFunction });

    if (this.dropRowMenu) this.dropRowMenu.hide();
    if (event) event.stopPropagation();
  }

  getInfoBadPrice(index) {
    let res = { icon: undefined, tooltip: undefined };

    const formulario_data = this.factServ.filasDetalle[index].getRawValue();

    const actual_price_value = fun.desformatearStNumber(formulario_data.actual_price_value);
    const tipo = this.factServ.isCompra ? 'Costo' : 'Precio';

    const precio = fun.desformatearStNumber(formulario_data.precio);
    const costo = fun.desformatearStNumber(formulario_data.costo);
    const valorToCompare = this.factServ.isCompra ? costo : precio;

    res.icon = actual_price_value > valorToCompare ? 'fa-arrow-up' : 'fa-arrow-down';
    res.tooltip = actual_price_value > valorToCompare ? `${tipo} subió` : `${tipo} bajó`;

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

    if (this.dropRowMenu) this.dropRowMenu.hide();
    if (event) event.stopPropagation();
  }

  retornarArticulosDevueltos(index, tipo, event) {
    const current_detalle = tipo == 'defectuoso' ? this.factServ.filasDetalle[index].getRawValue() : null;
    const detalles = this.factServ.getDetallesLlenos();

    const articulo_defectuoso = _.find(detalles, detalle => detalle.key_initial == current_detalle.key);
    const articulo_solo_devuelto = _.find(this.factServ.productos_devueltos, detalle => detalle.key_initial == current_detalle.key);

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

    if (this.dropRowMenu) this.dropRowMenu.hide();
    if (event) event.stopPropagation();
  }

  setInputDrop(index) {
    if (fun.hasValue(index) && fun.hasValue(this.factServ.filasDetalle)) {
      const { articulo } = this.factServ.filasDetalle[index].getRawValue();
      if (fun.hasValue(articulo)) this.inputDrop = `unidad-${index}`;
    } else {
      this.inputDrop = undefined;
      this.changeStateDropDownMedida(false);
    }

    if (this.inputDrop) setTimeout(() => fun.enfocarInput(this.inputDrop), 10);
  }

  llenarRowDespuesDeFiltro(obj) {
    const articulo = obj.data;

    console.log('articulo', articulo);

    const index = obj.index;

    if ((this.factServ.isVenta || this.factServ.isPreVenta) && articulo.existencia == 0 && articulo.tipo_articulo.tipo != 'servicio') {
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

    if ((this.factServ.isVenta || this.factServ.isPreVenta) && params.articulo.existencia > 0 && params.articulo.aviso_existencia > cantidades[params.articulo.medida_alerta]) {
      let cant_restante = fun.roundNumberToDecimal(cantidades[params.articulo.medida_alerta]);

      let msg = `Solo quedan ${cant_restante} ${params.articulo.medida_alerta} de este producto, debe de aumentar el inventario!!!`;

      if (params.articulo.descripcion.toLowerCase() == 'producto terminado') msg = `Solo quedan ${cant_restante} ${params.articulo.medida_alerta} de este producto, debe de producir mas!!!`;
      fun.toastWarning(msg, 'AVISO');
    }

    const formGroup = this.factServ.filasDetalle[params.index] as FormGroup;
    const detalle = {};
    detalle['articulo'] = params.articulo;
    detalle['unidades'] = this.llenarArrayUnidades(params.articulo);
    detalle['key'] = fun.generateKey();
    detalle['codigo'] = params.articulo.codigo;
    detalle['descripcion'] = params.articulo.nombre;
    detalle['calcular_saco'] = params.articulo.calcular_saco;
    detalle['cantidad'] = null;
    detalle['cantidad_initial'] = 0;
    detalle['cantidad_ant'] = null;
    detalle['unidad'] = null;
    detalle['vende_sin_inventario'] = this.configApp.vende_sin_inventario;

    detalle['is_bad_price'] = false;
    detalle['actual_price'] = null;
    detalle['actual_price_value'] = null;
    detalle['producto_initial'] = null;

    formGroup.patchValue(detalle);
    setTimeout(() => fun.enfocarInput('cantidad-' + params.index), 0);
  }

  llenarArrayUnidades(articulo) {
    let unidadesArticulo = [];

    if (articulo) {
      const medida = articulo.tipo_articulo.tipo == 'servicio' ? 'Servicio' : articulo.medida;
      const precioPrincipal = this.factServ.isCompra ? articulo.costo_principal : articulo.precio_principal;
      const costoPrincipal = articulo.costo_principal;

      if (medida != 'Quintal' || this.factServ.isCompra) {
        unidadesArticulo.push({ value: medida, precio: articulo.precio_principal, costo: articulo.costo_principal, cantidad: articulo.contenido[medida] });
      }

      if (articulo.vendido_en == 'Saco' && articulo.calcular_saco && this.factServ.tipoDocumento != tipoDocFacturacion.compra) this.entrarSacosAUnidades(unidadesArticulo, precioPrincipal, costoPrincipal);

      if (articulo.is_detallable || this.factServ.isCompra) {
        articulo.contenido_articulos.forEach(element => {
          unidadesArticulo.push({ value: element.medida, precio: element.precio, costo: element.costo, cantidad: articulo.contenido[element.medida] });
        });
      }

      unidadesArticulo = _.uniqWith(unidadesArticulo, fun.isEqual);
    }

    return unidadesArticulo;
  }

  entrarSacosAUnidades(unidadesArticulo, precioQuintal, costoQuintal) {
    this.sacos.forEach(saco => {
      const valor = 'Saco de ' + saco + ' libras';
      unidadesArticulo.push({
        value: valor,
        precio: this.calcularPrecioSaco(saco, precioQuintal),
        costo: this.calcularPrecioSaco(saco, costoQuintal),
        cantidad: saco,
      });
    });
  }

  calcularPrecioSaco(cant, precio) {
    const res = (cant / 100) * precio;
    return fun.roundNumberToDecimal(res);
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

    infoRetorno.forEach(itemRetorno => {
      if (fun.hasValue(itemRetorno?.data?.key) && itemRetorno?.data?.cantidad > 0) {
        let articulo_devuelto = _.find(itemRetorno.contenedor_retorno, item => {
          const entidad = itemRetorno.tipo == 'defectuoso' ? item.value : item;
          return entidad.key == itemRetorno?.data?.key;
        });

        const articulo_devuelto_index = _.findIndex(itemRetorno.contenedor_retorno, articulo_devuelto);
        const FormGroup_devuelto = articulo_devuelto as FormGroup;
        const detalle_devuelto = {};

        if (itemRetorno.tipo == 'defectuoso') articulo_devuelto = articulo_devuelto.value;

        const retornar_info = this.parsearProductoDevueltos(fun.deepCloning(itemRetorno.data?.origin), fun.deepCloning(itemRetorno.data), false);

        if (retornar_info['cantidad'] == articulo_devuelto.cantidad) {
          if (itemRetorno.tipo == 'defectuoso') {
            this.pasosQuitarArticulo(articulo_devuelto.key);
          } else {
            _.pullAt(itemRetorno.contenedor_retorno, articulo_devuelto_index);
          }
        } else {
          if (itemRetorno.tipo == 'defectuoso') {
            detalle_devuelto['cantidad'] = articulo_devuelto.cantidad - retornar_info['cantidad'];
            detalle_devuelto['cantidad_en_unidades'] = articulo_devuelto.cantidad_en_unidades - retornar_info['cantidad_en_unidades'];
            detalle_devuelto['descuento_valor'] = fun.roundNumberToDecimal(articulo_devuelto.descuento_valor - retornar_info['descuento_valor']);
            this.calcularMontosRow(articulo_devuelto_index);
          } else {
            articulo_devuelto['cantidad'] -= retornar_info['cantidad'];
            articulo_devuelto['cantidad_en_unidades'] -= retornar_info['cantidad_en_unidades'];
            articulo_devuelto['descuento_valor'] -= retornar_info['descuento_valor'];

            articulo_devuelto['total'] = articulo_devuelto['cantidad'] * fun.desformatearStNumber(articulo_devuelto['precio']) - articulo_devuelto['descuento_valor'];
          }
          FormGroup_devuelto.patchValue(detalle_devuelto);
        }

        // ----- CAMBIO DEL ARTICULO ORIGEN -----
        const articulo_origin = _.find(this.factServ.filasDetalle, detalle => detalle.value.key == articulo_devuelto.key_initial);
        if (fun.hasValue(articulo_origin)) {
          const articulo_origin_index = _.findIndex(this.factServ.filasDetalle, articulo_origin);

          const FormGroup_origin = articulo_origin as FormGroup;
          const detalle_origin = {};

          detalle_origin['cantidad'] = articulo_origin.value.cantidad + retornar_info['cantidad'];
          detalle_origin['cantidad_en_unidades'] = articulo_origin.value.cantidad_en_unidades + retornar_info['cantidad_en_unidades'];
          detalle_origin['descuento_valor'] = fun.roundNumberToDecimal(articulo_origin.value.descuento_valor + retornar_info['descuento_valor']);

          FormGroup_origin.patchValue(detalle_origin);
          this.calcularMontosRow(articulo_origin_index);
        } else {
          retornar_info.key = retornar_info.key_initial;
          [retornar_info.is_defectuoso, retornar_info.is_devuelto, retornar_info.from_pre_factura] = Array(3).fill(false);
          [retornar_info.key_initial, retornar_info.producto_initial] = Array(2).fill(undefined);

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
    const current_detalle = _.find(this.factServ.filasDetalle, detalle => detalle.value.key == key);
    const index_current_detalle = _.findIndex(this.factServ.filasDetalle, detalle => detalle.value.key == key);

    const origin_current_detalle = fun.deepCloning(current_detalle.value);

    const medida = current_detalle.value.articulo.tipo_articulo.tipo == 'servicio' ? 'Servicio' : current_detalle.value.articulo.medida;

    const promiseArray = [];

    if (origin_current_detalle.cantidad == data_remover.cantidad) {
      promiseArray.push(this.pasosQuitarArticulo(origin_current_detalle.key));
    } else {
      const detalle = {};
      detalle['cantidad'] = current_detalle.value.cantidad - data_remover.cantidad;
      detalle['cantidad_en_unidades'] = current_detalle.value.cantidad * current_detalle.value.articulo.contenido[medida];
      detalle['descuento_valor'] = fun.roundNumberToDecimal((origin_current_detalle.descuento_valor / origin_current_detalle.cantidad) * current_detalle.value.cantidad);

      current_detalle.patchValue(detalle);
      promiseArray.push(this.calcularMontosRow(index_current_detalle));
    }

    Promise.all(promiseArray).then(res => {
      const detalles_llenos = this.factServ.getDetallesLlenos();

      if (data_remover.cantidad <= origin_current_detalle.cantidad) {
        if (data_remover.razon == razon_remover.producto_defectuoso) {
          const articulo_ya_retirado = _.find(detalles_llenos, detalle => detalle.key_initial == current_detalle.value.key);
          const articulo_retirado_index = fun.hasValue(articulo_ya_retirado) ? _.findIndex(this.factServ.filasDetalle, detalle => detalle.value.key == articulo_ya_retirado.key) : null;

          const producto_defectuoso = this.parsearProductoDevueltos(origin_current_detalle, data_remover, true);

          setTimeout(() => {
            if (fun.hasValue(articulo_ya_retirado)) {
              this.addToProductosDevueltos(producto_defectuoso, 'modify', { data: articulo_ya_retirado, tipo: 'producto_defectuoso', index: articulo_retirado_index });
            } else {
              this.llenarDetalles(producto_defectuoso, producto_defectuoso.articulo, this.secuencia);
            }
          }, 10);
        } else if (data_remover.razon == razon_remover.no_venta) {
          const articulo_ya_retirado = _.find(this.factServ.productos_devueltos, detalle => detalle.key_initial == current_detalle.value.key);

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
    const array2 = ['is_defectuoso', 'is_devuelto', 'itbis', 'precio', 'total', 'unidad', 'key_initial', 'producto_initial'];
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
        const formGroup = this.factServ.filasDetalle[articulo_ya_retirado.index] as FormGroup;
        const detalle = {};

        detalle['cantidad'] = producto.cantidad + articulo_ya_retirado.data.cantidad;
        detalle['descuento_valor'] = fun.roundNumberToDecimal(producto.descuento_valor + articulo_ya_retirado.data.descuento_valor);
        formGroup.patchValue(detalle);

        this.calcularMontosRow(articulo_ya_retirado.index);
      }
    }
  }

  parsearProductoDevueltos(producto_initial, data_remover, is_defectuoso) {
    const articulo_a_retirar = fun.deepCloning(producto_initial);

    const medida = articulo_a_retirar.articulo.tipo_articulo.tipo == 'servicio' ? 'Servicio' : articulo_a_retirar.articulo.medida;

    articulo_a_retirar.descuento_valor = (articulo_a_retirar.descuento_valor / articulo_a_retirar.cantidad) * data_remover.cantidad;

    articulo_a_retirar.cantidad = data_remover.cantidad;
    articulo_a_retirar.cantidad_en_unidades = data_remover.cantidad * articulo_a_retirar.articulo.contenido[medida];

    articulo_a_retirar.total = articulo_a_retirar.cantidad * fun.desformatearStNumber(articulo_a_retirar.precio);
    articulo_a_retirar.key_initial = articulo_a_retirar.key;

    articulo_a_retirar.key = fun.generateKey();
    articulo_a_retirar['is_defectuoso'] = is_defectuoso;
    articulo_a_retirar['from_pre_factura'] = true;
    articulo_a_retirar['is_devuelto'] = true;
    articulo_a_retirar['producto_initial'] = fun.deepCloning(producto_initial);

    if (is_defectuoso) articulo_a_retirar.precio = fun.roundNumberToDecimal(fun.desformatearStNumber(articulo_a_retirar.precio) / 2);
    if (is_defectuoso) articulo_a_retirar.total /= 2;

    return articulo_a_retirar;
  }
}
