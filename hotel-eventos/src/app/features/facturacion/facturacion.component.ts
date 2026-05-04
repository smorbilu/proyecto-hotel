import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataService } from '../../core/services/data.service';
import { Factura } from '../../core/models';

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, FormsModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule,
    MatSnackBarModule, MatTooltipModule,
  ],
  templateUrl: './facturacion.component.html',
  styleUrl:    './facturacion.component.scss',
})
export class FacturacionComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!: MatSort;

  columns = ['id_factura', 'cliente', 'cuarto', 'grupo', 'fecha_deposit', 'monto_deposit', 'acciones'];
  dataSource = new MatTableDataSource<Factura>([]);
  allFacturas = signal<Factura[]>([]);
  search      = signal('');
  showDialog  = signal(false);
  editing     = signal<Factura | null>(null);
  loading     = signal(true);

  totalIngresos = signal(0);
  promedio      = signal(0);

  form!: ReturnType<FormBuilder['group']>;

  constructor(private ds: DataService, private fb: FormBuilder, private snack: MatSnackBar) {
    this.form = this.fb.group({
      fecha_deposit: ['', Validators.required],
      monto_deposit: [0,  [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.ds.getFacturas().subscribe({
      next: data => {
        this.allFacturas.set(data);
        const total = data.reduce((s, f) => s + Number(f.monto_deposit), 0);
        this.totalIngresos.set(total);
        this.promedio.set(data.length ? total / data.length : 0);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => { this.snack.open('Error cargando facturas', 'OK'); this.loading.set(false); },
    });
  }

  private applyFilter() {
    let data = this.allFacturas();
    const s  = this.search().toLowerCase();
    if (s) data = data.filter(f =>
      String(f.id_factura).includes(s) ||
      (f.nombre ?? '').toLowerCase().includes(s) ||
      (f.apellido ?? '').toLowerCase().includes(s)
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

  openDialog(f?: Factura) {
    this.editing.set(f ?? null);
    this.form.reset({ fecha_deposit: '', monto_deposit: 0 });
    if (f) this.form.patchValue(f);
    this.showDialog.set(true);
  }

  closeDialog() { this.showDialog.set(false); }

  save() {
    if (this.form.invalid) return;
    const v = this.form.value as any;
    if (v.fecha_deposit instanceof Date) v.fecha_deposit = v.fecha_deposit.toISOString().split('T')[0];
    v.monto_deposit = Number(v.monto_deposit);
    const e = this.editing();
    if (e) {
      this.ds.updateFactura(e.id_factura, v).subscribe({
        next: () => { this.snack.open('Factura actualizada', 'OK', { duration: 3000 }); this.closeDialog(); this.load(); },
        error: () => this.snack.open('Error al actualizar', 'OK'),
      });
    } else {
      this.ds.createFactura(v).subscribe({
        next: () => { this.snack.open('Factura emitida', 'OK', { duration: 3000 }); this.closeDialog(); this.load(); },
        error: () => this.snack.open('Error al crear factura', 'OK'),
      });
    }
  }

  delete(f: Factura) {
    if (!confirm(`¿Eliminar factura F-${f.id_factura}?`)) return;
    this.ds.deleteFactura(f.id_factura).subscribe({
      next: () => { this.snack.open('Factura eliminada', 'OK', { duration: 3000 }); this.load(); },
      error: () => this.snack.open('Error al eliminar', 'OK'),
    });
  }
}
