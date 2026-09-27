import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Spinner } from '@heroui/react';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col bg-background p-4">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" color="primary" />
          <p className="text-sm font-medium text-foreground-500">
            Loading your financial cockpit...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

