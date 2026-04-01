import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, API } from '../App';
import axios from 'axios';
import { 
  House, Briefcase, ChartBar, MapTrifold, User, SignOut, 
  MapPin, Calendar, ArrowRight, Check, Clock, Star, NavigationArrow
} from '@phosphor-icons/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const demandIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const myLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const SupplierDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('available');
  const [availableDemands, setAvailableDemands] = useState([]);
  const [myDemands, setMyDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ available: 0, accepted: 0, completed: 0 });
  const [myLocation, setMyLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [availableRes, myRes] = await Promise.all([
        axios.get(`${API}/demands/available`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/demands/my`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAvailableDemands(availableRes.data);
      setMyDemands(myRes.data);
      setStats({
        available: availableRes.data.length,
        accepted: myRes.data.filter(d => d.status === 'in_progress').length,
        completed: myRes.data.filter(d => d.status === 'completed').length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMyLocation(loc);
          // Update location on server
          axios.post(`${API}/users/location`, {
            latitude: loc.lat,
            longitude: loc.lng
          }, { headers: { Authorization: `Bearer ${token}` } }).catch(console.error);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationError(error.message);
        }
      );
    }
  }, [token]);

  const handleAcceptDemand = async (demandId) => {
    try {
      await axios.post(`${API}/demands/${demandId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Error accepting demand:', error);
      alert(error.response?.data?.detail || 'Nepodařilo se přijmout zakázku');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusBadge = (status) => {
    const styles = {
      open: 'bg-green-100 text-green-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    const labels = {
      open: 'Otevřená',
      in_progress: 'Probíhá',
      completed: 'Dokončeno',
      cancelled: 'Zrušeno'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const tabs = [
    { id: 'available', label: 'Dostupné', icon: Briefcase, count: stats.available },
    { id: 'my', label: 'Moje', icon: Check, count: stats.accepted },
    { id: 'stats', label: 'Statistiky', icon: ChartBar },
    { id: 'map', label: 'Mapa', icon: MapTrifold },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-10 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'available':
        return (
          <div className="divide-y divide-gray-100">
            {availableDemands.length === 0 ? (
              <div className="p-10 text-center">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Momentálně nejsou dostupné žádné zakázky ve vašich kategoriích</p>
              </div>
            ) : (
              availableDemands.map((demand) => (
                <div key={demand.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{demand.title}</h3>
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                          {demand.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{demand.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {demand.address}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(demand.created_at).toLocaleDateString('cs-CZ')}
                        </span>
                        {demand.budget_max && (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            Rozpočet: {demand.budget_min ? `${demand.budget_min} - ` : ''}{demand.budget_max} Kč
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Link
                          to={`/zakazka/${demand.id}`}
                          className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          data-testid={`view-demand-${demand.id}`}
                        >
                          Detail
                        </Link>
                        <button
                          onClick={() => handleAcceptDemand(demand.id)}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium text-white transition-colors"
                          data-testid={`accept-demand-${demand.id}`}
                        >
                          Přijmout zakázku
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'my':
        return (
          <div className="divide-y divide-gray-100">
            {myDemands.length === 0 ? (
              <div className="p-10 text-center">
                <Check className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Zatím nemáte žádné přijaté zakázky</p>
              </div>
            ) : (
              myDemands.map((demand) => (
                <Link 
                  key={demand.id} 
                  to={`/zakazka/${demand.id}`}
                  className="block p-5 hover:bg-gray-50 transition-colors"
                  data-testid={`my-demand-${demand.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{demand.title}</h3>
                        {getStatusBadge(demand.status)}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{demand.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {demand.address}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {demand.customer_name}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300" />
                  </div>
                </Link>
              ))
            )}
          </div>
        );

      case 'stats':
        return (
          <div className="p-6">
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Briefcase weight="bold" className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-gray-500">Probíhající</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.accepted}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <Check weight="bold" className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-gray-500">Dokončené</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Star weight="bold" className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-gray-500">Hodnocení</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{user?.rating?.toFixed(1) || '0.0'}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Vaše kategorie</h3>
              <div className="flex flex-wrap gap-2">
                {user?.categories?.length > 0 ? (
                  user.categories.map((cat) => (
                    <span key={cat} className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700">
                      {cat}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Nemáte nastavené žádné kategorie</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'map':
        // Generate mock coordinates for demands (in real app, use geocoding)
        const demandsWithCoords = availableDemands.map((d, i) => ({
          ...d,
          lat: 49.8 + (Math.random() * 0.3 - 0.15) + (i * 0.02),
          lng: 15.4 + (Math.random() * 0.3 - 0.15) + (i * 0.02)
        }));
        
        const mapCenter = myLocation 
          ? [myLocation.lat, myLocation.lng] 
          : [49.8175, 15.4730];
        
        return (
          <div className="p-6">
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <MapContainer
                center={mapCenter}
                zoom={10}
                style={{ height: '500px', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* My location marker */}
                {myLocation && (
                  <Marker position={[myLocation.lat, myLocation.lng]} icon={myLocationIcon}>
                    <Popup>
                      <div className="text-center">
                        <strong className="text-orange-600">Vaše poloha</strong>
                      </div>
                    </Popup>
                  </Marker>
                )}
                
                {/* Demand markers */}
                {demandsWithCoords.map((demand) => (
                  <Marker 
                    key={demand.id} 
                    position={[demand.lat, demand.lng]}
                    icon={demandIcon}
                  >
                    <Popup>
                      <div className="min-w-[200px]">
                        <h3 className="font-semibold text-gray-900 mb-1">{demand.title}</h3>
                        <p className="text-xs text-gray-500 mb-2">{demand.category}</p>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{demand.description}</p>
                        <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {demand.address}
                        </p>
                        <Link
                          to={`/zakazka/${demand.id}`}
                          className="block w-full text-center py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium"
                        >
                          Zobrazit detail
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                <span className="text-gray-600">Vaše poloha</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Dostupné zakázky ({availableDemands.length})</span>
              </div>
            </div>
            
            {locationError && (
              <p className="mt-2 text-xs text-red-500">
                Chyba geolokace: {locationError}. Povolte přístup k poloze pro lepší zážitek.
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100 p-6 hidden lg:block">
        <Link to="/" className="flex items-center mb-10">
          <span className="text-2xl font-bold text-gray-900">Craft</span>
          <span className="text-2xl font-bold text-orange-500">Bolt</span>
        </Link>

        <nav className="space-y-2">
          <Link 
            to="/dodavatel" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              location.pathname === '/dodavatel' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
            data-testid="nav-dashboard"
          >
            <House weight={location.pathname === '/dodavatel' ? 'fill' : 'regular'} className="w-5 h-5" />
            Dashboard
          </Link>
          <Link 
            to="/profil" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
            data-testid="nav-profile"
          >
            <User className="w-5 h-5" />
            Profil
          </Link>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-orange-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-orange-700 font-medium mb-1">Zkušební doba</p>
            <p className="text-xs text-orange-600">
              {user?.trial_ends_at ? (
                `Končí ${new Date(user.trial_ends_at).toLocaleDateString('cs-CZ')}`
              ) : (
                'Aktivní předplatné'
              )}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
            data-testid="logout-btn"
          >
            <SignOut className="w-5 h-5" />
            Odhlásit se
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dashboard dodavatele</h1>
              <p className="text-sm text-gray-500">Vítejte zpět, {user?.company_name || user?.email}</p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-100 px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-orange-500 text-orange-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    activeTab === tab.id ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-white rounded-xl border border-gray-100">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupplierDashboard;
