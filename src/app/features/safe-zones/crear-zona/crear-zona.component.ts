import { Component, OnInit, AfterViewInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import Swal from 'sweetalert2';

import { SafeZoneService } from '../../../core/services/safe-zone.service';
import { ChildService } from '../../../core/services/child.service';
import { Child } from '../../../core/models/child.model';
import { coordinatesToGeoJSON, MapCoordinate } from '../../../core/models/safe-zone.model';
import { CardComponent } from '../../../shared/components/card/card.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-crear-zona',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent
  ],
  templateUrl: './crear-zona.component.html'
})
export class CrearZonaComponent implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private safeZoneService = inject(SafeZoneService);
  private childService = inject(ChildService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  children: Child[] = [];
  loading = false;
  error = '';
  successMessage = '';

  // Mapa Leaflet
  private map!: L.Map;
  private drawnPolygon: L.Polygon | null = null;
  polygonCoordinates: MapCoordinate[] = []; // public para template
  private markers: L.Marker[] = [];
  loadingLocation = false;
  currentLocationMarker: L.Marker | null = null;

  ngOnInit() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      hijosIds: [[]]
    });

    this.loadChildren();
  }

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap() {
    // Inicializar mapa centrado en una ubicación por defecto
    this.map = L.map('map').setView([-12.0464, -77.0428], 13);

    // Intentar obtener ubicación actual automáticamente
    this.getCurrentLocation(); // Lima, Perú

    // Agregar capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Configurar eventos de click para dibujar polígono
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.addPolygonPoint(e.latlng);
    });

    // Agregar instrucciones (control personalizado)
    const InfoControl = L.Control.extend({
      onAdd: function() {
        const div = L.DomUtil.create('div', 'map-info');
        div.innerHTML = `
          <div style="background: white; padding: 10px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <strong>Instrucciones:</strong><br>
            • Haz clic en el mapa para agregar puntos<br>
            • Mínimo 3 puntos para crear un polígono<br>
            • Haz clic en "Limpiar" para reiniciar
          </div>
        `;
        return div;
      }
    });
    
    new InfoControl({ position: 'topright' }).addTo(this.map);
  }

  private addPolygonPoint(latlng: L.LatLng) {
    // Agregar marcador
    const marker = L.marker(latlng, {
      icon: L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      })
    }).addTo(this.map);
    
    this.markers.push(marker);

    // Agregar coordenada
    this.polygonCoordinates.push({ lat: latlng.lat, lng: latlng.lng });

    // Si hay al menos 3 puntos, dibujar el polígono
    if (this.polygonCoordinates.length >= 3) {
      this.updatePolygon();
    }
  }

  private updatePolygon() {
    // Eliminar polígono anterior si existe
    if (this.drawnPolygon) {
      this.map.removeLayer(this.drawnPolygon);
    }

    // Crear nuevo polígono
    const latlngs: L.LatLngExpression[] = this.polygonCoordinates.map(coord => [coord.lat, coord.lng]);
    
    this.drawnPolygon = L.polygon(latlngs, {
      color: '#1E5BFF',
      fillColor: '#1E5BFF',
      fillOpacity: 0.2
    }).addTo(this.map);

    // Ajustar vista al polígono
    this.map.fitBounds(this.drawnPolygon.getBounds());
  }

  clearPolygon() {
    // Limpiar polígono
    if (this.drawnPolygon) {
      this.map.removeLayer(this.drawnPolygon);
      this.drawnPolygon = null;
    }

    // Limpiar marcadores
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];

    // Limpiar coordenadas
    this.polygonCoordinates = [];
  }

  private loadChildren() {
    this.childService.getChildren().subscribe({
      next: (data) => {
        this.children = data;
      },
      error: (err) => {
        console.error('Error al cargar niños:', err);
      }
    });
  }

  toggleChild(childId: number) {
    const currentIds: number[] = this.form.get('hijosIds')?.value || [];
    const index = currentIds.indexOf(childId);

    if (index > -1) {
      currentIds.splice(index, 1);
    } else {
      currentIds.push(childId);
    }

    this.form.patchValue({ hijosIds: currentIds });
  }

  isChildSelected(childId: number): boolean {
    const selectedIds: number[] = this.form.get('hijosIds')?.value || [];
    return selectedIds.includes(childId);
  }

  onSubmit() {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    if (this.polygonCoordinates.length < 3) {
      this.error = 'Debes dibujar un polígono con al menos 3 puntos en el mapa';
      return;
    }

    this.loading = true;
    this.error = '';

    const formValue = this.form.value;
    const geoJSONPolygon = coordinatesToGeoJSON(this.polygonCoordinates);

    this.safeZoneService.createSafeZone({
      nombre: formValue.nombre,
      descripcion: formValue.descripcion || undefined,
      poligono: geoJSONPolygon,
      hijosIds: formValue.hijosIds
    }).subscribe({
      next: () => {
        this.loading = false;
        
        Swal.fire({
          title: '¡Éxito!',
          text: 'Zona segura creada correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#1E5BFF'
        }).then(() => {
          this.router.navigate(['/safe-zones']);
        });
      },
      error: (err: any) => {
        this.loading = false;
        Swal.fire({
          title: 'Error',
          text: err.error?.message || 'Error al crear la zona segura',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#1E5BFF'
        });
      }
    });
  }

  getCurrentLocation() {
    console.log('🌍 Botón clickeado - Iniciando geolocalización');
    console.log('Navigator.geolocation existe:', !!navigator.geolocation);
    console.log('Map existe:', !!this.map);
    
    if (!navigator.geolocation) {
      console.error('❌ Geolocalización no soportada');
      this.error = 'Geolocalización no soportada por tu navegador';
      return;
    }

    this.loadingLocation = true;
    this.error = '';
    console.log('loadingLocation establecido a true');

    // Timeout de seguridad
    const timeoutId = setTimeout(() => {
      console.log('⏱️ Timeout de 16 segundos alcanzado');
      this.loadingLocation = false;
      this.cdr.detectChanges();
      this.error = 'Tiempo de espera agotado. Verifica los permisos de ubicación.';
    }, 16000);
    
    console.log('📍 Llamando a getCurrentPosition...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ SUCCESS callback ejecutado');
        console.log('Posición:', position);
        clearTimeout(timeoutId);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log('Coordenadas:', lat, lng);

        // Centrar mapa en la ubicación actual
        console.log('Centrando mapa...');
        this.map.setView([lat, lng], 16);

        // Agregar o actualizar marcador de ubicación actual
        console.log('Agregando marcador...');
        if (this.currentLocationMarker) {
          this.map.removeLayer(this.currentLocationMarker);
        }

        this.currentLocationMarker = L.marker([lat, lng], {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
          })
        }).addTo(this.map);

        this.currentLocationMarker.bindPopup('Tu ubicación actual').openPopup();
        console.log('Marcador agregado exitosamente');
        console.log('Estableciendo loadingLocation a false');
        this.loadingLocation = false;
        this.cdr.detectChanges();
        console.log('✅ getCurrentLocation completado');
      },
      (error) => {
        console.error('❌ ERROR callback ejecutado');
        console.error('Error completo:', error);
        
        clearTimeout(timeoutId);
        this.loadingLocation = false;
        this.cdr.detectChanges(); // Forzar detección de cambios
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            console.log('❌ Permiso denegado');
            this.error = 'Permiso de ubicación denegado. Habilítalo en la configuración del navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            this.error = 'Ubicación no disponible. Verifica tu GPS/WiFi.';
            break;
          case error.TIMEOUT:
            this.error = 'Tiempo de espera agotado al obtener ubicación.';
            break;
          default:
            this.error = 'Error al obtener ubicación.';
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      }
    );
  }

  cancel() {
    this.router.navigate(['/safe-zones']);
  }
}
