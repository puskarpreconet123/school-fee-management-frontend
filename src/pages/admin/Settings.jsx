import React, { useEffect, useState } from 'react';
import { Settings2, CheckCircle, AlertTriangle, Eye, EyeOff, Save, Bell, Plus, Trash2, RefreshCw, Pencil, X as XIcon, Mail, Send } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Loader';
import { authService } from '../../services/auth.service';
import { adminService } from '../../services/admin.service';
import api from '../../services/api';
import { toast } from '../../store/useToastStore';
import { classNames } from '../../utils/formatters';

const DEFAULT_PROVIDERS = {
  razorpay: { type: 'razorpay', isActive: false, config: { keyId: '', keySecret: '', webhookSecret: '' } },
  phonepe:  { type: 'phonepe',  isActive: false, config: { merchantId: '', saltKey: '', saltIndex: '1' } },
};

function mask(val) {
  if (!val) return '—';
  if (val.length <= 8) return '••••••••';
  return val.slice(0, 6) + '••••••••' + val.slice(-3);
}

function ProviderCard({ name, label, description, provider, onChange, showSecrets, onToggleSecrets }) {
  const active = provider?.isActive ?? false;
  const cfg = provider?.config ?? {};

  // True when credentials are already saved (any key field has a value)
  const isConfigured = name === 'razorpay'
    ? !!(cfg.keyId || cfg.keySecret)
    : !!(cfg.merchantId || cfg.saltKey);

  const [editing, setEditing] = useState(false);

  // Collapse the form once real config arrives from the API (initial state
  // can't know this because providers starts as DEFAULT_PROVIDERS with empty strings)
  useEffect(() => {
    if (isConfigured) setEditing(false);
  }, [isConfigured]);

  const updateCfg = (k, v) => onChange({ ...provider, config: { ...cfg, [k]: v } });
  const toggleActive = () => {
    onChange({ ...provider, isActive: !active });
    if (!active) setEditing(!isConfigured); // open fields when activating with no config
  };

  const fields = name === 'razorpay'
    ? [
        { key: 'keyId',         label: 'Key ID',         secret: false, placeholder: 'rzp_live_...' },
        { key: 'keySecret',     label: 'Key Secret',     secret: true,  placeholder: '••••••••' },
        { key: 'webhookSecret', label: 'Webhook Secret', secret: true,  placeholder: '••••••••' },
      ]
    : [
        { key: 'merchantId', label: 'Merchant ID', secret: false, placeholder: 'PGTESTPAYUAT...' },
        { key: 'saltKey',    label: 'Salt Key',    secret: true,  placeholder: '••••••••' },
        { key: 'saltIndex',  label: 'Salt Index',  secret: false, placeholder: '1', type: 'number', min: '1', max: '4' },
      ];

  return (
    <Card className={classNames('transition-all duration-200', active ? 'border-brand-200 bg-white' : 'bg-gray-50/60')}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={classNames(
            'w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0',
            active ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-400'
          )}>
            {name === 'razorpay' ? 'R' : 'P'}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{label}</h4>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Edit button — only when active and not already editing */}
          {active && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
          <Badge label={active ? 'ACTIVE' : 'INACTIVE'} variant={active ? 'ACTIVE' : 'INACTIVE'} />
          <button
            onClick={toggleActive}
            className={classNames(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
              'transition-colors duration-200 ease-in-out focus:outline-none',
              active ? 'bg-brand-600' : 'bg-gray-200'
            )}
          >
            <span className={classNames(
              'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              active ? 'translate-x-5' : 'translate-x-0'
            )} />
          </button>
        </div>
      </div>

      {/* Configured summary — active, not editing */}
      {active && !editing && isConfigured && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 gap-2">
          {fields.map((f) => (
            <div key={f.key} className="flex items-center justify-between text-sm">
              <span className="text-gray-500 text-xs font-medium w-32 shrink-0">{f.label}</span>
              <span className="font-mono text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1 flex-1 text-right">
                {f.secret ? mask(cfg[f.key]) : (cfg[f.key] || '—')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Edit form — active and editing */}
      {active && editing && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Credentials</p>
            {isConfigured && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XIcon size={12} /> Cancel
              </button>
            )}
          </div>

          {fields.map((f) => (
            f.secret ? (
              <div key={f.key} className="relative">
                <Input
                  label={f.label}
                  type={showSecrets ? 'text' : 'password'}
                  value={cfg[f.key] || ''}
                  onChange={(e) => updateCfg(f.key, e.target.value)}
                  placeholder={f.placeholder}
                />
                <button type="button" onClick={onToggleSecrets} className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                  {showSecrets ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            ) : (
              <Input
                key={f.key}
                label={f.label}
                type={f.type || 'text'}
                min={f.min}
                max={f.max}
                value={cfg[f.key] || ''}
                onChange={(e) => updateCfg(f.key, e.target.value)}
                placeholder={f.placeholder}
              />
            )
          ))}

          {isConfigured && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="mt-1 flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              <CheckCircle size={14} /> Done editing
            </button>
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

  const DEFAULT_EMAIL_CONFIG = { host: '', port: 587, secure: false, user: '', pass: '', from: '', useCustom: false };
  const [emailConfig, setEmailConfig] = useState(DEFAULT_EMAIL_CONFIG);
  const [savingEmail, setSavingEmail] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [showEmailPass, setShowEmailPass] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);

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
        if (res.data?.emailConfig) {
          setEmailConfig({ ...DEFAULT_EMAIL_CONFIG, ...res.data.emailConfig });
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

  const handleSaveEmailConfig = async () => {
    if (emailConfig.useCustom) {
      if (!emailConfig.host || !emailConfig.user || !emailConfig.pass) {
        toast.error('Host, username, and password are required for custom SMTP');
        return;
      }
    }
    setSavingEmail(true);
    try {
      await adminService.updateEmailConfig({ emailConfig });
      toast.success('Email settings saved');
    } catch (err) {
      toast.error(err.message || 'Failed to save email settings');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const res = await adminService.testEmailConfig();
      toast.success(res.message || 'Test email sent');
    } catch (err) {
      toast.error(err.message || 'Test email failed — check your SMTP settings');
    } finally {
      setTestingEmail(false);
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

      {/* ── Email Settings ────────────────────────────────────────── */}
      <div className="pt-6 border-t border-gray-100">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Mail size={16} className="text-brand-600" /> Email Settings
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Use your school's own SMTP to send emails, or leave off to use FeeSync's platform mail.
          </p>
        </div>

        <Card className={classNames('transition-all duration-200', emailConfig.useCustom ? 'border-brand-200 bg-white' : 'bg-gray-50/60')}>
          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={classNames(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                emailConfig.useCustom ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-400'
              )}>
                <Mail size={20} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Custom SMTP</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {emailConfig.useCustom
                    ? 'Emails send from your configured SMTP server.'
                    : "Emails send from FeeSync's platform mail."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {emailConfig.useCustom && !editingEmail && (
                <button
                  type="button"
                  onClick={() => setEditingEmail(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors"
                >
                  <Pencil size={12} /> Edit
                </button>
              )}
              <Badge label={emailConfig.useCustom ? 'ACTIVE' : 'INACTIVE'} variant={emailConfig.useCustom ? 'ACTIVE' : 'INACTIVE'} />
              <button
                onClick={() => {
                  const active = !emailConfig.useCustom;
                  const configured = !!(emailConfig.host || emailConfig.user);
                  setEmailConfig((c) => ({ ...c, useCustom: active }));
                  if (active && !configured) setEditingEmail(true);
                }}
                className={classNames(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                  'transition-colors duration-200 ease-in-out focus:outline-none',
                  emailConfig.useCustom ? 'bg-brand-600' : 'bg-gray-200'
                )}
              >
                <span className={classNames(
                  'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  emailConfig.useCustom ? 'translate-x-5' : 'translate-x-0'
                )} />
              </button>
            </div>
          </div>

          {/* Collapsed view */}
          {emailConfig.useCustom && !editingEmail && !!(emailConfig.host || emailConfig.user) && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 text-xs font-medium w-32 shrink-0">SMTP Host</span>
                <span className="font-mono text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1 flex-1 text-right">{emailConfig.host || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 text-xs font-medium w-32 shrink-0">Email / User</span>
                <span className="font-mono text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1 flex-1 text-right">{emailConfig.user || '—'}</span>
              </div>
            </div>
          )}

          {/* Form */}
          {emailConfig.useCustom && editingEmail && (
            <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Credentials</p>
                {!!(emailConfig.host || emailConfig.user) && (
                  <button
                    type="button"
                    onClick={() => setEditingEmail(false)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XIcon size={12} /> Cancel
                  </button>
                )}
              </div>

              <Input
                label="SMTP Host"
                placeholder="smtp.gmail.com"
                value={emailConfig.host}
                onChange={(e) => setEmailConfig((c) => ({ ...c, host: e.target.value }))}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Port"
                  type="number"
                  placeholder="587"
                  value={emailConfig.port}
                  onChange={(e) => setEmailConfig((c) => ({ ...c, port: Number(e.target.value) }))}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">Secure (TLS / port 465)</label>
                  <button
                    type="button"
                    onClick={() => setEmailConfig((c) => ({ ...c, secure: !c.secure }))}
                    className={classNames(
                      'mt-1 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                      'transition-colors duration-200 ease-in-out focus:outline-none',
                      emailConfig.secure ? 'bg-brand-600' : 'bg-gray-200'
                    )}
                  >
                    <span className={classNames(
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      emailConfig.secure ? 'translate-x-5' : 'translate-x-0'
                    )} />
                  </button>
                  <span className="text-xs text-gray-400">{emailConfig.secure ? 'On (port 465)' : 'Off (port 587)'}</span>
                </div>
              </div>

              <Input
                label="Username / Email"
                type="email"
                placeholder="you@yourdomain.com"
                value={emailConfig.user}
                onChange={(e) => setEmailConfig((c) => ({ ...c, user: e.target.value }))}
              />

              <div className="relative">
                <Input
                  label="Password / App Password"
                  type={showEmailPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={emailConfig.pass}
                  onChange={(e) => setEmailConfig((c) => ({ ...c, pass: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowEmailPass((s) => !s)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showEmailPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <Input
                label="From Address (optional)"
                placeholder="School Name <noreply@yourdomain.com>"
                value={emailConfig.from}
                onChange={(e) => setEmailConfig((c) => ({ ...c, from: e.target.value }))}
              />

              <p className="text-xs text-gray-400">
                For Gmail, enable 2-Step Verification and generate an App Password at myaccount.google.com/apppasswords.
              </p>

              {!!(emailConfig.host || emailConfig.user) && (
                <div className="flex items-center justify-between mt-4">
                  <button
                    type="button"
                    onClick={() => setEditingEmail(false)}
                    className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    <CheckCircle size={14} /> Done editing
                  </button>
                </div>
              )}
            </div>
          )}
        </Card>

        <div className="flex items-center gap-3 mt-4">
          <Button loading={savingEmail} onClick={handleSaveEmailConfig}>
            <Save size={16} /> Save Email Settings
          </Button>
          {emailConfig.useCustom && (
            <Button loading={testingEmail} onClick={handleTestEmail} variant="secondary">
              <Send size={16} /> Test Connection
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
