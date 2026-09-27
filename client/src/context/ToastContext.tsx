import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastSeverity = 'success' | 'error' | 'info' | 'warning';

interface ActionConfig {
  label: string;
  onClick: () => void;
}

interface ToastContextType {
  showToast: (message: string, severity?: ToastSeverity, action?: ActionConfig) => void;
  showSuccess: (message: string, action?: ActionConfig) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<ToastSeverity>('info');
  const [action, setAction] = useState<ActionConfig | null>(null);

  const showToast = useCallback((msg: string, sev: ToastSeverity = 'info', act?: ActionConfig) => {
    setMessage(msg);
    setSeverity(sev);
    setAction(act || null);
    setOpen(true);

    setTimeout(() => {
      setOpen(false);
    }, 4500);
  }, []);

  const showSuccess = useCallback(
    (msg: string, act?: ActionConfig) => showToast(msg, 'success', act),
    [showToast]
  );
  const showError = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const showInfo = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);
  const showWarning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast]);

  const getIcon = () => {
    switch (severity) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (severity) {
      case 'success':
        return 'border-emerald-500/20';
      case 'error':
        return 'border-rose-500/20';
      case 'warning':
        return 'border-amber-500/20';
      default:
        return 'border-blue-500/20';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-none flex flex-col items-end gap-2 max-w-sm w-full">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className={`pointer-events-auto flex items-center gap-3 w-full p-3.5 rounded-xl border ${getBorderColor()} bg-white dark:bg-[#111827] shadow-xl text-sm text-slate-900 dark:text-slate-100 backdrop-blur-md`}
            >
              {getIcon()}
              <span className="flex-1 text-xs sm:text-sm font-medium leading-snug">{message}</span>
              {action && (
                <button
                  type="button"
                  onClick={() => {
                    action.onClick();
                    setOpen(false);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 transition-colors uppercase tracking-wider shrink-0"
                >
                  {action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded shrink-0"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
