import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Building2, PowerOff, Power, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Loader';
import { superadminService } from '../../services/superadmin.service';
import { formatDate, getInitials } from '../../utils/formatters';
import { toast } from '../../store/useToastStore';

const EMPTY_FORM = { name: '', email: '', password: '', phone: '', address: '' };

export default function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' | 'true' | 'false'
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggling, setToggling] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (p = page, q = search, status = statusFilter) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (q) params.search = q;
      if (status !== '') params.isActive = status;
      const res = await superadminService.listSchools(params);
      setSchools(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load schools');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1, search, statusFilter); }, [search, statusFilter]);

  // ── Create ──────────────────────────────────────────────────────────────────
  const validateForm = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'School name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await superadminService.createSchool(form);
      toast.success('School created successfully');
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      load(1, search, statusFilter);
    } catch (err) {
      toast.error(err.message || 'Failed to create school');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle status ────────────────────────────────────────────────────────────
  const handleToggle = async () => {
    setToggling(true);
    try {
      await superadminService.toggleSchoolStatus(toggleTarget._id);
      toast.success(`School ${toggleTarget.isActive ? 'deactivated' : 'activated'}`);
      setToggleTarget(null);
      load(page, search, statusFilter);
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setToggling(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await superadminService.deleteSchool(deleteTarget._id);
      toast.success('School deleted');
      setDeleteTarget(null);
      load(1, search, statusFilter);
    } catch (err) {
      toast.error(err.message || 'Failed to delete school');
    } finally {
      setDeleting(false);
    }
  };

  const field = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Schools</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meta.total ?? 0} schools on the platform</p>
        </div>
        <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setFormErrors({}); setCreateOpen(true); }}>
          <Plus size={15} /> Add School
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="max-w-sm w-full">
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { label: 'All', value: '' },
            { label: 'Active', value: 'true' },
            { label: 'Inactive', value: 'false' },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => { setStatusFilter(value); setPage(1); }}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                statusFilter === value
                  ? 'bg-violet-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-700',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><PageLoader /></div>
      ) : schools.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No schools found"
          description={search ? 'Try a different search term' : 'Add your first school to get started.'}
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus size={15} /> Add School
            </Button>
          }
        />
      ) : (
        <>
          <Table>
            <Thead>
              <Th>School</Th>
              <Th>Contact</Th>
              <Th>Providers</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th />
            </Thead>
            <Tbody>
              {schools.map((s) => (
                <Tr key={s._id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-violet-700">{getInitials(s.name)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{s.name}</p>
                        <div className="flex flex-col">
                          <p className="text-xs text-gray-400">{s.email}</p>
                          <p className="text-[10px] font-mono text-violet-600 bg-violet-50 px-1 rounded w-fit mt-0.5">{s.schoolId}</p>
                        </div>
                      </div>
                    </div>
                  </Td>
                  <Td>{s.phone || '—'}</Td>
                  <Td>
                    {s.paymentProviders?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {s.paymentProviders.filter((p) => p.isActive).map((p) => (
                          <Badge key={p.type} label={p.type} variant={p.type} />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </Td>
                  <Td>
                    <Badge
                      label={s.isActive ? 'Active' : 'Inactive'}
                      variant={s.isActive ? 'ACTIVE' : 'INACTIVE'}
                    />
                  </Td>
                  <Td className="text-gray-400">{formatDate(s.createdAt)}</Td>
                  <Td>
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        title={s.isActive ? 'Deactivate' : 'Activate'}
                        onClick={() => setToggleTarget(s)}
                        className={[
                          'p-1.5 rounded-lg transition-colors',
                          s.isActive
                            ? 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50',
                        ].join(' ')}
                      >
                        {s.isActive ? <PowerOff size={15} /> : <Power size={15} />}
                      </button>
                      <button
                        title="Delete"
                        onClick={() => setDeleteTarget(s)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary" size="sm"
                disabled={page <= 1}
                onClick={() => { const p = page - 1; setPage(p); load(p, search, statusFilter); }}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500">Page {page} of {meta.pages}</span>
              <Button
                variant="secondary" size="sm"
                disabled={page >= meta.pages}
                onClick={() => { const p = page + 1; setPage(p); load(p, search, statusFilter); }}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create School Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add School"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleCreate}>Create School</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="School Name"
            value={form.name}
            onChange={field('name')}
            placeholder="e.g. Springfield High School"
            error={formErrors.name}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={field('email')}
              placeholder="admin@school.edu"
              error={formErrors.email}
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={field('password')}
              placeholder="Min. 8 characters"
              error={formErrors.password}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={field('phone')}
              placeholder="optional"
            />
            <Input
              label="Address"
              value={form.address}
              onChange={field('address')}
              placeholder="optional"
            />
          </div>
          <p className="text-xs text-gray-400">
            Payment providers can be configured by the school after login.
          </p>
        </div>
      </Modal>

      {/* Toggle Status Confirm */}
      <Modal
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        title={toggleTarget?.isActive ? 'Deactivate School' : 'Activate School'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToggleTarget(null)}>Cancel</Button>
            <Button
              variant={toggleTarget?.isActive ? 'danger' : 'primary'}
              loading={toggling}
              onClick={handleToggle}
            >
              {toggleTarget?.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          {toggleTarget?.isActive
            ? <>Deactivating <strong>{toggleTarget?.name}</strong> will prevent them from logging in.</>
            : <>Activating <strong>{toggleTarget?.name}</strong> will restore their access.</>}
        </p>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete School"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to permanently delete <strong>{deleteTarget?.name}</strong>?
          This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
