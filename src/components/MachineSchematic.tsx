import React, { useState } from 'react';
import { MachineState, MachineSubsystem } from '../types';
import { ShieldCheck, AlertTriangle, ShieldAlert, Thermometer, Activity, Gauge, Zap } from 'lucide-react';

interface MachineSchematicProps {
  machine: MachineState;
  onSubsystemClick?: (subsystem: MachineSubsystem) => void;
}

export const MachineSchematic: React.FC<MachineSchematicProps> = ({ machine, onSubsystemClick }) => {
  const [selectedSubId, setSelectedSubId] = useState<string>(machine.subsystems[0]?.id || '');
  const selectedSub = machine.subsystems.find(s => s.id === selectedSubId) || machine.subsystems[0];
  const isCritical = machine.healthState === 'Action Required';
  const isAdvisory = machine.healthState === 'Advisory';

  const { temperature, vibration, torque, rotational_speed } = machine.currentReadings;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Subsystem Mimic & Physical Component Architecture
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Interactive Hotspot Telemetry Probes
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any machine component hotspot to inspect thermal dissipation and structural stress.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Nominal
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Advisory
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
            Critical Trip
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Interactive Schematic Diagram (SVG Canvas Stage) */}
        <div className="lg:col-span-8 bg-slate-950 rounded-xl border border-slate-800 p-4 relative overflow-hidden flex flex-col items-center justify-center min-h-[340px]">
          
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* Machine Type Specific Schematic Graphic */}
          <svg className="w-full max-w-[540px] h-[280px] text-slate-700 transition-all select-none" viewBox="0 0 540 280">
            <defs>
              <linearGradient id="machineBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="spindleGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={isCritical ? '#f43f5e' : isAdvisory ? '#f59e0b' : '#06b6d4'} stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Base Foundation / Machine Bed */}
            <rect x="40" y="210" width="460" height="45" rx="6" fill="url(#machineBodyGrad)" stroke="#334155" strokeWidth="1.5" />
            <line x1="60" y1="232" x2="480" y2="232" stroke="#475569" strokeDasharray="4 4" strokeWidth="1" />
            <text x="50" y="240" fill="#64748b" fontSize="10" fontFamily="monospace">BASE CASTING / VIBRATION DAMPENER</text>

            {/* Main Vertical Column / Housing */}
            <path d="M 120 210 L 140 50 L 400 50 L 420 210 Z" fill="#111827" stroke="#334155" strokeWidth="1.5" />

            {/* Guide Rails X/Y/Z */}
            <line x1="160" y1="65" x2="160" y2="195" stroke="#38bdf8" strokeWidth="3" opacity="0.6" />
            <line x1="380" y1="65" x2="380" y2="195" stroke="#38bdf8" strokeWidth="3" opacity="0.6" />

            {/* Spindle Headstock / Ram Carriage */}
            <rect x="210" y="70" width="120" height="110" rx="8" fill="#1e293b" stroke={isCritical ? '#f43f5e' : '#0ea5e9'} strokeWidth="2" />
            <rect x="235" y="100" width="70" height="75" rx="4" fill="url(#spindleGlow)" />
            
            {/* Spinning Spindle Tool / Impeller Shaft */}
            <line x1="270" y1="175" x2="270" y2="205" stroke="#f8fafc" strokeWidth="5" />
            <polygon points="260,205 280,205 270,225" fill="#f59e0b" />

            {/* Drive Motor Unit */}
            <rect x="150" y="75" width="55" height="75" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
            <path d="M 155 85 L 200 85 M 155 100 L 200 100 M 155 115 L 200 115 M 155 130 L 200 130" stroke="#334155" strokeWidth="1" />

            {/* Coolant / Lubrication Lines */}
            <path d="M 420 180 Q 360 160 330 140" fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="3 3" />
            <path d="M 120 100 Q 180 90 220 95" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="3 3" />

            {/* Rotational Speed Indicator Ring */}
            <circle cx="270" cy="135" r="28" fill="none" stroke={isCritical ? '#f43f5e' : '#38bdf8'} strokeWidth="1.5" strokeDasharray="6 4" className={machine.healthState === 'Normal' ? 'animate-spin' : ''} style={{ transformOrigin: '270px 135px', animationDuration: '4s' }} />
          </svg>

          {/* Interactive Subsystem Probe Pins Placed Directly on the Schematic */}
          {machine.subsystems.map((sub) => {
            const isSelected = sub.id === selectedSubId;
            const subCrit = sub.status === 'Critical' || (sub.type === 'spindle' && isCritical);
            const subWarn = sub.status === 'Warning' || (sub.type === 'spindle' && isAdvisory);

            let pingBg = 'bg-cyan-500';
            let dotColor = 'bg-cyan-400';
            let ringBorder = 'border-cyan-400/80';

            if (subCrit) {
              pingBg = 'bg-rose-500';
              dotColor = 'bg-rose-500';
              ringBorder = 'border-rose-500 animate-pulse';
            } else if (subWarn) {
              pingBg = 'bg-amber-500';
              dotColor = 'bg-amber-400';
              ringBorder = 'border-amber-400';
            }

            return (
              <button
                key={sub.id}
                onClick={() => {
                  setSelectedSubId(sub.id);
                  onSubsystemClick?.(sub);
                }}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-transform hover:scale-110 focus:outline-none z-20`}
                style={{ left: `${sub.coordinates.x}%`, top: `${sub.coordinates.y}%` }}
                title={`${sub.name} - ${sub.status} (${sub.healthIndex}% Health)`}
              >
                <div className={`relative flex items-center justify-center p-1 rounded-full border-2 bg-slate-950/90 shadow-lg ${ringBorder} ${isSelected ? 'ring-4 ring-cyan-500/40' : ''}`}>
                  <span className={`absolute -inset-1 rounded-full opacity-75 animate-ping ${pingBg}`} />
                  <span className={`h-3 w-3 rounded-full ${dotColor}`} />
                </div>
                
                {/* Float Tag */}
                <div className={`absolute left-1/2 -bottom-6 transform -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap bg-slate-900/90 border border-slate-700/80 shadow-md ${
                  isSelected ? 'text-white border-cyan-500 font-bold' : 'text-slate-400'
                }`}>
                  {sub.name.split(' ')[0]}
                </div>
              </button>
            );
          })}

          {/* Bottom Live Schematic Status Bar */}
          <div className="w-full mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono gap-2">
            <span>Spindle: <strong className="text-slate-100">{rotational_speed} rpm</strong></span>
            <span>Bearing Temp: <strong className={temperature >= 310 ? 'text-rose-400' : 'text-slate-100'}>{temperature} K</strong></span>
            <span>Vibration: <strong className={vibration >= 100 ? 'text-rose-400' : 'text-slate-100'}>{vibration} μm</strong></span>
            <span>Torque: <strong className="text-slate-100">{torque} Nm</strong></span>
          </div>

        </div>

        {/* Selected Subsystem Inspector Column */}
        <div className="lg:col-span-4 bg-slate-950/80 rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Subsystem Inspector
                </span>
                <h4 className="text-sm font-bold text-slate-100 mt-0.5">
                  {selectedSub?.name}
                </h4>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                selectedSub?.status === 'Critical' ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse' :
                selectedSub?.status === 'Warning' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                'bg-emerald-950 text-emerald-300 border-emerald-800'
              }`}>
                {selectedSub?.status}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {selectedSub?.description}
            </p>

            {/* Real-time Subsystem Gauge Metrics */}
            <div className="space-y-3">
              
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                  <span>Health Index:</span>
                  <strong className={`font-bold ${
                    (selectedSub?.healthIndex ?? 100) < 50 ? 'text-rose-400' :
                    (selectedSub?.healthIndex ?? 100) < 80 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {selectedSub?.healthIndex}%
                  </strong>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      (selectedSub?.healthIndex ?? 100) < 50 ? 'bg-rose-500' :
                      (selectedSub?.healthIndex ?? 100) < 80 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${selectedSub?.healthIndex ?? 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                  <span>Mechanical Stress:</span>
                  <strong className="text-slate-100 font-bold">{selectedSub?.stressPercent}%</strong>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      (selectedSub?.stressPercent ?? 0) > 80 ? 'bg-rose-500' :
                      (selectedSub?.stressPercent ?? 0) > 60 ? 'bg-amber-400' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${selectedSub?.stressPercent ?? 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                  <span>Subsystem Temperature:</span>
                  <strong className="text-slate-100 font-bold">{selectedSub?.temperature} K</strong>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-orange-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, ((selectedSub?.temperature ?? 300) / 320) * 100)}%` }}
                  />
                </div>
              </div>

            </div>

          </div>

          {/* Subsystem Quick Selector Chips */}
          <div className="pt-4 border-t border-slate-800/80 mt-4">
            <span className="text-[10px] uppercase font-mono text-slate-500 mb-1.5 block">
              Direct Component Select:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {machine.subsystems.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubId(sub.id)}
                  className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                    sub.id === selectedSubId
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {sub.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
