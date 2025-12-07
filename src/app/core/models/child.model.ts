export interface Child {
  id: number;
  nombre: string;
  apellido?: string;
  email: string;          // ⚠️ Email temporal generado por backend - NO mostrar al usuario
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
  nombre: string;         // REQUERIDO, min 3 caracteres
  apellido?: string;      // OPCIONAL, min 2 caracteres si se envía
  telefono?: string;      // OPCIONAL, min 7 caracteres si se envía
  // ⚠️ NO ENVIAR email ni password - backend los genera automáticamente
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
