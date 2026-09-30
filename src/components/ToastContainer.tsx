import React, { useState, useEffect } from 'react';
import { ToastNotification } from '../types';
import { toastManager } from '../managers/ToastManager';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  FileJson,
  FileSpreadsheet,
  Download,
  Database,
  ExternalLink
} from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe((updatedToasts) => {
      setToasts(updatedToasts);
    });
    return () => unsubscribe();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-4 right-3 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success' || !toast.type;
        const isWarning = toast.type === 'warning';
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto relative overflow-hidden rounded-xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 transform animate-in slide-in-from-top-3 fade-in ${
              isSuccess
                ? 'bg-slate-900/95 border-emerald-500/60 shadow-emerald-950/40 text-slate-100 ring-1 ring-emerald-500/30'
                : isWarning
                ? 'bg-slate-900/95 border-amber-500/60 shadow-amber-950/40 text-slate-100 ring-1 ring-amber-500/30'
                : isError
                ? 'bg-slate-900/95 border-rose-500/60 shadow-rose-950/40 text-slate-100 ring-1 ring-rose-500/30'
                : 'bg-slate-900/95 border-cyan-500/60 shadow-cyan-950/40 text-slate-100 ring-1 ring-cyan-500/30'
            }`}
          >
            {/* Top Glowing Gradient Accent Bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 ${
                isSuccess
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400'
                  : isWarning
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600'
                  : isError
                  ? 'bg-gradient-to-r from-rose-500 via-red-400 to-rose-600'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-400 to-indigo-500'
              }`}
            />

            <div className="flex items-start gap-3">
              {/* Status Icon */}
              <div
                className={`mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border ${
                  isSuccess
                    ? 'bg-emerald-950/80 border-emerald-600/70 text-emerald-400 shadow-sm shadow-emerald-500/20'
                    : isWarning
                    ? 'bg-amber-950/80 border-amber-600/70 text-amber-400 shadow-sm shadow-amber-500/20'
                    : isError
                    ? 'bg-rose-950/80 border-rose-600/70 text-rose-400 shadow-sm shadow-rose-500/20'
                    : 'bg-cyan-950/80 border-cyan-600/70 text-cyan-400 shadow-sm shadow-cyan-500/20'
                }`}
              >
                {toast.fileDetails?.format === 'JSON' ? (
                  <FileJson className="h-5 w-5" />
                ) : toast.fileDetails?.format === 'CSV' ? (
                  <FileSpreadsheet className="h-5 w-5" />
                ) : isSuccess ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : isWarning ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : isError ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <Info className="h-5 w-5" />
                )}
              </div>

              {/* Toast Text & Details */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold font-mono tracking-tight text-white uppercase flex items-center gap-1.5">
                    {toast.title}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(toast.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                {toast.message && (
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {toast.message}
                  </p>
                )}

                {/* Optional File Details Chip */}
                {toast.fileDetails && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px] font-mono">
                    {toast.fileDetails.filename && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-cyan-300 truncate max-w-[240px]">
                        <Download className="h-3 w-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{toast.fileDetails.filename}</span>
                      </span>
                    )}
                    {toast.fileDetails.format && (
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-400 font-bold text-[10px]">
                        {toast.fileDetails.format}
                      </span>
                    )}
                    {toast.fileDetails.itemCount !== undefined && (
                      <span className="text-slate-400 text-[10px]">
                        {toast.fileDetails.itemCount} records included
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => toastManager.dismiss(toast.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
