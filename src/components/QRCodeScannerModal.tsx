import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  X,
  RefreshCw,
  Zap,
  ZapOff,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Scan,
  Maximize2,
  FileText,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { MachineState } from '../types';
import { toastManager } from '../managers/ToastManager';
import {
  identifyMachineFromScannedData,
  playScanConfirmationSound,
  generateMachineQRDataUrl,
  generatePrintableMachineQRDataUrl
} from '../utils/qrCodeHelper';

interface QRCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  machines: MachineState[];
  onOpenDetail: (
    machine: MachineState,
    initialTab?: 'schematic' | 'telemetry' | 'vibration' | 'plc' | 'xai' | 'history' | 'calendar'
  ) => void;
}

export const QRCodeScannerModal: React.FC<QRCodeScannerModalProps> = ({
  isOpen,
  onClose,
  machines,
  onOpenDetail,
}) => {
  // Mode selection: 'camera' | 'upload' | 'tags'
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'tags'>('camera');

  // Camera state
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Scanning detection state
  const [scanResult, setScanResult] = useState<{
    text: string;
    machine: MachineState | null;
    timestamp: number;
  } | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState<string>('');

  // Printable tags preview state
  const [tagDataUrls, setTagDataUrls] = useState<Record<string, string>>({});
  const [selectedTagMachine, setSelectedTagMachine] = useState<MachineState | null>(null);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isScanningActiveRef = useRef<boolean>(false);

  // Generate QR tag data URLs on mount/load
  useEffect(() => {
    let isSubscribed = true;
    const loadTags = async () => {
      const urls: Record<string, string> = {};
      for (const machine of machines) {
        try {
          const url = await generateMachineQRDataUrl(machine);
          if (isSubscribed) {
            urls[machine.id] = url;
          }
        } catch (e) {
          console.error('Failed to pre-generate QR tag for', machine.id, e);
        }
      }
      if (isSubscribed) {
        setTagDataUrls(urls);
        if (machines.length > 0 && !selectedTagMachine) {
          setSelectedTagMachine(machines[0]);
        }
      }
    };
    if (isOpen) {
      loadTags();
    }
    return () => {
      isSubscribed = false;
    };
  }, [isOpen, machines]);

  // Handle successful machine identification
  const handleIdentifyMachine = useCallback((machine: MachineState, rawText: string) => {
    // Sound & Haptic confirmation
    playScanConfirmationSound();
    if (navigator.vibrate) {
      try {
        navigator.vibrate([60, 40, 90]);
      } catch {
        // Ignore
      }
    }

    setScanResult({
      text: rawText,
      machine,
      timestamp: Date.now(),
    });

    toastManager.showToast({
      title: 'Equipment Identified via QR Tag',
      message: `Station: ${machine.name} [ID: ${machine.id}]`,
      type: 'success',
      duration: 3500,
    });

    // Auto-open detail modal after a brief visual confirmation pause
    const timer = setTimeout(() => {
      onClose();
      onOpenDetail(machine, 'schematic');
    }, 750);

    return () => clearTimeout(timer);
  }, [onClose, onOpenDetail]);

  // Start video stream
  const startCamera = useCallback(async (deviceId?: string) => {
    setCameraError(null);
    setIsCameraStarting(true);
    setScanResult(null);

    // Stop existing stream if running
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not supported in this browser environment.');
      }

      // Query available devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setCameraDevices(videoInputs);
      } catch {
        // Non-blocking
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback for laptops/desktops without 'environment' facingMode
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      setCameraStream(stream);
      setIsCameraStarting(false);

      // Check for torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera stream request failed:', err);
      setIsCameraStarting(false);
      let errorMsg = 'Could not access device camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission denied. Please allow camera access in your browser settings to scan physical equipment tags.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No active video camera input detected on this terminal.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'Camera hardware is currently in use by another application or process.';
      }
      setCameraError(errorMsg);
    }
  }, [cameraStream]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    isScanningActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsTorchOn(false);
  }, [cameraStream]);

  // Toggle torch/flashlight
  const handleToggleTorch = async () => {
    if (!cameraStream) return;
    const track = cameraStream.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextTorch = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  // Continuous QR Code detection frame loop
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera' || !cameraStream) {
      return;
    }

    isScanningActiveRef.current = true;

    const processFrame = () => {
      if (!isScanningActiveRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const width = video.videoWidth;
        const height = video.videoHeight;

        if (width > 0 && height > 0) {
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);

            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });

            if (qrCode && qrCode.data) {
              const { matchedMachine } = identifyMachineFromScannedData(qrCode.data, machines);

              if (matchedMachine) {
                isScanningActiveRef.current = false;
                handleIdentifyMachine(matchedMachine, qrCode.data);
                return;
              } else {
                // Detected a non-machine QR code
                setScanResult({
                  text: qrCode.data,
                  machine: null,
                  timestamp: Date.now(),
                });
              }
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      isScanningActiveRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, activeTab, cameraStream, machines, handleIdentifyMachine]);

  // Start or stop camera when modal opens/closes or tab changes
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  // Handle uploaded QR image file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingUpload(true);
    setScanResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          setIsProcessingUpload(false);

          if (code && code.data) {
            const { matchedMachine } = identifyMachineFromScannedData(code.data, machines);
            if (matchedMachine) {
              handleIdentifyMachine(matchedMachine, code.data);
            } else {
              setScanResult({
                text: code.data,
                machine: null,
                timestamp: Date.now(),
              });
              toastManager.showToast({
                title: 'QR Code Decoded',
                message: `Decoded text: "${code.data.slice(0, 45)}...". No corresponding machinery found.`,
                type: 'warning',
              });
            }
          } else {
            toastManager.showToast({
              title: 'No QR Code Detected',
              message: 'The uploaded image did not contain a recognizable 2D QR code pattern.',
              type: 'error',
            });
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle manual input search
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    const { matchedMachine } = identifyMachineFromScannedData(manualInput.trim(), machines);
    if (matchedMachine) {
      handleIdentifyMachine(matchedMachine, manualInput.trim());
    } else {
      toastManager.showToast({
        title: 'Machine Not Found',
        message: `No active machine matched serial/ID query: "${manualInput}"`,
        type: 'warning',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden font-sans">
        
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-700/80 text-cyan-400 shadow-sm">
              <Scan className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-tight">
                  PRISM Equipment QR Scanner
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/80">
                  REAL-TIME OPTICAL OCR
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Scan asset tags to immediately route to physical schematic, condition logs, and FFT diagnostics
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/90 border-b border-slate-800 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('camera');
              setCameraError(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium font-mono transition-colors cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera Feed</span>
          </button>

          <button
            onClick={() => {
              stopCamera();
              setActiveTab('upload');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium font-mono transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image / Photo</span>
          </button>

          <button
            onClick={() => {
              stopCamera();
              setActiveTab('tags');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium font-mono transition-colors cursor-pointer ${
              activeTab === 'tags'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Equipment Tag Library</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: LIVE CAMERA SCANNER */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              
              {/* Camera Viewport & HUD Container */}
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] max-h-[380px] bg-black rounded-2xl border-2 border-slate-700/80 overflow-hidden shadow-inner flex items-center justify-center">
                
                {/* Live Video Element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    cameraStream && !isCameraStarting ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                {/* Hidden Processing Canvas */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Camera Starting Spinner */}
                {isCameraStarting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 gap-3 z-10">
                    <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                    <span className="text-xs font-mono text-cyan-400">
                      INITIALIZING VIDEO DEVICE HARDWARE...
                    </span>
                  </div>
                )}

                {/* Error Fallback Banner */}
                {cameraError && !isCameraStarting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/95 text-center gap-3 z-20">
                    <div className="p-3 rounded-full bg-amber-950/80 border border-amber-800/80 text-amber-400">
                      <AlertTriangle className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200 uppercase font-mono">
                        Camera Hardware Unavailable
                      </h4>
                      <p className="text-xs text-slate-400 max-w-md mt-1 font-mono leading-relaxed">
                        {cameraError}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <button
                        onClick={() => startCamera(selectedDeviceId)}
                        className="px-3.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-mono text-xs font-bold transition-colors cursor-pointer"
                      >
                        Retry Camera
                      </button>
                      <button
                        onClick={() => setActiveTab('upload')}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-mono text-xs transition-colors cursor-pointer"
                      >
                        Upload QR Image
                      </button>
                      <button
                        onClick={() => setActiveTab('tags')}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-mono text-xs transition-colors cursor-pointer"
                      >
                        Use Machine Tag Simulation
                      </button>
                    </div>
                  </div>
                )}

                {/* Cybernetic HUD Target Reticle Overlay (When camera is live) */}
                {cameraStream && !cameraError && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4 z-10">
                    
                    {/* Top HUD Telemetry */}
                    <div className="w-full flex items-center justify-between text-[11px] font-mono text-cyan-400/90 bg-slate-950/60 backdrop-blur-xs px-3 py-1 rounded-md border border-cyan-900/40">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>OPTICAL SENSOR ACTIVE</span>
                      </div>
                      <span className="hidden sm:inline">ALGORITHM: JSQR MATRIX DECODER</span>
                    </div>

                    {/* Target Viewfinder Box with Laser Scanline */}
                    <div className="relative w-56 h-56 sm:w-64 sm:h-64 border-2 border-cyan-500/30 rounded-2xl flex items-center justify-center">
                      
                      {/* 4 Corner High-Tech Brackets */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-cyan-400 rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-cyan-400 rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-cyan-400 rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-cyan-400 rounded-br-lg" />

                      {/* Animated Laser Scanning Line */}
                      <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] animate-scanline" />

                      {/* Center Crosshair */}
                      <div className="w-4 h-4 border border-cyan-400/50 rounded-full flex items-center justify-center opacity-70">
                        <div className="w-1 h-1 bg-cyan-400 rounded-full" />
                      </div>
                    </div>

                    {/* Bottom Guidance Instruction */}
                    <div className="text-center bg-slate-950/70 backdrop-blur-xs px-3 py-1 rounded-md border border-slate-800">
                      <span className="text-xs font-mono text-slate-300">
                        Align 2D QR Equipment Tag inside viewfinder brackets
                      </span>
                    </div>

                  </div>
                )}

                {/* Scanned Machine Success Overlay */}
                {scanResult && scanResult.machine && (
                  <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                      <CheckCircle2 className="w-10 h-10 animate-bounce" />
                    </div>

                    <div className="mt-3">
                      <span className="text-[11px] font-mono text-emerald-300 font-bold uppercase tracking-wider block">
                        EQUIPMENT VERIFIED · DIRECT ROUTING
                      </span>
                      <h3 className="text-xl font-bold text-white mt-1">
                        {scanResult.machine.name}
                      </h3>
                      <p className="text-xs font-mono text-emerald-200/80 mt-1">
                        Tag ID: {scanResult.machine.id} · Model: {scanResult.machine.model || 'Standard'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-4 px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/80 text-xs font-mono text-emerald-100">
                      <span>Loading Diagnostic Schematic...</span>
                      <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                  </div>
                )}

              </div>

              {/* Camera Hardware Controls Ribbon */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
                
                {/* Camera Source Selector */}
                {cameraDevices.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Sensor Device:</span>
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => {
                        setSelectedDeviceId(e.target.value);
                        startCamera(e.target.value);
                      }}
                      className="bg-slate-900 text-slate-200 px-2.5 py-1 rounded-md border border-slate-700 text-xs font-mono cursor-pointer"
                    >
                      {cameraDevices.map((dev, idx) => (
                        <option key={dev.deviceId || idx} value={dev.deviceId}>
                          {dev.label || `Camera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Torch Toggle */}
                {hasTorch && (
                  <button
                    onClick={handleToggleTorch}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      isTorchOn
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60'
                        : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {isTorchOn ? <Zap className="w-3.5 h-3.5 fill-current" /> : <ZapOff className="w-3.5 h-3.5" />}
                    <span>{isTorchOn ? 'Flashlight ON' : 'Flashlight OFF'}</span>
                  </button>
                )}

                {/* Restart Camera */}
                <button
                  onClick={() => startCamera(selectedDeviceId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors ml-auto cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Cycle Lens</span>
                </button>

              </div>

              {/* Quick One-Click Simulated Tags Bar */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Quick Field Equipment Scan (Instant Test)
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Click to test instant RFID/QR scan response
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {machines.map((machine) => (
                    <button
                      key={machine.id}
                      onClick={() => handleIdentifyMachine(machine, machine.id)}
                      className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/60 transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 group-hover:text-cyan-300">
                        <span className="truncate">{machine.name.split(' ')[0]}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-xs font-bold text-slate-200 group-hover:text-white truncate mt-0.5">
                        {machine.name}
                      </p>
                      <span className="text-[10px] font-mono text-slate-500 block truncate">
                        {machine.serialNumber || machine.id}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: UPLOAD IMAGE / PHOTO SCAN */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 bg-slate-950/60 hover:bg-slate-950 rounded-2xl p-8 text-center transition-all cursor-pointer group flex flex-col items-center justify-center gap-3"
              >
                <div className="p-4 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-200">
                    Drop equipment tag photo or click to browse
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm font-mono">
                    Select any photo, screenshot, or industrial asset image containing a 2D QR matrix barcode.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <span className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-mono text-slate-300 border border-slate-700">
                  {isProcessingUpload ? 'ANALYZING BITMATRIX PATTERN...' : 'SUPPORTED: PNG, JPG, WEBP, SVG'}
                </span>
              </div>

              {/* Manual Asset ID Search */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wide block mb-2">
                  Manual Asset ID / Serial Override Search
                </span>
                <form onSubmit={handleManualSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Enter machine ID or serial (e.g., cnc-milling-machine or PMP-2023-1192-B)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs transition-colors cursor-pointer"
                  >
                    Identify
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 3: PRINTABLE EQUIPMENT TAG LIBRARY */}
          {activeTab === 'tags' && (
            <div className="space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <span className="text-xs font-bold font-mono text-slate-200 uppercase">
                    Asset Identification Tags (ISO/IEC 18004 Standard)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Generate and test real QR codes physically or display on another screen to scan with your camera
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-mono transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Tags</span>
                  </button>
                </div>
              </div>

              {/* Machine Cards with Live QR Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {machines.map((machine) => {
                  const qrUrl = tagDataUrls[machine.id];
                  const isCurrent = selectedTagMachine?.id === machine.id;

                  return (
                    <div
                      key={machine.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-slate-950 border-cyan-500/80 ring-1 ring-cyan-500/50'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        
                        {/* High-Contrast QR Code Thumbnail */}
                        <div className="w-24 h-24 p-1.5 bg-slate-900 border border-slate-700 rounded-lg flex-shrink-0 flex items-center justify-center">
                          {qrUrl ? (
                            <img
                              src={qrUrl}
                              alt={`QR for ${machine.name}`}
                              className="w-full h-full object-contain rounded"
                            />
                          ) : (
                            <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                          )}
                        </div>

                        {/* Machine Asset Metadata */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                              STATION ASSET #{machine.id.slice(0, 12)}
                            </span>
                            <span className={`text-[10px] font-mono font-bold ${
                              machine.healthState === 'Normal' ? 'text-emerald-400' :
                              machine.healthState === 'Advisory' ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                              ● {machine.healthState}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-100 truncate mt-0.5">
                            {machine.name}
                          </h4>
                          <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                            Model: {machine.model || 'VMC-500'}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono truncate">
                            Serial: {machine.serialNumber || 'N/A'}
                          </p>

                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() => handleIdentifyMachine(machine, machine.id)}
                              className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-mono text-xs transition-colors cursor-pointer"
                            >
                              Simulate Scan
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const printableUrl = await generatePrintableMachineQRDataUrl(machine);
                                  const w = window.open('');
                                  if (w) {
                                    w.document.write(`
                                      <html>
                                        <head><title>Equipment Asset Tag - ${machine.name}</title></head>
                                        <body style="font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fff; color: #000;">
                                          <div style="border: 2px solid #000; padding: 24px; border-radius: 12px; text-align: center; max-width: 360px;">
                                            <h2 style="margin: 0 0 8px 0; font-size: 18px;">PRISM ASSET TAG</h2>
                                            <div style="font-size: 14px; font-weight: bold; margin-bottom: 12px;">${machine.name}</div>
                                            <img src="${printableUrl}" style="width: 200px; height: 200px; margin: 0 auto; display: block;" />
                                            <div style="font-size: 12px; margin-top: 12px;">ID: ${machine.id}</div>
                                            <div style="font-size: 12px;">Serial: ${machine.serialNumber || 'N/A'}</div>
                                            <div style="font-size: 10px; margin-top: 8px; color: #555;">ISO/IEC 18004 COMPLIANT 2D MATRIX</div>
                                          </div>
                                          <script>window.onload = () => window.print();</script>
                                        </body>
                                      </html>
                                    `);
                                    w.document.close();
                                  }
                                } catch (e) {
                                  console.error('Failed to open printable tag', e);
                                }
                              }}
                              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs transition-colors cursor-pointer"
                            >
                              Print Sticker
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

        {/* Footer info ribbon */}
        <div className="p-3 sm:px-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>PRISM Optical Tagging Service v2.0</span>
          </div>
          <span className="text-[11px] text-slate-600">
            Press ESC or tap background to close
          </span>
        </div>

      </div>
    </div>
  );
};
