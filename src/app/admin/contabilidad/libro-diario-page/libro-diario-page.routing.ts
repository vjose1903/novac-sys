import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LibroDiarioPageComponent } from './libro-diario-page.component';

const routes: Routes = [{ path: '', component: LibroDiarioPageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LibroDiarioPageRoutingModule {}
