import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  Target,
  Tv,
  Repeat,
  Layers,
  Settings,
  LogOut,
  X,
  Keyboard,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Kbd } from '@heroui/react';

interface SidebarProps {
  open: boolean;
  onClose?: () => void;
  variant?: 'permanent' | 'temporary';
}

const PRIMARY_NAV = [
  { text: 'Overview', path: '/', icon: LayoutDashboard, shortcut: 'G D' },
  { text: 'Transactions', path: '/transactions', icon: ArrowLeftRight, shortcut: 'G T' },
  { text: 'Budgets', path: '/budgets', icon: Wallet, shortcut: 'G B' },
  { text: 'Analytics', path: '/analytics', icon: PieChart, shortcut: 'G A' },
  { text: 'Savings Goals', path: '/goals', icon: Target },
];

const SECONDARY_NAV = [
  { text: 'Subscriptions', path: '/subscriptions', icon: Tv },
  { text: 'Recurring Bills', path: '/recurring', icon: Repeat },
  { text: 'Categories', path: '/categories', icon: Layers },
];

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose, variant = 'permanent' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleNav = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const content = (
    <div className="w-60 h-full flex flex-col bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Brand Header */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            ₵
          </div>
          <span className="font-semibold text-base tracking-tight text-slate-900 dark:text-slate-50 font-sans">
            Centra
          </span>
        </div>

        {variant === 'temporary' && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="px-3 py-3 flex-1 overflow-y-auto space-y-5">
        <div>
          <div className="px-2.5 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Main
          </div>
          <nav className="space-y-0.5">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/' || location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.path);

              return (
                <button
                  key={item.text}
                  type="button"
                  onClick={() => handleNav(item.path)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.text}</span>
                  </div>
                  {item.shortcut && !isActive && (
                    <span className="text-[10px] text-slate-400 font-mono tracking-tighter opacity-70">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-2.5 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Management
          </div>
          <nav className="space-y-0.5">
            {SECONDARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <button
                  key={item.text}
                  type="button"
                  onClick={() => handleNav(item.path)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.text}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Shortcut hint */}
      <div className="p-3 mx-3 mb-2 rounded-xl bg-slate-50 dark:bg-[#0B0F14] border border-slate-200/70 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <Keyboard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Press <Kbd className="text-[9px] py-0 px-1 font-mono">N</Kbd> to add record</span>
      </div>

      {/* Bottom Nav: Settings & Logout */}
      <div className="p-2 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
        <button
          type="button"
          onClick={() => handleNav('/settings')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            location.pathname === '/settings'
              ? 'bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Settings</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  if (variant === 'temporary') {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 md:hidden flex">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
        {/* Drawer content */}
        <div className="relative z-10 w-60 h-full shadow-2xl animate-in slide-in-from-left duration-200">
          {content}
        </div>
      </div>
    );
  }

  return (
    <aside className="hidden md:block w-60 shrink-0 h-screen sticky top-0">
      {content}
    </aside>
  );
};
