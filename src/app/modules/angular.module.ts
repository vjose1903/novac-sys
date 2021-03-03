import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TextMaskModule } from 'angular2-text-mask';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';

@NgModule({
  declarations: [],
  imports: [CommonModule, MatToolbarModule, MatSidenavModule, MatListModule, FormsModule, ReactiveFormsModule, TextMaskModule, MatTabsModule],
  exports: [MatToolbarModule, MatSidenavModule, MatListModule, FormsModule, ReactiveFormsModule, TextMaskModule, MatTabsModule],
})
export class AngularModule {}
