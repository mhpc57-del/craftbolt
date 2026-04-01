import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth, API } from '../App';
import axios from 'axios';
import { 
  ArrowLeft, User, MapPin, Phone, Star, Calendar, 
  Briefcase, Check, PencilSimple
} from '@phosphor-icons/react';

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser, token } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const isOwnProfile = !id || id === currentUser?.id;
  const userId = id || currentUser?.id;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (isOwnProfile) {
          setProfile(currentUser);
          setFormData({
            company_name: currentUser?.company_name || '',
            phone: currentUser?.phone || '',
            address: currentUser?.address || ''
          });
        } else {
          const response = await axios.get(`${API}/users/${userId}`);
          setProfile(response.data);
        }

        // Fetch reviews
        const reviewsRes = await axios.get(`${API}/reviews/user/${userId}`);
        setReviews(reviewsRes.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId, currentUser, isOwnProfile]);

  const handleSaveProfile = async () => {
    try {
      await axios.put(`${API}/users/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(prev => ({ ...prev, ...formData }));
      setEditing(false);
    } catch (error) {
      alert('Nepodařilo se uložit profil');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Uživatel nenalezen</p>
          <button onClick={() => navigate(-1)} className="text-orange-500 hover:text-orange-600">
            Zpět
          </button>
        </div>
      </div>
    );
  }

  const getRoleName = (role) => {
    const names = { customer: 'Zákazník', supplier: 'Dodavatel', admin: 'Administrátor' };
    return names[role] || role;
  };

  const getTypeName = (type) => {
    const names = { osvc: 'OSVČ', nepodnikatel: 'Nepodnikatel', company: 's.r.o.' };
    return names[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-gray-900">Craft</span>
            <span className="text-xl font-bold text-orange-500">Bolt</span>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-24 h-24 bg-orange-100 rounded-2xl flex items-center justify-center">
              <User className="w-12 h-12 text-orange-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {profile.company_name || profile.email}
                  </h1>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded-full">
                      {getRoleName(profile.role)}
                    </span>
                    {profile.supplier_type && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                        {getTypeName(profile.supplier_type)}
                      </span>
                    )}
                    {profile.is_verified && (
                      <span className="flex items-center gap-1 text-green-600">
                        <Check weight="bold" className="w-4 h-4" />
                        Ověřeno
                      </span>
                    )}
                  </div>
                </div>
                {isOwnProfile && !editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    data-testid="edit-profile-btn"
                  >
                    <PencilSimple className="w-5 h-5 text-gray-600" />
                  </button>
                )}
              </div>

              {profile.role === 'supplier' && (
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1">
                    <Star weight="fill" className="w-5 h-5 text-orange-500" />
                    <span className="font-semibold">{profile.rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-gray-500 text-sm">({profile.reviews_count || 0} hodnocení)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Informace</h2>
            
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {profile.role === 'supplier' ? 'Název / Jméno' : 'Jméno'}
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    data-testid="edit-name-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    data-testid="edit-phone-input"
                  />
                </div>
                {profile.role === 'supplier' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresa</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      data-testid="edit-address-input"
                    />
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                    data-testid="cancel-edit-btn"
                  >
                    Zrušit
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-xl"
                    data-testid="save-profile-btn"
                  >
                    Uložit
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-5 h-5 text-gray-400" />
                  {profile.phone || '-'}
                </div>
                {profile.address && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    {profile.address}
                  </div>
                )}
                {profile.ico && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Briefcase className="w-5 h-5 text-gray-400" />
                    IČO: {profile.ico}
                  </div>
                )}
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  Registrován: {new Date(profile.created_at).toLocaleDateString('cs-CZ')}
                </div>
              </div>
            )}
          </div>

          {/* Categories (for suppliers) */}
          {profile.role === 'supplier' && profile.categories?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Kategorie služeb</h2>
              <div className="flex flex-wrap gap-2">
                {profile.categories.map((cat) => (
                  <span key={cat} className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6">
            <h2 className="font-semibold text-gray-900 mb-4">Hodnocení ({reviews.length})</h2>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          weight={star <= review.rating ? 'fill' : 'regular'} 
                          className={`w-4 h-4 ${star <= review.rating ? 'text-orange-500' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">{review.reviewer_name}</span>
                    <span className="text-sm text-gray-400">
                      {new Date(review.created_at).toLocaleDateString('cs-CZ')}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
