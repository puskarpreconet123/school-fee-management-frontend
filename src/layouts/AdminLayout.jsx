import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Receipt, CreditCard, Settings,
  LogOut, Menu, X, GraduationCap, Bell, TrendingUp, MessageSquare
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { classNames, getInitials } from '../utils/formatters';

const NAV_ITEMS = [
  { to: '/admin/dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/admin/analytics',  label: 'Analytics',     icon: TrendingUp },
  { to: '/admin/students',   label: 'Students',      icon: Users },
  { to: '/admin/fees',       label: 'Fees',          icon: Receipt },
  { to: '/admin/payments',   label: 'Payments',      icon: CreditCard },
  { to: '/admin/notices',      label: 'Announcements', icon: Bell },
  { to: '/admin/communicate',  label: 'Communicate',   icon: MessageSquare },
  { to: '/admin/settings',     label: 'Settings',      icon: Settings },
];

function NavItem({ to, label, Icon, collapsed }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        classNames(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          'group relative',
          isActive
            ? 'bg-brand-50 text-brand-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            className={classNames(
              'shrink-0 transition-colors',
              isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'
            )}
          />
          {!collapsed && <span>{label}</span>}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {label}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const effectivelyCollapsed = collapsed && !isHovered;
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // forceExpand=true used on mobile so desktop collapsed state doesn't affect mobile overlay
  function SidebarContent({ forceExpand = false, onClose }) {
    const isCollapsed = forceExpand ? false : effectivelyCollapsed;

    return (
      <aside
        onMouseLeave={() => !forceExpand && setIsHovered(false)}
        className={classNames(
          'flex flex-col glass-sidebar h-full transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Sidebar Header */}
        <div
          onMouseEnter={() => !forceExpand && setIsHovered(false)}
          className="flex items-center h-16 shrink-0 border-b border-gray-100 px-3 gap-3"
        >
          {/* Hamburger: toggles desktop collapse OR closes mobile overlay */}
          <button
            onClick={() => onClose ? onClose() : setCollapsed((c) => !c)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors shrink-0"
          >
            {onClose ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Logo — only visible when expanded */}
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 bg-brand-600 rounded-lg shrink-0">
                <GraduationCap size={14} className="text-white" />
              </div>
              <span className="font-bold text-gray-900 text-base tracking-tight">FeeSync</span>
            </div>
          )}
        </div>

        {/* Navigation & User Area (hover expands desktop sidebar) */}
        <div
          className="flex-1 flex flex-col min-h-0"
          onMouseEnter={() => !forceExpand && setIsHovered(true)}
        >
          {/* Navigation */}
          <nav className={classNames(
            'flex-1 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden',
            isCollapsed ? 'px-2' : 'px-3'
          )}>
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavItem key={to} to={to} label={label} Icon={Icon} collapsed={isCollapsed} />
            ))}
          </nav>

          {/* User + Logout */}
          <div className={classNames('px-3 py-4 border-t border-gray-100 space-y-1', isCollapsed && 'px-2')}>
            {!isCollapsed && (
              <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-brand-700">{getInitials(user?.name || 'Admin')}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'School Admin'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={classNames(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium',
                'text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors',
                isCollapsed && 'justify-center'
              )}
            >
              <LogOut size={17} className="shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col h-full">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex flex-col w-60 h-full z-50 animate-in slide-in-from-left duration-300">
            <SidebarContent forceExpand onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        {/* Topbar */}
        <header className="flex items-center gap-3 px-5 h-16 glass-header sticky top-0 z-30 shrink-0">

          {/* Mobile hamburger — opens overlay */}
          <button
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <Menu size={20} />
          </button>

          {/* Logo shown in topbar only when desktop sidebar is collapsed */}
          {effectivelyCollapsed && (
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 bg-brand-600 rounded-lg shrink-0">
                <GraduationCap size={14} className="text-white" />
              </div>
              <span className="font-bold text-gray-900 text-base tracking-tight">FeeSync</span>
            </div>
          )}

          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'School Admin'}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center">
              <span className="text-sm font-semibold text-brand-700">{getInitials(user?.name || 'A')}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto animate-fade-in">
          <div className="max-w-7xl mx-auto p-5 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
