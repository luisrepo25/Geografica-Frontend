import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, CardComponent],
  template: `
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Configuración</h1>
        <p class="text-gray-600 mt-1">Ajusta las preferencias de tu cuenta</p>
      </div>

      <div class="space-y-4">
        <app-card [padding]="true">
          <h3 class="font-semibold text-gray-800 mb-4">Perfil</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Tu nombre">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="tu@email.com">
            </div>
          </div>
        </app-card>

        <app-card [padding]="true">
          <h3 class="font-semibold text-gray-800 mb-4">Notificaciones</h3>
          <div class="space-y-3">
            <label class="flex items-center">
              <input type="checkbox" class="rounded text-primary focus:ring-primary">
              <span class="ml-2 text-sm text-gray-700">Alertas de zona segura</span>
            </label>
            <label class="flex items-center">
              <input type="checkbox" class="rounded text-primary focus:ring-primary">
              <span class="ml-2 text-sm text-gray-700">Notificaciones push</span>
            </label>
            <label class="flex items-center">
              <input type="checkbox" class="rounded text-primary focus:ring-primary">
              <span class="ml-2 text-sm text-gray-700">Emails semanales</span>
            </label>
          </div>
        </app-card>

        <button class="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors">
          Guardar Cambios
        </button>
      </div>
    </div>
  `
})
export class SettingsComponent {}
