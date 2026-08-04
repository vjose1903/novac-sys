import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { CalendarEventInput, CalendarEventType } from './calendario.models';
import { CalendarioService } from './services/calendario.service';
import { CalendarShellComponent } from './components/calendar-shell/calendar-shell.component';
import { CalendarEventFormComponent } from './components/calendar-event-form/calendar-event-form.component';
import { EventTypeLegendComponent } from './components/event-type-legend/event-type-legend.component';

@Component({
  selector: 'app-calendario',
  imports: [CommonModule, CalendarShellComponent, CalendarEventFormComponent, EventTypeLegendComponent],
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.scss'],
})
export class CalendarioComponent implements OnInit {
  @ViewChild(CalendarShellComponent) calendarShell?: CalendarShellComponent;

  eventTypes: CalendarEventType[] = [];
  selectedEvent?: CalendarEventInput;
  selectedStartDate?: string;
  formVisible = false;
  loadingTypes = false;

  constructor(private calendarioService: CalendarioService) {}

  async ngOnInit() {
    await this.loadEventTypes();
  }

  openNewEvent(startDate?: string) {
    this.selectedEvent = undefined;
    this.selectedStartDate = startDate;
    this.formVisible = true;
  }

  openEvent(event: CalendarEventInput) {
    this.selectedStartDate = undefined;
    this.selectedEvent = event;
    this.formVisible = true;
  }

  closeForm() {
    this.formVisible = false;
    this.selectedEvent = undefined;
    this.selectedStartDate = undefined;
  }

  async refreshCalendar() {
    this.closeForm();
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
}
