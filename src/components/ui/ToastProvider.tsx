'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1e1e35',
          color: '#f1f5f9',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          fontSize: '14px',
        },
        success: {
          iconTheme: { primary: '#22c55e', secondary: '#1e1e35' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#1e1e35' },
        },
        duration: 3000,
      }}
    />
  );
}
