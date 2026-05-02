import React, { useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, History, LogOut, Menu, X, GraduationCap, Bell
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { classNames, getInitials } from '../utils/formatters';

const NAV_ITEMS = [
  { to: '/student/dashboard', label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/student/notices',   label: 'Announcements', icon: Bell },
  { to: '/student/history',   label: 'History',       icon: History },
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

function SidebarContent({
  forceExpand = false,
  onClose,
  isCollapsed,
  user,
  onLogout,
  onToggleCollapse,
  onHoverEnter,
  onHoverLeave,
}) {
  return (
    <aside
      onMouseLeave={() => !forceExpand && onHoverLeave()}
      className={classNames(
        'flex flex-col glass-sidebar h-full transition-[width] duration-500 ease-out will-change-[width]',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Sidebar Header */}
      <div
        onMouseEnter={() => !forceExpand && onHoverLeave()}
        className="flex items-center h-16 shrink-0 border-b border-gray-100 px-3 gap-3"
      >
        {/* Hamburger: toggles desktop collapse OR closes mobile overlay */}
        <button
          onClick={() => onClose ? onClose() : onToggleCollapse()}
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
        onMouseEnter={() => !forceExpand && onHoverEnter()}
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
                <span className="text-xs font-semibold text-brand-700">{getInitials(user?.name || 'S')}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Student'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.class ? `Class ${user.class}` : 'Student'}</p>
              </div>
            </div>
          )}
          <button
            onClick={onLogout}
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

export default function StudentLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const effectivelyCollapsed = collapsed && !isHovered;
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/student');
  };

  const handleHoverEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setIsHovered(true), 150);
  };

  const handleHoverLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(false);
  };

  const toggleCollapse = () => setCollapsed((c) => !c);

  // Find active index for sliding indicator
  // indices: 0: dashboard, 1: notices, 2: history, 3: logout placeholder
  const activeIndex = NAV_ITEMS.findIndex(item => item.to === location.pathname);
  const indicatorStyle = activeIndex !== -1
    ? { transform: `translateX(${activeIndex * 100}%)` }
    : { opacity: 0 };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden lg:flex flex-col h-full">
        <SidebarContent
          isCollapsed={effectivelyCollapsed}
          user={user}
          onLogout={handleLogout}
          onToggleCollapse={toggleCollapse}
          onHoverEnter={handleHoverEnter}
          onHoverLeave={handleHoverLeave}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        {/* Topbar */}
        <header className="flex items-center gap-3 px-5 h-16 glass-header sticky top-0 z-30 shrink-0">
          
          {/* Logo shown in topbar on mobile/desktop-collapsed */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex items-center justify-center w-8 h-8 bg-brand-600 rounded-xl shrink-0 shadow-lg shadow-brand-200">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">FeeSync</span>
          </div>

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
              <p className="text-sm font-medium text-gray-900 leading-none">{user?.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{user?.class ? `Class ${user.class}` : 'Student'}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center border-2 border-white shadow-sm">
              <span className="text-sm font-semibold text-brand-700">{getInitials(user?.name || 'S')}</span>
            </div>
          </div>
        </header>

        {/* Page content - added bottom padding on mobile for navbar */}
        <main className="flex-1 overflow-y-auto animate-fade-in pb-28 lg:pb-0">
          <div className="max-w-7xl mx-auto p-5 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Modern Bottom Navigation for Mobile - Premium Glass Capsule Style */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pb-[env(safe-area-inset-bottom)]">
        {/* Shadow Overlay to separate from content */}
        <div className="absolute inset-x-0 top-0 h-12 -mt-12 bg-gradient-to-t from-gray-50/80 to-transparent pointer-events-none" />
        
        <div className="relative bg-white/90 backdrop-blur-2xl border-t border-gray-100/50 h-[88px] px-4 flex items-center justify-around leading-none pb-6">
          
          {/* Sliding Glass Capsule Indicator */}
          <div 
            className="absolute top-2 bottom-8 left-4 right-4 flex pointer-events-none transition-all duration-500 ease-spring"
            style={{ width: `calc((100% - 32px) / ${NAV_ITEMS.length + 1})` }}
          >
            <div 
              className="w-full h-full relative p-[1px] rounded-2xl transition-all duration-500"
              style={indicatorStyle}
            >
              {/* Gradient Border Glass Capsule */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-brand-500/30 to-transparent opacity-40" />
              <div className="absolute inset-0 rounded-2xl border border-brand-500/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]" />
              <div className="w-full h-full bg-brand-50/30 backdrop-blur-md rounded-2xl shadow-xl shadow-brand-500/5" />
            </div>
          </div>

          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                classNames(
                  'relative flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all duration-300 z-10',
                  isActive ? 'text-brand-700 pointer-events-none' : 'text-gray-400 hover:text-gray-600'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={classNames(
                    'p-2 rounded-2xl transition-all duration-500 relative',
                    isActive ? 'scale-125 -translate-y-1' : 'scale-100 opacity-60'
                  )}>
                    {isActive && (
                      <div className="absolute inset-0 bg-brand-500/10 blur-xl rounded-full animate-pulse" />
                    )}
                    <Icon 
                      size={20} 
                      strokeWidth={isActive ? 2.5 : 2} 
                      className={classNames('transition-all relative z-10', isActive ? 'text-brand-600' : '')} 
                    />
                  </div>
                  <span className={classNames(
                    'text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-500',
                    isActive ? 'opacity-100 translate-y-0 scale-105' : 'opacity-40 translate-y-0.5 scale-100'
                  )}>
                    {label.split(' ')[0]}
                  </span>
                </>
              )}
            </NavLink>
          ))}
          
          {/* Logout in bottom bar */}
          <button
            onClick={handleLogout}
            className="relative flex flex-col items-center justify-center gap-1.5 flex-1 h-full text-gray-400 hover:text-red-500 transition-all z-10"
          >
            <div className="p-2 rounded-2xl hover:bg-red-50 transition-all duration-300">
              <LogOut size={20} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.15em] opacity-40">Exit</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
