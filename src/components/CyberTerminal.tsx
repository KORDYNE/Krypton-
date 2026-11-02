import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, ChevronDown, ChevronUp, CornerDownLeft } from 'lucide-react';

interface CyberTerminalProps {
  onOpenReport: () => void;
  onOpenLicense: () => void;
  pviScore: number;
}

export const CyberTerminal: React.FC<CyberTerminalProps> = ({
  onOpenReport,
  onOpenLicense,
  pviScore,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<Array<{ type: 'input' | 'output' | 'error'; text: string }>>([
    { type: 'output', text: 'Krypton Core v1.0.0 [Kordyne™ Open Community Edition]' },
    { type: 'output', text: 'Escribe "help" para ver los comandos defensivos disponibles.' },
  ]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isOpen]);

  const handleCommand = async (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    setHistory((prev) => [...prev, { type: 'input', text: trimmed }]);
    setInputVal('');

    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    switch (cmd) {
      case 'help':
        setHistory((prev) => [
          ...prev,
          {
            type: 'output',
            text: `Comandos disponibles en Krypton Shell:
  help              - Muestra esta lista de comandos.
  scan <host>       - Audita puertos en el host (ej: scan 127.0.0.1).
  tls <host>        - Evalúa el cifrado TLS/SSL del dominio (ej: tls google.com).
  pvi               - Consulta el Índice de Vulnerabilidad de Privacidad actual.
  sentinel          - Estado del Escudo Centinela de conexiones salientes.
  clean <payload>   - Purifica parámetros de telemetría y metadatos.
  report            - Abre el generador del reporte Kordyne Shield.
  license           - Consulta los términos de la Kordyne Community License (KCLA).
  clear             - Limpia la pantalla de la terminal.`,
          },
        ]);
        break;

      case 'clear':
        setHistory([]);
        break;

      case 'pvi':
        setHistory((prev) => [
          ...prev,
          {
            type: 'output',
            text: `[PVI TELEMETRY] Índice de Vulnerabilidad de Privacidad: ${pviScore}% | Estado: ${
              pviScore < 35 ? 'BLINDADO' : pviScore < 65 ? 'SUPERFICIE EXPUESTA' : 'RIESGO CRÍTICO'
            }`,
          },
        ]);
        break;

      case 'scan': {
        const host = arg || '127.0.0.1';
        setHistory((prev) => [
          ...prev,
          { type: 'output', text: `Iniciando escaneo defensivo de superficie en ${host}...` },
        ]);
        try {
          const res = await fetch('/api/audit/port-scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: host }),
          });
          const data = await res.json();
          setHistory((prev) => [
            ...prev,
            {
              type: 'output',
              text: `[SCAN COMPLETADO] ${data.summary}\nPuertos abiertos: ${
                data.results
                  .filter((r: any) => r.status === 'open')
                  .map((r: any) => `${r.port} (${r.service})`)
                  .join(', ') || 'Ninguno detectado.'
              }`,
            },
          ]);
        } catch (e: any) {
          setHistory((prev) => [
            ...prev,
            { type: 'error', text: `Error en escaneo: ${e.message || 'Fallo de red'}` },
          ]);
        }
        break;
      }

      case 'tls': {
        const host = arg || 'kordyne.com';
        setHistory((prev) => [
          ...prev,
          { type: 'output', text: `Auditando TLS para ${host}...` },
        ]);
        try {
          const res = await fetch('/api/audit/ssl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ host }),
          });
          const data = await res.json();
          setHistory((prev) => [
            ...prev,
            {
              type: 'output',
              text: data.hasTLS
                ? `[TLS OK] Grado: ${data.grade} | Protocolo: ${data.protocol} | Días restantes: ${data.daysRemaining} | Cipher: ${data.cipher?.name}`
                : `[TLS ERROR] ${data.message || data.error}`,
            },
          ]);
        } catch (e: any) {
          setHistory((prev) => [
            ...prev,
            { type: 'error', text: `Error al evaluar TLS: ${e.message}` },
          ]);
        }
        break;
      }

      case 'sentinel':
        setHistory((prev) => [
          ...prev,
          {
            type: 'output',
            text: `[SENTINEL SHIELD] Módulo activo en segundo plano. Monitoreando sockets salientes y bloqueando firmas de spyware.`,
          },
        ]);
        break;

      case 'clean':
        if (!arg) {
          setHistory((prev) => [
            ...prev,
            { type: 'error', text: 'Uso: clean <texto con utm o trackers>' },
          ]);
          return;
        }
        try {
          const res = await fetch('/api/metadata/clean', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload: arg }),
          });
          const data = await res.json();
          setHistory((prev) => [
            ...prev,
            { type: 'output', text: `[SANITIZADO]\n${data.sanitizedPayload}` },
          ]);
        } catch (e: any) {
          setHistory((prev) => [...prev, { type: 'error', text: e.message }]);
        }
        break;

      case 'report':
        onOpenReport();
        setHistory((prev) => [
          ...prev,
          { type: 'output', text: 'Generador de reporte Kordyne Shield desplegado en pantalla.' },
        ]);
        break;

      case 'license':
        onOpenLicense();
        setHistory((prev) => [
          ...prev,
          { type: 'output', text: 'Abriendo términos de la Kordyne™ Community License Agreement (KCLA)...' },
        ]);
        break;

      default:
        setHistory((prev) => [
          ...prev,
          {
            type: 'error',
            text: `Comando no reconocido: "${cmd}". Escribe "help" para ver los comandos válidos.`,
          },
        ]);
        break;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 backdrop-blur-md transition-all duration-300">
      {/* Bar toggle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-6 py-2 cursor-pointer hover:bg-slate-900/60 text-xs font-mono select-none"
      >
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-300 font-semibold">TERMINAL TÁCTICA KRYPTON</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">krypton@kordyne-shield:~</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[11px] hidden sm:inline">
            {isOpen ? 'Ocultar Terminal' : 'Desplegar Terminal'}
          </span>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded Terminal Panel */}
      {isOpen && (
        <div className="h-64 flex flex-col p-4 bg-black/90 font-mono text-xs border-t border-slate-800">
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-2">
            {history.map((h, i) => (
              <div key={i} className="leading-relaxed">
                {h.type === 'input' && (
                  <div className="flex items-center gap-2 text-cyan-400">
                    <span className="text-slate-500">krypton@kordyne:~$</span>
                    <span>{h.text}</span>
                  </div>
                )}
                {h.type === 'output' && (
                  <pre className="text-slate-300 whitespace-pre-wrap font-mono pl-4">{h.text}</pre>
                )}
                {h.type === 'error' && (
                  <div className="text-rose-400 pl-4">✗ {h.text}</div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Prompt line */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCommand(inputVal);
            }}
            className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-800/80"
          >
            <span className="text-cyan-400 font-bold shrink-0">krypton@kordyne:~$</span>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Escribe 'help' o un comando defensivo..."
              className="flex-1 bg-transparent text-slate-100 focus:outline-none text-xs font-mono"
              autoFocus
            />
            <button
              type="submit"
              className="text-slate-500 hover:text-cyan-400 transition-colors p-1"
            >
              <CornerDownLeft className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
