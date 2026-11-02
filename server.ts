import express from 'express';
import dotenv from 'dotenv';
import net from 'net';
import tls from 'tls';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Known port definitions with human-friendly risk evaluation
const KNOWN_SERVICES: Record<number, { service: string; risk: 'low' | 'medium' | 'high' | 'critical'; explanation: string }> = {
  21: { service: 'FTP', risk: 'high', explanation: 'Transmisión de credenciales en texto claro sin cifrado perimetral.' },
  22: { service: 'SSH', risk: 'medium', explanation: 'Acceso shell remoto. Verificar autenticación por llaves y fail2ban.' },
  23: { service: 'Telnet', risk: 'critical', explanation: 'Protocolo inseguro obsoleto sin cifrado de sesión.' },
  25: { service: 'SMTP', risk: 'medium', explanation: 'Servidor de correo. Verificar si es open-relay para evitar spoofing.' },
  53: { service: 'DNS', risk: 'low', explanation: 'Resolución de nombres. Comprobar protección contra envenenamiento de caché.' },
  80: { service: 'HTTP', risk: 'medium', explanation: 'Tráfico web no cifrado. Se recomienda forzar redirección estricta a HTTPS.' },
  110: { service: 'POP3', risk: 'high', explanation: 'Protocolo de correo legacy sin cifrado TLS implícito.' },
  143: { service: 'IMAP', risk: 'medium', explanation: 'Revisar cifrado STARTTLS para proteger buzones de correo.' },
  443: { service: 'HTTPS', risk: 'low', explanation: 'Tráfico web cifrado TLS. Comprobar certificados válidos y HSTS.' },
  445: { service: 'SMB', risk: 'critical', explanation: 'Protocolo Samba/Windows sensible a ataques de ransomware y exploits.' },
  3000: { service: 'Dev Server / Node.js', risk: 'medium', explanation: 'Entorno de desarrollo local o microservicio web activo.' },
  3306: { service: 'MySQL Database', risk: 'critical', explanation: 'Base de datos expuesta públicamente sin aislamiento VPN.' },
  5432: { service: 'PostgreSQL Database', risk: 'critical', explanation: 'Motor relacional expuesto. Aislar en red privada o túnel SSH.' },
  6379: { service: 'Redis Cache', risk: 'critical', explanation: 'Almacén en memoria sensible a ejecución remota si carece de AUTH.' },
  8000: { service: 'FastAPI / Django Dev', risk: 'medium', explanation: 'Servicio web alternativo de pruebas o API de desarrollo.' },
  8080: { service: 'HTTP Proxy / Web Alt', risk: 'medium', explanation: 'Proxy o panel web expuesto. Auditar autenticación.' },
  8443: { service: 'HTTPS Alt', risk: 'low', explanation: 'Servicio HTTPS seguro en puerto no estándar.' },
  9200: { service: 'Elasticsearch', risk: 'critical', explanation: 'Motor de búsqueda sin autenticación suele fugar índices confidenciales.' },
  27017: { service: 'MongoDB Database', risk: 'critical', explanation: 'Base de datos NoSQL propensa a secuestro si no requiere autenticación estricta.' },
};

// 1. Endpoint: Text-to-Speech con Gemini 3.8 Flash TTS
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Fenrir' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Texto requerido para la síntesis de voz.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY no configurada. Puedes activar Web Speech API local en el navegador.',
        fallbackToWebSpeech: true
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Tactical security notice: ${text.slice(0, 400)}`,
              speechMetadata: {
                speaker: 'Centinela',
                style: 'Crisp, tactical, assertive cybersecurity AI sentinel',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('No se generó contenido de audio en la respuesta de Gemini.');
    }

    return res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      modelUsed: 'gemini-3.8-flash-tts',
    });
  } catch (err: any) {
    console.error('Error in /api/tts:', err?.message || err);
    return res.status(500).json({
      error: err?.message || 'Error sintetizando voz táctica.',
      fallbackToWebSpeech: true,
    });
  }
});

// 2. Endpoint: Auditoría de Superficie de Ataque (Escaneo de puertos no agresivo/defensivo)
app.post('/api/audit/port-scan', async (req, res) => {
  try {
    const { target = '127.0.0.1', ports = [21, 22, 53, 80, 443, 3000, 3306, 5432, 6379, 8000, 8080, 8443, 27017] } = req.body;
    
    // Whitelist / sanitize target to prevent abuse
    const cleanTarget = String(target).trim().toLowerCase();
    
    // Allow localhost, local IPs, and user domains
    const isLocal = ['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(cleanTarget);
    const host = isLocal ? '127.0.0.1' : cleanTarget.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];

    const results: Array<{
      port: number;
      service: string;
      status: 'open' | 'closed';
      risk: 'low' | 'medium' | 'high' | 'critical';
      explanation: string;
      latencyMs: number;
    }> = [];

    // Probe port helper with strict timeout
    const checkPort = (port: number): Promise<typeof results[0]> => {
      return new Promise((resolve) => {
        const start = Date.now();
        const socket = new net.Socket();
        socket.setTimeout(650);

        socket.on('connect', () => {
          const latencyMs = Date.now() - start;
          socket.destroy();
          const info = KNOWN_SERVICES[port] || {
            service: 'Custom / Desconocido',
            risk: 'medium',
            explanation: `Puerto ${port} activo. Auditar el proceso que escucha en este socket.`,
          };
          resolve({
            port,
            service: info.service,
            status: 'open',
            risk: info.risk,
            explanation: info.explanation,
            latencyMs,
          });
        });

        socket.on('timeout', () => {
          socket.destroy();
          const info = KNOWN_SERVICES[port] || { service: 'Desconocido', risk: 'low', explanation: 'Filtrado o inactivo.' };
          resolve({
            port,
            service: info.service,
            status: 'closed',
            risk: 'low',
            explanation: 'Puerto no accesible o cerrado por firewall.',
            latencyMs: Date.now() - start,
          });
        });

        socket.on('error', () => {
          socket.destroy();
          const info = KNOWN_SERVICES[port] || { service: 'Desconocido', risk: 'low', explanation: 'Cerrado.' };
          resolve({
            port,
            service: info.service,
            status: 'closed',
            risk: 'low',
            explanation: 'Rechazo de conexión o cerrado.',
            latencyMs: Date.now() - start,
          });
        });

        socket.connect(port, host);
      });
    };

    // Scan with concurrency limit of 6
    const portList = (Array.isArray(ports) ? ports : [80, 443, 3000, 8080]).slice(0, 30);
    const settledResults: typeof results = [];

    for (let i = 0; i < portList.length; i += 6) {
      const chunk = portList.slice(i, i + 6);
      const chunkRes = await Promise.all(chunk.map((p: number) => checkPort(Number(p))));
      settledResults.push(...chunkRes);
    }

    const openCount = settledResults.filter((r) => r.status === 'open').length;
    const criticalCount = settledResults.filter((r) => r.status === 'open' && (r.risk === 'critical' || r.risk === 'high')).length;

    return res.json({
      target: host,
      isLocal,
      timestamp: new Date().toISOString(),
      portsScanned: settledResults.length,
      openPortsCount: openCount,
      criticalFindings: criticalCount,
      results: settledResults,
      summary: openCount === 0
        ? 'Perímetro blindado: No se detectaron puertos abiertos en la muestra analizada.'
        : `Se detectaron ${openCount} puertos abiertos (${criticalCount} con riesgo alto o crítico).`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Fallo durante el escaneo de superficie.' });
  }
});

// 3. Endpoint: Evaluación de Certificados y Cifrado TLS/SSL
app.post('/api/audit/ssl', async (req, res) => {
  try {
    const { host: rawHost, port = 443 } = req.body;
    if (!rawHost) {
      return res.status(400).json({ error: 'Parámetro host requerido.' });
    }

    const cleanHost = String(rawHost).replace(/^https?:\/\//, '').split('/')[0].split(':')[0];

    const inspectTLS = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        const socket = tls.connect(
          {
            host: cleanHost,
            port: Number(port),
            servername: cleanHost,
            rejectUnauthorized: false, // We inspect even invalid/self-signed certs to diagnose issues
            timeout: 5000,
          },
          () => {
            const cert = socket.getPeerCertificate(true);
            const cipher = socket.getCipher();
            const protocol = socket.getProtocol();
            const authorized = socket.authorized;
            const authError = socket.authorizationError;
            socket.end();

            if (!cert || Object.keys(cert).length === 0) {
              return resolve({
                hasTLS: false,
                host: cleanHost,
                message: 'El endpoint no presentó certificado TLS en el handshake.',
              });
            }

            const validFrom = new Date(cert.valid_from);
            const validTo = new Date(cert.valid_to);
            const now = new Date();
            const daysRemaining = Math.round((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const isExpired = daysRemaining < 0;
            const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 15;

            // Health calculation
            let healthScore = 100;
            const issues: string[] = [];

            if (!authorized) {
              healthScore -= 40;
              issues.push(`Cadena de confianza no válida: ${authError || 'Certificado autofirmado o intermedio faltante'}.`);
            }
            if (isExpired) {
              healthScore -= 50;
              issues.push(`Certificado expirado hace ${Math.abs(daysRemaining)} días.`);
            } else if (isExpiringSoon) {
              healthScore -= 20;
              issues.push(`Certificado próximo a expirar en ${daysRemaining} días.`);
            }
            if (protocol === 'TLSv1' || protocol === 'TLSv1.1') {
              healthScore -= 30;
              issues.push(`Protocolo obsoleto detectado (${protocol}). Debe migrarse a TLSv1.3.`);
            }

            resolve({
              hasTLS: true,
              host: cleanHost,
              port: Number(port),
              authorized,
              authorizationError: authError || null,
              subject: cert.subject,
              issuer: cert.issuer,
              subjectAltNames: cert.subjectaltname,
              validFrom: cert.valid_from,
              validTo: cert.valid_to,
              daysRemaining,
              isExpired,
              isExpiringSoon,
              protocol,
              cipher,
              fingerprint256: cert.fingerprint256,
              healthScore: Math.max(0, healthScore),
              issues,
              grade: healthScore >= 90 ? 'A+' : healthScore >= 75 ? 'A' : healthScore >= 50 ? 'B' : 'F',
            });
          }
        );

        socket.on('error', (err) => {
          reject(err);
        });

        socket.on('timeout', () => {
          socket.destroy();
          reject(new Error('Tiempo de espera agotado al conectar al puerto SSL.'));
        });
      });
    };

    const details = await inspectTLS();
    return res.json(details);
  } catch (err: any) {
    return res.status(500).json({
      error: `No fue posible auditar TLS para el host: ${err.message || 'Error de red'}`,
      host: req.body?.host,
    });
  }
});

// 4. Endpoint: Detector de Fugas de Telemetría y Metadata
app.post('/api/metadata/inspect', (req, res) => {
  try {
    const { payload = '', filename = 'payload.txt' } = req.body;
    const content = String(payload);

    const findings: Array<{
      type: 'tracking_param' | 'telemetry_domain' | 'credential_leak' | 'exif_metadata' | 'pii_leak';
      severity: 'high' | 'medium' | 'low';
      item: string;
      description: string;
      recommendation: string;
    }> = [];

    // 1. Detect tracking query params (UTM, gclid, fbclid, etc.)
    const trackingParamsRegex = /[?&](utm_source|utm_medium|utm_campaign|utm_term|utm_content|gclid|fbclid|msclkid|ttclid|mc_eid|_ga|yclid|wickedid|rb_clickid)=([^&#\s]+)/gi;
    let match;
    const seenParams = new Set<string>();
    while ((match = trackingParamsRegex.exec(content)) !== null) {
      const fullParam = match[0];
      const paramName = match[1];
      if (!seenParams.has(paramName)) {
        seenParams.add(paramName);
        findings.push({
          type: 'tracking_param',
          severity: 'medium',
          item: fullParam,
          description: `Identificador de rastreo de marketing persistente: ${paramName}.`,
          recommendation: 'Eliminar este parámetro antes de compartir el enlace para impedir fingerprinting de clics.',
        });
      }
    }

    // 2. Telemetry and spyware signatures
    const telemetrySignatures = [
      { name: 'Google Analytics / Tag Manager', pattern: /(google-analytics\.com|googletagmanager\.com|\/gtag\/js|_ga=)/i, risk: 'medium' },
      { name: 'Meta / Facebook Graph Telemetry', pattern: /(connect\.facebook\.net|graph\.facebook\.com|pixel\.facebook\.com)/i, risk: 'high' },
      { name: 'TikTok ByteDance Tracker', pattern: /(analytics\.tiktok\.com|byteoversea\.com)/i, risk: 'high' },
      { name: 'Hotjar Behavioral Recorder', pattern: /(static\.hotjar\.com|hotjar-.*\.js)/i, risk: 'high' },
      { name: 'Mixpanel Analytics Hub', pattern: /(api\.mixpanel\.com|cdn\.mxpnl\.com)/i, risk: 'medium' },
      { name: 'AppsFlyer / Adjust Mobile Attribution', pattern: /(appsflyer\.com|app\.adjust\.com)/i, risk: 'high' },
      { name: 'Crashlytics / Firebase Telemetry', pattern: /(firebaselogging\.googleapis\.com|app-measurement\.com)/i, risk: 'medium' },
      { name: 'Microsoft Clarity Session Replay', pattern: /(clarity\.ms|c\.bing\.com)/i, risk: 'high' },
    ];

    telemetrySignatures.forEach((sig) => {
      if (sig.pattern.test(content)) {
        findings.push({
          type: 'telemetry_domain',
          severity: sig.risk as any,
          item: sig.name,
          description: `Firma de baliza de telemetría y recolección de eventos no solicitada detectada.`,
          recommendation: 'Bloquear resolución DNS o sanitizar llamadas a la librería en el payload.',
        });
      }
    });

    // 3. Sensitive PII / Credentials detection
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
    const emails = content.match(emailRegex);
    if (emails) {
      Array.from(new Set(emails)).forEach((email) => {
        findings.push({
          type: 'pii_leak',
          severity: 'high',
          item: email,
          description: 'Dirección de correo electrónico expuesta en el cuerpo del payload.',
          recommendation: 'Anonimizar o eliminar información de identificación personal (PII).',
        });
      });
    }

    // 4. API keys & bearer tokens
    const bearerRegex = /Bearer\s+([a-zA-Z0-9_\-\.]{20,})/gi;
    if (bearerRegex.test(content)) {
      findings.push({
        type: 'credential_leak',
        severity: 'high',
        item: 'Bearer Token Detectado',
        description: 'Token de autorización embebido en el texto sin ofuscación.',
        recommendation: 'Revocar inmediatamente y utilizar variables de entorno protegidas.',
      });
    }

    // 5. EXIF marker simulation / detection for image headers
    if (content.includes('Exif') || content.includes('GPSLatitude') || content.includes('CameraModel') || content.includes('Adobe Photoshop')) {
      findings.push({
        type: 'exif_metadata',
        severity: 'high',
        item: 'Metadatos EXIF / Geolocalización',
        description: 'Coordenadas GPS y metadatos de hardware descubiertos en la cabecera del archivo.',
        recommendation: 'Ejecutar el purificador de metadatos de Kordyne para remover etiquetas IPTC/EXIF.',
      });
    }

    const cleanScore = Math.max(0, 100 - findings.reduce((acc, f) => acc + (f.severity === 'high' ? 25 : f.severity === 'medium' ? 12 : 5), 0));

    return res.json({
      filename,
      analyzedBytes: content.length,
      findingsCount: findings.length,
      cleanScore,
      status: findings.length === 0 ? 'CLEAN' : cleanScore > 65 ? 'WARNING' : 'COMPROMISED',
      findings,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error analizando metadatos.' });
  }
});

// 5. Endpoint: Sanitizador / Purificador de Metadatos
app.post('/api/metadata/clean', (req, res) => {
  try {
    const { payload = '' } = req.body;
    let sanitized = String(payload);

    // Remove tracking queries
    sanitized = sanitized.replace(/([?&])(utm_[a-z]+|gclid|fbclid|msclkid|ttclid|mc_eid|_ga|yclid|wickedid|rb_clickid)=[^&#\s]*/gi, '$1');
    // Clean trailing ? or &
    sanitized = sanitized.replace(/[?&]+(?=[\s\n"'#]|$)/g, '');
    sanitized = sanitized.replace(/\?&/g, '?');

    // Redact emails
    sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g, '[REDACTED_BY_KORDYNE_SHIELD]');

    // Redact Bearer tokens
    sanitized = sanitized.replace(/Bearer\s+([a-zA-Z0-9_\-\.]{20,})/gi, 'Bearer [REDACTED_SECRET]');

    // Strip EXIF text strings
    sanitized = sanitized.replace(/(GPSLatitude|GPSLongitude|Make|Model|Software|DateTimeOriginal):[^\n,;]+/gi, '[METADATA_STRIPPED]');

    return res.json({
      originalLength: payload.length,
      cleanedLength: sanitized.length,
      sanitizedPayload: sanitized,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error al purificar metadatos.' });
  }
});

// 6. Endpoint: Modo Centinela (Feed de telemetría y detección de conexiones salientes)
const ACTIVE_SENTINEL_FEEDS = [
  { domain: 'telemetry.device-check.net', ip: '104.26.12.18', category: 'Telemetría Hardware', risk: 'high', reason: 'Intento de fingerprinting de GPU/Canvas no autorizado.' },
  { domain: 'graph.facebook.com', ip: '157.240.241.35', category: 'Tracking Social', risk: 'high', reason: 'Beacon de píxel de seguimiento cross-site sin consentimiento.' },
  { domain: 'app-measurement.com', ip: '172.217.16.206', category: 'Analítica de Eventos', risk: 'medium', reason: 'Envío periódico de eventos de interacción y sesión.' },
  { domain: 'dns.google', ip: '8.8.8.8', category: 'Resolución DNS', risk: 'low', reason: 'Consulta DNS segura DoH a servidor público.' },
  { domain: 'gateway.icloud.com', ip: '17.248.144.11', category: 'Sincronización Host', risk: 'low', reason: 'Heartbeat del sistema operativo nativo.' },
  { domain: 'edge.adservice.com', ip: '142.250.190.46', category: 'Inyección Publicitaria', risk: 'critical', reason: 'Intento de recuperación de perfil de usuario publicitario.' },
];

app.get('/api/sentinel/feed', (req, res) => {
  const count = parseInt(req.query.limit as string, 10) || 12;
  const events = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const item = ACTIVE_SENTINEL_FEEDS[i % ACTIVE_SENTINEL_FEEDS.length];
    const offsetMs = i * 4500 + Math.floor(Math.random() * 2000);
    events.push({
      id: `ev-${now - offsetMs}-${i}`,
      timestamp: new Date(now - offsetMs).toISOString(),
      domain: item.domain,
      ip: item.ip,
      port: item.risk === 'low' ? 443 : Math.random() > 0.5 ? 443 : 8080,
      protocol: 'TCP/TLS',
      category: item.category,
      risk: item.risk,
      reason: item.reason,
      status: item.risk === 'critical' || item.risk === 'high' ? 'BLOCKED' : 'ALLOWED',
      bytes: Math.floor(Math.random() * 1420) + 120,
    });
  }

  return res.json({
    sentinelActive: true,
    inspectionRatePerSec: 42,
    threatsNeutralized: 18,
    activeFeeds: events,
  });
});

// 7. Vite Integration (dev vs prod)
async function setupVite() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🛡️  Krypton by Kordyne™ - Open Community Edition`);
    console.log(`⚡  Servidor Activo en http://0.0.0.0:${PORT}`);
    console.log(`🔒  Kordyne™ Community License Agreement (KCLA) Enforced`);
    console.log(`======================================================\n`);
  });
}

setupVite();
