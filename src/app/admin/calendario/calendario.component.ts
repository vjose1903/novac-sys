import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';
import { IButtonDynamic, ICallbackModal, modalActionsE, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { CalendarEventInput, CalendarEventType } from './calendario.models';
import { CalendarioService } from './services/calendario.service';
import { CalendarShellComponent } from './components/calendar-shell/calendar-shell.component';
import { CalendarEventFormComponent } from './components/calendar-event-form/calendar-event-form.component';
import { EventTypeLegendComponent } from './components/event-type-legend/event-type-legend.component';

@Component({
  selector: 'app-calendario',
  imports: [CommonModule, CalendarShellComponent, EventTypeLegendComponent],
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.scss'],
})
export class CalendarioComponent implements OnInit {
  @ViewChild(CalendarShellComponent) calendarShell?: CalendarShellComponent;

  eventTypes: CalendarEventType[] = [];
  loadingTypes = false;

  constructor(private calendarioService: CalendarioService) {}

  async ngOnInit() {
    await this.loadEventTypes();
  }

  openNewEvent(startDate?: string) {
    this.openEventModal({ startDate });
  }

  openEvent(event: CalendarEventInput) {
    this.openEventModal({ event });
  }

  async refreshCalendar() {
    this.calendarShell?.refetchEvents();
  }

  private async loadEventTypes() {
    this.loadingTypes = true;
    try {
      this.eventTypes = await this.calendarioService.getEventTypes();
    } finally {
      this.loadingTypes = false;
    }
  }

  private openEventModal(params: { event?: CalendarEventInput; startDate?: string }) {
    const modal = new DynamicModalClass();
    modal.id = 'calendar-event-form';
    modal.header = params.event?.id ? 'Editar evento' : 'Nuevo evento';
    modal.component = CalendarEventFormComponent;
    modal.width = '720px';
    modal.padding = '0';
    modal.overflow = 'hidden';
    modal.closableEsc = true;
    modal.inputs = {
      event: params.event,
      startDate: params.startDate,
      eventTypes: this.eventTypes,
    };
    modal.botones = this.getModalButtons(params.event);
    modal.setCallback((args: ICallbackModal) => {
      if (args.type === modalCloseType.returnData && args.data?.refresh) this.refreshCalendar();
    });
    modal.show();
  }

  private getModalButtons(event?: CalendarEventInput): IButtonDynamic[] {
    const buttons: IButtonDynamic[] = [];

    if (event?.id && !event.extendedProps?.isHoliday) {
      buttons.push({
        id: 'deleteBtn',
        label: 'Eliminar',
        clase: 'btn-danger',
        iconName: 'fas fa-trash',
        functionInOtherComponent: 'deleteCurrent',
      });
    }

    buttons.push(
      { id: 'cancelBtn', label: 'Cancelar', clase: 'btn-light-grey', iconName: 'fas fa-times', action: modalActionsE.close },
      { id: 'saveBtn', label: 'Guardar', clase: 'btn-green', iconName: 'fas fa-save', functionInOtherComponent: 'submit' }
    );

    return buttons;
  }
}
