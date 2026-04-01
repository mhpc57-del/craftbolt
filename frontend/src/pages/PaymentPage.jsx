import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth, API } from '../App';
import axios from 'axios';
import { CheckCircle, XCircle, CreditCard, Spinner, ArrowLeft } from '@phosphor-icons/react';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const { token } = useAuth();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId || !token) return;

    let attempts = 0;
    const maxAttempts = 10;
    const pollInterval = 2000;

    const pollStatus = async () => {
      try {
        const response = await axios.get(`${API}/subscription/status/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.payment_status === 'paid') {
          setStatus('success');
          setPaymentInfo(response.data);
          return;
        } else if (response.data.status === 'expired') {
          setStatus('expired');
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(pollStatus, pollInterval);
        } else {
          setStatus('timeout');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setStatus('error');
      }
    };

    pollStatus();
  }, [sessionId, token]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Ověřujeme platbu...</h2>
          <p className="text-gray-600">Prosím počkejte, zpracováváme vaši platbu.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle weight="fill" className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Platba úspěšná!</h2>
          <p className="text-gray-600 mb-6">
            Vaše předplatné <strong>{paymentInfo?.plan_name}</strong> bylo aktivováno.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Tarif:</span>
              <span className="font-semibold">{paymentInfo?.plan_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Zaplaceno:</span>
              <span className="font-semibold">{paymentInfo?.amount} {paymentInfo?.currency}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Přejít do aplikace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle weight="fill" className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {status === 'expired' ? 'Platba vypršela' : 'Chyba při platbě'}
        </h2>
        <p className="text-gray-600 mb-6">
          {status === 'expired' 
            ? 'Platební relace vypršela. Zkuste to prosím znovu.'
            : 'Nepodařilo se ověřit platbu. Zkontrolujte svůj email nebo kontaktujte podporu.'}
        </p>
        <button
          onClick={() => navigate('/cenik')}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Zkusit znovu
        </button>
      </div>
    </div>
  );
};

const PaymentCancelled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle weight="fill" className="w-12 h-12 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Platba zrušena</h2>
        <p className="text-gray-600 mb-6">
          Platba byla zrušena. Můžete to zkusit znovu kdykoliv.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/cenik')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Zpět na ceník
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Na hlavní stránku
          </button>
        </div>
      </div>
    </div>
  );
};

const PricingPage = () => {
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const { token, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${API}/subscription/plans`);
        setPlans(response.data.plans);
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (planId) => {
    if (!isAuthenticated) {
      navigate('/prihlaseni', { state: { from: '/cenik', planId } });
      return;
    }

    setProcessingPlan(planId);

    try {
      const response = await axios.post(
        `${API}/subscription/checkout`,
        {
          plan_id: planId,
          origin_url: window.location.origin
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Redirect to Stripe Checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Chyba při vytváření platby. Zkuste to prosím znovu.');
      setProcessingPlan(null);
    }
  };

  const planOrder = ['zakaznik', 'dodavatel'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold">
            <span className="text-gray-900">Craft</span>
            <span className="text-orange-500">Bolt</span>
          </a>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft weight="bold" />
            Zpět
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <span className="text-orange-500 font-bold text-sm tracking-wider uppercase">Ceník</span>
          <h1 className="text-4xl font-bold text-gray-900 mt-2 mb-4">
            Jednoduchý a férový ceník.
          </h1>
          <p className="text-gray-600 text-lg">
            Vyberte si tarif podle toho, zda hledáte řemeslníka nebo nabízíte služby.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <Spinner className="w-12 h-12 text-orange-500 animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {planOrder.map((planId) => {
              const plan = plans[planId];
              if (!plan) return null;
              const isDodavatel = planId === 'dodavatel';

              return (
                <div
                  key={planId}
                  className={`bg-white rounded-2xl p-8 ${
                    isDodavatel 
                      ? 'ring-2 ring-orange-500 shadow-xl relative' 
                      : 'border border-gray-200 shadow-lg'
                  }`}
                >
                  {isDodavatel && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-orange-500 text-white text-sm font-bold px-4 py-1 rounded-full">
                        PRO ŘEMESLNÍKY
                      </span>
                    </div>
                  )}

                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline mb-1">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500 ml-2">Kč/měsíc</span>
                  </div>
                  <p className="text-orange-500 text-sm mb-6">{plan.trial_days} dní zdarma na vyzkoušení</p>

                  <ul className="space-y-3 mb-8">
                    {planId === 'zakaznik' && (
                      <>
                        <li className="flex items-center gap-2 text-gray-600">
                          <CheckCircle weight="fill" className="text-green-500 flex-shrink-0" />
                          Neomezený počet zadání
                        </li>
                        <li className="flex items-center gap-2 text-gray-600">
                          <CheckCircle weight="fill" className="text-green-500 flex-shrink-0" />
                          Výběr z ověřených dodavatelů
                        </li>
                        <li className="flex items-center gap-2 text-gray-600">
                          <CheckCircle weight="fill" className="text-green-500 flex-shrink-0" />
                          Online chat s dodavateli
                        </li>
                        <li className="flex items-center gap-2 text-gray-600">
                          <CheckCircle weight="fill" className="text-green-500 flex-shrink-0" />
                          Zamítnutí nabídek
                        </li>
                        <li className="flex items-center gap-2 text-gray-600">
                          <CheckCircle weight="fill" className="text-green-500 flex-shrink-0" />
                          Úpravy stávajících nabídek
                        </li>
                        <li className="flex items-center gap-2 text-gray-600">
                          <CheckCircle weight="fill" className="text-green-500 flex-shrink-0" />
                          Vkládání fotografií
                        </li>
                        <li className="flex items-center gap-2 text-gray-600">
                          <CheckCircle weight="fill" className="text-green-500 flex-shrink-0" />
                          Notifikace (APP, E-mail, SMS)
                        </li>
                      </>
                    )}
                    {planId === 'dodavatel' && (
                      <>
                        <li className="flex items-center gap-2 text-gray-600">
                          <CheckCircle weight="fill" className="text-green-500 flex-shrink-0" />
                          Neomezený přístup k zakázkám
                        </li>
                        <li className="flex items-center gap-2 text-gray-600">
                          <CheckCircle weight="fill" className="text-green-500 flex-shrink-0" />
                          Výběr zakázky dle svých možností
                        </li>
                        <li className="flex items-center gap-2 text-gray-600">
                          <CheckCircle weight="fill" className="text-green-500 flex-shrink-0" />
                          Online chat se zákazníky
                        </li>
                        <li className="flex items-center gap-2 text-gray-600">
                          <CheckCircle weight="fill" className="text-green-500 flex-shrink-0" />
                          Ověřený profil nahráním oprávnění
                        </li>
                        <li className="flex items-center gap-2 text-gray-600">
                          <CheckCircle weight="fill" className="text-green-500 flex-shrink-0" />
                          Volba více kategorií
                        </li>
                        <li className="flex items-center gap-2 text-gray-600">
                          <CheckCircle weight="fill" className="text-green-500 flex-shrink-0" />
                          Vkládání fotografií
                        </li>
                        <li className="flex items-center gap-2 text-gray-600">
                          <CheckCircle weight="fill" className="text-green-500 flex-shrink-0" />
                          Notifikace (APP, E-mail, SMS)
                        </li>
                      </>
                    )}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(planId)}
                    disabled={processingPlan !== null}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                      isDodavatel
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {processingPlan === planId ? (
                      <>
                        <Spinner className="w-5 h-5 animate-spin" />
                        Zpracování...
                      </>
                    ) : (
                      <>
                        <CreditCard weight="bold" />
                        {planId === 'zakaznik' ? 'Začít jako zákazník' : 'Začít jako dodavatel'}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-gray-500 text-sm mt-8">
          Platba kartou přes zabezpečenou bránu Stripe. Můžete kdykoliv zrušit.
        </p>
      </div>
    </div>
  );
};

export { PaymentSuccess, PaymentCancelled, PricingPage };
