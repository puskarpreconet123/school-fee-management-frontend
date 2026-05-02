import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend, ComposedChart
} from 'recharts';
import { Building2, IndianRupee, PieChart as PieIcon, BarChart3, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import Card from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Loader';
import { analyticsService } from '../../services/analytics.service';
import { formatCurrency } from '../../utils/formatters';
import { toast } from '../../store/useToastStore';

const VIOLET_COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

export default function SuperAdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await analyticsService.getSuperAdminStats();
        setData(res.data);
      } catch (err) {
        toast.error('Failed to load platform analytics');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <PageLoader />;
  if (!data) return null;

  // Process data for charts
  const growthData = data.schoolGrowth.map(item => ({
    name: new Date(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'short' }),
    schools: item.count
  }));

  const volData = data.platformVolume.map(item => ({
    name: item._id, // Date string
    total: item.total,
    count: item.count
  }));

  const topSchoolsData = data.topSchools.map(item => ({
    name: item.name,
    revenue: item.totalRevenue
  }));

  const statusData = data.schoolStatus.map(item => ({
    name: item._id ? 'Active' : 'Inactive',
    value: item.count
  }));

  return (
    <div className="space-y-6 pb-10">
      {/* Platform Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-slide-up">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Platform Intelligence</h1>
          <p className="text-sm text-gray-500 font-medium mt-1 italic">Aggregated platform overview & growth monitoring.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400 font-medium uppercase">Last Refresh</p>
            <p className="text-sm font-semibold text-gray-900">{new Date().toLocaleTimeString()}</p>
          </div>
          <div className="p-2 bg-violet-600 rounded-lg text-white shadow-lg shadow-violet-200">
             <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* Top Row: Overall Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Registration Trend */}
        <Card className="lg:col-span-2 overflow-hidden animate-scale-in h-[400px]">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                   <Building2 size={18} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">School Growth</h3>
             </div>
             <Badge className="bg-blue-50 text-blue-700 border-blue-100">Cumulative Enrollment</Badge>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                   <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                 />
                <Area
                  type="monotone"
                  dataKey="schools"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#growthGradient)"
                  isAnimationActive
                  animationBegin={150}
                  animationDuration={1400}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Platform Status Distribution */}
        <Card className="animate-scale-in delay-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-violet-50 rounded-lg">
              <Zap size={18} className="text-violet-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Platform Health</h3>
          </div>
          <div className="h-[250px] w-full mt-4">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    <Cell fill="#8b5cf6" />
                    <Cell fill="#22c55e" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
             </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-6">
             {statusData.map((item, idx) => (
               <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                     <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-violet-600' : 'bg-green-500'}`} />
                     <span className="text-gray-500 font-medium">{item.name} Schools</span>
                  </div>
                  <span className="font-bold text-gray-900">{item.value}</span>
               </div>
             ))}
          </div>
        </Card>

      </div>

      {/* Lower Row: Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Transaction Volume Over Time */}
        <Card className="animate-scale-in delay-200">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                   <TrendingUp size={18} className="text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Volume Last 30 Days</h3>
             </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={volData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                 <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                 />
                 <Bar
                   dataKey="total"
                   fill="#10b981"
                   radius={[4, 4, 0, 0]}
                   barSize={20}
                   isAnimationActive
                   animationBegin={200}
                   animationDuration={1100}
                   animationEasing="ease-out"
                 />
                 <Line
                   type="monotone"
                   dataKey="count"
                   stroke="#6366f1"
                   strokeWidth={2}
                   dot={false}
                   isAnimationActive
                   animationBegin={900}
                   animationDuration={1200}
                   animationEasing="ease-out"
                 />
               </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Schools by Revenue */}
        <Card className="animate-scale-in delay-300">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
              <IndianRupee size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">Leaderboard</h3>
          </div>
          <div className="space-y-4">
             {topSchoolsData.map((school, idx) => (
               <div key={school.name} className="flex items-center gap-4 p-4 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-white transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' : 
                    idx === 1 ? 'bg-slate-100 text-slate-700' :
                    idx === 2 ? 'bg-orange-50 text-orange-700' :
                    'bg-white text-gray-400'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="font-bold text-gray-900 truncate">{school.name}</p>
                     <p className="text-xs text-gray-500 uppercase tracking-tighter">Premier School Partner</p>
                  </div>
                  <div className="text-right">
                     <p className="font-bold text-violet-600">{formatCurrency(school.revenue)}</p>
                     <p className="text-[10px] text-gray-400 font-medium">TOTAL COLLECTED</p>
                  </div>
               </div>
             ))}
          </div>
        </Card>

      </div>
    </div>
  );
}

function Badge({ children, className }) {
   return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${className || ''}`}>
        {children}
      </span>
   );
}
