import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriaEntidadContableComponent } from './categoria-entidad-contable.component';

const components = [CategoriaEntidadContableComponent];

@NgModule({
  declarations: components,
  imports: [CommonModule],
  exports: components,
})
export class CategoriaEntidadContableModule {}
