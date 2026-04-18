import React from 'react';
import { classNames } from '../../utils/formatters';

export default function Card({ children, className = '', padding = true, hoverable = false, ...props }) {
  return (
    <div
      className={classNames(
        'rounded-2xl smooth-transition',
        !className.includes('bg-') && 'glass-card',
        padding && 'p-5 md:p-6',
        hoverable && 'hover:-translate-y-1 hover:shadow-xl hover:border-white/50 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={classNames('flex items-start justify-between mb-5', className)}>
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  );
}
