import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import { MachineState } from '../types';
import { SENSOR_DEFAULTS } from '../data/MachineRegistry';

interface SensorTrendsProps {
  machine: MachineState;
}

const SENSOR_METADATA: Record<string, { key: string; name: string; unit: string; color: string; threshold: number }> = {
  temperature: { key: 'temperature', name: 'Temperature', unit: 'K', color: '#f97316', threshold: 310 },
  air_temperature: { key: 'air_temperature', name: 'Air Temp', unit: 'K', color: '#38bdf8', threshold: 308 },
  vibration: { key: 'vibration', name: 'Vibration', unit: 'μm', color: '#c084fc', threshold: 100 },
  torque: { key: 'torque', name: 'Torque', unit: 'Nm', color: '#facc15', threshold: 50 },
  rotational_speed: { key: 'rotational_speed', name: 'Rotational Speed', unit: 'rpm', color: '#34d399', threshold: 2000 },
  tool_wear: { key: 'tool_wear', name: 'Tool Wear', unit: 'min', color: '#f472b6', threshold: 200 },
};

export const SensorTrends: React.FC<SensorTrendsProps> = ({ machine }) => {
  const [selectedSensorKey, setSelectedSensorKey] = useState<string>('temperature');

  const timestamps = machine.timestamps || [];
  const activeMeta = SENSOR_METADATA[selectedSensorKey] || SENSOR_METADATA.temperature;
  const currentBuffer = machine.trendBuffers[selectedSensorKey] || [];

  const chartData = timestamps.map((ts, idx) => ({
    time: ts,
    value: currentBuffer[idx] ?? SENSOR_DEFAULTS[selectedSensorKey as keyof typeof SENSOR_DEFAULTS]?.baseMean ?? 0,
    threshold: activeMeta.threshold,
  }));

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl">
      
      {/* Header & Sensor Selector Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <span>Live Telemetry Sensor Trends</span>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
              50-Point Rolling Buffer
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time continuous signal analysis with high-precision threshold monitoring
          </p>
        </div>

        {/* Sensor selector tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {Object.entries(SENSOR_METADATA).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setSelectedSensorKey(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedSensorKey === key
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {meta.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Selected Sensor Line Chart */}
      <div className="h-64 w-full bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 mb-5 relative shadow-inner">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc', fontSize: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
              itemStyle={{ color: activeMeta.color }}
            />
            <ReferenceLine
              y={activeMeta.threshold}
              label={{ value: `Max Safety Limit (${activeMeta.threshold} ${activeMeta.unit})`, fill: '#ef4444', fontSize: 10, position: 'top' }}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="value"
              name={`${activeMeta.name} (${activeMeta.unit})`}
              stroke={activeMeta.color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, fill: activeMeta.color, stroke: '#ffffff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Mini Multi-Sensor Grid (Summary Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {Object.entries(SENSOR_METADATA).map(([key, meta]) => {
          const val = machine.currentReadings[key] ?? 0;
          const isSelected = selectedSensorKey === key;
          const isExceeded = val >= meta.threshold;

          return (
            <div
              key={key}
              onClick={() => setSelectedSensorKey(key)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-800/90 border-cyan-500/80 shadow-lg ring-1 ring-cyan-500/40'
                  : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                <span>{meta.name}</span>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
              </div>
              <p className={`text-base font-mono font-black mt-1 ${isExceeded ? 'text-rose-400 animate-pulse' : 'text-slate-100'}`}>
                {val} <span className="text-[10px] text-slate-500 font-normal">{meta.unit}</span>
              </p>
              <div className="mt-2 w-full bg-slate-800/90 rounded-full h-1.5 overflow-hidden border border-slate-700/50">
                <div
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (val / meta.threshold) * 100)}%`,
                    backgroundColor: isExceeded ? '#ef4444' : meta.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
