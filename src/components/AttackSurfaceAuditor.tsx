import React, { useState } from 'react';
import { AttackSurfaceResponse, SSLAuditResponse, PortScanResult } from '../types';
import { Shield, Lock, Globe, Server, CheckCircle2, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';

interface AttackSurfaceAuditorProps {
  onScanComplete?: (data: AttackSurfaceResponse) => void;
  onTLSComplete?: (data: SSLAuditResponse) => void;
}

export const AttackSurfaceAuditor: React.FC<AttackSurfaceAuditorProps> = ({
  onScanComplete,
  onTLSComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'ports' | 'ssl'>('ports');
  const [targetHost, setTargetHost] = useState('127.0.0.1');
  const [sslHost, setSslHost] = useState('kordyne.com');
  const [isScanning, setIsScanning] = useState(false);
  const [isAuditingSSL, setIsAuditingSSL] = useState(false);
  const [scanResult, setScanResult] = useState<AttackSurfaceResponse | null>(null);
  const [sslResult, setSslResult] = useState<SSLAuditResponse | null>(null);
  const [scanProfile, setScanProfile] = useState<'defensive' | 'database' | 'full'>('defensive');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getPortsForProfile = () => {
    switch (scanProfile) {
      case 'database':
        return [3306, 5432, 6379, 27017, 9200];
      case 'full':
        return [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3000, 3306, 5432, 6379, 8000, 8080, 8443, 27017];
      case 'defensive':
      default:
        return [21, 22, 80, 443, 3000, 3306, 5432, 6379, 8000, 8080];
    }
  };

  const handleRunPortScan = async () => {
    setIsScanning(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/audit/port-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: targetHost,
          ports: getPortsForProfile(),
        }),
      });
      const data: AttackSurfaceResponse = await res.json();
      setScanResult(data);
      if (onScanComplete) onScanComplete(data);
    } catch (err: any) {
      setErrorMessage('Error al realizar escaneo de superficie: ' + (err.message || 'Error de red'));
    } finally {
      setIsScanning(false);
    }
  };

  const handleRunSSLAudit = async () => {
    setIsAuditingSSL(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/audit/ssl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: sslHost }),
      });
      const data: SSLAuditResponse = await res.json();
      setSslResult(data);
      if (onTLSComplete) onTLSComplete(data);
    } catch (err: any) {
      setErrorMessage('Error al auditar certificado TLS: ' + (err.message || 'Error de conexión'));
    } finally {
      setIsAuditingSSL(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            Auditoría de Superficie de Ataque y Cifrado Perimetral
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Evaluación defensiva no invasiva de puertos locales/remotos y validación de certificados TLS/SSL.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab('ports')}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
              activeTab === 'ports'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Escáner de Puertos
          </button>
          <button
            onClick={() => setActiveTab('ssl')}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
              activeTab === 'ssl'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Auditoría Cifrado TLS/SSL
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Mode 1: Port Scanner */}
      {activeTab === 'ports' && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono">HOST:</span>
              <input
                type="text"
                value={targetHost}
                onChange={(e) => setTargetHost(e.target.value)}
                placeholder="127.0.0.1 o nombre de host"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-16 pr-4 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1">
              {(['defensive', 'database', 'full'] as const).map((prof) => (
                <button
                  key={prof}
                  onClick={() => setScanProfile(prof)}
                  className={`px-2.5 py-1 text-xs font-mono rounded capitalize transition-colors ${
                    scanProfile === prof
                      ? 'bg-slate-800 text-cyan-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {prof === 'defensive' ? 'Defensivo' : prof === 'database' ? 'Bases de Datos' : 'Completo'}
                </button>
              ))}
            </div>

            <button
              onClick={handleRunPortScan}
              disabled={isScanning}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Analizando Sockets...' : 'Auditar Superficie'}</span>
            </button>
          </div>

          {/* Results Display */}
          {scanResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">OBJETIVO:</span>
                  <span className="text-cyan-400">{scanResult.target}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">PUERTOS ANALIZADOS:</span>
                  <span className="text-slate-200">{scanResult.portsScanned}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">ABIERTOS:</span>
                  <span className={scanResult.openPortsCount > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                    {scanResult.openPortsCount}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">HALLAZGOS CRÍTICOS:</span>
                  <span className={scanResult.criticalFindings > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {scanResult.criticalFindings}
                  </span>
                </div>
              </div>

              {/* Ports table */}
              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-mono border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">PUERTO</th>
                      <th className="py-2.5 px-4 font-medium">SERVICIO</th>
                      <th className="py-2.5 px-4 font-medium">ESTADO</th>
                      <th className="py-2.5 px-4 font-medium">LATENCIA</th>
                      <th className="py-2.5 px-4 font-medium">RIESGO & EVALUACIÓN HUMANA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {scanResult.results.map((r: PortScanResult) => (
                      <tr key={r.port} className={r.status === 'open' ? 'bg-slate-900/40' : ''}>
                        <td className="py-2.5 px-4 font-semibold text-slate-100">{r.port}</td>
                        <td className="py-2.5 px-4">{r.service}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] ${
                              r.status === 'open'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {r.status === 'open' ? 'EXPUESTO' : 'CERRADO'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 tabular-nums text-slate-400">{r.latencyMs}ms</td>
                        <td className="py-2.5 px-4 font-sans text-xs">
                          {r.status === 'open' ? (
                            <span className="text-amber-200">{r.explanation}</span>
                          ) : (
                            <span className="text-slate-500">Filtrado o inactivo defensivamente.</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: SSL/TLS Inspector */}
      {activeTab === 'ssl' && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono">HOST TLS:</span>
              <input
                type="text"
                value={sslHost}
                onChange={(e) => setSslHost(e.target.value)}
                placeholder="ejemplo.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-22 pr-4 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <button
              onClick={handleRunSSLAudit}
              disabled={isAuditingSSL}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Lock className={`w-3.5 h-3.5 ${isAuditingSSL ? 'animate-spin' : ''}`} />
              <span>{isAuditingSSL ? 'Negociando TLS...' : 'Auditar Cifrado'}</span>
            </button>
          </div>

          {sslResult && (
            <div className="space-y-4">
              {sslResult.hasTLS ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Score & Grade */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        CALIFICACIÓN DE CIFRADO
                      </span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-bold font-mono text-cyan-400">
                          {sslResult.grade}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ({sslResult.healthScore}/100)
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-300">
                      {sslResult.authorized ? (
                        <span className="text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Cadena de CA confiable
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Certificado autofirmado o error
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Validity */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      VIGENCIA DEL CERTIFICADO
                    </span>
                    <div className="mt-2 text-xl font-bold font-mono text-slate-100">
                      {sslResult.daysRemaining} días restantes
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">
                      Expira el: {sslResult.validTo ? new Date(sslResult.validTo).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>

                  {/* Card 3: Protocol & Cipher */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      PROTOCOLO Y SUITE DE CIFRADO
                    </span>
                    <div className="mt-2 text-sm font-bold font-mono text-cyan-300">
                      {sslResult.protocol || 'TLS'}
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-1 truncate" title={sslResult.cipher?.name}>
                      Cipher: {sslResult.cipher?.name || 'N/A'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg">
                  {sslResult.message || 'El host no soporta TLS o no respondió en el puerto especificado.'}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
