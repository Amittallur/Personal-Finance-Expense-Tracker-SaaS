import React from 'react';
import { Home, ArrowLeftRight, PieChart, Target, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface MobileBottomNavProps {
  onOpenMore: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMore }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { label: 'Analytics', path: '/analytics', icon: PieChart },
    { label: 'Goals', path: '/goals', icon: Target },
  ];

  const isCurrentActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const isMoreActive = !navItems.some((item) => isCurrentActive(item.path));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="grid grid-cols-5 h-14 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isCurrentActive(item.path);

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center h-full transition-colors ${
                active
                  ? 'text-primary-600 dark:text-primary-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onOpenMore}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            isMoreActive
              ? 'text-primary-600 dark:text-primary-400 font-semibold'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Menu className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
};
