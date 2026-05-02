import React, { useEffect, useState } from 'react';
import { MessageSquare, Phone, Send, Users, Mail } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader } from '../../components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table';
import { PageLoader } from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import { adminService } from '../../services/admin.service';
import { formatDate } from '../../utils/formatters';
import { toast } from '../../store/useToastStore';

const CHANNELS = [
  { value: 'sms',       label: 'SMS',       icon: MessageSquare, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'whatsapp',  label: 'WhatsApp',  icon: MessageSquare, color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'call',      label: 'Call',      icon: Phone,         color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { value: 'email',     label: 'Email',     icon: Mail,          color: 'text-violet-600 bg-violet-50 border-violet-200' },
];

const CREDIT_COST = 0.12;

export default function CommunicatePage() {
  const [credits, setCredits] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [ledgerMeta, setLedgerMeta] = useState({});
  const [ledgerPage, setLedgerPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [channel, setChannel] = useState('sms');
  const [audience, setAudience] = useState('all'); // 'all' | 'selected'
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Student count cache (for cost preview)
  const [totalStudents, setTotalStudents] = useState(null);

  const loadCredits = async (p = 1) => {
    try {
      const res = await adminService.getCredits({ page: p, limit: 10 });
      setCredits(res.data.balance);
      setLedger(res.data.entries);
      setLedgerMeta(res.data.meta);
      setLedgerPage(p);
    } catch {
      toast.error('Failed to load credit info');
    }
  };

  const loadStudentCount = async () => {
    try {
      const res = await adminService.getStudents({ page: 1, limit: 1 });
      setTotalStudents(res.meta?.total ?? 0);
    } catch { /* silent */ }
  };

  useEffect(() => {
    Promise.all([loadCredits(1), loadStudentCount()]).finally(() => setLoading(false));
  }, []);

  const isFreeChannel = channel === 'email';

  const estimatedCost = isFreeChannel
    ? 0
    : audience === 'all' && totalStudents
      ? parseFloat((totalStudents * CREDIT_COST).toFixed(4))
      : null;

  const canSend = message.trim().length > 0 &&
    (isFreeChannel ||
      (credits !== null && (estimatedCost === null || credits >= estimatedCost)));

  const handleSend = async () => {
    if (!message.trim()) { toast.error('Please enter a message'); return; }
    setSending(true);
    try {
      const res = await adminService.communicate({
        channel,
        studentIds: audience === 'all' ? 'all' : [],
        message: message.trim(),
      });
      toast.success(res.message);
      setMessage('');
      loadCredits(1);
    } catch (err) {
      toast.error(err.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><PageLoader /></div>;

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      {/* Header & Mobile Credits */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Communicate</h1>
          <p className="text-sm text-gray-500 mt-0.5">Send SMS, WhatsApp, calls, or emails to your students.</p>
        </div>
        <div className="md:hidden bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 text-right">
          <p className="text-[10px] text-indigo-600 uppercase tracking-wider font-bold">Credits</p>
          <p className="text-lg font-black text-indigo-900 leading-none">{credits?.toFixed(2) ?? '—'}</p>
        </div>
      </div>

      {/* Top Alert Banner - only if low credits */}
      {credits !== null && credits < 50 && (
        <div className="bg-amber-100 text-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-8 py-3 rounded-xl mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600">warning</span>
            <span className="text-sm font-medium">Low Credit Warning: You have less than 50 credits remaining.</span>
          </div>
          <button className="text-amber-700 font-bold text-sm underline w-full sm:w-auto text-left sm:text-right">Recharge Now</button>
        </div>
      )}

      {/* Summary Bar */}
      <div className="flex flex-row gap-3 sm:gap-4 mb-8">
        <div className="hidden md:flex flex-1 bg-white border border-slate-200 p-4 rounded-xl items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Total Credits</p>
            <p className="text-2xl font-bold text-slate-900">{credits?.toFixed(2) ?? '—'}</p>
          </div>
        </div>
        
        <div className="flex-1 bg-white border border-slate-200 p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4">
          <div className="hidden sm:flex w-10 h-10 rounded-lg bg-slate-100 items-center justify-center text-slate-600">
            <span className="material-symbols-outlined">outbound</span>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-medium">Transactions</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{ledgerMeta.total || '—'}</p>
          </div>
        </div>
        <div className="flex-1 bg-white border border-slate-200 p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4">
          <div className="hidden sm:flex w-10 h-10 rounded-lg bg-orange-50 items-center justify-center text-orange-600">
            <span className="material-symbols-outlined">group</span>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-medium">Recipients</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{totalStudents ?? '—'}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Center Main Panel (70%) */}
        <div className="w-full lg:w-[70%] space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">New Message</h2>
              <div className="flex flex-wrap sm:flex-nowrap bg-slate-50 p-1 rounded-xl sm:rounded-full w-full md:w-auto gap-1">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch.value}
                    onClick={() => setChannel(ch.value)}
                    className={[
                      'flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 sm:py-1.5 rounded-lg sm:rounded-full text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap',
                      channel === ch.value 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-200'
                    ].join(' ')}
                  >
                    <ch.icon size={14} />
                    {ch.label}
                    {channel === ch.value && ch.value !== 'email' && (
                      <span className="opacity-70 font-normal ml-1">0.12 credits</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Recipients Dropdown */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Recipients</label>
                <div className="w-full border border-slate-200 rounded-lg p-2 flex flex-wrap gap-2 items-center bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
                  <button 
                    onClick={() => setAudience(audience === 'all' ? 'selected' : 'all')}
                    className={[
                      "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border transition-colors",
                      audience === 'all' 
                        ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    ].join(' ')}
                  >
                    All Active Students ({totalStudents ?? 0})
                    {audience === 'all' && <span className="material-symbols-outlined text-[14px]">close</span>}
                  </button>
                  <input className="flex-1 min-w-[200px] border-none focus:ring-0 text-sm py-1 outline-none" placeholder="Search students, classes, or parents..." type="text"/>
                </div>
              </div>

              {/* Templates */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2 uppercase tracking-wider">Quick Templates</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setMessage("Dear Parent, this is a reminder to pay the pending fee for your child.")} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left">Fee Reminder</button>
                  <button onClick={() => setMessage("We have received your recent payment. Thank you!")} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left">Payment Confirmation</button>
                  <button onClick={() => setMessage("Important: School will remain closed tomorrow.")} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left">Event Notice</button>
                </div>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full h-[200px] border border-slate-200 rounded-xl p-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none outline-none" 
                  placeholder="Type your message here... Use {student_name} or {amount_due} for variables."
                />
                <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-500 border border-slate-100">
                  {message.length} chars
                </div>
              </div>

              {/* Info Banner Contextual Math */}
              {isFreeChannel ? (
                <div className="bg-green-50 text-green-800 p-4 rounded-xl flex items-start gap-3 border border-green-100">
                  <span className="material-symbols-outlined text-green-600">info</span>
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Email is free</p>
                    <p className="text-xs">Sending to {totalStudents ?? 0} students. No credits will be used.</p>
                  </div>
                </div>
              ) : estimatedCost !== null && credits < estimatedCost ? (
                <div className="bg-red-50 text-red-800 p-4 rounded-xl flex items-start gap-3 border border-red-100">
                  <span className="material-symbols-outlined text-red-600">error_outline</span>
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Insufficient Credits</p>
                    <p className="text-xs">Sending to {totalStudents ?? 0} students × 0.12 = {estimatedCost.toFixed(2)} credits needed. Your current balance is {credits?.toFixed(2)}.</p>
                  </div>
                </div>
              ) : estimatedCost !== null && (
                <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl flex items-start gap-3 border border-indigo-100">
                  <span className="material-symbols-outlined text-indigo-600">info</span>
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Estimated Cost</p>
                    <p className="text-xs">Sending to {totalStudents ?? 0} students × 0.12 = {estimatedCost.toFixed(2)} credits. Balance after: {Math.max(0, credits - estimatedCost).toFixed(2)}.</p>
                  </div>
                </div>
              )}

              {/* Action Row */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4">
                <button className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all border border-transparent">
                  Schedule for later
                </button>
                <Button 
                  onClick={handleSend} 
                  loading={sending} 
                  disabled={!canSend} 
                  className="w-full sm:w-auto justify-center !bg-indigo-600 hover:!bg-indigo-700 !text-white px-8 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
                >
                  Send {CHANNELS.find((c) => c.value === channel)?.label}
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel (30%) */}
        <div className="w-full lg:w-[30%] space-y-6">
          {/* Credit Balance Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 font-medium">Credit Balance</p>
                <h3 className="text-[32px] font-black text-slate-900 leading-none">{credits?.toFixed(2) ?? '—'}</h3>
                <p className="text-xs text-indigo-600 font-medium mt-1">≈ {credits ? Math.floor(credits / CREDIT_COST) : 0} messages remaining</p>
              </div>
              <span className="material-symbols-outlined text-indigo-600 text-3xl">account_balance_wallet</span>
            </div>

            <table className="w-full text-xs mb-6 border-t border-slate-100 pt-4 mt-4">
              <tbody>
                <tr className="text-slate-500">
                  <td className="py-2">SMS</td>
                  <td className="text-right py-2 font-bold text-slate-800">0.12</td>
                </tr>
                <tr className="text-slate-500">
                  <td className="py-2">Call</td>
                  <td className="text-right py-2 font-bold text-slate-800">0.12</td>
                </tr>
                <tr className="text-slate-500">
                  <td className="py-2">Email</td>
                  <td className="text-right py-2 font-bold text-green-600">Free</td>
                </tr>
              </tbody>
            </table>
            
            <button className="w-full border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all font-bold py-3 rounded-xl text-sm">
              Top Up Credits
            </button>
          </div>

          {/* Delivery Status */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">Delivery Status</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Delivered</span>
                </div>
                <span className="font-black text-green-700">98%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Pending</span>
                </div>
                <span className="font-black text-amber-700">1.5%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Failed</span>
                </div>
                <span className="font-black text-red-700">0.5%</span>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-lg font-bold text-slate-900">Recent Activity</h4>
            </div>
            <div className="p-0">
              {ledger.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No transactions yet.</p>
              ) : (
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-50">
                    {ledger.map((entry) => (
                      <tr key={entry._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-full ${entry.type === 'TOPUP' ? 'bg-green-50 text-green-600' : 'bg-indigo-50 text-indigo-600'}`}>
                              <span className="material-symbols-outlined text-sm">{entry.type === 'TOPUP' ? 'add_circle' : 'sms'}</span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                {entry.type === 'TOPUP' ? 'Credit Purchase' : entry.channel?.toUpperCase()}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {entry.recipientCount ? `${entry.recipientCount} Recp • ` : ''} {formatDate(entry.createdAt)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span className={`text-xs font-black ${entry.type === 'TOPUP' ? 'text-green-600' : 'text-red-500'}`}>
                            {entry.type === 'TOPUP' ? '+' : '-'}{entry.amount.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            {ledgerMeta.pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-50">
                <Button variant="secondary" size="sm" disabled={ledgerPage <= 1} onClick={() => loadCredits(ledgerPage - 1)}>Prev</Button>
                <span className="text-xs text-slate-400 font-medium">{ledgerPage}/{ledgerMeta.pages}</span>
                <Button variant="secondary" size="sm" disabled={ledgerPage >= ledgerMeta.pages} onClick={() => loadCredits(ledgerPage + 1)}>Next</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
