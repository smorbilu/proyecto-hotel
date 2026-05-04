import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard — Hotel Eventos',
      },
      {
        path: 'habitaciones',
        loadComponent: () => import('./features/habitaciones/habitaciones.component').then(m => m.HabitacionesComponent),
        title: 'Habitaciones — Hotel Eventos',
      },
      {
        path: 'reservaciones',
        loadComponent: () => import('./features/reservaciones/reservaciones.component').then(m => m.ReservacionesComponent),
        title: 'Reservaciones — Hotel Eventos',
      },
      {
        path: 'clientes',
        loadComponent: () => import('./features/clientes/clientes.component').then(m => m.ClientesComponent),
        title: 'Clientes — Hotel Eventos',
      },
      {
        path: 'grupos',
        loadComponent: () => import('./features/grupos/grupos.component').then(m => m.GruposComponent),
        title: 'Grupos & Eventos — Hotel Eventos',
      },
      {
        path: 'facturacion',
        loadComponent: () => import('./features/facturacion/facturacion.component').then(m => m.FacturacionComponent),
        title: 'Facturación — Hotel Eventos',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
