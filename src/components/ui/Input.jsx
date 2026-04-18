import React, { forwardRef } from 'react';
import { classNames } from '../../utils/formatters';

const Input = forwardRef(function Input(
  { label, error, helper, className = '', wrapperClass = '', ...props },
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
      <input
        ref={ref}
        className={classNames(
          'w-full rounded-lg border px-3 py-2 text-sm text-gray-900',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          'transition-shadow duration-150',
          error
            ? 'border-red-400 bg-red-50'
            : 'border-gray-200 bg-white hover:border-gray-300',
          'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-500">{helper}</p>}
    </div>
  );
});

export default Input;
