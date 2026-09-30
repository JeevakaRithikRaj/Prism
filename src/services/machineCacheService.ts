import { MachineState } from '../types';
import { toastManager } from '../managers/ToastManager';

export interface CachedMachineDeepDivePayload {
  machine: MachineState;
  cachedAt: string;
  cacheVersion: string;
  source: 'service-worker-cache' | 'network-stream';
  checksum: string;
  networkLatencyMs?: number;
}

export type SimulatedNetworkMode = 'normal' | 'intermittent' | 'offline';

export interface CacheStatusReport {
  isServiceWorkerSupported: boolean;
  isCacheStorageSupported: boolean;
  totalCachedMachines: number;
  lastSyncTimestamp: string | null;
  cacheStorageName: string;
  activeNetworkMode: SimulatedNetworkMode;
  isServingFromCache: boolean;
}

const CACHE_NAME = 'prism-machine-api-cache';
const CACHE_VERSION = '2.4.0';

class MachineCacheService {
  private networkMode: SimulatedNetworkMode = 'normal';
  private lastSyncTime: string | null = null;
  private cachedMachinesCount: number = 0;
  private listeners: Array<() => void> = [];
  private lastCacheWriteTimes: Record<string, number> = {};

  constructor() {
    this.initCache();
  }

  private async initCache(): Promise<void> {
    if (typeof window === 'undefined' || !('caches' in window)) return;
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      this.cachedMachinesCount = keys.filter(k => k.url.includes('/api/machines/')).length;
      this.lastSyncTime = new Date().toISOString();
      this.notify();
    } catch (err) {
      console.warn('[MachineCacheService] Initial cache check failed:', err);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.error(e);
      }
    });
  }

  /**
   * Caches critical API response assets for a specific machine in CacheStorage.
   * This guarantees that requests to /api/machines/:id/deepdive are cached according to the
   * Service Worker strategy even if network drops.
   */
  public async cacheMachineDeepDiveAsset(machine: MachineState, force: boolean = false): Promise<void> {
    if (typeof window === 'undefined' || !('caches' in window)) return;

    // Throttle writes to once every 4 seconds per machine unless forced
    const now = Date.now();
    const lastWrite = this.lastCacheWriteTimes[machine.id] || 0;
    if (!force && now - lastWrite < 4000) {
      return;
    }
    this.lastCacheWriteTimes[machine.id] = now;

    const payload: CachedMachineDeepDivePayload = {
      machine,
      cachedAt: new Date().toISOString(),
      cacheVersion: CACHE_VERSION,
      source: 'service-worker-cache',
      checksum: `${machine.id}-${machine.lastUpdated}-${machine.rulMetrics.healthIndex}`
    };

    try {
      const cache = await caches.open(CACHE_NAME);

      // 1. Cache the specific machine deep-dive API response
      const deepDiveUrl = `/api/machines/${machine.id}/deepdive`;
      const response = new Response(JSON.stringify(payload), {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
          'X-PRISM-Cache-Version': CACHE_VERSION,
          'X-PRISM-Cached-At': payload.cachedAt,
          'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400'
        }
      });
      await cache.put(deepDiveUrl, response);

      // 2. Also cache machine vibration FFT spectrum asset
      const vibrationUrl = `/api/machines/${machine.id}/vibration`;
      const vibResponse = new Response(JSON.stringify(machine.vibrationSpectrum), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-PRISM-Cached-At': payload.cachedAt
        }
      });
      await cache.put(vibrationUrl, vibResponse);

      // 3. Cache machine schematic subsystems asset
      const schematicUrl = `/api/machines/${machine.id}/schematic`;
      const schematicResponse = new Response(JSON.stringify(machine.subsystems), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-PRISM-Cached-At': payload.cachedAt
        }
      });
      await cache.put(schematicUrl, schematicResponse);

      this.lastSyncTime = payload.cachedAt;
      const keys = await cache.keys();
      this.cachedMachinesCount = keys.filter(k => k.url.includes('/deepdive')).length;
      this.notify();
    } catch (err) {
      console.warn('[MachineCacheService] Failed caching machine asset:', err);
    }
  }

  /**
   * Reads the cached machine deep-dive API response from CacheStorage
   */
  public async getCachedMachineDeepDiveAsset(machineId: string): Promise<CachedMachineDeepDivePayload | null> {
    if (typeof window === 'undefined' || !('caches' in window)) return null;

    try {
      const cache = await caches.open(CACHE_NAME);
      const deepDiveUrl = `/api/machines/${machineId}/deepdive`;
      const match = await cache.match(deepDiveUrl);

      if (match) {
        const data = await match.json();
        return data as CachedMachineDeepDivePayload;
      }
    } catch (err) {
      console.warn('[MachineCacheService] Error reading from cache:', err);
    }
    return null;
  }

  /**
   * Set simulated network connectivity mode to test service worker resilience
   */
  public setNetworkMode(mode: SimulatedNetworkMode): void {
    this.networkMode = mode;
    this.notify();

    if (mode === 'intermittent') {
      toastManager.warning(
        'Simulated Intermittent Network',
        'Service Worker NetworkFirst strategy is falling back to cached machine assets during packet drops.',
        { duration: 4000 }
      );
    } else if (mode === 'offline') {
      toastManager.error(
        'Simulated Plant Disconnection',
        'Operating entirely on Service Worker cached machine assets (100% offline).',
        { duration: 4000 }
      );
    } else {
      toastManager.success(
        'Deterministic Network Restored',
        'Normal real-time telemetry streaming and cache synchronization active.',
        { duration: 3000 }
      );
    }
  }

  public getNetworkMode(): SimulatedNetworkMode {
    return this.networkMode;
  }

  /**
   * Clears and resynchronizes the machine API cache
   */
  public async clearAndResync(allMachines: MachineState[]): Promise<void> {
    if (typeof window === 'undefined' || !('caches' in window)) return;
    try {
      await caches.delete(CACHE_NAME);
      for (const m of allMachines) {
        await this.cacheMachineDeepDiveAsset(m, true);
      }
      toastManager.success(
        'Service Worker Cache Synced',
        `Re-cached critical API response assets for ${allMachines.length} machines.`
      );
      this.notify();
    } catch (e) {
      console.error('[MachineCacheService] Clear and resync failed:', e);
    }
  }

  public getStatusReport(): CacheStatusReport {
    const isSWSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
    const isCacheSupported = typeof window !== 'undefined' && 'caches' in window;
    const isRealOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    const isServingFromCache =
      this.networkMode === 'offline' ||
      this.networkMode === 'intermittent' ||
      isRealOffline;

    return {
      isServiceWorkerSupported: isSWSupported,
      isCacheStorageSupported: isCacheSupported,
      totalCachedMachines: this.cachedMachinesCount,
      lastSyncTimestamp: this.lastSyncTime,
      cacheStorageName: CACHE_NAME,
      activeNetworkMode: this.networkMode,
      isServingFromCache
    };
  }
}

export const machineCacheService = new MachineCacheService();
