#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
Krypton - Desarrollado por Kordyne™ - Open Community Edition
Copyright (c) 2026 Kordyne™
License: Kordyne™ Community License Agreement (KCLA) - Defensive Only
=============================================================================
"""

import sys
import os
import json
import time
import socket
import ssl
import re
import argparse
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

BANNER = r"""
=============================================================================
  ██╗  ██╗██████╗ ██╗   ██╗██████╗ ████████╗ ██████╗ ███╗   ██╗™
  ██║ ██╔╝██╔══██╗╚██╗ ██╔╝██╔══██╗╚══██╔══╝██╔═══██╗████╗  ██║
  █████╔╝ ██████╔╝ ╚████╔╝ ██████╔╝   ██║   ██║   ██║██╔██╗ ██║
  ██╔═██╗ ██╔══██╗  ╚██╔╝  ██╔═══╝    ██║   ██║   ██║██║╚██╗██║
  ██║  ██╗██║  ██║   ██║   ██║        ██║   ╚██████╔╝██║ ╚████║
  ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝        ╚═╝    ╚═════╝ ╚═╝  ╚═══╝
  Krypton - Desarrollado por Kordyne™ - Open Community Edition
  [Cero Bloatware · Análisis Defensivo · Motor Centinela de Privacidad]
=============================================================================
"""

KNOWN_PORTS = {
    21: ("FTP", "HIGH", "Transmision de credenciales en texto claro sin cifrado perimetral."),
    22: ("SSH", "MEDIUM", "Acceso shell remoto. Verificar autenticacion por llaves y fail2ban."),
    23: ("Telnet", "CRITICAL", "Protocolo inseguro obsoleto sin cifrado de sesion."),
    25: ("SMTP", "MEDIUM", "Servidor de correo. Verificar proteccion open-relay."),
    53: ("DNS", "LOW", "Resolucion de nombres de red local."),
    80: ("HTTP", "MEDIUM", "Trafico web plano. Se sugiere redireccion obligatoria a HTTPS."),
    443: ("HTTPS", "LOW", "Canal web cifrado TLS. Verificar certificados vigentes."),
    445: ("SMB", "CRITICAL", "Servicio Samba/Windows expuesto. Alto vector de vulnerabilidad."),
    3000: ("Dev App / Node", "MEDIUM", "Servidor de desarrollo activo o panel local expuesto."),
    3306: ("MySQL", "CRITICAL", "Base de datos expuesta sin proteccion perimetral."),
    5432: ("PostgreSQL", "CRITICAL", "Motor relacional accesible sin tunel SSH."),
    6379: ("Redis", "CRITICAL", "Cache en memoria sin clave suele permitir ejecucion remota."),
    8000: ("FastAPI / Dev", "MEDIUM", "Servicio API o entorno de desarrollo en ejecucion."),
    8080: ("HTTP-Alt", "MEDIUM", "Proxy o servicio web secundario expuesto."),
    8443: ("HTTPS-Alt", "LOW", "Servicio web seguro en puerto alterno."),
    27017: ("MongoDB", "CRITICAL", "Base de datos NoSQL expuesta sin autenticacion.")
}

class KryptonEngine:
    """Motor central de ciberseguridad defensiva y auditoria de privacidad."""

    @staticmethod
    def probe_port(target: str, port: int, timeout: float = 0.5):
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(timeout)
        start = time.time()
        try:
            res = s.connect_ex((target, port))
            latency = int((time.time() - start) * 1000)
            s.close()
            if res == 0:
                service, risk, exp = KNOWN_PORTS.get(port, ("Custom", "MEDIUM", "Puerto abierto activo."))
                return {
                    "port": port,
                    "service": service,
                    "status": "OPEN",
                    "risk": risk,
                    "explanation": exp,
                    "latency_ms": latency
                }
        except Exception:
            pass
        return None

    @classmethod
    def audit_surface(cls, target: str = "127.0.0.1", ports=None, max_threads: int = 15):
        if ports is None:
            ports = list(KNOWN_PORTS.keys())
        
        target = target.replace("http://", "").replace("https://", "").split("/")[0].split(":")[0]
        results = []
        with ThreadPoolExecutor(max_workers=max_threads) as executor:
            futures = [executor.submit(cls.probe_port, target, p) for p in ports]
            for f in futures:
                r = f.result()
                if r:
                    results.append(r)

        open_count = len(results)
        critical_count = sum(1 for r in results if r["risk"] in ("CRITICAL", "HIGH"))
        return {
            "target": target,
            "timestamp": datetime.now().isoformat(),
            "ports_scanned": len(ports),
            "open_ports": results,
            "open_count": open_count,
            "critical_count": critical_count,
            "summary": "Perimetro asegurado." if open_count == 0 else f"{open_count} puertos detectados ({critical_count} criticos/altos)."
        }

    @staticmethod
    def audit_tls(host: str, port: int = 443, timeout: float = 4.0):
        host = host.replace("http://", "").replace("https://", "").split("/")[0].split(":")[0]
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        try:
            with socket.create_connection((host, port), timeout=timeout) as sock:
                with ctx.wrap_socket(sock, server_hostname=host) as ssock:
                    cert = ssock.getpeercert(binary_form=True)
                    x509 = ssl.DER_cert_to_PEM_cert(cert)
                    cipher = ssock.cipher()
                    version = ssock.version()
                    
                    return {
                        "host": host,
                        "port": port,
                        "tls_version": version,
                        "cipher_suite": cipher[0] if cipher else "Unknown",
                        "cipher_bits": cipher[2] if cipher else 0,
                        "status": "SECURE" if version == "TLSv1.3" else "ACCEPTED",
                        "cert_detected": True,
                        "summary": f"Handshake exitoso con {version} ({cipher[0] if cipher else 'N/A'})."
                    }
        except Exception as e:
            return {
                "host": host,
                "port": port,
                "cert_detected": False,
                "error": str(e),
                "summary": "Fallo al negociar TLS con el host especificado."
            }

    @staticmethod
    def inspect_metadata(payload: str):
        findings = []
        tracking_regex = re.compile(r"[?&](utm_source|utm_medium|utm_campaign|gclid|fbclid|msclkid|ttclid|_ga)=([^&#\s]+)", re.IGNORECASE)
        for m in tracking_regex.finditer(payload):
            findings.append({
                "type": "TRACKER_PARAM",
                "item": m.group(1),
                "severity": "MEDIUM",
                "desc": f"Parametro de telemetria y tracking de clics: {m.group(0)}"
            })

        email_regex = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b")
        for e in set(email_regex.findall(payload)):
            findings.append({
                "type": "PII_LEAK",
                "item": e,
                "severity": "HIGH",
                "desc": "Direccion de correo electronico sin anonimizar."
            })

        if "Exif" in payload or "GPSLatitude" in payload or "CameraModel" in payload:
            findings.append({
                "type": "EXIF_METADATA",
                "item": "Geolocalizacion / Hardware EXIF",
                "severity": "HIGH",
                "desc": "Metadatos fotograficos sensibles incrustados."
            })

        return {
            "findings_count": len(findings),
            "findings": findings,
            "is_clean": len(findings) == 0,
            "privacy_health": max(0, 100 - (len(findings) * 20))
        }

    @staticmethod
    def sanitize(payload: str):
        cleaned = re.sub(r"([?&])(utm_[a-z]+|gclid|fbclid|msclkid|ttclid|_ga)=[^&#\s]*", r"\1", payload, flags=re.IGNORECASE)
        cleaned = re.sub(r"[?&]+(?=[\s\n\"'#]|$)", "", cleaned)
        cleaned = re.sub(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b", "[REDACTED_BY_KORDYNE]", cleaned)
        return cleaned

    @classmethod
    def generate_report_markdown(cls, audit_data, tls_data, meta_data):
        return f"""# Reporte de Auditoria Defensiva - Krypton by Kordyne™
Fecha de Emision: {datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")}
Licencia: Kordyne™ Community License Agreement (KCLA) - Uso Defensivo Exclusivo

## 1. Auditoria de Superficie de Red
- Objetivo: `{audit_data.get('target', 'N/A')}`
- Puertos Abiertos: {audit_data.get('open_count', 0)}
- Nivel de Riesgo Critico: {audit_data.get('critical_count', 0)}
- Diagnostico: {audit_data.get('summary', '')}

### Detalle de Puertos:
| Puerto | Servicio | Estado | Severidad | Explicacion Tecnica |
|--------|----------|--------|-----------|----------------------|
""" + "\n".join([f"| {r['port']} | {r['service']} | {r['status']} | {r['risk']} | {r['explanation']} |" for r in audit_data.get('open_ports', [])]) + f"""

## 2. Analisis de Cifrado y Certificados TLS
- Host: `{tls_data.get('host', 'N/A')}`
- Version TLS: {tls_data.get('tls_version', 'N/A')}
- Cipher Suite: {tls_data.get('cipher_suite', 'N/A')}
- Estado: {tls_data.get('summary', '')}

## 3. Telemetria y Fugas de Metadatos
- Hallazgos de Privacidad: {meta_data.get('findings_count', 0)}
- Indice de Salud de Privacidad: {meta_data.get('privacy_health', 100)}%

---
*Generado automaticamente por Krypton - Open Community Edition bajo el sello de Kordyne™.*
"""

def run_cli():
    print(BANNER)
    parser = argparse.ArgumentParser(description="Krypton by Kordyne™ - Open Community Edition")
    parser.add_argument("--scan", help="Escanear superficie de ataque de host/IP (ej: 127.0.0.1)", default=None)
    parser.add_argument("--tls", help="Auditar cifrado TLS/SSL de un dominio (ej: google.com)", default=None)
    parser.add_argument("--inspect", help="Inspeccionar archivo o texto en busca de telemetria/metadatos", default=None)
    parser.add_argument("--serve", action="store_true", help="Iniciar servidor web local de Krypton")
    parser.add_argument("--port", type=int, default=8000, help="Puerto del servidor local (defecto: 8000)")
    args = parser.parse_args()

    engine = KryptonEngine()

    if args.serve:
        start_web_server(args.port)
        return

    if args.scan:
        print(f"[*] Iniciando auditoria de superficie en {args.scan}...")
        res = engine.audit_surface(args.scan)
        print(f"[+] Escaneo completado: {res['summary']}")
        for p in res["open_ports"]:
            print(f"    - Puerto {p['port']} ({p['service']}) [{p['risk']}]: {p['explanation']}")
        return

    if args.tls:
        print(f"[*] Auditando conexion segura TLS para {args.tls}...")
        res = engine.audit_tls(args.tls)
        print(f"[+] Diagnostico: {res['summary']}")
        return

    if args.inspect:
        if os.path.exists(args.inspect):
            with open(args.inspect, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        else:
            content = args.inspect
        res = engine.inspect_metadata(content)
        print(f"[+] Hallazgos: {res['findings_count']} | Salud de Privacidad: {res['privacy_health']}%")
        for f in res["findings"]:
            print(f"    - [{f['severity']}] {f['item']}: {f['desc']}")
        return

    # Si se ejecuta sin argumentos, corre una auditoria rapida de localhost
    print("[*] Ejecutando diagnostico perimetral rapido de localhost...")
    audit = engine.audit_surface("127.0.0.1")
    print(f"[+] Superficie local: {audit['summary']}")
    for p in audit["open_ports"]:
        print(f"    - Puerto {p['port']} ({p['service']}): {p['explanation']}")
    print("\n[i] Para abrir la interfaz web integrada ejecuta: python krypton.py --serve")
    print("[i] Para auditar un host externo ejecuta: python krypton.py --scan <host>")

def start_web_server(port=8000):
    try:
        from fastapi import FastAPI
        import uvicorn
        api = FastAPI(title="Krypton by Kordyne™")

        @api.get("/")
        def index():
            return {"status": "ONLINE", "suite": "Krypton by Kordyne™", "license": "KCLA Defensive-Only", "engine": "FastAPI"}

        @api.post("/api/audit")
        def audit_endpoint(data: dict):
            target = data.get("target", "127.0.0.1")
            return KryptonEngine.audit_surface(target)

        print(f"[*] Levantando API FastAPI en http://0.0.0.0:{port}...")
        uvicorn.run(api, host="0.0.0.0", port=port)
    except ImportError:
        import http.server
        import socketserver
        print(f"[*] FastAPI no instalado en el entorno. Iniciando servidor HTTP nativo ultra-ligero en http://0.0.0.0:{port}...")
        class Handler(http.server.SimpleHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                res = {"status": "ONLINE", "suite": "Krypton by Kordyne™", "engine": "Native Python Micro-Server"}
                self.wfile.write(json.dumps(res).encode("utf-8"))
        with socketserver.TCPServer(("0.0.0.0", port), Handler) as httpd:
            httpd.serve_forever()

if __name__ == "__main__":
    run_cli()
