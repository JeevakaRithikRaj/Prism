import React, { useState, useEffect } from 'react';
import {
  AutoExportConfig,
  StoredExportSnapshot,
  MachineState
} from '../types';
import { autoExportManager } from '../managers/AutoExportManager';
import { simulationManager } from '../managers/SimulationManager';
import { audioAlarmManager, AlarmSoundMode } from '../utils/AudioAlarmManager';
import {
  Settings,
  X,
  Clock,
  HardDrive,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  FileCode,
  Layers,
  Database,
  Volume2,
  Bell,
  Check,
  Eye,
  Info,
  Globe
} from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  machines: MachineState[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  machines
}) => {
  const { currentLanguage, currentLanguageInfo, trans } = useI18n();
  const [config, setConfig] = useState<AutoExportConfig>(autoExportManager.getConfig());
  const [snapshots, setSnapshots] = useState<StoredExportSnapshot[]>(autoExportManager.getSnapshots());
  const [countdownSeconds, setCountdownSeconds] = useState<number>(autoExportManager.getNextRunRemainingSeconds());
  const [activeTab, setActiveTab] = useState<'auto-export' | 'storage-archive' | 'audio-telemetry' | 'language-i18n'>('auto-export');
  const [inspectedSnapshot, setInspectedSnapshot] = useState<StoredExportSnapshot | null>(null);
  const [isExportingNow, setIsExportingNow] = useState<boolean>(false);

  // Sound settings state
  const [soundMode, setSoundMode] = useState<AlarmSoundMode>(audioAlarmManager.getStatus().soundMode);
  const [isMuted, setIsMuted] = useState<boolean>(audioAlarmManager.getStatus().isMuted);

  // Subscribe to auto-export manager
  useEffect(() => {
    const unsubscribe = autoExportManager.subscribe((newConfig, newSnapshots) => {
      setConfig(newConfig);
      setSnapshots(newSnapshots);
    });
    return () => unsubscribe();
  }, []);

  // Countdown timer ticker
  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdownSeconds(autoExportManager.getNextRunRemainingSeconds());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  // Format seconds into MM:SS or HH:MM:SS
  const formatCountdown = (totalSecs: number): string => {
    if (totalSecs <= 0) return 'Executing cycle...';
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (hours > 0) {
      return `${hours}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
    }
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  };

  const handleToggleAutoExport = (enabled: boolean) => {
    autoExportManager.updateConfig({ enabled });
  };

  const handleIntervalChange = (intervalMinutes: number) => {
    autoExportManager.updateConfig({ intervalMinutes });
  };

  const handleScopeChange = (targetScope: string) => {
    autoExportManager.updateConfig({ targetScope });
  };

  const handleTriggerManualExport = () => {
    setIsExportingNow(true);
    setTimeout(() => {
      autoExportManager.runExportCycle(true);
      setIsExportingNow(false);
    }, 400);
  };

  const totalStorageBytes = autoExportManager.getTotalStorageSizeBytes();
  const totalStorageKb = (totalStorageBytes / 1024).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden font-sans">
        
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-700/80 text-cyan-400 shadow-sm">
              <Settings className="h-5 w-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <span>System Settings & Data Configuration</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
                  PRISM v2.0
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Automated hourly health log exports, local storage archives, and telemetry rules
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            title="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-slate-950/60 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveTab('auto-export')}
            className={`flex items-center gap-2 px-3.5 py-2 font-bold rounded-t-lg transition-colors ${
              activeTab === 'auto-export'
                ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Automated Hourly Export</span>
            {config.enabled && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('storage-archive')}
            className={`flex items-center gap-2 px-3.5 py-2 font-bold rounded-t-lg transition-colors ${
              activeTab === 'storage-archive'
                ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="h-3.5 w-3.5" />
            <span>Local Storage Archive ({snapshots.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audio-telemetry')}
            className={`flex items-center gap-2 px-3.5 py-2 font-bold rounded-t-lg transition-colors ${
              activeTab === 'audio-telemetry'
                ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Audio & Annunciator</span>
          </button>

          <button
            onClick={() => setActiveTab('language-i18n')}
            className={`flex items-center gap-2 px-3.5 py-2 font-bold rounded-t-lg transition-colors ${
              activeTab === 'language-i18n'
                ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="h-3.5 w-3.5 text-cyan-400" />
            <span>Manufacturing Languages ({currentLanguage.toUpperCase()})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs font-mono">
          
          {/* TAB 1: Automated Hourly Export Settings */}
          {activeTab === 'auto-export' && (
            <div className="space-y-5">
              
              {/* Feature Status Spotlight Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 border border-cyan-800/80 shadow-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                        config.enabled
                          ? 'bg-emerald-950/80 border-emerald-600 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          : 'bg-slate-900 border-slate-700 text-slate-500'
                      }`}
                    >
                      <Clock className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                          Scheduled Machine Health Log Auto-Export
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                            config.enabled
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-slate-900 text-slate-400 border-slate-700'
                          }`}
                        >
                          {config.enabled ? 'ACTIVE SCHEDULE' : 'DISABLED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Automatically captures continuous audit trails, health scores, and telemetry snapshots directly into browser local storage.
                      </p>
                    </div>
                  </div>

                  {/* Master Toggle Switch */}
                  <div className="flex items-center gap-2.5 self-start sm:self-center">
                    <button
                      onClick={() => handleToggleAutoExport(!config.enabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        config.enabled ? 'bg-cyan-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-slate-300 font-bold">
                      {config.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Live Countdown & Stats Strip */}
                {config.enabled && (
                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                    <div className="bg-slate-950/90 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">NEXT HOURLY EXPORT IN:</span>
                      <strong className="text-cyan-300 text-sm font-black flex items-center gap-1.5 mt-0.5">
                        <Clock className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                        {formatCountdown(countdownSeconds)}
                      </strong>
                    </div>

                    <div className="bg-slate-950/90 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">CURRENT FREQUENCY:</span>
                      <strong className="text-slate-200 mt-0.5 block">
                        Every {config.intervalMinutes} Minutes{' '}
                        {config.intervalMinutes === 60 ? '(Hourly)' : ''}
                      </strong>
                    </div>

                    <div className="bg-slate-950/90 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">LOCAL STORAGE REPOSITORY:</span>
                      <strong className="text-emerald-400 mt-0.5 block">
                        {snapshots.length} Snapshots Saved ({totalStorageKb} KB)
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Configuration Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Interval Frequency Selection */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-slate-200 font-bold">
                    <Clock className="h-4 w-4 text-cyan-400" />
                    <span>Export Frequency Interval</span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Select how frequently PRISM generates and writes machine health logs to local storage.
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <button
                      onClick={() => handleIntervalChange(60)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        config.intervalMinutes === 60
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-600 font-bold shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold">Every 1 Hour</div>
                      <div className="text-[10px] text-slate-400">Standard hourly archive</div>
                    </button>

                    <button
                      onClick={() => handleIntervalChange(30)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        config.intervalMinutes === 30
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-600 font-bold shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold">Every 30 Mins</div>
                      <div className="text-[10px] text-slate-400">High-resolution logging</div>
                    </button>

                    <button
                      onClick={() => handleIntervalChange(120)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        config.intervalMinutes === 120
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-600 font-bold shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold">Every 2 Hours</div>
                      <div className="text-[10px] text-slate-400">Shift change intervals</div>
                    </button>

                    <button
                      onClick={() => handleIntervalChange(1)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        config.intervalMinutes === 1
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-600 font-bold shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                      title="Rapid testing mode (1 minute) for demonstration and verification"
                    >
                      <div className="font-bold text-amber-300 flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        <span>Demo (1 Min)</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Rapid live verification</div>
                    </button>
                  </div>
                </div>

                {/* Target Scope & Machine Selection */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-slate-200 font-bold">
                    <Layers className="h-4 w-4 text-cyan-400" />
                    <span>Target Machine Scope</span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Specify whether to snapshot all plant machines simultaneously or focus on a critical asset.
                  </p>

                  <select
                    value={config.targetScope}
                    onChange={(e) => handleScopeChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500"
                  >
                    <option value="all_machines">
                      🌐 All Plant Machines (Consolidated Enterprise Snapshot)
                    </option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        🔧 {m.name} ({m.model})
                      </option>
                    ))}
                  </select>

                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 space-y-1">
                    <span className="text-slate-300 font-semibold block">Included Payload Contents:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                      <li>Complete continuous history log trail & maintenance interventions</li>
                      <li>Health scores, RUL degradation rates, and OEE metrics</li>
                      <li>Current sensor readings snapshot (temperature, vibration, torque)</li>
                      <li>Explainable AI root cause diagnostic summaries</li>
                    </ul>
                  </div>
                </div>

              </div>

              {/* Storage & Notification Behavior Checkboxes */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-slate-200 font-bold">
                  <Database className="h-4 w-4 text-cyan-400" />
                  <span>Storage & Delivery Preferences</span>
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.notifyOnExport}
                      onChange={(e) => autoExportManager.updateConfig({ notifyOnExport: e.target.checked })}
                      className="mt-0.5 rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-0 h-4 w-4"
                    />
                    <div>
                      <span className="text-slate-200 font-bold block">
                        Show Toast Notification on Automated Export
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Displays an informative alert badge showing the exported file name, record count, and payload size.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoDownloadToFileSystem}
                      onChange={(e) =>
                        autoExportManager.updateConfig({ autoDownloadToFileSystem: e.target.checked })
                      }
                      className="mt-0.5 rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-0 h-4 w-4"
                    />
                    <div>
                      <span className="text-slate-200 font-bold block">
                        Also Trigger Browser File Download Prompt (.json)
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Downloads the file directly to your computer&apos;s Downloads folder in addition to saving in local storage.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Immediate Test Trigger Button */}
                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Want to test the export pipeline right now?
                  </span>

                  <button
                    onClick={handleTriggerManualExport}
                    disabled={isExportingNow}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Zap className="h-4 w-4 fill-current" />
                    <span>{isExportingNow ? 'Archiving Snapshot...' : 'Run Export Cycle Now (Test)'}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Local Storage Archive Repository */}
          {activeTab === 'storage-archive' && (
            <div className="space-y-4">
              
              {/* Archive Overview Header */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-cyan-400" />
                    <span>Local Storage Snapshot Repository</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {snapshots.length} automated hourly export files stored in browser local storage ({totalStorageKb} KB used).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => autoExportManager.downloadAllSnapshotsAsBundle()}
                    className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 font-bold transition-colors flex items-center gap-1.5"
                    title="Download all snapshots as one combined batch JSON"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download All Bundle</span>
                  </button>

                  <button
                    onClick={() => autoExportManager.clearAllSnapshots()}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold transition-colors flex items-center gap-1.5"
                    title="Clear all stored snapshots from browser local storage"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear Storage</span>
                  </button>
                </div>
              </div>

              {/* Snapshots Table / List */}
              {snapshots.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400">
                  <HardDrive className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-bold">No export snapshots stored yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Click &ldquo;Run Export Cycle Now&rdquo; on the first tab to generate your first hourly health log snapshot.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {snapshots.map((snap, idx) => (
                    <div
                      key={snap.id}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                          <h5 className="font-bold text-slate-200 truncate max-w-sm sm:max-w-md">
                            {snap.filename}
                          </h5>
                          {idx === 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                              LATEST
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                          <span>Date: <strong className="text-slate-300">{new Date(snap.createdAt).toLocaleString()}</strong></span>
                          <span>Scope: <strong className="text-slate-300">{snap.scope}</strong></span>
                          <span>Records: <strong className="text-cyan-400">{snap.totalLogRecords} logs</strong></span>
                          <span>Size: <strong className="text-slate-300">{(snap.sizeBytes / 1024).toFixed(1)} KB</strong></span>
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center gap-1.5 self-end md:self-center flex-shrink-0">
                        <button
                          onClick={() => setInspectedSnapshot(snap)}
                          className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1 text-[11px]"
                          title="Inspect JSON preview"
                        >
                          <Eye className="h-3 w-3 text-slate-400" />
                          <span>Inspect</span>
                        </button>

                        <button
                          onClick={() => autoExportManager.downloadSnapshot(snap.id)}
                          className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 transition-colors flex items-center gap-1 font-bold text-[11px]"
                          title="Download this JSON file"
                        >
                          <Download className="h-3 w-3 text-cyan-400" />
                          <span>Download</span>
                        </button>

                        <button
                          onClick={() => autoExportManager.deleteSnapshot(snap.id)}
                          className="p-1 rounded bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-800 transition-colors"
                          title="Delete from local storage"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Inspected Snapshot Preview Modal */}
              {inspectedSnapshot && (
                <div className="p-4 bg-slate-950 rounded-xl border border-cyan-800 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-cyan-400" />
                      <h4 className="text-xs font-bold text-white truncate max-w-lg">
                        Snapshot Preview: {inspectedSnapshot.filename}
                      </h4>
                    </div>
                    <button
                      onClick={() => setInspectedSnapshot(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <pre className="max-h-60 overflow-y-auto p-3 bg-slate-900 rounded-lg border border-slate-800 text-[10px] font-mono text-cyan-300 whitespace-pre-wrap select-all">
                    {JSON.stringify(inspectedSnapshot.data, null, 2)}
                  </pre>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => autoExportManager.downloadSnapshot(inspectedSnapshot.id)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition-colors flex items-center gap-1.5 text-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download JSON</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: Audio & Annunciator Controls */}
          {activeTab === 'audio-telemetry' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-slate-200 font-bold">
                  <Volume2 className="h-4 w-4 text-cyan-400" />
                  <span>Acoustic Alarm Annunciator Setup (ISA-18.2)</span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Configure synthetic web audio horn patterns and alarm annunciation protocols triggered during critical threshold excursions.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Alarm Sound Pattern</label>
                    <select
                      value={soundMode}
                      onChange={(e) => {
                        const m = e.target.value as AlarmSoundMode;
                        setSoundMode(m);
                        audioAlarmManager.setSoundMode(m);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500"
                    >
                      <option value="intermittent">⚡ Intermittent Beep</option>
                      <option value="siren">🚨 Escalating Siren</option>
                      <option value="buzz">🔊 Electrical Buzz</option>
                      <option value="chime">🔔 Dual Warning Tone</option>
                      <option value="horn">🎺 Klaxon Horn</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Master Audio Mute</label>
                    <button
                      onClick={() => {
                        const next = !isMuted;
                        setIsMuted(next);
                        if (next !== audioAlarmManager.getStatus().isMuted) {
                          audioAlarmManager.toggleMute();
                        }
                      }}
                      className={`w-full py-2 px-3 rounded-lg border font-bold text-xs transition-colors flex items-center justify-center gap-2 ${
                        isMuted
                          ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                          : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <Volume2 className="h-4 w-4" />
                      <span>{isMuted ? 'Horns Muted (Silent Mode)' : 'Horns Active (Audible)'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Manufacturing Language & Regional Localization */}
          {activeTab === 'language-i18n' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-700/80 text-cyan-400 shrink-0">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                    {trans.settings.language}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {trans.settings.languageDescription}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-mono font-bold uppercase text-slate-300 tracking-wider">
                    Select Industrial Manufacturing Locale
                  </h5>
                  <span className="text-[11px] font-mono text-cyan-400 font-bold">
                    Active: {currentLanguageInfo.flag} {currentLanguageInfo.nativeName} ({currentLanguage.toUpperCase()})
                  </span>
                </div>
                <LanguageSwitcher variant="modal" />
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                  <span>Standardized Industrial Engineering Terms</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Translations conform to international condition monitoring and automation specifications (ISO 10816-3 vibration severity standards, ISA-18.2 alarm management, and Industrie 4.0 deterministic communication).
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Auto-export service running in background</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-500 hidden sm:inline">&copy; 2026 RJRR. All rights reserved.</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-colors"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
