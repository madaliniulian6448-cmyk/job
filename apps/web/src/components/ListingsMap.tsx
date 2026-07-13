import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import { getCityCoords } from "shared/src/cities";
import "leaflet/dist/leaflet.css";

// Default Leaflet marker icons reference bundled image assets by relative
// path, which breaks under Vite's asset pipeline. Point them at a CDN copy
// of the same marker images instead of shipping our own icon files.
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapListing {
  id: number;
  title: string;
  city: string;
  price: string | null;
  category: { name: string } | null;
}

export default function ListingsMap({ listings }: { listings: MapListing[] }) {
  const withCoords = listings
    .map((l) => ({ listing: l, coords: getCityCoords(l.city) }))
    .filter((x): x is { listing: MapListing; coords: [number, number] } => !!x.coords);

  if (withCoords.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-border shadow-card">
        <p className="text-muted-foreground text-sm">Niciun anunț cu localizare disponibilă pentru hartă.</p>
      </div>
    );
  }

  // Cluster nearby listings sharing the exact same city coordinate with a
  // small deterministic offset so markers don't sit exactly on top of each other.
  const seen = new Map<string, number>();
  const points = withCoords.map(({ listing, coords }) => {
    const key = `${coords[0]},${coords[1]}`;
    const idx = seen.get(key) ?? 0;
    seen.set(key, idx + 1);
    const angle = (idx * 47 * Math.PI) / 180;
    const radius = idx * 0.01;
    return {
      listing,
      position: [coords[0] + Math.sin(angle) * radius, coords[1] + Math.cos(angle) * radius] as [number, number],
    };
  });

  const center: [number, number] = [45.9432, 24.9668]; // Romania centroid

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-card">
      <MapContainer center={center} zoom={7} scrollWheelZoom={true} style={{ height: "560px", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map(({ listing, position }) => (
          <Marker key={listing.id} position={position} icon={markerIcon}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold mb-1">{listing.title}</div>
                {listing.category && <div className="text-xs text-muted-foreground mb-1">{listing.category.name}</div>}
                {listing.price && <div className="text-xs font-bold mb-2">{listing.price} lei</div>}
                <Link to={`/listing/${listing.id}`} className="text-primary text-xs font-semibold hover:underline">
                  Vezi anunțul →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
