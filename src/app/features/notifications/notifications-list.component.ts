import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-notifications-list',
  standalone: true,
  imports: [CommonModule, CardComponent],
  template: `
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Notificaciones</h1>
        <p class="text-gray-600 mt-1">Alertas y notificaciones del sistema</p>
      </div>

      <app-card [padding]="true">
        <div class="text-center py-12">
          <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No hay notificaciones</h3>
          <p class="text-gray-500">Todas las alertas aparecerán aquí</p>
        </div>
      </app-card>
    </div>
  `
})
export class NotificationsListComponent {}
