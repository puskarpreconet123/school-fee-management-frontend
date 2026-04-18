import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Loader';
import { noticeService } from '../../services/notice.service';
import { toast } from '../../store/useToastStore';
import { formatDate } from '../../utils/formatters';

export default function StudentNoticesPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    noticeService.listStudent()
      .then(res => setNotices(res.data || []))
      .catch(() => toast.error('Failed to load announcements'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-none mb-2">Announcements</h1>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-500 shadow-lg shadow-brand-200" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Latest School Updates</p>
        </div>
      </div>

      {notices.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-100 bg-transparent flex items-center justify-center min-h-[300px]">
          <EmptyState
            icon={Bell}
            title="All caught up!"
            description="There are no announcements for your class right now."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {notices.map((notice, idx) => (
            <Card 
              key={notice._id} 
              className="relative overflow-hidden group animate-slide-up border-none shadow-xl shadow-gray-200/50 bg-white/70 backdrop-blur-sm"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Decorative accent strip */}
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-brand-500 group-hover:w-2 smooth-transition shadow-lg shadow-brand-200/50" />
              
              <div className="pl-4 py-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight group-hover:text-brand-700 smooth-transition">{notice.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="p-1 bg-gray-50 rounded-md">
                        <Bell size={12} className="text-gray-400" />
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{formatDate(notice.createdAt)}</p>
                    </div>
                  </div>
                  <Badge label="Official" className="bg-brand-50 text-brand-700 border-brand-100 self-start sm:self-center font-black tracking-widest text-[9px] uppercase px-2.5 py-1" />
                </div>

                <div className="prose prose-sm max-w-none">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap p-6 bg-white/50 rounded-2xl border border-gray-100/50 leading-relaxed font-medium shadow-inner">
                    {notice.content}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
