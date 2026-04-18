import React from 'react';
import { classNames } from '../../utils/formatters';

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
};

const colorMap = {
  blue:  'border-brand-600',
  white: 'border-white',
  gray:  'border-gray-500',
};

export default function Loader({ size = 'md', color = 'blue', className = '' }) {
  return (
    <span
      className={classNames(
        'inline-block rounded-full border-t-transparent animate-spin',
        sizeMap[size],
        colorMap[color],
        className
      )}
      aria-label="Loading"
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Loader size="lg" />
    </div>
  );
}
