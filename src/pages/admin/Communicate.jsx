import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, MessageCircle, Phone, Send, Users, Mail, Bell, RefreshCw, Plus, Trash2, Save, CheckCircle, AlertTriangle, X as XIcon, Pencil, Info, Layout, ExternalLink, Eye } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table';
import { PageLoader } from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import { adminService } from '../../services/admin.service';
import { authService } from '../../services/auth.service';
import api from '../../services/api';
import { formatDate, classNames } from '../../utils/formatters';
import { toast } from '../../store/useToastStore';

const RuleChannelToggle = ({ selected = [], onChange }) => {
  const channels = [
    { id: 'sms', icon: <MessageSquare size={14} />, label: 'SMS' },
    { id: 'whatsapp', icon: <MessageCircle size={14} />, label: 'WP' },
    { id: 'email', icon: <Mail size={14} />, label: 'Email' },
    { id: 'call', icon: <Phone size={14} />, label: 'Voice' },
  ];

  return (
    <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-lg">
      {channels.map(ch => {
        const isActive = selected.includes(ch.id);
        return (
          <button
            key={ch.id}
            type="button"
            onClick={() => {
              const next = isActive 
                ? (selected.length > 1 ? selected.filter(x => x !== ch.id) : selected) 
                : [...selected, ch.id];
              onChange(next);
            }}
            className={classNames(
              'w-8 h-8 flex items-center justify-center rounded-md transition-all',
              isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'
            )}
            title={ch.label}
          >
            {ch.icon}
          </button>
        );
      })}
    </div>
  );
};

const TEXT_OPTIONS = [
  { value: 'sms', label: 'SMS', icon: MessageSquare, cost: 0.12 },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, cost: 0.12 },
  { value: 'email', label: 'Email', icon: Mail, cost: 0 },
];

const VOICE_OPTIONS = [
  { value: 'call', label: 'Voice Call', icon: Phone, cost: 0.12 },
];

const CREDIT_COST = 0.12;

export default function CommunicatePage() {
  // Credits & Ledger
  const [balances, setBalances] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [ledgerMeta, setLedgerMeta] = useState({});
  const [ledgerPage, setLedgerPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // General New Message State
  const [mainTab, setMainTab] = useState('text'); // 'text' | 'voice'
  const [msgType, setMsgType] = useState('normal'); // 'normal' | 'reminder' | 'whatsapp-templates'

  const [whatsappTemplates, setWhatsappTemplates] = useState([]);
  const [whatsappConfigured, setWhatsappConfigured] = useState(true); // Default to true to avoid flicker
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [syncingTemplates, setSyncingTemplates] = useState(false);
  const [textChannels, setTextChannels] = useState(['sms']);
  const [voiceChannel, setVoiceChannel] = useState(['call']);

  // Normal Msg State
  const [audience, setAudience] = useState('all'); // 'all' | 'class' | 'student'
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [totalStudents, setTotalStudents] = useState(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);

  // Reminder State
  const [reminderMessageTemplate, setReminderMessageTemplate] = useState('');
  const [reminderRules, setReminderRules] = useState([]);
  const [overdueRules, setOverdueRules] = useState([]);
  const [overdueRepeatRule, setOverdueRepeatRule] = useState(null);
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [savingReminder, setSavingReminder] = useState(false);
  const [savingOverdue, setSavingOverdue] = useState(false);
  const [savingRepeat, setSavingRepeat] = useState(false);

  const loadCredits = async (p = 1) => {
    try {
      const res = await adminService.getCredits({ page: p, limit: 10 });
      setBalances(res.data.balances || { sms: 0, whatsapp: 0, call: 0 });
      setLedger(res.data.entries || []);
      setLedgerMeta(res.data.meta || {});
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

  const loadClasses = async () => {
    try {
      const res = await api.get('/students/classes');
      setClassesList(res.data || []);
    } catch { /* silent */ }
  };

  const handleStudentSearch = async (q) => {
    setStudentSearch(q);
    if (q.length < 2) { setStudentSuggestions([]); return; }
    setIsSearchingStudents(true);
    try {
      const res = await api.get('/students', { params: { q, limit: 10 } });
      setStudentSuggestions(res.data || []);
    } catch { /* silent */ } finally {
      setIsSearchingStudents(false);
    }
  };

  const loadRules = async () => {
    try {
      const res = await authService.adminProfile();
      if (res.data) {
        const wc = res.data.whatsappConfig;
        const wd = res.data.whatsappDefaults || {};
        const isConfigured = (wc?.useCustom && wc.channelId && wc.apiKey && wc.accessToken && wc.wabaId) || 
                            (wd.channelId && wd.apiKey && wd.accessToken && wd.wabaId) ||
                            (wc?.channelId && wc.apiKey && wc.accessToken && wc.wabaId);
        setWhatsappConfigured(!!isConfigured);

        setReminderRules((res.data.reminderRules || []).map(r => ({ ...r, channels: r.channels || [r.channel || 'sms'] })));
        setOverdueRules((res.data.overdueRules || []).map(r => ({ ...r, channels: r.channels || [r.channel || 'sms'] })));
        if (res.data.overdueRepeatRule) {
          const rr = res.data.overdueRepeatRule;
          setOverdueRepeatRule({ ...rr, channels: rr.channels || [rr.channel || 'sms'] });
          setRepeatEnabled(true);
        }
        setReminderMessageTemplate(res.data.reminderMessageTemplate || 'Dear Parent, this is a reminder to pay the pending fee for your child.');
      }
    } catch {
      toast.error('Failed to load reminder rules');
    }
  };

  useEffect(() => {
    Promise.all([loadCredits(1), loadStudentCount(), loadRules(), loadClasses(), loadWhatsappTemplates()]).finally(() => setLoading(false));
  }, []);

  const loadWhatsappTemplates = async (silent = false) => {
    if (!silent) setLoadingTemplates(true);
    try {
      const res = await api.get('/admin/me/whatsapp-templates');
      // Axios interceptor already returns res.data (the body), so we just need .data from our standard wrapper
      setWhatsappTemplates(res.data || []);
    } catch (err) {
      console.error('Failed to load WhatsApp templates', err);
    } finally {
      if (!silent) setLoadingTemplates(false);
    }
  };
  
  const handleSyncTemplates = async () => {
    setSyncingTemplates(true);
    try {
      const res = await api.post('/admin/me/whatsapp-templates/sync');
      toast.success(res.message || 'Templates synced successfully');
      loadWhatsappTemplates(true);
    } catch (err) {
      toast.error(err.message || 'Failed to sync templates');
    } finally {
      setSyncingTemplates(false);
    }
  };

  const handleSaveTemplate = async (data) => {
    setSavingTemplate(true);
    try {
      if (editingTemplate) {
        await api.patch(`/admin/me/whatsapp-templates/${editingTemplate._id}`, data);
        toast.success('Template updated');
      } else {
        await api.post('/admin/me/whatsapp-templates', data);
        toast.success('Template created and synced with Meta');
      }
      setShowTemplateModal(false);
      loadWhatsappTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template from our system and Meta?')) return;
    try {
      await api.delete(`/admin/me/whatsapp-templates/${id}`);
      toast.success('Template deleted');
      loadWhatsappTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete template');
    }
  };

  // Compute total balance across all paid channels for the simple top banner
  const totalBalance = balances ? (balances.sms + balances.whatsapp + balances.call) : 0;

  // Normal Send Logic
  const handleSendNormal = async () => {
    if (!message.trim()) { toast.error('Please enter a message'); return; }
    
    const channels = mainTab === 'text' ? textChannels : voiceChannel;
    if (channels.length === 0) { toast.error('Please select at least one channel'); return; }

    const target = { type: audience };
    if (audience === 'class') {
      if (selectedClasses.length === 0) { toast.error('Please select at least one class'); return; }
      target.classes = selectedClasses;
    } else if (audience === 'student') {
      if (selectedStudents.length === 0) { toast.error('Please select at least one student'); return; }
      target.studentIds = selectedStudents.map(s => s._id);
    }

    setSending(true);
    try {
      await adminService.communicate({
        channels,
        message: message.trim(),
        target,
        scheduledAt: scheduledAt || null
      });
      toast.success(scheduledAt ? 'Message scheduled successfully' : 'Message sent successfully');
      setMessage('');
      setSelectedStudents([]);
      setSelectedClasses([]);
      setScheduledAt('');
      setShowScheduler(false);
      loadCredits(1);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Rule updaters
  const updateRule = (idx, field, value) => setReminderRules((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  const addRule = () => setReminderRules((prev) => [...prev, { daysBefore: '', timesPerDay: 1, channels: ['sms'] }]);
  const removeRule = (idx) => setReminderRules((prev) => prev.filter((_, i) => i !== idx));

  const updateOverdueRule = (idx, field, value) => setOverdueRules((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  const addOverdueRule = () => setOverdueRules((prev) => [...prev, { daysAfter: '', timesPerDay: 1, channels: ['sms'] }]);
  const removeOverdueRule = (idx) => setOverdueRules((prev) => prev.filter((_, i) => i !== idx));

  // Save Rules
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
        channels: r.channels || ['sms']
      }));
      await api.patch('/admin/me/reminder-settings', { 
        reminderRules: payload,
        reminderMessageTemplate 
      });
      toast.success('Pre-due Reminder rules and template saved');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save rules');
    } finally {
      setSavingReminder(false);
    }
  };

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
        channels: r.channels || ['sms'],
      }));
      await api.patch('/admin/me/overdue-settings', { 
        overdueRules: payload,
        reminderMessageTemplate
      });
      toast.success('Overdue rules and template saved');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save overdue rules');
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
          channels: overdueRepeatRule?.channels || ['sms'],
        },
        reminderMessageTemplate
      });
      toast.success('Continuous reminder rule and template saved');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save repeat rule');
    } finally {
      setSavingRepeat(false);
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
          <p className="text-[10px] text-indigo-600 uppercase tracking-wider font-bold">Total Credits</p>
          <p className="text-lg font-black text-indigo-900 leading-none">{totalBalance.toFixed(2)}</p>
        </div>
      </div>

      {/* Top Alert Banner - only if low credits */}
      {balances !== null && totalBalance < 50 && (
        <div className="bg-amber-100 text-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-8 py-3 rounded-xl mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600">warning</span>
            <span className="text-sm font-medium">Low Credit Warning: You have less than 50 total credits remaining.</span>
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
            <p className="text-2xl font-bold text-slate-900">{totalBalance.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="flex-1 bg-white border border-slate-200 p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4">
          <div className="hidden sm:flex w-10 h-10 rounded-lg bg-slate-100 items-center justify-center text-slate-600">
            <span className="material-symbols-outlined">outbound</span>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-medium">Transactions</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{ledgerMeta.total || '0'}</p>
          </div>
        </div>
        <div className="flex-1 bg-white border border-slate-200 p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4">
          <div className="hidden sm:flex w-10 h-10 rounded-lg bg-orange-50 items-center justify-center text-orange-600">
            <span className="material-symbols-outlined">group</span>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-medium">Active Students</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{totalStudents ?? '—'}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Center Main Panel (70%) */}
        <div className="w-full lg:w-[70%] space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            
            {/* Top Level Sub-Tabs */}
            <div className="p-4 sm:p-6 pb-0 border-b border-slate-100 bg-slate-50/50">
              <div className="flex bg-slate-200/50 p-1 rounded-xl w-full sm:w-full mb-6">
                <button onClick={() => setMainTab('text')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${mainTab === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Text Messages</button>
                <button onClick={() => setMainTab('voice')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${mainTab === 'voice' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Voice Calls</button>
              </div>

              {/* Channel Selection & Balances */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Select Channels</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(mainTab === 'text' ? TEXT_OPTIONS : VOICE_OPTIONS).map(opt => {
                    const activeArray = mainTab === 'text' ? textChannels : voiceChannel;
                    const isSelected = activeArray.includes(opt.value);
                    const toggle = () => {
                      if (mainTab === 'voice') return; // Call is the only voice option
                      setTextChannels(prev => 
                        prev.includes(opt.value) 
                          ? prev.filter(c => c !== opt.value) 
                          : [...prev, opt.value]
                      );
                    };
                    const balance = opt.value === 'email' ? 'Unlimited' : (balances?.[opt.value]?.toFixed(2) ?? '0.00');
                    return (
                      <div key={opt.value} onClick={toggle} className={`cursor-pointer border p-3 rounded-xl flex items-center justify-between transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-indigo-300 bg-white'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                            <opt.icon size={16} />
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{opt.label}</p>
                            <p className="text-[10px] text-slate-500">{opt.cost > 0 ? `${opt.cost} credits/msg` : 'Free'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Balance</p>
                          <p className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-600'}`}>{balance}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Message Type Toggle */}
              <div className="flex gap-6 border-b border-slate-200">
                <button onClick={() => setMsgType('normal')} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${msgType === 'normal' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                  <Send size={16} /> One-Time Message
                </button>
                <button onClick={() => setMsgType('reminder')} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${msgType === 'reminder' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                  <Bell size={16} /> Automated Reminders
                </button>
                <button onClick={() => setMsgType('whatsapp-templates')} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${msgType === 'whatsapp-templates' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                  <MessageCircle size={16} /> WhatsApp Templates
                </button>
              </div>

              {msgType === 'normal' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Recipients Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {[
                        { id: 'all', label: 'All Students', icon: <Users size={14} /> },
                        { id: 'class', label: 'By Class', icon: <Plus size={14} /> },
                        { id: 'student', label: 'Studentwise', icon: <Users size={14} /> },
                      ].map(type => (
                        <button
                          key={type.id}
                          onClick={() => setAudience(type.id)}
                          className={classNames(
                            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap',
                            audience === type.id 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          )}
                        >
                          {type.icon}
                          {type.label}
                        </button>
                      ))}
                    </div>

                    {audience === 'class' && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 animate-in zoom-in-95 duration-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Select Classes</p>
                        <div className="flex flex-wrap gap-2">
                          {classesList.map(c => (
                            <button
                              key={c.class}
                              onClick={() => setSelectedClasses(prev => prev.includes(c.class) ? prev.filter(x => x !== c.class) : [...prev, c.class])}
                              className={classNames(
                                'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
                                selectedClasses.includes(c.class)
                                  ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                  : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200'
                              )}
                            >
                              {c.class}
                            </button>
                          ))}
                          {classesList.length === 0 && <p className="text-xs text-slate-400">No classes found.</p>}
                        </div>
                      </div>
                    )}

                    {audience === 'student' && (
                      <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4 animate-in zoom-in-95 duration-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Search & Add Students</p>
                        
                        {/* Selected Students Chips */}
                        {selectedStudents.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {selectedStudents.map(s => (
                              <div key={s._id} className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg border border-indigo-200">
                                <span className="text-[11px] font-bold">{s.name}</span>
                                <button onClick={() => setSelectedStudents(prev => prev.filter(x => x._id !== s._id))} className="hover:text-indigo-900 transition-colors">
                                  <XIcon size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="relative">
                          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                            <Users size={16} />
                          </div>
                          <input 
                            type="text"
                            value={studentSearch}
                            onChange={(e) => handleStudentSearch(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            placeholder="Type student name or ID..."
                          />
                          {isSearchingStudents && <div className="absolute right-3 top-2.5"><RefreshCw size={14} className="animate-spin text-slate-400" /></div>}

                          {studentSuggestions.length > 0 && (
                            <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                              {studentSuggestions.map(s => (
                                <button
                                  key={s._id}
                                  onClick={() => {
                                    if (!selectedStudents.some(x => x._id === s._id)) {
                                      setSelectedStudents(prev => [...prev, s]);
                                    }
                                    setStudentSearch('');
                                    setStudentSuggestions([]);
                                  }}
                                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                                >
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">{s.name}</p>
                                    <p className="text-[10px] text-slate-500">{s.studentId} • Class {s.class || 'N/A'}</p>
                                  </div>
                                  <Plus size={14} className="text-indigo-600" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
                      className="w-full h-[180px] border border-slate-200 rounded-xl p-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none outline-none" 
                      placeholder="Type your message here... Use {student_name} or {amount_due} for variables."
                    />
                    <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-500 border border-slate-100">
                      {message.length} chars
                    </div>
                  </div>

                  {/* Action Row */}
                  <div className="pt-4 space-y-4">
                    {showScheduler && (
                      <div className="flex flex-col sm:flex-row items-end gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex-1 w-full">
                          <label className="block text-xs font-bold text-indigo-700 mb-1.5 uppercase tracking-wide">Select Delivery Date & Time</label>
                          <input 
                            type="datetime-local" 
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                            className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                          />
                        </div>
                        <button onClick={() => { setShowScheduler(false); setScheduledAt(''); }} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                          Cancel
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                      {!showScheduler ? (
                        <button 
                          onClick={() => setShowScheduler(true)}
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all border border-transparent flex items-center justify-center gap-2"
                        >
                          <RefreshCw size={14} /> Schedule for later
                        </button>
                      ) : (
                        <div />
                      )}
                      <Button 
                        onClick={handleSendNormal} 
                        loading={sending} 
                        className="w-full sm:w-auto justify-center !bg-indigo-600 hover:!bg-indigo-700 !text-white px-8 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
                      >
                        {scheduledAt ? 'Schedule Message' : 'Send Message'}
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {msgType === 'reminder' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Reminder Message Template */}
                  <div>
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-slate-900">Custom Reminder Message</h3>
                      <p className="text-sm text-slate-500 mt-1">This message will be used for all automated rules below.</p>
                    </div>
                    {/* Templates (Optional helper) */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-slate-700 mb-2 uppercase tracking-wider">Quick Templates</label>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setReminderMessageTemplate("Dear Parent, this is a reminder to pay the pending fee for your child.")} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left">Standard Reminder</button>
                        <button onClick={() => setReminderMessageTemplate("Gentle reminder: Fees are due soon. Please pay to avoid late fines.")} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left">Gentle Reminder</button>
                      </div>
                    </div>
                    <div className="relative">
                      <textarea 
                        id="reminder-template-area"
                        value={reminderMessageTemplate}
                        onChange={(e) => setReminderMessageTemplate(e.target.value)}
                        className="w-full h-[120px] border border-slate-200 rounded-xl p-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none outline-none" 
                        placeholder="Type the reminder message template here..."
                      />
                      <div className="mt-2 flex flex-wrap gap-x-2 gap-y-2">
                        {[
                          { key: '{student_name}', label: 'Student Name' },
                          { key: '{amount_due}', label: 'Amount Due' },
                          { key: '{school_name}', label: 'School Name' },
                          { key: '{due_date}', label: 'Due Date' },
                          { key: '{payment_link}', label: 'Payment Link' },
                          { key: '{urgency_line}', label: 'Urgency Hint' }
                        ].map(v => (
                          <button
                            key={v.key}
                            type="button"
                            onClick={() => {
                              const textarea = document.getElementById('reminder-template-area');
                              if (!textarea) {
                                setReminderMessageTemplate(prev => prev + ' ' + v.key);
                                return;
                              }
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              const text = reminderMessageTemplate;
                              const before = text.substring(0, start);
                              const after  = text.substring(end, text.length);
                              setReminderMessageTemplate(before + v.key + after);
                              // Refocus
                              setTimeout(() => {
                                textarea.focus();
                                textarea.setSelectionRange(start + v.key.length, start + v.key.length);
                              }, 0);
                            }}
                            className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer shadow-sm active:scale-95"
                            title={`Click to insert ${v.label}`}
                          >
                            <span className="text-[10px] font-mono font-bold text-indigo-600">{v.key}</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-indigo-400 font-medium">{v.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Pre-due Rules */}
                  <div>
                    <div className="mb-4 flex justify-between items-end">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Bell size={16} className="text-indigo-600" /> Pre-Due Rules
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Reminders sent before the fee is due.</p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div className="grid grid-cols-[0.8fr_0.8fr_auto_auto] gap-3 mb-2 px-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Days before</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Frequency</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Channel</span>
                        <span className="w-8" />
                      </div>
                      <div className="space-y-3">
                        {reminderRules.map((rule, idx) => (
                          <div key={idx} className="grid grid-cols-[0.8fr_0.8fr_auto_auto] gap-3 items-center">
                            <Input placeholder="Days" type="number" value={rule.daysBefore} onChange={(e) => updateRule(idx, 'daysBefore', e.target.value)} />
                            <Input placeholder="Times" type="number" value={rule.timesPerDay} onChange={(e) => updateRule(idx, 'timesPerDay', e.target.value)} />
                            <RuleChannelToggle selected={rule.channels} onChange={(val) => updateRule(idx, 'channels', val)} />
                            <button onClick={() => removeRule(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={addRule} className="mt-4 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-bold"><Plus size={15} /> Add Rule</button>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button loading={savingReminder} onClick={handleSaveReminder} className="!bg-indigo-600 !text-white hover:!bg-indigo-700 text-sm font-bold px-6 py-2 rounded-lg flex items-center gap-2"><Save size={16} /> Save Pre-Due Rules & Template</Button>
                    </div>
                  </div>

                  {/* Overdue Rules */}
                  <div>
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-orange-500" /> Overdue Rules
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">Reminders sent after the due date.</p>
                    </div>

                    <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4">
                      <div className="grid grid-cols-[0.8fr_0.8fr_auto_auto] gap-3 mb-2 px-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Days after</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Frequency</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Channel</span>
                        <span className="w-8" />
                      </div>
                      {overdueRules.length === 0 && <p className="text-sm text-slate-400 mb-3 px-1">No rules yet.</p>}
                      <div className="space-y-3">
                        {overdueRules.map((rule, idx) => (
                          <div key={idx} className="grid grid-cols-[0.8fr_0.8fr_auto_auto] gap-3 items-center">
                            <Input placeholder="Days" type="number" value={rule.daysAfter} onChange={(e) => updateOverdueRule(idx, 'daysAfter', e.target.value)} />
                            <Input placeholder="Times" type="number" value={rule.timesPerDay} onChange={(e) => updateOverdueRule(idx, 'timesPerDay', e.target.value)} />
                            <RuleChannelToggle selected={rule.channels} onChange={(val) => updateOverdueRule(idx, 'channels', val)} />
                            <button onClick={() => removeOverdueRule(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={addOverdueRule} className="mt-4 flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-bold"><Plus size={15} /> Add Rule</button>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button variant="secondary" loading={savingOverdue} onClick={handleSaveOverdueRules} className="text-sm font-bold px-6 py-2 rounded-lg flex items-center gap-2"><Save size={16} /> Save Overdue Rules & Template</Button>
                    </div>
                  </div>

                  {/* Continuous Repeat Rule */}
                  <div>
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <RefreshCw size={16} className="text-red-500" /> Continuous Overdue Reminders
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">Repeat reminders every N days until the fee is paid.</p>
                    </div>
                    <div className="bg-red-50/50 border border-red-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-slate-800">Enable continuous reminders</span>
                        <button onClick={() => { setRepeatEnabled(v => !v); if (!overdueRepeatRule) setOverdueRepeatRule({ intervalDays: 3, timesPerDay: 1, channels: ['sms'] }); }} className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${repeatEnabled ? 'bg-red-500' : 'bg-slate-200'}`}>
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${repeatEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                      {repeatEnabled && (
                        <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center">
                          <Input label="Interval (Days)" type="number" value={overdueRepeatRule?.intervalDays || ''} onChange={(e) => setOverdueRepeatRule(prev => ({ ...prev, intervalDays: e.target.value }))} />
                          <Input label="Times per day" type="number" value={overdueRepeatRule?.timesPerDay || ''} onChange={(e) => setOverdueRepeatRule(prev => ({ ...prev, timesPerDay: e.target.value }))} />
                          <div className="pt-6">
                            <RuleChannelToggle selected={overdueRepeatRule?.channels} onChange={(val) => setOverdueRepeatRule(prev => ({ ...prev, channels: val }))} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button variant="secondary" loading={savingRepeat} onClick={handleSaveRepeatRule} className="text-sm font-bold px-6 py-2 rounded-lg flex items-center gap-2"><Save size={16} /> Save Continuous Rule & Template</Button>
                    </div>
                  </div>

                </div>
              )}

              {msgType === 'whatsapp-templates' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {!whatsappConfigured ? (
                    <div className="py-12 text-center bg-amber-50 rounded-xl border border-amber-100 p-8">
                      <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-amber-900 mb-2">WhatsApp Setup Required</h3>
                      <p className="text-sm text-amber-700 max-w-md mx-auto mb-6">
                        To manage WhatsApp templates and sync with Meta, you need to configure your Brandmo.ai credentials including API Key and WABA ID.
                      </p>
                      <Button onClick={() => window.location.href='/admin/settings'} className="!bg-amber-600 hover:!bg-amber-700 !text-white font-bold px-8">
                        Go to Settings
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">WhatsApp Templates</h3>
                          <p className="text-sm text-slate-500">Create and manage your official business templates.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            loading={syncingTemplates} 
                            onClick={handleSyncTemplates}
                            className="flex items-center gap-2"
                          >
                            {!syncingTemplates && <RefreshCw size={14} />} Sync with Meta
                          </Button>
                          <Button onClick={() => { setEditingTemplate(null); setShowTemplateModal(true); }} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus size={16} /> Create New Template
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {whatsappTemplates.map((tpl) => (
                          <div key={tpl._id} className="border border-slate-100 rounded-xl p-4 hover:border-indigo-200 hover:shadow-md transition-all group bg-slate-50/30">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-bold text-slate-900 text-sm truncate max-w-[150px]">{tpl.name}</h3>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${
                                      tpl.status === 'APPROVED' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 
                                      (tpl.status === 'REJECTED' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-amber-500 animate-pulse')
                                    }`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                      tpl.status === 'APPROVED' ? 'text-green-600' : 
                                      (tpl.status === 'REJECTED' ? 'text-red-600' : 'text-amber-600')
                                    }`}>
                                      {tpl.status}
                                    </span>
                                  </div>
                                  <div className="h-3 w-[1px] bg-slate-200" />
                                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{tpl.category}</span>
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setViewingTemplate(tpl)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="View">
                                  <Eye size={14} />
                                </button>
                                <button onClick={() => { setEditingTemplate(tpl); setShowTemplateModal(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit">
                                  <Pencil size={14} />
                                </button>
                                <button onClick={() => handleDeleteTemplate(tpl._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!whatsappTemplates || whatsappTemplates.length === 0) && !loadingTemplates && (
                          <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
                            <MessageCircle size={32} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-sm text-slate-500 font-medium">No templates found.</p>
                            <p className="text-xs text-slate-400">Click the button above to create your first template.</p>
                          </div>
                        )}
                        {loadingTemplates && (
                          <div className="col-span-full py-12 text-center">
                            <RefreshCw size={24} className="mx-auto text-indigo-600 animate-spin" />
                            <p className="text-xs text-slate-500 mt-2">Loading templates from Meta...</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Right Panel (30%) */}
        <div className="w-full lg:w-[30%] space-y-6">
          {/* Credit Balances Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 font-bold">Total Credits</p>
                <h3 className="text-[32px] font-black text-slate-900 leading-none">{totalBalance.toFixed(2)}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
              </div>
            </div>

            <div className="space-y-3 mt-6 mb-6">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-blue-600" />
                  <span className="text-sm font-bold text-slate-700">SMS</span>
                </div>
                <span className="font-bold text-slate-900">{balances?.sms?.toFixed(2) ?? '0.00'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-green-600" />
                  <span className="text-sm font-bold text-slate-700">WhatsApp</span>
                </div>
                <span className="font-bold text-slate-900">{balances?.whatsapp?.toFixed(2) ?? '0.00'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-orange-600" />
                  <span className="text-sm font-bold text-slate-700">Call</span>
                </div>
                <span className="font-bold text-slate-900">{balances?.call?.toFixed(2) ?? '0.00'}</span>
              </div>
            </div>
            
            <button className="w-full border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all font-bold py-2.5 rounded-xl text-sm">
              Top Up Credits
            </button>
          </div>

          {/* Delivery Status */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <h4 className="text-base font-bold text-slate-900 mb-4">Delivery Status</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle size={16} />
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
                  <AlertTriangle size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Failed</span>
                </div>
                <span className="font-black text-red-700">0.5%</span>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900">Recent Activity</h4>
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
                            <div className={`p-1.5 rounded-lg ${entry.type === 'TOPUP' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                              <span className="material-symbols-outlined text-sm">{entry.type === 'TOPUP' ? 'add_circle' : 'chat'}</span>
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
                          <span className={`text-xs font-black ${entry.type === 'TOPUP' ? 'text-green-600' : 'text-slate-600'}`}>
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
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-50 bg-slate-50/50">
                <Button variant="secondary" size="sm" disabled={ledgerPage <= 1} onClick={() => loadCredits(ledgerPage - 1)}>Prev</Button>
                <span className="text-xs text-slate-500 font-bold">{ledgerPage} / {ledgerMeta.pages}</span>
                <Button variant="secondary" size="sm" disabled={ledgerPage >= ledgerMeta.pages} onClick={() => loadCredits(ledgerPage + 1)}>Next</Button>
              </div>
            )}
          </div>
        </div>
      </div>
      {showTemplateModal && (
        <TemplateModal 
          template={editingTemplate}
          onClose={() => setShowTemplateModal(false)}
          onSave={handleSaveTemplate}
          loading={savingTemplate}
        />
      )}

      {/* View Template Modal */}
      {viewingTemplate && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-100 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
              <h3 className="font-bold text-slate-900 truncate pr-4">{viewingTemplate.name}</h3>
              <button onClick={() => setViewingTemplate(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors shrink-0">
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex items-center justify-center">
              <div className="w-full">
                <WhatsAppPreview 
                  body={viewingTemplate.body} 
                  header={viewingTemplate.header} 
                  footer={viewingTemplate.footer} 
                />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const WhatsAppPreview = ({ body, header, footer }) => {
  const sampleData = {
    '{{1}}': 'Puskar Deb',
    '{{2}}': '₹1,500',
    '{{3}}': 'FeeSync High School',
    '{{4}}': '15th May 2024',
    '{{5}}': 'feesync.com/pay/abc',
  };

  const formatText = (text) => {
    if (!text) return '';
    let formatted = text;
    Object.entries(sampleData).forEach(([key, val]) => {
      formatted = formatted.split(key).join(val);
    });
    return formatted.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        <br />
      </span>
    ));
  };

  return (
    <div 
      className="bg-[#efeae2] p-4 rounded-xl w-[280px] mx-auto shadow-inner relative overflow-hidden"
      style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: '50%', backgroundBlendMode: 'overlay', opacity: 0.95 }}
    >
      <div className="bg-white rounded-lg rounded-tl-none p-2 px-2.5 shadow-sm relative z-10 ml-2 mt-1 min-h-[40px]">
        {/* WhatsApp Bubble Tail */}
        <svg viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -left-[8px] text-white">
          <path opacity="1" fill="currentColor" d="M1.533,3.568L8,12.193V1H2.812 C1.042,1,0.474,2.156,1.533,3.568z"></path>
        </svg>

        {header?.type === 'TEXT' && header.text && (
          <div className="font-bold text-[#111b21] mb-1 text-[13px] break-words">
            {formatText(header.text)}
          </div>
        )}
        <div className="text-[13px] text-[#111b21] leading-relaxed break-words">
          {formatText(body)}
        </div>
        {footer && (
          <div className="text-[11px] text-[#667781] mt-1 break-words">
            {footer}
          </div>
        )}
        <div className="text-[10px] text-[#8696a0] flex justify-end items-center gap-1 mt-1 font-medium">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
        </div>
      </div>
    </div>
  );
};

const TemplateModal = ({ template, onClose, onSave, loading }) => {
  const [data, setData] = useState({
    name: template?.name || '',
    category: template?.category || 'MARKETING',
    language: template?.language || 'en',
    header: template?.header || { type: 'TEXT', text: '' },
    body: template?.body || '',
    footer: template?.footer || '',
  });

  const variables = [
    { id: '{{1}}', label: 'Student Name' },
    { id: '{{2}}', label: 'Amount Due' },
    { id: '{{3}}', label: 'School Name' },
    { id: '{{4}}', label: 'Due Date' },
    { id: '{{5}}', label: 'Payment Link' },
  ];

  const insertVariable = (variableId) => {
    const area = document.getElementById('template-body-area');
    if (!area) {
      setData(prev => ({ ...prev, body: prev.body + variableId }));
      return;
    }
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const text = data.body;
    setData(prev => ({ 
      ...prev, 
      body: text.substring(0, start) + variableId + text.substring(end) 
    }));
    setTimeout(() => {
      area.focus();
      area.setSelectionRange(start + variableId.length, start + variableId.length);
    }, 0);
  };

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{template ? 'Edit Template' : 'Create WhatsApp Template'}</h2>
            <p className="text-sm text-slate-500">Templates must be approved by Meta before use.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <XIcon size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Template Name" 
                placeholder="e.g. fee_reminder_june" 
                value={data.name} 
                onChange={e => setData({...data, name: e.target.value.toLowerCase().replace(/\s/g, '_')})}
                disabled={!!template}
              />
              <Select 
                label="Category" 
                value={data.category} 
                onChange={e => setData({...data, category: e.target.value})}
                options={[
                  { value: 'MARKETING', label: 'Marketing' },
                  { value: 'UTILITY', label: 'Utility' },
                  { value: 'AUTHENTICATION', label: 'Authentication' }
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Header Text (Optional)</label>
              <Input 
                placeholder="Enter header text..." 
                value={data.header?.text || ''} 
                onChange={e => setData({...data, header: { ...data.header, type: 'TEXT', text: e.target.value }})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Body Message</label>
              <textarea 
                id="template-body-area"
                className="w-full h-32 p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                placeholder="Write your message here..."
                value={data.body}
                onChange={e => setData({...data, body: e.target.value})}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {variables.map(v => (
                  <button
                    key={v.id}
                    onClick={() => insertVariable(v.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors text-[10px] font-bold"
                  >
                    <span>{v.id}</span>
                    <span className="text-slate-400 font-medium">{v.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Input 
              label="Footer (Optional)" 
              placeholder="e.g. Reply STOP to opt out" 
              value={data.footer} 
              onChange={e => setData({...data, footer: e.target.value})}
            />
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 flex flex-col items-center justify-center border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Real-time Preview</p>
            <WhatsAppPreview body={data.body} header={data.header} footer={data.footer} />
            <div className="mt-8 space-y-3 w-full max-w-xs">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Info size={14} className="text-indigo-600" />
                <span>Variable <b>{1}</b> is replaced by <b>Student Name</b></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Info size={14} className="text-indigo-600" />
                <span>Templates usually take 24-48h for approval.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={loading} onClick={() => onSave(data)}>
            {template ? 'Update Template' : 'Create & Sync Template'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
