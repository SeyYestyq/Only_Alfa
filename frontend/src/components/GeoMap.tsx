import { useEffect, useState } from "react";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const ALFA_RED = "#EF3124";
const ANTHRACITE = "#1A1D24";
const RADIUS_METERS = 400;

interface GeoMapProps {
  latitude: number;
  longitude: number;
  city: string;
  address: string;
  competitorsCount: number;
}

function TileFailureWatcher({ onFail }: { onFail: () => void }) {
  useMapEvents({
    tileerror: () => {
      onFail();
    },
  });
  return null;
}

/** Offline-first map: OSM tiles with SVG grid fallback (ТЗ-05 offline check). */
export function GeoMap({
  latitude,
  longitude,
  city,
  address,
  competitorsCount,
}: GeoMapProps) {
  const [tilesFailed, setTilesFailed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="map-offline-svg" aria-hidden />;
  }

  return (
    <div className={`map-leaflet ${tilesFailed ? "map-offline" : ""}`}>
      {tilesFailed && (
        <svg className="map-offline-svg" viewBox="0 0 400 270" aria-hidden>
          <defs>
            <pattern id="streetGrid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(26,29,36,0.12)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="400" height="270" fill="#eef2f7" />
          <rect width="400" height="270" fill="url(#streetGrid)" />
          <path d="M40 80 H360 M80 40 V230 M200 20 V250 M320 50 V220" stroke="rgba(26,29,36,0.18)" strokeWidth="3" />
          <circle cx="200" cy="135" r="48" fill="rgba(239,49,36,0.12)" stroke={ALFA_RED} strokeWidth="2" />
          <circle cx="200" cy="135" r="7" fill={ALFA_RED} />
          <text x="200" y="250" textAnchor="middle" fontSize="11" fill="#5f6875">
            Офлайн-схема квартала · тайлы OSM недоступны
          </text>
        </svg>
      )}
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        className="map-container"
        attributionControl={!tilesFailed}
      >
        {!tilesFailed && (
          <>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <TileFailureWatcher onFail={() => setTilesFailed(true)} />
          </>
        )}
        <Circle
          center={[latitude, longitude]}
          radius={RADIUS_METERS}
          pathOptions={{ color: ALFA_RED, fillColor: ALFA_RED, fillOpacity: 0.12, weight: 2 }}
        />
        <CircleMarker
          center={[latitude, longitude]}
          radius={8}
          pathOptions={{ color: "#fff", weight: 2, fillColor: ALFA_RED, fillOpacity: 1 }}
        >
          <Popup>
            {city}, {address}
            <br />
            Конкурентов в {RADIUS_METERS} м: {competitorsCount}
          </Popup>
        </CircleMarker>
        {Array.from({ length: Math.min(competitorsCount, 6) }, (_, index) => {
          const angle = (index / 6) * Math.PI * 2;
          const lat = latitude + Math.cos(angle) * 0.0018;
          const lon = longitude + Math.sin(angle) * 0.0022;
          return (
            <CircleMarker
              key={`comp-${index}`}
              center={[lat, lon]}
              radius={5}
              pathOptions={{ color: "#fff", weight: 1, fillColor: ANTHRACITE, fillOpacity: 0.85 }}
            >
              <Popup>Конкурент · amenity=cafe</Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
