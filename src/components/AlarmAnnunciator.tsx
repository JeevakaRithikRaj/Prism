import React, { useState, useEffect, useRef } from 'react';
import { MachineState, AlarmEvent } from '../types';
import { audioAlarmManager, AlarmSoundMode, AudioAlarmStatus } from '../utils/AudioAlarmManager';
import { BellRing, Volume2, VolumeX, CheckCircle, ShieldAlert, AlertTriangle, Upload, Music, RefreshCw, Zap } from 'lucide-react';
import { simulationManager } from '../managers/SimulationManager';

interface AlarmAnnunciatorProps {
  machines: MachineState[];
  onSelectMachine?: (machine: MachineState) => void;
}

export const AlarmAnnunciator: React.FC<AlarmAnnunciatorProps> = ({ machines, onSelectMachine }) => {
  const [alarmStatus, setAlarmStatus] = useState<AudioAlarmStatus>(audioAlarmManager.getStatus());
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = audioAlarmManager.subscribe((status) => {
      setAlarmStatus(status);
    });
    return () => unsub();
  }, []);

  const criticalMachines = machines.filter(m => m.healthState === 'Action Required');
  const advisoryMachines = machines.filter(m => m.healthState === 'Advisory');

  // Handle custom audio file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadMessage(`Loading ${file.name}...`);
      const msg = await audioAlarmManager.loadCustomAudioFile(file);
      setUploadMessage(msg);
      setTimeout(() => setUploadMessage(null), 4000);
    } catch (err) {
      setUploadMessage('Failed to decode audio file. Please try standard MP3/WAV.');
      setTimeout(() => setUploadMessage(null), 5000);
    }
  };

  // Annunciator window tile definitions
  const annunciatorTiles = [
    {
      id: 'tile-spindle-vib',
      label: 'BEARING VIBRATION HIGH TRIP',
      isTripped: machines.some(m => m.currentReadings.vibration >= 100),
      isWarning: machines.some(m => m.currentReadings.vibration >= 90 && m.currentReadings.vibration < 100),
      machine: machines.find(m => m.currentReadings.vibration >= 90),
    },
    {
      id: 'tile-thermal',
      label: 'SPINDLE THERMAL RUNAWAY',
      isTripped: machines.some(m => m.currentReadings.temperature >= 310),
      isWarning: machines.some(m => m.currentReadings.temperature >= 306 && m.currentReadings.temperature < 310),
      machine: machines.find(m => m.currentReadings.temperature >= 306),
    },
    {
      id: 'tile-estop',
      label: 'SAFETY INTERLOCK / E-STOP',
      isTripped: criticalMachines.length > 0,
      isWarning: false,
      machine: criticalMachines[0],
    },
    {
      id: 'tile-torque',
      label: 'DRIVE TORQUE OVERLOAD',
      isTripped: machines.some(m => m.currentReadings.torque >= 50),
      isWarning: machines.some(m => m.currentReadings.torque >= 45 && m.currentReadings.torque < 50),
      machine: machines.find(m => m.currentReadings.torque >= 45),
    },
    {
      id: 'tile-speed',
      label: 'SPINDLE SPEED DEVIATION',
      isTripped: machines.some(m => m.currentReadings.rotational_speed >= 2000),
      isWarning: machines.some(m => m.currentReadings.rotational_speed >= 1800 && m.currentReadings.rotational_speed < 2000),
      machine: machines.find(m => m.currentReadings.rotational_speed >= 1800),
    },
    {
      id: 'tile-wear',
      label: 'CARBIDE TOOL WEAR LIMIT',
      isTripped: machines.some(m => m.currentReadings.tool_wear >= 200),
      isWarning: machines.some(m => m.currentReadings.tool_wear >= 180 && m.currentReadings.tool_wear < 200),
      machine: machines.find(m => m.currentReadings.tool_wear >= 180),
    },
    {
      id: 'tile-coolant',
      label: 'COOLANT CHILLER FAILURE',
      isTripped: machines.find(m => m.id === 'industrial-cooling-pump')?.healthState === 'Action Required',
      isWarning: machines.find(m => m.id === 'industrial-cooling-pump')?.healthState === 'Advisory',
      machine: machines.find(m => m.id === 'industrial-cooling-pump'),
    },
    {
      id: 'tile-pneumatic',
      label: 'PNEUMATIC LINE PRESSURE DROP',
      isTripped: machines.find(m => m.id === 'air-compressor-unit')?.healthState === 'Action Required',
      isWarning: machines.find(m => m.id === 'air-compressor-unit')?.healthState === 'Advisory',
      machine: machines.find(m => m.id === 'air-compressor-unit'),
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Industrial Acoustic Horn & Annunciator Control Console */}
      <div className={`rounded-2xl border p-5 shadow-2xl transition-all ${
        alarmStatus.isAlarming && !alarmStatus.isMuted && !alarmStatus.isAcknowledged
          ? 'bg-rose-950/80 border-rose-600 shadow-[0_0_30px_rgba(244,63,94,0.35)] animate-pulse'
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <BellRing className={`h-5 w-5 ${
                alarmStatus.isAlarming ? 'text-rose-400 animate-bounce' : 'text-cyan-400'
              }`} />
              <h2 className="text-base font-bold text-slate-100 tracking-wide uppercase">
                ISA-18.2 Industrial Alarm Annunciator & Acoustic Manager
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time multi-pattern audio synthesizer with instant Silence / Acknowledgment (ACK)
            </p>
          </div>

          {/* Alarm Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              alarmStatus.isAlarming && !alarmStatus.isAcknowledged
                ? 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse'
                : alarmStatus.isAlarming && alarmStatus.isAcknowledged
                ? 'bg-amber-950 text-amber-300 border-amber-700'
                : 'bg-emerald-950 text-emerald-300 border-emerald-700'
            }`}>
              {alarmStatus.isAlarming && !alarmStatus.isAcknowledged
                ? '🚨 ACOUSTIC ALARM ACTIVE'
                : alarmStatus.isAlarming && alarmStatus.isAcknowledged
                ? '⚠️ FAULT ACTIVE (HORN ACKNOWLEDGED)'
                : '✓ SYSTEM NOMINAL'}
            </span>
          </div>
        </div>

        {/* Acoustic Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4">
          
          {/* Sound Pattern Selector */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs text-slate-400 font-mono font-bold block">
              Acoustic Alarm Pattern (Web Audio Synthesizer):
            </label>
            <select
              value={alarmStatus.soundMode}
              onChange={(e) => audioAlarmManager.setSoundMode(e.target.value as AlarmSoundMode)}
              className="w-full bg-slate-950 text-slate-100 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="intermittent">⚡ Intermittent Beep (Short high-pitch pulses: 2600Hz / 3100Hz)</option>
              <option value="siren">🚨 Escalating Siren (Emergency wail: 500Hz → 1450Hz)</option>
              <option value="buzz">🔊 Continuous Electrical Buzz (Harsh 120Hz/240Hz + 60Hz LFO)</option>
              <option value="chime">🔔 Dual Warning Chime (Advisory caution: 880Hz / 1200Hz)</option>
              <option value="horn">🎺 Industrial Klaxon Horn (High-decibel pulse: 440Hz / 587Hz)</option>
              {alarmStatus.customAudioName && (
                <option value="custom">📁 Custom Audio: {alarmStatus.customAudioName}</option>
              )}
            </select>
          </div>

          {/* Sound Action Buttons */}
          <div className="md:col-span-7 flex flex-wrap items-end gap-2">
            
            {/* Acknowledge (ACK) Button */}
            <button
              onClick={() => audioAlarmManager.acknowledgeAlarm()}
              disabled={!alarmStatus.isAlarming || alarmStatus.isAcknowledged}
              className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 transition-all ${
                alarmStatus.isAlarming && !alarmStatus.isAcknowledged
                  ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-950/50 animate-bounce'
                  : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
              }`}
              title="Acknowledge and silence acoustic horn"
            >
              <CheckCircle className="h-4 w-4" />
              <span>ACK Alarm (Silence)</span>
            </button>

            {/* Mute Toggle */}
            <button
              onClick={() => audioAlarmManager.toggleMute()}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                alarmStatus.isMuted
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : 'bg-cyan-950/90 text-cyan-300 border-cyan-800 hover:bg-cyan-900'
              }`}
            >
              {alarmStatus.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              <span>{alarmStatus.isMuted ? 'Muted' : 'Unmuted'}</span>
            </button>

            {/* Loudness Toggle */}
            <button
              onClick={() => audioAlarmManager.toggleVolumeBoost()}
              className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold border transition-all ${
                alarmStatus.isMaxVolume
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Toggle Web Audio Compressor Boost"
            >
              {alarmStatus.isMaxVolume ? '🔊 Boost Loud' : '🔈 Soft'}
            </button>

            {/* Play Test */}
            <button
              onClick={() => audioAlarmManager.playTestBeep()}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors"
            >
              Test Sound
            </button>

            {/* Custom Audio Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Upload your own custom MP3 / WAV alarm sound"
            >
              <Upload className="h-3.5 w-3.5 text-cyan-400" />
              <span>Load Audio</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*"
              className="hidden"
            />

          </div>

        </div>

        {uploadMessage && (
          <div className="mt-3 text-xs font-mono text-cyan-300 bg-cyan-950/60 p-2 rounded-lg border border-cyan-800">
            {uploadMessage}
          </div>
        )}

      </div>

      {/* Industrial Visual Annunciator Window Board (16-Window Tile Matrix) */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Hardwired Annunciator Tile Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visual backlight alarm tiles indicating safety loops and threshold trips
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => simulationManager.setGlobalScenario('Normal')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Clear All Trips</span>
            </button>
          </div>
        </div>

        {/* 8-Window Heavy Industrial Backlit Annunciator Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {annunciatorTiles.map((tile) => {
            const isTripped = tile.isTripped;
            const isWarning = tile.isWarning;

            let tileStyle = 'bg-slate-950 border-slate-800 text-slate-500';
            let dotStyle = 'bg-slate-800';

            if (isTripped) {
              tileStyle = alarmStatus.isAcknowledged
                ? 'bg-rose-950/70 border-rose-600 text-rose-200'
                : 'bg-rose-950 border-rose-500 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse';
              dotStyle = 'bg-rose-500 animate-ping';
            } else if (isWarning) {
              tileStyle = 'bg-amber-950/60 border-amber-600 text-amber-200';
              dotStyle = 'bg-amber-400';
            }

            return (
              <div
                key={tile.id}
                onClick={() => tile.machine && onSelectMachine?.(tile.machine)}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between min-h-[90px] cursor-pointer hover:border-slate-500 ${tileStyle}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${dotStyle}`} />
                  <span className="text-[10px] font-mono font-bold opacity-80">
                    {isTripped ? (alarmStatus.isAcknowledged ? 'ACK' : 'TRIP') : isWarning ? 'WARN' : 'NORM'}
                  </span>
                </div>
                <h4 className="text-xs font-bold font-mono tracking-tight leading-tight">
                  {tile.label}
                </h4>
                {tile.machine && (
                  <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                    {tile.machine.name}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Alarm Event Log */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide mb-3">
          Active Plant Alarm Events Log
        </h3>

        {criticalMachines.length === 0 && advisoryMachines.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs font-mono bg-slate-950/50 rounded-xl border border-slate-800/60">
            <CheckCircle className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
            <p className="text-slate-300 font-bold">No active alarms or trips in buffer</p>
            <p className="text-[11px] text-slate-500 mt-0.5">All 4 machines transmitting nominal telemetry signals</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Machine</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Root Cause Diagnosis</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {criticalMachines.map((m) => (
                  <tr key={m.id} className="bg-rose-950/20 hover:bg-rose-950/40 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400">{m.lastUpdated}</td>
                    <td className="py-2.5 px-3 font-bold text-rose-300">{m.name}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-200 border border-rose-700 animate-pulse">
                        CRITICAL TRIP
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 max-w-xs truncate">{m.xaiExplanation.primaryCause}</td>
                    <td className="py-2.5 px-3">
                      <span className={alarmStatus.isAcknowledged ? 'text-amber-400' : 'text-rose-400 font-bold'}>
                        {alarmStatus.isAcknowledged ? 'Acknowledged' : 'Unacknowledged'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onSelectMachine?.(m)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}

                {advisoryMachines.map((m) => (
                  <tr key={m.id} className="bg-amber-950/10 hover:bg-amber-950/30 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400">{m.lastUpdated}</td>
                    <td className="py-2.5 px-3 font-bold text-amber-300">{m.name}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-200 border border-amber-800">
                        ADVISORY
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 max-w-xs truncate">{m.xaiExplanation.primaryCause}</td>
                    <td className="py-2.5 px-3 text-slate-400">Monitoring</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onSelectMachine?.(m)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
