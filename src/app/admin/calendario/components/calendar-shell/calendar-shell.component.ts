import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateClickInfo, DatesSetInfo, EventClickInfo } from 'fullcalendar';
import dayGridPlugin from '@fullcalendar/angular/daygrid';
import interactionPlugin from '@fullcalendar/angular/interaction';
import listPlugin from '@fullcalendar/angular/list';
import timeGridPlugin from '@fullcalendar/angular/timegrid';
import allLocales from '@fullcalendar/angular/locales-all';
import themePlugin from '@fullcalendar/angular/themes/monarch';
import { CalendarioService } from '../../services/calendario.service';
import { CalendarEventInput } from '../../calendario.models';

@Component({
  selector: 'app-calendar-shell',
  imports: [FullCalendarModule],
  templateUrl: './calendar-shell.component.html',
  styleUrls: ['./calendar-shell.component.scss'],
})
export class CalendarShellComponent {
  @ViewChild('calendar') calendar?: FullCalendarComponent;
  @Output() eventSelected = new EventEmitter<CalendarEventInput>();
  @Output() dateSelected = new EventEmitter<string>();

  currentTitle = '';
  currentView = 'dayGridMonth';
  private visibleRange?: { start: string; end: string; view: string; center: Date };
  private renderTimer?: any;

  calendarOptions: CalendarOptions = {
    plugins: [themePlugin, dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    locales: allLocales,
    locale: 'es',
    initialView: 'dayGridMonth',
    height: '100%',
    expandRows: true,
    weekends: true,
    nowIndicator: true,
    dayMaxEvents: 3,
    headerToolbar: false,
    eventDisplay: 'block',
    displayEventTime: false,
    eventClass: info => (info.event.extendedProps?.isWorkingDay === false ? 'calendar-non-working-event' : ''),
    eventDidMount: info => this.applyEventColors(info),
    dayCellClass: info => (info.isOther ? 'calendar-other-month-day' : ''),
    datesSet: info => this.handleDatesSet(info),
    dateClick: info => this.handleDateClick(info),
    eventClick: info => this.handleEventClick(info),
    events: [],
  };

  constructor(private calendarioService: CalendarioService) {}

  refetchEvents() {
    if (!this.visibleRange) return;
    this.refreshVisibleRange(this.visibleRange, true);
  }

  goPrev() {
    this.calendar?.getApi().prev();
  }

  goNext() {
    this.calendar?.getApi().next();
  }

  goToday() {
    this.calendar?.getApi().today();
  }

  changeView(view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listMonth') {
    this.calendar?.getApi().changeView(view);
  }

  private handleDatesSet(info: DatesSetInfo) {
    this.currentTitle = info.view.title;
    this.currentView = info.view.type;
    const range = {
      start: this.toDateOnly(info.startStr),
      end: this.toDateOnly(info.endStr),
      view: info.view.type,
      center: new Date(info.view.currentStart),
    };
    this.visibleRange = range;
    this.refreshVisibleRange(range);
  }

  private handleEventClick(info: EventClickInfo) {
    info.jsEvent.stopPropagation();
    const event = info.event;
    this.eventSelected.emit({
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      allDay: event.allDay,
      color: event.color,
      textColor: event.contrastColor,
      extendedProps: event.extendedProps,
    });
  }

  private handleDateClick(info: DateClickInfo) {
    this.dateSelected.emit(this.toDateOnly(info.dateStr));
  }

  private applyEventColors(info: any) {
    const event = info.event as any;
    const color = event.backgroundColor || event.borderColor || event.color || '#2563eb';
    const textColor = event.textColor || event.contrastColor || '#ffffff';

    info.el.style.setProperty('--calendar-event-color', color);
    info.el.style.setProperty('--calendar-event-text-color', textColor);
    info.el.classList.add('calendar-colored-event');
  }

  private toDateOnly(value: string) {
    return value.slice(0, 10);
  }

  private async refreshVisibleRange(range: { start: string; end: string; view: string; center: Date }, force = false) {
    clearTimeout(this.renderTimer);

    await this.calendarioService.hydrateRangeFromCache(range.start, range.end);
    this.renderVisibleEvents();

    this.renderTimer = setTimeout(async () => {
      await this.calendarioService.refreshEventsForRange({ ...range, reason: 'visible', priority: 0 });
      this.renderVisibleEvents();
      if (!force) this.calendarioService.prefetchAdjacentRanges(range.center, range.view);
    }, 120);
  }

  private renderVisibleEvents() {
    if (!this.visibleRange || !this.calendar) return;

    const api = this.calendar.getApi();
    const events = this.calendarioService
      .getVisibleEvents(this.visibleRange.start, this.visibleRange.end)
      .map(event => this.withEventColors(event));

    api.batchRendering(() => {
      api.removeAllEventSources();
      api.removeAllEvents();
      api.addEventSource(events);
    });
  }

  private withEventColors(event: CalendarEventInput): CalendarEventInput {
    const color = event.color || event.backgroundColor || event.borderColor || '#2563eb';
    const textColor = event.textColor || '#ffffff';

    return {
      ...event,
      color,
      backgroundColor: color,
      borderColor: color,
      textColor,
    };
  }
}
