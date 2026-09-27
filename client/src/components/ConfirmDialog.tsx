import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'danger' | 'primary' | 'warning';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  confirmColor = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      isOpen={open}
      onOpenChange={(isOpen) => !isOpen && onCancel()}
      size="sm"
      classNames={{
        base: 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl',
        header: 'border-b border-slate-100 dark:border-slate-800 pb-3',
        footer: 'border-t border-slate-100 dark:border-slate-800 pt-3',
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              {confirmColor === 'danger' && (
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              {title}
            </ModalHeader>
            <ModalBody className="py-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {message}
              </p>
            </ModalBody>
            <ModalFooter className="flex justify-end gap-2">
              <Button
                variant="light"
                color="default"
                size="sm"
                isDisabled={isLoading}
                onPress={onCancel}
              >
                {cancelText}
              </Button>
              <Button
                color={confirmColor === 'warning' ? 'warning' : confirmColor === 'primary' ? 'primary' : 'danger'}
                variant="solid"
                size="sm"
                isLoading={isLoading}
                onPress={onConfirm}
              >
                {confirmText}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
