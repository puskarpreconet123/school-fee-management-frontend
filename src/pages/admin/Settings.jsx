import React, { useEffect, useState } from 'react';
import { Settings2, CheckCircle, AlertTriangle, Eye, EyeOff, Save, Bell, Plus, Trash2, RefreshCw } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Loader';
import { authService } from '../../services/auth.service';
import api from '../../services/api';
import { toast } from '../../store/useToastStore';
import { classNames } from '../../utils/formatters';

const DEFAULT_PROVIDERS = {
  razorpay: { type: 'razorpay', isActive: false, config: { keyId: '', keySecret: '', webhookSecret: '' } },
  phonepe:  { type: 'phonepe',  isActive: false, config: { merchantId: '', saltKey: '', saltIndex: '1' } },
};

function ProviderCard({ name, label, description, provider, onChange, showSecrets, onToggleSecrets }) {
  const active = provider?.isActive ?? false;
  const cfg = provider?.config ?? {};

  const updateCfg = (k, v) => onChange({ ...provider, config: { ...cfg, [k]: v } });
  const toggleActive = () => onChange({ ...provider, isActive: !active });

  return (
    <Card className={classNames('transition-all duration-200', active ? 'border-brand-200' : '')}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={classNames('w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold', active ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400')}>
            {name === 'razorpay' ? 'R' : 'P'}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{label}</h4>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge label={active ? 'ACTIVE' : 'INACTIVE'} variant={active ? 'ACTIVE' : 'INACTIVE'} />
          <button
            onClick={toggleActive}
            className={classNames(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
              'transition-colors duration-200 ease-in-out focus:outline-none',
              active ? 'bg-brand-600' : 'bg-gray-200'
            )}
          >
            <span
              className={classNames(
                'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                active ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
        </div>
      </div>

      {active && (
        <div className="space-y-3 pt-4 border-t border-gray-100">
          {name === 'razorpay' ? (
            <>
              <Input label="Key ID" value={cfg.keyId || ''} onChange={(e) => updateCfg('keyId', e.target.value)} placeholder="rzp_live_..." />
              <div className="relative">
                <Input label="Key Secret" type={showSecrets ? 'text' : 'password'} value={cfg.keySecret || ''} onChange={(e) => updateCfg('keySecret', e.target.value)} placeholder="••••••••" />
                <button type="button" onClick={onToggleSecrets} className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                  {showSecrets ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <Input label="Webhook Secret" type={showSecrets ? 'text' : 'password'} value={cfg.webhookSecret || ''} onChange={(e) => updateCfg('webhookSecret', e.target.value)} placeholder="••••••••" />
            </>
          ) : (
            <>
              <Input label="Merchant ID" value={cfg.merchantId || ''} onChange={(e) => updateCfg('merchantId', e.target.value)} placeholder="PGTESTPAYUAT..." />
              <div className="relative">
                <Input label="Salt Key" type={showSecrets ? 'text' : 'password'} value={cfg.saltKey || ''} onChange={(e) => updateCfg('saltKey', e.target.value)} placeholder="••••••••" />
                <button type="button" onClick={onToggleSecrets} className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                  {showSecrets ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <Input label="Salt Index" type="number" min="1" max="4" value={cfg.saltIndex || '1'} onChange={(e) => updateCfg('saltIndex', e.target.value)} />
            </>
          )}
        </div>
      )}
    </Card>
  );
}

export default function SettingsPage() {
  const [providers, setProviders] = useState(DEFAULT_PROVIDERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  const [reminderRules, setReminderRules] = useState([{ daysBefore: 3, timesPerDay: 1, channel: 'sms' }]);
  const [savingReminder, setSavingReminder] = useState(false);

  const [overdueRules, setOverdueRules] = useState([]);
  const [savingOverdue, setSavingOverdue] = useState(false);

  const [overdueRepeatRule, setOverdueRepeatRule] = useState(null);
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [savingRepeat, setSavingRepeat] = useState(false);

  useEffect(() => {
    authService.adminProfile()
      .then((res) => {
        const raw = res.data?.paymentProviders || [];
        const map = { ...DEFAULT_PROVIDERS };
        raw.forEach((p) => { if (map[p.type]) map[p.type] = p; });
        setProviders(map);

        if (res.data?.reminderRules?.length) {
          setReminderRules(res.data.reminderRules);
        }
        if (res.data?.overdueRules?.length) {
          setOverdueRules(res.data.overdueRules);
        }
        if (res.data?.overdueRepeatRule) {
          setOverdueRepeatRule(res.data.overdueRepeatRule);
          setRepeatEnabled(true);
        }
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const list = Object.values(providers);
    if (!list.some((p) => p.isActive)) {
      toast.error('At least one payment provider must be active');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/admin/me/providers', { paymentProviders: list });
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateRule = (idx, field, value) =>
    setReminderRules((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));

  const addRule = () =>
    setReminderRules((prev) => [...prev, { daysBefore: '', timesPerDay: 1, channel: 'sms' }]);

  const removeRule = (idx) =>
    setReminderRules((prev) => prev.filter((_, i) => i !== idx));

  const updateOverdueRule = (idx, field, value) =>
    setOverdueRules((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  const addOverdueRule = () =>
    setOverdueRules((prev) => [...prev, { daysAfter: '', timesPerDay: 1, channel: 'sms' }]);
  const removeOverdueRule = (idx) =>
    setOverdueRules((prev) => prev.filter((_, i) => i !== idx));

  const handleSaveOverdueRules = async () => {
    for (const [i, r] of overdueRules.entries()) {
      const da = Number(r.daysAfter);
      const tp = Number(r.timesPerDay);
      if (isNaN(da) || da < 1 || da > 180) { toast.error(`Overdue rule ${i + 1}: days after must be 1–180`); return; }
      if (!tp || tp < 1 || tp > 5)          { toast.error(`Overdue rule ${i + 1}: times per day must be 1–5`); return; }
    }
    const days = overdueRules.map((r) => Number(r.daysAfter));
    if (new Set(days).size !== days.length) { toast.error('Each overdue rule must have a unique "days after" value'); return; }
    setSavingOverdue(true);
    try {
      const payload = overdueRules.map((r) => ({
        daysAfter: Number(r.daysAfter),
        timesPerDay: Number(r.timesPerDay),
        channel: r.channel || 'sms',
      }));
      await api.patch('/admin/me/overdue-settings', { overdueRules: payload });
      toast.success('Overdue rules saved');
    } catch (err) {
      toast.error(err.message || 'Failed to save overdue rules');
    } finally {
      setSavingOverdue(false);
    }
  };

  const handleSaveRepeatRule = async () => {
    if (!repeatEnabled) {
      await api.patch('/admin/me/overdue-repeat-rule', { overdueRepeatRule: null });
      toast.success('Continuous reminders disabled');
      return;
    }
    const id = Number(overdueRepeatRule?.intervalDays);
    const tp = Number(overdueRepeatRule?.timesPerDay);
    if (!id || id < 1 || id > 30) { toast.error('Repeat interval must be 1–30 days'); return; }
    if (!tp || tp < 1 || tp > 5)  { toast.error('Times per day must be 1–5'); return; }
    setSavingRepeat(true);
    try {
      await api.patch('/admin/me/overdue-repeat-rule', {
        overdueRepeatRule: {
          intervalDays: id,
          timesPerDay: tp,
          channel: overdueRepeatRule?.channel || 'sms',
        },
      });
      toast.success('Continuous reminder rule saved');
    } catch (err) {
      toast.error(err.message || 'Failed to save repeat rule');
    } finally {
      setSavingRepeat(false);
    }
  };

  const handleSaveReminder = async () => {
    for (const [i, r] of reminderRules.entries()) {
      const db = Number(r.daysBefore);
      const tp = Number(r.timesPerDay);
      if (isNaN(db) || db < 0 || db > 60) { toast.error(`Rule ${i + 1}: days before must be 0–60`); return; }
      if (!tp || tp < 1 || tp > 5)        { toast.error(`Rule ${i + 1}: times per day must be 1–5`); return; }
    }
    const days = reminderRules.map((r) => Number(r.daysBefore));
    if (new Set(days).size !== days.length) { toast.error('Each rule must have a unique "days before" value'); return; }

    setSavingReminder(true);
    try {
      const payload = reminderRules.map((r) => ({
        daysBefore: Number(r.daysBefore),
        timesPerDay: Number(r.timesPerDay),
        channel: r.channel || 'sms'
      }));
      await api.patch('/admin/me/reminder-settings', { reminderRules: payload });
      toast.success('Reminder rules saved');
    } catch (err) {
      toast.error(err.message || 'Failed to save reminder rules');
    } finally {
      setSavingReminder(false);
    }
  };

  if (loading) return <PageLoader />;

  const activeCount = Object.values(providers).filter((p) => p.isActive).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Payment Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure your payment gateways</p>
      </div>

      {/* Validation hint */}
      {activeCount === 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          <AlertTriangle size={16} className="shrink-0 text-yellow-500" />
          At least one payment provider must be enabled before students can pay.
        </div>
      )}
      {activeCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
          <CheckCircle size={16} className="shrink-0 text-green-500" />
          {activeCount} provider{activeCount > 1 ? 's' : ''} active — students can choose at checkout.
        </div>
      )}

      <div className="space-y-4">
        <ProviderCard
          name="razorpay"
          label="Razorpay"
          description="Accept UPI, cards, net banking & wallets"
          provider={providers.razorpay}
          onChange={(v) => setProviders((p) => ({ ...p, razorpay: v }))}
          showSecrets={showSecrets}
          onToggleSecrets={() => setShowSecrets((s) => !s)}
        />
        <ProviderCard
          name="phonepe"
          label="PhonePe"
          description="Accept payments via PhonePe & UPI"
          provider={providers.phonepe}
          onChange={(v) => setProviders((p) => ({ ...p, phonepe: v }))}
          showSecrets={showSecrets}
          onToggleSecrets={() => setShowSecrets((s) => !s)}
        />
      </div>

      <Button loading={saving} onClick={handleSave} className="mt-2">
        <Save size={16} /> Save Settings
      </Button>

      {/* ── Reminder Rules ────────────────────────────────────── */}
      <div className="pt-6 border-t border-gray-100">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Bell size={16} className="text-brand-600" /> Automatic Reminder Rules
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Define when and how many times a reminder is sent each day before the fee is due.
          </p>
        </div>

        <Card>
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_1fr_1.5fr_auto] gap-3 mb-2 px-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Days before</span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Frequency</span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Broker (Channel)</span>
            <span className="w-8" />
          </div>

          <div className="space-y-3">
            {reminderRules.map((rule, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_1.5fr_auto] gap-3 items-center">
                {/* daysBefore */}
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={60}
                    placeholder="e.g. 3"
                    value={rule.daysBefore}
                    onChange={(e) => updateRule(idx, 'daysBefore', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-14 text-sm text-gray-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    days
                  </span>
                </div>

                {/* timesPerDay */}
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={rule.timesPerDay}
                    onChange={(e) => updateRule(idx, 'timesPerDay', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-14 text-sm text-gray-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    × / day
                  </span>
                </div>

                {/* Channel */}
                <Select
                  value={rule.channel || 'sms'}
                  onChange={(e) => updateRule(idx, 'channel', e.target.value)}
                  options={[
                    { label: 'SMS', value: 'sms' },
                    { label: 'WhatsApp', value: 'whatsapp' },
                    { label: 'Email', value: 'email' },
                    { label: 'Voice Call', value: 'call' },
                  ]}
                />

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeRule(idx)}
                  disabled={reminderRules.length === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Add rule */}
          <button
            type="button"
            onClick={addRule}
            disabled={reminderRules.length >= 10}
            className="mt-4 flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={15} /> Add another rule
          </button>

          {/* Live summary */}
          {reminderRules.length > 0 && (
            <div className="mt-5 px-4 py-3 bg-brand-50 border border-brand-100 rounded-xl space-y-1">
              {[...reminderRules]
                .filter((r) => r.daysBefore !== '')
                .sort((a, b) => Number(b.daysBefore) - Number(a.daysBefore))
                .map((r, i) => (
                  <p key={i} className="text-sm text-brand-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                    <span className="font-semibold">{r.daysBefore} day{Number(r.daysBefore) !== 1 ? 's' : ''}</span> before due —{' '}
                    send <span className="font-semibold">{r.timesPerDay}</span> <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 bg-brand-100 rounded border border-brand-200">{r.channel || 'sms'}</span> reminder{Number(r.timesPerDay) !== 1 ? 's' : ''}
                  </p>
                ))}
            </div>
          )}
        </Card>

        <Button loading={savingReminder} onClick={handleSaveReminder} className="mt-4">
          <Save size={16} /> Save Reminder Rules
        </Button>
      </div>

      {/* ── Overdue Rules (specific days) ─────────────────────────── */}
      <div className="pt-6 border-t border-gray-100">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Bell size={16} className="text-orange-500" /> Overdue Reminders (Specific Days)
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Send reminders on exact days after the due date (e.g. day 1, day 7, day 30).
          </p>
        </div>

        <Card>
          <div className="grid grid-cols-[1fr_1fr_1.5fr_auto] gap-3 mb-2 px-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Days after</span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Frequency</span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Channel</span>
            <span className="w-8" />
          </div>

          {overdueRules.length === 0 && (
            <p className="text-sm text-gray-400 px-1 mb-3">No rules yet — add one below.</p>
          )}

          <div className="space-y-3">
            {overdueRules.map((rule, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_1.5fr_auto] gap-3 items-center">
                <div className="relative">
                  <input
                    type="number" min={1} max={180} placeholder="e.g. 7"
                    value={rule.daysAfter}
                    onChange={(e) => updateOverdueRule(idx, 'daysAfter', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-14 text-sm text-gray-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">days</span>
                </div>
                <div className="relative">
                  <input
                    type="number" min={1} max={5}
                    value={rule.timesPerDay}
                    onChange={(e) => updateOverdueRule(idx, 'timesPerDay', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-14 text-sm text-gray-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">× / day</span>
                </div>
                <Select
                  value={rule.channel || 'sms'}
                  onChange={(e) => updateOverdueRule(idx, 'channel', e.target.value)}
                  options={[
                    { label: 'SMS', value: 'sms' },
                    { label: 'WhatsApp', value: 'whatsapp' },
                    { label: 'Email', value: 'email' },
                    { label: 'Voice Call', value: 'call' },
                  ]}
                />
                <button
                  type="button"
                  onClick={() => removeOverdueRule(idx)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addOverdueRule}
            disabled={overdueRules.length >= 10}
            className="mt-4 flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={15} /> Add another rule
          </button>

          {overdueRules.length > 0 && (
            <div className="mt-5 px-4 py-3 bg-orange-50 border border-orange-100 rounded-xl space-y-1">
              {[...overdueRules]
                .filter((r) => r.daysAfter !== '')
                .sort((a, b) => Number(a.daysAfter) - Number(b.daysAfter))
                .map((r, i) => (
                  <p key={i} className="text-sm text-orange-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    <span className="font-semibold">{r.daysAfter} day{Number(r.daysAfter) !== 1 ? 's' : ''}</span> after due —{' '}
                    send <span className="font-semibold">{r.timesPerDay}</span>{' '}
                    <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 bg-orange-100 rounded border border-orange-200">{r.channel || 'sms'}</span>{' '}
                    reminder{Number(r.timesPerDay) !== 1 ? 's' : ''}
                  </p>
                ))}
            </div>
          )}
        </Card>

        <Button loading={savingOverdue} onClick={handleSaveOverdueRules} className="mt-4" variant="secondary">
          <Save size={16} /> Save Overdue Rules
        </Button>
      </div>

      {/* ── Continuous Repeat Rule ────────────────────────────────── */}
      <div className="pt-6 border-t border-gray-100">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <RefreshCw size={16} className="text-red-500" /> Continuous Overdue Reminders
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Repeat reminders every N days until the fee is paid or you stop it per student.
          </p>
        </div>

        <Card>
          {/* Enable toggle */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-medium text-gray-800">Enable continuous reminders</p>
              <p className="text-xs text-gray-500 mt-0.5">Fires every N days for all overdue fees (unless stopped per fee)</p>
            </div>
            <button
              onClick={() => {
                setRepeatEnabled((v) => !v);
                if (!overdueRepeatRule) setOverdueRepeatRule({ intervalDays: 3, timesPerDay: 1, channel: 'sms' });
              }}
              className={classNames(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                'transition-colors duration-200 ease-in-out focus:outline-none',
                repeatEnabled ? 'bg-red-500' : 'bg-gray-200'
              )}
            >
              <span className={classNames(
                'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                repeatEnabled ? 'translate-x-5' : 'translate-x-0'
              )} />
            </button>
          </div>

          {repeatEnabled && (
            <div className="grid grid-cols-[1fr_1fr_1.5fr] gap-3 pt-4 border-t border-gray-100">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Repeat every</label>
                <input
                  type="number" min={1} max={30}
                  value={overdueRepeatRule?.intervalDays ?? ''}
                  onChange={(e) => setOverdueRepeatRule((r) => ({ ...r, intervalDays: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-14 text-sm text-gray-900 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition"
                />
                <span className="pointer-events-none absolute right-3 bottom-2.5 text-xs text-gray-400">days</span>
              </div>
              <div className="relative">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Times per day</label>
                <input
                  type="number" min={1} max={5}
                  value={overdueRepeatRule?.timesPerDay ?? ''}
                  onChange={(e) => setOverdueRepeatRule((r) => ({ ...r, timesPerDay: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-14 text-sm text-gray-900 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition"
                />
                <span className="pointer-events-none absolute right-3 bottom-2.5 text-xs text-gray-400">× / day</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Channel</label>
                <Select
                  value={overdueRepeatRule?.channel || 'sms'}
                  onChange={(e) => setOverdueRepeatRule((r) => ({ ...r, channel: e.target.value }))}
                  options={[
                    { label: 'SMS', value: 'sms' },
                    { label: 'WhatsApp', value: 'whatsapp' },
                    { label: 'Email', value: 'email' },
                    { label: 'Voice Call', value: 'call' },
                  ]}
                />
              </div>
            </div>
          )}

          {repeatEnabled && overdueRepeatRule?.intervalDays && (
            <div className="mt-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <RefreshCw size={13} className="shrink-0" />
                Every <strong>{overdueRepeatRule.intervalDays} day{Number(overdueRepeatRule.intervalDays) !== 1 ? 's' : ''}</strong> after due,
                send <strong>{overdueRepeatRule.timesPerDay}</strong>{' '}
                <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 bg-red-100 rounded border border-red-200">{overdueRepeatRule.channel || 'sms'}</span>{' '}
                reminder{Number(overdueRepeatRule.timesPerDay) !== 1 ? 's' : ''} — until paid or stopped.
              </p>
            </div>
          )}
        </Card>

        <Button loading={savingRepeat} onClick={handleSaveRepeatRule} className="mt-4" variant="secondary">
          <Save size={16} /> Save Continuous Rule
        </Button>
      </div>
    </div>
  );
}
