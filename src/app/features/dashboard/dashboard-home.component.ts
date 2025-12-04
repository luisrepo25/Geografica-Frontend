import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AuthService } from '../../core/services/auth.service';
import { ChildService } from '../../core/services/child.service';
import { SafeZoneService } from '../../core/services/safe-zone.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, ButtonComponent],
  template: `
    <div class="space-y-6">
      <!-- Welcome Section -->
      <div class="bg-gradient-to-r from-primary to-primary-700 rounded-2xl p-8 shadow-xl">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold mb-2 text-white">¡Bienvenido, {{ currentUser?.nombre }}! 👋</h1>
            <p class="text-primary-100 text-lg">Mantén a tu familia segura en todo momento</p>
          </div>
          <div class="hidden lg:block">
            <svg class="w-32 h-32 opacity-20 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Card 1 -->
        <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-primary hover:shadow-xl transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <span class="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">+12%</span>
          </div>
          <p class="text-sm text-gray-600 mb-1">Hijos Registrados</p>
          <p class="text-3xl font-bold text-gray-800">{{ childrenCount() }}</p>
        </div>

        <!-- Card 2 -->
        <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-secondary hover:shadow-xl transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
              </svg>
            </div>
            <span class="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">Activo</span>
          </div>
          <p class="text-sm text-gray-600 mb-1">Zonas Seguras</p>
          <p class="text-3xl font-bold text-gray-800">{{ safeZonesCount() }}</p>
        </div>

        <!-- Card 3 -->
        <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <span class="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">100%</span>
          </div>
          <p class="text-sm text-gray-600 mb-1">Hijos Seguros</p>
          <p class="text-3xl font-bold text-gray-800">{{ safeChildrenCount() }}</p>
        </div>

        <!-- Card 4 -->
        <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
            </div>
            <span class="text-sm font-medium text-red-600 bg-red-100 px-3 py-1 rounded-full">3 Nuevas</span>
          </div>
          <p class="text-sm text-gray-600 mb-1">Alertas Totales</p>
          <p class="text-3xl font-bold text-gray-800">{{ alertsCount() }}</p>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Quick Actions -->
        <div class="lg:col-span-2">
          <app-card header="Acciones Rápidas" subtitle="Gestiona rápidamente tu cuenta">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button routerLink="/children/add" class="group flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary-50 transition-all">
                <div class="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all">
                  <svg class="w-8 h-8 text-primary group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                  </svg>
                </div>
                <div class="text-center">
                  <h3 class="font-semibold text-gray-800 mb-1">Agregar Hijo</h3>
                  <p class="text-sm text-gray-600">Registra un nuevo hijo</p>
                </div>
              </button>

              <button routerLink="/safe-zones/create" class="group flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-secondary hover:bg-secondary-50 transition-all">
                <div class="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center group-hover:bg-secondary group-hover:scale-110 transition-all">
                  <svg class="w-8 h-8 text-secondary group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                </div>
                <div class="text-center">
                  <h3 class="font-semibold text-gray-800 mb-1">Crear Zona Segura</h3>
                  <p class="text-sm text-gray-600">Define área de seguridad</p>
                </div>
              </button>

              <button routerLink="/map" class="group flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all">
                <div class="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center group-hover:bg-green-500 group-hover:scale-110 transition-all">
                  <svg class="w-8 h-8 text-green-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                  </svg>
                </div>
                <div class="text-center">
                  <h3 class="font-semibold text-gray-800 mb-1">Ver Mapa</h3>
                  <p class="text-sm text-gray-600">Ubicación en tiempo real</p>
                </div>
              </button>

              <button routerLink="/notifications" class="group flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all">
                <div class="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-500 group-hover:scale-110 transition-all">
                  <svg class="w-8 h-8 text-purple-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                  </svg>
                </div>
                <div class="text-center">
                  <h3 class="font-semibold text-gray-800 mb-1">Notificaciones</h3>
                  <p class="text-sm text-gray-600">Ver alertas</p>
                </div>
              </button>
            </div>
          </app-card>
        </div>

        <!-- Activity Feed -->
        <div>
          <app-card header="Actividad Reciente" subtitle="Últimas 24 horas">
            <div class="space-y-4">
              <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div class="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-800">Sistema iniciado</p>
                  <p class="text-xs text-gray-500">Hace 2 minutos</p>
                </div>
              </div>

              <div class="text-center py-8">
                <svg class="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p class="text-sm text-gray-500">No hay actividad reciente</p>
                <p class="text-xs text-gray-400 mt-1">Agrega hijos para comenzar</p>
              </div>
            </div>
          </app-card>
        </div>
      </div>

      <!-- Tips Section -->
      <div class="bg-gradient-to-r from-secondary-50 to-primary-50 rounded-2xl p-6 border border-secondary-200">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-gray-800 mb-2">💡 Consejo del día</h3>
            <p class="text-gray-700 mb-3">Para comenzar, registra a tu primer hijo y crea una zona segura alrededor de tu hogar o escuela. Recibirás notificaciones cuando entren o salgan de estas áreas.</p>
            <app-button variant="secondary" size="sm" routerLink="/children/add">
              Comenzar Ahora
            </app-button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private childService = inject(ChildService);
  private safeZoneService = inject(SafeZoneService);
  
  currentUser = this.authService.getCurrentUser();
  
  // Signals para las métricas
  childrenCount = signal<number>(0);
  safeZonesCount = signal<number>(0);
  safeChildrenCount = signal<number>(0);
  alertsCount = signal<number>(0);

  ngOnInit(): void {
    this.loadMetrics();
  }

  private loadMetrics(): void {
    // Cargar hijos registrados
    this.childService.getChildren().subscribe({
      next: (children) => {
        this.childrenCount.set(children.length);
        // Contar hijos vinculados (seguros)
        const safeChildren = children.filter(child => child.vinculado === true).length;
        this.safeChildrenCount.set(safeChildren);
      },
      error: (err) => console.error('Error al cargar hijos:', err)
    });

    // Cargar zonas seguras
    this.safeZoneService.getSafeZones().subscribe({
      next: (zones) => {
        this.safeZonesCount.set(zones.length);
      },
      error: (err) => console.error('Error al cargar zonas:', err)
    });

    // Por ahora, las alertas las dejamos en 0 (implementar en fase 5)
    this.alertsCount.set(0);
  }
}
