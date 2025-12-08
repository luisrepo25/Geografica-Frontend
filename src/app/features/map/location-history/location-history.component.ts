import { Component, OnInit, OnDestroy, AfterViewInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import Swal from 'sweetalert2';

import { CardComponent } from '../../../shared/components/card/card.component';
import { LocationHistoryService } from '../../../core/services/location-history.service';
import { ChildService } from '../../../core/services/child.service';
import { LocationRecord, DateRangePreset, LocationHistoryStats } from '../../../core/models/location-history.model';
import { Child } from '../../../core/models/child.model';

@Component({
  selector: 'app-location-history',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './location-history.component.html',
  styleUrls: ['./location-history.component.css']
})
export class LocationHistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  private locationHistoryService = inject(LocationHistoryService);
  private childService = inject(ChildService);
  private route = inject(ActivatedRoute);

  // State
  child = signal<Child | null>(null);
  records = signal<LocationRecord[]>([]);
  stats = signal<LocationHistoryStats | null>(null);
  loading = signal(true);
  selectedDateRange = signal<DateRangePreset>('today');
  customStartDate = signal('');
  customEndDate = signal('');
  
  // Map
  private map!: L.Map;
  private routeLine: L.Polyline | null = null;
  private markers: L.Marker[] = [];

  // Date range options
  dateRangeOptions: { value: DateRangePreset; label: string }[] = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'week', label: 'Última semana' },
    { value: 'month', label: 'Último mes' },
    { value: 'custom', label: 'Personalizado' }
  ];

  ngOnInit(): void {
    // Get childId from route params
    this.route.params.subscribe(params => {
      const childId = Number(params['id']);
      if (childId) {
        this.loadChild(childId);
        this.loadHistory(childId);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    // Initialize map centered on Santa Cruz, Bolivia
    this.map = L.map('historyMap').setView([-17.7833, -63.1821], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);
  }

  private loadChild(childId: number): void {
    this.childService.getChildren().subscribe({
      next: (children) => {
        const foundChild = children.find(c => c.id === childId);
        if (foundChild) {
          this.child.set(foundChild);
        } else {
          Swal.fire('Error', 'Hijo no encontrado', 'error');
        }
      },
      error: (err) => {
        console.error('Error loading child:', err);
        Swal.fire('Error', 'No se pudo cargar la información del hijo', 'error');
      }
    });
  }

  private loadHistory(childId: number): void {
    this.loading.set(true);
    
    const range = this.selectedDateRange();
    let observable;

    // Get history based on selected range
    switch (range) {
      case 'today':
        observable = this.locationHistoryService.getTodayHistory(childId);
        break;
      case 'yesterday':
        observable = this.locationHistoryService.getYesterdayHistory(childId);
        break;
      case 'week':
        observable = this.locationHistoryService.getWeekHistory(childId);
        break;
      case 'month':
        observable = this.locationHistoryService.getMonthHistory(childId);
        break;
      case 'custom':
        if (!this.customStartDate() || !this.customEndDate()) {
          this.loading.set(false);
          return;
        }
        observable = this.locationHistoryService.getLocationHistory(childId, {
          fechaInicio: new Date(this.customStartDate()).toISOString(),
          fechaFin: new Date(this.customEndDate()).toISOString()
        });
        break;
      default:
        observable = this.locationHistoryService.getTodayHistory(childId);
    }

    observable.subscribe({
      next: (records) => {
        console.log('📍 History loaded:', records.length, 'records');
        this.records.set(records);
        
        // Calculate stats
        const stats = this.locationHistoryService.calculateStats(records);
        this.stats.set(stats);
        
        // Draw route on map
        this.drawRoute(records);
        
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading history:', err);
        Swal.fire('Error', 'No se pudo cargar el historial de ubicaciones', 'error');
        this.loading.set(false);
      }
    });
  }

  private drawRoute(records: LocationRecord[]): void {
    // Clear previous route and markers
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
      this.routeLine = null;
    }
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];

    if (records.length === 0) {
      return;
    }

    // Sort by time
    const sorted = [...records].sort((a, b) => 
      new Date(a.hora).getTime() - new Date(b.hora).getTime()
    );

    // Create polyline
    const latlngs: L.LatLngExpression[] = sorted.map(r => [r.latitud, r.longitud]);
    
    this.routeLine = L.polyline(latlngs, {
      color: '#3b82f6',
      weight: 3,
      opacity: 0.7,
      smoothFactor: 1
    }).addTo(this.map);

    // Add marker for start point (green)
    const startMarker = L.marker([sorted[0].latitud, sorted[0].longitud], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(this.map);
    
    startMarker.bindPopup(`
      <b>📍 Inicio</b><br>
      ${this.formatDate(sorted[0].hora)}<br>
      ${sorted[0].fueOffline ? '⚠️ Offline' : '✅ Online'}
    `);
    this.markers.push(startMarker);

    // Add marker for end point (red)
    const endRecord = sorted[sorted.length - 1];
    const endMarker = L.marker([endRecord.latitud, endRecord.longitud], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(this.map);
    
    endMarker.bindPopup(`
      <b>🏁 Fin</b><br>
      ${this.formatDate(endRecord.hora)}<br>
      ${endRecord.fueOffline ? '⚠️ Offline' : '✅ Online'}
    `);
    this.markers.push(endMarker);

    // Fit map to route bounds
    this.map.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
  }

  // Event handlers
  onDateRangeChange(range: DateRangePreset): void {
    this.selectedDateRange.set(range);
    
    const child = this.child();
    if (child && range !== 'custom') {
      this.loadHistory(child.id);
    }
  }

  onCustomDateChange(): void {
    const child = this.child();
    if (child && this.selectedDateRange() === 'custom') {
      this.loadHistory(child.id);
    }
  }

  refreshHistory(): void {
    const child = this.child();
    if (child) {
      this.loadHistory(child.id);
    }
  }

  // Helper methods
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDistance(meters: number | undefined): string {
    if (!meters) return '0 m';
    
    if (meters < 1000) {
      return `${meters} m`;
    } else {
      return `${(meters / 1000).toFixed(2)} km`;
    }
  }

  getOfflinePercentage(): number {
    const stats = this.stats();
    if (!stats || stats.totalRecords === 0) return 0;
    
    return Math.round((stats.offlineRecords / stats.totalRecords) * 100);
  }

  playRouteAnimation(): void {
    const records = this.records();
    if (records.length === 0) {
      Swal.fire('Sin datos', 'No hay registros para reproducir', 'info');
      return;
    }

    Swal.fire({
      title: 'Reproduciendo ruta',
      html: `
        <div class="mb-4">
          <div id="animation-progress" class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-blue-600 h-2.5 rounded-full" style="width: 0%"></div>
          </div>
        </div>
        <div id="animation-time" class="text-sm text-gray-600"></div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Detener',
      allowOutsideClick: false,
      didOpen: () => {
        this.animateRoute(records);
      }
    });
  }

  private animateRoute(records: LocationRecord[]): void {
    // Sort by time
    const sorted = [...records].sort((a, b) => 
      new Date(a.hora).getTime() - new Date(b.hora).getTime()
    );

    // Create animated marker
    const animatedMarker = L.marker([sorted[0].latitud, sorted[0].longitud], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(this.map);

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex >= sorted.length || !Swal.isVisible()) {
        clearInterval(interval);
        this.map.removeLayer(animatedMarker);
        return;
      }

      const record = sorted[currentIndex];
      animatedMarker.setLatLng([record.latitud, record.longitud]);
      
      // Update progress bar
      const progress = ((currentIndex + 1) / sorted.length) * 100;
      const progressBar = document.querySelector('#animation-progress > div') as HTMLElement;
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }
      
      // Update time display
      const timeDisplay = document.getElementById('animation-time');
      if (timeDisplay) {
        timeDisplay.textContent = `${this.formatDate(record.hora)} (${currentIndex + 1}/${sorted.length})`;
      }

      currentIndex++;
    }, 500); // 500ms between frames
  }

  exportToCSV(): void {
    const records = this.records();
    if (records.length === 0) {
      Swal.fire('Sin datos', 'No hay registros para exportar', 'info');
      return;
    }

    // Create CSV content
    const headers = ['ID', 'Fecha/Hora', 'Latitud', 'Longitud', 'Modo'];
    const rows = records.map(r => [
      r.id,
      this.formatDate(r.hora),
      r.latitud,
      r.longitud,
      r.fueOffline ? 'Offline' : 'Online'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const child = this.child();
    const fileName = `historial_${child?.nombre || 'hijo'}_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire('Exportado', 'Historial exportado correctamente', 'success');
  }
}
