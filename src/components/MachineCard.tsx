import React from 'react';
import {
  Cpu,
  Droplets,
  Activity,
  Wind,
  Wrench,
  ChevronRight,
  BarChart2,
  ShieldAlert,
  Zap,
  RefreshCw,
  Volume2,
  History,
  QrCode,
  GripVertical,
  Maximize2,
  Minimize2,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { MachineState, Scenario } from '../types';
import { simulationManager } from '../managers/SimulationManager';
import { useI18n } from '../i18n/i18nContext';

interface MachineCardProps {
  machine: MachineState;
  onSelect: (machine: MachineState) => void;
  onOpenDetail?: (
    machine: MachineState,
    initialTab?: 'schematic' | 'telemetry' | 'vibration' | 'plc' | 'xai' | 'history' | 'calendar' | 'qr-code'
  ) => void;
  isCustomizing?: boolean;
  colSpan?: 1 | 2;
  bayLabel?: string;
  stationNumber?: number;
  onToggleColSpan?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  isDragging?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Cpu,
  Droplets,
  Activity,
  Wind,
};

export const MachineCard: React.FC<MachineCardProps> = ({
  machine,
  onSelect,
  onOpenDetail,
  isCustomizing = false,
  colSpan = 1,
  bayLabel,
  stationNumber,
  onToggleColSpan,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  isDragging = false
}) => {
  const { trans } = useI18n();
  const IconComponent =
    ICON_MAP[
      machine.id === 'cnc-milling-machine'
        ? 'Cpu'
        : machine.id === 'industrial-cooling-pump'
        ? 'Droplets'
        : machine.id === 'conveyor-drive-motor'
        ? 'Activity'
        : 'Wind'
    ] || Cpu;

  const isCritical = machine.healthState === 'Action Required';
  const isAdvisory = machine.healthState === 'Advisory';
  const isPostMaint = machine.healthState === 'Post-Maintenance';

  let cardBorder = 'border-slate-800 hover:border-slate-700 bg-slate-900/90 shadow-xl';
  let statusText = 'text-emerald-400';
  let statusGlyph = `● ${trans.health.nominal.toUpperCase()}`;

  if (isCritical) {
    cardBorder = 'border-rose-600/80 bg-slate-900/95 shadow-[0_0_25px_rgba(225,29,72,0.25)] ring-1 ring-rose-500/50';
    statusText = 'text-rose-400 font-bold';
    statusGlyph = `✖ ${trans.health.actionRequired.toUpperCase()}`;
  } else if (isAdvisory) {
    cardBorder = 'border-amber-700/60 bg-slate-900/90 shadow-[0_0_15px_rgba(245,158,11,0.15)]';
    statusText = 'text-amber-400 font-bold';
    statusGlyph = `▲ ${trans.health.advisory.toUpperCase()}`;
  } else if (isPostMaint) {
    cardBorder = 'border-blue-700/60 bg-slate-900/90 shadow-[0_0_15px_rgba(59,130,246,0.15)]';
    statusText = 'text-blue-400 font-bold';
    statusGlyph = `⟳ ${trans.health.recovery.toUpperCase()}`;
  }

  const { temperature, vibration, torque, rotational_speed, tool_wear } = machine.currentReadings;

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 p-5 flex flex-col justify-between group relative overflow-hidden ${
        colSpan === 2 ? 'col-span-1 md:col-span-2' : 'col-span-1'
      } ${isDragging ? 'opacity-40 scale-[0.98] border-cyan-400 border-dashed ring-2 ring-cyan-500/50' : ''} ${cardBorder}`}
    >
      
      {/* Top Ambient Highlight */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        isCritical ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 animate-pulse' :
        isAdvisory ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500' :
        isPostMaint ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500' :
        'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500'
      }`} />

      {/* Customization Toolbar & Drag Handle when Floor Layout Edit is active */}
      {isCustomizing && (
        <div className="mb-3.5 pb-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono bg-slate-950/80 -mx-5 -mt-5 p-3 px-5 border-b border-cyan-900/50">
          <div className="flex items-center gap-2 text-cyan-400 font-bold select-none cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-cyan-400 animate-pulse" />
            <span className="text-[11px] tracking-wide uppercase font-bold text-slate-200">
              {trans.overview.station} #{stationNumber || 1}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] text-cyan-400 font-normal hidden sm:inline">
              {trans.overview.dragToReposition}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Size Toggle (1x vs 2x) */}
            {onToggleColSpan && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleColSpan();
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 border ${
                  colSpan === 2
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-bold'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
                title={colSpan === 2 ? 'Card is Wide (2 Columns). Click for Standard (1 Column).' : 'Card is Standard (1 Column). Click to expand to Full Width.'}
              >
                {colSpan === 2 ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                <span>{colSpan === 2 ? trans.overview.cardSizeWide : trans.overview.cardSizeHalf}</span>
              </button>
            )}

            {/* Quick Reorder Arrow Buttons */}
            <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5">
              <button
                type="button"
                disabled={!canMoveUp}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp?.();
                }}
                className={`p-1 rounded text-slate-300 transition-colors ${
                  !canMoveUp ? 'opacity-25 cursor-not-allowed' : 'hover:bg-slate-800 hover:text-cyan-400'
                }`}
                title="Move station earlier in sequence"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={!canMoveDown}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown?.();
                }}
                className={`p-1 rounded text-slate-300 transition-colors ${
                  !canMoveDown ? 'opacity-25 cursor-not-allowed' : 'hover:bg-slate-800 hover:text-cyan-400'
                }`}
                title="Move station later in sequence"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        {/* Card Header: Icon, Name, Unboxed Status Text */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center border transition-all ${
              isCritical
                ? 'bg-rose-950/80 border-rose-700 text-rose-400'
                : 'bg-slate-950 border-slate-800 text-cyan-400 group-hover:border-cyan-500/50'
            }`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base leading-tight group-hover:text-cyan-300 transition-colors">
                  {machine.name}
                </h3>
                {colSpan === 2 && (
                  <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-400">
                    WIDE 2X
                  </span>
                )}
              </div>
              {/* Zero-Pill Unboxed Metadata with · separator */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5">
                <span>{machine.model}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-cyan-400/90 font-medium">{bayLabel || machine.location}</span>
                {stationNumber && (
                  <>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-500">Stn #{stationNumber}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status Text & QR Quick Jump Button */}
          <div className="flex items-center gap-2">
            {onOpenDetail && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetail(machine, 'qr-code');
                }}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-600/70 text-slate-400 hover:text-cyan-300 transition-colors"
                title={`Generate Mobile QR Code for ${machine.name}`}
              >
                <QrCode className="h-4 w-4" />
              </button>
            )}
            <div className="text-right">
              <span className={`text-xs font-mono tracking-wider ${statusText} flex items-center gap-1 justify-end`}>
                <span>{statusGlyph}</span>
                {isCritical && <Volume2 className="h-3.5 w-3.5 text-rose-400 animate-bounce" />}
              </span>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                RUL: {machine.rulMetrics.estimatedHoursRemaining}h
              </span>
            </div>
          </div>
        </div>

        {/* Post-Maintenance Recovery Timer */}
        {isPostMaint && (
          <div className="mb-4 bg-blue-950/30 border border-blue-800/40 rounded-xl p-3">
            <div className="flex justify-between text-xs text-blue-300 mb-1.5 font-mono">
              <span className="flex items-center gap-1">
                <Wrench className="h-3.5 w-3.5" />
                Stabilization Window
              </span>
              <span>{machine.recoveryTicks} / 15 s</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (machine.recoveryTicks / 15) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Primary Sensor Readouts */}
        <div className="grid grid-cols-3 gap-2.5 my-3.5">
          
          {/* Temperature */}
          <div className="rounded-xl p-2.5 bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] uppercase font-mono text-slate-400">Temp</span>
            <p className="text-sm font-black font-mono tabular-nums mt-0.5 flex items-baseline justify-between">
              <span className={temperature >= 310 ? 'text-rose-400' : temperature >= 306 ? 'text-amber-400' : 'text-slate-100'}>
                {temperature}
              </span>
              <span className="text-[10px] text-slate-500 font-normal">K</span>
            </p>
            <div className="w-full bg-slate-800/80 rounded-full h-1 mt-1.5 overflow-hidden">
              <div
                className={`h-1 rounded-full ${temperature >= 310 ? 'bg-rose-500' : temperature >= 306 ? 'bg-amber-400' : 'bg-cyan-400'}`}
                style={{ width: `${Math.min(100, (temperature / 310) * 100)}%` }}
              />
            </div>
          </div>

          {/* Vibration */}
          <div className="rounded-xl p-2.5 bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] uppercase font-mono text-slate-400">Vibration</span>
            <p className="text-sm font-black font-mono tabular-nums mt-0.5 flex items-baseline justify-between">
              <span className={vibration >= 100 ? 'text-rose-400' : vibration >= 90 ? 'text-amber-400' : 'text-slate-100'}>
                {vibration}
              </span>
              <span className="text-[10px] text-slate-500 font-normal">μm</span>
            </p>
            <div className="w-full bg-slate-800/80 rounded-full h-1 mt-1.5 overflow-hidden">
              <div
                className={`h-1 rounded-full ${vibration >= 100 ? 'bg-rose-500' : vibration >= 90 ? 'bg-amber-400' : 'bg-purple-400'}`}
                style={{ width: `${Math.min(100, (vibration / 100) * 100)}%` }}
              />
            </div>
          </div>

          {/* Torque */}
          <div className="rounded-xl p-2.5 bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] uppercase font-mono text-slate-400">Torque</span>
            <p className="text-sm font-black font-mono tabular-nums mt-0.5 flex items-baseline justify-between">
              <span className={torque >= 50 ? 'text-rose-400' : torque >= 45 ? 'text-amber-400' : 'text-slate-100'}>
                {torque}
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Nm</span>
            </p>
            <div className="w-full bg-slate-800/80 rounded-full h-1 mt-1.5 overflow-hidden">
              <div
                className={`h-1 rounded-full ${torque >= 50 ? 'bg-rose-500' : torque >= 45 ? 'bg-amber-400' : 'bg-yellow-400'}`}
                style={{ width: `${Math.min(100, (torque / 50) * 100)}%` }}
              />
            </div>
          </div>

        </div>

        {/* Secondary Telemetry Strip */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-2 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800/60 font-mono mb-3">
          <span>Speed: <strong className="text-slate-200 tabular-nums">{rotational_speed} rpm</strong></span>
          <span>Wear: <strong className="text-slate-200 tabular-nums">{tool_wear} min</strong></span>
          <span>OEE: <strong className="text-cyan-400 tabular-nums">{machine.oeeMetrics.overallOee}%</strong></span>
        </div>
      </div>

      {/* Card Footer: Interactive Mode Select & Machine Monitor Trigger */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2.5">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-mono">Profile:</span>
            <select
              aria-label={`Scenario mode for ${machine.name}`}
              value={machine.scenario}
              onChange={(e) => simulationManager.setMachineScenario(machine.id, e.target.value as Scenario)}
              className="bg-slate-950 text-slate-200 text-xs font-mono rounded-lg px-2.5 py-1 border border-slate-800 focus:outline-none focus:border-cyan-500"
            >
              <option value="Normal">{trans.scenario.normal}</option>
              <option value="Advisory">{trans.scenario.advisory}</option>
              <option value="Action Required">{trans.scenario.actionRequired}</option>
              <option value="Post-Maintenance">{trans.scenario.postMaintenance}</option>
            </select>
          </div>

          <button
            onClick={() => onSelect(machine)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-bold transition-all group-hover:border-cyan-500 cursor-pointer"
          >
            <BarChart2 className="h-3.5 w-3.5 text-cyan-400" />
            <span>{trans.machine.monitorView}</span>
            <ChevronRight className="h-3.5 w-3.5 text-cyan-400 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Quick Action Button Row */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => simulationManager.triggerMachineFaultTest(machine.id)}
            className="py-1 px-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-900/80 text-[10px] font-mono font-bold transition-all flex items-center justify-center gap-1"
            title="Trigger critical fault anomaly & alarm"
          >
            <Zap className="h-3 w-3 text-rose-400" />
            <span className="truncate">Fault</span>
          </button>

          <button
            onClick={() => simulationManager.forceMachineMaintenance(machine.id)}
            className="py-1 px-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900 text-blue-300 border border-blue-900/80 text-[10px] font-mono font-bold transition-all flex items-center justify-center gap-1"
            title="Force maintenance recovery"
          >
            <Wrench className="h-3 w-3 text-blue-400" />
            <span className="truncate">Maint</span>
          </button>

          <button
            onClick={() => simulationManager.resetMachineSensors(machine.id)}
            className="py-1 px-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-mono font-bold transition-all flex items-center justify-center gap-1"
            title="Reset to factory baseline"
          >
            <RefreshCw className="h-3 w-3 text-slate-400" />
            <span className="truncate">Reset</span>
          </button>

          <button
            onClick={() => onOpenDetail ? onOpenDetail(machine, 'history') : onSelect(machine)}
            className="py-1 px-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-[10px] font-mono font-bold transition-all flex items-center justify-center gap-1"
            title="Open Machine History & Maintenance Log"
          >
            <History className="h-3 w-3 text-cyan-400" />
            <span className="truncate">History</span>
          </button>
        </div>

      </div>

    </div>
  );
};
