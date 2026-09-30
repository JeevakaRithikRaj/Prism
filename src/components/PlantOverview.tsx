import React, { useState } from 'react';
import { MachineState } from '../types';
import { MachineGrid } from './MachineGrid';
import { AlertsSidebar } from './AlertsSidebar';
import { PlantHealthTrendChart } from './PlantHealthTrendChart';
import { QRCodeScannerModal } from './QRCodeScannerModal';
import { Activity, ShieldCheck, AlertTriangle, ShieldAlert, Cpu, BarChart3, Clock, CheckCircle2, QrCode, Scan } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';

interface PlantOverviewProps {
  machines: MachineState[];
  onSelectMachine: (machine: MachineState) => void;
  onOpenDetail?: (
    machine: MachineState,
    initialTab?: 'schematic' | 'telemetry' | 'vibration' | 'plc' | 'xai' | 'history' | 'calendar' | 'qr-code'
  ) => void;
}

export const PlantOverview: React.FC<PlantOverviewProps> = ({ machines, onSelectMachine, onOpenDetail }) => {
  const { trans } = useI18n();
  const [showQRScanner, setShowQRScanner] = useState<boolean>(false);

  const normalCount = machines.filter(m => m.healthState === 'Normal').length;
  const advisoryCount = machines.filter(m => m.healthState === 'Advisory').length;
  const criticalCount = machines.filter(m => m.healthState === 'Action Required').length;
  const postMaintCount = machines.filter(m => m.healthState === 'Post-Maintenance').length;

  // Compute Plant-Wide Average OEE
  const avgOee = machines.length > 0
    ? Math.round((machines.reduce((acc, m) => acc + m.oeeMetrics.overallOee, 0) / machines.length) * 10) / 10
    : 88.5;
  const avgAvailability = machines.length > 0
    ? Math.round((machines.reduce((acc, m) => acc + m.oeeMetrics.availability, 0) / machines.length) * 10) / 10
    : 95.0;
  const totalPartsToday = machines.reduce((acc, m) => acc + m.oeeMetrics.partsProducedToday, 0);
  const totalDefects = machines.reduce((acc, m) => acc + m.oeeMetrics.defectCount, 0);

  return (
    <div className="space-y-6">
      
      {/* Plant Line Summary KPI Ribbon */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-100 tracking-tight uppercase">
              {trans.overview.title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {trans.overview.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowQRScanner(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 hover:border-cyan-400 text-cyan-300 hover:text-cyan-100 transition-all font-mono text-xs font-semibold shadow-lg shadow-cyan-950/40 group cursor-pointer"
              title="Scan physical equipment QR code with device camera to open machine details"
            >
              <QrCode className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>{trans.overview.scanEquipmentQR}</span>
            </button>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-400">● {normalCount} {trans.health.nominal}</span>
              <span className="text-amber-400">▲ {advisoryCount} {trans.health.advisory}</span>
              <span className={criticalCount > 0 ? 'text-rose-400 font-bold animate-pulse' : 'text-slate-500'}>
                ✖ {criticalCount} {trans.health.actionRequired}
              </span>
            </div>
          </div>
        </div>

        {/* 4 OEE & Line Telemetry Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs font-mono">
          
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-500 uppercase block">{trans.overview.lineAverageOee}</span>
            <p className="text-2xl font-bold font-mono text-cyan-400 mt-1 tabular-nums">
              {avgOee}%
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {trans.overview.availability}: {avgAvailability}%
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-500 uppercase block">{trans.overview.productionThroughput}</span>
            <p className="text-2xl font-bold font-mono text-slate-100 mt-1 tabular-nums">
              {totalPartsToday.toLocaleString()} <span className="text-xs text-slate-400">units</span>
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {trans.overview.cycleTime}: 42.5s avg
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-500 uppercase block">{trans.overview.totalDefectScrap}</span>
            <p className={`text-2xl font-bold font-mono mt-1 tabular-nums ${totalDefects > 10 ? 'text-rose-400' : 'text-slate-100'}`}>
              {totalDefects} <span className="text-xs text-slate-400">parts</span>
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {trans.overview.firstPassYield}: {Math.max(90, Math.round(((totalPartsToday - totalDefects) / (totalPartsToday || 1)) * 1000) / 10)}%
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-500 uppercase block">{trans.overview.safetyInterlocks}</span>
            <p className={`text-xl font-bold font-mono mt-1 ${criticalCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {criticalCount > 0 ? trans.health.tripActive : trans.health.allNominal}
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              ISO 13849 Performance Level d
            </span>
          </div>

        </div>
      </div>

      {/* 60-Minute Fleet Health Score Trends Data Visualization */}
      <PlantHealthTrendChart
        machines={machines}
        onSelectMachine={onSelectMachine}
      />

      {/* Main Grid & Side Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Machine Cards Grid with Drag-and-Drop Floor Customization */}
        <div className="lg:col-span-2 space-y-4">
          <MachineGrid
            machines={machines}
            onSelectMachine={onSelectMachine}
            onOpenDetail={onOpenDetail}
            onOpenQRScanner={() => setShowQRScanner(true)}
          />
        </div>

        {/* Sidebar: Industrial Alerts & Quick Test Toolbox */}
        <div>
          <AlertsSidebar
            machines={machines}
            onSelectMachine={onSelectMachine}
          />
        </div>

      </div>

      {/* Optical QR Code Equipment Scanner Modal */}
      <QRCodeScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        machines={machines}
        onOpenDetail={(machine, initialTab) => {
          if (onOpenDetail) {
            onOpenDetail(machine, initialTab || 'schematic');
          } else {
            onSelectMachine(machine);
          }
        }}
      />

    </div>
  );
};
