export interface TipoCuarto {
  id_tipo_cuarto: number;
  tipo_cuarto: string;
  precio: number;
}

export interface CuartoEstado {
  id_estado: number;
  estado: string;
}

// GET /api/cuartos returns joined fields flat
export interface Cuarto {
  id_cuarto: number;
  no_cuarto: string;
  descripcion: string;
  id_tipo_cuarto: number;
  tipo_cuarto: string;
  precio: number;
  id_estado: number;
  estado: string;
}

export interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido: string;
  telefono: number | null;
  email: string | null;
}

export interface Grupo {
  id_grupo: number;
  nom_grupo: string;
  nom_evento: string;
}

// factura table: only id_factura, fecha_deposit, monto_deposit
// GET /api/facturas returns joined fields flat
export interface Factura {
  id_factura: number;
  fecha_deposit: string;
  monto_deposit: number;
  // joined (may be null if no reserva linked)
  id_reserva?: number | null;
  id_cuarto?: number | null;
  no_cuarto?: string | null;
  cuarto_desc?: string | null;
  id_cliente?: number | null;
  nombre?: string | null;
  apellido?: string | null;
  id_grupo?: number | null;
  nom_grupo?: string | null;
  nom_evento?: string | null;
}

// reservaciones table: id_reserva, id_cliente, id_factura, id_cuarto, descripcion, fecha_entrada, fecha_salida, notas
// GET /api/reservaciones returns joined fields flat
export interface Reservacion {
  id_reserva: number;
  descripcion: string;
  fecha_entrada: string;
  fecha_salida: string;
  notas: string;
  id_cliente: number;
  nombre: string;
  apellido: string;
  id_cuarto: number;
  no_cuarto: string;
  cuarto_desc: string;
  tipo_cuarto: string;
  precio: number;
  id_factura: number | null;
  id_grupo?: number | null;
  nom_grupo?: string | null;
  nom_evento?: string | null;
}

export interface DashboardStats {
  totalCuartos: number;
  cuartosOcupados: number;
  cuartosDisponibles: number;
  pctOcupacion: number;
  totalClientes: number;
  totalReservas: number;
  totalIngresos: number;
  ocupacionPorTipo: { tipo_cuarto: string; total: number; ocupados: number; pct_ocupacion: number }[];
  reservasRecientes: { id_reserva: number; nombre: string; apellido: string; no_cuarto: string; tipo_cuarto: string; fecha_entrada: string; fecha_salida: string }[];
}
