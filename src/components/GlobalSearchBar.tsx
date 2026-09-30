import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Cpu,
  Droplets,
  Activity,
  Wind,
  ChevronRight,
  ExternalLink,
  Command,
  SlidersHorizontal,
  Volume2
} from 'lucide-react';
import { MachineState, HealthState } from '../types';
import { useI18n } from '../i18n/i18nContext';

interface GlobalSearchBarProps {
  machines: MachineState[];
  onSelectMachine: (machine: MachineState) => void;
  onOpenDetailModal?: (machine: MachineState) => void;
  className?: string;
  isMobileCompact?: boolean;
}

const MACHINE_ICON_MAP: Record<string, React.ElementType> = {
  'cnc-milling-machine': Cpu,
  'industrial-cooling-pump': Droplets,
  'conveyor-drive-motor': Activity,
  'precision-air-compressor': Wind,
};

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  machines,
  onSelectMachine,
  onOpenDetailModal,
  className = '',
  isMobileCompact = false
}) => {
  const { trans } = useI18n();
  const [query, setQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | HealthState>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut: '/' or 'Cmd+K' / 'Ctrl+K' focuses the search input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in another input or textarea
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.key === '/' && !isInput) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter machines based on query and status filter
  const filteredMachines = useMemo(() => {
    const q = query.trim().toLowerCase();

    return machines.filter((machine) => {
      // 1. Status Filter Check
      if (statusFilter !== 'all' && machine.healthState !== statusFilter) {
        return false;
      }

      if (!q) return true;

      // 2. Name check
      if (machine.name.toLowerCase().includes(q)) return true;

      // 3. ID / slug check
      if (machine.id.toLowerCase().includes(q)) return true;

      // 4. Status text check
      if (machine.healthState.toLowerCase().includes(q)) return true;
      if (q === 'critical' && machine.healthState === 'Action Required') return true;
      if (q === 'nominal' && machine.healthState === 'Normal') return true;
      if (q === 'trip' && machine.healthState === 'Action Required') return true;
      if (q === 'recovery' && machine.healthState === 'Post-Maintenance') return true;

      // Check against current translated status
      if (trans.health.nominal.toLowerCase().includes(q) && machine.healthState === 'Normal') return true;
      if (trans.health.advisory.toLowerCase().includes(q) && machine.healthState === 'Advisory') return true;
      if (trans.health.actionRequired.toLowerCase().includes(q) && machine.healthState === 'Action Required') return true;
      if (trans.health.postMaintenance.toLowerCase().includes(q) && machine.healthState === 'Post-Maintenance') return true;

      // 5. Location / Bay check
      if (machine.location && machine.location.toLowerCase().includes(q)) return true;

      // 6. Model & Serial check
      if (machine.model && machine.model.toLowerCase().includes(q)) return true;
      if (machine.serialNumber && machine.serialNumber.toLowerCase().includes(q)) return true;

      return false;
    });
  }, [machines, query, statusFilter, trans]);

  // Reset selectedIndex when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredMachines]);

  // Handle arrow key navigation in results
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredMachines.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredMachines.length) % (filteredMachines.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredMachines[selectedIndex]) {
        handleSelect(filteredMachines[selectedIndex]);
      }
    }
  };

  const handleSelect = (machine: MachineState) => {
    onSelectMachine(machine);
    setIsOpen(false);
    setIsMobileSearchExpanded(false);
  };

  const handleOpenDetail = (e: React.MouseEvent, machine: MachineState) => {
    e.stopPropagation();
    if (onOpenDetailModal) {
      onOpenDetailModal(machine);
      setIsOpen(false);
      setIsMobileSearchExpanded(false);
    } else {
      handleSelect(machine);
    }
  };

  // Status counts for filter chips
  const counts = useMemo(() => {
    return {
      all: machines.length,
      normal: machines.filter(m => m.healthState === 'Normal').length,
      advisory: machines.filter(m => m.healthState === 'Advisory').length,
      critical: machines.filter(m => m.healthState === 'Action Required').length,
    };
  }, [machines]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <div className="absolute left-3 pointer-events-none text-slate-500">
          <Search className="h-4 w-4 text-slate-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search machines, IDs, or status..."
          className="w-full pl-9 pr-14 py-1.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-400 transition-all outline-none shadow-inner"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
              title="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded shadow-xs select-none">
              <span className="text-[9px]">/</span>
            </kbd>
          )}
        </div>
      </div>

      {/* Autocomplete / Instant Results Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto right-0 mt-2 w-80 sm:w-96 md:w-[420px] rounded-2xl bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-2xl z-50 overflow-hidden divide-y divide-slate-800/80 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Quick Filter Header Strip */}
          <div className="p-2.5 bg-slate-900/60 flex items-center justify-between gap-2 text-xs font-mono">
            <span className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase">
              Plant Machinery ({filteredMachines.length})
            </span>

            {/* Status Segmented Filter */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Normal')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  statusFilter === 'Normal'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
                title="Filter Nominal machines"
              >
                ● {counts.normal}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Advisory')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  statusFilter === 'Advisory'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'text-slate-400 hover:text-amber-400'
                }`}
                title="Filter Advisory machines"
              >
                ▲ {counts.advisory}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Action Required')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  statusFilter === 'Action Required'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                    : 'text-slate-400 hover:text-rose-400'
                }`}
                title="Filter Critical machines"
              >
                ✖ {counts.critical}
              </button>
            </div>
          </div>

          {/* Result List Items */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/40 p-1.5 space-y-1">
            {filteredMachines.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-slate-400 space-y-1">
                <Search className="h-6 w-6 text-slate-600 mx-auto mb-2" />
                <p className="font-bold text-slate-300">No matching machinery found</p>
                <p className="text-[11px] text-slate-400">
                  Try searching by name (e.g. &quot;CNC&quot;, &quot;Pump&quot;), ID, or status (&quot;critical&quot;, &quot;nominal&quot;).
                </p>
              </div>
            ) : (
              filteredMachines.map((machine, idx) => {
                const IconComponent = MACHINE_ICON_MAP[machine.id] || Cpu;
                const isSelected = selectedIndex === idx;

                const isCritical = machine.healthState === 'Action Required';
                const isAdvisory = machine.healthState === 'Advisory';
                const isPostMaint = machine.healthState === 'Post-Maintenance';

                let badgeColor = 'text-emerald-400 bg-emerald-950/70 border-emerald-800/60';
                let statusLabel = trans.health.nominal;

                if (isCritical) {
                  badgeColor = 'text-rose-300 bg-rose-950/90 border-rose-700 animate-pulse';
                  statusLabel = trans.health.actionRequired;
                } else if (isAdvisory) {
                  badgeColor = 'text-amber-300 bg-amber-950/80 border-amber-700';
                  statusLabel = trans.health.advisory;
                } else if (isPostMaint) {
                  badgeColor = 'text-blue-300 bg-blue-950/80 border-blue-700';
                  statusLabel = trans.health.recovery;
                }

                return (
                  <div
                    key={machine.id}
                    onClick={() => handleSelect(machine)}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                      isSelected
                        ? 'bg-slate-800/90 border border-cyan-500/60 ring-1 ring-cyan-500/30'
                        : 'hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Equipment Type Icon */}
                      <div className={`p-2 rounded-lg border shrink-0 ${
                        isCritical
                          ? 'bg-rose-950/80 border-rose-700 text-rose-400'
                          : isAdvisory
                          ? 'bg-amber-950/80 border-amber-700 text-amber-400'
                          : 'bg-slate-900 border-slate-700 text-cyan-400'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>

                      {/* Machine Title & Meta */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold font-mono text-slate-100 truncate group-hover:text-cyan-300 transition-colors">
                            {machine.name}
                          </h4>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold shrink-0 ${badgeColor}`}>
                            {statusLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                          <span className="text-slate-400">{machine.id}</span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-slate-400">{machine.location}</span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-cyan-400/90">
                            {machine.currentReadings.temperature}K / {machine.currentReadings.vibration}μm
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {onOpenDetailModal && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenDetail(e, machine)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-colors"
                          title="Open machine diagnostic schematic & specifications"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleSelect(machine)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 hover:border-cyan-500 font-mono text-xs font-bold flex items-center gap-1 transition-all"
                        title="Jump to MachineDeepDive active monitoring view"
                      >
                        <span>Monitor</span>
                        <ChevronRight className="h-3 w-3 text-cyan-400" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Keyboard Helper Footer */}
          <div className="p-2 bg-slate-950 px-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <div className="flex items-center gap-2">
              <span>↑↓ Navigate</span>
              <span>·</span>
              <span>↵ Open</span>
              <span>·</span>
              <span>Esc Close</span>
            </div>
            <span className="text-cyan-400/80">PRISM Fleet Search</span>
          </div>

        </div>
      )}

    </div>
  );
};
