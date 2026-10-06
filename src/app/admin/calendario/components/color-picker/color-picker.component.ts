import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CALENDAR_COLORS } from '../../calendario.models';

@Component({
  selector: 'app-calendar-color-picker',
  imports: [CommonModule],
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss'],
})
export class ColorPickerComponent {
  @Input() value: string | null = null;
  @Input() defaultColor = '#2563eb';
  @Output() valueChange = new EventEmitter<string | null>();

  colors = CALENDAR_COLORS;
  open = false;

  get previewColor() {
    return this.value || this.defaultColor;
  }

  selectColor(color: string | null) {
    this.value = color;
    this.valueChange.emit(color);
    this.open = false;
  }
}
