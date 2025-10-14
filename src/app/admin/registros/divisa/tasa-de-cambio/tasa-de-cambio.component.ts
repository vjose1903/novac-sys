import { HtmlElementsService } from '@core/services/html-elements.service';
import { tableCellType, table_config } from '@components/new_tablas/tabla-class';
import { TasaDeCambioC, TasaDeCambioI } from './tasa_de_cambio.utils';
import { fun } from '@core/services/functions.service';
import { Component, Input, OnInit, inject } from '@angular/core';
import { DivisaC, DivisaI } from '../divisa.utils';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DivisaService } from '../divisa.service';
import { DateUtils } from '@vjose1903/dateutils';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';

@Component({
  selector: 'app-tasa-de-cambio',
  templateUrl: './tasa-de-cambio.component.html',
  styleUrls: ['./tasa-de-cambio.component.scss'],
  standalone: false,
})
export class TasaDeCambioComponent implements OnInit, IDynamicModal {
  @Input() modalConfig!: IModalConfiguration;
  @Input() modalWrapper!: DynamicModalComponent;
  @Input() divisa: DivisaI;

  form: UntypedFormGroup; 

  desde;
  hasta;
  hastaMaxDate;

  tasaDeCambioClass = new TasaDeCambioC();
  divisaClass = new DivisaC();
  listaHistorial: Array<TasaDeCambioI> = [];

  table_config: table_config = {
    info: [
      { titulo: 'Fecha', tipo: tableCellType.text, key: 'fecha_equivalente', estilos: [{ 'text-align': 'left' }] },
      { titulo: 'Valor', tipo: tableCellType.text, key: 'monto' },
    ],
    colores: false,
    padding: '0rem',
    colorTitulo: false,
    id_tabla: 'lista_tasas_cambio',
  };

  divisaPrincipal: DivisaI;

  public htmlServ = inject(HtmlElementsService);
  public divisaServ = inject(DivisaService);
  private fb = inject(UntypedFormBuilder);

  constructor() {}

  ngOnInit(): void {
    this.getDivisaPrincipal();
    this.setDefaultRange();
    this.createForm(this.divisa);
    this.getHistorialCambiosTasas();
  }

  createForm(divisa: DivisaI) {
    this.form = this.fb.group({
      tasa: [{ value: divisa.current_tasa, disabled: divisa.is_principal }, Validators.required],
    });
  }

  setDefaultRange() {
    let actual_date = new Date();
    const desde = DateUtils.getFirstDayOfMonth({ month: actual_date.getMonth() + 1, year: actual_date.getFullYear() });

    this.desde = desde;
    this.hasta = actual_date;
    this.hastaMaxDate = actual_date;
  }

  verificateChangeOfCurrency() {
    const formValue = this.form.getRawValue();
    return formValue.tasa == this.divisa.current_tasa;
  }

  async getHistorialCambiosTasas() {
    try {
      this.listaHistorial.length = 0;
      const extra = {
        afterPath: 'custom/get_history_changes',
        parameters: {
          desde: DateUtils.format({ date: this.desde, dateFormat: 'YYYY-MM-DD' }),
          hasta: DateUtils.format({ date: this.hasta, dateFormat: 'YYYY-MM-DD' }),
          divisa_id: this.divisa.id,
        },
      };
      this.tasaDeCambioClass.getAll(extra).then(res => {
        res['data'].map((historial: TasaDeCambioI) => {
          historial.fecha_equivalente = DateUtils.format({ date: historial.fecha_equivalente });
          historial.monto = `${this.divisaPrincipal.simbolo} ${fun.roundNumberToDecimal(historial.valor)}`;

          historial.customStyles = { fecha_equivalente: { 'text-align': 'start' } };

          this.listaHistorial.push(historial);
        });
      });
    } catch (error) {
      fun.toastError('Error Buscando el historial de cambios de tasas de cambios.', 'ERROR');
    }
  }

  getDivisaPrincipal() {
    const extra = { afterPath: 'custom/get_principal' };
    this.divisaClass.dynamic(extra).then(res => (this.divisaPrincipal = res['data'] as DivisaI));
  }

  btn_aceptar() {
    const formValue = this.form.getRawValue();

    const dataToSend = { id: this.divisa.id, divisa_id: this.divisa.id, valor: formValue.tasa, fecha_equivalente: DateUtils.format({ date: this.hastaMaxDate, dateFormat: 'YYYY-MM-DD' }) };

    this.tasaDeCambioClass.updateOne(dataToSend).then(res => {
      this.getHistorialCambiosTasas();
      this.divisaServ.getDivisas();

      this.divisa.current_tasa = formValue.tasa;
    });
  }
}
