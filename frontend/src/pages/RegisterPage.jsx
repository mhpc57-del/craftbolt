import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';
import { API } from '../App';
import { 
  Eye, EyeSlash, ArrowLeft, ArrowRight, User, Briefcase, 
  Buildings, UserCircle, Check, MapPin, Camera, MagnifyingGlass, Image as ImageIcon, X
} from '@phosphor-icons/react';

const STEPS = ['basic', 'role', 'type', 'details', 'categories'];

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [aresLoading, setAresLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    role: searchParams.get('role') || '',
    supplier_type: searchParams.get('type') || '',
    company_name: '',
    ico: '',
    dic: '',
    address: '',
    branch_address: '',
    profile_image: '',
    categories: []
  });
  
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API}/categories`);
        setCategories(response.data.categories);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  // ARES lookup
  const handleAresLookup = async () => {
    if (!formData.ico || formData.ico.length < 7) {
      setError('Zadejte platné IČO (min. 7 číslic)');
      return;
    }
    setAresLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API}/ares/${formData.ico}`);
      const data = response.data;
      setFormData(prev => ({
        ...prev,
        company_name: data.company_name || prev.company_name,
        dic: data.dic || prev.dic,
        address: data.address || prev.address
      }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Nepodařilo se načíst údaje z ARES');
    } finally {
      setAresLoading(false);
    }
  };

  // Profile photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const response = await axios.post(`${API}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, profile_image: response.data.url }));
    } catch (err) {
      setError('Nepodařilo se nahrát fotografii');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const validateStep = () => {
    setError('');
    switch (STEPS[currentStep]) {
      case 'basic':
        if (!formData.email || !formData.password) {
          setError('Vyplňte e-mail a heslo');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Heslo musí mít alespoň 6 znaků');
          return false;
        }
        break;
      case 'role':
        if (!formData.role) {
          setError('Vyberte prosím roli');
          return false;
        }
        break;
      case 'type':
        if (!formData.supplier_type) {
          setError('Vyberte prosím typ účtu');
          return false;
        }
        break;
      case 'details':
        if (!formData.company_name) {
          setError('Vyplňte jméno a příjmení / název firmy');
          return false;
        }
        if (!formData.phone) {
          setError('Vyplňte telefonní číslo');
          return false;
        }
        if (!formData.email) {
          setError('Vyplňte e-mail');
          return false;
        }
        break;
      case 'categories':
        if (formData.role === 'supplier' && formData.categories.length === 0) {
          setError('Vyberte alespoň jednu kategorii');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    if (formData.role === 'customer' && STEPS[currentStep] === 'details') {
      handleSubmit();
      return;
    }
    
    if (currentStep < STEPS.length - 1) {
      let nextStep = currentStep + 1;
      if (formData.role === 'customer' && STEPS[nextStep] === 'type') {
        nextStep++;
      }
      if (formData.role === 'customer' && STEPS[nextStep] === 'categories') {
        handleSubmit();
        return;
      }
      setCurrentStep(nextStep);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      let prevStep = currentStep - 1;
      if (formData.role === 'customer' && STEPS[prevStep] === 'type') {
        prevStep--;
      }
      setCurrentStep(prevStep);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const user = await register(formData);
      
      if (user.role === 'supplier') {
        navigate('/dodavatel');
      } else {
        navigate('/zakaznik');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registrace se nezdařila');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (STEPS[currentStep]) {
      case 'basic':
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="vas@email.cz"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                data-testid="register-email-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Heslo</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Minimálně 6 znaků"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors pr-12"
                  data-testid="register-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        );

      case 'role':
        return (
          <div className="space-y-4">
            <p className="text-gray-600 mb-6">Jak chcete platformu používat?</p>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, role: 'customer' }))}
              className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
                formData.role === 'customer' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              data-testid="role-customer-btn"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  formData.role === 'customer' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <User weight="bold" className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Zákazník</h3>
                  <p className="text-sm text-gray-500">Hledám řemeslníky a služby</p>
                </div>
                {formData.role === 'customer' && (
                  <Check weight="bold" className="w-6 h-6 text-orange-500 ml-auto" />
                )}
              </div>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, role: 'supplier' }))}
              className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
                formData.role === 'supplier' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              data-testid="role-supplier-btn"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  formData.role === 'supplier' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Briefcase weight="bold" className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Dodavatel</h3>
                  <p className="text-sm text-gray-500">Nabízím své služby</p>
                </div>
                {formData.role === 'supplier' && (
                  <Check weight="bold" className="w-6 h-6 text-orange-500 ml-auto" />
                )}
              </div>
            </button>
          </div>
        );

      case 'type':
        return (
          <div className="space-y-4">
            <p className="text-gray-600 mb-6">Jaký je váš typ podnikání?</p>
            {[
              { value: 'osvc', label: 'OSVČ', desc: 'Fyzická osoba podnikající', price: '490 Kč/měsíc', Icon: UserCircle },
              { value: 'nepodnikatel', label: 'Nepodnikatel', desc: 'Fyzická osoba nepodnikající', price: '290 Kč/měsíc', Icon: User },
              { value: 'company', label: 's.r.o.', desc: 'Firma / Společnost', price: '490 Kč/měsíc', Icon: Buildings },
            ].map(({ value, label, desc, price, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, supplier_type: value }))}
                className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
                  formData.supplier_type === value 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid={`type-${value}-btn`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    formData.supplier_type === value ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon weight="bold" className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{label}</h3>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </div>
                  <span className="text-sm font-medium text-orange-500">{price}</span>
                  {formData.supplier_type === value && (
                    <Check weight="bold" className="w-6 h-6 text-orange-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        );

      case 'details':
        return (
          <div className="space-y-4">
            {/* Profile photo / Logo */}
            <div className="flex justify-center mb-2">
              <div className="relative">
                {formData.profile_image ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-orange-200">
                    <img src={`${API.replace('/api', '')}${formData.profile_image}`} alt="Profil" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                    <UserCircle className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center cursor-pointer shadow-md transition-colors" data-testid="upload-profile-photo-btn">
                  {uploadingPhoto ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                  ) : (
                    <Camera weight="fill" className="w-4 h-4 text-white" />
                  )}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
                </label>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 -mt-2 mb-2">Logo nebo fotografie</p>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Jméno a příjmení / název firmy <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                placeholder="Jan Novák / Firma s.r.o."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                data-testid="register-company-input"
              />
            </div>

            {/* ICO with ARES button */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">IČO</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="ico"
                  value={formData.ico}
                  onChange={handleInputChange}
                  placeholder="12345678"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  data-testid="register-ico-input"
                />
                <button
                  type="button"
                  onClick={handleAresLookup}
                  disabled={aresLoading || !formData.ico}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                  data-testid="ares-lookup-btn"
                >
                  {aresLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-gray-600"></div>
                  ) : (
                    <MagnifyingGlass className="w-4 h-4" />
                  )}
                  Načíst z ARES
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Zadejte IČO a klikněte pro automatické vyplnění údajů</p>
            </div>

            {/* DIC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">DIČ</label>
              <input
                type="text"
                name="dic"
                value={formData.dic}
                onChange={handleInputChange}
                placeholder="CZ12345678"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                data-testid="register-dic-input"
              />
            </div>

            {/* Sídlo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sídlo</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Ulice, PSČ Město"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  data-testid="register-address-input"
                />
              </div>
            </div>

            {/* Pobočka */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Pobočka</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="branch_address"
                  value={formData.branch_address}
                  onChange={handleInputChange}
                  placeholder="Adresa pobočky (pokud se liší od sídla)"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  data-testid="register-branch-input"
                />
              </div>
            </div>

            {/* Tel. číslo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Telefonní číslo <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+420 xxx xxx xxx"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                data-testid="register-phone-input"
              />
            </div>

            {/* Email (pre-filled, readonly info) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                E-mail <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="vas@email.cz"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                data-testid="register-email-readonly"
                readOnly
              />
              <p className="text-xs text-gray-400 mt-1">Zadáno v prvním kroku</p>
            </div>
          </div>
        );

      case 'categories':
        return (
          <div>
            <p className="text-gray-600 mb-4">Vyberte kategorie služeb, které nabízíte:</p>
            <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-xl p-4 space-y-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryToggle(category)}
                  className={`w-full p-3 rounded-lg text-left text-sm transition-all flex items-center justify-between ${
                    formData.categories.includes(category)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                  data-testid={`category-${category.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  {category}
                  {formData.categories.includes(category) && (
                    <Check weight="bold" className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Vybráno: {formData.categories.length} kategorií
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (STEPS[currentStep]) {
      case 'basic': return 'Základní údaje';
      case 'role': return 'Výběr role';
      case 'type': return 'Typ účtu';
      case 'details': return 'Údaje o účtu';
      case 'categories': return 'Kategorie';
      default: return '';
    }
  };

  const getVisibleSteps = () => {
    if (formData.role === 'customer') {
      return ['basic', 'role', 'details'];
    }
    return STEPS;
  };

  const visibleSteps = getVisibleSteps();
  const currentVisibleIndex = visibleSteps.indexOf(STEPS[currentStep]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 py-4 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-gray-900">Craft</span>
            <span className="text-2xl font-bold text-orange-500">Bolt</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Zpět
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {/* Progress */}
            <div className="flex items-center gap-2 mb-8">
              {visibleSteps.map((step, index) => (
                <React.Fragment key={step}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index <= currentVisibleIndex
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {index < currentVisibleIndex ? <Check weight="bold" className="w-4 h-4" /> : index + 1}
                  </div>
                  {index < visibleSteps.length - 1 && (
                    <div className={`flex-1 h-1 rounded-full transition-colors ${
                      index < currentVisibleIndex ? 'bg-orange-500' : 'bg-gray-100'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{getStepTitle()}</h1>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm" data-testid="register-error">
                {error}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
              {renderStep()}

              <div className="flex gap-4 mt-8">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-3 px-6 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    data-testid="register-back-btn"
                  >
                    Zpět
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  data-testid="register-next-btn"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Zpracování...
                    </span>
                  ) : (
                    <>
                      {currentStep === visibleSteps.length - 1 || (formData.role === 'customer' && STEPS[currentStep] === 'details') ? 'Dokončit registraci' : 'Pokračovat'}
                      <ArrowRight weight="bold" className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500">
                Už máte účet?{' '}
                <Link to="/prihlaseni" className="text-orange-500 hover:text-orange-600 font-medium" data-testid="login-link">
                  Přihlaste se
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
