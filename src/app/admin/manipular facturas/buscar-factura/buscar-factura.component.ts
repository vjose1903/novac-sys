import { Component, OnInit, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { DBservice } from '../../../core/services/bdservice.service';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { GLOBAL } from '../../../core/services/GLOBAL';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { TablasComponent } from '../../components/tablas/tablas.component';
import { ModalService } from '../../components/modal/modal.service';
import { obj_paginate, TablasService } from '../../components/tablas/tablas.service';
@Component({
  selector: 'app-buscar-factura',
  templateUrl: './buscar-factura.component.html',
  styleUrls: ['./buscar-factura.component.scss'],
})
export class BuscarFacturaComponent implements OnInit, OnDestroy {
  facturas: any;
  campoSelected: string;
  clienteBuscado: any;
  listaClientes: unknown;
  facturaSelected: any;
  @ViewChild(TablasComponent, { static: false }) tablas: TablasComponent;
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

  sub: Subscription;
  subDeci: Subscription;
  subEsc: Subscription;

  constructor(private dbServ: DBservice, private mServ: ModalService, private route: ActivatedRoute, private router: Router, private tServ: TablasService) {}
  campo = null;
  placeHolder = '';
  info = [
    {
      titulo: ' ',
      key: 'estatus',
      text_color: 'colorEstado',
      isIcon: true,
      color: true,
      customClass: true,
      estilos: [{ width: '2rem' }],
    },
    {
      titulo: 'Numero Fact',
      key: 'secuencia',
    },
    {
      titulo: 'Tipo',
      key: 'tipo_factura',
    },
    {
      titulo: 'Comprobante',
      key: 'numero_comprobante',
    },
    {
      titulo: 'Condicion',
      key: 'condicion',
    },
    {
      titulo: 'Fecha Facturacion',
      key: 'fecha',
    },
    {
      titulo: 'Fecha Vencimiento',
      key: 'fechaV',
    },
    {
      titulo: 'Total facturado',
      key: 'total_factura',
      formatoNumero: true,
    },
    {
      titulo: 'Balance tactura',
      key: 'balance',
      formatoNumero: true,
    },

    {
      titulo: 'Seleccione',
      key: 'select',
      text_color: 'selectColor',
      isIcon: true,
      color: true,
    },

    // {
    //   titulo: 'Seleccione',
    //   tipo: 'check',
    //   key: 'select',

    //   disable: {
    //     getDisabled: false,
    //     campo: '',
    //   },
    //   title: '',
    // },
  ];
  ncfMask = [/b/, /[0-9]/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/];

  obj_paginate_ = obj_paginate;

  ngOnInit() {
    this.BuscarPara = this.route.snapshot.params['para'];
    if (this.BuscarPara === 'nota_credito') {
      this.tipo_factu_nota = '04';
    } else {
      this.tipo_factu_nota = '03';
    }
    this.necesarioStart();
    this.completarTituloPag();

    this.subEsc = this.mServ.PRESSESC.subscribe((res) => {
      if (res !== undefined && res !== null) {
        this.enfocarInput('valorI');
      }
    });

    this.sub = this.mServ.OBJDEVUELTO.subscribe((res) => {
      if (res && res.tipo_modal === 'buscarCliente') {
        this.clienteBuscado = res.data;
        (document.getElementById('valorI') as any).value = res.data.nombre;
        this.pedirFacturaModal('1', res.data.id);
        this.mServ.ModalObj(undefined);
      }
    });

    this.subDeci = this.mServ.DECISIONMODAL.subscribe((res) => {
      console.log('res ', res);
      console.log('tipoModal ', this.tipoModal);

      if (res) {
        if (this.tipoModal === 'mostrarFactura') {
          if (this.BuscarPara === 'anular_factura') {
            this.facturaSelected['identificadorFact'] =
              this.campo === '2'
                ? ' con el comprobante fiscal ' + this.facturaSelected.numero_comprobante
                : ' con el numero de factura ' + this.formatoNumeroFactura(this.facturaSelected.numero_factura);
            setTimeout(() => {
              this.abrirModal(this.facturaSelected, 'cancelar');
            }, 10);
          } else {
            this.mServ.ModalDecision(undefined);
            const url = `/admin/nota/${this.BuscarPara === 'nota_credito' ? 'credito' : 'debito'}/${this.facturaSelected.id}`;
            this.router.navigateByUrl(url);
          }
        } else if (this.tipoModal === 'cancelarBusqueda') {
          this.decisionesModal();
        }
      } else {
        if (this.tipoModal === 'cancelar') {
          setTimeout(() => {
            this.abrirModal(this.facturas[0], 'mostrarFactura');
          }, 10);
        }
      }
    });
  }

  async getPaqueteComprobante() {
    try {
      const TipoFact = this.lista_tipos_facturas.filter((tipo) => tipo.referencia === this.tipo_factu_nota);
      const paquete = await this.dbServ.getPaquetesNCF(TipoFact[0].id).toPromise();
      this.paqueteComprobante = paquete.body;

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
          this.dbServ.toastWarning(msg, 'AVISO');
        }
      }
    } catch (error) {
      this.existenComprobantes = true;
      console.error(error);
      this.dbServ.toastError(error.error.msg, 'ERROR');
    }
  }
  completarTituloPag() {
    console.log(this.BuscarPara);
    if (this.BuscarPara === 'anular_factura') {
      this.Para = ' Anular factura';
    } else if (this.BuscarPara === 'nota_credito') {
      this.Para = ' Nota de crédito';
    } else if (this.BuscarPara === 'nota_debito') {
      this.Para = ' Nota de débito';
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.subDeci.unsubscribe();
    this.subEsc.unsubscribe();
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

    if (this.BuscarPara !== 'anular_factura') {
      await this.getPaqueteComprobante();
    }

    this.enfocarInput('campoI');
  }

  mostrarListaFacturas() {
    let res = false;
    if (this.facturas && this.facturas.length > 0) {
      if (this.campo === '1') {
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

  async pedirFactura(campo, valor) {
    try {
      console.log('campo ', campo);

      this.facturas = undefined;
      const busqueda = await this.dbServ.getFacturasByParams(campo, valor, this.tipo_factura_id).toPromise();
      this.facturas = GLOBAL.duplicarJson(busqueda);
      console.log(this.facturas);

      if (this.facturas.length > 0) {
        this.facturas[0]['mostrarFacturaPara'] = this.BuscarPara;
        this.facturaSelected = this.facturas[0];
        this.abrirModal(this.facturas[0], 'mostrarFactura');
      } else {
        this.dbServ.toastError('La factura buscada no existe', 'ERROR');
      }
    } catch (error) {
      console.error(error);
    }
  }
  async pedirFacturaModal(campo, valor) {
    try {
      const fechaA = moment().format('YYYY-MM-DD');
      this.facturas = undefined;

      const busqueda = await this.dbServ
        .getFacturasByParams(campo, valor, this.tipo_factura_id)
        .pipe(
          map(
            (fact) =>
              (fact = fact.map((val) => {
                val.secuencia = _.padStart(val.numero_factura, 8, '0');
                val.fecha = moment(val.fecha_equivalente).format('DD-MM-YYYY');
                val.fechaV = moment(val.fecha_vencimiento).isValid() ? moment(val.fecha_vencimiento).format('DD-MM-YYYY') : '';
                val.pagoT = true;
                val.estatus = val.estado ? 'fas fa-check' : 'fas fa-times';
                val.monto = GLOBAL.formatearNumero(GLOBAL.redondearAdos(val.balance));
                val.pago_a_tiempo = val.fecha_vencimiento > fechaA ? true : false;
                val.colorEstado = val.estado ? 'green' : 'red';
                val.selectColor = 'gris-claro';
                val.select = 'far fa-eye-slash';

                val.iconsMoveEvents = [{ key: 'select', hover: ['fa-eye', 'text-black'], leave: ['fa-eye-slash', 'text-gris-claro'] }];
                val.customStyles = [{ select: { estilos: [{ 'font-size': '1.5rem' }] } }, { 'td-estatus': { estilos: [{ width: '2rem' }] } }];

                return val;
              })),
          ),
        )
        .toPromise();
      busqueda.sort((a, b) => {
        return a.id > b.id ? 1 : -1;
      });
      this.facturas = GLOBAL.duplicarJson(busqueda);

      if (this.facturas.length === 0) {
        if (this.campo === '1') {
          if (this.tipo_factura_id === '0') {
            this.dbServ.toastError('Este cliente no tiene facturas a su nombre', 'ERROR');
          } else {
            this.dbServ.toastError('Este cliente no tiene facturas del tipo seleccionada', 'ERROR');
          }
        } else if (this.campo === '3') {
          this.dbServ.toastError('No existen facturas con este numero.', 'ERROR');
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  async abrirModalFiltro(nombre) {
    this.mServ.modalTipo('buscarCliente');
    this.tipoModal = 'buscarCliente';

    const obj = {
      data: this.listaClientes,
      filtrarCliente: nombre,
    };

    this.mServ.ModalSeleccion(obj);

    this.mServ.mostrarModal(true);
    this.mServ.ModalTablaHeight(true);
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
    }
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

  abrirModal(arg, tipo) {
    const obj = arg;
    this.tipoModal = tipo;
    this.mServ.modalTipo(tipo);
    this.mServ.ModalSeleccion(obj);
    this.mServ.mostrarModal(true);
  }
  borrar() {
    this.tipoModal = null;
    this.NCF = null;
    this.facturas = undefined;
    (document.getElementById('valorI') as any).value = null;
    this.tipo_factura_id = null;
    this.campo = null;
    this.enfocarInput('campoI');
  }

  selectFactura(item) {
    console.log(item);

    if (item.column === 'select') {
      this.facturaSelected = undefined;

      // this.facturas.forEach((fact, j) => {
      //   if (j !== item.index) {
      //     if (fact.select) {
      //       this.facturaSelected = undefined;
      //     }
      //   }
      // });
      this.facturaSelected = this.facturas[item.index];
      this.indexSelected = item.index;

      this.facturaSelected['FACTURA_DE'] = 'venta';
      this.facturaSelected['mostrarFacturaPara'] = this.BuscarPara;
      this.abrirModal(this.facturaSelected, 'mostrarFactura');
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
            this.pedirFactura(this.campo, valor);
          } else {
            this.dbServ.toastWarning('Numero de comprobante incorrecto', 'Aviso');
          }
        } else {
          if (this.tipo_factura_id === '0') {
            this.pedirFacturaModal(this.campo, valor);
            console.log('aqui');
          } else {
            this.pedirFactura(this.campo, valor);
          }
        }
      } else {
        this.enfocarInput(campo);
      }
    }
  }
  formatoNumeroFactura(num) {
    return _.padStart(num, 8, '0');
  }
  enfocarInput(arg) {
    const element = document.getElementById(arg) as HTMLElement;
    element.focus();
  }
  desEnfocarInput(arg) {
    const element = document.getElementById(arg) as HTMLElement;
    element.blur();
  }
  selectContenido(arg) {
    const element = document.getElementById(arg) as any;
    element.select();
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
    console.log('cancelando');

    try {
      const res = await this.dbServ.cancelarFactura(this.facturaSelected.id).toPromise();
      const temp = GLOBAL.duplicarJson(this.facturas);

      this.facturas = [];
      temp[this.indexSelected].estado = false;
      temp[this.indexSelected].select = false;
      this.facturas = temp;
      console.log(res);
    } catch (error) {
      console.error(error);
    }
  }
}
