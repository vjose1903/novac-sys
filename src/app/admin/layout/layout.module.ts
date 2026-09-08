import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutRoutingModule } from './layout.routing';
import { LayoutComponent } from './layout.component';
import { PrimengModule } from '../../modules/primeng.module';

import { DirectivesModule } from '@core/directive/directives.module';
import { ValidateRayaAbajo } from '../../directives/validaciones';
import { TablasModule } from '@components/new_tablas/tablas.module';

import { TabsModule } from 'primeng/tabs';
import { NgxPermissionsModule } from 'ngx-permissions';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BtnIconModule } from '@components/btn-icon-circular/btn-icon-circular.module';
import { MenuItemComponent } from './components/menu-item/menu-item.component';
import { FormErrorMsgComponent } from '@core/components/form-error-msg/form-error-msg.component';
@NgModule({
  declarations: [LayoutComponent, ValidateRayaAbajo],
  imports: [
    CommonModule,
    LayoutRoutingModule,
    PrimengModule,
    TablasModule,
    TabsModule,
    FormsModule,
    DirectivesModule,
    ReactiveFormsModule,
    NgxPermissionsModule.forChild(),
    BtnIconModule,
    MenuItemComponent,
    FormErrorMsgComponent,
  ],
})
export class LayoutModule {}
