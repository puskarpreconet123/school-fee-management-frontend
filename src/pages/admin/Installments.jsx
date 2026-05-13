import React, { useEffect, useState } from 'react';
import { Receipt, Search, Filter, ChevronRight, User, BookOpen, AlertCircle, X, Pencil, Calendar, Info } from 'lucide-react';
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

export default function InstallmentsPage() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [page, setPage] = useState(1);

  // Detail Modal State
  const [detailStudent, setDetailStudent] = useState(null);
  const [detailFees, setDetailFees] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Edit Modal State
  const [editFee, setEditFee] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', amount: '', dueDate: '' });
  const [saving, setSaving] = useState(false);
  
  // Rebalance State
  const [rebalanceModal, setRebalanceModal] = useState(false);
  const [rebalanceCount, setRebalanceCount] = useState('1');
  const [rebalancing, setRebalancing] = useState(false);

  const fetchClasses = async () => {
    try {
      const res = await studentService.listClasses();
      setAvailableClasses(res.data || []);
    } catch (err) {
      console.error('Failed to load classes', err);
    }
  };

  const load = async (p = page, q = search, c = selectedClass) => {
    setLoading(true);
    try {
      const res = await feeService.installments({
        page: p,
        limit: 15,
        search: q || undefined,
        class: c || undefined
      });
      setData(res.data || []);
      setMeta(res.meta || {});
    } catch (err) {
      toast.error('Failed to load installment tracking');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentFees = async (student) => {
    setLoadingDetails(true);
    try {
      const res = await feeService.listForStudent(student._id);
      setDetailFees(res.data || []);
    } catch (err) {
      toast.error('Failed to load student installments');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => { fetchClasses(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => { load(1, search, selectedClass); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedClass]);

  useEffect(() => { load(page, search, selectedClass); }, [page]);

  const handleRowClick = (student) => {
    setDetailStudent(student);
    loadStudentFees(student);
  };

  const openEdit = (fee) => {
    setEditFee(fee);
    setEditForm({
      title: fee.title,
      amount: fee.amount,
      dueDate: fee.dueDate ? new Date(fee.dueDate).toISOString().split('T')[0] : ''
    });
  };

  const handleUpdateFee = async () => {
    if (!editForm.title || !editForm.amount || !editForm.dueDate) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      await feeService.update(editFee._id, {
        title: editForm.title,
        amount: Number(editForm.amount),
        dueDate: editForm.dueDate
      });
      toast.success('Installment updated');
      setEditFee(null);
      // Refresh details and main list
      loadStudentFees(detailStudent);
      load(page, search, selectedClass);
    } catch (err) {
      toast.error(err.message || 'Failed to update installment');
    } finally {
      setSaving(false);
    }
  };

  const handleRebalance = async () => {
    const count = Number(rebalanceCount);
    if (!count || count < 1) {
      toast.error('Please enter a valid number of installments');
      return;
    }
    setRebalancing(true);
    try {
      await feeService.rebalance(detailStudent._id, { count });
      toast.success('Installments redistributed successfully');
      setRebalanceModal(false);
      // Refresh
      loadStudentFees(detailStudent);
      load(page, search, selectedClass);
    } catch (err) {
      toast.error(err.message || 'Failed to rebalance installments');
    } finally {
      setRebalancing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Installments Tracking</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Monitor fee progress and manage schedules for every student</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-white shadow-xl shadow-gray-200/50">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search student or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-11 bg-white/80 border-gray-100 focus:bg-white transition-all rounded-2xl"
          />
        </div>
        <Select
          options={[
            { value: '', label: 'All Classes' },
            ...availableClasses.map(c => ({ value: c, label: `Class ${c}` }))
          ]}
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="h-11 bg-white/80 border-gray-100 rounded-2xl"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><PageLoader /></div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No records found"
          description={search || selectedClass ? "Try adjusting your filters" : "No students with fee records found."}
        />
      ) : (
        <>
          <Table>
            <Thead>
              <Th>Student</Th>
              <Th>Class</Th>
              <Th>Total Fees</Th>
              <Th>Paid</Th>
              <Th>Pending</Th>
              <Th>Status</Th>
              <Th>Progress</Th>
            </Thead>
            <Tbody>
              {data.map((item) => {
                const progress = item.totalAmount > 0 
                  ? Math.round((item.paidAmount / item.totalAmount) * 100) 
                  : 0;
                
                return (
                  <Tr 
                    key={item._id} 
                    onClick={() => handleRowClick(item)}
                  >
                    <Td className="font-medium text-gray-900">
                      <div>
                        <p>{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">{item.studentId || 'No ID'}</p>
                      </div>
                    </Td>
                    <Td>{item.class}{item.section ? ` - ${item.section}` : ''}</Td>
                    <Td className="font-bold text-gray-900">{formatCurrency(item.totalAmount)}</Td>
                    <Td className="text-emerald-600 font-bold">{formatCurrency(item.paidAmount)}</Td>
                    <Td className="text-orange-600 font-bold">{formatCurrency(item.pendingAmount)}</Td>
                    <Td>
                      {item.overdueCount > 0 ? (
                        <Badge label={`${item.overdueCount} Overdue`} variant="danger" />
                      ) : item.pendingAmount === 0 && item.totalAmount > 0 ? (
                        <Badge label="Fully Paid" variant="success" />
                      ) : (
                        <Badge label={`${item.paidCount}/${item.installmentCount} Paid`} variant="warning" />
                      )}
                    </Td>
                    <Td className="w-48">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          <span>{progress}%</span>
                          <span>{item.paidCount}/{item.installmentCount}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              progress === 100 ? 'bg-emerald-500' : 
                              progress > 50 ? 'bg-brand-500' : 
                              'bg-orange-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>

          <Pagination
            currentPage={meta.page || 1}
            totalPages={meta.pages || 1}
            onPageChange={(p) => setPage(p)}
            className="mt-6"
          />
        </>
      )}

      {/* ── Student Installments Detail Modal ──────────────────────── */}
      <Modal
        open={!!detailStudent}
        onClose={() => setDetailStudent(null)}
        title={detailStudent ? `${detailStudent.name}'s Installments` : ''}
        size="lg"
      >
        {loadingDetails ? (
          <div className="py-20 flex justify-center"><PageLoader /></div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-brand-50 border border-brand-100">
                <p className="text-[10px] uppercase font-black text-brand-600 tracking-wider mb-1">Total Fee</p>
                <p className="text-xl font-bold text-brand-900">{formatCurrency(detailStudent?.totalAmount)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <p className="text-[10px] uppercase font-black text-emerald-600 tracking-wider mb-1">Paid</p>
                <p className="text-xl font-bold text-emerald-900">{formatCurrency(detailStudent?.paidAmount)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
                <p className="text-[10px] uppercase font-black text-orange-600 tracking-wider mb-1">Pending</p>
                <p className="text-xl font-bold text-orange-900">{formatCurrency(detailStudent?.pendingAmount)}</p>
              </div>
            </div>

            {detailStudent?.pendingAmount > 0 && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-600 shadow-sm border border-gray-100">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Redistribute Remaining Balance</p>
                    <p className="text-xs text-gray-500">Divide {formatCurrency(detailStudent?.pendingAmount)} into new installments</p>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="rounded-xl border-gray-200"
                  onClick={() => {
                    const unpaid = detailFees.filter(f => f.status !== 'PAID').length;
                    setRebalanceCount(unpaid || '1');
                    setRebalanceModal(true);
                  }}
                >
                  Adjust Installments
                </Button>
              </div>
            )}

            <Table>
              <Thead>
                <Th>Installment Title</Th>
                <Th>Amount</Th>
                <Th>Due Date</Th>
                <Th>Status</Th>
                <Th />
              </Thead>
              <Tbody>
                {detailFees.map((fee) => (
                  <Tr key={fee._id}>
                    <Td className="font-medium text-gray-900">{fee.title}</Td>
                    <Td className="font-bold">{formatCurrency(fee.amount)}</Td>
                    <Td className="text-gray-500">{formatDate(fee.dueDate)}</Td>
                    <Td><Badge label={fee.status} /></Td>
                    <Td className="text-right">
                      {fee.status === 'PAID' ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                          Locked
                        </span>
                      ) : (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => openEdit(fee)}
                        >
                          <Pencil size={12} className="mr-1" /> Edit
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        )}
      </Modal>

      {/* ── Edit Installment Modal ────────────────────────────────── */}
      <Modal
        open={!!editFee}
        onClose={() => setEditFee(null)}
        title="Edit Installment"
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="secondary" className="flex-1 rounded-2xl" onClick={() => setEditFee(null)}>Cancel</Button>
            <Button loading={saving} className="flex-1 rounded-2xl" onClick={handleUpdateFee}>Save Changes</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input 
            label="Title" 
            value={editForm.title} 
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} 
            placeholder="e.g. Tuition Fee - May"
          />
          <Input 
            label="Amount (₹)" 
            type="number"
            value={editForm.amount} 
            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} 
            placeholder="5000"
          />
          <Input 
            label="Due Date" 
            type="date"
            value={editForm.dueDate} 
            onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} 
          />
        </div>
      </Modal>

      {/* ── Rebalance Installments Modal ────────────────────────── */}
      <Modal
        open={rebalanceModal}
        onClose={() => setRebalanceModal(false)}
        title="Adjust Installment Plan"
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="secondary" className="flex-1 rounded-2xl" onClick={() => setRebalanceModal(false)}>Cancel</Button>
            <Button loading={rebalancing} className="flex-1 rounded-2xl" onClick={handleRebalance}>Confirm & Redistribute</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
            <Info className="text-blue-600 shrink-0" size={20} />
            <div className="space-y-1">
              <p className="text-sm font-bold text-blue-900">How it works</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                The remaining balance of <strong>{formatCurrency(detailStudent?.pendingAmount)}</strong> will be divided equally into the number of installments you specify below.
              </p>
            </div>
          </div>

          <Input 
            label="New Number of Installments" 
            type="number"
            min="1"
            max="12"
            value={rebalanceCount} 
            onChange={(e) => setRebalanceCount(e.target.value)} 
            placeholder="e.g. 4"
          />
          
          {Number(rebalanceCount) > 0 && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-2 text-center">Preview Plan</p>
              <div className="flex justify-between items-center px-2">
                <span className="text-sm text-gray-600">{rebalanceCount} Payments of</span>
                <span className="text-lg font-black text-gray-900">{formatCurrency(Math.round((detailStudent?.pendingAmount / Number(rebalanceCount)) * 100) / 100)}</span>
              </div>
            </div>
          )}

          <p className="text-[10px] text-gray-400 text-center italic">
            Note: All current unpaid/overdue installments will be replaced.
          </p>
        </div>
      </Modal>
    </div>
  );
}
