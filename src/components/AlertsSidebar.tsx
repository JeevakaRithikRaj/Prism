import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Wrench, RefreshCw, Zap, ChevronRight, Volume2, VolumeX, BellRing, CheckCircle } from 'lucide-react';
import { MachineState } from '../types';
import { simulationManager } from '../managers/SimulationManager';
import { audioAlarmManager, AlarmSoundMode, AudioAlarmStatus } from '../utils/AudioAlarmManager';

interface AlertsSidebarProps {
  machines: MachineState[];
  onSelectMachine: (machine: MachineState) => void;
}

export const AlertsSidebar: React.FC<AlertsSidebarProps> = ({ machines, onSelectMachine }) => {
  const [alarmStatus, setAlarmStatus] = useState<AudioAlarmStatus>(audioAlarmManager.getStatus());

  const criticalMachines = machines.filter(m => m.healthState === 'Action Required');
  const advisoryMachines = machines.filter(m => m.healthState === 'Advisory');

  useEffect(() => {
    const unsub = audioAlarmManager.subscribe((status) => {
      setAlarmStatus(status);
    });
    return () => unsub();
  }, []);

  return (
    <aside className="space-y-6">
      
      {/* Sound Alarm Control Console Box */}
      <div className={`rounded-2xl border p-4 shadow-xl transition-all ${
        alarmStatus.isAlarming && !alarmStatus.isMuted && !alarmStatus.isAcknowledged
          ? 'bg-rose-950/80 border-rose-600 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse'
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BellRing className={`h-4 w-4 ${alarmStatus.isAlarming ? 'text-rose-400 animate-bounce' : 'text-cyan-400'}`} />
            <h3 className="font-bold text-slate-100 text-sm">Action Required Alarm</h3>
          </div>
          <span className={`text-[10px] font-mono font-bold ${
            alarmStatus.isAlarming && !alarmStatus.isAcknowledged ? 'text-rose-400' : 'text-slate-400'
          }`}>
            {alarmStatus.isAlarming && !alarmStatus.isAcknowledged ? '● SOUND ACTIVE' : alarmStatus.isMuted ? 'MUTED' : 'READY'}
          </span>
        </div>

        <p className="text-xs text-slate-400 mb-2">
          Industrial acoustic alarm patterns (Web Audio API):
        </p>

        {/* Sound Pattern Selector */}
        <div className="mb-3">
          <select
            value={alarmStatus.soundMode}
            onChange={(e) => audioAlarmManager.setSoundMode(e.target.value as AlarmSoundMode)}
            className="w-full bg-slate-950 text-slate-100 text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="intermittent">⚡ Intermittent Beep (Warning / Stall)</option>
            <option value="siren">🚨 Escalating Siren (Emergency Fail)</option>
            <option value="buzz">🔊 Electrical Buzz (Interlock Trip)</option>
            <option value="chime">🔔 Dual Warning Chime (Caution)</option>
            <option value="horn">🎺 Klaxon Horn (High-Decibel)</option>
            {alarmStatus.customAudioName && (
              <option value="custom">📁 Custom: {alarmStatus.customAudioName}</option>
            )}
          </select>
        </div>

        {/* Silence ACK Button & Audio Toggles */}
        <div className="space-y-2">
          {alarmStatus.isAlarming && !alarmStatus.isAcknowledged && (
            <button
              onClick={() => audioAlarmManager.acknowledgeAlarm()}
              className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 animate-bounce"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Silence Alarm (ACK)</span>
            </button>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => audioAlarmManager.toggleMute()}
              className={`flex-1 min-w-[100px] py-1.5 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 transition-all ${
                alarmStatus.isMuted
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : 'bg-cyan-950 text-cyan-300 border-cyan-800'
              }`}
            >
              {alarmStatus.isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              <span>{alarmStatus.isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            <button
              onClick={() => audioAlarmManager.toggleVolumeBoost()}
              className={`py-1.5 px-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                alarmStatus.isMaxVolume
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Toggle Volume Boost"
            >
              {alarmStatus.isMaxVolume ? '🔊 Loud' : '🔈 Soft'}
            </button>

            <button
              onClick={() => audioAlarmManager.playTestBeep()}
              className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors"
            >
              Test
            </button>
          </div>
        </div>
      </div>

      {/* Critical Alerts Panel */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              Critical Faults ({criticalMachines.length})
            </h3>
          </div>
          {criticalMachines.length > 0 && (
            <span className="text-[10px] font-mono font-bold text-rose-400">
              TRIP ACTIVE
            </span>
          )}
        </div>

        {criticalMachines.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs rounded-xl bg-slate-950/40 border border-slate-800/50">
            <p className="font-medium text-slate-400">No critical alerts active</p>
            <p className="text-[11px] text-slate-600 mt-0.5">All machines operating within safety thresholds</p>
          </div>
        ) : (
          <div className="space-y-3">
            {criticalMachines.map((machine) => (
              <div
                key={machine.id}
                onClick={() => onSelectMachine(machine)}
                className="bg-rose-950/30 border border-rose-800/80 hover:border-rose-600 rounded-xl p-3.5 cursor-pointer transition-all hover:bg-rose-950/50 group shadow-md"
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-rose-300 text-xs group-hover:text-white transition-colors">
                    {machine.name}
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-rose-300">
                    ACTION REQUIRED
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                  {machine.xaiExplanation.summary}
                </p>
                <div className="mt-2.5 flex items-center justify-between text-[10px] text-rose-400 font-mono pt-2 border-t border-rose-900/50">
                  <span>Root Cause: {machine.xaiExplanation.primaryCause.slice(0, 32)}...</span>
                  <ChevronRight className="h-3.5 w-3.5 text-rose-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Advisory Warnings Panel */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              Advisories ({advisoryMachines.length})
            </h3>
          </div>
        </div>

        {advisoryMachines.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs rounded-xl bg-slate-950/40 border border-slate-800/50">
            <p className="font-medium text-slate-400">No warnings active</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Telemetry metrics are nominal</p>
          </div>
        ) : (
          <div className="space-y-3">
            {advisoryMachines.map((machine) => (
              <div
                key={machine.id}
                onClick={() => onSelectMachine(machine)}
                className="bg-amber-950/20 border border-amber-900/60 hover:border-amber-700 rounded-xl p-3.5 cursor-pointer transition-all hover:bg-amber-950/40 group"
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-amber-300 text-xs group-hover:text-white transition-colors">
                    {machine.name}
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-amber-400">
                    ADVISORY
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-2 line-clamp-2">
                  {machine.xaiExplanation.summary}
                </p>
                <div className="mt-2 flex items-center justify-end text-[10px] text-amber-400 font-mono">
                  <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Fault Testing Toolbox */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
        <h3 className="font-bold text-slate-100 text-sm mb-1.5 flex items-center gap-2">
          <Zap className="h-4 w-4 text-cyan-400" />
          <span>Direct Machine Anomaly Testing</span>
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Inject fault conditions to test the automatic <strong className="text-rose-400">Action Required Beep Alarm</strong>.
        </p>

        <div className="space-y-2">
          {machines.map((machine) => (
            <div key={machine.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-200">{machine.name}</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {machine.healthState}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => simulationManager.triggerMachineFaultTest(machine.id)}
                  className="py-1 px-1.5 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[10px] font-bold transition-all"
                >
                  Fault Trip
                </button>
                <button
                  onClick={() => simulationManager.forceMachineMaintenance(machine.id)}
                  className="py-1 px-1.5 rounded bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 text-[10px] font-bold transition-all"
                >
                  Maint
                </button>
                <button
                  onClick={() => simulationManager.resetMachineSensors(machine.id)}
                  className="py-1 px-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold transition-all"
                >
                  Reset
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </aside>
  );
};
