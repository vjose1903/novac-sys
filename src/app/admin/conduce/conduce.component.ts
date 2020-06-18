import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ModalService } from '../components/modal/modal.service';
import { ObservableServcie } from '../../core/services/observables.service';
import { DBservice } from '../../core/services/bdservice.service';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { map } from 'rxjs/operators';
import { GLOBAL } from '../../core/services/GLOBAL';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
  selector: 'app-conduce',
  templateUrl: './conduce.component.html',
  styleUrls: ['./conduce.component.scss'],
})
export class ConduceComponent implements OnInit, OnDestroy, AfterViewInit {
  listaClientes;

  cliente: any;
  facturas_adelantadas = [];
  facturas_adelantadas_wait = [];

  form: FormGroup;
  ARRAY_ROWARTICULOS: any;
  tipoModal: string;
  indexRemove: any;
  control: FormArray;

  secuencia = 0;
  inputSecuencia = 'cod-0';
  inputDrop = 'uni-0';
  drop = false;
  listaArticulos = [];
  UnidadesArticulo: any[];
  sacos = [25, 50, 100];

  TOTAL: number;

  subDeci: Subscription;
  subObj: Subscription;
  subEsc: Subscription;
  subInde: Subscription;

  info = [
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
  constructor(private mServ: ModalService, private obsServ: ObservableServcie, private dbServ: DBservice, private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      rowFactura: this.fb.array([this.createItem(0)]),
    });

    this.ARRAY_ROWARTICULOS = this.form['rowFactura'] as FormArray;

    for (let index = 1; index <= 22; index++) {
      this.addItem(index);
    }

    this.necesarioStar();

    this.subObj = this.mServ.OBJDEVUELTO.subscribe((res) => {
      if (res) {
        if (res.tipoModal === 'buscarCliente') {
          this.cliente = res;
          (document.getElementById('clienteI') as any).value = res.nombre;
          this.BuscarFacturasAdelantadas(res.id);
          //
        } else if (res.tipoModal === 'buscar') {
          this.clickRowModal(res);
          //
        } else if (res.tipoModal === 'seleccionar_articulos_adelantados') {
          this.llenarConduce(res.body);
        }
        setTimeout(() => {
          this.resetModalVaribales();
        }, 1000);
      }

      // else if (res && res.tipoModal === 'cambio') {
      //   this.Devuelta = res.devuelta;
      //   this.forma_pago = res.forma_pago;
      //   this.sendIngreso();
      //   this.mServ.ModalObj(undefined);
      // }
    });

    this.subDeci = this.mServ.DECISIONMODAL.subscribe(async (res) => {
      if (res) {
        if (this.tipoModal === 'removerArticulo') {
          this.procesoQuitarArticulo();
        }
        if (this.tipoModal === 'conduce_lleno') {
          await this.form.reset();
          await this.SeleccionarFactruaAdelantada(this.facturas_adelantadas_wait);
          this.facturas_adelantadas_wait = [];
        }
        setTimeout(() => {
          this.resetModalVaribales();
        }, 1000);
      }
    });

    this.subEsc = this.mServ.PRESSESC.subscribe((res) => {
      if (res !== undefined && res !== null) {
        this.enfocarInput('cod-' + res);
      }
    });

    this.subInde = this.mServ.INDEXTOFOCUS.subscribe((res) => {
      if (res !== undefined && res !== null) {
        this.noArticuloEncontrado(res);
      }
    });

    this.getArticulos();
  }
  resetModalVaribales() {
    this.mServ.ModalObj(undefined);
    this.mServ.ModalSeleccion(undefined);
    this.mServ.ModalDecision(undefined);
    this.tipoModal = undefined;
  }

  noArticuloEncontrado(arg) {
    this.dbServ.toastError('Articulo no creado', 'ERROR');

    this.enfocarInput('cod-' + arg);
    this.mServ.ModalIndex(undefined);
  }

  ngOnDestroy() {
    this.subDeci.unsubscribe();
    this.subObj.unsubscribe();
    this.subEsc.unsubscribe();
    this.subInde.unsubscribe();

    this.mServ.modalTipo(undefined);
    this.mServ.ModalSeleccion(undefined);
    this.mServ.mostrarModal(false);
  }
  ngAfterViewInit() {
    this.control = this.form.controls['rowFactura'] as FormArray;
  }

  async necesarioStar() {
    await this.pedirClientes();
    this.enfocarInput('clienteI');
  }
  aumentarSecuencia() {
    this.secuencia++;
    this.inputSecuencia = 'cod-' + this.secuencia;
    this.inputDrop = 'uni-' + this.secuencia;
    this.drop = false;
  }

  async procesoQuitarArticulo() {
    await this.removeItem(this.indexRemove);
    await this.disminuirSecuencia();
  }

  disminuirSecuencia() {
    this.secuencia--;
    this.inputSecuencia = 'cod-' + this.secuencia;
    this.inputDrop = 'uni-' + this.secuencia;
    this.drop = false;
  }
  async saltar(input, i) {
    const sigInput = input + i;

    if (i >= 10 && input === 'cod-') {
      this.addItem(i);
    }

    let codigo = (this.control.controls[i] as any).controls['cod'].value;

    if (input === 'can-' && codigo !== '') {
      codigo = _.parseInt(codigo);

      if (_.isInteger(codigo)) {
        codigo = (this.control.controls[i] as any).controls['cod'].value;
        this.buscarArticuloPorCodigo(i, codigo, input);
      } else {
        codigo = (this.control.controls[i] as any).controls['cod'].value;

        if (!codigo) {
          this.enfocarInput('cod-' + i);
          this.selectContenido('cod-' + i);
        } else {
          const obj = { filtrar: codigo, index: i, metodo: 'venta' };
          this.abrirModal(obj);
        }
      }
    }

    if (input === 'uni-') {
      const cantidad = (this.control.controls[i] as any).controls['can'].value;

      if (cantidad !== '' && cantidad !== null) {
        if (input === 'uni-' && codigo !== '' && codigo !== null && codigo !== undefined) {
          this.verificarRow(i);
          this.buscarArticuloPorCodigo(i, codigo);
          setTimeout(() => {
            this.enfocarInput(sigInput);
          }, 2);
        }
      }
    }

    if (input === 'cod-' || input === 'pre-') {
      let unidad;
      let index = i;

      if (input === 'cod-') {
        index--;
      }
      unidad = (this.control.controls[index] as any).controls['uni'].value;

      const excede = this.checkCantidadExede(index, unidad, 'saltar');

      if (!excede) {
        if (unidad === '' || unidad === null) {
          setTimeout(() => {
            this.enfocarInput('uni-' + (i - 1));
          }, 5);
        } else {
          this.UnidadesArticulo = [];
          this.aumentarSecuencia();
          this.enfocarInput(sigInput);
        }
      } else {
        this.enfocarInput('can-' + index);
        this.selectContenido('can-' + index);
        setTimeout(() => {
          (this.control.controls[index] as any).controls['uni'].setValue(null);
        }, 2);
      }
    }
  }

  async clickRowModal(arg) {
    const index = _.findIndex(this.listaArticulos, (o: any) => {
      return o.codigo === arg.codigo;
    });

    const cantidades = arg.cantidades;

    if (arg.existencia > 0 && arg.aviso_existencia > cantidades[arg.medida_alerta]) {
      this.dbServ.toastWarning('Solo quedan ' + cantidades[arg.medida_alerta] + ' ' + arg.medida_alerta + ' de este producto, debe de aumentar el inventario!!!', 'AVISO');
    }

    (this.control.controls[arg.index] as any).controls['cod'].setValue(arg.codigo);
    (this.control.controls[arg.index] as any).controls['des'].setValue(arg.nombre);

    if (arg.is_detallable) {
      await this.articulo_detallable(arg);
    } else {
      await this.articulo_no_detallable(arg);
    }

    const sigInput = 'can-' + arg.index;
    this.enfocarInput(sigInput);
  }

  // =============================================
  //  MODAL PARA FILTRAR ARTICULOS
  // =============================================
  abrirModal(arg) {
    const obj = arg;

    obj.listaArticulos = this.listaArticulos;

    this.mServ.modalTipo('buscar');
    this.mServ.ModalSeleccion(obj);
    this.mServ.mostrarModal(true);
  }

  // =============================================
  checkCantidadExede(i, unidad, lugar) {
    let cantidad = 0;
    const descripcion = (this.control.controls[i] as any).controls['des'].value;
    const tempArticulo = this.listaArticulos.filter((arti) => arti.nombre === descripcion);
    const articulo = tempArticulo[0];
    const cantidades = articulo.cantidades;

    const splitUnidad = _.split(unidad, ' ');
    let unidad_ = splitUnidad[0];
    unidad = splitUnidad[0];

    if (unidad_ === 'Saco' || unidad_ === 'Libra') {
      unidad_ = 'Libra';
    } else {
      unidad_ = 'Unidad';
    }

    for (let index = 0; index < this.control.controls.length; index++) {
      const cod = (this.control.controls[index] as any).controls['cod'].value;
      if (cod === null || cod === undefined || cod === '' || cod === ' ') {
        break;
      }
      let cantidadF = 0;
      let unidadF = '';

      cantidadF = (this.control.controls[index] as any).controls['can'].value;
      unidadF = (this.control.controls[index] as any).controls['uni'].value;

      const splitUnidadF = _.split(unidadF, ' ');
      let unity = splitUnidadF[0];
      const FindProd = (this.control.controls[index] as any).controls['des'].value;

      if (FindProd === descripcion) {
        if (unidad_ === 'Libra') {
          if (splitUnidadF.length > 1) {
            cantidadF = cantidadF * _.parseInt(splitUnidadF[2]);
          }
        }
        if (unity === 'Saco') {
          unity = 'Libra';
        }

        cantidadF *= articulo.contenido[unity];

        cantidad += cantidadF;
      }
    }

    if (lugar === 'saltar') {
      i--;
    }

    if (cantidad > cantidades[unidad_]) {
      this.dbServ.toastError('Cantidad introducida excede la cantidad en inventario', 'ERROR');
      return true;
    } else {
      return false;
    }
  }

  addItem(i): void {
    this.ARRAY_ROWARTICULOS = this.form.get('rowFactura') as FormArray;
    this.ARRAY_ROWARTICULOS.push(this.createItem(i));
  }

  removeItem(i: number) {
    this.control.removeAt(i);
  }

  verificarSecuencia(i, input?) {
    if (this.secuencia < i) {
      this.enfocarInput(this.inputSecuencia);
    }

    if (!input) {
      this.drop = false;
    }

    const codigo = (this.control.controls[i] as any).controls['cod'].value;
    if (input === 'unidad' && codigo !== '' && codigo !== null && codigo !== undefined) {
      this.verificarRow(i);
      this.buscarArticuloPorCodigo(i, codigo);
    }
  }

  selectMedidaChange(arg, i) {
    const indiceDetalle = _.findIndex(this.UnidadesArticulo, (o) => {
      return o.value === arg;
    });
    const unidad = this.UnidadesArticulo[indiceDetalle].value;

    const execede = this.checkCantidadExede(i, unidad, 'change');

    if (!execede) {
      (this.control.controls[i] as any).controls['uni'].setValue(unidad);
    } else {
      this.enfocarInput('can-' + i);
      this.selectContenido('can-' + i);
      setTimeout(() => {
        (this.control.controls[i] as any).controls['uni'].setValue(null);
      }, 2);
    }
  }

  secuenciaDelDrop(arg) {
    return 'uni-' + arg;
  }

  verificarRow(arg) {
    this.inputDrop = 'uni-' + arg;
  }

  enfocarInput(arg) {
    const element = document.getElementById(arg) as any;
    element.focus();
  }

  selectContenido(arg) {
    const element = document.getElementById(arg) as any;
    element.select();
  }

  createItem(i): FormGroup {
    return this.fb.group({
      id: [],
      cod: [null],
      uni: [null],
      des: [null],
      can: [null],
      secuencia: [i],
    });
  }

  modalRemover(i) {
    const name = (this.control.controls[i] as any).controls['des'].value;
    const unidad = (this.control.controls[i] as any).controls['uni'].value;
    const obj = { nombre: name + ' (' + unidad + ')' };

    if (name) {
      this.tipoModal = 'removerArticulo';
      this.indexRemove = i;
      this.mServ.modalTipo('removerArticulo');
      this.mServ.ModalSeleccion(obj);
      this.mServ.mostrarModal(true);
    }
  }

  ModificarClass(item, clase, action) {
    if (action === 'add') {
      document.getElementById(item).classList.add(clase);
    } else {
      document.getElementById(item).classList.remove(clase);
    }
  }

  selectedRow(i, bool) {
    const lista = ['cod-' + i, 'can-' + i, 'uni-' + i, 'des-' + i];
    lista.forEach((row) => {
      if (bool) {
        this.ModificarClass(row, 'inputOscuro', 'add');
      } else {
        this.ModificarClass(row, 'inputOscuro', 'remove');
      }
    });
  }
  getArticulos() {
    try {
      this.dbServ.getArticulos().subscribe((res) => {
        res.sort((a, b) => {
          return a.id > b.id ? 1 : -1;
        });

        if (res !== undefined && res !== null) {
          this.listaArticulos = res;
        }
      });
    } catch (error) {}
  }

  async BuscarFacturasAdelantadas(id) {
    try {
      this.facturas_adelantadas = await this.dbServ
        .getFacturasByParams('1', id, 0, true)
        .pipe(
          map(
            (fact) =>
              (fact = fact.map((val) => {
                val.secuencia = _.padStart(val.numero_factura, 8, '0');
                val.fecha = moment(val.fecha_facturacion).format('DD-MM-YYYY');
                val.fechaV = moment(val.fecha_vencimiento).isValid() ? moment(val.fecha_vencimiento).format('DD-MM-YYYY') : '';
                val.estado_ = val.estado ? 'fas fa-check' : 'fas fa-times';
                val.monto = GLOBAL.formatearNumero(GLOBAL.redondearAdos(val.balance));
                return val;
              })),
          ),
        )
        .toPromise();
    } catch (error) {}
  }

  async pedirClientes() {
    try {
      this.listaClientes = await this.dbServ
        .getClientes()
        .pipe(
          map(
            (cliente) =>
              (cliente = cliente.map((cli) => {
                cli.nombre = GLOBAL.Capitalice(cli.nombre);
                cli.apellido = GLOBAL.Capitalice(cli.apellido);
                cli.documentos_de_identidad.map((docu) => {
                  if (docu.principal) {
                    cli.documento_identidad = docu.documento;
                  }
                });
                return cli;
              })),
          ),
        )
        .toPromise();
    } catch (error) {
      console.error(error);
    }
  }

  abrirModalFiltro(nombre) {
    this.mServ.modalTipo('buscarCliente');
    this.tipoModal = 'buscarCliente';

    this.listaClientes['filtrarCliente'] = nombre;
    this.mServ.ModalSeleccion(this.listaClientes);

    this.mServ.mostrarModal(true);
  }

  SeleccionarFactruaAdelantada(factura) {
    if (factura) {
      if (this.checkIfCuerpoDirty()) {
        this.facturas_adelantadas_wait = GLOBAL.duplicarJson(factura);
        this.abrirModalCuerpoLleno();
      } else {
        this.mServ.modalTipo('seleccionar_articulos_adelantados');
        this.mServ.ModalSeleccion(factura.detalle_facturas);
        this.mServ.mostrarModal(true);
      }
    }
  }

  buscarArticuloPorCodigo(i, codigo, input?) {
    this.inputDrop = 'uni-' + i;

    const ARTICULO = this.listaArticulos.filter((articulo) => articulo.codigo === codigo);

    if (ARTICULO[0] === undefined) {
      this.dbServ.toastError('El codigo introducido no existe', 'ERROR');
      setTimeout(() => {
        this.enfocarInput('cod-' + i);
      }, 5);
      this.selectContenido('cod-' + i);
    } else {
      const cantidades = ARTICULO[0].cantidades;
      if (ARTICULO[0].existencia === 0) {
        if (ARTICULO[0].descripcion === 'Producto terminado') {
          this.dbServ.toastError('Producto agotado, debe de producir mas!!!', 'ERROR');
        } else {
          this.dbServ.toastError('Producto agotado, debe de comprar mas!!!', 'ERROR');
        }
        setTimeout(() => {
          this.enfocarInput('cod-' + i);
          this.selectContenido('cod-' + i);
        }, 5);
      } else {
        if (ARTICULO[0].existencia > 0 && ARTICULO[0].aviso_existencia > cantidades[ARTICULO[0].medida_alerta]) {
          if (input === 'can-') {
            this.dbServ.toastWarning(
              'Solo quedan ' + cantidades[ARTICULO[0].medida_alerta] + ' ' + ARTICULO[0].medida_alerta + ' de este producto, debe de aumentar el inventario!!!',
              'AVISO',
            );
          }
        }

        (this.control.controls[i] as any).controls['des'].setValue(ARTICULO[0].nombre);
        this.verificarRow(i);

        if (ARTICULO[0].is_detallable) {
          this.articulo_detallable(ARTICULO[0]);
        } else {
          this.articulo_no_detallable(ARTICULO[0]);
        }

        this.enfocarInput('can-' + i);
      }
    }
  }

  checkIfCuerpoDirty() {
    let acu = false;
    for (let i = 0; i < this.control.controls.length; i++) {
      const element = this.control.controls[i] as any;
      if (element.controls['cod'].value || element.controls['des'].value) {
        acu = true;
        break;
      }
    }
    return acu;
  }

  abrirModalCuerpoLleno() {
    const obj = { texto_modal: 'Conduce no terminado, ¿Desea sobreescribirlo?' };
    this.tipoModal = 'conduce_lleno';
    this.mServ.modalTipo('dinamico_texto');
    this.mServ.ModalSeleccion(obj);
    this.mServ.mostrarModal(true);
  }

  entrarSacosAUnidades() {
    this.UnidadesArticulo.push({ value: 'Medida', precio: 0 });
    for (let i = 0; i < this.sacos.length; i++) {
      const saco = this.sacos[i];
      const valor = 'Saco de ' + saco + ' libras';
      this.UnidadesArticulo.push({ value: valor, precio: 0, costo: 0 });
    }
  }

  articulo_detallable(art) {
    this.drop = true;
    this.UnidadesArticulo = [];

    if (art.descripcion === 'Producto terminado' || art.descripcion === 'Materia prima') {
      this.entrarSacosAUnidades();
    }

    if (art.descripcion === 'Veterinaria' || art.descripcion === 'Otros') {
      this.UnidadesArticulo.push({ value: 'Medida', precio: 0 });
      this.UnidadesArticulo.push({ value: art.medida, precio: 0, costo: 0 });
    }

    art.contenido_articulos.forEach((element) => {
      this.UnidadesArticulo.push({ value: element.medida, precio: 0, costo: 0 });
    });
  }

  articulo_no_detallable(art) {
    this.drop = true;
    this.UnidadesArticulo = [];

    if (art.descripcion === 'Veterinaria' || art.descripcion === 'Otros') {
      this.UnidadesArticulo.push({ value: 'Medida', precio: 0 });
      this.UnidadesArticulo.push({ value: art.medida, precio: 0, costo: 0 });
    }

    art.contenido_articulos.forEach((element) => {
      if (element.referencia === null) {
        if (art.descripcion === 'Veterinaria') {
          this.UnidadesArticulo.push({ value: element.medida, precio: 0, costo: 0 });
        }
      }
      if (art.descripcion === 'Producto terminado' || art.descripcion === 'Materia prima') {
        this.entrarSacosAUnidades();
      }
    });
  }
  llenarConduce(articulos) {
    for (let i = 0; i < articulos.length; i++) {
      const element = articulos[i];
      (this.control.controls[i] as any).controls['cod'].setValue(element.codigo);
      (this.control.controls[i] as any).controls['can'].setValue(element.cantidad - element.retirado);
      (this.control.controls[i] as any).controls['des'].setValue(_.capitalize(element.articulo));
      if (element.peso_saco) {
        (this.control.controls[i] as any).controls['uni'].setValue('Saco de ' + element.peso_saco + ' libras');
      } else {
        (this.control.controls[i] as any).controls['uni'].setValue(element.unidad);
      }
      this.aumentarSecuencia();
    }
  }

  imprimirConduce() {}
  cancelarConduce() {}
}
