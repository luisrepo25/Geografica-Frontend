import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-live-map',
  standalone: true,
  imports: [CommonModule, CardComponent],
  template: `
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Mapa en Vivo</h1>
        <p class="text-gray-600 mt-1">Ubicación en tiempo real de tus hijos</p>
      </div>

      <app-card [padding]="true">
        <div class="text-center py-12">
          <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Mapa en desarrollo</h3>
          <p class="text-gray-500 mb-4">Pronto podrás ver la ubicación en tiempo real</p>
        </div>
      </app-card>
    </div>
  `
})
export class LiveMapComponent {}
