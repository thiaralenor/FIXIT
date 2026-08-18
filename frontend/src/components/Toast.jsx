import React from 'react';
import { useCivic } from '../context/CivicContext';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function Toast() {
  const { toast } = useCivic();

  if (!toast) return null;

  return (
    <div className={`toast-notification ${toast.type || 'success'}`}>
      {toast.type === 'error' ? (
        <AlertCircle size={20} className="toast-icon" />
      ) : (
        <CheckCircle size={20} className="toast-icon" />
      )}
      <span className="toast-message">{toast.message}</span>
    </div>
  );
}
