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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataService } from '../../core/services/data.service';
import { Cliente } from '../../core/models';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule,
    MatSnackBarModule, MatTooltipModule,
  ],
  templateUrl: './clientes.component.html',
  styleUrl:    './clientes.component.scss',
})
export class ClientesComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!: MatSort;

  columns    = ['avatar', 'nombre', 'email', 'telefono', 'acciones'];
  dataSource = new MatTableDataSource<Cliente>([]);
  allClientes = signal<Cliente[]>([]);
  search     = signal('');
  showDialog = signal(false);
  editing    = signal<Cliente | null>(null);
  loading    = signal(true);

  form!: ReturnType<FormBuilder['group']>;

  constructor(private ds: DataService, private fb: FormBuilder, private snack: MatSnackBar) {
    this.form = this.fb.group({
      nombre:   ['', Validators.required],
      apellido: ['', Validators.required],
      email:    ['', Validators.email],
      telefono: [null],
    });
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.ds.getClientes().subscribe({
      next: data => {
        this.allClientes.set(data);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => { this.snack.open('Error cargando clientes', 'OK'); this.loading.set(false); },
    });
  }

  private applyFilter() {
    let data = this.allClientes();
    const s  = this.search().toLowerCase();
    if (s) data = data.filter(c =>
      `${c.nombre} ${c.apellido}`.toLowerCase().includes(s) ||
      (c.email ?? '').toLowerCase().includes(s)
    );
    this.dataSource.data = data;
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort      = this.sort;
    });
  }

  onSearch(ev: Event) {
    this.search.set((ev.target as HTMLInputElement).value);
    this.applyFilter();
  }

  openDialog(c?: Cliente) {
    this.editing.set(c ?? null);
    this.form.reset({ nombre: '', apellido: '', email: '', telefono: null });
    if (c) this.form.patchValue(c);
    this.showDialog.set(true);
  }

  closeDialog() { this.showDialog.set(false); }

  save() {
    if (this.form.invalid) return;
    const v = this.form.value as any;
    const e = this.editing();
    if (e) {
      this.ds.updateCliente(e.id_cliente, v).subscribe({
        next: () => { this.snack.open('Cliente actualizado', 'OK', { duration: 3000 }); this.closeDialog(); this.load(); },
        error: () => this.snack.open('Error al actualizar', 'OK'),
      });
    } else {
      this.ds.createCliente(v).subscribe({
        next: () => { this.snack.open('Cliente registrado', 'OK', { duration: 3000 }); this.closeDialog(); this.load(); },
        error: () => this.snack.open('Error al crear cliente', 'OK'),
      });
    }
  }

  delete(c: Cliente) {
    if (!confirm(`¿Eliminar a ${c.nombre} ${c.apellido}?`)) return;
    this.ds.deleteCliente(c.id_cliente).subscribe({
      next: () => { this.snack.open('Cliente eliminado', 'OK', { duration: 3000 }); this.load(); },
      error: () => this.snack.open('Error al eliminar', 'OK'),
    });
  }
}
