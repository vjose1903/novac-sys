import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login.component';
import { ConfiguracionesComponent } from './extra/configuraciones/configuraciones.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'config', component: ConfiguracionesComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoginRoutingModule {}
