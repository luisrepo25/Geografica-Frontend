import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { 
  Child, 
  RegisterChildRequest, 
  RegisterChildResponse, 
  VinculationCodeResponse,
  UpdateChildRequest 
} from '../models/child.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChildService {
  private http = inject(HttpClient);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  /**
   * Registrar un nuevo hijo
   * POST /tutores/registrar-hijo
   */
  registerChild(data: RegisterChildRequest): Observable<RegisterChildResponse> {
    return this.http.post<RegisterChildResponse>(
      this.apiService.getUrl('/tutores/registrar-hijo'),
      data
    );
  }

  /**
   * Listar hijos del tutor autenticado
   * GET /tutores/:id/hijos
   */
  getChildren(): Observable<Child[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      throw new Error('Usuario no autenticado');
    }

    return this.http.get<Child[]>(
      this.apiService.getUrl(`/tutores/${currentUser.id}/hijos`)
    );
  }

  /**
   * Regenerar código de vinculación de un hijo
   * POST /hijos/:id/regenerar-codigo
   */
  regenerateCode(childId: number): Observable<VinculationCodeResponse> {
    return this.http.post<VinculationCodeResponse>(
      this.apiService.getUrl(`/hijos/${childId}/regenerar-codigo`),
      {}
    );
  }

  /**
   * Actualizar información de un hijo
   * PATCH /hijos/:id
   */
  updateChild(childId: number, data: UpdateChildRequest): Observable<Child> {
    return this.http.patch<Child>(
      this.apiService.getUrl(`/hijos/${childId}`),
      data
    );
  }
}
