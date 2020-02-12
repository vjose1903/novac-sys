import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { DBservice } from '../../../core/services/bdservice.service';
import { ModalService } from '../../../components/modal/modal.service';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { GLOBAL } from '../../../core/services/GLOBAL';
import * as _ from 'lodash';
import * as moment from 'moment';
import { TablasComponent } from '../../../components/tablas/tablas.component';
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
  clienteBuscado: any;
  listaClientes: unknown;
  facturaSelected: any;
  @ViewChild(TablasComponent, { static: false }) tablas: TablasComponent;
  constructor(private dbServ: DBservice, private mServ: ModalService) {}
  campo = null;
  placeHolder = '';
  info = [
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
      color: true,
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
  ngOnInit() {
    this.necesarioStart();
    this.sub = this.mServ.OBJDEVUELTO.subscribe(res => {
      if (res && res.tipoModal === 'buscarCliente') {
        this.clienteBuscado = res;
        (document.getElementById('valorI') as any).value = res.nombre;
        this.pedirFactura('1', res.id);
        this.mServ.ModalObj(undefined);
      }
    });
    this.subDeci = this.mServ.DECISIONMODAL.subscribe(res => {
      console.log(res);

      if (res) {
        this.borrar();
        this.mServ.ModalDecision(undefined);
      }
    });
  }
  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.subDeci.unsubscribe();
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
                val.monto = GLOBAL.formatearNumero(GLOBAL.redondearAdos(val.balance));
                val.pago_a_tiempo = val.fecha_vencimiento > fechaA ? true : false;
                val.text_color = val.fecha_vencimiento < fechaA ? 'red' : 'black';
                return val;
              })),
          ),
        )
        .toPromise();
      this.facturas.sort((a, b) => {
        return a.id > b.id ? 1 : -1;
      });
      console.log(this.facturas);
    } catch (error) {
      console.error(error);
    }
  }

  abrirModalFiltro(nombre) {
    this.mServ.modalTipo('buscarCliente');

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
    this.mServ.modalTipo(tipo);
    this.mServ.ModalSeleccion(obj);
    this.mServ.mostrarModal(true);
  }

  borrar() {
    this.facturas = undefined;
    (document.getElementById('valorI') as any).value = null;
    this.campo = null;
    this.enfocarInput('campoI');
  }
  selectFactura(item) {
    if (!item.value) {
      this.facturaSelected = undefined;
    } else {
      this.facturas.forEach((fact, j) => {
        if (j !== item.index) {
          if (fact.select) {
            this.facturas[j].select = false;
            this.facturaSelected = undefined;
          }
        } else {
          this.facturaSelected = this.facturas[item.index];
        }
      });
    }
  }

  confirmarSeleccion() {
    this.abrirModal(this.facturaSelected, 'mostrarFactura');
  }

  saltar(campo, valor) {
    if (valor) {
      console.log(`campo ${campo}`);
      console.log(`valor ${valor}`);

      if (campo === 'cliente') {
        this.abrirModalFiltro(valor);
      } else if (campo === 'buscarFactura') {
      } else {
        this.enfocarInput(campo);
      }
    }
  }
  enfocarInput(arg) {
    const element = document.getElementById(arg) as HTMLElement;
    element.focus();
  }
  selectContenido(arg) {
    const element = document.getElementById(arg) as any;
    element.select();
  }
}
