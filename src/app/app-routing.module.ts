import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './shared/components/page-not-found/page-not-found.component';

// admin
import { HomeAdminComponent } from './admin/home/homeAdmin.component';

// home
import { HomeComponent } from './home/home.component';
import { NavbarAComponent } from './admin/navbar-a/navbar-a.component';

const routes: Routes = [
  {
    path: 'admin',
    component: NavbarAComponent,
    children:[
      {
        path: '',
        component: HomeAdminComponent
      },
    ]
  },
  {
    path: 'usuario',
    component: HomeAdminComponent
  },
  {
    path: '',
    component: HomeComponent
  },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
