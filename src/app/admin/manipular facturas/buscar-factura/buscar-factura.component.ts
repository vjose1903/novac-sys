import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { DBservice } from '../../../core/services/bdservice.service';
import { GLOBAL } from '../../../core/services/GLOBAL';
import * as _ from 'lodash';
import * as moment from '../../../../utils/javascript/moment';
import { ActivatedRoute, Router } from '@angular/router';
import { TablasComponent } from '../../components/tablas/tablas.component';
import { TablasService } from '../../components/tablas/tablas.service';
import { mixinClass } from '../../mixinClass';
import { LoaderService } from '../../../loader/loader.service';
import { ArticuloC } from '../../registros/articulos/articulo';
import { FacturaC } from '../../facturacion/factura';
@Component({
  selector: 'app-buscar-factura',
  templateUrl: './buscar-factura.component.html',
  styleUrls: ['./buscar-factura.component.scss'],
})
export class BuscarFacturaComponent extends mixinClass implements OnInit, OnDestroy {
  facturas: any;
  campoSelected: string;
  clienteBuscado: any;
  listaClientes: unknown;
  facturaSelected: any;
  @ViewChild(TablasComponent) tablas: TablasComponent;
  BuscarPara: any;
  NCF;
  Para: string;
  tipoModal: any;
  indexSelected: any;
  lista_tipos_facturas: any;
  existenComprobantes = false;
  tipo_factu_nota: any;
  paqueteComprobante: any;
  tipo_factura_id = null;
  valor: any;
  articuloClass = new ArticuloC();
  facturaClass = new FacturaC();
  constructor(private dbServ: DBservice, private route: ActivatedRoute, private router: Router, private tServ: TablasService, public loadServ: LoaderService) {
    super();
  }
  campo = null;
  placeHolder = '';
  info = [
    { titulo: ' ', key: 'estatus', text_color: 'colorEstado', isIcon: true, color: true, estilos: [{ width: '2rem' }] },
    { titulo: 'Numero Fact', key: 'secuencia', estilos: [{ width: '7rem' }] },
    { titulo: 'Tipo', key: 'tipo_factura' },
    { titulo: 'Comprobante', key: 'numero_comprobante', estilos: [{ width: '7rem' }] },
    { titulo: 'Condicion', key: 'condicion', estilos: [{ width: '6rem' }] },
    { titulo: 'Fecha Facturación', key: 'fecha' },
    { titulo: 'Fecha Vencimiento', key: 'fechaV' },
    { titulo: 'Total facturado', key: 'total_factura', formatoNumero: true },
    { titulo: 'Balance tactura', key: 'balance', formatoNumero: true },
    { titulo: 'Seleccione', key: 'select', text_color: 'selectColor', isIcon: true, color: true },
  ];

  ncfMask = [/b/, /[0-9]/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/];

  ngOnInit() {
    this._init_mixin({ component: 'buscar_factura', _lista_subs: ['decisionModal', 'objDevuelto', 'printBase64Res', 'pressEsc', 'noFiltro'] });
    this.BuscarPara = this.route.snapshot.params['para'];

    if (this.BuscarPara === 'nota_credito') {
      this.tipo_factu_nota = '04';
    } else if (this.BuscarPara === 'nota_debito') {
      this.tipo_factu_nota = '03';
    }

    this.necesarioStart();
    this.completarTituloPag();
  }

  printBase64Res(res_ipc) {
    this.loadServ.isLoading.next(false);

    if (res_ipc.status === 'si') {
      this.fun.toastSuccess(res_ipc.msg, 'CORRECTO');
    } else {
      this.fun.toastError(res_ipc.msg, 'ERROR');
    }
  }

  objDevueltoResponse(res) {
    if (res && res.tipo_modal === 'buscarCliente') {
      this.clienteBuscado = res.data;
      (document.getElementById('valorI') as any).value = res.data.nombre;
      this.valor = res.data.id;
      this.pedirFactura('1', res.data.id, this.tServ.obj_paginate);
    }
  }

  pressEscResponse(res) {
    if (this.fun.hasValue(res)) this.enfocarInput('valorI');
  }

  reimprimirFactura(obj) {
    this.loadServ.isLoading.next(true);
    this.pdfServ.generatePdf(obj).then((res) => {
      if (res.status === 'si') {
        this.fileName = res.file;
        this.pdfSrc = res.body;

        const obj = { base64: this.pdfSrc, filename: this.fileName, type: 'facturacion' };

        this._ipc.send('printBase64', obj);
      }
    });
  }

  decisionModal(res) {
    if (res) {
      if (this.tipoModal === 'mostrarFactura') {
        if (this.BuscarPara === 'anular_factura') {
          this.facturaSelected['identificadorFact'] =
            this.campo === '2'
              ? ' con el comprobante fiscal ' + this.facturaSelected.numero_comprobante
              : ' con el numero de factura ' + this.formatoNumeroFactura(this.facturaSelected.numero_factura);

          setTimeout(() => this.abrirModal('cancelar', this.facturaSelected), 10);
          //
        } else if (this.BuscarPara === 'solo_ver') {
          if (res.tipo === 'reimrimir') {
            const obj = { data: this.facturaSelected, type: 'facturacion' };
            this.reimprimirFactura(obj);
          } else {
            this.facturaClass.getAll({ afterPath: `custom/canUpdate/${this.facturaSelected.id}` }).then((res) => {
              setTimeout(() => this.editarFactura(), 10);
            });
          }
          //
        } else {
          const url = `/admin/manipular/nota/${this.BuscarPara === 'nota_credito' ? 'credito' : 'debito'}/${this.facturaSelected.id}`;
          this.router.navigateByUrl(url);
        }
      } else if (this.tipoModal === 'cancelarBusqueda') {
        this.decisionesModal();
      }
    } else {
      if (this.tipoModal === 'cancelar') setTimeout(() => this.abrirModal('mostrarFactura', this.facturas[0]), 10);
    }
  }

  initCambioMenu(arg) {
    if (arg.bool) this.layServ.nextDecisionCambioMenu(arg);
  }

  noFiltroResponse(res) {
    if (res.tipo == 'buscarCliente') {
      this.enfocarInput('valorI');
      this.selectContenido('valorI');
    }
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
    this.borrar('salir');
  }

  async getPaqueteComprobante() {
    try {
      const TipoFact = this.lista_tipos_facturas.filter((tipo) => tipo.referencia === this.tipo_factu_nota);
      const res = await this.dbServ.getPaquetesNCF(TipoFact[0].id).toPromise();

      this.paqueteComprobante = res['data'] as any;

      if (this.paqueteComprobante.fecha_valida !== null) {
        const desde = this.paqueteComprobante.desde;
        const hasta = this.paqueteComprobante.hasta;
        const secuencia = this.paqueteComprobante.secuencia;

        const cant = hasta - desde;
        const cantidad = cant + 1;
        let porciento = 0;

        if (cantidad > 0 && cantidad <= 40) {
          porciento = cantidad * 0.5;
        } else if (cantidad > 40 && cantidad <= 100) {
          porciento = cantidad * 0.25;
        } else if (cantidad > 100 && cantidad <= cantidad * 500) {
          porciento = cantidad * 0.1;
        } else if (cantidad > 500) {
          porciento = cantidad * 0.04;
        }
        const limite = hasta - porciento;
        const restante = hasta - secuencia + 1;

        const msg =
          this.paqueteComprobante.msg === 'Ultimo comprobante de este paquete'
            ? `Ultimo comprobante para ${TipoFact[0].descripcion}.`
            : `Los comprobantes para ${TipoFact[0].descripcion} se estan agotando, solo quedan ${restante}`;

        if (secuencia >= limite) {
          this.fun.toastWarning(msg, 'AVISO');
        }
      }
    } catch (error) {
      this.existenComprobantes = true;
      console.error(error);
      this.fun.toastError(error.error.msg, 'ERROR');
    }
  }

  completarTituloPag() {
    if (this.BuscarPara === 'anular_factura') {
      this.Para = ' Anular factura';
    } else if (this.BuscarPara === 'nota_credito') {
      this.Para = ' Nota de crédito';
    } else if (this.BuscarPara === 'nota_debito') {
      this.Para = ' Nota de débito';
    } else if (this.BuscarPara === 'solo_ver') {
      this.Para = ' Visualizar';
    }
  }

  async getTipoFacturas() {
    try {
      const res = await this.dbServ.getTiposFacturas().toPromise();
      this.lista_tipos_facturas = res;
    } catch (error) {
      console.error(error);
    }
  }

  async necesarioStart() {
    await this.getTipoFacturas();

    if (this.BuscarPara === 'nota_credito' || this.BuscarPara === 'nota_debito') await this.getPaqueteComprobante();

    this.enfocarInput('campoI');
  }

  mostrarListaFacturas() {
    let res = false;
    if (this.facturas && this.facturas.length > 0) {
      if (this.campo === '1' || this.campo === '4') {
        res = true;
      } else if (this.campo === '3' && this.tipo_factura_id === '0') {
        res = true;
      } else {
        res = false;
      }
    } else {
      res = false;
    }

    return res;
  }

  async calcularPrecio(detalle, factura) {
    if (detalle.calcular_saco) {
      const fechaFactura = this.formarFechaFactura(factura.fecha_equivalente)['FechaFactura'];

      this.articuloClass.getArticulosFiltrado({ buscar: 'Saco sistema', fecha: fechaFactura, paginado: false }).then((res) => {
        const precio_saco = res.data[0].precio_principal;
        detalle.precio = detalle.precio + precio_saco;
        detalle.total = detalle.precio * detalle.cantidad;
      });
    } else {
      detalle.precio = detalle.precio;
    }

    return detalle;
  }

  async pedirFactura(campo, valor, e) {
    try {
      const fechaA = moment().format('YYYY-MM-DD');
      // this.facturas = undefined;
      const page = e.page;
      const per_page = e.per_page;
      const busqueda = await this.dbServ.getFacturasByParams(campo, valor, this.tipo_factura_id, false, page, per_page, true).toPromise();

      busqueda['data'].map((fact) => {
        fact.secuencia = _.padStart(fact.numero_factura, 8, '0');
        fact.fecha = moment(fact.fecha_equivalente).format('DD/MM/YYYY');
        fact.fechaV = moment(fact.fecha_vencimiento).isValid() ? moment(fact.fecha_vencimiento).format('DD/MM/YYYY') : '';
        fact.pagoT = true;
        fact.estatus = fact.estado ? 'fas fa-check' : 'fas fa-times';
        fact.monto = GLOBAL.formatearNumero(GLOBAL.redondearAdos(fact.balance));
        fact.pago_a_tiempo = fact.fecha_vencimiento > fechaA ? true : false;
        fact.colorEstado = fact.estado ? 'green' : 'red';
        fact.selectColor = 'gris-claro';
        fact.select = 'far fa-eye-slash';

        fact.iconsMoveEvents = [{ key: 'select', hover: ['fa-eye', 'text-black'], leave: ['fa-eye-slash', 'text-gris-claro'] }];
        // fact.customStyles = [{ select: { estilos: [{ 'font-size': '1.5rem' }] } }, { 'td-estatus': { estilos: [{ width: '2rem' }] } }];
        fact.customStyles = {
          'td-select': { 'font-size': '1.5rem' },
          'td-condicion': { width: '6rem' },
          'td-secuencia': { width: '7rem' },
          'td-numero_comprobante': { width: '7rem' },
          'td-estatus': { width: '2rem' },
        };

        return fact;
      });

      // for (let i = 0; i < busqueda['data'].length; i++) {
      //   const factura = busqueda['data'][i];
      //   for (let j = 0; j < factura.detalle_facturas.length; j++) {
      //     let detalle = factura.detalle_facturas[j];

      //     detalle = await this.calcularPrecio(detalle, factura);
      //   }
      // }
      const obj = { total: busqueda.total_registros, tabla: 'facturas_parms' };

      this.tServ.Func_total_paginas(obj);
      this.facturas = GLOBAL.duplicarJson(busqueda['data']);

      if (this.facturas.length > 0) {
        if (this.campo === '2') {
          this.facturas[0]['mostrarFacturaPara'] = this.BuscarPara;

          this.facturaSelected = this.facturas[0];
          this.parseFacturaSelected().then((res) => {
            this.abrirModal('mostrarFactura', res);
          });
        }
      } else {
        if (this.campo === '1') {
          if (this.tipo_factura_id === '0') {
            this.fun.toastError('Este cliente no tiene facturas a credito a su nombre', 'ERROR');
          } else {
            this.fun.toastError('Este cliente no tiene facturas del tipo seleccionada', 'ERROR');
          }
        } else if (this.campo === '3') {
          this.fun.toastError('No existen facturas con este número.', 'ERROR');
        } else if (this.campo === '2') {
          this.fun.toastError('La factura buscada no existe', 'ERROR');
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  changeSelect(valor) {
    this.tipo_factura_id = null;
    this.facturas = undefined;

    if (valor === '1') {
      this.campoSelected = 'Cliente';
      this.placeHolder = 'Nombre Cliente';
    } else if (valor === '2') {
      this.campoSelected = 'Numero Comprobante';
      this.placeHolder = 'Escriba numero de comprobante';
      this.tipo_factura_id = 0;
    } else if (valor === '3') {
      this.campoSelected = 'Numero Factura';
      this.placeHolder = 'Escriba numero de factura';
    } else if (valor === '4') {
      this.tipo_factura_id = '0';
      this.valor = '0';
      this.pedirFactura(this.campo, '0', this.tServ.obj_paginate);
    }
  }

  changePaginate(arg) {
    this.pedirFactura(this.campo, this.valor, arg);
  }

  abilitarBtns() {
    let res = true;
    if (this.facturaSelected) {
      res = false;
    } else {
      res = true;
    }
    return res;
  }

  borrar(tipo = '') {
    this.tipoModal = null;
    this.NCF = null;
    this.facturas = undefined;
    if (tipo !== 'salir') {
      (document.getElementById('valorI') as any).value = null;
    }
    this.tipo_factura_id = null;
    this.campo = null;
    this.enfocarInput('campoI');
  }

  parseFacturaSelected() {
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        this.facturaSelected['FACTURA_DE'] = 'venta';
        this.facturaSelected['mostrarFacturaPara'] = this.BuscarPara;
        resolve(this.facturaSelected);
      }, 5);
    });
  }

  selectFactura(item) {

    if (item.column === 'select') {
      this.facturaSelected = item.row;
      this.indexSelected = item.index;

      this.parseFacturaSelected().then(() => this.abrirModal('mostrarFactura', this.facturaSelected));
    }
  }

  confirmarSeleccion() {}
  validarRayaAbajo() {
    if (this.NCF) {
      let char = '';
      let num = 0;
      for (let index = 0; index < this.NCF.length; index++) {
        const c = this.NCF.charAt(index);
        char = c;
        num = index;
      }

      if (num < 10 || char === '_') {
        return false;
      } else {
        return true;
      }
    }
  }

  saltar(campo, valor) {
    if (valor && this.campo) {
      this.valor = valor;
      if (campo === 'cliente') {
        if (valor || valor === ' ') {
          this.abrirModalFiltro(valor);
          this.desEnfocarInput('valorI');
        }
      } else if (campo === 'buscarFactura') {
        this.NCF = null;

        if (this.campo === '2') {
          valor = valor.toUpperCase();
          this.NCF = valor;
          if (this.validarRayaAbajo()) {
            this.pedirFactura(this.campo, valor, this.tServ.obj_paginate);
          } else {
            this.fun.toastWarning('Numero de comprobante incorrecto', 'Aviso');
          }
        } else {
          if (this.tipo_factura_id === '0') {
            this.pedirFactura(this.campo, valor, this.tServ.obj_paginate);
          } else {
            this.pedirFactura(this.campo, valor, this.tServ.obj_paginate);
          }
        }
      } else {
        this.enfocarInput(campo);
      }
    }
  }

  async abrirModalFiltro(nombre) {
    const obj = {
      data: this.listaClientes,
      filtrarCliente: nombre,
    };
    this.abrirModal('buscarCliente', obj);
  }

  formatoNumeroFactura(num) {
    return _.padStart(num, 8, '0');
  }

  editarFactura() {
    this.router.navigateByUrl(`/admin/factura/venta/update/${this.facturaSelected.id}`);
  }
  decisionesModal() {
    if (this.BuscarPara === 'anular_factura') {
      this.CancelarFactura();
    }
    if (this.tipoModal === 'cancelarBusqueda') {
      this.borrar();
    }
  }
  async CancelarFactura() {
    try {
      const res = await this.dbServ.cancelarFactura(this.facturaSelected.id).toPromise();
      const temp = GLOBAL.duplicarJson(this.facturas);

      this.facturas = [];
      temp[this.indexSelected].estado = false;
      temp[this.indexSelected].select = false;
      this.facturas = temp;
    } catch (error) {
      console.error(error);
    }
  }
}
