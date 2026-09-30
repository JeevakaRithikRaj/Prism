import React, { useState, useEffect } from 'react';
import { Play, Pause, BellRing, Volume2, VolumeX, CheckCircle, RefreshCw, SlidersHorizontal, Clock, Globe, Zap } from 'lucide-react';
import { simulationManager } from '../managers/SimulationManager';
import { audioAlarmManager, AudioAlarmStatus, AlarmSoundMode } from '../utils/AudioAlarmManager';
import { autoExportManager } from '../managers/AutoExportManager';
import { MachineState, Scenario, ViewMode, AppExperienceMode } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { useI18n } from '../i18n/i18nContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { GlobalSearchBar } from './GlobalSearchBar';

interface HeaderProps {
  machines: MachineState[];
  isRunning: boolean;
  activeScenario: Scenario;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onScenarioChange: (scenario: Scenario) => void;
  onOpenSettings?: () => void;
  onSwitchToWebsite?: () => void;
  onSelectMachine?: (machine: MachineState) => void;
  onOpenDetailModal?: (machine: MachineState) => void;
}

export const Header: React.FC<HeaderProps> = ({
  machines,
  isRunning,
  activeScenario,
  currentView,
  onViewChange,
  onScenarioChange,
  onOpenSettings,
  onSwitchToWebsite,
  onSelectMachine,
  onOpenDetailModal,
}) => {
  const { trans } = useI18n();
  const [alarmStatus, setAlarmStatus] = useState<AudioAlarmStatus>(audioAlarmManager.getStatus());
  const [autoExportEnabled, setAutoExportEnabled] = useState<boolean>(autoExportManager.getConfig().enabled);

  const criticalCount = machines.filter(m => m.healthState === 'Action Required').length;
  const advisoryCount = machines.filter(m => m.healthState === 'Advisory').length;

  const handleSelectMachine = (machine: MachineState) => {
    if (onSelectMachine) {
      onSelectMachine(machine);
    } else {
      onViewChange('machine-deep-dive');
    }
  };

  useEffect(() => {
    const unsub = autoExportManager.subscribe((cfg) => {
      setAutoExportEnabled(cfg.enabled);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Automatically engage audio alarm when critical machines exist
    audioAlarmManager.setAlarmState(criticalCount > 0);
  }, [criticalCount]);

  useEffect(() => {
    const unsub = audioAlarmManager.subscribe((status) => {
      setAlarmStatus(status);
    });
    return () => unsub();
  }, []);

  return (
    <header className="bg-slate-950/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-xl">
      
      {/* High-Visibility Industrial Alarm Banner */}
      {criticalCount > 0 && (
        <div className="bg-rose-950/90 border-b border-rose-600 px-4 py-2 text-rose-200">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 font-bold">
              <BellRing className="h-4 w-4 text-rose-400 animate-bounce" />
              <span>
                ACTION REQUIRED: {criticalCount} Machine(s) in Critical Trip Threshold!
              </span>
              <span className="text-[11px] font-normal text-rose-300 hidden sm:inline">
                Acoustic Alarm: {alarmStatus.soundMode.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!alarmStatus.isAcknowledged ? (
                <button
                  onClick={() => audioAlarmManager.acknowledgeAlarm()}
                  className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Silence Horn (ACK)</span>
                </button>
              ) : (
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-bold">
                  HORN ACKNOWLEDGED
                </span>
              )}

              <button
                onClick={() => audioAlarmManager.toggleMute()}
                className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-medium transition-all flex items-center gap-1.5"
              >
                {alarmStatus.isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-cyan-400" />}
                <span>{alarmStatus.isMuted ? 'Unmute' : 'Mute'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar Contract: Zone 1 (Brand) — Zone 2 (4-6 Clean Nav Links) — Zone 3 (1-2 Actions) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        
        {/* Zone 1: Single text element wordmark with Website / App switcher */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); onViewChange('plant-overview'); }}
            className="text-lg font-bold tracking-tight text-white flex items-center gap-2 whitespace-nowrap"
          >
            <span className="font-black bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
              PRISM
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400 font-normal border-l border-slate-700 pl-2">
              Predictive Maintenance <span className="text-cyan-400/80 font-semibold">· RJRR</span>
            </span>
          </a>

          {/* Mode Switcher: Website vs App Console */}
          {onSwitchToWebsite && (
            <div className="hidden sm:flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-700/80 text-xs font-mono ml-1">
              <button
                onClick={onSwitchToWebsite}
                className="px-2.5 py-1 text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                title="Switch to PRISM Product Website"
              >
                <Globe className="h-3 w-3 text-cyan-400" />
                <span className="hidden lg:inline">Website</span>
              </button>
              <span className="px-2.5 py-1 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold flex items-center gap-1.5 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>App</span>
              </span>
            </div>
          )}
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onViewChange('plant-overview')}
            className={`whitespace-nowrap transition-colors ${
              currentView === 'plant-overview'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {trans.nav.plantOverview}
          </button>

          <button
            onClick={() => onViewChange('machine-deep-dive')}
            className={`whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentView === 'machine-deep-dive'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{trans.nav.machineMonitor}</span>
            {criticalCount > 0 && (
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => onViewChange('spectrum-analyzer')}
            className={`whitespace-nowrap transition-colors ${
              currentView === 'spectrum-analyzer'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {trans.nav.vibrationFFT}
          </button>

          <button
            onClick={() => onViewChange('alarm-annunciator')}
            className={`whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentView === 'alarm-annunciator'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{trans.nav.alarmAnnunciator}</span>
            {criticalCount > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                {criticalCount}
              </span>
            )}
          </button>
        </nav>

        {/* Global Machine Search Bar (Desktop / Tablet) */}
        <div className="flex-1 max-w-xs xl:max-w-sm hidden md:block mx-1">
          <GlobalSearchBar
            machines={machines}
            onSelectMachine={handleSelectMachine}
            onOpenDetailModal={onOpenDetailModal}
          />
        </div>

        {/* Zone 3: 1-2 Primary Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Sound Mode Selector */}
          <select
            value={alarmStatus.soundMode}
            onChange={(e) => audioAlarmManager.setSoundMode(e.target.value as AlarmSoundMode)}
            className="hidden lg:block bg-slate-900 text-slate-300 text-xs font-mono font-medium rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-cyan-500"
            title="Alarm Sound Pattern"
          >
            <option value="intermittent">⚡ Intermittent Beep</option>
            <option value="siren">🚨 Escalating Siren</option>
            <option value="buzz">🔊 Electrical Buzz</option>
            <option value="chime">🔔 Dual Warning Tone</option>
            <option value="horn">🎺 Klaxon Horn</option>
          </select>

          {/* Engine Runner Toggle */}
          <button
            onClick={() => simulationManager.togglePlayPause()}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border ${
              isRunning
                ? 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800'
                : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="h-3.5 w-3.5 text-amber-400" />
                <span>{trans.nav.pause}</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>{trans.nav.runStream}</span>
              </>
            )}
          </button>

          {/* Scenario Trigger */}
          <select
            value={activeScenario}
            onChange={(e) => {
              const sc = e.target.value as Scenario;
              onScenarioChange(sc);
              simulationManager.setGlobalScenario(sc);
            }}
            className="hidden sm:block bg-slate-900 text-slate-200 text-xs font-mono rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            title={trans.scenario.label}
          >
            <option value="Normal">{trans.scenario.normal}</option>
            <option value="Advisory">{trans.scenario.advisory}</option>
            <option value="Action Required">{trans.scenario.actionRequired}</option>
            <option value="Post-Maintenance">{trans.scenario.postMaintenance}</option>
          </select>

          {/* Manufacturing Language Switcher Dropdown */}
          <LanguageSwitcher variant="header" />

          {/* PWA Direct In-App Install Button */}
          <PWAInstallButton variant="secondary" />

          {/* Settings & Auto-Export Config Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors relative flex items-center gap-1.5 px-2.5 text-xs font-mono"
              title={trans.settings.title}
            >
              <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
              <span className="hidden xl:inline">{trans.nav.settings}</span>
              {autoExportEnabled && (
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="Hourly Auto-Export Active" />
              )}
            </button>
          )}

        </div>

      </div>

      {/* Mobile Search Bar Strip */}
      <div className="md:hidden px-4 pb-2 pt-0.5 border-t border-slate-800/50">
        <GlobalSearchBar
          machines={machines}
          onSelectMachine={handleSelectMachine}
          onOpenDetailModal={onOpenDetailModal}
          className="w-full"
        />
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 px-2 py-2 text-xs font-medium text-slate-400">
        {onSwitchToWebsite && (
          <button
            onClick={onSwitchToWebsite}
            className="flex items-center gap-1 text-slate-400 hover:text-cyan-400"
          >
            <Globe className="h-3.5 w-3.5 text-cyan-400" />
            <span>Site</span>
          </button>
        )}
        <button
          onClick={() => onViewChange('plant-overview')}
          className={currentView === 'plant-overview' ? 'text-cyan-400 font-bold' : ''}
        >
          {trans.nav.plantOverview}
        </button>
        <button
          onClick={() => onViewChange('machine-deep-dive')}
          className={currentView === 'machine-deep-dive' ? 'text-cyan-400 font-bold' : ''}
        >
          {trans.nav.machineMonitor}
        </button>
        <button
          onClick={() => onViewChange('spectrum-analyzer')}
          className={currentView === 'spectrum-analyzer' ? 'text-cyan-400 font-bold' : ''}
        >
          FFT
        </button>
        <button
          onClick={() => onViewChange('alarm-annunciator')}
          className={currentView === 'alarm-annunciator' ? 'text-cyan-400 font-bold' : ''}
        >
          Alarm
        </button>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 text-cyan-400"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Config</span>
          </button>
        )}
        <LanguageSwitcher variant="header" className="scale-90" />
      </div>

    </header>
  );
};
