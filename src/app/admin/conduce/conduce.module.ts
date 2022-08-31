import { BtncircularModule } from './../components/btncircular/btncircular.module';
import { TablasModule } from './../components/new_tablas/tablas.module';
import { PrimengModule } from './../../modules/primeng.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConduceRoutingModule } from './conduce.routing';
import { ConduceFormComponent } from './form/conduce-form.component';
import { ConduceListaComponent } from './lista/conduce-lista.component';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';

@NgModule({
  declarations: [ConduceListaComponent, ConduceFormComponent],
  imports: [CommonModule, PrimengModule, TablasModule, ConduceRoutingModule, ReactiveFormsModule, BtncircularModule, NgxPermissionsModule.forChild()],
})
export class ConduceModule {}
