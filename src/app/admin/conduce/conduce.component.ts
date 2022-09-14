import { Component, OnInit, OnDestroy, AfterViewInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import * as _ from 'lodash';
import * as moment from '../../core/javascript/moment';
import { MixinClass } from '../../core/typescript/MixinClass';
import { ArticuloC } from '../registros/articulos/articulo';
import { ConduceC } from '../conduce/coduce';
import { FacturaC } from '../facturacion/factura';
import { PdfService } from '../../core/services/pdf/pdf.service';
import { BuscarArticuloComponent } from '../components/formularios en modales/buscar-articulo/buscar-articulo.component';
import { BuscarClienteSuplidorComponent } from '../components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { ModalSeleccinarArticuloComponent } from '../components/formularios en modales/modal-seleccinar-articulo/modal-seleccinar-articulo.component';
import { fun } from '../../core/services/functions.service';
import { ModalService } from '../components/modal/modal.service';
import { Permisos } from '../../core/typescript/permisos';
import { table_config } from '../components/new_tablas/tabla-class';
import { ConfigI } from '../../core/typescript/config-interface';
import { SingletonService } from '../../core/services/singleton.service';
import { ConfirmacionImprimirComponent } from '../facturacion/confirmacion-imprimir/confirmacion-imprimir.component';
import { teclasCode } from '../../core/typescript/constantes';

@Component({
  selector: 'app-conduce',
  templateUrl: './conduce.component.html',
  styleUrls: ['./conduce.component.scss'],
})
export class ConduceComponent extends MixinClass implements OnInit, OnDestroy, AfterViewInit {
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
      const combinacion = _.join(this.secuenciaKeys, '_');

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
  is_print = false;
  info = [];

  table_config: table_config = {
    info: [
      { titulo: '1', tipo: 'icon', key: 'some_is_selected', estilos: [{ width: '2rem' }, { color: 'var(--transparente00)' }], iconsArray: [{ key: 'detalles_selected' }] },
      { titulo: 'Numero Fact', key: 'secuencia', tipo: 'text' },
      { titulo: 'NCF', key: 'numero_comprobante', tipo: 'text' },
      { titulo: 'Fecha Facturacion', key: 'fecha', tipo: 'text' },
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
  constructor(private fb: FormBuilder, private pdfServ: PdfService, public mServ: ModalService) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'conduce', is_routing: true });
    this.configApp = SingletonService.configServ.getConfig({ isPromise: false }) as ConfigI;
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
    this.fechaConduce = this.formarFechaFactura(new Date())['FechaFactura'];
    this.enfocarInput('clienteI');
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  pressEscResponse(res) {
    if (fun.hasValue(res)) {
      this.enfocarInput('cod-' + res);
      this.selectContenido('cod-' + res);
    }
  }

  ngAfterViewInit() {
    this.filasDetalle = (this.form.controls['rowFactura'] as FormArray).controls;
  }

  async procesoQuitarArticulo() {
    await this.removeItem(this.indexRemove);
    await this.ajustarSecuencia();
    await this.reajustarExcedentes();
    await this.checkFacturasAdelantadasSelection();
  }

  async reajustarExcedentes(conteo = 0) {
    const filas_ocupadas = _.filter(this.filasDetalle, (item) => fun.hasValue(item.value.articulo));

    this.checkCantidadExede(conteo, 'proceso_quitar_articulo', (excede) => {
      if (excede) this.rowsExcede.push(conteo);
      else if (_.includes(this.rowsExcede, conteo) && !excede) _.pull(this.rowsExcede, conteo);

      conteo++;
      if (conteo < filas_ocupadas.length) this.reajustarExcedentes(conteo);
      else {
        const excedientes_mayores = _.filter(this.rowsExcede, (item) => item >= conteo);
        excedientes_mayores.forEach((element) => _.pull(this.rowsExcede, element));
      }
    });
  }

  ajustarSecuencia() {
    return new Promise((resolve) => {
      const filas_ocupadas = _.filter(this.filasDetalle, (item) => fun.hasValue(item.value.articulo));
      this.secuencia = filas_ocupadas.length;

      this.inputSecuencia = 'cod-' + this.secuencia;
      resolve(true);
    });
  }

  async getDataFromModal(arg, search) {
    if (arg.modal_id == 'buscar_articulo') {
      if (arg?.tipo == 'data_no_found') {
        this.enfocarInput(`cod-${arg.index}`);
        this.selectContenido(`cod-${arg.index}`);
      } else {
        this.llenarRowDespuesDeFiltro(arg);
      }
    }

    if (arg.modal_id == 'buscarCliente') {
      this.cliente = arg.data;
      (document.getElementById('clienteI') as any).value = arg.data.nombre;
      setTimeout(() => this.enfocarInput('cod-0'), 10);
      this.buscarFacturasAdelantadas(arg.data.id);
    }

    if (arg.modal_id === 'seleccionar_articulos_adelantados') {
      this.ajustarSecuencia();
      this.llenarConduce(arg.data).then((res) => {
        this.checkFacturasAdelantadasSelection();
      });
    }

    if (arg.modal_id === 'confirmacionImprimir') {
      this.is_print = arg.is_print;
      this.sendData();
    }
  }

  async saltar(input, index) {
    setTimeout(() => {
      const fila_actual = this.filasDetalle[index].getRawValue();
      const fila_siguiente = this.filasDetalle[index + 1].getRawValue();

      const { articulo, cod, can, uni, detalle_factura_id } = fila_actual;

      if (index >= 10 && input == 'can-') this.addItem(index);

      let campo_siguiente = fun.hasValue(fila_siguiente['detalle_factura_id']) ? `can-${index + 1}` : this.inputSecuencia;

      if (input == 'uni-' && fun.hasValue(can) && can != 0 && fun.hasValue(cod)) {
        const campo = fun.hasValue(detalle_factura_id) ? campo_siguiente : `uni-${index}`;
        this.enfocarInput(campo);
      }

      if (input == 'cod-' && fun.hasValue(uni) && _.lowerCase(uni) != _.lowerCase('medida')) {
        if (fun.hasValue(can) && can != 0 && fun.hasValue(cod)) this.ajustarSecuencia().then(() => this.enfocarInput(campo_siguiente));
      }

      if (input == 'can-' && fun.hasValue(cod)) {
        if (fun.isEmpty(articulo) || cod !== articulo.codigo) {
          const obj = { palabra_a_buscar: cod, index, metodo: 'venta', data: [], fecha_articulo: this.fechaConduce };

          this.handleModalForm({
            component: BuscarArticuloComponent,
            inputs: obj,
            id: 'buscar_articulo',
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
    }, 250);
  }

  llenarRowDespuesDeFiltro(obj) {
    const articulo = obj.data;

    const index = obj.index;

    if (articulo.existencia == 0) {
      let msg = 'Producto agotado, debe de comprar mas!!!';

      if (articulo.descripcion === 'Producto terminado') msg = 'Producto agotado, debe de producir mas!!!';
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

    if (params.articulo.existencia > 0 && params.articulo.aviso_existencia > cantidades[params.articulo.medida_alerta]) {
      let cant_restante = fun.numFormatTwoDecimals(cantidades[params.articulo.medida_alerta]);

      let msg = `Solo quedan ${cant_restante} ${params.articulo.medida_alerta} de este producto, debe de aumentar el inventario!!!`;

      if (params.articulo.descripcion === 'Producto terminado') msg = `Solo quedan ${cant_restante} ${params.articulo.medida_alerta} de este producto, debe de producir mas!!!`;
      fun.toastWarning(msg, 'AVISO');
    }

    (this.filasDetalle[params.index] as any).controls['articulo'].setValue(params.articulo);
    (this.filasDetalle[params.index] as any).controls['cod'].setValue(params.articulo.codigo);
    (this.filasDetalle[params.index] as any).controls['des'].setValue(params.articulo.nombre);
    (this.filasDetalle[params.index] as any).controls['can'].setValue(null);
    (this.filasDetalle[params.index] as any).controls['can_ant'].setValue(null);
    (this.filasDetalle[params.index] as any).controls['uni'].setValue(null);
    (this.filasDetalle[params.index] as any).controls['vende_sin_inventario'].setValue(this.configApp.vende_sin_inventario);

    setTimeout(() => this.enfocarInput('can-' + params.index), 0);
  }

  async llenarArrayUnidades(index) {
    const { articulo, cod } = this.filasDetalle[index].getRawValue();

    if (cod && articulo) {
      const precioPrincipal = articulo.precio_principal;
      const costoPrincipal = articulo.costo_principal;
      this.UnidadesArticulo = [];

      this.UnidadesArticulo.push({ value: 'Medida', precio: 0, costo: 0, cantidad: articulo.contenido[articulo.medida] });

      if (articulo.medida !== 'Quintal') {
        this.UnidadesArticulo.push({ value: articulo.medida, precio: articulo.precio_principal, costo: articulo.costo_principal, cantidad: articulo.contenido[articulo.medida] });
      }

      if (_.lowerCase(articulo.vendido_en) == 'saco' && articulo.calcular_saco) this.entrarSacosAUnidades(precioPrincipal, costoPrincipal);

      if (articulo.is_detallable) {
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
  // =============================================
  //  MODAL PARA FILTRAR CLIENTES
  // =============================================

  async abrirModalFiltro(nombre) {
    if (fun.hasValue(nombre)) {
      const obj = { data: [], palabra_a_buscar: nombre, metodo: 'venta' };

      this.handleModalForm({
        component: BuscarClienteSuplidorComponent,
        inputs: obj,
        id: 'buscarCliente',
        header: 'Buscar cliente',
        width: '900px',
        height: '500px',
        botones: {
          aceptar: { show: false, disable: false },
          cancelar: { show: false, disable: false },
        },
      });

      this.desEnfocarInput('clienteI');
    }
  }

  calcularCantidadEnUnidades(params: { index: number; clean?: boolean } = { index: 0, clean: false }) {
    this.llenarArrayUnidades(params.index);
    const control = this.filasDetalle[params.index].controls;
    const fila_actual = this.filasDetalle[params.index].getRawValue();

    const unidad = fila_actual['uni'];
    const cantidad = fila_actual['can'];

    let cantidadMinima = 1;
    if (unidad && this.UnidadesArticulo.length > 0) cantidadMinima = this.UnidadesArticulo.find((uni) => _.lowerCase(uni.value) === _.lowerCase(unidad)).cantidad;

    const cant_unidades = params.clean ? 0 : cantidad * cantidadMinima;
    control['cantidad_en_unidades'].setValue(cant_unidades);
  }

  // =============================================
  async checkCantidadExede(i, lugar, callback = (arg) => {}) {
    let cantidad = 0;
    const fila_actual = this.filasDetalle[i].getRawValue();
    const articulo = fila_actual['articulo'];

    if (fun.hasValue(articulo)) {
      this.calcularCantidadEnUnidades({ index: i });

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
    } else {
      callback(false);
    }
  }

  addItem(index): void {
    this.ARRAY_ROWARTICULOS = this.form.get('rowFactura') as FormArray;
    this.ARRAY_ROWARTICULOS.push(this.createItem(index));
  }

  removeItem(i: number) {
    (this.form.get('rowFactura') as FormArray).removeAt(i);
  }

  verificarSecuencia(index, mover = true) {
    if (this.secuencia < index && mover) this.enfocarInput(this.inputSecuencia);
  }

  saliDeCantidad(i) {
    const { uni, can, can_ant } = this.filasDetalle[i].getRawValue();

    if (can != can_ant) {
      if (fun.hasValue(uni)) this.checkCantidadExede(i, 'change', () => {});
      (this.filasDetalle[i] as any).controls['can_ant'].setValue(can);
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
        this.ajustarSecuencia().then(() => this.enfocarInput(this.inputSecuencia));
      });
    }
  }

  async calculateCantidadEnUnidades(params: { index: number; clean?: boolean } = { index: 0, clean: false }) {
    this.llenarArrayUnidades(params.index);

    const control = this.filasDetalle[params.index].controls;
    const fila_actual = this.filasDetalle[params.index].getRawValue();
    const unidad = fila_actual['uni'];
    const cantidad = fila_actual['can'];

    let cantidadMinima = 1;

    if (unidad && this.UnidadesArticulo.length > 0) cantidadMinima = this.UnidadesArticulo.find((uni) => _.lowerCase(uni.value) === _.lowerCase(unidad)).cantidad;

    const cant_unidades = params.clean ? 0 : cantidad * cantidadMinima;

    control['cantidad_en_unidades'].setValue(cant_unidades);
  }

  setInputDrop(index) {
    if (fun.hasValue(index)) {
      const { articulo } = this.filasDetalle[index].getRawValue();
      if (fun.hasValue(articulo)) this.inputDrop = `uni-${index}`;
    } else {
      this.inputDrop = undefined;
    }
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
      vende_sin_inventario: [false],
    });
  }

  modalRemover(i, e?) {
    const fila_actual = this.filasDetalle[i].getRawValue();
    const codigo = fila_actual['cod'];
    const name = fila_actual['des'];
    const unidad = fila_actual['uni'];
    let obj = {};
    obj['nombre'] = unidad && name ? `${name} (${unidad})` : name ? name : codigo;

    this.indexRemove = i;

    this.confirmationModal({
      id: 'removerArticulo',
      header: 'Confirmar',
      texto: `Seguro que desea remover el articulo <b class="negrita">${name}</b>`,
      siFunction: (instance) => {
        this.procesoQuitarArticulo();
        instance.closeModal(instance.id, 'removerArticulo');
      },
    });

    if (e) e.stopPropagation();
  }

  selectedRow(i, bool) {
    const lista = [`cod-${i}`, `can-${i}`, `uni-${i}`, `des-${i}`];

    lista.forEach((row) => {
      if (this.checkIfRowContainArticulo(i)) fun.ModificarClass(row, 'inputOscuro', bool ? 'add' : 'remove');
    });
  }

  async buscarFacturasAdelantadas(id) {
    try {
      this.facturaClass.getFacturasByParams({ campo: '1', valor: id, tipo_factura_id: 0, adelantada: true, page: 1, per_page: 1, paginado: false, fact_de: 'venta' }).then(
        (res) => {
          this.facturas_adelantadas = res['data'];
          this.facturas_adelantadas.map((factura) => {
            factura.secuencia = _.padStart(factura.numero_factura, 8, '0');
            factura.fecha = moment(factura.fecha_equivalente).format('DD-MM-YYYY');
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
        (error) => {},
      );
    } catch (error) {}
  }

  checkFacturasAdelantadasSelection() {
    this.facturas_adelantadas.map((item) => {
      item.detalle_facturas.map((detalle) => {
        const formArray = this.form.get('rowFactura') as FormArray;
        const existe = formArray.value.find((d) => d.detalle_factura_id == detalle.id);

        detalle.select = !!existe;
        detalle.disable = !!existe;

        return detalle;
      });

      const almenos_uno = _.some(item.detalle_facturas, (detalle) => detalle.select);
      const todos = _.every(item.detalle_facturas, (detalle) => detalle.select);

      item.detalles_selected = todos ? 'fas fa-check' : almenos_uno ? 'far fa-check-square' : 'far fa-square';
      return item;
    });
  }

  tableClickRow(event) {
    this.seleccionarFactruaAdelantada(event.data);
  }

  async seleccionarFactruaAdelantada(factura) {
    if (factura) {
      this.checkFacturasAdelantadasSelection();
      let conteo = 0;
      factura.detalle_facturas.map(async (detalle) => {
        this.articuloClass.getArticulosFiltrado({ buscar: detalle.codigo, fecha: this.fechaConduce, parameters: { contenido: true } }).then((res_articulo) => {
          const articulo = _.first(res_articulo['data']);
          const abreviaturas = { Caja: 'Caj.', Unidad: 'Uni.', Paquetes: 'Paq.', Libra: 'Lbs.', Quintal: 'Qtl.' };
          const contenidos_format = this.formatContenidos(articulo.contenido);

          const arrayMostrar = [
            { num: detalle.retirado, medida: '' },
            { num: detalle.cantidad_en_unidades - detalle.retirado, medida: '' },
          ];

          for (let j = 0; j < arrayMostrar.length; j++) {
            const element = arrayMostrar[j];

            const contenidoSelected = _.find(contenidos_format, (cont) => element.num >= cont[1]);

            const cantidad = contenidoSelected ? element.num / contenidoSelected[1] : null;
            element.medida = contenidoSelected ? `${cantidad} ${abreviaturas[contenidoSelected[0]]}` : null;
          }

          detalle.retirado_mostrar = arrayMostrar[0].medida;
          detalle.restante_mostrar = arrayMostrar[1].medida;

          if (detalle.disable == false) detalle.disable = fun.isEmpty(detalle.restante_mostrar);

          conteo++;
          if (conteo >= factura.detalle_facturas.length)
            setTimeout(() => {
              this.handleModalForm({
                component: ModalSeleccinarArticuloComponent,
                inputs: factura.detalle_facturas,
                id: 'seleccionar_articulos_adelantados',
                header: 'Confirmar',
                width: '900px',
                height: '400px',
                botones: {
                  aceptar: { show: false, disable: false },
                  cancelar: { show: false, disable: false },
                  dinamico: [
                    { clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, 'cancelar'), label: 'NO', disable: false },
                    { btn_id: 'btnConfirmar', clase: 'btn btn-verde', function_in_other_component: 'btn_aceptar', label: 'SI', disable: true },
                  ],
                },
              });
            }, 250);

          return detalle;
        });
      });
    }
  }

  formatContenidos(contenidos) {
    const contenido = [];
    for (var cont in contenidos) {
      if (!_.includes(cont, 'Saco')) contenido.push([cont, contenidos[cont]]);
    }

    return contenido.sort((a, b) => a[1] + b[1]);
  }

  checkIfRowContainArticulo(i) {
    let res = false;
    if (this.filasDetalle) {
      const element = this.filasDetalle[i] as any;
      res = element.controls['des'].value || element.controls['cod'].value;
    }
    return res;
  }

  llenarConduce(detalles, conteo = 0, firstResolve = null) {
    return new Promise((resolve) => {
      firstResolve ??= resolve;

      this.llenarFila(detalles[conteo], this.secuencia).then((res) => {
        conteo++;
        if (conteo < detalles.length) this.llenarConduce(detalles, conteo, firstResolve);
        else firstResolve(true);
      });
    });
  }

  verSiExcede(i) {
    return this.rowsExcede.includes(i);
  }

  disableCamposFactAdelantadas(i) {
    let res = false;
    const fila_actual = this.filasDetalle[i].getRawValue();
    const detalle_factura_id = fila_actual['detalle_factura_id'];
    if (detalle_factura_id) res = true;

    return res;
  }

  async llenarFila(element, i) {
    return new Promise((resolve) => {
      // const validator = (rowArticulo) => rowArticulo.detalle_factura_id == element.id;

      // const result = this.ARRAY_ROWARTICULOS.getRawValue().some(validator);
      // if (result) resolve(true);

      const cant_en_unidades_actual = element.cantidad_en_unidades - element.retirado;
      const multiplo = element.cantidad_en_unidades / element.cantidad;
      const cant_actual = cant_en_unidades_actual / multiplo;
      this.articuloClass.getArticulosFiltrado({ buscar: element.codigo, fecha: this.fechaConduce }).then((result) => {
        const articulo = _.first(result['data']);
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

        (this.filasDetalle[i] as any).controls['vende_sin_inventario'].setValue(this.configApp.vende_sin_inventario);

        (this.filasDetalle[i] as any).controls['des'].setValue(articulo.nombre);
        let uni = '';

        if (element.peso_saco) uni = 'Saco de ' + element.peso_saco + ' libras';
        else uni = element.unidad;

        (this.filasDetalle[i] as any).controls['uni'].setValue(uni);

        (this.filasDetalle[i] as any).controls['uni'].disable();

        setTimeout(async () => {
          this.checkCantidadExede(i, 'llenarFila', (res) => {
            if (res) this.rowsExcede.push(i);
          });

          this.ajustarSecuencia();
          resolve(true);
        }, 100);
      });
    });
  }

  excedeMaxCan(i) {
    const fila_actual = this.filasDetalle[i].getRawValue();

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
      (this.filasDetalle[i] as any).controls['can'].setValue(max_can);
      this.enfocarInput('can-' + i);
    }
  }

  confirmationModal(obj: { id: string; texto: string; header: string; siFunction: Function; width?: string }) {
    this.handleModalForm({
      id: obj.id,
      header: obj.header,
      width: obj.width || '30rem',
      html: `<p> ${obj.texto} </p>`,
      botones: {
        aceptar: { show: false, disable: false },
        cancelar: { show: false, disable: false },
        dinamico: [
          { clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, obj.id), label: 'NO', disable: false },
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

  getMaxCan(i) {
    const fila_actual = this.filasDetalle[i].getRawValue();
    const detalle_factura_id = fila_actual['detalle_factura_id'];
    const max_can = fila_actual['max_can'];

    return detalle_factura_id ? max_can : 9007199254740991;
  }

  async imprimirConduce() {
    const filas_ocupadas = _.filter(this.filasDetalle, (item) => fun.hasValue(item.value.articulo));

    if (this.rowsExcede.length) {
      fun.toastWarning('No puede hacer el conduce, existiendo artículos que exceden su cantidad en el inventario', 'Aviso');
    } else if (!this.cliente) {
      fun.toastWarning('Conduce no tiene cliente', 'Aviso');
    } else if (filas_ocupadas.length === 0) {
      fun.toastWarning('Conduce no tiene Articulos', 'Aviso');
      this.enfocarInput('cod-1');
    } else {
      this.CuerpoConduce = [];
      for (let i = 0; i < filas_ocupadas.length; i++) {
        const fila = filas_ocupadas[i].getRawValue();
        const detalle = _.pick(fila, ['detalle_factura_id', 'articulo.id', 'can', 'cantidad_en_unidades', 'uni', 'id', 'vende_sin_inventario']);

        let detalle_parsed = fun.remplaceKeyFromJson(detalle, [
          { old_key: 'can', new_key: 'cantidad' },
          { old_key: 'uni', new_key: 'unidad' },
        ]);
        detalle_parsed['articulo_id'] = detalle_parsed.articulo.id;
        delete detalle_parsed['articulo'];

        this.CuerpoConduce.push(detalle_parsed);
      }

      const obj = { modo_factura: 'conduce', condicion_fact: 'conduce', metodo: 'conduce' };

      this.handleModalForm({
        component: ConfirmacionImprimirComponent,
        inputs: obj,
        id: 'confirmacionImprimir',
        header: 'Confirmación',
        width: '30rem',
        botones: {
          aceptar: { show: false, disable: false },
          cancelar: { show: false, disable: false },
          dinamico: [
            { clase: 'btn btn-blanco mr-2', function: (instance) => this.closeModal(instance), label: 'Cancelar', disable: false },
            { btn_id: 'btnConfirmar', clase: 'btn btn-verde', function_in_other_component: 'btn_aceptar', label: 'Confirmar', disable: false },
          ],
        },
      });
    }
  }

  closeModal(modalInstance) {
    modalInstance.closeModal(modalInstance.id, 'cancelar');
  }

  async sendData() {
    const cabecera_conduce = {};
    cabecera_conduce['cliente_id'] = this.cliente.id;
    cabecera_conduce['numero_conduce'] = '';
    cabecera_conduce['detalle_conduces'] = this.CuerpoConduce;

    this.conduceClass.createUpdateOne(cabecera_conduce).then((res) => {
      const obj = { data: res['data'], type: 'conduce' };

      this.cancelarConduce();
      this.pdfServ.generatePdf({ oPdf: obj, imprimir: this.is_print }).catch((err) => fun.toastError(err['msg'], 'ERROR'));
    });
  }

  resetForm() {
    for (let i = 0; i < this.filasDetalle.length; i++) {
      const control = this.filasDetalle[i].value;

      if (control.des && control.cod) {
        (this.filasDetalle[i] as any).controls['detalle_factura_id'].setValue(null);
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
    this.CuerpoConduce = [];
    this.facturas_adelantadas = [];
    this.secuencia = 0;
    this.inputSecuencia = 'cod-0';
    this.inputDrop = undefined;
    this.facturaAdelantadaSelected = undefined;
    this.rowsExcede = [];
  }

  modalCancelarConduce() {
    const confirmationObj = {
      id: 'cancelar_conduce',
      texto: 'Conduce no terminado, <b class="negrita">¿Desea cancelarlo?</b>',
      header: 'Confirmación',
      siFunction: async (instance) => {
        this.cancelarConduce();
        instance.closeModal('cancelar_conduce', 'cancelar');
      },
      width: '30rem',
    };

    this.confirmationModal(confirmationObj);
  }

  cancelarConduce() {
    this.borrar();
    (document.getElementById('clienteI') as any).value = '';
    setTimeout(() => this.enfocarInput('clienteI'), 10);
  }
}
