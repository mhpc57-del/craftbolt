import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../App';
import { 
  UserCircle, 
  Briefcase, 
  ShieldCheck, 
  CurrencyDollar, 
  DeviceMobile, 
  MapPin,
  Lightning,
  ChatCircle,
  Tag,
  Star,
  Users,
  ArrowRight,
  Play,
  Check,
  X
} from '@phosphor-icons/react';
import HeroSlider from '../components/HeroSlider';
import StepsSlider from '../components/StepsSlider';

const HomePage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showVideo, setShowVideo] = useState(false);
  const [showCookies, setShowCookies] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeStep, setActiveStep] = useState(null);
  const [consentSettings, setConsentSettings] = useState({
    analytics: true,
    marketing: true
  });

  useEffect(() => {
    const savedConsent = localStorage.getItem('craftbolt_consent_v2');
    
    if (savedConsent) {
      const parsed = JSON.parse(savedConsent);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        'event': 'consent_update',
        'security_storage': 'granted',
        'function_storage': 'granted',
        'analytics_storage': parsed.analytics ? 'granted' : 'denied',
        'ad_storage': parsed.marketing ? 'granted' : 'denied',
        'ad_user_data': parsed.marketing ? 'granted' : 'denied',
        'ad_personalization': parsed.marketing ? 'granted' : 'denied'
      });
    } else {
      setShowCookies(true);
    }
  }, []);

  const advantages = [
    { icon: UserCircle, title: "Registrace bez IČ", desc: "Možnost přivýdělku jako zaměstnanec. Nepotřebujete živnostenský list." },
    { icon: CurrencyDollar, title: "Nejlevnější platforma na trhu", desc: "Měsíční paušál bez dalších poplatků a skrytých provizí." },
    { icon: DeviceMobile, title: "Chytrá mobilní aplikace", desc: "Pouze u nás. Nativní aplikace pro Android i iOS." },
    { icon: ShieldCheck, title: "Neřešíme registry", desc: "Každý se může dostat do problémů a mnohdy za to ani nemůže. Dáváme druhou šanci." },
    { icon: MapPin, title: "Geolokace", desc: "Zjištění online polohy mezi zákazníkem a dodavatelem — funkční také na počítačích." },
    { icon: Lightning, title: "Rychlé vkládání a přijímání zakázek", desc: "Bez zbytečného papírování. Zakázka do 5 minut." },
    { icon: ChatCircle, title: "Online CHAT", desc: "Diskrétní chat mezi zákazníkem a dodavatelem přímo v aplikaci." },
    { icon: Tag, title: "Rychlé zjištění ceny", desc: "Dodavatel Vám před zahájením práce nabídne odhadovanou cenu za službu." },
    { icon: Star, title: "Hodnocení řemeslníků a firem", desc: "Hodnocení udělují skuteční zákazníci. Žádné falešné recenze." },
    { icon: Users, title: "Skutečné profily", desc: "Na naší platformě nenajdete FAKE účty, ale pouze skutečné zákazníky a dodavatele." },
  ];

  const steps = [
    { num: "01", title: "Zákazník zadá zakázku", desc: "Vybere kategorii, podrobně napíše svůj požadavek, přidá případné fotografie pro lepší odhad ceny realizace, zadá adresu realizace a požadovaný termín, zvolí typ platby." },
    { num: "02", title: "Dodavatel přijme zakázku", desc: "Dodavatel z vašeho okolí dostane upozornění, prohlédne si poptávku, zahájí případný online chat pro doplnění informací, zakázku přijme a pustí se do realizace." },
    { num: "03", title: "Realizace díla/služby", desc: "Dodavatel provede práci či službu, vše transparentně a bez prostředníka." },
    { num: "04", title: "Předání díla/služby", desc: "Dodavatel řádně předá provedené dílo či službu." },
    { num: "05", title: "Vzájemné hodnocení", desc: "Obě strany ohodnotí spolupráci. Fotografie a recenze budují důvěru na platformě." },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-gray-900">Craft</span>
              <span className="text-2xl font-bold text-orange-500">Bolt</span>
            </Link>
            
            <nav className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                    data-testid="dashboard-link"
                  >
                    Můj profil
                  </Link>
                  <button 
                    onClick={logout}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                    data-testid="logout-btn"
                  >
                    Odhlásit
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/prihlaseni" 
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                    data-testid="login-link"
                  >
                    Přihlášení
                  </Link>
                  <Link 
                    to="/registrace" 
                    className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-5 py-2.5 rounded-full transition-all duration-200 hover:-translate-y-0.5"
                    data-testid="register-btn"
                  >
                    Přidat poptávku
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <span className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <Lightning weight="fill" className="w-4 h-4" />
                NOVÁ PLATFORMA PRO ŘEMESLNÍKY
              </span>
              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
                Najděte svého dodavatele.{' '}
                <span className="text-orange-500">Během pár minut!</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                CraftBolt propojí zákazníky s ověřenými řemeslníky ve vašem okolí. Rychle, bezpečně a bez provizí.
              </p>
              <div className="flex flex-wrap gap-4 mb-12">
                <Link 
                  to="/registrace" 
                  className="btn-orange inline-flex items-center gap-2"
                  data-testid="hero-register-btn"
                >
                  Začít zdarma — 14 dní
                  <ArrowRight weight="bold" className="w-5 h-5" />
                </Link>
                <Link 
                  to="/dodavatele" 
                  className="bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-medium px-6 py-3 rounded-full transition-all duration-200"
                  data-testid="suppliers-btn"
                >
                  Prohlédnout dodavatele
                </Link>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">61</div>
                  <div className="text-sm text-gray-500">kategorií</div>
                </div>
                <div className="w-px h-10 bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">0%</div>
                  <div className="text-sm text-gray-500">provize</div>
                </div>
                <div className="w-px h-10 bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">14</div>
                  <div className="text-sm text-gray-500">dní zdarma</div>
                </div>
              </div>
            </div>
            <div className="animate-fade-in-up stagger-2 h-[400px] lg:h-[500px]">
              <HeroSlider />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-orange-500 font-bold text-sm tracking-widest uppercase">Proč si vybrat nás</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-4">Výhody oproti konkurenčním platformám</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {advantages.map((adv, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl p-6 border border-gray-100 card-hover animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <adv.icon weight="duotone" className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{adv.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{adv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className="text-orange-500 font-bold text-sm tracking-widest uppercase">Proces</span>
              <h2 className="text-4xl font-bold text-gray-900 mt-4 mb-6">Jak to celé funguje</h2>
              <p className="text-gray-600 text-lg mb-8">
                Od zadání poptávky po dokončení zakázky. Pět jednoduchých kroků.
              </p>
              <StepsSlider activeStep={activeStep} />
            </div>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div 
                  key={index} 
                  className={`bg-white rounded-xl p-6 border card-hover animate-fade-in-up cursor-pointer transition-all duration-200 ${
                    activeStep === index 
                      ? 'border-orange-400 shadow-md ring-1 ring-orange-200' 
                      : 'border-gray-100 hover:border-orange-200'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onMouseEnter={() => setActiveStep(index)}
                  onMouseLeave={() => setActiveStep(null)}
                  data-testid={`step-card-${index}`}
                >
                  <div className="flex gap-4">
                    <span className="text-4xl font-bold text-orange-500">{step.num}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg mb-2">{step.title}</h3>
                      <p className="text-gray-500">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-16 bg-orange-50 rounded-2xl p-8 border border-orange-100">
            <h3 className="font-semibold text-gray-900 text-lg mb-4">Důležité upozornění</h3>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                V případě, že si obě smluvní strany předají osobní kontakty z důvodu dalších realizací služeb nebo z důvodu poskytnutí záruk, je jim toto samozřejmě umožněno. Pamatujte však na to, že sjednávání dalších služeb mimo tuto platformu je mnohdy rizikovější a složitější.
              </p>
              <p>
                Sjednávání zakázek přes naši platformu je pohodlné, rychlé, efektivní a máte vždy jasný přehled o svých zakázkách. Veškerá historie (zakázky, chat, fotografie, hodnocení či případné spory) se Vám nikdy neztratí a zůstanou na vašem profilu uložené. Řešení případných sporů nebo nedorozumění je přes tuto platformu vždy bezpečnější a prokazatelnější. Pokud ke sporu dojde, můžete požádat také naši podporu o pomoc, která Vám bude vždy nápomocná a bude se snažit vše vyřešit ke spokojenosti obou smluvních stran.
              </p>
              <p className="font-semibold text-orange-600">
                Doporučení: Nikdy neřešte spor osobně či po telefonu. Vždy pamatujte na to, že co je psáno, to je dáno!
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div 
            className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video cursor-pointer group"
            onClick={() => setShowVideo(true)}
          >
            <img 
              src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1200&h=675&fit=crop" 
              alt="Video placeholder" 
              className="w-full h-full object-cover opacity-70 group-hover:opacity-60 transition-opacity"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <span className="text-sm tracking-widest uppercase mb-4">Podívejte se</span>
              <h2 className="text-3xl sm:text-4xl font-bold mb-8">Jak CraftBolt funguje v praxi</h2>
              <button 
                className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors hover:scale-105 transform"
                data-testid="play-video-btn"
              >
                <Play weight="fill" className="w-8 h-8 text-white ml-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-orange-500 font-bold text-sm tracking-widest uppercase">Ceník</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-4">
              Transparentní ceny.<br />
              <span className="text-gray-900">Žádné skryté poplatky.</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 card-hover">
              <div className="mb-6">
                <span className="text-gray-500 text-sm uppercase tracking-widest font-bold">Zákazník</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-5xl font-bold text-gray-900">190</span>
                  <span className="text-gray-500">Kč/měsíc</span>
                </div>
                <span className="text-orange-500 text-sm font-medium">14 dní zdarma</span>
              </div>
              <ul className="space-y-3 mb-8">
                {["Neomezený počet poptávek", "Výběr z ověřených dodavatelů", "Hodnocení s fotografiemi", "E-mail a SMS notifikace"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600">
                    <Check weight="bold" className="w-5 h-5 text-orange-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link 
                to="/registrace?role=customer" 
                className="block w-full text-center py-3 px-6 border border-gray-200 rounded-full font-medium text-gray-700 hover:border-orange-500 hover:text-orange-500 transition-colors"
                data-testid="pricing-customer-btn"
              >
                Registrovat se
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-orange-500 card-hover relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase">
                Doporučeno
              </span>
              <div className="mb-6">
                <span className="text-gray-500 text-sm uppercase tracking-widest font-bold">Nepodnikatel</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-5xl font-bold text-gray-900">290</span>
                  <span className="text-gray-500">Kč/měsíc</span>
                </div>
                <span className="text-orange-500 text-sm font-medium">14 dní zdarma</span>
              </div>
              <ul className="space-y-3 mb-8">
                {["Přístup ke všem zakázkám", "Badge \"Prověřený subjekt\"", "Statistiky a přehledy", "Prioritní zobrazení v katalogu", "E-mail a SMS notifikace"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600">
                    <Check weight="bold" className="w-5 h-5 text-orange-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link 
                to="/registrace?role=supplier&type=nepodnikatel" 
                className="block w-full text-center py-3 px-6 bg-orange-500 hover:bg-orange-600 rounded-full font-medium text-white transition-colors"
                data-testid="pricing-nepodnikatel-btn"
              >
                Registrovat se jako dodavatel
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200 card-hover">
              <div className="mb-6">
                <span className="text-gray-500 text-sm uppercase tracking-widest font-bold">OSVČ / Firmy</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-5xl font-bold text-gray-900">490</span>
                  <span className="text-gray-500">Kč/měsíc</span>
                </div>
                <span className="text-orange-500 text-sm font-medium">14 dní zdarma</span>
              </div>
              <ul className="space-y-3 mb-8">
                {["Přístup ke všem zakázkám", "Badge \"Prověřený subjekt\"", "Statistiky a přehledy", "Prioritní zobrazení v katalogu", "Fakturace na IČO", "E-mail a SMS notifikace"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600">
                    <Check weight="bold" className="w-5 h-5 text-orange-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link 
                to="/registrace?role=supplier&type=osvc" 
                className="block w-full text-center py-3 px-6 border border-gray-200 rounded-full font-medium text-gray-700 hover:border-orange-500 hover:text-orange-500 transition-colors"
                data-testid="pricing-osvc-btn"
              >
                Registrovat se jako dodavatel
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Připraveni začít?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Zaregistrujte se ještě dnes a vyzkoušejte CraftBolt 14 dní zcela zdarma.
          </p>
          <Link 
            to="/registrace" 
            className="btn-orange inline-flex items-center gap-2"
            data-testid="cta-register-btn"
          >
            Vytvořit účet zdarma
            <ArrowRight weight="bold" className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <span className="text-2xl font-bold">Craft</span>
              <span className="text-2xl font-bold text-orange-500">Bolt</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2026 CraftBolt. Všechna práva vyhrazena.
            </p>
          </div>
        </div>
      </footer>

      {showCookies && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white py-6 px-4 sm:px-6 lg:px-8 z-50 border-t border-gray-800">
          <div className="max-w-7xl mx-auto">
            {!showSettings ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-sm text-gray-300 text-center md:text-left">
                  <p className="mb-1 font-semibold text-white text-base">Soukromí a cookies</p>
                  Tento web používá cookies pro zajištění funkčnosti, analýzu návštěvnosti a <span className="text-orange-400">personalizaci reklam (Google Ads)</span>. 
                  Své preference můžete kdykoliv změnit. <a href="#" className="underline hover:text-white">Více informací</a>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <button 
                    onClick={() => setShowSettings(true)}
                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    Nastavení
                  </button>
                  <button 
                    onClick={() => {
                      const allDenied = { analytics: false, marketing: false };
                      localStorage.setItem('craftbolt_consent_v2', JSON.stringify(allDenied));
                      window.dataLayer = window.dataLayer || [];
                      window.dataLayer.push({
                        'event': 'consent_update',
                        'security_storage': 'granted',
                        'function_storage': 'granted',
                        'analytics_storage': 'denied',
                        'ad_storage': 'denied',
                        'ad_user_data': 'denied',
                        'ad_personalization': 'denied'
                      });
                      setShowCookies(false);
                    }}
                    className="px-4 py-2 border border-gray-600 rounded-lg text-sm hover:border-gray-400 transition-colors"
                  >
                    Odmítnout vše
                  </button>
                  <button 
                    onClick={() => {
                      const allGranted = { analytics: true, marketing: true };
                      localStorage.setItem('craftbolt_consent_v2', JSON.stringify(allGranted));
                      window.dataLayer = window.dataLayer || [];
                      window.dataLayer.push({
                        'event': 'consent_update',
                        'security_storage': 'granted',
                        'function_storage': 'granted',
                        'analytics_storage': 'granted',
                        'ad_storage': 'granted',
                        'ad_user_data': 'granted',
                        'ad_personalization': 'granted'
                      });
                      setShowCookies(false);
                    }}
                    className="px-6 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-bold transition-all shadow-lg shadow-orange-500/20"
                  >
                    Přijmout vše
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                <h3 className="text-lg font-bold mb-4">Nastavení souhlasu</h3>
                <div className="grid sm:grid-cols-2 gap-4 mb-6 text-sm">
                  <div className="p-4 bg-gray-800 rounded-xl border border-gray-700">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={consentSettings.analytics} 
                        onChange={(e) => setConsentSettings({...consentSettings, analytics: e.target.checked})}
                        className="w-4 h-4 accent-orange-500"
                      />
                      <span className="font-bold">Analytické cookies</span>
                    </label>
                    <p className="mt-2 text-gray-400 text-xs text-balance leading-relaxed">Pomáhají nám pochopit, jak web používáte (Google Analytics).</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-xl border border-gray-700 text-balance">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={consentSettings.marketing} 
                        onChange={(e) => setConsentSettings({...consentSettings, marketing: e.target.checked})}
                        className="w-4 h-4 accent-orange-500"
                      />
                      <span className="font-bold">Marketingové cookies</span>
                    </label>
                    <p className="mt-2 text-gray-400 text-xs leading-relaxed text-balance">Umožňují nám zobrazovat relevantní reklamy (Google Ads).</p>
                  </div>
                </div>
                <div className="flex justify-end gap-4">
                   <button 
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 text-sm text-gray-400"
                  >
                    Zpět
                  </button>
                  <button 
                    onClick={() => {
                      localStorage.setItem('craftbolt_consent_v2', JSON.stringify(consentSettings));
                      window.dataLayer = window.dataLayer || [];
                      window.dataLayer.push({
                        'event': 'consent_update',
                        'security_storage': 'granted',
                        'function_storage': 'granted',
                        'analytics_storage': consentSettings.analytics ? 'granted' : 'denied',
                        'ad_storage': consentSettings.marketing ? 'granted' : 'denied',
                        'ad_user_data': consentSettings.marketing ? 'granted' : 'denied',
                        'ad_personalization': consentSettings.marketing ? 'granted' : 'denied'
                      });
                      setShowCookies(false);
                    }}
                    className="px-6 py-2 bg-white text-gray-900 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                  >
                    Uložit nastavení
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showVideo && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowVideo(false)} data-testid="video-modal">
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowVideo(false)}
              className="absolute -top-12 right-0 text-white hover:text-orange-400 transition-colors"
              data-testid="close-video-btn"
            >
              <X weight="bold" className="w-8 h-8" />
            </button>
            <video 
              controls 
              autoPlay 
              className="w-full rounded-xl shadow-2xl"
              data-testid="promo-video"
            >
              <source src={`${API.replace('/api', '')}/api/uploads/promo_video.mp4`} type="video/mp4" />
              Váš prohlížeč nepodporuje přehrávání videa.
            </video>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;