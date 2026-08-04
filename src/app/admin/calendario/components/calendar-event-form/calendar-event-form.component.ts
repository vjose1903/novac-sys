import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CalendarEventInput, CalendarEventLink, CalendarEventPayload, CalendarEventType, CalendarLinkableRecord } from '../../calendario.models';
import { CalendarioService } from '../../services/calendario.service';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
import { RecurrenceFieldsComponent } from '../recurrence-fields/recurrence-fields.component';

@Component({
  selector: 'app-calendar-event-form',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ColorPickerComponent, RecurrenceFieldsComponent],
  templateUrl: './calendar-event-form.component.html',
  styleUrls: ['./calendar-event-form.component.scss'],
})
export class CalendarEventFormComponent implements OnInit, OnChanges {
  @Input() event?: CalendarEventInput;
  @Input() startDate?: string;
  @Input() eventTypes: CalendarEventType[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  form!: FormGroup;
  expanded = false;
  saving = false;
  deleting = false;
  linkEntityType = '';
  linkQuery = '';
  linkResults: CalendarLinkableRecord[] = [];
  links: CalendarEventLink[] = [];
  entityTypes = ['Cliente', 'User', 'Suplidor', 'Vehiculo'];

  constructor(
    private fb: FormBuilder,
    private calendarioService: CalendarioService
  ) {}

  ngOnInit() {
    this.buildForm();
    this.patchEvent();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.event && this.form) this.patchEvent();
    if (changes.startDate && this.form && !this.event) this.patchEvent();
  }

  get isEditing() {
    return Boolean(this.event?.id);
  }

  get isHoliday() {
    return Boolean(this.event?.extendedProps?.isHoliday);
  }

  get allDay() {
    return Boolean(this.form?.get('all_day')?.value);
  }

  get selectedTypeColor() {
    const typeId = Number(this.form?.get('calendar_event_type_id')?.value);
    return this.eventTypes.find(type => type.id === typeId)?.color || '#2563eb';
  }

  async save() {
    if (this.form.invalid || this.isHoliday) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    try {
      await this.calendarioService.saveEvent(this.makePayload());
      this.saved.emit();
    } finally {
      this.saving = false;
    }
  }

  async deleteCurrent() {
    if (!this.event?.id || this.isHoliday) return;

    this.deleting = true;
    try {
      await this.calendarioService.deleteEvent(String(this.event.id));
      this.deleted.emit();
    } finally {
      this.deleting = false;
    }
  }

  setColor(color: string | null) {
    this.form.get('color')?.setValue(color);
  }

  async searchLinkables() {
    this.linkResults = await this.calendarioService.searchLinkables(this.linkEntityType, this.linkQuery);
  }

  addLink(record: CalendarLinkableRecord) {
    if (this.links.some(link => link.linkable_type === record.entity_type && link.linkable_id === record.id)) return;

    this.links = [
      ...this.links,
      {
        linkable_type: record.entity_type,
        linkable_id: record.id,
        label: record.label,
        metadata: record.metadata ?? {},
      },
    ];
    this.linkQuery = '';
    this.linkResults = [];
  }

  removeLink(index: number) {
    this.links = this.links.filter((_, currentIndex) => currentIndex !== index);
  }

  private buildForm() {
    const today = this.toDateInput(new Date());

    this.form = this.fb.group({
      title: ['', Validators.required],
      calendar_event_type_id: [null, Validators.required],
      location: [''],
      color: [null],
      description: [''],
      start_date: [today, Validators.required],
      end_date: [today, Validators.required],
      start_time: ['09:00'],
      end_time: ['10:00'],
      all_day: [false],
      is_working_day: [true],
      recurrence_type: ['none'],
      recurrence_interval: [1],
      recurrence_days: [[]],
      recurrence_end_type: ['never'],
      recurrence_until: [null],
      recurrence_count: [null],
    });
  }

  private patchEvent() {
    const start = this.parseEventDate(this.event?.start || this.startDate);
    const end = this.event?.end ? this.parseEventDate(this.event.end) : start;
    const props = this.event?.extendedProps ?? {};

    this.links = props.links ?? [];
    this.form.patchValue({
      title: this.event?.title ?? '',
      calendar_event_type_id: props.typeId ?? this.eventTypes[0]?.id ?? null,
      location: props.location ?? '',
      color: this.event?.color || null,
      description: props.description ?? '',
      start_date: this.toDateInput(start),
      end_date: this.toEndDateInput(end, Boolean(this.event?.allDay)),
      start_time: this.toTimeInput(start, '09:00'),
      end_time: this.toTimeInput(end, '10:00'),
      all_day: Boolean(this.event?.allDay),
      is_working_day: props.isWorkingDay ?? true,
      recurrence_type: 'none',
      recurrence_interval: 1,
      recurrence_days: [],
      recurrence_end_type: 'never',
      recurrence_until: null,
      recurrence_count: null,
    });
  }

  private makePayload(): CalendarEventPayload {
    const value = this.form.value;
    const recurrenceEndType = value.recurrence_end_type;

    const payload: CalendarEventPayload = {
      id: this.event?.id ? String(this.event.id) : undefined,
      title: value.title,
      description: value.description || null,
      location: value.location || null,
      calendar_event_type_id: Number(value.calendar_event_type_id),
      color: value.color || null,
      start_date: value.start_date,
      end_date: value.end_date,
      start_time: value.all_day ? null : value.start_time,
      end_time: value.all_day ? null : value.end_time,
      all_day: Boolean(value.all_day),
      is_working_day: Boolean(value.is_working_day),
      timezone: this.calendarioService.getTimezone(),
      recurrence_type: value.recurrence_type,
      recurrence_rule: null,
      recurrence_interval: Number(value.recurrence_interval || 1),
      recurrence_days: value.recurrence_type === 'weekly' ? value.recurrence_days ?? [] : [],
      recurrence_until: recurrenceEndType === 'until' ? value.recurrence_until : null,
      recurrence_count: recurrenceEndType === 'count' ? Number(value.recurrence_count || 1) : null,
      links: this.links,
    };

    if (this.isEditing && this.event?.extendedProps?.recurrenceRule && value.recurrence_type === 'none') {
      delete payload.recurrence_type;
      delete payload.recurrence_rule;
      delete payload.recurrence_interval;
      delete payload.recurrence_days;
      delete payload.recurrence_until;
      delete payload.recurrence_count;
    }

    return payload;
  }

  private toDateInput(date: Date) {
    if (Number.isNaN(date.getTime())) return this.toDateInput(new Date());
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseEventDate(value: any) {
    if (!value) return new Date();
    const stringValue = String(value);

    if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
      const [year, month, day] = stringValue.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    return new Date(stringValue);
  }

  private toEndDateInput(date: Date, allDay: boolean) {
    if (!allDay) return this.toDateInput(date);
    const adjusted = new Date(date);
    adjusted.setDate(adjusted.getDate() - 1);
    return this.toDateInput(adjusted);
  }

  private toTimeInput(date: Date, fallback: string) {
    if (Number.isNaN(date.getTime())) return fallback;
    return `${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`;
  }
}
