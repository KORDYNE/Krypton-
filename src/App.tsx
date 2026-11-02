import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Shield,
  Radio,
  FileSearch,
  Server,
  Download,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Cpu,
  Layers,
  Terminal,
  Scale,
} from 'lucide-react';
import { ConstellationCanvas } from './components/ConstellationCanvas';
import { AttackSurfaceAuditor } from './components/AttackSurfaceAuditor';
import { MetadataDetector } from './components/MetadataDetector';
import { SentinelShield } from './components/SentinelShield';
import { KordyneShieldReportModal } from './components/KordyneShieldReportModal';
import { CyberTerminal } from './components/CyberTerminal';
import { LicenseModal } from './components/LicenseModal';
import {
  AttackSurfaceResponse,
  SSLAuditResponse,
  MetadataInspectResponse,
  ConstellationNode,
  RiskLevel,
} from './types';

export default function App() {
  const [activeSection, setActiveSection] = useState<'constellation' | 'surface' | 'metadata' | 'sentinel'>('constellation');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  // Core Audit States
  const [attackData, setAttackData] = useState<AttackSurfaceResponse | null>(null);
  const [sslData, setSslData] = useState<SSLAuditResponse | null>(null);
  const [metadataData, setMetadataData] = useState<MetadataInspectResponse | null>(null);
  const [blockedThreatsCount, setBlockedThreatsCount] = useState<number>(2);

  // Client-side local browser fingerprinting telemetry
  const [browserFingerprint, setBrowserFingerprint] = useState<{
    canvasHash: string;
    gpuVendor: string;
    screenEntropy: string;
    timezone: string;
  }>({
    canvasHash: '0x7F9B1E4A',
    gpuVendor: 'Desconocido',
    screenEntropy: '24-bit',
    timezone: 'UTC',
  });

  // Collect passive browser fingerprint client-side safely
  useEffect(() => {
    try {
      // 1. Canvas hash
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 40;
      const ctx = canvas.getContext('2d');
      let hash = '0x8A4B2C';
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = "14px 'Arial'";
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('Krypton-Telemetry-Probe', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Krypton-Telemetry-Probe', 4, 17);
        const dataUri = canvas.toDataURL();
        let simpleHash = 0;
        for (let i = 0; i < dataUri.length; i++) {
          simpleHash = (simpleHash << 5) - simpleHash + dataUri.charCodeAt(i);
          simpleHash |= 0;
        }
        hash = '0x' + Math.abs(simpleHash).toString(16).toUpperCase();
      }

      // 2. WebGL vendor
      let gpu = 'Genérica / Virtual';
      const glCanvas = document.createElement('canvas');
      const gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
      if (gl) {
        const dbgRenderInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
        if (dbgRenderInfo) {
          gpu = (gl as any).getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL) || 'Desconocida';
        }
      }

      setBrowserFingerprint({
        canvasHash: hash,
        gpuVendor: gpu,
        screenEntropy: `${window.screen?.colorDepth || 24}bpp (${window.screen?.width}x${window.screen?.height})`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      });
    } catch {
      // Graceful fallback
    }
  }, []);

  // Compute Dynamic Privacy Vulnerability Index (PVI)
  const pviScore = useMemo(() => {
    let score = 15; // Base minimal exposure for being on an active network

    // Port penalty
    if (attackData) {
      score += attackData.openPortsCount * 8;
      score += attackData.criticalFindings * 20;
    } else {
      score += 5;
    }

    // SSL penalty
    if (sslData) {
      if (!sslData.hasTLS) score += 25;
      else if (!sslData.authorized) score += 18;
      else if (sslData.healthScore && sslData.healthScore < 80) score += 12;
    }

    // Metadata penalty
    if (metadataData) {
      score += metadataData.findingsCount * 12;
    }

    // Sentry mitigation
    if (blockedThreatsCount > 0) {
      score = Math.max(5, score - blockedThreatsCount * 4);
    }

    return Math.min(95, Math.max(8, score));
  }, [attackData, sslData, metadataData, blockedThreatsCount]);

  // Construct Dynamic Constellation Nodes
  const constellationNodes: ConstellationNode[] = useMemo(() => {
    const list: ConstellationNode[] = [
      {
        id: 'core-host',
        label: 'Host Local / Krypton Core',
        category: 'core',
        risk: 'low',
        status: 'Activo & Blindado',
        detail: 'Dispositivo local bajo supervisión del motor de ciberseguridad defensiva Krypton.',
        remediation: 'Mantener el sistema operativo actualizado y las políticas de firewall activas.',
        x: 0.5,
        y: 0.5,
        vx: 0,
        vy: 0,
        radius: 18,
      },
      {
        id: 'node-surface',
        label: attackData ? `Superficie (${attackData.openPortsCount} Puertos)` : 'Superficie de Red',
        category: 'network',
        risk: attackData?.criticalFindings ? 'critical' : attackData?.openPortsCount ? 'medium' : 'low',
        status: attackData?.openPortsCount ? `${attackData.openPortsCount} Puertos Abiertos` : 'No auditado',
        detail: attackData ? attackData.summary : 'Se recomienda auditar puertos locales y servicios en segundo plano.',
        remediation: 'Cerrar sockets no utilizados mediante iptables, ufw o desactivando demonios innecesarios.',
        x: 0.25,
        y: 0.32,
        vx: 0,
        vy: 0,
        radius: 12,
      },
      {
        id: 'node-crypto',
        label: sslData ? `Cifrado (${sslData.grade || 'TLS'})` : 'Cifrado TLS/SSL',
        category: 'crypto',
        risk: sslData?.authorized ? 'low' : sslData?.hasTLS ? 'medium' : 'high',
        status: sslData?.hasTLS ? `Grado ${sslData.grade}` : 'Pendiente',
        detail: sslData ? `Protocolo: ${sslData.protocol || 'N/A'}. Cipher: ${sslData.cipher?.name || 'N/A'}.` : 'Verifica que tus endpoints usen TLSv1.3 con Perfect Forward Secrecy.',
        remediation: 'Forzar HSTS y renovar certificados Let\'s Encrypt antes de que expiren.',
        x: 0.75,
        y: 0.28,
        vx: 0,
        vy: 0,
        radius: 11,
      },
      {
        id: 'node-metadata',
        label: metadataData ? `Metadata (${metadataData.findingsCount} Fugas)` : 'Higiene de Metadata',
        category: 'metadata',
        risk: metadataData?.findingsCount ? (metadataData.cleanScore < 50 ? 'critical' : 'medium') : 'low',
        status: metadataData ? `${metadataData.findingsCount} Fugas Detectadas` : 'Limpio',
        detail: metadataData ? `Puntaje de higiene: ${metadataData.cleanScore}%. Se detectaron firmas de telemetría.` : 'Inspecciona archivos antes de compartirlos para prevenir fugas de geolocalización EXIF o parámetros UTM.',
        remediation: 'Utilizar el módulo purificador de Krypton para sanear parámetros antes de transmitir archivos.',
        x: 0.28,
        y: 0.72,
        vx: 0,
        vy: 0,
        radius: 12,
      },
      {
        id: 'node-sentinel',
        label: `Centinela (${blockedThreatsCount} Bloqueados)`,
        category: 'telemetry',
        risk: blockedThreatsCount > 4 ? 'high' : 'low',
        status: `${blockedThreatsCount} Neutralizados`,
        detail: 'Escudo activo monitoreando sockets y deteniendo peticiones a servidores de telemetría espía.',
        remediation: 'Mantener bloqueadas las firmas de telemetría de ByteDance, Meta Graph y Google Analytics.',
        x: 0.72,
        y: 0.74,
        vx: 0,
        vy: 0,
        radius: 13,
      },
      {
        id: 'node-fingerprint',
        label: 'Huella de Navegador / Host',
        category: 'fingerprint',
        risk: 'medium',
        status: `Canvas: ${browserFingerprint.canvasHash.slice(0, 8)}`,
        detail: `GPU: ${browserFingerprint.gpuVendor}. Resolución: ${browserFingerprint.screenEntropy}. Timezone: ${browserFingerprint.timezone}.`,
        remediation: 'Utilizar navegadores con protección anti-fingerprinting (e.g. Brave, Mullvad o Firefox con resistFingerprinting activado).',
        x: 0.5,
        y: 0.18,
        vx: 0,
        vy: 0,
        radius: 10,
      },
    ];

    return list;
  }, [attackData, sslData, metadataData, blockedThreatsCount, browserFingerprint]);

  const scrollToSection = (id: 'constellation' | 'surface' | 'metadata' | 'sentinel') => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col bg-grid-pattern selection:bg-cyan-500/30 selection:text-cyan-200 pb-20">
      {/* 1. TOP BAR CONTRACT */}
      {/* Zone 1: Single element wordmark | Zone 2: 4 single-line links | Zone 3: 1 primary action */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
          <Shield className="w-5 h-5 text-cyan-400" />
          <span className="text-base font-bold tracking-tight text-slate-100 font-mono">
            Krypton <span className="text-cyan-400 text-xs font-normal">by Kordyne™</span>
          </span>
        </div>

        {/* Zone 2: 4 Clean Single-Line Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-slate-400">
          <button
            onClick={() => scrollToSection('constellation')}
            className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'constellation' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Constelación PVI
          </button>
          <button
            onClick={() => scrollToSection('surface')}
            className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'surface' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Superficie de Red
          </button>
          <button
            onClick={() => scrollToSection('metadata')}
            className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'metadata' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Detector de Metadata
          </button>
          <button
            onClick={() => scrollToSection('sentinel')}
            className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'sentinel' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Modo Centinela
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsReportOpen(true)}
            className="px-4 py-2 text-xs font-semibold font-mono text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Reporte Kordyne Shield</span>
          </button>
        </div>
      </header>

      {/* 2. OFFICIAL WELCOME BANNER (Kordyne™ Open Community Edition) */}
      {showBanner && (
        <div className="mx-6 mt-4 p-4 bg-slate-900/60 border border-cyan-500/30 rounded-xl relative overflow-hidden backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>Krypton - Desarrollado por Kordyne™ - Open Community Edition</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-3xl">
                Cero bloatware · Dependencias mínimas · Ejecución ultrarrápida. Suite defensiva open-source de alto impacto para auditar superficies de red, neutralizar telemetría no consentida y purificar metadatos.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsLicenseOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5 text-cyan-400" />
                <span>Licencia KCLA</span>
              </button>
              <button
                onClick={() => setShowBanner(false)}
                className="text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-8 w-full flex-1">
        {/* SECTION 1: CONSTELLATION ENGINE */}
        <section id="constellation" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                Constelación Interactiva // Índice de Vulnerabilidad de Privacidad
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                <span>Motor Híbrido de Comportamiento</span>
                <span aria-hidden="true">·</span>
                <span>Análisis de Vectores en Tiempo Real</span>
                <span aria-hidden="true">·</span>
                <span>PVI Global: <strong className="text-cyan-400">{pviScore}%</strong></span>
              </div>
            </div>
          </div>

          <ConstellationCanvas
            nodes={constellationNodes}
            pviScore={pviScore}
            onNodeSelect={(node) => {
              if (node.category === 'network') scrollToSection('surface');
              if (node.category === 'crypto') scrollToSection('surface');
              if (node.category === 'metadata') scrollToSection('metadata');
              if (node.category === 'telemetry') scrollToSection('sentinel');
            }}
          />
        </section>

        {/* SECTION 2: ATTACK SURFACE & TLS AUDITOR */}
        <section id="surface">
          <AttackSurfaceAuditor
            onScanComplete={(data) => setAttackData(data)}
            onTLSComplete={(data) => setSslData(data)}
          />
        </section>

        {/* SECTION 3: METADATA & TELEMETRY LEAK DETECTOR */}
        <section id="metadata">
          <MetadataDetector onInspectComplete={(data) => setMetadataData(data)} />
        </section>

        {/* SECTION 4: SENTINEL PRIVACY SHIELD */}
        <section id="sentinel">
          <SentinelShield
            onBlockedThreatCountChange={(count) => setBlockedThreatsCount(count)}
          />
        </section>

        {/* STANDALONE PYTHON RUNNER FOOTER STRIP */}
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <span className="text-slate-200 font-semibold">
                Portabilidad de 1 Comando: Ejecuta Krypton CLI o Micro-Servidor
              </span>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                También puedes correr Krypton en tu terminal local sin interfaz pesada usando <code className="text-cyan-300">python krypton.py --serve</code> o <code className="text-cyan-300">python krypton.py --scan 127.0.0.1</code>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsLicenseOpen(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs transition-colors cursor-pointer"
            >
              Kordyne™ Community License (KCLA)
            </button>
          </div>
        </div>
      </main>

      {/* 4. MODALS & TOOLS */}
      <KordyneShieldReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        pviScore={pviScore}
        attackSurfaceData={attackData}
        sslData={sslData}
        metadataData={metadataData}
        blockedCount={blockedThreatsCount}
      />

      <LicenseModal
        isOpen={isLicenseOpen}
        onClose={() => setIsLicenseOpen(false)}
      />

      {/* 5. INTERACTIVE CYBER TERMINAL */}
      <CyberTerminal
        onOpenReport={() => setIsReportOpen(true)}
        onOpenLicense={() => setIsLicenseOpen(true)}
        pviScore={pviScore}
      />
    </div>
  );
}
