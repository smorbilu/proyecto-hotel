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
import { Grupo } from '../../core/models';

@Component({
  selector: 'app-grupos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule,
    MatSnackBarModule, MatTooltipModule,
  ],
  templateUrl: './grupos.component.html',
  styleUrl:    './grupos.component.scss',
})
export class GruposComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!: MatSort;

  columns    = ['id_grupo', 'nom_grupo', 'nom_evento', 'acciones'];
  dataSource = new MatTableDataSource<Grupo>([]);
  allGrupos  = signal<Grupo[]>([]);
  search     = signal('');
  showDialog = signal(false);
  editing    = signal<Grupo | null>(null);
  loading    = signal(true);

  form!: ReturnType<FormBuilder['group']>;

  constructor(private ds: DataService, private fb: FormBuilder, private snack: MatSnackBar) {
    this.form = this.fb.group({
      nom_grupo:  ['', Validators.required],
      nom_evento: ['', Validators.required],
    });
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.ds.getGrupos().subscribe({
      next: data => {
        this.allGrupos.set(data);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => { this.snack.open('Error cargando grupos', 'OK'); this.loading.set(false); },
    });
  }

  private applyFilter() {
    let data = this.allGrupos();
    const s  = this.search().toLowerCase();
    if (s) data = data.filter(g =>
      g.nom_grupo.toLowerCase().includes(s) ||
      g.nom_evento.toLowerCase().includes(s)
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

  openDialog(g?: Grupo) {
    this.editing.set(g ?? null);
    this.form.reset({ nom_grupo: '', nom_evento: '' });
    if (g) this.form.patchValue(g);
    this.showDialog.set(true);
  }

  closeDialog() { this.showDialog.set(false); }

  save() {
    if (this.form.invalid) return;
    const v = this.form.value as any;
    const e = this.editing();
    if (e) {
      this.ds.updateGrupo(e.id_grupo, v).subscribe({
        next: () => { this.snack.open('Grupo actualizado', 'OK', { duration: 3000 }); this.closeDialog(); this.load(); },
        error: () => this.snack.open('Error al actualizar', 'OK'),
      });
    } else {
      this.ds.createGrupo(v).subscribe({
        next: () => { this.snack.open('Grupo creado', 'OK', { duration: 3000 }); this.closeDialog(); this.load(); },
        error: () => this.snack.open('Error al crear grupo', 'OK'),
      });
    }
  }

  delete(g: Grupo) {
    if (!confirm(`¿Eliminar grupo "${g.nom_grupo}"?`)) return;
    this.ds.deleteGrupo(g.id_grupo).subscribe({
      next: () => { this.snack.open('Grupo eliminado', 'OK', { duration: 3000 }); this.load(); },
      error: () => this.snack.open('Error al eliminar', 'OK'),
    });
  }
}
