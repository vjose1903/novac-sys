import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { ObservableServcie } from '../../core/services/observables.service';
import { DBservice } from '../../core/services/bdservice.service';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalService } from '../../components/modal/modal.service';
import { GLOBAL } from '../../core/services/GLOBAL';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss'],
})
export class InventarioComponent implements OnInit {
  [x: string]: any;
  // =============================================
  //  TABLAS
  // =============================================

  info = [
    {
      titulo: 'Cod.',
      key: 'codigo',
    },
    {
      titulo: 'Articulo',
      key: 'nombre',
    },
    {
      titulo: 'Cantidad',
      key: 'cantidades',
      cantidades: true,
    },
    {
      titulo: 'Precio',
      key: 'precio_principal',
      formatoNumero: true,
    },
  ];
  botones = {
    titulo: true,
    inventario: true,
  };
  listaArticulos;
  costoTotal: number;
  gananciaTotal: number;
  constructor(
    private artServ: ObservableServcie,
    private dbServ: DBservice,
    private cdRef: ChangeDetectorRef,
    private fb: FormBuilder,
    private actRou: ActivatedRoute,
    private router: Router,
    private mServ: ModalService,
  ) {}

  ngOnInit() {
    this.necesarioParaEmpezar();
    // this.formatearNum(15421545.54165);
  }

  formatoNumero(num) {
    return GLOBAL.formatearNumero(GLOBAL.redondearAdos(num));
  }

  async necesarioParaEmpezar() {
    await this.getArticulos();
    await this.calcularGananciasCostos();
  }
  async getArticulos() {
    try {
      this.listaArticulos = await this.dbServ.getArticulos().toPromise();
      this.listaArticulos.sort((a, b) => {
        return a.id > b.id ? 1 : -1;
      });
    } catch (error) {}
  }
  calcularGananciasCostos() {
    this.costoTotal = 0;
    this.gananciaTotal = 0;
    for (let i = 0; i < this.listaArticulos.length; i++) {
      const articulo = this.listaArticulos[i];
      const costo = articulo.costo_principal;
      const precio = articulo.precio_principal;
      const cantidad = articulo.cantidades[articulo.medida];

      this.costoTotal += costo * cantidad;
      this.gananciaTotal += precio * cantidad;
    }
  }
  movimientoInventario(arg) {
    console.log(arg);

    this.indexBorrar = arg.INDEX;
    this.mServ.modalTipo('inventario');
    this.tipoModal = 'inventario';
    this.seleccionModal = arg.ARG;
    this.mServ.ModalSeleccion(arg.ARG);
    this.mServ.mostrarModal(true);
  }
}
