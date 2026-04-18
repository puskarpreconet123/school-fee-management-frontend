import React from 'react';
import { classNames } from '../../utils/formatters';

export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div
      className={classNames(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 p-4 bg-gray-100 rounded-2xl">
          <Icon size={32} className="text-gray-400" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
