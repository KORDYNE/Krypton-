import React, { useState } from 'react';
import { AttackSurfaceResponse, SSLAuditResponse, MetadataInspectResponse } from '../types';
import { Shield, Download, FileText, X, Check, Globe, Code } from 'lucide-react';

interface KordyneShieldReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pviScore: number;
  attackSurfaceData: AttackSurfaceResponse | null;
  sslData: SSLAuditResponse | null;
  metadataData: MetadataInspectResponse | null;
  blockedCount: number;
}

export const KordyneShieldReportModal: React.FC<KordyneShieldReportModalProps> = ({
  isOpen,
  onClose,
  pviScore,
  attackSurfaceData,
  sslData,
  metadataData,
  blockedCount,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const timestamp = new Date().toISOString();
  const humanDate = new Date().toLocaleString();

  // Generate Markdown report string
  const generateMarkdown = () => {
    return `# REPORTE DEFENSIVO KORDYNE SHIELD™
=============================================================================
Krypton by Kordyne™ - Open Community Edition
Fecha de Generación: ${humanDate}
Licencia: Kordyne™ Community License Agreement (KCLA) - Defensive Only
=============================================================================

## RESUMEN EJECUTIVO // PRIVACY VULNERABILITY INDEX (PVI)
- Índice de Vulnerabilidad de Privacidad: ${pviScore}% (${pviScore < 35 ? 'PERÍMETRO BLINDADO' : pviScore < 65 ? 'SUPERFICIE EXPUESTA' : 'RIESGO CRÍTICO'})
- Amenazas de Telemetría Neutralizadas: ${blockedCount}
- Estado General: ${pviScore < 40 ? 'DEFENSAS ÓPTIMAS' : 'REQUIERE REMEDIACIÓN'}

---

## 1. AUDITORÍA DE SUPERFICIE DE RED & PUERTOS
${
  attackSurfaceData
    ? `- Objetivo: \`${attackSurfaceData.target}\`
- Puertos Abiertos: ${attackSurfaceData.openPortsCount} de ${attackSurfaceData.portsScanned}
- Hallazgos Críticos: ${attackSurfaceData.criticalFindings}
- Diagnóstico: ${attackSurfaceData.summary}

### Detalle de Puertos:
| Puerto | Servicio | Estado | Severidad | Explicación Técnica |
|---|---|---|---|---|
${attackSurfaceData.results
  .map(
    (r) =>
      `| ${r.port} | ${r.service} | ${r.status.toUpperCase()} | ${r.risk.toUpperCase()} | ${r.explanation} |`
  )
  .join('\n')}
`
    : '_No se ejecutó escaneo de puertos en esta sesión._'
}

---

## 2. EVALUACIÓN DE CIFRADO Y PROTOCOLO TLS/SSL
${
  sslData
    ? `- Host: \`${sslData.host}\`
- Grado de Seguridad: ${sslData.grade || 'N/A'} (Score: ${sslData.healthScore || 'N/A'}/100)
- Protocolo: ${sslData.protocol || 'N/A'}
- Cipher Suite: ${sslData.cipher?.name || 'N/A'}
- Días Restantes de Certificado: ${sslData.daysRemaining ?? 'N/A'} días
- Validez CA: ${sslData.authorized ? 'Válido y Verificado' : 'Cadena Insegura o Autofirmado'}
`
    : '_No se auditó conexión TLS en esta sesión._'
}

---

## 3. HIGIENE DE METADATOS Y TELEMETRÍA
${
  metadataData
    ? `- Estado del Payload: ${metadataData.status}
- Puntaje de Limpieza: ${metadataData.cleanScore}%
- Fugas Detectadas: ${metadataData.findingsCount}
${
  metadataData.findings.length > 0
    ? metadataData.findings
        .map(
          (f, idx) =>
            `${idx + 1}. [${f.severity.toUpperCase()}] ${f.item}: ${f.description}\n   Acción recomendada: ${f.recommendation}`
        )
        .join('\n')
    : 'No se detectaron firmas de rastreadores ni fuga de metadatos.'
}
`
    : '_No se analizó payload de metadatos en esta sesión._'
}

=============================================================================
Generado automáticamente por Krypton Suite.
Copyright (c) 2026 Kordyne™ - Todos los derechos defensivos reservados.
`;
  };

  // Generate Standalone HTML report
  const generateStandaloneHTML = () => {
    const md = generateMarkdown();
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Kordyne Shield™ - Reporte de Seguridad Defensiva</title>
  <style>
    body {
      background: #090d16;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 40px 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 36px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    h1, h2, h3 { color: #38bdf8; font-family: monospace; }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-family: monospace;
      font-weight: bold;
    }
    .badge-pvi { background: rgba(6, 182, 212, 0.2); color: #22d3ee; border: 1px solid #06b6d4; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-family: monospace;
      font-size: 13px;
    }
    th, td {
      border: 1px solid #334155;
      padding: 10px;
      text-align: left;
    }
    th { background: #1e293b; color: #94a3b8; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #334155;
      font-size: 12px;
      color: #64748b;
      font-family: monospace;
      text-align: center;
    }
    @media print {
      body { background: white; color: black; }
      .container { border: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h1>KORDYNE SHIELD™ // DIAGNÓSTICO</h1>
        <p style="color:#94a3b8; font-size:13px; font-family:monospace;">Krypton Open Community Edition · Fecha: ${humanDate}</p>
      </div>
      <div>
        <span class="badge badge-pvi">PVI: ${pviScore}%</span>
      </div>
    </div>
    <hr style="border-color:#1e293b; margin:24px 0;" />
    <pre style="white-space: pre-wrap; font-family: monospace; font-size: 13px; color: #cbd5e1;">${md.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    <div class="footer">
      Krypton - Desarrollado por Kordyne™ - Open Community Edition · Kordyne™ Community License Agreement (KCLA)
    </div>
  </div>
</body>
</html>`;
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadSuccess(filename);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadMarkdown = () => {
    const content = generateMarkdown();
    downloadFile(content, `Kordyne-Shield-Report-${Date.now()}.md`, 'text/markdown');
  };

  const handleDownloadHTML = () => {
    const content = generateStandaloneHTML();
    downloadFile(content, `Kordyne-Shield-Report-${Date.now()}.html`, 'text/html');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100 font-mono">
              Reporte de Seguridad "Kordyne Shield™"
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {downloadSuccess && (
          <div className="mx-6 mt-4 p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono rounded flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Archivo descargado exitosamente: {downloadSuccess}</span>
          </div>
        )}

        {/* Report Preview */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-xs text-slate-300 bg-slate-950/60 leading-relaxed whitespace-pre-wrap select-text">
          {generateMarkdown()}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] font-mono text-slate-500">
            Sello Oficial Kordyne™ · KCLA Defensive-Only
          </span>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleDownloadMarkdown}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Descargar Markdown (.md)</span>
            </button>
            <button
              onClick={handleDownloadHTML}
              className="flex-1 sm:flex-none px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-semibold font-mono rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar HTML Interactivo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
