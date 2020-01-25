import { Component, OnInit } from '@angular/core';
import { ModalService } from '../../components/modal/modal.service';
import { ObservableServcie } from '../../core/services/observables.service';
import { DBservice } from '../../core/services/bdservice.service';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';
import { GLOBAL } from '../../core/services/GLOBAL';
import * as moment from 'moment';

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss'],
})
export class IngresosComponent implements OnInit {
  element: any;
  listaClientes: unknown;
  clienteAdepositar: any;
  tipoIngreso: any;
  Facturas: any;

  // =============================================
  //  TABLAS
  // =============================================

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
      titulo: 'Total tactura',
      key: 'total_factura',
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
    {
      titulo: 'Pago Total',
      tipo: 'check',
      key: 'pagoT',
      disable: {
        getDisabled: true,
        campo: 'select',
      },
      title: '',
    },
    {
      titulo: 'Monto a pagar',
      tipo: 'input',
      key: 'monto',
      checkNumber: true,
      disable: {
        getDisabled: true,
        campo: 'select',
        campo2: 'pagoT',
      },
      title: '',
    },
  ];

  constructor(private mServ: ModalService, private obsServ: ObservableServcie, private dbServ: DBservice, private fb: FormBuilder) {}

  ngOnInit() {
    this.necesarioStar();
    this.mServ.OBJDEVUELTO.subscribe(res => {
      if (res && res.tipoModal === 'buscarCliente') {
        this.clienteAdepositar = res;
        (document.getElementById('clienteI') as any).value = res.nombre;
        this.pedirFacturasPorCliente(res.id);
      }
    });
  }

  formatoNumero(num) {
    return GLOBAL.formatearNumero(GLOBAL.redondearAdos(num));
  }

  preuba(o) {
    console.log(o);
  }

  async pedirFacturasPorCliente(cliente_id) {
    try {
      this.Facturas = await this.dbServ
        .getFacturasByClienteIdAndPagada(cliente_id, false)
        .pipe(
          map(
            fact =>
              (fact = fact.map(val => {
                val.secuencia = _.padStart(val.numero_factura, 5, '0');
                val.fecha = moment(val.fecha_facturacion).format('DD-MM-YYYY');
                val.select = false;
                val.pagoT = true;
                val.monto = GLOBAL.formatearNumero(GLOBAL.redondearAdos(val.total_factura));
                return val;
              })),
          ),
        )
        .toPromise();
    } catch (error) {
      console.error(error);
      this.dbServ.toastError(error, 'ERROR');
    }
  }
  async necesarioStar() {
    await this.pedirClientes();
    await this.quitarContadoDeLista();

    this.enfocarInput('tipo_recibo');
  }
  async pedirClientes() {
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

  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.focus();
  }
  selectContenido(arg) {
    this.element = document.getElementById(arg);
    this.element.select();
  }

  quitarContadoDeLista() {
    const temp = JSON.parse(JSON.stringify(this.listaClientes));
    this.listaClientes = [];
    const cliente = temp.filter(cli => cli.nombre === 'Cliente contado');
    const index = _.indexOf(temp, cliente[0]);

    _.pullAt(temp, index);
    this.listaClientes = temp;
  }

  abrirModalFiltro(nombre) {
    this.mServ.modalTipo('buscarCliente');
    this.listaClientes['filtrarCliente'] = nombre;
    this.mServ.ModalSeleccion(this.listaClientes);

    this.mServ.mostrarModal(true);
  }

  saltar(campo, valor?) {
    this.enfocarInput(campo);
    this.tipoIngreso = valor;
  }
}
