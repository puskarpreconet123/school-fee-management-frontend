import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck, ChevronLeft, Zap, CreditCard } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Loader';
import { feeService } from '../../services/fee.service';
import { paymentService } from '../../services/payment.service';
import { formatCurrency, formatDate, classNames } from '../../utils/formatters';
import { toast } from '../../store/useToastStore';
import useAuthStore from '../../store/useAuthStore';

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

export default function PaymentPage() {
  const { feeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [fee, setFee] = useState(null);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [step, setStep] = useState('select'); // 'select' | 'confirm' | 'success'

  useEffect(() => {
    async function init() {
      try {
        const [feeRes, provRes] = await Promise.all([
          feeService.getById(feeId),
          paymentService.getProviders(user._id),
        ]);
        if (feeRes.data?.status === 'PAID') {
          toast.info('This fee has already been paid');
          navigate('/student/dashboard');
          return;
        }
        setFee(feeRes.data);
        setProviders(provRes.data?.providers || []);
        if (provRes.data?.providers?.length === 1) {
          setSelectedProvider(provRes.data.providers[0]);
        }
      } catch (err) {
        toast.error(err.message || 'Failed to load payment details');
        navigate('/student/dashboard');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [feeId]);

  const handlePay = async () => {
    if (!selectedProvider) { toast.error('Please select a payment method'); return; }
    setPaying(true);
    try {
      const res = await paymentService.createOrder({ feeId, providerType: selectedProvider });
      const { paymentId, orderData } = res.data || {};

      if (!orderData) {
        throw new Error('Could not initialize payment with gateway. Please try again.');
      }

      if (selectedProvider === 'razorpay') {
        await handleRazorpay(paymentId, orderData);
      } else if (selectedProvider === 'phonepe') {
        // PhonePe is redirect-based
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
      amount: fee.amountInPaise,
      currency: fee.currency || 'INR',
      name: 'FeeSync',
      description: fee.title,
      order_id: orderData?.id,
      prefill: { name: user?.name, email: user?.email },
      theme: { color: '#2563eb' },
      handler: async (response) => {
        try {
          await paymentService.verify({
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

  if (loading) return <PageLoader />;
  if (!fee) return null;

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-5">
          <ShieldCheck size={32} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful</h2>
        <p className="text-gray-500 text-sm mb-1">
          {formatCurrency(fee.amount)} paid for <strong>{fee.title}</strong>
        </p>
        <p className="text-xs text-gray-400 mb-8">A receipt has been sent to your email.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/student/history')}>View History</Button>
          <Button onClick={() => navigate('/student/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate('/student/dashboard')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <h1 className="text-xl font-bold text-gray-900">Pay Fee</h1>

      {/* Fee summary card */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fee</p>
            <p className="font-semibold text-gray-900">{fee.title}</p>
            {fee.description && <p className="text-sm text-gray-500 mt-1">{fee.description}</p>}
          </div>
          <Badge label={fee.status} />
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Due Date</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(fee.dueDate)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Amount</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(fee.amount)}</p>
          </div>
        </div>
      </Card>

      {/* Gateway selection */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Choose Payment Method</p>
        {providers.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-500 text-center py-4">
              No payment methods available. Contact your school admin.
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
                  {/* Radio indicator */}
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

      {/* Pay button */}
      <Button
        size="lg"
        className="w-full"
        disabled={!selectedProvider || paying}
        loading={paying}
        onClick={handlePay}
      >
        <ShieldCheck size={18} />
        Pay {formatCurrency(fee.amount)} via {selectedProvider ? PROVIDER_META[selectedProvider]?.label || selectedProvider : '…'}
      </Button>

      <p className="text-center text-xs text-gray-400">
        🔒 Payments are secured and encrypted end-to-end
      </p>
    </div>
  );
}
