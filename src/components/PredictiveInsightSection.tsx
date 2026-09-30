import React, { useState, useMemo } from 'react';
import {
  MachineState,
  MachineHistoryLogEntry,
  HealthState
} from '../types';
import { historyLogManager } from '../managers/HistoryLogManager';
import { simulationManager } from '../managers/SimulationManager';
import { toastManager } from '../managers/ToastManager';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingDown,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  AlertOctagon
} from 'lucide-react';

interface PredictiveInsightSectionProps {
  machine: MachineState;
  onOpenHistoryTab?: () => void;
  onOpenCalendarTab?: () => void;
}

export interface PredictiveRecommendation {
  taskTitle: string;
  urgency: 'Critical (Immediate)' | 'High Priority (<24h)' | 'Elevated (Next Shift)' | 'Routine Preventative';
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
  confidenceScore: number; // 0 - 100%
  recommendedWindow: string;
  estimatedDowntime: string;
  targetSubsystem: string;
  sopReference: string;
  historicalLogPatternSummary: string;
  textualRecommendation: string;
  sopSteps: string[];
  expectedHealthRecovery: string;
}

/**
 * Hypothetical AI Heuristic Engine
 * Evaluates chronological machine history logs, telemetry drift rates,
 * vibration harmonics, and RUL degradation curves to formulate the next maintenance recommendation.
 */
function evaluatePredictiveInsight(
  machine: MachineState,
  logs: MachineHistoryLogEntry[]
): PredictiveRecommendation {
  const isCritical = machine.healthState === 'Action Required';
  const isAdvisory = machine.healthState === 'Advisory';
  const isPostMaint = machine.healthState === 'Post-Maintenance';

  // Analysis of logs
  const recentHealthChanges = logs.filter((l) => l.type === 'health_change');
  const recentInterventions = logs.filter((l) => l.type === 'maintenance_intervention');
  const totalEvents = logs.length;

  const lastIntervention = recentInterventions[0];
  const lastHealthChange = recentHealthChanges[0];

  // Specific machine heuristic logic
  const mid = machine.id;
  const rulHours = machine.rulMetrics?.estimatedHoursRemaining ?? 500;
  const vibration = machine.currentReadings.vibration;
  const temp = machine.currentReadings.temperature;
  const torque = machine.currentReadings.torque;

  // 1. Critical Scenario (Fault injected or Action Required)
  if (isCritical || rulHours < 50 || vibration > 85) {
    if (mid === 'cnc-milling-machine') {
      return {
        taskTitle: 'Emergency Spindle Collet De-Chucking & Ceramic Bearing Inspection',
        urgency: 'Critical (Immediate)',
        urgencyLevel: 'critical',
        confidenceScore: 96.4,
        recommendedWindow: 'Immediate (< 2 operating hours)',
        estimatedDowntime: '45 - 60 minutes',
        targetSubsystem: 'Main High-Speed Spindle & Collet',
        sopReference: 'SOP-CNC-EMG-014',
        historicalLogPatternSummary: `Analysis of ${totalEvents} audit records reveals rapid state divergence to Action Required. Recent log "${lastHealthChange?.title || 'Health Anomaly'}" indicates high-stress vibration spike (${vibration.toFixed(1)} μm) exceeding safe operational envelope.`,
        textualRecommendation: `PRISM Heuristic Engine flags high probability of impending spindle cage seizure. Recent history logs demonstrate sharp degradation after sustained heavy tooling passes. Immediate lockout/tagout (LOTO) is recommended to inspect ceramic hybrid bearing runout and replace damaged HSK-A63 collet before permanent stator damage occurs.`,
        sopSteps: [
          'Engage emergency feed hold and execute automated spindle deceleration sequence.',
          'Verify zero rotation via secondary optical tachometer and apply mechanical spindle lock.',
          'Dismantle toolholder chuck; inspect bearing races for thermal discoloration and pitting.',
          'Flush spindle housing with synthetic degreaser and perform laser runout check.'
        ],
        expectedHealthRecovery: 'Recovers Health Index to >92% and extends Spindle RUL by 1,400+ hours.'
      };
    } else if (mid === 'industrial-cooling-pump') {
      return {
        taskTitle: 'Impeller Cavitation Purge & Dual Mechanical Seal Re-Alignment',
        urgency: 'Critical (Immediate)',
        urgencyLevel: 'critical',
        confidenceScore: 94.8,
        recommendedWindow: 'Immediate (< 4 operating hours)',
        estimatedDowntime: '40 minutes',
        targetSubsystem: 'Multistage Stainless Impeller Cavity',
        sopReference: 'SOP-PMP-HYD-082',
        historicalLogPatternSummary: `Evaluation of recent audit trail indicates suction pressure collapse. Prior log notes indicate recurring inlet strainer micro-fouling followed by thermal spike (${temp.toFixed(1)} K).`,
        textualRecommendation: `Hypothetical acoustic vibration harmonics indicate severe bubble implosion (cavitation) inside stage-2 impeller vanes. History logs indicate multiple transitions following bypass valve fluctuations. Recommend isolating chiller circuit, flushing intake basket, and checking tandem mechanical seal barrier fluid pressure.`,
        sopSteps: [
          'Switch chiller manifold to redundant loop Pump-B bypass valve.',
          'Isolate pump suction and discharge butterfly valves; de-energize 45 kW motor.',
          'Disassemble suction strainer; backflush stainless wire mesh basket with demineralized water.',
          'Inspect silicon carbide seal faces for micro-cracks; re-torque casing bolts to 85 Nm.'
        ],
        expectedHealthRecovery: 'Eliminates hydraulic turbulence, stabilizing discharge pressure to 4.2 bar.'
      };
    } else if (mid === 'conveyor-drive-motor') {
      return {
        taskTitle: 'Drive Belt Tension Re-Alignment & Gearbox Backlash Calibration',
        urgency: 'Critical (Immediate)',
        urgencyLevel: 'critical',
        confidenceScore: 95.1,
        recommendedWindow: 'Immediate (< 3 operating hours)',
        estimatedDowntime: '30 minutes',
        targetSubsystem: 'Helical Planetary Reduction Gearbox',
        sopReference: 'SOP-MOT-DRV-029',
        historicalLogPatternSummary: `Historical sequence logs show sudden torque deviation (${torque.toFixed(1)} Nm) with 285 Hz gear meshing harmonics, triggering the active Action Required trip.`,
        textualRecommendation: `Pattern matching across recent history log entries confirms excessive belt slack inducing slip under material transfer shock loads. Immediate tension adjustment using sonic meter and re-greasing of output pinion bearing is prescribed.`,
        sopSteps: [
          'Halt transfer line feeder and engage spring-applied fail-safe brake.',
          'Measure belt resonance frequency; tension dual V-belts to 245 N specification.',
          'Inspect planetary gears for backlash deviation and replenish polyglycol synthetic lubricant.',
          'Run 60-second unloaded test pass to verify vibration levels < 30 μm.'
        ],
        expectedHealthRecovery: 'Eliminates slip harmonic; reduces motor core temperature by ~6 K.'
      };
    } else {
      return {
        taskTitle: 'Separator Filter Replacement & Desiccant Purge Valve Service',
        urgency: 'Critical (Immediate)',
        urgencyLevel: 'critical',
        confidenceScore: 93.9,
        recommendedWindow: 'Immediate (< 4 operating hours)',
        estimatedDowntime: '35 minutes',
        targetSubsystem: 'Oil-Air Separator Cartridge',
        sopReference: 'SOP-AIR-FLT-102',
        historicalLogPatternSummary: `Audit log logs recurring differential pressure alarms across pneumatic dryer manifold with elevated discharge temperature (${temp.toFixed(1)} K).`,
        textualRecommendation: `Telemetry drift heuristic projects high aerosol oil carryover if separator cartridge is not exchanged. Recommend executing coalescing filter replacement and solenoid timer recalibration.`,
        sopSteps: [
          'Depressurize air receiver tank to 0.0 bar gauge pressure.',
          'Unbolt separator housing lid and replace coalescing filter element (ISO VG 46 rating).',
          'Clean condensate auto-drain solenoid plunger and verify cycling timer at 15-minute intervals.',
          'Re-pressurize system and check for pneumatic fitting micro-leaks using ultrasonic sniffer.'
        ],
        expectedHealthRecovery: 'Lowers differential pressure to < 0.15 bar, restoring full 8.0 bar clean delivery.'
      };
    }
  }

  // 2. Advisory Scenario (Drift / Warning signs)
  if (isAdvisory || vibration > 55 || temp > 305) {
    return {
      taskTitle: 'Condition-Based Bearing Re-Greasing & Transducer Zero-Calibration',
      urgency: 'High Priority (<24h)',
      urgencyLevel: 'high',
      confidenceScore: 91.2,
      recommendedWindow: 'Next planned shift turnaround (within 12 - 24 hours)',
      estimatedDowntime: '25 minutes',
      targetSubsystem: machine.subsystems[0]?.name || 'Drive Subsystem',
      sopReference: 'SOP-PRV-COND-204',
      historicalLogPatternSummary: `Log history exhibits gradual drift over the past ${recentHealthChanges.length} state transitions. Previous transition logged at ${lastHealthChange?.timestamp || 'recent shift'} flagged thermal and vibrational elevation.`,
      textualRecommendation: `Heuristic trend analysis indicates early-stage lubricant shear thinning in high-stress contact zones. Historical data from similar operational runs suggests applying 15g of synthetic Klüber grease will prevent transition to critical vibration and arrest RUL decay.`,
      sopSteps: [
        'Perform thermographic sweep across main bearing housing using FLIR infrared camera.',
        'Inject calibrated quantity of synthetic grease via volumetric micro-dispenser.',
        'Zero-reference accelerometer sensors to eliminate baseline drift.',
        'Monitor vibration velocity RMS during 10-minute stabilization cycle.'
      ],
      expectedHealthRecovery: 'Reverses RUL degradation trend and restores machine health index above 90%.'
    };
  }

  // 3. Post-Maintenance Scenario (Active Stabilization)
  if (isPostMaint) {
    return {
      taskTitle: 'Post-Intervention Baseline Verification & Dynamic Runout Audit',
      urgency: 'Elevated (Next Shift)',
      urgencyLevel: 'medium',
      confidenceScore: 89.5,
      recommendedWindow: 'Upon completion of stabilization cycle',
      estimatedDowntime: '10 minutes (online)',
      targetSubsystem: 'Digital Telemetry & Calibration Layer',
      sopReference: 'SOP-VER-STAB-003',
      historicalLogPatternSummary: `Machine underwent recent maintenance intervention "${lastIntervention?.title || 'Service Action'}". Current stabilization cycle is actively recalibrating sensor offsets.`,
      textualRecommendation: `The heuristic model recommends completing the 15-second stabilization audit. Once thermal equilibrium is confirmed by digital sensor telemetry, verify all PLC discrete interlocks and log completion into the PRISM continuous compliance record.`,
      sopSteps: [
        'Confirm temperature stabilization within ±0.5 K tolerance band.',
        'Verify zero harmonic vibration peaks in vibration FFT spectrum.',
        'Sign off on technician work order and transition machine to full production clearance.'
      ],
      expectedHealthRecovery: 'Confirms 100% operational clearance and updates baseline health index.'
    };
  }

  // 4. Normal Nominal Scenario (Preventative Maintenance Outlook)
  return {
    taskTitle: 'Scheduled Preventative Lubricant Sampling & Fastener Torque Audit',
    urgency: 'Routine Preventative',
    urgencyLevel: 'low',
    confidenceScore: 88.0,
    recommendedWindow: `Planned maintenance window (${machine.rulMetrics?.recommendedInterventionDate || 'Next 14 Days'})`,
    estimatedDowntime: '20 minutes',
    targetSubsystem: machine.subsystems[1]?.name || 'Secondary Drive Assembly',
    sopReference: 'SOP-PM-ROUTINE-101',
    historicalLogPatternSummary: `Analysis of ${totalEvents} historical logs shows steady baseline performance. Last verified service was "${lastIntervention?.title || 'Preventative Check'}" performed by ${lastIntervention?.performedBy || 'PRISM Maintenance Team'}.`,
    textualRecommendation: `Machine telemetry is operating within nominal statistical process limits. Heuristic projection suggests performing scheduled spectrographic lubricant oil sampling at the next planned maintenance window to check for sub-micron particulate accumulation before any mechanical wear begins.`,
    sopSteps: [
      'Extract 50ml oil sample from lower sump port for spectrographic laboratory wear analysis.',
      'Check structural foundation anchors and mounting flange fasteners with calibrated torque wrench.',
      'Inspect air filter cleanliness and purge moisture separator bowl.'
    ],
    expectedHealthRecovery: 'Maintains optimal 95%+ Health Index and maximizes machine component lifespan.'
  };
}

export const PredictiveInsightSection: React.FC<PredictiveInsightSectionProps> = ({
  machine,
  onOpenHistoryTab,
  onOpenCalendarTab
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [logs, setLogs] = useState<MachineHistoryLogEntry[]>([]);
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);

  // Subscribe to history log updates
  React.useEffect(() => {
    const updateLogs = () => {
      setLogs(historyLogManager.getLogsForMachine(machine.id));
    };
    updateLogs();
    const unsubscribe = historyLogManager.subscribe(updateLogs);
    return () => unsubscribe();
  }, [machine.id]);

  // Compute heuristic recommendation
  const recommendation = useMemo(() => {
    return evaluatePredictiveInsight(machine, logs);
  }, [machine, logs]);

  // Handle one-click maintenance action simulation based on heuristic
  const handleExecuteRecommendedAction = () => {
    setActionInProgress(true);

    setTimeout(() => {
      // Record intervention in history log
      historyLogManager.recordIntervention(machine.id, {
        title: recommendation.taskTitle,
        description: `Executed AI Heuristic Recommended Action: ${recommendation.textualRecommendation.slice(0, 160)}...`,
        category: 'Condition-Based',
        performedBy: 'PRISM Heuristic Maintenance Team',
        workOrderNumber: `WO-${Date.now().toString().slice(-4)}`,
        previousHealthState: machine.healthState,
        newHealthState: 'Post-Maintenance',
        status: 'in_progress',
        machineName: machine.name,
        technicianNotes: `SOP: ${recommendation.sopReference}. Targeted Subsystem: ${recommendation.targetSubsystem}.`,
        snapshot: {
          temperature: machine.currentReadings.temperature,
          vibration: machine.currentReadings.vibration,
          torque: machine.currentReadings.torque,
          rulHours: machine.rulMetrics?.estimatedHoursRemaining
        }
      });

      // Trigger maintenance in simulation
      simulationManager.forceMachineMaintenance(machine.id);

      toastManager.success(
        'Predictive Maintenance Triggered',
        `Dispatched "${recommendation.taskTitle}". Machine entering 15s post-maintenance calibration.`,
        { duration: 5000 }
      );

      setActionInProgress(false);
    }, 600);
  };

  const urgencyStyles = {
    critical: {
      border: 'border-rose-700/80',
      bg: 'bg-rose-950/30',
      badgeBg: 'bg-rose-950 text-rose-300 border-rose-800',
      glow: 'shadow-[0_0_20px_rgba(244,63,94,0.18)]',
      iconColor: 'text-rose-400',
      icon: AlertOctagon
    },
    high: {
      border: 'border-amber-700/80',
      bg: 'bg-amber-950/30',
      badgeBg: 'bg-amber-950 text-amber-300 border-amber-800',
      glow: 'shadow-[0_0_18px_rgba(245,158,11,0.15)]',
      iconColor: 'text-amber-400',
      icon: AlertTriangle
    },
    medium: {
      border: 'border-blue-700/80',
      bg: 'bg-blue-950/30',
      badgeBg: 'bg-blue-950 text-blue-300 border-blue-800',
      glow: 'shadow-[0_0_18px_rgba(59,130,246,0.15)]',
      iconColor: 'text-blue-400',
      icon: Wrench
    },
    low: {
      border: 'border-emerald-700/70',
      bg: 'bg-emerald-950/20',
      badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.12)]',
      iconColor: 'text-emerald-400',
      icon: CheckCircle2
    }
  }[recommendation.urgencyLevel];

  const UrgencyIcon = urgencyStyles.icon;

  return (
    <div
      className={`rounded-2xl border transition-all ${urgencyStyles.border} ${urgencyStyles.bg} ${urgencyStyles.glow} overflow-hidden`}
    >
      {/* Top Banner Header */}
      <div className="p-3.5 sm:p-4 bg-slate-950/80 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-950 to-indigo-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Sparkles className="h-4.5 w-4.5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono font-bold tracking-wider text-slate-100 uppercase">
                Predictive Insight & Maintenance Recommendation
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800/70 text-cyan-300 font-semibold flex items-center gap-1">
                <span>AI Heuristic Engine</span>
                <span className="text-slate-500">·</span>
                <span>{recommendation.confidenceScore}% Conf</span>
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Synthesis of {logs.length} continuous history logs, telemetry drift gradients, and RUL decay curves
            </p>
          </div>
        </div>

        {/* Right side controls: Urgency Badge & Expand Collapse Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span
            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border uppercase flex items-center gap-1.5 ${urgencyStyles.badgeBg}`}
          >
            <UrgencyIcon className="h-3.5 w-3.5" />
            <span>{recommendation.urgency}</span>
          </span>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title={isExpanded ? 'Collapse predictive insight' : 'Expand predictive insight'}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4 text-xs font-mono">
          
          {/* Recommendation Title & Target Subsystem */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-cyan-400" />
                Recommended Next Maintenance Task:
              </span>
              <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
                {recommendation.taskTitle}
              </h4>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                <span>
                  Target Component:{' '}
                  <strong className="text-slate-200">{recommendation.targetSubsystem}</strong>
                </span>
                <span className="text-slate-600">·</span>
                <span>
                  Standard Procedure:{' '}
                  <strong className="text-cyan-300">{recommendation.sopReference}</strong>
                </span>
              </div>
            </div>

            {/* Quick Metrics Chips */}
            <div className="flex flex-wrap md:flex-col items-start md:items-end gap-1.5 text-[11px]">
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-300">
                <Calendar className="h-3 w-3 text-cyan-400" />
                <span>Window: <strong>{recommendation.recommendedWindow}</strong></span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-300">
                <Clock className="h-3 w-3 text-amber-400" />
                <span>Est. Downtime: <strong>{recommendation.estimatedDowntime}</strong></span>
              </div>
            </div>
          </div>

          {/* Textual Synthesis & Heuristic Explanation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Left Column: Log Pattern Analysis & Textual Recommendation */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                  Audit Trail Pattern Detection:
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                  {recommendation.historicalLogPatternSummary}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  Heuristic Textual Recommendation:
                </span>
                <p className="text-[11px] text-slate-200 leading-relaxed bg-slate-950/70 p-3 rounded-lg border border-cyan-900/40 text-justify">
                  {recommendation.textualRecommendation}
                </p>
              </div>
            </div>

            {/* Right Column: SOP Action Checklist & Health Recovery */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  SOP Action Checklist:
                </span>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5">
                  {recommendation.sopSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                      <span className="flex-shrink-0 h-4 w-4 rounded-full bg-slate-900 text-cyan-400 border border-slate-700 flex items-center justify-center text-[9px] font-bold mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expected Impact & Quick Action Button */}
              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Projected Reliability Outcome:
                  </span>
                  <span className="text-[11px] text-emerald-300 font-semibold block mt-0.5">
                    {recommendation.expectedHealthRecovery}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {onOpenCalendarTab && (
                    <button
                      onClick={onOpenCalendarTab}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800 text-xs font-bold transition-colors flex items-center gap-1"
                      title="Open Maintenance Calendar to view and schedule routine events"
                    >
                      <Calendar className="h-3 w-3 text-cyan-400" />
                      <span>Plan in Calendar</span>
                    </button>
                  )}

                  {onOpenHistoryTab && (
                    <button
                      onClick={onOpenHistoryTab}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
                      title="Inspect full chronological history log"
                    >
                      <FileText className="h-3 w-3 text-slate-400" />
                      <span>View Log Trail</span>
                    </button>
                  )}

                  <button
                    onClick={handleExecuteRecommendedAction}
                    disabled={actionInProgress}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                    title="Simulate executing this recommended maintenance task"
                  >
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    <span>{actionInProgress ? 'Dispatching...' : 'Dispatch Work Order'}</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}
    </div>
  );
};
