import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { DBservice } from '../../core/services/bdservice.service';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { map } from 'rxjs/operators';
import { GLOBAL } from '../../core/services/GLOBAL';
import * as _ from 'lodash';
import * as moment from '../../../utils/javascript/moment';
import { mixinClass } from '../mixinClass';
import { ArticuloC } from '../registros/articulos/articulo';

@Component({
  selector: 'app-conduce',
  templateUrl: './conduce.component.html',
  styleUrls: ['./conduce.component.scss'],
})
export class ConduceComponent extends mixinClass implements OnInit, OnDestroy, AfterViewInit {
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

  info = [
    {
      titulo: '1',
      key: 'detalles_selected',
      isIcon: true,
      estilos: [{ width: '2rem' }, { color: '#8ef3a3' }],
    },
    {
      titulo: 'Numero Fact',
      key: 'secuencia',
    },
    {
      titulo: 'NCF',
      key: 'numero_comprobante',
    },
    {
      titulo: 'Fecha Facturacion',
      key: 'fecha',
    },
    {
      titulo: 'Total Facturado',
      key: 'total_factura',
      formatoNumero: true,
    },
  ];

  facturaAdelantadaSelected;
  CuerpoConduce = [];
  rowsExcede = [];
  fechaConduce: any;

  articuloClass = new ArticuloC();

  constructor(private dbServ: DBservice, private fb: FormBuilder) {
    super();
  }

  ngOnInit() {
    this._init_mixin({
      component: 'conduce',
      _lista_subs: ['decisionModal', 'objDevuelto', 'articuloPorCodigo', 'pressEsc', 'printBase64Res', 'noFiltro'],
    });

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

  initCambioMenu(arg) {
    if (arg.bool) this.layServ.nextDecisionCambioMenu(arg);
  }

  ngOnDestroy() {
    this._destroy_mixin();
    this.resetModalVaribales();
  }

  async decisionModal(res) {
    if (res) {
      if (this.tipoModal === 'removerArticulo') this.procesoQuitarArticulo();

      if (this.tipoModal === 'cancelar_conduce') this.cancelarConduce(2);

      if (this.tipoModal === 'imprimir_conduce') await this.sendData();

      setTimeout(() => this.resetModalVaribales(), 1000);
    }
  }

  noFiltroResponse(res) {
    if (res.tipo == 'buscarCliente') {
      this.enfocarInput('clienteI');
      this.selectContenido('clienteI');
    }

    if (res.tipo == 'buscarArticulo') {
      this.enfocarInput(`cod-${res.index}`);
      this.selectContenido(`cod-${res.index}`);
    }
  }

  objDevueltoResponse(res) {
    if (res) {
      if (res.tipo_modal === 'buscarCliente') {
        this.cliente = res.data;
        (document.getElementById('clienteI') as any).value = res.data.nombre;
        this.buscarFacturasAdelantadas(res.data.id);
        setTimeout(() => this.enfocarInput('cod-0'), 10);
        //
      } else if (res && res.tipo_modal === 'buscarArticulo') {
        this.LLenarRowDespuesDeFiltro(res);
        setTimeout(() => this.enfocarInput('can-' + res.index), 10);
        //
      } else if (res.tipo_modal === 'seleccionar_articulos_adelantados') {
        // mirar aqui el res
        this.ajustarSecuencia();
        this.llenarConduce(res.data.body).then((res) => {
          this.checkFacturasAdelantadasSelection();
        });
      }
      setTimeout(() => this.resetModalVaribales(), 1000);
    }
  }

  articuloFiltroResponse(res) {
    if (res && res.tipo_modal === 'buscarArticulo') {
      this.LLenarRowDespuesDeFiltro(res);
      setTimeout(() => this.enfocarInput('can-' + res.index), 10);
    }
  }

  pressEscResponse(res) {
    if (this.fun.hasValue(res)) {
      this.enfocarInput('cod-' + res);
      this.selectContenido('cod-' + res);
    }
  }

  resetModalVaribales() {
    this.tipoModal = undefined;
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
    const filas_ocupadas = _.filter(this.filasDetalle, (item) => this.fun.hasValue(item.value.articulo));

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
    const filas_ocupadas = _.filter(this.filasDetalle, (item) => this.fun.hasValue(item.value.articulo));
    this.secuencia = filas_ocupadas.length;
    this.inputSecuencia = 'cod-' + this.secuencia;
  }

  async saltar(input, i) {
    let index = i;
    const fila_actual = this.filasDetalle[i].getRawValue();
    const fila_siguiente = this.filasDetalle[i + 1].getRawValue();

    const unidad = fila_actual['uni'];
    const articulo = fila_actual['articulo'];
    const codigo = fila_actual['cod'];
    const cantidad = fila_actual['can'];
    const detalle_factura_id = fila_actual['detalle_factura_id'];

    if (i >= 10 && input === 'cod-') this.addItem(i);

    if (input === 'can-' && this.fun.hasValue(codigo)) {
      if (this.fun.isEmpty(articulo) || codigo !== articulo.codigo) {
        const obj = { filtrarArticulo: codigo, index: i, metodo: 'venta', data: [], fecha_articulo: this.fechaConduce };

        this.desEnfocarInput('cod-' + i);
        this.abrirModal('buscarArticulo', obj);
      } else {
        this.enfocarInput(`can-${i}`);
      }
    }

    let campo_siguiente = this.fun.hasValue(fila_siguiente['detalle_factura_id']) ? `can-${index + 1}` : `cod-${index + 1}`;
    if (input === 'uni-') {
      const campo = this.fun.hasValue(detalle_factura_id) ? campo_siguiente : `uni-${index}`;
      if (this.fun.hasValue(cantidad) && cantidad != 0 && this.fun.hasValue(codigo)) this.enfocarInput(campo);
    }

    if (input === 'cod-' && this.fun.hasValue(unidad) && _.lowerCase(unidad) != _.lowerCase('medida')) {
      this.ajustarSecuencia();
      if (this.fun.hasValue(cantidad) && cantidad != 0 && this.fun.hasValue(codigo)) this.enfocarInput(campo_siguiente);
    }
  }

  LLenarRowDespuesDeFiltro(obj) {
    const ARTICULO = obj.data;

    const i = obj.index;

    if (ARTICULO.existencia === 0) {
      let msg = 'Producto agotado, debe de comprar mas!!!';

      if (ARTICULO.descripcion === 'Producto terminado') msg = 'Producto agotado, debe de producir mas!!!';
      this.dbServ.toastError(msg, 'ERROR');

      setTimeout(() => {
        this.enfocarInput('cod-' + i);
        this.selectContenido('cod-' + i);
      }, 5);
    } else {
      const cantidades = ARTICULO.cantidades;

      if (ARTICULO.existencia > 0 && ARTICULO.aviso_existencia > cantidades[ARTICULO.medida_alerta]) {
        let cant_restante = GLOBAL.numFormatTwoDecimals(cantidades[ARTICULO.medida_alerta]);

        let msg = `Solo quedan ${cant_restante} ${ARTICULO.medida_alerta} de este producto, debe de aumentar el inventario!!!`;

        if (ARTICULO.descripcion === 'Producto terminado') msg = `Solo quedan ${cant_restante} ${ARTICULO.medida_alerta} de este producto, debe de producir mas!!!`;
        this.dbServ.toastWarning(msg, 'AVISO');
      }

      (this.filasDetalle[i] as any).controls['articulo'].setValue(ARTICULO);
      (this.filasDetalle[i] as any).controls['cod'].setValue(ARTICULO.codigo);
      (this.filasDetalle[i] as any).controls['des'].setValue(ARTICULO.nombre);
      (this.filasDetalle[i] as any).controls['can'].setValue(null);
      (this.filasDetalle[i] as any).controls['can_ant'].setValue(null);
      (this.filasDetalle[i] as any).controls['uni'].setValue(null);

      this.enfocarInput('can-' + i);
    }
  }

  async llenarArrayUnidades(i) {
    const fila_actual = this.filasDetalle[i].getRawValue();
    const codigo = fila_actual['cod'];
    const art = fila_actual['articulo'];

    if (codigo && art) {
      const precioPrincipal = art.precio_principal;
      const costoPrincipal = art.costo_principal;
      this.UnidadesArticulo = [];

      this.UnidadesArticulo.push({ value: 'Medida', precio: 0, costo: 0, cantidad: art.contenido[art.medida] });

      if (art.contenido_articulos.length === 0 || art.medida !== 'Quintal') {
        this.UnidadesArticulo.push({ value: art.medida, precio: art.precio_principal, costo: art.costo_principal, cantidad: art.contenido[art.medida] });
      }

      if (art.descripcion === 'Producto terminado' || art.descripcion === 'Materia prima') {
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
  // =============================================
  //  MODAL PARA FILTRAR CLIENTES
  // =============================================

  async abrirModalFiltro(nombre) {
    if (this.fun.hasValue(nombre)) {
      const obj = { data: [], filtrarCliente: nombre };
      this.desEnfocarInput('clienteI');
      this.abrirModal('buscarCliente', obj);
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

    if (this.fun.hasValue(articulo)) {
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
            this.dbServ.toastError('Cantidad introducida excede la cantidad en inventario', 'ERROR');

            // proceso_quitar_articulo

            setTimeout(() => {
              this.enfocarInput('can-' + i);
              this.selectContenido('can-' + i);
              if (!_.includes(this.rowsExcede, i)) {
                this.calcularCantidadEnUnidades({ index: i, clean: true });
                (this.filasDetalle[i] as any).controls['uni'].setValue(null);
                (this.filasDetalle[i] as any).controls['can_ant'].setValue(null);
              }
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
    } else {
      callback(false);
    }
  }

  addItem(i): void {
    this.ARRAY_ROWARTICULOS = this.form.get('rowFactura') as FormArray;
    this.ARRAY_ROWARTICULOS.push(this.createItem(i));
  }

  removeItem(i: number) {
    (this.form.get('rowFactura') as FormArray).removeAt(i);
  }

  verificarSecuencia(i, input?) {
    const fila_actual = this.filasDetalle[i].getRawValue();

    if (this.secuencia < i) this.enfocarInput(this.inputSecuencia);

    if (this.filasDetalle) {
      const codigo = fila_actual['cod'];
      const art = fila_actual['articulo'];

      if (input === 'unidad' && this.fun.hasValue(codigo) && this.fun.hasValue(art)) {
        this.setInputDrop(i);
        this.llenarArrayUnidades(i);
      }
    }
  }

  saliDeCantidad(i) {
    const fila_actual = this.filasDetalle[i].getRawValue();
    const unidad = fila_actual['uni'];
    const cantidad = fila_actual['can'];
    const cantidad_anterior = fila_actual['can_ant'];

    if (cantidad != cantidad_anterior) {
      if (this.fun.hasValue(unidad)) this.checkCantidadExede(i, 'change', () => {});

      (this.filasDetalle[i] as any).controls['can_ant'].setValue(cantidad);
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
      });
    }
  }

  async calculateCantidadEnUnidades(params: { index: number; clean?: boolean } = { index: 0, clean: false }) {
    this.llenarArrayUnidades(params.index);

    const control = this.filasDetalle[params.index].controls;
    const fila_actual = this.filasDetalle[params.index].value;
    const unidad = fila_actual['uni'];
    const cantidad = fila_actual['can'];

    let cantidadMinima = 1;

    if (unidad && this.UnidadesArticulo.length > 0) cantidadMinima = this.UnidadesArticulo.find((uni) => _.lowerCase(uni.value) === _.lowerCase(unidad)).cantidad;

    const cant_unidades = params.clean ? 0 : cantidad * cantidadMinima;
    control['cantidad_en_unidades'].setValue(cant_unidades);
  }

  setInputDrop(arg) {
    this.inputDrop = 'uni-' + arg;
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

    this.abrirModal('removerArticulo', obj);

    if (e) e.stopPropagation();
  }

  selectedRow(i, bool) {
    const lista = [`cod-${i}`, `can-${i}`, `uni-${i}`, `des-${i}`];

    lista.forEach((row) => {
      if (this.checkIfRowContainArticulo(i)) GLOBAL.ModificarClass(row, 'inputOscuro', bool ? 'add' : 'remove');
    });
  }

  async buscarFacturasAdelantadas(id) {
    try {
      this.facturas_adelantadas = await this.dbServ
        .getFacturasByParams('1', id, 0, true, 0, 0, false)
        .pipe(
          map(
            (fact) =>
              (fact = fact.data.map((val) => {
                val.secuencia = _.padStart(val.numero_factura, 8, '0');
                val.fecha = moment(val.fecha_equivalente).format('DD-MM-YYYY');
                val.customStyles = { 'td-detalles_selected': { width: '2rem' } };

                for (let i = 0; i < val.detalle_facturas.length; i++) {
                  const detalle = val.detalle_facturas[i];
                  detalle.select = false;
                }

                return val;
              })),
          ),
        )
        .toPromise();
      this.checkFacturasAdelantadasSelection();
    } catch (error) {}
  }

  checkFacturasAdelantadasSelection() {
    this.facturas_adelantadas.map((item) => {
      item.detalle_facturas.map((detalle) => {
        const formArray = this.form.get('rowFactura') as FormArray;
        const existe = formArray.value.find((d) => d.detalle_factura_id === detalle.id);

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

  async SeleccionarFactruaAdelantada(factura) {
    if (factura) {
      this.checkFacturasAdelantadasSelection();
      let conteo = 0;
      factura.detalle_facturas.map(async (arti) => {
        this.articuloClass.getArticulosFiltrado({ buscar: arti.codigo, fecha: this.fechaConduce, parameters: { contenido: true } }).then((res_articulo) => {
          const articulo = _.first(res_articulo);
          const abreviaturas = { Caja: 'Caj.', Unidad: 'Uni.', Paquetes: 'Paq.', Libra: 'Lbs.', Quintal: 'Qtl.' };
          const contenidos_format = this.formatContenidos(articulo.contenido);

          const arrayMostrar = [
            { num: arti.retirado, medida: '' },
            { num: arti.cantidad_en_unidades - arti.retirado, medida: '' },
          ];

          for (let j = 0; j < arrayMostrar.length; j++) {
            const element = arrayMostrar[j];

            const contenidoSelected = _.find(contenidos_format, (cont) => element.num >= cont[1]);

            const cantidad = contenidoSelected ? element.num / contenidoSelected[1] : null;
            element.medida = contenidoSelected ? `${cantidad} ${abreviaturas[contenidoSelected[0]]}` : null;
          }

          arti.retirado_mostrar = arrayMostrar[0].medida;
          arti.restante_mostrar = arrayMostrar[1].medida;

          conteo++;
          if (conteo >= factura.detalle_facturas.length) setTimeout(() => this.abrirModal('seleccionar_articulos_adelantados', factura.detalle_facturas), 250);

          return arti;
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

  abrirModalDinamicText(texto, type) {
    const obj = { texto_modal: texto };
    let tipo_modal;

    if (type === 1) tipo_modal = 'conduce_lleno';
    else if (type === 2) tipo_modal = 'imprimir_conduce';
    else tipo_modal = 'cancelar_conduce';

    this.abrirModal('dinamico_texto', obj, tipo_modal);
  }

  // TODO: seguir de aqui para abajo

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
    if (detalle_factura_id) {
      res = true;
    }
    return res;
  }

  async llenarFila(element, i) {
    return new Promise((resolve) => {
      const cant_en_unidades_actual = element.cantidad_en_unidades - element.retirado;
      const multiplo = element.cantidad_en_unidades / element.cantidad;
      const cant_actual = cant_en_unidades_actual / multiplo;
      this.articuloClass.getArticulosFiltrado({ buscar: element.codigo, fecha: this.fechaConduce }).then((result) => {
        const articulo = _.first(result);
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
        this.dbServ.toastError('No puede introducir una cantidad mayor a la cantidad restante de la factura ', 'ERROR');
      } else {
        this.dbServ.toastError('No puede introducir una cantidad mayor a la cantidad de la factura ', 'ERROR');
      }
      (this.filasDetalle[i] as any).controls['can'].setValue(max_can);
      this.enfocarInput('can-' + i);
    }
  }

  getMaxCan(i) {
    const fila_actual = this.filasDetalle[i].getRawValue();
    const detalle_factura_id = fila_actual['detalle_factura_id'];
    const max_can = fila_actual['max_can'];

    return detalle_factura_id ? max_can : 9007199254740991;
  }

  async imprimirConduce() {
    const filas_ocupadas = _.filter(this.filasDetalle, (item) => this.fun.hasValue(item.value.articulo));

    if (this.rowsExcede.length) {
      this.dbServ.toastWarning('No puede hacer el conduce, existiendo artículos que exceden su cantidad en el inventario', 'Aviso');
    } else if (!this.cliente) {
      this.dbServ.toastWarning('Conduce no tiene cliente', 'Aviso');
    } else if (filas_ocupadas.length === 0) {
      this.dbServ.toastWarning('Conduce no tiene Articulos', 'Aviso');
    } else {
      this.CuerpoConduce = [];
      for (let i = 0; i < filas_ocupadas.length; i++) {
        const fila = filas_ocupadas[i].getRawValue();
        const detalle = _.pick(fila, ['detalle_factura_id', 'articulo.id', 'can', 'cantidad_en_unidades', 'uni', 'id']);

        let detalle_parsed = this.fun.remplaceKeyFromJson(detalle, [
          { old_key: 'can', new_key: 'cantidad' },
          { old_key: 'uni', new_key: 'unidad' },
        ]);
        detalle_parsed['articulo_id'] = detalle_parsed.articulo.id;
        delete detalle_parsed['articulo'];

        this.CuerpoConduce.push(detalle_parsed);
      }

      this.abrirModalDinamicText('Seguro que desea imprimir el conduce', 2);
    }
  }

  async sendData() {
    const cabecera_conduce = {};
    cabecera_conduce['cliente_id'] = this.cliente.id;
    cabecera_conduce['numero_conduce'] = '';
    cabecera_conduce['detalle_conduces_attributes'] = this.CuerpoConduce;

    try {
      const res = await this.dbServ.createConduce(cabecera_conduce).toPromise();

      const obj = { data: res, type: 'conduce' };

      this.cancelarConduce(2);
      this.pdfServ.generatePdf(obj).then((res) => {
        if (res.status === 'si') {
          const objBase = { base64: res.body, filename: res.file, type: 'conduce' };
          this._ipc.send('printBase64', objBase);
          this.layServ.nextCheckCuadreToday(true);
        }
      });
    } catch (error) {
      // if (error.error) this.dbServ.toastError(error.error.msg, 'ERROR');
    }
  }

  printBase64Res(res) {
    if (res.status === 'si') {
    } else {
      this.dbServ.toastError(res.msg, 'ERROR');
    }
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

  cancelarConduce(secuencia) {
    if (secuencia === 1) {
      this.abrirModalDinamicText('Conduce no terminado, ¿Desea cancelarlo?', null);
    } else {
      this.borrar();
      (document.getElementById('clienteI') as any).value = '';
      setTimeout(() => this.enfocarInput('clienteI'), 10);
    }
  }
}
