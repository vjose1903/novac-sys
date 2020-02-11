import { Component, OnInit } from '@angular/core';
import { DBservice } from '../../../core/services/bdservice.service';
import { ModalService } from '../../../components/modal/modal.service';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { GLOBAL } from '../../../core/services/GLOBAL';

@Component({
  selector: 'app-buscar-factura',
  templateUrl: './buscar-factura.component.html',
  styleUrls: ['./buscar-factura.component.scss'],
})
export class BuscarFacturaComponent implements OnInit {
  facturas: any;
  campoSelected: string;
  sub: Subscription;
  clienteBuscado: any;
  listaClientes: unknown;
  constructor(private dbServ: DBservice, private mServ: ModalService) {}
  campo = null;
  placeHolder = '';

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
