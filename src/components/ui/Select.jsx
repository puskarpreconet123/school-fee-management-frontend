import React, { forwardRef } from 'react';
import { classNames } from '../../utils/formatters';

const Select = forwardRef(function Select(
  { label, error, options = [], placeholder, wrapperClass = '', className = '', ...props },
  ref
) {
  return (
    <div className={classNames('flex flex-col gap-1', wrapperClass)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={classNames(
          'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 bg-white',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          'transition-shadow duration-150 cursor-pointer',
          error
            ? 'border-red-400 bg-red-50'
            : 'border-gray-200 hover:border-gray-300',
          'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});

export default Select;
