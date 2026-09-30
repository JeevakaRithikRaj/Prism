import React, { useState, useEffect } from 'react';
import { MachineState, Scenario, MachineSubsystem } from '../types';
import { simulationManager } from '../managers/SimulationManager';
import { audioAlarmManager } from '../utils/AudioAlarmManager';
import { toastManager } from '../managers/ToastManager';
import {
  machineCacheService,
  CacheStatusReport,
  SimulatedNetworkMode
} from '../services/machineCacheService';
import { MachineSchematic } from './MachineSchematic';
import { SensorTrends } from './SensorTrends';
import { VibrationSpectrumViewer } from './VibrationSpectrumViewer';
import {
  Cpu,
  Droplets,
  Activity,
  Wind,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Wrench,
  Zap,
  RefreshCw,
  Download,
  CheckCircle2,
  Clock,
  Gauge,
  Sliders,
  Layers,
  FileText,
  Volume2,
  History,
  QrCode,
  Wifi,
  WifiOff,
  Database,
  HardDrive,
  Radio,
  Sparkles
} from 'lucide-react';
import { MachineHistoryLog } from './MachineHistoryLog';
import { useI18n } from '../i18n/i18nContext';

interface MachineDeepDiveProps {
  machines: MachineState[];
  selectedMachineId: string;
  onSelectMachineId: (id: string) => void;
  onOpenDetailModal?: (
    machine: MachineState,
    initialTab?: 'schematic' | 'telemetry' | 'vibration' | 'plc' | 'xai' | 'history' | 'calendar' | 'qr-code'
  ) => void;
}

export const MachineDeepDive: React.FC<MachineDeepDiveProps> = ({
  machines,
  selectedMachineId,
  onSelectMachineId,
  onOpenDetailModal,
}) => {
  const { trans } = useI18n();
  const [activeTab, setActiveTab] = useState<'schematic' | 'telemetry' | 'vibration' | 'plc' | 'rul' | 'xai' | 'history'>('schematic');
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [isSyncingCache, setIsSyncingCache] = useState<boolean>(false);
  const [cacheReport, setCacheReport] = useState<CacheStatusReport>(() => machineCacheService.getStatusReport());

  const machine = machines.find((m) => m.id === selectedMachineId) || machines[0];

  // Subscribe to Service Worker cache status
  useEffect(() => {
    const unsub = machineCacheService.subscribe(() => {
      setCacheReport(machineCacheService.getStatusReport());
    });
    return () => unsub();
  }, []);

  // Proactively cache critical API response assets for this machine
  useEffect(() => {
    if (machine) {
      machineCacheService.cacheMachineDeepDiveAsset(machine);
    }
  }, [machine]);

  if (!machine) return null;

  const isCritical = machine.healthState === 'Action Required';
  const isAdvisory = machine.healthState === 'Advisory';
  const isPostMaint = machine.healthState === 'Post-Maintenance';

  const toggleStep = (stepIdx: number) => {
    const key = `${machine.id}-step-${stepIdx}`;
    setCompletedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleForceCacheSync = async () => {
    setIsSyncingCache(true);
    await machineCacheService.clearAndResync(machines);
    setTimeout(() => {
      setIsSyncingCache(false);
    }, 500);
  };

  const handleExportJSON = () => {
    const fileName = `PRISM_Machine_${machine.id}_${Date.now()}.json`;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(machine, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toastManager.info(
      'Machine Telemetry Exported',
      `Exported real-time machine telemetry dataset for ${machine.name}.`,
      {
        duration: 4500,
        fileDetails: {
          filename: fileName,
          format: 'JSON'
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Machine Selector & Metadata Ribbon */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          
          {/* Machine Tab Switcher */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {machines.map((m) => {
              const isSelected = m.id === machine.id;
              const crit = m.healthState === 'Action Required';
              const adv = m.healthState === 'Advisory';

              return (
                <button
                  key={m.id}
                  onClick={() => onSelectMachineId(m.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-600 shadow-md ring-1 ring-cyan-500/50'
                      : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    crit ? 'bg-rose-500 animate-ping' : adv ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  <span>{m.name}</span>
                </button>
              );
            })}
          </div>

          {/* Machine Health State Badge */}
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              isCritical
                ? 'bg-rose-950 text-rose-200 border-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse'
                : isAdvisory
                ? 'bg-amber-950 text-amber-300 border-amber-700'
                : isPostMaint
                ? 'bg-blue-950 text-blue-300 border-blue-700'
                : 'bg-emerald-950 text-emerald-300 border-emerald-700'
            }`}>
              {isCritical ? '🚨 ACTION REQUIRED (FAULT TRIP)' : machine.healthState}
            </span>

            {isCritical && (
              <button
                onClick={() => audioAlarmManager.acknowledgeAlarm()}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold transition-all shadow-md"
              >
                Silence Alarm (ACK)
              </button>
            )}

            {onOpenDetailModal && (
              <>
                <button
                  onClick={() => onOpenDetailModal(machine, 'qr-code')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/80 text-xs font-mono font-bold transition-all shadow-sm"
                  title="Generate Mobile Quick-Jump QR Code for this machine"
                >
                  <QrCode className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Mobile QR Code</span>
                  <span className="sm:hidden">QR</span>
                </button>

                <button
                  onClick={() => onOpenDetailModal(machine, 'history')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-mono font-bold transition-all shadow-sm"
                  title="Open Health History & Maintenance Interventions Audit Modal"
                >
                  <History className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Audit & History Modal</span>
                  <span className="sm:hidden">History</span>
                </button>
              </>
            )}
          </div>

        </div>

        {/* Machine Technical Specifications Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 text-xs font-mono">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Model & Axis</span>
            <strong className="text-slate-200 font-bold">{machine.model}</strong>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Physical Location</span>
            <strong className="text-slate-200 font-bold">{machine.location}</strong>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Remaining Life (RUL)</span>
            <strong className={`font-bold ${machine.rulMetrics.estimatedHoursRemaining < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {machine.rulMetrics.estimatedHoursRemaining} hrs
            </strong>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Overall OEE</span>
            <strong className="text-cyan-400 font-bold">{machine.oeeMetrics.overallOee}%</strong>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Health Index</span>
            <strong className={`font-bold ${machine.rulMetrics.healthIndex < 50 ? 'text-rose-400' : 'text-slate-200'}`}>
              {machine.rulMetrics.healthIndex}%
            </strong>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Intervention Due</span>
            <strong className="text-slate-200 font-bold">{machine.rulMetrics.recommendedInterventionDate}</strong>
          </div>
        </div>

        {/* Post-Maintenance Timer (if in recovery) */}
        {isPostMaint && (
          <div className="mt-4 p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl">
            <div className="flex justify-between text-xs font-mono text-blue-300 mb-1.5 font-bold">
              <span className="flex items-center gap-1.5">
                <Wrench className="h-4 w-4" />
                Post-Maintenance Thermal & Bearing Stabilization
              </span>
              <span>{machine.recoveryTicks} / 15 Seconds</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (machine.recoveryTicks / 15) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Service Worker Cache Strategy & Plant Connectivity Ribbon */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  cacheReport.activeNetworkMode === 'offline'
                    ? 'bg-rose-500'
                    : cacheReport.activeNetworkMode === 'intermittent'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-emerald-400 animate-pulse'
                }`}
              />
              <span className="font-bold text-slate-200">
                {cacheReport.activeNetworkMode === 'offline'
                  ? 'Plant Network Offline (SW Cache Active)'
                  : cacheReport.activeNetworkMode === 'intermittent'
                  ? 'Intermittent Loss (Serving Cached API Assets)'
                  : 'Deterministic Bus (Live Stream)'}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-slate-400 border-l border-slate-800 pl-3">
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              <span>
                SW Cache: <strong className="text-slate-300 font-bold">{cacheReport.cacheStorageName}</strong> ({cacheReport.totalCachedMachines || 4} Assets)
              </span>
            </div>
          </div>

          {/* Connectivity Loss Testing Controls & Force Sync */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider hidden lg:inline">
              Simulate Network:
            </span>
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
              <button
                onClick={() => machineCacheService.setNetworkMode('normal')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  cacheReport.activeNetworkMode === 'normal'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Normal real-time telemetry stream"
              >
                Live
              </button>
              <button
                onClick={() => machineCacheService.setNetworkMode('intermittent')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  cacheReport.activeNetworkMode === 'intermittent'
                    ? 'bg-amber-950 text-amber-300 border border-amber-700/80'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Simulate 70% packet drop and 2s latency to trigger Service Worker NetworkFirst fallback"
              >
                Intermittent Loss
              </button>
              <button
                onClick={() => machineCacheService.setNetworkMode('offline')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  cacheReport.activeNetworkMode === 'offline'
                    ? 'bg-rose-950 text-rose-300 border border-rose-700/80'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Simulate 100% network disconnection"
              >
                Offline
              </button>
            </div>

            <button
              onClick={handleForceCacheSync}
              disabled={isSyncingCache}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-bold transition-all flex items-center gap-1.5"
              title="Force immediate cache update into Service Worker CacheStorage"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncingCache ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Sync Cache</span>
            </button>
          </div>
        </div>

      </div>

      {/* Fallback Banner When Intermittent Connectivity or Offline is Active */}
      {cacheReport.isServingFromCache && (
        <div className="p-4 rounded-2xl bg-amber-950/70 border border-amber-500/70 text-amber-200 text-xs font-mono shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-900/60 border border-amber-600 text-amber-300">
              <WifiOff className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="font-bold flex items-center gap-2 text-amber-100 text-sm">
                <span>SERVICE WORKER ASSET CACHE ENGAGED</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900 border border-amber-600 font-bold">
                  NetworkFirst Fallback Active
                </span>
              </div>
              <p className="text-amber-300/90 text-xs mt-0.5">
                Plant floor network degraded. The MachineDeepDive view is serving cached API assets from CacheStorage (<code className="text-amber-100">prism-machine-api-cache</code>). Spindle vibration spectra, schematics, and health indices remain 100% operational.
              </p>
            </div>
          </div>

          <button
            onClick={() => machineCacheService.setNetworkMode('normal')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors whitespace-nowrap self-start sm:self-center"
          >
            Restore Live Feed
          </button>
        </div>
      )}

      {/* Deep Dive Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('schematic')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'schematic'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/80 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>{trans.machine.schematic}</span>
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'telemetry'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/80 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>{trans.machine.telemetry}</span>
        </button>

        <button
          onClick={() => setActiveTab('vibration')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'vibration'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/80 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Gauge className="h-4 w-4" />
          <span>{trans.machine.fftSpectrum}</span>
        </button>

        <button
          onClick={() => setActiveTab('plc')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'plc'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/80 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>{trans.machine.plcSignals}</span>
        </button>

        <button
          onClick={() => setActiveTab('rul')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'rul'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/80 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>{trans.machine.rulRemaining}</span>
        </button>

        <button
          onClick={() => setActiveTab('xai')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'xai'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/80 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>{trans.machine.xaiDiagnostics}</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/80 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <History className="h-4 w-4" />
          <span>{trans.machine.historyLog}</span>
        </button>
      </div>

      {/* Tab 1: Physical Schematic Mimic */}
      {activeTab === 'schematic' && (
        <MachineSchematic machine={machine} />
      )}

      {/* Tab 2: Sensor Trends */}
      {activeTab === 'telemetry' && (
        <SensorTrends machine={machine} />
      )}

      {/* Tab 3: Vibration FFT Spectrum Analyzer */}
      {activeTab === 'vibration' && (
        <VibrationSpectrumViewer machine={machine} />
      )}

      {/* Tab 4: PLC Digital & Analog I/O Matrix */}
      {activeTab === 'plc' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                PLC Digital / Analog Fieldbus I/O Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time edge controller channels, safety loops, and variable frequency drive inverter status
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-800">
              Fieldbus: PROFINET / EtherCAT Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {machine.plcChannels.map((ch) => {
              const isTripped = ch.state === 'tripped';
              const isWarning = ch.state === 'warning';

              return (
                <div
                  key={ch.tag}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    isTripped
                      ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                      : isWarning
                      ? 'bg-amber-950/30 border-amber-800 text-amber-200'
                      : 'bg-slate-950/70 border-slate-800 text-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                        {ch.type}
                      </span>
                      <strong className="text-xs font-mono">{ch.tag}</strong>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{ch.label}</p>
                  </div>

                  <div className="text-right">
                    <span className={`text-sm font-mono font-black ${
                      isTripped ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {typeof ch.value === 'boolean'
                        ? ch.value
                          ? 'HIGH / CLOSED'
                          : 'LOW / TRIPPED'
                        : `${ch.value} ${ch.unit || ''}`}
                    </span>
                    <span className={`block text-[10px] uppercase font-mono mt-0.5 ${
                      isTripped ? 'text-rose-400 font-bold' : 'text-slate-500'
                    }`}>
                      {ch.state}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: Remaining Useful Life & Predictive Health */}
      {activeTab === 'rul' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                Predictive Degradation & Remaining Useful Life (RUL)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Weibull hazard estimation and MTBF calculation from continuous stress telemetry
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
              Confidence Interval: 95%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 font-mono">Projected Time to Failure</span>
              <p className={`text-2xl font-mono font-black ${
                machine.rulMetrics.estimatedHoursRemaining < 50 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {machine.rulMetrics.estimatedHoursRemaining} <span className="text-xs text-slate-400">Hours</span>
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Bounds: [{machine.rulMetrics.confidenceLowerHours}h – {machine.rulMetrics.confidenceUpperHours}h]
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 font-mono">Current Degradation Rate</span>
              <p className="text-2xl font-mono font-black text-cyan-400">
                {machine.rulMetrics.degradationRatePerHour} <span className="text-xs text-slate-400">%/hr</span>
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Baseline Normal: 0.06%/hr
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 font-mono">Recommended Maintenance Date</span>
              <p className="text-xl font-mono font-bold text-amber-300">
                {machine.rulMetrics.recommendedInterventionDate}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Preventive Spindle Bearing Service
              </p>
            </div>
          </div>

          {/* OEE Breakdown Strip */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-mono font-bold text-slate-300 mb-3 uppercase">
              Overall Equipment Effectiveness (OEE) Component Breakdown
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Availability:</span>
                <strong className="text-base text-slate-100">{machine.oeeMetrics.availability}%</strong>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Performance:</span>
                <strong className="text-base text-slate-100">{machine.oeeMetrics.performance}%</strong>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Quality Rate:</span>
                <strong className="text-base text-slate-100">{machine.oeeMetrics.quality}%</strong>
              </div>
              <div className="p-3 bg-cyan-950/60 rounded-lg border border-cyan-800">
                <span className="text-cyan-400 block">Total OEE:</span>
                <strong className="text-base text-cyan-300">{machine.oeeMetrics.overallOee}%</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Explainable AI & Interactive SOP Checklist */}
      {activeTab === 'xai' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                Explainable AI Diagnostic Reasoning & Standard Operating Procedures (SOP)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Physics-informed machine learning diagnostics with interactive step-by-step resolution checklist
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-3 py-1 rounded-full border border-cyan-800">
              Confidence Score: {machine.xaiExplanation.confidenceScore}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Assessment Summary</span>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">{machine.xaiExplanation.summary}</p>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Diagnostic Root Cause</span>
                <p className="text-xs font-bold text-cyan-300 mt-1">{machine.xaiExplanation.primaryCause}</p>
              </div>
            </div>

            {/* Contributing Sensors SHAP Waterfall */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                Sensor Capacity & Threshold Attribution
              </span>
              <div className="space-y-2">
                {machine.xaiExplanation.contributingSensors.slice(0, 3).map((sensor) => (
                  <div key={sensor.sensorName} className="text-xs font-mono">
                    <div className="flex justify-between text-slate-300 mb-0.5">
                      <span>{sensor.sensorName}</span>
                      <strong className={sensor.status === 'Critical' ? 'text-rose-400' : 'text-slate-200'}>
                        {sensor.value} {sensor.unit} ({sensor.percentageOfThreshold}%)
                      </strong>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          sensor.status === 'Critical' ? 'bg-rose-500' :
                          sensor.status === 'Warning' ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, sensor.percentageOfThreshold)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive SOP Maintenance Checklist */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-mono font-bold text-slate-300 mb-3 uppercase flex items-center justify-between">
              <span>Standard Operating Procedure (SOP) Action Checklist</span>
              <span className="text-[10px] text-slate-500 font-normal">Check off completed procedures</span>
            </h4>

            <div className="space-y-2">
              {machine.xaiExplanation.recommendedActions.map((action, idx) => {
                const stepKey = `${machine.id}-step-${idx}`;
                const isDone = !!completedSteps[stepKey];

                return (
                  <div
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                      isDone
                        ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300 line-through opacity-80'
                        : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs leading-relaxed font-medium">{action}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Health History & Maintenance Interventions */}
      {activeTab === 'history' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl">
          <MachineHistoryLog machine={machine} />
        </div>
      )}

      {/* Industrial Machine Operator Action Command Console */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
          Industrial Machine Operator Commands & Injection Console
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          
          {/* Inject Critical Fault */}
          <button
            onClick={() => simulationManager.triggerMachineFaultTest(machine.id)}
            className="p-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            title="Inject anomalous stress & trigger loud action-required acoustic alarm"
          >
            <Zap className="h-4 w-4 text-rose-400" />
            <span>Inject Critical Fault</span>
          </button>

          {/* Force Maintenance */}
          <button
            onClick={() => simulationManager.forceMachineMaintenance(machine.id)}
            className="p-3 rounded-xl bg-blue-950/80 hover:bg-blue-900 text-blue-200 border border-blue-800 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            title="Initiate 15s post-maintenance calibration stabilization"
          >
            <Wrench className="h-4 w-4 text-blue-400" />
            <span>Force Maintenance</span>
          </button>

          {/* Reset Baseline */}
          <button
            onClick={() => simulationManager.resetMachineSensors(machine.id)}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2"
            title="Reset telemetry sensors to factory baseline"
          >
            <RefreshCw className="h-4 w-4 text-slate-400" />
            <span>Reset Baseline</span>
          </button>

          {/* Test Alarm Sound */}
          <button
            onClick={() => audioAlarmManager.playTestBeep()}
            className="p-3 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border border-cyan-800 text-xs font-bold transition-all flex items-center justify-center gap-2"
            title="Test current acoustic alarm pattern"
          >
            <Volume2 className="h-4 w-4 text-cyan-400" />
            <span>Test Audio Alarm</span>
          </button>

          {/* Export JSON Report */}
          <button
            onClick={handleExportJSON}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2"
            title="Download full calibration and telemetry log"
          >
            <Download className="h-4 w-4 text-slate-400" />
            <span>Export Report</span>
          </button>

        </div>
      </div>

    </div>
  );
};
