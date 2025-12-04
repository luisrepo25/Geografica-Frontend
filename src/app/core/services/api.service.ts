import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  /**
   * Construye la URL completa para un endpoint
   * @param endpoint - Ruta del endpoint (ej: '/tutores', '/zonas-seguras')
   * @returns URL completa
   */
  getUrl(endpoint: string): string {
    // Asegura que el endpoint comience con /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${normalizedEndpoint}`;
  }

  /**
   * Retorna la URL base del API
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
