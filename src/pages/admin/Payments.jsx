import React, { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Loader';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { toast } from '../../store/useToastStore';
import api from '../../services/api';

const STATUS_OPTS = [
  { value: '', label: 'All' },
  { value: 'SUCCESS', label: 'Success' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
];

const PROVIDER_OPTS = [
  { value: '', label: 'All Providers' },
  { value: 'razorpay', label: 'Razorpay' },
  { value: 'phonepe', label: 'PhonePe' },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [provider, setProvider] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // This would hit a dedicated /api/admin/payments endpoint in production
        // For now we demonstrate the UI with a best-effort approach
        const res = await api.get('/admin/payments', {
          params: { status: status || undefined, provider: provider || undefined },
        }).catch(() => ({ data: [] }));
        setPayments(Array.isArray(res.data) ? res.data : []);
      } catch {
        setPayments([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [status, provider]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500 mt-0.5">Transaction history across all students</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select options={STATUS_OPTS} value={status} onChange={(e) => setStatus(e.target.value)} className="w-36" />
        <Select options={PROVIDER_OPTS} value={provider} onChange={(e) => setProvider(e.target.value)} className="w-40" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><PageLoader /></div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No transactions yet"
          description="Payments will appear here once students start paying fees."
        />
      ) : (
        <Table>
          <Thead>
            <Th>Student</Th>
            <Th>Amount</Th>
            <Th>Provider</Th>
            <Th>Order ID</Th>
            <Th>Status</Th>
            <Th>Date</Th>
          </Thead>
          <Tbody>
            {payments.map((p) => (
              <Tr key={p._id}>
                <Td className="font-medium text-gray-900">{p.studentId?.name || p.studentId || '—'}</Td>
                <Td className="font-semibold">{formatCurrency(p.amount)}</Td>
                <Td><Badge label={p.provider} /></Td>
                <Td className="font-mono text-xs text-gray-500">{p.providerOrderId?.slice(0, 20) || '—'}</Td>
                <Td><Badge label={p.status} /></Td>
                <Td className="text-gray-400">{formatDateTime(p.createdAt)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
