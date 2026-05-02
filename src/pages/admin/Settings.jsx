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
    <div className={classNames('border rounded-xl p-5 transition-all duration-200', active ? 'border-brand-200 bg-white shadow-sm' : 'border-gray-100 bg-gray-50/60')}>
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
    </div>
  );
}

export default function SettingsPage() {
  const [providers, setProviders] = useState(DEFAULT_PROVIDERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

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
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader title="Payment Settings" subtitle="Configure your payment gateways" />

        {/* Validation hint */}
        {activeCount === 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800 mb-6">
            <AlertTriangle size={16} className="shrink-0 text-yellow-500" />
            At least one payment provider must be enabled before students can pay.
          </div>
        )}
        {activeCount > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 mb-6">
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

        <div className="mt-6 flex justify-end">
          <Button loading={saving} onClick={handleSave}>
            <Save size={16} /> Save Payment Settings
          </Button>
        </div>
      </Card>

      {/* ── Communication Mediums ────────────────────────────────────────── */}
      <Card>
        <CardHeader title="Communication Mediums" subtitle="Configure custom email and other communication channels" />

        <div className={classNames('border rounded-xl p-5 transition-all duration-200', emailConfig.useCustom ? 'border-brand-200 bg-white shadow-sm' : 'border-gray-100 bg-gray-50/60')}>
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
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {emailConfig.useCustom && (
            <Button loading={testingEmail} onClick={handleTestEmail} variant="secondary">
              <Send size={16} /> Test Connection
            </Button>
          )}
          <Button loading={savingEmail} onClick={handleSaveEmailConfig}>
            <Save size={16} /> Save Communication Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}
