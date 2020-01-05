import { Component, OnInit } from '@angular/core';
import { ObservableServcie } from '../../core/services/observables.service';
import { DBservice } from '../../core/services/bdservice.service';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { ModalService } from '../../components/modal/modal.service';

@Component({
  selector: 'app-produccion',
  templateUrl: './produccion.component.html',
  styleUrls: ['./produccion.component.scss'],
})
export class ProduccionComponent implements OnInit {
  listaArticulos: any;
  articulo_id;
  articuloSelected: any;
  ingredientes = [];
  medidas = {
    Libra: 'Libras',
    Quintal: 'Quintales',
    Caja: 'Cajas',
    Paquete: 'Paquetes',
    Unidad: 'Unidades',
  };
  element: HTMLElement;
  optionsAlerta = ['Quintal', 'Libra'];
  constructor(private artServ: ObservableServcie, private dbServ: DBservice, private fb: FormBuilder, private actRou: ActivatedRoute, private router: Router, private mServ: ModalService) {}
  formatearNumero(nStr) {
    if (nStr !== undefined) {
      nStr += '';
      const x = nStr.split('.');
      let x1 = x[0];
      const x2 = x.length > 1 ? '.' + x[1] : '';
      const rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
      }
      return x1 + x2;
    }
  }

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
  filtroFormula(item) {
    return item.tipo_articulo_id === 3;
  }
  getIngredients() {
    const tempArticulo = this.listaArticulos.filter(val => val.id === _.parseInt(this.articulo_id));
    this.articuloSelected = tempArticulo[0];
    const tempIngredientes = tempArticulo[0].formulas_productos_terminados;

    tempIngredientes.forEach(ingrediente => {
      const tempIngre = this.listaArticulos.filter(val => val.id === _.parseInt(ingrediente.articulo_combo));
      const ingre = tempIngre[0];
      this.ingredientes.push({
        nombre: ingre.nombre,
        cantidad: ingrediente.cantidad,
        existencia: ingre.cantidades,
        contenido: ingre.contendido,
      });
    });
    console.log(this.articuloSelected);
    console.log(this.ingredientes);
  }

  lookOters(objeto) {
    const keys = _.keys(objeto);
    const values = _.values(objeto);

    const fin = values[0] > 1 ? this.medidas[keys[0]] : keys[0];
    const fin1 = values[1] > 1 ? this.medidas[keys[1]] : keys[1];
    const fin2 = values[2] > 1 ? this.medidas[keys[2]] : keys[2];

    const principal = this.formatearNumero(values[0]) + '  ' + fin;

    const padre = this.formatearNumero(values[1]) + '  ' + fin1;
    const hijo = this.formatearNumero(values[2]) + '  ' + fin2;

    let cantiTootip = ``;
    if (keys.length > 1) {
      if (keys.length === 2) {
        cantiTootip = `<div style=" max-width: 21rem;" > <span> ${padre} </span><br></div>`;
      } else {
        cantiTootip = `<div style=" max-width: 21rem;" > <span> ${padre} </span><br> <span>${hijo}</span><br> </div>`;
      }
    } else {
      cantiTootip = `<div style=" max-width: 21rem;" > <span> ${principal} </span><br></div>`;
    }
    return cantiTootip;
  }
  lookprincipal(objeto) {
    const keys = _.keys(objeto);
    const values = _.values(objeto);
    const fin = values[0] > 1 ? this.medidas[keys[0]] : keys[0];
    return this.formatearNumero(values[0]) + '  ' + fin;
  }

  saltar(campo) {
    if (campo !== 'send') {
      this.enfocarInput(campo);
    } else {
      const continu = this.abilitarBtnSend();

      if (!continu) {
        this.enfocarInput('nombre');
        setTimeout(() => {
          // this.submit(this.form);
        }, 250);
      }
    }
  }
  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.focus();
  }
  abilitarBtnSend() {
    return true;
  }

  seleccionarMedida() {}
  borrar() {}
  agregarAlista() {}
}
