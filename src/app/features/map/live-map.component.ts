import { Component, OnInit, OnDestroy, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import Swal from 'sweetalert2';

import { CardComponent } from '../../shared/components/card/card.component';
import { SocketService, LocationUpdate, StatusChange, PanicAlert } from '../../core/services/socket.service';
import { ChildService } from '../../core/services/child.service';
import { SafeZoneService } from '../../core/services/safe-zone.service';
import { Child } from '../../core/models/child.model';
import { SafeZone } from '../../core/models/safe-zone.model';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LiveChild extends Child {
  marker?: L.Marker;
}

@Component({
  selector: 'app-live-map',
  standalone: true,
  imports: [CommonModule, CardComponent],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Mapa en Vivo</h1>
          <p class="text-gray-600 mt-1">Ubicación en tiempo real de tus hijos</p>
        </div>
        <div class="flex items-center gap-4">
          <!-- Connection status -->
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
               [class.bg-green-100]="isConnected"
               [class.text-green-700]="isConnected"
               [class.bg-red-100]="!isConnected"
               [class.text-red-700]="!isConnected">
            <span class="w-2 h-2 rounded-full" 
                  [class.bg-green-500]="isConnected"
                  [class.bg-red-500]="!isConnected"></span>
            {{ isConnected ? 'Conectado' : 'Desconectado' }}
          </div>
          <!-- Refresh button -->
          <button (click)="refreshChildren()" 
                  class="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  title="Actualizar">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Map container -->
      <app-card [padding]="false">
        <div id="map" class="w-full h-[500px] rounded-lg"></div>
      </app-card>

      <!-- Children list -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (child of liveChildren; track child.id) {
          <app-card [padding]="true">
            <div class="flex items-center gap-4">
              <!-- Avatar with status indicator -->
              <div class="relative">
                <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                  {{ getChildEmoji(child) }}
                </div>
                <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                      [class.bg-green-500]="child.status === 'online'"
                      [class.bg-gray-400]="child.status !== 'online'">
                </span>
              </div>
              
              <!-- Info -->
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-800 truncate">{{ child.nombre }} {{ child.apellido || '' }}</h3>
                <p class="text-sm text-gray-500">
                  {{ child.status === 'online' ? 'En línea' : 'Desconectado' }}
                </p>
                @if (child.battery !== undefined && child.battery !== null) {
                  <div class="flex items-center gap-1 mt-1">
                    <svg class="w-4 h-4" [class.text-green-500]="child.battery > 20" 
                         [class.text-red-500]="child.battery <= 20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 8v8H2V8h14m2-2H0v12h18v-3h2V9h-2V6z"/>
                      <path [attr.d]="getBatteryFillPath(child.battery)"/>
                    </svg>
                    <span class="text-xs text-gray-500">{{ child.battery }}%</span>
                  </div>
                }
              </div>
              
              <!-- Center on map button -->
              <button (click)="centerOnChild(child)" 
                      class="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                      title="Centrar en mapa"
                      [disabled]="!hasValidLocation(child)">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </button>
            </div>
          </app-card>
        }
        
        @if (liveChildren.length === 0 && !loading) {
          <app-card [padding]="true" class="col-span-full">
            <div class="text-center py-8">
              <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <p class="text-gray-500">No tienes hijos registrados</p>
            </div>
          </app-card>
        }
        
        @if (loading) {
          <app-card [padding]="true" class="col-span-full">
            <div class="text-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p class="text-gray-500 mt-4">Cargando...</p>
            </div>
          </app-card>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    #map { z-index: 1; }
  `]
})
export class LiveMapComponent implements OnInit, AfterViewInit, OnDestroy {
  private socketService = inject(SocketService);
  private childService = inject(ChildService);
  private safeZoneService = inject(SafeZoneService);

  private map!: L.Map;
  private childMarkers = new Map<number, L.Marker>();
  private zonePolygons: L.Polygon[] = [];
  private subscriptions: Subscription[] = [];

  liveChildren: LiveChild[] = [];
  loading = true;
  isConnected = false;

  ngOnInit(): void {
    // Subscribe to connection status
    this.subscriptions.push(
      this.socketService.connectionStatus$.subscribe(connected => {
        this.isConnected = connected;
      })
    );

    // Subscribe to location updates
    this.subscriptions.push(
      this.socketService.locationUpdated$.subscribe(update => {
        this.handleLocationUpdate(update);
      })
    );

    // Subscribe to status changes
    this.subscriptions.push(
      this.socketService.statusChanged$.subscribe(status => {
        this.handleStatusChange(status);
      })
    );

    // Subscribe to panic alerts
    this.subscriptions.push(
      this.socketService.panicAlert$.subscribe(alert => {
        this.handlePanicAlert(alert);
      })
    );
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    // Initialize map centered on Santa Cruz, Bolivia
    this.map = L.map('map').setView([-17.7833, -63.1821], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  private loadData(): void {
    this.loading = true;

    // Load children
    this.childService.getChildren().subscribe({
      next: (children) => {
        console.log('📍 Children loaded:', children.length);
        this.liveChildren = children.map(c => ({ ...c, status: 'offline' as const }));

        // Connect socket and join rooms
        this.socketService.connect();

        // Wait for connection before joining rooms
        setTimeout(() => {
          children.forEach(child => {
            this.socketService.joinChildRoom(child.id);
          });
        }, 1000);

        // Add markers for children with location
        this.updateChildMarkers();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading children:', err);
        this.loading = false;
      }
    });

    // Load safe zones
    this.safeZoneService.getSafeZones().subscribe({
      next: (zones) => {
        console.log('🛡️ Safe zones loaded:', zones.length);
        this.drawSafeZones(zones);
      },
      error: (err) => {
        console.error('Error loading safe zones:', err);
      }
    });
  }

  private updateChildMarkers(): void {
    this.liveChildren.forEach(child => {
      if (this.hasValidLocation(child)) {
        this.addOrUpdateMarker(child);
      }
    });

    // Fit bounds if we have markers
    if (this.childMarkers.size > 0) {
      const group = L.featureGroup(Array.from(this.childMarkers.values()));
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  private addOrUpdateMarker(child: LiveChild): void {
    const lat = child.latitud!;
    const lng = child.longitud!;
    const isOnline = child.status === 'online';

    const icon = L.divIcon({
      html: `
        <div class="relative flex flex-col items-center">
          <div class="px-2 py-1 bg-white rounded-full shadow text-xs font-medium mb-1 flex items-center gap-1">
            <span class="w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}"></span>
            ${child.battery !== undefined ? child.battery + '%' : ''}
          </div>
          <div class="w-10 h-10 rounded-full ${isOnline ? 'bg-blue-500' : 'bg-gray-400'} flex items-center justify-center text-white text-lg shadow-lg border-2 border-white">
            ${this.getChildEmoji(child)}
          </div>
          <div class="px-2 py-0.5 bg-white rounded shadow text-xs font-medium mt-1">
            ${child.nombre}
          </div>
        </div>
      `,
      className: 'child-marker',
      iconSize: [80, 80],
      iconAnchor: [40, 60]
    });

    if (this.childMarkers.has(child.id)) {
      // Update existing marker
      const marker = this.childMarkers.get(child.id)!;
      marker.setLatLng([lat, lng]);
      marker.setIcon(icon);
    } else {
      // Create new marker
      const marker = L.marker([lat, lng], { icon }).addTo(this.map);
      marker.bindPopup(`
        <div class="text-center">
          <strong>${child.nombre} ${child.apellido || ''}</strong><br>
          <span class="text-sm text-gray-600">${isOnline ? 'En línea' : 'Desconectado'}</span><br>
          ${child.battery !== undefined ? `<span class="text-sm">Batería: ${child.battery}%</span>` : ''}
        </div>
      `);
      this.childMarkers.set(child.id, marker);
    }
  }

  private drawSafeZones(zones: SafeZone[]): void {
    // Clear existing polygons
    this.zonePolygons.forEach(p => p.remove());
    this.zonePolygons = [];

    zones.forEach(zone => {
      if (zone.poligono && zone.poligono.coordinates && zone.poligono.coordinates[0]) {
        // GeoJSON coordinates are [lng, lat], Leaflet needs [lat, lng]
        const coords = zone.poligono.coordinates[0].map((coord: number[]) =>
          [coord[1], coord[0]] as L.LatLngTuple
        );

        const polygon = L.polygon(coords, {
          color: this.getZoneColor(zone),
          fillColor: this.getZoneColor(zone),
          fillOpacity: 0.3,
          weight: 2
        }).addTo(this.map);

        polygon.bindPopup(`<strong>${zone.nombre}</strong>${zone.descripcion ? '<br>' + zone.descripcion : ''}`);
        this.zonePolygons.push(polygon);
      }
    });
  }

  private getZoneColor(zona: SafeZone): string {
    // Use a consistent color based on zone name or default blue
    const colors = ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ef4444'];
    const index = zona.id % colors.length;
    return colors[index];
  }

  private handleLocationUpdate(update: LocationUpdate): void {
    const childId = parseInt(update.childId, 10);
    const childIndex = this.liveChildren.findIndex(c => c.id === childId);

    if (childIndex !== -1) {
      // Update child data
      this.liveChildren[childIndex] = {
        ...this.liveChildren[childIndex],
        latitud: update.lat,
        longitud: update.lng,
        battery: update.battery,
        status: 'online'
      };

      // Update marker
      this.addOrUpdateMarker(this.liveChildren[childIndex]);

      console.log(`📍 Updated location for ${this.liveChildren[childIndex].nombre}:`, update.lat, update.lng);
    }
  }

  private handleStatusChange(status: StatusChange): void {
    const childId = parseInt(status.childId, 10);
    const childIndex = this.liveChildren.findIndex(c => c.id === childId);

    if (childIndex !== -1) {
      this.liveChildren[childIndex] = {
        ...this.liveChildren[childIndex],
        status: status.online ? 'online' : 'offline'
      };

      // Update marker appearance
      if (this.hasValidLocation(this.liveChildren[childIndex])) {
        this.addOrUpdateMarker(this.liveChildren[childIndex]);
      }

      console.log(`👶 Status changed for ${this.liveChildren[childIndex].nombre}: ${status.online ? 'online' : 'offline'}`);
    }
  }

  private handlePanicAlert(alert: PanicAlert): void {
    const childId = parseInt(alert.childId, 10);
    const child = this.liveChildren.find(c => c.id === childId);

    const childName = child ? `${child.nombre} ${child.apellido || ''}` : 'Tu hijo';

    Swal.fire({
      icon: 'warning',
      title: '🚨 ¡ALERTA DE PÁNICO!',
      html: `
        <p><strong>${childName}</strong> ha enviado una alerta de emergencia.</p>
        <p class="text-sm text-gray-500 mt-2">Ubicación: ${alert.lat.toFixed(6)}, ${alert.lng.toFixed(6)}</p>
      `,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#ef4444',
      allowOutsideClick: false
    });

    // Center map on alert location
    if (this.map) {
      this.map.setView([alert.lat, alert.lng], 16);
    }

    // Add pulsing alert marker
    const alertIcon = L.divIcon({
      html: `<div class="w-8 h-8 bg-red-500 rounded-full animate-ping"></div>`,
      className: 'alert-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const alertMarker = L.marker([alert.lat, alert.lng], { icon: alertIcon }).addTo(this.map);

    // Remove alert marker after 10 seconds
    setTimeout(() => alertMarker.remove(), 10000);
  }

  centerOnChild(child: LiveChild): void {
    if (this.hasValidLocation(child) && this.map) {
      this.map.setView([child.latitud!, child.longitud!], 16);

      // Open popup
      const marker = this.childMarkers.get(child.id);
      if (marker) {
        marker.openPopup();
      }
    }
  }

  refreshChildren(): void {
    this.loadData();
  }

  hasValidLocation(child: LiveChild): boolean {
    return child.latitud !== null && child.latitud !== undefined && child.latitud !== 0 &&
      child.longitud !== null && child.longitud !== undefined && child.longitud !== 0;
  }

  getChildEmoji(child: LiveChild): string {
    const emojis = ['👦', '👧', '🧒', '👶'];
    const index = child.id % emojis.length;
    return emojis[index];
  }

  getBatteryFillPath(battery: number): string {
    const width = Math.max(1, Math.floor((battery / 100) * 12));
    return `M2 9h${width}v6H2z`;
  }
}
