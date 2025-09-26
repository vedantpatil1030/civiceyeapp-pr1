import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../config/axios';
import { FiMapPin } from 'react-icons/fi';

// Fix default marker icons (Vite bundling)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const priorityToColor = (priority) => {
  switch ((priority || '').toUpperCase()) {
    case 'HIGH':
      return 'red';
    case 'MEDIUM':
      return 'orange';
    case 'LOW':
    default:
      return 'green';
  }
};

function createColoredIcon(color) {
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='32' height='32' fill='${color}'><path d='M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z'/></svg>`
  );
  return L.icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${svg}`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

const MapView = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/issues/all');
        const list = res.data?.data || res.data?.issues || [];
        setIssues(list);
      } catch (e) {
        setError('Failed to load issues');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const center = useMemo(() => {
    // Default to Ranchi; recent issue location if exists
    const first = issues.find((i) => i.location?.coordinates?.length === 2);
    if (first) {
      const [lng, lat] = first.location.coordinates;
      return [lat, lng];
    }
    return [23.3441, 85.3096];
  }, [issues]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        <span className="ml-3 text-blue-700">Loading map...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">{error}</div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
          <FiMapPin className="h-6 w-6" /> Issues Map
        </h1>
      </div>

      <div className="h-[70vh] w-full overflow-hidden rounded-xl ring-1 ring-slate-200">
        <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {issues.filter(i => i.location?.coordinates?.length === 2).map((issue) => {
            const [lng, lat] = issue.location.coordinates;
            const color = priorityToColor(issue.priority);
            return (
              <Marker key={issue._id} position={[lat, lng]} icon={createColoredIcon(color)}>
                <Popup minWidth={260} maxWidth={320} className="text-sm">
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-800">{issue.title || 'Issue'}</div>
                    <div className="text-slate-600">{issue.location?.address || 'No address'}</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-medium">{issue.status || 'REPORTED'}</span>
                      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-medium">{issue.priority || 'LOW'}</span>
                      {issue.finalDept && <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-medium">{issue.finalDept}</span>}
                    </div>
                    {issue.images?.length > 0 && (
                      <img src={issue.images[0]} alt="issue" className="mt-2 h-24 w-full object-cover rounded" />
                    )}
                    <a href={`/issues/${issue._id}`} className="mt-2 inline-flex text-sky-700 hover:text-sky-900 text-xs font-medium">View details →</a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;



