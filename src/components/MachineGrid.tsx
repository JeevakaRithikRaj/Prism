import React, { useState, useEffect } from 'react';
import { MachineCard } from './MachineCard';
import { MachineState } from '../types';
import {
  floorLayoutManager,
  MachineLayoutConfig,
  FloorLayoutPreset
} from '../managers/FloorLayoutManager';
import { toastManager } from '../managers/ToastManager';
import { useI18n } from '../i18n/i18nContext';
import {
  LayoutGrid,
  Move,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Check,
  Compass,
  ArrowRight,
  Info,
  CheckCircle2,
  Scan
} from 'lucide-react';

interface MachineGridProps {
  machines: MachineState[];
  onSelectMachine: (machine: MachineState) => void;
  onOpenDetail?: (
    machine: MachineState,
    initialTab?: 'schematic' | 'telemetry' | 'vibration' | 'plc' | 'xai' | 'history' | 'calendar' | 'qr-code'
  ) => void;
  isCustomizing?: boolean;
  onToggleCustomizing?: () => void;
  onOpenQRScanner?: () => void;
}

export const MachineGrid: React.FC<MachineGridProps> = ({
  machines,
  onSelectMachine,
  onOpenDetail,
  isCustomizing: controlledCustomizing,
  onToggleCustomizing: controlledToggleCustomizing,
  onOpenQRScanner
}) => {
  const { trans } = useI18n();
  const [internalCustomizing, setInternalCustomizing] = useState<boolean>(false);
  const isCustomizing = controlledCustomizing !== undefined ? controlledCustomizing : internalCustomizing;
  const toggleCustomizing = () => {
    if (controlledToggleCustomizing) {
      controlledToggleCustomizing();
    } else {
      setInternalCustomizing(prev => !prev);
    }
  };

  const [layout, setLayout] = useState<MachineLayoutConfig[]>(() => floorLayoutManager.getLayout());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Subscribe to floor layout updates
  useEffect(() => {
    const unsubscribe = floorLayoutManager.subscribe((newLayout) => {
      setLayout(newLayout);
    });
    return () => unsubscribe();
  }, []);

  // Map layout configs to machine states
  const orderedMachines: Array<{ machine: MachineState; config: MachineLayoutConfig }> = layout
    .map(cfg => {
      const match = machines.find(m => m.id === cfg.id);
      return match ? { machine: match, config: cfg } : null;
    })
    .filter((item): item is { machine: MachineState; config: MachineLayoutConfig } => item !== null);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (!isCustomizing) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (!isCustomizing || draggedIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (_e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    if (!isCustomizing || draggedIndex === null) return;
    e.preventDefault();

    if (draggedIndex !== targetIndex) {
      floorLayoutManager.reorder(draggedIndex, targetIndex);
      toastManager.info('Floor Position Updated', `Machine moved to Station #${targetIndex + 1}.`, {
        duration: 2500
      });
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleToggleColSpan = (machineId: string, currentColSpan: 1 | 2) => {
    const nextSpan = currentColSpan === 1 ? 2 : 1;
    floorLayoutManager.setColSpan(machineId, nextSpan);
    toastManager.info('Card Size Adjusted', `Changed to ${nextSpan === 2 ? '2x Full Width' : '1x Half Width'}.`, {
      duration: 2500
    });
  };

  const handlePresetSelect = (preset: FloorLayoutPreset) => {
    floorLayoutManager.applyPreset(preset);
    const presetNames: Record<FloorLayoutPreset, string> = {
      'standard-2x2': 'Standard 2x2 Cell Layout',
      'linear-flow': 'Linear Production Flow (Infeed → Outfeed)',
      'heavy-milling-focus': 'Heavy 5-Axis Milling Focus (2x Wide)',
      'dual-wide': 'Dual-Wide Staged Assembly Layout'
    };
    toastManager.success('Preset Layout Applied', presetNames[preset], { duration: 3000 });
  };

  const handleResetLayout = () => {
    floorLayoutManager.resetToDefault();
    toastManager.info('Layout Reset', 'Factory floor layout restored to default 2x2 configuration.');
  };

  return (
    <div className="space-y-4">
      
      {/* Floor Layout Management Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-cyan-400" />
              <span>Plant Floor Layout &amp; Machinery Grid</span>
            </h3>
            {isCustomizing && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 border border-cyan-500/80 text-cyan-300 animate-pulse">
                {trans.overview.editModeActive}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {isCustomizing
              ? 'Drag machine cards to reposition along physical flow line. Toggle 1x / 2x to resize.'
              : 'Physical machine layout arranged according to plant floor station sequencing.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isCustomizing ? (
            <>
              {/* Presets Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-slate-400 hidden lg:inline">{trans.overview.presets}:</span>
                <select
                  aria-label="Floor Layout Presets"
                  onChange={(e) => handlePresetSelect(e.target.value as FloorLayoutPreset)}
                  className="bg-slate-950 text-slate-200 text-xs font-mono rounded-xl px-2.5 py-1.5 border border-slate-700 outline-none focus:border-cyan-500"
                  defaultValue=""
                >
                  <option value="" disabled>Select Preset...</option>
                  <option value="standard-2x2">Standard 2x2 Cell</option>
                  <option value="linear-flow">Linear Process Flow (1 → 4)</option>
                  <option value="heavy-milling-focus">Heavy Milling Focus (2x CNC)</option>
                  <option value="dual-wide">Dual-Wide Staged Assembly</option>
                </select>
              </div>

              {/* Reset Layout */}
              <button
                type="button"
                onClick={handleResetLayout}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition-colors flex items-center gap-1"
                title={trans.overview.resetLayout}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{trans.overview.resetLayout}</span>
              </button>

              {/* Done Button */}
              <button
                type="button"
                onClick={toggleCustomizing}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-mono transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
              >
                <Check className="h-4 w-4" />
                <span>{trans.overview.saveLayout}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {onOpenQRScanner && (
                <button
                  type="button"
                  onClick={onOpenQRScanner}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/60 text-xs font-bold font-mono transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Open camera to scan equipment barcode or tag"
                >
                  <Scan className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{trans.nav.scanQR}</span>
                </button>
              )}
              <button
                type="button"
                onClick={toggleCustomizing}
                className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-cyan-950 text-cyan-300 border border-slate-800 hover:border-cyan-700/80 text-xs font-bold font-mono transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Customize positioning and sizing of machine cards on the plant floor"
              >
                <Move className="h-3.5 w-3.5 text-cyan-400" />
                <span>{trans.overview.customizeFloorLayout}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Customizable Drag-and-Drop Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {orderedMachines.map(({ machine, config }, index) => {
          const isCurrentDragging = draggedIndex === index;
          const isCurrentDragOver = dragOverIndex === index && draggedIndex !== index;

          return (
            <div
              key={machine.id}
              draggable={isCustomizing}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnter={(e) => handleDragOver(e, index)}
              onDragLeave={(e) => handleDragLeave(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`transition-all duration-200 relative ${
                config.colSpan === 2 ? 'col-span-1 md:col-span-2' : 'col-span-1'
              } ${isCustomizing ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              {/* Drop Target Visual Guide */}
              {isCurrentDragOver && (
                <div className="absolute inset-0 z-20 pointer-events-none rounded-2xl border-2 border-cyan-400 bg-cyan-500/10 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-100">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-400 text-cyan-300 font-mono text-xs font-bold flex items-center gap-1.5 shadow-xl">
                    <Move className="h-4 w-4 text-cyan-400 animate-bounce" />
                    <span>Drop into Station #{index + 1}</span>
                  </div>
                </div>
              )}

              <MachineCard
                machine={machine}
                onSelect={onSelectMachine}
                onOpenDetail={onOpenDetail}
                isCustomizing={isCustomizing}
                colSpan={config.colSpan}
                bayLabel={config.bayLabel}
                stationNumber={config.stationIndex}
                onToggleColSpan={() => handleToggleColSpan(machine.id, config.colSpan)}
                onMoveUp={() => {
                  if (index > 0) {
                    floorLayoutManager.reorder(index, index - 1);
                  }
                }}
                onMoveDown={() => {
                  if (index < orderedMachines.length - 1) {
                    floorLayoutManager.reorder(index, index + 1);
                  }
                }}
                canMoveUp={index > 0}
                canMoveDown={index < orderedMachines.length - 1}
                isDragging={isCurrentDragging}
              />
            </div>
          );
        })}
      </div>

    </div>
  );
};
