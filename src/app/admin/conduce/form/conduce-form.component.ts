import { HtmlElementsService } from '@core/services/html-elements.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormArray, FormGroup } from '@angular/forms';
import { ArticuloC } from '@registros/articulos/articulo';
import { ConduceC } from '../../conduce/coduce';
import { FacturaC, request_factura_campo, tipoDocFacturacion } from '../../facturacion/factura';
import { PdfService } from '@core/services/reports/pdf/pdf.service';
import { BuscarArticuloComponent } from '@components/formularios en modales/buscar-articulo/buscar-articulo.component';
import { BuscarClienteSuplidorComponent } from '@components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { ModalSeleccionarArticuloComponent } from '@components/formularios en modales/modal-seleccionar-articulo/modal-seleccionar-articulo.component';
import { fun } from '@core/services/functions.service';
import { Permisos } from '@core/typescript/permisos';
import { table_config } from '@components/new_tablas/tabla-class';
import { ConfirmacionImprimirComponent } from '@components/formularios en modales/confirmacion-imprimir/confirmacion-imprimir.component';
import { teclasCode } from '@core/typescript/constantes';
import { Router } from '@angular/router';
import { Ss } from '@core/services/singleton.service';
import { ConfigI } from '@core/interface/config-interface';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';
import { confirmationButtons, ICallbackModal, modalActionsE, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';

@Component({
  selector: 'app-conduce-form',
  templateUrl: './conduce-form.component.html',
  styleUrls: ['./conduce-form.component.scss'],
  standalone: false,
})
export class ConduceFormComponent extends MixinClass implements OnInit, OnDestroy {
  secuenciaKeys = [];

  @HostListener('window:keydown', ['$event'])
  @HostListener('window:keyup', ['$event'])
  handleKeyboardEvent(event: any) {
    event.stopPropagation();
    const key = event.keyCode;
    const secuenciasAceptadas = [teclasCode._control, teclasCode._P];
    if (event.type === 'keydown') {
      if (!this.secuenciaKeys.includes(key) && secuenciasAceptadas.includes(key)) this.secuenciaKeys.push(key);
    } else if (event.type === 'keyup') {
      const combinacion = this.secuenciaKeys.join('_');

      this.secuenciaKeys = [];

      if (combinacion === `${teclasCode._control}_${teclasCode._P}`) {
        if (fun.hasValue(document.activeElement.id)) fun.desEnfocarInput(document.activeElement.id);
        this.imprimirConduce();
      }
    }
  }

  listaClientes;

  cliente;
  facturas_adelantadas = [];

  form: UntypedFormGroup;
  indexRemove: any;
  filasDetalle;

  minCodigo: number;
  secuencia = 0;
  inputSecuencia = 'cod-0';
  inputDrop;

  listaArticulos = [];
  sacos = [25, 50, 100];

  TOTAL: number;
  is_print = false;
  dropdownMedidaOpen: boolean = false;
  info = [];
  fun = fun;

  table_config: table_config = {
    info: [
      { titulo: '1', tipo: 'icon', key: 'some_is_selected', estilos: [{ width: '2rem' }, { color: 'var(--transparente00)' }], iconsArray: [{ key: 'detalles_selected' }] },
      { titulo: 'Numero Fact', key: 'secuencia', tipo: 'text' },
      { titulo: 'NCF', key: 'numero_comprobante', tipo: 'text' },
      { titulo: 'Fecha Facturacion', key: 'fecha_equivalente', tipo: 'date' },
      { titulo: 'Total Facturado', key: 'total_factura', tipo: 'formatoNumero' },
    ],
    id_tabla: 'lista_conduces',
    obj_paginate: { show: false },
  };

  facturaAdelantadaSelected;
  CuerpoConduce = [];
  rowsExcede = [];
  fechaConduce: any;

  articuloClass = new ArticuloC();
  conduceClass = new ConduceC();
  facturaClass = new FacturaC();
  permissions = Permisos;
  formPermissions = [Permisos.role.create, Permisos.role.update];

  configApp: ConfigI;

  htmlServ = inject(HtmlElementsService);
  dynamicModalServ = inject(DynamicModalService);
  private fb = inject(UntypedFormBuilder);
  private router = inject(Router);

  constructor() {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'conduce', is_routing: true });
    this.configApp = Ss.configServ.config;

    this.necesarioStar();
  }

  async necesarioStar() {
    this.createForm().then(() => {
      this.filasDetalle = this.form.get('rowFactura') as UntypedFormArray;

      for (let index = 1; index <= 22; index++) {
        this.addItem(index);
      }
    });

    this.fechaConduce = this.formarFechaFactura(new Date())['FechaFactura'];
    fun.enfocarInput('clienteI');
  }

  createForm() {
    return new Promise<void>((resolve, reject) => {
      this.form = this.fb.group({
        rowFactura: this.fb.array([this.createItem(0)]),
      });

      resolve();
    });
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  pressEscResponse(res) {
    if (fun.hasValue(res)) fun.enfocarAndSelectInput('cod-' + res);
  }

  async procesoQuitarArticulo() {
    await this.removeItem(this.indexRemove);
    await this.ajustarSecuencia();
    await this.reajustarExcedentes();
    await this.checkFacturasAdelantadasSelection();
  }

  async reajustarExcedentes(conteo = 0) {
    const filas_ocupadas = this.filasDetalle.controls.filter(item => fun.hasValue(item.value.articulo));

    this.checkCantidadExede(conteo, 'proceso_quitar_articulo', excede => {
      if (excede) this.rowsExcede.push(conteo);
      else if (this.rowsExcede.includes(conteo) && !excede) fun.pull(this.rowsExcede, conteo);

      conteo++;
      if (conteo < filas_ocupadas.length) this.reajustarExcedentes(conteo);
      else {
        const excedientes_mayores = this.rowsExcede.filter(item => item >= conteo);
        excedientes_mayores.forEach(element => fun.pull(this.rowsExcede, element));
      }
    });
  }

  ajustarSecuencia() {
    return new Promise(resolve => {
      const filas_ocupadas = this.filasDetalle.controls.filter(item => fun.hasValue(item.value.articulo));
      this.secuencia = filas_ocupadas.length;

      this.inputSecuencia = 'cod-' + this.secuencia;

      resolve(true);
    });
  }

  async saltar(next_input, index) {
    fun.setTimeout(() => {
      const fila_actual = this.filasDetalle.at(index).getRawValue();
      const fila_siguiente = this.filasDetalle.at(index + 1).getRawValue();

      const { articulo, cod, can, uni, detalle_factura_id } = fila_actual;

      if (index >= 10 && next_input == 'can-') this.addItem(index);

      let campo_siguiente = fun.hasValue(fila_siguiente['detalle_factura_id']) ? `can-${index + 1}` : this.inputSecuencia;

      if (next_input == 'uni-' && fun.hasValue(can) && can != 0 && fun.hasValue(cod)) {
        const campo = fun.hasValue(detalle_factura_id) ? campo_siguiente : `uni-${index}`;
        fun.enfocarInput(campo);
      }

      if (next_input == 'can-' && fun.hasValue(cod)) {
        if (fun.isEmpty(articulo) || cod !== articulo.codigo) {
          const obj = { palabra_a_buscar: cod, index, metodo: 'venta', fecha_articulo: this.fechaConduce };

          const buscarArticuloModalConf = new DynamicModalClass();

          buscarArticuloModalConf.id = 'buscarArticulo';
          buscarArticuloModalConf.inputs = obj;
          buscarArticuloModalConf.header = 'BUSCAR ARTICULO';
          buscarArticuloModalConf.width = '57rem';
          buscarArticuloModalConf.height = '32rem';
          buscarArticuloModalConf.component = BuscarArticuloComponent;
          buscarArticuloModalConf.closableEsc = true;

          buscarArticuloModalConf.setCallback((args: ICallbackModal) => this.llenarRowDespuesDeFiltro(args));
          buscarArticuloModalConf.show();

          setTimeout(() => fun.enfocarInput('input_fantasma'), 10);
        } else {
          fun.enfocarInput(`can-${index}`);
        }
      }
    }, 0);
  }

  llenarRowDespuesDeFiltro(args: ICallbackModal | { data: any }, fromModal: boolean = true) {
    if (fromModal && (args as ICallbackModal).type == modalCloseType.onHide) return;

    const { articulo, index, tipo } = args.data;

    if (fun.hasValue(tipo) && tipo == 'data_no_found') {
      fun.enfocarAndSelectInput(`cod-${index}`);
      return;
    }

    if (articulo.existencia == 0) {
      let msg = 'Producto agotado, debe de comprar mas!!!';

      if (articulo.descripcion === 'Producto terminado') msg = 'Producto agotado, debe de producir mas!!!';
      fun.toastError(msg, 'ERROR');

      if (this.configApp.vende_sin_inventario) {
        this.continuarLlenarRow({ articulo: articulo, index: index });
      } else {
        fun.setTimeout(() => fun.enfocarAndSelectInput('cod-' + index), 10);
      }
    } else {
      this.continuarLlenarRow({ articulo: articulo, index: index });
    }
  }

  continuarLlenarRow(params: { articulo: any; index: number }) {
    const cantidades = params.articulo.cantidades;

    if (params.articulo.existencia > 0 && params.articulo.aviso_existencia > cantidades[params.articulo.medida_alerta]) {
      let cant_restante = fun.roundNumberToDecimal(cantidades[params.articulo.medida_alerta]);

      let msg = `Solo quedan ${cant_restante} ${params.articulo.medida_alerta} de este producto, debe de aumentar el inventario!!!`;

      if (params.articulo.descripcion === 'Producto terminado') msg = `Solo quedan ${cant_restante} ${params.articulo.medida_alerta} de este producto, debe de producir mas!!!`;
      fun.toastWarning(msg, 'AVISO');
    }

    (this.filasDetalle.at(params.index) as any).controls['articulo'].setValue(params.articulo);
    (this.filasDetalle.at(params.index) as any).controls['unidades'].setValue(this.llenarArrayUnidades(params.articulo));
    (this.filasDetalle.at(params.index) as any).controls['cod'].setValue(params.articulo.codigo);
    (this.filasDetalle.at(params.index) as any).controls['des'].setValue(params.articulo.nombre);
    (this.filasDetalle.at(params.index) as any).controls['can'].setValue(null);
    (this.filasDetalle.at(params.index) as any).controls['can_ant'].setValue(null);
    (this.filasDetalle.at(params.index) as any).controls['uni'].setValue(null);
    (this.filasDetalle.at(params.index) as any).controls['vende_sin_inventario'].setValue(this.configApp.vende_sin_inventario);

    fun.setTimeout(() => fun.enfocarInput('can-' + params.index), 0);
  }

  llenarArrayUnidades(articulo) {
    let unidadesArticulo = [];

    if (articulo) {
      const medida = articulo.tipo_articulo.tipo == 'servicio' ? 'Servicio' : articulo.medida;
      const precioPrincipal = articulo.precio_principal;
      const costoPrincipal = articulo.costo_principal;

      if (medida != 'Quintal') {
        unidadesArticulo.push({ value: medida, precio: articulo.precio_principal, costo: articulo.costo_principal, cantidad: articulo.contenido[medida] });
      }

      if (articulo.vendido_en == 'Saco' && articulo.calcular_saco) this.entrarSacosAUnidades(unidadesArticulo, precioPrincipal, costoPrincipal);

      if (articulo.is_detallable) {
        articulo.contenido_articulos.forEach(element => {
          unidadesArticulo.push({ value: element.medida, precio: element.precio, costo: element.costo, cantidad: articulo.contenido[element.medida] });
        });
      }

      unidadesArticulo = unidadesArticulo.filter((item, index, self) => index === self.findIndex(t => fun.isEqual(t, item)));
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

  changeStateDropDownMedida(open) {
    this.dropdownMedidaOpen = open;
  }

  hideDropdownMedida() {
    fun.setTimeout(() => {
      this.setInputDrop(undefined);
      this.changeStateDropDownMedida(false);
    }, 100);
  }

  showDropdownMedida(event, dropdown) {
    fun.awaitTyping(null, 10).then(() => {
      if (!this.dropdownMedidaOpen && event.type == 'focus') {
        dropdown.show();
        this.changeStateDropDownMedida(true);
      }
    });
  }

  checkCodigo(index) {
    const formulario = this.filasDetalle.at(index).getRawValue();

    if (fun.hasValue(formulario.cod) && fun.is_number(formulario.cod)) this.minCodigo = 5;
    else this.minCodigo = undefined;
  }

  // =============================================
  //  MODAL PARA FILTRAR CLIENTES
  // =============================================

  async abrirModalFiltro(nombre) {
    if (fun.hasValue(nombre)) {
      const propietarioModalConf = new DynamicModalClass();

      propietarioModalConf.id = 'buscarCliente';
      propietarioModalConf.inputs = { metodo: 'venta', palabra_a_buscar: nombre };
      propietarioModalConf.header = 'BUSCAR CLIENTE';
      propietarioModalConf.width = '57rem';
      propietarioModalConf.height = '32rem';
      propietarioModalConf.component = BuscarClienteSuplidorComponent;
      propietarioModalConf.closableEsc = true;
      propietarioModalConf.setCallback(this.processPropietarioModal.bind(this));
      propietarioModalConf.show();

      fun.desEnfocarInput('clienteI');
    }
  }

  processPropietarioModal(args: ICallbackModal) {
    const { data, type } = args as any;

    if (type == modalCloseType.onHide && fun.isEmpty(this.cliente)) {
      fun.enfocarInput('clienteI');
    }

    if (type == modalCloseType.returnData) {
      if (data?.tipo == 'data_no_found') {
        fun.enfocarAndSelectInput('clienteI');
      } else {
        this.cliente = data;
        (document.getElementById('clienteI') as any).value = data.nombre_completo;
        fun.setTimeout(() => fun.enfocarInput('cod-0'), 10);
        this.buscarFacturasAdelantadas(data.id);
      }
    }
  }

  // =============================================
  async checkCantidadExede(index, lugar, callback = arg => {}) {
    let cantidad = 0;
    this.calcularCantidadEnUnidades({ index });
    const fila_actual = this.filasDetalle.at(index).getRawValue();
    const articulo = fila_actual['articulo'];

    if (fun.hasValue(articulo)) {
      const rowsIgual = this.filasDetalle.controls.filter(item => item.controls.articulo?.value?.id == articulo.id).map(item => item.value);

      cantidad = rowsIgual.reduce((acumulado, item) => acumulado + item.cantidad_en_unidades, 0);

      if (lugar === 'saltar') index--;

      try {
        let excede = true;

        const extra = { afterPath: `check_excede/${articulo.id}`, parameters: { cantidad: cantidad } };
        await this.articuloClass.getAll(extra).then((res: any) => {
          excede = res['data'];

          if (excede) {
            fun.toastError('Cantidad introducida excede la cantidad en inventario', 'ERROR');

            if (this.configApp.vende_sin_inventario) {
              callback(false);
            } else {
              fun.setTimeout(() => {
                fun.enfocarAndSelectInput('can-' + index);
                this.calcularCantidadEnUnidades({ index: index, clean: true });
                (this.filasDetalle.at(index) as any).controls['uni'].setValue(null);
                (this.filasDetalle.at(index) as any).controls['can_ant'].setValue(null);
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
    } else {
      callback(false);
    }
  }

  addItem(index): void {
    this.filasDetalle.push(this.createItem(index));
  }

  removeItem(i: number) {
    (this.form.get('rowFactura') as UntypedFormArray).removeAt(i);
  }

  verificarSecuencia(index, mover = true) {
    if (this.secuencia < index && mover) fun.enfocarInput(this.inputSecuencia);
  }

  saliDeCantidad(i) {
    const { uni, can, can_ant } = this.filasDetalle.at(i).getRawValue();

    if (can != can_ant) {
      if (fun.hasValue(uni)) this.checkCantidadExede(i, 'change', () => {});
      (this.filasDetalle.at(i) as any).controls['can_ant'].setValue(can);
    }
  }

  async selectMedidaChange(evento, index) {
    if (evento.originalEvent.type == 'click') this.selectMedida(index);
  }

  async selectMedida(index) {
    const unidad = (this.filasDetalle.at(index) as any).controls['uni'].getRawValue();
    if (!unidad) return;

    if (this.dropdownMedidaOpen) {
      this.checkCantidadExede(index, 'change', excede => {
        if (!excede)
          this.ajustarSecuencia().then(() => {
            fun.enfocarInput(this.inputSecuencia);
          });
      });
    }
  }

  calcularCantidadEnUnidades(params: { index: number; clean?: boolean } = { index: 0, clean: false }) {
    return new Promise<void>(resolve => {
      const formGroup = this.filasDetalle.at(params.index) as FormGroup;
      const { uni: unidad, can: cantidad, unidades } = formGroup.getRawValue();

      // Calcular cantidad mínima basada en la unidad seleccionada
      const cantidadMinima = unidad && unidades?.length > 0 ? unidades.find(uni => uni.value.toLowerCase() === unidad.toLowerCase())?.cantidad || 1 : 1;

      // Calcular cantidades en unidades
      const cant_unidades = params.clean ? 0 : cantidad * cantidadMinima;

      // Preparar objeto de detalles a actualizar
      const detalles = {
        cantidad_en_unidades: cant_unidades,
      };

      // Limpiar precio y total si no hay unidades
      if (cant_unidades === 0) {
        detalles['precio'] = null;
        detalles['total'] = null;
      }

      formGroup.patchValue(detalles);
      resolve();
    });
  }

  setInputDrop(index) {
    if (fun.hasValue(index)) {
      const { articulo } = this.filasDetalle.at(index).getRawValue();
      if (fun.hasValue(articulo)) this.inputDrop = `uni-${index}`;
    } else {
      this.inputDrop = undefined;
      this.changeStateDropDownMedida(false);
    }

    if (this.inputDrop) fun.setTimeout(() => fun.enfocarInput(this.inputDrop), 10);
  }

  createItem(i): UntypedFormGroup {
    return this.fb.group({
      id: [],
      articulo: [null],
      unidades: [null],
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
      vende_sin_inventario: [false],
    });
  }

  modalRemover(i, e?) {
    const fila_actual = this.filasDetalle.at(i).getRawValue();
    const codigo = fila_actual['cod'];
    const name = fila_actual['des'];
    const unidad = fila_actual['uni'];
    let obj = {};
    obj['nombre'] = unidad && name ? `${name} (${unidad})` : name ? name : codigo;

    this.indexRemove = i;

    this.dynamicModalServ.confirmationModal({
      id: 'removerArticulo',
      texto: `¿Seguro que desea remover el articulo <b class="negrita">${name ?? codigo ?? ''}</b>?`,
      btnKind: confirmationButtons.siNo,
      onYes: () => this.procesoQuitarArticulo(),
    });

    if (e) e.stopPropagation();
  }

  selectedRow(i, bool) {
    const lista = [`cod-${i}`, `can-${i}`, `uni-${i}`, `des-${i}`];

    lista.forEach(row => {
      if (this.checkIfRowContainArticulo(i)) fun.ModificarClass(row, 'inputOscuro', bool ? 'add' : 'remove');
    });
  }

  async buscarFacturasAdelantadas(id) {
    try {
      this.facturaClass.getFacturasByParams({ campo: request_factura_campo.cliente_id, valor: id, tipo_factura_id: 0, adelantada: true, page: 1, per_page: 1, paginado: false, tipo: 'venta' }).then(
        res => {
          this.facturas_adelantadas = res['data'];
          this.facturas_adelantadas.map(factura => {
            factura.secuencia = factura.numero_factura.toString().padStart(8, '0');
            factura.customStyles = {
              some_is_selected: [
                { key: 'some_is_selected', isTd: true, estilos: 'width: 2rem !important;' },
                { key: 'detalles_selected', estilos: 'width: 2rem !important' },
              ],
            };

            for (let i = 0; i < factura.detalle_facturas.length; i++) {
              const detalle = factura.detalle_facturas[i];
              detalle.select = false;
            }
            return factura;
          });
          this.checkFacturasAdelantadasSelection();
        },
        error => {}
      );
    } catch (error) {}
  }

  checkFacturasAdelantadasSelection() {
    this.facturas_adelantadas.map(item => {
      item.detalle_facturas.map(detalle => {
        const formArray = this.form.get('rowFactura') as UntypedFormArray;
        const existe = formArray.value.find(d => d.detalle_factura_id == detalle.id);

        detalle.select = fun.hasValue(existe);

        return detalle;
      });

      const almenos_uno = item.detalle_facturas.some(detalle => detalle.select);
      const todos = item.detalle_facturas.every(detalle => detalle.select);

      item.detalles_selected = todos ? 'fas fa-check' : almenos_uno ? 'far fa-check-square' : 'far fa-square';
      return item;
    });
  }

  tableClickRow(event) {
    this.seleccionarFacturaAdelantada(event.data);
  }

  async seleccionarFacturaAdelantada(factura) {
    if (!factura) return;

    this.checkFacturasAdelantadasSelection();

    const abreviaturas = {
      Caja: 'Caj.',
      Unidad: 'Uni.',
      Paquetes: 'Paq.',
      Libra: 'Lbs.',
      Quintal: 'Qtl.',
      Saco: 'Saco',
      Galon: 'Gal.',
      Onza: 'Oz.',
      Producto: 'Prod.',
      Bolsa: 'Bol.',
    };

    const procesarDetalle = detalle => {
      const contenidos_format = this.formatContenidos(detalle.contenidos);
      const retirado = detalle.retirado;
      const restante = detalle.cantidad_en_unidades - retirado;

      const calcularMedida = cantidad => {
        const contenidoSelected = contenidos_format.find(cont => cantidad >= Number(cont[1]));
        if (!contenidoSelected) return null;

        const cantidadCalculada = cantidad / Number(contenidoSelected[1]);
        return `${cantidadCalculada} ${abreviaturas[contenidoSelected[0]]}`;
      };

      detalle.retirado_mostrar = calcularMedida(retirado) ?? '-';
      detalle.restante_mostrar = calcularMedida(restante) ?? '-';
      detalle.disable = detalle.articulo_estado ? fun.isEmpty(detalle.restante_mostrar) : true;
    };

    // Procesar todos los detalles
    factura.detalle_facturas.forEach(procesarDetalle);

    // Mostrar modal después de procesar todos los detalles
    fun.setTimeout(() => {
      const facturaAdelantadaModalConf = new DynamicModalClass();

      facturaAdelantadaModalConf.id = 'buscarCliente';
      facturaAdelantadaModalConf.inputs = { data: factura.detalle_facturas };
      facturaAdelantadaModalConf.header = 'Seleccionar articulos desde factura adelantada';
      facturaAdelantadaModalConf.width = '57rem';
      facturaAdelantadaModalConf.height = '32rem';
      facturaAdelantadaModalConf.component = ModalSeleccionarArticuloComponent;
      facturaAdelantadaModalConf.closableEsc = true;
      facturaAdelantadaModalConf.botones = [
        { clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cancelar', disable: false },
        { id: 'btnConfirmar', clase: 'btn btn-verde', label: 'Confirmar', disable: true },
      ];
      facturaAdelantadaModalConf.setCallback(this.processFacturaAdelantadaModal.bind(this));
      facturaAdelantadaModalConf.show();
    }, 250);
  }

  processFacturaAdelantadaModal(args: ICallbackModal) {
    const { data, type } = args as any;

    if (type == modalCloseType.onHide) return;

    const articulos_seleccionados = data.articulos_selected;

    this.ajustarSecuencia();
    this.llenarConduce(articulos_seleccionados).then(res => {
      this.checkFacturasAdelantadasSelection();
    });
  }

  formatContenidos(contenidos) {
    return Object.entries(contenidos)
      .filter(([key]) => !key.includes('Saco'))
      .sort(([, a], [, b]) => Number(b) - Number(a));
  }

  checkIfRowContainArticulo(i) {
    let res = false;
    if (this.filasDetalle) {
      const element = this.filasDetalle.at(i) as any;
      res = element.controls['des'].value || element.controls['cod'].value;
    }
    return res;
  }

  async llenarConduce(detalles, conteo = 0) {
    if (conteo >= detalles.length) return true;

    await this.llenarFila(detalles[conteo], this.secuencia);
    return this.llenarConduce(detalles, conteo + 1);
  }

  verSiExcede(i) {
    return this.rowsExcede.includes(i);
  }

  disableCamposFactAdelantadas(i) {
    let res = false;
    const fila_actual = this.filasDetalle.at(i).getRawValue();
    const detalle_factura_id = fila_actual['detalle_factura_id'];
    if (detalle_factura_id) res = true;

    return res;
  }

  async llenarFila(element, i) {
    // Calcular cantidades
    const cant_en_unidades_actual = element.cantidad_en_unidades - element.retirado;
    const multiplo = element.cantidad_en_unidades / element.cantidad;
    const cant_actual = cant_en_unidades_actual / multiplo;

    // Obtener artículo filtrado
    const result = await this.articuloClass.getArticulosFiltrado({ buscar: element.codigo, fecha: this.fechaConduce });

    const articulo = result['data'][0];
    const filaControl = this.filasDetalle.at(i) as any;

    // Configurar todos los valores de la fila
    const valoresFila = {
      detalle_factura_id: element.id,
      cod: element.codigo,
      des: articulo.nombre,
      can: cant_actual,
      can_ant: cant_actual,
      max_can: cant_actual,
      can_original: element.cantidad,
      cantidad_en_unidades: cant_en_unidades_actual,
      articulo: articulo,
      unidades: this.llenarArrayUnidades(articulo),
      vende_sin_inventario: this.configApp.vende_sin_inventario,
      uni: element.peso_saco ? `Saco de ${element.peso_saco} libras` : element.unidad,
    };

    // Aplicar valores al control
    Object.entries(valoresFila).forEach(([key, value]) => {
      filaControl.controls[key].setValue(value);
    });

    // Deshabilitar campo de unidad
    filaControl.controls['uni'].disable();

    // Verificar excedentes y ajustar secuencia con delay
    await new Promise<void>(resolve => fun.setTimeout(() => resolve(), 100));

    this.checkCantidadExede(i, 'llenarFila', res => {
      if (res) this.rowsExcede.push(i);
    });
    this.ajustarSecuencia();
  }

  excedeMaxCan(i) {
    const fila_actual = this.filasDetalle.at(i).getRawValue();

    const detalle_factura_id = fila_actual['detalle_factura_id'];
    const max_can = fila_actual['max_can'];
    const can_original = fila_actual['can_original'];
    const can = fila_actual['can'];

    if (detalle_factura_id && can > max_can) {
      if (can_original > max_can) {
        fun.toastError('No puede introducir una cantidad mayor a la cantidad restante de la factura ', 'ERROR');
      } else {
        fun.toastError('No puede introducir una cantidad mayor a la cantidad de la factura ', 'ERROR');
      }
      (this.filasDetalle.at(i) as any).controls['can'].setValue(max_can);
      fun.enfocarInput('can-' + i);
    }
  }

  getMaxCan(i) {
    const fila_actual = this.filasDetalle.at(i).getRawValue();
    const detalle_factura_id = fila_actual['detalle_factura_id'];
    const max_can = fila_actual['max_can'];

    return detalle_factura_id ? max_can : 9007199254740991;
  }

  async imprimirConduce() {
    const filas_ocupadas = this.filasDetalle.controls.filter(item => fun.hasValue(item.value.articulo));

    if (this.rowsExcede.length) {
      fun.toastWarning('No puede hacer el conduce, existiendo artículos que exceden su cantidad en el inventario', 'Aviso');
    } else if (!this.cliente) {
      fun.toastWarning('Conduce no tiene cliente', 'Aviso');
    } else if (filas_ocupadas.length === 0) {
      fun.toastWarning('Conduce no tiene Articulos', 'Aviso');
      fun.enfocarInput('cod-1');
    } else {
      this.parseCuerpoConduce();
      const obj = { modo_factura: tipoDocFacturacion.conduce, condicion_fact: tipoDocFacturacion.conduce, metodo: tipoDocFacturacion.conduce, is_viaje: false };

      const confirmationImprimirModalConf = new DynamicModalClass();

      confirmationImprimirModalConf.id = 'confirmacionImprimir';
      confirmationImprimirModalConf.inputs = obj;
      confirmationImprimirModalConf.header = 'Confirmación';
      confirmationImprimirModalConf.width = '30rem';
      confirmationImprimirModalConf.component = ConfirmacionImprimirComponent;
      confirmationImprimirModalConf.botones = [
        { clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cancelar', disable: false },
        { id: 'btnConfirmar', clase: 'btn btn-verde', label: 'Confirmar', disable: false },
      ];

      confirmationImprimirModalConf.setCallback(this.processImprimir.bind(this));
      confirmationImprimirModalConf.show();
    }
  }

  processImprimir(args: ICallbackModal) {
    if (args.type == modalCloseType.returnData) {
      const { is_print } = args.data;

      this.is_print = is_print;
      this.sendData();
    }
  }

  parseCuerpoConduce() {
    const filas_ocupadas = this.filasDetalle.controls.filter(item => fun.hasValue(item.value.articulo));

    this.CuerpoConduce = [];
    for (let i = 0; i < filas_ocupadas.length; i++) {
      const fila = filas_ocupadas[i].getRawValue();
      const detalle = fun.pick(fila, ['detalle_factura_id', 'articulo.id', 'can', 'cantidad_en_unidades', 'uni', 'id', 'vende_sin_inventario']);

      let detalle_parsed = fun.remplaceKeyFromJson(detalle, [
        { old_key: 'can', new_key: 'cantidad' },
        { old_key: 'uni', new_key: 'unidad' },
      ]);

      detalle_parsed['articulo_id'] = detalle_parsed.articulo.id;
      delete detalle_parsed['articulo'];

      this.CuerpoConduce.push(detalle_parsed);
    }
  }

  closeModal(modalInstance) {
    modalInstance.closeModal(modalInstance.id, 'cancelar');
  }

  getCantidadArticulos() {
    const filas_ocupadas = this.filasDetalle.controls.filter(item => fun.hasValue(item.value.articulo));
    return filas_ocupadas.length;
  }

  resetForm() {
    for (let i = 0; i < this.filasDetalle.controls.length; i++) {
      const control = this.filasDetalle.at(i).value;

      if (control.des || control.cod) {
        (this.filasDetalle.at(i) as any).controls['detalle_factura_id'].setValue(null);
        (this.filasDetalle.at(i) as any).controls['articulo'].setValue(null);
        (this.filasDetalle.at(i) as any).controls['cod'].setValue(null);

        (this.filasDetalle.at(i) as any).controls['des'].setValue(null);
        (this.filasDetalle.at(i) as any).controls['can'].setValue(null);
        (this.filasDetalle.at(i) as any).controls['max_can'].setValue(9007199254740991);
        (this.filasDetalle.at(i) as any).controls['can_original'].setValue(0);
        (this.filasDetalle.at(i) as any).controls['cantidad_en_unidades'].setValue(null);
        (this.filasDetalle.at(i) as any).controls['uni'].setValue(null);
        (this.filasDetalle.at(i) as any).controls['uni'].enable();
      }
    }
  }

  borrar() {
    this.resetForm();
    this.cliente = undefined;
    this.CuerpoConduce = [];
    this.facturas_adelantadas = [];
    this.secuencia = 0;
    this.inputSecuencia = 'cod-0';
    this.inputDrop = undefined;
    this.facturaAdelantadaSelected = undefined;
    this.rowsExcede = [];
  }

  abrirModalDinamicText(tipo: 'cancelar' | 'nuevo') {
    this.dynamicModalServ.confirmationModal({
      id: 'cancelar_ingreso',
      texto: tipo == 'cancelar' ? `¿Seguro de que desea cancelar el <strong>Conduce de mercancía</strong>?` : `¿Seguro de que desea iniciar una nueva búsqueda para el <strong>Conduce de mercancía</strong>?`,
      btnKind: confirmationButtons.siNo,
      onYes: () => this.cancelarConduce(),
    });
  }

  cancelarConduce() {
    this.borrar();
    (document.getElementById('clienteI') as any).value = '';
    fun.setTimeout(() => fun.enfocarInput('clienteI'), 10);
  }

  goBack() {
    this.router.navigateByUrl('/admin/conduce/lista');
  }

  async sendData() {
    const cabecera_conduce = {};
    cabecera_conduce['cliente_id'] = this.cliente.id;
    cabecera_conduce['numero_conduce'] = '';
    cabecera_conduce['detalle_conduces'] = this.CuerpoConduce;

    this.conduceClass.createUpdateOne(cabecera_conduce).then(res => {
      this.conduceClass.parseDataToPdf(res['data']).then(conduce_parsed => {
        const obj = { data: conduce_parsed, type: tipoDocFacturacion.conduce };

        this.cancelarConduce();
        this.goBack();
        PdfService.generatePdf({ oPdf: obj, imprimir: this.is_print }).catch(err => fun.toastError(err['msg'], 'ERROR'));
      });
    });
  }
}
