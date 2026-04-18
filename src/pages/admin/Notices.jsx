import React, { useEffect, useState } from 'react';
import { Plus, Bell, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Loader';
import { noticeService } from '../../services/notice.service';
import { toast } from '../../store/useToastStore';
import { formatDate } from '../../utils/formatters';

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', targetClasses: '' });

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = () => {
    setLoading(true);
    noticeService.listAdmin()
      .then(res => setNotices(res.data || []))
      .catch(() => toast.error('Failed to load announcements'))
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return toast.error('Title and Content are required');
    
    try {
      // Convert comma separated classes into array
      const targetClasses = formData.targetClasses
        ? formData.targetClasses.split(',').map(c => c.trim()).filter(Boolean)
        : [];
        
      await noticeService.create({ ...formData, targetClasses });
      toast.success('Announcement broadcasted successfully');
      setFormData({ title: '', content: '', targetClasses: '' });
      setIsCreating(false);
      loadNotices();
    } catch(err) {
      toast.error('Failed to create announcement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await noticeService.remove(id);
      toast.success('Announcement deleted');
      loadNotices();
    } catch(err) {
      toast.error('Failed to delete announcement');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500 mt-0.5">Broadcast notices to students securely</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Cancel' : <><Plus size={16} /> New Announcement</>}
        </Button>
      </div>

      {isCreating && (
        <Card className="bg-gray-50 border-brand-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Holiday declaration..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none min-h-[100px]"
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                placeholder="Details of the announcement..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Classes (Optional)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                value={formData.targetClasses}
                onChange={e => setFormData({ ...formData, targetClasses: e.target.value })}
                placeholder="Leave empty for all classes, or comma separate e.g. 10A, 10B"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Broadcast Notice</Button>
            </div>
          </form>
        </Card>
      )}

      {notices.length === 0 ? (
        <Card>
          <EmptyState
            icon={Bell}
            title="No Announcements"
            description="You haven't broadcasted any notices yet."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {notices.map(notice => (
            <Card key={notice._id} className="relative group">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{notice.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">{formatDate(notice.createdAt)}</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{notice.content}</p>
                  
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-medium">
                      Audience: {notice.targetClasses?.length > 0 ? notice.targetClasses.join(', ') : 'All Classes'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(notice._id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete Notice"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
