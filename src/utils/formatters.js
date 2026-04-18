import { format, parseISO, isValid } from 'date-fns';

export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
}

export function formatDate(dateStr, fmt = 'dd MMM yyyy') {
  if (!dateStr) return '—';
  const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return isValid(d) ? format(d, fmt) : '—';
}

export function formatDateTime(dateStr) {
  return formatDate(dateStr, 'dd MMM yyyy, hh:mm a');
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}
