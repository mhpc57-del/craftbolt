import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const supplierIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map bounds
const FitBounds = ({ positions }) => {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, positions]);
  
  return null;
};

// Calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Format distance
const formatDistance = (km) => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};

// Estimate travel time (assuming 40 km/h average speed)
const estimateTime = (km) => {
  const minutes = Math.round((km / 40) * 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min`;
};

const LiveMap = ({ 
  customerLocation, 
  supplierLocation, 
  destinationLocation,
  customerName = 'Zákazník',
  supplierName = 'Dodavatel',
  destinationName = 'Místo realizace',
  onLocationUpdate,
  isSupplier = false,
  showTracking = true
}) => {
  const [myLocation, setMyLocation] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const mapRef = useRef(null);

  // Start watching location
  useEffect(() => {
    if (showTracking && navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMyLocation(newLocation);
          setLocationError(null);
          
          // Send location update to parent
          if (onLocationUpdate) {
            onLocationUpdate(newLocation);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationError(error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );
      setWatchId(id);
      
      return () => {
        if (id) {
          navigator.geolocation.clearWatch(id);
        }
      };
    }
  }, [showTracking, onLocationUpdate]);

  // Determine map center
  const getCenter = () => {
    if (supplierLocation) return [supplierLocation.lat, supplierLocation.lng];
    if (customerLocation) return [customerLocation.lat, customerLocation.lng];
    if (destinationLocation) return [destinationLocation.lat, destinationLocation.lng];
    if (myLocation) return [myLocation.lat, myLocation.lng];
    return [49.8175, 15.4730]; // Default to Czech Republic center
  };

  // Collect all valid positions for bounds
  const getPositions = () => {
    const positions = [];
    if (supplierLocation) positions.push([supplierLocation.lat, supplierLocation.lng]);
    if (customerLocation) positions.push([customerLocation.lat, customerLocation.lng]);
    if (destinationLocation) positions.push([destinationLocation.lat, destinationLocation.lng]);
    return positions;
  };

  const positions = getPositions();
  const center = getCenter();

  // Calculate distances
  const supplierToDestination = supplierLocation && destinationLocation
    ? calculateDistance(supplierLocation.lat, supplierLocation.lng, destinationLocation.lat, destinationLocation.lng)
    : null;

  return (
    <div className="relative">
      <div className="rounded-xl overflow-hidden border border-gray-200">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '400px', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {positions.length > 1 && <FitBounds positions={positions} />}
          
          {/* Destination marker */}
          {destinationLocation && (
            <Marker 
              position={[destinationLocation.lat, destinationLocation.lng]} 
              icon={destinationIcon}
            >
              <Popup>
                <div className="text-center">
                  <strong className="text-green-600">{destinationName}</strong>
                  <p className="text-sm text-gray-500">Místo zakázky</p>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Customer marker */}
          {customerLocation && (
            <Marker 
              position={[customerLocation.lat, customerLocation.lng]} 
              icon={customerIcon}
            >
              <Popup>
                <div className="text-center">
                  <strong className="text-blue-600">{customerName}</strong>
                  <p className="text-sm text-gray-500">Zákazník</p>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Supplier marker */}
          {supplierLocation && (
            <Marker 
              position={[supplierLocation.lat, supplierLocation.lng]} 
              icon={supplierIcon}
            >
              <Popup>
                <div className="text-center">
                  <strong className="text-orange-600">{supplierName}</strong>
                  <p className="text-sm text-gray-500">Dodavatel</p>
                  {supplierToDestination && (
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistance(supplierToDestination)} od místa
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Route line from supplier to destination */}
          {supplierLocation && destinationLocation && (
            <Polyline 
              positions={[
                [supplierLocation.lat, supplierLocation.lng],
                [destinationLocation.lat, destinationLocation.lng]
              ]}
              color="#f97316"
              weight={3}
              opacity={0.7}
              dashArray="10, 10"
            />
          )}
        </MapContainer>
      </div>
      
      {/* Info panel */}
      {supplierLocation && destinationLocation && supplierToDestination && (
        <div className="mt-4 bg-orange-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Vzdálenost</p>
              <p className="text-lg font-semibold text-gray-900">{formatDistance(supplierToDestination)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Odhadovaný čas</p>
              <p className="text-lg font-semibold text-orange-600">{estimateTime(supplierToDestination)}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Location status */}
      {showTracking && (
        <div className="mt-2 text-xs text-gray-400">
          {locationError ? (
            <span className="text-red-500">Chyba geolokace: {locationError}</span>
          ) : myLocation ? (
            <span className="text-green-500">● Sledování polohy aktivní</span>
          ) : (
            <span>Načítání polohy...</span>
          )}
        </div>
      )}
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          <span className="text-gray-600">Zákazník</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
          <span className="text-gray-600">Dodavatel</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span className="text-gray-600">Místo realizace</span>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
