import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../utils/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside aria-label="Offline status" className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/95 text-slate-950 px-3.5 py-2 text-xs font-semibold shadow-2xl border border-amber-400 backdrop-blur-md animate-pulse">
      <WifiOff className="h-4 w-4" />
      <span>Offline Mode — Cached machine data &amp; local telemetry active</span>
    </aside>
  );
};
