import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
// import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

import { AuthGuard } from './core/guard/auth.guard';
import { IsLoginGuard } from './core/guard/is-login.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'admin',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/layout/layout.module').then((m) => m.LayoutModule),
    canActivate: [AuthGuard],
  },

  {
    path: 'auth',
    loadChildren: () => import('./login/login.module').then((m) => m.LoginModule),
    canActivate: [IsLoginGuard],
  },
  // {
  //   path: '**',
  //   component: PageNotFoundComponent,
  // },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      onSameUrlNavigation: 'reload',
      relativeLinkResolution: 'legacy',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
