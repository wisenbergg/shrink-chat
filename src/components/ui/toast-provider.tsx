"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Toast, ToastTitle, ToastDescription } from "src/components/ui/toast";
import { useToast } from "src/hooks/use-toast";

export function ToastProvider() {
  const { toasts, dismiss } = useToast();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return createPortal(
    <div className="fixed top-0 right-0 z-50 flex flex-col gap-2 w-full max-w-sm p-4 sm:right-0 sm:top-0 sm:flex-col md:max-w-md">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          onDismiss={() => dismiss(toast.id)}
        >
          <div className="grid gap-1">
            {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
            {toast.description && (
              <ToastDescription>{toast.description}</ToastDescription>
            )}
          </div>
        </Toast>
      ))}
    </div>,
    document.body
  );
}
