import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SafeZoneService } from '../../../core/services/safe-zone.service';
import { SafeZone } from '../../../core/models/safe-zone.model';
import { CardComponent } from '../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { SanitizePipe } from '../../../shared/pipes/sanitize.pipe';

@Component({
  selector: 'app-lista-zonas',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent, SanitizePipe],
  templateUrl: './lista-zonas.component.html'
})
export class ListaZonasComponent implements OnInit {
  private safeZoneService = inject(SafeZoneService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  safeZones: SafeZone[] = [];
  loading = true;
  error = '';
  deletingId: number | null = null;

  ngOnInit() {
    this.loadSafeZones();
  }

  loadSafeZones() {
    this.loading = true;
    this.error = '';

    this.safeZoneService.getSafeZones().subscribe({
      next: (data: SafeZone[]) => {
        this.safeZones = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error al cargar las zonas seguras';
        this.loading = false;
      }
    });
  }

  createZone() {
    this.router.navigate(['/safe-zones/create']);
  }

  editZone(id: number) {
    this.router.navigate([`/safe-zones/edit/${id}`]);
  }

  deleteZone(zone: SafeZone) {
    if (!confirm(`¿Estás seguro de eliminar la zona "${zone.nombre}"?`)) {
      return;
    }

    this.deletingId = zone.id;

    this.safeZoneService.deleteSafeZone(zone.id).subscribe({
      next: () => {
        this.safeZones = this.safeZones.filter(z => z.id !== zone.id);
        this.deletingId = null;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error al eliminar la zona segura';
        this.deletingId = null;
      }
    });
  }

  getPolygonCenter(zone: SafeZone): { lat: number; lng: number } {
    const coords = zone.poligono.coordinates[0];
    const sum = coords.reduce(
      (acc, coord) => ({
        lat: acc.lat + coord[1],
        lng: acc.lng + coord[0]
      }),
      { lat: 0, lng: 0 }
    );

    return {
      lat: sum.lat / coords.length,
      lng: sum.lng / coords.length
    };
  }

  getMapPreviewUrl(zone: SafeZone): string {
    const center = this.getPolygonCenter(zone);
    return `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.01},${center.lat - 0.01},${center.lng + 0.01},${center.lat + 0.01}&layer=mapnik&marker=${center.lat},${center.lng}`;
  }
}
