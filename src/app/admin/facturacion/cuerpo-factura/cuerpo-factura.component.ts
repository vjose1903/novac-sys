import { RetornarDevueltoComponent } from './retornar-devuelto/retornar-devuelto.component';
import { FacturacionService } from './../facturacion.service';
import { tipoDocFacturacion } from './../factura';
import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, inject } from '@angular/core';
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
import { Subject, takeUntil } from 'rxjs';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';
import { confirmationButtons, ICallbackModal, modalActionsE, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';
import { CuerpoFacturaFormService } from './services/cuerpo-factura-form.service';

@Component({
  selector: 'app-cuerpo-factura',
  templateUrl: './cuerpo-factura.component.html',
  styleUrls: ['./cuerpo-factura.component.scss'],
  standalone: false,
})
export class CuerpoFacturaComponent extends MixinClass implements OnInit, OnDestroy {
  form: UntypedFormGroup;
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

  dynamicModalServ = inject(DynamicModalService);
  private fb = inject(UntypedFormBuilder);
  private formServ = inject(CuerpoFacturaFormService);
  public factServ = inject(FacturacionService);

  constructor() {
    super();
    // this.rowFactura = new FormArray([new FormControl()]);
  }

  ngOnInit() {
    this._init_mixin({ component: 'cuerpo_factura', is_routing: false });
    this.configApp = Ss.configServ.config;
    this.rellenarVariables();
  }

  ngOnDestroy() {
    if (this.destroy$) this.destroy$.next();
    if (this.destroy$) this.destroy$.complete();
    this._destroy_mixin();
  }

  escucharCambiosEnForm() {
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(changes => {
      const detallesActuales = this.factServ.getDetallesLlenos();
      if (fun.hasValue(detallesActuales)) {
        const detallesClonados = fun.deepCloning(detallesActuales);

        if (!fun.isEqual(this.lastCuerpoChange, detallesClonados)) {
          this.lastCuerpoChange = detallesClonados;

          fun.setTimeout(() => {
            this.emitirCambiosForm(this.factServ.getDetallesLlenos());
          }, 250);
        }
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

        if (fila.cantidad && fila.unidad) detalle_factura.push(fun.deepCloning(fila));
      }
    });

    this.getCuerpoFactura.emit({ tipo: 'cuerpo', data: detalle_factura });
  }

  async rellenarVariables(): Promise<boolean> {
    try {
      // Limpiar arrays y variables
      this.listaDeDescuentos.length = 0;
      this.secuencia = 0;
      this.inputSecuencia = 'codigo-0';
      this.sacos = [25, 50, 100];

      // Resetear variables a undefined
      [this.precioDetalle, this.inputDrop, this.factServ.filasDetalle] = Array(3).fill(undefined);

      this.form = this.formServ.createForm(this.fb);
      const formArray = this.form.get('rowFactura') as UntypedFormArray;

      // Configurar variables del servicio
      this.factServ.filasDetalle = formArray;
      this.precioCostoKey = this.factServ.isCompra() ? 'costo' : 'precio';

      // Configurar listeners y estado inicial
      this.lastCuerpoChange = fun.deepCloning(this.factServ.getDetallesLlenos());
      this.escucharCambiosEnForm();

      return true;
    } catch (error) {
      throw error;
    }
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
      if (this.factServ.isCompra()) {
        res = false;
      } else {
        res = !this.configApp.facturacion_editar_precio;
      }
    }

    return res;
  }

  readDescuento() {
    const res = (this.factServ.isVenta() || this.factServ.isPreVenta()) && this.factServ.propietario_factura ? false : true;
    return res;
  }

  checkCodigo(index) {
    const formulario = this.factServ.filasDetalle.at(index).getRawValue();

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
      const element = this.factServ.filasDetalle.at(index) as FormGroup;
      res = element.controls['descripcion'].value || element.controls['codigo'].value;
    }
    return res;
  }

  hasArticulosDevueltos(index) {
    if (!this.factServ.filasDetalle || !this.factServ.filasDetalle.at(index)) return false;

    const current_detalle = this.factServ.filasDetalle.at(index).getRawValue();

    const detalles = this.factServ.getDetallesLlenos();

    return (
      detalles.some(detalle => detalle.key_initial == current_detalle.key && fun.hasValue(current_detalle.key)) || (this.factServ.productos_devueltos && this.factServ.productos_devueltos.some(detalle => detalle.key_initial == current_detalle.key))
    );
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
    return this.formServ.createItem(this.fb);
  }

  addItem(): void {
    if (!this.form) return;
    const formArray = this.form.get('rowFactura') as UntypedFormArray;
    formArray.push(this.createItem());
  }

  removeItem(key: string) {
    const index = this.factServ.filasDetalle.controls.findIndex(detalle => detalle.value.key == key);
    (this.form.get('rowFactura') as FormArray).removeAt(index);
  }

  // =============================================
  //  MODIFICAR FACTURA
  // =============================================
  async rellenarCuerpoFactura(detalles, is_archivada) {
    return new Promise<void>(resolve => {
      this.getActualPriceDetalles(detalles, is_archivada)
        .then(actual_prices_db => {
          this.rellenarVariables()
            .then(async res => {
              if (!res) {
                resolve();
                return;
              }

              const formArray = this.form.get('rowFactura') as UntypedFormArray;

              for (let index = 0; index < detalles.length; index++) {
                // Asegurar que hay suficientes elementos en el formulario
                if (index + 1 >= formArray.value.length) this.addItem();

                const detalle_en_turno = detalles[index];

                // Actualizar precio si es factura archivada
                if (is_archivada) {
                  const actual_price_db = actual_prices_db.find(item => item.id === detalle_en_turno.articulo_id);
                  if (actual_price_db) detalle_en_turno.actual_price = actual_price_db.costos;
                }

                // Procesar peso del saco si la unidad lo contiene
                if (detalle_en_turno.unidad.includes('Saco de')) {
                  const pesoPartes = detalle_en_turno.unidad.split(' ');
                  detalle_en_turno.peso_saco = Number(pesoPartes[2]);
                }

                // Obtener y llenar artículo
                const articulo = await this.getArticuloToLlenar(detalle_en_turno);
                this.llenarDetalles(detalle_en_turno, articulo, index);

                // Seleccionar campo si hay propietario
                if (fun.hasValue(this.factServ.propietario_factura)) {
                  this.seleccionarCampoEnTurno();
                }
              }

              resolve();
            })
            .catch(error => {
              console.error('Error al rellenar variables:', error);
              resolve();
            });
        })
        .catch(error => {
          console.error('Error al obtener precios actuales:', error);
          resolve();
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
        const res = await this.articuloClass.getArticulosFiltrado({
          buscar: row.codigo,
          fecha: this.fechaFactura,
          is_compra: this.factServ.isCompra(),
          tipo: 'todos',
          mode: 'usable',
          match: 'exact',
          limit: 1,
        });
        articulo = res['data'][0];
      }

      resolve(articulo);
    });
  }

  llenarDetalles(data, articulo, index) {
    const formGroup = this.factServ.filasDetalle.at(index) as FormGroup;
    const detalle = {};
    const unidades = this.llenarArrayUnidades(articulo);
    const unidad = fun.hasValue(data.peso_saco) ? `Saco de ${data.peso_saco} libras` : data.unidad;
    const unidadSelected = unidades.find(item => item.value?.toLowerCase() === unidad?.toLowerCase());
    const precio = fun.hasValue(data.precio) ? data.precio : unidadSelected?.precio ?? articulo.precio_principal;
    const costo = fun.hasValue(data.costo) ? data.costo : unidadSelected?.costo ?? articulo.costo_principal;

    detalle['detalle_id'] = fun.hasValue(data?.id) ? data?.id : null;
    detalle['articulo'] = articulo;
    detalle['unidades'] = unidades;
    detalle['codigo'] = articulo.codigo;
    detalle['precio'] = fun.roundNumberToDecimal(precio);
    detalle['costo'] = fun.roundNumberToDecimal(costo);
    detalle['descuento_valor'] = fun.isEmpty(data.descuento_valor) || data.descuento_valor == 0 ? null : fun.roundNumberToDecimal(data.descuento_valor);
    detalle['cantidad'] = data.cantidad;
    detalle['cantidad_initial'] = fun.hasValue(data.cantidad) ? data.cantidad : 0;
    detalle['cantidad_en_unidades_initial'] = 0;
    detalle['cantidad_en_unidades'] = 0;
    detalle['key_initial'] = fun.hasValue(data?.key_initial) ? data.key_initial : null;
    detalle['key'] = fun.hasValue(data?.key) ? data.key : fun.generateKey();
    detalle['descripcion'] = `${fun.capitalice(articulo.nombre)} ${data.is_defectuoso ? ' (defectuoso)' : ''}`;
    detalle['calcular_saco'] = data.calcular_saco;
    detalle['is_defectuoso'] = data.is_defectuoso;
    detalle['is_devuelto'] = data.is_devuelto || false;
    detalle['from_pre_factura'] = data.from_pre_factura || false;
    detalle['vende_sin_inventario'] = this.configApp.vende_sin_inventario;

    detalle['is_bad_price'] = this.getBadPrice(data, articulo).bool;
    detalle['actual_price'] = data?.actual_price;
    detalle['actual_price_value'] = this.getBadPrice(data, articulo).monto;
    detalle['producto_initial'] = fun.hasValue(data?.producto_initial) ? data.producto_initial : null;

    detalle['unidad'] = unidad;

    formGroup.patchValue(detalle);

    this.calcularMontosRow(index);

    this.ajustarSecuencia();
  }

  test(arg) {
    const current_detalle = this.factServ.filasDetalle.at(arg).getRawValue();
  }

  getBadPrice(data, articulo) {
    const response = { bool: false, monto: '' };

    const medida = data.peso_saco || data.unidad.includes('Saco de') ? `Saco_${data.peso_saco}` : data.unidad;

    const tipo = this.factServ.isCompra() ? 'costo' : 'precio';
    let current_monto = this.factServ.isCompra() ? data.costo : data.precio;
    if (!fun.hasValue(current_monto)) current_monto = this.factServ.isCompra() ? articulo.costo_principal : articulo.precio_principal;

    const actual_price = data.actual_price?.[medida]?.[tipo];
    let actual_price_monto = fun.hasValue(actual_price) ? actual_price : current_monto;

    if (data.is_defectuoso) actual_price_monto = actual_price_monto / 2;

    current_monto = fun.roundNumberToDecimal(current_monto);
    actual_price_monto = fun.roundNumberToDecimal(actual_price_monto);

    response.bool = this.factServ.isCompra() ? false : current_monto != actual_price_monto;
    response.monto = this.factServ.isCompra() ? current_monto : actual_price_monto;
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
      this.ajustarSecuencia('seleccionarCampoEnTurno').then(res => {
        fun.enfocarInput(this.inputSecuencia);
      });
    }
  }

  async saltar(next_input, index) {
    if (index >= 10 && next_input === 'cantidad-') this.addItem();

    if (next_input == 'precioOCompra-') next_input = this.factServ.isCompra() ? 'costo-' : 'precio-';

    const { articulo, codigo, cantidad, unidad } = this.factServ.filasDetalle.at(index).getRawValue();

    if (next_input == 'unidad-' && fun.hasValue(cantidad) && cantidad != 0 && fun.hasValue(codigo)) {
      this.saliDeCantidad(index).then(excede => {
        if (!excede) fun.enfocarInput('unidad-' + index);
      });
    }

    if ((next_input === 'precio-' || next_input === 'costo-') && fun.hasValue(codigo) && fun.hasValue(cantidad) && cantidad != 0 && fun.hasValue(unidad)) {
      fun.enfocarInput(`${next_input}${index}`);
    }

    if (next_input === 'cantidad-' && fun.hasValue(codigo)) {
      if (fun.isEmpty(articulo) || codigo !== articulo.codigo) {
        this.searchArticulo({ index, codigo });
      } else {
        fun.enfocarAndSelectInput(`cantidad-${index}`);
      }
    }
  }

  async searchArticulo(args: { index: number; codigo: string }) {
    const { index, codigo } = args;
    const metodo = this.factServ.isPreVenta() ? tipoDocFacturacion.venta : this.factServ.tipoDocumento();

    if (isNaN(Number(codigo)) || codigo.length < 5) {
      const obj = { palabra_a_buscar: codigo, index, metodo: metodo, fecha_articulo: this.fechaFactura };

      const buscarArticuloModalConf = new DynamicModalClass();

      buscarArticuloModalConf.id = 'buscarArticulo';
      buscarArticuloModalConf.inputs = obj;
      buscarArticuloModalConf.header = 'BUSCAR ARTICULO';
      buscarArticuloModalConf.width = '57rem';
      buscarArticuloModalConf.height = '32rem';
      buscarArticuloModalConf.component = BuscarArticuloComponent;
      buscarArticuloModalConf.closableEsc = true;

      buscarArticuloModalConf.setCallback((args: ICallbackModal) => this.llenarRowDespuesDeFiltro(args, index));
      buscarArticuloModalConf.show();

      setTimeout(() => fun.enfocarInput('input_fantasma'), 10);
    } else {
      try {
        const res = await this.articuloClass.getArticulosFiltrado({
          buscar: codigo,
          fecha: this.fechaFactura,
          is_compra: this.factServ.isCompra(),
          tipo: 'todos',
          mode: 'usable',
          match: 'exact',
          limit: 1,
        });

        this.llenarRowDespuesDeFiltro({ data: { articulo: res.data[0], index } }, index, false);
      } catch (error) {}
    }
  }

  ajustarSecuencia(where?: string) {
    return new Promise(resolve => {
      const filas_ocupadas = this.factServ.filasDetalle.controls.filter(item => fun.hasValue(item.value.articulo));

      this.secuencia = filas_ocupadas.length;

      this.inputSecuencia = 'codigo-' + this.secuencia;

      resolve(true);
    });
  }

  async saliDeCantidad(index: number): Promise<boolean> {
    const formGroup = this.factServ.filasDetalle.at(index) as FormGroup;
    const { unidad, cantidad, cantidad_ant } = formGroup.getRawValue();

    // Si no hay cambio en cantidad o no hay unidad, solo actualizar cantidad_ant
    if (cantidad === cantidad_ant || !fun.hasValue(unidad)) {
      formGroup.controls['cantidad_ant'].setValue(cantidad);
      return false;
    }

    // Solo validar inventario para ventas normales (no pre-ventas)
    const debeValidarInventario = this.factServ.isVenta() && !this.factServ.pre_venta_selected && fun.hasValue(unidad);

    if (!debeValidarInventario) {
      formGroup.controls['cantidad_ant'].setValue(cantidad);
      return false;
    }

    // Calcular cantidad en unidades y verificar si excede inventario
    await this.calcularCantidadEnUnidades({ index });
    const excede = await this.checkCantidadExcede(index, 'change');

    const detalle: any = {};

    if (excede) {
      // Si excede, revertir cambios y enfocar input
      detalle.cantidad = cantidad_ant;
      detalle.unidad = null;
      fun.enfocarAndSelectInput(`cantidad-${index}`);
    } else {
      // Si no excede, actualizar cantidad_ant
      detalle.cantidad_ant = cantidad;
    }

    formGroup.patchValue(detalle);
    return excede;
  }

  async checkCantidadExcede(index, lugar) {
    return new Promise<boolean>(async resolve => {
      let sumCantidad = 0;

      if (this.configApp.vende_sin_inventario) {
        resolve(false);
        return;
      }

      const formGroup = this.factServ.filasDetalle.at(index) as FormGroup;
      const { articulo, from_pre_factura } = formGroup.getRawValue();

      const sameArticuloRows = this.factServ.filasDetalle.controls.filter(item => item.value?.articulo?.id == articulo.id).map(item => item.value);

      sumCantidad = sameArticuloRows.reduce((acumulado, item) => {
        return acumulado + (item.cantidad_en_unidades - item.cantidad_en_unidades_initial);
      }, 0);

      if (lugar === 'saltar') index--;

      try {
        let excede = true;

        const extra = { afterPath: `check_excede/${articulo.id}`, parameters: { cantidad: sumCantidad } };

        await this.articuloClass.getAll(extra).then((res: any) => {
          excede = res['data'];

          if (!excede || from_pre_factura || this.factServ.isCompra() || this.factServ.isCotizacion()) {
            resolve(false);
          } else if (this.factServ.isVenta() && !from_pre_factura) {
            fun.toastError('Cantidad introducida excede la cantidad en inventario', 'ERROR');

            fun.setTimeout(() => resolve(true), 20);
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
    fun.setTimeout(() => this.setInputDrop(undefined), 100);
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
    fun.setTimeout(() => {
      if (evento.originalEvent.type == 'click') this.selectMedida(index);
    }, 0);
  }

  async selectMedida(index) {
    if (!this.dropdownMedidaOpen) return;

    const formGroup = this.factServ.filasDetalle.at(index) as FormGroup;
    const { unidad: unidadSelected, unidades } = formGroup.getRawValue();

    // Limpiar estado del dropdown
    fun.desEnfocarInput(`unidad-${index}`);
    this.setInputDrop(undefined);

    if (!unidadSelected) {
      fun.setTimeout(() => fun.enfocarInput(`unidad-${index}`), 100);
      return;
    }

    const medidaSelected = unidades.find(unidad => unidad.value === unidadSelected);
    if (!medidaSelected) return;

    // Actualizar precios
    this.precioDetalle = medidaSelected.precio;
    const costoDetalle = medidaSelected.costo;

    // Calcular cantidad en unidades
    await this.calcularCantidadEnUnidades({ index });

    // Verificar si excede inventario
    const excede = await this.checkCantidadExcede(index, 'change');

    if (excede) {
      fun.setTimeout(() => {
        formGroup.controls['unidad'].setValue(null);
        fun.enfocarInput(`unidad-${index}`);
      }, 200);
      return;
    }

    // Actualizar formulario con nuevos precios
    const detalle = {
      precio: fun.roundNumberToDecimal(this.precioDetalle),
      costo: fun.roundNumberToDecimal(costoDetalle),
    };

    formGroup.patchValue(detalle);

    // Calcular montos y enfocar siguiente campo
    await this.calcularMontosRow(index);
    this.factServ.isCompra() ? fun.enfocarInput(`costo-${index}`) : this.seleccionarCampoEnTurno();
  }

  verificarSecuencia(index) {
    if (this.secuencia < index) {
      fun.enfocarInput(this.inputSecuencia);
    }
  }

  calcularCantidadEnUnidades(params: { index: number; clean?: boolean } = { index: 0, clean: false }) {
    const formGroup = this.factServ.filasDetalle.at(params.index) as FormGroup;
    const { unidad, cantidad, cantidad_initial, unidades } = formGroup.getRawValue();

    // Calcular cantidad mínima basada en la unidad seleccionada
    const cantidadMinima = unidad && unidades?.length > 0 ? unidades.find(uni => uni.value.toLowerCase() === unidad.toLowerCase())?.cantidad || 1 : 1;

    // Calcular cantidades en unidades
    const cant_unidades = params.clean ? 0 : cantidad * cantidadMinima;
    const cant_unidades_initial = params.clean ? 0 : (cantidad_initial || 0) * cantidadMinima;

    // Preparar objeto de detalles a actualizar
    const detalles = {
      cantidad_en_unidades: cant_unidades,
      cantidad_en_unidades_initial: cant_unidades_initial,
    };

    // Limpiar precio y total si no hay unidades
    if (cant_unidades === 0) {
      detalles['precio'] = null;
      detalles['total'] = null;
    }

    formGroup.patchValue(detalles);
  }

  calcularMontosRow(index: number) {
    const formGroup = this.factServ.filasDetalle.at(index) as FormGroup;
    const detalle = {};
    let { cantidad, articulo, codigo, key, precio, costo, descuento_valor } = formGroup.value;

    precio = fun.desformatearStNumber(precio);
    costo = fun.desformatearStNumber(costo);
    let descuento = fun.isEmpty(descuento_valor) ? 0 : fun.desformatearStNumber(descuento_valor);

    const precioOcosto = this.factServ.isCompra() ? costo : precio;

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

    if (fun.hasValue(codigo) && fun.hasValue(precioOcosto) && fun.hasValue(cantidad)) {
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
  }

  sacarDescuento(key) {
    const currentDescuento = this.listaDeDescuentos.find(item => item.key == key);
    if (fun.hasValue(currentDescuento)) this.listaDeDescuentos = this.listaDeDescuentos.filter(item => item.key != key);
  }

  enviarTotalesGenerales() {
    const tempTotal = this.factServ.filasDetalle.controls.reduce((acumulado, item) => acumulado + fun.desformatearStNumber(item.value.total), 0);
    const tempDesc = this.listaDeDescuentos.reduce((acumulado, item) => acumulado + item.valor, 0);
    const tempItbis = this.factServ.filasDetalle.controls.reduce((acumulado, item) => acumulado + fun.desformatearStNumber(item.value.itbis) * item.value.cantidad, 0);

    const obj = { total: fun.roundNumberToDecimal(tempTotal), itbis: fun.roundNumberToDecimal(tempItbis), descuento: fun.roundNumberToDecimal(tempDesc) };

    this.getCalculosDinero.emit(obj);
  }

  revisarPrecio(formControlName, index) {
    const input = (this.factServ.filasDetalle.at(index) as FormGroup).controls[formControlName];

    return fun.revisarNumber(input, `${formControlName}-${index}`).then(res => {
      if (!res.error) {
        const roundedNumber = fun.roundNumberToDecimal(res.number);
        const value = roundedNumber != '0.00' ? roundedNumber : null;
        input.setValue(value);
      } else {
        input.setValue(null);
      }
    });
  }

  async handleInputEvent(type, formControlName, index) {
    const input = (this.factServ.filasDetalle.at(index) as FormGroup).controls[formControlName];

    if (type == 'focus' && fun.hasValue(input.value)) input.setValue(fun.desformatearStNumber(input.value));
    if (type == 'blur') {
      await this.revisarPrecio(formControlName, index);
      await this.calcularMontosRow(index);
    }
  }

  getActualPrice(index, event?) {
    const actual_price_value = (this.factServ.filasDetalle.at(index) as FormGroup).controls['actual_price_value'].value;

    const siFunction = () => {
      const formGroup = this.factServ.filasDetalle.at(index) as FormGroup;
      const detalle = {};
      const campoToSolve = this.factServ.isCompra() ? 'costo' : 'precio';

      detalle['is_bad_price'] = false;
      detalle[campoToSolve] = actual_price_value;
      formGroup.patchValue(detalle);

      this.calcularMontosRow(index);
    };

    const label = this.factServ.isCompra() ? 'costo' : 'precio';

    this.dynamicModalServ.confirmationModal({
      id: 'get_actual_price',
      texto: `Seguro que desea obtener el ${label} actual`,
      btnKind: confirmationButtons.siNo,
      onYes: siFunction.bind(this),
    });

    if (this.dropRowMenu) this.dropRowMenu.hide();
    if (event) event.stopPropagation();
  }

  getInfoBadPrice(index) {
    let res = { icon: undefined, tooltip: undefined };

    const formulario_data = this.factServ.filasDetalle.at(index).getRawValue();

    const actual_price_value = fun.desformatearStNumber(formulario_data.actual_price_value);
    const tipo = this.factServ.isCompra() ? 'Costo' : 'Precio';

    const precio = fun.desformatearStNumber(formulario_data.precio);
    const costo = fun.desformatearStNumber(formulario_data.costo);
    const valorToCompare = this.factServ.isCompra() ? costo : precio;

    res.icon = actual_price_value > valorToCompare ? 'fa-arrow-up' : 'fa-arrow-down';
    res.tooltip = actual_price_value > valorToCompare ? `${tipo} subió` : `${tipo} bajó`;

    return res;
  }

  modalRemover(index, event?) {
    const data = this.factServ.filasDetalle.at(index).getRawValue();

    const { descripcion, cantidad, unidad, key } = data;

    let obj = { index, key, cantidad, is_prefactura_selected: fun.hasValue(this.factServ.pre_venta_selected), data_detalle: data };
    obj['nombre'] = unidad ? `${descripcion} (${unidad})` : descripcion;

    const modalConfig = new DynamicModalClass();
    modalConfig.width = obj.is_prefactura_selected ? '40rem' : '30rem';
    modalConfig.component = RemoverArticuloComponent;
    modalConfig.inputs = obj;
    modalConfig.id = 'removerArticulo';
    modalConfig.header = 'Confirmación';
    modalConfig.contentStyleClass = 'confirmation-modal-content';
    modalConfig.styleClass = 'confirmation-dialog';
    modalConfig.transitionOptions = '180ms cubic-bezier(0.23, 1, 0.32, 1)';

    modalConfig.botones = [
      { clase: 'btn-light-grey', action: modalActionsE.close, label: 'Cerrar', disable: false },
      { id: 'btn_aceptar', clase: 'btn-green', label: 'Aceptar', disable: false },
    ];

    modalConfig.setCallback(this.procesoQuitarArticulo.bind(this));
    modalConfig.show();

    if (this.dropRowMenu) this.dropRowMenu.hide();
    if (event) event.stopPropagation();
  }

  retornarArticulosDevueltos(index, tipo, event) {
    const current_detalle = tipo == 'defectuoso' ? this.factServ.filasDetalle.at(index).getRawValue() : null;
    const detalles = this.factServ.getDetallesLlenos();

    const articulo_defectuoso = detalles.find(detalle => detalle.key_initial == current_detalle.key);
    const articulo_solo_devuelto = this.factServ.productos_devueltos ? this.factServ.productos_devueltos.find(detalle => detalle.key_initial == current_detalle.key) : null;

    const name = current_detalle.descripcion;
    const unidad = current_detalle.unidad;

    const inputs = { data: current_detalle, articulo_defectuoso: articulo_defectuoso, articulo_solo_devuelto: articulo_solo_devuelto, tipo: tipo, is_articulo_selected: true };
    inputs['nombre'] = unidad ? `${name} (${unidad})` : name;

    const modalConfig = new DynamicModalClass();
    modalConfig.width = '57rem';
    modalConfig.height = '32rem';
    modalConfig.component = RetornarDevueltoComponent;
    modalConfig.inputs = inputs;
    modalConfig.id = 'retornarDevuelto';
    modalConfig.header = 'Retornar Articulos Devueltos';

    modalConfig.botones = [
      { clase: 'btn btn-gris', action: modalActionsE.close, label: 'Cerrar', disable: false },
      { id: 'btn_aceptar', clase: 'btn btn-green', label: 'Aceptar', disable: false },
    ];

    modalConfig.setCallback((arg: ICallbackModal) => this.retornarDevuelto(arg.data));
    modalConfig.show();

    if (this.dropRowMenu) this.dropRowMenu.hide();
    if (event) event.stopPropagation();
  }

  setInputDrop(index) {
    if (fun.hasValue(index) && fun.hasValue(this.factServ.filasDetalle)) {
      const { articulo } = this.factServ.filasDetalle.at(index).getRawValue();
      if (fun.hasValue(articulo)) this.inputDrop = `unidad-${index}`;
    } else {
      this.inputDrop = undefined;
      this.changeStateDropDownMedida(false);
    }

    if (this.inputDrop) fun.setTimeout(() => fun.enfocarInput(this.inputDrop), 10);
  }

  llenarRowDespuesDeFiltro(args: ICallbackModal | { data: any }, index: number, fromModal: boolean = true) {
    if (fromModal && (args as ICallbackModal).type == modalCloseType.onHide) {
      if (!(args as ICallbackModal).hasReturnData) {
        fun.enfocarAndSelectInput(`codigo-${index}`);
      }
      return;
    }

    const { articulo, tipo } = args.data;
    if (fun.hasValue(tipo) && tipo == 'data_no_found') {
      fun.enfocarAndSelectInput(`codigo-${index}`);
      return;
    }

    const isVentaOrPreVenta = this.factServ.isVenta() || this.factServ.isPreVenta();
    const isProductoAgotado = articulo.existencia == 0 && articulo.tipo_articulo.tipo != 'servicio';

    if (isVentaOrPreVenta && isProductoAgotado) {
      const isProductoTerminado = articulo.descripcion.toLowerCase() == 'producto terminado';
      const mensaje = isProductoTerminado ? 'Producto agotado, debe de producir mas!!!' : 'Producto agotado, debe de comprar mas!!!';

      fun.toastError(mensaje, 'ERROR');

      if (this.configApp.vende_sin_inventario) {
        this.continuarLlenarRow({ articulo, index });
      } else {
        fun.setTimeout(() => fun.enfocarAndSelectInput(`codigo-${index}`), 10);
      }
    } else {
      this.continuarLlenarRow({ articulo, index });
    }
  }

  continuarLlenarRow(params: { articulo: any; index: number }) {
    const cantidades = params.articulo.cantidades;

    if ((this.factServ.isVenta() || this.factServ.isPreVenta()) && params.articulo.existencia > 0 && params.articulo.aviso_existencia > cantidades[params.articulo.medida_alerta]) {
      let cant_restante = fun.roundNumberToDecimal(cantidades[params.articulo.medida_alerta]);

      let msg = `Solo quedan ${cant_restante} ${params.articulo.medida_alerta} de este producto, debe de aumentar el inventario!!!`;

      if (params.articulo.descripcion.toLowerCase() == 'producto terminado') msg = `Solo quedan ${cant_restante} ${params.articulo.medida_alerta} de este producto, debe de producir mas!!!`;
      fun.toastWarning(msg, 'AVISO');
    }

    const formGroup = this.factServ.filasDetalle.at(params.index) as FormGroup;
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
    fun.setTimeout(() => fun.enfocarInput('cantidad-' + params.index), 0);
  }

  llenarArrayUnidades(articulo) {
    let unidadesArticulo = [];

    if (articulo) {
      const medida = articulo.tipo_articulo.tipo == 'servicio' ? 'Servicio' : articulo.medida;
      const precioPrincipal = this.factServ.isCompra() ? articulo.costo_principal : articulo.precio_principal;
      const costoPrincipal = articulo.costo_principal;

      if (medida != 'Quintal' || this.factServ.isCompra()) {
        unidadesArticulo.push({ value: medida, precio: articulo.precio_principal, costo: articulo.costo_principal, cantidad: articulo.contenido[medida] });
      }

      if (articulo.vendido_en == 'Saco' && articulo.calcular_saco && this.factServ.tipoDocumento() != tipoDocFacturacion.compra) this.entrarSacosAUnidades(unidadesArticulo, precioPrincipal, costoPrincipal);

      if (articulo.is_detallable || this.factServ.isCompra()) {
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

  retornarDevuelto(arg: { key: string; retorno: { solo_devuelto: any; defectuoso: any } }) {
    const infoRetorno = [
      { tipo: 'defectuoso', data: arg.retorno?.defectuoso, contenedor_retorno: this.factServ.filasDetalle.controls },
      { tipo: 'solo_devuelto', data: arg.retorno?.solo_devuelto, contenedor_retorno: this.factServ.productos_devueltos || [] },
    ];

    infoRetorno.forEach(itemRetorno => {
      if (fun.hasValue(itemRetorno?.data?.key) && itemRetorno?.data?.cantidad > 0) {
        let articulo_devuelto = itemRetorno.contenedor_retorno.find(item => {
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
        const articulo_origin = _.find(this.factServ.filasDetalle.controls, detalle => detalle.value.key == articulo_devuelto.key_initial);
        if (fun.hasValue(articulo_origin)) {
          const articulo_origin_index = _.findIndex(this.factServ.filasDetalle.controls, articulo_origin);

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

  procesoQuitarArticulo(arg: ICallbackModal) {
    if (arg.type != modalCloseType.returnData) return;

    const { key, data } = arg.data;

    if (this.factServ.pre_venta_selected && data) {
      this.retirarArticuloPreFactura(key, data);
    } else {
      this.pasosQuitarArticulo(key);
    }
  }

  retirarArticuloPreFactura(key, data_remover) {
    const current_detalle = _.find(this.factServ.filasDetalle.controls, detalle => detalle.value.key == key);
    const index_current_detalle = _.findIndex(this.factServ.filasDetalle.controls, detalle => detalle.value.key == key);

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
          const articulo_retirado_index = fun.hasValue(articulo_ya_retirado) ? _.findIndex(this.factServ.filasDetalle.controls, detalle => detalle.value.key == articulo_ya_retirado.key) : null;

          const producto_defectuoso = this.parsearProductoDevueltos(origin_current_detalle, data_remover, true);

          fun.setTimeout(() => {
            if (fun.hasValue(articulo_ya_retirado)) {
              this.addToProductosDevueltos(producto_defectuoso, 'modify', { data: articulo_ya_retirado, tipo: 'producto_defectuoso', index: articulo_retirado_index });
            } else {
              this.llenarDetalles(producto_defectuoso, producto_defectuoso.articulo, this.secuencia);
            }
          }, 10);
        } else if (data_remover.razon == razon_remover.no_venta) {
          const articulo_ya_retirado = this.factServ.productos_devueltos ? this.factServ.productos_devueltos.find(detalle => detalle.key_initial == current_detalle.value.key) : null;

          const producto_devuelto = this.parsearProductoDevueltos(origin_current_detalle, data_remover, false);

          const action = fun.hasValue(articulo_ya_retirado) ? 'modify' : 'add';
          fun.setTimeout(() => {
            this.addToProductosDevueltos(producto_devuelto, action, { data: articulo_ya_retirado, tipo: 'producto_devuelto' });
          }, 10);
          //
        }
      }
    });
  }

  addToProductosDevueltos(data, tipo: 'add' | 'modify', articulo_ya_retirado?) {
    // Propiedades a extraer del producto
    const propiedades = [
      'key',
      'articulo_id',
      'cantidad',
      'articulo',
      'calcular_saco',
      'cantidad_en_unidades',
      'costo',
      'descuento_valor',
      'descripcion',
      'is_defectuoso',
      'is_devuelto',
      'itbis',
      'precio',
      'total',
      'unidad',
      'key_initial',
      'producto_initial',
    ];

    const producto = _.pick(data, propiedades);
    producto.articulo_id = producto.articulo.id;

    if (tipo === 'add') {
      this.agregarProductoDevuelto(producto);
    } else if (tipo === 'modify') {
      this.modificarProductoDevuelto(producto, articulo_ya_retirado);
    }
  }

  private agregarProductoDevuelto(producto: any): void {
    if (!this.factServ.productos_devueltos) this.factServ.productos_devueltos = [];

    this.factServ.productos_devueltos.push(producto);
  }

  private modificarProductoDevuelto(producto: any, articulo_ya_retirado: any): void {
    if (articulo_ya_retirado.tipo === 'producto_devuelto') {
      this.modificarProductoDevueltoExistente(producto, articulo_ya_retirado);
    } else if (articulo_ya_retirado.tipo === 'producto_defectuoso') {
      this.modificarProductoDefectuoso(producto, articulo_ya_retirado);
    }
  }

  private modificarProductoDevueltoExistente(producto: any, articulo_ya_retirado: any): void {
    const data = articulo_ya_retirado.data;

    // Sumar valores
    data.cantidad += producto.cantidad;
    data.cantidad_en_unidades += producto.cantidad_en_unidades;
    data.descuento_valor += producto.descuento_valor;
    data.total += producto.total;

    // Recalcular total final
    data.total -= data.descuento_valor;
  }

  private modificarProductoDefectuoso(producto: any, articulo_ya_retirado: any): void {
    const formGroup = this.factServ.filasDetalle.at(articulo_ya_retirado.index) as FormGroup;

    const detalle = {
      cantidad: producto.cantidad + articulo_ya_retirado.data.cantidad,
      descuento_valor: fun.roundNumberToDecimal(producto.descuento_valor + articulo_ya_retirado.data.descuento_valor),
    };

    formGroup.patchValue(detalle);
    this.calcularMontosRow(articulo_ya_retirado.index);
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
