import React, { useState, useEffect, useMemo } from 'react';
import {
  MachineState,
  MaintenanceEvent,
  MaintenancePriority,
  MaintenanceEventCategory,
  MaintenanceEventStatus
} from '../types';
import { maintenanceCalendarManager } from '../managers/MaintenanceCalendarManager';
import { toastManager } from '../managers/ToastManager';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  ShieldCheck,
  Wrench,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Sparkles,
  TrendingDown,
  Layers,
  Filter,
  Check,
  Trash2,
  X,
  FileText,
  CalendarCheck,
  Activity,
  Zap
} from 'lucide-react';

interface MaintenanceCalendarProps {
  machine: MachineState;
}

export const MaintenanceCalendar: React.FC<MaintenanceCalendarProps> = ({ machine }) => {
  const [events, setEvents] = useState<MaintenanceEvent[]>([]);
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<MaintenanceEvent | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // New Event Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<MaintenanceEventCategory>('Routine Preventative');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('09:00');
  const [formDuration, setFormDuration] = useState(45);
  const [formPriority, setFormPriority] = useState<MaintenancePriority>('Medium');
  const [formTechnician, setFormTechnician] = useState('');
  const [formSopCode, setFormSopCode] = useState('');
  const [formSubsystem, setFormSubsystem] = useState(machine.subsystems[0]?.name || '');
  const [formNotes, setFormNotes] = useState('');
  const [attachHealthTrend, setAttachHealthTrend] = useState(true);

  // Subscribe to calendar updates
  useEffect(() => {
    const updateEvents = () => {
      setEvents(maintenanceCalendarManager.getEventsForMachine(machine.id));
    };
    updateEvents();
    const unsubscribe = maintenanceCalendarManager.subscribe(updateEvents);
    return () => unsubscribe();
  }, [machine.id]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (filterCategory !== 'all' && evt.category !== filterCategory) return false;
      if (filterPriority !== 'all' && evt.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && evt.status !== filterStatus) return false;
      return true;
    });
  }, [events, filterCategory, filterPriority, filterStatus]);

  // Calendar Grid Calculations
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  // Open Schedule modal for specific date
  const handleOpenScheduleForDate = (dateStr: string) => {
    setFormDate(dateStr);
    setShowScheduleModal(true);
  };

  // Preset task titles based on machine
  const presetTasks = useMemo(() => {
    if (machine.id === 'cnc-milling-machine') {
      return [
        'Spindle Bearing Klüber Lubrication & Runout Check',
        'HSK-A63 Tool Magazine Drawbar Pull-Force Verification',
        'Axis Linear Ball-Screw Preload & Laser Backlash Compensation',
        'High-Pressure CTS Coolant Filtration & Chiller Flush',
        'Oil-Air Micro-Lubrication Manifold Purge'
      ];
    } else if (machine.id === 'industrial-cooling-pump') {
      return [
        'Suction Strainer Basket Ultrasonic Clean & Valve Trim',
        'Mechanical Seal Tandem Barrier Fluid Purge & Replenishment',
        'Multistage Impeller Dynamic Balancing & Cavitation Audit',
        'TEFC Induction Motor Stator Winding Insulation Resistance (Megger)',
        'Check Motor Coupling Alignment & Vibration Baseline'
      ];
    } else if (machine.id === 'conveyor-drive-motor') {
      return [
        'Dual V-Belt Sonic Tension Verification & Tachometer Sync',
        'VFD Danfoss Inverter Parameter Backup & Thermal Probe Audit',
        'Helical Planetary Reduction Gearbox Polyglycol Lubricant Change',
        'Spring-Applied Fail-Safe Holding Brake Pad Thickness Check',
        'Output Pinion Gear Tooth Backlash Measurement'
      ];
    } else {
      return [
        'Coalescing Oil Separator Element Replacement (ISO VG 46)',
        'Condensate Auto-Drain Electric Solenoid Purge Valve Cleaning',
        'Intake Air Filter Cartridge Differential Pressure Inspection',
        'Minimum Pressure Check Valve Seat Resurfacing',
        'Desiccant Air Dryer Dew Point Sensor Calibration'
      ];
    }
  }, [machine.id]);

  // Handle Form Submission
  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toastManager.warning('Missing Title', 'Please enter a maintenance task title.');
      return;
    }

    maintenanceCalendarManager.scheduleEvent({
      machineId: machine.id,
      machineName: machine.name,
      title: formTitle.trim(),
      description: formNotes.trim() || `Scheduled routine maintenance event for ${machine.name}.`,
      category: formCategory,
      date: formDate,
      time: formTime,
      estimatedDurationMinutes: Number(formDuration) || 45,
      assignedTechnician: formTechnician.trim() || 'Facility Maintenance Team',
      priority: formPriority,
      status: 'scheduled',
      sopCode: formSopCode.trim() || 'SOP-GEN-PM-001',
      targetSubsystem: formSubsystem,
      healthTrendTrigger: attachHealthTrend
        ? {
            metric: 'Health Index & RUL',
            triggerReason: `Derived from current ${machine.healthState} health state (RUL: ${machine.rulMetrics.estimatedHoursRemaining}h)`,
            currentValue: machine.rulMetrics.healthIndex,
            thresholdValue: 70,
            unit: '%'
          }
        : undefined
    });

    // Reset and close
    setFormTitle('');
    setFormNotes('');
    setFormTechnician('');
    setFormSopCode('');
    setShowScheduleModal(false);
  };

  // Auto-schedule directly from health trend
  const handleAutoScheduleFromTrend = () => {
    const scheduled = maintenanceCalendarManager.autoScheduleHealthTrendEvent(machine);
    setSelectedEvent(scheduled);
    // Navigate calendar month to view scheduled date
    const evtDate = new Date(scheduled.date);
    setCurrentMonth(new Date(evtDate.getFullYear(), evtDate.getMonth(), 1));
  };

  // Complete an event
  const handleCompleteEvent = (evt: MaintenanceEvent) => {
    maintenanceCalendarManager.completeEvent(evt.id);
    setSelectedEvent(null);
  };

  // Delete an event
  const handleDeleteEvent = (evt: MaintenanceEvent) => {
    maintenanceCalendarManager.deleteEvent(evt.id);
    setSelectedEvent(null);
  };

  // Priority color helpers
  const getPriorityBadge = (priority: MaintenancePriority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'High':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'Medium':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'Low':
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const getPriorityDot = (priority: MaintenancePriority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-500';
      case 'High':
        return 'bg-amber-500';
      case 'Medium':
        return 'bg-blue-400';
      case 'Low':
        return 'bg-slate-400';
    }
  };

  // Upcoming scheduled count
  const pendingCount = events.filter((e) => e.status === 'scheduled').length;
  const completedCount = events.filter((e) => e.status === 'completed').length;

  return (
    <div className="space-y-5 text-xs font-mono">
      
      {/* Health Trend-Based Maintenance Planning Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border border-cyan-800/60 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-cyan-950 border border-cyan-700 text-cyan-400">
                <Sparkles className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                Health Trend-Based Routine Maintenance Planning
              </h3>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              PRISM synchronizes upcoming scheduled calendar events with dynamic sensor drift, RUL degradation rates, and historical state transitions to prevent unexpected downtime before component fatigue sets in.
            </p>

            {/* Health Trend Key Metrics Strip */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
              <div className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400">Health Index:</span>{' '}
                <strong className={machine.rulMetrics.healthIndex < 70 ? 'text-rose-400' : 'text-emerald-400'}>
                  {machine.rulMetrics.healthIndex.toFixed(0)}%
                </strong>
              </div>

              <div className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400">Projected RUL:</span>{' '}
                <strong className="text-cyan-400">
                  {machine.rulMetrics.estimatedHoursRemaining} hrs
                </strong>
              </div>

              <div className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400">Degradation Velocity:</span>{' '}
                <strong className="text-amber-400">
                  {machine.rulMetrics.degradationRatePerHour.toFixed(2)}%/hr
                </strong>
              </div>

              <div className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400">Optimal Window:</span>{' '}
                <strong className="text-slate-200">
                  {machine.rulMetrics.recommendedInterventionDate || 'Planned Interval'}
                </strong>
              </div>
            </div>
          </div>

          {/* Action: 1-Click Auto-Schedule based on trend */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-start lg:self-center flex-shrink-0">
            <button
              onClick={handleAutoScheduleFromTrend}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
              title="Automatically calculate and schedule an upcoming maintenance event based on live health trends"
            >
              <Zap className="h-4 w-4 fill-current" />
              <span>Auto-Schedule via Health Trend</span>
            </button>

            <button
              onClick={() => {
                setFormDate(new Date().toISOString().split('T')[0]);
                setShowScheduleModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4 text-cyan-400" />
              <span>New Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Controls & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
        
        {/* Left: View Mode Toggle & Month Nav */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px]">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'month'
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Month Grid</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'agenda'
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              <span>Agenda List ({events.length})</span>
            </button>
          </div>

          {/* Month Navigation (in Month Mode) */}
          {viewMode === 'month' && (
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
              <button
                onClick={prevMonth}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-bold text-slate-200 px-2 min-w-[130px] text-center">
                {monthName}
              </span>
              <button
                onClick={nextMonth}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={goToToday}
                className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
              >
                Today
              </button>
            </div>
          )}
        </div>

        {/* Right: Filters & Stats */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Statuses ({events.length})</option>
            <option value="scheduled">Scheduled ({pendingCount})</option>
            <option value="completed">Completed ({completedCount})</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

      </div>

      {/* Main View: Month Calendar Grid */}
      {viewMode === 'month' && (
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 sm:p-4 shadow-md space-y-2">
          
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 text-[11px] pb-1 border-b border-slate-800/80">
            <div>SUN</div>
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div>SAT</div>
          </div>

          {/* 7-Column Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Blank offset cells for start of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="min-h-[85px] sm:min-h-[105px] p-1 bg-slate-950/30 rounded-lg border border-slate-900/60 opacity-20"
              />
            ))}

            {/* Days of the Current Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = filteredEvents.filter((e) => e.date === dateStr);
              const isToday =
                new Date().toISOString().split('T')[0] === dateStr;
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`group min-h-[85px] sm:min-h-[105px] p-1.5 rounded-lg border transition-all relative flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900/90 border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : isToday
                      ? 'bg-cyan-950/20 border-cyan-800/50'
                      : 'bg-slate-900/40 border-slate-800/70 hover:border-slate-700 hover:bg-slate-900/70'
                  }`}
                >
                  {/* Top Day Header: Date Number + Quick Add '+' icon on hover */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${
                        isToday
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                          : isSelected
                          ? 'text-cyan-300 font-extrabold'
                          : 'text-slate-400'
                      }`}
                    >
                      {dayNum}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenScheduleForDate(dateStr);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-opacity"
                      title={`Schedule event on ${dateStr}`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Events Container */}
                  <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((evt) => {
                      const isCompleted = evt.status === 'completed';
                      return (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] truncate border flex items-center gap-1 transition-transform hover:scale-[1.02] ${
                            isCompleted
                              ? 'bg-slate-900 text-slate-400 border-slate-800 line-through opacity-70'
                              : getPriorityBadge(evt.priority)
                          }`}
                          title={`${evt.title} (${evt.time})`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                              isCompleted ? 'bg-slate-500' : getPriorityDot(evt.priority)
                            }`}
                          />
                          <span className="truncate">{evt.title}</span>
                        </div>
                      );
                    })}

                    {dayEvents.length > 3 && (
                      <div className="text-[9px] text-cyan-400 font-bold px-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>

                  {/* Day Footer Marker for Auto-Suggested events */}
                  {dayEvents.some((e) => e.isAutoSuggested) && (
                    <div className="flex justify-end pt-0.5">
                      <Sparkles className="h-2.5 w-2.5 text-cyan-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Agenda / Chronological List View */}
      {viewMode === 'agenda' && (
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400">
              <CalendarCheck className="h-8 w-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-bold">No maintenance events found</p>
              <p className="text-xs text-slate-500 mt-1">
                Try clearing active filters or click &ldquo;New Event&rdquo; to schedule maintenance.
              </p>
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const isCompleted = evt.status === 'completed';
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isCompleted
                      ? 'bg-slate-950/50 border-slate-850 opacity-70'
                      : evt.priority === 'Critical'
                      ? 'bg-rose-950/20 border-rose-800 hover:border-rose-700'
                      : evt.priority === 'High'
                      ? 'bg-amber-950/20 border-amber-800 hover:border-amber-700'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getPriorityBadge(
                          evt.priority
                        )}`}
                      >
                        {evt.priority}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {evt.category}
                      </span>
                      {evt.sopCode && (
                        <span className="text-[10px] text-cyan-400 font-mono">
                          {evt.sopCode}
                        </span>
                      )}
                      {evt.isAutoSuggested && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1 font-bold">
                          <Sparkles className="h-2.5 w-2.5" />
                          Health Trend Auto-Planned
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm font-bold font-mono ${
                        isCompleted ? 'text-slate-400 line-through' : 'text-slate-100'
                      }`}
                    >
                      {evt.title}
                    </h4>

                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {evt.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3 text-cyan-400" />
                        <strong className="text-slate-200">{evt.date}</strong> at {evt.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-400" />
                        {evt.estimatedDurationMinutes} mins
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-blue-400" />
                        {evt.assignedTechnician}
                      </span>
                      {evt.targetSubsystem && (
                        <span>
                          Target: <strong className="text-slate-300">{evt.targetSubsystem}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                    {!isCompleted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompleteEvent(evt);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-bold transition-colors flex items-center gap-1"
                        title="Mark event as verified & completed"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Complete</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(evt);
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-800 transition-colors"
                      title="Cancel event"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Event Details Inspection Drawer / Modal */}
      {selectedEvent && (
        <div className="p-4 bg-slate-950 rounded-xl border border-cyan-800 shadow-2xl space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded border uppercase ${getPriorityBadge(
                  selectedEvent.priority
                )}`}
              >
                {selectedEvent.priority}
              </span>
              <h4 className="text-sm font-bold text-white">
                {selectedEvent.title}
              </h4>
            </div>

            <button
              onClick={() => setSelectedEvent(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Description & Procedures */}
            <div className="md:col-span-2 space-y-2">
              <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {selectedEvent.description}
              </p>

              {/* Health Trend Trigger Details if present */}
              {selectedEvent.healthTrendTrigger && (
                <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800 text-[11px] space-y-1">
                  <span className="text-cyan-300 font-bold flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Health Trend Trigger Diagnostic:
                  </span>
                  <p className="text-slate-300">
                    {selectedEvent.healthTrendTrigger.triggerReason}
                  </p>
                  <div className="text-slate-400 text-[10px]">
                    Metric: <strong>{selectedEvent.healthTrendTrigger.metric}</strong> (Reading:{' '}
                    {selectedEvent.healthTrendTrigger.currentValue}{' '}
                    {selectedEvent.healthTrendTrigger.unit})
                  </div>
                </div>
              )}
            </div>

            {/* Event Metadata Cards */}
            <div className="space-y-1.5 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px]">SCHEDULED DATE & TIME:</span>
                <strong className="text-slate-200">
                  {selectedEvent.date} at {selectedEvent.time}
                </strong>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">ESTIMATED DOWNTIME:</span>
                <strong className="text-amber-400">
                  {selectedEvent.estimatedDurationMinutes} minutes
                </strong>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">ASSIGNED TECHNICIAN:</span>
                <strong className="text-slate-200">
                  {selectedEvent.assignedTechnician}
                </strong>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">TARGET SUBSYSTEM:</span>
                <strong className="text-cyan-300">
                  {selectedEvent.targetSubsystem || 'General Assembly'}
                </strong>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">SOP REFERENCE:</span>
                <strong className="text-slate-300">{selectedEvent.sopCode || 'N/A'}</strong>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Status:{' '}
              <strong
                className={
                  selectedEvent.status === 'completed'
                    ? 'text-emerald-400'
                    : 'text-cyan-400 uppercase'
                }
              >
                {selectedEvent.status}
              </strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDeleteEvent(selectedEvent)}
                className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Cancel Event</span>
              </button>

              {selectedEvent.status !== 'completed' && (
                <button
                  onClick={() => handleCompleteEvent(selectedEvent)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>Mark Completed & Log</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Event Scheduling Form Modal */}
      {showScheduleModal && (
        <div className="p-4 sm:p-5 bg-slate-950 rounded-xl border border-cyan-800/90 shadow-2xl space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-cyan-400" />
              <h4 className="text-xs font-mono font-bold text-white uppercase">
                Schedule Routine or Trend-Based Maintenance for {machine.name}
              </h4>
            </div>
            <button
              onClick={() => setShowScheduleModal(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleScheduleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Title / Preset Selector */}
            <div className="md:col-span-2">
              <label className="text-slate-400 block mb-1">
                Maintenance Task Title *
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Spindle Bearing Klüber Lubrication & Runout Check"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1 text-[10px]">
                  <span className="text-slate-500">Presets:</span>
                  {presetTasks.slice(0, 3).map((task) => (
                    <button
                      type="button"
                      key={task}
                      onClick={() => setFormTitle(task)}
                      className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-slate-700 truncate max-w-[200px]"
                    >
                      {task}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-slate-400 block mb-1">Maintenance Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as MaintenanceEventCategory)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="Routine Preventative">Routine Preventative</option>
                <option value="Predictive Condition-Based">Predictive Condition-Based</option>
                <option value="Sensor Calibration">Sensor Calibration</option>
                <option value="Component Overhaul">Component Overhaul</option>
                <option value="Inspection & Audit">Inspection & Audit</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-slate-400 block mb-1">Priority Level</label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as MaintenancePriority)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="Low">Low (Routine)</option>
                <option value="Medium">Medium (Preventative)</option>
                <option value="High">High (Advisory Drift)</option>
                <option value="Critical">Critical (Action Required)</option>
              </select>
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="text-slate-400 block mb-1">Scheduled Date *</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Scheduled Time & Duration */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Time *</label>
                <input
                  type="time"
                  required
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Est. Mins</label>
                <input
                  type="number"
                  min="10"
                  max="480"
                  step="5"
                  value={formDuration}
                  onChange={(e) => setFormDuration(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Target Subsystem */}
            <div>
              <label className="text-slate-400 block mb-1">Target Component / Subsystem</label>
              <select
                value={formSubsystem}
                onChange={(e) => setFormSubsystem(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {machine.subsystems.map((sub) => (
                  <option key={sub.id} value={sub.name}>
                    {sub.name} ({sub.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned Tech */}
            <div>
              <label className="text-slate-400 block mb-1">Lead Assigned Technician</label>
              <input
                type="text"
                value={formTechnician}
                onChange={(e) => setFormTechnician(e.target.value)}
                placeholder="e.g. Lead Tech Kowalski (#402)"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* SOP Code */}
            <div>
              <label className="text-slate-400 block mb-1">SOP Checklist Code</label>
              <input
                type="text"
                value={formSopCode}
                onChange={(e) => setFormSopCode(e.target.value)}
                placeholder="e.g. SOP-CNC-LUB-012"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Link to Health Trend checkbox */}
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="chk-attach-trend"
                checked={attachHealthTrend}
                onChange={(e) => setAttachHealthTrend(e.target.checked)}
                className="rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-0 h-4 w-4"
              />
              <label htmlFor="chk-attach-trend" className="text-slate-300 text-[11px] cursor-pointer">
                Attach live health trend telemetry & RUL projection to this event
              </label>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="text-slate-400 block mb-1">Work Description & Pre-Work Notes</label>
              <textarea
                rows={2}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Specify lubrication specifications, torque tolerances, or safety clearances..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Submit & Cancel */}
            <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black transition-colors shadow-md flex items-center gap-1.5"
              >
                <CalendarCheck className="h-4 w-4" />
                <span>Save to Calendar</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
