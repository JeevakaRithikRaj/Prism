import QRCode from 'qrcode';
import { MachineState } from '../types';

/**
 * Standard payload structure encoded in physical PRISM equipment tags
 */
export interface EquipmentQRPayload {
  system: 'PRISM';
  machineId: string;
  name: string;
  serialNumber?: string;
  model?: string;
  location?: string;
  generatedAt: string;
  version: string;
}

/**
 * Builds the canonical mobile web URL for jumping directly to a machine's monitoring view
 */
export function getMachineQuickJumpUrl(
  machineId: string,
  options?: {
    view?: 'machine-deep-dive' | 'spectrum-analyzer' | 'plant-overview';
    modal?: boolean;
    tab?: string;
  }
): string {
  if (typeof window === 'undefined') {
    return `/?mode=app&view=machine-deep-dive&machine=${encodeURIComponent(machineId)}`;
  }
  const origin = window.location.origin;
  const view = options?.view || 'machine-deep-dive';
  const modalParam = options?.modal ? '&modal=true' : '';
  const tabParam = options?.tab ? `&tab=${encodeURIComponent(options.tab)}` : '';
  return `${origin}/?mode=app&view=${view}&machine=${encodeURIComponent(machineId)}${modalParam}${tabParam}`;
}

/**
 * Generates a high-contrast QR code encoding the direct Mobile Quick Jump URL
 * Mobile camera apps (iOS Camera, Android Google Lens, Chrome, etc.) will recognize
 * this as a web link and allow technicians to tap once to jump straight to this machine.
 */
export async function generateMachineMobileQRDataUrl(
  machineId: string,
  options?: {
    view?: 'machine-deep-dive' | 'spectrum-analyzer' | 'plant-overview';
    modal?: boolean;
    tab?: string;
    width?: number;
    darkColor?: string;
    lightColor?: string;
  }
): Promise<{ dataUrl: string; targetUrl: string }> {
  const targetUrl = getMachineQuickJumpUrl(machineId, options);
  try {
    const dataUrl = await QRCode.toDataURL(targetUrl, {
      width: options?.width || 360,
      margin: 2,
      color: {
        dark: options?.darkColor || '#06b6d4', // Cyan-500
        light: options?.lightColor || '#020617', // Slate-950
      },
      errorCorrectionLevel: 'H',
    });
    return { dataUrl, targetUrl };
  } catch (err) {
    console.error('Failed to generate machine mobile QR code:', err);
    const fallbackUrl = await QRCode.toDataURL(targetUrl, { width: 300, margin: 2 });
    return { dataUrl: fallbackUrl, targetUrl };
  }
}

/**
 * Generates an SVG or high-resolution PNG data URL for an equipment QR code
 */
export async function generateMachineQRDataUrl(
  machine: { id: string; name: string; serialNumber?: string; model?: string; location?: string },
  options?: { darkColor?: string; lightColor?: string; width?: number }
): Promise<string> {
  const payload: EquipmentQRPayload = {
    system: 'PRISM',
    machineId: machine.id,
    name: machine.name,
    serialNumber: machine.serialNumber,
    model: machine.model,
    location: machine.location,
    generatedAt: new Date().toISOString(),
    version: '2.0.0',
  };

  const textToEncode = JSON.stringify(payload);

  try {
    const dataUrl = await QRCode.toDataURL(textToEncode, {
      width: options?.width || 320,
      margin: 2,
      color: {
        dark: options?.darkColor || '#0284c7', // Cyan-600 for high-contrast industrial look
        light: options?.lightColor || '#030712', // Dark background for high-tech look
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate machine QR code data URL:', err);
    // Fallback: simple ID encoding
    return QRCode.toDataURL(machine.id, { width: 300, margin: 2 });
  }
}

/**
 * Generates a clean printable/light high-contrast QR code (black on white)
 * ideal for printing out physical sticky tags.
 * If encodeUrl is true, encodes the direct mobile web URL so smartphone cameras can open it.
 */
export async function generatePrintableMachineQRDataUrl(
  machine: { id: string; name: string; serialNumber?: string; model?: string; location?: string },
  options?: { encodeUrl?: boolean; view?: 'machine-deep-dive' | 'spectrum-analyzer' | 'plant-overview' }
): Promise<string> {
  const contentToEncode = options?.encodeUrl
    ? getMachineQuickJumpUrl(machine.id, { view: options?.view })
    : JSON.stringify({
        system: 'PRISM',
        machineId: machine.id,
        name: machine.name,
        serialNumber: machine.serialNumber,
        model: machine.model,
        location: machine.location,
        generatedAt: new Date().toISOString(),
        version: '2.0.0',
      });

  return QRCode.toDataURL(contentToEncode, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H', // High error correction for robust camera scanning
  });
}

/**
 * Parses scanned QR code text and identifies the corresponding machine
 */
export function identifyMachineFromScannedData(
  scannedText: string,
  machines: MachineState[]
): {
  matchedMachine: MachineState | null;
  parsedPayload?: any;
  confidence: 'exact' | 'json' | 'serial' | 'fuzzy' | 'none';
} {
  if (!scannedText || typeof scannedText !== 'string') {
    return { matchedMachine: null, confidence: 'none' };
  }

  const trimmed = scannedText.trim();

  // 1. Try parsing JSON payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      const targetId = parsed.machineId || parsed.id || parsed.equipmentId;
      if (targetId) {
        const found = machines.find(
          (m) => m.id.toLowerCase() === String(targetId).toLowerCase()
        );
        if (found) {
          return { matchedMachine: found, parsedPayload: parsed, confidence: 'json' };
        }
      }

      // Check serial number inside JSON
      const targetSerial = parsed.serialNumber || parsed.serial;
      if (targetSerial) {
        const foundBySerial = machines.find(
          (m) => m.serialNumber?.toLowerCase() === String(targetSerial).toLowerCase()
        );
        if (foundBySerial) {
          return { matchedMachine: foundBySerial, parsedPayload: parsed, confidence: 'serial' };
        }
      }
    } catch {
      // Continue to next heuristics
    }
  }

  // 2. Direct exact ID match
  const exactMatch = machines.find(
    (m) => m.id.toLowerCase() === trimmed.toLowerCase()
  );
  if (exactMatch) {
    return { matchedMachine: exactMatch, confidence: 'exact' };
  }

  // 3. Serial Number match
  const serialMatch = machines.find(
    (m) => m.serialNumber && m.serialNumber.toLowerCase() === trimmed.toLowerCase()
  );
  if (serialMatch) {
    return { matchedMachine: serialMatch, confidence: 'serial' };
  }

  // 4. URL format match (e.g., https://.../machine/cnc-milling-machine or ?machineId=...)
  if (trimmed.includes('://') || trimmed.includes('/machine/') || trimmed.includes('machine=')) {
    for (const machine of machines) {
      if (trimmed.toLowerCase().includes(machine.id.toLowerCase())) {
        return { matchedMachine: machine, confidence: 'exact' };
      }
    }
  }

  // 5. Model code match
  const modelMatch = machines.find(
    (m) => m.model && m.model.toLowerCase() === trimmed.toLowerCase()
  );
  if (modelMatch) {
    return { matchedMachine: modelMatch, confidence: 'serial' };
  }

  // 6. Fuzzy keyword matching
  const lower = trimmed.toLowerCase();
  for (const m of machines) {
    if (m.name.toLowerCase().includes(lower) || lower.includes(m.name.toLowerCase())) {
      return { matchedMachine: m, confidence: 'fuzzy' };
    }
  }

  // Specific keyword fallbacks
  if (lower.includes('cnc') || lower.includes('milling') || lower.includes('spindle')) {
    const cnc = machines.find((m) => m.id === 'cnc-milling-machine');
    if (cnc) return { matchedMachine: cnc, confidence: 'fuzzy' };
  }
  if (lower.includes('coolant') || lower.includes('pump') || lower.includes('chiller') || lower.includes('hydro')) {
    const pump = machines.find((m) => m.id === 'industrial-cooling-pump');
    if (pump) return { matchedMachine: pump, confidence: 'fuzzy' };
  }
  if (lower.includes('conveyor') || lower.includes('belt') || lower.includes('motor') || lower.includes('vector')) {
    const motor = machines.find((m) => m.id === 'conveyor-drive-motor');
    if (motor) return { matchedMachine: motor, confidence: 'fuzzy' };
  }
  if (lower.includes('compressor') || lower.includes('air') || lower.includes('pneumatic') || lower.includes('screw')) {
    const comp = machines.find((m) => m.id === 'precision-air-compressor');
    if (comp) return { matchedMachine: comp, confidence: 'fuzzy' };
  }

  return { matchedMachine: null, confidence: 'none' };
}

/**
 * Plays a futuristic confirmation audio chime via Web Audio API on scan
 */
export function playScanConfirmationSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Two-tone rising futuristic cybernetic beep
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12); // A6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 300);
  } catch {
    // Silently handle if audio policy prevents autoplay
  }
}
