export interface Child {
  id: number;
  nombre: string;
  apellido?: string;
  email: string;
  telefono?: string;
  latitud?: number | null;
  longitud?: number | null;
  vinculado: boolean;
  codigoVinculacion: string; // ⭐ Siempre presente (necesario para regenerar incluso si vinculado = true)
  ultimaconexion?: string | null;
  // Live tracking fields
  battery?: number;
  status?: 'online' | 'offline';
}

export interface RegisterChildRequest {
  nombre: string;
  apellido?: string;
  email: string;
  password: string;
  telefono?: string;
}

export interface RegisterChildResponse extends Child {
  codigoVinculacion: string;
}

export interface VinculationCodeResponse {
  codigoVinculacion: string;
}

export interface UpdateChildRequest {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  password?: string;
}
