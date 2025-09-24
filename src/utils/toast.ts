"use client";

import toast, { type ToastOptions } from 'react-hot-toast';

export const showSuccess = (message: string, options?: ToastOptions) => {
  toast.success(message, options);
};

export const showError = (message: string, options?: ToastOptions) => {
  toast.error(message, options);
};

export const showToast = (message: string, options?: ToastOptions) => {
  return toast.loading(message, options);
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};