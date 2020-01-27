import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalService } from '../../components/modal/modal.service';
import { ObservableServcie } from '../../core/services/observables.service';
import { DBservice } from '../../core/services/bdservice.service';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';
import { GLOBAL } from '../../core/services/GLOBAL';
import * as moment from 'moment';
import { TablasComponent } from '../../components/tablas/tablas.component';

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
  tipo_recibo;
  facturas_selected = [];
  @ViewChild(TablasComponent, { static: false }) tablas: TablasComponent;
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
  tipoFacturas: Promise<any>;
  AllSelected = false;

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

  getIcon() {
    if (this.AllSelected) {
      return { icon: 'fa-check-square', tooltip: 'Deseleccionar Todos' };
    } else {
      return { icon: 'fa-square', tooltip: 'Seleccionar Todos' };
    }
  }
  selectAll() {
    this.AllSelected = !this.AllSelected;
    let select = false;
    if (this.AllSelected) {
      select = false;
    } else {
      select = true;
    }
    this.Facturas.forEach((fact, j) => {
      if (select) {
        if (fact.select) {
          this.Facturas[j].pagoT = true;
          this.Facturas[j].select = false;
          this.tablas.resetInput('total_factura', 'monto', j, true);

          const i = this.facturas_selected.indexOf(fact);
          _.pullAt(this.facturas_selected, i);
        }
      } else {
        if (!fact.select) {
          this.Facturas[j].select = true;
          this.facturas_selected.push(fact);
        }
      }
    });
    console.log(this.facturas_selected);
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
    await this.getTipoFacturas();

    this.enfocarInput('tipo_recibo');
  }
  async getTipoFacturas() {
    try {
      this.tipoFacturas = await this.dbServ.getTiposRecibos().toPromise();
      console.log(this.tipoFacturas);
    } catch (error) {
      console.error(error);
    }
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

  abilitarBtnConfirmar() {
    let res = true;
    if (this.tipo_recibo === 'Pago factura') {
      if (this.facturas_selected.length > 0) {
        res = false;
      }
    } else {
    }
    return res;
  }

  cancelarIgreso() {}
  confirmarIgreso() {}

  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.focus();
  }
  selectContenido(arg) {
    this.element = document.getElementById(arg);
    this.element.select();
  }

  getInfoChange(item) {
    if (item.cambio === 'pagoT' && item.value) {
      this.tablas.resetInput('total_factura', 'monto', item.index, true);
      this.modificarFacturaSelected(item);
    }
    if (item.cambio === 'select') {
      if (!item.value) {
        this.Facturas[item.index].pagoT = true;
        this.tablas.resetInput('total_factura', 'monto', item.index, true);

        const i = this.facturas_selected.indexOf(item.body[item.index]);
        _.pullAt(this.facturas_selected, i);
      } else {
        this.facturas_selected.push(item.body[item.index]);
      }
    }

    if (item.cambio === 'monto') {
      if (!item.value) {
        this.dbServ.toastWarning('Debe de introducir un Monto', 'AVISO');
        this.tablas.enfocarInput('input-' + item.index);
      }
      const total = item.body[item.index].total_factura;
      const monto = GLOBAL.desformatear(item.value);

      if (monto > total) {
        this.dbServ.toastWarning('Monto no puede ser mayor al total de la factura', 'AVISO');
        this.tablas.enfocarInput('input-' + item.index);
      }
      this.modificarFacturaSelected(item);
    }
    console.log(this.facturas_selected);
  }

  modificarFacturaSelected(item) {
    const index = _.findIndex(this.facturas_selected, (fact: any) => {
      return fact.id === item.body[item.index].id;
    });
    if (index !== -1) {
      this.facturas_selected[index] = item.body[item.index];
    }
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
