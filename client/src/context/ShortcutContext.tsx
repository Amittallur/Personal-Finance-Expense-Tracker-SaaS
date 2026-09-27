import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutContextType {
  isAddModalOpen: boolean;
  openAddModal: () => void;
  closeAddModal: () => void;
  focusSearch: () => void;
  searchRef: React.RefObject<HTMLInputElement>;
}

const ShortcutContext = createContext<ShortcutContextType | undefined>(undefined);

export const ShortcutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Track sequence for "G then ..."
  const lastKeyRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => setIsAddModalOpen(false);

  const focusSearch = () => {
    if (searchRef.current) {
      searchRef.current.focus();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        // Allow escape to blur input
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      const now = Date.now();
      const lastKey = lastKeyRef.current;

      // Single key: N -> New Transaction
      if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsAddModalOpen(true);
        return;
      }

      // Single key: / -> Focus search
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        focusSearch();
        return;
      }

      // Sequence: G then D / T / A / B
      if (now - lastKey.time < 800 && lastKey.key.toLowerCase() === 'g') {
        const nextKey = e.key.toLowerCase();
        if (nextKey === 'd') {
          e.preventDefault();
          navigate('/');
        } else if (nextKey === 't') {
          e.preventDefault();
          navigate('/transactions');
        } else if (nextKey === 'a') {
          e.preventDefault();
          navigate('/analytics');
        } else if (nextKey === 'b') {
          e.preventDefault();
          navigate('/budgets');
        }
        lastKeyRef.current = { key: '', time: 0 };
        return;
      }

      lastKeyRef.current = { key: e.key, time: now };
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <ShortcutContext.Provider
      value={{
        isAddModalOpen,
        openAddModal,
        closeAddModal,
        focusSearch,
        searchRef,
      }}
    >
      {children}
    </ShortcutContext.Provider>
  );
};

export const useShortcuts = () => {
  const context = useContext(ShortcutContext);
  if (!context) {
    throw new Error('useShortcuts must be used within a ShortcutProvider');
  }
  return context;
};
