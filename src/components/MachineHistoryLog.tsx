import React, { useState, useEffect } from 'react';
import {
  MachineState,
  MachineHistoryLogEntry,
  HistoryLogType,
  InterventionCategory,
  HealthState
} from '../types';
import { historyLogManager } from '../managers/HistoryLogManager';
import { simulationManager } from '../managers/SimulationManager';
import { toastManager } from '../managers/ToastManager';
import { MachineStatusTimeline } from './MachineStatusTimeline';
import {
  Wrench,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Search,
  PlusCircle,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  Zap,
  RefreshCw,
  User,
  SlidersHorizontal,
  ArrowRight,
  ClipboardList
} from 'lucide-react';

interface MachineHistoryLogProps {
  machine: MachineState;
}

export const MachineHistoryLog: React.FC<MachineHistoryLogProps> = ({ machine }) => {
  const [logs, setLogs] = useState<MachineHistoryLogEntry[]>([]);
  const [filterType, setFilterType] = useState<HistoryLogType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterHealthState, setFilterHealthState] = useState<HealthState | 'all'>('all');
  const [highlightedLogId, setHighlightedLogId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form state for logging new maintenance intervention
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<InterventionCategory>('Scheduled Preventative');
  const [newTech, setNewTech] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newStatus, setNewStatus] = useState<'completed' | 'in_progress' | 'verified'>('completed');
  const [targetState, setTargetState] = useState<HealthState | 'current'>('current');

  useEffect(() => {
    const updateLogs = () => {
      setLogs(historyLogManager.getLogsForMachine(machine.id));
    };

    updateLogs();
    const unsubscribe = historyLogManager.subscribe(updateLogs);
    return () => unsubscribe();
  }, [machine.id]);

  // Handle timeline interactions
  const handleSelectFromTimeline = (entry: MachineHistoryLogEntry) => {
    setHighlightedLogId(entry.id);
    if (filterType !== 'all' && entry.type !== filterType) {
      setFilterType('all');
    }
    if (filterHealthState !== 'all' && entry.newHealthState !== filterHealthState && entry.previousHealthState !== filterHealthState) {
      setFilterHealthState('all');
    }
    setTimeout(() => {
      const el = document.getElementById(`log-card-${entry.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleFilterStateFromTimeline = (state: HealthState | 'all') => {
    setFilterHealthState(state);
    if (state !== 'all') {
      setFilterType('all');
    }
  };

  // Derived filtered logs
  const filteredLogs = logs.filter((log) => {
    if (filterType !== 'all' && log.type !== filterType) return false;
    if (filterCategory !== 'all' && log.interventionCategory !== filterCategory) return false;
    if (filterHealthState !== 'all') {
      if (log.newHealthState !== filterHealthState && log.previousHealthState !== filterHealthState) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = log.title.toLowerCase().includes(q);
      const matchDesc = log.description.toLowerCase().includes(q);
      const matchTech = log.performedBy.toLowerCase().includes(q);
      const matchNotes = (log.technicianNotes || '').toLowerCase().includes(q);
      const matchWO = (log.workOrderNumber || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchTech && !matchNotes && !matchWO) return false;
    }
    return true;
  });

  // Calculate statistics
  const totalEvents = logs.length;
  const maintenanceCount = logs.filter((l) => l.type === 'maintenance_intervention').length;
  const healthChangesCount = logs.filter((l) => l.type === 'health_change').length;
  const lastMaintenance = logs.find((l) => l.type === 'maintenance_intervention');

  const handleDownloadCSV = () => {
    const fileName = `PRISM_History_${machine.id}_${Date.now()}.csv`;
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(historyLogManager.exportAsCSV(machine.id));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toastManager.success(
      'Machine History CSV Exported',
      `Exported CSV history log with ${logs.length} records for ${machine.name}.`,
      {
        duration: 4500,
        fileDetails: {
          filename: fileName,
          format: 'CSV',
          itemCount: logs.length
        }
      }
    );
  };

  const handleDownloadJSON = () => {
    const logs = historyLogManager.getLogsForMachine(machine.id);
    const exportPayload = {
      exportMetadata: {
        system: 'PRISM - Predictive Reliability & Intelligent Systems for Maintenance',
        reportType: 'Machine History Log & Comprehensive Health Summary',
        generatedAt: new Date().toISOString(),
        version: '2.0.0'
      },
      machineProfile: {
        id: machine.id,
        name: machine.name,
        model: machine.model,
        location: machine.location,
        currentHealthState: machine.healthState,
        operationalScenario: machine.scenario,
        lastUpdated: machine.lastUpdated
      },
      healthSummary: {
        healthIndexPercent: machine.rulMetrics.healthIndex,
        rulMetrics: machine.rulMetrics,
        oeeMetrics: machine.oeeMetrics,
        currentTelemetryReadings: machine.currentReadings,
        subsystemsStatus: machine.subsystems,
        plcChannels: machine.plcChannels,
        vibrationAnalysis: machine.vibrationSpectrum,
        xaiDiagnostics: machine.xaiExplanation
      },
      historyAuditTrail: {
        totalRecordedEventsCount: logs.length,
        maintenanceInterventionsCount: logs.filter(l => l.type === 'maintenance_intervention').length,
        healthStateTransitionsCount: logs.filter(l => l.type === 'health_change').length,
        chronologicalLogEntries: logs
      }
    };
    const fileName = `PRISM_${machine.id}_History_HealthSummary_${Date.now()}.json`;
    const jsonContent = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonContent);
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toastManager.success(
      'Machine History Log Exported',
      `Successfully exported JSON history log and health summary for ${machine.name} (${logs.length} events).`,
      {
        duration: 5000,
        fileDetails: {
          filename: fileName,
          format: 'JSON',
          itemCount: logs.length
        }
      }
    );
  };

  const handleSaveManualIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    historyLogManager.addManualEntry({
      machineId: machine.id,
      machineName: machine.name,
      type: 'maintenance_intervention',
      title: newTitle.trim(),
      description: newNotes.trim() || 'Custom technician maintenance intervention logged.',
      performedBy: newTech.trim() || 'Floor Reliability Engineer',
      interventionCategory: newCategory,
      workOrderNumber: `WO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: newStatus,
      technicianNotes: newNotes.trim(),
      previousHealthState: machine.healthState,
      newHealthState: targetState === 'current' ? machine.healthState : targetState,
      metricsSnapshot: {
        temperature: machine.currentReadings.temperature,
        vibration: machine.currentReadings.vibration,
        torque: machine.currentReadings.torque,
        rulHours: machine.rulMetrics?.estimatedHoursRemaining
      }
    });

    toastManager.success(
      'Intervention Recorded',
      `Logged "${newTitle.trim()}" for ${machine.name}.`,
      { duration: 4000 }
    );

    if (targetState !== 'current' && targetState !== machine.healthState) {
      if (targetState === 'Normal') {
        simulationManager.resetMachineSensors(machine.id);
      } else if (targetState === 'Post-Maintenance') {
        simulationManager.forceMachineMaintenance(machine.id);
      } else if (targetState === 'Action Required') {
        simulationManager.triggerMachineFaultTest(machine.id);
      } else {
        simulationManager.setMachineScenario(machine.id, targetState);
      }
    }

    // Reset form
    setNewTitle('');
    setNewTech('');
    setNewNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-5">
      
      {/* KPI Overview Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>TOTAL LOGS</span>
            <ClipboardList className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-black font-mono text-white mt-1">
            {totalEvents}
          </div>
          <span className="text-[10px] font-mono text-slate-500">Continuous audit trail</span>
        </div>

        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>INTERVENTIONS</span>
            <Wrench className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-black font-mono text-blue-400 mt-1">
            {maintenanceCount}
          </div>
          <span className="text-[10px] font-mono text-slate-500">Service & calibration events</span>
        </div>

        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>HEALTH TRANSITIONS</span>
            <Activity className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black font-mono text-amber-400 mt-1">
            {healthChangesCount}
          </div>
          <span className="text-[10px] font-mono text-slate-500">Dynamic state triggers</span>
        </div>

        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>LATEST INTERVENTION</span>
            <Clock className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xs font-bold font-mono text-emerald-300 mt-1 truncate">
            {lastMaintenance ? lastMaintenance.timestamp : 'None recorded'}
          </div>
          <span className="text-[10px] font-mono text-slate-500 truncate block">
            {lastMaintenance ? lastMaintenance.performedBy : 'Factory baseline'}
          </span>
        </div>
      </div>

      {/* Horizontal Status Transition Timeline */}
      <MachineStatusTimeline
        machine={machine}
        onSelectLogEntry={handleSelectFromTimeline}
        onFilterState={handleFilterStateFromTimeline}
        selectedLogId={highlightedLogId}
      />

      {/* Quick Machine Action Shortcut Strip */}
      <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            Quick Maintenance Actions:
          </span>
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            (Actions are auto-logged to this history trail)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => simulationManager.forceMachineMaintenance(machine.id)}
            className="px-2.5 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-200 border border-blue-800 text-xs font-mono font-bold transition-colors flex items-center gap-1"
            title="Trigger 15s post-maintenance calibration stabilization"
          >
            <Wrench className="h-3 w-3 text-blue-400" />
            <span>Force 15s Maintenance</span>
          </button>

          <button
            onClick={() => simulationManager.resetMachineSensors(machine.id)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold transition-colors flex items-center gap-1"
            title="Reset telemetry baseline"
          >
            <RefreshCw className="h-3 w-3 text-slate-400" />
            <span>Reset Baseline</span>
          </button>

          <button
            onClick={() => simulationManager.triggerMachineFaultTest(machine.id)}
            className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-mono font-bold transition-colors flex items-center gap-1"
            title="Simulate critical fault stress anomaly"
          >
            <AlertTriangle className="h-3 w-3 text-rose-400" />
            <span>Inject Fault</span>
          </button>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-950/90 p-3 rounded-xl border border-slate-800">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, technicians, work orders..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Type Toggle */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'all' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setFilterType('health_change')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'health_change' ? 'bg-amber-950 text-amber-300 font-bold border border-amber-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Health Changes ({healthChangesCount})
            </button>
            <button
              onClick={() => setFilterType('maintenance_intervention')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'maintenance_intervention' ? 'bg-blue-950 text-blue-300 font-bold border border-blue-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Interventions ({maintenanceCount})
            </button>
          </div>

          {/* Active Health State Filter Pill */}
          {filterHealthState !== 'all' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/90 border border-cyan-700/80 text-[11px] font-mono text-cyan-300 animate-in fade-in">
              <span>Timeline Filter: <strong className="text-white">{filterHealthState}</strong></span>
              <button
                onClick={() => setFilterHealthState('all')}
                className="hover:text-white ml-0.5 text-xs text-cyan-400 font-bold"
                title="Clear state filter"
              >
                ✕
              </button>
            </div>
          )}

          {/* Log New Intervention Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-bold font-mono transition-colors shadow-sm"
          >
            <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>Log Service</span>
          </button>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleDownloadCSV}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-colors"
              title="Export as CSV spreadsheet"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            </button>
            <button
              onClick={handleDownloadJSON}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-colors"
              title="Export as JSON"
            >
              <FileCode className="h-3.5 w-3.5 text-cyan-400" />
            </button>
          </div>
        </div>

      </div>

      {/* Manual Intervention Modal */}
      {showAddModal && (
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-700 shadow-xl space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
              <Wrench className="h-4 w-4 text-emerald-400" />
              Record Maintenance Intervention for {machine.name}
            </h4>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleSaveManualIntervention} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="md:col-span-2">
              <label className="text-slate-400 block mb-1">Intervention Title / Primary Action *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Spindle Vibration Sensor Replacement & Laser Alignment"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Intervention Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as InterventionCategory)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="Scheduled Preventative">Scheduled Preventative</option>
                <option value="Corrective Repair">Corrective Repair</option>
                <option value="Condition-Based">Condition-Based</option>
                <option value="Sensor Calibration">Sensor Calibration</option>
                <option value="Autonomous Recovery">Autonomous Recovery</option>
                <option value="General Inspection">General Inspection</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Technician / Lead Engineer</label>
              <input
                type="text"
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                placeholder="e.g. J. Doe (#342) or PRISM Reliability Team"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Service Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as 'completed' | 'in_progress' | 'verified')}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="completed">Completed</option>
                <option value="verified">Verified (Post-Inspection)</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Update Machine State Result</label>
              <select
                value={targetState}
                onChange={(e) => setTargetState(e.target.value as HealthState | 'current')}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="current">Keep Current Health State ({machine.healthState})</option>
                <option value="Normal">Transition to Normal (Reset Telemetry)</option>
                <option value="Post-Maintenance">Transition to Post-Maintenance (15s stabilization)</option>
                <option value="Advisory">Transition to Advisory</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-slate-400 block mb-1">Technician Notes & Observations</label>
              <textarea
                rows={2}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Detailed findings, parts replaced, torque specs, ISO test results..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md"
              >
                Save Intervention Log
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chronological Event Timeline */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 font-mono text-xs text-slate-400">
            <ClipboardList className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p>No historical events matching active filters.</p>
            <button
              onClick={() => {
                setFilterType('all');
                setFilterCategory('all');
                setSearchQuery('');
              }}
              className="mt-2 text-cyan-400 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          filteredLogs.map((entry) => {
            const isHealthChange = entry.type === 'health_change';
            const isMaint = entry.type === 'maintenance_intervention';
            const isCriticalTransition = entry.newHealthState === 'Action Required';
            const isRecovery = entry.newHealthState === 'Normal' && entry.previousHealthState !== 'Normal';
            const isHighlighted = highlightedLogId === entry.id;

            return (
              <div
                key={entry.id}
                id={`log-card-${entry.id}`}
                className={`p-4 rounded-xl border transition-all ${
                  isHighlighted
                    ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-[0_0_22px_rgba(6,182,212,0.35)] bg-slate-900/90'
                    : isCriticalTransition
                    ? 'bg-rose-950/20 border-rose-800/80 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                    : isRecovery
                    ? 'bg-emerald-950/20 border-emerald-800/80 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                    : isMaint
                    ? 'bg-slate-950/80 border-blue-900/40 hover:border-blue-700/60'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Header row: Badge, Title, Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    {/* Icon */}
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center border text-xs ${
                      isMaint
                        ? 'bg-blue-950 border-blue-800 text-blue-400'
                        : isCriticalTransition
                        ? 'bg-rose-950 border-rose-800 text-rose-400'
                        : isRecovery
                        ? 'bg-emerald-950 border-emerald-800 text-emerald-400'
                        : 'bg-amber-950 border-amber-800 text-amber-400'
                    }`}>
                      {isMaint ? <Wrench className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-100 font-mono">
                          {entry.title}
                        </h4>
                        {entry.workOrderNumber && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                            {entry.workOrderNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                        <span>By: <strong className="text-slate-300">{entry.performedBy}</strong></span>
                        {entry.interventionCategory && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="text-cyan-400">{entry.interventionCategory}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timestamp & Status Badge */}
                  <div className="flex items-center gap-2 sm:text-right">
                    <span className="text-[11px] font-mono text-slate-400">
                      {entry.dateTime}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold border ${
                      entry.status === 'verified'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : entry.status === 'in_progress'
                        ? 'bg-blue-950 text-blue-300 border-blue-800 animate-pulse'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}>
                      {entry.status}
                    </span>
                  </div>
                </div>

                {/* State Transition Visual Strip (if health change) */}
                {(entry.previousHealthState || entry.newHealthState) && (
                  <div className="my-2.5 flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-400 text-[11px]">State Shift:</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                      entry.previousHealthState === 'Action Required' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                      entry.previousHealthState === 'Advisory' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                      entry.previousHealthState === 'Post-Maintenance' ? 'bg-blue-950 text-blue-300 border-blue-800' :
                      'bg-emerald-950 text-emerald-300 border-emerald-800'
                    }`}>
                      {entry.previousHealthState || 'Initial'}
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-500" />
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                      entry.newHealthState === 'Action Required' ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse' :
                      entry.newHealthState === 'Advisory' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                      entry.newHealthState === 'Post-Maintenance' ? 'bg-blue-950 text-blue-300 border-blue-800' :
                      'bg-emerald-950 text-emerald-300 border-emerald-800'
                    }`}>
                      {entry.newHealthState}
                    </span>
                  </div>
                )}

                {/* Description Body */}
                <p className="text-xs text-slate-300 font-mono leading-relaxed mt-2">
                  {entry.description}
                </p>

                {/* Technician Notes (if available) */}
                {entry.technicianNotes && (
                  <div className="mt-2 p-2 bg-slate-900/60 rounded-lg border border-slate-800/80 text-[11px] font-mono text-slate-300">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Field Notes & Verification:</span>
                    {entry.technicianNotes}
                  </div>
                )}

                {/* Telemetry Snapshot at time of event */}
                {entry.metricsSnapshot && (
                  <div className="mt-2.5 pt-2 border-t border-slate-900 flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-400">
                    <span className="text-slate-500 uppercase font-bold">Telemetric Snapshot:</span>
                    {entry.metricsSnapshot.temperature !== undefined && (
                      <span>Temp: <strong className="text-slate-200">{entry.metricsSnapshot.temperature.toFixed(1)} K</strong></span>
                    )}
                    {entry.metricsSnapshot.vibration !== undefined && (
                      <span>Vib RMS: <strong className="text-slate-200">{entry.metricsSnapshot.vibration.toFixed(1)} μm</strong></span>
                    )}
                    {entry.metricsSnapshot.torque !== undefined && (
                      <span>Torque: <strong className="text-slate-200">{entry.metricsSnapshot.torque.toFixed(1)} Nm</strong></span>
                    )}
                    {entry.metricsSnapshot.rulHours !== undefined && (
                      <span>RUL: <strong className="text-cyan-400">{entry.metricsSnapshot.rulHours} hrs</strong></span>
                    )}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
