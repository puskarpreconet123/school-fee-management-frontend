import React, { useEffect, useState } from 'react';
import { Settings2, CheckCircle, AlertTriangle, Eye, EyeOff, Save, Bell, Plus, Trash2, RefreshCw, Pencil, X as XIcon, Mail, Send, Copy, MessageCircle } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Loader';
import { authService } from '../../services/auth.service';
import { adminService } from '../../services/admin.service';
import api from '../../services/api';
import { toast } from '../../store/useToastStore';
import { classNames } from '../../utils/formatters';

const DEFAULT_PROVIDERS = {
  razorpay: { type: 'razorpay', isActive: false, config: { keyId: '', keySecret: '', webhookSecret: '' } },
  phonepe: { type: 'phonepe', isActive: false, config: { merchantId: '', saltKey: '', saltIndex: '1' } },
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
      { key: 'keyId', label: 'Key ID', secret: false, placeholder: 'rzp_live_...' },
      { key: 'keySecret', label: 'Key Secret', secret: true, placeholder: '••••••••' },
      { key: 'webhookSecret', label: 'Webhook Secret', secret: true, placeholder: '••••••••' },
    ]
    : [
      { key: 'merchantId', label: 'Merchant ID', secret: false, placeholder: 'PGTESTPAYUAT...' },
      { key: 'saltKey', label: 'Salt Key', secret: true, placeholder: '••••••••' },
      { key: 'saltIndex', label: 'Salt Index', secret: false, placeholder: '1', type: 'number', min: '1', max: '4' },
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
                  className="pr-20"
                />
                <div className="absolute right-2 top-8 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={onToggleSecrets}
                    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showSecrets ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(cfg[f.key] || '');
                      toast.success(`${f.label} copied`);
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                    title={`Copy ${f.label}`}
                  >
                    <Copy size={15} />
                  </button>
                </div>
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
  const [savingComm, setSavingComm] = useState(false);
  const [showEmailPass, setShowEmailPass] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);

  const DEFAULT_WHATSAPP_CONFIG = { apiUrl: '', channelId: '', apiKey: '', accessToken: '', wabaId: '', phoneNumberId: '', apiVersion: '', useCustom: false };
  const [whatsappConfig, setWhatsappConfig] = useState(DEFAULT_WHATSAPP_CONFIG);

  const [showWhatsappKey, setShowWhatsappKey] = useState(false);
  const [editingWhatsapp, setEditingWhatsapp] = useState(false);

  const DEFAULT_SMS_CONFIG = { apiUrl: '', username: '', password: '', senderId: '', useCustom: false };
  const [smsConfig, setSmsConfig] = useState(DEFAULT_SMS_CONFIG);
  const [showSmsPass, setShowSmsPass] = useState(false);
  const [editingSms, setEditingSms] = useState(false);
  const loadProfile = () => {
    setLoading(true);
    authService.adminProfile()
      .then((res) => {
        const raw = res.data?.paymentProviders || [];
        const map = { ...DEFAULT_PROVIDERS };
        raw.forEach((p) => { if (map[p.type]) map[p.type] = p; });
        setProviders(map);

        if (res.data?.emailConfig) {
          const cfg = res.data.emailConfig;
          const defaults = res.data.emailDefaults || {};
          setEmailConfig({
            ...DEFAULT_EMAIL_CONFIG,
            ...cfg,
            host: cfg.host || defaults.host || '',
            port: cfg.port || defaults.port || 587,
            secure: cfg.secure ?? defaults.secure ?? false,
            user: cfg.user || defaults.user || '',
            pass: cfg.pass || defaults.pass || '',
            from: cfg.from || defaults.from || '',
          });
        }
        if (res.data?.whatsappConfig) {
          const cfg = res.data.whatsappConfig;
          const defaults = res.data.whatsappDefaults || {};
          setWhatsappConfig({
            ...DEFAULT_WHATSAPP_CONFIG,
            ...cfg,
            apiUrl: cfg.apiUrl || defaults.apiUrl || '',
            channelId: cfg.channelId || defaults.channelId || '',
            apiKey: cfg.apiKey || defaults.apiKey || '',
            accessToken: cfg.accessToken || defaults.accessToken || '',
            wabaId: cfg.wabaId || defaults.wabaId || '',
            phoneNumberId: cfg.phoneNumberId || defaults.phoneNumberId || '',
            apiVersion: cfg.apiVersion || defaults.apiVersion || '',
          });
        }
        if (res.data?.smsConfig) {
          const cfg = res.data.smsConfig;
          const defaults = res.data.smsDefaults || {};
          setSmsConfig({
            ...DEFAULT_SMS_CONFIG,
            ...cfg,
            apiUrl: cfg.apiUrl || defaults.apiUrl || '',
            username: cfg.username || defaults.username || '',
            password: cfg.password || defaults.password || '',
            senderId: cfg.senderId || defaults.senderId || 'NOTICE',
          });
        }
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
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

  const handleSaveCommunicationConfig = async () => {
    if (emailConfig.useCustom) {
      if (!emailConfig.host || !emailConfig.user || !emailConfig.pass) {
        toast.error('Host, username, and password are required for custom SMTP');
        return;
      }
    }
    if (whatsappConfig.useCustom) {
      if (!whatsappConfig.apiUrl || !whatsappConfig.channelId || !whatsappConfig.apiKey || !whatsappConfig.accessToken || !whatsappConfig.phoneNumberId || !whatsappConfig.apiVersion) {
        toast.error('API URL, Channel ID, API Key, Access Token, Phone Number ID, and API Version are required for WhatsApp integration');
        return;
      }
    }

    setSavingComm(true);
    try {
      await Promise.all([
        adminService.updateEmailConfig({ emailConfig }),
        adminService.updateWhatsappConfig({ whatsappConfig }),
        adminService.updateSMSConfig({ smsConfig })
      ]);
      toast.success('Communication settings saved');
    } catch (err) {
      toast.error(err.message || 'Failed to save communication settings');
    } finally {
      setSavingComm(false);
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

        <div className="space-y-4">
          {/* Custom SMTP */}
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
                    className="pr-20"
                  />
                  <div className="absolute right-2 top-8 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowEmailPass((s) => !s)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                      title={showEmailPass ? "Hide Password" : "View Password"}
                    >
                      {showEmailPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(emailConfig.pass);
                        toast.success('SMTP Password copied');
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy Password"
                    >
                      <Copy size={15} />
                    </button>
                  </div>
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

          {/* WhatsApp Configuration */}
          <div className={classNames('border rounded-xl p-5 transition-all duration-200', whatsappConfig.useCustom ? 'border-brand-200 bg-white shadow-sm' : 'border-gray-100 bg-gray-50/60')}>
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={classNames(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  whatsappConfig.useCustom ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-400'
                )}>
                  <svg
                    width="25px"
                    height="25px"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3.50002 12C3.50002 7.30558 7.3056 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C10.3278 20.5 8.77127 20.0182 7.45798 19.1861C7.21357 19.0313 6.91408 18.9899 6.63684 19.0726L3.75769 19.9319L4.84173 17.3953C4.96986 17.0955 4.94379 16.7521 4.77187 16.4751C3.9657 15.176 3.50002 13.6439 3.50002 12ZM12 1.5C6.20103 1.5 1.50002 6.20101 1.50002 12C1.50002 13.8381 1.97316 15.5683 2.80465 17.0727L1.08047 21.107C0.928048 21.4637 0.99561 21.8763 1.25382 22.1657C1.51203 22.4552 1.91432 22.5692 2.28599 22.4582L6.78541 21.1155C8.32245 21.9965 10.1037 22.5 12 22.5C17.799 22.5 22.5 17.799 22.5 12C22.5 6.20101 17.799 1.5 12 1.5ZM14.2925 14.1824L12.9783 15.1081C12.3628 14.7575 11.6823 14.2681 10.9997 13.5855C10.2901 12.8759 9.76402 12.1433 9.37612 11.4713L10.2113 10.7624C10.5697 10.4582 10.6678 9.94533 10.447 9.53028L9.38284 7.53028C9.23954 7.26097 8.98116 7.0718 8.68115 7.01654C8.38113 6.96129 8.07231 7.046 7.84247 7.24659L7.52696 7.52195C6.76823 8.18414 6.3195 9.2723 6.69141 10.3741C7.07698 11.5163 7.89983 13.314 9.58552 14.9997C11.3991 16.8133 13.2413 17.5275 14.3186 17.8049C15.1866 18.0283 16.008 17.7288 16.5868 17.2572L17.1783 16.7752C17.4313 16.5691 17.5678 16.2524 17.544 15.9269C17.5201 15.6014 17.3389 15.308 17.0585 15.1409L15.3802 14.1409C15.0412 13.939 14.6152 13.9552 14.2925 14.1824Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Brandmo.ai Integration</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {whatsappConfig.useCustom
                      ? 'WhatsApp messages send from your Brandmo.ai account.'
                      : "WhatsApp messages are currently disabled or using platform defaults."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {whatsappConfig.useCustom && !editingWhatsapp && (
                  <button
                    type="button"
                    onClick={() => setEditingWhatsapp(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                )}
                <Badge label={whatsappConfig.useCustom ? 'ACTIVE' : 'INACTIVE'} variant={whatsappConfig.useCustom ? 'ACTIVE' : 'INACTIVE'} />
                <button
                  onClick={() => {
                    const active = !whatsappConfig.useCustom;
                    const configured = !!(whatsappConfig.apiUrl || whatsappConfig.channelId);
                    setWhatsappConfig((c) => ({ ...c, useCustom: active }));
                    if (active && !configured) setEditingWhatsapp(true);
                  }}
                  className={classNames(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                    'transition-colors duration-200 ease-in-out focus:outline-none',
                    whatsappConfig.useCustom ? 'bg-brand-600' : 'bg-gray-200'
                  )}
                >
                  <span className={classNames(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    whatsappConfig.useCustom ? 'translate-x-5' : 'translate-x-0'
                  )} />
                </button>
              </div>
            </div>

            {/* Collapsed view */}
            {whatsappConfig.useCustom && !editingWhatsapp && !!(whatsappConfig.apiUrl || whatsappConfig.channelId) && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 text-xs font-medium w-24 shrink-0">API URL</span>
                  <span className="font-mono text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1 flex-1 text-right truncate ml-4">{whatsappConfig.apiUrl || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 text-xs font-medium w-24 shrink-0">Channel ID</span>
                  <span className="font-mono text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1 flex-1 text-right truncate ml-4">{whatsappConfig.channelId || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 text-xs font-medium w-24 shrink-0">WABA ID</span>
                  <span className="font-mono text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1 flex-1 text-right truncate ml-4">{whatsappConfig.wabaId || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 text-xs font-medium w-24 shrink-0">Phone ID</span>
                  <span className="font-mono text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1 flex-1 text-right truncate ml-4">{whatsappConfig.phoneNumberId || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 text-xs font-medium w-24 shrink-0">Version</span>
                  <span className="font-mono text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1 flex-1 text-right truncate ml-4">{whatsappConfig.apiVersion || '—'}</span>
                </div>
              </div>
            )}

            {/* Form */}
            {whatsappConfig.useCustom && editingWhatsapp && (
              <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Brandmo.ai Credentials</p>
                  {!!(whatsappConfig.apiUrl || whatsappConfig.channelId) && (
                    <button
                      type="button"
                      onClick={() => setEditingWhatsapp(false)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XIcon size={12} /> Cancel
                    </button>
                  )}
                </div>

                <Input
                  label="API URL"
                  placeholder="https://api.brandmo.ai/crm/campaign"
                  value={whatsappConfig.apiUrl}
                  onChange={(e) => setWhatsappConfig((c) => ({ ...c, apiUrl: e.target.value }))}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Channel ID"
                    placeholder="Your Channel ID"
                    value={whatsappConfig.channelId}
                    onChange={(e) => setWhatsappConfig((c) => ({ ...c, channelId: e.target.value }))}
                  />
                  <Input
                    label="WABA ID"
                    placeholder="WhatsApp Business Account ID"
                    value={whatsappConfig.wabaId}
                    onChange={(e) => setWhatsappConfig((c) => ({ ...c, wabaId: e.target.value }))}
                  />
                  <Input
                    label="Phone Number ID"
                    placeholder="Meta Phone Number ID"
                    value={whatsappConfig.phoneNumberId}
                    onChange={(e) => setWhatsappConfig((c) => ({ ...c, phoneNumberId: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Input
                    label="API Version"
                    placeholder="v20.0"
                    value={whatsappConfig.apiVersion}
                    onChange={(e) => setWhatsappConfig((c) => ({ ...c, apiVersion: e.target.value }))}
                  />
                    <div className="relative">
                      <Input
                        label="API Key"
                        type={showWhatsappKey ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={whatsappConfig.apiKey}
                        onChange={(e) => setWhatsappConfig((c) => ({ ...c, apiKey: e.target.value }))}
                        className="pr-20"
                      />
                      <div className="absolute right-2 top-8 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowWhatsappKey((s) => !s)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                          title={showWhatsappKey ? "Hide Key" : "View Key"}
                        >
                          {showWhatsappKey ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(whatsappConfig.apiKey);
                            toast.success('API Key copied');
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy Key"
                        >
                          <Copy size={15} />
                        </button>
                      </div>
                    </div>
                  <div className="relative md:col-span-2">
                    <Input
                      label="Access Token"
                      type={showWhatsappKey ? 'text' : 'password'}
                      placeholder="Access Token (Bearer)"
                      value={whatsappConfig.accessToken}
                      onChange={(e) => setWhatsappConfig((c) => ({ ...c, accessToken: e.target.value }))}
                      className="pr-20"
                    />
                    <div className="absolute right-2 top-8 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowWhatsappKey((s) => !s)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                        title={showWhatsappKey ? "Hide Token" : "View Token"}
                      >
                        {showWhatsappKey ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(whatsappConfig.accessToken);
                          toast.success('Access Token copied');
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy Token"
                      >
                        <Copy size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {!!(whatsappConfig.apiUrl || whatsappConfig.channelId) && (
                  <div className="flex items-center justify-between mt-4">
                    <button
                      type="button"
                      onClick={() => setEditingWhatsapp(false)}
                      className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      <CheckCircle size={14} /> Done editing
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* SMS Configuration */}
          <div className={classNames('border rounded-xl p-5 transition-all duration-200', smsConfig.useCustom ? 'border-brand-200 bg-white shadow-sm' : 'border-gray-100 bg-gray-50/60')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={classNames(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  smsConfig.useCustom ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-400'
                )}>
                  <MessageCircle size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">SMS Gateway</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {smsConfig.useCustom
                      ? 'SMS messages send from your configured gateway.'
                      : "SMS messages are currently disabled or using platform defaults."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {smsConfig.useCustom && !editingSms && (
                  <button
                    type="button"
                    onClick={() => setEditingSms(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                )}
                <Badge label={smsConfig.useCustom ? 'ACTIVE' : 'INACTIVE'} variant={smsConfig.useCustom ? 'ACTIVE' : 'INACTIVE'} />
                <button
                  onClick={() => {
                    const active = !smsConfig.useCustom;
                    const configured = !!(smsConfig.apiUrl || smsConfig.username);
                    setSmsConfig((c) => ({ ...c, useCustom: active }));
                    if (active && !configured) setEditingSms(true);
                  }}
                  className={classNames(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                    'transition-colors duration-200 ease-in-out focus:outline-none',
                    smsConfig.useCustom ? 'bg-brand-600' : 'bg-gray-200'
                  )}
                >
                  <span className={classNames(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    smsConfig.useCustom ? 'translate-x-5' : 'translate-x-0'
                  )} />
                </button>
              </div>
            </div>

            {/* Collapsed view */}
            {smsConfig.useCustom && !editingSms && !!(smsConfig.apiUrl || smsConfig.username) && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 text-xs font-medium w-24 shrink-0">API URL</span>
                  <span className="font-mono text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1 flex-1 text-right truncate ml-4">{smsConfig.apiUrl || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 text-xs font-medium w-24 shrink-0">Username</span>
                  <span className="font-mono text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1 flex-1 text-right truncate ml-4">{smsConfig.username || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 text-xs font-medium w-24 shrink-0">Sender ID</span>
                  <span className="font-mono text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1 flex-1 text-right truncate ml-4">{smsConfig.senderId || '—'}</span>
                </div>
              </div>
            )}

            {/* Form */}
            {smsConfig.useCustom && editingSms && (
              <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SMS Gateway Credentials</p>
                  {!!(smsConfig.apiUrl || smsConfig.username) && (
                    <button
                      type="button"
                      onClick={() => setEditingSms(false)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XIcon size={12} /> Cancel
                    </button>
                  )}
                </div>

                <Input
                  label="API URL"
                  placeholder="https://sms.provider.com"
                  value={smsConfig.apiUrl}
                  onChange={(e) => setSmsConfig((c) => ({ ...c, apiUrl: e.target.value }))}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Username"
                    placeholder="Gateway Username"
                    value={smsConfig.username}
                    onChange={(e) => setSmsConfig((c) => ({ ...c, username: e.target.value }))}
                  />
                  <div className="relative">
                    <Input
                      label="Password"
                      type={showSmsPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={smsConfig.password}
                      onChange={(e) => setSmsConfig((c) => ({ ...c, password: e.target.value }))}
                      className="pr-20"
                    />
                    <div className="absolute right-2 top-8 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowSmsPass((s) => !s)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showSmsPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <Input
                    label="Sender ID"
                    placeholder="6 characters (e.g. NOTICE)"
                    maxLength={6}
                    value={smsConfig.senderId}
                    onChange={(e) => setSmsConfig((c) => ({ ...c, senderId: e.target.value }))}
                  />
                </div>

                {!!(smsConfig.apiUrl || smsConfig.username) && (
                  <div className="flex items-center justify-between mt-4">
                    <button
                      type="button"
                      onClick={() => setEditingSms(false)}
                      className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      <CheckCircle size={14} /> Done editing
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button loading={savingComm} onClick={handleSaveCommunicationConfig}>
            <Save size={16} /> Save Communication Settings
          </Button>
        </div>
      </Card>

    </div>
  );
}
