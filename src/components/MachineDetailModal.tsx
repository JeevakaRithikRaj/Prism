import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Cpu,
  Layers,
  Activity,
  Gauge,
  Sliders,
  FileText,
  History,
  FileJson,
  Calendar,
  Clock,
  QrCode,
  Printer,
  Sparkles,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Scan,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { MachineState, Scenario } from '../types';
import { simulationManager } from '../managers/SimulationManager';
import { audioAlarmManager } from '../utils/AudioAlarmManager';
import { historyLogManager } from '../managers/HistoryLogManager';
import { maintenanceCalendarManager } from '../managers/MaintenanceCalendarManager';
import { toastManager } from '../managers/ToastManager';
import {
  generateMachineQRDataUrl,
  generatePrintableMachineQRDataUrl,
  generateMachineMobileQRDataUrl,
  getMachineQuickJumpUrl
} from '../utils/qrCodeHelper';
import { SensorTrends } from './SensorTrends';
import { MachineSchematic } from './MachineSchematic';
import { VibrationSpectrumViewer } from './VibrationSpectrumViewer';
import { MachineHistoryLog } from './MachineHistoryLog';
import { PredictiveInsightSection } from './PredictiveInsightSection';
import { MaintenanceCalendar } from './MaintenanceCalendar';
import { SettingsModal } from './SettingsModal';

interface MachineDetailModalProps {
  machine: MachineState | null;
  onClose: () => void;
  initialTab?: 'schematic' | 'telemetry' | 'vibration' | 'plc' | 'xai' | 'history' | 'calendar' | 'qr-code';
  onNavigateToView?: (view: 'machine-deep-dive' | 'spectrum-analyzer' | 'plant-overview', machineId?: string) => void;
}

export const MachineDetailModal: React.FC<MachineDetailModalProps> = ({
  machine,
  onClose,
  initialTab = 'schematic',
  onNavigateToView
}) => {
  const [modalTab, setModalTab] = useState<'schematic' | 'telemetry' | 'vibration' | 'plc' | 'xai' | 'history' | 'calendar' | 'qr-code'>(initialTab);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // QR Code Feature State
  const [qrDestination, setQrDestination] = useState<'deep-dive' | 'vibration' | 'schematic' | 'telemetry'>('deep-dive');
  const [qrPayloadType, setQrPayloadType] = useState<'mobile-url' | 'equipment-tag'>('mobile-url');
  const [mobileQrDataUrl, setMobileQrDataUrl] = useState<string>('');
  const [targetJumpUrl, setTargetJumpUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState<boolean>(false);

  // Synchronize initialTab when prop changes
  useEffect(() => {
    if (initialTab) {
      setModalTab(initialTab);
    }
  }, [initialTab, machine?.id]);

  // Dynamically generate QR code whenever machine, destination, or payload type changes
  useEffect(() => {
    if (!machine) return;
    let isCancelled = false;
    setIsGeneratingQR(true);

    if (qrPayloadType === 'mobile-url') {
      const view = qrDestination === 'vibration' ? 'spectrum-analyzer' : 'machine-deep-dive';
      const isModal = qrDestination === 'schematic' || qrDestination === 'telemetry';
      const tab = isModal ? qrDestination : undefined;

      generateMachineMobileQRDataUrl(machine.id, {
        view,
        modal: isModal,
        tab,
        width: 380,
        darkColor: '#06b6d4',
        lightColor: '#030712'
      })
        .then(({ dataUrl, targetUrl }) => {
          if (!isCancelled) {
            setMobileQrDataUrl(dataUrl);
            setTargetJumpUrl(targetUrl);
            setIsGeneratingQR(false);
          }
        })
        .catch((err) => {
          console.error('Failed to generate mobile QR code:', err);
          if (!isCancelled) setIsGeneratingQR(false);
        });
    } else {
      generateMachineQRDataUrl(machine, { width: 380 })
        .then((dataUrl) => {
          if (!isCancelled) {
            setMobileQrDataUrl(dataUrl);
            setTargetJumpUrl(
              JSON.stringify(
                {
                  system: 'PRISM',
                  machineId: machine.id,
                  name: machine.name,
                  serialNumber: machine.serialNumber,
                  model: machine.model,
                  location: machine.location,
                  version: '2.0.0',
                  copyright: 'RJRR'
                },
                null,
                2
              )
            );
            setIsGeneratingQR(false);
          }
        })
        .catch((err) => {
          console.error('Failed to generate equipment tag:', err);
          if (!isCancelled) setIsGeneratingQR(false);
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [machine, qrDestination, qrPayloadType]);

  if (!machine) return null;

  const isCritical = machine.healthState === 'Action Required';

  const handleCopyJumpUrl = () => {
    if (!targetJumpUrl) return;
    navigator.clipboard.writeText(targetJumpUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2200);
    toastManager.success('Direct URL Copied', 'Mobile quick-jump link copied to clipboard.', {
      duration: 3500
    });
  };

  const handleDownloadQR = () => {
    if (!mobileQrDataUrl) return;
    const link = document.createElement('a');
    link.href = mobileQrDataUrl;
    link.download = `PRISM_${machine.id}_Mobile_QR.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toastManager.success('QR Code Downloaded', `Saved QR code image for ${machine.name}.`);
  };

  const handleTestQuickJump = () => {
    const view = qrDestination === 'vibration' ? 'spectrum-analyzer' : 'machine-deep-dive';
    if (onNavigateToView) {
      onNavigateToView(view, machine.id);
    } else {
      window.location.href = targetJumpUrl;
    }
  };

  const handlePrintPhysicalTag = async () => {
    try {
      const printableUrl = await generatePrintableMachineQRDataUrl(machine, {
        encodeUrl: qrPayloadType === 'mobile-url',
        view: qrDestination === 'vibration' ? 'spectrum-analyzer' : 'machine-deep-dive'
      });

      const w = window.open('');
      if (w) {
        w.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>PRISM Asset Tag - ${machine.name}</title>
              <style>
                @page { size: auto; margin: 15mm; }
                body {
                  font-family: 'Courier New', Courier, monospace;
                  background: #ffffff;
                  color: #000000;
                  margin: 0;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                }
                .tag-card {
                  border: 3px solid #000000;
                  border-radius: 12px;
                  padding: 22px;
                  width: 360px;
                  box-sizing: border-box;
                  text-align: center;
                }
                .header {
                  border-bottom: 2px solid #000000;
                  padding-bottom: 8px;
                  margin-bottom: 12px;
                }
                .brand {
                  font-size: 16px;
                  font-weight: 900;
                  letter-spacing: 2px;
                }
                .sub-brand {
                  font-size: 10px;
                  font-weight: bold;
                  color: #333;
                  margin-top: 2px;
                }
                .asset-name {
                  font-size: 15px;
                  font-weight: bold;
                  margin-bottom: 8px;
                  text-transform: uppercase;
                }
                .qr-box {
                  margin: 10px auto;
                  width: 210px;
                  height: 210px;
                }
                .qr-box img {
                  width: 100%;
                  height: 100%;
                  display: block;
                }
                .meta-grid {
                  font-size: 11px;
                  text-align: left;
                  margin-top: 10px;
                  line-height: 1.5;
                  border-top: 1px solid #ccc;
                  padding-top: 8px;
                }
                .footer-text {
                  font-size: 9px;
                  color: #444;
                  margin-top: 10px;
                  border-top: 1px dashed #999;
                  padding-top: 6px;
                }
              </style>
            </head>
            <body>
              <div class="tag-card">
                <div class="header">
                  <div class="brand">PRISM · RJRR</div>
                  <div class="sub-brand">CONDITION-BASED PREDICTIVE MAINTENANCE</div>
                </div>
                <div class="asset-name">${machine.name}</div>
                <div class="qr-box">
                  <img src="${printableUrl}" alt="QR Asset Code" />
                </div>
                <div class="meta-grid">
                  <div><strong>ASSET ID:</strong> ${machine.id}</div>
                  <div><strong>SERIAL NO:</strong> ${machine.serialNumber || 'N/A'}</div>
                  <div><strong>MODEL:</strong> ${machine.model || 'N/A'}</div>
                  <div><strong>LOCATION:</strong> ${machine.location || 'Plant Floor'}</div>
                  <div><strong>DIAGNOSTIC STANDARD:</strong> ISO 10816-3 Class II/III</div>
                </div>
                <div class="footer-text">
                  SCAN WITH ANY MOBILE PHONE CAMERA TO LAUNCH LIVE MONITOR<br/>
                  &copy; 2026 RJRR. All rights reserved.
                </div>
              </div>
              <script>
                window.onload = function() {
                  window.print();
                };
              </script>
            </body>
          </html>
        `);
        w.document.close();
      }
    } catch (e) {
      console.error('Print tag failed', e);
      toastManager.error('Print Error', 'Could not open print window.');
    }
  };

  const handleExportHistoryAndHealthJSON = () => {
    const logs = historyLogManager.getLogsForMachine(machine.id);
    const exportPayload = {
      exportMetadata: {
        system: 'PRISM - Predictive Reliability & Intelligent Systems for Maintenance',
        copyright: 'RJRR',
        reportType: 'Machine History Log & Comprehensive Health Summary',
        generatedAt: new Date().toISOString(),
        version: '2.0.0'
      },
      machineProfile: {
        id: machine.id,
        name: machine.name,
        model: machine.model,
        location: machine.location,
        currentHealthState: machine.healthState,
        operationalScenario: machine.scenario,
        recoveryTicks: machine.recoveryTicks,
        lastUpdated: machine.lastUpdated
      },
      healthSummary: {
        healthIndexPercent: machine.rulMetrics.healthIndex,
        rulMetrics: {
          estimatedHoursRemaining: machine.rulMetrics.estimatedHoursRemaining,
          baselineLifespanHours: machine.rulMetrics.baselineLifespanHours,
          confidenceInterval: {
            lowerHours: machine.rulMetrics.confidenceLowerHours,
            upperHours: machine.rulMetrics.confidenceUpperHours
          },
          degradationRatePerHour: machine.rulMetrics.degradationRatePerHour,
          recommendedInterventionDate: machine.rulMetrics.recommendedInterventionDate
        },
        oeeMetrics: {
          overallOeePercent: machine.oeeMetrics.overallOee,
          availabilityPercent: machine.oeeMetrics.availability,
          performancePercent: machine.oeeMetrics.performance,
          qualityPercent: machine.oeeMetrics.quality,
          cycleTimeSeconds: machine.oeeMetrics.cycleTimeSeconds,
          partsProducedToday: machine.oeeMetrics.partsProducedToday,
          defectScrapCount: machine.oeeMetrics.defectCount
        },
        currentTelemetryReadings: machine.currentReadings,
        subsystemsStatus: machine.subsystems.map((s) => ({
          id: s.id,
          name: s.name,
          type: s.type,
          status: s.status,
          healthIndex: s.healthIndex,
          stressPercent: s.stressPercent,
          temperature: s.temperature,
          description: s.description
        })),
        plcDigitalAndAnalogChannels: machine.plcChannels.map((c) => ({
          tag: c.tag,
          label: c.label,
          type: c.type,
          value: c.value,
          unit: c.unit,
          state: c.state
        })),
        vibrationISOAnalysis: {
          isoStandard: 'ISO 10816-3',
          isoZone: machine.vibrationSpectrum.isoZone,
          isoDescription: machine.vibrationSpectrum.isoDescription,
          velocityRmsMmS: machine.vibrationSpectrum.velocityRms,
          accelerationPeakG: machine.vibrationSpectrum.accelerationPeak,
          crestFactor: machine.vibrationSpectrum.crestFactor,
          detectedDefectFrequencies: machine.vibrationSpectrum.defectFrequencies.filter((d) => d.detected)
        },
        explainableAIDiagnostics: {
          summary: machine.xaiExplanation.summary,
          primaryRootCause: machine.xaiExplanation.primaryCause,
          confidenceScore: machine.xaiExplanation.confidenceScore,
          contributingSensorDeviations: machine.xaiExplanation.contributingSensors,
          standardOperatingProceduresChecklist: machine.xaiExplanation.recommendedActions
        }
      },
      historyAuditTrail: {
        totalRecordedEventsCount: logs.length,
        maintenanceInterventionsCount: logs.filter((l) => l.type === 'maintenance_intervention').length,
        healthStateTransitionsCount: logs.filter((l) => l.type === 'health_change').length,
        chronologicalLogEntries: logs
      },
      scheduledMaintenanceCalendar: {
        upcomingScheduledEventsCount: maintenanceCalendarManager
          .getEventsForMachine(machine.id)
          .filter((e) => e.status === 'scheduled').length,
        events: maintenanceCalendarManager.getEventsForMachine(machine.id)
      }
    };

    const fileName = `PRISM_${machine.id}_History_HealthSummary_${Date.now()}.json`;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toastManager.success(
      'Machine History Log Exported',
      `Successfully exported JSON history log and health summary for ${machine.name}.`,
      {
        duration: 5500,
        fileDetails: {
          filename: fileName,
          format: 'JSON',
          itemCount: logs.length
        }
      }
    );
  };

  const handleExportJSON = () => {
    const fileName = `PRISM_Telemetry_${machine.id}_${Date.now()}.json`;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(machine, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toastManager.info('Machine Telemetry Exported', `Exported raw real-time machine telemetry dataset for ${machine.name}.`, {
      duration: 4500,
      fileDetails: {
        filename: fileName,
        format: 'JSON'
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-xl overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center border shadow-md ${
                isCritical ? 'bg-rose-950/90 border-rose-600 text-rose-300' : 'bg-slate-950 border-slate-800 text-cyan-400'
              }`}
            >
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white">{machine.name}</h2>
                <span
                  className={`text-xs font-mono font-bold ${
                    isCritical
                      ? 'text-rose-400 animate-pulse'
                      : machine.healthState === 'Advisory'
                      ? 'text-amber-400'
                      : machine.healthState === 'Post-Maintenance'
                      ? 'text-blue-400'
                      : 'text-emerald-400'
                  }`}
                >
                  ● {machine.healthState}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Model: {machine.model} · Location: {machine.location} · RUL: {machine.rulMetrics.estimatedHoursRemaining}h
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Mobile Quick Jump QR Button */}
            <button
              onClick={() => setModalTab('qr-code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer ${
                modalTab === 'qr-code'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                  : 'bg-cyan-950/80 hover:bg-cyan-900 border-cyan-700/80 text-cyan-300'
              }`}
              title="Generate mobile quick-jump QR code to scan from phone"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mobile QR Code</span>
            </button>

            {/* Export History Log & Health Summary JSON Button */}
            <button
              onClick={handleExportHistoryAndHealthJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold font-mono transition-all"
              title="Export complete history log and health summary as JSON"
            >
              <FileJson className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden md:inline">History JSON</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-colors"
              title="Export raw machine state telemetry JSON"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden lg:inline">Telemetry</span>
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold font-mono transition-colors"
              title="Configure automated hourly exports of machine health logs"
            >
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden lg:inline">Auto-Export</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Sub-Tabs */}
        <div className="flex items-center gap-1.5 px-5 pt-3 border-b border-slate-800 bg-slate-950/60 overflow-x-auto">
          <button
            onClick={() => setModalTab('schematic')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap ${
              modalTab === 'schematic' ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Schematic Mimic</span>
          </button>

          <button
            onClick={() => setModalTab('telemetry')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap ${
              modalTab === 'telemetry' ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Sensor Waveforms</span>
          </button>

          <button
            onClick={() => setModalTab('vibration')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap ${
              modalTab === 'vibration' ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="h-3.5 w-3.5" />
            <span>Vibration FFT</span>
          </button>

          <button
            onClick={() => setModalTab('plc')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap ${
              modalTab === 'plc' ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>PLC I/O</span>
          </button>

          <button
            onClick={() => setModalTab('xai')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap ${
              modalTab === 'xai' ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>XAI Diagnostics</span>
          </button>

          <button
            onClick={() => setModalTab('history')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap ${
              modalTab === 'history' ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>History &amp; Interventions</span>
          </button>

          <button
            onClick={() => setModalTab('calendar')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap ${
              modalTab === 'calendar' ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Maintenance Calendar</span>
          </button>

          {/* Dedicated Tab for Mobile QR Quick Jump */}
          <button
            onClick={() => setModalTab('qr-code')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap ${
              modalTab === 'qr-code'
                ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500'
                : 'text-cyan-400/80 hover:text-cyan-300'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Mobile QR Code</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Predictive Insight Summary Section (AI Heuristic Analysis of History Logs) */}
          {modalTab !== 'qr-code' && (
            <PredictiveInsightSection
              machine={machine}
              onOpenHistoryTab={() => setModalTab('history')}
              onOpenCalendarTab={() => setModalTab('calendar')}
            />
          )}

          {modalTab === 'schematic' && <MachineSchematic machine={machine} />}
          {modalTab === 'telemetry' && <SensorTrends machine={machine} />}
          {modalTab === 'vibration' && <VibrationSpectrumViewer machine={machine} />}
          {modalTab === 'plc' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {machine.plcChannels.map((ch) => (
                <div key={ch.tag} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block">{ch.label}</span>
                    <strong className="text-slate-200">{ch.tag}</strong>
                  </div>
                  <span className={ch.state === 'tripped' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {typeof ch.value === 'boolean' ? (ch.value ? 'OK' : 'TRIP') : `${ch.value} ${ch.unit || ''}`}
                  </span>
                </div>
              ))}
            </div>
          )}
          {modalTab === 'xai' && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs font-mono">
              <p className="text-slate-200 leading-relaxed">{machine.xaiExplanation.summary}</p>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 block">Root Cause:</span>
                <strong className="text-cyan-300">{machine.xaiExplanation.primaryCause}</strong>
              </div>
            </div>
          )}
          {modalTab === 'history' && <MachineHistoryLog machine={machine} />}
          {modalTab === 'calendar' && <MaintenanceCalendar machine={machine} />}

          {/* DEDICATED FEATURE: MOBILE QR QUICK JUMP GENERATOR */}
          {modalTab === 'qr-code' && (
            <div className="space-y-6">
              
              {/* Feature Header Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-blue-950/60 border border-cyan-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-cyan-950 border border-cyan-500/60 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-950/50">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Mobile Device QR Quick Jump</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300">
                        1-Tap Mobile Launch
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">
                      Generate high-resolution QR codes that mobile devices can scan with their native camera to immediately jump to this asset&apos;s live telemetry.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={handleTestQuickJump}
                    className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
                    title="Simulate opening this machine's monitoring view"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Test Jump Link</span>
                  </button>
                </div>
              </div>

              {/* Main 2-Column QR Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Column 1: Live QR Scanner Frame & Quick Actions (5 Cols) */}
                <div className="lg:col-span-5 bg-slate-950/90 rounded-2xl border border-slate-800 p-6 flex flex-col items-center text-center space-y-5 shadow-xl">
                  
                  {/* Visual QR Viewport Frame with Industrial Reticle */}
                  <div className="relative p-5 bg-slate-900/90 rounded-2xl border border-cyan-800/60 shadow-inner flex items-center justify-center w-64 h-64 group">
                    {/* Reticle Corner Accents */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br" />

                    {isGeneratingQR ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                        <span className="text-[11px] font-mono text-cyan-400">Encoding QR...</span>
                      </div>
                    ) : mobileQrDataUrl ? (
                      <img
                        src={mobileQrDataUrl}
                        alt={`QR code for ${machine.name}`}
                        className="w-full h-full object-contain rounded-lg drop-shadow-md"
                      />
                    ) : (
                      <div className="text-xs text-slate-500 font-mono">Generating QR...</div>
                    )}
                  </div>

                  {/* Asset Caption */}
                  <div>
                    <h4 className="font-bold text-sm text-white">{machine.name}</h4>
                    <p className="text-xs font-mono text-cyan-400 mt-0.5">Asset ID: {machine.id}</p>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-slate-400 mt-1">
                      <span>Model: {machine.model}</span>
                      <span>·</span>
                      <span>Serial: {machine.serialNumber || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Direct Link Copy Strip */}
                  <div className="w-full space-y-1.5 text-left">
                    <label className="text-[11px] font-mono text-slate-400 block">
                      Encoded Target Link / Payload:
                    </label>
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl p-1.5">
                      <input
                        type="text"
                        readOnly
                        value={targetJumpUrl}
                        className="bg-transparent text-[11px] font-mono text-slate-200 px-2 flex-1 outline-none truncate"
                      />
                      <button
                        onClick={handleCopyJumpUrl}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1 ${
                          isCopied
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700'
                        }`}
                        title="Copy direct link to clipboard"
                      >
                        {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Export and Print Action Buttons */}
                  <div className="grid grid-cols-2 gap-2.5 w-full pt-2">
                    <button
                      onClick={handleDownloadQR}
                      className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Download PNG</span>
                    </button>

                    <button
                      onClick={handlePrintPhysicalTag}
                      className="py-2.5 px-3 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print Asset Tag</span>
                    </button>
                  </div>

                </div>

                {/* Column 2: Destination Configuration & Technician Scanning Instructions (7 Cols) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* 1. Target Destination Selection */}
                  <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-5 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
                        STEP 1: SELECT MONITORING DESTINATION
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Where mobile scan will land
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {/* Option 1: Deep Dive Console */}
                      <button
                        onClick={() => setQrDestination('deep-dive')}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          qrDestination === 'deep-dive'
                            ? 'bg-cyan-950/70 border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-white flex items-center gap-1.5">
                            <Cpu className="h-4 w-4 text-cyan-400" />
                            <span>Deep-Dive Console</span>
                          </span>
                          {qrDestination === 'deep-dive' && (
                            <span className="h-2 w-2 rounded-full bg-cyan-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          Live multi-sensor telemetry, RUL calculation, stress index, and subsystem health state.
                        </p>
                      </button>

                      {/* Option 2: Vibration FFT */}
                      <button
                        onClick={() => setQrDestination('vibration')}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          qrDestination === 'vibration'
                            ? 'bg-cyan-950/70 border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-white flex items-center gap-1.5">
                            <Gauge className="h-4 w-4 text-blue-400" />
                            <span>Vibration FFT Spectrum</span>
                          </span>
                          {qrDestination === 'vibration' && (
                            <span className="h-2 w-2 rounded-full bg-cyan-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          High-resolution 25.6 kHz vibration spectral analysis with ISO 10816-3 zones.
                        </p>
                      </button>

                      {/* Option 3: Schematic Mimic */}
                      <button
                        onClick={() => setQrDestination('schematic')}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          qrDestination === 'schematic'
                            ? 'bg-cyan-950/70 border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-white flex items-center gap-1.5">
                            <Layers className="h-4 w-4 text-emerald-400" />
                            <span>Schematic Mimic</span>
                          </span>
                          {qrDestination === 'schematic' && (
                            <span className="h-2 w-2 rounded-full bg-cyan-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          Interactive 2D schematic diagram with sub-assembly fault hotspots.
                        </p>
                      </button>

                      {/* Option 4: Live Sensor Trends */}
                      <button
                        onClick={() => setQrDestination('telemetry')}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          qrDestination === 'telemetry'
                            ? 'bg-cyan-950/70 border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-white flex items-center gap-1.5">
                            <Activity className="h-4 w-4 text-amber-400" />
                            <span>Sensor Waveforms</span>
                          </span>
                          {qrDestination === 'telemetry' && (
                            <span className="h-2 w-2 rounded-full bg-cyan-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          Multi-sensor time-series waveforms for temperature, vibration, torque, and speed.
                        </p>
                      </button>

                    </div>
                  </div>

                  {/* 2. Format & Compatibility Selector */}
                  <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-5 space-y-3">
                    <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold block">
                      STEP 2: ENCODING FORMAT
                    </span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      <button
                        onClick={() => setQrPayloadType('mobile-url')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          qrPayloadType === 'mobile-url'
                            ? 'bg-cyan-950/70 border-cyan-500 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>📱 Direct Mobile Web URL</span>
                          {qrPayloadType === 'mobile-url' && <span className="text-emerald-400 font-bold">✓ Active</span>}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1 font-normal">
                          For smartphone camera apps (iOS Safari, Android Chrome). 1-tap open.
                        </span>
                      </button>

                      <button
                        onClick={() => setQrPayloadType('equipment-tag')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          qrPayloadType === 'equipment-tag'
                            ? 'bg-cyan-950/70 border-cyan-500 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>🏷️ PRISM Optical Scanner Tag</span>
                          {qrPayloadType === 'equipment-tag' && <span className="text-emerald-400 font-bold">✓ Active</span>}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1 font-normal">
                          JSON payload for PRISM camera scanner dialog and industrial bar code readers.
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 3. Mobile Scanning Instructions & Field Guide */}
                  <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3 text-xs font-mono text-slate-300">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold">
                      <ShieldCheck className="h-4 w-4" />
                      <span>HOW TO SCAN FROM MOBILE DEVICES</span>
                    </div>

                    <ul className="space-y-2 text-slate-400 list-disc pl-5">
                      <li>
                        <strong className="text-slate-200">Point Camera:</strong> Open the built-in Camera app on iPhone or Android (Google Lens). No external app download required.
                      </li>
                      <li>
                        <strong className="text-slate-200">1-Tap Jump:</strong> Tap the notification link that pops up over the QR code to open the PRISM console directly on this machine.
                      </li>
                      <li>
                        <strong className="text-slate-200">PWA Offline Mode:</strong> If installed on the device home screen, it opens directly into the standalone app without browser chrome.
                      </li>
                      <li>
                        <strong className="text-slate-200">Physical Tag Printing:</strong> Click <span className="text-cyan-400">&quot;Print Asset Tag&quot;</span> to produce weather-resistant equipment tags for motor housings and control panels.
                      </li>
                    </ul>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* Settings & Auto-Export Configuration Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        machines={simulationManager.getAllStates()}
      />
    </div>
  );
};
