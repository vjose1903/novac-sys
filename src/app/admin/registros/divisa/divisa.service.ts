import { fun } from './../../../core/services/functions.service';
import { DivisaC, DivisaI } from './divisa.utils';
import { Injectable } from '@angular/core';
import { getImgUrlServer } from '../../../core/typescript/imagen.utils';

@Injectable({
  providedIn: 'root',
})
export class DivisaService {
  listaDivisas: Array<DivisaI> = [];
  divisaClass = new DivisaC();
  constructor() {}

  async getDivisas() {
    try {
      const extra = { parameters: { cuenta_contable_id: true } };

      this.listaDivisas.length = 0;

      this.divisaClass.getAll(extra).then((res) => {
        res['data'].map((divisa: DivisaI) => {
          divisa.img_divisa = getImgUrlServer(divisa?.imagen?.file_name);
          divisa.es_principal = divisa.is_principal ? 'P' : null;
          divisa.tasa_actual = `$ ${divisa.current_tasa}`;

          divisa.currency_change = 'fa-solid fa-coins';
          divisa.currency_change_tooltip = divisa.estado ? 'Tasa de cambio' : 'No puede cambiar la tasa de cambio, por que está desactivada.';

          divisa.edit_divisa = 'fas fa-pencil-alt';
          divisa.edit_divisa_tooltip = divisa.estado ? 'Editar divisa' : 'No puede editar la divisa, por que está desactivada.';

          divisa.deactivate_reactivate_divisa = divisa.estado ? 'fa-solid fa-ban' : 'fa-regular fa-circle-check';
          divisa.deactivate_reactivate_divisa_tooltip = divisa.estado ? 'Desactivar Divisa' : 'Reactivar Divisa';

          divisa.status = divisa.estado ? 'ACTIVA' : 'DESACTIVA';
          divisa.status_tag_color = divisa.estado ? 'green' : 'red';

          divisa.customStyles = {
            es_principal: { padding: 0, width: '2rem' },
            img_divisa: { 'padding-left': '0.5rem', 'padding-right': '0.5rem', width: '5rem' },
            simbolo: { width: '10%' },
            nombre: { 'text-align': 'start', 'padding-left': '0.3rem' },
            tasa_actual: { width: '8%' },
            status: [
              { key: 'status', isTd: true, estilos: 'width: 10% !important;' },
              { key: 'status_cuenta', estilos: 'font-size: 1.2rem !important;' },
            ],
            actions: [
              { key: 'actions', isTd: true, estilos: 'width: 7rem !important;' },
              { key: 'edit_divisa', estilos: 'font-size: 1.2rem !important' },
              { key: 'currency_change', estilos: 'font-size: 1.2rem !important' },
              { key: 'deactivate_reactivate_divisa', estilos: 'font-size: 1.2rem !important' },
            ],
          };
          return divisa;
        });

        this.listaDivisas = res['data'];
      });
    } catch (error) {
      fun.toastError('Error buscando empleados registrados.', 'ERROR');
    }
  }

  getDivisaInfoById(id: number) {
    return this.listaDivisas.find((divisa) => divisa.id == id);
  }

  getDivisaPrincipalInfo() {
    return this.listaDivisas.find((divisa) => divisa.is_principal);
  }
}
