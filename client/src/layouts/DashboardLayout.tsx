import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileBottomNav } from './MobileBottomNav';

export const DashboardLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0B0F14] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Permanent Minimal Sidebar on Desktop */}
      <Sidebar open={false} variant="permanent" />

      {/* Temporary Drawer on Mobile/Tablet */}
      <Sidebar open={mobileOpen} onClose={handleDrawerToggle} variant="temporary" />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMobileMenuToggle={handleDrawerToggle} />

        <main className="flex-1 p-4 sm:p-6 md:p-8 pb-20 md:pb-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav onOpenMore={handleDrawerToggle} />
      </div>
    </div>
  );
};
