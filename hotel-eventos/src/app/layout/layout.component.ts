import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive, RouterLink } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, RouterModule, RouterLinkActive, RouterLink,
    MatSidenavModule, MatToolbarModule, MatIconModule,
    MatButtonModule, MatTooltipModule,
  ],
  templateUrl: './layout.component.html',
  styleUrl:    './layout.component.scss',
})
export class LayoutComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  isMobile = false;

  mainNav: NavItem[] = [
    { label: 'Dashboard',     icon: 'dashboard',       route: '/' },
  ];

  gestionNav: NavItem[] = [
    { label: 'Habitaciones',  icon: 'bed',             route: '/habitaciones' },
    { label: 'Reservaciones', icon: 'event_available', route: '/reservaciones' },
    { label: 'Clientes',      icon: 'people',          route: '/clientes' },
    { label: 'Grupos',        icon: 'groups',          route: '/grupos' },
    { label: 'Facturación',   icon: 'receipt_long',    route: '/facturacion' },
  ];

  constructor(private bp: BreakpointObserver) {
    this.bp.observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .subscribe(r => { this.isMobile = r.matches; });
  }
}
