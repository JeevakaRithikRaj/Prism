export interface MachineLayoutConfig {
  id: string;
  stationIndex: number;
  bayLabel: string;
  colSpan: 1 | 2; // 1 = 1 column (half width on 2-col grid), 2 = 2 columns (full width span)
}

export type FloorLayoutPreset = 'standard-2x2' | 'linear-flow' | 'heavy-milling-focus' | 'dual-wide';

const STORAGE_KEY = 'prism_plant_floor_layout';

export const DEFAULT_LAYOUT: MachineLayoutConfig[] = [
  { id: 'cnc-milling-machine', stationIndex: 1, bayLabel: 'Bay 101 - Primary Milling Cell', colSpan: 1 },
  { id: 'industrial-cooling-pump', stationIndex: 2, bayLabel: 'Bay 102 - Chilled Coolant Loop', colSpan: 1 },
  { id: 'conveyor-drive-motor', stationIndex: 3, bayLabel: 'Bay 103 - Main Transfer Line', colSpan: 1 },
  { id: 'precision-air-compressor', stationIndex: 4, bayLabel: 'Bay 104 - High-Pressure Pneumatics', colSpan: 1 },
];

class FloorLayoutManager {
  private layout: MachineLayoutConfig[] = [];
  private listeners: Array<(layout: MachineLayoutConfig[]) => void> = [];

  constructor() {
    this.layout = this.loadLayout();
  }

  private loadLayout(): MachineLayoutConfig[] {
    if (typeof window === 'undefined') return [...DEFAULT_LAYOUT];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as MachineLayoutConfig[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure all 4 machines exist in parsed layout
          const ids = new Set(parsed.map(p => p.id));
          const missing = DEFAULT_LAYOUT.filter(d => !ids.has(d.id));
          return [...parsed, ...missing];
        }
      }
    } catch (e) {
      console.warn('[FloorLayoutManager] Failed to load floor layout:', e);
    }
    return [...DEFAULT_LAYOUT];
  }

  private save(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.layout));
      } catch (e) {
        console.warn('[FloorLayoutManager] Failed to save floor layout:', e);
      }
    }
    this.notify();
  }

  public subscribe(listener: (layout: MachineLayoutConfig[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.layout]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    const copy = [...this.layout];
    this.listeners.forEach(cb => cb(copy));
  }

  public getLayout(): MachineLayoutConfig[] {
    return [...this.layout];
  }

  /**
   * Reorders items by dragging from one index to another
   */
  public reorder(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= this.layout.length || toIndex >= this.layout.length) {
      return;
    }
    const updated = [...this.layout];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    // Re-index station numbers sequentially
    this.layout = updated.map((item, idx) => ({
      ...item,
      stationIndex: idx + 1
    }));
    this.save();
  }

  /**
   * Toggles or sets column span (1 = 1 column, 2 = 2 columns / full row)
   */
  public setColSpan(machineId: string, colSpan: 1 | 2): void {
    this.layout = this.layout.map(item =>
      item.id === machineId ? { ...item, colSpan } : item
    );
    this.save();
  }

  /**
   * Updates physical bay or line label
   */
  public setBayLabel(machineId: string, label: string): void {
    this.layout = this.layout.map(item =>
      item.id === machineId ? { ...item, bayLabel: label } : item
    );
    this.save();
  }

  /**
   * Resets layout back to factory default
   */
  public resetToDefault(): void {
    this.layout = [...DEFAULT_LAYOUT];
    this.save();
  }

  /**
   * Applies pre-engineered industrial floor layout presets
   */
  public applyPreset(preset: FloorLayoutPreset): void {
    switch (preset) {
      case 'standard-2x2':
        this.layout = [
          { id: 'cnc-milling-machine', stationIndex: 1, bayLabel: 'Bay 101 - Primary Milling Cell', colSpan: 1 },
          { id: 'industrial-cooling-pump', stationIndex: 2, bayLabel: 'Bay 102 - Chilled Coolant Loop', colSpan: 1 },
          { id: 'conveyor-drive-motor', stationIndex: 3, bayLabel: 'Bay 103 - Main Transfer Line', colSpan: 1 },
          { id: 'precision-air-compressor', stationIndex: 4, bayLabel: 'Bay 104 - High-Pressure Pneumatics', colSpan: 1 },
        ];
        break;
      case 'heavy-milling-focus':
        // CNC takes prominent full-width 2-column top bay
        this.layout = [
          { id: 'cnc-milling-machine', stationIndex: 1, bayLabel: 'Bay 101 - Heavy 5-Axis Milling Center', colSpan: 2 },
          { id: 'industrial-cooling-pump', stationIndex: 2, bayLabel: 'Bay 102 - Dedicated Pump Skid', colSpan: 1 },
          { id: 'conveyor-drive-motor', stationIndex: 3, bayLabel: 'Bay 103 - Outfeed Motor Drive', colSpan: 1 },
          { id: 'precision-air-compressor', stationIndex: 4, bayLabel: 'Bay 104 - Utility Pneumatics', colSpan: 2 },
        ];
        break;
      case 'linear-flow':
        // Linear process sequence: Infeed Compressor -> Coolant -> CNC -> Outfeed Conveyor
        this.layout = [
          { id: 'precision-air-compressor', stationIndex: 1, bayLabel: 'Station 1 - Pneumatics Supply', colSpan: 1 },
          { id: 'industrial-cooling-pump', stationIndex: 2, bayLabel: 'Station 2 - Thermal Fluid System', colSpan: 1 },
          { id: 'cnc-milling-machine', stationIndex: 3, bayLabel: 'Station 3 - Machining Workcenter', colSpan: 1 },
          { id: 'conveyor-drive-motor', stationIndex: 4, bayLabel: 'Station 4 - Finished Part Transfer', colSpan: 1 },
        ];
        break;
      case 'dual-wide':
        // 2 wide rows of equipment
        this.layout = [
          { id: 'cnc-milling-machine', stationIndex: 1, bayLabel: 'Bay A - Machining Center', colSpan: 2 },
          { id: 'conveyor-drive-motor', stationIndex: 2, bayLabel: 'Bay B - Material Handling System', colSpan: 2 },
          { id: 'industrial-cooling-pump', stationIndex: 3, bayLabel: 'Bay C - Auxiliary Chiller Loop', colSpan: 1 },
          { id: 'precision-air-compressor', stationIndex: 4, bayLabel: 'Bay D - Plant Air Generation', colSpan: 1 },
        ];
        break;
    }
    this.save();
  }
}

export const floorLayoutManager = new FloorLayoutManager();
