import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './shared/components/page-not-found/page-not-found.component';

// admin
import { HomeAdminComponent } from './admin/home/homeAdmin.component';
import { FacturacionComponent } from './admin/facturacion/facturacion.component';
import { RegistroArticulosComponent } from './admin/registros/articulos/registro-articulos.component';
import { RegistroEmpleadosComponent } from './admin/registros/registro-empleados/registro-empleados.component';
import { NavbarAComponent } from './admin/navbar-a/navbar-a.component';

// home
import { HomeComponent } from './home/home.component';
import { RegistroClientesComponent } from './admin/registros/registro-clientes/registro-clientes.component';

const routes: Routes = [
  {
    path: 'admin',
    component: NavbarAComponent,
    children: [
      {
        path: '',
        component: HomeAdminComponent,
      },
      {
        path: 'factura',
        component: FacturacionComponent,
      },
      {
        path: 'articulos',
        component: RegistroArticulosComponent,
      },
      {
        path: 'empleados',
        component: RegistroEmpleadosComponent,
      },
      {
        path: 'clientes',
        component: RegistroClientesComponent,
      },
      // {
      //   path: '',
      //   component: HomeAdminComponent
      // },
    ],
  },
  {
    path: 'usuario',
    component: HomeAdminComponent,
  },
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: '**',
    component: PageNotFoundComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
