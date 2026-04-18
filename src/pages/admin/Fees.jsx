import React, { useEffect, useState } from 'react';
import { Plus, Receipt, BellOff, Bell } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Loader';
import { feeService } from '../../services/fee.service';
import { studentService } from '../../services/student.service';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { toast } from '../../store/useToastStore';
import Pagination from '../../components/ui/Pagination';

const STATUS_OPTS = [
  { value: '', label: 'All Statuses' },
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
];

const EMPTY_FORM = { 
  targetType: 'student', // 'student' or 'class'
  studentId: '', 
  className: '', 
  title: '', 
  amount: '', 
  type: 'one-time', // 'one-time' or 'periodic'
  dueDate: '', 
  endDate: '', 
  dueDay: '10',
  description: '' 
};

export default function FeesPage() {
  const [fees, setFees] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);

  // Fetch classes on modal open
  const fetchClasses = async () => {
    try {
      const res = await studentService.listClasses();
      setAvailableClasses(res.data || []);
    } catch (err) {
      toast.error('Failed to load class list');
    }
  };

  useEffect(() => {
    if (modalOpen) fetchClasses();
  }, [modalOpen]);

  // Load fees
  const load = async (p = page, s = status) => {
    setLoading(true);
    try {
      const res = await feeService.list({ 
        page: p, 
        limit: 10, 
        status: s || undefined 
      });
      
      setFees(res.data || []);
      setMeta(res.meta || {});
      
      // Load students only once for the create modal mapping
      if (students.length === 0) {
        const stuRes = await studentService.list({ page: 1, limit: 1000 });
        setStudents(stuRes.data || []);
      }
    } catch (err) {
      toast.error('Failed to load fees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page, status); }, [page, status]);

  const validate = () => {
    const e = {};
    if (form.targetType === 'student' && !form.studentId) e.studentId = 'Select a student';
    if (form.targetType === 'class' && !form.className) e.className = 'Select a class';
    
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.amount || Number(form.amount) < 1) e.amount = 'Valid amount required';
    
    if (form.type === 'one-time') {
      if (!form.dueDate) e.dueDate = 'Due date is required';
    } else {
      if (!form.endDate) e.endDate = 'End date is required';
      if (!form.dueDay) e.dueDay = 'Due day is required';
    }
    
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        amount: Number(form.amount),
        description: form.description || undefined,
        type: form.type,
      };

      if (form.targetType === 'student') payload.studentId = form.studentId;
      else payload.className = form.className;

      if (form.type === 'one-time') {
        payload.dueDate = form.dueDate;
      } else {
        payload.endDate = form.endDate;
        payload.dueDay = Number(form.dueDay);
      }

      await feeService.create(payload);
      toast.success(form.type === 'periodic' ? 'Periodic fees generated successfully' : 'Fee created successfully');
      setModalOpen(false);
      setForm(EMPTY_FORM);
      setPage(1);
      load(1, status);
    } catch (err) {
      toast.error(err.message || 'Failed to create fee');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleReminder = async (fee) => {
    const next = !fee.overdueReminderEnabled;
    try {
      await feeService.toggleOverdueReminder(fee._id, next);
      setFees((prev) => prev.map((f) => f._id === fee._id ? { ...f, overdueReminderEnabled: next } : f));
      toast.success(next ? 'Reminders resumed' : 'Reminders stopped');
    } catch {
      toast.error('Failed to update reminder setting');
    }
  };

  const field = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setFormErrors((err) => ({ ...err, [k]: undefined }));
  };

  const todayISO = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Fees</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meta.total ?? 0} fee records</p>
        </div>
        <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setFormErrors({}); setModalOpen(true); }}>
          <Plus size={15} /> Create Fee
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          options={STATUS_OPTS}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="w-40"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><PageLoader /></div>
      ) : fees.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No fees found"
          description="Create a fee to get started."
          action={<Button size="sm" onClick={() => setModalOpen(true)}><Plus size={15} /> Create Fee</Button>}
        />
      ) : (<>
        <Table>
          <Thead>
            <Th>Student</Th>
            <Th>Fee Title</Th>
            <Th>Amount</Th>
            <Th>Due Date</Th>
            <Th>Status</Th>
            <Th>Paid On</Th>
            <Th>Reminders</Th>
          </Thead>
          <Tbody>
            {fees.map((f) => (
              <Tr key={f._id}>
                <Td className="font-medium text-gray-900">{f.studentId?.name || '—'}</Td>
                <Td>{f.title}</Td>
                <Td className="font-semibold">{formatCurrency(f.amount)}</Td>
                <Td className={f.status === 'OVERDUE' ? 'text-red-600 font-medium' : ''}>{formatDate(f.dueDate)}</Td>
                <Td><Badge label={f.status} /></Td>
                <Td className="text-gray-400">{f.paidAt ? formatDate(f.paidAt) : '—'}</Td>
                <Td>
                  {f.status === 'OVERDUE' ? (
                    <button
                      onClick={() => handleToggleReminder(f)}
                      title={f.overdueReminderEnabled !== false ? 'Stop reminders' : 'Resume reminders'}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition ${
                        f.overdueReminderEnabled !== false
                          ? 'text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100'
                          : 'text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {f.overdueReminderEnabled !== false
                        ? <><Bell size={12} /> Active</>
                        : <><BellOff size={12} /> Stopped</>}
                    </button>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        
        <Pagination
          currentPage={meta.page || 1}
          totalPages={meta.pages || 1}
          onPageChange={(p) => setPage(p)}
          className="mt-6"
        />
      </>)}

      {/* Create Fee Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Fee"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleCreate}>Create Fee</Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Target Selection */}
          <div className="flex gap-2 p-1 bg-gray-50 rounded-lg">
            <button
              onClick={() => setForm(f => ({ ...f, targetType: 'student' }))}
              className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-all ${form.targetType === 'student' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Single Student
            </button>
            <button
              onClick={() => setForm(f => ({ ...f, targetType: 'class' }))}
              className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-all ${form.targetType === 'class' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Entire Class
            </button>
          </div>

          {form.targetType === 'student' ? (
            <Select
              label="Student"
              options={students.map((s) => ({ value: s._id, label: `${s.name}${s.class ? ` — Class ${s.class}` : ''}` }))}
              placeholder="Select a student"
              value={form.studentId}
              onChange={field('studentId')}
              error={formErrors.studentId}
              required
            />
          ) : (
            <Select
              label="Class"
              options={availableClasses.map(c => ({ value: c, label: `Class ${c}` }))}
              placeholder="Select a class"
              value={form.className}
              onChange={field('className')}
              error={formErrors.className}
              required
            />
          )}

          <hr className="border-gray-100" />

          {/* Fee Type Selection */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                className="text-brand-600 focus:ring-brand-500 h-4 w-4"
                checked={form.type === 'one-time'}
                onChange={() => setForm(f => ({ ...f, type: 'one-time' }))}
              />
              <span className="text-sm font-medium text-gray-700">One-time Fee</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                className="text-brand-600 focus:ring-brand-500 h-4 w-4"
                checked={form.type === 'periodic'}
                onChange={() => setForm(f => ({ ...f, type: 'periodic' }))}
              />
              <span className="text-sm font-medium text-gray-700">Periodic (Monthly)</span>
            </label>
          </div>

          <Input label="Fee Title" value={form.title} onChange={field('title')} error={formErrors.title} placeholder="e.g. Tuition Fee" required />
          
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount (₹)" type="number" min="1" value={form.amount} onChange={field('amount')} error={formErrors.amount} placeholder="5000" required />
            
            {form.type === 'one-time' ? (
              <Input label="Due Date" type="date" min={todayISO} value={form.dueDate} onChange={field('dueDate')} error={formErrors.dueDate} required />
            ) : (
              <Input label="Day of Month" type="number" min="1" max="28" value={form.dueDay} onChange={field('dueDay')} error={formErrors.dueDay} placeholder="e.g. 10" required />
            )}
          </div>

          {form.type === 'periodic' && (
            <Input label="End Date (Generates monthly until this date)" type="date" min={todayISO} value={form.endDate} onChange={field('endDate')} error={formErrors.endDate} required />
          )}

          <Input label="Description" value={form.description} onChange={field('description')} placeholder="Optional note" />
          
          {form.type === 'periodic' && (
            <div className="bg-brand-50 rounded-lg p-3 border border-brand-100">
              <p className="text-xs text-brand-700">
                <strong>Periodic Setting:</strong> This will create multiple fee records. Each record will have the month name appended to the title (e.g. "{form.title || 'Fee'} — May 2026").
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
