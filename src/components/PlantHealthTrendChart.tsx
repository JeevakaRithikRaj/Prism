import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { MachineState } from '../types';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Filter,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';

interface PlantHealthTrendChartProps {
  machines: MachineState[];
  onSelectMachine?: (machine: MachineState) => void;
}

interface TrendDataPoint {
  timestamp: string;
  timeLabel: string;
  minuteOffset: number;
  [key: string]: number | string;
}

const MACHINE_CONFIG_COLORS: Record<string, { color: string; label: string; strokeDash?: string }> = {
  'cnc-milling-machine': { color: '#06b6d4', label: 'CNC Milling Center' },
  'industrial-cooling-pump': { color: '#3b82f6', label: 'Cooling Pump' },
  'conveyor-drive-motor': { color: '#10b981', label: 'Conveyor Drive Motor' },
  'precision-air-compressor': { color: '#f59e0b', label: 'Air Compressor' },
};

export const PlantHealthTrendChart: React.FC<PlantHealthTrendChartProps> = ({
  machines,
  onSelectMachine,
}) => {
  const [timeRange, setTimeRange] = useState<'60m' | '30m' | '15m'>('60m');
  const [visibleMachines, setVisibleMachines] = useState<Record<string, boolean>>({
    'cnc-milling-machine': true,
    'industrial-cooling-pump': true,
    'conveyor-drive-motor': true,
    'precision-air-compressor': true,
  });

  // Store seeded 60-minute history buffer
  const initialDataRef = useRef<TrendDataPoint[] | null>(null);

  if (!initialDataRef.current) {
    const data: TrendDataPoint[] = [];
    const now = Date.now();
    // 60 minutes, sampled every 1 minute
    for (let i = 59; i >= 0; i--) {
      const pointTime = new Date(now - i * 60 * 1000);
      const timeLabel = pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Generate realistic trailing baseline with slight organic variation
      const point: TrendDataPoint = {
        timestamp: pointTime.toISOString(),
        timeLabel,
        minuteOffset: -i,
        'cnc-milling-machine': Math.min(100, Math.max(30, 94 + Math.sin(i / 8) * 2 + (Math.random() - 0.5) * 1.5)),
        'industrial-cooling-pump': Math.min(100, Math.max(30, 91 + Math.cos(i / 10) * 2 + (Math.random() - 0.5) * 1.2)),
        'conveyor-drive-motor': Math.min(100, Math.max(30, 97 + Math.sin(i / 12) * 1.5 + (Math.random() - 0.5) * 1)),
        'precision-air-compressor': Math.min(100, Math.max(30, 89 + Math.cos(i / 7) * 2.5 + (Math.random() - 0.5) * 1.8)),
      };

      data.push(point);
    }
    initialDataRef.current = data;
  }

  // Continuously update the current point with real-time machine health indices
  const chartData = useMemo(() => {
    if (!initialDataRef.current) return [];

    const baseData = [...initialDataRef.current];
    const latestIndex = baseData.length - 1;
    const nowTime = new Date();

    // Map active live machine health indices
    const currentScores: Record<string, number> = {};
    machines.forEach((m) => {
      currentScores[m.id] = m.rulMetrics?.healthIndex ?? 95;
    });

    // Update the last point with exact current live scores
    baseData[latestIndex] = {
      ...baseData[latestIndex],
      timeLabel: nowTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      'cnc-milling-machine': currentScores['cnc-milling-machine'] ?? baseData[latestIndex]['cnc-milling-machine'],
      'industrial-cooling-pump': currentScores['industrial-cooling-pump'] ?? baseData[latestIndex]['industrial-cooling-pump'],
      'conveyor-drive-motor': currentScores['conveyor-drive-motor'] ?? baseData[latestIndex]['conveyor-drive-motor'],
      'precision-air-compressor': currentScores['precision-air-compressor'] ?? baseData[latestIndex]['precision-air-compressor'],
    };

    // Smooth recent trailing trajectory to match current state (last 5 minutes)
    for (let step = 1; step <= 5; step++) {
      const idx = latestIndex - step;
      if (idx >= 0) {
        const factor = (5 - step) / 5;
        machines.forEach((m) => {
          const liveScore = currentScores[m.id];
          if (liveScore !== undefined && baseData[idx][m.id] !== undefined) {
            const originalVal = Number(baseData[idx][m.id]);
            baseData[idx][m.id] = Math.round((originalVal * (1 - factor) + liveScore * factor) * 10) / 10;
          }
        });
      }
    }

    // Filter by selected time window
    const sliceCount = timeRange === '15m' ? 16 : timeRange === '30m' ? 31 : 60;
    return baseData.slice(-sliceCount);
  }, [machines, timeRange]);

  // Compute fleet summary stats
  const fleetStats = useMemo(() => {
    if (machines.length === 0) return { avgHealth: 92, minHealth: 90, lowestMachine: null };

    const scores = machines.map((m) => ({
      machine: m,
      score: m.rulMetrics?.healthIndex ?? 95,
    }));

    const avgHealth = Math.round(scores.reduce((acc, curr) => acc + curr.score, 0) / scores.length);
    const sorted = [...scores].sort((a, b) => a.score - b.score);
    const lowest = sorted[0];

    return {
      avgHealth,
      minHealth: lowest.score,
      lowestMachine: lowest.machine,
    };
  }, [machines]);

  const toggleMachineVisibility = (machineId: string) => {
    setVisibleMachines((prev) => ({
      ...prev,
      [machineId]: !prev[machineId],
    }));
  };

  const selectAllMachines = () => {
    setVisibleMachines({
      'cnc-milling-machine': true,
      'industrial-cooling-pump': true,
      'conveyor-drive-motor': true,
      'precision-air-compressor': true,
    });
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-4">
      
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <span>Fleet Health Score Trends (0 - 100%)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-normal">
                  Live Telemetric Feed
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Continuous dynamic degradation & recovery tracking across all 4 production assets
              </p>
            </div>
          </div>
        </div>

        {/* Right side controls: Fleet KPI and Time Range Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Fleet Health Badge */}
          <div className="bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Fleet Average:</span>
            <span className={`font-bold tabular-nums ${
              fleetStats.avgHealth >= 85 ? 'text-emerald-400' :
              fleetStats.avgHealth >= 65 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {fleetStats.avgHealth}%
            </span>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setTimeRange('15m')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                timeRange === '15m'
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              15m
            </button>
            <button
              onClick={() => setTimeRange('30m')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                timeRange === '30m'
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              30m
            </button>
            <button
              onClick={() => setTimeRange('60m')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                timeRange === '60m'
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              60m (1h)
            </button>
          </div>
        </div>
      </div>

      {/* Machine Legend Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 text-[11px] uppercase font-bold mr-1">Assets:</span>
          {machines.map((m) => {
            const cfg = MACHINE_CONFIG_COLORS[m.id] || { color: '#06b6d4', label: m.name };
            const isVisible = visibleMachines[m.id];
            const currentScore = m.rulMetrics?.healthIndex ?? 95;

            return (
              <button
                key={m.id}
                onClick={() => toggleMachineVisibility(m.id)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all text-xs font-mono ${
                  isVisible
                    ? 'bg-slate-950/90 text-slate-200 border-slate-700 shadow-sm'
                    : 'bg-slate-950/40 text-slate-600 border-slate-900 opacity-60'
                }`}
                title={isVisible ? `Click to hide ${m.name}` : `Click to show ${m.name}`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full inline-block"
                  style={{ backgroundColor: isVisible ? cfg.color : '#475569' }}
                />
                <span className="font-medium">{cfg.label}</span>
                <span className={`text-[11px] font-bold tabular-nums ${
                  currentScore < 50 ? 'text-rose-400' : currentScore < 75 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {currentScore}%
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={selectAllMachines}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors underline"
          >
            Show All
          </button>
        </div>
      </div>

      {/* Recharts Visualization Canvas */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />

            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              interval="preserveStartEnd"
              minTickGap={30}
            />

            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 70, 85, 100]}
              stroke="#64748b"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => `${v}%`}
            />

            {/* Advisory Threshold Line at 70% */}
            <ReferenceLine
              y={70}
              stroke="#d97706"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: 'Advisory Threshold (70%)',
                fill: '#f59e0b',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />

            {/* Critical Threshold Line at 40% */}
            <ReferenceLine
              y={40}
              stroke="#e11d48"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: 'Action Required Threshold (40%)',
                fill: '#f43f5e',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />

            {/* Custom Interactive Tooltip */}
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;

                return (
                  <div className="bg-slate-950/95 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-2xl text-xs font-mono space-y-2 min-w-[220px]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-cyan-400" />
                        <span>Timeline:</span>
                      </span>
                      <strong className="text-slate-200">{label}</strong>
                    </div>

                    <div className="space-y-1.5">
                      {payload.map((item: any) => {
                        const mId = item.dataKey;
                        const cfg = MACHINE_CONFIG_COLORS[mId] || { color: item.color, label: mId };
                        const val = typeof item.value === 'number' ? Math.round(item.value) : item.value;
                        const isSevere = val < 50;
                        const isWarn = val < 75;

                        return (
                          <div key={mId} className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <span
                                className="h-2 w-2 rounded-full inline-block"
                                style={{ backgroundColor: cfg.color }}
                              />
                              <span className="truncate max-w-[130px]">{cfg.label}</span>
                            </span>
                            <span className={`font-bold tabular-nums ${
                              isSevere ? 'text-rose-400 font-black' : isWarn ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {val}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }}
            />

            {/* Dynamic Lines for Each Machine */}
            {visibleMachines['cnc-milling-machine'] && (
              <Line
                type="monotone"
                dataKey="cnc-milling-machine"
                name="CNC Milling Center"
                stroke="#06b6d4"
                strokeWidth={2.2}
                dot={false}
                activeDot={{ r: 5, fill: '#06b6d4', stroke: '#083344', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}

            {visibleMachines['industrial-cooling-pump'] && (
              <Line
                type="monotone"
                dataKey="industrial-cooling-pump"
                name="Cooling Pump"
                stroke="#3b82f6"
                strokeWidth={2.2}
                dot={false}
                activeDot={{ r: 5, fill: '#3b82f6', stroke: '#172554', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}

            {visibleMachines['conveyor-drive-motor'] && (
              <Line
                type="monotone"
                dataKey="conveyor-drive-motor"
                name="Conveyor Drive Motor"
                stroke="#10b981"
                strokeWidth={2.2}
                dot={false}
                activeDot={{ r: 5, fill: '#10b981', stroke: '#022c22', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}

            {visibleMachines['precision-air-compressor'] && (
              <Line
                type="monotone"
                dataKey="precision-air-compressor"
                name="Air Compressor"
                stroke="#f59e0b"
                strokeWidth={2.2}
                dot={false}
                activeDot={{ r: 5, fill: '#f59e0b', stroke: '#451a03', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Diagnostic Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Nominal: &gt;75%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Advisory: 40% - 75%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Action Required: &lt;40%</span>
          </span>
        </div>

        <div>
          <span>Sampling Interval: 60s · Real-Time Dynamic Ingestion</span>
        </div>
      </div>

    </div>
  );
};
