import React, { useEffect, useState } from 'react';
import { Users, IndianRupee, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Loader';
import { feeService } from '../../services/fee.service';
import { studentService } from '../../services/student.service';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { toast } from '../../store/useToastStore';
import useAuthStore from '../../store/useAuthStore';

function StatCard({ label, value, icon: Icon, color, sub }) {
  const shadowColor = {
    'bg-brand-600': 'shadow-blue-200/50',
    'bg-green-500': 'shadow-green-200/50',
    'bg-yellow-500': 'shadow-yellow-200/50',
    'bg-red-500': 'shadow-red-200/50',
    'bg-violet-600': 'shadow-violet-200/50'
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

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [recentFees, setRecentFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sumRes, studRes] = await Promise.all([
          feeService.summary(),
          studentService.list({ page: 1, limit: 1 }),
        ]);
        setSummary({ ...sumRes.data, totalStudents: studRes.meta?.total || 0 });
        // Load recent fees for first student — simplified; production would have a dedicated endpoint
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 font-medium">
          Welcome back, <span className="text-brand-600 font-bold">{user?.name || 'Admin'}</span>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={summary?.totalStudents ?? '—'}
          icon={Users}
          color="bg-brand-600"
        />
        <StatCard
          label="Fees Collected"
          value={formatCurrency(summary?.totalCollected)}
          icon={IndianRupee}
          color="bg-green-500"
          sub={`${summary?.paid ?? 0} payments`}
        />
        <StatCard
          label="Pending Fees"
          value={summary?.unpaid ?? '—'}
          icon={TrendingUp}
          color="bg-yellow-500"
        />
        <StatCard
          label="Overdue Fees"
          value={summary?.overdue ?? '—'}
          icon={AlertCircle}
          color="bg-red-500"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Navigate to students */}
        <Card
          hoverable
          className="flex items-center gap-4 group"
          onClick={() => navigate('/admin/students')}
        >
          <div className="p-3 bg-brand-50 rounded-2xl group-hover:bg-brand-100 smooth-transition">
            <Users size={20} className="text-brand-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm tracking-tight">Manage Students</p>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">Add, edit or upload student records</p>
          </div>
          <ArrowRight size={16} className="text-gray-300 group-hover:text-brand-600 group-hover:translate-x-1 smooth-transition" />
        </Card>

        <Card
          hoverable
          className="flex items-center gap-4 group"
          onClick={() => navigate('/admin/fees')}
        >
          <div className="p-3 bg-green-50 rounded-2xl group-hover:bg-green-100 smooth-transition">
            <IndianRupee size={20} className="text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm tracking-tight">Manage Fees</p>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">Create and assign fee records</p>
          </div>
          <ArrowRight size={16} className="text-gray-300 group-hover:text-green-600 group-hover:translate-x-1 smooth-transition" />
        </Card>
      </div>

      {/* Fee status overview */}
      <Card className="animate-fade-in delay-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-900 tracking-tight">Fee Overview</h3>
          <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400">
             <TrendingUp size={16} />
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Paid', count: summary?.paid, color: 'bg-green-500', total: summary?.total },
            { label: 'Unpaid', count: summary?.unpaid, color: 'bg-yellow-400', total: summary?.total },
            { label: 'Overdue', count: summary?.overdue, color: 'bg-red-500', total: summary?.total },
          ].map(({ label, count, color, total }) => {
            const pct = total ? Math.round((count / total) * 100) : 0;
            return (
              <div key={label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-medium text-gray-900">{count ?? 0} <span className="text-gray-400 font-normal">({pct}%)</span></span>
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
