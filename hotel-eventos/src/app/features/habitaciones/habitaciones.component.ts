import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataService } from '../../core/services/data.service';
import { Cuarto } from '../../core/models';

@Component({
  selector: 'app-habitaciones',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatTooltipModule,
  ],
  templateUrl: './habitaciones.component.html',
  styleUrl:    './habitaciones.component.scss',
})
export class HabitacionesComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!: MatSort;

  columns = ['no_cuarto', 'tipo_cuarto', 'precio', 'estado', 'descripcion', 'acciones'];
  dataSource = new MatTableDataSource<Cuarto>([]);
  allCuartos = signal<Cuarto[]>([]);

  search       = signal('');
  filterEstado = signal<number | ''>('');
  loading      = signal(true);

  estadoStats = signal({ disponibles: 0, ocupados: 0 });

  constructor(private ds: DataService, private snack: MatSnackBar) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.ds.getCuartos().subscribe({
      next: data => {
        this.allCuartos.set(data);
        this.estadoStats.set({
          disponibles: data.filter(c => c.id_estado === 1).length,
          ocupados:    data.filter(c => c.id_estado === 2).length,
        });
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => { this.snack.open('Error cargando habitaciones', 'OK'); this.loading.set(false); },
    });
  }

  private applyFilters() {
    let data = this.allCuartos();
    const s = this.search().toLowerCase();
    const e = this.filterEstado();
    if (s) data = data.filter(c =>
      c.no_cuarto.toLowerCase().includes(s) ||
      c.descripcion.toLowerCase().includes(s) ||
      c.tipo_cuarto.toLowerCase().includes(s)
    );
    if (e !== '') data = data.filter(c => c.id_estado === e);
    this.dataSource.data = data;
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort      = this.sort;
    });
  }

  onSearch(ev: Event) {
    this.search.set((ev.target as HTMLInputElement).value);
    this.applyFilters();
  }

  onFilterEstado(val: number | '') {
    this.filterEstado.set(val);
    this.applyFilters();
  }

  getEstadoSlug(id: number) {
    return id === 1 ? 'disponible' : 'ocupado';
  }

  toggleEstado(c: Cuarto) {
    const nuevoEstado = c.id_estado === 1 ? 2 : 1;
    this.ds.patchEstadoCuarto(c.id_cuarto, nuevoEstado).subscribe({
      next: () => {
        this.snack.open(`Habitación ${c.no_cuarto} marcada como ${nuevoEstado === 1 ? 'Disponible' : 'Ocupada'}`, 'OK', { duration: 3000 });
        this.load();
      },
      error: () => this.snack.open('Error al cambiar estado', 'OK'),
    });
  }
}
