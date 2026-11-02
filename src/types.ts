export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PortScanResult {
  port: number;
  service: string;
  status: 'open' | 'closed';
  risk: RiskLevel;
  explanation: string;
  latencyMs: number;
}

export interface AttackSurfaceResponse {
  target: string;
  isLocal: boolean;
  timestamp: string;
  portsScanned: number;
  openPortsCount: number;
  criticalFindings: number;
  results: PortScanResult[];
  summary: string;
}

export interface SSLAuditResponse {
  hasTLS: boolean;
  host: string;
  port: number;
  authorized?: boolean;
  authorizationError?: string | null;
  subject?: any;
  issuer?: any;
  subjectAltNames?: string;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  protocol?: string;
  cipher?: { name: string; standardName?: string; version?: string };
  fingerprint256?: string;
  healthScore?: number;
  issues?: string[];
  grade?: 'A+' | 'A' | 'B' | 'F';
  error?: string;
  message?: string;
}

export interface MetadataFinding {
  type: 'tracking_param' | 'telemetry_domain' | 'credential_leak' | 'exif_metadata' | 'pii_leak';
  severity: 'high' | 'medium' | 'low';
  item: string;
  description: string;
  recommendation: string;
}

export interface MetadataInspectResponse {
  filename: string;
  analyzedBytes: number;
  findingsCount: number;
  cleanScore: number;
  status: 'CLEAN' | 'WARNING' | 'COMPROMISED';
  findings: MetadataFinding[];
}

export interface SentinelEvent {
  id: string;
  timestamp: string;
  domain: string;
  ip: string;
  port: number;
  protocol: string;
  category: string;
  risk: RiskLevel;
  reason: string;
  status: 'BLOCKED' | 'ALLOWED';
  bytes: number;
}

export interface ConstellationNode {
  id: string;
  label: string;
  category: 'core' | 'network' | 'telemetry' | 'metadata' | 'crypto' | 'fingerprint';
  risk: RiskLevel;
  status: string;
  detail: string;
  remediation: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}
