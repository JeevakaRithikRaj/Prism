import {
  AutoExportConfig,
  StoredExportSnapshot,
  MachineState
} from '../types';
import { historyLogManager } from './HistoryLogManager';
import { simulationManager } from './SimulationManager';
import { toastManager } from './ToastManager';

type AutoExportListener = (config: AutoExportConfig, snapshots: StoredExportSnapshot[]) => void;

class AutoExportManager {
  private config: AutoExportConfig = {
    enabled: true,
    intervalMinutes: 60, // 1 hour per user request
    targetScope: 'all_machines',
    includeTelemetrySnapshot: true,
    autoDownloadToFileSystem: false,
    notifyOnExport: true,
    maxStoredSnapshots: 48 // 48 hours retention
  };

  private snapshots: StoredExportSnapshot[] = [];
  private listeners: Set<AutoExportListener> = new Set();
  private checkIntervalTimer: number | null = null;
  private nextRunTimestamp: number = 0;

  private configStorageKey = 'prism_auto_export_config_v1';
  private snapshotsStorageKey = 'prism_auto_export_snapshots_v1';

  constructor() {
    this.loadState();
    this.startScheduler();
  }

  private loadState() {
    // 1. Load Config
    try {
      const storedConfig = localStorage.getItem(this.configStorageKey);
      if (storedConfig) {
        this.config = { ...this.config, ...JSON.parse(storedConfig) };
      }
    } catch {
      // Fallback to defaults
    }

    // 2. Load Stored Snapshots
    try {
      const storedSnapshots = localStorage.getItem(this.snapshotsStorageKey);
      if (storedSnapshots) {
        this.snapshots = JSON.parse(storedSnapshots);
      }
    } catch {
      // Fallback
    }

    // If no snapshots exist yet, seed a baseline hourly archive from 1 hour ago
    if (this.snapshots.length === 0) {
      this.seedBaselineSnapshot();
    }

    // Initialize next run timestamp
    this.scheduleNextRun();
  }

  private seedBaselineSnapshot() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const timeStr = oneHourAgo.toISOString().replace(/[:.]/g, '-');
    const filename = `PRISM_AutoExport_AllMachines_${timeStr}.json`;

    const sampleData = {
      exportMetadata: {
        system: 'PRISM - Predictive Reliability & Intelligent Systems for Maintenance',
        reportType: 'Automated Hourly Machine Health Logs & Telemetry Snapshot',
        generatedAt: oneHourAgo.toISOString(),
        version: '2.0.0',
        automatedSchedule: {
          interval: '60 minutes',
          mode: 'hourly_archive',
          retention: '48 snapshots'
        }
      },
      plantOverviewSummary: {
        totalMachinesCount: 4,
        operationalStatus: 'Nominal Continuous Monitoring',
        recordedAt: oneHourAgo.toISOString()
      },
      archivedLogsCount: 8,
      note: 'Initial automated hourly health log snapshot archived to local storage.'
    };

    const serialized = JSON.stringify(sampleData, null, 2);

    this.snapshots.unshift({
      id: `snap-${Date.now() - 3600000}`,
      filename,
      createdAt: oneHourAgo.toISOString(),
      scope: 'all_machines',
      machinesCount: 4,
      totalLogRecords: 8,
      sizeBytes: new Blob([serialized]).size,
      data: sampleData
    });

    this.persistSnapshots();
  }

  private persistConfig() {
    try {
      localStorage.setItem(this.configStorageKey, JSON.stringify(this.config));
    } catch {
      // Storage restricted
    }
  }

  private persistSnapshots() {
    try {
      localStorage.setItem(this.snapshotsStorageKey, JSON.stringify(this.snapshots));
    } catch {
      // Storage full or quota exceeded - prune oldest half
      if (this.snapshots.length > 5) {
        this.snapshots = this.snapshots.slice(0, Math.floor(this.snapshots.length / 2));
        try {
          localStorage.setItem(this.snapshotsStorageKey, JSON.stringify(this.snapshots));
        } catch {
          // ignore
        }
      }
    }
  }

  private scheduleNextRun() {
    const intervalMs = this.config.intervalMinutes * 60 * 1000;
    this.nextRunTimestamp = Date.now() + intervalMs;
    this.config.nextExportAt = new Date(this.nextRunTimestamp).toISOString();
    this.persistConfig();
  }

  private startScheduler() {
    if (this.checkIntervalTimer) {
      window.clearInterval(this.checkIntervalTimer);
    }

    // Check timer every 2 seconds
    this.checkIntervalTimer = window.setInterval(() => {
      if (!this.config.enabled) return;

      if (Date.now() >= this.nextRunTimestamp) {
        this.runExportCycle(false);
      }
    }, 2000);
  }

  /**
   * Executes the automated export cycle: aggregates logs & health state,
   * stores snapshot into local storage, notifies user, and optionally triggers download.
   */
  public runExportCycle(manualTrigger: boolean = false): StoredExportSnapshot {
    const now = new Date();
    const machines = simulationManager.getAllStates();
    const allLogs = historyLogManager.getAllLogs();

    const scope = this.config.targetScope;
    const targetMachines =
      scope === 'all_machines'
        ? machines
        : machines.filter((m) => m.id === scope);

    const relevantLogs =
      scope === 'all_machines'
        ? allLogs
        : allLogs.filter((l) => l.machineId === scope);

    // Build structured snapshot archive payload
    const snapshotPayload = {
      exportMetadata: {
        system: 'PRISM - Predictive Reliability & Intelligent Systems for Maintenance',
        reportType: 'Automated Hourly Machine Health Logs & Telemetry Snapshot',
        generatedAt: now.toISOString(),
        version: '2.0.0',
        automatedSchedule: {
          interval: `${this.config.intervalMinutes} minutes`,
          mode: manualTrigger ? 'manual_on_demand_cycle' : 'scheduled_hourly_cycle',
          retentionPolicy: `FIFO up to ${this.config.maxStoredSnapshots} stored snapshots`,
          scope: scope === 'all_machines' ? 'All Plant Machines' : scope
        }
      },
      plantOverviewSummary: {
        totalMachines: targetMachines.length,
        criticalMachinesCount: targetMachines.filter((m) => m.healthState === 'Action Required').length,
        advisoryMachinesCount: targetMachines.filter((m) => m.healthState === 'Advisory').length,
        nominalMachinesCount: targetMachines.filter((m) => m.healthState === 'Normal').length,
        averageHealthIndex: Number(
          (
            targetMachines.reduce((acc, m) => acc + (m.rulMetrics?.healthIndex ?? 100), 0) /
            (targetMachines.length || 1)
          ).toFixed(1)
        )
      },
      machineProfilesAndSummaries: targetMachines.map((m) => ({
        id: m.id,
        name: m.name,
        model: m.model,
        location: m.location,
        healthState: m.healthState,
        scenario: m.scenario,
        lastUpdated: m.lastUpdated,
        healthIndexPercent: m.rulMetrics?.healthIndex,
        estimatedRulHours: m.rulMetrics?.estimatedHoursRemaining,
        degradationRatePerHour: m.rulMetrics?.degradationRatePerHour,
        recommendedInterventionDate: m.rulMetrics?.recommendedInterventionDate,
        vibrationIsoZone: m.vibrationSpectrum?.isoZone,
        velocityRms: m.vibrationSpectrum?.velocityRms,
        currentTelemetryReadings: m.currentReadings,
        subsystemsHealthSummary: m.subsystems?.map((s) => ({
          name: s.name,
          type: s.type,
          status: s.status,
          healthIndex: s.healthIndex,
          stressPercent: s.stressPercent
        })),
        xaiRootCauseAnalysis: {
          summary: m.xaiExplanation?.summary,
          primaryCause: m.xaiExplanation?.primaryCause,
          confidenceScore: m.xaiExplanation?.confidenceScore
        },
        historicalEventsCount: historyLogManager.getLogsForMachine(m.id).length,
        recentHistoricalLogs: historyLogManager.getLogsForMachine(m.id).slice(0, 15)
      })),
      continuousAuditTrail: {
        totalArchivedLogsCount: relevantLogs.length,
        healthTransitionsCount: relevantLogs.filter((l) => l.type === 'health_change').length,
        maintenanceInterventionsCount: relevantLogs.filter((l) => l.type === 'maintenance_intervention').length,
        entries: relevantLogs
      }
    };

    const serialized = JSON.stringify(snapshotPayload, null, 2);
    const sizeBytes = new Blob([serialized]).size;
    const timeFormatted = now.toISOString().replace(/[:.]/g, '-');
    const scopeLabel = scope === 'all_machines' ? 'AllMachines' : scope;
    const filename = `PRISM_AutoExport_${scopeLabel}_${timeFormatted}.json`;

    const newSnapshot: StoredExportSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      filename,
      createdAt: now.toISOString(),
      scope: scope === 'all_machines' ? 'All Plant Machines' : targetMachines[0]?.name || scope,
      machinesCount: targetMachines.length,
      totalLogRecords: relevantLogs.length,
      sizeBytes,
      data: snapshotPayload
    };

    // Store in internal array (newest first)
    this.snapshots.unshift(newSnapshot);

    // Enforce max retention policy
    if (this.snapshots.length > this.config.maxStoredSnapshots) {
      this.snapshots = this.snapshots.slice(0, this.config.maxStoredSnapshots);
    }

    this.persistSnapshots();

    // Update config metadata
    this.config.lastExportAt = now.toISOString();
    this.scheduleNextRun();

    // Trigger browser file download if enabled
    if (this.config.autoDownloadToFileSystem || manualTrigger) {
      this.downloadSnapshot(newSnapshot.id);
    }

    // Toast notification
    if (this.config.notifyOnExport) {
      toastManager.success(
        manualTrigger ? 'Hourly Health Log Export Complete' : 'Automated Hourly Export Saved',
        `Archived ${relevantLogs.length} health log records for ${targetMachines.length} machine(s) to local storage.`,
        {
          duration: 5000,
          fileDetails: {
            filename,
            format: 'JSON',
            itemCount: relevantLogs.length,
            sizeBytes
          }
        }
      );
    }

    this.notify();
    return newSnapshot;
  }

  public updateConfig(updates: Partial<AutoExportConfig>) {
    this.config = { ...this.config, ...updates };
    this.persistConfig();

    if (updates.intervalMinutes !== undefined) {
      this.scheduleNextRun();
    }

    this.notify();
    toastManager.info('Auto-Export Settings Saved', 'Updated automated health log export configuration.');
  }

  public downloadSnapshot(snapshotId: string) {
    const snap = this.snapshots.find((s) => s.id === snapshotId);
    if (!snap) return;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snap.data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', snap.filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toastManager.success('Export Snapshot Downloaded', `Downloaded "${snap.filename}" from local storage archive.`);
  }

  public downloadAllSnapshotsAsBundle() {
    if (this.snapshots.length === 0) {
      toastManager.warning('No Snapshots', 'No export snapshots found in local storage.');
      return;
    }

    const bundle = {
      archiveMetadata: {
        system: 'PRISM - Predictive Reliability & Intelligent Systems for Maintenance',
        bundleType: 'Cumulative Auto-Export Local Storage Archive',
        exportedAt: new Date().toISOString(),
        totalSnapshotsCount: this.snapshots.length
      },
      snapshots: this.snapshots
    };

    const fileName = `PRISM_All_Hourly_Exports_Archive_${Date.now()}.json`;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toastManager.success(
      'Export Archive Downloaded',
      `Downloaded bundle containing ${this.snapshots.length} automated hourly export snapshots.`
    );
  }

  public deleteSnapshot(snapshotId: string) {
    const idx = this.snapshots.findIndex((s) => s.id === snapshotId);
    if (idx === -1) return;

    const removed = this.snapshots.splice(idx, 1)[0];
    this.persistSnapshots();
    this.notify();

    toastManager.info('Snapshot Deleted', `Removed "${removed.filename}" from local storage.`);
  }

  public clearAllSnapshots() {
    const count = this.snapshots.length;
    this.snapshots = [];
    this.persistSnapshots();
    this.notify();

    toastManager.info('Storage Cleared', `Cleared all ${count} archived export snapshots from local storage.`);
  }

  public getConfig(): AutoExportConfig {
    return { ...this.config };
  }

  public getSnapshots(): StoredExportSnapshot[] {
    return [...this.snapshots];
  }

  public getNextRunRemainingSeconds(): number {
    if (!this.config.enabled || !this.nextRunTimestamp) return 0;
    return Math.max(0, Math.round((this.nextRunTimestamp - Date.now()) / 1000));
  }

  public getTotalStorageSizeBytes(): number {
    return this.snapshots.reduce((acc, s) => acc + s.sizeBytes, 0);
  }

  public subscribe(listener: AutoExportListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.getConfig(), this.getSnapshots()));
  }
}

export const autoExportManager = new AutoExportManager();
