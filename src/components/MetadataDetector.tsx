import React, { useState } from 'react';
import { MetadataInspectResponse, MetadataFinding } from '../types';
import { FileSearch, ShieldCheck, ShieldAlert, Sparkles, Copy, Check, Trash2, ArrowRight } from 'lucide-react';

interface MetadataDetectorProps {
  onInspectComplete?: (data: MetadataInspectResponse) => void;
}

const PRESETS = [
  {
    label: 'Enlace con Trackers UTM & ClickID',
    payload: 'https://security.example.com/docs?ref=email&utm_source=newsletter&utm_medium=marketing&utm_campaign=cyber_awareness&gclid=EAIaIQobChMI12345&fbclid=IwAR3948572019#downloads',
  },
  {
    label: 'Payload con PII & Bearer Token',
    payload: `{\n  "service": "auth-relay",\n  "admin_contact": "sarah.connor@cyberdyne-labs.internal",\n  "client_auth": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzk5OTkiLCJyb2xlIjoiYWRtaW4ifQ.secret_signature_xyz",\n  "telemetry_endpoint": "https://telemetry.analytics.tracker.io/collect"\n}`,
  },
  {
    label: 'Cabecera EXIF con Geolocalización',
    payload: `FILE_HEADER_JPEG\nExif: 0x0110 Make: Canon, Model: EOS R5\nGPSLatitude: 37.7749N\nGPSLongitude: 122.4194W\nSoftware: Adobe Photoshop 2026\nDateTimeOriginal: 2026:10:24 16:30:00`,
  },
];

export const MetadataDetector: React.FC<MetadataDetectorProps> = ({ onInspectComplete }) => {
  const [payloadText, setPayloadText] = useState(PRESETS[0].payload);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [inspectResult, setInspectResult] = useState<MetadataInspectResponse | null>(null);
  const [cleanedOutput, setCleanedOutput] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInspect = async () => {
    if (!payloadText.trim()) return;
    setIsInspecting(true);
    setCleanedOutput(null);
    try {
      const res = await fetch('/api/metadata/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: payloadText }),
      });
      const data: MetadataInspectResponse = await res.json();
      setInspectResult(data);
      if (onInspectComplete) onInspectComplete(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleClean = async () => {
    if (!payloadText.trim()) return;
    setIsCleaning(true);
    try {
      const res = await fetch('/api/metadata/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: payloadText }),
      });
      const data = await res.json();
      setCleanedOutput(data.sanitizedPayload);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCleaning(false);
    }
  };

  const copyToClipboard = () => {
    if (!cleanedOutput) return;
    navigator.clipboard.writeText(cleanedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
      <div className="pb-6 border-b border-slate-800">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <FileSearch className="w-5 h-5 text-cyan-400" />
          Detector y Purificador de Fugas de Telemetría & Metadata
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Detecta parámetros de rastreo ocultos, balizas de telemetría, PII y metadatos EXIF en archivos o textos antes de compartirlos.
        </p>
      </div>

      {/* Preset Buttons */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono text-slate-500 uppercase">Cargar Ejemplo:</span>
        {PRESETS.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => {
              setPayloadText(preset.payload);
              setInspectResult(null);
              setCleanedOutput(null);
            }}
            className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-mono rounded transition-colors"
          >
            {preset.label}
          </button>
        ))}
        {payloadText && (
          <button
            onClick={() => {
              setPayloadText('');
              setInspectResult(null);
              setCleanedOutput(null);
            }}
            className="px-2 py-1 text-slate-500 hover:text-rose-400 text-xs font-mono ml-auto transition-colors"
          >
            Limpiar Campo
          </button>
        )}
      </div>

      {/* Text Area */}
      <div className="mt-3">
        <textarea
          rows={5}
          value={payloadText}
          onChange={(e) => setPayloadText(e.target.value)}
          placeholder="Pega aquí URLs, cabeceras HTTP, fragments de logs, o texto con metadatos sospechosos..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleInspect}
          disabled={isInspecting || !payloadText.trim()}
          className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
        >
          <FileSearch className="w-3.5 h-3.5" />
          <span>{isInspecting ? 'Analizando...' : 'Inspeccionar Telemetría'}</span>
        </button>

        <button
          onClick={handleClean}
          disabled={isCleaning || !payloadText.trim()}
          className="px-5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isCleaning ? 'Sanitizando...' : 'Purificar / Sanear Payload'}</span>
        </button>
      </div>

      {/* Cleaned Output View */}
      {cleanedOutput && (
        <div className="mt-6 p-4 bg-slate-950 border border-cyan-500/30 rounded-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-mono text-cyan-400 font-semibold flex items-center gap-2">
              <Check className="w-3.5 h-3.5" />
              PAYLOAD SANITIZADO (Metadatos y Trackers Eliminados)
            </span>
            <button
              onClick={copyToClipboard}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
            </button>
          </div>
          <pre className="mt-3 text-xs font-mono text-slate-300 whitespace-pre-wrap break-all leading-relaxed bg-slate-900/60 p-3 rounded">
            {cleanedOutput}
          </pre>
        </div>
      )}

      {/* Inspection Findings */}
      {inspectResult && (
        <div className="mt-6 space-y-4">
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">ESTADO DEL PAYLOAD:</span>
              <span
                className={`font-semibold ${
                  inspectResult.status === 'CLEAN'
                    ? 'text-emerald-400'
                    : inspectResult.status === 'WARNING'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {inspectResult.status}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>
                <span className="text-slate-400">HALLAZGOS: </span>
                <span className="text-slate-100 font-bold">{inspectResult.findingsCount}</span>
              </span>
              <span>
                <span className="text-slate-400">PUNTAJE DE PRIVACIDAD: </span>
                <span className="text-cyan-400 font-bold">{inspectResult.cleanScore}%</span>
              </span>
            </div>
          </div>

          {inspectResult.findings.length > 0 ? (
            <div className="space-y-2">
              {inspectResult.findings.map((finding: MetadataFinding, index: number) => (
                <div
                  key={index}
                  className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                          finding.severity === 'high'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : finding.severity === 'medium'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        {finding.severity.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono font-medium text-slate-200">
                        {finding.item}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{finding.description}</p>
                    <p className="text-[11px] text-cyan-400/90 font-mono">
                      Acción: {finding.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Cero rastreadores o metadatos sensibles detectados en este payload. Seguro para compartir.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
