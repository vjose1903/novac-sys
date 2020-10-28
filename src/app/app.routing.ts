import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './shared/components/page-not-found/page-not-found.component';

// admin
import { HomeAdminComponent } from './admin/home/homeAdmin.component';
import { FacturacionComponent } from './admin/facturacion/facturacion.component';
import { RegistroArticulosComponent } from './admin/registros/articulos/registro-articulos.component';
import { RegistroEmpleadosComponent } from './admin/registros/registro-empleados/registro-empleados.component';
import { NavbarAComponent } from './admin/layout/layout.component';

// home
import { LoginComponent } from './login/login.component';
import { RegistroClientesComponent } from './admin/registros/registro-clientes/registro-clientes.component';
import { RegistroSuplidoresComponent } from './admin/registros/registro-suplidores/registro-suplidores.component';
import { ProduccionComponent } from './admin/produccion/produccion.component';
import { InventarioComponent } from './admin/inventario/inventario.component';
import { IngresosComponent } from './admin/recibo-ingresos/ingresos.component';
import { BuscarFacturaComponent } from './admin/manipular facturas/buscar-factura/buscar-factura.component';
import { NotasCredDebComponent } from './admin/manipular facturas/notas-cred-deb/notas-cred-deb.component';
import { NcfComponent } from './admin/registros/ncf/ncf.component';
import { ConduceComponent } from './admin/conduce/conduce.component';
import { ReciboViajesComponent } from './admin/recibo-viajes/recibo-viajes.component';
import { AuthGuard } from './core/guard/auth.guard';
import { IsLoginGuard } from './core/guard/is-login.guard';
import { ReportesComponent } from './admin/reportes/reportes.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'admin',
    component: NavbarAComponent,
    children: [
      {
        path: '',
        component: HomeAdminComponent,
      },
      {
        path: 'factura/:tipo',
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
        path: 'produccion',
        component: ProduccionComponent,
      },
      {
        path: 'clientes',
        component: RegistroClientesComponent,
      },
      {
        path: 'suplidores',
        component: RegistroSuplidoresComponent,
      },
      {
        path: 'inventario',
        component: InventarioComponent,
      },
      {
        path: 'ingresos',
        component: IngresosComponent,
      },
      {
        path: 'buscarFactura/:para',
        component: BuscarFacturaComponent,
      },
      {
        path: 'nota/:tipo/:id',
        component: NotasCredDebComponent,
      },
      {
        path: 'ncf',
        component: NcfComponent,
      },
      {
        path: 'conduce',
        component: ConduceComponent,
      },
      {
        path: 'viajes',
        component: ReciboViajesComponent,
      },
      {
        path: 'reportes',
        component: ReportesComponent,
      },
    ],
    canActivate: [AuthGuard],
  },
  {
    path: 'auth/login',
    component: LoginComponent,
    canActivate: [IsLoginGuard],
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
