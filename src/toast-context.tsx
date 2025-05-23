"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";

type ToastContextType = ReturnType<typeof useToast> | null;

const ToastContext = React.createContext<ToastContextType>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }

  return context;
}
