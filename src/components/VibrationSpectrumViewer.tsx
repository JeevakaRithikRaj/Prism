import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid, Cell } from 'recharts';
import { MachineState } from '../types';
import { Activity, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface VibrationSpectrumViewerProps {
  machine: MachineState;
}

export const VibrationSpectrumViewer: React.FC<VibrationSpectrumViewerProps> = ({ machine }) => {
  const { vibrationSpectrum } = machine;
  const isCritical = machine.healthState === 'Action Required';

  const chartData = vibrationSpectrum.points.map((pt) => ({
    freq: `${pt.hz}Hz`,
    hz: pt.hz,
    amplitude: pt.amplitude,
    label: pt.label,
    isDefect: pt.isDefectFreq,
    isHarmonic: pt.isHarmonic,
  }));

  // ISO Zone styles
  const isoZoneConfig = {
    A: { color: 'text-emerald-400', bg: 'bg-emerald-950/80', border: 'border-emerald-700/80', label: 'Zone A - Good' },
    B: { color: 'text-cyan-400', bg: 'bg-cyan-950/80', border: 'border-cyan-700/80', label: 'Zone B - Acceptable' },
    C: { color: 'text-amber-400', bg: 'bg-amber-950/80', border: 'border-amber-700/80', label: 'Zone C - Unsatisfactory' },
    D: { color: 'text-rose-400', bg: 'bg-rose-950/90', border: 'border-rose-600', label: 'Zone D - Unacceptable / Trip' },
  }[vibrationSpectrum.isoZone];

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-5">
      
      {/* Header & ISO 10816 Compliance Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Vibration FFT Spectral Analyzer (ISO 10816-3 Condition Monitoring)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time mechanical bearing harmonic decomposition & fault frequency identification
          </p>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${isoZoneConfig.bg} ${isoZoneConfig.border} ${isoZoneConfig.color} text-xs font-mono font-bold shadow-md`}>
          {vibrationSpectrum.isoZone === 'D' ? (
            <ShieldAlert className="h-4 w-4 animate-bounce text-rose-400" />
          ) : vibrationSpectrum.isoZone === 'C' ? (
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          )}
          <span>{isoZoneConfig.label}</span>
        </div>
      </div>

      {/* ISO 10816 Severity Zones Scale Bar */}
      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2">
        <div className="flex justify-between text-xs text-slate-400 font-mono">
          <span>Vibration Velocity RMS: <strong className={`text-base font-bold ${vibrationSpectrum.velocityRms > 7.1 ? 'text-rose-400' : vibrationSpectrum.velocityRms > 4.5 ? 'text-amber-400' : 'text-slate-100'}`}>{vibrationSpectrum.velocityRms} mm/s</strong></span>
          <span>Peak Accel: <strong className="text-slate-100">{vibrationSpectrum.accelerationPeak} g</strong></span>
          <span>Crest Factor: <strong className="text-slate-100">{vibrationSpectrum.crestFactor}</strong></span>
        </div>

        {/* Multi-segment Severity Bar */}
        <div className="relative pt-1 pb-4">
          <div className="h-3 w-full rounded-full flex overflow-hidden border border-slate-700/80">
            <div className="w-[28%] bg-emerald-500/80" title="Zone A: 0 - 2.8 mm/s (Good)" />
            <div className="w-[17%] bg-cyan-500/80" title="Zone B: 2.8 - 4.5 mm/s (Acceptable)" />
            <div className="w-[26%] bg-amber-500/80" title="Zone C: 4.5 - 7.1 mm/s (Unsatisfactory)" />
            <div className="w-[29%] bg-rose-500/90" title="Zone D: > 7.1 mm/s (Unacceptable / Action Required)" />
          </div>

          {/* Current Needle Position Indicator */}
          <div
            className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center transition-all duration-300"
            style={{ left: `${Math.min(98, Math.max(2, (vibrationSpectrum.velocityRms / 10) * 100))}%` }}
          >
            <div className="w-1.5 h-5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            <span className="text-[10px] font-mono font-bold text-white bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 mt-1 shadow-md whitespace-nowrap">
              {vibrationSpectrum.velocityRms} mm/s
            </span>
          </div>
        </div>

        <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
          <span>0.0 mm/s (Zone A)</span>
          <span>2.8 mm/s (Zone B)</span>
          <span>4.5 mm/s (Zone C)</span>
          <span>7.1 mm/s (Zone D Trip)</span>
          <span>10.0+ mm/s</span>
        </div>
      </div>

      {/* Main FFT Frequency Spectrum Bar Chart */}
      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-mono text-slate-300 font-semibold">
            FFT Amplitude Spectrum (0 Hz – 350 Hz)
          </span>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-cyan-400" /> 1X/2X/3X Harmonics
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Bearing Faults (BPFO/BPFI/BSF)
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="freq" stroke="#64748b" tick={{ fontSize: 9 }} interval={4} />
              <YAxis stroke="#64748b" tick={{ fontSize: 9 }} domain={[0, 8]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                  color: '#f8fafc',
                }}
                formatter={(val: number) => [`${val} mm/s RMS`, 'Amplitude']}
                labelFormatter={(label) => `Frequency: ${label}`}
              />
              <ReferenceLine y={4.5} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Warning (4.5 mm/s)', fill: '#f59e0b', fontSize: 10, position: 'top' }} />
              <ReferenceLine y={7.1} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Trip (7.1 mm/s)', fill: '#ef4444', fontSize: 10, position: 'top' }} />
              <Bar dataKey="amplitude" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, index) => {
                  let barColor = '#38bdf8'; // Default spectrum blue
                  if (entry.isDefect) {
                    barColor = entry.amplitude > 4.5 ? '#f43f5e' : '#f59e0b';
                  } else if (entry.isHarmonic) {
                    barColor = '#818cf8';
                  }
                  return <Cell key={`cell-${index}`} fill={barColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bearing Defect Diagnostic Table */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {vibrationSpectrum.defectFrequencies.map((defect) => (
          <div
            key={defect.name}
            className={`p-3 rounded-xl border ${
              defect.detected
                ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                : 'bg-slate-950/70 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="font-bold">{defect.name.split(' ')[0]}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                defect.detected ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse' : 'bg-slate-800 text-slate-400'
              }`}>
                {defect.detected ? 'DETECTED' : 'CLEAR'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Freq: <strong className="text-slate-100">{defect.hz} Hz</strong>
            </p>
          </div>
        ))}
      </div>

    </div>
  );
};
