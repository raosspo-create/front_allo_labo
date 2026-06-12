'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import icon from 'leaflet/dist/images/marker-icon.png';
import shadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

const DefaultIcon = L.icon({
  iconUrl: typeof icon === 'string' ? icon : icon.src,
  iconRetinaUrl: typeof iconRetina === 'string' ? iconRetina : iconRetina.src,
  shadowUrl: typeof shadow === 'string' ? shadow : shadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

type LatLng = { lat: number; lng: number };

function MapViewportSync({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center.lat, center.lng, zoom, map]);
  return null;
}

function MapClickHandler({ onPick }: { onPick: (coords: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

type ClientLocationMapProps = {
  center: LatLng;
  marker: LatLng | null;
  zoom?: number;
  heightClassName?: string;
  interactive?: boolean;
  onMarkerMove?: (coords: LatLng) => void;
};

export function ClientLocationMap({
  center,
  marker,
  zoom = 14,
  heightClassName = 'h-56',
  interactive = true,
  onMarkerMove,
}: ClientLocationMapProps) {
  const displayMarker = marker ?? center;

  return (
    <div className={`overflow-hidden rounded-lg border border-slate-200 ${heightClassName}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewportSync center={center} zoom={zoom} />
        {interactive && onMarkerMove ? <MapClickHandler onPick={onMarkerMove} /> : null}
        <Marker
          position={displayMarker}
          draggable={interactive && Boolean(onMarkerMove)}
          eventHandlers={
            onMarkerMove
              ? {
                  dragend(e) {
                    const m = e.target;
                    const pos = m.getLatLng();
                    onMarkerMove({ lat: pos.lat, lng: pos.lng });
                  },
                }
              : undefined
          }
        />
      </MapContainer>
    </div>
  );
}
