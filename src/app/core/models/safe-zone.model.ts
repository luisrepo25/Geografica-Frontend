// GeoJSON Types
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitud, latitud]
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // Array de arrays de [longitud, latitud]
}

// Safe Zone Models
export interface SafeZone {
  id: number;
  nombre: string;
  descripcion?: string;
  poligono: GeoJSONPolygon;
  tutor: {
    id: number;
    nombre: string;
  };
  hijos: Array<{
    id: number;
    nombre: string;
    apellido?: string;
  }>;
  fechaCreacion: string;
}

export interface CreateSafeZoneRequest {
  nombre: string;
  descripcion?: string;
  poligono: GeoJSONPolygon;
  hijosIds: number[];
}

export interface UpdateSafeZoneRequest {
  nombre?: string;
  descripcion?: string;
  poligono?: GeoJSONPolygon;
  hijosIds?: number[];
}

// Helper type for map coordinates
export interface MapCoordinate {
  lat: number;
  lng: number;
}

// Helper function to convert coordinates to GeoJSON
export function coordinatesToGeoJSON(coords: MapCoordinate[]): GeoJSONPolygon {
  // Cerrar el polígono (primer punto = último punto)
  const closedCoords = [...coords];
  if (closedCoords.length > 0) {
    const first = closedCoords[0];
    const last = closedCoords[closedCoords.length - 1];
    if (first.lat !== last.lat || first.lng !== last.lng) {
      closedCoords.push(first);
    }
  }

  return {
    type: 'Polygon',
    coordinates: [
      closedCoords.map(coord => [coord.lng, coord.lat]) // [lng, lat] para GeoJSON
    ]
  };
}

// Helper function to convert GeoJSON to coordinates
export function geoJSONToCoordinates(polygon: GeoJSONPolygon): MapCoordinate[] {
  if (!polygon.coordinates || !polygon.coordinates[0]) {
    return [];
  }

  return polygon.coordinates[0].map(coord => ({
    lat: coord[1], // latitud está en posición 1
    lng: coord[0]  // longitud está en posición 0
  }));
}
