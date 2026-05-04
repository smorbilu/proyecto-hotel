import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DataService } from '../../core/services/data.service';
import { DashboardStats } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatDividerModule, MatProgressBarModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl:    './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  today = new Date();
  stats = signal<DashboardStats | null>(null);
  loading = signal(true);

  quickLinks = [
    { label: 'Nueva Reserva',      icon: 'add_circle',   route: '/reservaciones', bg: 'rgba(30,58,138,.06)',  iconColor: 'var(--color-primary)' },
    { label: 'Ver Habitaciones',   icon: 'bed',          route: '/habitaciones',  bg: 'rgba(22,163,74,.06)',  iconColor: 'var(--color-success)' },
    { label: 'Gestionar Clientes', icon: 'person_add',   route: '/clientes',      bg: 'rgba(161,98,7,.06)',   iconColor: 'var(--color-accent)' },
    { label: 'Facturación',        icon: 'receipt_long', route: '/facturacion',   bg: 'rgba(59,130,246,.06)', iconColor: 'var(--color-secondary)' },
  ];

  constructor(private ds: DataService) {}

  ngOnInit() {
    this.ds.getDashboardStats().subscribe({
      next: s  => { this.stats.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onLinkEnter(ev: MouseEvent) {
    const el = ev.currentTarget as HTMLElement;
    el.style.transform = 'translateY(-2px)';
    el.style.boxShadow = 'var(--shadow-md)';
  }

  onLinkLeave(ev: MouseEvent) {
    const el = ev.currentTarget as HTMLElement;
    el.style.transform = '';
    el.style.boxShadow = '';
  }
}
