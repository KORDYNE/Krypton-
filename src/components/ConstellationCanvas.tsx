import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ConstellationNode, RiskLevel } from '../types';
import { Shield, AlertTriangle, CheckCircle, Info, X, Zap } from 'lucide-react';

interface ConstellationCanvasProps {
  nodes: ConstellationNode[];
  onNodeSelect?: (node: ConstellationNode) => void;
  pviScore: number; // 0 to 100
}

export const ConstellationCanvas: React.FC<ConstellationCanvasProps> = ({
  nodes: initialNodes,
  onNodeSelect,
  pviScore,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [nodes, setNodes] = useState<ConstellationNode[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<ConstellationNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<ConstellationNode | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const draggingNodeRef = useRef<ConstellationNode | null>(null);

  // Sync with prop updates
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  const getNodeColor = useCallback((risk: RiskLevel) => {
    switch (risk) {
      case 'critical':
        return '#ef4444'; // Red
      case 'high':
        return '#f43f5e'; // Rose
      case 'medium':
        return '#f59e0b'; // Amber
      case 'low':
      default:
        return '#06b6d4'; // Cyan
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      t += 0.02;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Render subtle background grid radar circles
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.save();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.lineWidth = 1;

      // Concentric rings
      [80, 160, 240, 320].forEach((r) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX - 350, centerY);
      ctx.lineTo(centerX + 350, centerY);
      ctx.moveTo(centerX, centerY - 350);
      ctx.lineTo(centerX, centerY + 350);
      ctx.stroke();
      ctx.restore();

      // Render connections between nodes
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];

          // Center connects to all, outer nodes connect if close
          const isCoreConnection = n1.category === 'core' || n2.category === 'core';
          const dx = n1.x * width - n2.x * width;
          const dy = n1.y * height - n2.y * height;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (isCoreConnection || dist < 180) {
            const hasThreat = n1.risk === 'critical' || n1.risk === 'high' || n2.risk === 'critical' || n2.risk === 'high';
            const baseAlpha = isCoreConnection ? 0.25 : Math.max(0.04, 0.2 - dist / 1000);

            ctx.strokeStyle = hasThreat
              ? `rgba(244, 63, 94, ${baseAlpha * 1.5})`
              : `rgba(6, 182, 212, ${baseAlpha})`;

            ctx.beginPath();
            ctx.moveTo(n1.x * width, n1.y * height);
            ctx.lineTo(n2.x * width, n2.y * height);
            ctx.stroke();

            // Draw traveling data packet along line
            const packetPos = (t * 0.8 + (i * 3 + j) * 0.3) % 1;
            const px = n1.x * width + (n2.x * width - n1.x * width) * packetPos;
            const py = n1.y * height + (n2.y * height - n1.y * height) * packetPos;

            ctx.fillStyle = hasThreat ? 'rgba(244, 63, 94, 0.9)' : 'rgba(34, 211, 238, 0.9)';
            ctx.beginPath();
            ctx.arc(px, py, hasThreat ? 2 : 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Render nodes
      nodes.forEach((node) => {
        const nx = node.x * width;
        const ny = node.y * height;
        const color = getNodeColor(node.risk);
        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;

        // Outer glow halo
        ctx.save();
        const glowRadius = isHovered || isSelected ? node.radius * 2.8 : node.radius * 1.8;
        const grad = ctx.createRadialGradient(nx, ny, 2, nx, ny, glowRadius);
        grad.addColorStop(0, color + '66');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(nx, ny, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing ring for high risk
        if (node.risk === 'critical' || node.risk === 'high') {
          const pulse = (Math.sin(t * 4) + 1) * 3;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(nx, ny, node.radius + 4 + pulse, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Inner solid core
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(nx, ny, node.radius + (isHovered ? 2 : 0), 0, Math.PI * 2);
        ctx.fill();

        // Node center pip
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(nx, ny, Math.max(2, node.radius * 0.3), 0, Math.PI * 2);
        ctx.fill();

        // Node label
        ctx.fillStyle = isHovered || isSelected ? '#ffffff' : '#94a3b8';
        ctx.font = `${isHovered ? '600' : '500'} 11px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(node.label, nx, ny + node.radius + 14);

        // Status micro-badge text
        ctx.fillStyle = color;
        ctx.font = "400 9px 'JetBrains Mono', monospace";
        ctx.fillText(node.status.toUpperCase(), nx, ny + node.radius + 25);

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [nodes, hoveredNode, selectedNode, getNodeColor]);

  // Handle canvas mouse interactions
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Check hit test
    const hit = nodes.find((node) => {
      const nx = node.x * rect.width;
      const ny = node.y * rect.height;
      const dist = Math.hypot(x - nx, y - ny);
      return dist <= node.radius + 8;
    });

    setHoveredNode(hit || null);

    // If dragging
    if (draggingNodeRef.current) {
      const target = draggingNodeRef.current;
      target.x = Math.max(0.08, Math.min(0.92, x / rect.width));
      target.y = Math.max(0.08, Math.min(0.92, y / rect.height));
      setNodes([...nodes]);
    }
  };

  const handleMouseDown = () => {
    if (hoveredNode) {
      draggingNodeRef.current = hoveredNode;
    }
  };

  const handleMouseUp = () => {
    draggingNodeRef.current = null;
  };

  const handleClick = () => {
    if (hoveredNode) {
      setSelectedNode(hoveredNode);
      if (onNodeSelect) onNodeSelect(hoveredNode);
    }
  };

  return (
    <div className="relative w-full h-[540px] bg-slate-950/90 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col">
      {/* Top HUD telemetry bar inside constellation */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/40 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-medium">KRYPTON // CONSTELLATION ENGINE</span>
          <span className="text-slate-600">|</span>
          <span>{nodes.length} Nodos Activos</span>
          <span className="text-slate-600">|</span>
          <span>Física de Vectores en Tiempo Real</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="text-slate-300">Seguro</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="text-slate-300">Precaución</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span className="text-slate-300">Crítico</span>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="relative flex-1 cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setHoveredNode(null);
            draggingNodeRef.current = null;
          }}
          onClick={handleClick}
        />

        {/* Tactical PVI Dial overlay in top-left */}
        <div className="absolute top-4 left-4 p-3.5 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-lg max-w-xs pointer-events-none">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            Índice de Vulnerabilidad de Privacidad (PVI)
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-3xl font-bold font-mono ${
                pviScore > 65
                  ? 'text-rose-400'
                  : pviScore > 35
                  ? 'text-amber-400'
                  : 'text-cyan-400'
              }`}
            >
              {pviScore}%
            </span>
            <span className="text-xs text-slate-400">
              {pviScore > 65
                ? 'Riesgo Crítico'
                : pviScore > 35
                ? 'Superficie Expuesta'
                : 'Perímetro Blindado'}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                pviScore > 65
                  ? 'bg-rose-500'
                  : pviScore > 35
                  ? 'bg-amber-400'
                  : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, pviScore))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Haz clic o arrastra cualquier nodo para inspeccionar los vectores de ataque y ejecutar blindajes defensivos.
          </p>
        </div>

        {/* Selected Node Inspection Drawer */}
        {selectedNode && (
          <div className="absolute right-4 top-4 bottom-4 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-lg p-4 flex flex-col justify-between shadow-2xl z-20">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getNodeColor(selectedNode.risk) }}
                  />
                  <h4 className="font-semibold text-sm text-slate-100">{selectedNode.label}</h4>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 text-slate-400 hover:text-slate-100 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 font-mono text-xs">
                <div>
                  <span className="text-slate-500">CATEGORÍA:</span>
                  <p className="text-slate-200 mt-0.5 uppercase">{selectedNode.category}</p>
                </div>
                <div>
                  <span className="text-slate-500">ESTADO PERIMETRAL:</span>
                  <p
                    className="mt-0.5 font-semibold"
                    style={{ color: getNodeColor(selectedNode.risk) }}
                  >
                    {selectedNode.status}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">DIAGNÓSTICO TÉCNICO:</span>
                  <p className="text-slate-300 mt-1 font-sans text-xs leading-relaxed">
                    {selectedNode.detail}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                Blindaje Kordyne Sugerido:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
                {selectedNode.remediation}
              </p>
              <button
                onClick={() => setSelectedNode(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded transition-colors"
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
