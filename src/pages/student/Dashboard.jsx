import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, AlertCircle, Clock, CheckCircle, ArrowRight, History } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Loader';
import { feeService } from '../../services/fee.service';
import { classNames, formatCurrency, formatDate } from '../../utils/formatters';
import { toast } from '../../store/useToastStore';
import useAuthStore from '../../store/useAuthStore';

function StatCard({ label, value, icon: Icon, color, sub }) {
  const shadowColor = {
    'bg-brand-600': 'shadow-brand-200/50',
    'bg-green-500': 'shadow-green-200/50',
    'bg-yellow-500': 'shadow-yellow-200/50',
    'bg-red-500': 'shadow-red-200/50'
  }[color] || 'shadow-gray-200/50';

  return (
    <Card className="flex items-center gap-5 animate-scale-in group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.03] -mr-8 -mt-8 rounded-full group-hover:scale-110 transition-transform duration-500" />
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-2xl ${shadowColor} shrink-0 group-hover:scale-105 transition-transform duration-300`}>
        <Icon size={24} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1 leading-none">{label}</p>
        <p className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 font-medium truncate">{sub}</p>}
      </div>
    </Card>
  );
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'

  useEffect(() => {
    feeService.myFees({ page: 1, limit: 50 })
      .then((res) => setFees(res.data || []))
      .catch(() => toast.error('Failed to load fees'))
      .finally(() => setLoading(false));
  }, []);

  const unpaid = fees.filter((f) => f.status === 'UNPAID' || f.status === 'OVERDUE' || f.status === 'PARTIALLY_PAID');
  const paid = fees.filter((f) => f.status === 'PAID');
  const totalDue = unpaid.reduce((s, f) => s + (f.amount - (f.paidAmount || 0)), 0);

  const upcoming = [...unpaid]
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter leading-none">Dashboard</h1>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">
              Welcome, <span className="text-brand-600 underline underline-offset-4 decoration-2 decoration-brand-100">{user?.name?.split(' ')[0] || 'Student'}</span> 👋
            </p>
          </div>
        </div>
        
        {/* Compact stats overview for mobile if needed, or just a profile shortcut */}
        <div className="lg:hidden w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400">
          <Clock size={20} />
        </div>
      </div>

      {/* Stat cards - Scrollable on mobile */}
      <div className="flex sm:grid sm:grid-cols-3 gap-4 overflow-x-auto pb-4 -mx-5 px-5 sm:mx-0 sm:px-0 scrollbar-hide snap-x">
        <div className="min-w-[280px] sm:min-w-0 snap-center">
          <StatCard
            label="Total Due"
            value={formatCurrency(totalDue)}
            icon={AlertCircle}
            color="bg-red-500"
          />
        </div>
        <div className="min-w-[280px] sm:min-w-0 snap-center">
          <StatCard
            label="Unpaid Fees"
            value={unpaid.length}
            icon={Clock}
            color="bg-yellow-500"
          />
        </div>
        <div className="min-w-[280px] sm:min-w-0 snap-center">
          <StatCard
            label="Paid Records"
            value={paid.length}
            icon={CheckCircle}
            color="bg-green-500"
          />
        </div>
      </div>

      {/* Quick actions - Compact Chips */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            const firstUnpaid = unpaid[0]?._id;
            if (firstUnpaid) navigate(`/student/payment/${firstUnpaid}`);
            else setActiveTab('history');
          }}
          className="flex flex-col gap-3 p-4 rounded-3xl bg-brand-600 text-white shadow-xl shadow-brand-200 group active:scale-95 transition-all text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 -mr-4 -mt-4 rounded-full" />
          <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
            <Receipt size={20} />
          </div>
          <div>
            <p className="font-bold text-sm tracking-tight leading-none">Pay Now</p>
            <p className="text-[10px] text-brand-100 mt-1 font-medium opacity-80">Settles pending dues</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className="flex flex-col gap-3 p-4 rounded-3xl bg-white border border-gray-100 shadow-sm group active:scale-95 transition-all text-left relative overflow-hidden"
        >
          <div className="w-10 h-10 flex items-center justify-center bg-green-50 text-green-600 rounded-2xl group-hover:scale-110 transition-transform">
            <History size={20} />
          </div>
          <div>
            <p className="font-bold text-sm text-gray-900 tracking-tight leading-none">History</p>
            <p className="text-[10px] text-gray-500 mt-1 font-medium italic">Recent activity</p>
          </div>
        </button>
      </div>

      {/* Fee Management with Tabs */}
      <div className="space-y-6">
        <div className="flex items-center p-1 bg-gray-100/50 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('pending')}
            className={classNames(
              'px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
              activeTab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={classNames(
              'px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
              activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            History
          </button>
        </div>

        {activeTab === 'pending' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Pending Dues</h2>
              {unpaid.length > 0 && (
                <Badge label={`${unpaid.length} Items`} className="bg-red-50 text-red-600 border-red-100 scale-90" />
              )}
            </div>
            {unpaid.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-100 bg-transparent py-8">
                <EmptyState
                  icon={CheckCircle}
                  title="Clear for takeoff!"
                  description="No pending dues found."
                  className="py-4"
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {unpaid.map((f, idx) => (
                  <Card
                    key={f._id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 group border-white shadow-sm hover:shadow-xl hover:shadow-brand-500/5 transition-all p-4"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-brand-50 smooth-transition text-gray-400 group-hover:text-brand-600">
                      <Receipt size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-gray-900 text-lg tracking-tight truncate">{f.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={classNames(
                          'text-[10px] font-black tracking-tight rounded-md px-2 py-0.5 uppercase',
                          f.status === 'OVERDUE' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-700'
                        )}>
                          Due {formatDate(f.dueDate)}
                        </span>
                        {f.paidAmount > 0 && (
                          <span className="text-[10px] font-black tracking-tight rounded-md px-2 py-0.5 uppercase bg-green-50 text-green-700">
                            Paid: {formatCurrency(f.paidAmount)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:pl-4">
                      <div className="text-right">
                        <p className="font-black text-2xl text-gray-900 tracking-tighter">
                          {formatCurrency(f.amount - (f.paidAmount || 0))}
                        </p>
                        {f.paidAmount > 0 && (
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Remaining</p>
                        )}
                      </div>
                      <Button
                        className="rounded-xl px-6"
                        onClick={() => navigate(`/student/payment/${f._id}`)}
                      >
                        Pay
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in space-y-4">
            <div className="bg-white/50 backdrop-blur-md rounded-3xl border border-white/60 overflow-hidden shadow-sm ring-1 ring-black/5 divide-y divide-gray-100/50">
              {fees.length === 0 ? (
                <div className="p-12 text-center text-gray-400 font-medium">No records found.</div>
              ) : (
                fees.map((f) => (
                  <div key={f._id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/80 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-all">
                      <Receipt size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{f.title}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{formatDate(f.dueDate)}</p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="text-sm font-black text-gray-900 tracking-tighter">{formatCurrency(f.amount)}</p>
                        <Badge label={f.status} className="mt-1 scale-75 origin-right" />
                      </div>
                      {(f.status === 'UNPAID' || f.status === 'OVERDUE') && (
                        <button 
                          onClick={() => navigate(`/student/payment/${f._id}`)}
                          className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-all"
                        >
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
