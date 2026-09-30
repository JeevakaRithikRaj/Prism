import { MACHINE_REGISTRY } from '../data/MachineRegistry';
import { SimulationEngine } from '../utils/SimulationEngine';
import { MachineState, Scenario, HealthState } from '../types';
import { historyLogManager } from './HistoryLogManager';

type Listener = (states: MachineState[], isRunning: boolean) => void;

class SimulationManager {
  private engines: Map<string, SimulationEngine> = new Map();
  private previousHealthStates: Map<string, HealthState> = new Map();
  private listeners: Set<Listener> = new Set();
  private timer: number | null = null;
  public isRunning: boolean = true;

  constructor() {
    this.initEngines();
    this.start();
  }

  private initEngines() {
    MACHINE_REGISTRY.forEach(config => {
      const engine = new SimulationEngine(config, 'Normal');
      this.engines.set(config.id, engine);
      this.previousHealthStates.set(config.id, engine.healthState);
    });
  }

  public start() {
    if (this.timer) return;
    this.isRunning = true;
    this.timer = window.setInterval(() => {
      this.tickAll();
    }, 1000);
    this.notify();
  }

  public pause() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    this.notify();
  }

  public togglePlayPause() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  public tickAll() {
    this.engines.forEach(engine => {
      const prev = this.previousHealthStates.get(engine.machineConfig.id) || engine.healthState;
      engine.tick();
      const current = engine.healthState;
      if (prev !== current) {
        historyLogManager.recordHealthChange(engine.getState(), prev, current);
        this.previousHealthStates.set(engine.machineConfig.id, current);
      }
    });
    this.notify();
  }

  public setGlobalScenario(scenario: Scenario) {
    this.engines.forEach(engine => {
      const prev = this.previousHealthStates.get(engine.machineConfig.id) || engine.healthState;
      engine.setScenario(scenario);
      const current = engine.healthState;
      if (prev !== current) {
        historyLogManager.recordHealthChange(
          engine.getState(),
          prev,
          current,
          `Global operational scenario shifted to "${scenario}"`
        );
        this.previousHealthStates.set(engine.machineConfig.id, current);
      }
    });
    this.notify();
  }

  public setMachineScenario(machineId: string, scenario: Scenario) {
    const engine = this.engines.get(machineId);
    if (engine) {
      const prev = this.previousHealthStates.get(machineId) || engine.healthState;
      engine.setScenario(scenario);
      const current = engine.healthState;
      if (prev !== current) {
        historyLogManager.recordHealthChange(
          engine.getState(),
          prev,
          current,
          `Scenario manually switched to "${scenario}"`
        );
        this.previousHealthStates.set(machineId, current);
      }
      this.notify();
    }
  }

  public forceMachineMaintenance(machineId: string) {
    const engine = this.engines.get(machineId);
    if (engine) {
      const prev = this.previousHealthStates.get(machineId) || engine.healthState;
      engine.forceMaintenance();
      const current = engine.healthState;
      
      historyLogManager.recordIntervention(machineId, {
        title: 'Forced Maintenance Stabilization Cycle Initiated',
        description: 'Operator commanded 15-second post-maintenance calibration loop. Sensor offsets and baseline zero-references initializing.',
        category: 'Condition-Based',
        performedBy: 'Operator Command Console',
        previousHealthState: prev,
        newHealthState: current,
        status: 'in_progress',
        machineName: engine.machineConfig.name,
        technicianNotes: 'Active 15-tick recovery stabilization sequence running.',
        snapshot: {
          temperature: engine.currentReadings.temperature,
          vibration: engine.currentReadings.vibration,
          torque: engine.currentReadings.torque,
          rulHours: engine.deriveRULMetrics()?.estimatedHoursRemaining
        }
      });

      this.previousHealthStates.set(machineId, current);
      this.notify();
    }
  }

  public resetMachineSensors(machineId: string) {
    const engine = this.engines.get(machineId);
    if (engine) {
      const prev = this.previousHealthStates.get(machineId) || engine.healthState;
      engine.resetSensors();
      const current = engine.healthState;

      historyLogManager.recordIntervention(machineId, {
        title: 'Factory Sensor Baseline & Zero-Offset Reset',
        description: 'Recalibrated digital telemetry channels and analog transducers back to factory baseline specifications.',
        category: 'Sensor Calibration',
        performedBy: 'Lead Instrumentation Engineer',
        previousHealthState: prev,
        newHealthState: current,
        status: 'verified',
        machineName: engine.machineConfig.name,
        technicianNotes: 'Transducer drift calibrated to 0.00% error. Nominal operating baseline active.',
        snapshot: {
          temperature: engine.currentReadings.temperature,
          vibration: engine.currentReadings.vibration,
          torque: engine.currentReadings.torque,
          rulHours: engine.deriveRULMetrics()?.estimatedHoursRemaining
        }
      });

      this.previousHealthStates.set(machineId, current);
      this.notify();
    }
  }

  public triggerMachineFaultTest(machineId: string) {
    const engine = this.engines.get(machineId);
    if (engine) {
      const prev = this.previousHealthStates.get(machineId) || engine.healthState;
      engine.triggerFaultTest();
      const current = engine.healthState;

      historyLogManager.recordIntervention(machineId, {
        title: 'Critical Fault Anomaly Injection Test',
        description: 'Simulated high-stress spike: Thermal elevation (314K), bearing vibration (108 μm), and motor torque overload (54 Nm).',
        category: 'Condition-Based',
        performedBy: 'PRISM Diagnostics Stress Testing',
        previousHealthState: prev,
        newHealthState: current,
        status: 'completed',
        machineName: engine.machineConfig.name,
        technicianNotes: 'Audible and visual annunciator safety interlock alarms triggered as expected.',
        snapshot: {
          temperature: engine.currentReadings.temperature,
          vibration: engine.currentReadings.vibration,
          torque: engine.currentReadings.torque,
          rulHours: engine.deriveRULMetrics()?.estimatedHoursRemaining
        }
      });

      this.previousHealthStates.set(machineId, current);
      this.notify();
    }
  }

  public getAllStates(): MachineState[] {
    return Array.from(this.engines.values()).map(e => e.getState());
  }

  public getMachineState(machineId: string): MachineState | undefined {
    return this.engines.get(machineId)?.getState();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Send immediate initial state on subscribe
    listener(this.getAllStates(), this.isRunning);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const states = this.getAllStates();
    this.listeners.forEach(listener => listener(states, this.isRunning));
  }
}

export const simulationManager = new SimulationManager();
