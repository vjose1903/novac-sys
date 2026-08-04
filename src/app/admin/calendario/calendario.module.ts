import { NgModule } from '@angular/core';
import { CalendarioComponent } from './calendario.component';
import { CalendarioRoutingModule } from './calendario.routing';
import { CalendarioService } from './services/calendario.service';

@NgModule({
  imports: [CalendarioComponent, CalendarioRoutingModule],
  providers: [CalendarioService],
})
export class CalendarioModule {}
