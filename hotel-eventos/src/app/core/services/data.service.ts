import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cuarto, CuartoEstado, TipoCuarto, Cliente, Grupo, Factura, Reservacion, DashboardStats } from '../models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class DataService {
  constructor(private http: HttpClient) {}

  // ── Dashboard ──────────────────────────────────────────────────────────────
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${API}/dashboard`).pipe(
      catchError(() => this.buildDashboardStats()),
    );
  }

  private buildDashboardStats(): Observable<DashboardStats> {
    return forkJoin({
      cuartos: this.getCuartos(),
      clientes: this.getClientes(),
      reservaciones: this.getReservaciones(),
      facturas: this.getFacturas(),
    }).pipe(
      map(({ cuartos, clientes, reservaciones, facturas }) => {
        const totalCuartos = cuartos.length;
        const cuartosOcupados = cuartos.filter(cuarto => cuarto.id_estado === 2).length;
        const cuartosDisponibles = cuartos.filter(cuarto => cuarto.id_estado === 1).length;
        const pctOcupacion = totalCuartos > 0 ? Math.round((cuartosOcupados / totalCuartos) * 100) : 0;

        const ocupacionPorTipoMap = new Map<string, { tipo_cuarto: string; total: number; ocupados: number; pct_ocupacion: number }>();
        for (const cuarto of cuartos) {
          const current = ocupacionPorTipoMap.get(cuarto.tipo_cuarto) ?? {
            tipo_cuarto: cuarto.tipo_cuarto,
            total: 0,
            ocupados: 0,
            pct_ocupacion: 0,
          };

          current.total += 1;
          if (cuarto.id_estado === 2) {
            current.ocupados += 1;
          }
          current.pct_ocupacion = Math.round((current.ocupados / current.total) * 100);
          ocupacionPorTipoMap.set(cuarto.tipo_cuarto, current);
        }

        const reservasRecientes = [...reservaciones]
          .sort((left, right) => new Date(right.fecha_entrada).getTime() - new Date(left.fecha_entrada).getTime())
          .slice(0, 5)
          .map(reserva => ({
            id_reserva: reserva.id_reserva,
            nombre: reserva.nombre,
            apellido: reserva.apellido,
            no_cuarto: reserva.no_cuarto,
            tipo_cuarto: reserva.tipo_cuarto,
            fecha_entrada: reserva.fecha_entrada,
            fecha_salida: reserva.fecha_salida,
          }));

        return {
          totalCuartos,
          cuartosOcupados,
          cuartosDisponibles,
          pctOcupacion,
          totalClientes: clientes.length,
          totalReservas: reservaciones.length,
          totalIngresos: facturas.reduce((total, factura) => total + factura.monto_deposit, 0),
          ocupacionPorTipo: [...ocupacionPorTipoMap.values()],
          reservasRecientes,
        };
      }),
    );
  }

  // ── Cuartos ────────────────────────────────────────────────────────────────
  getCuartos(): Observable<Cuarto[]> {
    return this.http.get<Cuarto[]>(`${API}/cuartos`);
  }
  getCuarto(id: number): Observable<Cuarto> {
    return this.http.get<Cuarto>(`${API}/cuartos/${id}`);
  }
  getTiposCuarto(): Observable<TipoCuarto[]> {
    return this.http.get<TipoCuarto[]>(`${API}/cuartos/tipos`);
  }
  getEstadosCuarto(): Observable<CuartoEstado[]> {
    return this.http.get<CuartoEstado[]>(`${API}/cuartos/estados`);
  }
  patchEstadoCuarto(id: number, id_estado: number): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${API}/cuartos/${id}/estado`, { id_estado });
  }

  // ── Clientes ───────────────────────────────────────────────────────────────
  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${API}/clientes`);
  }
  createCliente(body: Omit<Cliente, 'id_cliente'>): Observable<Cliente> {
    return this.http.post<Cliente>(`${API}/clientes`, body);
  }
  updateCliente(id: number, body: Partial<Cliente>): Observable<Cliente> {
    return this.http.put<Cliente>(`${API}/clientes/${id}`, body);
  }
  deleteCliente(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${API}/clientes/${id}`);
  }

  // ── Grupos ─────────────────────────────────────────────────────────────────
  getGrupos(): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(`${API}/grupos`);
  }
  createGrupo(body: Omit<Grupo, 'id_grupo'>): Observable<Grupo> {
    return this.http.post<Grupo>(`${API}/grupos`, body);
  }
  updateGrupo(id: number, body: Partial<Grupo>): Observable<Grupo> {
    return this.http.put<Grupo>(`${API}/grupos/${id}`, body);
  }
  deleteGrupo(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${API}/grupos/${id}`);
  }

  // ── Facturas ───────────────────────────────────────────────────────────────
  getFacturas(): Observable<Factura[]> {
    return this.http.get<Factura[]>(`${API}/facturas`);
  }
  createFactura(body: Pick<Factura, 'fecha_deposit' | 'monto_deposit'>): Observable<Factura> {
    return this.http.post<Factura>(`${API}/facturas`, body);
  }
  updateFactura(id: number, body: Pick<Factura, 'fecha_deposit' | 'monto_deposit'>): Observable<Factura> {
    return this.http.put<Factura>(`${API}/facturas/${id}`, body);
  }
  deleteFactura(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${API}/facturas/${id}`);
  }

  // ── Reservaciones ──────────────────────────────────────────────────────────
  getReservaciones(): Observable<Reservacion[]> {
    return this.http.get<Reservacion[]>(`${API}/reservaciones`);
  }
  createReservacion(body: {
    id_cliente: number; id_cuarto: number;
    fecha_entrada: string; fecha_salida: string;
    descripcion?: string; notas?: string; id_factura?: number | null;
  }): Observable<Reservacion> {
    return this.http.post<Reservacion>(`${API}/reservaciones`, body);
  }
  updateReservacion(id: number, body: Partial<{
    id_cliente: number; id_cuarto: number; id_factura: number | null;
    descripcion: string; fecha_entrada: string; fecha_salida: string; notas: string;
  }>): Observable<Reservacion> {
    return this.http.put<Reservacion>(`${API}/reservaciones/${id}`, body);
  }
  deleteReservacion(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${API}/reservaciones/${id}`);
  }
}
