import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalService } from '../components/modal/modal.service';
import { ObservableServcie } from '../../core/services/observables.service';
import { DBservice } from '../../core/services/bdservice.service';
import { FormBuilder } from '@angular/forms';
import { map } from 'rxjs/operators';
import { GLOBAL } from '../../core/services/GLOBAL';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-conduce',
  templateUrl: './conduce.component.html',
  styleUrls: ['./conduce.component.scss'],
})
export class ConduceComponent implements OnInit, OnDestroy {
  listaClientes;
  sub: Subscription;
  cliente: any;
  constructor(private mServ: ModalService, private obsServ: ObservableServcie, private dbServ: DBservice, private fb: FormBuilder) {}

  ngOnInit() {
    this.necesarioStar();
    this.sub = this.mServ.OBJDEVUELTO.subscribe((res) => {
      if (res && res.tipoModal === 'buscarCliente') {
        this.cliente = res;
        (document.getElementById('clienteI') as any).value = res.nombre;

        this.BuscarFacturasAdelantadas(res.id);
        this.mServ.ModalObj(undefined);
      }
      // else if (res && res.tipoModal === 'cambio') {
      //   this.Devuelta = res.devuelta;
      //   this.forma_pago = res.forma_pago;
      //   this.sendIngreso();
      //   this.mServ.ModalObj(undefined);
      // }
    });
  }
  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
  async necesarioStar() {
    await this.pedirClientes();
    // await this.getArticulos();

    this.enfocarInput('clienteI');
  }
  enfocarInput(arg) {
    const element = document.getElementById(arg) as HTMLElement;
    element.focus();
  }

  async BuscarFacturasAdelantadas(id) {
    try {
      const facturas_adelantadas = await this.dbServ.getFacturasByParams('1', id, 0, true).toPromise();
      console.log(facturas_adelantadas);
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

    this.listaClientes['filtrarCliente'] = nombre;
    this.mServ.ModalSeleccion(this.listaClientes);

    this.mServ.mostrarModal(true);
  }
}
