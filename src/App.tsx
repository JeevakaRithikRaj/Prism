import React, { useState, useEffect } from 'react';
import { simulationManager } from './managers/SimulationManager';
import { MachineState, Scenario, ViewMode, AppExperienceMode } from './types';
import { Header } from './components/Header';
import { PlantOverview } from './components/PlantOverview';
import { MachineDeepDive } from './components/MachineDeepDive';
import { VibrationSpectrumViewer } from './components/VibrationSpectrumViewer';
import { AlarmAnnunciator } from './components/AlarmAnnunciator';
import { MachineDetailModal } from './components/MachineDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer } from './components/ToastContainer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Website } from './components/Website';
import { I18nProvider, useI18n } from './i18n/i18nContext';

const AppContent: React.FC = () => {
  const [machines, setMachines] = useState<MachineState[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [activeScenario, setActiveScenario] = useState<Scenario>('Normal');
  const [selectedMachineId, setSelectedMachineId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('machine') || params.get('machineId');
      if (m) return m;
    }
    return 'cnc-milling-machine';
  });
  const [modalMachine, setModalMachine] = useState<MachineState | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<'schematic' | 'telemetry' | 'vibration' | 'plc' | 'xai' | 'history' | 'calendar' | 'qr-code'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as any;
      if (tab && ['schematic', 'telemetry', 'vibration', 'plc', 'xai', 'history', 'calendar', 'qr-code'].includes(tab)) {
        return tab;
      }
    }
    return 'schematic';
  });
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Experience Mode: 'website' (Product Landing & Platform Tour) vs 'app' (Operational Industrial Console)
  const [experienceMode, setExperienceMode] = useState<AppExperienceMode>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      // If a machine QR code was scanned (?machine=...), immediately open the App Console
      if (params.get('machine') || params.get('machineId')) return 'app';

      // 1. If running as an installed PWA (standalone display), open App Console directly
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      if (isStandalone) return 'app';

      // 2. Query parameters ?mode=app or ?mode=website
      const modeParam = params.get('mode');
      if (modeParam === 'app') return 'app';
      if (modeParam === 'website' || modeParam === 'site') return 'website';

      // 3. URL Hash #app or #site
      if (window.location.hash === '#app') return 'app';
      if (window.location.hash === '#site' || window.location.hash === '#website') return 'website';

      // 4. Stored user preference
      const stored = localStorage.getItem('prism_experience_mode');
      if (stored === 'app' || stored === 'website') return stored;
    }
    return 'website';
  });

  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('view') as ViewMode | null;
      if (v && ['plant-overview', 'machine-deep-dive', 'spectrum-analyzer', 'alarm-annunciator'].includes(v)) {
        return v;
      }
      if (params.get('machine') || params.get('machineId')) {
        return 'machine-deep-dive';
      }
    }
    return 'plant-overview';
  });

  const handleSetExperienceMode = (mode: AppExperienceMode) => {
    setExperienceMode(mode);
    try {
      localStorage.setItem('prism_experience_mode', mode);
      const url = new URL(window.location.href);
      url.searchParams.set('mode', mode);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const unsubscribe = simulationManager.subscribe((states, running) => {
      setMachines(states);
      setIsRunning(running);

      if (modalMachine) {
        const updated = states.find(m => m.id === modalMachine.id);
        if (updated) {
          setModalMachine(updated);
        }
      }
    });

    return () => unsubscribe();
  }, [modalMachine]);

  // Handle URL deep-linking on initial load or browser back/forward (e.g. from scanned QR codes)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkUrlParams = () => {
      const params = new URLSearchParams(window.location.search);
      const targetMachineId = params.get('machine') || params.get('machineId');
      const targetView = params.get('view') as ViewMode | null;
      const shouldOpenModal = params.get('modal') === 'true' || params.get('openModal') === 'true';
      const targetTab = params.get('tab') as any;

      if (targetMachineId) {
        setSelectedMachineId(targetMachineId);
        setExperienceMode('app');
        if (targetView && ['plant-overview', 'machine-deep-dive', 'spectrum-analyzer', 'alarm-annunciator'].includes(targetView)) {
          setCurrentView(targetView);
        } else {
          setCurrentView('machine-deep-dive');
        }

        const all = simulationManager.getAllStates();
        const target = all.find(m => m.id.toLowerCase() === targetMachineId.toLowerCase());
        if (target && shouldOpenModal) {
          setModalMachine(target);
          if (targetTab && ['schematic', 'telemetry', 'vibration', 'plc', 'xai', 'history', 'calendar', 'qr-code'].includes(targetTab)) {
            setModalInitialTab(targetTab);
          }
        }
      }
    };

    checkUrlParams();
    window.addEventListener('popstate', checkUrlParams);
    return () => window.removeEventListener('popstate', checkUrlParams);
  }, []);

  const handleSelectMachineForDeepDive = (machine: MachineState) => {
    setSelectedMachineId(machine.id);
    setCurrentView('machine-deep-dive');
  };

  const handleOpenDetailModal = (
    machine: MachineState,
    initialTab: 'schematic' | 'telemetry' | 'vibration' | 'plc' | 'xai' | 'history' | 'calendar' | 'qr-code' = 'schematic'
  ) => {
    setModalMachine(machine);
    setModalInitialTab(initialTab);
  };

  const activeMachine = machines.find(m => m.id === selectedMachineId) || machines[0];

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-900">
      
      {/* 1. SEPARATE EXPERIENCE: WEBSITE (Product Marketing, Architecture, ROI & App Launcher) */}
      {experienceMode === 'website' ? (
        <Website
          machines={machines}
          onLaunchApp={(view) => {
            if (view) setCurrentView(view);
            handleSetExperienceMode('app');
          }}
        />
      ) : (
        /* 2. SEPARATE EXPERIENCE: OPERATIONAL APP CONSOLE (Predictive Industrial Telemetry) */
        <>
          {/* Top Application Navigation & Telemetry Header */}
          <Header
            machines={machines}
            isRunning={isRunning}
            activeScenario={activeScenario}
            currentView={currentView}
            onViewChange={setCurrentView}
            onScenarioChange={setActiveScenario}
            onOpenSettings={() => setShowSettingsModal(true)}
            onSwitchToWebsite={() => handleSetExperienceMode('website')}
            onSelectMachine={handleSelectMachineForDeepDive}
            onOpenDetailModal={handleOpenDetailModal}
          />

          {/* Main App Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            
            {/* View 1: Plant Overview (Multi-Machine Line) */}
            {currentView === 'plant-overview' && (
              <PlantOverview
                machines={machines}
                onSelectMachine={handleSelectMachineForDeepDive}
                onOpenDetail={handleOpenDetailModal}
              />
            )}

            {/* View 2: Machine-Level Deep Monitoring Console */}
            {currentView === 'machine-deep-dive' && (
              <MachineDeepDive
                machines={machines}
                selectedMachineId={selectedMachineId}
                onSelectMachineId={setSelectedMachineId}
                onOpenDetailModal={handleOpenDetailModal}
              />
            )}

            {/* View 3: Dedicated Vibration FFT Spectrum Analyzer */}
            {currentView === 'spectrum-analyzer' && activeMachine && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-mono">Select Target Machine:</span>
                    <select
                      value={selectedMachineId}
                      onChange={(e) => setSelectedMachineId(e.target.value)}
                      className="bg-slate-950 text-slate-100 text-xs font-mono font-bold px-3 py-1.5 rounded-xl border border-slate-700"
                    >
                      {machines.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.healthState})
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="text-xs font-mono text-cyan-400">
                    Sampling Rate: 25.6 kHz · ISO 10816-3 Standard
                  </span>
                </div>

                <VibrationSpectrumViewer machine={activeMachine} />
              </div>
            )}

            {/* View 4: ISA-18.2 Alarm Annunciator & Sound Synthesizer */}
            {currentView === 'alarm-annunciator' && (
              <AlarmAnnunciator
                machines={machines}
                onSelectMachine={handleSelectMachineForDeepDive}
              />
            )}

          </main>

          {/* Clean Anti-Slop Footer */}
          <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500 font-mono flex flex-wrap items-center justify-between max-w-7xl mx-auto w-full gap-3">
            <div>
              &copy; {new Date().getFullYear()} RJRR. All rights reserved. &middot; PRISM Machine-Level Monitoring System
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="text-slate-600 font-normal">RJRR Industrial Systems</span>
              <button
                onClick={() => handleSetExperienceMode('website')}
                className="hover:text-cyan-400 underline underline-offset-4 transition-colors"
              >
                Switch to Product Website
              </button>
            </div>
          </footer>
        </>
      )}

      {/* Global Elements: Detail Modal (if opened) */}
      <MachineDetailModal
        machine={modalMachine}
        initialTab={modalInitialTab}
        onClose={() => setModalMachine(null)}
        onNavigateToView={(view, mId) => {
          if (mId) setSelectedMachineId(mId);
          setCurrentView(view);
          setModalMachine(null);
        }}
      />

      {/* Global Elements: Settings & Automated Export Configuration Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        machines={machines}
      />

      {/* Global Elements: Connectivity Offline Indicator */}
      <OfflineIndicator />

      {/* Global Elements: Toast Notification System */}
      <ToastContainer />

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
};

export default App;
