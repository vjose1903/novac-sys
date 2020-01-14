import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ObservableServcie } from '../../core/services/observables.service';
import { DBservice } from '../../core/services/bdservice.service';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalService } from '../../components/modal/modal.service';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss'],
})
export class InventarioComponent implements OnInit {
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
    borrar: true,
    editar: true,
  };
  listaArticulos;
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
    this.dbServ.getArticulos().subscribe(res => {
      res.sort((a, b) => {
        return a.id > b.id ? 1 : -1;
      });

      if (res !== undefined && res !== null) {
        this.listaArticulos = res;
      }
    });
  }
  movimientoInventario() {}
}
