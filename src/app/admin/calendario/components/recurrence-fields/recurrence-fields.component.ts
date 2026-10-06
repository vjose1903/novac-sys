import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { WEEK_DAYS } from '../../calendario.models';

@Component({
  selector: 'app-calendar-recurrence-fields',
  imports: [CommonModule, ReactiveFormsModule, DatePickerModule, SelectModule],
  templateUrl: './recurrence-fields.component.html',
  styleUrls: ['./recurrence-fields.component.scss'],
})
export class RecurrenceFieldsComponent {
  @Input() form!: FormGroup;

  weekDays = WEEK_DAYS;
  recurrenceOptions = [
    { label: 'No se repite', value: 'none' },
    { label: 'Diario', value: 'daily' },
    { label: 'Semanal', value: 'weekly' },
    { label: 'Mensual', value: 'monthly' },
    { label: 'Anual', value: 'yearly' },
  ];
  finishOptions = [
    { label: 'Nunca', value: 'never' },
    { label: 'En fecha', value: 'until' },
    { label: 'Despues de ocurrencias', value: 'count' },
  ];

  get recurrenceType() {
    return this.form?.get('recurrence_type')?.value;
  }

  get finishType() {
    return this.form?.get('recurrence_end_type')?.value;
  }

  toggleDay(day: string) {
    const control = this.form.get('recurrence_days');
    const current: string[] = control?.value ?? [];
    control?.setValue(current.includes(day) ? current.filter(item => item !== day) : [...current, day]);
  }

  hasDay(day: string) {
    return (this.form?.get('recurrence_days')?.value ?? []).includes(day);
  }
}
