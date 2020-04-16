import { Component, OnInit, ChangeDetectorRef, ViewChild, OnDestroy } from '@angular/core';
import { ObservableServcie } from '../../core/services/observables.service';
import { DBservice } from '../../core/services/bdservice.service';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GLOBAL } from '../../core/services/GLOBAL';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { ModalService } from '../components/modal/modal.service';
@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss'],
})
export class InventarioComponent implements OnInit, OnDestroy {
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
  tipo_articulos;
  indexSelected: any;
  tipoModal: string;
  seleccionModal: any;
  filtrado = false;
  filtro;
  restarFiltro: any;
  subDeci: Subscription;
  constructor(
    private artServ: ObservableServcie,
    private dbServ: DBservice,
    private cdRef: ChangeDetectorRef,
    private fb: FormBuilder,
    private actRou: ActivatedRoute,
    private router: Router,
    private mServ: ModalService,
  ) {}

  async ngOnInit() {
    this.necesarioParaEmpezar();
    this.dbServ.getTipoArticulos().subscribe(res => {
      this.tipo_articulos = res;
    });

    this.subDeci = this.mServ.DECISIONMODAL.subscribe(res => {
      if (res !== null && res !== undefined) {
        this.decisionModal(res);
      }
    });
  }
  ngOnDestroy() {
    this.subDeci.unsubscribe();
  }
  formatoNumero(num) {
    return GLOBAL.formatearNumero(GLOBAL.redondearAdos(num));
  }

  async necesarioParaEmpezar() {
    await this.getArticulos();
    await this.calcularGananciasCostos();
    this.restarFiltro = GLOBAL.duplicarJson(this.listaArticulos);
    this.filtro = '0';
  }
  async getArticulos() {
    try {
      this.listaArticulos = await this.dbServ.getArticulos().toPromise();
      this.listaArticulos.sort((a, b) => {
        return a.id > b.id ? 1 : -1;
      });
    } catch (error) {}
  }

  filtrarArticulos() {
    if (this.filtro === 'todos' && this.filtrado === true) {
      this.listaArticulos = this.restarFiltro;
      this.filtrado = false;
    }

    if (this.filtro !== 'todos') {
      this.listaArticulos = GLOBAL.duplicarJson(this.restarFiltro);
      // this.listaArticulos.slice(0);
      this.listaArticulos = this.listaArticulos.filter(val => val.tipo_articulo_id === _.parseInt(this.filtro));
      this.filtrado = true;
    }
    this.calcularGananciasCostos();
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
    this.indexSelected = arg.INDEX;
    this.mServ.modalTipo('inventario');
    this.tipoModal = 'inventario';
    this.seleccionModal = arg.ARG;
    this.mServ.ModalSeleccion(arg.ARG);
    this.mServ.mostrarModal(true);
  }

  async decisionModal(arg) {
    if (arg.bool) {
      const temp = JSON.parse(JSON.stringify(this.listaArticulos));
      this.listaArticulos = undefined;

      temp[this.indexSelected] = [];

      temp[this.indexSelected] = JSON.parse(JSON.stringify(arg.body));
      this.listaArticulos = JSON.parse(JSON.stringify(temp));
    }
  }
}
