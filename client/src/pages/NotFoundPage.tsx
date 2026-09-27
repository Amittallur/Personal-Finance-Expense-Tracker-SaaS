import React from 'react';
import { Button } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center text-center p-6">
      <div className="flex flex-col items-center gap-4 max-w-md">
        <h1 className="text-7xl font-extrabold text-primary tracking-tight">404</h1>
        <h2 className="text-2xl font-bold text-foreground">Page Not Found</h2>
        <p className="text-sm text-foreground-500">
          The financial dashboard route you requested does not exist or may have been moved.
        </p>
        <Button
          color="primary"
          variant="solid"
          startContent={<Home size={18} />}
          onPress={() => navigate('/')}
          className="font-medium mt-2 shadow-sm"
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

