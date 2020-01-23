import { Component, OnInit } from '@angular/core';
import { ModalService } from '../../components/modal/modal.service';
import { ObservableServcie } from '../../core/services/observables.service';
import { DBservice } from '../../core/services/bdservice.service';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';

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
  constructor(private mServ: ModalService, private obsServ: ObservableServcie, private dbServ: DBservice, private fb: FormBuilder) {}

  ngOnInit() {
    this.necesarioStar();
    this.mServ.OBJDEVUELTO.subscribe(res => {
      if (res && res.tipoModal === 'buscarCliente') {
        this.clienteAdepositar = res;
        (document.getElementById('clienteI') as any).value = res.nombre;
      }
    });
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
