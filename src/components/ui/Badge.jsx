import React from 'react';
import { classNames } from '../../utils/formatters';

const styles = {
  PAID:     'bg-green-50 text-green-700 ring-green-200',
  SUCCESS:  'bg-green-50 text-green-700 ring-green-200',
  UNPAID:   'bg-yellow-50 text-yellow-700 ring-yellow-200',
  PENDING:  'bg-yellow-50 text-yellow-700 ring-yellow-200',
  OVERDUE:  'bg-red-50 text-red-700 ring-red-200',
  FAILED:   'bg-red-50 text-red-700 ring-red-200',
  ACTIVE:   'bg-blue-50 text-blue-700 ring-blue-200',
  INACTIVE: 'bg-gray-100 text-gray-600 ring-gray-200',
  razorpay: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  phonepe:  'bg-purple-50 text-purple-700 ring-purple-200',
};

export default function Badge({ children, label, variant, className = '' }) {
  const variants = {
    SUCCESS: 'bg-green-50 text-green-700 ring-green-600/20',
    PENDING: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
    FAILED: 'bg-red-50 text-red-700 ring-red-600/20',
    INFO: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    outline: 'bg-transparent text-slate-500 ring-slate-200',
    ...styles
  };

  const key = variant || label;
  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-md px-2 py-0.5',
        'text-xs font-bold ring-1 ring-inset transition-colors',
        variants[key] || 'bg-slate-100 text-slate-600 ring-slate-200',
        className
      )}
    >
      {children || label}
    </span>
  );
}
