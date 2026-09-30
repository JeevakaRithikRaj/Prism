import React, { useRef, useState, useEffect } from 'react';
import {
  MachineState,
  HealthState,
  MachineHistoryLogEntry
} from '../types';
import { historyLogManager } from '../managers/HistoryLogManager';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Wrench,
  RefreshCw,
  ArrowRight,
  Clock,
  ChevronLeft,
  ChevronRight,
  Activity,
  Zap,
  Info,
  SlidersHorizontal,
  X
} from 'lucide-react';

interface MachineStatusTimelineProps {
  machine: MachineState;
  onSelectLogEntry?: (entry: MachineHistoryLogEntry) => void;
  onFilterState?: (state: HealthState | 'all') => void;
  selectedLogId?: string | null;
}

interface TimelineNode {
  id: string;
  state: HealthState;
  fromState?: HealthState;
  title: string;
  description: string;
  timestamp: string;
  dateTime: string;
  performedBy?: string;
  isCurrent?: boolean;
  isBaseline?: boolean;
  metricsSnapshot?: {
    temperature?: number;
    vibration?: number;
    torque?: number;
    rulHours?: number;
  };
  originalEntry?: MachineHistoryLogEntry;
}

const STATE_CONFIG: Record<
  HealthState,
  {
    label: string;
    badgeBg: string;
    badgeBorder: string;
    textColor: string;
    nodeBg: string;
    nodeBorder: string;
    dotColor: string;
    glowShadow: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  Normal: {
    label: 'Normal',
    badgeBg: 'bg-emerald-950/80',
    badgeBorder: 'border-emerald-600/70',
    textColor: 'text-emerald-400',
    nodeBg: 'bg-emerald-950',
    nodeBorder: 'border-emerald-500',
    dotColor: 'bg-emerald-400',
    glowShadow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]',
    icon: CheckCircle2
  },
  Advisory: {
    label: 'Advisory',
    badgeBg: 'bg-amber-950/80',
    badgeBorder: 'border-amber-600/70',
    textColor: 'text-amber-400',
    nodeBg: 'bg-amber-950',
    nodeBorder: 'border-amber-500',
    dotColor: 'bg-amber-400',
    glowShadow: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]',
    icon: AlertTriangle
  },
  'Action Required': {
    label: 'Action Required',
    badgeBg: 'bg-rose-950/80',
    badgeBorder: 'border-rose-600/70',
    textColor: 'text-rose-400',
    nodeBg: 'bg-rose-950',
    nodeBorder: 'border-rose-500',
    dotColor: 'bg-rose-400',
    glowShadow: 'shadow-[0_0_15px_rgba(244,63,94,0.45)]',
    icon: AlertOctagon
  },
  'Post-Maintenance': {
    label: 'Post-Maintenance',
    badgeBg: 'bg-blue-950/80',
    badgeBorder: 'border-blue-600/70',
    textColor: 'text-blue-400',
    nodeBg: 'bg-blue-950',
    nodeBorder: 'border-blue-500',
    dotColor: 'bg-blue-400',
    glowShadow: 'shadow-[0_0_12px_rgba(59,130,246,0.35)]',
    icon: RefreshCw
  }
};

export const MachineStatusTimeline: React.FC<MachineStatusTimelineProps> = ({
  machine,
  onSelectLogEntry,
  onFilterState,
  selectedLogId
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<TimelineNode | null>(null);
  const [viewDensity, setViewDensity] = useState<'compact' | 'detailed'>('compact');
  const [timelineNodes, setTimelineNodes] = useState<TimelineNode[]>([]);

  // Build chronological status transition nodes
  useEffect(() => {
    const computeTimeline = () => {
      const logs = historyLogManager.getLogsForMachine(machine.id);

      // Filter entries that represent status transitions
      // (either type 'health_change' or entries with distinct previous and new health states)
      const transitionLogs = logs
        .filter(
          (l) =>
            l.type === 'health_change' ||
            (l.previousHealthState &&
              l.newHealthState &&
              l.previousHealthState !== l.newHealthState)
        )
        // Sort chronologically: oldest first
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

      const nodes: TimelineNode[] = [];

      // 1. Initial Baseline Node (if transitions exist or baseline fallback)
      if (transitionLogs.length > 0) {
        const firstEntry = transitionLogs[0];
        const baselineState: HealthState = firstEntry.previousHealthState || 'Normal';
        const baselineDate = new Date(
          new Date(firstEntry.dateTime).getTime() - 4 * 60 * 60 * 1000
        );
        nodes.push({
          id: 'node-baseline-init',
          state: baselineState,
          title: `Initial Baseline: ${baselineState}`,
          description: `Machine commissioned in ${baselineState} operating state under nominal production parameters.`,
          timestamp: baselineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dateTime: baselineDate.toISOString().replace('T', ' ').substring(0, 19),
          performedBy: 'Factory Commissioning Suite',
          isBaseline: true
        });
      } else {
        // No prior transitions: create baseline
        const initTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
        nodes.push({
          id: 'node-baseline-default',
          state: 'Normal',
          title: 'Factory Commissioning Baseline',
          description: 'Factory baseline established. Telemetry channels calibrated and nominal.',
          timestamp: initTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dateTime: initTime.toISOString().replace('T', ' ').substring(0, 19),
          performedBy: 'Quality Assurance Bureau',
          isBaseline: true
        });
      }

      // 2. Historical Transition Nodes
      transitionLogs.forEach((entry) => {
        const targetState: HealthState = entry.newHealthState || 'Normal';
        nodes.push({
          id: entry.id,
          state: targetState,
          fromState: entry.previousHealthState,
          title: entry.title,
          description: entry.description,
          timestamp: entry.timestamp,
          dateTime: entry.dateTime,
          performedBy: entry.performedBy,
          metricsSnapshot: entry.metricsSnapshot,
          originalEntry: entry
        });
      });

      // 3. Current Live Status Node
      const lastNode = nodes[nodes.length - 1];
      // Only append live node if the machine's current state differs or if it's the live representation
      const isAlreadyCurrent =
        lastNode &&
        lastNode.state === machine.healthState &&
        !lastNode.isBaseline;

      if (!isAlreadyCurrent) {
        nodes.push({
          id: 'node-current-live',
          state: machine.healthState,
          fromState: lastNode ? lastNode.state : undefined,
          title: `Current Active State: ${machine.healthState}`,
          description: `Live operating condition monitored in real-time. Scenario: "${machine.scenario}".`,
          timestamp: 'NOW (Live)',
          dateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          performedBy: 'PRISM Real-time Supervisor',
          isCurrent: true,
          metricsSnapshot: {
            temperature: machine.currentReadings.temperature,
            vibration: machine.currentReadings.vibration,
            torque: machine.currentReadings.torque,
            rulHours: machine.rulMetrics?.estimatedHoursRemaining
          }
        });
      } else {
        // Mark the last node as the current active one
        lastNode.isCurrent = true;
      }

      setTimelineNodes(nodes);
    };

    computeTimeline();
    const unsubscribe = historyLogManager.subscribe(computeTimeline);
    return () => unsubscribe();
  }, [machine.id, machine.healthState, machine.scenario, machine.currentReadings, machine.rulMetrics]);

  // Scroll controls
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleScrollToEnd = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  };

  // Keep selected node in sync if selectedLogId passed from parent
  useEffect(() => {
    if (selectedLogId) {
      const found = timelineNodes.find((n) => n.id === selectedLogId);
      if (found) setSelectedNode(found);
    }
  }, [selectedLogId, timelineNodes]);

  const currentStateConfig = STATE_CONFIG[machine.healthState] || STATE_CONFIG.Normal;
  const CurrentIcon = currentStateConfig.icon;

  return (
    <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-3 sm:p-4 space-y-3 shadow-md relative overflow-hidden">
      {/* Decorative top ambient glow line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-75"
        style={{
          background:
            machine.healthState === 'Action Required'
              ? 'linear-gradient(90deg, transparent, #f43f5e, #fb7185, transparent)'
              : machine.healthState === 'Advisory'
              ? 'linear-gradient(90deg, transparent, #f59e0b, #fbbf24, transparent)'
              : machine.healthState === 'Post-Maintenance'
              ? 'linear-gradient(90deg, transparent, #3b82f6, #06b6d4, transparent)'
              : 'linear-gradient(90deg, transparent, #10b981, #06b6d4, transparent)'
        }}
      />

      {/* Timeline Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-cyan-400">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-mono font-bold tracking-wider text-slate-100 uppercase">
                Status Transition Timeline
              </h4>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold">
                {timelineNodes.length} nodes
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              Chronological state changes, automated trips, and recovery sequences
            </p>
          </div>
        </div>

        {/* Right side controls: Current badge, density toggle, scroll arrows */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Current Active Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${currentStateConfig.badgeBg} ${currentStateConfig.badgeBorder} ${currentStateConfig.textColor}`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentStateConfig.dotColor}`}
              />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${currentStateConfig.dotColor}`} />
            </span>
            <CurrentIcon className="h-3 w-3" />
            <span className="text-[11px]">{machine.healthState}</span>
          </div>

          {/* Density Mode Toggle */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px] font-mono">
            <button
              onClick={() => setViewDensity('compact')}
              className={`px-2 py-0.5 rounded transition-colors ${
                viewDensity === 'compact'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Compact timeline view"
            >
              Compact
            </button>
            <button
              onClick={() => setViewDensity('detailed')}
              className={`px-2 py-0.5 rounded transition-colors ${
                viewDensity === 'detailed'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Detailed cards timeline view"
            >
              Detailed
            </button>
          </div>

          {/* Scroll Navigation Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleScroll('left')}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-800 transition-colors"
              title="Scroll left"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-800 transition-colors"
              title="Scroll right"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleScrollToEnd}
              className="px-1.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 border border-slate-800 transition-colors"
              title="Jump to current state"
            >
              Latest ▶
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Timeline Track Container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto pb-3 pt-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/40 select-none"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="inline-flex items-center min-w-full px-2 py-1">
          {timelineNodes.map((node, index) => {
            const cfg = STATE_CONFIG[node.state] || STATE_CONFIG.Normal;
            const NodeIcon = cfg.icon;
            const isSelected = selectedNode?.id === node.id;
            const isLast = index === timelineNodes.length - 1;
            const nextNode = isLast ? null : timelineNodes[index + 1];
            const nextCfg = nextNode ? STATE_CONFIG[nextNode.state] || STATE_CONFIG.Normal : null;

            return (
              <React.Fragment key={node.id}>
                {/* Node Item */}
                <div
                  onClick={() => {
                    setSelectedNode(node);
                    if (node.originalEntry && onSelectLogEntry) {
                      onSelectLogEntry(node.originalEntry);
                    }
                  }}
                  className={`group relative flex-shrink-0 cursor-pointer transition-all duration-200 ${
                    viewDensity === 'compact' ? 'w-48' : 'w-60'
                  }`}
                >
                  {/* Top Connector / Node Pin */}
                  <div className="flex flex-col items-center">
                    
                    {/* Color-Coded Node Orb / Disc */}
                    <div className="relative">
                      {node.isCurrent && (
                        <span
                          className={`absolute -inset-1 rounded-full opacity-75 animate-ping ${cfg.dotColor}`}
                        />
                      )}
                      
                      <div
                        className={`relative h-9 w-9 rounded-full flex items-center justify-center border-2 transition-transform transform group-hover:scale-110 ${
                          cfg.nodeBg
                        } ${cfg.nodeBorder} ${cfg.textColor} ${cfg.glowShadow} ${
                          isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 scale-110' : ''
                        }`}
                      >
                        <NodeIcon className="h-4 w-4" />
                      </div>

                      {/* Small badge marker */}
                      {node.isCurrent && (
                        <span className="absolute -top-2 -right-2 px-1 py-0.2 rounded-full text-[8px] font-mono font-black uppercase bg-cyan-500 text-slate-950 shadow-sm">
                          LIVE
                        </span>
                      )}
                      {node.isBaseline && (
                        <span className="absolute -top-2 -right-2 px-1 py-0.2 rounded-full text-[8px] font-mono font-black uppercase bg-slate-700 text-slate-200 shadow-sm">
                          INIT
                        </span>
                      )}
                    </div>

                    {/* Node Card / Bubble */}
                    <div
                      className={`mt-2.5 w-full rounded-xl border p-2.5 transition-all text-left ${
                        isSelected
                          ? 'bg-slate-900/95 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                      }`}
                    >
                      {/* State Badge & Timestamp */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${cfg.badgeBg} ${cfg.badgeBorder} ${cfg.textColor}`}
                        >
                          {node.state}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5 text-slate-500" />
                          {node.timestamp}
                        </span>
                      </div>

                      {/* Transition label or title */}
                      <div className="text-[11px] font-mono font-semibold text-slate-200 line-clamp-1 group-hover:text-cyan-300 transition-colors">
                        {node.fromState && node.fromState !== node.state ? (
                          <span className="flex items-center gap-1">
                            <span className="text-slate-400">{node.fromState}</span>
                            <ArrowRight className="h-2.5 w-2.5 text-slate-500" />
                            <span className={cfg.textColor}>{node.state}</span>
                          </span>
                        ) : (
                          node.title
                        )}
                      </div>

                      {/* Detailed View Expanded Details */}
                      {viewDensity === 'detailed' && (
                        <>
                          <p className="text-[10px] font-mono text-slate-400 line-clamp-2 mt-1 leading-tight">
                            {node.description}
                          </p>
                          {node.metricsSnapshot && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1.5 border-t border-slate-800/80 text-[9px] font-mono text-slate-400">
                              {node.metricsSnapshot.temperature !== undefined && (
                                <span className="bg-slate-950 px-1 py-0.5 rounded border border-slate-800 text-slate-300">
                                  {node.metricsSnapshot.temperature.toFixed(1)} K
                                </span>
                              )}
                              {node.metricsSnapshot.vibration !== undefined && (
                                <span className="bg-slate-950 px-1 py-0.5 rounded border border-slate-800 text-slate-300">
                                  {node.metricsSnapshot.vibration.toFixed(1)} μm
                                </span>
                              )}
                              {node.metricsSnapshot.torque !== undefined && (
                                <span className="bg-slate-950 px-1 py-0.5 rounded border border-slate-800 text-slate-300">
                                  {node.metricsSnapshot.torque.toFixed(1)} Nm
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {/* Performer Footer */}
                      <div className="text-[9px] font-mono text-slate-500 mt-1 truncate">
                        {node.performedBy || 'System Automated'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connecting Rail / Flow Segment between nodes */}
                {!isLast && nextNode && nextCfg && (
                  <div className="flex-shrink-0 flex items-center px-1">
                    <div className="relative flex items-center justify-center w-12 sm:w-16">
                      {/* Connecting Line with color transition gradient */}
                      <div
                        className="h-[3px] w-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${
                            node.state === 'Action Required'
                              ? '#f43f5e'
                              : node.state === 'Advisory'
                              ? '#f59e0b'
                              : node.state === 'Post-Maintenance'
                              ? '#3b82f6'
                              : '#10b981'
                          }, ${
                            nextNode.state === 'Action Required'
                              ? '#f43f5e'
                              : nextNode.state === 'Advisory'
                              ? '#f59e0b'
                              : nextNode.state === 'Post-Maintenance'
                              ? '#3b82f6'
                              : '#10b981'
                          })`
                        }}
                      />
                      {/* Directional Chevron Icon centered */}
                      <div className="absolute p-0.5 rounded-full bg-slate-950 border border-slate-700 text-slate-400">
                        <ArrowRight className="h-2.5 w-2.5 text-slate-400" />
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Node Inspection Drawer */}
      {selectedNode && (
        <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/80 shadow-lg animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                  STATE_CONFIG[selectedNode.state]?.badgeBg
                } ${STATE_CONFIG[selectedNode.state]?.badgeBorder} ${
                  STATE_CONFIG[selectedNode.state]?.textColor
                }`}
              >
                {selectedNode.state}
              </span>
              <h5 className="text-xs font-mono font-bold text-white">
                {selectedNode.title}
              </h5>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">
                {selectedNode.dateTime}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                title="Dismiss inspector"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs font-mono">
            {/* Description & Cause */}
            <div className="md:col-span-2 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Trigger Diagnostic & Operating Context:
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {selectedNode.description}
              </p>
              <div className="text-[10px] text-slate-400 pt-1">
                Recorded By: <strong className="text-slate-200">{selectedNode.performedBy || 'System Supervisor'}</strong>
              </div>
            </div>

            {/* Snapshot Metrics */}
            <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Telemetry at Transition:
              </span>
              {selectedNode.metricsSnapshot ? (
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div>
                    <span className="text-slate-500">Temp:</span>{' '}
                    <strong className="text-slate-200">
                      {selectedNode.metricsSnapshot.temperature?.toFixed(1) ?? '—'} K
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Vibration:</span>{' '}
                    <strong className="text-slate-200">
                      {selectedNode.metricsSnapshot.vibration?.toFixed(1) ?? '—'} μm
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Torque:</span>{' '}
                    <strong className="text-slate-200">
                      {selectedNode.metricsSnapshot.torque?.toFixed(1) ?? '—'} Nm
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Est RUL:</span>{' '}
                    <strong className="text-cyan-400">
                      {selectedNode.metricsSnapshot.rulHours !== undefined
                        ? `${selectedNode.metricsSnapshot.rulHours}h`
                        : '—'}
                    </strong>
                  </div>
                </div>
              ) : (
                <span className="text-[10px] text-slate-500 italic">No telemetry snapshot recorded</span>
              )}

              {/* Action Buttons */}
              <div className="pt-1 flex items-center gap-2">
                {onFilterState && (
                  <button
                    onClick={() => onFilterState(selectedNode.state)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  >
                    Filter Logs to {selectedNode.state}
                  </button>
                )}
                {selectedNode.originalEntry && onSelectLogEntry && (
                  <button
                    onClick={() => onSelectLogEntry(selectedNode.originalEntry!)}
                    className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 transition-colors"
                  >
                    Highlight in List
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend & Quick State Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="text-slate-500 font-semibold">STATE LEGEND:</span>
          {(['Normal', 'Advisory', 'Action Required', 'Post-Maintenance'] as HealthState[]).map((state) => {
            const sc = STATE_CONFIG[state];
            const SIcon = sc.icon;
            const count = timelineNodes.filter((n) => n.state === state).length;
            return (
              <button
                key={state}
                onClick={() => onFilterState && onFilterState(state)}
                className={`flex items-center gap-1 hover:text-slate-200 transition-colors ${sc.textColor}`}
                title={`Filter log list to ${state}`}
              >
                <SIcon className="h-3 w-3" />
                <span>{state}</span>
                <span className="text-slate-600 text-[9px]">({count})</span>
              </button>
            );
          })}
        </div>

        {onFilterState && (
          <button
            onClick={() => onFilterState('all')}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline"
          >
            Show All Events
          </button>
        )}
      </div>
    </div>
  );
};
