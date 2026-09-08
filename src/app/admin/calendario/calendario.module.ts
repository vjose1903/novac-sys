import { NgModule } from '@angular/core';
import { CalendarioComponent } from './calendario.component';
import { CalendarioRoutingModule } from './calendario.routing';

@NgModule({
  imports: [CalendarioComponent, CalendarioRoutingModule],
})
export class CalendarioModule {}
