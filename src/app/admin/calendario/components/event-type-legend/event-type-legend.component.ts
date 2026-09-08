import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CalendarEventType } from '../../calendario.models';

@Component({
  selector: 'app-event-type-legend',
  imports: [CommonModule],
  templateUrl: './event-type-legend.component.html',
  styleUrls: ['./event-type-legend.component.scss'],
})
export class EventTypeLegendComponent {
  @Input() eventTypes: CalendarEventType[] = [];
}
