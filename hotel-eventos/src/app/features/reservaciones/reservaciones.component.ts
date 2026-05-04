import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataService } from '../../core/services/data.service';
import { Reservacion, Cliente, Cuarto } from '../../core/models';

@Component({
  selector: 'app-reservaciones',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule,
    MatSnackBarModule, MatTooltipModule,
  ],
  templateUrl: './reservaciones.component.html',
  styleUrl:    './reservaciones.component.scss',
})
export class ReservacionesComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!: MatSort;

  columns = ['id_reserva', 'cliente', 'cuarto', 'fecha_entrada', 'fecha_salida', 'noches', 'notas', 'acciones'];
  dataSource = new MatTableDataSource<Reservacion>([]);

  search     = signal('');
  showDialog = signal(false);
  editing    = signal<Reservacion | null>(null);
  loading    = signal(true);

  clientes     = signal<Cliente[]>([]);
  cuartosDisp  = signal<Cuarto[]>([]);

  form!: ReturnType<FormBuilder['group']>;

  constructor(private ds: DataService, private fb: FormBuilder, private snack: MatSnackBar) {
    this.form = this.fb.group({
      id_cliente:    [null, Validators.required],
      id_cuarto:     [null, Validators.required],
      fecha_entrada: ['',   Validators.required],
      fecha_salida:  ['',   Validators.required],
      descripcion:   [''],
      notas:         [''],
    });
  }

  ngOnInit() {
    this.load();
    this.ds.getClientes().subscribe(c => this.clientes.set(c));
    this.ds.getCuartos().subscribe(c => this.cuartosDisp.set(c.filter(x => x.id_estado === 1)));
  }

  load() {
    this.loading.set(true);
    this.ds.getReservaciones().subscribe({
      next: data => {
        this.applyFilter(data);
        this.loading.set(false);
      },
      error: () => { this.snack.open('Error cargando reservaciones', 'OK'); this.loading.set(false); },
    });
  }

  private applyFilter(data: Reservacion[]) {
    const s = this.search().toLowerCase();
    const filtered = s ? data.filter(r =>
      `${r.nombre} ${r.apellido}`.toLowerCase().includes(s) ||
      r.notas.toLowerCase().includes(s) ||
      r.no_cuarto.toLowerCase().includes(s)
    ) : data;
    this.dataSource.data = filtered;
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort      = this.sort;
    });
  }

  onSearch(ev: Event) {
    this.search.set((ev.target as HTMLInputElement).value);
    this.load();
  }

  calcNoches(e: string, s: string) {
    const diff = new Date(s).getTime() - new Date(e).getTime();
    return Math.max(0, Math.round(diff / 86_400_000));
  }

  openDialog(r?: Reservacion) {
    this.editing.set(r ?? null);
    this.form.reset({ id_cliente: null, id_cuarto: null, fecha_entrada: '', fecha_salida: '', descripcion: '', notas: '' });
    if (r) this.form.patchValue({ id_cliente: r.id_cliente, id_cuarto: r.id_cuarto,
      fecha_entrada: r.fecha_entrada, fecha_salida: r.fecha_salida,
      descripcion: r.descripcion, notas: r.notas });
    // refresh available rooms
    this.ds.getCuartos().subscribe(c => this.cuartosDisp.set(c.filter(x => x.id_estado === 1 || x.id_cuarto === r?.id_cuarto)));
    this.showDialog.set(true);
  }

  closeDialog() { this.showDialog.set(false); }

  save() {
    if (this.form.invalid) return;
    const v = this.form.value as any;
    if (v.fecha_entrada instanceof Date) v.fecha_entrada = v.fecha_entrada.toISOString().split('T')[0];
    if (v.fecha_salida  instanceof Date) v.fecha_salida  = v.fecha_salida.toISOString().split('T')[0];
    const e = this.editing();
    if (e) {
      this.ds.updateReservacion(e.id_reserva, v).subscribe({
        next: () => { this.snack.open('Reservación actualizada', 'OK', { duration: 3000 }); this.closeDialog(); this.load(); },
        error: err => this.snack.open(err.error?.error ?? 'Error al actualizar', 'OK'),
      });
    } else {
      this.ds.createReservacion(v).subscribe({
        next: () => { this.snack.open('Reservación creada', 'OK', { duration: 3000 }); this.closeDialog(); this.load(); },
        error: err => this.snack.open(err.error?.error ?? 'Error al crear', 'OK'),
      });
    }
  }

  delete(r: Reservacion) {
    if (!confirm(`¿Cancelar reservación #${r.id_reserva}?`)) return;
    this.ds.deleteReservacion(r.id_reserva).subscribe({
      next: () => { this.snack.open('Reservación cancelada', 'OK', { duration: 3000 }); this.load(); },
      error: () => this.snack.open('Error al cancelar', 'OK'),
    });
  }
}
