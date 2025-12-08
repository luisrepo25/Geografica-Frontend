import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { 
  LocationRecord, 
  CreateLocationRecordRequest, 
  SyncLocationRecordsRequest,
  LocationHistoryFilters,
  LocationHistoryStats 
} from '../models/location-history.model';

@Injectable({
  providedIn: 'root'
})
export class LocationHistoryService {
  private http = inject(HttpClient);
  private apiService = inject(ApiService);

  /**
   * Obtener registros de ubicación de un hijo
   * GET /hijos/:hijoId/registros
   * 
   * @param hijoId ID del hijo
   * @param filters Filtros opcionales (fechaInicio, fechaFin)
   * @returns Observable con array de registros ordenados por hora DESC
   */
  getLocationHistory(hijoId: number, filters?: LocationHistoryFilters): Observable<LocationRecord[]> {
    let params = new HttpParams();
    
    if (filters?.fechaInicio) {
      params = params.set('fechaInicio', filters.fechaInicio);
    }
    
    if (filters?.fechaFin) {
      params = params.set('fechaFin', filters.fechaFin);
    }

    return this.http.get<LocationRecord[]>(
      this.apiService.getUrl(`/hijos/${hijoId}/registros`),
      { params }
    );
  }

  /**
   * Obtener un registro específico
   * GET /hijos/:hijoId/registros/:id
   * 
   * @param hijoId ID del hijo
   * @param registroId ID del registro
   * @returns Observable con el registro
   */
  getLocationRecord(hijoId: number, registroId: number): Observable<LocationRecord> {
    return this.http.get<LocationRecord>(
      this.apiService.getUrl(`/hijos/${hijoId}/registros/${registroId}`)
    );
  }

  /**
   * Crear un registro de ubicación individual
   * POST /hijos/:hijoId/registros
   * 
   * NOTA: Este método es usado principalmente por la app móvil del hijo.
   * En el frontend web del tutor raramente se necesita crear registros.
   * 
   * @param hijoId ID del hijo
   * @param data Datos del registro
   * @returns Observable con el registro creado
   */
  createLocationRecord(hijoId: number, data: CreateLocationRecordRequest): Observable<LocationRecord> {
    return this.http.post<LocationRecord>(
      this.apiService.getUrl(`/hijos/${hijoId}/registros`),
      data
    );
  }

  /**
   * Sincronizar múltiples registros (modo offline batch)
   * POST /hijos/:hijoId/registros/sync
   * 
   * NOTA: Este método es usado principalmente por la app móvil del hijo
   * cuando recupera conexión después de estar offline.
   * 
   * @param hijoId ID del hijo
   * @param data Array de registros a sincronizar
   * @returns Observable con array de registros creados
   */
  syncLocationRecords(hijoId: number, data: SyncLocationRecordsRequest): Observable<LocationRecord[]> {
    return this.http.post<LocationRecord[]>(
      this.apiService.getUrl(`/hijos/${hijoId}/registros/sync`),
      data
    );
  }

  /**
   * Actualizar un registro existente
   * PUT /hijos/:hijoId/registros/:id
   * 
   * NOTA: Raramente usado ya que los registros suelen ser inmutables
   * 
   * @param hijoId ID del hijo
   * @param registroId ID del registro
   * @param data Datos a actualizar
   * @returns Observable con el registro actualizado
   */
  updateLocationRecord(hijoId: number, registroId: number, data: Partial<CreateLocationRecordRequest>): Observable<LocationRecord> {
    return this.http.put<LocationRecord>(
      this.apiService.getUrl(`/hijos/${hijoId}/registros/${registroId}`),
      data
    );
  }

  /**
   * Eliminar un registro
   * DELETE /hijos/:hijoId/registros/:id
   * 
   * @param hijoId ID del hijo
   * @param registroId ID del registro
   * @returns Observable void
   */
  deleteLocationRecord(hijoId: number, registroId: number): Observable<void> {
    return this.http.delete<void>(
      this.apiService.getUrl(`/hijos/${hijoId}/registros/${registroId}`)
    );
  }

  // ========== MÉTODOS HELPER ==========

  /**
   * Obtener registros de hoy
   */
  getTodayHistory(hijoId: number): Observable<LocationRecord[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getLocationHistory(hijoId, {
      fechaInicio: today.toISOString(),
      fechaFin: tomorrow.toISOString()
    });
  }

  /**
   * Obtener registros de ayer
   */
  getYesterdayHistory(hijoId: number): Observable<LocationRecord[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.getLocationHistory(hijoId, {
      fechaInicio: yesterday.toISOString(),
      fechaFin: today.toISOString()
    });
  }

  /**
   * Obtener registros de la última semana
   */
  getWeekHistory(hijoId: number): Observable<LocationRecord[]> {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return this.getLocationHistory(hijoId, {
      fechaInicio: weekAgo.toISOString(),
      fechaFin: today.toISOString()
    });
  }

  /**
   * Obtener registros del último mes
   */
  getMonthHistory(hijoId: number): Observable<LocationRecord[]> {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return this.getLocationHistory(hijoId, {
      fechaInicio: monthAgo.toISOString(),
      fechaFin: today.toISOString()
    });
  }

  /**
   * Calcular estadísticas del historial
   */
  calculateStats(records: LocationRecord[]): LocationHistoryStats {
    if (records.length === 0) {
      return {
        totalRecords: 0,
        onlineRecords: 0,
        offlineRecords: 0,
        dateRange: {
          start: new Date().toISOString(),
          end: new Date().toISOString()
        }
      };
    }

    const onlineRecords = records.filter(r => !r.fueOffline).length;
    const offlineRecords = records.filter(r => r.fueOffline).length;

    // Ordenar por hora para obtener primer y último registro
    const sorted = [...records].sort((a, b) => 
      new Date(a.hora).getTime() - new Date(b.hora).getTime()
    );

    // Calcular distancia total aproximada (usando fórmula de Haversine)
    const distance = this.calculateTotalDistance(sorted);

    return {
      totalRecords: records.length,
      onlineRecords,
      offlineRecords,
      dateRange: {
        start: sorted[0].hora,
        end: sorted[sorted.length - 1].hora
      },
      distance
    };
  }

  /**
   * Calcular distancia total recorrida en metros
   * Usando fórmula de Haversine
   */
  private calculateTotalDistance(records: LocationRecord[]): number {
    if (records.length < 2) return 0;

    let totalDistance = 0;

    for (let i = 0; i < records.length - 1; i++) {
      const point1 = records[i];
      const point2 = records[i + 1];
      
      totalDistance += this.haversineDistance(
        point1.latitud, 
        point1.longitud,
        point2.latitud, 
        point2.longitud
      );
    }

    return Math.round(totalDistance);
  }

  /**
   * Calcular distancia entre dos puntos GPS (Haversine)
   * @returns Distancia en metros
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
