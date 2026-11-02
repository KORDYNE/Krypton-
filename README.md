# Krypton - Desarrollado por Kordyne™
### *Open Community Edition*

[![License: KCLA](https://img.shields.io/badge/License-Kordyne%E2%84%A2%20KCLA-cyan.svg)](LICENSE.md)
[![Defensive: Only](https://img.shields.io/badge/Security-Defensive--Only-emerald.svg)](LICENSE.md)
[![Architecture: Zero--Bloat](https://img.shields.io/badge/Philosophy-Zero--Bloatware-blue.svg)](README.md)
[![AI: Gemini--TTS](https://img.shields.io/badge/Audio-Gemini%203.8%20Flash%20TTS-purple.svg)](server.ts)

> **Krypton** es una suite de ciberseguridad defensiva ligera, visualmente impactante y completamente gratuita para la comunidad global, concebida bajo la autoría y el sello oficial de **Kordyne™**. Combina utilidad práctica real, velocidad de ejecución extrema, un motor híbrido de telemetría de privacidad y una estética hacker futurista con terminal integrada y constelación de nodos interactiva.

---

## 🛡️ Características Principales (Core Features)

1. **Constelación Interactiva // Índice de Vulnerabilidad de Privacidad (PVI)**:
   - Motor híbrido que evalúa en tiempo real el comportamiento de red, huella digital de navegador/host (Canvas hash, WebGL hardware vendor, entropía de pantalla), puertos expuestos y fugas de metadatos.
   - Representación visual interactiva en canvas 2D con física de partículas, vectores de datos y cálculo dinámico de PVI (0% a 100%).

2. **Auditoría de Superficie de Ataque y Cifrado Perimetral**:
   - Escaneo rápido defensivo de sockets locales o endpoints específicos con evaluación de latencia y explicaciones técnicas en lenguaje humano (evaluando bases de datos expuestas, SSH, SMB, proxies).
   - Auditor de certificados y cifrado TLS/SSL: inspección de vigencia, días restantes, emisor, suite de cifrado y protocolo TLSv1.3 con calificación (A+, A, B, F).

3. **Detector y Purificador de Fugas de Telemetría & Metadata**:
   - Analizador instantáneo de URLs, payloads, archivos y cabeceras.
   - Detecta parámetros invasivos de rastreo de marketing (`utm_source`, `gclid`, `fbclid`, `msclkid`, `_ga`), firmas de spyware/analíticas y geolocalización GPS en metadatos EXIF.
   - Herramienta de 1-clic para **sanear y purificar payloads** antes de compartirlos públicamente.

4. **Escudo de Privacidad Activo (Modo Centinela)**:
   - Monitoreo en vivo de conexiones salientes sospechosas y balizas de telemetría hacia servidores de analítica no consentida.
   - Clasificación de severidad y bloqueo granular de dominios intrusivos.
   - **Voz Táctica Kordyne con Gemini 3.8 Flash TTS**: Síntesis de alertas y resúmenes de seguridad narrados por voz táctica de IA mediante el modelo oficial `gemini-3.8-flash-tts`.

5. **Reporte Descargable "Kordyne Shield™"**:
   - Generación de informe ejecutivo descargable en formato **Markdown (.md)** e **HTML interactivo autónomo** con estilos embebidos listo para abrir o imprimir en PDF.

6. **Terminal Hacker Táctica Embebida**:
   - CLI integrada en la parte inferior para ejecutar comandos defensivos rápidos (`scan`, `tls`, `clean`, `sentinel`, `pvi`, `help`).

---

## 📂 Arquitectura y Estructura de Archivos

```
krypton/
├── LICENSE.md                     # Kordyne™ Community License Agreement (KCLA)
├── README.md                      # Documentación completa y guía de despliegue
├── krypton.py                     # Aplicación autónoma en Python puro / CLI / FastAPI
├── package.json                   # Dependencias Node.js, Express, React y TypeScript
├── server.ts                      # Backend Express full-stack con Gemini TTS y sockets
├── vite.config.ts                 # Configuración de compilación Vite y Tailwind CSS v4
├── index.html                     # Punto de entrada web con tipografías JetBrains Mono
├── metadata.json                  # Metadatos del applet y capacidades server-side
└── src/
    ├── App.tsx                    # Orquestador principal, Top Bar Contract y layout
    ├── index.css                  # Tailwind CSS v4 con dark variant y estilos cyber HUD
    ├── main.tsx                   # Montaje React 19
    ├── types.ts                   # Definición de interfaces TypeScript
    └── components/
        ├── ConstellationCanvas.tsx    # Canvas 2D interactivo con física de nodos PVI
        ├── AttackSurfaceAuditor.tsx   # Escáner defensivo de puertos y auditor TLS
        ├── MetadataDetector.tsx       # Detector de telemetría y purificador de payloads
        ├── SentinelShield.tsx         # Modo Centinela y síntesis de voz Gemini TTS
        ├── KordyneShieldReportModal.tsx # Generador y descargador de reportes
        ├── CyberTerminal.tsx          # Terminal interactiva de comandos
        └── LicenseModal.tsx           # Visor de la licencia defensiva KCLA
```

---

## 🚀 Instrucciones de Instalación y Ejecución

### Opción 1: Interfaz Web Completa (Full-Stack React + Express + Gemini TTS)

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor interactivo de Krypton (Puerto 3000)
npm run dev
```
Abre tu navegador en `http://localhost:3000` para acceder al panel táctico completo.

### Opción 2: Ejecución Ultrarrápida en Python Puro (1 Comando)

Krypton incluye `krypton.py`, diseñado bajo la filosofía de cero bloatware, capaz de ejecutarse con la librería estándar de Python sin requerir instalación previa de paquetes pesados:

```bash
# Diagnóstico perimetral rápido de localhost
python3 krypton.py

# Auditar superficie de un host o IP
python3 krypton.py --scan 127.0.0.1

# Auditar cifrado TLS/SSL de un dominio
python3 krypton.py --tls google.com

# Inspeccionar archivo o payload en busca de telemetría
python3 krypton.py --inspect payload.txt

# Iniciar el micro-servidor web local (FastAPI o nativo)
python3 krypton.py --serve --port 8000
```

---

## ⚖️ Kordyne™ Community License Agreement (KCLA)

Este software está protegido bajo la **Licencia de la Comunidad Kordyne™ (KCLA)**:
- **Cláusula Exclusivamente Defensiva**: Queda estrictamente prohibido el uso de este software para fines ofensivos, ataques no autorizados, escaneos masivos maliciosos o actividades ciberdelictivas.
- **Prohibición de Comercialización SaaS Maliciosa**: No se permite comercializar acceso al software como servicio de explotación de perímetros ajenos.
- **Integridad de Sello y Créditos**: Toda copia debe conservar íntegro el crédito oficial *"Krypton - Desarrollado por Kordyne™ - Open Community Edition"*.

Para consultar el texto legal completo, revise [LICENSE.md](LICENSE.md) o abra el botón de Licencia dentro de la aplicación.

---

*Desarrollado con orgullo para la comunidad de ciberseguridad defensiva por Kordyne™.*
