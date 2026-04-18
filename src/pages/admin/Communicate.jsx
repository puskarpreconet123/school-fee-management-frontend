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

  const estimatedCost = audience === 'all' && totalStudents
    ? parseFloat((totalStudents * CREDIT_COST).toFixed(4))
    : null;

  const canSend = message.trim().length > 0 &&
    credits !== null &&
    (estimatedCost === null || credits >= estimatedCost);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Communicate</h1>
        <p className="text-sm text-gray-500 mt-0.5">Send SMS, WhatsApp messages or calls to your students.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader title="New Message" subtitle="Compose and send a blast to students" />

            {/* Channel selector */}
            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium text-gray-700">Channel</p>
              <div className="flex gap-2 flex-wrap">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch.value}
                    onClick={() => setChannel(ch.value)}
                    className={[
                      'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all',
                      channel === ch.value ? ch.color + ' border-current' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300',
                    ].join(' ')}
                  >
                    <ch.icon size={15} />
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Audience */}
            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium text-gray-700">Recipients</p>
              <button
                onClick={() => setAudience('all')}
                className={[
                  'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all w-full',
                  audience === 'all'
                    ? 'bg-violet-50 border-violet-300 text-violet-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300',
                ].join(' ')}
              >
                <Users size={15} />
                All active students
                {totalStudents !== null && (
                  <span className="ml-auto text-xs text-gray-400">{totalStudents} students</span>
                )}
              </button>
            </div>

            {/* Message */}
            <div className="space-y-2 mb-5">
              <p className="text-sm font-medium text-gray-700">Message</p>
              <textarea
                rows={4}
                placeholder="Type your message here…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-400">{message.length} characters</p>
            </div>

            {/* Cost preview */}
            {estimatedCost !== null && (
              <div className={[
                'rounded-xl px-4 py-3 mb-5 text-sm flex items-center justify-between',
                credits < estimatedCost ? 'bg-red-50 text-red-700' : 'bg-violet-50 text-violet-700',
              ].join(' ')}>
                <span>
                  Estimated cost: <strong>{estimatedCost.toFixed(2)} credits</strong>
                  {' '}({totalStudents} × {CREDIT_COST})
                </span>
                <span>
                  Balance after: <strong>{Math.max(0, credits - estimatedCost).toFixed(2)}</strong>
                </span>
              </div>
            )}

            {credits !== null && estimatedCost !== null && credits < estimatedCost && (
              <p className="text-xs text-red-600 mb-4">
                Insufficient credits. Please ask your administrator to top up your balance.
              </p>
            )}

            <Button onClick={handleSend} loading={sending} disabled={!canSend} className="w-full justify-center">
              <Send size={15} /> Send {CHANNELS.find((c) => c.value === channel)?.label}
            </Button>
          </Card>
        </div>

        {/* Balance & ledger panel */}
        <div className="space-y-4">
          {/* Balance card */}
          <Card className="bg-gradient-to-br from-violet-600 to-violet-700 text-white">
            <p className="text-sm text-violet-200 font-medium">Credit Balance</p>
            <p className="text-4xl font-bold mt-1">{credits?.toFixed(2) ?? '—'}</p>
            <p className="text-xs text-violet-300 mt-2">
              ≈ {credits ? Math.floor(credits / CREDIT_COST) : 0} messages remaining
            </p>
            <div className="mt-4 pt-4 border-t border-violet-500 text-xs text-violet-200 space-y-1">
              <div className="flex justify-between"><span>Cost per message</span><span>0.12 credits</span></div>
              <div className="flex justify-between"><span>Cost per call</span><span>0.12 credits</span></div>
            </div>
          </Card>

          {/* Recent transactions */}
          <Card padding={false}>
            <div className="px-5 pt-5 pb-3">
              <p className="text-sm font-semibold text-gray-900">Recent Transactions</p>
            </div>
            {ledger.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No transactions yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {ledger.map((entry) => (
                  <div key={entry._id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-xs text-gray-700 font-medium">
                        {entry.type === 'TOPUP' ? 'Top-up' : entry.channel?.toUpperCase()}
                        {entry.recipientCount ? ` · ${entry.recipientCount} students` : ''}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(entry.createdAt)}</p>
                    </div>
                    <span className={['text-sm font-semibold', entry.type === 'TOPUP' ? 'text-green-600' : 'text-red-500'].join(' ')}>
                      {entry.type === 'TOPUP' ? '+' : '-'}{entry.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {ledgerMeta.pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <Button variant="secondary" size="sm" disabled={ledgerPage <= 1} onClick={() => loadCredits(ledgerPage - 1)}>Prev</Button>
                <span className="text-xs text-gray-400">{ledgerPage}/{ledgerMeta.pages}</span>
                <Button variant="secondary" size="sm" disabled={ledgerPage >= ledgerMeta.pages} onClick={() => loadCredits(ledgerPage + 1)}>Next</Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
