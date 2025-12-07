import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../../shared/components/card/card.component';
import { ChildService } from '../../../core/services/child.service';
import { Child } from '../../../core/models/child.model';
import Swal from 'sweetalert2';



@Component({
  selector: 'app-children-list',
  standalone: true,
  imports: [CommonModule, CardComponent, RouterModule],
  templateUrl: './children-list.component.html'
})
export class ChildrenListComponent implements OnInit {
  private childService = inject(ChildService);

  children = signal<Child[]>([]);
  loading = signal(true);
  errorMessage = signal('');
  regeneratingId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadChildren();
  }

  loadChildren(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.childService.getChildren().subscribe({
      next: (children) => {
        this.children.set(children);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        if (error.error?.message) {
          this.errorMessage.set(error.error.message);
        } else {
          this.errorMessage.set('Error al cargar hijos. Intenta de nuevo.');
        }
      }
    });
  }

  getInitials(child: Child): string {
    const first = child.nombre?.charAt(0) || '';
    const last = child.apellido?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  formatLastConnection(date: string | null | undefined): string {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const connection = new Date(date);
    const diff = now.getTime() - connection.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Hace un momento';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    
    return connection.toLocaleDateString();
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code);
    Swal.fire({
      title: '¡Copiado!',
      text: 'El código ha sido copiado al portapapeles',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  }

  regenerateCode(childId: number): void {
    // Confirmación antes de regenerar
    Swal.fire({
      title: '¿Regenerar Código?',
      html: `
        <div class="text-left">
          <p class="text-gray-700 mb-3">El código actual quedará inválido y se generará uno nuevo.</p>
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p class="text-sm text-yellow-800">
              <strong>Importante:</strong> El estado de vinculación se reseteará y el hijo deberá ingresar nuevamente con el nuevo código.
            </p>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, regenerar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1E5BFF',
      cancelButtonColor: '#6B7280'
    }).then((result) => {
      if (!result.isConfirmed) return;
      
      this.regeneratingId.set(childId);
      
      this.childService.regenerateCode(childId).subscribe({
        next: (response) => {
          // Actualizar el hijo en la lista con vinculado = false
          this.children.update(children => 
            children.map(child => 
              child.id === childId 
                ? { 
                    ...child, 
                    codigoVinculacion: response.codigoVinculacion,
                    vinculado: false  // ⭐ Resetear vinculado
                  }
                : child
            )
          );
          this.regeneratingId.set(null);
          
          // Mostrar el nuevo código
          Swal.fire({
            title: '¡Código Regenerado! 🔄',
            html: `
              <div class="text-left space-y-4">
                <p class="text-gray-700 mb-4">Se ha generado un nuevo código de vinculación.</p>
                <div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                  <p class="text-sm text-yellow-800 font-semibold mb-2">📱 Nuevo Código:</p>
                  <div class="bg-white rounded px-4 py-3 border border-yellow-200">
                    <code class="text-2xl font-bold text-yellow-900 tracking-widest">${response.codigoVinculacion}</code>
                  </div>
                </div>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p class="text-xs text-blue-800">
                    <strong>Nota:</strong> Comparte este código con tu hijo para que pueda acceder nuevamente a la aplicación móvil.
                  </p>
                </div>
              </div>
            `,
            icon: 'success',
            confirmButtonText: 'Copiar Código',
            confirmButtonColor: '#1E5BFF',
            showCancelButton: true,
            cancelButtonText: 'Cerrar'
          }).then((copyResult) => {
            if (copyResult.isConfirmed) {
              navigator.clipboard.writeText(response.codigoVinculacion);
              Swal.fire({
                title: '¡Copiado!',
                text: 'El código ha sido copiado al portapapeles',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
            }
          });
        },
        error: (error) => {
          this.regeneratingId.set(null);
          let errorMessage = 'Error al regenerar código';
          
          if (error.status === 401) {
            errorMessage = 'No tienes permisos para regenerar el código de este hijo';
          } else if (error.status === 404) {
            errorMessage = 'Hijo no encontrado';
          }
          
          Swal.fire({
            title: 'Error',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#1E5BFF'
          });
        }
      });
    });
  }
}
