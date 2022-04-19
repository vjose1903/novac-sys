import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';

import * as _ from 'lodash';
import { fun } from '../../../../core/services/functions.service';

@Component({
  selector: 'app-btnacciones',
  templateUrl: './btnacciones.component.html',
  styleUrls: ['./btnacciones.component.scss'],
})
export class NewBTNACCIONESComponent implements OnInit, AfterViewInit {
  @Input() botones: any = {
    dinamic: [],
    borrar: { show: false, permiso: null },
    editar: { show: false, permiso: null },
    mostrar: { show: false, permiso: null },
  };

  btnList = {
    borrar: { icon: 'far fa-trash-alt', action: 'delete', func: this.delete, tooltip: 'Borrar' },
    editar: { icon: 'fas fa-pencil-alt', action: 'editar', func: this.devolverInfo, tooltip: 'Editar' },
    mostrar: { icon: 'far fa-eye', action: 'mostrar', func: this.devolverInfo, tooltip: 'Mostrar' },
  };

  @Input() index_body: any;
  @Input() dato: any;
  @Input() data;
  @Input() id_tabla;

  @Output() functionsBtnDinamic = new EventEmitter<any>();
  @Output() panicoBTN = new EventEmitter<any>();
  @Output() DevolverInfoBTN = new EventEmitter<any>();
  @Output() deleteBTN = new EventEmitter<any>();

  subWidth: Subscription;
  windowsWidth;
  items = [];
  datoSelected;
  this_ = this;
  constructor() {}

  ngOnInit() {
    this.subWidth = new fun().getWindowSize.subscribe((res) => this.handleWidth(res));
  }

  ngAfterViewInit(): void {
    this.parseSpeedDialButtons();
  }

  handleWidth(res) {
    this.windowsWidth = res.innerWidth;

    if (res.innerWidth >= 768) this.datoSelected = undefined;
  }

  parseSpeedDialButtons() {
    for (const key in this.botones) {
      const boton = this.botones[key];

      if (key === 'dinamic') {
        if (boton.length) {
          for (const btn_dinamic of boton) {
            this.items.push({
              icon: btn_dinamic['icon'],
              // command: () => this.handleFunctionsBtnDinamic(btn_dinamic),
              command: (arg) => {
                const index = this.getSpeedDial(arg);
                const dato = this.data[index];
                this.handleFunctionsBtnDinamic(null, btn_dinamic, dato);
              },
              tooltipOptions: { tooltipLabel: btn_dinamic['tooltip'] || this.dato[btn_dinamic['tooltipKey']], tooltipPosition: 'left' },
            });
          }
        }
      } else {
        this.items.push({
          icon: this.btnList[key].icon,
          command: (arg) => {
            const index = this.getSpeedDial(arg);
            const dato = this.data[index];

            this.btnList[key].func(null, dato, this.btnList[key].action, this.this_);
          },
          tooltipOptions: { tooltipLabel: this.btnList[key].tooltip, tooltipPosition: 'left' },
        });
      }
    }
  }

  getSpeedDial(arg) {
    const speedDial_id = _.find(arg.originalEvent.path, (item) => item.id.includes('speedDial'))['id'];
    const index = _.parseInt(_.replace(speedDial_id, 'speedDial-', ''));
    return index;
  }

  handleFunctionsBtnDinamic(e, btn_dinamic, dato) {
    const params = { name: btn_dinamic['name'], data: dato, id_tabla: this.id_tabla };

    this.functionsBtnDinamic.emit(params);
    if (e) e.stopPropagation();
  }

  devolverInfo(e, arg, metodo?, this_?) {
    this_ ||= this;
    const obj = { data: arg, action: metodo };

    this_.DevolverInfoBTN.emit(obj);
    if (e) e.stopPropagation();
  }

  delete(e, arg) {
    this.deleteBTN.emit(arg);
    e.stopPropagation();
  }

  convertNum(num) {
    return Number(`1.${num}`);
  }
}
