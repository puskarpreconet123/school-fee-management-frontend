import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Search, Zap, CreditCard, ChevronLeft, Calendar, UserCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { publicService } from '../services/public.service';
import { formatCurrency, formatDate, classNames } from '../utils/formatters';
import { toast } from '../store/useToastStore';

const PROVIDER_META = {
  razorpay: {
    label: 'Razorpay',
    description: 'Cards, UPI, Net Banking & Wallets',
    icon: CreditCard,
    color: 'border-indigo-200 bg-indigo-50',
    selected: 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200',
    badge: 'bg-indigo-600 text-white',
  },
  phonepe: {
    label: 'PhonePe',
    description: 'PhonePe, UPI & more',
    icon: Zap,
    color: 'border-purple-200 bg-purple-50',
    selected: 'border-purple-500 bg-purple-50 ring-2 ring-purple-200',
    badge: 'bg-purple-600 text-white',
  },
};

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) { resolve(true); return; }
    const s = document.createElement('script');
    s.id = 'razorpay-script';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function PublicPaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('studentId') || '';

  const [studentIdInput, setStudentIdInput] = useState(initialSearch);
  const [searching, setSearching] = useState(false);
  
  // Data state
  const [data, setData] = useState(null); // { student, school, fees }
  const [providers, setProviders] = useState([]);
  
  // Interaction state
  const [selectedFee, setSelectedFee] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [paying, setPaying] = useState(false);
  const [step, setStep] = useState('search'); // 'search' | 'list' | 'checkout' | 'success'

  // Auto-search on mount if studentId is present in URL
  useEffect(() => {
    if (initialSearch) {
      // Small delay to ensure state and components are ready
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!studentIdInput.trim()) { toast.error('Please enter a Student ID'); return; }
    
    setSearching(true);
    try {
      const res = await publicService.getStudentDues(studentIdInput.trim());
      setData(res.data);
      
      // Also pre-fetch providers
      try {
        const provRes = await publicService.getProviders(studentIdInput.trim());
        setProviders(provRes.data?.providers || []);
      } catch (e) {
        console.error('Failed to load providers', e);
      }
      
      setStep('list');
    } catch (err) {
      toast.error(err.message || 'Could not find student. Please check the ID.');
    } finally {
      setSearching(false);
    }
  };

  const startCheckout = (fee) => {
    setSelectedFee(fee);
    if (providers.length === 1) setSelectedProvider(providers[0]);
    setStep('checkout');
  };

  const handlePay = async () => {
    if (!selectedProvider) { toast.error('Please select a payment method'); return; }
    setPaying(true);
    try {
      const res = await publicService.createOrder({ feeId: selectedFee._id, providerType: selectedProvider });
      const { paymentId, orderData } = res.data || {};

      if (!orderData) throw new Error('Could not initialize payment with gateway.');

      if (selectedProvider === 'razorpay') {
        await handleRazorpay(paymentId, orderData);
      } else if (selectedProvider === 'phonepe') {
        const url = orderData.redirectUrl;
        if (url) window.location.href = url;
        else throw new Error('Failed to get PhonePe redirect URL');
      }
    } catch (err) {
      toast.error(err.message || 'Payment initiation failed');
      setPaying(false);
    }
  };

  const handleRazorpay = async (paymentId, orderData) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) { toast.error('Failed to load Razorpay'); setPaying(false); return; }

    const options = {
      key: orderData?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: selectedFee.amountInPaise,
      currency: selectedFee.currency || 'INR',
      name: data.school.name,
      description: selectedFee.title,
      order_id: orderData?.id,
      prefill: { name: data.student.name, email: data.student.email },
      theme: { color: '#2563eb' },
      handler: async (response) => {
        try {
          await publicService.verifyPayment({
            paymentId,
            providerType: 'razorpay',
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          setStep('success');
          toast.success('Payment successful!');
        } catch (err) {
          toast.error(err.message || 'Payment verification failed');
        } finally {
          setPaying(false);
        }
      },
      modal: {
        ondismiss: () => {
          setPaying(false);
          toast.info('Payment cancelled');
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        
        {/* Header / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white mb-4 shadow-lg shadow-brand-200">
            <Zap size={24} className="fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Quick Pay</h1>
          <p className="text-gray-500 mt-1">Pay student fees instantly without logging in</p>
        </div>

        {/* STEP 1: Search */}
        {step === 'search' && (
          <Card className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Student ID</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="e.g. STU-202404-00001"
                    className="pl-10 h-12 text-lg font-mono placeholder:font-sans"
                    value={studentIdInput}
                    onChange={(e) => setStudentIdInput(e.target.value.toUpperCase())}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Enter the ID provided by your school</p>
              </div>
              <Button type="submit" size="lg" className="w-full" loading={searching}>
                Find Dues
              </Button>
            </form>
          </Card>
        )}

        {/* STEP 2: Dues List */}
        {step === 'list' && data && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Student Info */}
            <Card className="bg-white border-brand-100 ring-1 ring-brand-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <UserCircle size={24} className="text-brand-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{data.student.name}</h3>
                  <p className="text-sm text-gray-500">Class {data.student.class} — {data.school.name}</p>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-between px-1 mt-6 mb-2">
              <h4 className="font-bold text-gray-700 flex items-center gap-2">
                <Calendar size={18} /> Pending Fees
              </h4>
              <span className="text-sm font-semibold text-gray-400">{data.fees.length} items</span>
            </div>

            {/* Fee Error / Empty State */}
            {data.fees.length === 0 ? (
              <Card className="text-center py-10">
                <ShieldCheck size={40} className="mx-auto text-green-500 mb-3" />
                <h3 className="font-bold text-gray-900">All clear!</h3>
                <p className="text-sm text-gray-500 mt-1">There are no pending fees for this student.</p>
                <Button variant="secondary" className="mt-5" onClick={() => setStep('search')}>Search Another</Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {data.fees.map(f => (
                  <Card key={f._id} className="hover:shadow-md transition-shadow group">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{f.title}</p>
                          <Badge label={f.status} />
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{f.description}</p>
                        <p className="text-xs text-gray-400">Due: {formatDate(f.dueDate)}</p>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 sm:gap-2">
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(f.amount)}</p>
                        <Button size="sm" onClick={() => startCheckout(f)}>Pay Now</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            
            <div className="text-center pt-4">
              <button
                onClick={() => setStep('search')}
                className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                Search different student
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Checkout */}
        {step === 'checkout' && selectedFee && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <button
              onClick={() => setStep('list')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-2"
            >
              <ChevronLeft size={16} /> Back to fees
            </button>

            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fee</p>
                  <p className="font-semibold text-gray-900">{selectedFee.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">For {data.student.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedFee.amount)}</p>
                </div>
              </div>
            </Card>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3 px-1">Choose Payment Method</p>
              {providers.length === 0 ? (
                <Card>
                  <p className="text-sm text-gray-500 text-center py-4">
                    No online payment methods available. Please contact your school admin.
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {providers.map((p) => {
                    const meta = PROVIDER_META[p] || {};
                    const Icon = meta.icon || CreditCard;
                    const isSelected = selectedProvider === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setSelectedProvider(p)}
                        className={classNames(
                          'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-150 text-left',
                          isSelected ? meta.selected : `border-gray-200 bg-white hover:border-gray-300`
                        )}
                      >
                        <div className={classNames('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', meta.badge)}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{meta.label || p}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{meta.description || ''}</p>
                        </div>
                        <div className={classNames(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                          isSelected ? 'border-brand-600 bg-brand-600' : 'border-gray-300'
                        )}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <Button
              size="lg"
              className="w-full"
              disabled={!selectedProvider || paying}
              loading={paying}
              onClick={handlePay}
            >
              <ShieldCheck size={18} />
              Pay {formatCurrency(selectedFee.amount)} Securely
            </Button>
          </div>
        )}

        {/* STEP 4: Success */}
        {step === 'success' && (
          <Card className="text-center py-10 animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <ShieldCheck size={32} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful</h2>
            <p className="text-gray-500 text-sm mb-1">
              {formatCurrency(selectedFee.amount)} paid for <strong>{selectedFee.title}</strong>
            </p>
            <p className="text-xs text-gray-400 mb-8">This fee has been recorded successfully.</p>
            
            <div className="flex flex-col gap-3">
              <Button onClick={() => setStep('list')}>Return to Pending Fees</Button>
              <Button variant="secondary" onClick={() => navigate('/')}>Home</Button>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
