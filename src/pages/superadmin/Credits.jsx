import React, { useEffect, useState, useCallback } from 'react';
import { Coins, Plus, Search, ChevronDown, ChevronUp, ArrowUpCircle, ArrowDownCircle, MessageSquare, Phone } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Loader';
import Card from '../../components/ui/Card';
import { superadminService } from '../../services/superadmin.service';
import { formatDate, getInitials } from '../../utils/formatters';
import { toast } from '../../store/useToastStore';

const CHANNEL_META = [
  { key: 'sms',      label: 'SMS',      icon: MessageSquare, accent: 'text-blue-600',   bg: 'bg-blue-50' },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, accent: 'text-green-600',  bg: 'bg-green-50' },
  { key: 'call',     label: 'Call',     icon: Phone,         accent: 'text-orange-600', bg: 'bg-orange-50' },
];

const CHANNEL_RATES = { sms: 0.20, whatsapp: 0.50, call: 1.00 };

function balanceColor(value) {
  if (value <= 0) return 'text-red-600';
  if (value < 5) return 'text-yellow-600';
  return 'text-green-600';
}

export default function CreditsPage() {
  const [schools, setSchools] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Topup modal
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupTarget, setTopupTarget] = useState(null);
  const [topupForm, setTopupForm] = useState({ channel: 'sms', amount: '', description: '' });
  const [topupSaving, setTopupSaving] = useState(false);

  // Ledger drawer
  const [ledgerSchool, setLedgerSchool] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [ledgerMeta, setLedgerMeta] = useState({});
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const load = useCallback(async (p = 1, q = search) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (q) params.search = q;
      const res = await superadminService.listCreditBalances(params);
      setSchools(res.data.schools);
      setMeta(res.data.meta);
    } catch {
      toast.error('Failed to load credit balances');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1, search); }, [search]);

  const openTopup = (school, presetChannel = 'sms') => {
    setTopupTarget(school);
    setTopupForm({ channel: presetChannel, amount: '', description: '' });
    setTopupOpen(true);
  };

  const handleTopup = async () => {
    const amount = parseFloat(topupForm.amount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (!topupForm.channel) { toast.error('Select a channel'); return; }
    setTopupSaving(true);
    try {
      await superadminService.topupCredits({
        schoolId: topupTarget._id,
        channel: topupForm.channel,
        amount,
        description: topupForm.description,
      });
      toast.success(`${amount} ${topupForm.channel.toUpperCase()} credits added to ${topupTarget.name}`);
      setTopupOpen(false);
      load(page, search);
      if (ledgerSchool?._id === topupTarget._id) loadLedger(topupTarget, 1);
    } catch (err) {
      toast.error(err.message || 'Failed to top up credits');
    } finally {
      setTopupSaving(false);
    }
  };

  const loadLedger = async (school, p = 1) => {
    setLedgerLoading(true);
    try {
      const res = await superadminService.getSchoolCredits(school._id, { page: p, limit: 10 });
      setLedger(res.data.entries);
      setLedgerMeta(res.data.meta);
      setLedgerPage(p);
    } catch {
      toast.error('Failed to load ledger');
    } finally {
      setLedgerLoading(false);
    }
  };

  const toggleLedger = (school) => {
    if (ledgerSchool?._id === school._id) {
      setLedgerSchool(null);
    } else {
      setLedgerSchool(school);
      loadLedger(school, 1);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Credits</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Each service has its own credit balance.
            SMS {CHANNEL_RATES.sms.toFixed(2)} / WhatsApp {CHANNEL_RATES.whatsapp.toFixed(2)} / Call {CHANNEL_RATES.call.toFixed(2)} credits per recipient. Email is free.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          placeholder="Search schools…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><PageLoader /></div>
      ) : schools.length === 0 ? (
        <EmptyState icon={Coins} title="No schools found" description="Try a different search term." />
      ) : (
        <>
          <Table>
            <Thead>
              <Th>School</Th>
              <Th>Status</Th>
              <Th>SMS</Th>
              <Th>WhatsApp</Th>
              <Th>Call</Th>
              <Th />
            </Thead>
            <Tbody>
              {schools.map((s) => {
                const balances = s.creditBalances || { sms: 0, whatsapp: 0, call: 0 };
                return (
                <React.Fragment key={s._id}>
                  <Tr>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-violet-700">{getInitials(s.name)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <Badge label={s.isActive ? 'Active' : 'Inactive'} variant={s.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </Td>
                    {CHANNEL_META.map(({ key }) => (
                      <Td key={key}>
                        <button
                          onClick={() => openTopup(s, key)}
                          className={[
                            'font-semibold text-sm hover:underline cursor-pointer',
                            balanceColor(balances[key] ?? 0),
                          ].join(' ')}
                          title={`Top up ${key.toUpperCase()} credits`}
                        >
                          {(balances[key] ?? 0).toFixed(2)}
                        </button>
                      </Td>
                    ))}
                    <Td>
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" onClick={() => openTopup(s)}>
                          <Plus size={13} /> Add Credits
                        </Button>
                        <button
                          onClick={() => toggleLedger(s)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                          title="View ledger"
                        >
                          {ledgerSchool?._id === s._id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      </div>
                    </Td>
                  </Tr>

                  {/* Inline ledger */}
                  {ledgerSchool?._id === s._id && (
                    <Tr>
                      <Td colSpan={4} className="bg-gray-50 p-0">
                        <div className="px-6 py-4 space-y-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction History</p>
                          {ledgerLoading ? (
                            <div className="py-6 flex justify-center"><PageLoader /></div>
                          ) : ledger.length === 0 ? (
                            <p className="text-sm text-gray-400 py-4 text-center">No transactions yet.</p>
                          ) : (
                            <>
                              <div className="space-y-1">
                                {ledger.map((entry) => (
                                  <div key={entry._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                    <div className="flex items-center gap-2">
                                      {entry.type === 'TOPUP' ? (
                                        <ArrowUpCircle size={15} className="text-green-500 shrink-0" />
                                      ) : (
                                        <ArrowDownCircle size={15} className="text-red-400 shrink-0" />
                                      )}
                                      <div>
                                        <p className="text-sm text-gray-700">{entry.description}</p>
                                        <p className="text-xs text-gray-400">{formatDate(entry.createdAt)}{entry.channel && ` · ${entry.channel.toUpperCase()}`}{entry.recipientCount && ` · ${entry.recipientCount} recipients`}</p>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-4">
                                      <p className={['text-sm font-semibold', entry.type === 'TOPUP' ? 'text-green-600' : 'text-red-500'].join(' ')}>
                                        {entry.type === 'TOPUP' ? '+' : '-'}{entry.amount.toFixed(2)}
                                      </p>
                                      <p className="text-xs text-gray-400">bal: {entry.balanceAfter.toFixed(2)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {ledgerMeta.pages > 1 && (
                                <div className="flex items-center gap-2 pt-1">
                                  <Button variant="secondary" size="sm" disabled={ledgerPage <= 1} onClick={() => loadLedger(s, ledgerPage - 1)}>Prev</Button>
                                  <span className="text-xs text-gray-500">Page {ledgerPage} of {ledgerMeta.pages}</span>
                                  <Button variant="secondary" size="sm" disabled={ledgerPage >= ledgerMeta.pages} onClick={() => loadLedger(s, ledgerPage + 1)}>Next</Button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  )}
                </React.Fragment>
                );
              })}
            </Tbody>
          </Table>

          {meta.pages > 1 && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(p, search); }}>Previous</Button>
              <span className="text-sm text-gray-500">Page {page} of {meta.pages}</span>
              <Button variant="secondary" size="sm" disabled={page >= meta.pages} onClick={() => { const p = page + 1; setPage(p); load(p, search); }}>Next</Button>
            </div>
          )}
        </>
      )}

      {/* Topup Modal */}
      <Modal
        open={topupOpen}
        onClose={() => setTopupOpen(false)}
        title={`Add Credits — ${topupTarget?.name}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTopupOpen(false)}>Cancel</Button>
            <Button loading={topupSaving} onClick={handleTopup}>Add Credits</Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Channel picker */}
          <div>
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Service</p>
            <div className="grid grid-cols-3 gap-2">
              {CHANNEL_META.map(({ key, label, icon: Icon, accent, bg }) => {
                const selected = topupForm.channel === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTopupForm((f) => ({ ...f, channel: key }))}
                    className={[
                      'flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all',
                      selected ? `${bg} ${accent} border-current` : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300',
                    ].join(' ')}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between bg-violet-50 rounded-xl px-4 py-3">
            <span className="text-sm text-violet-700 font-medium">
              Current {topupForm.channel?.toUpperCase()} Balance
            </span>
            <span className="text-lg font-bold text-violet-700">
              {(topupTarget?.creditBalances?.[topupForm.channel] ?? 0).toFixed(2)}
            </span>
          </div>

          <Input
            label="Credits to Add"
            type="number"
            min="1"
            step="0.01"
            placeholder="e.g. 100"
            value={topupForm.amount}
            onChange={(e) => setTopupForm((f) => ({ ...f, amount: e.target.value }))}
            required
          />
          <Input
            label="Notes (optional)"
            placeholder="e.g. Monthly allocation"
            value={topupForm.description}
            onChange={(e) => setTopupForm((f) => ({ ...f, description: e.target.value }))}
          />
          {topupForm.amount > 0 && (() => {
            const current = topupTarget?.creditBalances?.[topupForm.channel] ?? 0;
            const newBal = current + parseFloat(topupForm.amount || 0);
            const rate = CHANNEL_RATES[topupForm.channel] || 0.20;
            return (
              <p className="text-xs text-gray-500">
                New {topupForm.channel?.toUpperCase()} balance will be <strong>{newBal.toFixed(2)}</strong> credits
                &nbsp;(≈ <strong>{Math.floor(newBal / rate)}</strong> messages at {rate.toFixed(2)} per recipient).
              </p>
            );
          })()}
        </div>
      </Modal>
    </div>
  );
}
