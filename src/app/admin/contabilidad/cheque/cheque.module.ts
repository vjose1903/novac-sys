import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChequeComponent } from './cheque.component';
import { ChequesRoutingModule } from './cheque.routing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ImgModule } from '../../components/img-component/img.module';
import { TablasModule } from '../../components/new_tablas/tablas.module';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { FormDivisaInputModule } from '../../../core/components/form-fields/form-divisa-input/form-divisa-input.module';
import { NgxPermissionsModule } from 'ngx-permissions';
import { TagModule } from 'primeng/tag';



@NgModule({
  declarations: [
    ChequeComponent,
  ],
  imports: [
    ChequesRoutingModule,
    CommonModule,
    TablasModule,
    FormsModule,
    ReactiveFormsModule,
    DirectivesModule,
    CalendarModule,
    DropdownModule,
    ImgModule,
    NgxPermissionsModule.forChild(),
    FormDivisaInputModule,
    TagModule
  ]
})
export class ChequeModule { }
