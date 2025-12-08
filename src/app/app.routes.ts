import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { MainLayoutComponent } from './shared/layout/main-layout.component';

export const routes: Routes = [
  // Redirect root to dashboard if authenticated, otherwise auth guard will redirect to login
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  // Public routes (auth) - only accessible when NOT authenticated
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      }
    ]
  },
  // Protected routes (requires authentication)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard-home.component').then(m => m.DashboardComponent)
      },
      {
        path: 'children',
        loadComponent: () => import('./features/children/lista-hijos/children-list.component').then(m => m.ChildrenListComponent)
      },
      {
        path: 'children/add',
        loadComponent: () => import('./features/children/registrar-hijo/registrar-hijo.component').then(m => m.RegistrarHijoComponent)
      },
      {
        path: 'children/edit/:id',
        loadComponent: () => import('./features/children/editar-hijo/editar-hijo.component').then(m => m.EditarHijoComponent)
      },
      {
        path: 'safe-zones',
        loadComponent: () => import('./features/safe-zones/lista-zonas/lista-zonas.component').then(m => m.ListaZonasComponent)
      },
      {
        path: 'safe-zones/create',
        loadComponent: () => import('./features/safe-zones/crear-zona/crear-zona.component').then(m => m.CrearZonaComponent)
      },
      {
        path: 'safe-zones/edit/:id',
        loadComponent: () => import('./features/safe-zones/editar-zona/editar-zona.component').then(m => m.EditarZonaComponent)
      },
      {
        path: 'live-map',
        loadComponent: () => import('./features/map/live-map.component').then(m => m.LiveMapComponent)
      },
      {
        path: 'location-history/:id',
        loadComponent: () => import('./features/map/location-history/location-history.component').then(m => m.LocationHistoryComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications-list.component').then(m => m.NotificationsListComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  },
  // Wildcard route - redirect to dashboard (auth guard will handle if not logged in)
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
