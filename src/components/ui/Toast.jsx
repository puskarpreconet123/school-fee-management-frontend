import React from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import useToastStore from '../../store/useToastStore';
import { classNames } from '../../utils/formatters';

const icons = {
  success: <CheckCircle size={18} className="text-green-500 shrink-0" />,
  error:   <XCircle size={18} className="text-red-500 shrink-0" />,
  info:    <Info size={18} className="text-blue-500 shrink-0" />,
};

const styles = {
  success: 'border-green-100 bg-white',
  error:   'border-red-100 bg-white',
  info:    'border-blue-100 bg-white',
};

function ToastItem({ toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  return (
    <div
      className={classNames(
        'flex items-start gap-3 w-full px-4 py-3.5 rounded-xl border shadow-dropdown',
        'animate-[slideIn_0.2s_ease-out]',
        styles[toast.type]
      )}
    >
      {icons[toast.type]}
      <p className="text-sm text-gray-800 flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="fixed top-5 right-5 z-[10000] flex flex-col gap-2.5 w-80 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}
