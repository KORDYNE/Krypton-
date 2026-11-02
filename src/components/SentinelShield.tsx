import React, { useState, useEffect, useRef } from 'react';
import { SentinelEvent, RiskLevel } from '../types';
import { Shield, Volume2, VolumeX, Radio, Ban, CheckCircle, AlertTriangle, Play, Pause, RefreshCw } from 'lucide-react';

interface SentinelShieldProps {
  onBlockedThreatCountChange?: (count: number) => void;
}

export const SentinelShield: React.FC<SentinelShieldProps> = ({ onBlockedThreatCountChange }) => {
  const [isActive, setIsActive] = useState(true);
  const [events, setEvents] = useState<SentinelEvent[]>([]);
  const [blockedDomains, setBlockedDomains] = useState<Set<string>>(new Set(['edge.adservice.com', 'telemetry.device-check.net']));
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isSynthesizingTTS, setIsSynthesizingTTS] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [voiceVoiceStatus, setVoiceStatus] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch initial telemetry feed
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchFeed = async () => {
      if (!isActive) return;
      try {
        const res = await fetch('/api/sentinel/feed?limit=12');
        if (res.ok) {
          const data = await res.json();
          // Update event statuses based on blocked domains set
          const updated = (data.activeFeeds || []).map((ev: SentinelEvent) => {
            if (blockedDomains.has(ev.domain)) {
              return { ...ev, status: 'BLOCKED' as const };
            }
            return ev;
          });
          setEvents(updated);
        }
      } catch (err) {
        console.error('Error fetching sentinel feed:', err);
      }
    };

    fetchFeed();
    interval = setInterval(fetchFeed, 6000);

    return () => clearInterval(interval);
  }, [isActive, blockedDomains]);

  // Notify parent of total blocked threats
  useEffect(() => {
    const blockedCount = events.filter((e) => e.status === 'BLOCKED').length;
    if (onBlockedThreatCountChange) {
      onBlockedThreatCountChange(blockedCount);
    }
  }, [events, onBlockedThreatCountChange]);

  const toggleBlockDomain = (domain: string) => {
    setBlockedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });

    setEvents((prev) =>
      prev.map((e) => {
        if (e.domain === domain) {
          return {
            ...e,
            status: !blockedDomains.has(domain) ? 'BLOCKED' : 'ALLOWED',
          };
        }
        return e;
      })
    );
  };

  // Synthesize tactical voice alert with Gemini 3.8 Flash TTS
  const handleTacticalVoiceDebrief = async () => {
    setIsSynthesizingTTS(true);
    setVoiceStatus('Sintetizando informe táctico con Gemini 3.8 Flash TTS...');
    try {
      const blockedCount = events.filter((e) => e.status === 'BLOCKED').length;
      const criticalCount = events.filter((e) => e.risk === 'critical' || e.risk === 'high').length;

      const speechScript = `Atención operador. Modo Centinela Kordyne activo. Se han inspeccionado las conexiones salientes. ${criticalCount} eventos de telemetría de alto riesgo detectados. ${blockedCount} dominios intrusivos bloqueados exitosamente. Perímetro táctico bajo control.`;

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: speechScript,
          voice: 'Fenrir',
        }),
      });

      const data = await res.json();

      if (data.audioBase64) {
        const audioSrc = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        audioRef.current.src = audioSrc;
        setIsPlayingAudio(true);
        setVoiceStatus('Transmitiendo audio táctico de Centinela (Gemini 3.8 Flash TTS)...');
        audioRef.current.onended = () => {
          setIsPlayingAudio(false);
          setVoiceStatus(null);
        };
        await audioRef.current.play();
      } else if (data.fallbackToWebSpeech && 'speechSynthesis' in window) {
        // Smooth browser fallback if API key is not yet set
        setVoiceStatus('Reproduciendo voz táctica mediante síntesis de voz local...');
        const utterance = new SpeechSynthesisUtterance(speechScript);
        utterance.lang = 'es-ES';
        utterance.rate = 1.05;
        utterance.onend = () => {
          setIsPlayingAudio(false);
          setVoiceStatus(null);
        };
        setIsPlayingAudio(true);
        window.speechSynthesis.speak(utterance);
      } else {
        setVoiceStatus(data.error || 'No se pudo reproducir audio.');
        setTimeout(() => setVoiceStatus(null), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setVoiceStatus('Fallo en la síntesis de audio.');
      setTimeout(() => setVoiceStatus(null), 3000);
    } finally {
      setIsSynthesizingTTS(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (filterCategory === 'blocked') return e.status === 'BLOCKED';
    if (filterCategory === 'telemetry') return e.category.toLowerCase().includes('telemetr');
    if (filterCategory === 'social') return e.category.toLowerCase().includes('social');
    if (filterCategory === 'ads') return e.category.toLowerCase().includes('publicitaria');
    return true;
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className={`w-5 h-5 ${isActive ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            <h2 className="text-lg font-bold text-slate-100">
              Escudo de Privacidad Activo // Modo Centinela
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitoreo en tiempo real de sockets y telemetría saliente no consentida hacia servidores de rastreo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tactical TTS briefing button */}
          <button
            onClick={handleTacticalVoiceDebrief}
            disabled={isSynthesizingTTS || isPlayingAudio}
            className="px-4 py-2 bg-slate-950 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs font-mono rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            title="Sintetizar informe de voz con Gemini 3.8 Flash TTS"
          >
            <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'text-cyan-400 animate-bounce' : ''}`} />
            <span>{isSynthesizingTTS ? 'Generando Voz...' : isPlayingAudio ? 'Transmitiendo...' : 'Informe de Voz (Gemini TTS)'}</span>
          </button>

          {/* Toggle Sentry */}
          <button
            onClick={() => setIsActive(!isActive)}
            className={`px-4 py-2 text-xs font-mono rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
              isActive
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isActive ? 'Centinela ACTIVO' : 'Centinela PAUSADO'}</span>
          </button>
        </div>
      </div>

      {voiceVoiceStatus && (
        <div className="mt-4 p-2.5 bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono rounded-lg flex items-center gap-2">
          <Volume2 className="w-4 h-4 shrink-0 animate-pulse" />
          <span>{voiceVoiceStatus}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
          {(['all', 'blocked', 'telemetry', 'social', 'ads'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 font-mono rounded capitalize transition-colors ${
                filterCategory === cat
                  ? 'bg-slate-800 text-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'all'
                ? 'Todas'
                : cat === 'blocked'
                ? 'Bloqueadas'
                : cat === 'telemetry'
                ? 'Telemetría'
                : cat === 'social'
                ? 'Tracking Social'
                : 'Ads / Inyección'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 font-mono text-slate-400">
          <span>{events.length} Flujos Inspeccionados</span>
          <span className="text-slate-600">·</span>
          <span className="text-rose-400 font-semibold">
            {events.filter((e) => e.status === 'BLOCKED').length} Neutralizados
          </span>
        </div>
      </div>

      {/* Telemetry Stream List */}
      <div className="mt-4 border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60 font-mono text-xs">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((ev) => {
              const isBlocked = ev.status === 'BLOCKED';
              return (
                <div
                  key={ev.id}
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isBlocked ? 'bg-rose-950/15' : 'hover:bg-slate-900/30'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isBlocked
                            ? 'bg-rose-500'
                            : ev.risk === 'high'
                            ? 'bg-amber-400'
                            : 'bg-cyan-400'
                        }`}
                      />
                      <span className="font-semibold text-slate-100">{ev.domain}</span>
                      <span className="text-slate-500">({ev.ip}:{ev.port})</span>
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {ev.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans">{ev.reason}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {ev.bytes} bytes
                    </span>
                    <button
                      onClick={() => toggleBlockDomain(ev.domain)}
                      className={`px-3 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isBlocked
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                          : 'bg-slate-800 text-slate-300 hover:text-rose-300 hover:bg-slate-700'
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      <span>{isBlocked ? 'BLOQUEADO' : 'Bloquear'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500">
              No hay eventos en esta categoría de filtro.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
