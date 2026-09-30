export type LanguageCode = 'en' | 'de' | 'ja' | 'es' | 'zh' | 'fr';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  hub: string; // Industrial / manufacturing cluster description
}

export interface Translations {
  // Navigation & General
  nav: {
    plantOverview: string;
    machineMonitor: string;
    vibrationFFT: string;
    alarmAnnunciator: string;
    website: string;
    app: string;
    settings: string;
    pause: string;
    runStream: string;
    scanQR: string;
    soundHorn: string;
  };
  // Health & State
  health: {
    nominal: string;
    advisory: string;
    actionRequired: string;
    postMaintenance: string;
    allNominal: string;
    tripActive: string;
    recovery: string;
  };
  // Scenario
  scenario: {
    label: string;
    normal: string;
    advisory: string;
    actionRequired: string;
    postMaintenance: string;
  };
  // Plant Overview
  overview: {
    title: string;
    subtitle: string;
    scanEquipmentQR: string;
    lineAverageOee: string;
    productionThroughput: string;
    totalDefectScrap: string;
    safetyInterlocks: string;
    firstPassYield: string;
    cycleTime: string;
    availability: string;
    customizeFloorLayout: string;
    saveLayout: string;
    resetLayout: string;
    editModeActive: string;
    presets: string;
    dropIntoStation: string;
    station: string;
    cardSizeHalf: string;
    cardSizeWide: string;
    dragToReposition: string;
  };
  // Machine Details
  machine: {
    temperature: string;
    vibration: string;
    torque: string;
    rotationalSpeed: string;
    toolWear: string;
    rulRemaining: string;
    confidenceInterval: string;
    estimatedHealth: string;
    status: string;
    monitorView: string;
    specs: string;
    serial: string;
    model: string;
    location: string;
    subsystems: string;
    schematic: string;
    telemetry: string;
    fftSpectrum: string;
    plcSignals: string;
    xaiDiagnostics: string;
    historyLog: string;
    qrQuickJump: string;
    offlineCached: string;
    servingFromCache: string;
    networkNormal: string;
    networkIntermittent: string;
    networkOffline: string;
  };
  // Alarm
  alarm: {
    silenceHorn: string;
    hornAck: string;
    mute: string;
    unmute: string;
    criticalAlert: string;
  };
  // Settings
  settings: {
    title: string;
    language: string;
    languageDescription: string;
    samplingRate: string;
    audioAlerts: string;
    autoExport: string;
    close: string;
  };
}
