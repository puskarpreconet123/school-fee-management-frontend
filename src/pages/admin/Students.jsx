import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Upload, Search, Pencil, Trash2, Users, CheckCircle2, ArrowLeft, GraduationCap, Layers, ChevronRight, X, Phone, Mail, BookOpen, Hash, UserCircle, Users2, Calendar, Key, RefreshCw } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Loader';
import { studentService } from '../../services/student.service';
import { formatDate, getInitials } from '../../utils/formatters';
import { toast } from '../../store/useToastStore';

const EMPTY_FORM = { name: '', email: '', phone: '', class: '', section: '', rollNumber: '', parentName: '', parentPhone: '' };

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null); // { class: string, sections: string[] }
  const [selectedSection, setSelectedSection] = useState(null); // string
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [viewTarget, setViewTarget] = useState(null); // student detail panel

  const csvRef = useRef();
  const [uploading, setUploading] = useState(false);

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const res = await studentService.listClasses();
      setClasses(res.data);
    } catch (err) {
      toast.error('Failed to load class list');
    } finally {
      setLoadingClasses(false);
    }
  };

  const load = async (p = page, q = search, c = selectedClass, s = selectedSection) => {
    setLoading(true);
    try {
      const res = await studentService.list({
        page: p,
        limit: 15,
        search: q || undefined,
        class: c?.class || undefined,
        section: s || undefined,
      });
      setStudents(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClasses(); }, []);

  useEffect(() => {
    if (search) {
      load(1, search, null, null);
    } else if (selectedClass && selectedSection) {
      load(1, '', selectedClass, selectedSection);
    }
  }, [search, selectedClass, selectedSection]);

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (s) => {
    setEditTarget(s);
    setForm({
      name: s.name,
      email: s.email || '',
      phone: s.phone || '',
      class: s.class || '',
      section: s.section || '',
      rollNumber: s.rollNumber || '',
      parentName: s.parentName || '',
      parentPhone: s.parentPhone || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editTarget) {
        await studentService.update(editTarget._id, form);
        toast.success('Student updated');
      } else {
        const res = await studentService.create(form);
        if (res.data.tempPassword) {
          setSuccessData({ name: res.data.name, password: res.data.tempPassword });
        } else {
          toast.success('Student created');
        }
      }
      setModalOpen(false);
      fetchClasses(); // refresh class list in case new class/section added
      load(page, search);
    } catch (err) {
      toast.error(err.message || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await studentService.remove(deleteTarget._id);
      toast.success('Student removed');
      setDeleteTarget(null);
      load(page, search);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await studentService.uploadCsv(file);
      toast.success('CSV uploaded — students will be created shortly');
      setTimeout(() => { fetchClasses(); load(1, ''); }, 2000);
    } catch (err) {
      toast.error(err.message || 'CSV upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleBackfillIds = async () => {
    if (!window.confirm('This will generate student IDs for all students who are currently missing one. Continue?')) return;
    
    setLoading(true);
    try {
      const res = await studentService.backfillIds();
      toast.success(res.message || 'Student IDs generated');
      load(page, search);
    } catch (err) {
      toast.error(err.message || 'Failed to generate IDs');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (student) => {
    if (!window.confirm(`Reset password for ${student.name}?`)) return;

    try {
      const res = await studentService.resetPassword(student._id);
      setSuccessData({ name: res.data.name, password: res.data.tempPassword });
      setViewTarget(res.data); // update detail modal to show new temp password inline
      toast.success('Password reset successfully');
      load(page, search);
    } catch (err) {
      toast.error(err.message || 'Failed to reset password');
    }
  };

  const field = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">Directory</h1>
              <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 text-xs font-medium border border-brand-100">
                {meta.total ?? 0} Students
              </span>
            </div>
            <p className="text-sm text-gray-500">Manage students by class and section</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
            <Button variant="secondary" size="sm" onClick={handleBackfillIds}>
              <Users2 size={15} /> Generate IDs
            </Button>
            <Button variant="secondary" size="sm" loading={uploading} onClick={() => csvRef.current?.click()}>
              <Upload size={15} /> Upload CSV
            </Button>
            <Button size="sm" onClick={openAdd}>
              <Plus size={15} /> Add Student
            </Button>
          </div>
        </div>

        {/* Search + Breadcrumbs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search across all classes..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 h-11 border-gray-200 focus:border-brand-500 transition-all bg-white"
            />
          </div>

          {/* Breadcrumbs */}
          {!search && (
            <div className="flex items-center gap-2 text-sm overflow-x-auto whitespace-nowrap pb-2 sm:pb-0">
              <button
                onClick={() => { setSelectedClass(null); setSelectedSection(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${!selectedClass ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                Classes
              </button>
              {selectedClass && (
                <>
                  <ChevronRight size={14} className="text-gray-300" />
                  <button
                    onClick={() => setSelectedSection(null)}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${!selectedSection ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    Class {selectedClass.class}
                  </button>
                </>
              )}
              {selectedSection && (
                <>
                  <ChevronRight size={14} className="text-gray-300" />
                  <span className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 font-semibold">
                    Section {selectedSection}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {loadingClasses && !classes.length ? (
        <div className="flex justify-center py-20"><PageLoader /></div>

      ) : search ? (
        /* ── Search Mode ────────────────────────────────────────── */
        loading ? (
          <div className="flex justify-center py-20"><PageLoader /></div>
        ) : students.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No students matched"
            description="We couldn't find any students matching your search query."
            action={<Button variant="secondary" size="sm" onClick={() => setSearch('')}>Clear Search</Button>}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <StudentTable
              students={students}
              openEdit={openEdit}
              setDeleteTarget={setDeleteTarget}
              setViewTarget={setViewTarget}
              meta={meta}
              page={page}
              setPage={setPage}
              load={load}
              search={search}
              selectedClass={null}
              selectedSection={null}
            />
          </div>
        )

      ) : !selectedClass ? (
        /* ── Class Selection Mode ───────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {classes.length === 0 ? (
            <div className="col-span-full py-20">
              <EmptyState
                icon={GraduationCap}
                title="No classes yet"
                description="Add your first student to see classes appear here."
                action={<Button size="sm" onClick={openAdd}><Plus size={15} /> Add Student</Button>}
              />
            </div>
          ) : (
            classes.map((c) => (
              <button
                key={c.class}
                onClick={() => setSelectedClass(c)}
                className="group p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-200 hover:-translate-y-1 transition-all text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <GraduationCap size={80} />
                </div>
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  <GraduationCap size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Class {c.class}</h3>
                <p className="text-xs text-gray-500 mb-4">{c.sections.length} Section{c.sections.length !== 1 ? 's' : ''}</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.sections.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-gray-50 text-gray-400 text-[10px] font-bold uppercase group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                      Sec {s}
                    </span>
                  ))}
                </div>
              </button>
            ))
          )}
        </div>

      ) : !selectedSection ? (
        /* ── Section Selection Mode ─────────────────────────────── */
        <div className="space-y-6">
          <button
            onClick={() => setSelectedClass(null)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Classes
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {selectedClass.sections.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSection(s)}
                className="group p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-200 hover:-translate-y-1 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  <Layers size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Section {s}</h3>
                <p className="text-sm text-gray-500">View all students in this section</p>
              </button>
            ))}
          </div>
        </div>

      ) : (
        /* ── Student List Mode ──────────────────────────────────── */
        <div className="space-y-4">
          <button
            onClick={() => setSelectedSection(null)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Sections
          </button>

          {loading ? (
            <div className="flex justify-center py-20"><PageLoader /></div>
          ) : students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No students found"
              description={`No students are enrolled in Class ${selectedClass.class} – Section ${selectedSection}.`}
              action={<Button size="sm" onClick={openAdd}><Plus size={15} /> Add Student</Button>}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <StudentTable
                students={students}
                openEdit={openEdit}
                setDeleteTarget={setDeleteTarget}
                setViewTarget={setViewTarget}
                meta={meta}
                page={page}
                setPage={setPage}
                load={load}
                search={search}
                selectedClass={selectedClass}
                selectedSection={selectedSection}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Modal ──────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Student' : 'Add Student'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>{editTarget ? 'Save Changes' : 'Create Student'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Full Name" value={form.name} onChange={field('name')} required placeholder="e.g. Rahul Sharma" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" type="email" value={form.email} onChange={field('email')} placeholder="optional" />
            <Input label="Student Phone" type="tel" value={form.phone} onChange={field('phone')} placeholder="optional" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Class" value={form.class} onChange={field('class')} placeholder="e.g. 10" />
            <Input label="Section" value={form.section} onChange={field('section')} placeholder="e.g. A" />
            <Input label="Roll No." value={form.rollNumber} onChange={field('rollNumber')} placeholder="e.g. 42" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Parent Name" value={form.parentName} onChange={field('parentName')} placeholder="optional" />
            <Input label="Parent Phone" type="tel" value={form.parentPhone} onChange={field('parentPhone')} placeholder="optional" />
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ──────────────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Student"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>

      {/* ── Creation Success Modal (with Password) ────────────────── */}
      <Modal
        open={!!successData}
        onClose={() => setSuccessData(null)}
        title="Student Created Successfully"
        size="sm"
        footer={<Button onClick={() => setSuccessData(null)}>Got it</Button>}
      >
        <div className="space-y-4 text-center py-2">
          <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">A new account has been created for</p>
            <p className="text-lg font-bold text-gray-900">{successData?.name}</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Temporary Password</p>
            <p className="text-2xl font-mono font-bold text-brand-600 tracking-wider">
              {successData?.password}
            </p>
            <p className="text-[10px] text-gray-400 mt-2 italic">
              Please share this password with the student. They will be required to change it on their first login.
            </p>
          </div>
        </div>
      </Modal>

      {/* ── Student Detail Modal ──────────────────────────────────── */}
      <StudentDetailModal
        student={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={(s) => { setViewTarget(null); openEdit(s); }}
        onDelete={(s) => { setViewTarget(null); setDeleteTarget(s); }}
        onResetPassword={handleResetPassword}
      />
    </div>
  );
}

function StudentTable({ students, openEdit, setDeleteTarget, setViewTarget, meta, page, setPage, load, search, selectedClass, selectedSection }) {
  return (
    <>
      <Table>
        <Thead>
          <Th>Student</Th>
          <Th>Student ID</Th>
          <Th>Class</Th>
          <Th>Roll No.</Th>
          <Th>Contact</Th>
          <Th>Added</Th>
          <Th />
        </Thead>
        <Tbody>
          {students.map((s) => (
            <Tr
              key={s._id}
              onClick={() => setViewTarget(s)}
              className="cursor-pointer hover:bg-brand-50/40 transition-colors"
            >
              <Td>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-brand-700">{getInitials(s.name)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{s.name}</p>
                    {s.email && <p className="text-xs text-gray-400">{s.email}</p>}
                  </div>
                </div>
              </Td>
              <Td>
                <span className="font-mono text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded-md font-semibold tracking-wide">
                  {s.studentId || '—'}
                </span>
              </Td>
              <Td>{s.class ? `${s.class}${s.section ? ` – ${s.section}` : ''}` : '—'}</Td>
              <Td>{s.rollNumber || '—'}</Td>
              <Td>{s.phone || '—'}</Td>
              <Td className="text-gray-400">{formatDate(s.createdAt)}</Td>
              <Td>
                <div className="flex items-center gap-1 justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(s); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                    title="Edit student"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete student"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-100 bg-gray-50/50">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => { setPage((p) => p - 1); load(page - 1, search, selectedClass, selectedSection); }}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500 font-medium">Page {page} of {meta.pages}</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= meta.pages}
            onClick={() => { setPage((p) => p + 1); load(page + 1, search, selectedClass, selectedSection); }}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}
// ── Student Detail Modal ──────────────────────────────────────────────────────
function StudentDetailModal({ student: s, onClose, onEdit, onDelete, onResetPassword }) {
  if (!s) return null;

  const Field = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">{label}</p>
        <p className="text-sm text-gray-800 font-medium break-words">
          {value || <span className="text-gray-300 font-normal italic">Not provided</span>}
        </p>
      </div>
    </div>
  );

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Modal card */}
      <div
        className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 fade-in duration-300 sm:duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-700 px-6 pt-7 pb-6 shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center border border-white/10 shadow-inner">
              <span className="text-2xl font-bold text-white">{getInitials(s.name)}</span>
            </div>
            <div className="pt-1">
               <h2 className="text-2xl font-black text-white tracking-tight">{s.name}</h2>
               <div className="flex items-center gap-2 mt-1">
                 {s.studentId && (
                   <span className="font-mono text-[10px] font-bold text-brand-100 bg-white/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                     {s.studentId}
                   </span>
                 )}
               </div>
            </div>
          </div>
        </div>

        {/* ── Body (scrollable) ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 grid grid-cols-2 gap-x-8 gap-y-6 border-b border-gray-100/50">
            <Field icon={BookOpen} label="Class"    value={s.class ? `Class ${s.class}` : null} />
            <Field icon={Layers}   label="Section"  value={s.section ? `Section ${s.section}` : null} />
            <Field icon={Hash}     label="Roll No." value={s.rollNumber} />
            <Field icon={Calendar} label="Enrolled" value={formatDate(s.createdAt)} />
          </div>

          <div className="px-6 py-6 grid grid-cols-2 gap-x-8 gap-y-6 border-b border-gray-100/50">
            <p className="col-span-2 text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 -mb-2">Contact Details</p>
            <Field icon={Mail}  label="Email" value={s.email} />
            <Field icon={Phone} label="Phone" value={s.phone} />
          </div>

          <div className="px-6 py-6 grid grid-cols-2 gap-x-8 gap-y-6">
            <p className="col-span-2 text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 -mb-2">Guardian Profile</p>
            <Field icon={Users2} label="Parent Name"  value={s.parentName} />
            <Field icon={Phone}  label="Parent Phone" value={s.parentPhone} />
          </div>

          <div className="px-6 py-5 bg-brand-50/50 border-t border-brand-100">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-brand-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Key size={14} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-brand-600 font-bold mb-0.5">
                    {s.mustChangePassword ? 'Default Password' : 'Password'}
                  </p>
                  {s.mustChangePassword ? (
                    <>
                      <p className="text-lg font-mono font-bold text-gray-900 tracking-wider">
                        {s.tempPassword || '••••••••'}
                      </p>
                      <p className="text-[10px] text-brand-600/70 mt-1 italic">
                        Student hasn't changed their password yet.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Set by student</p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white border-brand-200 text-brand-700 hover:bg-brand-50 shrink-0"
                onClick={() => onResetPassword(s)}
              >
                <RefreshCw size={14} /> Reset
              </Button>
            </div>
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────── */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3 shrink-0">
          <Button variant="danger" className="flex-1 rounded-xl" onClick={() => onDelete(s)}>
            <Trash2 size={16} /> Delete
          </Button>
          <Button className="flex-1 rounded-xl" onClick={() => onEdit(s)}>
            <Pencil size={16} /> Edit Profile
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
