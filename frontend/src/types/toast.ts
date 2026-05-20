// This file has toast types.

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
  duration?: number;
}

export interface ToastContextType {
  showToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}