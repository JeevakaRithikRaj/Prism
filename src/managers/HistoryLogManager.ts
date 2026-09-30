import { MachineHistoryLogEntry, MachineState, HealthState, InterventionCategory, HistoryLogType } from '../types';

type HistoryListener = () => void;

class HistoryLogManager {
  private logs: MachineHistoryLogEntry[] = [];
  private listeners: Set<HistoryListener> = new Set();
  private maxLogsPerMachine: number = 100;

  constructor() {
    this.seedHistoricalData();
  }

  private seedHistoricalData() {
    const baseDate = new Date();
    const subtractHours = (hours: number): { time: string; dateTime: string } => {
      const d = new Date(baseDate.getTime() - hours * 60 * 60 * 1000);
      return {
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        dateTime: d.toISOString().replace('T', ' ').substring(0, 19)
      };
    };

    // Realistic historical interventions and health state transitions for each machine
    this.logs = [
      // --- CNC Milling Machine History ---
      {
        id: 'hist-cnc-1',
        machineId: 'cnc-milling-machine',
        machineName: 'CNC Milling Center (5-Axis)',
        timestamp: subtractHours(48).time,
        dateTime: subtractHours(48).dateTime,
        type: 'maintenance_intervention',
        title: 'Spindle Bearing Greasing & Runout Check',
        description: 'Applied high-speed synthetic Klüber grease to ceramic spindle bearings. Dynamic runout measured at 1.8 μm (within 2.5 μm specification).',
        previousHealthState: 'Advisory',
        newHealthState: 'Normal',
        performedBy: 'Lead Tech M. Kowalski (#402)',
        interventionCategory: 'Scheduled Preventative',
        workOrderNumber: 'WO-2026-8941',
        status: 'verified',
        technicianNotes: 'Bearing housing temperature stabilized post-application. No abnormal harmonic peaks observed.',
        metricsSnapshot: { temperature: 300.2, vibration: 31.4, torque: 34.8, rulHours: 1840 }
      },
      {
        id: 'hist-cnc-2',
        machineId: 'cnc-milling-machine',
        machineName: 'CNC Milling Center (5-Axis)',
        timestamp: subtractHours(36).time,
        dateTime: subtractHours(36).dateTime,
        type: 'health_change',
        title: 'Health State: Normal ➔ Advisory',
        description: 'Automated threshold trip: Spindle vibration RMS exceeded 90 μm warning threshold during heavy roughing pass on Titanium Ti-6Al-4V block.',
        previousHealthState: 'Normal',
        newHealthState: 'Advisory',
        performedBy: 'PRISM Automation Engine',
        interventionCategory: 'Condition-Based',
        status: 'completed',
        technicianNotes: 'Feed rate adjusted by 15% via CNC controller override to protect tooling.',
        metricsSnapshot: { temperature: 307.8, vibration: 92.4, torque: 46.1, rulHours: 120 }
      },
      {
        id: 'hist-cnc-3',
        machineId: 'cnc-milling-machine',
        machineName: 'CNC Milling Center (5-Axis)',
        timestamp: subtractHours(35.5).time,
        dateTime: subtractHours(35.5).dateTime,
        type: 'maintenance_intervention',
        title: 'Tool Wear Replacement & Collet Inspection',
        description: 'Replaced 12mm 4-flute solid carbide end mill (wear index reached 92%). Cleaned HSK-A63 toolholder taper and re-torqued chuck.',
        previousHealthState: 'Advisory',
        newHealthState: 'Post-Maintenance',
        performedBy: 'Shift Specialist D. Vance (#118)',
        interventionCategory: 'Corrective Repair',
        workOrderNumber: 'WO-2026-8947',
        status: 'verified',
        technicianNotes: 'Completed spindle purge and 15-second baseline stabilization sequence.',
        metricsSnapshot: { temperature: 302.1, vibration: 36.2, torque: 35.0, rulHours: 1750 }
      },
      {
        id: 'hist-cnc-4',
        machineId: 'cnc-milling-machine',
        machineName: 'CNC Milling Center (5-Axis)',
        timestamp: subtractHours(35.2).time,
        dateTime: subtractHours(35.2).dateTime,
        type: 'health_change',
        title: 'Health State: Post-Maintenance ➔ Normal',
        description: 'Stabilization cycle finished. Sensor telemetry normalized across spindle temperature and velocity RMS.',
        previousHealthState: 'Post-Maintenance',
        newHealthState: 'Normal',
        performedBy: 'PRISM Adaptive Supervisor',
        interventionCategory: 'Autonomous Recovery',
        status: 'completed',
        technicianNotes: 'Full machine clearance granted for automated production cycle.',
        metricsSnapshot: { temperature: 300.0, vibration: 32.0, torque: 35.0, rulHours: 1850 }
      },

      // --- Industrial Cooling Pump History ---
      {
        id: 'hist-pump-1',
        machineId: 'industrial-cooling-pump',
        machineName: 'Industrial Cooling Pump',
        timestamp: subtractHours(72).time,
        dateTime: subtractHours(72).dateTime,
        type: 'maintenance_intervention',
        title: 'Impeller Cavitation Inspection & Seal Purge',
        description: 'Disassembled pump casing to check mechanical dual face seal and impeller vanes for pitting erosion.',
        previousHealthState: 'Normal',
        newHealthState: 'Normal',
        performedBy: 'Hydraulics Tech R. Sterling (#305)',
        interventionCategory: 'Scheduled Preventative',
        workOrderNumber: 'WO-2026-8812',
        status: 'verified',
        technicianNotes: 'Vanes nominal; mechanical seal flushed with demineralized coolant. Re-torqued casing bolts to 85 Nm.',
        metricsSnapshot: { temperature: 298.5, vibration: 28.1, torque: 32.0, rulHours: 2400 }
      },
      {
        id: 'hist-pump-2',
        machineId: 'industrial-cooling-pump',
        machineName: 'Industrial Cooling Pump',
        timestamp: subtractHours(24).time,
        dateTime: subtractHours(24).dateTime,
        type: 'health_change',
        title: 'Health State: Normal ➔ Advisory',
        description: 'Fluid discharge pressure drop detected; inlet suction filter screen partial fouling flagged.',
        previousHealthState: 'Normal',
        newHealthState: 'Advisory',
        performedBy: 'PRISM Diagnostics Agent',
        interventionCategory: 'Condition-Based',
        status: 'completed',
        technicianNotes: 'Advisory alarm raised to line supervisor.',
        metricsSnapshot: { temperature: 304.2, vibration: 64.1, torque: 39.4, rulHours: 320 }
      },
      {
        id: 'hist-pump-3',
        machineId: 'industrial-cooling-pump',
        machineName: 'Industrial Cooling Pump',
        timestamp: subtractHours(22).time,
        dateTime: subtractHours(22).dateTime,
        type: 'maintenance_intervention',
        title: 'Suction Strainer Flush & Valve Alignment',
        description: 'Back-flushed 50-mesh intake suction strainer basket and recalibrated motorized butterfly bypass valve.',
        previousHealthState: 'Advisory',
        newHealthState: 'Normal',
        performedBy: 'Fluid Systems Eng K. Patel (#219)',
        interventionCategory: 'Corrective Repair',
        workOrderNumber: 'WO-2026-8970',
        status: 'completed',
        technicianNotes: 'Suction pressure restored to 4.2 bar nominal.',
        metricsSnapshot: { temperature: 299.1, vibration: 29.8, torque: 33.2, rulHours: 2350 }
      },

      // --- Conveyor Drive Motor History ---
      {
        id: 'hist-conv-1',
        machineId: 'conveyor-drive-motor',
        machineName: 'Conveyor Drive Motor',
        timestamp: subtractHours(96).time,
        dateTime: subtractHours(96).dateTime,
        type: 'maintenance_intervention',
        title: 'VFD Inverter Parameter Backup & Motor Insulation Test',
        description: 'Performed Megger 1000V insulation resistance test on stator windings (>100 MΩ, Pass). Backed up Danfoss VFD control parameters.',
        previousHealthState: 'Normal',
        newHealthState: 'Normal',
        performedBy: 'Electrical Tech L. Chen (#507)',
        interventionCategory: 'Scheduled Preventative',
        workOrderNumber: 'WO-2026-8799',
        status: 'verified',
        technicianNotes: 'Checked cooling blower fan filter; verified zero phase unbalance on 480V 3-phase bus.',
        metricsSnapshot: { temperature: 301.0, vibration: 24.5, torque: 38.0, rulHours: 3100 }
      },
      {
        id: 'hist-conv-1b',
        machineId: 'conveyor-drive-motor',
        machineName: 'Conveyor Drive Motor',
        timestamp: subtractHours(20).time,
        dateTime: subtractHours(20).dateTime,
        type: 'health_change',
        title: 'Health State: Normal ➔ Advisory',
        description: 'Gearbox output torque fluctuation detected along with harmonic vibration anomaly at 285 Hz.',
        previousHealthState: 'Normal',
        newHealthState: 'Advisory',
        performedBy: 'PRISM Predictive Engine',
        interventionCategory: 'Condition-Based',
        status: 'completed',
        technicianNotes: 'Dynamic belt tension dropped below threshold specification.',
        metricsSnapshot: { temperature: 305.2, vibration: 68.4, torque: 47.2, rulHours: 410 }
      },
      {
        id: 'hist-conv-2',
        machineId: 'conveyor-drive-motor',
        machineName: 'Conveyor Drive Motor',
        timestamp: subtractHours(18).time,
        dateTime: subtractHours(18).dateTime,
        type: 'maintenance_intervention',
        title: 'Drive Belt Tensioning & Optical Tachometer Check',
        description: 'Tensioned dual V-belts using sonic tension meter (target 245 N). Calibrated non-contact tachometer pulse encoder.',
        previousHealthState: 'Advisory',
        newHealthState: 'Normal',
        performedBy: 'Shop Mechanic B. Hoffman (#112)',
        interventionCategory: 'Scheduled Preventative',
        workOrderNumber: 'WO-2026-8991',
        status: 'completed',
        technicianNotes: 'Belt slip reduced from 2.1% to <0.3%.',
        metricsSnapshot: { temperature: 299.4, vibration: 22.1, torque: 36.5, rulHours: 3050 }
      },

      // --- Precision Air Compressor History ---
      {
        id: 'hist-comp-1',
        machineId: 'precision-air-compressor',
        machineName: 'Precision Air Compressor',
        timestamp: subtractHours(120).time,
        dateTime: subtractHours(120).dateTime,
        type: 'maintenance_intervention',
        title: 'Oil-Air Separator Cartridge Replacement',
        description: 'Replaced coalescing oil separator cartridge and replenished synthetic ester air compressor lubricant (ISO VG 46).',
        previousHealthState: 'Normal',
        newHealthState: 'Normal',
        performedBy: 'Pneumatics Specialist T. Morales (#440)',
        interventionCategory: 'Scheduled Preventative',
        workOrderNumber: 'WO-2026-8710',
        status: 'verified',
        technicianNotes: 'Differential pressure across separator decreased to 0.18 bar.',
        metricsSnapshot: { temperature: 303.0, vibration: 34.0, torque: 40.0, rulHours: 2900 }
      },
      {
        id: 'hist-comp-1b',
        machineId: 'precision-air-compressor',
        machineName: 'Precision Air Compressor',
        timestamp: subtractHours(16).time,
        dateTime: subtractHours(16).dateTime,
        type: 'health_change',
        title: 'Health State: Normal ➔ Advisory',
        description: 'Air manifold discharge pressure oscillation and transient thermal drift detected.',
        previousHealthState: 'Normal',
        newHealthState: 'Advisory',
        performedBy: 'PRISM Diagnostic Agent',
        interventionCategory: 'Condition-Based',
        status: 'completed',
        technicianNotes: 'Drain valve particulate accumulation flagging purge cycle timeout.',
        metricsSnapshot: { temperature: 306.8, vibration: 52.0, torque: 44.5, rulHours: 650 }
      },
      {
        id: 'hist-comp-2',
        machineId: 'precision-air-compressor',
        machineName: 'Precision Air Compressor',
        timestamp: subtractHours(12).time,
        dateTime: subtractHours(12).dateTime,
        type: 'maintenance_intervention',
        title: 'Condensate Auto-Drain Solenoid Valve Cleaning',
        description: 'Dismantled timer-controlled electric solenoid drain valve; purged particulate sludge and tested manual bypass.',
        previousHealthState: 'Advisory',
        newHealthState: 'Normal',
        performedBy: 'Facility Maintenance A. Gomez (#208)',
        interventionCategory: 'General Inspection',
        workOrderNumber: 'WO-2026-9005',
        status: 'completed',
        technicianNotes: 'No moisture carryover observed downstream in desiccant dryer manifold.',
        metricsSnapshot: { temperature: 301.8, vibration: 33.2, torque: 39.5, rulHours: 2850 }
      }
    ];
  }

  public getLogsForMachine(machineId: string): MachineHistoryLogEntry[] {
    return this.logs
      .filter(l => l.machineId === machineId)
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }

  public getAllLogs(): MachineHistoryLogEntry[] {
    return [...this.logs].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }

  public recordHealthChange(
    machine: MachineState,
    previousState: HealthState,
    newState: HealthState,
    reason?: string
  ): MachineHistoryLogEntry | null {
    if (previousState === newState) return null;

    const now = new Date();
    const isWorse = 
      (previousState === 'Normal' && (newState === 'Advisory' || newState === 'Action Required')) ||
      (previousState === 'Advisory' && newState === 'Action Required');

    const entry: MachineHistoryLogEntry = {
      id: `hist-hc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      machineId: machine.id,
      machineName: machine.name,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      dateTime: now.toISOString().replace('T', ' ').substring(0, 19),
      type: 'health_change',
      title: `Health State Transition: ${previousState} ➔ ${newState}`,
      description: reason || (
        newState === 'Action Required'
          ? `Critical trip detected: telemetry metrics breached high threshold limits. Automatic safety protocol engaged.`
          : newState === 'Advisory'
          ? `Telemetry drift detected: sensors operating in warning zone. Inspection advised.`
          : newState === 'Post-Maintenance'
          ? `Machine transitioning to 15s post-maintenance calibration stabilization mode.`
          : `Sensors stabilized within nominal operational parameters.`
      ),
      previousHealthState: previousState,
      newHealthState: newState,
      performedBy: 'PRISM Autonomous Engine',
      interventionCategory: isWorse ? 'Condition-Based' : 'Autonomous Recovery',
      status: 'completed',
      technicianNotes: machine.xaiExplanation?.summary || 'Automated state machine evaluation.',
      metricsSnapshot: {
        temperature: machine.currentReadings.temperature,
        vibration: machine.currentReadings.vibration,
        torque: machine.currentReadings.torque,
        rulHours: machine.rulMetrics?.estimatedHoursRemaining
      }
    };

    this.logs.unshift(entry);
    this.trimLogs();
    this.notify();
    return entry;
  }

  public recordIntervention(
    machineId: string,
    intervention: {
      title: string;
      description: string;
      category?: InterventionCategory;
      performedBy?: string;
      workOrderNumber?: string;
      technicianNotes?: string;
      previousHealthState?: HealthState;
      newHealthState?: HealthState;
      status?: 'completed' | 'in_progress' | 'verified';
      machineName?: string;
      snapshot?: { temperature?: number; vibration?: number; torque?: number; rulHours?: number };
    }
  ): MachineHistoryLogEntry {
    const now = new Date();
    const entry: MachineHistoryLogEntry = {
      id: `hist-maint-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      machineId,
      machineName: intervention.machineName,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      dateTime: now.toISOString().replace('T', ' ').substring(0, 19),
      type: 'maintenance_intervention',
      title: intervention.title,
      description: intervention.description,
      previousHealthState: intervention.previousHealthState,
      newHealthState: intervention.newHealthState,
      performedBy: intervention.performedBy || 'Operator Action Console',
      interventionCategory: intervention.category || 'Condition-Based',
      workOrderNumber: intervention.workOrderNumber || `WO-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: intervention.status || 'completed',
      technicianNotes: intervention.technicianNotes,
      metricsSnapshot: intervention.snapshot
    };

    this.logs.unshift(entry);
    this.trimLogs();
    this.notify();
    return entry;
  }

  public addManualEntry(entryData: Omit<MachineHistoryLogEntry, 'id' | 'timestamp' | 'dateTime'>): MachineHistoryLogEntry {
    const now = new Date();
    const entry: MachineHistoryLogEntry = {
      ...entryData,
      id: `hist-user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      dateTime: now.toISOString().replace('T', ' ').substring(0, 19),
    };

    this.logs.unshift(entry);
    this.trimLogs();
    this.notify();
    return entry;
  }

  private trimLogs() {
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(0, 500);
    }
  }

  public subscribe(listener: HistoryListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public exportAsJSON(machineId?: string): string {
    const data = machineId ? this.getLogsForMachine(machineId) : this.getAllLogs();
    return JSON.stringify(data, null, 2);
  }

  public exportAsCSV(machineId?: string): string {
    const data = machineId ? this.getLogsForMachine(machineId) : this.getAllLogs();
    const headers = [
      'ID',
      'DateTime',
      'MachineID',
      'MachineName',
      'Type',
      'Title',
      'PreviousState',
      'NewState',
      'PerformedBy',
      'Category',
      'WorkOrder',
      'Status',
      'Description',
      'TechnicianNotes'
    ];

    const rows = data.map(entry => [
      entry.id,
      `"${entry.dateTime}"`,
      `"${entry.machineId}"`,
      `"${entry.machineName || ''}"`,
      `"${entry.type}"`,
      `"${entry.title.replace(/"/g, '""')}"`,
      `"${entry.previousHealthState || ''}"`,
      `"${entry.newHealthState || ''}"`,
      `"${entry.performedBy}"`,
      `"${entry.interventionCategory || ''}"`,
      `"${entry.workOrderNumber || ''}"`,
      `"${entry.status}"`,
      `"${(entry.description || '').replace(/"/g, '""')}"`,
      `"${(entry.technicianNotes || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  public clearLogsForMachine(machineId: string) {
    this.logs = this.logs.filter(l => l.machineId !== machineId);
    this.notify();
  }
}

export const historyLogManager = new HistoryLogManager();
