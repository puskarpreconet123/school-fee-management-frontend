import React, { useEffect, useState } from 'react';
import { Building2, Users, IndianRupee, AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Loader';
import { superadminService } from '../../services/superadmin.service';
import { formatCurrency } from '../../utils/formatters';
import { toast } from '../../store/useToastStore';
import useAuthStore from '../../store/useAuthStore';

function StatCard({ label, value, icon: Icon, color, sub }) {
  const shadowColor = {
    'bg-brand-600': 'shadow-blue-200/50',
    'bg-green-500': 'shadow-green-200/50',
    'bg-violet-600': 'shadow-violet-200/50',
    'bg-red-500': 'shadow-red-200/50'
  }[color] || 'shadow-gray-200/50';

  return (
    <Card className="flex items-start gap-4 animate-scale-in">
      <div className={`p-3 rounded-2xl ${color} shadow-lg ${shadowColor} shrink-0`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-gray-900 tracking-tighter">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-1 font-medium">{sub}</p>}
      </div>
    </Card>
  );
}

export default function SuperAdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superadminService.summary()
      .then((res) => setData(res.data))
      .catch(() => toast.error('Failed to load summary'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const { schools, students, fees } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 font-medium">
          Welcome back, <span className="text-violet-600 font-bold">{user?.name || 'Super Admin'}</span>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Schools"
          value={schools?.total ?? '—'}
          icon={Building2}
          color="bg-violet-600"
          sub={`${schools?.active ?? 0} active`}
        />
        <StatCard
          label="Total Students"
          value={students?.total ?? '—'}
          icon={Users}
          color="bg-brand-600"
        />
        <StatCard
          label="Fees Collected"
          value={formatCurrency(fees?.totalCollected)}
          icon={IndianRupee}
          color="bg-green-500"
          sub={`${fees?.paid ?? 0} payments`}
        />
        <StatCard
          label="Overdue Fees"
          value={fees?.overdue ?? '—'}
          icon={AlertCircle}
          color="bg-red-500"
        />
      </div>

      {/* Quick action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          hoverable
          className="flex items-center gap-4 group"
          onClick={() => navigate('/superadmin/schools')}
        >
          <div className="p-3 bg-violet-50 rounded-2xl group-hover:bg-violet-100 smooth-transition">
            <Building2 size={20} className="text-violet-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm tracking-tight">Manage Schools</p>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">Create, activate or deactivate schools</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-2xl">
            <CheckCircle2 size={20} className="text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm tracking-tight">Platform Health</p>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">
              {schools?.active ?? 0} of {schools?.total ?? 0} schools active
            </p>
          </div>
        </Card>
      </div>

      {/* Fee overview */}
      <Card className="animate-fade-in delay-200">
        <div className="mb-6">
          <h3 className="font-bold text-gray-900 tracking-tight">Global Fee Overview</h3>
          <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">Across all schools</p>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Paid',    count: fees?.paid,    color: 'bg-green-500' },
            { label: 'Unpaid',  count: fees?.unpaid,  color: 'bg-yellow-400' },
            { label: 'Overdue', count: fees?.overdue, color: 'bg-red-500' },
          ].map(({ label, count, color }) => {
            const total = fees?.total || 0;
            const pct = total ? Math.round(((count || 0) / total) * 100) : 0;
            return (
              <div key={label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-medium text-gray-900">
                    {count ?? 0}{' '}
                    <span className="text-gray-400 font-normal">({pct}%)</span>
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
