import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { DBservice } from '../../../core/services/bdservice.service';
import { ModalService } from '../../../components/modal/modal.service';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { GLOBAL } from '../../../core/services/GLOBAL';
import * as _ from 'lodash';
import * as moment from 'moment';
import { TablasComponent } from '../../../components/tablas/tablas.component';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'app-buscar-factura',
  templateUrl: './buscar-factura.component.html',
  styleUrls: ['./buscar-factura.component.scss'],
})
export class BuscarFacturaComponent implements OnInit, OnDestroy {
  facturas: any;
  campoSelected: string;
  sub: Subscription;
  subDeci: Subscription;
  subEsc: Subscription;
  clienteBuscado: any;
  listaClientes: unknown;
  facturaSelected: any;
  @ViewChild(TablasComponent, { static: false }) tablas: TablasComponent;
  BuscarPara: any;
  NCF;
  Para: string;
  tipoModal: any;
  indexSelected: any;
  constructor(private dbServ: DBservice, private mServ: ModalService, private route: ActivatedRoute, private router: Router) {}
  campo = null;
  placeHolder = '';
  info = [
    {
      titulo: '',
      key: 'estado_',
      isIcon: true,
      color: true,
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
      titulo: 'Fecha Facturacion',
      key: 'fecha',
    },
    {
      titulo: 'Fecha Vencimiento',
      key: 'fechaV',
    },
    {
      titulo: 'Total tacturado',
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
      tipo: 'check',
      key: 'select',

      disable: {
        getDisabled: false,
        campo: '',
      },
      title: '',
    },
  ];
  ncfMask = [/b/, /[0-9]/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/];
  ngOnInit() {
    this.necesarioStart();
    this.BuscarPara = this.route.snapshot.params['para'];
    this.completarTituloPag();

    this.subEsc = this.mServ.PRESSESC.subscribe(res => {
      console.log('press esc');
      
      if (res !== undefined && res !== null) {

        this.enfocarInput('valorI' );
      }
    });

    this.sub = this.mServ.OBJDEVUELTO.subscribe(res => {
      if (res && res.tipoModal === 'buscarCliente') {
        console.log(res);

        this.clienteBuscado = res;
        (document.getElementById('valorI') as any).value = res.nombre;
        this.pedirFacturaModal('1', res.id);
        this.mServ.ModalObj(undefined);
      }
    });

    this.subDeci = this.mServ.DECISIONMODAL.subscribe(res => {
      if (res) {
        if (this.tipoModal === 'mostrarFactura') {
          if (this.BuscarPara === 'cancelar_factura') {
            this.facturaSelected['identificadorFact'] =
              this.campo === '2'
                ? ' con el comprobante fiscal ' + this.facturaSelected.numero_comprobante
                : ' con el numero de factura ' + this.formatoNumeroFactura(this.facturaSelected.numero_factura);
            setTimeout(() => {
              this.abrirModal(this.facturaSelected, 'cancelar');
            }, 10);
          } else {
            const url = `/admin/nota/${this.BuscarPara === 'nota_credito' ? 'credito' : 'debito'}/${this.facturaSelected.id}`;
            this.router.navigateByUrl(url);
          }
        } else if (this.tipoModal === 'cancelar') {
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

  completarTituloPag() {
    if (this.BuscarPara === 'cancelar_factura') {
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

  async necesarioStart() {
    await this.getClientes();
    this.enfocarInput('campoI');
  }
  async getClientes() {
    try {
      this.listaClientes = await this.dbServ
        .getClientes()
        .pipe(
          map(
            cliente =>
              (cliente = cliente.map(cli => {
                cli.nombre = GLOBAL.Capitalice(cli.nombre);
                cli.apellido = GLOBAL.Capitalice(cli.apellido);
                cli.documentos_de_identidad.map(docu => {
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

  async pedirFactura(campo, valor) {
    try {
      this.facturas = await this.dbServ.getFacturasByParams(campo, valor).toPromise();

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
      this.facturas = await this.dbServ
        .getFacturasByParams(campo, valor)
        .pipe(
          map(
            fact =>
              (fact = fact.map(val => {
                val.secuencia = _.padStart(val.numero_factura, 5, '0');
                val.fecha = moment(val.fecha_facturacion).format('DD-MM-YYYY');
                val.fechaV = moment(val.fecha_vencimiento).format('DD-MM-YYYY');
                val.select = false;
                val.pagoT = true;
                val.estado_ = val.estado ? 'fas fa-check' : 'fas fa-times';
                val.monto = GLOBAL.formatearNumero(GLOBAL.redondearAdos(val.balance));
                val.pago_a_tiempo = val.fecha_vencimiento > fechaA ? true : false;
                val.text_color = val.estado ? 'green' : 'red';
                return val;
              })),
          ),
        )
        .toPromise();
      this.facturas.sort((a, b) => {
        return a.id > b.id ? 1 : -1;
      });
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

  changeSelect(valor) {
    if (valor === '1') {
      this.campoSelected = 'Cliente';
      this.placeHolder = 'Nombre Cliente';
    } else if (valor === '2') {
      this.campoSelected = 'Numero Comprobante';
      this.placeHolder = 'Escriba numero de comprobante';
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
    this.campo = null;
    this.enfocarInput('campoI');
  }
  selectFactura(item) {
    console.log(item);
    if (!item.value) {
      this.facturaSelected = undefined;
    } else {
      this.facturas.forEach((fact, j) => {
        if (j !== item.index) {
          if (fact.select) {
            this.facturas[j].select = false;
            this.facturaSelected = undefined;
          }
        }
      });
      this.facturaSelected = this.facturas[item.index];
      this.indexSelected = item.index;
    }
  }

  confirmarSeleccion() {
    this.facturaSelected['mostrarFacturaPara'] = this.BuscarPara;
    this.abrirModal(this.facturaSelected, 'mostrarFactura');
  }
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
        this.abrirModalFiltro(valor);
        this.desEnfocarInput('valorI');
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
          this.pedirFactura(this.campo, valor);
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
    if (this.BuscarPara === 'cancelar_factura') {
      this.CancelarFactura();
    } else if (this.BuscarPara === 'nota_credito') {
    } else if (this.BuscarPara === 'nota_debito') {
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
