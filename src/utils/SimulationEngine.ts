import {
  MachineConfig,
  Scenario,
  HealthState,
  SensorReadings,
  XAIExplanation,
  CWRUEvidence,
  MachineState,
  MachineSubsystem,
  PLCChannel,
  VibrationSpectrumData,
  VibrationSpectrumPoint,
  RULMetrics,
  OEEMetrics
} from '../types';

export const RECOVERY_DURATION = 15; // 15 ticks (~15 seconds)
export const MAX_BUFFER_SIZE = 50;   // 50 historical points for trend charts

export class SimulationEngine {
  public machineConfig: MachineConfig;
  public scenario: Scenario;
  public healthState: HealthState;
  public recoveryTicks: number;
  public currentReadings: SensorReadings;
  public trendBuffers: Record<string, number[]>;
  public timestamps: string[];
  private stepDirection: number = 1;
  private tickCounter: number = 0;
  private partsProduced: number = 412;
  private defectCount: number = 3;

  constructor(machineConfig: MachineConfig, initialScenario: Scenario = 'Normal') {
    this.machineConfig = machineConfig;
    this.scenario = initialScenario;
    this.recoveryTicks = 0;
    this.currentReadings = this.initializeBaseReadings();
    this.trendBuffers = {};
    this.timestamps = [];

    this.seedInitialHistory();
    this.healthState = this.deriveHealthState(this.currentReadings);
  }

  private initializeBaseReadings(): SensorReadings {
    const readings: SensorReadings = {
      temperature: 300,
      air_temperature: 298,
      vibration: 30,
      torque: 35,
      rotational_speed: 1500,
      tool_wear: 100,
    };

    Object.entries(this.machineConfig.sensors).forEach(([key, cfg]) => {
      readings[key] = cfg.baseMean;
    });

    return readings;
  }

  private seedInitialHistory() {
    const keys = Object.keys(this.machineConfig.sensors);
    keys.forEach(key => {
      this.trendBuffers[key] = [];
    });

    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const timeStr = new Date(now - i * 1000).toLocaleTimeString();
      this.timestamps.push(timeStr);

      keys.forEach(key => {
        const cfg = this.machineConfig.sensors[key];
        const noise = (Math.random() - 0.5) * cfg.stepNoise;
        const val = Math.round((cfg.baseMean + noise) * 10) / 10;
        this.trendBuffers[key].push(val);
      });
    }

    keys.forEach(key => {
      const arr = this.trendBuffers[key];
      this.currentReadings[key] = arr[arr.length - 1];
    });
  }

  public setScenario(newScenario: Scenario) {
    this.scenario = newScenario;
    this.recoveryTicks = 0;
    this.healthState = this.deriveHealthState(this.currentReadings);
    this.tick();
  }

  public tick(): MachineState {
    this.tickCounter++;

    if (this.scenario === 'Post-Maintenance') {
      this.recoveryTicks++;
    }

    if (this.healthState === 'Normal') {
      if (this.tickCounter % 3 === 0) this.partsProduced++;
    } else if (this.healthState === 'Action Required') {
      if (this.tickCounter % 4 === 0) this.defectCount++;
    }

    // 1. Generate new values for each sensor based on active Scenario
    const newReadings: SensorReadings = { ...this.currentReadings };

    Object.entries(this.machineConfig.sensors).forEach(([key, cfg]) => {
      const currentVal = this.currentReadings[key] ?? cfg.baseMean;
      let nextVal = currentVal;

      if (this.scenario === 'Normal') {
        const safeMax = cfg.threshold * 0.85;
        const safeMin = cfg.baseMean * 0.9;
        const noise = (Math.random() - 0.48) * cfg.stepNoise;
        nextVal = currentVal + noise;
        nextVal = Math.max(safeMin, Math.min(safeMax, nextVal));

      } else if (this.scenario === 'Post-Maintenance') {
        if (this.recoveryTicks < RECOVERY_DURATION) {
          const target = cfg.baseMean;
          const pull = (target - currentVal) * 0.15;
          const noise = (Math.random() - 0.5) * (cfg.stepNoise * 0.5);
          nextVal = currentVal + pull + noise;
        } else {
          const safeMax = cfg.threshold * 0.85;
          const safeMin = cfg.baseMean * 0.9;
          const noise = (Math.random() - 0.48) * cfg.stepNoise;
          nextVal = currentVal + noise;
          nextVal = Math.max(safeMin, Math.min(safeMax, nextVal));
        }

      } else if (this.scenario === 'Action Required') {
        const drift = cfg.stepNoise * 1.8 * this.stepDirection;
        const noise = (Math.random() - 0.2) * cfg.stepNoise;
        nextVal = currentVal + drift + noise;

        if (nextVal > cfg.threshold * 1.35) {
          this.stepDirection = -1;
        } else if (nextVal < cfg.threshold * 0.9) {
          this.stepDirection = 1;
        }

      } else if (this.scenario === 'Advisory') {
        const target = cfg.threshold * 0.92;
        const pull = (target - currentVal) * 0.08;
        const noise = (Math.random() - 0.5) * cfg.stepNoise * 1.2;
        nextVal = currentVal + pull + noise;
      }

      newReadings[key] = Math.round(nextVal * 10) / 10;
    });

    this.currentReadings = newReadings;

    // 2. Update rolling FIFO buffers
    const timeString = new Date().toLocaleTimeString();
    this.timestamps.push(timeString);
    if (this.timestamps.length > MAX_BUFFER_SIZE) {
      this.timestamps.shift();
    }

    Object.keys(this.machineConfig.sensors).forEach(key => {
      if (!this.trendBuffers[key]) {
        this.trendBuffers[key] = [];
      }
      this.trendBuffers[key].push(newReadings[key]);
      if (this.trendBuffers[key].length > MAX_BUFFER_SIZE) {
        this.trendBuffers[key].shift();
      }
    });

    // 3. Derive Health State
    this.healthState = this.deriveHealthState(newReadings);

    return this.getState();
  }

  public deriveHealthState(readings: SensorReadings): HealthState {
    if (this.scenario === 'Normal') {
      return 'Normal';
    }

    if (this.scenario === 'Post-Maintenance') {
      if (this.recoveryTicks < RECOVERY_DURATION) {
        return 'Post-Maintenance';
      } else {
        return 'Normal';
      }
    }

    if (this.scenario === 'Action Required') {
      return 'Action Required';
    }

    let totalCritical = 0;
    let totalWarning = 0;

    Object.entries(this.machineConfig.sensors).forEach(([key, cfg]) => {
      const val = readings[key] ?? cfg.baseMean;
      if (val >= cfg.threshold) {
        totalCritical++;
      } else if (val >= cfg.warningThreshold) {
        totalWarning++;
      }
    });

    if (totalCritical >= 2) {
      return 'Action Required';
    } else if (totalCritical >= 1 || totalWarning >= 2) {
      return 'Advisory';
    }

    return 'Normal';
  }

  public deriveSubsystems(): MachineSubsystem[] {
    const isCrit = this.healthState === 'Action Required';
    const isAdv = this.healthState === 'Advisory';
    const tempVal = this.currentReadings.temperature ?? 300;
    const vibVal = this.currentReadings.vibration ?? 30;

    return this.machineConfig.subsystems.map((sub, index) => {
      let status: 'Normal' | 'Warning' | 'Critical' = 'Normal';
      let health = sub.healthIndex;
      let stress = sub.stressPercent;
      let temp = sub.temperature;

      if (index === 0) {
        // Primary Spindle / Rotor subsystem reflects temperature & vibration directly
        temp = Math.round(tempVal * 10) / 10;
        if (isCrit) {
          status = 'Critical';
          health = Math.max(12, Math.round(100 - (vibVal / 100) * 80));
          stress = Math.min(98, Math.round((vibVal / 100) * 95));
        } else if (isAdv) {
          status = 'Warning';
          health = 68;
          stress = 74;
        } else {
          status = 'Normal';
          health = 96;
          stress = 38;
        }
      } else if (index === 1) {
        // Drive / linear axis subsystem
        if (isCrit) {
          status = 'Warning';
          health = 54;
          stress = 82;
        } else if (isAdv) {
          status = 'Normal';
          health = 84;
          stress = 52;
        }
      } else if (isCrit) {
        // Secondary subsystems under heavy machine stress
        stress = Math.min(85, stress + 25);
        health = Math.max(45, health - 20);
      }

      return {
        ...sub,
        status,
        healthIndex: health,
        stressPercent: stress,
        temperature: temp,
      };
    });
  }

  public derivePLCChannels(): PLCChannel[] {
    const isCrit = this.healthState === 'Action Required';
    const isAdv = this.healthState === 'Advisory';
    const isPostMaint = this.healthState === 'Post-Maintenance';
    const torque = this.currentReadings.torque ?? 35;
    const speed = this.currentReadings.rotational_speed ?? 1500;

    return [
      {
        tag: 'DI_ESTOP_LOOP',
        label: 'Emergency Stop Dual Channel',
        type: 'DI',
        value: !isCrit,
        state: isCrit ? 'tripped' : 'nominal',
      },
      {
        tag: 'DI_INTERLOCK_GUARD',
        label: 'Safety Enclosure Guard Lock',
        type: 'DI',
        value: true,
        state: 'nominal',
      },
      {
        tag: 'DO_VFD_RUN_ENABLE',
        label: 'Inverter Drive Power Enable',
        type: 'DO',
        value: this.healthState !== 'Action Required',
        state: isCrit ? 'tripped' : 'nominal',
      },
      {
        tag: 'AI_VFD_CURRENT',
        label: 'Motor Drive Phase Amperage',
        type: 'AI',
        value: Math.round(((torque / 50) * 32.5 + (Math.random() - 0.5)) * 10) / 10,
        unit: 'A',
        state: isCrit ? 'tripped' : isAdv ? 'warning' : 'nominal',
      },
      {
        tag: 'AI_DC_BUS_VOLT',
        label: 'Inverter DC Link Bus Voltage',
        type: 'AI',
        value: Math.round(560 + (Math.random() - 0.5) * 4),
        unit: 'V',
        state: 'nominal',
      },
      {
        tag: 'DI_LUBE_PRESSURE_SW',
        label: 'Spindle Lube Pressure Switch',
        type: 'DI',
        value: !isCrit,
        state: isCrit ? 'warning' : 'nominal',
      },
      {
        tag: 'AI_SPINDLE_LOAD_PCT',
        label: 'Spindle Torque Load Factor',
        type: 'AI',
        value: Math.min(100, Math.round((torque / 50) * 100)),
        unit: '%',
        state: torque >= 50 ? 'tripped' : torque >= 45 ? 'warning' : 'nominal',
      },
      {
        tag: 'DO_COOLANT_SOLENOID',
        label: 'CTS High-Pressure Solenoid',
        type: 'DO',
        value: speed > 200,
        state: 'nominal',
      },
    ];
  }

  public deriveVibrationSpectrum(): VibrationSpectrumData {
    const vib = this.currentReadings.vibration ?? 32;
    const speed = this.currentReadings.rotational_speed ?? 1500;
    const f1X = Math.round((speed / 60) * 10) / 10; // e.g. 25.0 Hz
    const f2X = Math.round(f1X * 2 * 10) / 10;      // 50.0 Hz
    const f3X = Math.round(f1X * 3 * 10) / 10;      // 75.0 Hz
    const bpfo = Math.round(f1X * 3.58 * 10) / 10;  // Outer Race (~89.5 Hz)
    const bpfi = Math.round(f1X * 5.42 * 10) / 10;  // Inner Race (~135.5 Hz)
    const bsf = Math.round(f1X * 2.32 * 10) / 10;   // Ball Spin (~58.0 Hz)

    // ISO 10816-3 RMS Velocity calculation
    const velocityRms = Math.round(((vib / 100) * 6.5 + (Math.random() - 0.5) * 0.2) * 10) / 10;
    let isoZone: 'A' | 'B' | 'C' | 'D' = 'A';
    let isoDescription = 'Zone A: Good (New / fully refurbished machine status)';

    if (velocityRms > 7.1 || vib >= 100) {
      isoZone = 'D';
      isoDescription = 'Zone D: Unacceptable / Critical (Damage imminent - Immediate trip required)';
    } else if (velocityRms > 4.5 || vib >= 85) {
      isoZone = 'C';
      isoDescription = 'Zone C: Unsatisfactory (Restricted continuous operation - Plan overhaul)';
    } else if (velocityRms > 2.8 || vib >= 60) {
      isoZone = 'B';
      isoDescription = 'Zone B: Acceptable (Normal unrestricted industrial operation)';
    }

    const points: VibrationSpectrumPoint[] = [];
    const baseNoise = isoZone === 'D' ? 0.8 : isoZone === 'C' ? 0.4 : 0.15;

    // Generate discrete frequency spectrum points (10 Hz to 400 Hz step 10)
    for (let f = 10; f <= 350; f += 5) {
      let amp = Math.random() * baseNoise;
      let label: string | undefined = undefined;
      let isHarmonic = false;
      let isDefectFreq = false;

      if (Math.abs(f - f1X) < 3) {
        amp += isoZone === 'D' ? 6.2 : isoZone === 'C' ? 3.5 : 1.8;
        label = `1X (${f1X} Hz)`;
        isHarmonic = true;
      } else if (Math.abs(f - f2X) < 3) {
        amp += isoZone === 'D' ? 4.8 : isoZone === 'C' ? 2.4 : 0.9;
        label = `2X (${f2X} Hz)`;
        isHarmonic = true;
      } else if (Math.abs(f - f3X) < 3) {
        amp += isoZone === 'D' ? 3.9 : isoZone === 'C' ? 1.7 : 0.5;
        label = `3X (${f3X} Hz)`;
        isHarmonic = true;
      } else if (Math.abs(f - bpfo) < 3) {
        amp += isoZone === 'D' ? 7.4 : isoZone === 'C' ? 3.8 : 0.4;
        label = `BPFO (${bpfo} Hz)`;
        isDefectFreq = true;
      } else if (Math.abs(f - bpfi) < 3) {
        amp += isoZone === 'D' ? 5.6 : isoZone === 'C' ? 2.9 : 0.3;
        label = `BPFI (${bpfi} Hz)`;
        isDefectFreq = true;
      } else if (Math.abs(f - bsf) < 3) {
        amp += isoZone === 'D' ? 4.1 : isoZone === 'C' ? 2.0 : 0.2;
        label = `BSF (${bsf} Hz)`;
        isDefectFreq = true;
      }

      points.push({
        hz: f,
        amplitude: Math.round(amp * 100) / 100,
        label,
        isHarmonic,
        isDefectFreq,
      });
    }

    return {
      points,
      isoZone,
      isoDescription,
      velocityRms,
      accelerationPeak: Math.round(velocityRms * 1.8 * 10) / 10,
      crestFactor: Math.round((3.2 + (vib > 90 ? 2.1 : 0.4)) * 10) / 10,
      defectFrequencies: [
        { name: 'BPFO (Outer Race)', hz: bpfo, detected: isoZone === 'D' || isoZone === 'C' },
        { name: 'BPFI (Inner Race)', hz: bpfi, detected: isoZone === 'D' },
        { name: 'BSF (Ball Spin)', hz: bsf, detected: isoZone === 'D' },
        { name: 'FTF (Cage Frequency)', hz: Math.round(f1X * 0.42 * 10) / 10, detected: false },
      ],
    };
  }

  public deriveRULMetrics(): RULMetrics {
    const isCrit = this.healthState === 'Action Required';
    const isAdv = this.healthState === 'Advisory';
    const toolWear = this.currentReadings.tool_wear ?? 100;
    const vib = this.currentReadings.vibration ?? 30;

    let hoursRemaining = 5840;
    let healthIndex = 94;
    let degradationRate = 0.08; // % / hour

    if (isCrit) {
      hoursRemaining = Math.max(6, Math.round(48 - (vib / 100) * 36));
      healthIndex = Math.max(10, Math.round(100 - (vib / 100) * 85));
      degradationRate = 4.8;
    } else if (isAdv) {
      hoursRemaining = Math.round(180 - (toolWear / 200) * 90);
      healthIndex = 65;
      degradationRate = 0.95;
    } else {
      hoursRemaining = Math.max(2200, Math.round(7200 - toolWear * 18));
      healthIndex = 95;
      degradationRate = 0.06;
    }

    const nextIntervention = new Date(Date.now() + hoursRemaining * 3600 * 1000).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return {
      estimatedHoursRemaining: hoursRemaining,
      baselineLifespanHours: 7200,
      confidenceLowerHours: Math.round(hoursRemaining * 0.88),
      confidenceUpperHours: Math.round(hoursRemaining * 1.15),
      degradationRatePerHour: degradationRate,
      healthIndex,
      recommendedInterventionDate: nextIntervention,
    };
  }

  public deriveOEEMetrics(): OEEMetrics {
    const isCrit = this.healthState === 'Action Required';
    const isAdv = this.healthState === 'Advisory';

    let availability = 97.4;
    let performance = 94.2;
    let quality = 99.1;

    if (isCrit) {
      availability = 42.0;
      performance = 58.5;
      quality = 86.0;
    } else if (isAdv) {
      availability = 88.0;
      performance = 82.0;
      quality = 95.4;
    }

    const overallOee = Math.round(((availability * performance * quality) / 10000) * 10) / 10;

    return {
      availability,
      performance,
      quality,
      overallOee,
      cycleTimeSeconds: 42.5,
      partsProducedToday: this.partsProduced,
      defectCount: this.defectCount,
    };
  }

  public generateXAIExplanation(): XAIExplanation {
    const contributingSensors: XAIExplanation['contributingSensors'] = [];
    let highestRatio = 0;
    let primarySensorName = 'General Operation';

    Object.entries(this.machineConfig.sensors).forEach(([key, cfg]) => {
      const val = this.currentReadings[key] ?? cfg.baseMean;
      const ratio = Math.round((val / cfg.threshold) * 100);

      let status: 'Normal' | 'Warning' | 'Critical' = 'Normal';
      if (val >= cfg.threshold) {
        status = 'Critical';
      } else if (val >= cfg.warningThreshold) {
        status = 'Warning';
      }

      if (ratio > highestRatio) {
        highestRatio = ratio;
        primarySensorName = cfg.name;
      }

      contributingSensors.push({
        sensorName: cfg.name,
        value: val,
        threshold: cfg.threshold,
        unit: cfg.unit,
        percentageOfThreshold: ratio,
        status,
      });
    });

    contributingSensors.sort((a, b) => b.percentageOfThreshold - a.percentageOfThreshold);

    const vibrationVal = this.currentReadings.vibration ?? 30;
    let bearingStatus: CWRUEvidence['bearingStatus'] = 'Normal';
    let peakHz = 120;
    let faultIndex = 15;

    if (vibrationVal > 95) {
      bearingStatus = 'Ball Defect (0.014")';
      peakHz = 190;
      faultIndex = Math.min(98, Math.round((vibrationVal / 100) * 85));
    } else if (vibrationVal > 80) {
      bearingStatus = 'Inner Race Defect';
      peakHz = 175;
      faultIndex = 65;
    } else if (vibrationVal > 60) {
      bearingStatus = 'Outer Race Defect';
      peakHz = 202;
      faultIndex = 45;
    }

    const cwruEvidence: CWRUEvidence = {
      bearingStatus,
      peakFrequencyHz: peakHz,
      vibrationRms: Math.round((vibrationVal / 10) * 10) / 10,
      faultSeverityIndex: faultIndex,
      historySamplePoints: (this.trendBuffers.vibration || []).slice(-15),
    };

    let summary = '';
    let primaryCause = '';
    let recommendedActions: string[] = [];

    if (this.healthState === 'Action Required') {
      summary = `Critical machine anomaly detected on ${this.machineConfig.name}. ${primarySensorName} has breached design limits (${highestRatio}% capacity). Acoustic alarm triggered.`;
      primaryCause = `High thermal / mechanical stress causing elevated ${primarySensorName} and bearing micro-friction.`;
      recommendedActions = [
        `1. Execute E-Stop / Soft Controlled Spindle Ramp Down.`,
        `2. Isolate drive power and perform Lockout/Tagout (LOTO).`,
        `3. Inspect ${primarySensorName} subsystem and main spindle bearings for thermal expansion or wear.`,
        `4. Cross-verify vibration spectrum against CWRU fault benchmark model.`,
        `5. Flush bearing cavity and replenish synthetic polyurea grease.`,
        `6. Execute 15-second post-maintenance stabilization cycle.`,
      ];
    } else if (this.healthState === 'Advisory') {
      summary = `Advisory caution: ${this.machineConfig.name} is showing early degradation indicators. ${primarySensorName} is operating near warning threshold (${highestRatio}% capacity).`;
      primaryCause = `Gradual thermal buildup and progressive tool/bearing wear under continuous duty cycle.`;
      recommendedActions = [
        `1. Monitor ${primarySensorName} rolling trend over next 30 cycles.`,
        `2. Schedule preventive service window during next shift changeover.`,
        `3. Verify CTS coolant flow and pneumatic manifold pressure.`,
      ];
    } else if (this.healthState === 'Post-Maintenance') {
      summary = `${this.machineConfig.name} is currently undergoing post-maintenance stabilization (${this.recoveryTicks}/${RECOVERY_DURATION} recovery ticks).`;
      primaryCause = `Recent component replacement / recalibration. Sensor values returning to optimal baseline.`;
      recommendedActions = [
        `1. Allow machine to complete 15-second stabilization loop.`,
        `2. Verify baseline temperature and vibration balance.`,
      ];
    } else {
      summary = `${this.machineConfig.name} is operating within nominal health parameters across all telemetry sensors.`;
      primaryCause = `Optimal lubrication, low vibration harmonics, and stable coolant heat dissipation.`;
      recommendedActions = [
        `1. Continue standard continuous operational monitoring.`,
        `2. Maintain regular lubrication inspection schedule.`,
      ];
    }

    return {
      summary,
      primaryCause,
      healthState: this.healthState,
      confidenceScore: this.healthState === 'Action Required' ? 96 : this.healthState === 'Advisory' ? 88 : 99,
      contributingSensors,
      recommendedActions,
      cwruEvidence,
    };
  }

  public forceMaintenance() {
    this.scenario = 'Post-Maintenance';
    this.recoveryTicks = 0;
    this.healthState = 'Post-Maintenance';
    this.tick();
  }

  public resetSensors() {
    this.scenario = 'Normal';
    this.recoveryTicks = 0;
    this.currentReadings = this.initializeBaseReadings();
    this.healthState = 'Normal';
    this.tick();
  }

  public triggerFaultTest() {
    this.scenario = 'Action Required';
    this.recoveryTicks = 0;
    this.healthState = 'Action Required';
    
    this.currentReadings.temperature = 314;
    this.currentReadings.vibration = 108;
    this.currentReadings.torque = 54;
    this.tick();
  }

  public getState(): MachineState {
    return {
      id: this.machineConfig.id,
      name: this.machineConfig.name,
      model: this.machineConfig.model,
      location: this.machineConfig.location,
      scenario: this.scenario,
      healthState: this.healthState,
      recoveryTicks: this.recoveryTicks,
      currentReadings: { ...this.currentReadings },
      trendBuffers: JSON.parse(JSON.stringify(this.trendBuffers)),
      timestamps: [...this.timestamps],
      xaiExplanation: this.generateXAIExplanation(),
      lastUpdated: new Date().toLocaleTimeString(),
      subsystems: this.deriveSubsystems(),
      plcChannels: this.derivePLCChannels(),
      vibrationSpectrum: this.deriveVibrationSpectrum(),
      rulMetrics: this.deriveRULMetrics(),
      oeeMetrics: this.deriveOEEMetrics(),
      serialNumber: this.machineConfig.serialNumber,
      firmwareVersion: this.machineConfig.firmwareVersion,
      commissionDate: this.machineConfig.commissionDate,
      description: this.machineConfig.description,
    };
  }
}
