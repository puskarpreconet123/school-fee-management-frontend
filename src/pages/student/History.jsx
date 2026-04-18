import React, { useEffect, useState } from 'react';
import { History, CheckCircle, XCircle, Clock } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Loader';
import { classNames, formatCurrency, formatDateTime } from '../../utils/formatters';
import api from '../../services/api';
import Card from '../../components/ui/Card';

const STATUS_OPTS = [
  { value: '', label: 'All Statuses' },
  { value: 'SUCCESS', label: 'Success' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
];

const statusIcon = {
  SUCCESS: <CheckCircle size={16} className="text-green-500" />,
  PENDING: <Clock size={16} className="text-yellow-500" />,
  FAILED: <XCircle size={16} className="text-red-500" />,
};

export default function HistoryPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    // In production, /api/payments/my would return the student's payment history
    api.get('/payments/my', { params: { status: status || undefined } })
      .then((res) => setPayments(Array.isArray(res.data) ? res.data : []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-none mb-2">Payment History</h1>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-200" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Your transaction records</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Select
          options={STATUS_OPTS}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-48 bg-white/50 backdrop-blur-sm border-white/60 rounded-xl"
        />
        {payments.length > 0 && (
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full ring-1 ring-black/5">
            {payments.length} Records Found
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><PageLoader /></div>
      ) : payments.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-100 bg-transparent py-20">
          <EmptyState
            icon={History}
            title="No records found"
            description="Your payment history will appear here after you make a payment."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {payments.map((p, idx) => (
            <Card
              key={p._id}
              className="group flex flex-col sm:flex-row sm:items-center gap-4 animate-slide-up border-white/60 bg-white/70 hover:bg-white shadow-sm hover:shadow-xl hover:shadow-green-500/5 ring-1 ring-black/5"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className={classNames(
                'w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center smooth-transition',
                p.status === 'SUCCESS' ? 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white' :
                  p.status === 'FAILED' ? 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white' :
                    'bg-yellow-50 text-yellow-600 group-hover:bg-yellow-600 group-hover:text-white'
              )}>
                {statusIcon[p.status] || <Clock size={20} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-extrabold text-gray-900 tracking-tight truncate">
                    {p.feeId?.title || 'Fee Payment'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Transaction on:</p>
                  <span className="text-[10px] font-black text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-md">
                    {formatDateTime(p.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 sm:pl-6 sm:border-l border-gray-100 mt-2 sm:mt-0">
                <div className="text-right shrink-0">
                  <p className="font-black text-xl text-gray-900 tracking-tighter leading-none mb-1">{formatCurrency(p.amount)}</p>
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1.5 py-0.5 bg-gray-50 rounded border border-gray-100">{p.provider}</span>
                    <Badge label={p.status} className={classNames(
                      'text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 border-none',
                      p.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                        p.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                    )} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
