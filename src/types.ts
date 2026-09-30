export type HealthState = 'Normal' | 'Advisory' | 'Action Required' | 'Post-Maintenance';

export type Scenario = 'Normal' | 'Advisory' | 'Action Required' | 'Post-Maintenance';

export interface SensorConfig {
  key: string;
  name: string;
  unit: string;
  baseMean: number;
  threshold: number;
  warningThreshold: number; // ~90% of threshold
  minVal: number;
  maxVal: number;
  stepNoise: number;
}

export interface SensorReadings {
  temperature: number;
  air_temperature: number;
  vibration: number;
  torque: number;
  rotational_speed: number;
  tool_wear: number;
  [key: string]: number;
}

export interface MachineSubsystem {
  id: string;
  name: string;
  type: 'spindle' | 'drive' | 'tooling' | 'cooling' | 'lubrication' | 'pneumatics' | 'structural' | 'hydraulics';
  status: 'Normal' | 'Warning' | 'Critical';
  temperature: number;
  stressPercent: number;
  healthIndex: number; // 0 - 100%
  description: string;
  coordinates: { x: number; y: number }; // Relative coordinates on schematic (0-100%)
}

export interface PLCChannel {
  tag: string;
  label: string;
  type: 'DI' | 'DO' | 'AI' | 'AO';
  value: boolean | number;
  unit?: string;
  state: 'nominal' | 'warning' | 'tripped';
}

export interface VibrationSpectrumPoint {
  hz: number;
  amplitude: number;
  label?: string;
  isHarmonic?: boolean;
  isDefectFreq?: boolean;
}

export interface VibrationSpectrumData {
  points: VibrationSpectrumPoint[];
  isoZone: 'A' | 'B' | 'C' | 'D'; // ISO 10816-3 zones
  isoDescription: string;
  velocityRms: number; // mm/s
  accelerationPeak: number; // g
  crestFactor: number;
  defectFrequencies: { name: string; hz: number; detected: boolean }[];
}

export interface RULMetrics {
  estimatedHoursRemaining: number;
  baselineLifespanHours: number;
  confidenceLowerHours: number;
  confidenceUpperHours: number;
  degradationRatePerHour: number;
  healthIndex: number; // 0 - 100%
  recommendedInterventionDate: string;
}

export interface OEEMetrics {
  availability: number; // %
  performance: number; // %
  quality: number; // %
  overallOee: number; // %
  cycleTimeSeconds: number;
  partsProducedToday: number;
  defectCount: number;
}

export interface MachineConfig {
  id: string;
  name: string;
  model: string;
  location: string;
  icon: string;
  description: string;
  serialNumber: string;
  firmwareVersion: string;
  commissionDate: string;
  sensors: Record<string, SensorConfig>;
  subsystems: MachineSubsystem[];
}

export interface CWRUEvidence {
  bearingStatus: 'Normal' | 'Ball Defect (0.014")' | 'Inner Race Defect' | 'Outer Race Defect';
  peakFrequencyHz: number;
  vibrationRms: number;
  faultSeverityIndex: number; // 0 - 100
  historySamplePoints: number[];
}

export interface XAIExplanation {
  summary: string;
  primaryCause: string;
  healthState: HealthState;
  confidenceScore: number;
  contributingSensors: {
    sensorName: string;
    value: number;
    threshold: number;
    unit: string;
    percentageOfThreshold: number;
    status: 'Normal' | 'Warning' | 'Critical';
  }[];
  recommendedActions: string[];
  cwruEvidence?: CWRUEvidence;
}

export interface AlarmEvent {
  id: string;
  timestamp: string;
  machineId: string;
  machineName: string;
  sensorKey: string;
  severity: 'Critical' | 'Warning' | 'Advisory';
  message: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

export type HistoryLogType = 'health_change' | 'maintenance_intervention' | 'operator_action' | 'alarm_trip';

export type InterventionCategory = 
  | 'Scheduled Preventative' 
  | 'Corrective Repair' 
  | 'Condition-Based' 
  | 'Autonomous Recovery' 
  | 'Sensor Calibration' 
  | 'General Inspection';

export interface MachineHistoryLogEntry {
  id: string;
  machineId: string;
  machineName?: string;
  timestamp: string; // e.g. "14:52:10"
  dateTime: string; // formatted e.g. "2026-09-30 14:52:10"
  type: HistoryLogType;
  title: string;
  description: string;
  previousHealthState?: HealthState;
  newHealthState?: HealthState;
  performedBy: string; // e.g. "PRISM Automation System", "Senior Tech J. Vance"
  interventionCategory?: InterventionCategory;
  workOrderNumber?: string;
  status: 'completed' | 'in_progress' | 'verified';
  technicianNotes?: string;
  metricsSnapshot?: {
    temperature?: number;
    vibration?: number;
    torque?: number;
    rulHours?: number;
  };
}

export interface MachineState {
  id: string;
  name: string;
  model: string;
  location: string;
  scenario: Scenario;
  healthState: HealthState;
  recoveryTicks: number;
  currentReadings: SensorReadings;
  trendBuffers: Record<string, number[]>; // Array of historical readings (30-60 points)
  timestamps: string[];
  xaiExplanation: XAIExplanation;
  lastUpdated: string;
  // Enhanced Machine-Level Telemetry
  subsystems: MachineSubsystem[];
  plcChannels: PLCChannel[];
  vibrationSpectrum: VibrationSpectrumData;
  rulMetrics: RULMetrics;
  oeeMetrics: OEEMetrics;
  serialNumber?: string;
  firmwareVersion?: string;
  commissionDate?: string;
  description?: string;
}

export type ViewMode = 'plant-overview' | 'machine-deep-dive' | 'alarm-annunciator' | 'spectrum-analyzer';

export type AppExperienceMode = 'website' | 'app';

export interface ToastNotification {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number; // ms
  timestamp: number;
  fileDetails?: {
    filename?: string;
    sizeBytes?: number;
    format?: 'JSON' | 'CSV';
    itemCount?: number;
  };
}

export interface HealthTrendTrigger {
  metric: string;
  triggerReason: string;
  currentValue: number;
  thresholdValue: number;
  unit: string;
}

export type MaintenancePriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type MaintenanceEventStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type MaintenanceEventCategory =
  | 'Routine Preventative'
  | 'Predictive Condition-Based'
  | 'Sensor Calibration'
  | 'Component Overhaul'
  | 'Inspection & Audit';

export interface MaintenanceEvent {
  id: string;
  machineId: string;
  machineName: string;
  title: string;
  description: string;
  category: MaintenanceEventCategory;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  estimatedDurationMinutes: number;
  assignedTechnician: string;
  priority: MaintenancePriority;
  status: MaintenanceEventStatus;
  sopCode?: string;
  targetSubsystem?: string;
  healthTrendTrigger?: HealthTrendTrigger;
  isAutoSuggested?: boolean;
  createdAt: string;
}

export interface AutoExportConfig {
  enabled: boolean;
  intervalMinutes: number; // default 60 (1 hour)
  targetScope: 'all_machines' | string; // 'all_machines' or specific machineId
  includeTelemetrySnapshot: boolean;
  autoDownloadToFileSystem: boolean;
  notifyOnExport: boolean;
  maxStoredSnapshots: number; // default 48 (retains 48 hourly snapshots in local storage)
  lastExportAt?: string;
  nextExportAt?: string;
}

export interface StoredExportSnapshot {
  id: string;
  filename: string;
  createdAt: string;
  scope: string;
  machinesCount: number;
  totalLogRecords: number;
  sizeBytes: number;
  data: any;
}

