import { HtmlElementsService } from '@core/services/html-elements.service';
import { ModalClass } from '../../modal/modal-class';
import { TablasService } from '../tablas.service';
import { fun } from '@core/services/functions.service';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import * as _ from 'lodash';

@Component({
  selector: 'icons-array',
  templateUrl: './icons-array.component.html',
  styleUrls: ['./icons-array.component.scss'],
  standalone: false,
})
export class IconsArrayComponent implements OnInit {
  @Input() seleccionado;
  @Input() column;
  @Input() indexBody;
  @Input() realIdTabla;
  @Input() rowData;
  @Input() data;
  @Input() config;

  fun = fun;
  @Output() icon_click = new EventEmitter<any>();

  htmlServ = inject(HtmlElementsService);

  constructor(public tServ: TablasService) {}

  ngOnInit(): void {}

  verificateIconId(objIcon) {
    if (objIcon.id) return objIcon.id;

    return `${fun.generateKey()}-${objIcon.key}`;
  }

  getIconKey(objIcon) {
    let res = '';
    if (typeof objIcon.key == 'string') res = objIcon.key;

    if (typeof objIcon.key == 'object') res = objIcon.key.key;

    return res;
  }

  getIconClass(objIcon, dato) {
    let res = '';
    if (typeof objIcon.key == 'string') res = dato[objIcon.key];

    if (typeof objIcon.key == 'object') {
      const source = objIcon.key.source;
      const clase_in_turn = objIcon.key.clases.find(item => item.value == dato[source]);

      res = clase_in_turn?.clase;
    }
    return res;
  }

  showIcon(objIcon, data) {
    let res = false;

    if (fun.objHas(objIcon, 'showCondition')) {
      for (let i = 0; i < objIcon.showCondition.length; i++) {
        const conditionObj = objIcon.showCondition[i];

        if (objIcon.showCondition.some(conf => conf.kind === 'selected')) {
          const is_selected = data.id == (this.seleccionado || 0);
          res = conditionObj.value == is_selected;
        }

        if (res) break;

        if (conditionObj.kind === 'campo') {
          if (conditionObj.value.length == 0) res = data[conditionObj.target] ? false : true;
          else res = conditionObj.value.some(value => value == data[conditionObj.target]);
        }
      }
    } else {
      res = true;
    }
    return res;
  }

  disableInput(dato, column) {
    return this.tServ.disabledInput({ dato: dato, column: column, config: this.config, seleccionado: this.seleccionado, all_data: this.data });
  }

  iconBtn(key, index, data, e, objIcon) {
    const obj = { id_tabla: this.realIdTabla, index: index, idIcon: objIcon.id, columnKey: key, iconKey: objIcon.key, data: data, rowsEditing: this.tServ.rowsEditing };

    const is_disable = this.disableInput(data, objIcon);

    if (!is_disable) {
      if (!objIcon?.editing_buttons || objIcon.key == 'guardar_btn') {
        this.handle_table_events('clickIcon', obj);
      } else {
        if (objIcon?.one_per_row && objIcon.key == 'editar_btn' && this.tServ.rowsEditing.length > 1) {
          fun.toastInfo('Solo se puede editar una fila a la vez', 'AVISO');
          return;
        }

        if (objIcon.key == 'editar_btn') {
          data.is_editing = true;
          this.tServ.modifyRowsEditing(data, 'add').then(() => this.handle_table_events('clickIcon', obj));
        }
        if (objIcon.key == 'cancelar_btn') this.checkIfIsEdited(data, obj);
      }
    }

    e.stopPropagation();
  }

  checkIfIsEdited(data, obj_click) {
    const row_editing_id = data.id;
    const original_row = this.data.find(item => item.id == row_editing_id);
    const editing_row = this.tServ.rowsEditing.find(item => item.id == row_editing_id);

    if (fun.isEqual(original_row, editing_row)) {
      data.is_editing = false;
      this.tServ.modifyRowsEditing(editing_row, 'remove').then(() => this.handle_table_events('clickIcon', obj_click));
    } else {
      const texto_modal = `¿Seguro que desea cancelar la edición?, al cancelar los cambios quedarán descartados.`;

      const siFunction = instance => {
        data.is_editing = false;
        this.tServ.modifyRowsEditing(editing_row, 'remove').then(() => this.handle_table_events('clickIcon', obj_click));
        instance.close();
      };

      new ModalClass().confirmationModal({ id: 'cancel_row_editing', header: 'Confirmar', texto: texto_modal, siFunction: siFunction });
    }
  }

  handle_table_events(type, arg) {
    this.icon_click.emit({ type: type, arg: arg });
  }
}
