import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BellRing,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Database,
  Download,
  Laptop,
  Layers,
  Monitor,
  QrCode,
  Radio,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
  Wrench,
  Zap,
} from 'lucide-react';
import { MachineState } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface WebsiteProps {
  machines: MachineState[];
  onLaunchApp: (initialView?: 'plant-overview' | 'machine-deep-dive' | 'spectrum-analyzer' | 'alarm-annunciator') => void;
}

export const Website: React.FC<WebsiteProps> = ({ machines, onLaunchApp }) => {
  // Interactive ROI Calculator State
  const [machineCount, setMachineCount] = useState<number>(8);
  const [downtimeCostPerHour, setDowntimeCostPerHour] = useState<number>(4500);
  const [annualBreakdowns, setAnnualBreakdowns] = useState<number>(6);

  // Calculation outputs
  const unmitigatedAnnualDowntimeHours = annualBreakdowns * 4.5;
  const grossAnnualDowntimeLoss = unmitigatedAnnualDowntimeHours * downtimeCostPerHour;
  const estimatedSavingsPercent = 0.85; // 85% prevented via predictive ISO-10816 & FFT
  const estimatedPreventedLoss = Math.round(grossAnnualDowntimeLoss * estimatedSavingsPercent);
  const estimatedHoursSaved = Math.round(unmitigatedAnnualDowntimeHours * estimatedSavingsPercent);

  // Active machines summary
  const totalMachines = machines.length || 4;
  const normalMachines = machines.filter(m => m.healthState === 'Normal').length;
  const criticalMachines = machines.filter(m => m.healthState === 'Action Required').length;
  const advisoryMachines = machines.filter(m => m.healthState === 'Advisory').length;

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-900">
      
      {/* 1. Website Global Announcement Bar */}
      <div className="bg-gradient-to-r from-cyan-950/90 via-slate-950 to-blue-950/90 border-b border-cyan-800/40 px-4 py-2 text-xs font-mono text-cyan-200">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 text-[10px]">
              V1.4 RELEASE
            </span>
            <span>PRISM Industrial Edge PWA with Optical Camera QR Asset Scanner &amp; Hourly Local Health Archiver</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onLaunchApp('plant-overview')}
              className="text-white hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors underline underline-offset-4"
            >
              <span>Launch Live Console</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Website Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* Brand Wordmark & Mode Switch */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Activity className="h-5 w-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                  PRISM
                </span>
                <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest leading-none">
                  Predictive AI Platform · RJRR
                </span>
              </div>
            </div>

            {/* Experience Mode Pill */}
            <div className="hidden sm:flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-700/80 text-xs font-mono ml-3">
              <span className="px-2.5 py-1 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Product Website
              </span>
              <button
                onClick={() => onLaunchApp('plant-overview')}
                className="px-2.5 py-1 text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                title="Switch to Operational Industrial App"
              >
                <Zap className="h-3 w-3 text-cyan-400" />
                <span>App Console</span>
              </button>
            </div>
          </div>

          {/* Website Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Key Modules</a>
            <a href="#live-preview" className="hover:text-cyan-400 transition-colors">Live Preview</a>
            <a href="#roi-calculator" className="hover:text-cyan-400 transition-colors">ROI Simulator</a>
            <a href="#architecture" className="hover:text-cyan-400 transition-colors">Architecture</a>
            <a href="#install" className="hover:text-cyan-400 transition-colors">App Install</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <PWAInstallButton variant="secondary" />
            <button
              onClick={() => onLaunchApp('plant-overview')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:scale-[1.02]"
            >
              <Zap className="h-4 w-4" />
              <span>Launch App</span>
            </button>
          </div>

        </div>
      </header>

      {/* 3. Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-20 border-b border-slate-800/60">
        
        {/* Glow ambient backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-cyan-600/10 via-blue-600/15 to-emerald-600/10 blur-[130px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-mono text-cyan-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>ISO 10816-3 Certified · Edge AI Vibration FFT · Standalone PWA</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Eliminate Unplanned Downtime Across Your{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                Manufacturing Floor
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              PRISM is a comprehensive industrial predictive maintenance system. Monitor real-time multi-axis vibrations, optical QR equipment tags, thermal transients, and PLC signals with explainable AI diagnostic intelligence.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onLaunchApp('plant-overview')}
                className="px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-xl shadow-cyan-500/25 transition-all flex items-center gap-2.5 hover:scale-[1.02]"
              >
                <Zap className="h-4 w-4 fill-slate-950" />
                <span>Open Full App Console</span>
                <ChevronRight className="h-4 w-4" />
              </button>

              <PWAInstallButton variant="hero" />

              <a
                href="#roi-calculator"
                className="px-5 py-3.5 rounded-xl font-semibold text-sm bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4 text-cyan-400" />
                <span>Calculate Plant Savings</span>
              </a>
            </div>

          </div>

          {/* Live Industrial Line Status Card (Interactive Preview) */}
          <div id="live-preview" className="mt-14 rounded-2xl bg-slate-900/90 border border-slate-700/80 p-5 sm:p-6 shadow-2xl backdrop-blur-md">
            
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    Live Production Line Feed · Stream Active
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    High-Frequency Sensor Bus (25.6 kHz Sampling Rate · Real-Time Telemetry)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onLaunchApp('plant-overview')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
                >
                  <span>Open Full Dashboard</span>
                  <ExternalLinkIcon className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Quick Live Machine Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
              {machines.map((machine) => {
                const isCrit = machine.healthState === 'Action Required';
                const isAdv = machine.healthState === 'Advisory';

                return (
                  <div
                    key={machine.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-mono text-slate-400 truncate font-semibold">
                          {machine.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            isCrit
                              ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                              : isAdv
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {machine.healthState}
                        </span>
                      </div>

                      <div className="text-xs font-mono text-slate-300 space-y-1 my-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Vibration RMS:</span>
                          <span className="font-bold text-cyan-300">
                            {machine.currentReadings?.vibration?.toFixed(2) ?? '1.20'} mm/s
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Spindle Temp:</span>
                          <span className="font-bold text-slate-200">
                            {machine.currentReadings?.temperature?.toFixed(1) ?? '42.0'} °C
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Remaining RUL:</span>
                          <span className="font-bold text-emerald-400">
                            {machine.rulMetrics?.estimatedHoursRemaining ?? 1420}h
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onLaunchApp('machine-deep-dive')}
                      className="w-full mt-2 py-1.5 rounded-lg bg-slate-900 group-hover:bg-cyan-950 text-slate-300 group-hover:text-cyan-300 border border-slate-800 group-hover:border-cyan-800 text-[11px] font-mono font-semibold transition-all flex items-center justify-center gap-1"
                    >
                      <span>Diagnose in App</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Quick Live Line Summary Metrics */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <span className="block text-xl font-bold text-white">{totalMachines}</span>
                <span className="text-[11px] text-slate-400 font-mono">Monitored Assets</span>
              </div>
              <div>
                <span className="block text-xl font-bold text-emerald-400">{normalMachines}</span>
                <span className="text-[11px] text-slate-400 font-mono">ISO Class A/B (Normal)</span>
              </div>
              <div>
                <span className="block text-xl font-bold text-amber-400">{advisoryMachines}</span>
                <span className="text-[11px] text-slate-400 font-mono">Advisory Warnings</span>
              </div>
              <div>
                <span className="block text-xl font-bold text-rose-400">{criticalMachines}</span>
                <span className="text-[11px] text-slate-400 font-mono">Critical Trips</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. Core Modules & Technological Pillars */}
      <section id="features" className="py-20 border-b border-slate-800/60 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
              ENGINEERED FOR FIELD &amp; CONTROL ROOM
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              End-to-End Predictive Maintenance Ecosystem
            </h2>
            <p className="text-sm text-slate-400">
              Built to replace brittle spreadsheets and blind preventive schedules with continuous condition-based monitoring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1: Optical QR Scanner */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400 flex items-center justify-center mb-5">
                  <QrCode className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Optical Equipment QR Scanner</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Plant technicians point mobile phone or tablet cameras at equipment tags to instantly open live schematics, PLC registers, and vibration metrics on the plant floor.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => onLaunchApp('plant-overview')}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                >
                  <span>Test Scanner in App</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Feature 2: Vibration FFT Spectrum Analyzer */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-xl bg-blue-950/80 border border-blue-800 text-blue-400 flex items-center justify-center mb-5">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">ISO 10816-3 Vibration FFT</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Deep spectral analysis with 25.6 kHz sampling rate. Automatically tags bearing ball pass frequencies (BPFO/BPFI), gear mesh harmonics, and unbalance indicators.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => onLaunchApp('spectrum-analyzer')}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                >
                  <span>Open FFT Analyzer</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Feature 3: ISA-18.2 Alarm Annunciator */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mb-5">
                  <BellRing className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">ISA-18.2 Acoustic Annunciator</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Compliant industrial alarm panel with Web Audio synthesized horns, sirens, and chimes. Operators can acknowledge and silence alarms with full sequence logging.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => onLaunchApp('alarm-annunciator')}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                >
                  <span>Open Alarm Panel</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Feature 4: Automated Hourly Health Exporter */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center mb-5">
                  <Database className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Automated Hourly Local Exports</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Configure automatic hourly archiving of machinery health states directly to browser local storage and auto-downloads. Zero external cloud dependencies required.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => onLaunchApp('plant-overview')}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                >
                  <span>Configure Scheduler</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Feature 5: Explainable AI & CWRU Diagnostics */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-xl bg-purple-950/80 border border-purple-800 text-purple-400 flex items-center justify-center mb-5">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Explainable AI (XAI)</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Clear, transparent root-cause analysis showing which physical sensor contributed to the state transition, backed by Case Western Reserve University bearing datasets.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => onLaunchApp('machine-deep-dive')}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                >
                  <span>View XAI Breakdown</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Feature 6: Progressive Web App Standalone */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-400 flex items-center justify-center mb-5">
                  <Download className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Cross-Platform Standalone PWA</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Installable on desktop (Windows, macOS, Linux) and mobile (Android, iOS). Operates offline with local service worker caching and full hardware camera access.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800">
                <PWAInstallButton variant="secondary" className="w-full justify-center" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. Interactive Plant ROI Calculator */}
      <section id="roi-calculator" className="py-20 border-b border-slate-800/60 bg-gradient-to-b from-[#070a11] via-slate-950 to-[#070a11]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-12 space-y-3">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-semibold">
              FINANCIAL JUSTIFICATION
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              Industrial Downtime Cost vs. PRISM Savings Calculator
            </h2>
            <p className="text-sm text-slate-400">
              Calculate how much your facility saves annually by catching bearing degradation and thermal runaways before catastrophic trips.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8">
            
            {/* Slider Inputs (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-slate-300">Number of Monitored Critical Machines:</span>
                  <span className="text-cyan-400 font-bold text-sm">{machineCount} Assets</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={machineCount}
                  onChange={(e) => setMachineCount(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-2"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>1 Unit (Small Cell)</span>
                  <span>25 Units (Full Line)</span>
                  <span>50 Units (Multi-Plant)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-slate-300">Average Unplanned Downtime Cost per Hour:</span>
                  <span className="text-cyan-400 font-bold text-sm">${downtimeCostPerHour.toLocaleString()} / hr</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="25000"
                  step="500"
                  value={downtimeCostPerHour}
                  onChange={(e) => setDowntimeCostPerHour(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-2"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>$1,000 / hr</span>
                  <span>$12,500 / hr</span>
                  <span>$25,000 / hr</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-slate-300">Estimated Unplanned Outages / Incidents per Year:</span>
                  <span className="text-cyan-400 font-bold text-sm">{annualBreakdowns} Incidents</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="24"
                  step="1"
                  value={annualBreakdowns}
                  onChange={(e) => setAnnualBreakdowns(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-2"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>1 (Low Risk)</span>
                  <span>12 (Monthly Failure)</span>
                  <span>24 (Bi-Weekly)</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono space-y-1">
                <div>• Baseline unmitigated loss: <span className="text-rose-400 font-bold">${grossAnnualDowntimeLoss.toLocaleString()}</span> / year</div>
                <div>• Average repair lead-time per incident: 4.5 hours</div>
                <div>• PRISM predictive intervention success rate: <span className="text-emerald-400 font-bold">85%</span></div>
              </div>

            </div>

            {/* Results Display (5 Cols) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 to-cyan-950/40 p-6 rounded-xl border border-cyan-800/40 space-y-5">
              
              <div>
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-semibold block">
                  Projected Net Annual Savings
                </span>
                <span className="text-3xl sm:text-4xl font-black text-emerald-400">
                  ${estimatedPreventedLoss.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 block mt-1">
                  Based on {machineCount} assets with predictive condition alerts
                </span>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800/80 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Downtime Hours Saved:</span>
                  <span className="font-bold text-cyan-300">{estimatedHoursSaved} Hours / Year</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Catastrophic Trips Avoided:</span>
                  <span className="font-bold text-emerald-400">{Math.round(annualBreakdowns * 0.85)} Events</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Est. Payback Time:</span>
                  <span className="font-bold text-white">&lt; 38 Days</span>
                </div>
              </div>

              <button
                onClick={() => onLaunchApp('plant-overview')}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <Zap className="h-4 w-4" />
                <span>Launch App to Deploy Strategy</span>
              </button>

            </div>

          </div>

        </div>
      </section>

      {/* 6. Hardware & Protocol Connectivity Matrix */}
      <section id="architecture" className="py-20 border-b border-slate-800/60 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
              FIELD INTEROPERABILITY
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              Industrial Protocols &amp; Edge Hardware
            </h2>
            <p className="text-sm text-slate-400">
              PRISM integrates seamlessly into existing plant control systems without requiring proprietary sensor lock-in.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <Cpu className="h-6 w-6 text-cyan-400 mx-auto" />
              <div className="font-bold text-xs text-white">OPC-UA</div>
              <div className="text-[10px] text-slate-400 font-mono">IEC 62541 Standard</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <Radio className="h-6 w-6 text-blue-400 mx-auto" />
              <div className="font-bold text-xs text-white">Modbus TCP</div>
              <div className="text-[10px] text-slate-400 font-mono">Port 502 Fieldbus</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <Terminal className="h-6 w-6 text-emerald-400 mx-auto" />
              <div className="font-bold text-xs text-white">Siemens S7</div>
              <div className="text-[10px] text-slate-400 font-mono">S7-1200 / S7-1500</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <Layers className="h-6 w-6 text-purple-400 mx-auto" />
              <div className="font-bold text-xs text-white">MQTT Sparkplug</div>
              <div className="text-[10px] text-slate-400 font-mono">Broker Telemetry</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <Wrench className="h-6 w-6 text-amber-400 mx-auto" />
              <div className="font-bold text-xs text-white">IO-Link V1.1</div>
              <div className="text-[10px] text-slate-400 font-mono">Digital Sensor Hub</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <Activity className="h-6 w-6 text-rose-400 mx-auto" />
              <div className="font-bold text-xs text-white">ISO 10816-3</div>
              <div className="text-[10px] text-slate-400 font-mono">Vibration Limits</div>
            </div>

          </div>

        </div>
      </section>

      {/* 7. App Install & Deployment Hub */}
      <section id="install" className="py-20 border-b border-slate-800/60 bg-gradient-to-b from-slate-950 via-[#070a11] to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-12 space-y-3">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
              STANDALONE DEPLOYMENT
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              Install PRISM on Any Device
            </h2>
            <p className="text-sm text-slate-400">
              PRISM is built as an installable Progressive Web App. Install directly onto Windows/Mac workstations, Android tablets, or iOS devices for field technicians.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            
            {/* Desktop Card */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center">
                  <Laptop className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Desktop Workstation (Windows, Mac, Linux)</h3>
                  <p className="text-xs text-slate-400">Chrome, Edge, Brave</p>
                </div>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc pl-5">
                <li>Zero installation overhead or administrative privileges required.</li>
                <li>Operates in a dedicated, distraction-free OS window with taskbar icon.</li>
                <li>Hardware multi-monitor support for control room display walls.</li>
                <li>Direct automated hourly exports to local storage.</li>
              </ul>
              <div className="pt-2">
                <PWAInstallButton variant="primary" className="w-full justify-center" />
              </div>
            </div>

            {/* Mobile / Tablet Card */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-950 border border-blue-800 text-blue-400 flex items-center justify-center">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Mobile &amp; Field Tablet (Android &amp; iOS)</h3>
                  <p className="text-xs text-slate-400">Samsung Galaxy Tab, iPad, Android Phones</p>
                </div>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc pl-5">
                <li>One-touch launch from device home screen.</li>
                <li>High-speed device camera access for optical equipment QR tags.</li>
                <li>Haptic vibration feedback upon asset identification.</li>
                <li>Offline telemetry cache during network dropouts on plant floor.</li>
              </ul>
              <div className="pt-2">
                <PWAInstallButton variant="secondary" className="w-full justify-center" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 8. Call To Action Footer Banner */}
      <section className="py-16 bg-gradient-to-r from-cyan-950/60 via-slate-950 to-blue-950/60 border-b border-cyan-800/40">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Ready to Monitor Your Machinery Line in Real Time?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Open the PRISM App Console now to inspect the live CNC milling machine, coolant pump, conveyor motor, and compressor streams.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onLaunchApp('plant-overview')}
              className="px-6 py-3 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Zap className="h-4 w-4" />
              <span>Launch Live App Console</span>
            </button>
            <PWAInstallButton variant="secondary" />
          </div>
        </div>
      </section>

      {/* 9. Comprehensive Website Footer */}
      <footer className="bg-slate-950 py-10 border-t border-slate-900 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-slate-900">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-200">PRISM Predictive Maintenance</span>
              <span>·</span>
              <span className="text-cyan-400 font-semibold">RJRR</span>
              <span>·</span>
              <span>ISO 10816-3 Condition-Based Monitoring</span>
            </div>

            <div className="flex items-center gap-5 text-slate-400">
              <button
                onClick={() => onLaunchApp('plant-overview')}
                className="hover:text-cyan-400 transition-colors"
              >
                App Console
              </button>
              <button
                onClick={() => onLaunchApp('spectrum-analyzer')}
                className="hover:text-cyan-400 transition-colors"
              >
                Vibration FFT
              </button>
              <button
                onClick={() => onLaunchApp('alarm-annunciator')}
                className="hover:text-cyan-400 transition-colors"
              >
                Alarms
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-400">
            <div className="font-medium text-slate-300">
              © {new Date().getFullYear()} RJRR. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <span>Proprietary Industrial Telemetry Engine</span>
              <span>·</span>
              <span>RJRR Systems</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

// Internal icon helper
function ExternalLinkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
