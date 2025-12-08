/**
 * Modelo de Registro de Ubicación
 * Representa un punto GPS histórico almacenado en la base de datos
 */
export interface LocationRecord {
  id: number;
  hora: string;                    // ISO 8601 timestamp - momento de captura en el dispositivo
  latitud: number;                 // Coordenada GPS (-90 a 90)
  longitud: number;                // Coordenada GPS (-180 a 180)
  hijoId: number;                  // ID del hijo al que pertenece
  fueOffline: boolean;             // Si fue capturado sin conexión
  creadoEn: string;                // ISO 8601 timestamp - momento de inserción en BD
}

/**
 * Request para crear un registro individual
 */
export interface CreateLocationRecordRequest {
  hora: string;                    // ISO 8601 timestamp
  latitud: number;
  longitud: number;
  fueOffline?: boolean;            // Opcional, default: false
}

/**
 * Request para sincronización batch (modo offline)
 */
export interface SyncLocationRecordsRequest {
  registros: CreateLocationRecordRequest[];
}

/**
 * Filtros para consultar historial
 */
export interface LocationHistoryFilters {
  fechaInicio?: string;            // ISO 8601 timestamp
  fechaFin?: string;               // ISO 8601 timestamp
}

/**
 * Tipo de rango de fecha predefinido
 */
export type DateRangePreset = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

/**
 * Estadísticas del historial de ubicaciones
 */
export interface LocationHistoryStats {
  totalRecords: number;
  onlineRecords: number;
  offlineRecords: number;
  dateRange: {
    start: string;
    end: string;
  };
  distance?: number;               // Distancia total recorrida en metros (opcional)
}
