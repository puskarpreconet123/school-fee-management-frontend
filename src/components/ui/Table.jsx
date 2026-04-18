import React from 'react';
import { classNames } from '../../utils/formatters';

export function Table({ children, className = '' }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 scrollbar-hide">
      <table className={classNames('w-full text-sm', className)}>
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }) {
  return (
    <thead className="bg-gray-50 border-b border-gray-100">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, className = '' }) {
  return (
    <th
      className={classNames(
        'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap',
        className
      )}
    >
      {children}
    </th>
  );
}

export function Tbody({ children }) {
  return <tbody className="divide-y divide-gray-50">{children}</tbody>;
}

export function Tr({ children, className = '', onClick }) {
  return (
    <tr
      className={classNames(
        'bg-white transition-colors',
        onClick && 'cursor-pointer hover:bg-gray-50',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className = '' }) {
  return (
    <td className={classNames('px-4 py-3.5 text-gray-700 align-middle', className)}>
      {children}
    </td>
  );
}
