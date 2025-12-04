import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { 
  SafeZone, 
  CreateSafeZoneRequest, 
  UpdateSafeZoneRequest 
} from '../models/safe-zone.model';

@Injectable({
  providedIn: 'root'
})
export class SafeZoneService {
  private http = inject(HttpClient);
  private apiService = inject(ApiService);

  /**
   * Crear nueva zona segura
   * POST /zonas-seguras
   */
  createSafeZone(data: CreateSafeZoneRequest): Observable<SafeZone> {
    return this.http.post<SafeZone>(
      this.apiService.getUrl('/zonas-seguras'),
      data
    );
  }

  /**
   * Obtener todas las zonas seguras del tutor autenticado
   * GET /zonas-seguras
   */
  getSafeZones(): Observable<SafeZone[]> {
    return this.http.get<SafeZone[]>(
      this.apiService.getUrl('/zonas-seguras')
    );
  }

  /**
   * Obtener una zona segura por ID
   * GET /zonas-seguras/:id
   */
  getById(id: number): Observable<SafeZone> {
    return this.http.get<SafeZone>(
      this.apiService.getUrl(`/zonas-seguras/${id}`)
    );
  }

  /**
   * Actualizar zona segura
   * PATCH /zonas-seguras/:id
   */
  updateSafeZone(id: number, data: UpdateSafeZoneRequest): Observable<SafeZone> {
    return this.http.patch<SafeZone>(
      this.apiService.getUrl(`/zonas-seguras/${id}`),
      data
    );
  }

  /**
   * Eliminar zona segura
   * DELETE /zonas-seguras/:id
   */
  deleteSafeZone(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      this.apiService.getUrl(`/zonas-seguras/${id}`)
    );
  }
}
