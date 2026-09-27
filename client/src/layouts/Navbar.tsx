import React, { useState } from 'react';
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Badge,
  Kbd,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@heroui/react';
import {
  Menu,
  Search,
  Moon,
  Sun,
  Bell,
  Plus,
  Settings,
  LogOut,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ColorModeContext';
import { useShortcuts } from '../context/ShortcutContext';
import { TransactionFormModal } from '../components/TransactionFormModal';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/endpoints';

interface NavbarProps {
  onMobileMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMobileMenuToggle }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { mode, toggleColorMode } = useColorMode();
  const { isAddModalOpen, openAddModal, closeAddModal, searchRef } = useShortcuts();

  const [searchQuery, setSearchQuery] = useState('');

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getDashboard,
    staleTime: 60000,
  });

  const insights = dashboardData?.insights || [];
  const unreadCount = insights.length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/transactions?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Search with keyboard shortcut badge */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden sm:flex items-center w-64 md:w-72"
          >
            <div className="flex items-center w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F14] text-xs transition-colors focus-within:border-primary-500">
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search ledger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              <Kbd keys={['command']} className="hidden md:inline-flex text-[10px] py-0 px-1 ml-1">
                /
              </Kbd>
            </div>
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Add Transaction Button with [N] Shortcut */}
            <Button
              color="primary"
              variant="solid"
              size="sm"
              startContent={<Plus className="w-4 h-4" />}
              endContent={
                <span className="hidden md:inline-block ml-0.5 px-1 py-0.2 bg-white/20 rounded text-[10px] font-bold">
                  N
                </span>
              }
              onPress={openAddModal}
              className="font-medium shadow-sm hidden sm:inline-flex"
            >
              Add Transaction
            </Button>

            {/* Mobile Add Transaction */}
            <Button
              isIconOnly
              color="primary"
              variant="flat"
              size="sm"
              onPress={openAddModal}
              className="sm:hidden w-8 h-8 min-w-8"
              aria-label="Add transaction"
            >
              <Plus className="w-4 h-4" />
            </Button>

            {/* Dark / Light Mode Switch */}
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={toggleColorMode}
              className="w-8 h-8 min-w-8 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              aria-label="Toggle theme"
            >
              {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* Notifications Dropdown */}
            {/* Notifications Popover */}
            <Popover
              placement="bottom-end"
              classNames={{
                content: 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-0 w-80 overflow-hidden',
              }}
            >
              <PopoverTrigger>
                <button
                  type="button"
                  className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="w-full">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                      Financial Insights & Alerts
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Real-time transaction patterns
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800">
                    {insights.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        No active warnings. Financials healthy!
                      </div>
                    ) : (
                      insights.map((insight) => (
                        <div
                          key={insight.id}
                          className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
                        >
                          {insight.type === 'warning' || insight.type === 'error' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                              {insight.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                              {insight.text}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* User Profile Avatar Dropdown */}
            <Dropdown
              placement="bottom-end"
              classNames={{
                content: 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-1 w-52',
              }}
            >
              <DropdownTrigger>
                <button
                  type="button"
                  className="rounded-full ring-2 ring-primary-500/20 hover:ring-primary-500/40 transition-all p-0.5"
                  aria-label="User profile"
                >
                  <Avatar
                    name={user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    size="sm"
                    className="w-7 h-7 text-xs font-semibold bg-primary-600 text-white"
                  />
                </button>
              </DropdownTrigger>
              <DropdownMenu aria-label="User navigation" className="text-xs">
                <DropdownItem key="user-info" isReadOnly className="cursor-default pb-2">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {user?.name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {user?.email}
                  </div>
                </DropdownItem>
                <DropdownItem
                  key="settings"
                  startContent={<Settings className="w-4 h-4 text-slate-400" />}
                  onPress={() => navigate('/settings')}
                  className="rounded-lg"
                >
                  Settings
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  color="danger"
                  className="text-rose-600 dark:text-rose-400 rounded-lg"
                  startContent={<LogOut className="w-4 h-4" />}
                  onPress={handleLogout}
                >
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </header>

      {/* Global Add Transaction Modal hooked into shortcut context */}
      <TransactionFormModal open={isAddModalOpen} onClose={closeAddModal} />
    </>
  );
};
