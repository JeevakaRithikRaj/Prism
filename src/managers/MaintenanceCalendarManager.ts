import {
  MaintenanceEvent,
  MachineState,
  MaintenancePriority,
  MaintenanceEventCategory
} from '../types';
import { historyLogManager } from './HistoryLogManager';
import { toastManager } from './ToastManager';

type CalendarListener = () => void;

class MaintenanceCalendarManager {
  private events: MaintenanceEvent[] = [];
  private listeners: Set<CalendarListener> = new Set();
  private storageKey = 'prism_maintenance_calendar_events_v1';

  constructor() {
    this.loadEvents();
  }

  private loadEvents() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.events = JSON.parse(stored);
        return;
      }
    } catch {
      // Fallback to seed data
    }
    this.seedInitialEvents();
    this.persist();
  }

  private persist() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.events));
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  private seedInitialEvents() {
    const today = new Date(); // local time anchor e.g. 2026-09-30
    const addDays = (days: number): string => {
      const d = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
    };

    this.events = [
      // CNC Milling Center Events
      {
        id: 'evt-cnc-1',
        machineId: 'cnc-milling-machine',
        machineName: 'CNC Milling Center',
        title: 'Spindle Bearing Klüber Lubrication & Runout Check',
        description: 'Periodic re-greasing of high-speed hybrid ceramic spindle bearings and laser interferometer runout calibration.',
        category: 'Routine Preventative',
        date: addDays(2),
        time: '09:00',
        estimatedDurationMinutes: 45,
        assignedTechnician: 'M. Kowalski (#402)',
        priority: 'High',
        status: 'scheduled',
        sopCode: 'SOP-CNC-LUB-012',
        targetSubsystem: 'Main High-Speed Spindle & Collet',
        healthTrendTrigger: {
          metric: 'Bearing Vibration (RMS)',
          triggerReason: 'Vibration gradient projecting 12% drift toward 90 μm advisory threshold',
          currentValue: 35.4,
          thresholdValue: 90.0,
          unit: 'μm'
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 'evt-cnc-2',
        machineId: 'cnc-milling-machine',
        machineName: 'CNC Milling Center',
        title: 'HSK-A63 Tool Magazine Clamp Force Verification',
        description: 'Mechanical drawbar tension inspection using hydraulic pull-force gauge. Target 18 kN ± 0.5 kN.',
        category: 'Inspection & Audit',
        date: addDays(7),
        time: '14:30',
        estimatedDurationMinutes: 30,
        assignedTechnician: 'D. Vance (#118)',
        priority: 'Medium',
        status: 'scheduled',
        sopCode: 'SOP-CNC-ATC-004',
        targetSubsystem: 'Automatic Tool Changer (ATC-30)',
        createdAt: new Date().toISOString()
      },
      {
        id: 'evt-cnc-3',
        machineId: 'cnc-milling-machine',
        machineName: 'CNC Milling Center',
        title: 'Axis Ball-Screw Preload & Backlash Laser Compensation',
        description: 'Bi-annual pitch error mapping and dual-nut preloading check across X/Y/Z linear axes.',
        category: 'Component Overhaul',
        date: addDays(14),
        time: '08:00',
        estimatedDurationMinutes: 120,
        assignedTechnician: 'Lead Precision Tech S. Ray (#301)',
        priority: 'Medium',
        status: 'scheduled',
        sopCode: 'SOP-CNC-AXS-088',
        targetSubsystem: 'X/Y/Z Linear Ball-Screw Drives',
        createdAt: new Date().toISOString()
      },

      // Industrial Cooling Pump Events
      {
        id: 'evt-pmp-1',
        machineId: 'industrial-cooling-pump',
        machineName: 'Industrial Coolant Pump',
        title: 'Suction Strainer Ultrasonic Cleaning & Valve Trim',
        description: 'Clean 50-mesh intake strainer basket and test automated motorized bypass valve stroke speed.',
        category: 'Predictive Condition-Based',
        date: addDays(1),
        time: '11:00',
        estimatedDurationMinutes: 35,
        assignedTechnician: 'K. Patel (#219)',
        priority: 'High',
        status: 'scheduled',
        sopCode: 'SOP-PMP-HYD-041',
        targetSubsystem: 'Suction Manifold & Strainer Basket',
        healthTrendTrigger: {
          metric: 'Suction Pressure Drop & Temp',
          triggerReason: 'Flow differential pressure trending 0.22 bar higher than nominal baseline',
          currentValue: 298.5,
          thresholdValue: 306.0,
          unit: 'K'
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 'evt-pmp-2',
        machineId: 'industrial-cooling-pump',
        machineName: 'Industrial Coolant Pump',
        title: 'Mechanical Seal Barrier Fluid Purge & Replenishment',
        description: 'Flush barrier reservoir fluid, verify silicon carbide face integrity, and test leak-off sensor probe.',
        category: 'Routine Preventative',
        date: addDays(6),
        time: '13:00',
        estimatedDurationMinutes: 40,
        assignedTechnician: 'R. Sterling (#305)',
        priority: 'Medium',
        status: 'scheduled',
        sopCode: 'SOP-PMP-SEA-019',
        targetSubsystem: 'Tandem Cartridge Mechanical Seal',
        createdAt: new Date().toISOString()
      },

      // Conveyor Drive Motor Events
      {
        id: 'evt-mot-1',
        machineId: 'conveyor-drive-motor',
        machineName: 'Conveyor Drive Motor',
        title: 'Sonic Belt Tension Verification & Tachometer Sync',
        description: 'Acoustic resonance tension test across dual V-belts (target 245 N) and encoder pulse sync.',
        category: 'Routine Preventative',
        date: addDays(3),
        time: '10:00',
        estimatedDurationMinutes: 25,
        assignedTechnician: 'B. Hoffman (#112)',
        priority: 'Medium',
        status: 'scheduled',
        sopCode: 'SOP-MOT-BLT-009',
        targetSubsystem: 'Helical Planetary Reduction Gearbox',
        createdAt: new Date().toISOString()
      },
      {
        id: 'evt-mot-2',
        machineId: 'conveyor-drive-motor',
        machineName: 'Conveyor Drive Motor',
        title: 'VFD Inverter Thermal Probe Recalibration & Bus Audit',
        description: 'Verify stator winding RTD temperature probes and inspect DC bus capacitor ripple on Danfoss drive.',
        category: 'Sensor Calibration',
        date: addDays(9),
        time: '15:00',
        estimatedDurationMinutes: 30,
        assignedTechnician: 'L. Chen (#507)',
        priority: 'Low',
        status: 'scheduled',
        sopCode: 'SOP-ELE-VFD-022',
        targetSubsystem: 'Permanent Magnet Synchronous Stator',
        createdAt: new Date().toISOString()
      },

      // Precision Air Compressor Events
      {
        id: 'evt-cmp-1',
        machineId: 'precision-air-compressor',
        machineName: 'Precision Air Compressor',
        title: 'Coalescing Oil Separator Element Replacement',
        description: 'Change out coalescing filter canister (ISO VG 46) to maintain low differential pressure under continuous load.',
        category: 'Routine Preventative',
        date: addDays(4),
        time: '08:30',
        estimatedDurationMinutes: 45,
        assignedTechnician: 'T. Morales (#440)',
        priority: 'High',
        status: 'scheduled',
        sopCode: 'SOP-AIR-SEP-005',
        targetSubsystem: 'Oil-Air Separator Cartridge',
        healthTrendTrigger: {
          metric: 'Air Differential Pressure',
          triggerReason: 'Filter differential pressure projected to reach 0.8 bar within 96 hours',
          currentValue: 0.62,
          thresholdValue: 0.80,
          unit: 'bar'
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 'evt-cmp-2',
        machineId: 'precision-air-compressor',
        machineName: 'Precision Air Compressor',
        title: 'Auto-Drain Solenoid Purge Valve Inspection',
        description: 'Dismantle timer-controlled electric solenoid drain valve; purge particulate sludge and test manual bypass.',
        category: 'Inspection & Audit',
        date: addDays(11),
        time: '14:00',
        estimatedDurationMinutes: 20,
        assignedTechnician: 'A. Gomez (#208)',
        priority: 'Low',
        status: 'scheduled',
        sopCode: 'SOP-AIR-DRN-014',
        createdAt: new Date().toISOString()
      }
    ];
  }

  public getEventsForMachine(machineId: string): MaintenanceEvent[] {
    return this.events
      .filter((e) => e.machineId === machineId)
      .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  }

  public getAllEvents(): MaintenanceEvent[] {
    return [...this.events].sort(
      (a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
    );
  }

  public scheduleEvent(
    eventData: Omit<MaintenanceEvent, 'id' | 'createdAt'>
  ): MaintenanceEvent {
    const newEvent: MaintenanceEvent = {
      ...eventData,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };

    this.events.push(newEvent);
    this.persist();
    this.notify();

    toastManager.success(
      'Maintenance Event Scheduled',
      `"${newEvent.title}" scheduled for ${newEvent.date} at ${newEvent.time}.`,
      { duration: 4500 }
    );

    return newEvent;
  }

  public updateEvent(id: string, updates: Partial<MaintenanceEvent>): boolean {
    const idx = this.events.findIndex((e) => e.id === id);
    if (idx === -1) return false;

    this.events[idx] = { ...this.events[idx], ...updates };
    this.persist();
    this.notify();

    toastManager.info('Maintenance Event Updated', `Updated schedule for "${this.events[idx].title}".`);
    return true;
  }

  public deleteEvent(id: string): boolean {
    const idx = this.events.findIndex((e) => e.id === id);
    if (idx === -1) return false;

    const removed = this.events.splice(idx, 1)[0];
    this.persist();
    this.notify();

    toastManager.info('Event Cancelled', `Removed "${removed.title}" from the maintenance calendar.`);
    return true;
  }

  public completeEvent(id: string, technicianNotes?: string): boolean {
    const evt = this.events.find((e) => e.id === id);
    if (!evt) return false;

    evt.status = 'completed';
    this.persist();
    this.notify();

    // Log this completion into HistoryLogManager
    historyLogManager.recordIntervention(evt.machineId, {
      title: `Completed: ${evt.title}`,
      description: evt.description,
      category: evt.category === 'Routine Preventative' ? 'Scheduled Preventative' : 'Condition-Based',
      performedBy: evt.assignedTechnician,
      workOrderNumber: `WO-${evt.id.slice(-4).toUpperCase()}`,
      status: 'verified',
      technicianNotes: technicianNotes || `Completed scheduled calendar maintenance according to ${evt.sopCode || 'standard SOP'}.`,
      machineName: evt.machineName
    });

    toastManager.success(
      'Maintenance Marked Completed',
      `"${evt.title}" recorded as completed and added to history log trail.`,
      { duration: 5000 }
    );

    return true;
  }

  /**
   * Generates a proactive maintenance calendar event derived directly from
   * the machine's live health trends, Remaining Useful Life (RUL), and sensor drift rates.
   */
  public autoScheduleHealthTrendEvent(machine: MachineState): MaintenanceEvent {
    const isCritical = machine.healthState === 'Action Required';
    const isAdvisory = machine.healthState === 'Advisory';

    // Target intervention date based on RUL
    let scheduledDate: string;
    let priority: MaintenancePriority;
    let time = '09:00';

    const now = new Date();
    if (isCritical) {
      // Immediate next 4 hours or tomorrow morning
      const d = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      scheduledDate = d.toISOString().split('T')[0];
      priority = 'Critical';
      time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } else if (isAdvisory) {
      // Within 24-48 hours
      const d = new Date(now.getTime() + 36 * 60 * 60 * 1000);
      scheduledDate = d.toISOString().split('T')[0];
      priority = 'High';
    } else {
      // Use recommendedInterventionDate or 10 days out
      if (machine.rulMetrics?.recommendedInterventionDate) {
        scheduledDate = machine.rulMetrics.recommendedInterventionDate;
      } else {
        const d = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
        scheduledDate = d.toISOString().split('T')[0];
      }
      priority = 'Medium';
    }

    // Determine targeted title and category
    let title = 'Trend-Directed Preventative Maintenance & Calibration';
    let category: MaintenanceEventCategory = 'Predictive Condition-Based';
    let targetSubsystem = machine.subsystems[0]?.name || 'Primary Drive';
    let sopCode = 'SOP-AI-TREND-001';

    if (machine.id === 'cnc-milling-machine') {
      title = 'Condition-Based Spindle Vibration & Ceramic Bearing Service';
      sopCode = 'SOP-CNC-VIB-018';
      targetSubsystem = 'Main High-Speed Spindle & Collet';
    } else if (machine.id === 'industrial-cooling-pump') {
      title = 'Hydraulic Cavitation Relief & Suction Strainer Flush';
      sopCode = 'SOP-PMP-CAV-024';
      targetSubsystem = 'Multistage Stainless Impeller Cavity';
    } else if (machine.id === 'conveyor-drive-motor') {
      title = 'Torque Stabilization & VFD Belt Harmonic Adjustment';
      sopCode = 'SOP-MOT-TRQ-033';
      targetSubsystem = 'Helical Planetary Reduction Gearbox';
    } else {
      title = 'Separator Filter Purge & Pneumatic Pressure Calibration';
      sopCode = 'SOP-AIR-PRS-042';
      targetSubsystem = 'Oil-Air Separator Cartridge';
    }

    const event = this.scheduleEvent({
      machineId: machine.id,
      machineName: machine.name,
      title,
      description: `Auto-generated from telemetry health trends. RUL degradation rate: ${machine.rulMetrics?.degradationRatePerHour.toFixed(2)}%/hr. Health Index: ${machine.rulMetrics?.healthIndex.toFixed(0)}%.`,
      category,
      date: scheduledDate,
      time,
      estimatedDurationMinutes: isCritical ? 60 : 35,
      assignedTechnician: 'PRISM Predictive Reliability Tech',
      priority,
      status: 'scheduled',
      sopCode,
      targetSubsystem,
      healthTrendTrigger: {
        metric: 'RUL Degradation & Sensor Drift',
        triggerReason: `Operating health state is currently "${machine.healthState}". Projected RUL is ${machine.rulMetrics?.estimatedHoursRemaining} hours.`,
        currentValue: machine.rulMetrics?.healthIndex ?? 85,
        thresholdValue: 70,
        unit: '% Health'
      },
      isAutoSuggested: true
    });

    return event;
  }

  public subscribe(listener: CalendarListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }
}

export const maintenanceCalendarManager = new MaintenanceCalendarManager();
