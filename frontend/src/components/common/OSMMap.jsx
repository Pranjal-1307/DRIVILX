import React from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pin = L.divIcon({ className: "drivilx-map-pin", html: '<span style="display:block;width:16px;height:16px;border:3px solid white;border-radius:50%;background:#facc15;box-shadow:0 1px 8px #111"></span>', iconSize: [18,18], iconAnchor: [9,9] });
function Fit({ points }) { const map = useMap(); React.useEffect(() => { if (points.length === 1) map.setView(points[0], 13); else if (points.length > 1) map.fitBounds(points, { padding: [32,32] }); }, [JSON.stringify(points)]); return null; }
export default function OSMMap({ pickup, destination, geometry, height = 280 }) {
  const points = [pickup, destination].filter(p => p && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng))).map(p => [Number(p.lat), Number(p.lng)]);
  const route = geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) || [];
  const center = points[0] || [22.9734, 78.6569];
  return <div style={{ height }} className="overflow-hidden rounded-2xl border border-gray-700"><MapContainer center={center} zoom={5} scrollWheelZoom className="h-full w-full"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Fit points={points}/>{points.map((p,i)=><Marker key={i} position={p} icon={pin}><Popup>{i===0?"Pickup":"Destination"}</Popup></Marker>)}{route.length>0&&<Polyline positions={route} pathOptions={{color:"#eab308",weight:5}}/>}</MapContainer></div>;
}
