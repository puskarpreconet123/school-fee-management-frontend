import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend 
} from 'recharts';
import { TrendingUp, Users, IndianRupee, PieChart as PieIcon, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Loader';
import { analyticsService } from '../../services/analytics.service';
import { formatCurrency } from '../../utils/formatters';
import { toast } from '../../store/useToastStore';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await analyticsService.getAdminStats();
        setData(res.data);
      } catch (err) {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <PageLoader />;
  if (!data) return null;

  // Process data for charts
  const trendData = data.collectionTrend.map(item => ({
    name: new Date(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'short' }),
    amount: item.total
  }));

  const pieData = data.statusDistribution.map(item => ({
    name: item._id,
    value: item.count
  }));

  const classData = data.classPerformance.map(item => ({
    name: `Class ${item._id}`,
    expected: item.totalExpected,
    collected: item.totalCollected
  }));

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-slide-up">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Analytics Overview</h1>
          <p className="text-sm text-gray-500 font-medium mt-1 italic">Deep dive into financial performance & collection trends.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-lg text-sm font-medium border border-brand-100">
          <TrendingUp size={16} />
          <span>Live Updates Active</span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Collection Trend */}
        <Card className="xl:col-span-2 overflow-hidden animate-scale-in">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-50 rounded-lg">
                <BarChart3 size={18} className="text-brand-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Collection Trend</h3>
                <p className="text-xs text-gray-400">Monthly revenue collection</p>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  tickFormatter={(val) => `₹${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Status Breakdown */}
        <Card className="animate-scale-in delay-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-amber-50 rounded-lg">
              <PieIcon size={18} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Fee Distribution</h3>
              <p className="text-xs text-gray-400">Current status breakdown</p>
            </div>
          </div>
          <div className="h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Class Performance */}
        <Card className="animate-scale-in delay-200">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Users size={18} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Collection by Class</h3>
              <p className="text-xs text-gray-400">Comparing expected vs. collected</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" verticalAlign="top" align="right" />
                <Bar dataKey="expected" name="Expected" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="collected" name="Collected" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Key Metrics / Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card hoverable className="flex flex-col justify-between border-l-4 border-brand-600 animate-scale-in delay-300">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-brand-50 rounded-xl text-brand-600 group-hover:bg-white smooth-transition">
                <IndianRupee size={20} />
              </div>
              <div className="flex items-center gap-1 text-[10px] bg-emerald-50 px-2 py-1 rounded-full text-emerald-700 font-bold uppercase tracking-wider">
                <ArrowUpRight size={10} />
                <span>Steady</span>
              </div>
            </div>
            <div className="mt-8">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Collected</p>
              <h4 className="text-3xl font-black text-gray-900 mt-1 tracking-tighter">
                {formatCurrency(data.totalCollectedOverall)}
              </h4>
              <p className="text-gray-400 text-[10px] mt-2 italic font-medium">Lifetime Platform</p>
            </div>
          </Card>

          <Card hoverable className="flex flex-col justify-between border-r-4 border-amber-500 animate-scale-in delay-400">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-100 group-hover:bg-white smooth-transition">
                <Users size={20} />
              </div>
            </div>
            <div className="mt-8">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Top Class</p>
              <h4 className="text-2xl font-black text-gray-900 mt-1 text-right tracking-tighter">
                {classData.reduce((max, curr) => curr.collected > max.collected ? curr : max, {name: 'N/A', collected: 0}).name}
              </h4>
              <div className="mt-3 bg-emerald-50 text-emerald-700 text-center py-1.5 rounded-xl text-[10px] font-black tracking-wide uppercase border border-emerald-100">
                Highest Collection
              </div>
            </div>
          </Card>

          <Card className="sm:col-span-2 bg-brand-700 border-none shadow-xl text-white relative overflow-hidden group">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-brand-600/10 rounded-full blur-3xl group-hover:bg-brand-600/20 transition-colors" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                  <h4 className="font-bold text-gray-100 tracking-wide uppercase text-xs">Fee Forecasting</h4>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed max-w-md">Projected collection for next month based on active fees and outstanding balances.</p>
              </div>
              
              <div className="flex flex-col items-end">
                 <p className="text-brand-400 text-[10px] font-bold uppercase tracking-widest mb-1">Estimated Inflow</p>
                 <h4 className="text-4xl font-black text-white tracking-tighter">
                   {formatCurrency(data.projectedNextMonth)}
                 </h4>
                 <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                    <TrendingUp size={12} className="text-brand-400" />
                    <span className="text-[10px] font-medium text-gray-400">Next Month Projection</span>
                 </div>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
