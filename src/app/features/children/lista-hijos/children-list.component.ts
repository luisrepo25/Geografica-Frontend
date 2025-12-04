import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../../shared/components/card/card.component';
import { ChildService } from '../../../core/services/child.service';
import { Child } from '../../../core/models/child.model';



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
    // Podrías agregar un toast notification aquí
  }

  regenerateCode(childId: number): void {
    this.regeneratingId.set(childId);
    
    this.childService.regenerateCode(childId).subscribe({
      next: (response) => {
        // Actualizar el código en la lista
        this.children.update(children => 
          children.map(child => 
            child.id === childId 
              ? { ...child, codigoVinculacion: response.codigoVinculacion }
              : child
          )
        );
        this.regeneratingId.set(null);
      },
      error: (error) => {
        this.regeneratingId.set(null);
        if (error.status === 409) {
          this.errorMessage.set('Este hijo ya está vinculado');
        } else {
          this.errorMessage.set('Error al regenerar código');
        }
        setTimeout(() => this.errorMessage.set(''), 3000);
      }
    });
  }
}
